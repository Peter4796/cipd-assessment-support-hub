"use client";

/**
 * Typed analytics layer — the only sanctioned way to emit product events.
 * Wraps @vercel/analytics `track()` so event names and property shapes stay
 * consistent and PII can never leak by construction.
 *
 * HARD RULE: never send name, email, phone/WhatsApp numbers, message text,
 * referred-criteria text, original filenames, file URLs or document content.
 * Allowed properties are the safe funnel context below.
 *
 * KNOWN LIMITATION (documented): `lead_form_abandoned` fires from a pagehide
 * listener; browsers do not guarantee delivery of work started during unload,
 * so abandonment counts are a floor, not an exact figure. The reliable funnel
 * read is step_completed drop-off between steps.
 */

import { track } from "@vercel/analytics";

type SafeProps = {
  location?: string; // CTA placement token, e.g. "hero" | "sidebar" | "article_end"
  source_page_type?: string;
  source_route?: string; // path only, never with query strings
  cipd_level?: string;
  unit_code?: string;
  support_type?: string;
  submission_type?: string;
  step?: number;
  step_name?: string;
  file_category?: string; // enum key only, never a filename
  file_count?: number;
  error?: string; // machine code only, never user text
  resource?: string;
};

export type AnalyticsEvent =
  // P0
  | "lead_form_started"
  | "lead_form_submitted"
  | "lead_created"
  | "lead_form_error"
  | "whatsapp_clicked"
  | "email_clicked"
  | "lead_magnet_submitted"
  | "service_cta_clicked"
  | "article_cta_clicked"
  // P1 funnel
  | "lead_form_step_viewed"
  | "lead_form_step_completed"
  | "lead_form_validation_error"
  | "lead_form_abandoned"
  | "brief_upload_started"
  | "brief_upload_completed"
  | "brief_upload_failed"
  | "lead_review_reached";

export function trackEvent(event: AnalyticsEvent, props: SafeProps = {}): void {
  try {
    // Strip undefined values; Vercel Analytics rejects them.
    const clean = Object.fromEntries(
      Object.entries(props).filter(([, v]) => v !== undefined && v !== "")
    ) as Record<string, string | number>;
    track(event, clean);
  } catch {
    /* analytics must never break the product */
  }
}

/**
 * FUNNEL VIEW SPECIFICATION (for reading the numbers in Vercel Analytics):
 *   1. lead_form_started
 *   2. lead_form_step_completed { step_name: "level" }        (qualification)
 *   3. lead_form_step_completed { step_name: "details" }      (assessment details)
 *   4. lead_form_step_completed { step_name: "documents" }    (upload step)
 *   5. lead_form_step_completed { step_name: "contact" }      (contact details)
 *   6. lead_review_reached
 *   7. lead_created
 *   8. whatsapp_clicked { location: "lead_confirmation" }     (continuation)
 */
