/**
 * Pure mapping between the lead domain model (src/lib/leads/types.ts) and
 * database rows (src/lib/db/schema.ts). No I/O — fully unit-tested.
 *
 * Conventions:
 *  - Domain timestamps are ISO strings; rows use Date (timestamptz).
 *  - Optional domain fields (undefined) become null columns and vice versa.
 *  - A lead without an explicit status persists as "NEW" (column default,
 *    made explicit here so the initial status event can reference it).
 */

import type { Lead, LeadAttachment, LeadStatus } from "@/lib/leads/types";
import type {
  LeadAttachmentInsertRow,
  LeadAttachmentRow,
  LeadInsertRow,
  LeadRow,
} from "@/lib/db/schema";

const toDate = (iso: string | undefined): Date | null => (iso ? new Date(iso) : null);
const toIso = (d: Date | null): string | undefined => (d ? d.toISOString() : undefined);

export function leadToRow(lead: Lead): LeadInsertRow {
  const created = new Date(lead.createdAt);
  return {
    id: lead.id,
    createdAt: created,
    updatedAt: created,
    schemaVersion: lead.schemaVersion,

    name: lead.name,
    email: lead.email,
    whatsapp: lead.whatsapp ?? null,
    country: lead.country ?? null,

    level: lead.level,
    unitCode: lead.unitCode ?? null,
    supportType: lead.supportType,
    submissionType: lead.submissionType ?? null,
    provider: lead.provider ?? null,
    wordCount: lead.wordCount ?? null,
    deadline: lead.deadline ?? null,
    message: lead.message ?? null,
    referredCriteria: lead.referredCriteria ?? null,

    score: lead.score,
    classification: lead.classification,

    sourcePage: lead.acquisition.sourcePage,
    sourcePageType: lead.acquisition.sourcePageType,
    referrer: lead.acquisition.referrer ?? null,
    utmSource: lead.acquisition.utmSource ?? null,
    utmMedium: lead.acquisition.utmMedium ?? null,
    utmCampaign: lead.acquisition.utmCampaign ?? null,

    entryCta: lead.funnel?.entryCta ?? null,
    funnelStartedAt: toDate(lead.funnel?.startedAt),
    funnelCompletedAt: toDate(lead.funnel?.completedAt),
    funnelDurationSeconds: lead.funnel?.durationSeconds ?? null,
    reachedReview: lead.reachedReview ?? false,
    whatsappContinued: lead.whatsappContinued ?? null,

    status: lead.status ?? "NEW",

    quotedAmount: lead.quote?.amount ?? null,
    quoteCurrency: lead.quote?.currency ?? null,
    quotedAt: toDate(lead.quote?.sentAt),
  };
}

export function attachmentRowsForLead(lead: Lead): LeadAttachmentInsertRow[] {
  return (lead.attachments ?? []).map((a: LeadAttachment) => ({
    leadId: lead.id,
    attachmentId: a.id,
    pathname: a.pathname,
    originalFileName: a.originalFileName,
    mimeType: a.mimeType,
    sizeBytes: a.sizeBytes,
    category: a.category,
    uploadedAt: new Date(a.uploadedAt),
  }));
}

/** Reconstruct the domain Lead from persisted rows (admin dashboard reads). */
export function rowToLead(row: LeadRow, attachments: LeadAttachmentRow[] = []): Lead {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    name: row.name,
    email: row.email,
    whatsapp: row.whatsapp ?? undefined,
    country: row.country ?? undefined,
    level: row.level as Lead["level"],
    unitCode: row.unitCode ?? undefined,
    supportType: row.supportType as Lead["supportType"],
    wordCount: row.wordCount ?? undefined,
    deadline: row.deadline ?? undefined,
    message: row.message ?? undefined,
    provider: row.provider ?? undefined,
    submissionType: (row.submissionType as Lead["submissionType"]) ?? undefined,
    referredCriteria: row.referredCriteria ?? undefined,
    attachments:
      attachments.length > 0 ? attachments.map(rowToAttachment) : undefined,
    reachedReview: row.reachedReview || undefined,
    funnel:
      row.entryCta || row.funnelStartedAt
        ? {
            entryCta: row.entryCta ?? undefined,
            startedAt: toIso(row.funnelStartedAt),
            completedAt: toIso(row.funnelCompletedAt),
            durationSeconds: row.funnelDurationSeconds ?? undefined,
          }
        : undefined,
    acquisition: {
      sourcePage: row.sourcePage,
      sourcePageType: row.sourcePageType as Lead["acquisition"]["sourcePageType"],
      referrer: row.referrer ?? undefined,
      utmSource: row.utmSource ?? undefined,
      utmMedium: row.utmMedium ?? undefined,
      utmCampaign: row.utmCampaign ?? undefined,
    },
    score: row.score,
    classification: row.classification as Lead["classification"],
    schemaVersion: row.schemaVersion as Lead["schemaVersion"],
    whatsappContinued: row.whatsappContinued ?? undefined,
    status: row.status as LeadStatus,
    quote:
      row.quotedAmount != null
        ? {
            amount: row.quotedAmount,
            currency: row.quoteCurrency ?? "GBP",
            sentAt: toIso(row.quotedAt),
          }
        : undefined,
  };
}

export function rowToAttachment(row: LeadAttachmentRow): LeadAttachment {
  return {
    id: row.attachmentId,
    originalFileName: row.originalFileName,
    pathname: row.pathname,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    uploadStatus: "uploaded",
    uploadedAt: row.uploadedAt.toISOString(),
    category: row.category as LeadAttachment["category"],
  };
}
