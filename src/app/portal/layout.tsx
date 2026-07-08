import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Portal",
  // Portal must never be indexed by search engines.
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-mist-100">{children}</div>;
}
