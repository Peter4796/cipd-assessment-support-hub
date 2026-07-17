import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Section, SectionHeading } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { CtaBand } from "@/components/Cta";
import { whyChooseUs } from "@/content/services";
import { integrityNotice } from "@/lib/site";

export const metadata: Metadata = {
  title: "About: Specialist CIPD Assessment Support",
  description:
    "A specialist CIPD assessment support service for international HR learners. Professional, clear, confidential guidance aligned with UK-style academic expectations.",
  alternates: { canonical: "/about" },
};

const values = [
  {
    title: "Specialist, not generalist",
    description:
      "We focus solely on CIPD assessments across Levels 3, 5 and 7, so we understand the units, the criteria and what assessors look for.",
    icon: "coaching" as const,
  },
  {
    title: "Clarity above everything",
    description:
      "We turn dense briefs and academic conventions into clear, actionable guidance you can act on with confidence.",
    icon: "structure" as const,
  },
  {
    title: "Confidential by default",
    description:
      "Your identity, documents and communication stay private. Discretion is a promise, not a feature.",
    icon: "originality" as const,
  },
  {
    title: "Practical HR knowledge",
    description:
      "Real people-practice insight helps you connect theory to workplace examples, which is where CIPD marks are won.",
    icon: "map" as const,
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        breadcrumb="About"
        title="A specialist CIPD assessment support service for HR learners"
        intro="We help busy HR professionals, working adults and international learners across the UK, the Gulf region and worldwide understand their assessments and submit their strongest, most confident work."
      />

      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="rich-text max-w-none">
            <p className="lead text-navy-700">
              CIPD qualifications are awarded by the CIPD but taught through external study
              centres, and assessments are almost always written assignments rather than
              exams. That means success depends as much on understanding briefs, structure and
              referencing as it does on HR knowledge itself.
            </p>
            <p>
              That&apos;s where we come in. <strong>CIPD Guidance</strong> is
              an independent academic support service built specifically for CIPD learners. We
              provide coaching, review, editing and assessment guidance, helping you interpret
              your brief, plan a criteria-led response, sharpen your referencing and improve
              drafts and resubmissions.
            </p>
            <p>
              Many of our learners are balancing a demanding HR role, family life and study at
              the same time. Others are studying in the UAE or internationally and want support
              that reflects UK-style academic expectations. Whatever your situation, our aim is
              the same: to make your assessment clearer, your writing stronger and your
              submission more confident.
            </p>
            <h2>How we work</h2>
            <p>
              We&apos;re a guidance and review service, not an essay mill. We don&apos;t sell
              guaranteed grades and we don&apos;t encourage academic misconduct. Instead, we
              help you understand what&apos;s being asked and produce your best authentic work,
              in line with your study centre&apos;s academic integrity policy.
            </p>
          </div>

          {/* Stats / highlights */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-mist-200 bg-mist-50 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-600">
                At a glance
              </h3>
              <dl className="mt-4 space-y-4">
                {[
                  { k: "Levels supported", v: "CIPD 3, 5 & 7" },
                  { k: "Clients", v: "Worldwide · deep UK & Gulf expertise" },
                  { k: "Referencing style", v: "Harvard" },
                  { k: "Approach", v: "Ethical & confidential" },
                ].map((row) => (
                  <div key={row.k} className="flex items-center justify-between border-b border-mist-200 pb-3 last:border-0 last:pb-0">
                    <dt className="text-sm text-navy-600">{row.k}</dt>
                    <dd className="text-sm font-semibold text-navy-900">{row.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rounded-3xl border border-teal-200 bg-white p-6 shadow-card">
              <Icon name="originality" className="h-7 w-7 text-teal-600" />
              <p className="mt-3 text-sm leading-relaxed text-navy-600">{integrityNotice}</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Values */}
      <Section tone="mist">
        <SectionHeading
          eyebrow="What we stand for"
          title="Principles that shape every enquiry"
        />
        <div className="grid gap-6 sm:grid-cols-2">
          {values.map((v) => (
            <div key={v.title} className="card card-hover flex gap-4">
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-navy-900 text-gold-400">
                <Icon name={v.icon} className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-navy-900">{v.title}</h3>
                <p className="mt-1.5 body-copy text-sm">{v.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Why choose us */}
      <Section tone="white">
        <SectionHeading
          eyebrow="Why learners trust us"
          title="Support designed around your success"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {whyChooseUs.map((item) => (
            <div key={item.title} className="rounded-2xl border border-mist-200 bg-mist-50 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                <Icon name="check" className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-navy-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
