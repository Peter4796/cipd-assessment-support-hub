/**
 * Upload retention policy (P2.5) — pure logic, no I/O.
 *
 * Owner-approved policy (decision 5), matching the /privacy promise
 * ("uploaded documents for enquiries that do not proceed are deleted
 * periodically, normally within 90 days"):
 *
 *   A. Orphaned uploads (blob exists, no lead row — abandoned before
 *      submission): eligible 48 hours after upload.
 *   B. Enquiries that do not proceed:
 *      - LOST leads: eligible 90 days after lost_at, capped at 180 days
 *        after the original submission (a late LOST marking cannot extend
 *        retention indefinitely).
 *      - Leads that never progressed past pre-payment stages (NEW,
 *        REVIEWING, CONTACTED, QUOTE_SENT): eligible 90 days after
 *        submission — an unreviewed lead never retains documents forever.
 *   C. COMPLETED leads: eligible 180 days after completed_at.
 *   D. Proceeded-but-active leads (AWAITING_PAYMENT through DELIVERED):
 *      never auto-deleted — the documents are needed for delivery. Owner
 *      can delete per-attachment from the admin detail page at any time.
 *
 * Deletion metadata (deleted_at, reason, attempts) survives on the
 * attachment row; the blob itself is removed via the OIDC `del()` path.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export const RETENTION = {
  orphanHours: 48,
  lostDays: 90,
  lostMaxDaysFromCreation: 180,
  notProceededDays: 90,
  completedDays: 180,
  /** After this many failed blob deletions, stop retrying and surface instead. */
  maxDeleteAttempts: 10,
} as const;

/** Statuses that count as "did not proceed" while non-terminal. */
export const NOT_PROCEEDED_STATUSES = [
  "NEW",
  "REVIEWING",
  "CONTACTED",
  "QUOTE_SENT",
] as const;

export type RetentionReason =
  | "retention_lost"
  | "retention_not_proceeded"
  | "retention_completed";

export type RetentionLead = {
  status: string;
  createdAt: Date;
  lostAt: Date | null;
  completedAt: Date | null;
};

/**
 * When this lead's attachments become eligible for deletion, or null if the
 * policy retains them indefinitely (active/proceeded leads).
 */
export function retentionEligibleAt(
  lead: RetentionLead
): { at: Date; reason: RetentionReason } | null {
  if (lead.status === "LOST" && lead.lostAt) {
    const fromLost = lead.lostAt.getTime() + RETENTION.lostDays * DAY_MS;
    const cap = lead.createdAt.getTime() + RETENTION.lostMaxDaysFromCreation * DAY_MS;
    return { at: new Date(Math.min(fromLost, cap)), reason: "retention_lost" };
  }
  if ((NOT_PROCEEDED_STATUSES as readonly string[]).includes(lead.status)) {
    return {
      at: new Date(lead.createdAt.getTime() + RETENTION.notProceededDays * DAY_MS),
      reason: "retention_not_proceeded",
    };
  }
  if (lead.status === "COMPLETED" && lead.completedAt) {
    return {
      at: new Date(lead.completedAt.getTime() + RETENTION.completedDays * DAY_MS),
      reason: "retention_completed",
    };
  }
  return null;
}

export type RetentionAttachment = {
  deletedAt: Date | null;
  deleteAttempts: number;
};

/**
 * Whether an attachment should be deleted now. Idempotent by construction:
 * already-deleted rows and attempt-capped rows are never selected again.
 */
export function attachmentDeletionDue(
  lead: RetentionLead,
  attachment: RetentionAttachment,
  now: Date
): { due: true; reason: RetentionReason } | { due: false } {
  if (attachment.deletedAt !== null) return { due: false };
  if (attachment.deleteAttempts >= RETENTION.maxDeleteAttempts) return { due: false };
  const eligible = retentionEligibleAt(lead);
  if (!eligible || eligible.at.getTime() > now.getTime()) return { due: false };
  return { due: true, reason: eligible.reason };
}

/**
 * Select orphaned blobs: uploaded under enquiries/ at least 48h ago with no
 * lead_attachments row (any row, including already-deleted ones, counts as
 * "known" — tracked files are never treated as orphans).
 */
export function selectOrphanBlobs(
  blobs: { pathname: string; uploadedAt: Date }[],
  knownPathnames: ReadonlySet<string>,
  now: Date
): { pathname: string; uploadedAt: Date }[] {
  const cutoff = now.getTime() - RETENTION.orphanHours * 60 * 60 * 1000;
  return blobs.filter(
    (b) =>
      b.pathname.startsWith("enquiries/") &&
      !knownPathnames.has(b.pathname) &&
      b.uploadedAt.getTime() <= cutoff
  );
}
