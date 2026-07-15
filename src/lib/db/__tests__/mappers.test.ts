import { describe, expect, it } from "vitest";
import {
  attachmentRowsForLead,
  leadToRow,
  rowToAttachment,
  rowToLead,
} from "@/lib/db/mappers";
import type { LeadAttachmentRow, LeadRow } from "@/lib/db/schema";
import {
  LEAD_STATUSES,
  LOSABLE_LEAD_STATUSES,
  TERMINAL_LEAD_STATUSES,
  type Lead,
} from "@/lib/leads/types";

/** A complete P1 funnel lead exercising every persisted field. */
const fullLead: Lead = {
  id: "CG-7K2M9Q",
  createdAt: "2026-07-15T10:30:00.000Z",
  name: "Amina Hassan",
  email: "amina@example.com",
  whatsapp: "+971 50 123 4567",
  country: "United Arab Emirates",
  level: "7",
  unitCode: "7CO03",
  supportType: "resubmission",
  wordCount: 3500,
  deadline: "2026-07-20",
  message: "Referred on two criteria, need help interpreting the feedback.",
  provider: "Avado",
  submissionType: "resubmission",
  referredCriteria: "AC 2.1 and AC 3.2 marked as not yet met.",
  attachments: [
    {
      id: "att_1",
      originalFileName: "assessment-brief.pdf",
      pathname: "enquiries/2026-07/assessment_brief/assessment-brief-x7Yz.pdf",
      mimeType: "application/pdf",
      sizeBytes: 123456,
      uploadStatus: "uploaded",
      uploadedAt: "2026-07-15T10:25:00.000Z",
      category: "ASSESSMENT_BRIEF",
    },
    {
      id: "att_2",
      originalFileName: "tutor feedback.docx",
      pathname: "enquiries/2026-07/tutor_feedback/tutor-feedback-a1Bc.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: 45678,
      uploadStatus: "uploaded",
      uploadedAt: "2026-07-15T10:26:00.000Z",
      category: "TUTOR_FEEDBACK",
    },
  ],
  funnel: {
    entryCta: "hero",
    startedAt: "2026-07-15T10:20:00.000Z",
    completedAt: "2026-07-15T10:30:00.000Z",
    durationSeconds: 600,
  },
  reachedReview: true,
  acquisition: {
    sourcePage: "/cipd-resubmission-support",
    sourcePageType: "service",
    referrer: "https://www.google.com/",
    utmSource: "google",
    utmMedium: "organic",
    utmCampaign: undefined,
  },
  score: 132,
  classification: "PRIORITY",
  schemaVersion: 2,
};

/** A minimal P0 contact-form lead: every optional field absent. */
const minimalLead: Lead = {
  id: "CG-AB12CD",
  createdAt: "2026-07-15T09:00:00.000Z",
  name: "Sam Ody",
  email: "sam@example.com",
  level: "3",
  supportType: "assessment_guidance",
  acquisition: { sourcePage: "/contact", sourcePageType: "other" },
  score: 10,
  classification: "LOW_INTENT",
  schemaVersion: 1,
};

/** Simulate a round-trip through Postgres: insert row → select row. */
function asSelectedLeadRow(lead: Lead): LeadRow {
  const insert = leadToRow(lead);
  return {
    // Columns with defaults, as the DB would return them.
    status: "NEW",
    reachedReview: false,
    notifyAttempts: 0,
    whatsapp: null,
    country: null,
    unitCode: null,
    submissionType: null,
    provider: null,
    wordCount: null,
    deadline: null,
    message: null,
    referredCriteria: null,
    referrer: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    entryCta: null,
    funnelStartedAt: null,
    funnelCompletedAt: null,
    funnelDurationSeconds: null,
    whatsappContinued: null,
    contactedAt: null,
    quoteSentAt: null,
    paymentConfirmedAt: null,
    workStartedAt: null,
    deliveredAt: null,
    completedAt: null,
    lostAt: null,
    lostReason: null,
    archivedAt: null,
    quoteRecommendedMid: null,
    quotedAmount: null,
    quoteCurrency: null,
    quoteNotes: null,
    quotedAt: null,
    notifiedAt: null,
    notifyError: null,
    fingerprint: null,
    ...insert,
  } as LeadRow;
}

function asSelectedAttachmentRows(lead: Lead): LeadAttachmentRow[] {
  return attachmentRowsForLead(lead).map((row, i) => ({
    id: i + 1,
    deletedAt: null,
    deletionReason: null,
    deleteAttempts: 0,
    lastDeleteAttemptAt: null,
    lastDeleteError: null,
    ...row,
  })) as LeadAttachmentRow[];
}

describe("leadToRow", () => {
  it("maps every domain field of a full funnel lead", () => {
    const row = leadToRow(fullLead);
    expect(row.id).toBe("CG-7K2M9Q");
    expect(row.createdAt).toEqual(new Date("2026-07-15T10:30:00.000Z"));
    expect(row.updatedAt).toEqual(row.createdAt);
    expect(row.schemaVersion).toBe(2);
    expect(row.name).toBe("Amina Hassan");
    expect(row.email).toBe("amina@example.com");
    expect(row.whatsapp).toBe("+971 50 123 4567");
    expect(row.country).toBe("United Arab Emirates");
    expect(row.level).toBe("7");
    expect(row.unitCode).toBe("7CO03");
    expect(row.supportType).toBe("resubmission");
    expect(row.submissionType).toBe("resubmission");
    expect(row.provider).toBe("Avado");
    expect(row.wordCount).toBe(3500);
    expect(row.deadline).toBe("2026-07-20");
    expect(row.referredCriteria).toContain("AC 2.1");
    expect(row.score).toBe(132);
    expect(row.classification).toBe("PRIORITY");
    expect(row.sourcePage).toBe("/cipd-resubmission-support");
    expect(row.sourcePageType).toBe("service");
    expect(row.referrer).toBe("https://www.google.com/");
    expect(row.utmSource).toBe("google");
    expect(row.utmCampaign).toBeNull();
    expect(row.entryCta).toBe("hero");
    expect(row.funnelStartedAt).toEqual(new Date("2026-07-15T10:20:00.000Z"));
    expect(row.funnelDurationSeconds).toBe(600);
    expect(row.reachedReview).toBe(true);
  });

  it("defaults a fresh lead to status NEW", () => {
    expect(leadToRow(fullLead).status).toBe("NEW");
    expect(leadToRow(minimalLead).status).toBe("NEW");
  });

  it("persists absent optional fields as null on a minimal v1 lead", () => {
    const row = leadToRow(minimalLead);
    expect(row.schemaVersion).toBe(1);
    expect(row.whatsapp).toBeNull();
    expect(row.unitCode).toBeNull();
    expect(row.wordCount).toBeNull();
    expect(row.deadline).toBeNull();
    expect(row.message).toBeNull();
    expect(row.submissionType).toBeNull();
    expect(row.entryCta).toBeNull();
    expect(row.funnelStartedAt).toBeNull();
    expect(row.reachedReview).toBe(false);
    expect(row.quotedAmount).toBeNull();
  });

  it("never produces a URL-like storage field", () => {
    // The attachment model is pathname-only by construction; the lead row
    // must not smuggle raw storage URLs either.
    const values = Object.values(leadToRow(fullLead)).filter(
      (v): v is string => typeof v === "string"
    );
    for (const v of values) {
      expect(v).not.toMatch(/blob\.vercel-storage\.com/);
    }
  });
});

describe("attachmentRowsForLead", () => {
  it("maps each attachment with pathname as the only storage reference", () => {
    const rows = attachmentRowsForLead(fullLead);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      leadId: "CG-7K2M9Q",
      attachmentId: "att_1",
      pathname: "enquiries/2026-07/assessment_brief/assessment-brief-x7Yz.pdf",
      originalFileName: "assessment-brief.pdf",
      mimeType: "application/pdf",
      sizeBytes: 123456,
      category: "ASSESSMENT_BRIEF",
    });
    expect(rows[0].uploadedAt).toEqual(new Date("2026-07-15T10:25:00.000Z"));
    expect(Object.keys(rows[0])).not.toContain("url");
  });

  it("returns no rows for a lead without attachments", () => {
    expect(attachmentRowsForLead(minimalLead)).toEqual([]);
  });
});

describe("rowToLead round-trip", () => {
  it("reconstructs a full funnel lead from persisted rows", () => {
    const lead = rowToLead(
      asSelectedLeadRow(fullLead),
      asSelectedAttachmentRows(fullLead)
    );
    expect(lead).toEqual({ ...fullLead, status: "NEW" });
  });

  it("reconstructs a minimal v1 lead without inventing fields", () => {
    const lead = rowToLead(asSelectedLeadRow(minimalLead));
    expect(lead).toEqual({
      ...minimalLead,
      reachedReview: undefined,
      status: "NEW",
    });
    expect(lead.attachments).toBeUndefined();
    expect(lead.funnel).toBeUndefined();
    expect(lead.quote).toBeUndefined();
  });

  it("round-trips attachment rows faithfully", () => {
    const [row] = asSelectedAttachmentRows(fullLead);
    expect(rowToAttachment(row)).toEqual(fullLead.attachments![0]);
  });

  it("maps a recorded quote back onto the lead", () => {
    const row = {
      ...asSelectedLeadRow(fullLead),
      quotedAmount: 180,
      quoteCurrency: "USD",
      quotedAt: new Date("2026-07-16T09:00:00.000Z"),
    };
    expect(rowToLead(row).quote).toEqual({
      amount: 180,
      currency: "USD",
      sentAt: "2026-07-16T09:00:00.000Z",
    });
  });
});

describe("status model constants", () => {
  it("matches the owner-approved ten-status pipeline", () => {
    expect(LEAD_STATUSES).toEqual([
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
    ]);
  });

  it("declares exactly COMPLETED and LOST as terminal", () => {
    expect(TERMINAL_LEAD_STATUSES).toEqual(["COMPLETED", "LOST"]);
  });

  it("allows LOST from every pre-fulfilment stage", () => {
    expect(LOSABLE_LEAD_STATUSES).toEqual([
      "NEW",
      "REVIEWING",
      "CONTACTED",
      "QUOTE_SENT",
      "AWAITING_PAYMENT",
    ]);
  });
});
