import { describe, expect, it } from "vitest";
import {
  attachmentDeletionDue,
  RETENTION,
  retentionEligibleAt,
  selectOrphanBlobs,
} from "@/lib/leads/retention";

const now = new Date("2026-07-17T03:00:00.000Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 864e5);

const lead = (over: Partial<Parameters<typeof retentionEligibleAt>[0]> = {}) => ({
  status: "NEW",
  createdAt: daysAgo(0),
  lostAt: null,
  completedAt: null,
  ...over,
});

const freshAttachment = { deletedAt: null, deleteAttempts: 0 };

describe("retentionEligibleAt — owner policy windows", () => {
  it("LOST: 90 days after lost_at", () => {
    const l = lead({ status: "LOST", createdAt: daysAgo(100), lostAt: daysAgo(10) });
    const e = retentionEligibleAt(l)!;
    expect(e.reason).toBe("retention_lost");
    expect(e.at).toEqual(new Date(daysAgo(10).getTime() + 90 * 864e5));
  });

  it("LOST: capped at 180 days after submission when marked lost late", () => {
    // Lost yesterday but submitted 175 days ago: cap (created+180d) wins
    // over lost_at+90d.
    const l = lead({ status: "LOST", createdAt: daysAgo(175), lostAt: daysAgo(1) });
    const e = retentionEligibleAt(l)!;
    expect(e.at).toEqual(new Date(daysAgo(175).getTime() + 180 * 864e5));
  });

  it("never-progressed statuses: 90 days after submission", () => {
    for (const status of ["NEW", "REVIEWING", "CONTACTED", "QUOTE_SENT"]) {
      const e = retentionEligibleAt(lead({ status, createdAt: daysAgo(30) }))!;
      expect(e.reason).toBe("retention_not_proceeded");
      expect(e.at).toEqual(new Date(daysAgo(30).getTime() + 90 * 864e5));
    }
  });

  it("COMPLETED: 180 days after completion", () => {
    const e = retentionEligibleAt(
      lead({ status: "COMPLETED", createdAt: daysAgo(200), completedAt: daysAgo(20) })
    )!;
    expect(e.reason).toBe("retention_completed");
    expect(e.at).toEqual(new Date(daysAgo(20).getTime() + 180 * 864e5));
  });

  it("proceeded/active leads are never auto-deleted", () => {
    for (const status of [
      "AWAITING_PAYMENT",
      "IN_PROGRESS",
      "QUALITY_REVIEW",
      "DELIVERED",
    ]) {
      expect(retentionEligibleAt(lead({ status, createdAt: daysAgo(400) }))).toBeNull();
    }
  });
});

describe("attachmentDeletionDue — idempotency and caps", () => {
  const dueLead = lead({ status: "NEW", createdAt: daysAgo(91) });

  it("selects an aged-out attachment", () => {
    expect(attachmentDeletionDue(dueLead, freshAttachment, now)).toEqual({
      due: true,
      reason: "retention_not_proceeded",
    });
  });

  it("boundary: not due one day before the window closes", () => {
    const l = lead({ status: "NEW", createdAt: daysAgo(89) });
    expect(attachmentDeletionDue(l, freshAttachment, now)).toEqual({ due: false });
  });

  it("never re-selects an already-deleted attachment (idempotent reruns)", () => {
    expect(
      attachmentDeletionDue(dueLead, { deletedAt: daysAgo(1), deleteAttempts: 0 }, now)
    ).toEqual({ due: false });
  });

  it("stops retrying at the attempt cap", () => {
    expect(
      attachmentDeletionDue(
        dueLead,
        { deletedAt: null, deleteAttempts: RETENTION.maxDeleteAttempts },
        now
      )
    ).toEqual({ due: false });
    expect(
      attachmentDeletionDue(
        dueLead,
        { deletedAt: null, deleteAttempts: RETENTION.maxDeleteAttempts - 1 },
        now
      ).due
    ).toBe(true);
  });
});

describe("selectOrphanBlobs — 48h sweep", () => {
  const hoursAgo = (n: number) => new Date(now.getTime() - n * 36e5);
  const blobs = [
    { pathname: "enquiries/2026-07/other/old-abandoned.pdf", uploadedAt: hoursAgo(49) },
    { pathname: "enquiries/2026-07/other/fresh-upload.pdf", uploadedAt: hoursAgo(2) },
    { pathname: "enquiries/2026-07/other/tracked.pdf", uploadedAt: hoursAgo(100) },
    { pathname: "outside/namespace.pdf", uploadedAt: hoursAgo(100) },
  ];
  const known = new Set(["enquiries/2026-07/other/tracked.pdf"]);

  it("selects only aged, untracked, in-namespace blobs", () => {
    expect(selectOrphanBlobs(blobs, known, now).map((b) => b.pathname)).toEqual([
      "enquiries/2026-07/other/old-abandoned.pdf",
    ]);
  });

  it("48h boundary is inclusive of exactly-48h uploads", () => {
    const edge = [{ pathname: "enquiries/x/y/z.pdf", uploadedAt: hoursAgo(48) }];
    expect(selectOrphanBlobs(edge, new Set(), now)).toHaveLength(1);
  });

  it("tracked pathnames are never orphans, even deleted-marked ones", () => {
    expect(
      selectOrphanBlobs(
        [{ pathname: "enquiries/2026-07/other/tracked.pdf", uploadedAt: hoursAgo(500) }],
        known,
        now
      )
    ).toHaveLength(0);
  });
});
