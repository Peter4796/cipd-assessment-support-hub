/**
 * Failure-semantics tests for POST /api/leads (P2.2).
 *
 * The database, notifier and rate limiter are mocked; validation, scoring
 * and fingerprinting run for real. These tests pin the capture contract:
 * a lead is "captured" when EITHER durable channel holds it, and an email
 * failure never rolls back a persisted lead.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/client", () => ({
  isDbConfigured: vi.fn(() => true),
}));
vi.mock("@/lib/db/leads", () => ({
  insertLead: vi.fn(async () => undefined),
  findRecentLeadIdByFingerprint: vi.fn(async () => null),
  recordNotifyResult: vi.fn(async () => undefined),
}));
vi.mock("@/lib/leads/notify", () => ({
  notifyLead: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/lib/leads/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ allowed: true })),
  clientKey: vi.fn(() => "test"),
}));

import { POST } from "@/app/api/leads/route";
import { isDbConfigured } from "@/lib/db/client";
import {
  findRecentLeadIdByFingerprint,
  insertLead,
  recordNotifyResult,
} from "@/lib/db/leads";
import { notifyLead } from "@/lib/leads/notify";

const validBody = {
  name: "Test Client",
  email: "client@example.com",
  level: "5",
  supportType: "assessment_guidance",
  unitCode: "5CO01",
  message: "Need help planning the structure of this assessment.",
  startedAt: Date.now() - 60_000,
  website: "",
};

function post(body: unknown = validBody): Promise<Response> {
  return POST(
    new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isDbConfigured).mockReturnValue(true);
  vi.mocked(findRecentLeadIdByFingerprint).mockResolvedValue(null);
  vi.mocked(insertLead).mockResolvedValue(undefined);
  vi.mocked(recordNotifyResult).mockResolvedValue(undefined);
  vi.mocked(notifyLead).mockResolvedValue({ ok: true });
});

describe("POST /api/leads — persistence flow", () => {
  it("persists then notifies: 201, notify outcome recorded", async () => {
    const res = await post();
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.ok).toBe(true);
    expect(data.reference).toMatch(/^CG-/);
    expect(insertLead).toHaveBeenCalledTimes(1);
    const [leadArg, fingerprintArg] = vi.mocked(insertLead).mock.calls[0];
    expect(leadArg.email).toBe("client@example.com");
    expect(fingerprintArg).toMatch(/^[0-9a-f]{64}$/);
    expect(notifyLead).toHaveBeenCalledWith(
      expect.objectContaining({ id: data.reference }),
      { persisted: true }
    );
    expect(recordNotifyResult).toHaveBeenCalledWith(data.reference, { ok: true });
  });

  it("email failure after successful persistence still returns 201 and stores the error", async () => {
    vi.mocked(notifyLead).mockResolvedValue({ ok: false, error: "send_failed" });
    const res = await post();
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.ok).toBe(true);
    expect(recordNotifyResult).toHaveBeenCalledWith(data.reference, {
      ok: false,
      error: "send_failed",
    });
  });

  it("DB insert failure falls back to email-as-record with the [NOT PERSISTED] marker", async () => {
    vi.mocked(insertLead).mockRejectedValue(new Error("db down"));
    const res = await post();
    expect(res.status).toBe(201);
    expect(notifyLead).toHaveBeenCalledWith(expect.anything(), { persisted: false });
    expect(recordNotifyResult).not.toHaveBeenCalled();
  });

  it("returns an honest failure only when BOTH channels fail", async () => {
    vi.mocked(insertLead).mockRejectedValue(new Error("db down"));
    vi.mocked(notifyLead).mockResolvedValue({ ok: false, error: "send_failed" });
    const res = await post();
    const data = await res.json();
    expect(res.status).toBe(502);
    expect(data).toEqual({ ok: false, error: "delivery_failed" });
  });

  it("a failed notify-state update never fails the request", async () => {
    vi.mocked(recordNotifyResult).mockRejectedValue(new Error("db blip"));
    const res = await post();
    expect(res.status).toBe(201);
  });

  it("behaves exactly like P0/P1 when no database is configured", async () => {
    vi.mocked(isDbConfigured).mockReturnValue(false);
    const res = await post();
    expect(res.status).toBe(201);
    expect(findRecentLeadIdByFingerprint).not.toHaveBeenCalled();
    expect(insertLead).not.toHaveBeenCalled();
    expect(recordNotifyResult).not.toHaveBeenCalled();
    // No persisted flag either way — no [NOT PERSISTED] marker in P0 mode.
    expect(notifyLead).toHaveBeenCalledWith(expect.anything(), { persisted: undefined });
  });

  it("unconfigured email without a database returns 503 (unchanged contract)", async () => {
    vi.mocked(isDbConfigured).mockReturnValue(false);
    vi.mocked(notifyLead).mockResolvedValue({ ok: false, error: "unconfigured" });
    const res = await post();
    expect(res.status).toBe(503);
  });
});

describe("POST /api/leads — deduplication", () => {
  it("returns the original reference for a duplicate within the window", async () => {
    vi.mocked(findRecentLeadIdByFingerprint).mockResolvedValue("CG-FIRST1");
    const res = await post();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual({ ok: true, reference: "CG-FIRST1" });
    expect(insertLead).not.toHaveBeenCalled();
    expect(notifyLead).not.toHaveBeenCalled();
  });

  it("a failed dedup lookup never blocks capture", async () => {
    vi.mocked(findRecentLeadIdByFingerprint).mockRejectedValue(new Error("db blip"));
    const res = await post();
    expect(res.status).toBe(201);
    expect(insertLead).toHaveBeenCalledTimes(1);
  });

  it("queries with the approved 15-minute window", async () => {
    const before = Date.now();
    await post();
    const [, since] = vi.mocked(findRecentLeadIdByFingerprint).mock.calls[0];
    const windowMs = Date.now() - since.getTime();
    expect(windowMs).toBeGreaterThanOrEqual(15 * 60 * 1000 - 100);
    expect(windowMs).toBeLessThanOrEqual(15 * 60 * 1000 + (Date.now() - before) + 100);
  });
});

describe("POST /api/leads — unchanged guards", () => {
  it("honeypot submissions get a fake 200 and touch nothing", async () => {
    const res = await post({ ...validBody, website: "spam.example" });
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    expect(insertLead).not.toHaveBeenCalled();
    expect(notifyLead).not.toHaveBeenCalled();
  });

  it("validation errors still 400 before any persistence", async () => {
    const res = await post({ ...validBody, email: "not-an-email" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_email");
    expect(insertLead).not.toHaveBeenCalled();
  });
});
