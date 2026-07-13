import { describe, expect, it } from "vitest";
import {
  buildBlobPathname,
  fileExtension,
  sanitiseFileName,
  validateFile,
  MAX_FILE_BYTES,
} from "@/lib/leads/uploads";
import { normaliseAttachments, isTrustedBlobUrl } from "@/lib/leads/validation";
import { enquiryUrl } from "@/lib/leads/context";

describe("validateFile", () => {
  it("accepts the allowed document types", () => {
    expect(validateFile({ name: "brief.pdf", size: 5000, type: "application/pdf" }).ok).toBe(true);
    expect(
      validateFile({
        name: "draft.docx",
        size: 5000,
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }).ok
    ).toBe(true);
    expect(validateFile({ name: "feedback.png", size: 5000, type: "image/png" }).ok).toBe(true);
    expect(validateFile({ name: "notes.txt", size: 100, type: "text/plain" }).ok).toBe(true);
  });

  it("tolerates missing/generic declared MIME types (mobile browsers)", () => {
    expect(validateFile({ name: "brief.pdf", size: 5000, type: "" }).ok).toBe(true);
    expect(validateFile({ name: "brief.pdf", size: 5000, type: "application/octet-stream" }).ok).toBe(true);
  });

  it("rejects executables, archives, scripts and unknown formats", () => {
    for (const name of ["virus.exe", "archive.zip", "script.js", "page.html", "macro.docm", "noext"]) {
      expect(validateFile({ name, size: 5000, type: "" })).toMatchObject({
        ok: false,
        error: "file_type_not_allowed",
      });
    }
  });

  it("rejects a declared MIME that contradicts the extension", () => {
    expect(validateFile({ name: "brief.pdf", size: 5000, type: "text/html" })).toMatchObject({
      ok: false,
      error: "file_type_mismatch",
    });
  });

  it("rejects oversized and empty files at the boundary", () => {
    expect(validateFile({ name: "big.pdf", size: MAX_FILE_BYTES + 1, type: "application/pdf" })).toMatchObject({ ok: false, error: "file_too_large" });
    expect(validateFile({ name: "ok.pdf", size: MAX_FILE_BYTES, type: "application/pdf" }).ok).toBe(true);
    expect(validateFile({ name: "empty.pdf", size: 0, type: "application/pdf" })).toMatchObject({ ok: false, error: "file_empty" });
  });
});

describe("sanitiseFileName", () => {
  it("strips paths and dangerous characters, keeps the extension", () => {
    expect(sanitiseFileName("../../etc/passwd.pdf")).toBe("passwd.pdf");
    expect(sanitiseFileName("C:\\Users\\me\\My Brief.docx")).toBe("My Brief.docx");
    expect(sanitiseFileName("<script>alert.pdf")).toBe("_script_alert.pdf");
  });
  it("caps length and never returns empty", () => {
    expect(sanitiseFileName("x".repeat(300) + ".pdf").length).toBeLessThanOrEqual(85);
    expect(sanitiseFileName("???")).toBe("___");
  });
});

describe("buildBlobPathname", () => {
  it("namespaces under enquiries/ with month bucket and category", () => {
    const p = buildBlobPathname("My Brief.pdf", "ASSESSMENT_BRIEF");
    expect(p).toMatch(/^enquiries\/\d{4}-\d{2}\/assessment_brief\/My-Brief\.pdf$/);
  });
});

describe("fileExtension", () => {
  it("lowercases and handles missing extensions", () => {
    expect(fileExtension("Brief.PDF")).toBe("pdf");
    expect(fileExtension("noext")).toBe("");
  });
});

describe("isTrustedBlobUrl", () => {
  it("accepts only https Vercel Blob hosts", () => {
    expect(isTrustedBlobUrl("https://abc123.public.blob.vercel-storage.com/x.pdf")).toBe(true);
    expect(isTrustedBlobUrl("http://abc123.public.blob.vercel-storage.com/x.pdf")).toBe(false);
    expect(isTrustedBlobUrl("https://evil.com/x.pdf")).toBe(false);
    expect(isTrustedBlobUrl("https://evil.com/?u=public.blob.vercel-storage.com")).toBe(false);
    expect(isTrustedBlobUrl("javascript:alert(1)")).toBe(false);
    expect(isTrustedBlobUrl("not a url")).toBe(false);
  });
});

describe("normaliseAttachments (server re-validation)", () => {
  const good = {
    id: "att_1",
    originalFileName: "brief.pdf",
    pathname: "enquiries/2026-07/assessment_brief/brief.pdf",
    mimeType: "application/pdf",
    sizeBytes: 300000,
    url: "https://abc123.public.blob.vercel-storage.com/enquiries/2026-07/assessment_brief/brief-x1.pdf",
    category: "ASSESSMENT_BRIEF",
  };

  it("accepts a valid attachment list", () => {
    const r = normaliseAttachments([good]);
    expect(Array.isArray(r)).toBe(true);
    if (Array.isArray(r)) {
      expect(r[0].category).toBe("ASSESSMENT_BRIEF");
      expect(r[0].uploadStatus).toBe("uploaded");
    }
  });

  it("returns [] for absent attachments", () => {
    expect(normaliseAttachments(undefined)).toEqual([]);
  });

  it("rejects non-blob URLs (link injection into the notification email)", () => {
    expect(normaliseAttachments([{ ...good, url: "https://phish.example/doc.pdf" }])).toMatchObject({ error: "invalid_attachments" });
  });

  it("rejects out-of-namespace pathnames, bad categories, bad MIME, bad sizes", () => {
    expect(normaliseAttachments([{ ...good, pathname: "secrets/file.pdf" }])).toMatchObject({ error: "invalid_attachments" });
    expect(normaliseAttachments([{ ...good, category: "MALWARE" }])).toMatchObject({ error: "invalid_attachments" });
    expect(normaliseAttachments([{ ...good, mimeType: "text/html" }])).toMatchObject({ error: "invalid_attachments" });
    expect(normaliseAttachments([{ ...good, sizeBytes: 999999999 }])).toMatchObject({ error: "invalid_attachments" });
  });

  it("rejects more than the maximum number of files", () => {
    expect(normaliseAttachments(new Array(6).fill(good))).toMatchObject({ error: "too_many_files" });
  });
});

describe("enquiryUrl (P1 funnel builder)", () => {
  it("targets the funnel with validated context", () => {
    expect(enquiryUrl()).toBe("/send-your-brief");
    expect(enquiryUrl({ level: "5", unit: "5co01" })).toBe("/send-your-brief?level=5&unit=5CO01");
    expect(
      enquiryUrl({ support: "resubmission", submission: "resubmission", cta: "hero" })
    ).toBe("/send-your-brief?support=resubmission&submission=resubmission&cta=hero");
  });
});
