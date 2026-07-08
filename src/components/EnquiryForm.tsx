"use client";

import { useState } from "react";
import { site, whatsappLink, emailLink } from "@/lib/site";
import { Icon } from "@/components/Icon";

/**
 * Enquiry / quote form.
 *
 * Phase 1: no backend — on submit it composes a structured message and lets the
 * learner send it via WhatsApp or email (both pre-filled). File upload is captured
 * client-side; learners are prompted to attach it in WhatsApp/email.
 *
 * Phase 3: replace `handleSubmit` with a POST to your API / CRM endpoint.
 */

const levelOptions = ["CIPD Level 3", "CIPD Level 5", "CIPD Level 7", "Not sure yet"];
const helpOptions = [
  "Brief analysis & structure",
  "Draft review & improvement",
  "Editing & proofreading",
  "Harvard referencing",
  "Resubmission support",
  "Full guidance package",
  "Something else",
];

type FormState = {
  name: string;
  country: string;
  level: string;
  unitCode: string;
  deadline: string;
  wordCount: string;
  helpType: string;
  message: string;
  fileName: string;
};

const initial: FormState = {
  name: "",
  country: "",
  level: levelOptions[0],
  unitCode: "",
  deadline: "",
  wordCount: "",
  helpType: helpOptions[0],
  message: "",
  fileName: "",
};

function composeMessage(f: FormState) {
  return [
    "Hi CIPD Assessment Support Hub, I'd like a quote.",
    "",
    `Name: ${f.name || "—"}`,
    `Country: ${f.country || "—"}`,
    `CIPD level: ${f.level}`,
    `Unit code: ${f.unitCode || "—"}`,
    `Deadline: ${f.deadline || "—"}`,
    `Word count: ${f.wordCount || "—"}`,
    `Help needed: ${f.helpType}`,
    f.fileName ? `Brief file: ${f.fileName} (will attach)` : "",
    "",
    f.message ? `Message: ${f.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function EnquiryForm() {
  const [form, setForm] = useState<FormState>(initial);
  const [sent, setSent] = useState(false);

  const update = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Phase 3 hook: POST `form` to your backend here.
    setSent(true);
  };

  const message = composeMessage(form);

  const labelCls = "mb-1.5 block text-sm font-medium text-navy-800";
  const inputCls =
    "w-full rounded-xl border border-mist-300 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-mist-200 bg-white p-6 shadow-card sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className={inputCls}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Your full name"
            required
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="country">
            Country
          </label>
          <input
            id="country"
            className={inputCls}
            value={form.country}
            onChange={(e) => update("country", e.target.value)}
            placeholder="e.g. United Kingdom / UAE"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="level">
            CIPD level
          </label>
          <select
            id="level"
            className={inputCls}
            value={form.level}
            onChange={(e) => update("level", e.target.value)}
          >
            {levelOptions.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="unit">
            Unit code
          </label>
          <input
            id="unit"
            className={inputCls}
            value={form.unitCode}
            onChange={(e) => update("unitCode", e.target.value)}
            placeholder="e.g. 5CO01, 7HR01"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="deadline">
            Deadline
          </label>
          <input
            id="deadline"
            type="date"
            className={inputCls}
            value={form.deadline}
            onChange={(e) => update("deadline", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="words">
            Word count
          </label>
          <input
            id="words"
            className={inputCls}
            value={form.wordCount}
            onChange={(e) => update("wordCount", e.target.value)}
            placeholder="e.g. 3,000 words"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="help">
            Type of help needed
          </label>
          <select
            id="help"
            className={inputCls}
            value={form.helpType}
            onChange={(e) => update("helpType", e.target.value)}
          >
            {helpOptions.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>

        {/* Upload brief */}
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="brief">
            Upload assessment brief <span className="text-navy-400">(optional)</span>
          </label>
          <label
            htmlFor="brief"
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-mist-300 bg-mist-50 px-4 py-4 text-sm text-navy-600 transition-colors hover:border-teal-400 hover:bg-teal-50/40"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-teal-600 shadow-soft">
              <Icon name="brief" className="h-5 w-5" />
            </span>
            <span>
              {form.fileName ? (
                <span className="font-medium text-navy-900">{form.fileName}</span>
              ) : (
                <>
                  <span className="font-medium text-navy-900">Click to select a file</span>
                  <span className="block text-xs text-navy-500">
                    PDF, Word or image — you&apos;ll attach it when you send
                  </span>
                </>
              )}
            </span>
          </label>
          <input
            id="brief"
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
            onChange={(e) => update("fileName", e.target.files?.[0]?.name ?? "")}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="message">
            Message
          </label>
          <textarea
            id="message"
            rows={4}
            className={inputCls}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            placeholder="Tell us a little about what you need and any tutor feedback you've received."
          />
        </div>
      </div>

      {!sent ? (
        <button type="submit" className="btn-primary mt-6 w-full">
          Review &amp; send my enquiry
        </button>
      ) : (
        <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-5">
          <p className="flex items-center gap-2 font-semibold text-teal-800">
            <Icon name="check" className="h-5 w-5" /> Almost done — send your enquiry
          </p>
          <p className="mt-1.5 text-sm text-teal-800/80">
            Choose how you&apos;d like to send your details. Your answers are pre-filled — just
            attach your brief if you have one.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <a
              href={whatsappLink(message)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp flex-1"
            >
              <Icon name="whatsapp" className="h-4 w-4" /> Send on WhatsApp
            </a>
            <a
              href={emailLink("CIPD assessment quote request", message)}
              className="btn-navy flex-1"
            >
              Send by email
            </a>
          </div>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-navy-400">
        Your details are used only to respond to your enquiry. We reply on WhatsApp (
        {site.contact.whatsappDisplay}) or by email.
      </p>
    </form>
  );
}
