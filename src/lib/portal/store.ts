"use client";

/**
 * Demo portal store — persists projects in the browser (localStorage) and notifies
 * React via useSyncExternalStore. This makes the whole Phase 3 portal genuinely
 * interactive without a backend.
 *
 * ── Going live ──
 * Replace the read/write helpers here with calls to your API routes backed by
 * Supabase/Postgres. The component code consumes `useProjects()`, `useProject(id)`
 * and the mutation helpers, so swapping the storage layer needs no UI changes.
 */

import { useSyncExternalStore } from "react";
import type {
  Project,
  ProjectStatus,
  Note,
  FileRef,
  Quote,
  NewRequestInput,
} from "@/lib/portal/types";
import { seedProjects } from "@/lib/portal/seed";

const KEY = "cipd-portal-v1";

let cache: Project[] | null = null;
const listeners = new Set<() => void>();

function isBrowser() {
  return typeof window !== "undefined";
}

function read(): Project[] {
  if (!isBrowser()) return seedProjects;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw) as Project[];
    } else {
      cache = seedProjects;
      window.localStorage.setItem(KEY, JSON.stringify(cache));
    }
  } catch {
    cache = seedProjects;
  }
  return cache;
}

function write(next: Project[]) {
  cache = next;
  if (isBrowser()) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors in demo */
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// ─── IDs & time ───
function nowIso() {
  return new Date().toISOString();
}
function rid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 9);
}
function newRef() {
  return "CIP-" + Math.floor(1000 + Math.random() * 9000);
}

// ─── React hooks ───
export function useProjects(): Project[] {
  return useSyncExternalStore(subscribe, read, () => seedProjects);
}

export function useProject(id: string): Project | undefined {
  const projects = useProjects();
  return projects.find((p) => p.id === id);
}

// ─── Mutations ───
function update(id: string, fn: (p: Project) => Project) {
  const next = read().map((p) => (p.id === id ? { ...fn(p), updatedAt: nowIso() } : p));
  write(next);
}

function pushActivity(p: Project, label: string, by: "client" | "admin" | "system"): Project {
  return {
    ...p,
    activity: [{ id: rid("a_"), at: nowIso(), label, by }, ...p.activity],
  };
}

export function createProject(input: NewRequestInput): Project {
  const now = nowIso();
  const project: Project = {
    id: newRef(),
    createdAt: now,
    updatedAt: now,
    status: "brief_received",
    clientName: input.clientName,
    clientEmail: input.clientEmail,
    country: input.country,
    level: input.level,
    unitCode: input.unitCode,
    helpType: input.helpType,
    wordCount: input.wordCount,
    deadline: input.deadline,
    message: input.message,
    files: input.briefFileName
      ? [
          {
            id: rid("f_"),
            name: input.briefFileName,
            sizeLabel: "—",
            kind: "brief",
            uploadedBy: "client",
            uploadedAt: now,
          },
        ]
      : [],
    notes: [],
    activity: [{ id: rid("a_"), at: now, label: "Brief received", by: "system" }],
    revisionRequested: null,
  };
  write([project, ...read()]);
  return project;
}

export function setStatus(id: string, status: ProjectStatus) {
  update(id, (p) => pushActivity({ ...p, status }, `Status → ${status.replace(/_/g, " ")}`, "admin"));
}

export function attachFile(id: string, file: Omit<FileRef, "id" | "uploadedAt">) {
  update(id, (p) =>
    pushActivity(
      { ...p, files: [{ ...file, id: rid("f_"), uploadedAt: nowIso() }, ...p.files] },
      `${file.uploadedBy === "admin" ? "Admin" : "Client"} uploaded ${file.name}`,
      file.uploadedBy
    )
  );
}

export function addNote(id: string, note: Omit<Note, "id" | "createdAt">) {
  update(id, (p) => ({
    ...p,
    notes: [...p.notes, { ...note, id: rid("n_"), createdAt: nowIso() }],
    activity: [
      { id: rid("a_"), at: nowIso(), label: `${note.authorName} added a ${note.internal ? "internal " : ""}note`, by: note.author },
      ...p.activity,
    ],
  }));
}

export function sendQuote(id: string, quote: Quote) {
  update(id, (p) =>
    pushActivity(
      { ...p, quote: { ...quote, sentAt: nowIso() }, status: "quote_sent" },
      "Quote sent to client",
      "admin"
    )
  );
}

export function approveQuote(id: string) {
  update(id, (p) =>
    p.quote
      ? pushActivity(
          { ...p, quote: { ...p.quote, approvedAt: nowIso() }, status: "in_progress" },
          "Client approved the quote",
          "client"
        )
      : p
  );
}

export function markPaid(id: string) {
  // Demo only — no real charge. Wire to Stripe Checkout to take real payments.
  update(id, (p) =>
    p.quote ? pushActivity({ ...p, quote: { ...p.quote, paidAt: nowIso() } }, "Payment received (demo)", "client") : p
  );
}

export function requestRevision(id: string, reason: string) {
  update(id, (p) =>
    pushActivity(
      { ...p, revisionRequested: { at: nowIso(), reason }, status: "in_progress" },
      "Client requested a revision",
      "client"
    )
  );
}

export function resetDemo() {
  write(seedProjects);
}
