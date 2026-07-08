"use client";

import Link from "next/link";
import { RequireClient } from "@/components/portal/Gates";
import { StatusBadge, EmptyState, fmtDate } from "@/components/portal/PortalUI";
import { Icon } from "@/components/Icon";
import { useProjects } from "@/lib/portal/store";
import { useClientSession } from "@/lib/portal/session";
import { STATUS_META } from "@/lib/portal/statuses";

export default function ClientDashboardPage() {
  return (
    <RequireClient>
      <Dashboard />
    </RequireClient>
  );
}

function Dashboard() {
  const session = useClientSession();
  const all = useProjects();
  const projects = all.filter(
    (p) => session && p.clientEmail.toLowerCase() === session.email.toLowerCase()
  );

  const active = projects.filter((p) => p.status !== "completed").length;
  const needsAction = projects.filter((p) => p.status === "quote_sent" || p.status === "review_stage");

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            Welcome back{session ? `, ${session.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-navy-600">Track your CIPD assessment support in one place.</p>
        </div>
        <Link href="/portal/new" className="btn-primary">
          <Icon name="brief" className="h-4 w-4" /> New request
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Active projects", value: active },
          { label: "Awaiting your action", value: needsAction.length },
          { label: "Total projects", value: projects.length },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-mist-200 bg-white p-5 shadow-soft">
            <p className="text-3xl font-bold text-navy-900">{s.value}</p>
            <p className="mt-1 text-sm text-navy-600">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Action needed */}
      {needsAction.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gold-200 bg-gold-50 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-navy-800">
            <Icon name="feedback" className="h-4 w-4 text-gold-600" /> {needsAction.length} project
            {needsAction.length > 1 ? "s need" : " needs"} your attention
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {needsAction.map((p) => (
              <Link key={p.id} href={`/portal/${p.id}`} className="chip bg-white hover:border-gold-400">
                {p.id} · {STATUS_META[p.status].label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      <h2 className="mb-4 mt-8 text-lg font-bold text-navy-900">Your projects</h2>
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          hint="Submit your first assessment brief to get a quote and start tracking progress."
        />
      ) : (
        <div className="grid gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/portal/${p.id}`}
              className="group flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5 shadow-soft transition-all hover:border-mist-300 hover:shadow-card sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-navy-500">{p.id}</span>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-1.5 font-semibold text-navy-900 group-hover:text-gold-600">
                  Level {p.level} · {p.unitCode} · {p.helpType}
                </p>
                <p className="mt-0.5 text-sm text-navy-500">
                  {p.wordCount.toLocaleString()} words · due {fmtDate(p.deadline)}
                </p>
              </div>
              <Icon name="arrow" className="hidden h-5 w-5 text-navy-300 group-hover:text-gold-600 sm:block" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
