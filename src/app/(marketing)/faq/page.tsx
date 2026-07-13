import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui";
import { CtaBand } from "@/components/Cta";
import { Accordion } from "@/components/Accordion";
import { faqs } from "@/content/site-content";

export const metadata: Metadata = {
  title: "FAQ: CIPD Assessment Support Questions",
  description:
    "Answers to common questions about our CIPD assessment support across Levels 3, 5 and 7 for UK and UAE learners: resubmissions, draft review, Harvard referencing, turnaround and confidentiality.",
  alternates: { canonical: "/faq" },
};

// FAQ structured data for rich results (SEO)
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
