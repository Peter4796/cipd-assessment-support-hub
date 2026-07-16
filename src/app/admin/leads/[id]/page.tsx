/**
 * Admin lead detail (P2.3) — server component on the live database row.
 * Read-only in this phase; status controls, notes and the quote panel land
 * in P2.4. Downloads go through the existing Basic-Auth-mediated
 * /admin/files route — no raw storage URL is ever rendered.
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
import { humanFileSize } from "@/lib/leads/uploads";
import { mediatedFileUrl } from "@/lib/urls";
import { getUnit } from "@/content/units";
import {
  ATTACHMENT_CATEGORIES,
  SUPPORT_TYPES,
  type AttachmentCategory,
  type LeadStatus,
  type SupportType,
} from "@/lib/leads/types";

export const dynamic = "force-dynamic";

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
  const { row, lead, attachments, events } = detail;

  const unit = lead.unitCode ? getUnit(lead.unitCode.toLowerCase()) : undefined;
  const days = lead.deadline ? daysUntilDeadline(lead.deadline, new Date()) : null;
  const waDigits = lead.whatsapp?.replace(/\D/g, "");
  const firstName = lead.name.split(" ")[0];

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
                      <a
                        href={mediatedFileUrl(a.pathname)}
                        className="btn-outline px-3 py-1.5 text-xs"
                      >
                        Download
                      </a>
                    )}
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
            <p className="mt-4 border-t border-mist-200 pt-3 text-xs text-navy-400">
              Status controls, internal notes and the quote panel arrive in P2.4.
            </p>
          </Section>
        </aside>
      </div>
    </div>
  );
}
