import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui";
import { CtaBand } from "@/components/Cta";
import { Accordion } from "@/components/Accordion";
import { faqs } from "@/content/site-content";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  title: "FAQ: CIPD Assessment Support Questions",
  description:
    "Answers to common questions about our CIPD assessment support across Levels 3, 5 and 7 for learners worldwide: resubmissions, draft review, Harvard referencing, turnaround and confidentiality.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "FAQ", path: "/faq" },
        ])}
      />
      <PageHero
        eyebrow="FAQ"
        breadcrumb="FAQ"
        title="Frequently asked questions"
        intro="Everything you need to know about how our CIPD assessment support works. Can't find your answer? Message us on WhatsApp and we'll reply quickly."
      />

      <Section tone="mist">
        <Accordion items={faqs} />
      </Section>

      <CtaBand />
    </>
  );
}
