import { get } from "@vercel/blob";
import { isBlobConfigured } from "@/lib/leads/uploads";

/**
 * GET /admin/files/[...pathname] — server-mediated download of PRIVATE blobs.
 *
 * ACCESS CONTROL: this route lives under /admin, so the HTTP Basic Auth
 * middleware (src/middleware.ts, fails closed on missing ADMIN_PASSWORD)
 * authenticates every request BEFORE this handler runs. Lead-notification
 * emails link here instead of to any storage URL — the browser never touches
 * the private store directly, and no storage credential ever leaves the server.
 *
 * AUTHENTICATION TO BLOB (verified against @vercel/blob 2.6.1): `get()` with
 * `access: 'private'` resolves credentials via OIDC (VERCEL_OIDC_TOKEN +
 * BLOB_STORE_ID) in Production/Preview, with BLOB_READ_WRITE_TOKEN as a
 * legacy local fallback. The blob is streamed through this route.
 */

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { pathname: string[] } }
) {
  if (!isBlobConfigured()) {
    return new Response("File storage is not configured.", { status: 503 });
  }

  const pathname = (params.pathname ?? []).map(decodeURIComponent).join("/");
  // Scope strictly to the enquiry namespace; nothing else is reachable.
  if (!pathname.startsWith("enquiries/") || pathname.includes("..")) {
    return new Response("Not found.", { status: 404 });
  }

  try {
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return new Response("Not found.", { status: 404 });
    }

    const filename = pathname.split("/").pop() ?? "document";
    const contentType = result.headers.get("content-type") ?? "application/octet-stream";
    const contentLength = result.headers.get("content-length");
    return new Response(result.stream, {
      status: 200,
      headers: {
        "content-type": contentType,
        ...(contentLength ? { "content-length": contentLength } : {}),
        "content-disposition": `attachment; filename="${filename.replace(/[^\w.\- ()\[\]]/g, "_")}"`,
        "cache-control": "private, no-store",
        "x-robots-tag": "noindex",
      },
    });
  } catch {
    // Never leak storage internals to the response.
    console.error("[admin/files] private blob read failed");
    return new Response("File could not be retrieved.", { status: 502 });
  }
}
