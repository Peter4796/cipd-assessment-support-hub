import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { LeadMagnetForm } from "@/components/LeadMagnetForm";

export const metadata: Metadata = {
  title: "Free CIPD Reflective Writing Model Bank",
  description:
    "Download a free CIPD reflective writing model bank: Driscoll, Gibbs, Kolb and Schon structures with ready-to-adapt sentence stems for genuine, well-evidenced reflection.",
  alternates: { canonical: "/resources/reflective-writing-model-bank" },
};

const inside = [
  "Driscoll's What, So what, Now what stems",
  "Gibbs' cycle, stage by stage",
  "Kolb's learning loop in practice",
  "Schon's reflection-in-action prompts",
  "Honest learning-statement stems",
  "A final pre-submission reflection check",
];

export default function ModelBankLandingPage() {
  return (
    <>
      <PageHero
        eyebrow="Free download"
        breadcrumb="Reflective Model Bank"
        title="The Free CIPD Reflective Writing Model Bank"
        intro="Reflective writing is a structure, not a talent. This free, printable model bank gives you four proven reflective structures with sentence stems you can adapt to your own genuine experience."
      />

      <Section tone="mist">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          {/* What's inside */}
          <div>
            <span className="eyebrow">What&apos;s inside</span>
            <h2 className="text-2xl font-bold text-navy-900">
              Four structures that turn events into evidenced reflection
            </h2>
            <p className="mt-3 body-copy">
              Used alongside your brief, the model bank helps you pick one reflective structure,
              follow its stages, and write learning statements an assessor can credit.
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
                <span className="font-semibold text-teal-700">Genuinely yours.</span> The stems are
                scaffolding for your own real experience, from Level 3 core behaviours to Level 7
                critical reflection. Your reflection stays authentic; the structure just holds it
                up.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:sticky lg:top-24">
            <LeadMagnetForm
              resourceSlug="reflective-writing-model-bank"
              downloadUrl="/downloads/cipd-reflective-writing-model-bank.html"
              resourceNoun="model bank"
              resourceTitle="CIPD Reflective Writing Model Bank"
            />
          </div>
        </div>
      </Section>
    </>
  );
}
