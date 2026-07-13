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

// ─── Attachments (P1 — real uploads via Vercel Blob) ───
export const ATTACHMENT_CATEGORIES = {
  ASSESSMENT_BRIEF: "Assessment brief",
  EXISTING_DRAFT: "Existing draft",
  TUTOR_FEEDBACK: "Tutor / assessor feedback",
  SUPPORTING_DOCUMENT: "Supporting document",
  OTHER: "Other",
} as const;
export type AttachmentCategory = keyof typeof ATTACHMENT_CATEGORIES;
export const ATTACHMENT_CATEGORY_KEYS = Object.keys(
  ATTACHMENT_CATEGORIES
) as AttachmentCategory[];

export type LeadAttachment = {
  id: string;
  originalFileName: string; // sanitised display name
  pathname: string; // blob pathname (internal reference)
  mimeType: string;
  sizeBytes: number;
  uploadStatus: "uploaded"; // only successfully uploaded files reach the lead
  /**
   * Unguessable (random-suffixed) blob URL. SECURITY MODEL: Vercel Blob
   * client uploads are public-with-unguessable-URL (capability URL). These
   * URLs are shown ONLY in the internal notification email — never to
   * visitors, never in analytics, never logged. See docs/lead-acquisition.md.
   */
  url: string;
  uploadedAt: string; // ISO
  category: AttachmentCategory;
};

// ─── Submission type ───
export const SUBMISSION_TYPES = ["first", "resubmission"] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];

// ─── Funnel metadata (P1 multi-step form) ───
export type FunnelMeta = {
  entryCta?: string; // CTA location token, e.g. "hero" | "sidebar" | "article_end"
  startedAt?: string; // ISO — first step rendered
  completedAt?: string; // ISO — submission time
  durationSeconds?: number;
};

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
  // ── P1 funnel fields (all optional — P0 contact-form payloads stay valid) ──
  provider?: string; // study centre / provider
  submissionType?: string; // validated → SubmissionType
  referredCriteria?: string; // free text, resubmissions only
  attachments?: unknown; // validated → LeadAttachment[]
  funnel?: Partial<FunnelMeta>;
  reachedReview?: boolean;
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
  provider?: string;
  submissionType?: SubmissionType;
  referredCriteria?: string;
  attachments?: LeadAttachment[];
  funnel?: FunnelMeta;
  acquisition: AcquisitionContext;
  score: number;
  classification: LeadClassification;
  /** 1 = P0 contact form · 2 = P1 multi-step funnel */
  schemaVersion: 1 | 2;
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
