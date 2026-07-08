import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { CtaBand } from "@/components/Cta";
import { caseStudies } from "@/content/case-studies";

export const metadata: Metadata = {
  title: "CIPD Support Case Studies",
  description:
    "Anonymised examples of our CIPD assessment support in action — Level 5 draft improvement, Level 3 resubmission support, and Level 7 structure and critical-analysis coaching.",
};

export default function CaseStudiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Case studies"
        breadcrumb="Case Studies"
        title="Support in action — anonymised examples"
        intro="Real support scenarios across Levels 3, 5 and 7, anonymised for confidentiality. They show how our guidance works in practice — and how the work always stays the learner's own."
      />

      <Section tone="white">
        <div className="grid gap-6 lg:grid-cols-3">
          {caseStudies.map((cs) => (
            <Link key={cs.slug} href={`/case-studies/${cs.slug}`} className="card card-hover group flex flex-col">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 font-bold text-gold-400">
                  L{cs.level}
                </span>
                <span className="chip border-teal-200 bg-teal-50 text-teal-700">{cs.supportType}</span>
              </div>
              <h2 className="mt-5 text-lg font-bold text-navy-900 group-hover:text-gold-600">
                {cs.title}
              </h2>
              <p className="mt-1 text-xs font-medium text-navy-400">{cs.client}</p>
              <p className="mt-3 flex-1 body-copy text-sm">{cs.summary}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 group-hover:gap-2.5">
                Read case study <Icon name="arrow" className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-3xl rounded-2xl border border-gold-200 bg-gold-50 p-5 text-center text-sm leading-relaxed text-navy-700">
          <strong className="text-navy-900">Note:</strong> These case studies are anonymised and
          illustrative. They demonstrate our support process and the standard we help learners
          reach — always through guidance, review and coaching, never by producing work on a
          learner&apos;s behalf.
        </p>
      </Section>

      <CtaBand />
    </>
  );
}
