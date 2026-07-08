"use client";

import { useState } from "react";
import Link from "next/link";
import { RequireClient } from "@/components/portal/Gates";
import { FileDrop } from "@/components/portal/FileDrop";
import { Icon } from "@/components/Icon";
import { useClientSession } from "@/lib/portal/session";
import { createProject } from "@/lib/portal/store";
import { estimateQuote, formatMoney, type QuoteEstimate } from "@/lib/portal/quote";
import { whatsappLink } from "@/lib/site";
import type { CipdLevel } from "@/lib/portal/types";

const levelOptions: CipdLevel[] = ["3", "5", "7"];
const helpOptions = [
  "Brief analysis & structure",
  "Draft review & improvement",
  "Editing & proofreading",
  "Harvard referencing",
  "Resubmission support",
  "Full guidance package",
];

export default function NewRequestPage() {
  return (
    <RequireClient>
      <NewRequest />
    </RequireClient>
  );
}

function NewRequest() {
  const session = useClientSession();
  const [form, setForm] = useState({
    country: "",
    level: "5" as CipdLevel,
    unitCode: "",
    helpType: helpOptions[1],
    wordCount: "",
    deadline: "",
    message: "",
  });
  const [files, setFiles] = useState<{ name: string; sizeLabel: string }[]>([]);
  const [created, setCreated] = useState<{ id: string; estimate: QuoteEstimate } | null>(null);

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const inputCls =
    "w-full rounded-xl border border-mist-300 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";
  const labelCls = "mb-1.5 block text-sm font-medium text-navy-800";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    const wordCount = parseInt(form.wordCount.replace(/[^0-9]/g, ""), 10) || 0;
    const today = new Date().toISOString().slice(0, 10);
    const estimate = estimateQuote({
      level: form.level,
      wordCount,
      helpType: form.helpType,
      deadline: form.deadline || today,
      today,
    });
    const project = createProject({
      clientName: session.name,
      clientEmail: session.email,
      country: form.country,
      level: form.level,
      unitCode: form.unitCode,
      helpType: form.helpType,
      wordCount,
      deadline: form.deadline || today,
      message: form.message,
      briefFileName: files[0]?.name,
    });
    setCreated({ id: project.id, estimate });
  };

  if (created) {
    const est = created.estimate;
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-3xl border border-mist-200 bg-white p-8 text-center shadow-card">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
            <Icon name="check" className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-navy-900">Request submitted 🎉</h1>
          <p className="mt-1 text-sm text-navy-600">
            Reference <span className="font-mono font-semibold text-navy-900">{created.id}</span>. Our
            team will confirm your quote shortly.
          </p>

          {/* Instant estimate */}
          <div className="mt-6 rounded-2xl border border-gold-200 bg-gold-50 p-5 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-700">
              Instant automated estimate
            </p>
            <p className="mt-1 text-3xl font-bold text-navy-900">
              {formatMoney(est.low, est.currency)} – {formatMoney(est.high, est.currency)}
            </p>
            <p className="mt-1 text-xs text-navy-500">
              Indicative only. Your final quote is confirmed by our team before you approve.
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-2">
              {est.breakdown.map((b) => (
                <div key={b.label} className="rounded-lg bg-white/70 px-3 py-2">
                  <dt className="text-[11px] uppercase text-navy-400">{b.label}</dt>
                  <dd className="text-sm font-medium text-navy-800">{b.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link href={`/portal/${created.id}`} className="btn-primary flex-1">
              View project <Icon name="arrow" className="h-4 w-4" />
            </Link>
            <a
              href={whatsappLink(`Hi, I've just submitted request ${created.id} in the portal.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp flex-1"
            >
              <Icon name="whatsapp" className="h-4 w-4" /> Message us
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-navy-900">New support request</h1>
      <p className="mt-1 text-sm text-navy-600">
        Tell us about your assessment and get an instant estimate. Final quotes are confirmed by our team.
      </p>

      <form onSubmit={submit} className="mt-6 rounded-3xl border border-mist-200 bg-white p-6 shadow-card sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="level">CIPD level</label>
            <select id="level" className={inputCls} value={form.level} onChange={(e) => update("level", e.target.value)}>
              {levelOptions.map((l) => <option key={l} value={l}>Level {l}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="unit">Unit code</label>
            <input id="unit" className={inputCls} value={form.unitCode} onChange={(e) => update("unitCode", e.target.value)} placeholder="e.g. 5CO01" required />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="help">Type of help needed</label>
            <select id="help" className={inputCls} value={form.helpType} onChange={(e) => update("helpType", e.target.value)}>
              {helpOptions.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="words">Word count</label>
            <input id="words" className={inputCls} value={form.wordCount} onChange={(e) => update("wordCount", e.target.value)} placeholder="e.g. 3500" required />
          </div>
          <div>
            <label className={labelCls} htmlFor="deadline">Deadline</label>
            <input id="deadline" type="date" className={inputCls} value={form.deadline} onChange={(e) => update("deadline", e.target.value)} required />
          </div>
          <div>
            <label className={labelCls} htmlFor="country">Country</label>
            <input id="country" className={inputCls} value={form.country} onChange={(e) => update("country", e.target.value)} placeholder="UK / UAE" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="message">Message</label>
            <textarea id="message" rows={3} className={inputCls} value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="Anything we should know, such as tutor feedback or specific concerns…" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Upload assessment brief</label>
            <FileDrop onFiles={(f) => setFiles(f)} label="Upload your brief" />
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f) => (
                  <li key={f.name} className="flex items-center gap-2 text-sm text-navy-700">
                    <Icon name="check" className="h-4 w-4 text-teal-600" /> {f.name}
                    <span className="text-navy-400">· {f.sizeLabel}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <button type="submit" className="btn-primary mt-6 w-full">
          Submit &amp; get instant estimate <Icon name="arrow" className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
