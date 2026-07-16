/**
 * Notification service — the single place API routes call to deliver
 * operational notifications. Composes templates (src/lib/email/templates.ts)
 * with the transport (src/lib/email/resend.ts).
 *
 * Future notification kinds (visitor acknowledgement, quote sent, status
 * update) are added here as new functions — routes and components never
 * assemble emails themselves.
 */

import type { Lead, Subscriber } from "@/lib/leads/types";
import { emailConfigured, notifyRecipient, sendEmail, type SendResult } from "@/lib/email/resend";
import {
  leadNotificationHtml,
  leadNotificationSubject,
  subscriberNotificationHtml,
  subscriberNotificationSubject,
} from "@/lib/email/templates";

export { emailConfigured };

/**
 * Deliver the internal lead notification.
 *
 * P2 CONTRACT: the database is the system of record and this email is the
 * operational alert. When the lead row is safely persisted, a failed send is
 * recorded on the row (admin badge + retry) and never fails the request.
 * When persistence itself failed, the email falls back to being the record
 * for that one lead — the subject carries a [NOT PERSISTED] marker so the
 * owner knows no admin row exists — and only if BOTH channels fail does the
 * API report failure so the client can use a direct channel.
 */
export async function notifyLead(
  lead: Lead,
  options?: { persisted?: boolean }
): Promise<SendResult> {
  const to = notifyRecipient();
  if (!to) return { ok: false, error: "unconfigured" };
  const marker = options?.persisted === false ? "[NOT PERSISTED] " : "";
  return sendEmail({
    to,
    subject: `${marker}${leadNotificationSubject(lead)}`,
    html: leadNotificationHtml(lead),
    replyTo: lead.email, // reply lands directly with the client
  });
}

/**
 * Deliver the internal subscriber notification (nurture stage, low priority).
 * Volume is currently low enough that one email per download is acceptable;
 * revisit with a digest or dashboard once volume grows.
 */
export async function notifySubscriber(sub: Subscriber): Promise<SendResult> {
  const to = notifyRecipient();
  if (!to) return { ok: false, error: "unconfigured" };
  return sendEmail({
    to,
    subject: subscriberNotificationSubject(sub),
    html: subscriberNotificationHtml(sub),
    replyTo: sub.email,
  });
}
