"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { primaryNav, whatsappLink, cta } from "@/lib/site";
import { Icon } from "@/components/Icon";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors ${
        scrolled
          ? "border-mist-200 bg-white/90 backdrop-blur"
          : "border-transparent bg-white"
      }`}
    >
      <div className="container-px flex h-16 items-center justify-between gap-4 lg:h-20">
        <BrandMark />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {primaryNav.map((item) =>
            item.children ? (
              <div key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className={`flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "text-navy-900"
                      : "text-navy-600 hover:text-navy-900"
                  }`}
                >
                  {item.label}
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <div className="invisible absolute left-0 top-full w-64 translate-y-1 pt-2 opacity-0 transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="overflow-hidden rounded-2xl border border-mist-200 bg-white p-2 shadow-card-hover">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                          pathname === child.href
                            ? "bg-mist-100 text-navy-900"
                            : "text-navy-600 hover:bg-mist-50 hover:text-navy-900"
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-navy-900"
                    : "text-navy-600 hover:text-navy-900"
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp px-4 py-2 text-sm"
          >
            <Icon name="whatsapp" className="h-4 w-4" />
            WhatsApp
          </a>
          <Link href="/contact" className="btn-primary px-4 py-2 text-sm">
            {cta.getQuote}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy-800 hover:bg-mist-100 lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            {open ? <path d="M6 6 18 18M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-mist-200 bg-white lg:hidden">
          <nav className="container-px flex flex-col gap-1 py-4">
            {primaryNav.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-lg px-3 py-2.5 text-base font-medium ${
                    isActive(item.href) ? "bg-mist-100 text-navy-900" : "text-navy-700"
                  }`}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div className="ml-3 border-l border-mist-200 pl-3">
                    {item.children
                      .filter((c) => c.href !== item.href)
                      .map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block rounded-lg px-3 py-2 text-sm text-navy-600"
                        >
                          {child.label}
                        </Link>
                      ))}
                  </div>
                )}
              </div>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp w-full"
              >
                <Icon name="whatsapp" className="h-4 w-4" />
                Chat on WhatsApp
              </a>
              <Link href="/contact" className="btn-primary w-full">
                {cta.getQuote}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function BrandMark({ invert = false }: { invert?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-navy-900 text-gold-400 shadow-soft">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" />
          <path d="M6 10v5c0 1.3 2.7 3 6 3s6-1.7 6-3v-5" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className={`text-[15px] font-bold tracking-tight ${invert ? "text-white" : "text-navy-900"}`}>
          CIPD Assessment
        </span>
        <span className={`text-[13px] font-semibold ${invert ? "text-gold-300" : "text-gold-600"}`}>
          Support Hub
        </span>
      </span>
    </Link>
  );
}
