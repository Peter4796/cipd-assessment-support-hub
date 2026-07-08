/**
 * Phase 3 portal domain types.
 *
 * These types are storage-agnostic. In demo mode they're persisted in the browser
 * (localStorage) via `store.ts`. To go live, back them with Supabase/Postgres and an
 * API layer — the shapes are designed to map cleanly onto database tables.
 */

export type ProjectStatus =
  | "brief_received"
  | "quote_sent"
  | "in_progress"
  | "review_stage"
  | "completed";

export type CipdLevel = "3" | "5" | "7";

export type FileRef = {
  id: string;
  name: string;
  sizeLabel: string; // human-readable, e.g. "482 KB"
  kind: "brief" | "draft" | "deliverable" | "other";
  uploadedBy: "client" | "admin";
  uploadedAt: string; // ISO
};

export type Note = {
  id: string;
  author: "client" | "admin";
  authorName: string;
  body: string;
  createdAt: string; // ISO
  internal?: boolean; // admin-only note not shown to client
};

export type ActivityEvent = {
  id: string;
  at: string; // ISO
  label: string;
  by: "client" | "admin" | "system";
};

export type Quote = {
  amount: number; // in the chosen currency (minor decisions left to admin)
  currency: string; // e.g. "GBP"
  summary: string;
  breakdown: { label: string; value: string }[];
  sentAt?: string; // ISO
  approvedAt?: string; // ISO
  paidAt?: string; // ISO (demo — marks as paid without a real charge)
};

export type Project = {
  id: string; // short reference, e.g. "CIP-4821"
  createdAt: string; // ISO
  updatedAt: string; // ISO
  status: ProjectStatus;

  // Client identity
  clientName: string;
  clientEmail: string;
  country: string;

  // Assessment details
  level: CipdLevel;
  unitCode: string;
  helpType: string;
  wordCount: number;
  deadline: string; // ISO date
  message: string;

  quote?: Quote;
  files: FileRef[];
  notes: Note[];
  activity: ActivityEvent[];
  revisionRequested?: { at: string; reason: string } | null;
};

export type NewRequestInput = {
  clientName: string;
  clientEmail: string;
  country: string;
  level: CipdLevel;
  unitCode: string;
  helpType: string;
  wordCount: number;
  deadline: string;
  message: string;
  briefFileName?: string;
};
