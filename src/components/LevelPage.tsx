import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Section, SectionHeading, CheckList, ButtonLink } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { CtaBand } from "@/components/Cta";
import { levels, type Level } from "@/content/levels";
import { units } from "@/content/units";
import { postsForPillar } from "@/content/posts";
import { enquiryUrl } from "@/lib/leads/context";
import { cta } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/schema";
import { Testimonials } from "@/components/Testimonials";

/** Shared template rendering a single CIPD level support page. */
export function LevelPage({ level }: { level: Level }) {
  const others = levels.filter((l) => l.slug !== level.slug);
  const longName =
    level.number === "3" ? "Foundation" : level.number === "5" ? "Associate Diploma" : "Advanced Diploma";

  return (
    <>
      <JsonLd
        data={serviceJsonLd({
          name: level.title,
          description: level.summary,
          path: `/${level.slug}`,
          serviceType: `CIPD Level ${level.number} assessment support`,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: `Level ${level.number} Support`, path: `/${level.slug}` },
        ])}
      />
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

      {/* Down-links (P1.3): the units and guides this level page anchors.
          Level pages are pillar targets; without these links authority
          arrived here and stopped. */}
      <Section tone="white">
        <SectionHeading
          eyebrow={`Level ${level.number} in depth`}
          title={`Your Level ${level.number} units and guides`}
          intro="Unit-by-unit support pages and free study guidance for this level."
        />
        <div className="flex flex-wrap gap-3">
          {units
            .filter((u) => u.level === level.number)
            .map((u) => (
              <Link
                key={u.slug}
                href={`/cipd-units/${u.slug}`}
                className="group inline-flex items-center gap-2 rounded-full border border-mist-300 bg-white px-4 py-2 text-sm font-semibold text-navy-800 transition-colors hover:border-gold-400 hover:text-gold-600"
              >
                <span className="font-mono text-xs text-teal-600">{u.code}</span>
                {u.title}
                <Icon name="arrow" className="h-3.5 w-3.5 text-navy-400 group-hover:text-gold-600" />
              </Link>
            ))}
        </div>
        {postsForPillar(`/${level.slug}`).length > 0 && (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {postsForPillar(`/${level.slug}`).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="card card-hover group flex flex-col">
                <span className="chip border-mist-300 bg-white text-navy-600">{post.category}</span>
                <h3 className="mt-3 text-base font-bold text-navy-900 group-hover:text-gold-600">
                  {post.title}
                </h3>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700">
                  Read the guide <Icon name="arrow" className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        )}
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

      <Testimonials count={3} tone="mist" />

      <CtaBand primaryHref={enquiryUrl({ level: level.number })} location="level" />
    </>
  );
}
