/**
 * Notification channel abstraction (Escalation P1, approved §14) — exactly
 * as much abstraction as "email now, SMS next" requires and no more.
 *
 * Business logic composes an OutboundMessage; a channel delivers it. Email
 * wraps the existing Resend transport unchanged. SMS is a declared kind
 * with no implementation yet (next tranche): channelFor("sms") returns an
 * unconfigured channel that fails honestly, so escalation logic can be
 * written against both kinds today without any provider coupling.
 *
 * CONTENT RULE for future SMS (approved §15): reference, level, deadline
 * band and a pointer to admin only — never client names, message contents,
 * assessment material or document URLs. Enforced at composition time in
 * templates, restated here because this is the seam where SMS lands.
 */

import { sendEmail, type SendResult } from "@/lib/email/resend";

export type ChannelKind = "email" | "sms";

export type OutboundMessage = {
  to: string;
  /** Email only; ignored by SMS. */
  subject?: string;
  /** Email body (html) or SMS body (plain text). */
  html?: string;
  body?: string;
  replyTo?: string;
};

export type Channel = {
  kind: ChannelKind;
  configured(): boolean;
  send(msg: OutboundMessage): Promise<SendResult>;
};

const emailChannel: Channel = {
  kind: "email",
  configured: () => Boolean(process.env.RESEND_API_KEY),
  send: (msg) =>
    sendEmail({
      to: msg.to,
      subject: msg.subject ?? "",
      html: msg.html ?? "",
      replyTo: msg.replyTo,
    }),
};

/** SMS placeholder — implemented in the next tranche behind the same seam. */
const smsChannel: Channel = {
  kind: "sms",
  configured: () => false,
  send: async () => ({ ok: false, error: "unconfigured" }),
};

export function channelFor(kind: ChannelKind): Channel {
  return kind === "sms" ? smsChannel : emailChannel;
}
