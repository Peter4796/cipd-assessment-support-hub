import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Section, SectionHeading, CheckList, ButtonLink } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { CtaBand } from "@/components/Cta";
import { levels, type Level } from "@/content/levels";
import { enquiryUrl } from "@/lib/leads/context";
import { cta } from "@/lib/site";

/** Shared template rendering a single CIPD level support page. */
export function LevelPage({ level }: { level: Level }) {
  const others = levels.filter((l) => l.slug !== level.slug);
  const longName =
    level.number === "3" ? "Foundation" : level.number === "5" ? "Associate Diploma" : "Advanced Diploma";

  return (
    <>
      <PageHero
        eyebrow={`CIPD Level ${level.number}`}
        breadcrumb={`Level ${level.number} Support`}
        title={level.title}
        intro={level.audience}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={enquiryUrl({ level: level.number })} variant="primary" withArrow>
            {cta.sendBrief}
          </ButtonLink>
          <ButtonLink href="/pricing" variant="ghost-light">
            {cta.getQuote}
          </ButtonLink>
        </div>
      </PageHero>

      {/* Intro + who it's for */}
      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <span className="eyebrow">Level {level.number} · {longName}</span>
            <h2 className="text-3xl font-bold text-navy-900">
              Support built for the {longName.toLowerCase()}
            </h2>
            <p className="mt-4 lead text-navy-700">{level.intro}</p>
          </div>
          <div className="rounded-3xl border border-mist-200 bg-mist-50 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-600">
              Who this is for
            </h3>
            <ul className="mt-4 space-y-3">
              {level.who.map((w) => (
                <li key={w} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-teal-100 text-teal-700">
                    <Icon name="check" className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm text-navy-700">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Focus areas */}
      <Section tone="mist">
        <SectionHeading
          eyebrow="Where we focus"
          title={`What Level ${level.number} really demands`}
          intro={`We shape our support around the skills and expectations that matter most at Level ${level.number}.`}
        />
        <div className="grid gap-6 sm:grid-cols-2">
          {level.focus.map((f) => (
            <div key={f.title} className="card card-hover">
              <h3 className="text-lg font-semibold text-navy-900">{f.title}</h3>
              <p className="mt-2 body-copy text-sm">{f.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* How we help */}
      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="eyebrow">How we help</span>
            <h2 className="text-3xl font-bold text-navy-900">
              Practical support at every stage
            </h2>
            <p className="mt-4 body-copy">
              From the moment you receive your brief to the final review before you submit, our
              Level {level.number} support keeps you focused on what earns marks.
            </p>
            <div className="mt-6">
              <ButtonLink href="/how-it-works" variant="outline" withArrow>
                See how it works
              </ButtonLink>
            </div>
          </div>
          <CheckList items={level.help} className="rounded-3xl border border-mist-200 bg-mist-50 p-6" />
        </div>
      </Section>

      {/* Other levels */}
      <Section tone="mist">
        <SectionHeading eyebrow="Not your level?" title="Explore other CIPD support" />
        <div className="grid gap-6 sm:grid-cols-2">
          {others.map((o) => (
            <Link key={o.slug} href={`/${o.slug}`} className="card card-hover group flex items-center gap-4">
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 font-bold text-gold-400">
                L{o.number}
              </span>
              <div className="flex-1">
                <h3 className="font-bold text-navy-900">{o.title}</h3>
                <p className="mt-0.5 text-sm text-navy-600">{o.summary}</p>
              </div>
              <Icon name="arrow" className="h-5 w-5 text-navy-400 group-hover:text-gold-600" />
            </Link>
          ))}
        </div>
      </Section>

      <CtaBand primaryHref={enquiryUrl({ level: level.number })} location="level" />
    </>
  );
}
