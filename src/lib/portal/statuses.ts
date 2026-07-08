import type { ProjectStatus } from "@/lib/portal/types";

/** The five-stage project pipeline, in order. */
export const STATUS_PIPELINE: ProjectStatus[] = [
  "brief_received",
  "quote_sent",
  "in_progress",
  "review_stage",
  "completed",
];

export const STATUS_META: Record<
  ProjectStatus,
  { label: string; short: string; description: string; tone: string; dot: string }
> = {
  brief_received: {
    label: "Brief received",
    short: "Received",
    description: "We've received your brief and are preparing your quote.",
    tone: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
  quote_sent: {
    label: "Quote sent",
    short: "Quote sent",
    description: "Your quote is ready to review and approve.",
    tone: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  in_progress: {
    label: "In progress",
    short: "In progress",
    description: "Your support is underway.",
    tone: "bg-blue-100 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
  },
  review_stage: {
    label: "Review stage",
    short: "Review",
    description: "Ready for your review. Download and check the work.",
    tone: "bg-violet-100 text-violet-800 border-violet-200",
    dot: "bg-violet-500",
  },
  completed: {
    label: "Completed",
    short: "Completed",
    description: "This project is complete. Thank you!",
    tone: "bg-teal-100 text-teal-800 border-teal-200",
    dot: "bg-teal-500",
  },
};

export function statusIndex(status: ProjectStatus) {
  return STATUS_PIPELINE.indexOf(status);
}

/** The next status in the pipeline, or null if already completed. */
export function nextStatus(status: ProjectStatus): ProjectStatus | null {
  const i = statusIndex(status);
  return i >= 0 && i < STATUS_PIPELINE.length - 1 ? STATUS_PIPELINE[i + 1] : null;
}
