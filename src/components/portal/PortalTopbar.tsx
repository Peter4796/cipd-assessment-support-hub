"use client";

import Link from "next/link";
import Image from "next/image";
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
            <Image src="/logo.png" alt="CIPD Guidance" width={36} height={36} className="h-9 w-9 rounded-lg" />
            <span className="flex flex-col leading-none">
              <span className="text-sm font-bold text-navy-900">CIPD Guidance</span>
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
