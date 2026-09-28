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
  uniqueIndex,
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
    /** First-touch landing path (nullable: storage-blocked sessions). */
    landingPage: text("landing_page"),
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

    // ── Realised revenue (P0.4) — conceptually DISTINCT from the quote ──
    /**
     * Actual amount received, recorded manually from admin today. Future
     * payment automation must write these same three fields (plus its own
     * provider metadata elsewhere) rather than redefining the model.
     */
    paidAmount: integer("paid_amount"),
    paidCurrency: text("paid_currency"),
    /** When payment was recorded (payment_confirmed_at remains the status milestone). */
    paidAt: ts("paid_at"),

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

/**
 * Lead-magnet subscribers (P0.3, 2026-08) — one row per submission event.
 * Deliberately NOT leads: downloading a resource is a nurture signal, not an
 * enquiry, and must never create a lead record. Grain is per-submission so
 * magnet conversion is measurable; analysis dedupes by email where needed.
 * Enquiry linkage happens at analysis time by email join — no cross-table
 * foreign keys, no tracking identifiers. Resend remains the delivery and
 * audience system; this table is the first-party measurement record.
 */
export const subscribers = pgTable(
  "subscribers",
  {
    id: text("id").primaryKey(), // crypto.randomUUID()
    createdAt: ts("created_at").notNull(),
    name: text("name"),
    email: text("email").notNull(),
    level: text("level"),
    country: text("country"),
    /** Magnet identity: the resource slug, e.g. "cipd-resubmission-planner". */
    resource: text("resource").notNull(),
    // ── Acquisition (same model as leads; landing_page = first touch) ──
    sourcePage: text("source_page").notNull(),
    landingPage: text("landing_page"),
    sourcePageType: text("source_page_type").notNull(),
    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
  },
  (t) => [
    index("subscribers_created_at_idx").on(t.createdAt),
    index("subscribers_email_idx").on(t.email),
    index("subscribers_resource_idx").on(t.resource),
  ]
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

/**
 * Notifications ledger (Escalation P1, 2026-09) — one row per one-shot
 * outbound notification, the idempotency and observability record for the
 * lead response system. The UNIQUE dedupe_key is the whole contract:
 * "<leadId>:ack", "<leadId>:escalation_1", "<leadId>:escalation_2",
 * "digest:<owner-local YYYY-MM-DD>". Claim/attempt semantics live in
 * src/lib/db/notifications.ts. Stores machine codes and provider ids only —
 * never message bodies, assessment content or document URLs. Rows cascade
 * with their lead, inheriting the retention policy; digest rows have no
 * lead and are trivially small.
 */
export const notifications = pgTable(
  "notifications",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    /** Null for non-lead kinds (daily digest). */
    leadId: text("lead_id").references(() => leads.id, { onDelete: "cascade" }),
    dedupeKey: text("dedupe_key").notNull(),
    kind: text("kind").notNull(), // "ack" | "escalation_1" | "escalation_2" | "digest"
    channel: text("channel").notNull(), // "email" | "sms"
    /** "claimed" (in flight) | "sent" | "failed" | "skipped". */
    status: text("status").notNull(),
    attempts: smallint("attempts").notNull().default(0),
    providerId: text("provider_id"),
    errorCode: text("error_code"), // machine code only
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("notifications_dedupe_key_idx").on(t.dedupeKey),
    index("notifications_lead_id_idx").on(t.leadId),
  ]
);

export type NotificationRow = typeof notifications.$inferSelect;

export type LeadRow = typeof leads.$inferSelect;
export type LeadInsertRow = typeof leads.$inferInsert;
export type LeadAttachmentRow = typeof leadAttachments.$inferSelect;
export type LeadAttachmentInsertRow = typeof leadAttachments.$inferInsert;
export type LeadNoteRow = typeof leadNotes.$inferSelect;
export type LeadStatusEventRow = typeof leadStatusEvents.$inferSelect;
