import { readFileSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit does not load .env.local (where `vercel env pull` writes
// DATABASE_URL), so fall back to reading it directly — CLI context only.
if (!process.env.DATABASE_URL) {
  try {
    const match = readFileSync(".env.local", "utf8").match(/^DATABASE_URL=(.+)$/m);
    if (match) process.env.DATABASE_URL = match[1].trim().replace(/^"(.*)"$/, "$1");
  } catch {
    /* no .env.local — generation still works offline */
  }
}

/**
 * Drizzle Kit config — migration tooling only (never bundled into the app).
 *
 *   npm run db:generate  → diff src/lib/db/schema.ts into ./drizzle/*.sql
 *   npm run db:migrate   → apply committed migrations (needs DATABASE_URL)
 *
 * DATABASE_URL comes from the Neon Vercel Marketplace integration
 * (`vercel env pull .env.local` locally). Generation works offline.
 */
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
