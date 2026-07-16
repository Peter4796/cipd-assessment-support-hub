import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { validateLeadInput } from "@/lib/leads/validation";
import { scoreLead } from "@/lib/leads/scoring";
import { notifyLead } from "@/lib/leads/notify";
import { clientKey, rateLimit } from "@/lib/leads/rate-limit";
import { DEDUP_WINDOW_MS, leadFingerprint } from "@/lib/leads/fingerprint";
import { isDbConfigured } from "@/lib/db/client";
import {
  findRecentLeadIdByFingerprint,
  insertLead,
  recordNotifyResult,
} from "@/lib/db/leads";
import type { Lead } from "@/lib/leads/types";

/**
 * POST /api/leads — capture an assessment-support enquiry.
 *
 * ARCHITECTURE (P2.2): the database is the system of record; the Resend
 * notification is an operational alert. Flow:
 *   validate → score → dedup check → INSERT (lead + attachments + status
 *   event, atomic) → notify → record notify outcome → respond.
 *
 * A lead counts as captured when EITHER durable channel holds it:
 *   DB ok + email ok    → 201 (normal)
 *   DB ok + email fail  → 201; notify_error stored on the row (admin badge,
 *                          P2.5 retry). Never roll back a persisted lead.
 *   DB fail + email ok  → 201; the email carries a [NOT PERSISTED] marker
 *                          and is the record for that one lead (P0 contract).
 *   DB fail + email fail→ 5xx; the client falls back to direct channels.
 * With no DATABASE_URL configured the endpoint behaves exactly like P0/P1
 * (email-as-persistence), which keeps the rollout additive.
 *
 * DEDUP (owner decision 10): an identical submission fingerprint within 15
 * minutes returns the ORIGINAL reference with 200 — no duplicate row, no
 * duplicate email. Fingerprints are multi-field; never email alone.
 *
 * Responses (structured JSON, no internals):
 *   201/200 { ok: true, reference }
 *   4xx/5xx { ok: false, error: <code> }
 *
 * The lead score/classification are computed here and included ONLY in the
 * internal email + database — never in the response body.
 */

export const runtime = "nodejs";

function newReference(): string {
  // e.g. CG-7K2M9Q — unambiguous alphabet, 6 chars
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const bytes = randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return `CG-${out}`;
}

export async function POST(request: Request) {
  // Rate limit before doing any work.
  if (!rateLimit(`leads:${clientKey(request.headers)}`).allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const validated = validateLeadInput(body);
  if (!validated.ok) {
    // Honeypot/time-gate hits get a 200 so bots learn nothing; real
    // validation errors get a 400 with a machine-readable code.
    if (validated.error === "rejected" || validated.error === "too_fast") {
      return NextResponse.json({ ok: true, reference: newReference() }, { status: 200 });
    }
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
  }

  const v = validated.value;
  const { score, classification } = scoreLead({
    ...v,
    attachmentCategories: v.attachments.map((a) => a.category),
  });

  const lead: Lead = {
    id: newReference(),
    createdAt: new Date().toISOString(),
    ...v,
    attachments: v.attachments.length > 0 ? v.attachments : undefined,
    score,
    classification,
  };

  const fingerprint = leadFingerprint(v);
  let persisted = false;

  if (isDbConfigured()) {
    // Dedup: same fingerprint captured within the window → original reference.
    try {
      const existingId = await findRecentLeadIdByFingerprint(
        fingerprint,
        new Date(Date.now() - DEDUP_WINDOW_MS)
      );
      if (existingId) {
        console.warn(`[leads] duplicate submission suppressed ref=${existingId}`);
        return NextResponse.json({ ok: true, reference: existingId }, { status: 200 });
      }
    } catch {
      // A failed dedup lookup must never block capture; proceed to insert.
      console.error("[leads] dedup lookup failed");
    }

    try {
      await insertLead(lead, fingerprint);
      persisted = true;
    } catch {
      // Machine code only — never lead content.
      console.error(`[leads] db insert failed ref=${lead.id}`);
    }
  }

  const sent = await notifyLead(lead, { persisted: isDbConfigured() ? persisted : undefined });

  if (persisted) {
    // Never roll back a persisted lead; store the alert outcome on the row.
    try {
      await recordNotifyResult(lead.id, sent);
    } catch {
      console.error(`[leads] notify-state update failed ref=${lead.id}`);
    }
    if (!sent.ok) {
      console.error(`[leads] alert email failed (${sent.error}) ref=${lead.id} — lead persisted`);
    }
    return NextResponse.json({ ok: true, reference: lead.id }, { status: 201 });
  }

  // Not persisted (DB unconfigured or insert failed): the email is the
  // record, exactly the P0/P1 contract.
  if (!sent.ok) {
    console.error(`[leads] capture failed (${sent.error}) ref=${lead.id}`);
    const status = sent.error === "unconfigured" ? 503 : 502;
    return NextResponse.json({ ok: false, error: "delivery_failed" }, { status });
  }

  return NextResponse.json({ ok: true, reference: lead.id }, { status: 201 });
}

export function GET() {
  return NextResponse.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
}
