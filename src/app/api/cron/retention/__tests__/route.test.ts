/**
 * Cron route tests (P2.5): auth fail-closed behaviour, deletion ordering
 * (storage before DB marking), retry bookkeeping, orphan sweep, notify
 * retry, dry-run safety and idempotency. Blob SDK, repository and notifier
 * are mocked; the pure retention policy runs for real.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/blob", () => ({
  del: vi.fn(async () => undefined),
  list: vi.fn(async () => ({ blobs: [], cursor: undefined, hasMore: false })),
}));
vi.mock("@/lib/db/client", () => ({ isDbConfigured: vi.fn(() => true) }));
vi.mock("@/lib/leads/uploads", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  isBlobConfigured: vi.fn(() => true),
}));
vi.mock("@/lib/db/leads", () => ({
  listRetentionCandidates: vi.fn(async () => []),
  markAttachmentDeleted: vi.fn(async () => undefined),
  recordAttachmentDeleteFailure: vi.fn(async () => undefined),
  allKnownPathnames: vi.fn(async () => new Set<string>()),
  listUnnotifiedLeads: vi.fn(async () => []),
  recordNotifyResult: vi.fn(async () => undefined),
}));
vi.mock("@/lib/leads/notify", () => ({
  notifyLead: vi.fn(async () => ({ ok: true })),
}));

import { del, list } from "@vercel/blob";
import { GET } from "@/app/api/cron/retention/route";
import {
  allKnownPathnames,
  listRetentionCandidates,
  listUnnotifiedLeads,
  markAttachmentDeleted,
  recordAttachmentDeleteFailure,
} from "@/lib/db/leads";
import { notifyLead } from "@/lib/leads/notify";

const SECRET = "test-cron-secret";

function call(params = "", auth: string | null = `Bearer ${SECRET}`): Promise<Response> {
  return GET(
    new Request(`http://localhost/api/cron/retention${params}`, {
      headers: auth ? { authorization: auth } : {},
    })
  );
}

const dueCandidate = {
  attachmentId: 7,
  pathname: "enquiries/2026-04/other/aged.pdf",
  deleteAttempts: 0,
  deletedAt: null,
  leadId: "CG-AGED01",
  status: "LOST",
  createdAt: new Date(Date.now() - 200 * 864e5),
  lostAt: new Date(Date.now() - 100 * 864e5),
  completedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = SECRET;
  vi.mocked(list).mockResolvedValue({ blobs: [], cursor: undefined, hasMore: false } as never);
  vi.mocked(listRetentionCandidates).mockResolvedValue([]);
  vi.mocked(allKnownPathnames).mockResolvedValue(new Set());
  vi.mocked(listUnnotifiedLeads).mockResolvedValue([]);
  vi.mocked(del).mockResolvedValue(undefined as never);
});

describe("auth — fails closed", () => {
  it("503 when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    expect((await call()).status).toBe(503);
    expect(del).not.toHaveBeenCalled();
  });

  it("401 on missing or wrong bearer", async () => {
    expect((await call("", null)).status).toBe(401);
    expect((await call("", "Bearer wrong")).status).toBe(401);
    expect(del).not.toHaveBeenCalled();
  });
});

describe("retention deletion", () => {
  it("deletes the blob FIRST, then marks the row with the policy reason", async () => {
    vi.mocked(listRetentionCandidates).mockResolvedValue([dueCandidate]);
    const res = await call();
    const body = await res.json();
    expect(body.retention).toMatchObject({ due: 1, deleted: 1, failed: 0 });
    expect(del).toHaveBeenCalledWith(dueCandidate.pathname);
    expect(markAttachmentDeleted).toHaveBeenCalledWith(7, "retention_lost");
    expect(vi.mocked(del).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(markAttachmentDeleted).mock.invocationCallOrder[0]
    );
  });

  it("a failed blob deletion records a retry and does NOT mark deleted", async () => {
    vi.mocked(listRetentionCandidates).mockResolvedValue([dueCandidate]);
    vi.mocked(del).mockRejectedValue(new Error("storage down"));
    const body = await (await call()).json();
    expect(body.retention).toMatchObject({ deleted: 0, failed: 1 });
    expect(markAttachmentDeleted).not.toHaveBeenCalled();
    expect(recordAttachmentDeleteFailure).toHaveBeenCalledWith(7, "blob_delete_failed");
  });

  it("ineligible candidates are untouched (active lead)", async () => {
    vi.mocked(listRetentionCandidates).mockResolvedValue([
      { ...dueCandidate, status: "IN_PROGRESS", lostAt: null },
    ]);
    const body = await (await call()).json();
    expect(body.retention.due).toBe(0);
    expect(del).not.toHaveBeenCalled();
  });

  it("dry run reports without deleting", async () => {
    vi.mocked(listRetentionCandidates).mockResolvedValue([dueCandidate]);
    const body = await (await call("?dry=1")).json();
    expect(body.dry).toBe(true);
    expect(body.dryRunDetails).toEqual([
      { kind: "retention", lead: "CG-AGED01", attachment: 7, reason: "retention_lost" },
    ]);
    expect(del).not.toHaveBeenCalled();
    expect(markAttachmentDeleted).not.toHaveBeenCalled();
  });

  it("second run after success selects nothing (idempotent)", async () => {
    // After markAttachmentDeleted, the repository query (deleted_at is null)
    // no longer returns the row — simulated here by an empty candidate list.
    vi.mocked(listRetentionCandidates).mockResolvedValue([]);
    const body = await (await call()).json();
    expect(body.retention).toMatchObject({ due: 0, deleted: 0 });
    expect(del).not.toHaveBeenCalled();
  });
});

describe("orphan sweep", () => {
  it("deletes aged untracked blobs, keeps tracked and fresh ones", async () => {
    vi.mocked(list).mockResolvedValue({
      blobs: [
        { pathname: "enquiries/a/orphan.pdf", uploadedAt: new Date(Date.now() - 50 * 36e5) },
        { pathname: "enquiries/a/fresh.pdf", uploadedAt: new Date(Date.now() - 1 * 36e5) },
        { pathname: "enquiries/a/tracked.pdf", uploadedAt: new Date(Date.now() - 90 * 36e5) },
      ],
      cursor: undefined,
      hasMore: false,
    } as never);
    vi.mocked(allKnownPathnames).mockResolvedValue(new Set(["enquiries/a/tracked.pdf"]));
    const body = await (await call()).json();
    expect(body.orphans).toMatchObject({ found: 1, deleted: 1, failed: 0 });
    expect(del).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledWith("enquiries/a/orphan.pdf");
  });
});

describe("alert email retry", () => {
  it("re-sends failed notifications and records the outcome", async () => {
    const { recordNotifyResult } = await import("@/lib/db/leads");
    vi.mocked(listUnnotifiedLeads).mockResolvedValue([
      {
        id: "CG-RETRY1",
        createdAt: new Date(),
        updatedAt: new Date(),
        schemaVersion: 2,
        name: "Retry Lead",
        email: "retry@example.com",
        whatsapp: null,
        country: null,
        level: "5",
        unitCode: null,
        supportType: "draft_review",
        submissionType: null,
        provider: null,
        wordCount: null,
        deadline: null,
        message: null,
        referredCriteria: null,
        score: 30,
        classification: "WARM",
        sourcePage: "/",
        sourcePageType: "home",
        referrer: null,
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        entryCta: null,
        funnelStartedAt: null,
        funnelCompletedAt: null,
        funnelDurationSeconds: null,
        reachedReview: false,
        whatsappContinued: null,
        status: "NEW",
        contactedAt: null,
        quoteSentAt: null,
        paymentConfirmedAt: null,
        workStartedAt: null,
        deliveredAt: null,
        completedAt: null,
        lostAt: null,
        lostReason: null,
        archivedAt: null,
        quoteRecommendedMid: null,
        quotedAmount: null,
        quoteCurrency: null,
        quoteNotes: null,
        quotedAt: null,
        notifiedAt: null,
        notifyError: "send_failed",
        notifyAttempts: 1,
        fingerprint: "f".repeat(64),
      } as never,
    ]);
    const body = await (await call()).json();
    expect(body.notifyRetries).toMatchObject({ attempted: 1, delivered: 1 });
    expect(notifyLead).toHaveBeenCalledWith(
      expect.objectContaining({ id: "CG-RETRY1" }),
      { persisted: true }
    );
    expect(recordNotifyResult).toHaveBeenCalledWith("CG-RETRY1", { ok: true });
  });
});
