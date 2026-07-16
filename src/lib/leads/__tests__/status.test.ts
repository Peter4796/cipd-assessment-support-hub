import { describe, expect, it } from "vitest";
import { isTerminalStatus, planStatusChange, type StatusTimestamps } from "@/lib/leads/status";

const now = new Date("2026-07-16T12:00:00.000Z");

const blank: StatusTimestamps = {
  contactedAt: null,
  quoteSentAt: null,
  paymentConfirmedAt: null,
  workStartedAt: null,
  deliveredAt: null,
  completedAt: null,
  lostAt: null,
};

const at = (status: string, stamps: Partial<StatusTimestamps> = {}) => ({
  status,
  ...blank,
  ...stamps,
});

describe("planStatusChange — guards", () => {
  it("rejects unknown statuses", () => {
    expect(planStatusChange(at("NEW"), "SHIPPED", now)).toEqual({
      ok: false,
      error: "invalid_status",
    });
  });

  it("rejects a no-op change", () => {
    expect(planStatusChange(at("NEW"), "NEW", now)).toEqual({ ok: false, error: "same_status" });
  });

  it("requires an explicit reopen to leave a terminal status", () => {
    expect(planStatusChange(at("COMPLETED"), "REVIEWING", now)).toEqual({
      ok: false,
      error: "terminal_requires_reopen",
    });
    expect(planStatusChange(at("LOST"), "REVIEWING", now)).toEqual({
      ok: false,
      error: "terminal_requires_reopen",
    });
    const reopened = planStatusChange(at("LOST"), "REVIEWING", now, { reopen: true });
    expect(reopened).toEqual({ ok: true, set: { status: "REVIEWING" } });
  });

  it("allows LOST from every pre-fulfilment stage (owner decision 3)", () => {
    for (const from of ["NEW", "REVIEWING", "CONTACTED", "QUOTE_SENT", "AWAITING_PAYMENT"]) {
      expect(planStatusChange(at(from), "LOST", now).ok).toBe(true);
    }
  });
});

describe("planStatusChange — milestone timestamps", () => {
  it("stamps each milestone on first entry", () => {
    expect(planStatusChange(at("NEW"), "CONTACTED", now)).toEqual({
      ok: true,
      set: { status: "CONTACTED", contactedAt: now },
    });
    expect(planStatusChange(at("CONTACTED"), "QUOTE_SENT", now)).toEqual({
      ok: true,
      set: { status: "QUOTE_SENT", quoteSentAt: now },
    });
    expect(planStatusChange(at("QUALITY_REVIEW"), "DELIVERED", now)).toEqual({
      ok: true,
      set: { status: "DELIVERED", deliveredAt: now },
    });
    expect(planStatusChange(at("DELIVERED"), "COMPLETED", now)).toEqual({
      ok: true,
      set: { status: "COMPLETED", completedAt: now },
    });
  });

  it("never overwrites an existing milestone (corrections keep history)", () => {
    const revisit = planStatusChange(
      at("REVIEWING", { contactedAt: new Date("2026-07-10T00:00:00Z") }),
      "CONTACTED",
      now
    );
    expect(revisit).toEqual({ ok: true, set: { status: "CONTACTED" } });
  });

  it("IN_PROGRESS from AWAITING_PAYMENT confirms payment and starts work", () => {
    expect(planStatusChange(at("AWAITING_PAYMENT"), "IN_PROGRESS", now)).toEqual({
      ok: true,
      set: { status: "IN_PROGRESS", paymentConfirmedAt: now, workStartedAt: now },
    });
  });

  it("IN_PROGRESS from elsewhere starts work without claiming payment", () => {
    expect(planStatusChange(at("QUOTE_SENT"), "IN_PROGRESS", now)).toEqual({
      ok: true,
      set: { status: "IN_PROGRESS", workStartedAt: now },
    });
  });

  it("LOST stamps lost_at and stores a trimmed, capped reason", () => {
    const plan = planStatusChange(at("QUOTE_SENT"), "LOST", now, {
      lostReason: `  went quiet after the quote  ${"x".repeat(400)}`,
    });
    expect(plan.ok).toBe(true);
    if (plan.ok) {
      expect(plan.set.status).toBe("LOST");
      expect(plan.set.lostAt).toBe(now);
      expect(plan.set.lostReason).toHaveLength(300);
      expect(plan.set.lostReason?.startsWith("went quiet")).toBe(true);
    }
  });
});

describe("isTerminalStatus", () => {
  it("marks exactly COMPLETED and LOST as terminal", () => {
    expect(isTerminalStatus("COMPLETED")).toBe(true);
    expect(isTerminalStatus("LOST")).toBe(true);
    expect(isTerminalStatus("NEW")).toBe(false);
    expect(isTerminalStatus("DELIVERED")).toBe(false);
  });
});
