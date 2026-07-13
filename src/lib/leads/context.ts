/**
 * Acquisition-context helpers shared by CTAs and forms (client-safe, pure).
 *
 * Two jobs:
 *  1. `enquiryUrl()` — the one way to build a contextual enquiry link, so a
 *     CTA on /cipd-units/5co01 produces /contact?level=5&unit=5CO01 without
 *     any page hard-coding query strings.
 *  2. `derivePageType()` + UTM capture — classify where a lead came from.
 *
 * All query/context values are re-validated server-side; nothing here is
 * trusted by the API.
 */

import type { CipdLevel, SourcePageType, SupportType } from "@/lib/leads/types";

// ─── Contextual enquiry URLs ───
export type EnquiryContext = {
  level?: CipdLevel;
  unit?: string; // e.g. "5CO01"
  support?: SupportType;
};

export function enquiryUrl(ctx: EnquiryContext = {}): string {
  const params = new URLSearchParams();
  if (ctx.level) params.set("level", ctx.level);
  if (ctx.unit) params.set("unit", ctx.unit.toUpperCase());
  if (ctx.support) params.set("support", ctx.support);
  const qs = params.toString();
  return qs ? `/contact?${qs}` : "/contact";
}

// ─── Source-page classification ───
export function derivePageType(pathname: string): SourcePageType {
  const p = pathname.split("?")[0].replace(/\/$/, "") || "/";
  if (p === "/") return "home";
  if (p.startsWith("/cipd-units")) return "unit";
  if (/^\/cipd-level-\d-support/.test(p)) return "level";
  if (p.startsWith("/services")) return "service";
  if (p.startsWith("/blog")) return "article";
  if (p.startsWith("/resources") || p.startsWith("/case-studies")) return "guide";
  if (p.startsWith("/pricing")) return "pricing";
  return "other";
}

// ─── First-touch attribution (sessionStorage) ───
const ATTRIBUTION_KEY = "cg-attribution";

export type StoredAttribution = {
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  landedOn?: string;
};

/** Called once on first client render (see <AttributionCapture/>). */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(ATTRIBUTION_KEY)) return; // first touch wins
    const params = new URLSearchParams(window.location.search);
    const data: StoredAttribution = {
      referrer: document.referrer || undefined,
      utmSource: params.get("utm_source") || undefined,
      utmMedium: params.get("utm_medium") || undefined,
      utmCampaign: params.get("utm_campaign") || undefined,
      landedOn: window.location.pathname,
    };
    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable — attribution is best-effort */
  }
}

export function readAttribution(): StoredAttribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_KEY);
    return raw ? (JSON.parse(raw) as StoredAttribution) : {};
  } catch {
    return {};
  }
}

/** Assemble the acquisition context a form should submit. */
export function buildAcquisitionContext(pathname: string) {
  const stored = readAttribution();
  return {
    sourcePage: pathname,
    sourcePageType: derivePageType(stored.landedOn || pathname),
    referrer: stored.referrer,
    utmSource: stored.utmSource,
    utmMedium: stored.utmMedium,
    utmCampaign: stored.utmCampaign,
  };
}
