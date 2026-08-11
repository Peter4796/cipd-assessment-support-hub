import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Section, SectionHeading, ButtonLink, CheckList } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { CtaBand } from "@/components/Cta";
import { Accordion } from "@/components/Accordion";
import { enquiryUrl } from "@/lib/leads/context";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, serviceJsonLd } from "@/lib/schema";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "CIPD Harvard Referencing Support & Checking Service",
  description:
    "Professional Harvard referencing support for CIPD assignments. We check citations, reference lists and consistency against your centre's style, and coach you on getting it right.",
  keywords: [
    "CIPD Harvard referencing help",
    "Harvard referencing checking service",
    "CIPD reference list check",
    "Harvard referencing support",
  ],
  alternates: { canonical: "/harvard-referencing-support" },
};

const problems = [
  "Feedback says your referencing does not follow Harvard conventions",
  "You're unsure whether citations and your reference list actually match",
  "Every entry seems to follow a slightly different format",
  "You've paraphrased sources but aren't confident the citations are right",
  "The reference list is the last job before submission and time is short",
];

const checks = [
  "Every in-text citation paired with a reference-list entry, both directions",
  "Entry formats for books, journals, websites and CIPD sources",
  "Consistency of punctuation, capitalisation and ordering",
  "Accessed dates on online sources",
  "Quoting versus paraphrasing balance",
  "Secondary referencing ('cited in') used correctly",
  "Alignment with your centre's referencing guide where you supply it",
  "Coaching notes so you can maintain the standard yourself",
];

const steps = [
  { n: 1, t: "Send your draft", d: "The assignment as it stands, at any stage from partial to final." },
  { n: 2, t: "Include your centre's referencing guide", d: "If you have one. Harvard varies in fine detail, and your centre's version wins." },
  { n: 3, t: "We review citations and reference list", d: "Both directions: every citation to its entry, every entry to its citation." },
  { n: 4, t: "You receive marked corrections and notes", d: "What to fix, why it matters, and the pattern to follow next time." },
  { n: 5, t: "Submit with confidence", d: "Referencing errors are among the cheapest marks to protect." },
];

const faqs = [
  {
    question: "What does the Harvard referencing check cover?",
    answer:
      "We check your in-text citations and reference list in both directions: that every citation has a matching entry, every entry is cited, formats are consistent for each source type, online sources carry accessed dates, and secondary referencing is handled correctly. You receive corrections plus notes explaining the pattern so future assignments are easier.",
  },
  {
    question: "Do you follow my study centre's referencing style?",
    answer:
      "Yes, and this matters: there is no single official Harvard style, and centres publish their own variants. Send your centre's referencing guide with your draft and we check against that. Without one, we apply mainstream Harvard conventions consistently and flag anything your centre may treat differently.",
  },
  {
    question: "Can you build my reference list for me from scratch?",
    answer:
      "We work from your sources, not instead of them. If you have the sources you used, we help you turn them into correct citations and a consistent list, and show you the pattern. What we never do is invent sources or add references for material you have not actually read.",
  },
  {
    question: "Can you check referencing on an urgent deadline?",
    answer:
      "Often, yes. Referencing checks are quicker than full draft reviews, so short deadlines are frequently workable. Tell us your deadline when you enquire and we will confirm honestly what is realistic.",
  },
  {
    question: "Does the check include the rest of my assignment?",
    answer:
      "The referencing service is deliberately focused, which keeps it fast and affordable. If you would like structure, analysis or full draft review as well, our wider assessment support covers that, and we will suggest the right option when we see your enquiry.",
  },
  {
    question: "Will you check citations for CIPD factsheets and reports?",
    answer:
      "Yes. CIPD materials are corporate-author sources with their own quirks, including undated and updated pages, and they appear in almost every assignment we see. We check they are cited and listed correctly alongside your other sources.",
  },
  {
    question: "Is this ethical? Will my centre object?",
    answer:
      "Referencing support is standard academic skills support: universities run referencing workshops and checking clinics for the same reason. We correct and coach on the mechanics of attribution; the sources, reading and writing remain yours. We never fabricate references or disguise unread sources as read ones.",
  },
  {
    question: "Do you support all CIPD levels?",
    answer:
      "Yes. The referencing bar rises with level, from accurate basics at Level 3 to wide, consistent source handling at Level 7, and we match the check to the standard your level expects.",
  },
];

const funnelCta = enquiryUrl({ support: "harvard_referencing", cta: "hero" });

export default function HarvardReferencingSupportPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Harvard Referencing Support", path: "/harvard-referencing-support" },
        ])}
      />
      <JsonLd
        data={serviceJsonLd({
          name: "CIPD Harvard Referencing Support",
          description:
            "Citation and reference-list checking for CIPD assignments: accuracy, consistency and alignment with your centre's Harvard style, with coaching notes.",
          path: "/harvard-referencing-support",
          serviceType: "Harvard referencing support",
        })}
      />

      <PageHero
        eyebrow="Referencing support"
        breadcrumb="Harvard Referencing"
        title="CIPD Harvard Referencing Support"
        intro="Citations checked, reference list corrected, style made consistent, and the pattern explained so it stays right. The cheapest marks in your assignment are the ones referencing errors throw away."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={funnelCta} variant="primary" withArrow>
            Send Your Draft for a Referencing Check
          </ButtonLink>
          <ButtonLink
            href={whatsappLink("Hi, I'd like help checking the Harvard referencing in my CIPD assignment.")}
            variant="ghost-light"
            external
          >
            Ask a Quick Question
          </ButtonLink>
        </div>
      </PageHero>

      {/* Problem recognition */}
      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <span className="eyebrow">Sound familiar?</span>
            <h2 className="text-3xl font-bold text-navy-900">
              Referencing is mechanical. That makes it fixable, fast.
            </h2>
            <p className="mt-4 lead text-navy-700">
              Unlike analysis or structure, referencing has right answers. A systematic check
              catches the mismatches, inconsistencies and missing details that markers penalise
              on autopilot.
            </p>
            <ul className="mt-6 space-y-3">
              {problems.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-gold-500" />
                  <span className="body-copy text-navy-700">{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-mist-200 bg-mist-50 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-600">
              What the check covers
            </h3>
            <CheckList items={checks} className="mt-4" />
          </div>
        </div>
      </Section>

      {/* How it works */}
      <Section tone="mist">
        <SectionHeading
          eyebrow="How referencing support works"
          title="Five steps to a reference list that holds up"
        />
        <div className="mx-auto max-w-3xl">
          <ol className="relative space-y-6 border-l-2 border-mist-300 pl-8">
            {steps.map((s) => (
              <li key={s.n} className="relative">
                <span className="absolute -left-[42px] flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-gold-400 ring-4 ring-mist-100">
                  {s.n}
                </span>
                <div className="card">
                  <h3 className="font-bold text-navy-900">{s.t}</h3>
                  <p className="mt-1 text-sm text-navy-600">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Free resources + ethics */}
      <Section tone="white">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-mist-200 bg-mist-50 p-8">
            <h2 className="text-2xl font-bold text-navy-900">Prefer to do it yourself?</h2>
            <p className="mt-3 body-copy">
              Our free referencing guides cover the whole system, and many learners fix their own
              lists with them. The paid check exists for when you want certainty or time is short.
            </p>
            <div className="mt-5 space-y-3">
              {[
                { href: "/blog/harvard-referencing-complete-guide", label: "CIPD Harvard Referencing: The Complete Guide" },
                { href: "/blog/harvard-referencing-common-errors", label: "Harvard Referencing Mistakes That Cost CIPD Marks" },
                { href: "/blog/referencing-cipd-sources", label: "How to Reference CIPD Factsheets and Reports" },
                { href: "/resources/harvard-referencing-checklist", label: "Free printable referencing checklist" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-3 rounded-2xl border border-mist-200 bg-white p-4 transition-colors hover:border-mist-300"
                >
                  <span className="text-sm font-semibold text-navy-900">{l.label}</span>
                  <Icon name="arrow" className="ml-auto h-4 w-4 flex-none text-navy-400" />
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-teal-200 bg-white p-8 shadow-card">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
              <Icon name="originality" className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-2xl font-bold text-navy-900">Honest, ethical support</h2>
            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-navy-600">
              <li>• We correct and coach attribution mechanics; your reading and writing stay yours.</li>
              <li>• We never invent references or list sources you have not read.</li>
              <li>• Your centre&apos;s referencing guide takes precedence where you provide it.</li>
              <li>• Your documents are handled confidentially.</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* FAQ (visible content backing the FAQPage schema) */}
      <Section tone="mist">
        <SectionHeading eyebrow="FAQ" title="Referencing support questions, answered" />
        <Accordion items={faqs} />
      </Section>

      <CtaBand
        title="Send Your Draft and Your Centre's Referencing Guide"
        subtitle="We'll check every citation and entry, correct what's wrong, and show you the pattern to keep it right."
        primaryHref={enquiryUrl({ support: "harvard_referencing", cta: "cta_band" })}
        primaryLabel="Get Your Referencing Checked"
        location="cta_band"
      />
    </>
  );
}
