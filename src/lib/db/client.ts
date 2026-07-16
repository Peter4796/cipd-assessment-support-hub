/**
 * Database client — Neon Postgres over HTTP via Drizzle.
 *
 * DRIVER CHOICE (verified against installed packages): the app runs as Vercel
 * serverless functions, so we use @neondatabase/serverless in HTTP mode — one
 * fetch per query, no TCP pool to exhaust, nothing to configure. The HTTP
 * driver does NOT support interactive transactions; atomic multi-statement
 * writes use db().batch(...), which executes as a single transaction (see
 * src/lib/db/leads.ts).
 *
 * CONFIGURATION: DATABASE_URL is provisioned by the Neon Vercel Marketplace
 * integration (Production + Preview) and pulled locally via `vercel env pull`.
 * Mirrors the isBlobConfigured() pattern: absence of the variable means the
 * feature degrades honestly rather than crashing — callers must check
 * isDbConfigured() before calling db().
 */

import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/lib/db/schema";

/** Server-only: non-public env vars inline to undefined in client bundles. */
export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

let instance: NeonHttpDatabase<typeof schema> | null = null;

export function db(): NeonHttpDatabase<typeof schema> {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("db_unconfigured");
    // cache: "no-store" is LOAD-BEARING. The Neon HTTP driver issues every
    // query through fetch(), and Next patches fetch with its Data Cache on
    // Vercel — without this, identical SELECTs (admin list, status counts)
    // can be served stale from cache even on force-dynamic pages. Database
    // reads must always hit the database. (Observed in production 2026-07-17:
    // a captured lead was invisible to cached admin queries.)
    instance = drizzle(neon(url, { fetchOptions: { cache: "no-store" } }), { schema });
  }
  return instance;
}
