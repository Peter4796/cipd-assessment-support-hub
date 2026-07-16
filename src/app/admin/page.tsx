/**
 * Admin lead list (P2.3) — server component on live database rows.
 * Read-only in this phase: browsing, filtering and navigation to detail.
 * Filters travel as URL searchParams (shareable, no client JS needed).
 */

import Link from "next/link";
import {
  AlertFailedBadge,
  ClassificationBadge,
  LEAD_STATUS_META,
  StatusBadge,
} from "@/components/admin/badges";
import { isDbConfigured } from "@/lib/db/client";
import { LEAD_LIST_LIMIT, listLeads, statusCounts } from "@/lib/db/leads";
import { daysUntilDeadline, parseLeadFilters } from "@/lib/admin/filters";
import { LEAD_STATUSES, SUPPORT_TYPES, type SupportType } from "@/lib/leads/types";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

const selectCls =
  "rounded-xl border border-mist-300 bg-white px-3 py-2 text-sm text-navy-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

function fmtDate(value: Date | string, withTime = false): string {
  const d = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!isDbConfigured()) {
    return (
      <div className="rounded-3xl border border-mist-200 bg-white p-10 text-center">
        <h1 className="text-lg font-bold text-navy-900">Database not configured</h1>
        <p className="mt-2 text-sm text-navy-600">
          Set DATABASE_URL (Neon integration) to see captured leads. Lead capture itself
          still works: notifications are delivered by email.
        </p>
      </div>
    );
  }

  const filters = parseLeadFilters(searchParams);
  const today = new Date();
  const [rows, counts] = await Promise.all([listLeads(filters, today), statusCounts()]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Leads</h1>
          <p className="mt-1 text-sm text-navy-600">
            {total} captured {total === 1 ? "lead" : "leads"} · database is the system of record.
          </p>
        </div>
      </div>

      {/* Status pills — links, so they compose with the other filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        <PillLink
          label="All"
          count={total}
          href="/admin"
          active={!filters.status}
        />
        {LEAD_STATUSES.map((s) => (
          <PillLink
            key={s}
            label={LEAD_STATUS_META[s].label}
            count={counts[s] ?? 0}
            href={`/admin?status=${s}`}
            active={filters.status === s}
          />
        ))}
      </div>

      {/* Filter bar — plain GET form, server-rendered */}
      <form
        method="get"
        className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-mist-200 bg-white p-4 shadow-soft"
      >
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Search ref, name, email, unit…"
          className={`${selectCls} min-w-[200px] flex-1`}
          aria-label="Search leads"
        />
        <select name="classification" defaultValue={filters.classification ?? ""} className={selectCls} aria-label="Filter by intent">
          <option value="">All intent</option>
          <option value="PRIORITY">Priority</option>
          <option value="HIGH_INTENT">High intent</option>
          <option value="WARM">Warm</option>
          <option value="LOW_INTENT">Low intent</option>
        </select>
        <select name="level" defaultValue={filters.level ?? ""} className={selectCls} aria-label="Filter by CIPD level">
          <option value="">All levels</option>
          <option value="3">Level 3</option>
          <option value="5">Level 5</option>
          <option value="7">Level 7</option>
        </select>
        <select name="urgency" defaultValue={filters.urgency ?? ""} className={selectCls} aria-label="Filter by deadline urgency">
          <option value="">Any deadline</option>
          <option value="overdue">Overdue</option>
          <option value="3d">Within 3 days</option>
          <option value="7d">Within 7 days</option>
          <option value="later">Later than 7 days</option>
        </select>
        <select name="sort" defaultValue={filters.sort} className={selectCls} aria-label="Sort order">
          <option value="newest">Sort: newest</option>
          <option value="deadline">Sort: deadline</option>
        </select>
        <button type="submit" className="btn-navy px-4 py-2 text-sm">
          Apply
        </button>
      </form>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-mist-200 bg-mist-50 text-xs uppercase tracking-wide text-navy-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Ref</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Level / Unit</th>
                <th className="px-4 py-3 font-semibold">Support</th>
                <th className="px-4 py-3 font-semibold">Intent</th>
                <th className="px-4 py-3 font-semibold">Deadline</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist-200">
              {rows.map((r) => {
                const days = r.deadline ? daysUntilDeadline(r.deadline, today) : null;
                const urgent = days !== null && days <= 3;
                return (
                  <tr key={r.id} className="hover:bg-mist-50">
                    <td className="px-4 py-3 font-mono font-semibold">
                      <Link href={`/admin/leads/${r.id}`} className="text-teal-700 hover:underline">
                        {r.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy-900">{r.name}</p>
                      <p className="text-xs text-navy-400">{r.email}</p>
                    </td>
                    <td className="px-4 py-3 text-navy-700">
                      L{r.level}
                      {r.unitCode ? ` · ${r.unitCode}` : ""}
                    </td>
                    <td className="px-4 py-3 text-navy-700">
                      {SUPPORT_TYPES[r.supportType as SupportType] ?? r.supportType}
                      {r.submissionType === "resubmission" && (
                        <span className="ml-1.5 text-xs font-semibold text-red-600">resub</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ClassificationBadge classification={r.classification} />
                    </td>
                    <td className="px-4 py-3">
                      {r.deadline ? (
                        <span className={urgent ? "font-semibold text-red-600" : "text-navy-700"}>
                          {fmtDate(r.deadline)}
                          {days !== null && (
                            <span className="ml-1 text-xs">
                              ({days < 0 ? `${-days}d overdue` : `${days}d`})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-navy-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex flex-wrap gap-1.5">
                        <StatusBadge status={r.status} />
                        {r.notifyError && <AlertFailedBadge />}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-navy-500">{fmtDate(r.createdAt, true)}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-navy-400">
                    {total === 0
                      ? "No leads captured yet. New enquiries from the site will appear here."
                      : "No leads match these filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-3 text-xs text-navy-400">
        Showing {rows.length}
        {rows.length === LEAD_LIST_LIMIT ? ` (limit ${LEAD_LIST_LIMIT} — narrow the filters)` : ""} of {total} leads.
      </p>
    </div>
  );
}

function PillLink({
  label,
  count,
  href,
  active,
}: {
  label: string;
  count: number;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-navy-800 bg-navy-800 text-white"
          : "border-mist-300 bg-white text-navy-700 hover:bg-mist-100"
      }`}
    >
      {label} <span className={active ? "text-mist-200" : "text-navy-400"}>{count}</span>
    </Link>
  );
}
