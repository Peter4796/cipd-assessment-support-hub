import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Section, SectionHeading } from "@/components/ui";
import { Testimonials } from "@/components/Testimonials";
import { Icon } from "@/components/Icon";
import { CtaBand } from "@/components/Cta";
import { homeServices, whyChooseUs } from "@/content/services";
import { levels } from "@/content/levels";
import { trustPoints, problemPoints } from "@/content/site-content";
import { whatsappLink, cta, integrityNotice } from "@/lib/site";
import { enquiryUrl } from "@/lib/leads/context";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-navy-900">
        <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-gold-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="container-px relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold-300">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
              Ethical CIPD academic support
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
              Professional CIPD Assessment Support for{" "}
              <span className="text-gold-400">Learners Worldwide</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-200">
              Get expert guidance with CIPD Level 3, Level 5 and Level 7 assessments, from
              brief analysis and structure to referencing, editing and resubmission support. Particular expertise supporting students and professionals across the UK and Gulf region.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={enquiryUrl({ cta: "hero" })} variant="primary" withArrow>
                {cta.sendBrief}
              </ButtonLink>
              <ButtonLink href="/pricing" variant="ghost-light">
                {cta.getQuote}
              </ButtonLink>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-navy-300">
              <span className="flex items-center gap-2">
                <Icon name="check" className="h-4 w-4 text-teal-400" /> Confidential &amp; discreet
              </span>
              <span className="flex items-center gap-2">
                <Icon name="check" className="h-4 w-4 text-teal-400" /> Fast WhatsApp replies
              </span>
              <span className="flex items-center gap-2">
                <Icon name="check" className="h-4 w-4 text-teal-400" /> Criteria-focused
              </span>
            </div>
          </div>

          {/* Hero card */}
          <div className="animate-fade-up lg:justify-self-end">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-card-hover backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-wider text-gold-300">
                What we help with
              </p>
              <div className="mt-4 space-y-3">
                {[
                  "Decode your assessment brief & command verbs",
                  "Map every task to the marking criteria",
                  "Structure a clear, criteria-led response",
                  "Fix Harvard referencing & citations",
                  "Strengthen a draft or a resubmission",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-xl bg-white/5 p-3"
                  >
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-teal-400/20 text-teal-300">
                      <Icon name="check" className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm text-navy-100">{item}</span>
                  </div>
                ))}
              </div>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp mt-5 w-full"
              >
                <Icon name="whatsapp" className="h-4 w-4" />
                {cta.whatsapp}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust strip ─── */}
      <div className="border-y border-mist-200 bg-mist-50">
        <div className="container-px flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5 text-center">
          {trustPoints.map((point) => (
            <span
              key={point}
              className="flex items-center gap-2 text-sm font-medium text-navy-700"
            >
              <Icon name="check" className="h-4 w-4 text-gold-500" />
              {point}
            </span>
          ))}
        </div>
      </div>

      {/* ─── Problem section ─── */}
      <Section tone="white">
        <SectionHeading
          eyebrow="Sound familiar?"
          title="CIPD assessments are demanding, especially alongside a full-time role"
          intro="Most learners don't struggle because they lack ability. They struggle with unclear briefs, tight deadlines and academic conventions. That's exactly where we help."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {problemPoints.map((p) => (
            <div key={p.title} className="card card-hover">
              <h3 className="text-lg font-semibold text-navy-900">{p.title}</h3>
              <p className="mt-2 body-copy text-sm">{p.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Services overview ─── */}
      <Section tone="mist" id="services">
        <SectionHeading
          eyebrow="How we support you"
          title="End-to-end CIPD assessment guidance"
          intro="Pick the support you need, or combine several. Everything maps back to your unit's learning outcomes and assessment criteria."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {homeServices.map((s) => (
            <div key={s.title} className="card card-hover">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-gold-400">
                <Icon name={s.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-navy-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-navy-600">{s.short}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <ButtonLink href="/services" variant="outline" withArrow>
            Explore all services
          </ButtonLink>
        </div>
      </Section>

      {/* ─── Level cards ─── */}
      <Section tone="white">
        <SectionHeading
          eyebrow="Support by qualification"
          title="Specialist support for every CIPD level"
          intro="From Foundation to Advanced Diploma, our guidance matches the depth and expectations of your qualification."
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {levels.map((level) => (
            <Link
              key={level.slug}
              href={`/${level.slug}`}
              className="card card-hover group flex flex-col"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 text-lg font-bold text-gold-400">
                  L{level.number}
                </span>
                <span className="chip">{level.name}</span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-navy-900">
                Level {level.number}{" "}
                {level.number === "3"
                  ? "Foundation"
                  : level.number === "5"
                  ? "Associate"
                  : "Advanced"}{" "}
                support
              </h3>
              <p className="mt-1 text-sm font-medium text-teal-600">{level.audience}</p>
              <p className="mt-3 flex-1 body-copy text-sm">{level.summary}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 group-hover:gap-2.5 group-hover:text-gold-600">
                Learn more <Icon name="arrow" className="h-4 w-4 transition-all" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* ─── Why choose us ─── */}
      <Section tone="navy">
        <SectionHeading
          eyebrow="Why learners choose us"
          title="Trusted, discreet, expert-led support"
          intro="We combine real people-practice knowledge with an understanding of UK-style academic expectations."
          invert
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {whyChooseUs.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15 text-gold-300">
                <Icon name="check" className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-200">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Social proof ─── */}
      <Testimonials />

      {/* ─── Ethical support notice ─── */}
      <Section tone="mist">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl border border-teal-200 bg-white p-8 shadow-card sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                <Icon name="originality" className="h-7 w-7" />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-navy-900">
                  Ethical, integrity-first support
                </h2>
                <p className="mt-3 leading-relaxed text-navy-600">{integrityNotice}</p>
                <p className="mt-3 text-sm leading-relaxed text-navy-500">
                  We coach, review, edit and guide. We don&apos;t offer guaranteed grades or
                  encourage academic misconduct. Our goal is to help you produce and submit
                  your strongest, most authentic work.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Final CTA ─── */}
      <CtaBand />
    </>
  );
}
