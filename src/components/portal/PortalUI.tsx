import type { ProjectStatus } from "@/lib/portal/types";
import { STATUS_META, STATUS_PIPELINE, statusIndex } from "@/lib/portal/statuses";
import { Icon } from "@/components/Icon";

export function StatusBadge({ status, className = "" }: { status: ProjectStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.tone} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

/** Horizontal 5-stage pipeline tracker. */
export function StatusTracker({ status }: { status: ProjectStatus }) {
  const current = statusIndex(status);
  return (
    <ol className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-0">
      {STATUS_PIPELINE.map((s, i) => {
        const meta = STATUS_META[s];
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center">
            <div className="flex items-center sm:w-full sm:flex-col">
              <span
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                  done
                    ? "border-teal-500 bg-teal-500 text-white"
                    : active
                    ? "border-gold-500 bg-gold-500 text-navy-900"
                    : "border-mist-300 bg-white text-navy-300"
                }`}
              >
                {done ? <Icon name="check" className="h-4 w-4" /> : i + 1}
              </span>
              {i < STATUS_PIPELINE.length - 1 && (
                <span
                  className={`hidden h-0.5 flex-1 sm:block ${done ? "bg-teal-500" : "bg-mist-300"}`}
                />
              )}
            </div>
            <div className="sm:mt-2 sm:px-1">
              <p
                className={`text-sm font-semibold ${
                  active ? "text-navy-900" : done ? "text-teal-700" : "text-navy-400"
                }`}
              >
                {meta.label}
              </p>
              {active && <p className="mt-0.5 hidden text-xs text-navy-500 sm:block">{meta.description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function DemoBanner({ role }: { role: "client" | "admin" }) {
  return (
    <div className="border-b border-gold-200 bg-gold-50">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-xs text-navy-700 sm:px-6">
        <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-navy-900">
          i
        </span>
        <span>
          <strong>Demo mode.</strong> This {role === "admin" ? "admin dashboard" : "client portal"} runs
          on sample data stored in your browser — no real accounts, payments or emails. See the README
          to connect a live backend.
        </span>
      </div>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-mist-300 bg-mist-50 p-10 text-center">
      <p className="font-semibold text-navy-800">{title}</p>
      {hint && <p className="mt-1 text-sm text-navy-500">{hint}</p>}
    </div>
  );
}

/** Format an ISO date/time compactly. */
export function fmtDate(iso: string, withTime = false) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (!withTime) return date;
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}
