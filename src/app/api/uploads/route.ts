import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { clientKey, rateLimit } from "@/lib/leads/rate-limit";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_BYTES,
  fileExtension,
  ALLOWED_EXTENSIONS,
} from "@/lib/leads/uploads";

/**
 * POST /api/uploads — authorises client-side uploads to Vercel Blob.
 *
 * Flow (the canonical @vercel/blob client-upload pattern):
 *   1. The funnel's uploader calls upload() with handleUploadUrl = this route.
 *   2. onBeforeGenerateToken validates the pathname extension and pins the
 *      allowed content types + size limit into the short-lived client token —
 *      the Blob service itself then enforces them during the direct upload.
 *   3. The browser uploads straight to Blob storage (never through us).
 *
 * SECURITY MODEL: blobs are public-with-unguessable-URL (random suffix always
 * on). URLs are surfaced only in the internal lead notification. See
 * docs/lead-acquisition.md for the full review and retention policy.
 *
 * GET /api/uploads — availability probe: tells the funnel whether document
 * upload is configured (BLOB_READ_WRITE_TOKEN present) so the UI can degrade
 * honestly to "share via WhatsApp/email after submitting" when it is not.
 */

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ available: Boolean(process.env.BLOB_READ_WRITE_TOKEN) });
}

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ ok: false, error: "upload_unavailable" }, { status: 503 });
  }
  // Generous but real: an enquiry needs ≤5 files; allow retries and multiple
  // enquiries per office/NAT without letting a bot hammer the token endpoint.
  if (!rateLimit(`uploads:${clientKey(request.headers)}`).allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // The pathname was built client-side by buildBlobPathname(); verify
        // the namespace and extension server-side regardless.
        if (!pathname.startsWith("enquiries/")) {
          throw new Error("invalid_pathname");
        }
        const ext = fileExtension(pathname);
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          throw new Error("file_type_not_allowed");
        }
        return {
          allowedContentTypes: ALLOWED_MIME_TYPES,
          maximumSizeInBytes: MAX_FILE_BYTES,
          addRandomSuffix: true, // unguessable capability URLs — never disable
          tokenPayload: "", // no PII in token payloads
        };
      },
      // Upload completion is recorded on the lead itself at submission time;
      // nothing to persist here yet (no DB in P1).
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (err) {
    const code = err instanceof Error ? err.message : "upload_failed";
    const known = ["invalid_pathname", "file_type_not_allowed"];
    // Never leak internals; return a known code or a generic one.
    return NextResponse.json(
      { ok: false, error: known.includes(code) ? code : "upload_failed" },
      { status: 400 }
    );
  }
}
