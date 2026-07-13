import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Section, SectionHeading, ButtonLink, CheckList } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { CtaBand } from "@/components/Cta";
import { Accordion } from "@/components/Accordion";
import { enquiryUrl } from "@/lib/leads/context";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "CIPD Resubmission Support (Level 3, 5 & 7)",
  description:
    "Professional CIPD resubmission support. Understand your assessor feedback, identify the referred assessment criteria, and improve your response with focused academic guidance for Level 3, 5 and 7.",
  keywords: [
    "CIPD resubmission support",
    "CIPD referred assessment",
    "CIPD tutor feedback help",
    "CIPD assessor feedback",
  ],
  alternates: { canonical: "/cipd-resubmission-support" },
};

const problems = [
  "You've received a referral and aren't sure what went wrong",
  "The assessor's comments feel vague or hard to action",
  "Specific assessment criteria need improving, but you don't know how",
  "You're worried about repeating the same mistakes",
  "Your resubmission deadline is uncomfortably close",
];

const steps = [
  { n: 1, t: "Send the assessment brief", d: "So we can see exactly what the unit requires." },
  { n: 2, t: "Upload your previous submission", d: "The work as it was marked." },
  { n: 3, t: "Upload the assessor or tutor feedback", d: "The referral comments, criterion by criterion." },
  { n: 4, t: "Receive a focused review", d: "A plain-English breakdown of what each comment requires." },
  { n: 5, t: "Improve the referred criteria", d: "Targeted guidance so your resubmission addresses every flagged point." },
];

const reviewable = [
  "Assessor feedback and what it really means",
  "The referred assessment criteria, point by point",
  "Structure and signposting",
  "Evidence and workplace examples",
  "Critical analysis and depth",
  "Harvard referencing",
  "Word-count control",
  "Academic tone and clarity",
];

const faqs = [
  {
    question: "What does a referred CIPD assessment mean?",
    answer:
      "A referral means one or more assessment criteria were not fully met on your submission. It is not a failure of the whole assignment. Everything that passed can usually stay as it is; your resubmission needs to address the specific criteria that were flagged.",
  },
  {
    question: "Can you help me understand tutor feedback?",
    answer:
      "Yes. Interpreting feedback is often the most valuable part of resubmission support. We translate comments like 'more analysis needed' or 'AC 2.1 not met' into specific, practical actions tied to exact places in your work.",
  },
  {
    question: "What documents should I send?",
    answer:
      "Ideally three things: the assessment brief, your previous submission, and the assessor or tutor feedback. With those we can see precisely what was asked, what you wrote, and what the assessor flagged.",
  },
  {
    question: "Can you review only the referred assessment criteria?",
    answer:
      "Yes. Targeted review of the referred criteria is usually the right approach. Rewriting sections that already passed adds risk without adding marks.",
  },
  {
    question: "Can you help with an urgent resubmission?",
    answer:
      "Often, yes. Send your deadline with your enquiry and we'll tell you honestly what's realistic. The sooner we see the feedback, the more we can do.",
  },
  {
    question: "Do you guarantee a pass?",
    answer:
      "No, and you should be cautious of anyone who does. What we provide is focused, honest support that improves your interpretation of the feedback, your structure, your analysis and your alignment with the referred criteria.",
  },
  {
    question: "Do you support Level 3, Level 5 and Level 7?",
    answer:
      "Yes. We support resubmissions across the Foundation Certificate, Associate Diploma and Advanced Diploma, with guidance matched to the depth each level expects.",
  },
  {
    question: "Is my assessment information confidential?",
    answer:
      "Yes. Your documents and details are used only to review your enquiry and prepare an appropriate response. We handle everything discreetly.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: site.url },
    {
      "@type": "ListItem",
      position: 2,
      name: "CIPD Resubmission Support",
      item: `${site.url}/cipd-resubmission-support`,
    },
  ],
};

const funnelCta = enquiryUrl({ support: "resubmission", submission: "resubmission", cta: "hero" });

export default function ResubmissionSupportPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <PageHero
        eyebrow="Resubmission support"
        breadcrumb="Resubmission Support"
        title="Professional CIPD Resubmission Support"
        intro="Understand your assessor feedback, identify the referred assessment criteria, and improve your response with focused academic guidance."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={funnelCta} variant="primary" withArrow>
            Send Your Assessment Brief and Feedback
          </ButtonLink>
          <ButtonLink
            href={whatsappLink("Hi, I've been referred on a CIPD assessment and would like to discuss resubmission support.")}
            variant="ghost-light"
            external
          >
            Discuss Your Resubmission
          </ButtonLink>
        </div>
      </PageHero>

      {/* Problem recognition */}
      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <span className="eyebrow">Sound familiar?</span>
            <h2 className="text-3xl font-bold text-navy-900">
              A referral is fixable. The key is knowing exactly what to fix.
            </h2>
            <p className="mt-4 lead text-navy-700">
              Most referrals come down to a few specific assessment criteria, not the whole
              assignment. Our resubmission support turns confusing feedback into a clear,
              targeted improvement plan.
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
              What we can review
            </h3>
            <CheckList items={reviewable} className="mt-4" />
          </div>
        </div>
      </Section>

      {/* How it works */}
      <Section tone="mist">
        <SectionHeading
          eyebrow="How resubmission support works"
          title="Five steps from referral to confident resubmission"
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

      {/* Levels + ethics */}
      <Section tone="white">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-mist-200 bg-mist-50 p-8">
            <h2 className="text-2xl font-bold text-navy-900">Levels supported</h2>
            <div className="mt-5 space-y-3">
              {(["3", "5", "7"] as const).map((l) => (
                <Link
                  key={l}
                  href={`/cipd-level-${l}-support`}
                  className="flex items-center gap-4 rounded-2xl border border-mist-200 bg-white p-4 transition-colors hover:border-mist-300"
                >
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-900 font-bold text-gold-400">
                    L{l}
                  </span>
                  <span className="font-semibold text-navy-900">CIPD Level {l} resubmission support</span>
                  <Icon name="arrow" className="ml-auto h-4 w-4 text-navy-400" />
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
              <li>• No guaranteed grades. Be cautious of anyone who promises them.</li>
              <li>• Support focuses on interpretation, review, coaching, editing and improvement.</li>
              <li>• You review and understand your final submission. The work stays yours.</li>
              <li>• Your assessment information is handled confidentially.</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* FAQ (visible content backing the FAQPage schema) */}
      <Section tone="mist">
        <SectionHeading eyebrow="FAQ" title="Resubmission questions, answered" />
        <Accordion items={faqs} />
      </Section>

      <CtaBand
        title="Upload Your Assessment Brief, Previous Draft, and Feedback"
        subtitle="Send everything in one place and we'll review the referred criteria and respond with the right support option."
        primaryHref={enquiryUrl({ support: "resubmission", submission: "resubmission", cta: "cta_band" })}
        primaryLabel="Send Your Assessment Brief and Feedback"
        location="cta_band"
      />
    </>
  );
}
