/**
 * Centralised absolute-URL construction (server-side).
 *
 * Every absolute link that leaves the application (notification emails today;
 * any future transactional message) must be built here. Guarantees:
 *   - always HTTPS in Production — http:// input is coerced, never emitted;
 *   - never localhost / 127.x / preview hostnames in Production links;
 *   - hostname-only env values (VERCEL_PROJECT_PRODUCTION_URL has no scheme)
 *     are handled without double-prefixing complete origins;
 *   - trailing slashes and stray paths are stripped via URL.origin;
 *   - blob pathnames are encoded per-segment so slashes survive intact.
 *
 * Origin resolution order:
 *   Production:  explicit canonical (NEXT_PUBLIC_SITE_URL || site.url)
 *                → https://${VERCEL_PROJECT_PRODUCTION_URL}
 *   Preview:     https://${VERCEL_URL} (links point at the deployment under
 *                test) → canonical fallback
 *   Dev/local:   canonical (localhost permitted only outside Production)
 *
 * SEO surfaces (metadataBase, sitemap, canonicals, JSON-LD) intentionally keep
 * using the `site.url` constant directly — build-time, stable, unchanged here.
 */

import { site } from "@/lib/site";

export type UrlEnv = {
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_ENV?: string; // 'production' | 'preview' | 'development'
  VERCEL_URL?: string; // hostname only, no scheme
  VERCEL_PROJECT_PRODUCTION_URL?: string; // hostname only, no scheme
};

/**
 * Normalise any origin-ish input (hostname or full URL) to a clean
 * `https://host[:port]` origin. Returns null for unusable input.
 */
export function normaliseOrigin(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  // Prefix a scheme only when absent — never double-prefix a complete origin.
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    // Force HTTPS; email links must never be plain http.
    url.protocol = "https:";
    return url.origin; // strips paths, queries and trailing slashes
  } catch {
    return null;
  }
}

function isLocalHostname(origin: string): boolean {
  try {
    const host = new URL(origin).hostname;
    return (
      host === "localhost" ||
      host === "0.0.0.0" ||
      host.startsWith("127.") ||
      host.endsWith(".local")
    );
  } catch {
    return true;
  }
}

/**
 * The origin for outbound absolute links. Pass `env` explicitly in tests;
 * defaults to process.env at runtime.
 */
export function siteOrigin(env: UrlEnv = process.env as UrlEnv): string {
  const canonical = normaliseOrigin(env.NEXT_PUBLIC_SITE_URL) ?? normaliseOrigin(site.url);

  if (env.VERCEL_ENV === "preview") {
    // Preview links target the deployment being tested, not production.
    return normaliseOrigin(env.VERCEL_URL) ?? canonical ?? "https://localhost";
  }

  const isProduction = env.VERCEL_ENV === "production";
  const candidates = isProduction
    ? [canonical, normaliseOrigin(env.VERCEL_PROJECT_PRODUCTION_URL)]
    : [canonical, normaliseOrigin(env.VERCEL_PROJECT_PRODUCTION_URL)];

  for (const origin of candidates) {
    if (!origin) continue;
    // Production must never link to localhost-style hosts.
    if (isProduction && isLocalHostname(origin)) continue;
    return origin;
  }
  // Unreachable with the compiled-in site.url constant, but stay total.
  return "https://www.cipdguidance.com";
}

/** Join an absolute URL from a root-relative path. */
export function absoluteUrl(path: string, env: UrlEnv = process.env as UrlEnv): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${siteOrigin(env)}${clean}`;
}

/** Encode a slash-separated blob pathname without corrupting its structure. */
export function encodeBlobPathname(pathname: string): string {
  return pathname
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/**
 * Server-mediated download link for a private blob: the Basic-Auth-protected
 * /admin/files route. No storage URL or credential is ever emailed.
 */
export function mediatedFileUrl(pathname: string, env: UrlEnv = process.env as UrlEnv): string {
  return absoluteUrl(`/admin/files/${encodeBlobPathname(pathname)}`, env);
}
