import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { LeadMagnetForm } from "@/components/LeadMagnetForm";

export const metadata: Metadata = {
  title: "Free CIPD Resubmission Planner",
  description:
    "Download a free CIPD resubmission planner: decode your tutor feedback, plan the revision phase by phase, and run a final criterion-by-criterion check before you resubmit.",
  alternates: { canonical: "/resources/cipd-resubmission-planner" },
};

const inside = [
  "Map your feedback-to-deadline window",
  "Decode every tutor comment into an action",
  "Audit your word count for room to fix",
  "Track each section fix against the feedback",
  "Cool off, then check criterion by criterion",
  "Submit early, calm and in control",
];

export default function ResubmissionPlannerLandingPage() {
  return (
    <>
      <PageHero
        eyebrow="Free download"
        breadcrumb="Resubmission Planner"
        title="The Free CIPD Resubmission Planner"
        intro="A referral is fixable, and fixing it goes far better with a plan. This free, printable planner takes you from tutor feedback to a stronger resubmission, phase by phase."
      />

      <Section tone="mist">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          {/* What's inside */}
          <div>
            <span className="eyebrow">What&apos;s inside</span>
            <h2 className="text-2xl font-bold text-navy-900">
              Four phases that turn feedback into a pass-ready revision
            </h2>
            <p className="mt-3 body-copy">
              Used alongside your brief and your tutor&apos;s comments, the planner keeps your
              revision targeted at what the feedback actually named, so effort goes where the
              marks are.
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
                <span className="font-semibold text-teal-700">Referrals are normal.</span> Every
                cohort has them, and centres build resubmission windows in for a reason. The
                planner works for any unit at Level 3, 5 or 7; your own brief and centre rules set
                the dates.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:sticky lg:top-24">
            <LeadMagnetForm
              resourceSlug="cipd-resubmission-planner"
              downloadUrl="/downloads/cipd-resubmission-planner.html"
              resourceNoun="planner"
              resourceTitle="CIPD Resubmission Planner"
            />
          </div>
        </div>
      </Section>
    </>
  );
}
