import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  encodeBlobPathname,
  mediatedFileUrl,
  normaliseOrigin,
  siteOrigin,
} from "@/lib/urls";
import { leadNotificationHtml } from "@/lib/email/templates";
import type { Lead } from "@/lib/leads/types";

const PROD = { VERCEL_ENV: "production" } as const;

describe("normaliseOrigin", () => {
  it("prefixes https:// onto a hostname-only value (VERCEL_PROJECT_PRODUCTION_URL shape)", () => {
    expect(normaliseOrigin("cipdguidance.com")).toBe("https://cipdguidance.com");
    expect(normaliseOrigin("my-app-abc123.vercel.app")).toBe("https://my-app-abc123.vercel.app");
  });

  it("does not double-prefix an already-complete https origin", () => {
    expect(normaliseOrigin("https://www.cipdguidance.com")).toBe("https://www.cipdguidance.com");
  });

  it("strips trailing slashes and stray paths safely", () => {
    expect(normaliseOrigin("https://www.cipdguidance.com/")).toBe("https://www.cipdguidance.com");
    expect(normaliseOrigin("https://www.cipdguidance.com/some/path/")).toBe("https://www.cipdguidance.com");
    expect(normaliseOrigin("cipdguidance.com/")).toBe("https://cipdguidance.com");
  });

  it("coerces http:// to https://", () => {
    expect(normaliseOrigin("http://www.cipdguidance.com")).toBe("https://www.cipdguidance.com");
  });

  it("returns null for unusable input", () => {
    expect(normaliseOrigin(undefined)).toBeNull();
    expect(normaliseOrigin("   ")).toBeNull();
    expect(normaliseOrigin("ht tp://bro ken")).toBeNull();
  });
});

describe("siteOrigin", () => {
  it("production: prefers the explicitly configured canonical origin", () => {
    expect(siteOrigin({ ...PROD, NEXT_PUBLIC_SITE_URL: "https://cipdguidance.com" })).toBe(
      "https://cipdguidance.com"
    );
  });

  it("production: falls back to https://VERCEL_PROJECT_PRODUCTION_URL when the canonical is unusable", () => {
    expect(
      siteOrigin({
        ...PROD,
        NEXT_PUBLIC_SITE_URL: "localhost:3000", // localhost is rejected in production
        VERCEL_PROJECT_PRODUCTION_URL: "cipdguidance.com", // hostname-only, no scheme
      })
    ).toBe("https://cipdguidance.com");
  });

  it("production: never emits http:// or localhost", () => {
    const origin = siteOrigin({
      ...PROD,
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      VERCEL_PROJECT_PRODUCTION_URL: "cipdguidance.com",
    });
    expect(origin.startsWith("https://")).toBe(true);
    expect(origin).not.toContain("localhost");
  });

  it("preview: links to the deployment under test via VERCEL_URL", () => {
    expect(
      siteOrigin({ VERCEL_ENV: "preview", VERCEL_URL: "cipd-hub-git-fix-abc.vercel.app" })
    ).toBe("https://cipd-hub-git-fix-abc.vercel.app");
  });

  it("defaults to the canonical www origin with no env at all", () => {
    expect(siteOrigin({})).toBe("https://www.cipdguidance.com");
  });
});

describe("encodeBlobPathname / mediatedFileUrl", () => {
  it("encodes spaces and parentheses without corrupting the slash structure", () => {
    expect(
      encodeBlobPathname("enquiries/2026-07/assessment_brief/My Brief (final).pdf")
    ).toBe("enquiries/2026-07/assessment_brief/My%20Brief%20(final).pdf");
  });

  it("builds a complete https production link", () => {
    expect(
      mediatedFileUrl("enquiries/2026-07/assessment_brief/My Brief (final)-x8f2.pdf", PROD)
    ).toBe(
      "https://www.cipdguidance.com/admin/files/enquiries/2026-07/assessment_brief/My%20Brief%20(final)-x8f2.pdf"
    );
  });
});

describe("absoluteUrl", () => {
  it("joins root-relative paths without double slashes", () => {
    expect(absoluteUrl("/privacy", PROD)).toBe("https://www.cipdguidance.com/privacy");
    expect(absoluteUrl("privacy", PROD)).toBe("https://www.cipdguidance.com/privacy");
  });
});

describe("notification email links (end to end through the template)", () => {
  const lead: Lead = {
    id: "CG-URLTEST",
    createdAt: "2026-07-14T12:00:00.000Z",
    name: "Amira",
    email: "a@example.com",
    level: "5",
    supportType: "resubmission",
    acquisition: { sourcePage: "/send-your-brief", sourcePageType: "other" },
    score: 70,
    classification: "HIGH_INTENT",
    schemaVersion: 2,
    attachments: [
      {
        id: "att_1",
        originalFileName: "My Brief (final).pdf",
        pathname: "enquiries/2026-07/assessment_brief/My Brief (final)-x8f2.pdf",
        mimeType: "application/pdf",
        sizeBytes: 300000,
        uploadStatus: "uploaded",
        uploadedAt: "2026-07-14T12:00:00.000Z",
        category: "ASSESSMENT_BRIEF",
      },
    ],
  };

  it("every file href is https on the canonical host — never http, localhost or a preview host", () => {
    const html = leadNotificationHtml(lead);
    expect(html).toContain(
      'href="https://www.cipdguidance.com/admin/files/enquiries/2026-07/assessment_brief/My%20Brief%20(final)-x8f2.pdf"'
    );
    expect(html).not.toMatch(/href="http:\/\//);
    expect(html).not.toContain("localhost");
    expect(html).not.toContain(".vercel.app");
  });
});
