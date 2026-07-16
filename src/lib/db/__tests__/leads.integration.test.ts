/**
 * Live-database integration test for the lead repository.
 *
 * Runs ONLY when DATABASE_URL is present in the process environment (it is
 * not loaded from .env.local here), so normal `npm test` skips it. Execute
 * deliberately with:
 *
 *   node --env-file=.env.local node_modules/vitest/vitest.mjs run \
 *     src/lib/db/__tests__/leads.integration.test.ts
 *
 * Inserts a clearly-marked synthetic lead, verifies every row, exercises the
 * dedup lookup and notify-state update, then deletes it (FK cascade cleans
 * the child rows). Leaves the database exactly as found.
 */

import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { Lead } from "@/lib/leads/types";

const hasDb = Boolean(process.env.DATABASE_URL);

const TEST_ID = "CG-ITEST0";

const testLead: Lead = {
  id: TEST_ID,
  createdAt: new Date().toISOString(),
  name: "P2.2 integration test (synthetic)",
  email: "integration-test@invalid.example",
  whatsapp: "+254712345678",
  country: "Kenya",
  level: "7",
  unitCode: "7CO03",
  supportType: "resubmission",
  submissionType: "resubmission",
  wordCount: 3500,
  deadline: "2026-08-01",
  message: "Synthetic row created by leads.integration.test.ts — safe to delete.",
  attachments: [
    {
      id: "att_1",
      originalFileName: "synthetic.pdf",
      pathname: `enquiries/2026-07/other/integration-test-${TEST_ID}.pdf`,
      mimeType: "application/pdf",
      sizeBytes: 1234,
      uploadStatus: "uploaded",
      uploadedAt: new Date().toISOString(),
      category: "OTHER",
    },
  ],
  reachedReview: true,
  acquisition: { sourcePage: "/integration-test", sourcePageType: "other" },
  score: 100,
  classification: "PRIORITY",
  schemaVersion: 2,
};

describe.skipIf(!hasDb)("lead repository against live Neon", () => {
  afterAll(async () => {
    if (!hasDb) return;
    const { db } = await import("@/lib/db/client");
    const { leads } = await import("@/lib/db/schema");
    await db().delete(leads).where(eq(leads.id, TEST_ID));
  });

  it("inserts lead + attachment + initial status event atomically", async () => {
    const { insertLead } = await import("@/lib/db/leads");
    const { db } = await import("@/lib/db/client");
    const { leadAttachments, leads, leadStatusEvents } = await import("@/lib/db/schema");

    await insertLead(testLead, "f".repeat(64));

    const [row] = await db().select().from(leads).where(eq(leads.id, TEST_ID));
    expect(row).toBeDefined();
    expect(row.status).toBe("NEW");
    expect(row.classification).toBe("PRIORITY");
    expect(row.whatsapp).toBe("+254712345678");
    expect(row.fingerprint).toBe("f".repeat(64));
    expect(row.notifyAttempts).toBe(0);

    const atts = await db()
      .select()
      .from(leadAttachments)
      .where(eq(leadAttachments.leadId, TEST_ID));
    expect(atts).toHaveLength(1);
    expect(atts[0].pathname).toContain("integration-test");
    expect(atts[0].deletedAt).toBeNull();

    const events = await db()
      .select()
      .from(leadStatusEvents)
      .where(eq(leadStatusEvents.leadId, TEST_ID));
    expect(events).toHaveLength(1);
    expect(events[0].fromStatus).toBeNull();
    expect(events[0].toStatus).toBe("NEW");
  });

  it("finds the lead by fingerprint within the window, not outside it", async () => {
    const { findRecentLeadIdByFingerprint } = await import("@/lib/db/leads");
    const recent = await findRecentLeadIdByFingerprint(
      "f".repeat(64),
      new Date(Date.now() - 15 * 60 * 1000)
    );
    expect(recent).toBe(TEST_ID);
    const future = await findRecentLeadIdByFingerprint("f".repeat(64), new Date(Date.now() + 1000));
    expect(future).toBeNull();
    const other = await findRecentLeadIdByFingerprint(
      "0".repeat(64),
      new Date(Date.now() - 15 * 60 * 1000)
    );
    expect(other).toBeNull();
  });

  it("records failed then successful notify outcomes", async () => {
    const { recordNotifyResult } = await import("@/lib/db/leads");
    const { db } = await import("@/lib/db/client");
    const { leads } = await import("@/lib/db/schema");

    await recordNotifyResult(TEST_ID, { ok: false, error: "send_failed" });
    let [row] = await db().select().from(leads).where(eq(leads.id, TEST_ID));
    expect(row.notifyError).toBe("send_failed");
    expect(row.notifiedAt).toBeNull();
    expect(row.notifyAttempts).toBe(1);

    await recordNotifyResult(TEST_ID, { ok: true });
    [row] = await db().select().from(leads).where(eq(leads.id, TEST_ID));
    expect(row.notifyError).toBeNull();
    expect(row.notifiedAt).not.toBeNull();
    expect(row.notifyAttempts).toBe(2);
  });

  it("cascade delete removes child rows with the lead", async () => {
    const { db } = await import("@/lib/db/client");
    const { leadAttachments, leads, leadStatusEvents } = await import("@/lib/db/schema");

    await db().delete(leads).where(eq(leads.id, TEST_ID));
    const atts = await db()
      .select()
      .from(leadAttachments)
      .where(eq(leadAttachments.leadId, TEST_ID));
    const events = await db()
      .select()
      .from(leadStatusEvents)
      .where(eq(leadStatusEvents.leadId, TEST_ID));
    expect(atts).toHaveLength(0);
    expect(events).toHaveLength(0);
  });
});
