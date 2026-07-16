"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { FileUploader } from "@/components/funnel/FileUploader";
import { trackEvent } from "@/lib/analytics";
import { buildAcquisitionContext, derivePageType } from "@/lib/leads/context";
import {
  clearFunnelProgress,
  loadFunnelProgress,
  saveFunnelProgress,
} from "@/lib/funnel/persistence";
import { whatsappLink, emailLink, site } from "@/lib/site";
import { PhoneNumberField } from "@/components/PhoneNumberField";
import { isValidPhoneNumber, formatPhoneNumberIntl } from "react-phone-number-input";
import { units } from "@/content/units";
import {
  ATTACHMENT_CATEGORIES,
  SUPPORT_TYPES,
  SUPPORT_TYPE_KEYS,
  type CipdLevel,
  type LeadAttachment,
  type SubmissionType,
  type SupportType,
} from "@/lib/leads/types";

/**
 * The multi-step assessment enquiry funnel (P1.2).
 *
 * Steps: level → unit → support → details → documents → contact → review.
 * Context prefill via ?level&unit&support&submission&cta (validated here AND
 * re-validated server-side). Safe fields persist to sessionStorage
 * (src/lib/funnel/persistence.ts documents exactly what is/isn't stored).
 * Capture-first: the lead is created via /api/leads; WhatsApp is an optional
 * continuation. Delivery failure degrades to direct channels — never a dead end.
 */

const STEPS = ["level", "unit", "support", "details", "documents", "contact", "review"] as const;
type StepName = (typeof STEPS)[number];

const SUPPORT_HINTS: Record<SupportType | "other", string> = {
  assessment_guidance: "Understand the brief, plan the structure, and know exactly what each task needs.",
  draft_review: "Detailed, criteria-focused feedback to strengthen a draft you already have.",
  resubmission: "Help interpreting assessor feedback and improving the referred assessment criteria.",
  feedback_interpretation: "Turn vague tutor comments into a clear, practical action plan.",
  harvard_referencing: "Correct, consistent Harvard citations and reference lists.",
  other: "Something else. Describe what you need in the next step.",
};

type FunnelState = {
  level: CipdLevel | "unsure" | "";
  unitCode: string;
  unitUnsure: boolean;
  support: SupportType | "other" | "";
  submission: SubmissionType;
  wordCount: string;
  deadline: string;
  provider: string;
  message: string;
  referredCriteria: string;
  name: string;
  email: string;
  phone: string; // E.164 (e.g. "+254712345678") or ""
  country: string;
  website: string; // honeypot
};

const INITIAL: FunnelState = {
  level: "",
  unitCode: "",
  unitUnsure: false,
  support: "",
  submission: "first",
  wordCount: "",
  deadline: "",
  provider: "",
  message: "",
  referredCriteria: "",
  name: "",
  email: "",
  phone: "",
  country: "",
  website: "",
};

function parsePrefill(params: URLSearchParams): {
  patch: Partial<FunnelState>;
  entryCta?: string;
} {
  const patch: Partial<FunnelState> = {};
  const level = params.get("level");
  if (level && ["3", "5", "7"].includes(level)) patch.level = level as CipdLevel;
  const unit = params.get("unit");
  if (unit && /^[357][A-Za-z]{2}\d{2}$/.test(unit)) {
    patch.unitCode = unit.toUpperCase();
    if (!patch.level) patch.level = unit[0] as CipdLevel;
  }
  const support = params.get("support");
  if (support && (SUPPORT_TYPE_KEYS as readonly string[]).includes(support)) {
    patch.support = support as SupportType;
    if (support === "resubmission") patch.submission = "resubmission";
  }
  const submission = params.get("submission");
  if (submission === "resubmission" || submission === "first") patch.submission = submission;
  const cta = params.get("cta") ?? undefined;
  return { patch, entryCta: cta && /^[a-z_]{2,30}$/.test(cta) ? cta : undefined };
}

export function AssessmentFunnel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prefill = useMemo(() => parsePrefill(searchParams), [searchParams]);

  const [state, setState] = useState<FunnelState>({ ...INITIAL, ...prefill.patch });
  const [stepIndex, setStepIndex] = useState(0);
  const [attachments, setAttachments] = useState<LeadAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "captured" | "fallback">("idle");
  const [reference, setReference] = useState("");
  const [restored, setRestored] = useState(false);

  const startedAtMs = useRef(Date.now());
  const startedAtIso = useRef(new Date().toISOString());
  const startedTracked = useRef(false);
  const submittedRef = useRef(false);
  const entryCta = useRef(prefill.entryCta);

  const step = STEPS[stepIndex];
  const sourcePageType = derivePageType(pathname);
  const isResubmission = state.submission === "resubmission" || state.support === "resubmission";

  // ─── Restore persisted progress (unless fresh context arrived via URL) ───
  useEffect(() => {
    const saved = loadFunnelProgress();
    if (!saved) return;
    const hasUrlContext = Object.keys(prefill.patch).length > 0;
    setState((prev) => ({
      ...prev,
      level: (hasUrlContext && prev.level ? prev.level : saved.level) ?? prev.level,
      unitCode: (hasUrlContext && prev.unitCode ? prev.unitCode : saved.unitCode) ?? prev.unitCode,
      unitUnsure: saved.unitUnsure ?? prev.unitUnsure,
      support: (hasUrlContext && prev.support ? prev.support : saved.support) ?? prev.support,
      submission: saved.submission ?? prev.submission,
      wordCount: saved.wordCount ?? prev.wordCount,
      deadline: saved.deadline ?? prev.deadline,
      provider: saved.provider ?? prev.provider,
    }));
    if (!hasUrlContext && saved.step > 0) {
      // Never restore past the documents step: attachments are not persisted.
      setStepIndex(Math.min(saved.step, STEPS.indexOf("documents")));
      setRestored(true);
    }
    if (saved.entryCta && !entryCta.current) entryCta.current = saved.entryCta;
    if (saved.startedAt) startedAtIso.current = saved.startedAt;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Persist safe fields on change ───
  useEffect(() => {
    if (status !== "idle" && status !== "submitting") return;
    saveFunnelProgress({
      step: stepIndex,
      level: state.level || undefined,
      unitCode: state.unitCode || undefined,
      unitUnsure: state.unitUnsure,
      support: state.support || undefined,
      submission: state.submission,
      wordCount: state.wordCount || undefined,
      deadline: state.deadline || undefined,
      provider: state.provider || undefined,
      entryCta: entryCta.current,
      startedAt: startedAtIso.current,
    });
  }, [state, stepIndex, status]);

  // ─── Step view + start tracking ───
  useEffect(() => {
    trackEvent("lead_form_step_viewed", {
      step: stepIndex + 1,
      step_name: step,
      source_page_type: sourcePageType,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  const markStarted = () => {
    if (!startedTracked.current) {
      startedTracked.current = true;
      trackEvent("lead_form_started", {
        source_page_type: sourcePageType,
        location: entryCta.current,
      });
    }
  };

  // ─── Abandonment (best-effort; documented floor, not exact) ───
  useEffect(() => {
    const onPageHide = () => {
      if (startedTracked.current && !submittedRef.current) {
        trackEvent("lead_form_abandoned", { step: stepIndex + 1, step_name: STEPS[stepIndex] });
      }
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [stepIndex]);

  const update = <K extends keyof FunnelState>(key: K, value: FunnelState[K]) => {
    markStarted();
    setError(null);
    setState((prev) => ({ ...prev, [key]: value }));
  };

  // ─── Per-step validation gates ───
  function stepError(): string | null {
    switch (step) {
      case "level":
        return state.level ? null : "Please choose your CIPD level.";
      case "unit":
        return state.unitCode || state.unitUnsure ? null : "Choose your unit, or select “I'm not sure”.";
      case "support":
        return state.support ? null : "Please choose the type of support you need.";
      case "details":
        return null; // all optional, encouraged not forced
      case "documents":
        return null; // optional
      case "contact": {
        if (state.name.trim().length < 2) return "Please enter your name.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(state.email.trim()))
          return "Please check your email address.";
        // Optional field, but if a number was entered it must be valid for
        // its selected country (libphonenumber rules, not a custom regex).
        if (state.phone && !isValidPhoneNumber(state.phone))
          return "Please check your WhatsApp number. It doesn't look complete for the selected country.";
        return null;
      }
      default:
        return null;
    }
  }

  const goNext = () => {
    const err = stepError();
    if (err) {
      setError(err);
      trackEvent("lead_form_validation_error", { step: stepIndex + 1, step_name: step });
      return;
    }
    setError(null);
    trackEvent("lead_form_step_completed", {
      step: stepIndex + 1,
      step_name: step,
      cipd_level: state.level || undefined,
      support_type: state.support || undefined,
    });
    const next = Math.min(stepIndex + 1, STEPS.length - 1);
    setStepIndex(next);
    if (STEPS[next] === "review") {
      trackEvent("lead_review_reached", {
        cipd_level: state.level || undefined,
        support_type: state.support || undefined,
        file_count: attachments.length,
      });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const jumpTo = (name: StepName) => {
    setError(null);
    setStepIndex(STEPS.indexOf(name));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetFunnel = () => {
    clearFunnelProgress();
    setState({ ...INITIAL, ...prefill.patch });
    setAttachments([]);
    setStepIndex(0);
    setRestored(false);
    setError(null);
  };

  // ─── Submission ───
  // Already E.164 from the phone field (e.g. "+254712345678").
  const whatsappValue = state.phone;

  const handleSubmit = async () => {
    setStatus("submitting");
    setError(null);
    trackEvent("lead_form_submitted", {
      source_page_type: sourcePageType,
      cipd_level: state.level || undefined,
      unit_code: state.unitCode || undefined,
      support_type: state.support || undefined,
      submission_type: state.submission,
      file_count: attachments.length,
    });
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name,
          email: state.email,
          whatsapp: whatsappValue || undefined,
          country: state.country || undefined,
          level: state.level === "unsure" ? "5" : state.level, // "unsure" maps to the most common level; noted in message
          unitCode: state.unitUnsure ? undefined : state.unitCode || undefined,
          supportType: state.support === "other" ? "assessment_guidance" : state.support,
          wordCount: state.wordCount || undefined,
          deadline: state.deadline || undefined,
          message:
            [
              state.level === "unsure" ? "(Learner is not sure of their CIPD level.)" : "",
              state.support === "other" ? "(Support type: other, see description.)" : "",
              state.message.trim(),
            ]
              .filter(Boolean)
              .join("\n") || undefined,
          provider: state.provider || undefined,
          submissionType: state.submission,
          referredCriteria: isResubmission ? state.referredCriteria || undefined : undefined,
          attachments,
          funnel: { entryCta: entryCta.current, startedAt: startedAtIso.current },
          reachedReview: true,
          website: state.website,
          startedAt: startedAtMs.current,
          context: buildAcquisitionContext(pathname),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        reference?: string;
        error?: string;
      };
      if (res.ok && data.ok) {
        submittedRef.current = true;
        clearFunnelProgress();
        setReference(data.reference ?? "");
        setStatus("captured");
        trackEvent("lead_created", {
          source_page_type: sourcePageType,
          cipd_level: state.level || undefined,
          unit_code: state.unitCode || undefined,
          support_type: state.support || undefined,
          submission_type: state.submission,
          file_count: attachments.length,
        });
        return;
      }
      if (res.status === 400 && data.error) {
        setError(humanError(data.error));
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

  // ─── Unit list for the selected level ───
  const [unitQuery, setUnitQuery] = useState("");
  const levelUnits = useMemo(() => {
    const pool =
      state.level === "3" || state.level === "5" || state.level === "7"
        ? units.filter((u) => u.level === state.level)
        : units;
    const q = unitQuery.trim().toLowerCase();
    return q
      ? pool.filter(
          (u) => u.code.toLowerCase().includes(q) || u.title.toLowerCase().includes(q)
        )
      : pool;
  }, [state.level, unitQuery]);

  // ─── Shared styles (text-base = 16px prevents iOS focus zoom) ───
  const inputCls =
    "w-full rounded-xl border border-mist-300 bg-white px-3.5 py-3 text-base text-navy-900 placeholder:text-navy-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";
  const labelCls = "mb-1.5 block text-sm font-medium text-navy-800";
  const cardBtn = (selected: boolean) =>
    `w-full rounded-2xl border-2 p-4 text-left transition-colors ${
      selected
        ? "border-teal-500 bg-teal-50/60"
        : "border-mist-200 bg-white hover:border-mist-300"
    }`;

  // ─── Confirmation ───
  if (status === "captured") {
    const continuationDetails = [
      reference ? `Reference: ${reference}` : "",
      state.level ? `CIPD Level: ${state.level === "unsure" ? "Not sure" : `Level ${state.level}`}` : "",
      state.unitCode && !state.unitUnsure ? `Unit: ${state.unitCode}` : "",
      state.support && state.support !== "other" ? `Support needed: ${SUPPORT_TYPES[state.support]}` : "",
      state.deadline ? `Deadline: ${fmtDeadline(state.deadline)}` : "",
      attachments.length > 0 ? `Documents uploaded: ${attachments.length}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const continuationMessage = [
      "Hi, I've just submitted an assessment enquiry through CIPD Guidance.",
      continuationDetails,
      "I'd like to discuss my assessment.",
    ].join("\n\n");

    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-teal-200 bg-white p-8 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
          <Icon name="check" className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-2xl font-bold text-navy-900">
          Your assessment enquiry has been received.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-navy-600">
          We&apos;ll review your assessment details and respond with the appropriate support
          option.
        </p>
        {reference && (
          <p className="mt-3 text-sm text-navy-500">
            Your reference: <span className="font-mono font-semibold text-navy-900">{reference}</span>
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
                cipd_level: state.level || undefined,
                unit_code: state.unitCode || undefined,
              })
            }
            className="btn-whatsapp mt-3 w-full"
          >
            <Icon name="whatsapp" className="h-4 w-4" /> Continue on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  // ─── Delivery fallback ───
  if (status === "fallback") {
    const fallbackMessage = [
      "Hi CIPD Guidance, I'd like a quote.",
      "",
      `Name: ${state.name || "—"}`,
      `CIPD level: ${state.level === "unsure" ? "Not sure" : `Level ${state.level}`}`,
      `Unit code: ${state.unitUnsure ? "Not sure" : state.unitCode || "—"}`,
      state.support && state.support !== "other"
        ? `Support needed: ${SUPPORT_TYPES[state.support]}`
        : "Support needed: Other",
      `Submission: ${state.submission === "resubmission" ? "Resubmission" : "First submission"}`,
      `Word count: ${state.wordCount || "—"}`,
      `Deadline: ${state.deadline || "—"}`,
      state.message.trim() ? `\nDetails: ${state.message.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-gold-200 bg-white p-8 shadow-card">
        <h2 className="text-xl font-bold text-navy-900">Send your enquiry directly</h2>
        <p className="mt-2 text-sm leading-relaxed text-navy-600">
          Our enquiry service is temporarily unavailable, but your details are ready to send.
          Choose a channel below and your enquiry will reach us immediately, and you can attach your
          documents there too.
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
            href={emailLink("CIPD assessment enquiry", fallbackMessage)}
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

  // ─── The funnel ───
  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-medium text-navy-500">
          <span>
            Step {stepIndex + 1} of {STEPS.length}
          </span>
          <span className="capitalize">{stepTitle(step)}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-mist-200">
          <div
            className="h-full rounded-full bg-gold-500 transition-all"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {restored && stepIndex > 0 && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-3">
          <p className="text-sm text-navy-700">We restored your progress from earlier.</p>
          <button
            type="button"
            onClick={resetFunnel}
            className="flex-none text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            Start a new enquiry
          </button>
        </div>
      )}

      <div className="rounded-3xl border border-mist-200 bg-white p-6 shadow-card sm:p-8">
        {/* ── Step 1: level ── */}
        {step === "level" && (
          <fieldset>
            <legend className="text-xl font-bold text-navy-900">
              What CIPD level are you studying?
            </legend>
            <div className="mt-5 grid gap-2.5">
              {(
                [
                  { v: "3", t: "CIPD Level 3", d: "Foundation Certificate, for those starting out in people practice" },
                  { v: "5", t: "CIPD Level 5", d: "Associate Diploma, for practising HR professionals" },
                  { v: "7", t: "CIPD Level 7", d: "Advanced Diploma, for senior and strategic roles" },
                  { v: "unsure", t: "Not sure", d: "We'll help you work it out" },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => update("level", o.v)}
                  aria-pressed={state.level === o.v}
                  className={cardBtn(state.level === o.v)}
                >
                  <span className="block font-semibold text-navy-900">{o.t}</span>
                  <span className="mt-0.5 block text-sm text-navy-500">{o.d}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {/* ── Step 2: unit ── */}
        {step === "unit" && (
          <div>
            <h2 className="text-xl font-bold text-navy-900">Which unit are you working on?</h2>
            <p className="mt-1 text-sm text-navy-500">
              Search by code or title{state.level && state.level !== "unsure" ? `, showing Level ${state.level} units` : ""}.
            </p>
            <input
              type="text"
              value={unitQuery}
              onChange={(e) => {
                markStarted();
                setUnitQuery(e.target.value);
              }}
              placeholder="e.g. 5CO01 or organisational performance"
              className={`${inputCls} mt-4`}
              aria-label="Search units"
            />
            <div className="mt-3 max-h-56 space-y-1.5 overflow-y-auto pr-1" role="listbox" aria-label="Units">
              {levelUnits.map((u) => (
                <button
                  key={u.code}
                  type="button"
                  role="option"
                  aria-selected={state.unitCode === u.code}
                  onClick={() => {
                    update("unitCode", u.code);
                    update("unitUnsure", false);
                    if (["3", "5", "7"].includes(u.level) && state.level !== u.level) {
                      update("level", u.level);
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${
                    state.unitCode === u.code && !state.unitUnsure
                      ? "border-teal-500 bg-teal-50/60"
                      : "border-mist-200 hover:border-mist-300"
                  }`}
                >
                  <span className="font-mono font-bold text-navy-900">{u.code}</span>
                  <span className="min-w-0 truncate text-navy-600">{u.title}</span>
                </button>
              ))}
              {levelUnits.length === 0 && (
                <p className="rounded-xl bg-mist-50 p-3 text-sm text-navy-500">
                  No matching unit. You can type your unit code below or choose “I&apos;m not sure”.
                </p>
              )}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="unit-manual">Or type your unit code</label>
                <input
                  id="unit-manual"
                  className={inputCls}
                  value={state.unitCode}
                  onChange={(e) => {
                    update("unitCode", e.target.value.toUpperCase());
                    update("unitUnsure", false);
                  }}
                  placeholder="e.g. 5OS01"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  aria-pressed={state.unitUnsure}
                  onClick={() => {
                    update("unitUnsure", !state.unitUnsure);
                    if (!state.unitUnsure) update("unitCode", "");
                  }}
                  className={`${cardBtn(state.unitUnsure)} py-3`}
                >
                  <span className="text-sm font-semibold text-navy-900">I&apos;m not sure</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: support ── */}
        {step === "support" && (
          <fieldset>
            <legend className="text-xl font-bold text-navy-900">
              What type of support do you need?
            </legend>
            <div className="mt-5 grid gap-2.5">
              {([...SUPPORT_TYPE_KEYS, "other"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={state.support === key}
                  onClick={() => {
                    update("support", key);
                    if (key === "resubmission") update("submission", "resubmission");
                  }}
                  className={cardBtn(state.support === key)}
                >
                  <span className="block font-semibold text-navy-900">
                    {key === "other" ? "Other" : SUPPORT_TYPES[key]}
                  </span>
                  <span className="mt-0.5 block text-sm text-navy-500">{SUPPORT_HINTS[key]}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {/* ── Step 4: details ── */}
        {step === "details" && (
          <div>
            <h2 className="text-xl font-bold text-navy-900">Assessment details</h2>
            <p className="mt-1 text-sm text-navy-500">
              The more you can share, the more precise our response and quote will be.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="f-words">Expected word count</label>
                <input id="f-words" inputMode="numeric" className={inputCls} value={state.wordCount}
                  onChange={(e) => update("wordCount", e.target.value)} placeholder="e.g. 3500" />
              </div>
              <div>
                <label className={labelCls} htmlFor="f-deadline">Deadline</label>
                <input id="f-deadline" type="date" className={inputCls} value={state.deadline}
                  onChange={(e) => update("deadline", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="f-provider">
                  Study centre or provider <span className="text-navy-400">(optional)</span>
                </label>
                <input id="f-provider" className={inputCls} value={state.provider}
                  onChange={(e) => update("provider", e.target.value)} placeholder="e.g. ICS Learn, Avado, Oakwood" />
              </div>
              <div className="sm:col-span-2">
                <span className={labelCls}>Is this a first submission or a resubmission?</span>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {(
                    [
                      { v: "first", t: "First submission" },
                      { v: "resubmission", t: "Resubmission (referred)" },
                    ] as const
                  ).map((o) => (
                    <button key={o.v} type="button" aria-pressed={state.submission === o.v}
                      onClick={() => update("submission", o.v)} className={`${cardBtn(state.submission === o.v)} py-3`}>
                      <span className="text-sm font-semibold text-navy-900">{o.t}</span>
                    </button>
                  ))}
                </div>
              </div>
              {isResubmission && (
                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="f-criteria">
                    Which assessment criteria were referred?{" "}
                    <span className="text-navy-400">(if known)</span>
                  </label>
                  <input id="f-criteria" className={inputCls} value={state.referredCriteria}
                    onChange={(e) => update("referredCriteria", e.target.value)}
                    placeholder="e.g. AC 2.1 and AC 3.2" />
                </div>
              )}
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="f-message">
                  Briefly describe the support you need
                </label>
                <textarea id="f-message" rows={4} className={inputCls} value={state.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="What are you finding difficult? Any tutor comments or concerns worth knowing about?" />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: documents ── */}
        {step === "documents" && (
          <div>
            <h2 className="text-xl font-bold text-navy-900">Share your documents</h2>
            <p className="mt-1 text-sm leading-relaxed text-navy-500">
              Uploading your assessment brief{isResubmission ? " and assessor feedback" : ""} lets
              us assess the work properly and quote accurately, with no need to repeat anything on
              WhatsApp later. This step is optional.
            </p>
            <div className="mt-5">
              <FileUploader
                onChange={(files) => {
                  markStarted();
                  setAttachments(files);
                }}
                isResubmission={isResubmission}
              />
            </div>
            <p className="mt-4 rounded-xl bg-mist-50 p-3 text-xs leading-relaxed text-navy-500">
              Only upload documents relevant to your assessment enquiry. Remove unnecessary
              personal or confidential workplace information where possible.
            </p>
          </div>
        )}

        {/* ── Step 6: contact ── */}
        {step === "contact" && (
          <div>
            <h2 className="text-xl font-bold text-navy-900">Your contact details</h2>
            <div className="mt-5 grid gap-4">
              <div>
                <label className={labelCls} htmlFor="f-name">Full name</label>
                <input id="f-name" className={inputCls} value={state.name} autoComplete="name"
                  onChange={(e) => update("name", e.target.value)} placeholder="Your full name" required />
              </div>
              <div>
                <label className={labelCls} htmlFor="f-email">Email</label>
                <input id="f-email" type="email" className={inputCls} value={state.email} autoComplete="email"
                  onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" required />
              </div>
              <div>
                <label className={labelCls} htmlFor="f-phone">
                  WhatsApp number <span className="text-navy-400">(recommended, fastest replies)</span>
                </label>
                <PhoneNumberField
                  id="f-phone"
                  value={state.phone}
                  onChange={(v) => update("phone", v)}
                />
                <p className="mt-1.5 text-xs text-navy-400">
                  Choose your country, then enter your number without the country code.
                </p>
              </div>
              <div>
                <label className={labelCls} htmlFor="f-country">Country</label>
                <input id="f-country" className={inputCls} value={state.country}
                  onChange={(e) => update("country", e.target.value)} placeholder="e.g. United Kingdom / UAE" />
              </div>
              {/* Honeypot — hidden from humans */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="f-website">Website</label>
                <input id="f-website" tabIndex={-1} autoComplete="off" value={state.website}
                  onChange={(e) => update("website", e.target.value)} />
              </div>
              <p className="rounded-xl bg-mist-50 p-3 text-xs leading-relaxed text-navy-500">
                Your assessment information is used only to review your enquiry and prepare an
                appropriate response.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 7: review ── */}
        {step === "review" && (
          <div>
            <h2 className="text-xl font-bold text-navy-900">Review your enquiry</h2>
            <dl className="mt-5 divide-y divide-mist-200 rounded-2xl border border-mist-200">
              <ReviewRow label="CIPD level" value={state.level === "unsure" ? "Not sure" : `Level ${state.level}`} onEdit={() => jumpTo("level")} />
              <ReviewRow label="Unit" value={state.unitUnsure ? "Not sure" : state.unitCode || "—"} onEdit={() => jumpTo("unit")} />
              <ReviewRow
                label="Support type"
                value={state.support === "other" ? "Other" : state.support ? SUPPORT_TYPES[state.support] : "—"}
                onEdit={() => jumpTo("support")}
              />
              <ReviewRow
                label="Details"
                value={[
                  state.wordCount ? `${state.wordCount} words` : null,
                  state.deadline ? `due ${fmtDeadline(state.deadline)}` : null,
                  state.submission === "resubmission" ? "resubmission" : "first submission",
                ]
                  .filter(Boolean)
                  .join(" · ")}
                onEdit={() => jumpTo("details")}
              />
              <ReviewRow
                label="Documents"
                value={
                  attachments.length > 0
                    ? attachments
                        .map((a) => `${a.originalFileName} (${ATTACHMENT_CATEGORIES[a.category]})`)
                        .join(", ")
                    : "None. You can share documents on WhatsApp afterwards"
                }
                onEdit={() => jumpTo("documents")}
              />
              <ReviewRow
                label="Contact"
                value={[state.name, state.email, (whatsappValue && formatPhoneNumberIntl(whatsappValue)) || whatsappValue || null, state.country || null]
                  .filter(Boolean)
                  .join(" · ")}
                onEdit={() => jumpTo("contact")}
              />
            </dl>
          </div>
        )}

        {error && (
          <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className="mt-7 flex items-center gap-3">
          {stepIndex > 0 && (
            <button type="button" onClick={goBack} className="btn-outline flex-none px-5">
              Back
            </button>
          )}
          {step !== "review" ? (
            <button type="button" onClick={goNext} className="btn-primary flex-1">
              Continue <Icon name="arrow" className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={status === "submitting"}
              className="btn-primary flex-1"
            >
              {status === "submitting" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-900/30 border-t-navy-900" />
                  Sending…
                </>
              ) : (
                <>Send My Assessment Enquiry</>
              )}
            </button>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-navy-400">
        Confidential. We reply by email or WhatsApp ({site.contact.whatsappDisplay}).{" "}
        <button type="button" onClick={resetFunnel} className="underline hover:text-navy-600">
          Start a new enquiry
        </button>
      </p>
    </div>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 p-4">
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</dt>
        <dd className="mt-0.5 break-words text-sm text-navy-800">{value || "—"}</dd>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="flex-none text-sm font-semibold text-teal-700 hover:text-teal-800"
      >
        Edit
      </button>
    </div>
  );
}

function stepTitle(step: StepName): string {
  switch (step) {
    case "level": return "Qualification";
    case "unit": return "Unit";
    case "support": return "Support";
    case "details": return "Details";
    case "documents": return "Documents";
    case "contact": return "Contact";
    case "review": return "Review";
  }
}

function fmtDeadline(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

function humanError(code: string): string {
  switch (code) {
    case "invalid_name": return "Please enter your name.";
    case "invalid_email": return "Please check your email address.";
    case "invalid_level": return "Please choose your CIPD level.";
    case "invalid_support_type": return "Please choose the type of support you need.";
    case "invalid_attachments": return "One of the uploaded documents couldn't be verified. Please remove and re-upload it.";
    case "too_many_files": return "You can upload up to 5 files.";
    case "rate_limited": return "Too many enquiries from this connection. Please try again shortly, or message us on WhatsApp.";
    default: return "Something in the form needs attention. Please check your details and try again.";
  }
}
