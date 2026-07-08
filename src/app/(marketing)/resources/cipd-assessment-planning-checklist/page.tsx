import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { LeadMagnetForm } from "@/components/LeadMagnetForm";

export const metadata: Metadata = {
  title: "Free CIPD Assessment Planning Checklist",
  description:
    "Download a free CIPD Assessment Planning Checklist: a step-by-step guide to planning any CIPD Level 3, 5 or 7 assignment, from understanding the brief to final review.",
};

const inside = [
  "Decode your brief and command verbs",
  "Map every assessment criterion",
  "Plan research, evidence and examples",
  "Build a criteria-led structure",
  "Get Harvard referencing right",
  "Run a final pre-submission review",
];

export default function ChecklistLandingPage() {
  return (
    <>
      <PageHero
        eyebrow="Free download"
        breadcrumb="Free Checklist"
        title="The Free CIPD Assessment Planning Checklist"
        intro="Every strong CIPD submission starts with a plan. This free, printable checklist walks you through planning any Level 3, 5 or 7 assignment, step by step, from brief to final review."
      />

      <Section tone="mist">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          {/* What's inside */}
          <div>
            <span className="eyebrow">What&apos;s inside</span>
            <h2 className="text-2xl font-bold text-navy-900">
              Six stages that keep your assignment on track
            </h2>
            <p className="mt-3 body-copy">
              Used alongside your assessment brief, the checklist helps you cover everything an
              assessor looks for, so nothing gets missed and no easy marks slip away.
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
                <span className="font-semibold text-teal-700">Works for every level.</span> Whether
                you&apos;re starting Level 3 or tackling a Level 7 Advanced Diploma, the checklist
                scales to the depth your qualification expects.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:sticky lg:top-24">
            <LeadMagnetForm />
          </div>
        </div>
      </Section>
    </>
  );
}
