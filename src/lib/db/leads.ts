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

import { db } from "@/lib/db/client";
import { leadAttachments, leads, leadStatusEvents } from "@/lib/db/schema";
import { attachmentRowsForLead, leadToRow } from "@/lib/db/mappers";
import type { Lead } from "@/lib/leads/types";

/**
 * Persist a freshly captured lead atomically: lead row + attachment rows +
 * the initial status event. Throws on failure — the caller (/api/leads in
 * P2.2) decides the degradation path; persistence itself never half-commits.
 */
export async function insertLead(lead: Lead): Promise<void> {
  const client = db();
  const row = leadToRow(lead);
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
