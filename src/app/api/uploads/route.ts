import { NextResponse } from "next/server";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { issueSignedToken } from "@vercel/blob";
import { clientKey, rateLimit } from "@/lib/leads/rate-limit";
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_BYTES,
  fileExtension,
  isBlobConfigured,
} from "@/lib/leads/uploads";

/**
 * POST /api/uploads — authorises client uploads to the PRIVATE Blob store.
 *
 * AUTHENTICATION (verified against @vercel/blob 2.6.1):
 * This route uses the presigned flow — the only client-upload path that
 * supports Vercel OIDC. `issueSignedToken` → `requestApi` → `resolveBlobAuth`
 * authenticates with VERCEL_OIDC_TOKEN (runtime) + BLOB_STORE_ID (from the
 * connected store). No static BLOB_READ_WRITE_TOKEN is required; if one is
 * present it is used as a legacy fallback by the same resolver. The classic
 * `handleUpload` flow is NOT used because it can only mint client tokens from
 * a static read-write token.
 *
 * Flow:
 *   1. Browser calls uploadPresigned() with handleUploadUrl = this route.
 *   2. getSignedToken validates the pathname and issues a short-lived signed
 *      token with server-pinned constraints (content types, max size, put-only).
 *   3. handleUploadPresigned returns a presigned control-plane PUT URL.
 *   4. The browser uploads directly to the private store; the browser never
 *      receives store credentials, only the single-use presigned URL.
 *   5. Upload-completed callbacks are signature-verified against
 *      BLOB_WEBHOOK_PUBLIC_KEY (SDK default), provisioned with the store.
 *
 * GET /api/uploads — availability probe for honest UI degradation.
 */

export const runtime = "nodejs";

const TOKEN_TTL_MS = 10 * 60 * 1000; // presigned tokens live 10 minutes

export function GET() {
  return NextResponse.json({ available: isBlobConfigured() });
}

export async function POST(request: Request) {
  if (!isBlobConfigured()) {
    return NextResponse.json({ ok: false, error: "upload_unavailable" }, { status: 503 });
  }
  if (!rateLimit(`uploads:${clientKey(request.headers)}`).allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: HandleUploadPresignedBody;
  try {
    body = (await request.json()) as HandleUploadPresignedBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        // Server-side validation regardless of what the client built.
        if (!pathname.startsWith("enquiries/")) {
          throw new Error("invalid_pathname");
        }
        const ext = fileExtension(pathname);
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          throw new Error("file_type_not_allowed");
        }
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          allowedContentTypes: ALLOWED_MIME_TYPES,
          maximumSizeInBytes: MAX_FILE_BYTES,
          validUntil: Date.now() + TOKEN_TTL_MS,
        });
        return {
          token,
          urlOptions: {
            addRandomSuffix: true, // never allow pathname collisions/guessing
          },
        };
      },
      // No DB yet — attachment metadata is carried on the lead submission.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (err) {
    const code = err instanceof Error ? err.message : "upload_failed";
    const known = ["invalid_pathname", "file_type_not_allowed"];
    // Never leak internals; return a known code or a generic one.
    console.error(`[uploads] presign failed (${known.includes(code) ? code : "internal"})`);
    return NextResponse.json(
      { ok: false, error: known.includes(code) ? code : "upload_failed" },
      { status: 400 }
    );
  }
}
