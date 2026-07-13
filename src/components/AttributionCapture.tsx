"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/leads/context";

/**
 * Invisible client component mounted once in the marketing layout.
 * Stores first-touch referrer + UTM parameters in sessionStorage so the
 * enquiry form can attribute leads even after internal navigation.
 * Stores no PII; session-scoped by design.
 */
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
