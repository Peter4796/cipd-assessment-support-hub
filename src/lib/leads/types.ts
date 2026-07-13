/**
 * Lead domain model — the single source of truth for lead shapes across
 * forms, the API, scoring, notifications and (later) the database + admin.
 *
 * PERSISTENCE NOTE (P0): leads are NOT stored anywhere yet. A lead exists
 * only for the duration of the /api/leads request and is then delivered by
 * email (Resend). The shapes below are deliberately DB-ready so the P2
 * database tranche can persist them without remodelling: `id`, `createdAt`,
 * `status`, notes/quotes/attachments extension points are already defined.
 */

// ─── CIPD level ───
export const CIPD_LEVELS = ["3", "5", "7"] as const;
export type CipdLevel = (typeof CIPD_LEVELS)[number];

// ─── Support types (operational taxonomy — mirrors the real service offering) ───
export const SUPPORT_TYPES = {
  assessment_guidance: "Assessment guidance",
  draft_review: "Draft review and improvement",
  resubmission: "Resubmission support",
  feedback_interpretation: "Tutor feedback interpretation",
  harvard_referencing: "Harvard referencing support",
} as const;
export type SupportType = keyof typeof SUPPORT_TYPES;
export const SUPPORT_TYPE_KEYS = Object.keys(SUPPORT_TYPES) as SupportType[];

// ─── Source page taxonomy ───
export const SOURCE_PAGE_TYPES = [
  "home",
  "service",
  "level",
  "unit",
  "article",
  "guide",
  "pricing",
  "other",
] as const;
export type SourcePageType = (typeof SOURCE_PAGE_TYPES)[number];

// ─── Lead classification ───
export const LEAD_CLASSIFICATIONS = ["LOW_INTENT", "WARM", "HIGH_INTENT", "PRIORITY"] as const;
export type LeadClassification = (typeof LEAD_CLASSIFICATIONS)[number];

// ─── Acquisition context (captured client-side, validated server-side) ───
export type AcquisitionContext = {
  sourcePage: string; // path only, e.g. "/cipd-units/5co01"
  sourcePageType: SourcePageType;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

// ─── What the enquiry form submits (pre-validation wire shape) ───
export type LeadInput = {
  name: string;
  email: string;
  whatsapp?: string; // free-form number with country code
  country?: string;
  level: string; // validated → CipdLevel
  unitCode?: string;
  supportType: string; // validated → SupportType
  wordCount?: string | number;
  deadline?: string; // ISO date
  message?: string;
  context?: Partial<AcquisitionContext>;
  // Anti-spam (never persisted): honeypot + client render timestamp
  website?: string; // honeypot — must be empty
  startedAt?: number; // epoch ms when the form mounted
};

// ─── The validated, scored lead (what notifications and future storage use) ───
export type Lead = {
  id: string; // reference, e.g. "CG-4F2K9Q"
  createdAt: string; // ISO
  name: string;
  email: string;
  whatsapp?: string;
  country?: string;
  level: CipdLevel;
  unitCode?: string;
  supportType: SupportType;
  wordCount?: number;
  deadline?: string; // ISO date
  message?: string;
  acquisition: AcquisitionContext;
  score: number;
  classification: LeadClassification;
  /**
   * Whether the visitor clicked "Continue on WhatsApp" after capture.
   * Unknown at capture time (the email is sent first); tracked via analytics
   * in P0 and persisted once the database exists.
   */
  whatsappContinued?: boolean;
  // ─── P2 extension points (defined now so persistence needs no remodel) ───
  status?: LeadStatus;
  internalNotes?: { at: string; body: string }[];
  quote?: { amount: number; currency: string; sentAt?: string };
  attachments?: { name: string; url: string; kind: "brief" | "feedback" }[];
};

// ─── Operational status pipeline (used by the future admin; defined here so
//     the model is stable from day one) ───
export const LEAD_STATUSES = [
  "NEW_LEAD",
  "BRIEF_REVIEWED",
  "QUOTE_SENT",
  "AWAITING_PAYMENT",
  "IN_PROGRESS",
  "QUALITY_REVIEW",
  "DELIVERED",
  "REVISION",
  "COMPLETED",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

// ─── Subscriber (lead-magnet) capture — a different funnel stage from a
//     sales lead; kept deliberately separate so resource downloads never
//     contaminate assessment lead scoring ───
export type SubscriberInput = {
  name?: string;
  email: string;
  level?: string;
  country?: string;
  resource: string; // slug of the requested resource
  context?: Partial<AcquisitionContext>;
  website?: string; // honeypot
  startedAt?: number;
};

export type Subscriber = {
  createdAt: string;
  name?: string;
  email: string;
  level?: string;
  country?: string;
  resource: string;
  acquisition: AcquisitionContext;
};
