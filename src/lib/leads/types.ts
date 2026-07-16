/**
 * Lead domain model — the single source of truth for lead shapes across
 * forms, the API, scoring, notifications and (later) the database + admin.
 *
 * PERSISTENCE (P2.2): leads are persisted to Postgres in /api/leads (see
 * src/lib/db/schema.ts + src/lib/db/leads.ts) — the database is the system
 * of record and the Resend notification is an operational alert. When the
 * database is unavailable the email falls back to being the record for that
 * lead (capture-first, never silently dropped).
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
  /**
   * Blob pathname within the PRIVATE store — the only storage reference we
   * keep. Access is always server-mediated via /admin/files/[...pathname]
   * (Basic-Auth protected, streams the blob with OIDC credentials). Raw blob
   * URLs are never stored, emailed, logged or sent to analytics.
   */
  pathname: string;
  mimeType: string;
  sizeBytes: number;
  uploadStatus: "uploaded"; // only successfully uploaded files reach the lead
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
  /** Visitor reached the funnel review step before submitting. */
  reachedReview?: boolean;
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

// ─── Operational status pipeline (owner-approved P2 model) ───
// Statuses are flexible admin state, not a hard state machine: every change
// is recorded in lead_status_events and milestone timestamps are stamped on
// first entry, but an authenticated admin can always correct a mistake.
// Archiving is deliberately NOT a status — it is the orthogonal `archivedAt`
// field, so a lead keeps its final outcome (COMPLETED or LOST) when archived.
export const LEAD_STATUSES = [
  "NEW",
  "REVIEWING",
  "CONTACTED",
  "QUOTE_SENT",
  "AWAITING_PAYMENT",
  "IN_PROGRESS",
  "QUALITY_REVIEW",
  "DELIVERED",
  "COMPLETED",
  "LOST",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Terminal outcomes: leaving one requires a deliberate reopen action. */
export const TERMINAL_LEAD_STATUSES = ["COMPLETED", "LOST"] as const satisfies
  readonly LeadStatus[];

/** Statuses from which a lead may be marked LOST (pre-fulfilment stages). */
export const LOSABLE_LEAD_STATUSES = [
  "NEW",
  "REVIEWING",
  "CONTACTED",
  "QUOTE_SENT",
  "AWAITING_PAYMENT",
] as const satisfies readonly LeadStatus[];

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
