"use client";

import { useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { site, whatsappLink, emailLink } from "@/lib/site";
import { Icon } from "@/components/Icon";
import { trackEvent } from "@/lib/analytics";
import { buildAcquisitionContext, derivePageType } from "@/lib/leads/context";
import { SUPPORT_TYPES, SUPPORT_TYPE_KEYS, type SupportType } from "@/lib/leads/types";

/**
 * Primary enquiry form — "Send Your Assessment Brief".
 *
 * LEAD CAPTURE FLOW (P0):
 *   submit → POST /api/leads (validated + scored + emailed server-side)
 *   → confirmation ("Your assessment enquiry has been received.")
 *   → optional "Continue on WhatsApp" with a structured, non-sensitive message.
 *
 * Capture is the primary action; WhatsApp is a continuation, not a
 * requirement. If the API is unavailable, the form falls back to the direct
 * WhatsApp/email compose flow so no enquiry is ever dead-ended.
 *
 * Contextual prefill: /contact?level=5&unit=5CO01&support=resubmission
 * (values validated before use — see lib/leads/context.ts + server-side
 * re-validation in /api/leads).
 *
 * NOTE: document upload is deliberately absent in P0 — real uploads arrive
 * in P1 (Vercel Blob). We never imply a file was received when it wasn't;
 * the confirmation invites sharing the brief via WhatsApp/email instead.
 */

const LEVELS = [
  { value: "3", label: "Level 3 (Foundation)" },
  { value: "5", label: "Level 5 (Associate Diploma)" },
  { value: "7", label: "Level 7 (Advanced Diploma)" },
] as const;

type FormState = {
  name: string;
  email: string;
  whatsapp: string;
  country: string;
  level: string;
  unitCode: string;
  supportType: SupportType;
  deadline: string;
  wordCount: string;
  message: string;
  website: string; // honeypot — hidden from real users
};

function prefillFromParams(params: URLSearchParams): Partial<FormState> {
  const out: Partial<FormState> = {};
  const level = params.get("level");
  if (level && ["3", "5", "7"].includes(level)) out.level = level;
  const unit = params.get("unit");
  if (unit && /^[357][A-Za-z]{2}\d{2}$/.test(unit)) {
    out.unitCode = unit.toUpperCase();
    if (!out.level) out.level = unit[0];
  }
  const support = params.get("support");
  if (support && (SUPPORT_TYPE_KEYS as readonly string[]).includes(support)) {
    out.supportType = support as SupportType;
  }
  return out;
}

function fmtDeadline(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

export function EnquiryForm() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prefill = useMemo(() => prefillFromParams(searchParams), [searchParams]);

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    whatsapp: "",
    country: "",
    level: prefill.level ?? "5",
    unitCode: prefill.unitCode ?? "",
    supportType: prefill.supportType ?? "assessment_guidance",
    deadline: "",
    wordCount: "",
    message: "",
    website: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "captured" | "fallback">("idle");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [reference, setReference] = useState<string>("");
  const startedAt = useRef<number>(Date.now());
  const startedTracked = useRef(false);

  const sourcePageType = derivePageType(pathname);

  const update = (key: keyof FormState, value: string) => {
    if (!startedTracked.current) {
      startedTracked.current = true;
      trackEvent("lead_form_started", { source_page_type: sourcePageType });
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    setStatus("submitting");
    trackEvent("lead_form_submitted", {
      source_page_type: sourcePageType,
      cipd_level: form.level,
      unit_code: form.unitCode || undefined,
      support_type: form.supportType,
    });

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startedAt: startedAt.current,
          context: buildAcquisitionContext(pathname),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        reference?: string;
        error?: string;
      };

      if (res.ok && data.ok) {
        setReference(data.reference ?? "");
        setStatus("captured");
        trackEvent("lead_created", {
          source_page_type: sourcePageType,
          cipd_level: form.level,
          unit_code: form.unitCode || undefined,
          support_type: form.supportType,
        });
        return;
      }

      // Correctable input problems stay on the form; delivery problems fall
      // back to the direct channels so the enquiry is never dead-ended.
      if (res.status === 400 && data.error) {
        setFieldError(humanError(data.error));
        setStatus("idle");
        trackEvent("lead_form_error", { error: data.error });
        return;
      }
      setStatus("fallback");
      trackEvent("lead_form_error", { error: data.error ?? `http_${res.status}` });
    } catch {
      setStatus("fallback");
      trackEvent("lead_form_error", { error: "network" });
    }
  };

  // ─── Continuation / fallback message builders ───

  // Post-capture WhatsApp continuation: structured fields only — never the
  // free-text message or (future) document content.
  const continuationDetails = [
    reference ? `Reference: ${reference}` : "",
    `CIPD Level: Level ${form.level}`,
    form.unitCode ? `Unit: ${form.unitCode}` : "",
    `Support needed: ${SUPPORT_TYPES[form.supportType]}`,
    form.deadline ? `Deadline: ${fmtDeadline(form.deadline)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const continuationMessage = [
    "Hi, I've just submitted an assessment enquiry through CIPD Guidance.",
    continuationDetails,
    "I'd like to discuss my assessment.",
  ].join("\n\n");

  // Failure fallback: the visitor sends their own enquiry directly, so the
  // full detail (including their message) belongs in it.
  const fallbackMessage = [
    "Hi CIPD Guidance, I'd like a quote.",
    "",
    `Name: ${form.name || "—"}`,
    `CIPD level: Level ${form.level}`,
    `Unit code: ${form.unitCode || "—"}`,
    `Support needed: ${SUPPORT_TYPES[form.supportType]}`,
    `Word count: ${form.wordCount || "—"}`,
    `Deadline: ${form.deadline || "—"}`,
    `Country: ${form.country || "—"}`,
    form.message ? `\nMessage: ${form.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const labelCls = "mb-1.5 block text-sm font-medium text-navy-800";
  const inputCls =
    "w-full rounded-xl border border-mist-300 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

  // ─── Captured: confirmation + optional WhatsApp continuation ───
  if (status === "captured") {
    return (
      <div className="rounded-3xl border border-teal-200 bg-white p-8 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
          <Icon name="check" className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-2xl font-bold text-navy-900">
          Your assessment enquiry has been received.
        </h2>
        <p className="mt-2 text-sm text-navy-600">
          We&apos;ll review the details you&apos;ve provided and respond as soon as possible.
        </p>
        {reference && (
          <p className="mt-3 text-sm text-navy-500">
            Your reference:{" "}
            <span className="font-mono font-semibold text-navy-900">{reference}</span>
          </p>
        )}

        <div className="mt-6 rounded-2xl border border-mist-200 bg-mist-50 p-5">
          <p className="font-semibold text-navy-900">Need a faster response?</p>
          <a
            href={whatsappLink(continuationMessage)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent("whatsapp_clicked", {
                location: "lead_confirmation",
                source_page_type: sourcePageType,
                cipd_level: form.level,
                unit_code: form.unitCode || undefined,
              })
            }
            className="btn-whatsapp mt-3 w-full"
          >
            <Icon name="whatsapp" className="h-4 w-4" /> Continue on WhatsApp
          </a>
          <p className="mt-3 text-xs text-navy-500">
            You can also share your assessment brief document with us there.
          </p>
        </div>
      </div>
    );
  }

  // ─── Delivery fallback: direct channels, nothing lost ───
  if (status === "fallback") {
    return (
      <div className="rounded-3xl border border-gold-200 bg-white p-8 shadow-card">
        <h2 className="text-xl font-bold text-navy-900">Send your enquiry directly</h2>
        <p className="mt-2 text-sm text-navy-600">
          Our enquiry service is temporarily unavailable, but your details are ready to send.
          Choose a channel below and your enquiry will reach us immediately.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <a
            href={whatsappLink(fallbackMessage)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent("whatsapp_clicked", { location: "lead_fallback", source_page_type: sourcePageType })
            }
            className="btn-whatsapp flex-1"
          >
            <Icon name="whatsapp" className="h-4 w-4" /> Send on WhatsApp
          </a>
          <a
            href={emailLink("CIPD assessment quote request", fallbackMessage)}
            onClick={() => trackEvent("email_clicked", { location: "lead_fallback" })}
            className="btn-navy flex-1"
          >
            Send by email
          </a>
        </div>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm font-semibold text-teal-700 hover:text-teal-800"
        >
          ← Back to the form
        </button>
      </div>
    );
  }

  // ─── The form ───
  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-mist-200 bg-white p-6 shadow-card sm:p-8"
      noValidate={false}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="name">Name</label>
          <input id="name" className={inputCls} value={form.name} autoComplete="name"
            onChange={(e) => update("name", e.target.value)} placeholder="Your full name" required />
        </div>
        <div>
          <label className={labelCls} htmlFor="email">Email</label>
          <input id="email" type="email" className={inputCls} value={form.email} autoComplete="email"
            onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" required />
        </div>
        <div>
          <label className={labelCls} htmlFor="whatsapp">
            WhatsApp number <span className="text-navy-400">(optional, fastest)</span>
          </label>
          <input id="whatsapp" type="tel" className={inputCls} value={form.whatsapp} autoComplete="tel"
            onChange={(e) => update("whatsapp", e.target.value)} placeholder="+44 or +971…" />
        </div>
        <div>
          <label className={labelCls} htmlFor="country">Country</label>
          <input id="country" className={inputCls} value={form.country}
            onChange={(e) => update("country", e.target.value)} placeholder="e.g. United Kingdom / UAE" />
        </div>
        <div>
          <label className={labelCls} htmlFor="level">CIPD level</label>
          <select id="level" className={inputCls} value={form.level}
            onChange={(e) => update("level", e.target.value)}>
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="unit">
            Unit code <span className="text-navy-400">(if known)</span>
          </label>
          <input id="unit" className={inputCls} value={form.unitCode}
            onChange={(e) => update("unitCode", e.target.value)} placeholder="e.g. 5CO01, 7HR01" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="support">Type of support needed</label>
          <select id="support" className={inputCls} value={form.supportType}
            onChange={(e) => update("supportType", e.target.value)}>
            {SUPPORT_TYPE_KEYS.map((key) => (
              <option key={key} value={key}>{SUPPORT_TYPES[key]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="words">Word count</label>
          <input id="words" inputMode="numeric" className={inputCls} value={form.wordCount}
            onChange={(e) => update("wordCount", e.target.value)} placeholder="e.g. 3500" />
        </div>
        <div>
          <label className={labelCls} htmlFor="deadline">Deadline</label>
          <input id="deadline" type="date" className={inputCls} value={form.deadline}
            onChange={(e) => update("deadline", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="message">Message</label>
          <textarea id="message" rows={4} className={inputCls} value={form.message}
            onChange={(e) => update("message", e.target.value)}
            placeholder="Tell us about your assessment and any tutor or assessor feedback you've received." />
        </div>

        {/* Honeypot — hidden from humans, present for bots */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" tabIndex={-1} autoComplete="off" value={form.website}
            onChange={(e) => update("website", e.target.value)} />
        </div>

        {/* Brief-sharing note — real uploads arrive in P1; never imply receipt */}
        <div className="sm:col-span-2 rounded-xl border border-mist-200 bg-mist-50 p-4">
          <p className="flex items-start gap-2.5 text-sm text-navy-600">
            <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white text-teal-600 shadow-soft">
              <Icon name="brief" className="h-4 w-4" />
            </span>
            <span>
              <span className="font-medium text-navy-800">Have your assessment brief ready?</span>{" "}
              After you send your enquiry, you can share the document with us directly on WhatsApp
              or by email.
            </span>
          </p>
        </div>
      </div>

      {fieldError && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
          {fieldError}
        </p>
      )}

      <button type="submit" disabled={status === "submitting"} className="btn-primary mt-6 w-full">
        {status === "submitting" ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-900/30 border-t-navy-900" />
            Sending…
          </>
        ) : (
          <>Send my enquiry <Icon name="arrow" className="h-4 w-4" /></>
        )}
      </button>

      <p className="mt-4 text-center text-xs text-navy-400">
        Confidential. Your details are used only to respond to your enquiry. We reply by email or
        WhatsApp ({site.contact.whatsappDisplay}).
      </p>
    </form>
  );
}

function humanError(code: string): string {
  switch (code) {
    case "invalid_name":
      return "Please enter your name.";
    case "invalid_email":
      return "Please check your email address.";
    case "invalid_level":
      return "Please choose your CIPD level.";
    case "invalid_support_type":
      return "Please choose the type of support you need.";
    case "rate_limited":
      return "Too many enquiries from this connection. Please try again shortly, or message us on WhatsApp.";
    default:
      return "Something in the form needs attention. Please check your details and try again.";
  }
}
