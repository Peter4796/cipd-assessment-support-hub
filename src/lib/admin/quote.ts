/**
 * Internal quote recommendation engine (P2.4) — ADMIN ONLY.
 *
 * Consumed exclusively by the admin detail page (server component) and its
 * server actions: never imported from client components, public pages, API
 * responses, analytics or client-facing emails. The recommendation is an
 * internal decision aid; the owner always sets the actual quoted amount.
 *
 * Owner-approved pricing model (2026-07-16), evolved from the P0 estimator's
 * base + per-1000-words structure, re-anchored in USD:
 *
 *   mid = (BASE + PER_1K × words/1000)
 *         × supportMultiplier × levelMultiplier × urgencyMultiplier,
 *   floored at the per-support-type minimum, rounded to $5.
 *
 * BASE_USD and PER_1K_USD are the two tunables; everything else is the
 * owner's approved multiplier table.
 */

import type { CipdLevel, SupportType } from "@/lib/leads/types";
import { daysUntilDeadline } from "@/lib/admin/filters";

export const QUOTE_CURRENCY = "USD";

/** Tunable anchors (owner-adjustable without touching the multiplier table). */
const BASE_USD = 60;
const PER_1K_USD = 30;

/** Owner decision 4 — support-type multipliers. */
const SUPPORT_MULTIPLIER: Record<SupportType, number> = {
  assessment_guidance: 1.0,
  draft_review: 0.7,
  resubmission: 0.85,
  feedback_interpretation: 0.45,
  harvard_referencing: 0.4,
};

/** Owner decision 4 — minimum internal recommendations (USD). */
const SUPPORT_MINIMUM_USD: Record<SupportType, number> = {
  assessment_guidance: 60,
  draft_review: 50,
  resubmission: 60,
  feedback_interpretation: 35,
  harvard_referencing: 30,
};

/** Owner decision 4 — level multipliers. */
const LEVEL_MULTIPLIER: Record<CipdLevel, number> = {
  "3": 0.9,
  "5": 1.0,
  "7": 1.25,
};

export type QuoteUrgency = "under_24h" | "1_3d" | "4_7d" | "standard";

/** Owner decision 4 — urgency multipliers (overdue treated as maximally urgent). */
const URGENCY_MULTIPLIER: Record<QuoteUrgency, number> = {
  under_24h: 1.4,
  "1_3d": 1.25,
  "4_7d": 1.1,
  standard: 1.0,
};

export const URGENCY_LABEL: Record<QuoteUrgency, string> = {
  under_24h: "Under 24 hours",
  "1_3d": "1–3 days",
  "4_7d": "4–7 days",
  standard: "Standard (over 7 days)",
};

export function quoteUrgency(deadline: string | undefined, today: Date): QuoteUrgency {
  if (!deadline) return "standard";
  const days = daysUntilDeadline(deadline, today);
  if (days <= 0) return "under_24h"; // due today or overdue
  if (days <= 3) return "1_3d";
  if (days <= 7) return "4_7d";
  return "standard";
}

const round5 = (n: number) => Math.round(n / 5) * 5;

export type QuoteRecommendation = {
  currency: typeof QUOTE_CURRENCY;
  mid: number;
  low: number;
  high: number;
  urgency: QuoteUrgency;
  minimumApplied: boolean;
  breakdown: { label: string; value: string }[];
};

export function recommendQuoteForLead(
  lead: {
    level: CipdLevel;
    supportType: SupportType;
    wordCount?: number;
    deadline?: string;
  },
  today: Date = new Date()
): QuoteRecommendation {
  const words = Math.max(0, lead.wordCount ?? 0);
  const urgency = quoteUrgency(lead.deadline, today);
  const supportMult = SUPPORT_MULTIPLIER[lead.supportType];
  const levelMult = LEVEL_MULTIPLIER[lead.level];
  const urgencyMult = URGENCY_MULTIPLIER[urgency];

  const raw = (BASE_USD + (words / 1000) * PER_1K_USD) * supportMult * levelMult * urgencyMult;
  const minimum = SUPPORT_MINIMUM_USD[lead.supportType];
  const minimumApplied = raw < minimum;
  const mid = round5(Math.max(raw, minimum));
  const low = Math.max(minimum, round5(mid * 0.9));
  const high = round5(mid * 1.15);

  return {
    currency: QUOTE_CURRENCY,
    mid,
    low,
    high,
    urgency,
    minimumApplied,
    breakdown: [
      { label: "Base + words", value: `$${BASE_USD} + ${words.toLocaleString()}w × $${PER_1K_USD}/1k` },
      { label: "Support type", value: `× ${SUPPORT_MULTIPLIER[lead.supportType]}` },
      { label: "CIPD level", value: `Level ${lead.level} × ${levelMult}` },
      { label: "Urgency", value: `${URGENCY_LABEL[urgency]} × ${urgencyMult}` },
      ...(minimumApplied ? [{ label: "Minimum", value: `$${minimum} floor applied` }] : []),
    ],
  };
}

export function formatUsd(amount: number, currency = "USD"): string {
  const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${amount.toLocaleString()}`;
}
