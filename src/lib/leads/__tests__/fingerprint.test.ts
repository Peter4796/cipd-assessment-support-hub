import { describe, expect, it } from "vitest";
import { DEDUP_WINDOW_MS, leadFingerprint } from "@/lib/leads/fingerprint";
import type { ValidatedLead } from "@/lib/leads/validation";

const base: ValidatedLead = {
  name: "Amina Hassan",
  email: "amina@example.com",
  level: "5",
  unitCode: "5CO01",
  supportType: "draft_review",
  wordCount: 3500,
  deadline: "2026-07-25",
  message: "Draft attached, please review against AC 1.2.",
  attachments: [
    {
      id: "att_1",
      originalFileName: "draft.docx",
      pathname: "enquiries/2026-07/existing_draft/draft-a1.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: 1000,
      uploadStatus: "uploaded",
      uploadedAt: "2026-07-15T10:00:00.000Z",
      category: "EXISTING_DRAFT",
    },
    {
      id: "att_2",
      originalFileName: "brief.pdf",
      pathname: "enquiries/2026-07/assessment_brief/brief-b2.pdf",
      mimeType: "application/pdf",
      sizeBytes: 2000,
      uploadStatus: "uploaded",
      uploadedAt: "2026-07-15T10:01:00.000Z",
      category: "ASSESSMENT_BRIEF",
    },
  ],
  reachedReview: true,
  schemaVersion: 2,
  acquisition: { sourcePage: "/pricing", sourcePageType: "pricing" },
};

describe("leadFingerprint", () => {
  it("is deterministic for identical submissions", () => {
    expect(leadFingerprint(base)).toBe(leadFingerprint({ ...base }));
    expect(leadFingerprint(base)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("ignores attachment order", () => {
    const swapped = { ...base, attachments: [...base.attachments].reverse() };
    expect(leadFingerprint(swapped)).toBe(leadFingerprint(base));
  });

  it("never matches on email alone — assessment fields distinguish", () => {
    expect(leadFingerprint({ ...base, unitCode: "5HR01" })).not.toBe(leadFingerprint(base));
    expect(leadFingerprint({ ...base, supportType: "resubmission" })).not.toBe(
      leadFingerprint(base)
    );
    expect(leadFingerprint({ ...base, deadline: "2026-07-26" })).not.toBe(leadFingerprint(base));
    expect(leadFingerprint({ ...base, wordCount: 4000 })).not.toBe(leadFingerprint(base));
    expect(leadFingerprint({ ...base, message: "Different question." })).not.toBe(
      leadFingerprint(base)
    );
  });

  it("distinguishes different clients with identical enquiries", () => {
    expect(leadFingerprint({ ...base, email: "other@example.com" })).not.toBe(
      leadFingerprint(base)
    );
  });

  it("distinguishes different uploaded files", () => {
    const other = {
      ...base,
      attachments: [
        { ...base.attachments[0], pathname: "enquiries/2026-07/existing_draft/draft-zz.docx" },
        base.attachments[1],
      ],
    };
    expect(leadFingerprint(other)).not.toBe(leadFingerprint(base));
  });

  it("does not vary on presentation-only fields (name, acquisition)", () => {
    // A double-submit sometimes reaches us with different acquisition noise;
    // the assessment-defining fields decide identity.
    expect(leadFingerprint({ ...base, name: "A. Hassan" })).toBe(leadFingerprint(base));
    expect(
      leadFingerprint({
        ...base,
        acquisition: { sourcePage: "/", sourcePageType: "home" },
      })
    ).toBe(leadFingerprint(base));
  });

  it("uses the approved 15-minute window", () => {
    expect(DEDUP_WINDOW_MS).toBe(15 * 60 * 1000);
  });
});
