/**
 * Minimal in-memory rate limiter for the lead/subscriber endpoints.
 *
 * KNOWN LIMITATION (documented, accepted for P0): state is per serverless
 * instance. On Vercel, concurrent lambdas each keep their own window, so the
 * effective global limit is (limit × warm instances). That still blunts
 * naive bots and accidental double-submits, which is the P0 goal. A shared
 * store (Upstash/KV) is the P2+ upgrade path if abuse ever materialises.
 */

type Window = { count: number; startedAt: number };

const windows = new Map<string, Window>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 8;
const MAX_KEYS = 5000; // memory guard

export function rateLimit(key: string): { allowed: boolean } {
  const now = Date.now();
  const win = windows.get(key);

  if (!win || now - win.startedAt > WINDOW_MS) {
    if (windows.size >= MAX_KEYS) windows.clear(); // crude but bounded
    windows.set(key, { count: 1, startedAt: now });
    return { allowed: true };
  }

  win.count += 1;
  return { allowed: win.count <= MAX_PER_WINDOW };
}

/** Extract a stable-enough client key from request headers. */
export function clientKey(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0].trim() : headers.get("x-real-ip") || "unknown";
  return ip;
}
