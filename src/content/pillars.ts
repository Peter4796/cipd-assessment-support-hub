/**
 * Pillar registry (Blueprint Part 5/7/9). Every post's `pillar` frontmatter
 * key must resolve to exactly one of:
 *   1. a unit code ("5CO02")            → pillar page /cipd-units/5co02
 *   2. a pillar page path (below)       → that service/support page
 *   3. a hub article slug               → /blog/<slug> (the hub self-references)
 * The corpus test enforces resolution for every post, so an article cannot
 * ship outside a cluster ("no isolated posts" rule).
 *
 * Lead magnets (Part 9): each magnet maps to one cluster and surfaces
 * automatically on that cluster's articles only, via `magnetForPillar`.
 */

import { units } from "@/content/units";

/** Non-unit, non-article pillar targets: route path → banner label. */
export const PILLAR_PAGES: Record<string, string> = {
  "/cipd-level-3-support": "CIPD Level 3 support",
  "/cipd-level-5-support": "CIPD Level 5 support",
  "/cipd-level-7-support": "CIPD Level 7 support",
  "/cipd-resubmission-support": "CIPD resubmission support",
};

const unitByCode = new Map(units.map((u) => [u.code, u]));

export type PillarTarget = { href: string; label: string };

/**
 * Resolves a pillar key to its link target, or null when it does not
 * resolve (the corpus test treats null as a failure). `slugTitle` looks up
 * hub-article titles; passing post data in keeps this module free of a
 * circular import on posts.ts.
 */
export function resolvePillar(
  pillar: string,
  slugTitle: (slug: string) => string | undefined
): PillarTarget | null {
  const unit = unitByCode.get(pillar);
  if (unit) return { href: `/cipd-units/${unit.slug}`, label: `${unit.code} guide` };
  if (pillar in PILLAR_PAGES) return { href: pillar, label: PILLAR_PAGES[pillar] };
  const title = slugTitle(pillar);
  if (title !== undefined) return { href: `/blog/${pillar}`, label: title };
  return null;
}

export type Magnet = {
  title: string;
  description: string;
  href: string; // download landing page
};

const PLANNING_CHECKLIST: Magnet = {
  title: "Free CIPD Assessment Planning Checklist",
  description:
    "A step-by-step checklist for planning any CIPD assignment, from decoding the brief to the final pre-submission review.",
  href: "/resources/cipd-assessment-planning-checklist",
};

const REFERENCING_CHECKLIST: Magnet = {
  title: "Free CIPD Harvard Referencing Checklist",
  description:
    "A printable checklist covering in-text citations, the reference list, source quality and a final referencing-only review pass.",
  href: "/resources/harvard-referencing-checklist",
};

const RESUBMISSION_PLANNER: Magnet = {
  title: "Free CIPD Resubmission Planner",
  description:
    "A phased planner for turning tutor feedback into a stronger resubmission, from decoding comments to the final criterion check.",
  href: "/resources/cipd-resubmission-planner",
};

const REFLECTIVE_MODEL_BANK: Magnet = {
  title: "Free CIPD Reflective Writing Model Bank",
  description:
    "Driscoll, Gibbs, Kolb and Schon structures with ready-to-adapt sentence stems for genuine, well-evidenced reflective accounts.",
  href: "/resources/reflective-writing-model-bank",
};

/** Cluster → magnet map (Part 9: one magnet per cluster, shown only there). */
export function magnetForPillar(pillar: string): Magnet | undefined {
  if (unitByCode.has(pillar)) return PLANNING_CHECKLIST;
  if (pillar === "harvard-referencing-complete-guide") return REFERENCING_CHECKLIST;
  if (pillar === "/cipd-resubmission-support") return RESUBMISSION_PLANNER;
  if (pillar === "what-is-a-cipd-reflective-account") return REFLECTIVE_MODEL_BANK;
  return undefined;
}
