/**
 * Route tests for GET /api/cron/leads (Escalation P1): auth fails closed,
 * dry-run claims/sends nothing, cutover gating, ledger-skip handling, and
 * digest window/idempotency behaviour. The planner itself is exhaustively
 * covered in operations.test.ts; these tests pin the orchestration.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/client", () => ({ isDbConfigured: vi.fn(() => true) }));
vi.mock("@/lib/db/leads", () => ({ listOperationalLeads: vi.fn(async () => []) }));
vi.mock("@/lib/db/notifications", () => ({
  claimNotification: vi.fn(async () => ({ id: 1 })),
  completeNotification: vi.fn(async () => undefined),
}));
vi.mock("@/lib/email/resend", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  notifyRecipient: vi.fn(() => "owner@example.com"),
  sendEmail: vi.fn(async () => ({ ok: true, id: "prov_1" })),
}));

import { GET } from "@/app/api/cron/leads/route";
import { listOperationalLeads } from "@/lib/db/leads";
import { claimNotification, completeNotification } from "@/lib/db/notifications";
import { sendEmail } from "@/lib/email/resend";

const SECRET = "test-cron-secret";

function req(params = "", auth: string | null = `Bearer ${SECRET}`) {
  return new Request(`http://test/api/cron/leads${params}`, {
    headers: auth ? { authorization: auth } : {},
  });
}

type Op = {
  row: Record<string, unknown>;
  eventStatuses: string[];
  notesCount: number;
  lastEventAt: Date;
};

/** An urgent, untouched, post-cutover lead well past both thresholds. */
function urgentLead(over: Partial<Record<string, unknown>> = {}): Op {
  const createdAt = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return {
    row: {
      id: "CG-URGENT1",
      createdAt,
      status: "NEW",
      classification: "HIGH_INTENT",
      level: "5",
      unitCode: null,
      supportType: "resubmission",
      submissionType: "resubmission",
      deadline: null,
      quoteSentAt: null,
      contactedAt: null,
      archivedAt: null,
      ...over,
    },
    eventStatuses: ["NEW"],
    notesCount: 0,
    lastEventAt: createdAt,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = SECRET;
  process.env.RESEND_API_KEY = "re_test";
  process.env.OWNER_TIMEZONE = "Africa/Nairobi";
  // Cutover in the past: automation active for freshly created test leads.
  process.env.LEAD_AUTOMATION_CUTOVER = "2026-01-01T00:00:00Z";
  vi.mocked(listOperationalLeads).mockResolvedValue([]);
  vi.mocked(claimNotification).mockResolvedValue({ id: 1 });
  vi.mocked(sendEmail).mockResolvedValue({ ok: true, id: "prov_1" });
});

describe("auth — fails closed like the retention cron", () => {
  it("503 without CRON_SECRET configured; 401 on bad bearer", async () => {
    delete process.env.CRON_SECRET;
    expect((await GET(req())).status).toBe(503);
    process.env.CRON_SECRET = SECRET;
    expect((await GET(req("", "Bearer wrong"))).status).toBe(401);
    expect((await GET(req("", null))).status).toBe(401);
  });
});

describe("escalation sweep", () => {
  it("sends both due escalations for an urgent untouched lead and records them", async () => {
    vi.mocked(listOperationalLeads).mockResolvedValue([urgentLead()] as never);
    const body = await (await GET(req())).json();
    expect(body.escalationsPlanned).toBe(2);
    expect(body.escalationsSent).toBe(2);
    expect(claimNotification).toHaveBeenCalledWith(
      expect.objectContaining({ dedupeKey: "CG-URGENT1:escalation_1", kind: "escalation_1" })
    );
    expect(claimNotification).toHaveBeenCalledWith(
      expect.objectContaining({ dedupeKey: "CG-URGENT1:escalation_2", kind: "escalation_2" })
    );
    // Exactly the two escalation claims completed (a digest may also
    // legitimately fire depending on the real clock's owner-local hour).
    const escalationClaims = vi
      .mocked(claimNotification)
      .mock.calls.filter((c) => String(c[0].kind).startsWith("escalation"));
    expect(escalationClaims).toHaveLength(2);
  });

  it("dry-run plans but never claims or sends", async () => {
    vi.mocked(listOperationalLeads).mockResolvedValue([urgentLead()] as never);
    const body = await (await GET(req("?dry=1"))).json();
    expect(body.dry).toBe(true);
    expect(body.escalationsPlanned).toBe(2);
    expect(claimNotification).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("ledger refusal (already sent / in flight / capped) is a skip, not a resend", async () => {
    vi.mocked(listOperationalLeads).mockResolvedValue([urgentLead()] as never);
    vi.mocked(claimNotification).mockResolvedValue(null);
    const body = await (await GET(req())).json();
    expect(body.escalationsSkipped).toBe(2);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("CUTOVER: historical leads trigger nothing; unset cutover disables automation", async () => {
    const historical = urgentLead({ createdAt: new Date("2025-12-01T00:00:00Z") });
    historical.lastEventAt = new Date("2025-12-01T00:00:00Z");
    vi.mocked(listOperationalLeads).mockResolvedValue([historical] as never);
    let body = await (await GET(req())).json();
    expect(body.escalationsPlanned).toBe(0);

    delete process.env.LEAD_AUTOMATION_CUTOVER;
    vi.mocked(listOperationalLeads).mockResolvedValue([urgentLead()] as never);
    body = await (await GET(req())).json();
    expect(body.automation).toBe("disabled_no_cutover");
    expect(body.escalationsPlanned).toBe(0);
    // The digest (internal visibility) may still send; no ESCALATION email may.
    for (const call of vi.mocked(sendEmail).mock.calls) {
      expect(call[0].subject).not.toMatch(/^ESCALATION/);
    }
  });

  it("a touched lead (contacted) triggers nothing", async () => {
    vi.mocked(listOperationalLeads).mockResolvedValue([
      urgentLead({ contactedAt: new Date() }),
    ] as never);
    const body = await (await GET(req())).json();
    expect(body.escalationsPlanned).toBe(0);
  });

  it("a failed send is recorded as failed on the claim", async () => {
    vi.mocked(listOperationalLeads).mockResolvedValue([urgentLead()] as never);
    vi.mocked(sendEmail).mockResolvedValue({ ok: false, error: "send_failed" });
    const body = await (await GET(req())).json();
    expect(body.escalationsFailed).toBe(2);
    expect(completeNotification).toHaveBeenCalledWith(
      { id: 1 },
      { ok: false, error: "send_failed" }
    );
  });
});

describe("digest", () => {
  it("digest claim uses the owner-day dedupe key and skip means already sent", async () => {
    // Window state depends on the real clock's owner-local hour; both
    // branches are asserted deterministically.
    vi.mocked(listOperationalLeads).mockResolvedValue([
      urgentLead({ createdAt: new Date("2025-12-01T00:00:00Z") }),
    ] as never);
    vi.mocked(claimNotification).mockResolvedValue(null);
    const body = await (await GET(req())).json();
    if (body.digest === "window_closed") {
      expect(claimNotification).not.toHaveBeenCalledWith(
        expect.objectContaining({ kind: "digest" })
      );
    } else {
      expect(body.digest).toBe("already_sent_today");
      expect(claimNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "digest",
          dedupeKey: expect.stringMatching(/^digest:\d{4}-\d{2}-\d{2}$/),
        })
      );
      expect(sendEmail).not.toHaveBeenCalled();
    }
  });

  it("an empty estate sends no digest", async () => {
    vi.mocked(listOperationalLeads).mockResolvedValue([]);
    const body = await (await GET(req())).json();
    expect(["empty_not_sent", "window_closed"]).toContain(body.digest);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
