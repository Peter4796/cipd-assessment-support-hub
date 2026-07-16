/**
 * Deterministic submission fingerprint for short-window deduplication (P2.2).
 *
 * Conservative by design (owner decision): never dedup on email alone — two
 * different enquiries from the same client must both be captured. Two
 * submissions collide only when every assessment-defining field AND the
 * attachment set are identical, within the DEDUP_WINDOW. The typical hit is
 * a double-click or an impatient re-submit of the same form.
 *
 * Inputs are the ALREADY-VALIDATED fields (post-normalisation), so casing/
 * whitespace differences in raw input cannot defeat the match.
 */

import { createHash } from "node:crypto";
import type { ValidatedLead } from "@/lib/leads/validation";

/** Repeated identical submissions inside this window return the original reference. */
export const DEDUP_WINDOW_MS = 15 * 60 * 1000;

export function leadFingerprint(lead: ValidatedLead): string {
  const parts = [
    lead.email,
    lead.level,
    lead.unitCode ?? "",
    lead.supportType,
    lead.submissionType ?? "",
    lead.deadline ?? "",
    String(lead.wordCount ?? ""),
    lead.message ?? "",
    // Pathnames are unique per upload (random suffix), so identical pathnames
    // mean the same physical files; sorted for order independence.
    ...[...lead.attachments.map((a) => a.pathname)].sort(),
  ];
  // NUL separator: validation strips control characters from every field,
  // so no crafted input can fake a field boundary.
  return createHash("sha256").update(parts.join("\u0000")).digest("hex");
}
