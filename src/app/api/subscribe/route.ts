import { NextResponse } from "next/server";
import { validateSubscriberInput } from "@/lib/leads/validation";
import { notifySubscriber } from "@/lib/leads/notify";
import { addAudienceContact } from "@/lib/email/resend";
import { clientKey, rateLimit } from "@/lib/leads/rate-limit";
import type { Subscriber } from "@/lib/leads/types";

/**
 * POST /api/subscribe — lead-magnet / resource-download capture.
 *
 * This is a NURTURE funnel stage, deliberately separate from /api/leads:
 * resource downloads never enter the assessment lead-scoring system.
 *
 * PERSISTENCE (P0):
 *   1. The subscriber is stored as a Resend Audience contact when
 *      RESEND_AUDIENCE_ID is configured — that is real, persistent storage.
 *   2. A low-priority internal notification email is also sent (acceptable
 *      at current volume; becomes a digest/dashboard later).
 * If neither is configured the endpoint reports failure honestly; the client
 * still unlocks the free resource (the visitor's promise is the download,
 * not our storage).
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!rateLimit(`subscribe:${clientKey(request.headers)}`).allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const validated = validateSubscriberInput(body);
  if (!validated.ok) {
    if (validated.error === "rejected" || validated.error === "too_fast") {
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
  }

  const sub: Subscriber = { createdAt: new Date().toISOString(), ...validated.value };

  // Persist to Resend Contacts (best-effort) + notify (the reliable channel).
  const [stored, notified] = await Promise.all([
    addAudienceContact({ email: sub.email, firstName: sub.name?.split(" ")[0] }),
    notifySubscriber(sub),
  ]);

  if (!stored.ok && !notified.ok) {
    console.error(`[subscribe] capture failed (contact=${stored.error}, notify=${notified.error})`);
    return NextResponse.json({ ok: false, error: "delivery_failed" }, { status: 503 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export function GET() {
  return NextResponse.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
}
