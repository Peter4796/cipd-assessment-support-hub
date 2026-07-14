import { describe, expect, it } from "vitest";
import {
  buildBlobPathname,
  fileExtension,
  sanitiseFileName,
  validateFile,
  MAX_FILE_BYTES,
} from "@/lib/leads/uploads";
import { normaliseAttachments } from "@/lib/leads/validation";
import { isBlobConfigured } from "@/lib/leads/uploads";
import { afterEach } from "vitest";
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

describe("isBlobConfigured (OIDC-aware availability)", () => {
  const saved = { storeId: process.env.BLOB_STORE_ID, rw: process.env.BLOB_READ_WRITE_TOKEN };
  afterEach(() => {
    if (saved.storeId === undefined) delete process.env.BLOB_STORE_ID;
    else process.env.BLOB_STORE_ID = saved.storeId;
    if (saved.rw === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = saved.rw;
  });

  it("recognises a Vercel-connected private store (BLOB_STORE_ID, no RW token)", () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    process.env.BLOB_STORE_ID = "store_test123";
    expect(isBlobConfigured()).toBe(true);
  });

  it("recognises the legacy RW-token configuration", () => {
    delete process.env.BLOB_STORE_ID;
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test";
    expect(isBlobConfigured()).toBe(true);
  });

  it("reports unavailable when neither is present", () => {
    delete process.env.BLOB_STORE_ID;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    expect(isBlobConfigured()).toBe(false);
  });
});

describe("normaliseAttachments (private store: pathname-only, URLs discarded)", () => {
  const good = {
    id: "att_1",
    originalFileName: "brief.pdf",
    pathname: "enquiries/2026-07/assessment_brief/brief.pdf",
    mimeType: "application/pdf",
    sizeBytes: 300000,
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

  it("discards any client-supplied URL — link injection is impossible by construction", () => {
    const r = normaliseAttachments([{ ...good, url: "https://phish.example/doc.pdf" }]);
    expect(Array.isArray(r)).toBe(true);
    if (Array.isArray(r)) {
      expect(JSON.stringify(r)).not.toContain("phish.example");
      expect("url" in r[0]).toBe(false);
    }
  });

  it("rejects out-of-namespace and traversal pathnames, bad categories, bad MIME, bad sizes", () => {
    expect(normaliseAttachments([{ ...good, pathname: "secrets/file.pdf" }])).toMatchObject({ error: "invalid_attachments" });
    expect(normaliseAttachments([{ ...good, pathname: "enquiries/../secrets/file.pdf" }])).toMatchObject({ error: "invalid_attachments" });
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
