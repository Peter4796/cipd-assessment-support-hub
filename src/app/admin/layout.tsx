import type { Metadata } from "next";
import Link from "next/link";

/**
 * Admin shell (P2.3) — real operations dashboard on live lead data.
 * Access control: HTTP Basic Auth enforced by src/middleware.ts BEFORE any
 * of these routes render (fails closed without ADMIN_PASSWORD). Routes are
 * noindexed and disallowed in robots.txt.
 */

export const metadata: Metadata = {
  title: "Admin — CIPD Guidance",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist-100">
      <header className="border-b border-mist-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/admin" className="text-sm font-bold text-navy-900">
            CIPD Guidance <span className="font-medium text-gold-600">Admin</span>
          </Link>
          <Link href="/" className="text-xs font-medium text-navy-500 hover:text-navy-800">
            View site →
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
