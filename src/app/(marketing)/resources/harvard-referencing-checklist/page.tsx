import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { LeadMagnetForm } from "@/components/LeadMagnetForm";

export const metadata: Metadata = {
  title: "Free CIPD Harvard Referencing Checklist",
  description:
    "Download a free CIPD Harvard referencing checklist: in-text citations, reference list formatting, source quality and a final pre-submission review, in one printable page.",
  alternates: { canonical: "/resources/harvard-referencing-checklist" },
};

const inside = [
  "Check every in-text citation and quote",
  "Match citations to reference-list entries",
  "Format entries consistently, source by source",
  "Handle CIPD and online sources correctly",
  "Keep secondary referencing honest and minimal",
  "Run a final referencing-only review pass",
];

export default function ReferencingChecklistLandingPage() {
  return (
    <>
      <PageHero
        eyebrow="Free download"
        breadcrumb="Referencing Checklist"
        title="The Free CIPD Harvard Referencing Checklist"
        intro="Referencing loses more easy marks than any other part of a CIPD assignment. This free, printable checklist walks your draft through every citation, quote and reference-list entry before you submit."
      />

      <Section tone="mist">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          {/* What's inside */}
          <div>
            <span className="eyebrow">What&apos;s inside</span>
            <h2 className="text-2xl font-bold text-navy-900">
              Five review passes that catch the marks you would otherwise lose
            </h2>
            <p className="mt-3 body-copy">
              Used alongside your centre&apos;s referencing guidance, the checklist helps you find
              missing citations, mismatched entries and inconsistent formatting before your
              assessor does.
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
                <span className="font-semibold text-teal-700">Works for every level.</span> The
                same Harvard fundamentals apply from Level 3 to Level 7; only the depth of reading
                changes. Your centre&apos;s own referencing guide always has the final say on fine
                details.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:sticky lg:top-24">
            <LeadMagnetForm
              resourceSlug="harvard-referencing-checklist"
              downloadUrl="/downloads/cipd-harvard-referencing-checklist.html"
              resourceNoun="checklist"
              resourceTitle="CIPD Harvard Referencing Checklist"
            />
          </div>
        </div>
      </Section>
    </>
  );
}
