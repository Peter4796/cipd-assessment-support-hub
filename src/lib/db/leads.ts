/**
 * Lead repository — the only module that runs queries against the lead
 * tables. API routes and admin pages call these functions; they never build
 * queries themselves. Grows with each P2 phase (P2.2 persistence, P2.3 admin
 * reads, P2.4 operations, P2.5 retention).
 *
 * ATOMICITY: the Neon HTTP driver has no interactive transactions, so
 * multi-statement writes use db().batch(...), which Neon executes as a single
 * transaction — the lead row, its attachment rows and the initial status
 * event either all commit or none do.
 */

import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { leadAttachments, leads, leadStatusEvents } from "@/lib/db/schema";
import { attachmentRowsForLead, leadToRow } from "@/lib/db/mappers";
import type { Lead } from "@/lib/leads/types";
import type { SendResult } from "@/lib/email/resend";

/**
 * Persist a freshly captured lead atomically: lead row + attachment rows +
 * the initial status event. Throws on failure — the caller (/api/leads)
 * decides the degradation path; persistence itself never half-commits.
 */
export async function insertLead(lead: Lead, fingerprint: string): Promise<void> {
  const client = db();
  const row = { ...leadToRow(lead), fingerprint };
  const attachments = attachmentRowsForLead(lead);

  const initialEvent = client.insert(leadStatusEvents).values({
    leadId: lead.id,
    at: row.createdAt,
    fromStatus: null,
    toStatus: row.status ?? "NEW",
  });

  if (attachments.length > 0) {
    await client.batch([
      client.insert(leads).values(row),
      client.insert(leadAttachments).values(attachments),
      initialEvent,
    ]);
  } else {
    await client.batch([client.insert(leads).values(row), initialEvent]);
  }
}

/**
 * Dedup lookup: the id of a lead with the same submission fingerprint
 * captured after `since`, or null. Conservative window handled by caller.
 */
export async function findRecentLeadIdByFingerprint(
  fingerprint: string,
  since: Date
): Promise<string | null> {
  const rows = await db()
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.fingerprint, fingerprint), gte(leads.createdAt, since)))
    .limit(1);
  return rows[0]?.id ?? null;
}

/**
 * Record the outcome of the notification attempt on the lead row. Email is
 * an alert, not the record: failures are stored (for the admin badge and the
 * P2.5 retry job), never propagated as a request failure.
 */
export async function recordNotifyResult(leadId: string, result: SendResult): Promise<void> {
  await db()
    .update(leads)
    .set(
      result.ok
        ? {
            notifiedAt: new Date(),
            notifyError: null,
            notifyAttempts: sql`${leads.notifyAttempts} + 1`,
            updatedAt: new Date(),
          }
        : {
            notifyError: result.error,
            notifyAttempts: sql`${leads.notifyAttempts} + 1`,
            updatedAt: new Date(),
          }
    )
    .where(eq(leads.id, leadId));
}
