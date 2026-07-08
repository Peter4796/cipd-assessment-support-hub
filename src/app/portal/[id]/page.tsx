"use client";

import { useState } from "react";
import Link from "next/link";
import { RequireClient } from "@/components/portal/Gates";
import { StatusBadge, StatusTracker, fmtDate } from "@/components/portal/PortalUI";
import { Icon } from "@/components/Icon";
import { useProject, approveQuote, markPaid, requestRevision } from "@/lib/portal/store";
import { STATUS_META } from "@/lib/portal/statuses";
import { formatMoney } from "@/lib/portal/quote";
import { whatsappLink } from "@/lib/site";

/** Generate + download a placeholder file so the demo download does something real. */
function downloadDemo(name: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob(
    [
      `CIPD Guidance, demo deliverable\n\nFile: ${name}\n\n` +
        `In the live portal this downloads the real reviewed document uploaded by your ` +
        `support specialist. This placeholder confirms the download flow works.`,
    ],
    { type: "text/plain" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.replace(/\.(docx|pdf)$/i, "") + "-demo.txt";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ClientProjectPage({ params }: { params: { id: string } }) {
  return (
    <RequireClient>
      <ProjectDetail id={params.id} />
    </RequireClient>
  );
}

function ProjectDetail({ id }: { id: string }) {
  const project = useProject(id);
  const [revising, setRevising] = useState(false);
  const [reason, setReason] = useState("");

  if (!project) {
    return (
      <div className="rounded-3xl border border-mist-200 bg-white p-10 text-center">
        <p className="font-semibold text-navy-800">Project not found</p>
        <Link href="/portal" className="mt-3 inline-block text-sm font-semibold text-teal-700">
          ← Back to my projects
        </Link>
      </div>
    );
  }

  const deliverables = project.files.filter((f) => f.kind === "deliverable");
  const clientNotes = project.notes.filter((n) => !n.internal);

  return (
    <div>
      <Link href="/portal" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 hover:text-gold-600">
        <Icon name="arrow" className="h-4 w-4 rotate-180" /> My projects
      </Link>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold text-navy-500">{project.id}</span>
            <StatusBadge status={project.status} />
          </div>
          <h1 className="mt-1.5 text-2xl font-bold text-navy-900">
            Level {project.level} · {project.unitCode}
          </h1>
          <p className="text-sm text-navy-500">{project.helpType}</p>
        </div>
        <a
          href={whatsappLink(`Hi, about my project ${project.id}…`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp"
        >
          <Icon name="whatsapp" className="h-4 w-4" /> Message us
        </a>
      </div>

      {/* Pipeline */}
      <div className="mt-6 rounded-2xl border border-mist-200 bg-white p-6 shadow-soft">
        <StatusTracker status={project.status} />
        <p className="mt-4 rounded-xl bg-mist-50 p-3 text-sm text-navy-600">
          {STATUS_META[project.status].description}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* Main column */}
        <div className="space-y-6">
          {/* Quote */}
          {project.quote && (
            <section className="rounded-2xl border border-mist-200 bg-white p-6 shadow-soft">
              <h2 className="text-lg font-bold text-navy-900">Your quote</h2>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-navy-900">
                  {formatMoney(project.quote.amount, project.quote.currency)}
                </span>
                {project.quote.approvedAt ? (
                  <span className="chip border-teal-200 bg-teal-50 text-teal-700">Approved</span>
                ) : (
                  <span className="chip border-amber-200 bg-amber-50 text-amber-700">Awaiting approval</span>
                )}
              </div>
              <p className="mt-1 text-sm text-navy-600">{project.quote.summary}</p>
              <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                {project.quote.breakdown.map((b) => (
                  <div key={b.label} className="rounded-lg bg-mist-50 px-3 py-2">
                    <dt className="text-[11px] uppercase text-navy-400">{b.label}</dt>
                    <dd className="text-sm font-medium text-navy-800">{b.value}</dd>
                  </div>
                ))}
              </dl>

              {!project.quote.approvedAt && (
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button onClick={() => approveQuote(project.id)} className="btn-primary flex-1">
                    <Icon name="check" className="h-4 w-4" /> Approve quote
                  </button>
                </div>
              )}

              {project.quote.approvedAt && !project.quote.paidAt && (
                <div className="mt-5 rounded-xl border border-mist-200 bg-mist-50 p-4">
                  <p className="text-sm font-medium text-navy-800">Secure payment</p>
                  <p className="mt-0.5 text-xs text-navy-500">
                    Demo checkout. No real charge. Connect Stripe to take live payments.
                  </p>
                  <button onClick={() => markPaid(project.id)} className="btn-navy mt-3 w-full">
                    Pay {formatMoney(project.quote.amount, project.quote.currency)} (demo)
                  </button>
                </div>
              )}

              {project.quote.paidAt && (
                <p className="mt-5 flex items-center gap-2 rounded-xl bg-teal-50 p-3 text-sm font-medium text-teal-800">
                  <Icon name="check" className="h-4 w-4" /> Payment received. Thank you!
                </p>
              )}
            </section>
          )}

          {/* Files */}
          <section className="rounded-2xl border border-mist-200 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-bold text-navy-900">Files</h2>
            {project.files.length === 0 ? (
              <p className="mt-2 text-sm text-navy-500">No files yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-mist-200">
                {project.files.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-mist-100 text-navy-600">
                        <Icon name="reference" className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-navy-800">{f.name}</p>
                        <p className="text-xs text-navy-400">
                          {f.kind} · {f.sizeLabel} · {fmtDate(f.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    {f.kind === "deliverable" && (
                      <button onClick={() => downloadDemo(f.name)} className="btn-outline px-3 py-1.5 text-xs">
                        Download
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Revision */}
          {deliverables.length > 0 && project.status !== "completed" && (
            <section className="rounded-2xl border border-mist-200 bg-white p-6 shadow-soft">
              <h2 className="text-lg font-bold text-navy-900">Request a revision</h2>
              <p className="mt-1 text-sm text-navy-600">
                Reviewed your work and want a refinement? Let us know what you&apos;d like adjusted.
              </p>
              {project.revisionRequested && (
                <p className="mt-3 rounded-xl bg-violet-50 p-3 text-sm text-violet-800">
                  Revision requested {fmtDate(project.revisionRequested.at, true)}. We&apos;re on it.
                </p>
              )}
              {!revising ? (
                <button onClick={() => setRevising(true)} className="btn-outline mt-3">
                  Request a revision
                </button>
              ) : (
                <div className="mt-3">
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="What would you like us to refine?"
                    className="w-full rounded-xl border border-mist-300 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => {
                        requestRevision(project.id, reason || "Please refine the work.");
                        setRevising(false);
                        setReason("");
                      }}
                      className="btn-primary"
                    >
                      Submit request
                    </button>
                    <button onClick={() => setRevising(false)} className="btn-outline">Cancel</button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Messages / notes */}
          {clientNotes.length > 0 && (
            <section className="rounded-2xl border border-mist-200 bg-white p-6 shadow-soft">
              <h2 className="text-lg font-bold text-navy-900">Messages</h2>
              <ul className="mt-3 space-y-3">
                {clientNotes.map((n) => (
                  <li key={n.id} className="rounded-xl bg-mist-50 p-3">
                    <p className="text-sm text-navy-700">{n.body}</p>
                    <p className="mt-1 text-xs text-navy-400">
                      {n.authorName} · {fmtDate(n.createdAt, true)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Sidebar: details + activity */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-mist-200 bg-white p-6 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-600">Details</h2>
            <dl className="mt-3 space-y-3 text-sm">
              {[
                { k: "Level", v: `CIPD Level ${project.level}` },
                { k: "Unit", v: project.unitCode },
                { k: "Word count", v: `${project.wordCount.toLocaleString()} words` },
                { k: "Deadline", v: fmtDate(project.deadline) },
                { k: "Country", v: project.country || "—" },
                { k: "Submitted", v: fmtDate(project.createdAt) },
              ].map((r) => (
                <div key={r.k} className="flex justify-between gap-3">
                  <dt className="text-navy-500">{r.k}</dt>
                  <dd className="text-right font-medium text-navy-800">{r.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-2xl border border-mist-200 bg-white p-6 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-600">Activity</h2>
            <ol className="mt-4 space-y-4">
              {project.activity.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 flex-none rounded-full bg-mist-300" />
                  <div>
                    <p className="text-sm text-navy-700">{a.label}</p>
                    <p className="text-xs text-navy-400">{fmtDate(a.at, true)}</p>
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
