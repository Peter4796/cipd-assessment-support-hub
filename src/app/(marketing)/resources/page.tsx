import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Section, SectionHeading, ButtonLink } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { CtaBand } from "@/components/Cta";
import { postsByDate } from "@/content/posts";
import { caseStudies } from "@/content/case-studies";

export const metadata: Metadata = {
  title: "CIPD Resource Hub: Guides, Checklist & Case Studies",
  description:
    "Free CIPD resources: assessment guides, a downloadable planning checklist, and anonymised case studies for Level 3, 5 and 7 learners worldwide.",
  alternates: { canonical: "/resources" },
};

export default function ResourcesPage() {
  const latest = postsByDate.slice(0, 3);

  return (
    <>
      <PageHero
        eyebrow="Resource hub"
        breadcrumb="Resources"
        title="Free CIPD assessment resources"
        intro="Guides, a planning checklist and real case studies to help you understand your CIPD assessments and submit stronger work, whatever your level."
      />

      {/* Lead magnet feature */}
      <Section tone="white">
        <div className="relative overflow-hidden rounded-3xl bg-navy-900 p-8 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold-500/15 blur-2xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-300">
                Free download
              </span>
              <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
                The CIPD Assessment Planning Checklist
              </h2>
              <p className="mt-3 max-w-xl leading-relaxed text-navy-200">
                A step-by-step, printable checklist to plan any Level 3, 5 or 7 assignment, from
                decoding the brief to your final pre-submission review.
              </p>
              <div className="mt-6">
                <ButtonLink href="/resources/cipd-assessment-planning-checklist" variant="primary" withArrow>
                  Get the free checklist
                </ButtonLink>
              </div>
            </div>
            <div className="hidden justify-self-end lg:block">
              <div className="w-56 rotate-2 rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-card-hover">
                <div className="h-2 w-16 rounded bg-gold-400" />
                <div className="mt-4 space-y-2.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded border border-teal-300/60" />
                      <span className="h-2 flex-1 rounded bg-white/15" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* More free downloads */}
      <Section tone="white" className="!pt-0">
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              href: "/resources/harvard-referencing-checklist",
              title: "Harvard Referencing Checklist",
              blurb:
                "Run every citation, quote and reference-list entry through a final check before you submit.",
            },
            {
              href: "/resources/cipd-resubmission-planner",
              title: "CIPD Resubmission Planner",
              blurb:
                "Turn tutor feedback into a phased revision plan, from decoding comments to the final criterion check.",
            },
            {
              href: "/resources/reflective-writing-model-bank",
              title: "Reflective Writing Model Bank",
              blurb:
                "Four reflective structures with sentence stems, from Driscoll to Schon, for genuine, well-evidenced reflection.",
            },
            {
              href: "/resources/cipd-command-verb-cheat-sheet",
              title: "Command Verb Cheat Sheet",
              blurb:
                "Explain, analyse, evaluate and friends decoded, with an opening move for each and a quick guide per level.",
            },
          ].map((d) => (
            <Link key={d.href} href={d.href} className="card card-hover group flex items-start gap-4">
              <span className="mt-0.5 flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gold-100 text-gold-700">
                <Icon name="download" className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-base font-bold text-navy-900 group-hover:text-gold-600">
                  {d.title}
                </span>
                <span className="mt-1.5 block body-copy text-sm">{d.blurb}</span>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700">
                  Free download <Icon name="arrow" className="h-4 w-4" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* Latest guides */}
      <Section tone="mist">
        <div className="flex items-end justify-between">
          <SectionHeading eyebrow="Guides" title="Latest from the blog" align="left" />
          <Link href="/blog" className="mb-10 hidden text-sm font-semibold text-navy-700 hover:text-gold-600 sm:inline-flex sm:items-center sm:gap-1.5">
            All articles <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {latest.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="card card-hover group flex flex-col">
              <span className="chip border-mist-300 bg-white text-navy-600">{post.category}</span>
              <h3 className="mt-3 text-base font-bold text-navy-900 group-hover:text-gold-600">{post.title}</h3>
              <p className="mt-2 flex-1 body-copy text-sm">{post.description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700">
                Read <Icon name="arrow" className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* Case studies */}
      <Section tone="white">
        <SectionHeading eyebrow="Case studies" title="See our support in action" align="left" />
        <div className="grid gap-6 md:grid-cols-3">
          {caseStudies.map((cs) => (
            <Link key={cs.slug} href={`/case-studies/${cs.slug}`} className="card card-hover group flex flex-col">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-900 font-bold text-gold-400">
                L{cs.level}
              </span>
              <h3 className="mt-4 text-base font-bold text-navy-900 group-hover:text-gold-600">{cs.title}</h3>
              <p className="mt-2 flex-1 body-copy text-sm">{cs.summary}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700">
                Read case study <Icon name="arrow" className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
