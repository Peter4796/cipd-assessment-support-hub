import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Section, ButtonLink, CheckList } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { CtaBand } from "@/components/Cta";
import { units, getUnit } from "@/content/units";
import { cta, site, whatsappLink } from "@/lib/site";

export function generateStaticParams() {
  return units.map((u) => ({ code: u.slug }));
}

export function generateMetadata({ params }: { params: { code: string } }): Metadata {
  const unit = getUnit(params.code);
  if (!unit) return {};
  return {
    title: `${unit.code} Assignment Help — ${unit.title}`,
    description: `${unit.code} (${unit.title}) assignment support for CIPD ${unit.qualification}. Brief analysis, structure, Harvard referencing and draft review for UK and UAE learners.`,
    keywords: [unit.keyword, `${unit.code} assignment`, `CIPD ${unit.code}`, `${unit.code} example`],
    alternates: { canonical: `${site.url}/cipd-units/${unit.slug}` },
  };
}

const levelHelp: Record<string, string[]> = {
  "3": [
    "A plain-English breakdown of your unit brief",
    "A clear structure and outline to write against",
    "Harvard referencing basics and examples",
    "Supportive draft review and proofreading",
  ],
  "5": [
    "Brief interpretation and criteria mapping",
    "A structure that balances analysis and application",
    "Draft review focused on depth, evidence and criteria",
    "Harvard referencing for journals, models and CIPD sources",
  ],
  "7": [
    "In-depth brief and criteria analysis at Master's level",
    "Support structuring a critical, argument-led response",
    "Critical-review feedback on drafts and reasoning",
    "Guidance on wider reading and source integration",
  ],
};

export default function UnitPage({ params }: { params: { code: string } }) {
  const unit = getUnit(params.code);
  if (!unit) notFound();

  const related = units.filter((u) => u.level === unit.level && u.slug !== unit.slug).slice(0, 3);
  const levelSlug = `/cipd-level-${unit.level}-support`;

  return (
    <>
      <PageHero
        eyebrow={`CIPD ${unit.code}`}
        breadcrumb={`${unit.code}`}
        title={`${unit.code} Assignment Help: ${unit.title}`}
        intro={`Specialist support for ${unit.code} (${unit.title}), part of the ${unit.qualification}.`}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/contact" variant="primary" withArrow>
            {cta.sendBrief}
          </ButtonLink>
          <ButtonLink href={whatsappLink(`Hi, I need help with CIPD ${unit.code}.`)} variant="ghost-light" external>
            {cta.whatsapp}
          </ButtonLink>
        </div>
      </PageHero>

      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <span className="eyebrow">About this unit</span>
            <h2 className="text-2xl font-bold text-navy-900">What is {unit.code}?</h2>
            <p className="mt-4 lead text-navy-700">{unit.overview}</p>

            <h3 className="mt-10 text-xl font-bold text-navy-900">What {unit.code} covers</h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {unit.topics.map((t) => (
                <li key={t} className="flex items-start gap-3 rounded-2xl border border-mist-200 bg-mist-50 p-4">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-teal-100 text-teal-700">
                    <Icon name="check" className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm text-navy-700">{t}</span>
                </li>
              ))}
            </ul>

            <h3 className="mt-10 text-xl font-bold text-navy-900">Common challenges with {unit.code}</h3>
            <ul className="mt-4 space-y-2.5">
              {unit.challenges.map((c) => (
                <li key={c} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-gold-500" />
                  <span className="body-copy text-navy-700">{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sidebar: how we help */}
          <aside className="lg:sticky lg:top-24">
            <div className="rounded-3xl border border-mist-200 bg-mist-50 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-600">
                How we help with {unit.code}
              </h3>
              <CheckList items={levelHelp[unit.level]} className="mt-4" />
              <div className="mt-6 space-y-2">
                <ButtonLink href="/contact" variant="navy" className="w-full" withArrow>
                  Get a quote for {unit.code}
                </ButtonLink>
                <ButtonLink href={levelSlug} variant="outline" className="w-full">
                  All Level {unit.level} support
                </ButtonLink>
              </div>
              <p className="mt-4 text-center text-xs text-navy-400">
                Ethical guidance, review and coaching. We help you produce your own best work.
              </p>
            </div>
          </aside>
        </div>
      </Section>

      {/* Related units */}
      {related.length > 0 && (
        <Section tone="mist">
          <h2 className="mb-8 text-2xl font-bold text-navy-900">Other Level {unit.level} units</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((r) => (
              <Link key={r.slug} href={`/cipd-units/${r.slug}`} className="card card-hover group">
                <span className="font-mono text-sm font-bold text-navy-900">{r.code}</span>
                <h3 className="mt-2 text-sm font-semibold text-navy-900 group-hover:text-gold-600">{r.title}</h3>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700">
                  View support <Icon name="arrow" className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <CtaBand
        title={`Get expert support with ${unit.code}`}
        subtitle={`Send us your ${unit.code} brief, deadline and word count for a clear, no-obligation quote.`}
      />
    </>
  );
}
