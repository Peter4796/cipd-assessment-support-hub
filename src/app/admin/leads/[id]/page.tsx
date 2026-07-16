/**
 * Admin lead detail (P2.3 read view + P2.4 operations).
 *
 * Server component on the live database row. Mutations are server actions
 * (actions.ts) posting back to this /admin/leads/[id] route, so the Basic
 * Auth middleware gates reads AND writes identically. Downloads go through
 * the existing mediated /admin/files route — no raw storage URL is ever
 * rendered.
 *
 * The quote recommendation is computed server-side per request and appears
 * only in this authenticated HTML — never in client bundles, public pages,
 * API responses, analytics or client emails (owner decision 4).
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertFailedBadge,
  ClassificationBadge,
  LEAD_STATUS_META,
  StatusBadge,
} from "@/components/admin/badges";
import { isDbConfigured } from "@/lib/db/client";
import { getLeadDetail } from "@/lib/db/leads";
import { daysUntilDeadline } from "@/lib/admin/filters";
import { formatUsd, recommendQuoteForLead, URGENCY_LABEL } from "@/lib/admin/quote";
import { isTerminalStatus } from "@/lib/leads/status";
import { humanFileSize } from "@/lib/leads/uploads";
import { mediatedFileUrl } from "@/lib/urls";
import { getUnit } from "@/content/units";
import {
  ATTACHMENT_CATEGORIES,
  LEAD_STATUSES,
  SUPPORT_TYPES,
  type AttachmentCategory,
  type CipdLevel,
  type LeadStatus,
  type SupportType,
} from "@/lib/leads/types";
import { addNote, changeLeadStatus, recordQuote } from "./actions";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-xl border border-mist-300 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

function fmt(d: Date | null | undefined, withTime = true): string | null {
  if (!d) return null;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-mist-200 bg-white p-6 shadow-soft">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gold-600">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Rows({ rows }: { rows: [string, React.ReactNode][] }) {
  const visible = rows.filter(([, v]) => v !== null && v !== undefined && v !== "");
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {visible.map(([k, v]) => (
        <div key={k} className="rounded-lg bg-mist-50 px-3 py-2">
          <dt className="text-[11px] uppercase text-navy-400">{k}</dt>
          <dd className="text-sm font-medium text-navy-800">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function AdminLeadDetailPage({ params }: { params: { id: string } }) {
  if (!isDbConfigured()) notFound();
  const detail = await getLeadDetail(params.id);
  if (!detail) notFound();
  const { row, lead, attachments, events, notes } = detail;

  const unit = lead.unitCode ? getUnit(lead.unitCode.toLowerCase()) : undefined;
  const days = lead.deadline ? daysUntilDeadline(lead.deadline, new Date()) : null;
  const waDigits = lead.whatsapp?.replace(/\D/g, "");
  const firstName = lead.name.split(" ")[0];
  const terminal = isTerminalStatus(row.status);
  const recommendation = recommendQuoteForLead({
    level: lead.level as CipdLevel,
    supportType: lead.supportType as SupportType,
    wordCount: lead.wordCount,
    deadline: lead.deadline,
  });

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 hover:text-gold-600"
      >
        ← All leads
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-navy-500">{lead.id}</span>
            <StatusBadge status={row.status} />
            <ClassificationBadge classification={lead.classification} />
            {row.notifyError && <AlertFailedBadge />}
            {row.archivedAt && (
              <span className="rounded-full border border-mist-300 bg-mist-100 px-2.5 py-0.5 text-xs text-navy-500">
                Archived
              </span>
            )}
          </div>
          <h1 className="mt-1.5 text-2xl font-bold text-navy-900">{lead.name}</h1>
          <p className="text-sm text-navy-500">
            Received {fmt(row.createdAt)} · score {lead.score} (internal)
          </p>
        </div>
        <div className="flex flex-none flex-wrap gap-2">
          {waDigits && (
            <a
              href={`https://wa.me/${waDigits}?text=${encodeURIComponent(
                `Hi ${firstName}, about your CIPD enquiry ${lead.id}…`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
            >
              WhatsApp {firstName}
            </a>
          )}
          <a
            href={`mailto:${lead.email}?subject=${encodeURIComponent(
              `Your CIPD assessment enquiry ${lead.id}`
            )}`}
            className="btn-navy"
          >
            Email
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-6">
          <Section title="Assessment">
            <Rows
              rows={[
                ["CIPD level", `Level ${lead.level}`],
                ["Unit", lead.unitCode ? `${lead.unitCode}${unit ? ` — ${unit.title}` : ""}` : null],
                ["Support type", SUPPORT_TYPES[lead.supportType as SupportType] ?? lead.supportType],
                [
                  "Submission",
                  lead.submissionType
                    ? lead.submissionType === "resubmission"
                      ? "Resubmission"
                      : "First submission"
                    : null,
                ],
                ["Word count", lead.wordCount?.toLocaleString() ?? null],
                [
                  "Deadline",
                  lead.deadline ? (
                    <span className={days !== null && days <= 3 ? "font-semibold text-red-600" : undefined}>
                      {lead.deadline}
                      {days !== null && ` (${days < 0 ? `${-days}d overdue` : `${days}d`})`}
                    </span>
                  ) : null,
                ],
                ["Provider", lead.provider ?? null],
              ]}
            />
            {lead.referredCriteria && (
              <div className="mt-4 rounded-xl bg-red-50 p-3">
                <p className="text-xs font-semibold uppercase text-red-500">Referred criteria</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-navy-800">{lead.referredCriteria}</p>
              </div>
            )}
            {lead.message && (
              <div className="mt-4 rounded-xl border border-mist-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase text-navy-400">Client message</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-navy-700">{lead.message}</p>
              </div>
            )}
          </Section>

          {/* ── Quote (admin-only) ── */}
          <Section title="Quote (internal)">
            <div className="rounded-xl border border-gold-200 bg-gold-50 p-4">
              <p className="text-xs font-semibold uppercase text-gold-700">Calculated recommendation</p>
              <p className="mt-1 text-lg font-bold text-navy-900">
                {formatUsd(recommendation.low)} – {formatUsd(recommendation.high)}
                <span className="ml-2 text-sm font-normal text-navy-500">
                  (mid {formatUsd(recommendation.mid)})
                </span>
              </p>
              <p className="mt-1 text-xs text-navy-500">
                {URGENCY_LABEL[recommendation.urgency]}
                {recommendation.minimumApplied ? " · minimum floor applied" : ""}
              </p>
              <p className="mt-2 text-xs text-navy-400">
                {recommendation.breakdown.map((b) => `${b.label}: ${b.value}`).join(" · ")}
              </p>
            </div>

            {row.quotedAmount != null && (
              <div className="mt-4 rounded-xl bg-mist-50 p-4">
                <p className="text-xs font-semibold uppercase text-navy-400">Actual quote sent</p>
                <p className="mt-1 text-2xl font-bold text-navy-900">
                  {formatUsd(row.quotedAmount, row.quoteCurrency ?? "USD")}
                </p>
                <p className="mt-1 text-xs text-navy-500">
                  Recorded {fmt(row.quotedAt)}
                  {row.quoteRecommendedMid != null &&
                    ` · recommendation at the time: ${formatUsd(row.quoteRecommendedMid)}`}
                </p>
                {row.quoteNotes && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-navy-700">{row.quoteNotes}</p>
                )}
              </div>
            )}

            <form action={recordQuote} className="mt-4 grid gap-3">
              <input type="hidden" name="leadId" value={lead.id} />
              <div className="flex flex-wrap gap-3">
                <input
                  name="amount"
                  inputMode="numeric"
                  defaultValue={row.quotedAmount ?? ""}
                  placeholder={String(recommendation.mid)}
                  aria-label="Quoted amount"
                  className={`${inputCls} w-32 flex-none`}
                  required
                />
                <select
                  name="currency"
                  defaultValue={row.quoteCurrency ?? "USD"}
                  aria-label="Quote currency"
                  className={`${inputCls} w-28 flex-none`}
                >
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="AED">AED</option>
                </select>
                <button type="submit" className="btn-primary px-5 py-2 text-sm">
                  {row.quotedAmount != null ? "Update quote" : "Record quote"}
                </button>
              </div>
              <textarea
                name="notes"
                rows={2}
                defaultValue={row.quoteNotes ?? ""}
                placeholder="Quote notes (what was included, negotiation context)…"
                aria-label="Quote notes"
                className={inputCls}
              />
            </form>
            <p className="mt-3 text-xs text-navy-400">
              Internal only. The client never sees the recommendation; you send the actual quote
              on WhatsApp or email.
            </p>
          </Section>

          <Section title={`Documents (${attachments.length})`}>
            {attachments.length === 0 && (
              <p className="text-sm text-navy-500">No documents uploaded.</p>
            )}
            {attachments.length > 0 && (
              <ul className="divide-y divide-mist-200">
                {attachments.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-navy-800">{a.originalFileName}</p>
                      <p className="text-xs text-navy-400">
                        {ATTACHMENT_CATEGORIES[a.category as AttachmentCategory] ?? a.category} ·{" "}
                        {humanFileSize(a.sizeBytes)} · uploaded {fmt(a.uploadedAt)}
                      </p>
                    </div>
                    {a.deletedAt ? (
                      <span className="text-xs font-medium text-navy-400">
                        Deleted under retention policy {fmt(a.deletedAt, false)}
                      </span>
                    ) : (
                      <a href={mediatedFileUrl(a.pathname)} className="btn-outline px-3 py-1.5 text-xs">
                        Download
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* ── Internal notes ── */}
          <Section title={`Internal notes (${notes.length})`}>
            <form action={addNote}>
              <input type="hidden" name="leadId" value={lead.id} />
              <textarea
                name="body"
                rows={2}
                placeholder="Add an internal note…"
                aria-label="New internal note"
                className={inputCls}
                required
              />
              <div className="mt-2 flex justify-end">
                <button type="submit" className="btn-navy px-4 py-2 text-sm">
                  Add note
                </button>
              </div>
            </form>
            {notes.length > 0 && (
              <ul className="mt-3 space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-xl bg-amber-50 p-3">
                    <p className="whitespace-pre-wrap text-sm text-navy-700">{n.body}</p>
                    <p className="mt-1 text-xs text-navy-400">{fmt(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Client">
            <Rows
              rows={[
                ["Name", lead.name],
                ["Email", lead.email],
                ["WhatsApp", lead.whatsapp ?? null],
                ["Country", lead.country ?? null],
              ]}
            />
          </Section>

          <Section title="Acquisition">
            <Rows
              rows={[
                ["Source page", lead.acquisition.sourcePage],
                ["Page type", lead.acquisition.sourcePageType],
                ["Entry CTA", lead.funnel?.entryCta ?? null],
                [
                  "Form completion",
                  lead.funnel?.durationSeconds !== undefined
                    ? `${Math.floor((lead.funnel.durationSeconds ?? 0) / 60)}m ${(lead.funnel.durationSeconds ?? 0) % 60}s`
                    : null,
                ],
                ["Referrer", lead.acquisition.referrer ?? null],
                ["UTM source", lead.acquisition.utmSource ?? null],
                ["UTM medium", lead.acquisition.utmMedium ?? null],
                ["UTM campaign", lead.acquisition.utmCampaign ?? null],
                ["Form", lead.schemaVersion === 2 ? "Multi-step funnel" : "Contact form"],
              ]}
            />
          </Section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* ── Status control ── */}
          <Section title="Status">
            {!terminal && (
              <>
                <div className="flex flex-wrap gap-2">
                  {LEAD_STATUSES.filter((s) => s !== "LOST" && s !== row.status).map((s) => (
                    <form key={s} action={changeLeadStatus}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <input type="hidden" name="to" value={s} />
                      <button
                        type="submit"
                        className="rounded-full border border-mist-300 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 transition-colors hover:bg-mist-100"
                      >
                        {LEAD_STATUS_META[s].label}
                      </button>
                    </form>
                  ))}
                </div>
                <form action={changeLeadStatus} className="mt-4 border-t border-mist-200 pt-4">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <input type="hidden" name="to" value="LOST" />
                  <div className="flex gap-2">
                    <input
                      name="lostReason"
                      placeholder="Reason (optional)"
                      aria-label="Lost reason"
                      className={`${inputCls} flex-1 text-xs`}
                    />
                    <button
                      type="submit"
                      className="flex-none rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      Mark lost
                    </button>
                  </div>
                </form>
              </>
            )}
            {terminal && (
              <div>
                <p className="text-sm text-navy-600">
                  This lead is {LEAD_STATUS_META[row.status as LeadStatus]?.label.toLowerCase()}
                  {row.lostReason ? ` (${row.lostReason})` : ""}. Reopening is deliberate:
                </p>
                <form action={changeLeadStatus} className="mt-3 flex gap-2">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <input type="hidden" name="reopen" value="1" />
                  <select name="to" defaultValue="REVIEWING" aria-label="Reopen as status" className={`${inputCls} flex-1`}>
                    {LEAD_STATUSES.filter((s) => s !== row.status && s !== "LOST").map((s) => (
                      <option key={s} value={s}>
                        {LEAD_STATUS_META[s].label}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="btn-outline flex-none px-3 py-1.5 text-xs">
                    Reopen
                  </button>
                </form>
              </div>
            )}
            <MilestoneList row={row} />
          </Section>

          <Section title="Alert email">
            {row.notifiedAt ? (
              <p className="text-sm text-navy-700">
                Delivered {fmt(row.notifiedAt)}
                {row.notifyAttempts > 1 ? ` (attempt ${row.notifyAttempts})` : ""}.
              </p>
            ) : row.notifyError ? (
              <div>
                <p className="text-sm font-semibold text-red-700">
                  Notification failed ({row.notifyError}).
                </p>
                <p className="mt-1 text-xs text-navy-500">
                  The lead is safely stored. Automatic retry arrives with the P2.5 job.
                </p>
              </div>
            ) : (
              <p className="text-sm text-navy-500">No delivery recorded.</p>
            )}
          </Section>

          <Section title="History">
            <ol className="space-y-4">
              {events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span
                    className={`mt-1 h-2 w-2 flex-none rounded-full ${
                      LEAD_STATUS_META[e.toStatus as LeadStatus]?.dot ?? "bg-mist-300"
                    }`}
                  />
                  <div>
                    <p className="text-sm text-navy-700">
                      {e.fromStatus
                        ? `${LEAD_STATUS_META[e.fromStatus as LeadStatus]?.label ?? e.fromStatus} → ${
                            LEAD_STATUS_META[e.toStatus as LeadStatus]?.label ?? e.toStatus
                          }`
                        : `Captured as ${LEAD_STATUS_META[e.toStatus as LeadStatus]?.label ?? e.toStatus}`}
                    </p>
                    <p className="text-xs text-navy-400">{fmt(e.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        </aside>
      </div>
    </div>
  );
}

function MilestoneList({
  row,
}: {
  row: {
    contactedAt: Date | null;
    quoteSentAt: Date | null;
    paymentConfirmedAt: Date | null;
    workStartedAt: Date | null;
    deliveredAt: Date | null;
    completedAt: Date | null;
    lostAt: Date | null;
  };
}) {
  const milestones: [string, Date | null][] = [
    ["Contacted", row.contactedAt],
    ["Quote sent", row.quoteSentAt],
    ["Payment confirmed", row.paymentConfirmedAt],
    ["Work started", row.workStartedAt],
    ["Delivered", row.deliveredAt],
    ["Completed", row.completedAt],
    ["Lost", row.lostAt],
  ];
  const set = milestones.filter(([, d]) => d !== null);
  if (set.length === 0) return null;
  return (
    <dl className="mt-4 space-y-1 border-t border-mist-200 pt-3">
      {set.map(([label, d]) => (
        <div key={label} className="flex justify-between text-xs">
          <dt className="text-navy-400">{label}</dt>
          <dd className="font-medium text-navy-700">{fmt(d)}</dd>
        </div>
      ))}
    </dl>
  );
}
