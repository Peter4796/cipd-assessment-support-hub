/**
 * Admin lead-list filters — pure parsing/normalisation of URL searchParams
 * into typed, validated filter values (P2.3). Unknown or malformed values
 * are dropped, never passed to the database layer.
 */

import {
  CIPD_LEVELS,
  LEAD_CLASSIFICATIONS,
  LEAD_STATUSES,
  type CipdLevel,
  type LeadClassification,
  type LeadStatus,
} from "@/lib/leads/types";

export const URGENCY_BUCKETS = ["overdue", "3d", "7d", "later"] as const;
export type UrgencyBucket = (typeof URGENCY_BUCKETS)[number];

export const LEAD_SORTS = ["newest", "deadline"] as const;
export type LeadSort = (typeof LEAD_SORTS)[number];

export type LeadListFilters = {
  status?: LeadStatus;
  classification?: LeadClassification;
  level?: CipdLevel;
  urgency?: UrgencyBucket;
  q?: string;
  sort: LeadSort;
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function oneOf<T extends string>(
  value: string | undefined,
  allowed: readonly T[]
): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

export function parseLeadFilters(params: SearchParams): LeadListFilters {
  // Search text: cap length and strip SQL LIKE wildcards/escapes — the value
  // is parameterised anyway, but wildcards from users make matches surprising.
  const rawQ = first(params.q)?.trim().slice(0, 80).replace(/[%_\\]/g, "") ?? "";
  return {
    status: oneOf(first(params.status), LEAD_STATUSES),
    classification: oneOf(first(params.classification), LEAD_CLASSIFICATIONS),
    level: oneOf(first(params.level), CIPD_LEVELS),
    urgency: oneOf(first(params.urgency), URGENCY_BUCKETS),
    q: rawQ || undefined,
    sort: oneOf(first(params.sort), LEAD_SORTS) ?? "newest",
  };
}

/** Local calendar date as YYYY-MM-DD (deadline column semantics). */
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function plusDays(d: Date, days: number): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  out.setDate(out.getDate() + days);
  return out;
}

export type DeadlineRange = { before?: string; from?: string; to?: string; after?: string };

/**
 * Deadline window for an urgency bucket, in date strings comparable against
 * the `deadline` date column:
 *   overdue → deadline < today
 *   3d      → today ≤ deadline ≤ today+3
 *   7d      → today ≤ deadline ≤ today+7 (includes the 3d set)
 *   later   → deadline > today+7
 */
export function urgencyDeadlineRange(bucket: UrgencyBucket, today: Date): DeadlineRange {
  const t = isoDate(today);
  switch (bucket) {
    case "overdue":
      return { before: t };
    case "3d":
      return { from: t, to: isoDate(plusDays(today, 3)) };
    case "7d":
      return { from: t, to: isoDate(plusDays(today, 7)) };
    case "later":
      return { after: isoDate(plusDays(today, 7)) };
  }
}

/** Days from `today` to a YYYY-MM-DD deadline (negative = overdue). */
export function daysUntilDeadline(deadline: string, today: Date): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const due = new Date(`${deadline}T00:00:00`);
  return Math.round((due.getTime() - start.getTime()) / 864e5);
}
