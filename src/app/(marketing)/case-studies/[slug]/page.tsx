import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { CtaBand } from "@/components/Cta";
import { RichContent } from "@/components/RichContent";
import { caseStudies, getCaseStudy } from "@/content/case-studies";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const cs = getCaseStudy(params.slug);
  if (!cs) return {};
  return {
    title: cs.title,
    description: cs.summary,
    alternates: { canonical: `${site.url}/case-studies/${cs.slug}` },
  };
}

export default function CaseStudyPage({ params }: { params: { slug: string } }) {
  const cs = getCaseStudy(params.slug);
  if (!cs) notFound();

  const facts = [
    { label: "Learner", value: cs.client },
    { label: "Support type", value: cs.supportType },
    { label: "Challenge", value: cs.challenge },
    { label: "Outcome", value: cs.outcome },
  ];

  return (
    <>
      <PageHero
        eyebrow={`CIPD Level ${cs.level} · Case study`}
        breadcrumb="Case Studies"
        title={cs.title}
        intro={cs.summary}
      />

      <Section tone="white">
        <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="lg:order-1">
            <RichContent blocks={cs.body} />
            <div className="mt-10 border-t border-mist-200 pt-6">
              <Link
                href="/case-studies"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-gold-600"
              >
                <Icon name="arrow" className="h-4 w-4 rotate-180" /> Back to all case studies
              </Link>
            </div>
          </div>

          {/* Fact sidebar */}
          <aside className="lg:order-2 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-mist-200 bg-mist-50 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-600">
                At a glance
              </h2>
              <dl className="mt-4 space-y-4">
                {facts.map((f) => (
                  <div key={f.label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-navy-400">
                      {f.label}
                    </dt>
                    <dd className="mt-1 text-sm text-navy-700">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
