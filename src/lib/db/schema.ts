/**
 * Drizzle schema — the persistent lead model (P2).
 *
 * Design rules (approved P2 architecture report):
 *  - Mapped 1:1 from the validated lead domain model in src/lib/leads/types.ts;
 *    this is persistence for the EXISTING funnel payload, not a general CRM.
 *  - The database is the system of record; the notification email is an alert
 *    (delivery state lives on the lead row so failed alerts can be retried).
 *  - Attachments reference the PRIVATE Vercel Blob store by pathname ONLY.
 *    No URLs are ever stored — downloads stay server-mediated via
 *    /admin/files/[...pathname]. Retention bookkeeping lives on the
 *    attachment row; deletion metadata is kept after the blob is removed.
 *  - Statuses/classifications are text columns validated in the app layer
 *    (see LEAD_STATUSES in src/lib/leads/types.ts), not pg enums, so the
 *    pipeline can evolve without enum migrations.
 *
 * Migrations: drizzle-kit generate → ./drizzle/*.sql (committed, plain SQL).
 */

import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const leads = pgTable(
  "leads",
  {
    /** Public reference, e.g. "CG-4F2K9Q" — generated in /api/leads. */
    id: text("id").primaryKey(),
    createdAt: ts("created_at").notNull(),
    updatedAt: ts("updated_at").notNull(),
    /** 1 = contact form · 2 = multi-step funnel (see Lead.schemaVersion). */
    schemaVersion: smallint("schema_version").notNull(),

    // ── Client ──
    name: text("name").notNull(),
    email: text("email").notNull(),
    whatsapp: text("whatsapp"),
    country: text("country"),

    // ── Assessment ──
    level: text("level").notNull(), // "3" | "5" | "7"
    unitCode: text("unit_code"),
    supportType: text("support_type").notNull(), // SUPPORT_TYPES key
    submissionType: text("submission_type"), // "first" | "resubmission"
    provider: text("provider"),
    wordCount: integer("word_count"),
    deadline: date("deadline", { mode: "string" }), // YYYY-MM-DD
    message: text("message"),
    referredCriteria: text("referred_criteria"),

    // ── Scoring (internal only — never exposed to clients) ──
    score: smallint("score").notNull(),
    classification: text("classification").notNull(), // LeadClassification

    // ── Acquisition ──
    sourcePage: text("source_page").notNull(),
    sourcePageType: text("source_page_type").notNull(),
    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),

    // ── Funnel metadata ──
    entryCta: text("entry_cta"),
    funnelStartedAt: ts("funnel_started_at"),
    funnelCompletedAt: ts("funnel_completed_at"),
    funnelDurationSeconds: integer("funnel_duration_seconds"),
    reachedReview: boolean("reached_review").notNull().default(false),
    whatsappContinued: boolean("whatsapp_continued"),

    // ── Operations (owner-approved pipeline; validated in app layer) ──
    status: text("status").notNull().default("NEW"),
    contactedAt: ts("contacted_at"),
    quoteSentAt: ts("quote_sent_at"),
    paymentConfirmedAt: ts("payment_confirmed_at"),
    workStartedAt: ts("work_started_at"),
    deliveredAt: ts("delivered_at"),
    completedAt: ts("completed_at"),
    lostAt: ts("lost_at"),
    lostReason: text("lost_reason"),
    /** Archiving is orthogonal to status — a lead stays COMPLETED or LOST. */
    archivedAt: ts("archived_at"),

    // ── Quote (admin-only; never exposed to clients) ──
    /** Snapshot of the internal recommendation at the moment of quoting. */
    quoteRecommendedMid: integer("quote_recommended_mid"),
    /** The actual amount quoted to the client — always manually editable. */
    quotedAmount: integer("quoted_amount"),
    quoteCurrency: text("quote_currency"),
    quoteNotes: text("quote_notes"),
    /** When the actual amount was recorded (quote_sent_at is the status milestone). */
    quotedAt: ts("quoted_at"),

    // ── Notification alerting state (email is an alert, not the record) ──
    notifiedAt: ts("notified_at"),
    notifyError: text("notify_error"), // machine code only, never internals
    notifyAttempts: smallint("notify_attempts").notNull().default(0),

    // ── Deduplication (P2.2) — deterministic submission fingerprint ──
    fingerprint: text("fingerprint"),
  },
  (t) => [
    index("leads_created_at_idx").on(t.createdAt),
    index("leads_status_idx").on(t.status),
    index("leads_classification_idx").on(t.classification),
    index("leads_deadline_idx").on(t.deadline),
    index("leads_email_idx").on(t.email),
    index("leads_fingerprint_idx").on(t.fingerprint),
  ]
);

export const leadAttachments = pgTable(
  "lead_attachments",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    /** Per-lead attachment id from the funnel payload (e.g. "att_1"). */
    attachmentId: text("attachment_id").notNull(),
    /**
     * PRIVATE Blob pathname (enquiries/…) — the ONLY storage reference.
     * Never a URL. Downloads are mediated by /admin/files/[...pathname].
     */
    pathname: text("pathname").notNull().unique(),
    originalFileName: text("original_file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    category: text("category").notNull(), // AttachmentCategory key
    uploadedAt: ts("uploaded_at").notNull(),

    // ── Retention lifecycle (P2.5) — metadata survives blob deletion ──
    deletedAt: ts("deleted_at"),
    deletionReason: text("deletion_reason"), // e.g. "retention_lost" | "retention_completed" | "owner_request"
    deleteAttempts: smallint("delete_attempts").notNull().default(0),
    lastDeleteAttemptAt: ts("last_delete_attempt_at"),
    lastDeleteError: text("last_delete_error"), // machine code only
  },
  (t) => [index("lead_attachments_lead_id_idx").on(t.leadId)]
);

export const leadNotes = pgTable(
  "lead_notes",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    createdAt: ts("created_at").notNull().defaultNow(),
    body: text("body").notNull(),
  },
  (t) => [index("lead_notes_lead_id_idx").on(t.leadId)]
);

export const leadStatusEvents = pgTable(
  "lead_status_events",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    at: ts("at").notNull().defaultNow(),
    fromStatus: text("from_status"), // null for the initial NEW event
    toStatus: text("to_status").notNull(),
  },
  (t) => [index("lead_status_events_lead_id_idx").on(t.leadId)]
);

export type LeadRow = typeof leads.$inferSelect;
export type LeadInsertRow = typeof leads.$inferInsert;
export type LeadAttachmentRow = typeof leadAttachments.$inferSelect;
export type LeadAttachmentInsertRow = typeof leadAttachments.$inferInsert;
export type LeadNoteRow = typeof leadNotes.$inferSelect;
export type LeadStatusEventRow = typeof leadStatusEvents.$inferSelect;
