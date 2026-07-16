import { NextResponse } from "next/server";
import { del, list } from "@vercel/blob";
import { isDbConfigured } from "@/lib/db/client";
import {
  allKnownPathnames,
  listRetentionCandidates,
  listUnnotifiedLeads,
  markAttachmentDeleted,
  recordAttachmentDeleteFailure,
  recordNotifyResult,
} from "@/lib/db/leads";
import { rowToLead } from "@/lib/db/mappers";
import { notifyLead } from "@/lib/leads/notify";
import { attachmentDeletionDue, selectOrphanBlobs } from "@/lib/leads/retention";
import { isBlobConfigured } from "@/lib/leads/uploads";

/**
 * GET /api/cron/retention — the daily maintenance job (P2.5).
 *
 * Invoked by Vercel Cron (vercel.json, daily 03:00 UTC). Three duties:
 *   1. RETENTION: delete private blobs whose leads aged out of the
 *      owner-approved policy (src/lib/leads/retention.ts), then mark the
 *      attachment row. Storage deletion strictly precedes DB marking;
 *      failures increment a retry counter and are retried next run until
 *      the attempt cap, then surfaced instead of retried forever.
 *   2. ORPHANS: delete blobs uploaded 48h+ ago that no lead references
 *      (visitor abandoned the funnel after uploading).
 *   3. ALERT RETRY: re-send recently failed lead notification emails.
 *
 * AUTH (fails closed): requires `Authorization: Bearer ${CRON_SECRET}`.
 * Vercel Cron sends this header automatically when the env var exists.
 * Without CRON_SECRET configured the route refuses to run at all.
 *
 * `?dry=1` reports what WOULD happen (safe metadata only) without deleting
 * or sending anything — used to review legacy uploads before first run.
 *
 * Logging: counts, references and machine codes only — never filenames,
 * client details or URLs.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RUN_CAP = 100;

type BlobLike = { pathname: string; uploadedAt: Date | string };

async function listEnquiryBlobs(): Promise<{ pathname: string; uploadedAt: Date }[]> {
  const out: { pathname: string; uploadedAt: Date }[] = [];
  let cursor: string | undefined;
  // Page cap keeps a pathological store from pinning the function; 10 pages
  // of 1000 comfortably exceeds any realistic volume at this stage.
  for (let page = 0; page < 10; page++) {
    const res = await list({ prefix: "enquiries/", cursor, limit: 1000 });
    for (const b of res.blobs as BlobLike[]) {
      out.push({ pathname: b.pathname, uploadedAt: new Date(b.uploadedAt) });
    }
    if (!res.hasMore || !res.cursor) break;
    cursor = res.cursor;
  }
  return out;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Fail closed: never run half-configured.
    return NextResponse.json({ ok: false, error: "cron_unconfigured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const dry = new URL(request.url).searchParams.get("dry") === "1";
  const now = new Date();
  const summary = {
    dry,
    retention: { due: 0, deleted: 0, failed: 0, skippedAttemptCap: 0 },
    orphans: { found: 0, deleted: 0, failed: 0 },
    notifyRetries: { attempted: 0, delivered: 0 },
    dryRunDetails: [] as Array<Record<string, unknown>>,
  };

  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, error: "db_unconfigured" }, { status: 503 });
  }

  // ── 1. Retention ──
  if (isBlobConfigured()) {
    const candidates = await listRetentionCandidates();
    for (const c of candidates) {
      const verdict = attachmentDeletionDue(c, c, now);
      if (!verdict.due) continue;
      summary.retention.due++;
      if (summary.retention.deleted + summary.retention.failed >= RUN_CAP) continue;
      if (dry) {
        summary.dryRunDetails.push({
          kind: "retention",
          lead: c.leadId,
          attachment: c.attachmentId,
          reason: verdict.reason,
        });
        continue;
      }
      try {
        await del(c.pathname); // idempotent: deleting an absent blob succeeds
        await markAttachmentDeleted(c.attachmentId, verdict.reason);
        summary.retention.deleted++;
      } catch {
        summary.retention.failed++;
        console.error(`[cron/retention] blob delete failed lead=${c.leadId} att=${c.attachmentId}`);
        await recordAttachmentDeleteFailure(c.attachmentId, "blob_delete_failed").catch(() => {
          console.error(`[cron/retention] failure bookkeeping failed att=${c.attachmentId}`);
        });
      }
    }

    // ── 2. Orphan sweep ──
    const [blobs, known] = await Promise.all([listEnquiryBlobs(), allKnownPathnames()]);
    const orphans = selectOrphanBlobs(blobs, known, now);
    summary.orphans.found = orphans.length;
    for (const orphan of orphans.slice(0, RUN_CAP)) {
      if (dry) {
        // Safe metadata only: pathname (owner-facing, already namespaced),
        // upload time. Never file contents.
        summary.dryRunDetails.push({
          kind: "orphan",
          pathname: orphan.pathname,
          uploadedAt: orphan.uploadedAt.toISOString(),
        });
        continue;
      }
      try {
        await del(orphan.pathname);
        summary.orphans.deleted++;
      } catch {
        summary.orphans.failed++;
        console.error("[cron/retention] orphan delete failed");
      }
    }
  }

  // ── 3. Alert email retry ──
  const unnotified = await listUnnotifiedLeads();
  for (const row of unnotified) {
    if (dry) {
      summary.dryRunDetails.push({ kind: "notify_retry", lead: row.id });
      continue;
    }
    summary.notifyRetries.attempted++;
    const sent = await notifyLead(rowToLead(row), { persisted: true });
    await recordNotifyResult(row.id, sent).catch(() => {
      console.error(`[cron/retention] notify bookkeeping failed ref=${row.id}`);
    });
    if (sent.ok) summary.notifyRetries.delivered++;
  }

  console.log(
    `[cron/retention] dry=${dry} retention=${summary.retention.deleted}/${summary.retention.due} orphans=${summary.orphans.deleted}/${summary.orphans.found} notify=${summary.notifyRetries.delivered}/${summary.notifyRetries.attempted}`
  );
  return NextResponse.json({ ok: true, ...summary });
}
