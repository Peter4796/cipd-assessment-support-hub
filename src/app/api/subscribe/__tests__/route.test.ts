/**
 * Capture-contract tests for POST /api/subscribe (P0.3).
 *
 * Three best-effort channels: DB persistence (first-party measurement),
 * Resend contact (audience), notification email (owner alert). Any one
 * succeeding = captured (201); all three failing = honest 503. Validation
 * runs for real so the acquisition context (incl. first-touch landingPage)
 * is exercised end to end.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/client", () => ({
  isDbConfigured: vi.fn(() => true),
}));
vi.mock("@/lib/db/subscribers", () => ({
  insertSubscriber: vi.fn(async () => undefined),
}));
vi.mock("@/lib/email/resend", () => ({
  addAudienceContact: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/lib/leads/notify", () => ({
  notifySubscriber: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/lib/leads/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ allowed: true })),
  clientKey: vi.fn(() => "test"),
}));

import { POST } from "@/app/api/subscribe/route";
import { isDbConfigured } from "@/lib/db/client";
import { insertSubscriber } from "@/lib/db/subscribers";
import { addAudienceContact } from "@/lib/email/resend";
import { notifySubscriber } from "@/lib/leads/notify";

const validBody = {
  name: "Test Reader",
  email: "reader@example.com",
  level: "5",
  resource: "cipd-resubmission-planner",
  startedAt: Date.now() - 30_000,
  website: "",
  context: {
    sourcePage: "/resources/cipd-resubmission-planner",
    landingPage: "/blog/resubmission-timeline-planning?utm_source=google",
    sourcePageType: "guide",
    utmSource: "google",
  },
};

function post(body: unknown) {
  return POST(
    new Request("http://test/api/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isDbConfigured).mockReturnValue(true);
  vi.mocked(insertSubscriber).mockResolvedValue(undefined);
  vi.mocked(addAudienceContact).mockResolvedValue({ ok: true });
  vi.mocked(notifySubscriber).mockResolvedValue({ ok: true });
});

describe("POST /api/subscribe capture contract", () => {
  it("persists the subscriber with normalised first-touch attribution", async () => {
    const res = await post(validBody);
    expect(res.status).toBe(201);
    expect(insertSubscriber).toHaveBeenCalledTimes(1);
    const sub = vi.mocked(insertSubscriber).mock.calls[0][0];
    expect(sub.resource).toBe("cipd-resubmission-planner");
    expect(sub.acquisition.sourcePage).toBe("/resources/cipd-resubmission-planner");
    // Query string stripped by validation; path preserved.
    expect(sub.acquisition.landingPage).toBe("/blog/resubmission-timeline-planning");
    expect(sub.acquisition.utmSource).toBe("google");
    // A magnet download never creates a lead record: this route touches
    // only the subscribers repository.
    expect(sub).not.toHaveProperty("supportType");
  });

  it("returns 201 when only the DB captures it (Resend + notify both down)", async () => {
    vi.mocked(addAudienceContact).mockResolvedValue({ ok: false, error: "send_failed" });
    vi.mocked(notifySubscriber).mockResolvedValue({ ok: false, error: "send_failed" });
    const res = await post(validBody);
    expect(res.status).toBe(201);
  });

  it("returns honest 503 only when all three channels fail", async () => {
    vi.mocked(insertSubscriber).mockRejectedValue(new Error("db down"));
    vi.mocked(addAudienceContact).mockResolvedValue({ ok: false, error: "send_failed" });
    vi.mocked(notifySubscriber).mockResolvedValue({ ok: false, error: "send_failed" });
    const res = await post(validBody);
    expect(res.status).toBe(503);
  });

  it("keeps pre-P0.3 behaviour when the DB is unconfigured", async () => {
    vi.mocked(isDbConfigured).mockReturnValue(false);
    const res = await post(validBody);
    expect(res.status).toBe(201);
    expect(insertSubscriber).not.toHaveBeenCalled();
  });

  it("a DB failure never blocks capture while another channel succeeds", async () => {
    vi.mocked(insertSubscriber).mockRejectedValue(new Error("db down"));
    const res = await post(validBody);
    expect(res.status).toBe(201);
  });
});
