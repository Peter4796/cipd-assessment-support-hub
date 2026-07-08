import type { ReactNode } from "react";
import Link from "next/link";

/** Standard inner-page hero with breadcrumb + eyebrow. */
export function PageHero({
  eyebrow,
  title,
  intro,
  breadcrumb,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  breadcrumb?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-navy-800 bg-navy-900">
      {/* Subtle grid / glow */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:linear-gradient(rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="container-px relative py-16 sm:py-20">
        <nav className="mb-5 flex items-center gap-2 text-sm text-navy-300">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          {breadcrumb && (
            <>
              <span className="text-navy-600">/</span>
              <span className="text-navy-100">{breadcrumb}</span>
            </>
          )}
        </nav>
        {eyebrow && (
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">
            {eyebrow}
          </span>
        )}
        <h1 className="max-w-3xl text-4xl font-bold text-white sm:text-5xl">{title}</h1>
        {intro && (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-navy-200">{intro}</p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
