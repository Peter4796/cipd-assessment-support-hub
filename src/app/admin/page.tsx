"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RequireAdmin } from "@/components/portal/Gates";
import { StatusBadge, fmtDate } from "@/components/portal/PortalUI";
import { Icon } from "@/components/Icon";
import { useProjects } from "@/lib/portal/store";
import { STATUS_PIPELINE, STATUS_META } from "@/lib/portal/statuses";
import type { ProjectStatus } from "@/lib/portal/types";

export default function AdminDashboardPage() {
  return (
    <RequireAdmin>
      <AdminDashboard />
    </RequireAdmin>
  );
}

function AdminDashboard() {
  const projects = useProjects();
  const [country, setCountry] = useState("all");
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");
  const [sort, setSort] = useState<"deadline" | "newest">("deadline");
  const [q, setQ] = useState("");

  const countries = useMemo(
    () => Array.from(new Set(projects.map((p) => p.country).filter(Boolean))),
    [projects]
  );

  const filtered = useMemo(() => {
    let list = projects.filter((p) => {
      if (country !== "all" && p.country !== country) return false;
      if (level !== "all" && p.level !== level) return false;
      if (status !== "all" && p.status !== status) return false;
      if (q) {
        const hay = `${p.id} ${p.clientName} ${p.unitCode} ${p.clientEmail}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) =>
      sort === "deadline"
        ? a.deadline.localeCompare(b.deadline)
        : b.createdAt.localeCompare(a.createdAt)
    );
    return list;
  }, [projects, country, level, status, sort, q]);

  const selectCls =
    "rounded-xl border border-mist-300 bg-white px-3 py-2 text-sm text-navy-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

  const counts = STATUS_PIPELINE.map((s) => ({
    status: s,
    count: projects.filter((p) => p.status === s).length,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900">Enquiries</h1>
      <p className="mt-1 text-sm text-navy-600">Manage all client requests, quotes and deliverables.</p>

      {/* Status stat pills */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {counts.map((c) => (
          <button
            key={c.status}
            onClick={() => setStatus(status === c.status ? "all" : c.status)}
            className={`rounded-2xl border bg-white p-4 text-left shadow-soft transition-colors ${
              status === c.status ? "border-navy-400 ring-1 ring-navy-300" : "border-mist-200 hover:border-mist-300"
            }`}
          >
            <p className="text-2xl font-bold text-navy-900">{c.count}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-navy-600">
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[c.status].dot}`} />
              {STATUS_META[c.status].label}
            </p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-mist-200 bg-white p-4 shadow-soft">
        <div className="relative flex-1 min-w-[180px]">
          <Icon name="research" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ref, name, unit…"
            className="w-full rounded-xl border border-mist-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <select className={selectCls} value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="all">All countries</option>
          {countries.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className={selectCls} value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="all">All levels</option>
          <option value="3">Level 3</option>
          <option value="5">Level 5</option>
          <option value="7">Level 7</option>
        </select>
        <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus | "all")}>
          <option value="all">All statuses</option>
          {STATUS_PIPELINE.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
        <select className={selectCls} value={sort} onChange={(e) => setSort(e.target.value as "deadline" | "newest")}>
          <option value="deadline">Sort: deadline</option>
          <option value="newest">Sort: newest</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-mist-200 bg-mist-50 text-xs uppercase tracking-wide text-navy-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Ref</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Level / Unit</th>
                <th className="px-4 py-3 font-semibold">Country</th>
                <th className="px-4 py-3 font-semibold">Deadline</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist-200">
              {filtered.map((p) => {
                const days = Math.round(
                  (new Date(p.deadline).getTime() - Date.now()) / 86400000
                );
                const urgent = days <= 3 && p.status !== "completed";
                return (
                  <tr key={p.id} className="hover:bg-mist-50">
                    <td className="px-4 py-3 font-mono font-semibold text-navy-700">{p.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy-900">{p.clientName}</p>
                      <p className="text-xs text-navy-400">{p.clientEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-navy-700">L{p.level} · {p.unitCode}</td>
                    <td className="px-4 py-3 text-navy-700">{p.country || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={urgent ? "font-semibold text-red-600" : "text-navy-700"}>
                        {fmtDate(p.deadline)}
                      </span>
                      {urgent && <span className="ml-1 text-xs text-red-500">({days}d)</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/${p.id}`} className="btn-outline px-3 py-1.5 text-xs">Manage</Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-navy-400">
                    No enquiries match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-3 text-xs text-navy-400">Showing {filtered.length} of {projects.length} enquiries.</p>
    </div>
  );
}
