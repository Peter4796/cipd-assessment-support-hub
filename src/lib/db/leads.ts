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

import { and, asc, desc, eq, gt, gte, ilike, isNotNull, lt, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  leadAttachments,
  leads,
  leadStatusEvents,
  type LeadAttachmentRow,
  type LeadRow,
  type LeadStatusEventRow,
} from "@/lib/db/schema";
import { attachmentRowsForLead, leadToRow, rowToLead } from "@/lib/db/mappers";
import { urgencyDeadlineRange, type LeadListFilters } from "@/lib/admin/filters";
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
// ─── Admin reads (P2.3) ───

/** Columns the admin list needs — never the full row over the wire. */
export type LeadListItem = {
  id: string;
  createdAt: Date;
  name: string;
  email: string;
  level: string;
  unitCode: string | null;
  supportType: string;
  submissionType: string | null;
  classification: string;
  score: number;
  status: string;
  deadline: string | null;
  country: string | null;
  notifyError: string | null;
  archivedAt: Date | null;
};

export const LEAD_LIST_LIMIT = 100;

/**
 * Filtered, sorted admin list. Filters arrive pre-validated from
 * parseLeadFilters(); user search text is parameterised by Drizzle.
 */
export async function listLeads(
  filters: LeadListFilters,
  today: Date = new Date()
): Promise<LeadListItem[]> {
  const conditions = [];
  if (filters.status) conditions.push(eq(leads.status, filters.status));
  if (filters.classification) conditions.push(eq(leads.classification, filters.classification));
  if (filters.level) conditions.push(eq(leads.level, filters.level));
  if (filters.urgency) {
    const range = urgencyDeadlineRange(filters.urgency, today);
    conditions.push(isNotNull(leads.deadline));
    if (range.before) conditions.push(lt(leads.deadline, range.before));
    if (range.from) conditions.push(gte(leads.deadline, range.from));
    if (range.to) conditions.push(lte(leads.deadline, range.to));
    if (range.after) conditions.push(gt(leads.deadline, range.after));
  }
  if (filters.q) {
    const like = `%${filters.q}%`;
    conditions.push(
      or(
        ilike(leads.id, like),
        ilike(leads.name, like),
        ilike(leads.email, like),
        ilike(leads.unitCode, like)
      )
    );
  }

  return db()
    .select({
      id: leads.id,
      createdAt: leads.createdAt,
      name: leads.name,
      email: leads.email,
      level: leads.level,
      unitCode: leads.unitCode,
      supportType: leads.supportType,
      submissionType: leads.submissionType,
      classification: leads.classification,
      score: leads.score,
      status: leads.status,
      deadline: leads.deadline,
      country: leads.country,
      notifyError: leads.notifyError,
      archivedAt: leads.archivedAt,
    })
    .from(leads)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      ...(filters.sort === "deadline"
        ? [sql`${leads.deadline} asc nulls last`, desc(leads.createdAt)]
        : [desc(leads.createdAt)])
    )
    .limit(LEAD_LIST_LIMIT);
}

/** Status → lead count, for the dashboard pills. */
export async function statusCounts(): Promise<Record<string, number>> {
  const rows = await db()
    .select({ status: leads.status, count: sql<number>`count(*)::int` })
    .from(leads)
    .groupBy(leads.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.count]));
}

export type LeadDetail = {
  /** Raw row — operational fields (notify state, timestamps, quote). */
  row: LeadRow;
  /** Reconstructed domain lead (attachments included). */
  lead: Lead;
  attachments: LeadAttachmentRow[];
  events: LeadStatusEventRow[];
};

export async function getLeadDetail(id: string): Promise<LeadDetail | null> {
  const [row] = await db().select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!row) return null;
  const [attachments, events] = await Promise.all([
    db()
      .select()
      .from(leadAttachments)
      .where(eq(leadAttachments.leadId, id))
      .orderBy(asc(leadAttachments.id)),
    db()
      .select()
      .from(leadStatusEvents)
      .where(eq(leadStatusEvents.leadId, id))
      .orderBy(desc(leadStatusEvents.at), desc(leadStatusEvents.id)),
  ]);
  return { row, lead: rowToLead(row, attachments), attachments, events };
}

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
