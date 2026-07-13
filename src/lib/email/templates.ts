/**
 * Internal notification templates.
 *
 * These are operational emails to the business owner, not marketing emails:
 * scannable, table-based, lightly branded (navy/gold). ALL user-controlled
 * values pass through esc() — the only place HTML is assembled from input.
 *
 * The module is structured so future notification kinds (visitor
 * acknowledgement, quote sent, status update) are additional exported
 * builders using the same shell.
 */

import type { Lead, Subscriber } from "@/lib/leads/types";
import { SUPPORT_TYPES } from "@/lib/leads/types";
import { classificationLabel } from "@/lib/leads/scoring";

// ─── Escaping ───
export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Shared shell ───
const NAVY = "#0c1626";
const GOLD = "#c39a3a";
const GREY = "#5b6b82";

function shell(title: string, badge: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f6f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${NAVY};">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:${NAVY};padding:16px 24px;">
      <span style="color:${GOLD};font-weight:700;font-size:14px;letter-spacing:.08em;">CIPD GUIDANCE</span>
      <span style="color:#94a3b8;font-size:12px;float:right;">${esc(badge)}</span>
    </div>
    <div style="padding:24px;">
      <h1 style="margin:0 0 16px;font-size:18px;">${esc(title)}</h1>
      ${body}
    </div>
  </div>
</body></html>`;
}

function section(heading: string, rows: [string, string | undefined][]): string {
  const items = rows
    .filter(([, v]) => v !== undefined && v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:${GREY};font-size:13px;white-space:nowrap;vertical-align:top;">${esc(k)}</td><td style="padding:4px 0;font-size:13px;font-weight:600;">${esc(v)}</td></tr>`
    )
    .join("");
  if (!items) return "";
  return `<p style="margin:18px 0 6px;font-size:11px;font-weight:700;letter-spacing:.1em;color:${GOLD};">${esc(heading)}</p><table style="border-collapse:collapse;">${items}</table>`;
}

// ─── Lead notification ───
// Format: "[PRIORITY] New CIPD Lead — Level 5 — 5HR01 — Resubmission support"
export function leadNotificationSubject(lead: Lead): string {
  const parts = [
    "New CIPD Lead",
    `Level ${lead.level}`,
    lead.unitCode,
    SUPPORT_TYPES[lead.supportType],
  ].filter(Boolean);
  return `[${classificationLabel(lead.classification)}] ${parts.join(" — ")}`;
}

export function leadNotificationHtml(lead: Lead): string {
  const cls = classificationLabel(lead.classification);
  const waDigits = lead.whatsapp?.replace(/\D/g, "");

  const header = `
    <div style="background:${lead.classification === "PRIORITY" ? "#fef3c7" : "#f1f5f9"};border-radius:8px;padding:12px 16px;margin-bottom:8px;">
      <span style="font-size:15px;font-weight:800;">${esc(cls)} LEAD</span>
      <span style="float:right;font-size:15px;font-weight:800;">Score: ${lead.score}</span>
    </div>`;

  const contact = section("CONTACT", [
    ["Name", lead.name],
    ["Email", lead.email],
    ["WhatsApp", lead.whatsapp],
    ["Country", lead.country],
  ]);

  const assessment = section("ASSESSMENT", [
    ["CIPD Level", `Level ${lead.level}`],
    ["Unit", lead.unitCode],
    ["Support Type", SUPPORT_TYPES[lead.supportType]],
    ["Word Count", lead.wordCount ? lead.wordCount.toLocaleString() : undefined],
    ["Deadline", lead.deadline],
  ]);

  const message = lead.message
    ? `<p style="margin:18px 0 6px;font-size:11px;font-weight:700;letter-spacing:.1em;color:${GOLD};">CLIENT MESSAGE</p>
       <div style="background:#f8fafc;border-radius:8px;padding:12px;font-size:13px;white-space:pre-wrap;">${esc(lead.message)}</div>`
    : "";

  const acquisition = section("ACQUISITION", [
    ["Source Page", lead.acquisition.sourcePage],
    ["Source Page Type", lead.acquisition.sourcePageType],
    ["Referrer", lead.acquisition.referrer],
    ["UTM Source", lead.acquisition.utmSource],
    ["UTM Medium", lead.acquisition.utmMedium],
    ["UTM Campaign", lead.acquisition.utmCampaign],
  ]);

  const action = waDigits
    ? `<a href="https://wa.me/${esc(waDigits)}" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:10px 18px;border-radius:999px;">Reply on WhatsApp</a>`
    : `<a href="mailto:${esc(lead.email)}" style="display:inline-block;background:${NAVY};color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:10px 18px;border-radius:999px;">Reply by email</a>`;

  const body = `${header}${contact}${assessment}${message}${acquisition}
    <p style="margin:18px 0 6px;font-size:11px;font-weight:700;letter-spacing:.1em;color:${GOLD};">NEXT ACTION</p>
    <p style="margin:6px 0 0;">${action}</p>
    <p style="margin:16px 0 0;font-size:11px;color:${GREY};">Reference ${esc(lead.id)} · received ${esc(lead.createdAt)}</p>`;

  return shell("New CIPD Guidance lead", lead.id, body);
}

// ─── Subscriber notification (low-priority, operational) ───
export function subscriberNotificationSubject(sub: Subscriber): string {
  return `[Subscriber] ${sub.resource} download — ${sub.email}`;
}

export function subscriberNotificationHtml(sub: Subscriber): string {
  const body =
    section("SUBSCRIBER", [
      ["Email", sub.email],
      ["Name", sub.name],
      ["CIPD Level", sub.level ? `Level ${sub.level}` : undefined],
      ["Country", sub.country],
      ["Resource", sub.resource],
    ]) +
    section("ACQUISITION", [
      ["Source Page", sub.acquisition.sourcePage],
      ["UTM Source", sub.acquisition.utmSource],
      ["UTM Campaign", sub.acquisition.utmCampaign],
    ]) +
    `<p style="margin:16px 0 0;font-size:11px;color:${GREY};">Nurture-stage contact — no action required. Received ${esc(sub.createdAt)}</p>`;
  return shell("New resource subscriber", "nurture", body);
}
