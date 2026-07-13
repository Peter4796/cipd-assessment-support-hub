"use client";

/**
 * Typed analytics layer — the only sanctioned way to emit product events.
 * Wraps @vercel/analytics `track()` so event names and property shapes stay
 * consistent and PII can never leak by construction.
 *
 * HARD RULE: never send name, email, phone/WhatsApp numbers, message text or
 * document content. Allowed properties are the safe funnel context below.
 *
 * Future events (P1+, do not emit before the features exist):
 *   lead_form_step_completed · lead_form_abandoned · brief_upload_started ·
 *   brief_upload_completed · unit_page_viewed · pricing_viewed
 */

import { track } from "@vercel/analytics";

type SafeProps = {
  location?: string; // CTA placement, e.g. "float" | "header" | "cta_band"
  source_page_type?: string;
  cipd_level?: string;
  unit_code?: string;
  support_type?: string;
  error?: string; // machine code only, never user text
  resource?: string;
};

export type AnalyticsEvent =
  | "lead_form_started"
  | "lead_form_submitted"
  | "lead_created"
  | "lead_form_error"
  | "whatsapp_clicked"
  | "email_clicked"
  | "lead_magnet_submitted"
  | "service_cta_clicked"
  | "article_cta_clicked";

export function trackEvent(event: AnalyticsEvent, props: SafeProps = {}): void {
  try {
    // Strip undefined values; Vercel Analytics rejects them.
    const clean = Object.fromEntries(
      Object.entries(props).filter(([, v]) => v !== undefined && v !== "")
    ) as Record<string, string>;
    track(event, clean);
  } catch {
    /* analytics must never break the product */
  }
}
