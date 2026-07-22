import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { LeadMagnetForm } from "@/components/LeadMagnetForm";

export const metadata: Metadata = {
  title: "Free CIPD Command Verb Cheat Sheet",
  description:
    "Download a free CIPD command verb cheat sheet: what explain, analyse, evaluate and critically evaluate each demand, with opening moves for every verb.",
  alternates: { canonical: "/resources/cipd-command-verb-cheat-sheet" },
};

const inside = [
  "Thirteen command verbs decoded",
  "What markers look for under each verb",
  "Opening and closing moves to adapt",
  "Explain vs analyse vs evaluate, side by side",
  "The critical-evaluation move for Level 7",
  "A quick verb guide for each level",
];

export default function CommandVerbCheatSheetLandingPage() {
  return (
    <>
      <PageHero
        eyebrow="Free download"
        breadcrumb="Command Verb Cheat Sheet"
        title="The Free CIPD Command Verb Cheat Sheet"
        intro="Answering the wrong verb is one of the quickest ways to lose CIPD marks. This free, printable cheat sheet decodes every common command verb, with an opening move for each."
      />

      <Section tone="mist">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          {/* What's inside */}
          <div>
            <span className="eyebrow">What&apos;s inside</span>
            <h2 className="text-2xl font-bold text-navy-900">
              Every verb your brief will throw at you, decoded
            </h2>
            <p className="mt-3 body-copy">
              Keep it beside your brief as you plan each task, and beside your draft as you check
              that every answer does what its verb actually asked.
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
                <span className="font-semibold text-teal-700">Works at every level.</span> The
                verbs scale with your qualification: the sheet shows what each one demands at
                Level 3, 5 and 7, so the same page stays useful from your first unit to your last.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:sticky lg:top-24">
            <LeadMagnetForm
              resourceSlug="cipd-command-verb-cheat-sheet"
              downloadUrl="/downloads/cipd-command-verb-cheat-sheet.html"
              resourceNoun="cheat sheet"
              resourceTitle="CIPD Command Verb Cheat Sheet"
            />
          </div>
        </div>
      </Section>
    </>
  );
}
