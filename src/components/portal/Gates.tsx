"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useClientSession, useAdminSession } from "@/lib/portal/session";
import { PortalTopbar } from "@/components/portal/PortalTopbar";
import { DemoBanner } from "@/components/portal/PortalUI";

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3 text-navy-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-mist-300 border-t-navy-600" />
        Loading…
      </div>
    </div>
  );
}

/** Gates client-portal pages behind a demo client session. */
export function RequireClient({ children }: { children: React.ReactNode }) {
  const session = useClientSession();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  // Only evaluate auth after mount — before this, useSyncExternalStore returns the
  // server snapshot (null), which would otherwise trigger a false redirect.
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (hydrated && session === null) router.replace("/portal/login");
  }, [hydrated, session, router]);

  if (!hydrated || !session) return <Loading />;

  return (
    <>
      <PortalTopbar role="client" userName={session.name} />
      <DemoBanner role="client" />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </>
  );
}

/** Gates admin pages behind the demo admin passcode session. */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const isAdmin = useAdminSession();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (hydrated && !isAdmin) router.replace("/admin/login");
  }, [hydrated, isAdmin, router]);

  if (!hydrated || !isAdmin) return <Loading />;

  return (
    <>
      <PortalTopbar role="admin" userName="Admin" />
      <DemoBanner role="admin" />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </>
  );
}
