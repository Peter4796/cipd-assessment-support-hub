"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { primaryNav, whatsappLink, cta } from "@/lib/site";
import { enquiryUrl } from "@/lib/leads/context";
import { Icon } from "@/components/Icon";
import { trackEvent } from "@/lib/analytics";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Which desktop dropdown is open (keyboard/click); hover is handled in CSS.
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Close menus on route change
  useEffect(() => {
    setOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close an open dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;
    const onPointerDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [openDropdown]);

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
        <nav
          ref={navRef}
          className="hidden items-center gap-1 lg:flex"
          aria-label="Primary"
          onKeyDown={(e) => {
            if (e.key === "Escape" && openDropdown) {
              setOpenDropdown(null);
            }
          }}
        >
          {primaryNav.map((item) =>
            item.children ? (
              <div
                key={item.href}
                className="group relative"
                onBlur={(e) => {
                  // Close when focus leaves the whole dropdown region
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setOpenDropdown(null);
                  }
                }}
              >
                <button
                  type="button"
                  aria-expanded={openDropdown === item.href}
                  aria-haspopup="true"
                  aria-controls={`nav-menu-${item.label.toLowerCase()}`}
                  onClick={() =>
                    setOpenDropdown((cur) => (cur === item.href ? null : item.href))
                  }
                  className={`flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                    isActive(item.href)
                      ? "text-navy-900"
                      : "text-navy-600 hover:text-navy-900"
                  }`}
                >
                  {item.label}
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-3.5 w-3.5 transition-transform ${
                      openDropdown === item.href ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div
                  id={`nav-menu-${item.label.toLowerCase()}`}
                  className={`absolute left-0 top-full w-64 pt-2 transition-all ${
                    openDropdown === item.href
                      ? "visible translate-y-0 opacity-100"
                      : "invisible translate-y-1 opacity-0 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
                  }`}
                >
                  <div className="overflow-hidden rounded-2xl border border-mist-200 bg-white p-2 shadow-card-hover">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
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
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
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
            onClick={() => trackEvent("whatsapp_clicked", { location: "header" })}
            className="btn-whatsapp px-4 py-2 text-sm"
          >
            <Icon name="whatsapp" className="h-4 w-4" />
            WhatsApp
          </a>
          <Link
            href={enquiryUrl({ cta: "header" })}
            onClick={() => trackEvent("service_cta_clicked", { location: "header" })}
            className="btn-primary px-4 py-2 text-sm"
          >
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
          <nav className="container-px flex flex-col gap-1 py-4" aria-label="Primary mobile">
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
                onClick={() => trackEvent("whatsapp_clicked", { location: "mobile_menu" })}
                className="btn-whatsapp w-full"
              >
                <Icon name="whatsapp" className="h-4 w-4" />
                Chat on WhatsApp
              </a>
              <Link href={enquiryUrl({ cta: "sticky_mobile" })} className="btn-primary w-full">
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
      <Image
        src="/logo.png"
        alt="CIPD Guidance"
        width={44}
        height={44}
        priority
        className="h-11 w-11 flex-none rounded-xl"
      />
      <span className="flex flex-col leading-none">
        <span className={`text-[17px] font-bold tracking-tight ${invert ? "text-white" : "text-navy-900"}`}>
          CIPD Guidance
        </span>
        <span className={`text-[11px] font-medium ${invert ? "text-navy-300" : "text-navy-500"}`}>
          Assessment support
        </span>
      </span>
    </Link>
  );
}
