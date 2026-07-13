"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";

/**
 * Anchor/Link with a typed analytics event on click. Server components can
 * use this as a leaf to instrument CTAs without becoming client components.
 * Only safe, non-PII properties may be passed (enforced by trackEvent types).
 */
export function TrackedLink({
  href,
  event,
  eventProps,
  external = false,
  className = "",
  children,
  ariaLabel,
}: {
  href: string;
  event: AnalyticsEvent;
  eventProps?: Parameters<typeof trackEvent>[1];
  external?: boolean;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const onClick = () => trackEvent(event, eventProps);

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
