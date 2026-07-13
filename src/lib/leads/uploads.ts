/**
 * Upload rules + pure helpers — shared by the client uploader and the
 * server-side Blob token handler so limits can never drift apart.
 *
 * SECURITY MODEL (documented decision — see docs/lead-acquisition.md):
 * Vercel Blob client uploads are public-with-unguessable-URL. Every stored
 * file gets a random suffix (capability URL); there is no directory listing;
 * URLs are surfaced ONLY inside the internal lead-notification email. This is
 * equivalent to "anyone with the link" sharing. True private/authenticated
 * storage is the P2 upgrade (files behind the admin dashboard + DB).
 *
 * Malware scanning is NOT implemented — files are never executed or rendered
 * server-side, and the only consumer is the business owner opening them
 * deliberately. Future approach: scan-on-upload via a queue before exposing
 * links (P2+).
 */

import type { AttachmentCategory } from "@/lib/leads/types";

// ─── Limits (single source of truth) ───
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILES = 5;

/** extension → allowed MIME types for that extension */
export const ALLOWED_TYPES: Record<string, string[]> = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  txt: ["text/plain"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
};

export const ALLOWED_EXTENSIONS = Object.keys(ALLOWED_TYPES);
export const ALLOWED_MIME_TYPES = Array.from(new Set(Object.values(ALLOWED_TYPES).flat()));

export const ACCEPT_ATTRIBUTE = ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",");

export function fileExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? "" : name.slice(idx + 1).toLowerCase();
}

/**
 * Validate a candidate file. Checks extension allowlist, declared MIME type
 * against the extension's expected types, and size. The declared MIME type is
 * client-controlled, so the extension allowlist is the primary gate — a lie
 * about MIME cannot smuggle a disallowed extension, and allowed formats are
 * never executed or rendered by the server.
 */
export function validateFile(file: { name: string; size: number; type: string }):
  | { ok: true }
  | { ok: false; error: string } {
  const ext = fileExtension(file.name);
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return { ok: false, error: "file_type_not_allowed" };
  }
  // Tolerate an empty/generic declared type (some mobile browsers send none),
  // but reject a declared type that contradicts the extension.
  if (file.type && file.type !== "application/octet-stream" && !ALLOWED_TYPES[ext].includes(file.type)) {
    return { ok: false, error: "file_type_mismatch" };
  }
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: "file_too_large" };
  if (file.size <= 0) return { ok: false, error: "file_empty" };
  return { ok: true };
}

/** Strip paths/control chars, collapse whitespace, cap length, keep extension. */
export function sanitiseFileName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() || "file";
  const ext = fileExtension(base);
  const stem = (ext ? base.slice(0, -(ext.length + 1)) : base)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[^\w\- .()\[\]]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "file";
  return ext ? `${stem}.${ext}` : stem;
}

/** Blob pathname: namespaced, month-bucketed, sanitised. Random suffix is added by Blob. */
export function buildBlobPathname(originalName: string, category: AttachmentCategory): string {
  const safe = sanitiseFileName(originalName).replace(/\s/g, "-");
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  return `enquiries/${month}/${category.toLowerCase()}/${safe}`;
}

export function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function uploadErrorMessage(code: string): string {
  switch (code) {
    case "file_type_not_allowed":
      return `That file type isn't supported. Please upload ${ALLOWED_EXTENSIONS.map((e) => e.toUpperCase()).join(", ")}.`;
    case "file_type_mismatch":
      return "The file's type doesn't match its extension. Please re-save it and try again.";
    case "file_too_large":
      return "That file is over the 10 MB limit. Please compress it or split it.";
    case "file_empty":
      return "That file appears to be empty.";
    case "too_many_files":
      return `You can upload up to ${MAX_FILES} files.`;
    case "upload_unavailable":
      return "Document upload isn't available right now. You can still send your enquiry and share files on WhatsApp or by email afterwards.";
    default:
      return "The upload didn't complete. Please try again.";
  }
}
