/**
 * sendClientAcknowledgement gating tests (Escalation P1): cutover fails
 * closed, historical leads are never messaged, the ledger claim arbitrates
 * duplicates, and outcomes are recorded without throwing.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/notifications", () => ({
  claimNotification: vi.fn(async () => ({ id: 7 })),
  completeNotification: vi.fn(async () => undefined),
}));
vi.mock("@/lib/email/resend", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  notifyRecipient: vi.fn(() => "owner@example.com"),
  sendEmail: vi.fn(async () => ({ ok: true, id: "prov_ack" })),
}));

import { sendClientAcknowledgement } from "@/lib/leads/notify";
import { claimNotification, completeNotification } from "@/lib/db/notifications";
import { sendEmail } from "@/lib/email/resend";
import type { Lead } from "@/lib/leads/types";

const lead = {
  id: "CG-ACKTEST",
  createdAt: "2026-09-28T10:00:00.000Z",
  name: "Amira Hassan",
  email: "amira.h@example.com",
  level: "5",
  supportType: "assessment_guidance",
  score: 70,
  classification: "HIGH_INTENT",
  acquisition: { sourcePage: "/send-your-brief", sourcePageType: "other" },
} as unknown as Lead;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_API_KEY = "re_test";
  process.env.LEAD_AUTOMATION_CUTOVER = "2026-09-01T00:00:00Z";
  vi.mocked(claimNotification).mockResolvedValue({ id: 7 });
  vi.mocked(sendEmail).mockResolvedValue({ ok: true, id: "prov_ack" });
});

describe("sendClientAcknowledgement", () => {
  it("sends the approved wording to the client with the reference and first name", async () => {
    await sendClientAcknowledgement(lead);
    expect(claimNotification).toHaveBeenCalledWith(
      expect.objectContaining({ dedupeKey: "CG-ACKTEST:ack", kind: "ack" })
    );
    const msg = vi.mocked(sendEmail).mock.calls[0][0];
    expect(msg.to).toBe("amira.h@example.com");
    expect(msg.subject).toBe("We received your CIPD Guidance enquiry — CG-ACKTEST");
    expect(msg.html).toContain("Hi Amira,");
    expect(msg.html).toContain("CG-ACKTEST");
    expect(msg.replyTo).toBe("owner@example.com");
    expect(completeNotification).toHaveBeenCalledWith({ id: 7 }, { ok: true, id: "prov_ack" });
  });

  it("fails closed with no cutover configured", async () => {
    delete process.env.LEAD_AUTOMATION_CUTOVER;
    await sendClientAcknowledgement(lead);
    expect(claimNotification).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("never messages a pre-cutover (historical) lead", async () => {
    process.env.LEAD_AUTOMATION_CUTOVER = "2026-09-29T00:00:00Z";
    await sendClientAcknowledgement(lead);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("a refused claim (already acknowledged) sends nothing", async () => {
    vi.mocked(claimNotification).mockResolvedValue(null);
    await sendClientAcknowledgement(lead);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(completeNotification).not.toHaveBeenCalled();
  });

  it("records a failed send without throwing", async () => {
    vi.mocked(sendEmail).mockResolvedValue({ ok: false, error: "send_failed" });
    await expect(sendClientAcknowledgement(lead)).resolves.toBeUndefined();
    expect(completeNotification).toHaveBeenCalledWith(
      { id: 7 },
      { ok: false, error: "send_failed" }
    );
  });
});
