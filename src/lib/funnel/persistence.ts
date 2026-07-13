"use client";

/**
 * Funnel progress persistence (P1.4).
 *
 * WHAT IS PERSISTED (sessionStorage, survives refresh/back-nav, dies with the
 * browsing session): current step, level, unit, support type, submission
 * type, word count, deadline, provider, funnel entry metadata.
 *
 * WHAT IS DELIBERATELY NOT PERSISTED:
 *   - name / email / WhatsApp (contact details stay in memory only)
 *   - the support description and referred-criteria free text (sensitive)
 *   - uploaded attachment metadata or blob URLs (capability URLs — storing
 *     them would widen exposure; the visitor re-attaches after a refresh)
 *
 * "Start a new enquiry" calls clearFunnelProgress(). Progress older than
 * 24h is treated as stale and discarded to avoid confusing resurrections.
 */

import type { CipdLevel, SubmissionType, SupportType } from "@/lib/leads/types";

const KEY = "cg-funnel-v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type PersistedFunnel = {
  savedAt: number;
  step: number;
  level?: CipdLevel | "unsure";
  unitCode?: string;
  unitUnsure?: boolean;
  support?: SupportType | "other";
  submission?: SubmissionType;
  wordCount?: string;
  deadline?: string;
  provider?: string;
  entryCta?: string;
  startedAt?: string; // ISO
};

export function saveFunnelProgress(state: Omit<PersistedFunnel, "savedAt">): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
  } catch {
    /* storage unavailable — persistence is best-effort */
  }
}

export function loadFunnelProgress(): PersistedFunnel | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedFunnel;
    if (!parsed || typeof parsed.savedAt !== "number") return null;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      clearFunnelProgress();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearFunnelProgress(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
