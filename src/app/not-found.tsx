import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

/**
 * Branded 404. Sits at the app root (outside the marketing layout), so it
 * carries its own minimal chrome. Useful, not humorous: route the visitor
 * to the level pages or straight into an enquiry.
 */
export default function NotFound() {
  const levels = [
    { href: "/cipd-level-3-support", label: "CIPD Level 3 support" },
    { href: "/cipd-level-5-support", label: "CIPD Level 5 support" },
    { href: "/cipd-level-7-support", label: "CIPD Level 7 support" },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-mist-100 px-4 py-16">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <Image src="/logo.png" alt="CIPD Guidance" width={44} height={44} className="h-11 w-11 rounded-xl" />
        <span className="text-lg font-bold text-navy-900">CIPD Guidance</span>
      </Link>

      <div className="w-full max-w-lg rounded-3xl border border-mist-200 bg-white p-8 text-center shadow-card sm:p-10">
        <p className="font-mono text-sm font-semibold text-gold-600">404</p>
        <h1 className="mt-2 text-2xl font-bold text-navy-900">This page could not be found</h1>
        <p className="mt-3 text-sm leading-relaxed text-navy-600">
          The page you&apos;re looking for may have moved or never existed. Here&apos;s where to go
          next.
        </p>

        <div className="mt-6 grid gap-2">
          {levels.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-xl border border-mist-200 bg-mist-50 px-4 py-3 text-sm font-semibold text-navy-800 transition-colors hover:border-mist-300 hover:bg-mist-100"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link href="/" className="btn-outline flex-1">
            Back to the homepage
          </Link>
          <Link href="/contact" className="btn-primary flex-1">
            Send Your Assessment Brief
          </Link>
        </div>
      </div>
    </div>
  );
}
