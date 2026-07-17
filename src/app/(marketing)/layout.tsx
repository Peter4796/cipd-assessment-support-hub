import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { AttributionCapture } from "@/components/AttributionCapture";
import { JsonLd } from "@/components/JsonLd";
import { organizationJsonLd } from "@/lib/schema";

/** Marketing site shell — header, footer and the floating WhatsApp button. */
export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Site-wide Organization node; page schemas reference it by @id. */}
      <JsonLd data={organizationJsonLd()} />
      <AttributionCapture />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
