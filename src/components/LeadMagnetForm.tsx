"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { trackEvent } from "@/lib/analytics";
import { buildAcquisitionContext } from "@/lib/leads/context";

/**
 * Lead-magnet gate for the free checklist (NURTURE funnel, not a sales lead).
 *
 * Capture: POST /api/subscribe → stored as a Resend Audience contact (when
 * configured) + low-priority internal notification. This is deliberately a
 * separate endpoint from /api/leads so resource downloads never enter the
 * assessment lead-scoring system.
 *
 * The visitor's promise is the free checklist, so the download is unlocked
 * even if capture delivery fails — we just never claim a subscription
 * happened when it didn't (the confirmation copy stays download-focused).
 */

const DOWNLOAD_URL = "/downloads/cipd-assessment-planning-checklist.html";
const RESOURCE_SLUG = "cipd-assessment-planning-checklist";
const levelOptions = ["CIPD Level 3", "CIPD Level 5", "CIPD Level 7", "Not sure yet"];

export function LeadMagnetForm() {
  const pathname = usePathname();
  const [form, setForm] = useState({
    name: "",
    email: "",
    level: levelOptions[0],
    country: "",
    website: "", // honeypot
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "unlocked">("idle");
  const startedAt = useRef<number>(Date.now());

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    trackEvent("lead_magnet_submitted", { resource: RESOURCE_SLUG });

    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          level: form.level.replace(/\D/g, "") || undefined,
          country: form.country,
          resource: RESOURCE_SLUG,
          website: form.website,
          startedAt: startedAt.current,
          context: buildAcquisitionContext(pathname),
        }),
      });
    } catch {
      // Capture is best-effort; the visitor still gets the resource.
    }
    setStatus("unlocked");
  };

  const inputCls =
    "w-full rounded-xl border border-mist-300 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";
  const labelCls = "mb-1.5 block text-sm font-medium text-navy-800";

  if (status === "unlocked") {
    return (
      <div className="rounded-3xl border border-teal-200 bg-white p-8 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
          <Icon name="check" className="h-7 w-7" />
        </span>
        <h3 className="mt-4 text-xl font-bold text-navy-900">Your checklist is ready 🎉</h3>
        <p className="mt-2 text-sm text-navy-600">
          Thanks{form.name ? `, ${form.name.split(" ")[0]}` : ""}! Open your free CIPD Assessment
          Planning Checklist below, then use “Print / Save as PDF” to keep a copy.
        </p>
        <a
          href={DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-6 w-full"
        >
          Open my checklist
          <Icon name="arrow" className="h-4 w-4" />
        </a>
        <p className="mt-4 text-xs text-navy-400">
          Need help applying it to your brief? Get a free quote any time.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-mist-200 bg-white p-6 shadow-card sm:p-8">
      <h3 className="text-lg font-bold text-navy-900">Get the free checklist</h3>
      <p className="mt-1 text-sm text-navy-600">
        Tell us a little about you and we&apos;ll unlock your download instantly.
      </p>
      <div className="mt-5 grid gap-4">
        <div>
          <label className={labelCls} htmlFor="lm-name">Name</label>
          <input id="lm-name" className={inputCls} required value={form.name} autoComplete="name"
            onChange={(e) => update("name", e.target.value)} placeholder="Your full name" />
        </div>
        <div>
          <label className={labelCls} htmlFor="lm-email">Email</label>
          <input id="lm-email" type="email" className={inputCls} required value={form.email} autoComplete="email"
            onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="lm-level">CIPD level</label>
            <select id="lm-level" className={inputCls} value={form.level} onChange={(e) => update("level", e.target.value)}>
              {levelOptions.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="lm-country">Country</label>
            <input id="lm-country" className={inputCls} value={form.country}
              onChange={(e) => update("country", e.target.value)} placeholder="e.g. UK / UAE" />
          </div>
        </div>
        {/* Honeypot — hidden from humans */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="lm-website">Website</label>
          <input id="lm-website" tabIndex={-1} autoComplete="off" value={form.website}
            onChange={(e) => update("website", e.target.value)} />
        </div>
      </div>
      <button type="submit" disabled={status === "submitting"} className="btn-primary mt-6 w-full">
        {status === "submitting" ? "Unlocking…" : (
          <>Download the checklist <Icon name="arrow" className="h-4 w-4" /></>
        )}
      </button>
      <p className="mt-3 text-center text-xs text-navy-400">
        We&apos;ll only use your details to send your checklist and occasional CIPD study tips. No
        spam, unsubscribe any time.
      </p>
    </form>
  );
}
