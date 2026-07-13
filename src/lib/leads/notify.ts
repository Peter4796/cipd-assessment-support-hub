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
 * P0 PERSISTENCE BOUNDARY: this email IS the lead record. If it cannot be
 * delivered, the lead is not captured and callers must report failure so the
 * client can fall back to a direct channel. Never swallow a failed send.
 */
export async function notifyLead(lead: Lead): Promise<SendResult> {
  const to = notifyRecipient();
  if (!to) return { ok: false, error: "unconfigured" };
  return sendEmail({
    to,
    subject: leadNotificationSubject(lead),
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
