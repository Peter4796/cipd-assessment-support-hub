/**
 * Operational planner tests (Escalation P1) — every case runs on frozen
 * instants, never the real clock. Covers the approved §12 matrix:
 * untouched definition, escalation timing + cutover, deadline bands incl.
 * timezone boundaries, attention reasons, digest membership/idempotency
 * keys, and the pure claim-decision semantics.
 */

import { describe, expect, it } from "vitest";
import {
  attentionFor,
  deadlineBand,
  digestDedupeKey,
  digestWindowOpen,
  isTouched,
  planDigest,
  planEscalations,
  type AttentionInput,
  type TouchInput,
} from "@/lib/leads/operations";
import { planClaim, MAX_NOTIFICATION_ATTEMPTS } from "@/lib/db/notifications";

const TZ = "Africa/Nairobi"; // UTC+3, no DST
const at = (iso: string) => new Date(iso);

const untouchedBase: TouchInput = {
  status: "NEW",
  contactedAt: null,
  archivedAt: null,
  notesCount: 0,
  eventStatuses: ["NEW"],
};

describe("isTouched — the approved definition", () => {
  it("NEW with no activity is untouched", () => {
    expect(isTouched(untouchedBase)).toBe(false);
  });

  it("REVIEWING alone does NOT count as handled (the July lead)", () => {
    expect(
      isTouched({ ...untouchedBase, status: "REVIEWING", eventStatuses: ["NEW", "REVIEWING"] })
    ).toBe(false);
  });

  it("contacted_at counts", () => {
    expect(isTouched({ ...untouchedBase, contactedAt: at("2026-09-28T10:00:00Z") })).toBe(true);
  });

  it("a deliberate admin note counts", () => {
    expect(isTouched({ ...untouchedBase, notesCount: 1 })).toBe(true);
  });

  it("progression beyond REVIEWING counts", () => {
    expect(
      isTouched({ ...untouchedBase, eventStatuses: ["NEW", "REVIEWING", "CONTACTED"] })
    ).toBe(true);
  });

  it("archived and terminal states count", () => {
    expect(isTouched({ ...untouchedBase, archivedAt: at("2026-09-28T10:00:00Z") })).toBe(true);
    expect(isTouched({ ...untouchedBase, status: "COMPLETED" })).toBe(true);
    expect(isTouched({ ...untouchedBase, status: "LOST" })).toBe(true);
  });
});

describe("deadlineBand — date-only, owner-timezone boundaries", () => {
  it("classifies the standard bands", () => {
    const now = at("2026-09-28T09:00:00Z"); // Nairobi 12:00, date 2026-09-28
    expect(deadlineBand("2026-09-27", now, TZ)).toBe("overdue");
    expect(deadlineBand("2026-09-28", now, TZ)).toBe("today");
    expect(deadlineBand("2026-09-29", now, TZ)).toBe("tomorrow");
    expect(deadlineBand("2026-09-30", now, TZ)).toBe("within_48h");
    expect(deadlineBand("2026-10-01", now, TZ)).toBe("within_72h");
    expect(deadlineBand("2026-10-05", now, TZ)).toBe("later");
    expect(deadlineBand(null, now, TZ)).toBe("none");
  });

  it("uses the owner-local date at the UTC/Nairobi boundary", () => {
    // 21:30 UTC on the 27th is already 00:30 on the 28th in Nairobi.
    const lateUtc = at("2026-09-27T21:30:00Z");
    expect(deadlineBand("2026-09-28", lateUtc, TZ)).toBe("today");
    expect(deadlineBand("2026-09-27", lateUtc, TZ)).toBe("overdue");
    // While in UTC terms the 27th is still "today" elsewhere:
    expect(deadlineBand("2026-09-27", lateUtc, "UTC")).toBe("today");
  });
});

describe("planEscalations — thresholds, urgency and cutover", () => {
  const cutover = at("2026-09-28T00:00:00Z");
  const base = {
    createdAt: at("2026-09-28T08:00:00Z"),
    classification: "HIGH_INTENT",
    deadline: null,
    touch: untouchedBase,
  };

  it("standard high-intent: nothing before 30 min, #1 at 30 min, #2 at 2 h", () => {
    expect(planEscalations(base, at("2026-09-28T08:20:00Z"), TZ, cutover)).toEqual([]);
    expect(planEscalations(base, at("2026-09-28T08:30:00Z"), TZ, cutover)).toEqual([
      "escalation_1",
    ]);
    expect(planEscalations(base, at("2026-09-28T10:00:00Z"), TZ, cutover)).toEqual([
      "escalation_1",
      "escalation_2",
    ]);
  });

  it("deadline-critical (due today) compresses #1 to 15 min and elevates a WARM lead", () => {
    const critical = { ...base, classification: "WARM", deadline: "2026-09-28" };
    expect(planEscalations(critical, at("2026-09-28T08:16:00Z"), TZ, cutover)).toEqual([
      "escalation_1",
    ]);
  });

  it("non-urgent leads never escalate", () => {
    const warm = { ...base, classification: "WARM", deadline: "2026-10-20" };
    expect(planEscalations(warm, at("2026-09-28T12:00:00Z"), TZ, cutover)).toEqual([]);
  });

  it("meaningful handling cancels; REVIEWING alone does not", () => {
    const now = at("2026-09-28T12:00:00Z");
    const contacted = { ...base, touch: { ...untouchedBase, contactedAt: now } };
    expect(planEscalations(contacted, now, TZ, cutover)).toEqual([]);
    const noted = { ...base, touch: { ...untouchedBase, notesCount: 1 } };
    expect(planEscalations(noted, now, TZ, cutover)).toEqual([]);
    const progressed = {
      ...base,
      touch: { ...untouchedBase, eventStatuses: ["NEW", "REVIEWING", "CONTACTED"] },
    };
    expect(planEscalations(progressed, now, TZ, cutover)).toEqual([]);
    const terminal = { ...base, touch: { ...untouchedBase, status: "LOST" } };
    expect(planEscalations(terminal, now, TZ, cutover)).toEqual([]);
    const reviewingOnly = {
      ...base,
      touch: { ...untouchedBase, status: "REVIEWING", eventStatuses: ["NEW", "REVIEWING"] },
    };
    expect(planEscalations(reviewingOnly, now, TZ, cutover)).toEqual([
      "escalation_1",
      "escalation_2",
    ]);
  });

  it("CUTOVER: historical leads and disabled automation never escalate", () => {
    const historical = { ...base, createdAt: at("2026-09-12T08:00:00Z") };
    expect(planEscalations(historical, at("2026-09-28T12:00:00Z"), TZ, cutover)).toEqual([]);
    expect(planEscalations(base, at("2026-09-28T12:00:00Z"), TZ, null)).toEqual([]);
  });
});

describe("attentionFor — transparent reasons, internal score", () => {
  const mk = (over: Partial<AttentionInput>): AttentionInput => ({
    id: "CG-TEST01",
    createdAt: at("2026-09-28T08:00:00Z"),
    status: "NEW",
    classification: "HIGH_INTENT",
    deadline: null,
    quoteSentAt: null,
    touch: untouchedBase,
    lastEventAt: at("2026-09-28T08:00:00Z"),
    ...over,
  });

  it("an untouched high-intent lead due today reads exactly like the Gabriela case", () => {
    const a = attentionFor(mk({ deadline: "2026-09-28" }), at("2026-09-28T08:37:00Z"), TZ)!;
    expect(a.reasons).toEqual(["High intent", "Untouched 37 min", "Due today"]);
  });

  it("reviewing-without-contact is called out", () => {
    const a = attentionFor(
      mk({ status: "REVIEWING", touch: { ...untouchedBase, status: "REVIEWING", eventStatuses: ["NEW", "REVIEWING"] } }),
      at("2026-09-28T10:00:00Z"),
      TZ
    )!;
    expect(a.reasons).toContain("Reviewing with no contact recorded");
  });

  it("a stale quote is surfaced", () => {
    const a = attentionFor(
      mk({
        status: "QUOTE_SENT",
        quoteSentAt: at("2026-09-24T08:00:00Z"),
        touch: { ...untouchedBase, contactedAt: at("2026-09-24T08:00:00Z"), eventStatuses: ["NEW", "CONTACTED", "QUOTE_SENT"] },
      }),
      at("2026-09-28T08:00:00Z"),
      TZ
    )!;
    expect(a.reasons.some((r) => r.startsWith("Quote stale"))).toBe(true);
  });

  it("an imminent deadline outranks a higher classification with a distant one", () => {
    const now = at("2026-09-28T12:00:00Z");
    const warmDueToday = attentionFor(
      mk({ classification: "WARM", deadline: "2026-09-28" }),
      now,
      TZ
    )!;
    const priorityLater = attentionFor(
      mk({ classification: "PRIORITY", deadline: "2026-11-01", touch: { ...untouchedBase, contactedAt: now, eventStatuses: ["NEW", "CONTACTED"] } }),
      now,
      TZ
    )!;
    expect(warmDueToday.score).toBeGreaterThan(priorityLater.score);
  });

  it("terminal and archived leads need no attention", () => {
    expect(attentionFor(mk({ status: "COMPLETED", touch: { ...untouchedBase, status: "COMPLETED" } }), at("2026-09-28T12:00:00Z"), TZ)).toBeNull();
    expect(
      attentionFor(mk({ touch: { ...untouchedBase, archivedAt: at("2026-09-27T00:00:00Z") } }), at("2026-09-28T12:00:00Z"), TZ)
    ).toBeNull();
  });
});

describe("digest — membership, window and idempotency key", () => {
  const mk = (over: Partial<AttentionInput>): AttentionInput => ({
    id: "CG-TEST01",
    createdAt: at("2026-09-20T08:00:00Z"),
    status: "NEW",
    classification: "HIGH_INTENT",
    deadline: null,
    quoteSentAt: null,
    touch: untouchedBase,
    lastEventAt: at("2026-09-20T08:00:00Z"),
    ...over,
  });

  it("empty when nothing is actionable; includes historical untouched leads", () => {
    const now = at("2026-09-28T06:00:00Z");
    const done = mk({ status: "COMPLETED", touch: { ...untouchedBase, status: "COMPLETED" } });
    expect(planDigest([done], now, TZ)).toBeNull();
    const sections = planDigest([mk({})], now, TZ)!;
    expect(sections.untouched).toHaveLength(1);
  });

  it("one key per owner-local day, crossing the UTC boundary correctly", () => {
    expect(digestDedupeKey(at("2026-09-27T21:30:00Z"), TZ)).toBe("digest:2026-09-28");
    expect(digestDedupeKey(at("2026-09-28T05:30:00Z"), TZ)).toBe("digest:2026-09-28");
    expect(digestDedupeKey(at("2026-09-28T21:30:00Z"), TZ)).toBe("digest:2026-09-29");
  });

  it("window opens at 08:00 owner-local", () => {
    expect(digestWindowOpen(at("2026-09-28T04:59:00Z"), TZ)).toBe(false); // 07:59 EAT
    expect(digestWindowOpen(at("2026-09-28T05:00:00Z"), TZ)).toBe(true); // 08:00 EAT
  });
});

describe("planClaim — idempotency decisions", () => {
  const now = at("2026-09-28T12:00:00Z");
  const row = (over: Partial<{ status: string; attempts: number; updatedAt: Date }>) => ({
    status: "failed",
    attempts: 1,
    updatedAt: at("2026-09-28T11:00:00Z"),
    ...over,
  });

  it("no row -> insert; sent/skipped -> never again", () => {
    expect(planClaim(null, now)).toBe("insert");
    expect(planClaim(row({ status: "sent" }), now)).toBe("skip_sent");
    expect(planClaim(row({ status: "skipped" }), now)).toBe("skip_sent");
  });

  it("failed below cap -> takeover; at cap -> surfaced, not retried", () => {
    expect(planClaim(row({ attempts: 2 }), now)).toBe("takeover");
    expect(planClaim(row({ attempts: MAX_NOTIFICATION_ATTEMPTS }), now)).toBe("skip_capped");
  });

  it("fresh in-flight claim -> skip; crashed stale claim -> takeover", () => {
    expect(
      planClaim(row({ status: "claimed", updatedAt: at("2026-09-28T11:55:00Z") }), now)
    ).toBe("skip_inflight");
    expect(
      planClaim(row({ status: "claimed", updatedAt: at("2026-09-28T11:00:00Z") }), now)
    ).toBe("takeover");
  });
});
