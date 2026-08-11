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
  title: "Urgent CIPD Assignment Help (Tight Deadlines)",
  description:
    "Urgent CIPD assignment help when your deadline is days away. Honest, ethical support under time pressure: focused review, structure triage and referencing checks, fast.",
  keywords: [
    "urgent CIPD assignment help",
    "CIPD deadline help",
    "CIPD assignment due this week",
    "fast CIPD assignment support",
  ],
  alternates: { canonical: "/urgent-cipd-help" },
};

const situations = [
  "Your deadline is this week and the draft isn't where it needs to be",
  "You've been putting an assignment off and the time has run out",
  "A resubmission window is closing and the feedback still isn't addressed",
  "Work exploded mid-unit and the plan collapsed",
  "The draft is written, but you have no time left to check it properly",
];

const canDo = [
  "Rapid draft review focused on the criteria that carry the marks",
  "Feedback interpretation for referred work, fast",
  "Structure triage: what to fix first when you can't fix everything",
  "Harvard referencing checks, which suit tight windows well",
  "A prioritised action plan matched to the hours you actually have",
  "Honest advice on whether to press on or talk to your centre",
];

const cannotDo = [
  "Write your assignment or any part of it for you",
  "Guarantee a pass, at any speed and any price",
  "Fabricate references, data or workplace evidence to save time",
  "Pretend an unrealistic deadline is achievable",
];

const steps = [
  { n: 1, t: "Send your deadline first", d: "Date and time. Everything we advise depends on the real window." },
  { n: 2, t: "Upload the brief and your draft", d: "Whatever state it's in. A partial draft is fine; we've seen worse." },
  { n: 3, t: "Get an honest feasibility answer", d: "What's realistic in the time, what to prioritise, and what to let go." },
  { n: 4, t: "Receive focused, fast support", d: "Review and guidance aimed only at what moves marks before the deadline." },
  { n: 5, t: "Submit, then breathe", d: "And if the timeline was truly impossible, we'll have said so at step three." },
];

const faqs = [
  {
    question: "My CIPD assignment is due in a few days. Can you still help?",
    answer:
      "Often, yes. Focused review, structure triage and referencing checks all work in short windows. Send your deadline, brief and current draft, and we will tell you honestly what is achievable in the time available before you commit to anything.",
  },
  {
    question: "Can you write my assignment quickly if I pay more?",
    answer:
      "No. We never write assignments, at any deadline or any price, and paying someone who will puts your enrolment at risk through your centre's academic integrity process. What we offer under time pressure is focused guidance and review that makes your remaining hours count.",
  },
  {
    question: "What if my deadline is genuinely impossible?",
    answer:
      "Then we will say so, and that honesty is part of the service. In that situation the strongest move is usually contacting your study centre early: extension and deferral policies exist for exactly these moments, and centres respond far better to early requests than deadline-day pleas.",
  },
  {
    question: "What should I prioritise when time is short?",
    answer:
      "Cover every criterion before you polish anything: a missed criterion costs more than an imperfect paragraph. Then protect the conclusion and the referencing, which are the two most common last-minute casualties. Our rapid review orders these priorities for your specific brief.",
  },
  {
    question: "Do you handle urgent resubmissions?",
    answer:
      "Yes, resubmission windows are one of the most common urgent situations we see. Send the assessor feedback with your previous submission and deadline, and we focus the review on the referred criteria only.",
  },
  {
    question: "How fast will you respond to an urgent enquiry?",
    answer:
      "Urgent enquiries are flagged by their deadline and prioritised. Send everything in one go, including the deadline, brief and draft, so the first response can be a useful one rather than a request for missing documents.",
  },
  {
    question: "Is rushed support still ethical support?",
    answer:
      "Yes, because the boundaries do not move with the clock. Guidance, review, coaching and editing remain guidance, review, coaching and editing at any speed. The work you submit is always your own, which is also what keeps you safe.",
  },
];

const funnelCta = enquiryUrl({ cta: "hero" });

export default function UrgentCipdHelpPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Urgent CIPD Help", path: "/urgent-cipd-help" },
        ])}
      />
      <JsonLd
        data={serviceJsonLd({
          name: "Urgent CIPD Assignment Help",
          description:
            "Fast, ethical CIPD assignment support for tight deadlines: rapid draft review, structure triage, feedback interpretation and referencing checks.",
          path: "/urgent-cipd-help",
          serviceType: "Urgent CIPD assignment support",
        })}
      />

      <PageHero
        eyebrow="Urgent support"
        breadcrumb="Urgent Help"
        title="Urgent CIPD Assignment Help"
        intro="Deadline days away? Focused, honest support that makes the hours you have left count, without crossing the lines that would put your enrolment at risk."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={funnelCta} variant="primary" withArrow>
            Send Your Deadline, Brief and Draft
          </ButtonLink>
          <ButtonLink
            href={whatsappLink("Hi, my CIPD assignment deadline is very close and I'd like to know what support is realistic.")}
            variant="ghost-light"
            external
          >
            WhatsApp Us Your Deadline
          </ButtonLink>
        </div>
      </PageHero>

      {/* Situations */}
      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <span className="eyebrow">Where you might be right now</span>
            <h2 className="text-3xl font-bold text-navy-900">
              Time pressure narrows your options. It doesn&apos;t remove them.
            </h2>
            <p className="mt-4 lead text-navy-700">
              With days left, the question is no longer how to make the assignment perfect. It is
              how to spend the remaining hours where the marks actually are, and that is a
              question experienced eyes answer quickly.
            </p>
            <ul className="mt-6 space-y-3">
              {situations.map((s) => (
                <li key={s} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-gold-500" />
                  <span className="body-copy text-navy-700">{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-mist-200 bg-mist-50 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-600">
              What we can do fast
            </h3>
            <CheckList items={canDo} className="mt-4" />
          </div>
        </div>
      </Section>

      {/* Boundaries: the honesty section */}
      <Section tone="mist">
        <div className="mx-auto max-w-3xl rounded-3xl border border-teal-200 bg-white p-8 shadow-card">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
            <Icon name="originality" className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-2xl font-bold text-navy-900">
            What we won&apos;t do, even under deadline pressure
          </h2>
          <p className="mt-3 body-copy">
            Urgency is where learners are most vulnerable to services that promise everything. Our
            boundaries are the same at every speed, and they exist to protect you as much as us.
          </p>
          <ul className="mt-5 space-y-3">
            {cannotDo.map((c) => (
              <li key={c} className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-mist-200 text-navy-500 text-xs font-bold">
                  ✕
                </span>
                <span className="body-copy text-navy-700">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* How it works */}
      <Section tone="white">
        <SectionHeading
          eyebrow="How urgent support works"
          title="Five fast steps, starting with your deadline"
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

      {/* Helpful now: free triage reading */}
      <Section tone="mist">
        <SectionHeading
          eyebrow="While you wait"
          title="Three guides you can use in the next hour"
        />
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { href: "/blog/resubmission-timeline-planning", label: "Planning Your CIPD Resubmission Timeline", blurb: "If your urgency is a closing resubmission window." },
            { href: "/blog/interpreting-assessor-feedback-phrases", label: "What CIPD Assessor Feedback Phrases Actually Mean", blurb: "Decode referral comments into a fast action list." },
            { href: "/blog/cipd-introductions-and-conclusions", label: "Introductions and Conclusions in CIPD Assignments", blurb: "The highest-value fixes in the final hours." },
          ].map((g) => (
            <Link key={g.href} href={g.href} className="card card-hover group flex flex-col">
              <h3 className="text-base font-bold text-navy-900 group-hover:text-gold-600">{g.label}</h3>
              <p className="mt-2 flex-1 body-copy text-sm">{g.blurb}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700">
                Read <Icon name="arrow" className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* FAQ (visible content backing the FAQPage schema) */}
      <Section tone="white">
        <SectionHeading eyebrow="FAQ" title="Urgent help questions, answered" />
        <Accordion items={faqs} />
      </Section>

      <CtaBand
        title="The Clock Matters. Send Everything in One Message."
        subtitle="Deadline, brief and draft together mean our first reply can be the plan, not a request for documents."
        primaryHref={enquiryUrl({ cta: "cta_band" })}
        primaryLabel="Send Your Deadline, Brief and Draft"
        location="cta_band"
      />
    </>
  );
}
