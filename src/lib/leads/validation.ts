/**
 * Shared validation + normalisation for lead and subscriber submissions.
 *
 * Hand-rolled (no schema library) deliberately: two endpoints, small shapes,
 * zero new dependencies. All user-controlled text is length-capped and
 * control-character-stripped here; HTML escaping happens at render time in
 * the email templates (see src/lib/email/templates.ts).
 */

import {
  ATTACHMENT_CATEGORY_KEYS,
  CIPD_LEVELS,
  SUBMISSION_TYPES,
  SUPPORT_TYPE_KEYS,
  SOURCE_PAGE_TYPES,
  type AcquisitionContext,
  type AttachmentCategory,
  type CipdLevel,
  type FunnelMeta,
  type LeadAttachment,
  type LeadInput,
  type SourcePageType,
  type SubmissionType,
  type SubscriberInput,
  type SupportType,
} from "@/lib/leads/types";
import { ALLOWED_MIME_TYPES, MAX_FILES, MAX_FILE_BYTES, sanitiseFileName } from "@/lib/leads/uploads";

// ─── Limits ───
const MAX = {
  name: 120,
  provider: 120,
  referredCriteria: 1500,
  email: 254,
  whatsapp: 32,
  country: 80,
  unitCode: 12,
  message: 5000,
  path: 300,
  referrer: 500,
  utm: 120,
  resource: 80,
} as const;

/** Minimum ms between form render and submit — trivially fast submits are bots. */
export const MIN_SUBMIT_ELAPSED_MS = 2500;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UNIT_CODE_RE = /^[357][A-Z]{2}\d{2}$/;

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

// ─── Primitives ───
function cleanText(raw: unknown, max: number): string {
  if (typeof raw !== "string") return "";
  // Strip control chars (keep \n for messages), collapse whitespace runs, cap length.
  return raw
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim()
    .slice(0, max);
}

export function normaliseEmail(raw: unknown): string | null {
  const email = cleanText(raw, MAX.email).toLowerCase();
  return EMAIL_RE.test(email) ? email : null;
}

export function normaliseWhatsapp(raw: unknown): string | undefined {
  const cleaned = cleanText(raw, MAX.whatsapp).replace(/[^\d+() -]/g, "");
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return undefined;
  return cleaned;
}

export function normaliseUnitCode(raw: unknown): string | undefined {
  const code = cleanText(raw, MAX.unitCode).toUpperCase().replace(/\s/g, "");
  if (!code) return undefined;
  // Accept the canonical CIPD pattern; tolerate unknown-but-plausible codes.
  return UNIT_CODE_RE.test(code) ? code : code.slice(0, MAX.unitCode) || undefined;
}

export function normaliseLevel(raw: unknown): CipdLevel | null {
  // Extract digits first so "Level 7" and "CIPD Level 5" normalise correctly.
  const level = cleanText(raw, 20).replace(/\D/g, "");
  return (CIPD_LEVELS as readonly string[]).includes(level) ? (level as CipdLevel) : null;
}

export function normaliseSupportType(raw: unknown): SupportType | null {
  const key = cleanText(raw, 40);
  return (SUPPORT_TYPE_KEYS as readonly string[]).includes(key) ? (key as SupportType) : null;
}

export function normaliseWordCount(raw: unknown): number | undefined {
  const n =
    typeof raw === "number" ? raw : parseInt(String(raw ?? "").replace(/[^0-9]/g, ""), 10);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.min(Math.round(n), 100000);
}

export function normaliseDeadline(raw: unknown): string | undefined {
  const s = cleanText(raw, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  return Number.isNaN(new Date(`${s}T00:00:00`).getTime()) ? undefined : s;
}

function normalisePath(raw: unknown): string {
  const p = cleanText(raw, MAX.path);
  return p.startsWith("/") ? p.split("?")[0] : "/";
}

export function normaliseContext(raw: Partial<AcquisitionContext> | undefined): AcquisitionContext {
  const type = cleanText(raw?.sourcePageType, 20) as SourcePageType;
  return {
    sourcePage: normalisePath(raw?.sourcePage),
    sourcePageType: (SOURCE_PAGE_TYPES as readonly string[]).includes(type) ? type : "other",
    referrer: cleanText(raw?.referrer, MAX.referrer) || undefined,
    utmSource: cleanText(raw?.utmSource, MAX.utm) || undefined,
    utmMedium: cleanText(raw?.utmMedium, MAX.utm) || undefined,
    utmCampaign: cleanText(raw?.utmCampaign, MAX.utm) || undefined,
  };
}

export function normaliseSubmissionType(raw: unknown): SubmissionType | undefined {
  const v = cleanText(raw, 20);
  return (SUBMISSION_TYPES as readonly string[]).includes(v) ? (v as SubmissionType) : undefined;
}

/**
 * Blob URL allowlist — attachments are echoed into the internal notification
 * email as links, so ONLY URLs on Vercel Blob storage hosts are accepted.
 * Anything else (attacker-supplied phishing links, javascript: URLs) is
 * rejected outright. Pathnames must sit under our enquiries/ namespace.
 */
export function isTrustedBlobUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export function normaliseAttachments(raw: unknown): LeadAttachment[] | { error: string } {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) return { error: "invalid_attachments" };
  if (raw.length > MAX_FILES) return { error: "too_many_files" };
  const out: LeadAttachment[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return { error: "invalid_attachments" };
    const a = item as Record<string, unknown>;
    const url = typeof a.url === "string" ? a.url.trim() : "";
    const pathname = cleanText(a.pathname, 300);
    const category = cleanText(a.category, 30) as AttachmentCategory;
    const mimeType = cleanText(a.mimeType, 100);
    const sizeBytes = typeof a.sizeBytes === "number" ? Math.round(a.sizeBytes) : NaN;
    if (!isTrustedBlobUrl(url)) return { error: "invalid_attachments" };
    if (!pathname.startsWith("enquiries/")) return { error: "invalid_attachments" };
    if (!(ATTACHMENT_CATEGORY_KEYS as readonly string[]).includes(category)) {
      return { error: "invalid_attachments" };
    }
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) return { error: "invalid_attachments" };
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_FILE_BYTES) {
      return { error: "invalid_attachments" };
    }
    out.push({
      id: cleanText(a.id, 40) || `att_${out.length + 1}`,
      originalFileName: sanitiseFileName(String(a.originalFileName ?? "document")),
      pathname,
      mimeType,
      sizeBytes,
      uploadStatus: "uploaded",
      url,
      uploadedAt: new Date().toISOString(),
      category,
    });
  }
  return out;
}

export function normaliseFunnel(raw: Partial<FunnelMeta> | undefined): FunnelMeta | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const startedAt = cleanText(raw.startedAt, 30);
  const startedDate = startedAt ? new Date(startedAt) : null;
  const started = startedDate && !Number.isNaN(startedDate.getTime()) ? startedDate : null;
  const completed = new Date();
  const duration = started
    ? Math.max(0, Math.min(86400, Math.round((completed.getTime() - started.getTime()) / 1000)))
    : undefined;
  const meta: FunnelMeta = {
    entryCta: cleanText(raw.entryCta, 40) || undefined,
    startedAt: started ? started.toISOString() : undefined,
    completedAt: completed.toISOString(),
    durationSeconds: duration,
  };
  return meta.entryCta || meta.startedAt ? meta : undefined;
}

// ─── Anti-spam checks shared by both endpoints ───
export function spamCheck(input: { website?: string; startedAt?: number }): string | null {
  // Honeypot: real users never see or fill this field.
  if (typeof input.website === "string" && input.website.trim() !== "") return "rejected";
  // Time gate: submits faster than a human can type are bots.
  if (typeof input.startedAt === "number" && Number.isFinite(input.startedAt)) {
    if (Date.now() - input.startedAt < MIN_SUBMIT_ELAPSED_MS) return "too_fast";
  }
  return null;
}

// ─── Lead validation ───
export type ValidatedLead = {
  name: string;
  email: string;
  whatsapp?: string;
  country?: string;
  level: CipdLevel;
  unitCode?: string;
  supportType: SupportType;
  wordCount?: number;
  deadline?: string;
  message?: string;
  provider?: string;
  submissionType?: SubmissionType;
  referredCriteria?: string;
  attachments: LeadAttachment[];
  funnel?: FunnelMeta;
  reachedReview: boolean;
  schemaVersion: 1 | 2;
  acquisition: AcquisitionContext;
};

export function validateLeadInput(body: unknown): ValidationResult<ValidatedLead> {
  if (typeof body !== "object" || body === null) return { ok: false, error: "invalid_payload" };
  const input = body as LeadInput;

  const spam = spamCheck(input);
  if (spam) return { ok: false, error: spam };

  const name = cleanText(input.name, MAX.name);
  if (name.length < 2) return { ok: false, error: "invalid_name" };

  const email = normaliseEmail(input.email);
  if (!email) return { ok: false, error: "invalid_email" };

  const level = normaliseLevel(input.level);
  if (!level) return { ok: false, error: "invalid_level" };

  const supportType = normaliseSupportType(input.supportType);
  if (!supportType) return { ok: false, error: "invalid_support_type" };

  const attachments = normaliseAttachments(input.attachments);
  if (!Array.isArray(attachments)) return { ok: false, error: attachments.error };

  const funnel = normaliseFunnel(input.funnel);

  return {
    ok: true,
    value: {
      name,
      email,
      whatsapp: normaliseWhatsapp(input.whatsapp),
      country: cleanText(input.country, MAX.country) || undefined,
      level,
      unitCode: normaliseUnitCode(input.unitCode),
      supportType,
      wordCount: normaliseWordCount(input.wordCount),
      deadline: normaliseDeadline(input.deadline),
      message: cleanText(input.message, MAX.message) || undefined,
      provider: cleanText(input.provider, MAX.provider) || undefined,
      submissionType: normaliseSubmissionType(input.submissionType),
      referredCriteria: cleanText(input.referredCriteria, MAX.referredCriteria) || undefined,
      attachments,
      funnel,
      reachedReview: input.reachedReview === true,
      // Funnel submissions (v2) carry funnel meta or attachments; plain
      // contact-form submissions remain v1.
      schemaVersion: funnel || attachments.length > 0 || input.reachedReview === true ? 2 : 1,
      acquisition: normaliseContext(input.context),
    },
  };
}

// ─── Subscriber validation ───
export type ValidatedSubscriber = {
  name?: string;
  email: string;
  level?: string;
  country?: string;
  resource: string;
  acquisition: AcquisitionContext;
};

export function validateSubscriberInput(body: unknown): ValidationResult<ValidatedSubscriber> {
  if (typeof body !== "object" || body === null) return { ok: false, error: "invalid_payload" };
  const input = body as SubscriberInput;

  const spam = spamCheck(input);
  if (spam) return { ok: false, error: spam };

  const email = normaliseEmail(input.email);
  if (!email) return { ok: false, error: "invalid_email" };

  const resource = cleanText(input.resource, MAX.resource);
  if (!resource) return { ok: false, error: "invalid_resource" };

  return {
    ok: true,
    value: {
      name: cleanText(input.name, MAX.name) || undefined,
      email,
      level: normaliseLevel(input.level) ?? undefined,
      country: cleanText(input.country, MAX.country) || undefined,
      resource,
      acquisition: normaliseContext(input.context),
    },
  };
}
