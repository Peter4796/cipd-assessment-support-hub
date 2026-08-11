/**
 * Subscriber persistence (P0.3) — first-party record of lead-magnet
 * submissions. One row per submission event; see the schema docblock for the
 * grain and privacy rationale. Insert is best-effort from the route: Resend
 * delivery and the notification email remain the user-facing promise, and a
 * DB failure must never block the download.
 */

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/client";
import { subscribers } from "@/lib/db/schema";
import type { Subscriber } from "@/lib/leads/types";

export async function insertSubscriber(sub: Subscriber): Promise<void> {
  await db()
    .insert(subscribers)
    .values({
      id: randomUUID(),
      createdAt: new Date(sub.createdAt),
      name: sub.name ?? null,
      email: sub.email,
      level: sub.level ?? null,
      country: sub.country ?? null,
      resource: sub.resource,
      sourcePage: sub.acquisition.sourcePage,
      landingPage: sub.acquisition.landingPage ?? null,
      sourcePageType: sub.acquisition.sourcePageType,
      referrer: sub.acquisition.referrer ?? null,
      utmSource: sub.acquisition.utmSource ?? null,
      utmMedium: sub.acquisition.utmMedium ?? null,
      utmCampaign: sub.acquisition.utmCampaign ?? null,
    });
}
