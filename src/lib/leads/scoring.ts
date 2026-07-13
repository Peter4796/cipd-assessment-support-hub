/**
 * CIPD lead scoring — pure, deterministic, separately testable.
 *
 * The score is INTERNAL ONLY. It is computed server-side, included in the
 * internal notification email, and must never be returned to the visitor,
 * rendered in any public UI, or sent to analytics alongside PII. It is used
 * for prioritisation only — never to deny service.
 *
 * P0 rules (unchanged):
 *   Level:        3 → +5 · 5 → +15 · 7 → +20
 *   Support:      guidance +5 · draft review +10 · referencing +5 ·
 *                 feedback interpretation +15 · resubmission +20
 *   Deadline:     due/overdue +20 · 1–3d +15 · 4–7d +10 · >7d +5 · none 0
 *   Word count:   1–1,999 +5 · 2,000–3,999 +10 · 4,000–5,999 +15 · 6,000+ +20
 *   Completeness: unit code +5 · WhatsApp +5 · detailed message (≥40ch) +5
 *
 * P1 additions:
 *   Attachments:  brief +15 · draft +10 · tutor feedback (resubmission) +15
 *   Context:      provider +2 · referred criteria (resubmission) +5
 *                 (detailed support description = the existing message bonus;
 *                  deliberately NOT double-counted)
 *   Intent:       review step reached +5
 *                 (successful submission itself adds nothing — every captured
 *                  lead submitted, so it would inflate all scores equally)
 *
 * Theoretical maximum: 147.
 *
 * CLASSIFICATION THRESHOLDS (re-derived for P1 — see distribution analysis in
 * docs/lead-acquisition.md):
 *   0–25 LOW_INTENT · 26–55 WARM · 56–90 HIGH_INTENT · 91+ PRIORITY
 * Rationale: a complete Level 5 funnel enquiry with a brief lands ~75–85
 * (HIGH); complete resubmissions with feedback and urgent Level 7 enquiries
 * land 95–145 (PRIORITY); informational enquiries stay ≤25 (LOW). Under the
 * old P0 thresholds (61+ = PRIORITY) nearly every complete funnel lead would
 * have been PRIORITY, destroying the signal.
 */

import type {
  AttachmentCategory,
  CipdLevel,
  LeadClassification,
  SubmissionType,
  SupportType,
} from "@/lib/leads/types";

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
  // ── P1 ──
  attachmentCategories?: AttachmentCategory[];
  provider?: string;
  submissionType?: SubmissionType;
  referredCriteria?: string;
  reachedReview?: boolean;
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

export function attachmentPoints(
  categories: AttachmentCategory[] | undefined,
  isResubmission: boolean
): { brief: number; draft: number; feedback: number } {
  const cats = new Set(categories ?? []);
  return {
    brief: cats.has("ASSESSMENT_BRIEF") ? 15 : 0,
    draft: cats.has("EXISTING_DRAFT") ? 10 : 0,
    // Tutor feedback is the decisive document for a resubmission; for a first
    // submission it is useful context but not scored (it usually isn't one).
    feedback: cats.has("TUTOR_FEEDBACK") && isResubmission ? 15 : 0,
  };
}

export function classify(score: number): LeadClassification {
  if (score >= 91) return "PRIORITY";
  if (score >= 56) return "HIGH_INTENT";
  if (score >= 26) return "WARM";
  return "LOW_INTENT";
}

export function scoreLead(input: ScoringInput, now: Date = new Date()): ScoringResult {
  const isResubmission =
    input.submissionType === "resubmission" || input.supportType === "resubmission";
  const files = attachmentPoints(input.attachmentCategories, isResubmission);

  const breakdown: Record<string, number> = {
    level: LEVEL_POINTS[input.level] ?? 0,
    support: SUPPORT_POINTS[input.supportType] ?? 0,
    deadline: deadlinePoints(input.deadline, now),
    wordCount: wordCountPoints(input.wordCount),
    unitCode: input.unitCode?.trim() ? 5 : 0,
    whatsapp: input.whatsapp?.trim() ? 5 : 0,
    message: (input.message?.trim().length ?? 0) >= DETAILED_MESSAGE_MIN_CHARS ? 5 : 0,
    briefUploaded: files.brief,
    draftUploaded: files.draft,
    feedbackUploaded: files.feedback,
    provider: input.provider?.trim() ? 2 : 0,
    referredCriteria: isResubmission && input.referredCriteria?.trim() ? 5 : 0,
    reachedReview: input.reachedReview ? 5 : 0,
  };
  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score, classification: classify(score), breakdown };
}

/** Human label for notification emails, e.g. "PRIORITY LEAD". */
export function classificationLabel(c: LeadClassification): string {
  return c.replace("_", " ");
}
