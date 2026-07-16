import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side gate for the admin area.
 *
 * Protects everything under /admin with HTTP Basic Auth, using credentials from
 * environment variables (set these in Vercel → Project → Settings → Environment Variables):
 *   ADMIN_USER      (optional, defaults to "admin")
 *   ADMIN_PASSWORD  (required — until it is set, /admin is blocked entirely)
 *
 * This is a real, server-enforced lock that sits IN FRONT of the in-app demo passcode.
 */
export const config = {
  matcher: ["/admin/:path*"],
};

/**
 * Constant-time string comparison (edge-safe — no node:crypto in middleware).
 * Always walks max(a,b) bytes so timing does not leak prefix matches or
 * credential length.
 */
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length, 1);
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

export function middleware(req: NextRequest) {
  const expectedUser = process.env.ADMIN_USER || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD;

  // Fail closed: if no password is configured, do not expose the admin area.
  if (!expectedPass) {
    return new NextResponse(
      "Admin access is not configured. Set ADMIN_PASSWORD in your environment.",
      { status: 503 }
    );
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    try {
      const decoded = atob(authHeader.slice(6));
      const idx = decoded.indexOf(":");
      const user = decoded.slice(0, idx);
      const pass = decoded.slice(idx + 1);
      // Both comparisons run unconditionally — no short-circuit timing
      // signal on the username.
      const userOk = safeEqual(user, expectedUser);
      const passOk = safeEqual(pass, expectedPass);
      if (userOk && passOk) {
        return NextResponse.next();
      }
    } catch {
      /* fall through to challenge */
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="CIPD Guidance Admin", charset="UTF-8"' },
  });
}
