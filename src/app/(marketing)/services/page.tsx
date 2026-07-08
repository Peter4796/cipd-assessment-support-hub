import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Section, SectionHeading, ButtonLink } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { CtaBand } from "@/components/Cta";
import { services } from "@/content/services";
import { levels } from "@/content/levels";
import { cta } from "@/lib/site";

export const metadata: Metadata = {
  title: "CIPD Assessment Support Services",
  description:
    "Full CIPD assessment support: brief interpretation, criteria mapping, structure and planning, draft review, editing, Harvard referencing, resubmission and originality guidance.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Our services"
        breadcrumb="Services"
        title="Complete CIPD assessment support, end to end"
        intro="Whether you need help understanding a brief, improving a draft or preparing a resubmission, our services cover every stage of a CIPD assessment, all aligned to your marking criteria."
      >
        <ButtonLink href="/contact" variant="primary" withArrow>
          {cta.sendBrief}
        </ButtonLink>
      </PageHero>

      {/* Services list */}
      <Section tone="white">
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((service, i) => (
            <article
              key={service.slug}
              id={service.slug}
              className="card card-hover flex scroll-mt-24 flex-col"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-navy-900 text-gold-400">
                  <Icon name={service.icon} className="h-6 w-6" />
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-navy-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-lg font-bold text-navy-900">{service.title}</h2>
                </div>
              </div>
              <p className="mt-4 body-copy text-sm">{service.description}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* By level */}
      <Section tone="mist">
        <SectionHeading
          eyebrow="Support by qualification"
          title="Looking for level-specific guidance?"
          intro="Every service is tailored to the depth your qualification demands. Explore support built for your level."
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {levels.map((level) => (
            <Link key={level.slug} href={`/${level.slug}`} className="card card-hover group">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 font-bold text-gold-400">
                L{level.number}
              </span>
              <h3 className="mt-4 text-lg font-bold text-navy-900">{level.title}</h3>
              <p className="mt-2 body-copy text-sm">{level.summary}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 group-hover:text-gold-600">
                View level support <Icon name="arrow" className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
