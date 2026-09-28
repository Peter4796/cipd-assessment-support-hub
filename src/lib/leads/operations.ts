/**
 * Operational urgency planner (Escalation P1) — pure logic, no I/O, the
 * single definition of "untouched", deadline urgency, escalation timing,
 * attention scoring and digest membership. Everything time-sensitive takes
 * `now` (and where relevant the owner timezone) as parameters so tests run
 * on frozen clocks.
 *
 * OWNER TIMEZONE: deadline is a DATE-ONLY column; all day boundaries use
 * the owner's operational timezone (OWNER_TIMEZONE, default Africa/Nairobi).
 * We never pretend hour-level deadline precision exists.
 *
 * CUTOVER (approved §13): automated outbound notifications (ack,
 * escalations) apply only to leads created at/after LEAD_AUTOMATION_CUTOVER.
 * No cutover configured -> automation is OFF (fails closed). Historical
 * leads still appear in Needs Attention and the digest: visibility without
 * confusing late messages.
 */

import { isTerminalStatus } from "@/lib/leads/status";
import type { LeadClassification } from "@/lib/leads/types";

// ── Owner timezone (centralised; nothing else reads OWNER_TIMEZONE) ──

export function getOwnerTimeZone(): string {
  return process.env.OWNER_TIMEZONE || "Africa/Nairobi";
}

/** Automation cutover instant, or null when automation is disabled. */
export function getAutomationCutover(): Date | null {
  const raw = process.env.LEAD_AUTOMATION_CUTOVER;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** The owner-local calendar date (YYYY-MM-DD) of an instant. */
export function ownerDateOf(now: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** The owner-local hour (0-23) of an instant. */
export function ownerHourOf(now: Date, tz: string): number {
  return parseInt(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(
      now
    ),
    10
  );
}

const dateToUtcDays = (isoDate: string) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
};

// ── Deadline bands (date-only honest; §10) ──

export type DeadlineBand =
  | "overdue"
  | "today"
  | "tomorrow"
  | "within_48h"
  | "within_72h"
  | "later"
  | "none";

export function deadlineBand(deadline: string | null | undefined, now: Date, tz: string): DeadlineBand {
  if (!deadline) return "none";
  const days = dateToUtcDays(deadline) - dateToUtcDays(ownerDateOf(now, tz));
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === 2) return "within_48h";
  if (days === 3) return "within_72h";
  return "later";
}

export const DEADLINE_BAND_LABEL: Record<Exclude<DeadlineBand, "none" | "later">, string> = {
  overdue: "Overdue",
  today: "Due today",
  tomorrow: "Due tomorrow",
  within_48h: "Due within 48h",
  within_72h: "Due within 72h",
};

/** Bands that make a lead operationally deadline-critical (§4). */
export function isDeadlineCritical(band: DeadlineBand): boolean {
  return band === "overdue" || band === "today";
}

// ── "Untouched" (approved §3) ──

export type TouchInput = {
  status: string;
  contactedAt: Date | null;
  archivedAt: Date | null;
  notesCount: number;
  /** to_status values from lead_status_events, any order. */
  eventStatuses: string[];
};

/**
 * Durable evidence of meaningful handling. Deliberately: NEW -> REVIEWING
 * alone does NOT count (the July lead), and viewing admin pages is never
 * tracked. A deliberate note, a recorded contact, progression beyond
 * REVIEWING, archiving or a terminal status all count.
 */
export function isTouched(t: TouchInput): boolean {
  if (isTerminalStatus(t.status)) return true;
  if (t.archivedAt) return true;
  if (t.contactedAt) return true;
  if (t.notesCount > 0) return true;
  return t.eventStatuses.some((s) => s !== "NEW" && s !== "REVIEWING");
}

// ── Escalation planning (§4) ──

export type EscalationKind = "escalation_1" | "escalation_2";

export const STANDARD_ESCALATION_1_MS = 30 * 60 * 1000;
export const CRITICAL_ESCALATION_1_MS = 15 * 60 * 1000;
export const ESCALATION_2_MS = 2 * 60 * 60 * 1000;

export type EscalationInput = {
  createdAt: Date;
  classification: LeadClassification | string;
  deadline: string | null;
  touch: TouchInput;
};

/**
 * Which escalations are due NOW for this lead. The ledger's claim semantics
 * make re-planning idempotent, so this function answers only "due", never
 * "already sent". Returns [] when automation is off, the lead predates the
 * cutover, the lead is touched, or the lead is not operationally urgent.
 */
export function planEscalations(
  input: EscalationInput,
  now: Date,
  tz: string,
  cutover: Date | null
): EscalationKind[] {
  if (!cutover || input.createdAt < cutover) return [];
  if (isTouched(input.touch)) return [];

  const band = deadlineBand(input.deadline, now, tz);
  const urgent =
    input.classification === "HIGH_INTENT" ||
    input.classification === "PRIORITY" ||
    isDeadlineCritical(band);
  if (!urgent) return [];

  const age = now.getTime() - input.createdAt.getTime();
  const firstAt = isDeadlineCritical(band) ? CRITICAL_ESCALATION_1_MS : STANDARD_ESCALATION_1_MS;
  const due: EscalationKind[] = [];
  if (age >= firstAt) due.push("escalation_1");
  if (age >= ESCALATION_2_MS) due.push("escalation_2");
  return due;
}

// ── Needs Attention (§9) ──

const STALE_QUOTE_MS = 72 * 60 * 60 * 1000;
const STALE_PROGRESS_MS = 48 * 60 * 60 * 1000;

export type AttentionInput = {
  id: string;
  createdAt: Date;
  status: string;
  classification: LeadClassification | string;
  deadline: string | null;
  quoteSentAt: Date | null;
  touch: TouchInput;
  /** Most recent status-event instant (or createdAt when none). */
  lastEventAt: Date;
};

export type Attention = { score: number; reasons: string[] };

export function humanizeAge(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${Math.max(minutes, 0)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/**
 * Attention score + transparent reasons. The score exists ONLY for
 * deterministic ordering; the UI renders the reasons. Terminal/archived
 * leads return null (they need no attention).
 */
export function attentionFor(input: AttentionInput, now: Date, tz: string): Attention | null {
  if (isTerminalStatus(input.status) || input.touch.archivedAt) return null;

  let score = 0;
  const reasons: string[] = [];
  const band = deadlineBand(input.deadline, now, tz);
  const touched = isTouched(input.touch);
  const age = now.getTime() - input.createdAt.getTime();

  if (input.classification === "PRIORITY") {
    score += 20;
    reasons.push("Priority lead");
  } else if (input.classification === "HIGH_INTENT") {
    score += 15;
    reasons.push("High intent");
  } else if (input.classification === "WARM") {
    score += 5;
  }

  if (!touched) {
    score += 40;
    reasons.push(`Untouched ${humanizeAge(age)}`);
    if (input.touch.eventStatuses.includes("REVIEWING")) {
      reasons.push("Reviewing with no contact recorded");
    }
  }

  const bandScore: Record<DeadlineBand, number> = {
    overdue: 25, today: 20, tomorrow: 15, within_48h: 10, within_72h: 5, later: 0, none: 0,
  };
  score += bandScore[band];
  if (band !== "none" && band !== "later") {
    reasons.push(DEADLINE_BAND_LABEL[band]);
  }

  if (age > 7 * 86_400_000) score += 10;
  else if (age > 2 * 86_400_000) score += 6;
  else if (age > 86_400_000) score += 3;

  if (
    input.status === "QUOTE_SENT" &&
    input.quoteSentAt &&
    now.getTime() - input.quoteSentAt.getTime() > STALE_QUOTE_MS
  ) {
    score += 15;
    reasons.push(`Quote stale ${humanizeAge(now.getTime() - input.quoteSentAt.getTime())}`);
  }

  if (
    touched &&
    (input.status === "REVIEWING" || input.status === "CONTACTED") &&
    now.getTime() - input.lastEventAt.getTime() > STALE_PROGRESS_MS
  ) {
    score += 10;
    reasons.push(`No movement for ${humanizeAge(now.getTime() - input.lastEventAt.getTime())}`);
  }

  return { score, reasons };
}

// ── Daily digest (§8) ──

export type DigestSections = {
  untouched: AttentionInput[];
  deadlines: AttentionInput[]; // within 72h or overdue, non-terminal
  staleQuotes: AttentionInput[];
  staleProgress: AttentionInput[];
};

/** Idempotency key: one digest per owner-local calendar day. */
export function digestDedupeKey(now: Date, tz: string): string {
  return `digest:${ownerDateOf(now, tz)}`;
}

/** The digest window opens at 08:00 owner-local (§8). */
export function digestWindowOpen(now: Date, tz: string): boolean {
  return ownerHourOf(now, tz) >= 8;
}

/**
 * Digest membership. Historical (pre-cutover) leads ARE included: the
 * digest is internal visibility, not client-facing automation.
 */
export function planDigest(leads: AttentionInput[], now: Date, tz: string): DigestSections | null {
  const active = leads.filter(
    (l) => !isTerminalStatus(l.status) && !l.touch.archivedAt
  );
  const sections: DigestSections = {
    untouched: active.filter((l) => !isTouched(l.touch)),
    deadlines: active.filter((l) => {
      const b = deadlineBand(l.deadline, now, tz);
      return b !== "none" && b !== "later";
    }),
    staleQuotes: active.filter(
      (l) =>
        l.status === "QUOTE_SENT" &&
        l.quoteSentAt !== null &&
        now.getTime() - l.quoteSentAt.getTime() > STALE_QUOTE_MS
    ),
    staleProgress: active.filter(
      (l) =>
        isTouched(l.touch) &&
        (l.status === "REVIEWING" || l.status === "CONTACTED") &&
        now.getTime() - l.lastEventAt.getTime() > STALE_PROGRESS_MS
    ),
  };
  const empty =
    sections.untouched.length === 0 &&
    sections.deadlines.length === 0 &&
    sections.staleQuotes.length === 0 &&
    sections.staleProgress.length === 0;
  return empty ? null : sections;
}
