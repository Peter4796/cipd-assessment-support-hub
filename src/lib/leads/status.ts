/**
 * Status transition planning (P2.4) — pure logic, no I/O.
 *
 * Owner-approved model: statuses are flexible admin state, not a hard state
 * machine. An authenticated admin can move a lead anywhere EXCEPT that
 * leaving a terminal status (COMPLETED, LOST) requires an explicit reopen —
 * a deliberate act, still allowed, never accidental. Every change appends a
 * lead_status_events row (handled by the repository).
 *
 * Milestone timestamps stamp on FIRST entry into their status and are never
 * overwritten — the record of when something first happened survives later
 * corrections. `payment_confirmed_at` stamps when IN_PROGRESS is entered
 * from AWAITING_PAYMENT specifically (that transition is what confirms
 * payment in the owner's workflow); `work_started_at` stamps on any first
 * entry into IN_PROGRESS.
 */

import { LEAD_STATUSES, TERMINAL_LEAD_STATUSES, type LeadStatus } from "@/lib/leads/types";

export type StatusTimestamps = {
  contactedAt: Date | null;
  quoteSentAt: Date | null;
  paymentConfirmedAt: Date | null;
  workStartedAt: Date | null;
  deliveredAt: Date | null;
  completedAt: Date | null;
  lostAt: Date | null;
};

export type StatusChangeError =
  | "invalid_status"
  | "same_status"
  | "terminal_requires_reopen";

export type StatusChangeSet = Partial<Record<keyof StatusTimestamps, Date>> & {
  status: LeadStatus;
  lostReason?: string;
};

export type StatusChangePlan =
  | { ok: false; error: StatusChangeError }
  | { ok: true; set: StatusChangeSet };

export function isTerminalStatus(status: string): boolean {
  return (TERMINAL_LEAD_STATUSES as readonly string[]).includes(status);
}

export function planStatusChange(
  current: { status: string } & StatusTimestamps,
  to: string,
  now: Date,
  opts: { reopen?: boolean; lostReason?: string } = {}
): StatusChangePlan {
  if (!(LEAD_STATUSES as readonly string[]).includes(to)) {
    return { ok: false, error: "invalid_status" };
  }
  const target = to as LeadStatus;
  if (current.status === target) return { ok: false, error: "same_status" };
  if (isTerminalStatus(current.status) && !opts.reopen) {
    return { ok: false, error: "terminal_requires_reopen" };
  }

  const set: StatusChangeSet = { status: target };
  const stamp = (field: keyof StatusTimestamps, condition = true) => {
    if (condition && current[field] === null) set[field] = now;
  };

  switch (target) {
    case "CONTACTED":
      stamp("contactedAt");
      break;
    case "QUOTE_SENT":
      stamp("quoteSentAt");
      break;
    case "IN_PROGRESS":
      stamp("paymentConfirmedAt", current.status === "AWAITING_PAYMENT");
      stamp("workStartedAt");
      break;
    case "DELIVERED":
      stamp("deliveredAt");
      break;
    case "COMPLETED":
      stamp("completedAt");
      break;
    case "LOST": {
      stamp("lostAt");
      const reason = opts.lostReason?.trim().slice(0, 300);
      if (reason) set.lostReason = reason;
      break;
    }
  }

  return { ok: true, set };
}
