/**
 * Needs Attention (Escalation P1, approved §9) — the operational priority
 * view. Orders open leads by the planner's attention score but the UI
 * shows only the transparent reasons ("High intent", "Untouched 37 min",
 * "Due today", "Quote stale 3d"); the number exists solely for
 * deterministic sorting and is rendered nowhere. All Leads (/admin) is
 * preserved unchanged as the chronological/filter view.
 */

import Link from "next/link";
import {
  AlertFailedBadge,
  ClassificationBadge,
  StatusBadge,
} from "@/components/admin/badges";
import { isDbConfigured } from "@/lib/db/client";
import { listOperationalLeads } from "@/lib/db/leads";
import {
  attentionFor,
  getOwnerTimeZone,
  type AttentionInput,
} from "@/lib/leads/operations";

export const dynamic = "force-dynamic";

export default async function NeedsAttentionPage() {
  if (!isDbConfigured()) {
    return (
      <div className="rounded-3xl border border-mist-200 bg-white p-10 text-center">
        <h1 className="text-lg font-bold text-navy-900">Database not configured</h1>
      </div>
    );
  }

  const now = new Date();
  const tz = getOwnerTimeZone();
  const leads = await listOperationalLeads();

  const ranked = leads
    .map((l) => {
      const input: AttentionInput = {
        id: l.row.id,
        createdAt: l.row.createdAt,
        status: l.row.status,
        classification: l.row.classification,
        deadline: l.row.deadline,
        quoteSentAt: l.row.quoteSentAt,
        touch: {
          status: l.row.status,
          contactedAt: l.row.contactedAt,
          archivedAt: l.row.archivedAt,
          notesCount: l.notesCount,
          eventStatuses: l.eventStatuses,
        },
        lastEventAt: l.lastEventAt,
      };
      return { row: l.row, attention: attentionFor(input, now, tz) };
    })
    .filter((x): x is typeof x & { attention: NonNullable<typeof x.attention> } =>
      Boolean(x.attention && x.attention.reasons.length > 0)
    )
    .sort((a, b) => b.attention.score - a.attention.score);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Needs attention</h1>
          <p className="mt-1 text-sm text-navy-600">
            Open leads ordered by operational urgency, not arrival time. Handling a lead
            (contact, note, status progression) clears it.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-xl border border-mist-300 bg-white px-4 py-2 text-sm font-semibold text-navy-700 hover:border-gold-400 hover:text-gold-600"
        >
          All leads →
        </Link>
      </div>

      {ranked.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-mist-200 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-navy-700">Nothing needs attention right now.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {ranked.map(({ row, attention }) => (
            <li key={row.id}>
              <Link
                href={`/admin/leads/${row.id}`}
                className="block rounded-2xl border border-mist-200 bg-white p-4 shadow-soft transition-colors hover:border-gold-300"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-navy-600">{row.id}</span>
                  <StatusBadge status={row.status} />
                  <ClassificationBadge classification={row.classification} />
                  {row.notifyError && <AlertFailedBadge />}
                  <span className="ml-auto text-xs text-navy-400">
                    L{row.level}
                    {row.unitCode ? ` · ${row.unitCode}` : ""}
                    {row.deadline ? ` · deadline ${row.deadline}` : ""}
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {attention.reasons.map((r) => (
                    <span
                      key={r}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        r === "Overdue" || r === "Due today" || r.startsWith("Untouched")
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "border border-mist-300 bg-mist-50 text-navy-700"
                      }`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
