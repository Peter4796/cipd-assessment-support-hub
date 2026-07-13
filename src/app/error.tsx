"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Branded application error boundary. Never exposes stack traces or internal
 * error details to visitors; the real error goes to the console/monitoring.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log for observability; the visitor sees only the friendly message.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-mist-100 px-4 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-mist-200 bg-white p-8 text-center shadow-card sm:p-10">
        <p className="font-mono text-sm font-semibold text-gold-600">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-bold text-navy-900">
          Sorry, that didn&apos;t load properly
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-navy-600">
          An unexpected error occurred. You can try again, or head back to the homepage. If you
          were sending an enquiry, you can always reach us directly on WhatsApp.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button onClick={reset} className="btn-primary flex-1">
            Try again
          </button>
          <Link href="/" className="btn-outline flex-1">
            Back to the homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
