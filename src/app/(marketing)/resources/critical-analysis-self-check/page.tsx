import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { LeadMagnetForm } from "@/components/LeadMagnetForm";

export const metadata: Metadata = {
  title: "Free CIPD Critical Analysis Self-Check",
  description:
    "Download a free CIPD critical analysis self-check: six draft-audit checks, from verbs to counterviews, that catch descriptive writing before your assessor does.",
  alternates: { canonical: "/resources/critical-analysis-self-check" },
};

const inside = [
  "The verbs check: describing vs reasoning",
  "The judgement check for evaluate tasks",
  "The counterview check, fairly answered",
  "The evidence-weight check on citations",
  "The assumption check on your arguments",
  "The so-what check, paragraph by paragraph",
];

export default function SelfCheckLandingPage() {
  return (
    <>
      <PageHero
        eyebrow="Free download"
        breadcrumb="Critical Analysis Self-Check"
        title="The Free CIPD Critical Analysis Self-Check"
        intro="Too descriptive is the most common feedback in CIPD assessment. This free, printable self-check gives you six passes to run over any finished draft, so you find the flat paragraphs before your assessor does."
      />

      <Section tone="mist">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          {/* What's inside */}
          <div>
            <span className="eyebrow">What&apos;s inside</span>
            <h2 className="text-2xl font-bold text-navy-900">
              Six checks that turn description into analysis
            </h2>
            <p className="mt-3 body-copy">
              Each check tells you what to scan for, how to spot a failure, and the specific fix,
              so auditing your own draft stops depending on being able to read it like a stranger.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {inside.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-2xl border border-mist-200 bg-white p-4">
                  <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-teal-100 text-teal-700">
                    <Icon name="check" className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-navy-800">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl border border-teal-200 bg-white p-5">
              <p className="text-sm leading-relaxed text-navy-600">
                <span className="font-semibold text-teal-700">Works at every level.</span>{" "}
                Criticality is a core requirement from Level 5 and runs throughout Level 7, but
                the same six checks lift a Level 3 answer too. Run them after drafting, not
                during.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:sticky lg:top-24">
            <LeadMagnetForm
              resourceSlug="critical-analysis-self-check"
              downloadUrl="/downloads/cipd-critical-analysis-self-check.html"
              resourceNoun="self-check"
              resourceTitle="CIPD Critical Analysis Self-Check"
            />
          </div>
        </div>
      </Section>
    </>
  );
}
