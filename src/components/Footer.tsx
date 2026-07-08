import Link from "next/link";
import { footerNav, site, whatsappLink, emailLink, integrityNotice } from "@/lib/site";
import { BrandMark } from "@/components/Header";
import { Icon } from "@/components/Icon";

export function Footer() {
  const year = 2026; // static build year — safe for SSR

  return (
    <footer className="border-t border-navy-800 bg-navy-950 text-navy-200">
      <div className="container-px py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
          <div className="max-w-xs sm:col-span-2 lg:col-span-1">
            <div className="[&_span]:!text-white">
              <BrandMark invert />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-navy-300">
              Ethical CIPD assessment support, coaching, review and editing for Level 3, 5
              and 7 learners across the UK and UAE.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp px-4 py-2 text-sm"
              >
                <Icon name="whatsapp" className="h-4 w-4" />
                WhatsApp
              </a>
              <a href={emailLink()} className="btn-ghost-light px-4 py-2 text-sm">
                Email us
              </a>
            </div>
          </div>

          {footerNav.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-navy-300 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Integrity notice */}
        <div className="mt-12 rounded-2xl border border-navy-800 bg-navy-900/60 p-5">
          <p className="text-sm leading-relaxed text-navy-300">
            <span className="font-semibold text-gold-300">Academic integrity: </span>
            {integrityNotice}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-navy-800 pt-6 text-sm text-navy-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p className="text-navy-500">
            An independent academic support service. Not affiliated with or endorsed by the CIPD.
          </p>
        </div>
      </div>
    </footer>
  );
}
