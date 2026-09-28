/**
 * Notifications ledger repository (Escalation P1) — claim/complete semantics
 * over the UNIQUE dedupe_key.
 *
 * SAFETY MODEL (approved §12): a one-shot notification may be attempted by
 * overlapping cron runs, reruns and retries, and must (a) never send twice
 * after a success, (b) remain retryable after a failure up to a cap, and
 * (c) recover from a crashed in-flight claim. The decision logic is pure
 * (`planClaim`, unit-tested); the SQL applies it atomically:
 *
 *   INSERT ... ON CONFLICT DO NOTHING       -> fresh claim, we own it
 *   UPDATE ... WHERE status='failed'        -> retry takeover (atomic CAS;
 *     OR (status='claimed' AND stale)          row lock serialises rivals)
 *   otherwise                               -> skip (sent/in-flight/capped)
 *
 * The Neon HTTP driver has no interactive transactions; every step here is
 * a single self-consistent statement, so none are needed.
 */

import { and, eq, inArray, lt, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import type { SendResult } from "@/lib/email/resend";

export const MAX_NOTIFICATION_ATTEMPTS = 5;
/** An in-flight claim older than this is treated as crashed and retryable. */
export const STALE_CLAIM_MS = 10 * 60 * 1000;

export type NotificationKind = "ack" | "escalation_1" | "escalation_2" | "digest";

export type ClaimDecision =
  | "insert" // no row yet: claim by inserting
  | "takeover" // failed (or stale in-flight) below the cap: re-claim
  | "skip_sent" // already sent or skipped: never repeat
  | "skip_inflight" // another run owns a fresh claim
  | "skip_capped"; // failed at/over the attempt cap: surface, don't retry

/** Pure claim decision — the whole idempotency contract in one function. */
export function planClaim(
  existing: { status: string; attempts: number; updatedAt: Date } | null,
  now: Date,
  cap = MAX_NOTIFICATION_ATTEMPTS
): ClaimDecision {
  if (!existing) return "insert";
  if (existing.status === "sent" || existing.status === "skipped") return "skip_sent";
  if (existing.attempts >= cap) return "skip_capped";
  if (existing.status === "failed") return "takeover";
  // status === "claimed"
  if (now.getTime() - existing.updatedAt.getTime() > STALE_CLAIM_MS) return "takeover";
  return "skip_inflight";
}

export type Claim = { id: number };

/**
 * Try to claim `dedupeKey` for sending. Returns the claim when THIS caller
 * owns the attempt, or null when the notification must not be sent now.
 */
export async function claimNotification(input: {
  dedupeKey: string;
  leadId: string | null;
  kind: NotificationKind;
  channel: "email" | "sms";
  now?: Date;
}): Promise<Claim | null> {
  const now = input.now ?? new Date();

  // Fresh claim: the unique index arbitrates concurrent inserts.
  const inserted = await db()
    .insert(notifications)
    .values({
      leadId: input.leadId,
      dedupeKey: input.dedupeKey,
      kind: input.kind,
      channel: input.channel,
      status: "claimed",
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({ target: notifications.dedupeKey })
    .returning({ id: notifications.id });
  if (inserted.length > 0) return { id: inserted[0].id };

  // Row exists: attempt an atomic retry-takeover per planClaim's rules.
  // The WHERE clause re-checks state under the row lock, so at most one
  // rival wins and sent rows are never touched.
  const stale = new Date(now.getTime() - STALE_CLAIM_MS);
  const taken = await db()
    .update(notifications)
    .set({ status: "claimed", updatedAt: now })
    .where(
      and(
        eq(notifications.dedupeKey, input.dedupeKey),
        lt(notifications.attempts, MAX_NOTIFICATION_ATTEMPTS),
        or(
          eq(notifications.status, "failed"),
          and(eq(notifications.status, "claimed"), lt(notifications.updatedAt, stale))
        )
      )
    )
    .returning({ id: notifications.id });
  return taken.length > 0 ? { id: taken[0].id } : null;
}

/** Record the outcome of a claimed attempt (always increments attempts). */
export async function completeNotification(claim: Claim, result: SendResult): Promise<void> {
  await db()
    .update(notifications)
    .set({
      status: result.ok ? "sent" : "failed",
      attempts: sql`${notifications.attempts} + 1`,
      providerId: result.ok ? (result.id ?? null) : null,
      errorCode: result.ok ? null : result.error,
      updatedAt: new Date(),
    })
    .where(eq(notifications.id, claim.id));
}

/** Ledger rows for a set of leads (admin observability; codes only). */
export async function notificationsForLeads(leadIds: string[]) {
  if (leadIds.length === 0) return [];
  return db()
    .select()
    .from(notifications)
    .where(inArray(notifications.leadId, leadIds));
}
