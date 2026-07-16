/**
 * Admin badge components + display metadata for the owner-approved lead
 * pipeline (P2.3). Server-safe: no hooks, no client bundle.
 */

import type { LeadClassification, LeadStatus } from "@/lib/leads/types";

export const LEAD_STATUS_META: Record<LeadStatus, { label: string; tone: string; dot: string }> = {
  NEW: { label: "New", tone: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
  REVIEWING: { label: "Reviewing", tone: "bg-sky-100 text-sky-800 border-sky-200", dot: "bg-sky-500" },
  CONTACTED: { label: "Contacted", tone: "bg-cyan-100 text-cyan-800 border-cyan-200", dot: "bg-cyan-500" },
  QUOTE_SENT: { label: "Quote sent", tone: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  AWAITING_PAYMENT: { label: "Awaiting payment", tone: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-500" },
  IN_PROGRESS: { label: "In progress", tone: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  QUALITY_REVIEW: { label: "Quality review", tone: "bg-violet-100 text-violet-800 border-violet-200", dot: "bg-violet-500" },
  DELIVERED: { label: "Delivered", tone: "bg-teal-100 text-teal-800 border-teal-200", dot: "bg-teal-500" },
  COMPLETED: { label: "Completed", tone: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  LOST: { label: "Lost", tone: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-400" },
};

export const CLASSIFICATION_META: Record<
  LeadClassification,
  { label: string; tone: string }
> = {
  PRIORITY: { label: "Priority", tone: "bg-gold-100 text-gold-800 border-gold-300 font-bold" },
  HIGH_INTENT: { label: "High intent", tone: "bg-teal-100 text-teal-800 border-teal-200" },
  WARM: { label: "Warm", tone: "bg-sky-100 text-sky-800 border-sky-200" },
  LOW_INTENT: { label: "Low intent", tone: "bg-slate-100 text-slate-600 border-slate-200" },
};

const chip =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap";

export function StatusBadge({ status }: { status: string }) {
  const meta = LEAD_STATUS_META[status as LeadStatus] ?? {
    label: status,
    tone: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  };
  return (
    <span className={`${chip} ${meta.tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function ClassificationBadge({ classification }: { classification: string }) {
  const meta = CLASSIFICATION_META[classification as LeadClassification] ?? {
    label: classification,
    tone: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return <span className={`${chip} ${meta.tone}`}>{meta.label}</span>;
}

/** Red badge shown when the alert email for a lead failed (notify_error set). */
export function AlertFailedBadge() {
  return (
    <span className={`${chip} border-red-200 bg-red-50 text-red-700`} title="The notification email for this lead failed. The lead itself is safe.">
      Alert failed
    </span>
  );
}
