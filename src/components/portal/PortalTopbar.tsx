"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOutClient, signOutAdmin } from "@/lib/portal/session";

/** Shared top bar for the client portal and admin dashboard. */
export function PortalTopbar({
  role,
  userName,
}: {
  role: "client" | "admin";
  userName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = role === "admin";

  const home = isAdmin ? "/admin" : "/portal";
  const links = isAdmin
    ? [{ label: "Enquiries", href: "/admin" }]
    : [
        { label: "My projects", href: "/portal" },
        { label: "New request", href: "/portal/new" },
      ];

  const signOut = () => {
    if (isAdmin) {
      signOutAdmin();
      router.push("/admin/login");
    } else {
      signOutClient();
      router.push("/portal/login");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-mist-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href={home} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-gold-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" />
                <path d="M6 10v5c0 1.3 2.7 3 6 3s6-1.7 6-3v-5" />
              </svg>
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-bold text-navy-900">CIPD Support</span>
              <span className="text-[11px] font-semibold text-gold-600">
                {isAdmin ? "Admin dashboard" : "Client portal"}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((l) => {
              const active = l.href === home ? pathname === home : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-mist-100 text-navy-900" : "text-navy-600 hover:text-navy-900"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {userName && (
            <span className="hidden text-sm text-navy-600 sm:inline">
              {isAdmin ? "Signed in as admin" : userName}
            </span>
          )}
          <button
            onClick={signOut}
            className="rounded-full border border-mist-300 px-3.5 py-1.5 text-sm font-medium text-navy-700 hover:bg-mist-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
