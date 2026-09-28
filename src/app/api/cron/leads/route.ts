import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db/client";
import { listOperationalLeads, type OperationalLead } from "@/lib/db/leads";
import { claimNotification, completeNotification } from "@/lib/db/notifications";
import {
  DEADLINE_BAND_LABEL,
  deadlineBand,
  digestDedupeKey,
  digestWindowOpen,
  getAutomationCutover,
  getOwnerTimeZone,
  humanizeAge,
  isTouched,
  ownerDateOf,
  planDigest,
  planEscalations,
  type AttentionInput,
  type TouchInput,
} from "@/lib/leads/operations";
import { channelFor } from "@/lib/notify/channels";
import { notifyRecipient } from "@/lib/email/resend";
import {
  digestHtml,
  digestSubject,
  escalationHtml,
  escalationSubject,
  type DigestItemView,
} from "@/lib/email/templates";

/**
 * GET /api/cron/leads — the lead response sweep (Escalation P1).
 *
 * SCHEDULER-INDEPENDENT by design (approved §6): any authenticated caller
 * at any frequency is safe, because every outbound send is arbitrated by
 * the notifications ledger's claim semantics. Duties per invocation:
 *   1. ESCALATIONS: for urgent, untouched, post-cutover leads whose age
 *      passes the planner's thresholds, claim + send escalation emails.
 *   2. DIGEST: once per owner-local day, at/after 08:00 owner time, send
 *      the operational digest — only when it has content.
 *
 * CURRENT SCHEDULING (documented, deliberate): vercel.json invokes this
 * daily at 05:05 UTC = 08:05 Africa/Nairobi (Hobby plan allows daily
 * crons only). That activates the digest fully and gives escalations one
 * daily safety-net pass. TRUE 15-minute escalation cadence stays dormant
 * until the owner either (a) points any scheduler (e.g. a GitHub Actions
 * schedule) at this route with the same Bearer CRON_SECRET, or (b)
 * upgrades Vercel and tightens the vercel.json schedule. No code change
 * is needed for either.
 *
 * AUTOMATION CUTOVER (approved §13): with LEAD_AUTOMATION_CUTOVER unset
 * the escalation sweep sends nothing (fails closed); leads created before
 * the cutover instant are never auto-messaged. The digest is internal
 * visibility and deliberately includes historical leads.
 *
 * AUTH (fails closed, same pattern as the retention cron): requires
 * `Authorization: Bearer ${CRON_SECRET}`. `?dry=1` reports what WOULD
 * happen without claiming or sending anything.
 *
 * Logging: references, counts and machine codes only.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ESCALATION_LOOKBACK_MS = 48 * 60 * 60 * 1000;

function touchOf(lead: OperationalLead): TouchInput {
  return {
    status: lead.row.status,
    contactedAt: lead.row.contactedAt,
    archivedAt: lead.row.archivedAt,
    notesCount: lead.notesCount,
    eventStatuses: lead.eventStatuses,
  };
}

function attentionInputOf(lead: OperationalLead): AttentionInput {
  return {
    id: lead.row.id,
    createdAt: lead.row.createdAt,
    status: lead.row.status,
    classification: lead.row.classification,
    deadline: lead.row.deadline,
    quoteSentAt: lead.row.quoteSentAt,
    touch: touchOf(lead),
    lastEventAt: lead.lastEventAt,
  };
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "cron_unconfigured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, error: "db_unconfigured" }, { status: 503 });
  }

  const dry = new URL(request.url).searchParams.get("dry") === "1";
  const now = new Date();
  const tz = getOwnerTimeZone();
  const cutover = getAutomationCutover();
  const to = notifyRecipient();
  const email = channelFor("email");

  const leads = await listOperationalLeads();

  // ── 1. Escalation sweep ──
  const summary = {
    ok: true,
    dry,
    automation: cutover ? "active" : "disabled_no_cutover",
    scanned: leads.length,
    escalationsPlanned: 0,
    escalationsSent: 0,
    escalationsFailed: 0,
    escalationsSkipped: 0, // ledger said already handled/in-flight/capped
    digest: "not_due" as string,
  };

  const recent = leads.filter(
    (l) => now.getTime() - l.row.createdAt.getTime() <= ESCALATION_LOOKBACK_MS
  );
  for (const lead of recent) {
    const due = planEscalations(
      {
        createdAt: lead.row.createdAt,
        classification: lead.row.classification,
        deadline: lead.row.deadline,
        touch: touchOf(lead),
      },
      now,
      tz,
      cutover
    );
    for (const kind of due) {
      summary.escalationsPlanned += 1;
      if (dry) continue;
      if (!to || !email.configured()) {
        summary.escalationsFailed += 1;
        continue;
      }
      const claim = await claimNotification({
        dedupeKey: `${lead.row.id}:${kind}`,
        leadId: lead.row.id,
        kind,
        channel: "email",
        now,
      });
      if (!claim) {
        summary.escalationsSkipped += 1;
        continue;
      }
      const band = deadlineBand(lead.row.deadline, now, tz);
      const bandLabel =
        band !== "none" && band !== "later" ? DEADLINE_BAND_LABEL[band] : undefined;
      const touched = isTouched(touchOf(lead));
      const view = {
        id: lead.row.id,
        level: lead.row.level,
        unitCode: lead.row.unitCode,
        supportType: lead.row.supportType,
        submissionType: lead.row.submissionType,
        classification: lead.row.classification,
        deadline: lead.row.deadline,
        bandLabel,
        createdAt: lead.row.createdAt,
        stateLabel:
          lead.row.status === "REVIEWING" && !touched
            ? "REVIEWING — no contact recorded"
            : lead.row.status,
        ageLabel: humanizeAge(now.getTime() - lead.row.createdAt.getTime()),
      };
      const sent = await email.send({
        to,
        subject: escalationSubject(kind, view),
        html: escalationHtml(kind, view),
      });
      await completeNotification(claim, sent);
      if (sent.ok) summary.escalationsSent += 1;
      else {
        summary.escalationsFailed += 1;
        console.error(`[cron/leads] escalation failed (${sent.error}) ref=${lead.row.id} kind=${kind}`);
      }
    }
  }

  // ── 2. Daily digest (internal; includes historical leads) ──
  if (!digestWindowOpen(now, tz)) {
    summary.digest = "window_closed";
  } else {
    const sections = planDigest(leads.map(attentionInputOf), now, tz);
    if (!sections) {
      summary.digest = "empty_not_sent";
    } else if (dry) {
      summary.digest = `dry_would_send(${sections.untouched.length}/${sections.deadlines.length}/${sections.staleQuotes.length}/${sections.staleProgress.length})`;
    } else if (!to || !email.configured()) {
      summary.digest = "email_unconfigured";
    } else {
      const claim = await claimNotification({
        dedupeKey: digestDedupeKey(now, tz),
        leadId: null,
        kind: "digest",
        channel: "email",
        now,
      });
      if (!claim) {
        summary.digest = "already_sent_today";
      } else {
        const item = (l: AttentionInput): DigestItemView => {
          const b = deadlineBand(l.deadline, now, tz);
          return {
            id: l.id,
            level: leads.find((x) => x.row.id === l.id)?.row.level ?? "?",
            status: l.status,
            classification: String(l.classification),
            bandLabel: b !== "none" && b !== "later" ? DEADLINE_BAND_LABEL[b] : undefined,
            ageLabel: humanizeAge(now.getTime() - l.createdAt.getTime()),
          };
        };
        const view = {
          dateLabel: ownerDateOf(now, tz),
          untouched: sections.untouched.map(item),
          deadlines: sections.deadlines.map(item),
          staleQuotes: sections.staleQuotes.map(item),
          staleProgress: sections.staleProgress.map(item),
        };
        const sent = await email.send({ to, subject: digestSubject(view), html: digestHtml(view) });
        await completeNotification(claim, sent);
        summary.digest = sent.ok ? "sent" : `failed(${sent.error})`;
        if (!sent.ok) console.error(`[cron/leads] digest failed (${sent.error})`);
      }
    }
  }

  return NextResponse.json(summary);
}
