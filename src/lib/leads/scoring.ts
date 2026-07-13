/**
 * CIPD lead scoring — pure, deterministic, separately testable.
 *
 * The score is INTERNAL ONLY. It is computed server-side, included in the
 * internal notification email, and must never be returned to the visitor,
 * rendered in any public UI, or sent to analytics alongside PII.
 *
 * Rules (P0 baseline — file-upload scoring lands with real uploads in P1):
 *   Level:        3 → +5 · 5 → +15 · 7 → +20
 *   Support:      guidance +5 · draft review +10 · referencing +5 ·
 *                 feedback interpretation +15 · resubmission +20
 *   Deadline:     <24h +20 · 1–3d +15 · 4–7d +10 · >7d +5 · none 0
 *   Word count:   1–1,999 +5 · 2,000–3,999 +10 · 4,000–5,999 +15 · 6,000+ +20
 *   Completeness: unit code +5 · WhatsApp number +5 · detailed message +5
 *
 * Classification: 0–20 LOW_INTENT · 21–40 WARM · 41–60 HIGH_INTENT · 61+ PRIORITY
 */

import type { CipdLevel, SupportType, LeadClassification } from "@/lib/leads/types";

const LEVEL_POINTS: Record<CipdLevel, number> = { "3": 5, "5": 15, "7": 20 };

const SUPPORT_POINTS: Record<SupportType, number> = {
  assessment_guidance: 5,
  draft_review: 10,
  harvard_referencing: 5,
  feedback_interpretation: 15,
  resubmission: 20,
};

/** A message this long or more counts as "detailed". */
const DETAILED_MESSAGE_MIN_CHARS = 40;

export type ScoringInput = {
  level: CipdLevel;
  supportType: SupportType;
  deadline?: string; // ISO date
  wordCount?: number;
  unitCode?: string;
  whatsapp?: string;
  message?: string;
};

export type ScoringResult = {
  score: number;
  classification: LeadClassification;
  breakdown: Record<string, number>;
};

export function deadlinePoints(deadline: string | undefined, now: Date): number {
  if (!deadline) return 0;
  const due = new Date(`${deadline}T00:00:00`);
  if (Number.isNaN(due.getTime())) return 0;
  // Calendar-day difference: learners state deadlines as dates, so "3 days
  // away" means the date three days from today regardless of time of day.
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayDiff = Math.round((due.getTime() - startOfToday.getTime()) / 864e5);
  if (dayDiff <= 0) return 20; // due today, or already overdue: maximally urgent
  if (dayDiff <= 3) return 15;
  if (dayDiff <= 7) return 10;
  return 5;
}

export function wordCountPoints(wordCount: number | undefined): number {
  if (!wordCount || wordCount < 1) return 0;
  if (wordCount < 2000) return 5;
  if (wordCount < 4000) return 10;
  if (wordCount < 6000) return 15;
  return 20;
}

export function classify(score: number): LeadClassification {
  if (score >= 61) return "PRIORITY";
  if (score >= 41) return "HIGH_INTENT";
  if (score >= 21) return "WARM";
  return "LOW_INTENT";
}

export function scoreLead(input: ScoringInput, now: Date = new Date()): ScoringResult {
  const breakdown: Record<string, number> = {
    level: LEVEL_POINTS[input.level] ?? 0,
    support: SUPPORT_POINTS[input.supportType] ?? 0,
    deadline: deadlinePoints(input.deadline, now),
    wordCount: wordCountPoints(input.wordCount),
    unitCode: input.unitCode?.trim() ? 5 : 0,
    whatsapp: input.whatsapp?.trim() ? 5 : 0,
    message: (input.message?.trim().length ?? 0) >= DETAILED_MESSAGE_MIN_CHARS ? 5 : 0,
  };
  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score, classification: classify(score), breakdown };
}

/** Human label for notification emails, e.g. "PRIORITY LEAD". */
export function classificationLabel(c: LeadClassification): string {
  return c.replace("_", " ");
}
