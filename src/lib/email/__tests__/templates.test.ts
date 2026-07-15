import { describe, expect, it } from "vitest";
import { esc, leadNotificationHtml, leadNotificationSubject } from "@/lib/email/templates";
import type { Lead } from "@/lib/leads/types";

const lead: Lead = {
  id: "CG-TEST01",
  createdAt: "2026-07-13T12:00:00.000Z",
  name: "Amira <script>alert(1)</script>",
  email: "amira@example.com",
  whatsapp: "+971 50 123 4567",
  country: "United Arab Emirates",
  level: "5",
  unitCode: "5HR01",
  supportType: "resubmission",
  wordCount: 3500,
  deadline: "2026-07-16",
  message: 'Feedback said "more analysis" & <b>depth</b>',
  acquisition: {
    sourcePage: "/cipd-units/5hr01",
    sourcePageType: "unit",
    utmSource: "google",
  },
  score: 70,
  classification: "PRIORITY",
  submissionType: "resubmission",
  schemaVersion: 2,
};

describe("leadNotificationSubject (P1 format)", () => {
  it("follows '[CLS] CIPD Level N What — unit — Due date'", () => {
    expect(leadNotificationSubject(lead)).toBe(
      "[PRIORITY] CIPD Level 5 Resubmission — 5HR01 — Due 16 July"
    );
  });
  it("omits missing parts gracefully", () => {
    const minimal = { ...lead, unitCode: undefined, deadline: undefined, supportType: "draft_review" as const, submissionType: undefined };
    expect(leadNotificationSubject(minimal)).toBe(
      "[PRIORITY] CIPD Level 5 Draft review and improvement"
    );
  });
});

describe("leadNotificationHtml", () => {
  const html = leadNotificationHtml(lead);

  it("displays classification and score prominently", () => {
    expect(html).toContain("PRIORITY LEAD");
    expect(html).toContain("Score: 70");
  });

  it("escapes ALL user-controlled content", () => {
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<b>depth</b>");
  });

  it("includes contact, assessment and acquisition sections", () => {
    for (const s of ["CONTACT", "ASSESSMENT", "CLIENT MESSAGE", "ACQUISITION", "NEXT ACTION"]) {
      expect(html).toContain(s);
    }
    expect(html).toContain("5HR01");
    expect(html).toContain("/cipd-units/5hr01");
  });

  it("offers a WhatsApp reply action when a number exists", () => {
    expect(html).toContain("wa.me/971501234567");
  });

  it("falls back to a mailto action without a number", () => {
    const noWa = leadNotificationHtml({ ...lead, whatsapp: undefined });
    expect(noWa).toContain("mailto:amira@example.com");
    expect(noWa).not.toContain("wa.me/");
  });
});

describe("leadNotificationHtml — documents (P1)", () => {
  it("warns when the assessment brief is missing", () => {
    const html = leadNotificationHtml(lead); // fixture has no attachments
    expect(html).toContain("Assessment brief not uploaded");
    expect(html).toContain("Resubmission without tutor feedback");
  });

  it("lists uploaded files as links and drops the warnings", () => {
    const withFiles = leadNotificationHtml({
      ...lead,
      attachments: [
        {
          id: "att_1",
          originalFileName: "5HR01-brief.pdf",
          pathname: "enquiries/2026-07/assessment_brief/5HR01-brief-x8f2.pdf",
          mimeType: "application/pdf",
          sizeBytes: 300000,
          uploadStatus: "uploaded",
          uploadedAt: "2026-07-13T12:00:00.000Z",
          category: "ASSESSMENT_BRIEF",
        },
        {
          id: "att_2",
          originalFileName: "feedback.png",
          pathname: "enquiries/2026-07/tutor_feedback/feedback-k2j9.png",
          mimeType: "image/png",
          sizeBytes: 120000,
          uploadStatus: "uploaded",
          uploadedAt: "2026-07-13T12:00:00.000Z",
          category: "TUTOR_FEEDBACK",
        },
      ],
    });
    expect(withFiles).toContain("DOCUMENTS (2)");
    // Explicit download-action labels: "Download <category> — <filename>"
    expect(withFiles).toContain("Download Assessment brief — 5HR01-brief.pdf");
    expect(withFiles).toContain("Download Tutor / assessor feedback — feedback.png");
    // Links are server-mediated through the Basic-Auth admin route — never a
    // storage URL or credential — and always the direct HTTPS URL.
    expect(withFiles).toContain(
      'href="https://www.cipdguidance.com/admin/files/enquiries/2026-07/assessment_brief/5HR01-brief-x8f2.pdf"'
    );
    expect(withFiles).not.toContain("blob.vercel-storage.com");
    expect(withFiles).not.toContain("BLOB_READ_WRITE_TOKEN");
    expect(withFiles).not.toContain("vercel_blob_rw");
    expect(withFiles).not.toContain("Assessment brief not uploaded");
    expect(withFiles).not.toContain("Resubmission without tutor feedback");
    // Plain current-tab anchors: webmail must not receive any excuse to spawn
    // orphaned tabs, and no scripting behaviour may ever appear in email HTML.
    expect(withFiles).not.toContain("target=");
    expect(withFiles).not.toContain("_blank");
    expect(withFiles).not.toContain("window.open");
    expect(withFiles).not.toContain("javascript:");
  });

  it("escapes hostile filenames inside the download label", () => {
    const html = leadNotificationHtml({
      ...lead,
      attachments: [
        {
          id: "att_x",
          originalFileName: 'Brief "<img src=x onerror=alert(1)>".pdf',
          pathname: "enquiries/2026-07/assessment_brief/brief-x9.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1000,
          uploadStatus: "uploaded",
          uploadedAt: "2026-07-14T12:00:00.000Z",
          category: "ASSESSMENT_BRIEF",
        },
      ],
    });
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("shows submission type, referred criteria and provider", () => {
    const html = leadNotificationHtml({
      ...lead,
      referredCriteria: "AC 2.1 and AC 3.2",
      provider: "ICS Learn",
    });
    expect(html).toContain("RESUBMISSION");
    expect(html).toContain("AC 2.1 and AC 3.2");
    expect(html).toContain("ICS Learn");
  });
});

describe("esc", () => {
  it("escapes the five HTML-significant characters", () => {
    expect(esc(`<a href="x" & 'y'>`)).toBe("&lt;a href=&quot;x&quot; &amp; &#39;y&#39;&gt;");
  });
});
