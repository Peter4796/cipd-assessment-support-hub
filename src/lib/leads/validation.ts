/**
 * Shared validation + normalisation for lead and subscriber submissions.
 *
 * Hand-rolled (no schema library) deliberately: two endpoints, small shapes,
 * zero new dependencies. All user-controlled text is length-capped and
 * control-character-stripped here; HTML escaping happens at render time in
 * the email templates (see src/lib/email/templates.ts).
 */

import {
  CIPD_LEVELS,
  SUPPORT_TYPE_KEYS,
  SOURCE_PAGE_TYPES,
  type AcquisitionContext,
  type CipdLevel,
  type LeadInput,
  type SourcePageType,
  type SubscriberInput,
  type SupportType,
} from "@/lib/leads/types";

// ─── Limits ───
const MAX = {
  name: 120,
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
