"use server";

/**
 * Admin lead operations (P2.4) — server actions for the detail page.
 *
 * ACCESS CONTROL: server actions POST to this /admin/leads/[id] route, so
 * the Basic Auth middleware authenticates every invocation before it runs
 * (same gate as the pages). No separate API surface exists.
 *
 * Input handling: values come from the owner's own authenticated forms, but
 * are still validated/capped server-side; malformed input is rejected with
 * a machine code, never persisted.
 */

import { revalidatePath } from "next/cache";
import { isDbConfigured } from "@/lib/db/client";
import { addLeadNote, getLeadDetail, saveQuote, updateLeadStatus } from "@/lib/db/leads";
import { recommendQuoteForLead } from "@/lib/admin/quote";
import type { CipdLevel, SupportType } from "@/lib/leads/types";

const LEAD_ID_RE = /^CG-[0-9A-Z]{6}$/;

const QUOTE_CURRENCIES = ["USD", "GBP", "AED"] as const;

function cleanText(raw: FormDataEntryValue | null, max: number): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

function leadId(formData: FormData): string | null {
  const id = cleanText(formData.get("leadId"), 12);
  return LEAD_ID_RE.test(id) ? id : null;
}

export async function changeLeadStatus(formData: FormData): Promise<void> {
  if (!isDbConfigured()) return;
  const id = leadId(formData);
  if (!id) return;
  const to = cleanText(formData.get("to"), 30);
  const reopen = formData.get("reopen") === "1";
  const lostReason = cleanText(formData.get("lostReason"), 300) || undefined;

  const result = await updateLeadStatus(id, to, { reopen, lostReason });
  if (!result.ok && result.error !== "same_status") {
    console.error(`[admin] status change rejected (${result.error}) ref=${id}`);
  }
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin");
}

export async function addNote(formData: FormData): Promise<void> {
  if (!isDbConfigured()) return;
  const id = leadId(formData);
  if (!id) return;
  const body = cleanText(formData.get("body"), 5000);
  if (!body) return;
  await addLeadNote(id, body);
  revalidatePath(`/admin/leads/${id}`);
}

export async function recordQuote(formData: FormData): Promise<void> {
  if (!isDbConfigured()) return;
  const id = leadId(formData);
  if (!id) return;

  // Tolerate thousands separators/spaces, but REJECT anything else — a
  // minus sign must never sanitise into a valid amount.
  const amountRaw = cleanText(formData.get("amount"), 12).replace(/[,\s]/g, "");
  if (!/^\d+$/.test(amountRaw)) return;
  const amount = parseInt(amountRaw, 10);
  if (amount < 1 || amount > 100000) return;

  const currencyRaw = cleanText(formData.get("currency"), 3);
  const currency = (QUOTE_CURRENCIES as readonly string[]).includes(currencyRaw)
    ? currencyRaw
    : "USD";
  const notes = cleanText(formData.get("notes"), 2000) || undefined;

  // Recommendation snapshot is recomputed server-side from the stored lead —
  // never trusted from the form.
  const detail = await getLeadDetail(id);
  if (!detail) return;
  const recommendation = recommendQuoteForLead({
    level: detail.lead.level as CipdLevel,
    supportType: detail.lead.supportType as SupportType,
    wordCount: detail.lead.wordCount,
    deadline: detail.lead.deadline,
  });

  await saveQuote(id, { amount, currency, notes, recommendedMid: recommendation.mid });
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin");
}

export async function deleteAttachmentNow(formData: FormData): Promise<void> {
  if (!isDbConfigured()) return;
  const id = leadId(formData);
  if (!id) return;
  const attachmentId = parseInt(cleanText(formData.get("attachmentId"), 12), 10);
  if (!Number.isInteger(attachmentId) || attachmentId < 1) return;

  // Resolve through the lead so a tampered attachmentId can never delete
  // another lead's file.
  const detail = await getLeadDetail(id);
  const attachment = detail?.attachments.find((a) => a.id === attachmentId);
  if (!attachment || attachment.deletedAt) return;

  try {
    const { del } = await import("@vercel/blob");
    await del(attachment.pathname);
    const { markAttachmentDeleted } = await import("@/lib/db/leads");
    await markAttachmentDeleted(attachmentId, "owner_request");
  } catch {
    console.error(`[admin] manual attachment delete failed att=${attachmentId}`);
    const { recordAttachmentDeleteFailure } = await import("@/lib/db/leads");
    await recordAttachmentDeleteFailure(attachmentId, "blob_delete_failed").catch(() => undefined);
  }
  revalidatePath(`/admin/leads/${id}`);
}
