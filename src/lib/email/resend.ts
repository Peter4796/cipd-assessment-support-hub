/**
 * Email transport — thin wrapper over the Resend REST API.
 *
 * Deliberately fetch-based (no SDK dependency): one endpoint, one shape.
 * Nothing outside src/lib/email should talk to Resend directly; notification
 * composition lives in templates.ts and the public API is sendEmail() +
 * addAudienceContact().
 *
 * Environment:
 *   RESEND_API_KEY      — required for any delivery. Without it, sends fail
 *                         with "unconfigured" and callers must surface an
 *                         honest fallback (never pretend delivery happened).
 *   EMAIL_FROM          — verified sender, e.g. "CIPD Guidance <leads@cipdguidance.com>"
 *   LEAD_NOTIFY_EMAIL   — internal recipient for lead notifications.
 *   RESEND_AUDIENCE_ID  — optional; enables persistent subscriber storage in
 *                         Resend Contacts.
 */

const RESEND_API = "https://api.resend.com";

export type SendResult =
  | { ok: true; id?: string }
  | { ok: false; error: "unconfigured" | "send_failed" };

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.LEAD_NOTIFY_EMAIL);
}

export function notifyRecipient(): string | undefined {
  return process.env.LEAD_NOTIFY_EMAIL;
}

function fromAddress(): string {
  return process.env.EMAIL_FROM || "CIPD Guidance <onboarding@resend.dev>";
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "unconfigured" };

  try {
    const res = await fetch(`${RESEND_API}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [params.to],
        subject: params.subject,
        html: params.html,
        ...(params.replyTo ? { reply_to: [params.replyTo] } : {}),
      }),
    });
    if (!res.ok) {
      // Log status only — never the email body (may contain client details).
      console.error(`[email] Resend send failed: HTTP ${res.status}`);
      return { ok: false, error: "send_failed" };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch {
    console.error("[email] Resend send failed: network error");
    return { ok: false, error: "send_failed" };
  }
}

/**
 * Persist a subscriber into a Resend Audience (free-tier contact storage).
 * Returns "unconfigured" when RESEND_AUDIENCE_ID is not set — callers decide
 * how honest copy should degrade.
 */
export async function addAudienceContact(params: {
  email: string;
  firstName?: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) return { ok: false, error: "unconfigured" };

  try {
    const res = await fetch(`${RESEND_API}/audiences/${audienceId}/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: params.email,
        first_name: params.firstName,
        unsubscribed: false,
      }),
    });
    if (!res.ok) {
      console.error(`[email] Resend contact add failed: HTTP ${res.status}`);
      return { ok: false, error: "send_failed" };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch {
    console.error("[email] Resend contact add failed: network error");
    return { ok: false, error: "send_failed" };
  }
}
