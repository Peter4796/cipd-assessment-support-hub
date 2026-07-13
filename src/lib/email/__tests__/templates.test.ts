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
};

describe("leadNotificationSubject", () => {
  it("follows the [CLASSIFICATION] level — unit — support format", () => {
    expect(leadNotificationSubject(lead)).toBe(
      "[PRIORITY] New CIPD Lead — Level 5 — 5HR01 — Resubmission support"
    );
    expect(leadNotificationSubject(lead)).toContain("[PRIORITY]");
    expect(leadNotificationSubject(lead)).toContain("Level 5");
    expect(leadNotificationSubject(lead)).toContain("5HR01");
    expect(leadNotificationSubject(lead)).toContain("Resubmission support");
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

describe("esc", () => {
  it("escapes the five HTML-significant characters", () => {
    expect(esc(`<a href="x" & 'y'>`)).toBe("&lt;a href=&quot;x&quot; &amp; &#39;y&#39;&gt;");
  });
});
