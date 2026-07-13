import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { validateLeadInput } from "@/lib/leads/validation";
import { scoreLead } from "@/lib/leads/scoring";
import { notifyLead } from "@/lib/leads/notify";
import { clientKey, rateLimit } from "@/lib/leads/rate-limit";
import type { Lead } from "@/lib/leads/types";

/**
 * POST /api/leads — capture an assessment-support enquiry.
 *
 * ARCHITECTURE NOTE (P0): there is intentionally no database yet. The flow is
 *   validate → score → email the lead to LEAD_NOTIFY_EMAIL (Resend) → respond.
 * The notification email IS the persistence for now. If delivery cannot be
 * guaranteed (missing config or a failed send), this endpoint returns an
 * error so the client can fall back to direct WhatsApp/email — we never
 * pretend a lead was captured. The P2 database tranche adds an insert before
 * the notification without changing this contract.
 *
 * Responses (structured JSON, no internals):
 *   201 { ok: true, reference }
 *   4xx/5xx { ok: false, error: <code> }
 *
 * The lead score/classification are computed here and included ONLY in the
 * internal email — never in the response body.
 */

export const runtime = "nodejs";

function newReference(): string {
  // e.g. CG-7K2M9Q — unambiguous alphabet, 6 chars
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const bytes = randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return `CG-${out}`;
}

export async function POST(request: Request) {
  // Rate limit before doing any work.
  if (!rateLimit(`leads:${clientKey(request.headers)}`).allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const validated = validateLeadInput(body);
  if (!validated.ok) {
    // Honeypot/time-gate hits get a 200 so bots learn nothing; real
    // validation errors get a 400 with a machine-readable code.
    if (validated.error === "rejected" || validated.error === "too_fast") {
      return NextResponse.json({ ok: true, reference: newReference() }, { status: 200 });
    }
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
  }

  const v = validated.value;
  const { score, classification } = scoreLead({
    ...v,
    attachmentCategories: v.attachments.map((a) => a.category),
  });

  const lead: Lead = {
    id: newReference(),
    createdAt: new Date().toISOString(),
    ...v,
    attachments: v.attachments.length > 0 ? v.attachments : undefined,
    score,
    classification,
  };

  const sent = await notifyLead(lead);
  if (!sent.ok) {
    // Log the failure class only — never assessment content or PII.
    console.error(`[leads] capture failed (${sent.error}) ref=${lead.id}`);
    const status = sent.error === "unconfigured" ? 503 : 502;
    return NextResponse.json({ ok: false, error: "delivery_failed" }, { status });
  }

  return NextResponse.json({ ok: true, reference: lead.id }, { status: 201 });
}

export function GET() {
  return NextResponse.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
}
