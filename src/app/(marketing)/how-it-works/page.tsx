import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Section, SectionHeading } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { CtaBand } from "@/components/Cta";
import { howItWorksSteps } from "@/content/site-content";
import { integrityNotice } from "@/lib/site";

export const metadata: Metadata = {
  title: "How It Works: Simple CIPD Support in 5 Steps",
  description:
    "How our CIPD assessment support works: send your brief, receive a clear quote and plan, get structured guidance, review and refine, then submit with confidence.",
};

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        breadcrumb="How It Works"
        title="Clear support in five simple steps"
        intro="No confusion, no pressure. From your first message to your final submission, here's exactly how we help, and where you stay in control."
      />

      <Section tone="white">
        <div className="mx-auto max-w-3xl">
          <ol className="relative space-y-8 border-l-2 border-mist-200 pl-8">
            {howItWorksSteps.map((step) => (
              <li key={step.step} className="relative">
                <span className="absolute -left-[42px] flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-gold-400 ring-4 ring-white">
                  {step.step}
                </span>
                <div className="card">
                  <h3 className="text-xl font-bold text-navy-900">{step.title}</h3>
                  <p className="mt-2 body-copy">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* What you keep control of */}
      <Section tone="mist">
        <SectionHeading
          eyebrow="You stay in control"
          title="Guidance and review: your work stays yours"
          intro="We support and coach; you make the decisions and the final edits. That's what keeps the process ethical and the learning yours."
        />
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3">
          {[
            { t: "You approve everything", d: "Nothing moves forward without your say-so, at every stage." },
            { t: "You do the final review", d: "You read, refine and complete your own final check before submitting." },
            { t: "You submit", d: "The submission is always yours to make, in line with your centre's policy." },
          ].map((c) => (
            <div key={c.t} className="card text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                <Icon name="check" className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-navy-900">{c.t}</h3>
              <p className="mt-1.5 text-sm text-navy-600">{c.d}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-navy-500">
          {integrityNotice}
        </p>
      </Section>

      <CtaBand />
    </>
  );
}
