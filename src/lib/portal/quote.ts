import type { CipdLevel } from "@/lib/portal/types";

/**
 * Automated quote estimator.
 *
 * Pure function — no external services — so it runs anywhere (API route, client,
 * or admin). Produces an indicative GBP range from level, word count, help type
 * and deadline urgency. Tune the constants to your real pricing.
 *
 * NOTE: this is an *indicative estimate* to power the automated quote request. Final
 * quotes are confirmed by an admin before the client approves.
 */

export type QuoteEstimate = {
  currency: string;
  low: number;
  high: number;
  mid: number;
  breakdown: { label: string; value: string }[];
  urgency: "standard" | "priority" | "express";
};

const LEVEL_BASE: Record<CipdLevel, number> = {
  "3": 60,
  "5": 90,
  "7": 140,
};

// Price per 1,000 words, by level
const LEVEL_PER_1K: Record<CipdLevel, number> = {
  "3": 28,
  "5": 40,
  "7": 60,
};

const HELP_MULTIPLIER: Record<string, number> = {
  "Brief analysis & structure": 0.7,
  "Draft review & improvement": 1,
  "Editing & proofreading": 0.65,
  "Harvard referencing": 0.5,
  "Resubmission support": 0.95,
  "Full guidance package": 1.35,
};

function daysUntil(deadlineIso: string, todayIso: string): number {
  const d = new Date(deadlineIso + "T00:00:00Z").getTime();
  const t = new Date(todayIso + "T00:00:00Z").getTime();
  return Math.round((d - t) / (1000 * 60 * 60 * 24));
}

export function estimateQuote(input: {
  level: CipdLevel;
  wordCount: number;
  helpType: string;
  deadline: string; // ISO date
  today: string; // ISO date — pass in (no Date.now in shared code paths)
}): QuoteEstimate {
  const base = LEVEL_BASE[input.level] ?? 90;
  const words = Math.max(0, input.wordCount || 0);
  const wordCost = (words / 1000) * (LEVEL_PER_1K[input.level] ?? 40);
  const helpMult = HELP_MULTIPLIER[input.helpType] ?? 1;

  const days = daysUntil(input.deadline, input.today);
  let urgency: QuoteEstimate["urgency"] = "standard";
  let urgencyMult = 1;
  if (Number.isFinite(days)) {
    if (days <= 3) {
      urgency = "express";
      urgencyMult = 1.4;
    } else if (days <= 7) {
      urgency = "priority";
      urgencyMult = 1.2;
    }
  }

  const core = (base + wordCost) * helpMult * urgencyMult;
  const mid = Math.round(core / 5) * 5;
  const low = Math.round((mid * 0.9) / 5) * 5;
  const high = Math.round((mid * 1.15) / 5) * 5;

  return {
    currency: "GBP",
    low,
    high,
    mid,
    urgency,
    breakdown: [
      { label: "CIPD level", value: `Level ${input.level}` },
      { label: "Word count", value: `${words.toLocaleString()} words` },
      { label: "Support type", value: input.helpType },
      {
        label: "Turnaround",
        value:
          urgency === "express"
            ? "Express (≤3 days)"
            : urgency === "priority"
            ? "Priority (≤7 days)"
            : "Standard",
      },
    ],
  };
}

export function formatMoney(amount: number, currency = "GBP") {
  const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : currency === "AED" ? "AED " : "";
  return `${symbol}${amount.toLocaleString()}`;
}
