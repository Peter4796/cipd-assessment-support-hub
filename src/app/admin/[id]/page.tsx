"use client";

import { useState } from "react";
import Link from "next/link";
import { RequireAdmin } from "@/components/portal/Gates";
import { StatusBadge, StatusTracker, fmtDate } from "@/components/portal/PortalUI";
import { FileDrop } from "@/components/portal/FileDrop";
import { Icon } from "@/components/Icon";
import {
  useProject,
  setStatus,
  attachFile,
  addNote,
  sendQuote,
} from "@/lib/portal/store";
import { STATUS_PIPELINE, STATUS_META } from "@/lib/portal/statuses";
import { estimateQuote, formatMoney } from "@/lib/portal/quote";
import { whatsappLink } from "@/lib/site";

export default function AdminProjectPage({ params }: { params: { id: string } }) {
  return (
    <RequireAdmin>
      <AdminProject id={params.id} />
    </RequireAdmin>
  );
}

function AdminProject({ id }: { id: string }) {
  const project = useProject(id);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteInternal, setNoteInternal] = useState(false);
  const [emailBody, setEmailBody] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  if (!project) {
    return (
      <div className="rounded-3xl border border-mist-200 bg-white p-10 text-center">
        <p className="font-semibold text-navy-800">Enquiry not found</p>
        <Link href="/admin" className="mt-3 inline-block text-sm font-semibold text-teal-700">
          ← Back to enquiries
        </Link>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const suggested = estimateQuote({
    level: project.level,
    wordCount: project.wordCount,
    helpType: project.helpType,
    deadline: project.deadline,
    today,
  });

  const handleSendQuote = () => {
    const amount = parseInt(quoteAmount.replace(/[^0-9]/g, ""), 10) || suggested.mid;
    sendQuote(project.id, {
      amount,
      currency: "GBP",
      summary: `${project.helpType} — Level ${project.level}, ${project.wordCount.toLocaleString()} words`,
      breakdown: suggested.breakdown,
    });
    setQuoteAmount("");
  };

  const emailHref = `mailto:${project.clientEmail}?subject=${encodeURIComponent(
    `Update on your CIPD project ${project.id}`
  )}&body=${encodeURIComponent(emailBody)}`;

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 hover:text-gold-600">
        <Icon name="arrow" className="h-4 w-4 rotate-180" /> All enquiries
      </Link>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold text-navy-500">{project.id}</span>
            <StatusBadge status={project.status} />
          </div>
          <h1 className="mt-1.5 text-2xl font-bold text-navy-900">{project.clientName}</h1>
          <p className="text-sm text-navy-500">
            {project.clientEmail} · {project.country || "—"}
          </p>
        </div>
        <a
          href={whatsappLink(`Hi ${project.clientName.split(" ")[0]}, about your project ${project.id}…`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp"
        >
          <Icon name="whatsapp" className="h-4 w-4" /> WhatsApp client
        </a>
      </div>

      {/* Pipeline + status control */}
      <div className="mt-6 rounded-2xl border border-mist-200 bg-white p-6 shadow-soft">
        <StatusTracker status={project.status} />
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-mist-200 pt-4">
          <span className="text-sm font-medium text-navy-600">Set status:</span>
          {STATUS_PIPELINE.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(project.id, s)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                project.status === s
                  ? "border-navy-800 bg-navy-800 text-white"
                  : "border-mist-300 text-navy-700 hover:bg-mist-100"
              }`}
            >
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-6">
          {/* Enquiry details */}
          <section className="rounded-2xl border border-mist-200 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-bold text-navy-900">Enquiry</h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                { k: "CIPD level", v: `Level ${project.level}` },
                { k: "Unit code", v: project.unitCode },
                { k: "Support type", v: project.helpType },
                { k: "Word count", v: `${project.wordCount.toLocaleString()} words` },
                { k: "Deadline", v: fmtDate(project.deadline) },
                { k: "Submitted", v: fmtDate(project.createdAt, true) },
              ].map((r) => (
                <div key={r.k} className="rounded-lg bg-mist-50 px-3 py-2">
                  <dt className="text-[11px] uppercase text-navy-400">{r.k}</dt>
                  <dd className="text-sm font-medium text-navy-800">{r.v}</dd>
                </div>
              ))}
            </dl>
            {project.message && (
              <div className="mt-4 rounded-xl border border-mist-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase text-navy-400">Client message</p>
                <p className="mt-1 text-sm text-navy-700">{project.message}</p>
              </div>
            )}
            {project.revisionRequested && (
              <div className="mt-4 rounded-xl bg-violet-50 p-3">
                <p className="text-xs font-semibold uppercase text-violet-500">Revision requested</p>
                <p className="mt-1 text-sm text-violet-800">{project.revisionRequested.reason}</p>
              </div>
            )}
          </section>

          {/* Quote */}
          <section className="rounded-2xl border border-mist-200 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-bold text-navy-900">Quote</h2>
            {project.quote ? (
              <div className="mt-3 rounded-xl bg-mist-50 p-4">
                <p className="text-2xl font-bold text-navy-900">
                  {formatMoney(project.quote.amount, project.quote.currency)}
                </p>
                <p className="text-sm text-navy-600">{project.quote.summary}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {project.quote.sentAt && <span className="chip">Sent {fmtDate(project.quote.sentAt)}</span>}
                  {project.quote.approvedAt && <span className="chip border-teal-200 bg-teal-50 text-teal-700">Approved</span>}
                  {project.quote.paidAt && <span className="chip border-teal-200 bg-teal-50 text-teal-700">Paid</span>}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-navy-500">No quote sent yet.</p>
            )}

            <div className="mt-4 rounded-xl border border-gold-200 bg-gold-50 p-4">
              <p className="text-xs font-semibold uppercase text-gold-700">Automated suggestion</p>
              <p className="mt-1 text-lg font-bold text-navy-900">
                {formatMoney(suggested.low)} – {formatMoney(suggested.high)}
                <span className="ml-2 text-sm font-normal text-navy-500">(mid {formatMoney(suggested.mid)})</span>
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  placeholder={`£${suggested.mid}`}
                  className="flex-1 rounded-xl border border-mist-300 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <button onClick={handleSendQuote} className="btn-primary">
                  {project.quote ? "Re-send quote" : "Send quote"}
                </button>
              </div>
            </div>
          </section>

          {/* Deliverables upload */}
          <section className="rounded-2xl border border-mist-200 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-bold text-navy-900">Upload completed documents</h2>
            <div className="mt-3">
              <FileDrop
                label="Upload deliverables"
                hint="Reviewed docs shared with the client"
                onFiles={(files) =>
                  files.forEach((f) =>
                    attachFile(project.id, { ...f, kind: "deliverable", uploadedBy: "admin" })
                  )
                }
              />
            </div>
            {project.files.length > 0 && (
              <ul className="mt-3 divide-y divide-mist-200">
                {project.files.map((f) => (
                  <li key={f.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="flex items-center gap-2 text-navy-700">
                      <Icon name="reference" className="h-4 w-4 text-navy-400" /> {f.name}
                    </span>
                    <span className="text-xs text-navy-400">{f.kind} · {f.uploadedBy}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Notes */}
          <section className="rounded-2xl border border-mist-200 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-bold text-navy-900">Notes</h2>
            <div className="mt-3">
              <textarea
                rows={2}
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Add a note…"
                className="w-full rounded-xl border border-mist-300 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              <div className="mt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-navy-600">
                  <input type="checkbox" checked={noteInternal} onChange={(e) => setNoteInternal(e.target.checked)} className="rounded border-mist-300" />
                  Internal only (hidden from client)
                </label>
                <button
                  onClick={() => {
                    if (!noteBody.trim()) return;
                    addNote(project.id, { author: "admin", authorName: "Support Team", body: noteBody, internal: noteInternal });
                    setNoteBody("");
                  }}
                  className="btn-navy px-4 py-2 text-sm"
                >
                  Add note
                </button>
              </div>
            </div>
            {project.notes.length > 0 && (
              <ul className="mt-4 space-y-3">
                {project.notes.map((n) => (
                  <li key={n.id} className={`rounded-xl p-3 ${n.internal ? "bg-amber-50" : "bg-mist-50"}`}>
                    <p className="text-sm text-navy-700">{n.body}</p>
                    <p className="mt-1 text-xs text-navy-400">
                      {n.authorName} · {fmtDate(n.createdAt, true)}
                      {n.internal && <span className="ml-1.5 font-semibold text-amber-600">· internal</span>}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Sidebar: email update + activity */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-mist-200 bg-white p-6 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-600">Email update</h2>
            <p className="mt-2 text-xs text-navy-500">
              Send the client a status update. Demo opens your mail app; connect Resend/SendGrid to
              automate.
            </p>
            <textarea
              rows={3}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder={`Hi ${project.clientName.split(" ")[0]}, an update on ${project.id}…`}
              className="mt-3 w-full rounded-xl border border-mist-300 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <a
              href={emailHref}
              onClick={() => {
                addNote(project.id, {
                  author: "admin",
                  authorName: "Support Team",
                  body: emailBody || "Sent a status update by email.",
                });
                setEmailSent(true);
              }}
              className="btn-navy mt-2 w-full"
            >
              <Icon name="feedback" className="h-4 w-4" /> Send email update
            </a>
            {emailSent && <p className="mt-2 text-center text-xs text-teal-700">Update logged to activity.</p>}
          </div>

          <div className="rounded-2xl border border-mist-200 bg-white p-6 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-600">Activity</h2>
            <ol className="mt-4 space-y-4">
              {project.activity.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className={`mt-1 h-2 w-2 flex-none rounded-full ${a.by === "client" ? "bg-teal-400" : a.by === "admin" ? "bg-blue-400" : "bg-mist-300"}`} />
                  <div>
                    <p className="text-sm text-navy-700">{a.label}</p>
                    <p className="text-xs text-navy-400">{fmtDate(a.at, true)} · {a.by}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
