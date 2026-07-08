import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { CtaBand } from "@/components/Cta";
import { unitsByLevel } from "@/content/units";

export const metadata: Metadata = {
  title: "CIPD Unit Assignment Support (Level 3, 5 & 7)",
  description:
    "Assignment support for CIPD units across Levels 3, 5 and 7, including 5CO01, 5HR01, 7CO01 and more. Brief analysis, structure, referencing and draft review for each unit.",
};

const levelName: Record<string, string> = {
  "3": "Level 3 Foundation Certificate",
  "5": "Level 5 Associate Diploma",
  "7": "Level 7 Advanced Diploma",
};

export default function CipdUnitsPage() {
  return (
    <>
      <PageHero
        eyebrow="CIPD units"
        breadcrumb="CIPD Units"
        title="Assignment support for every CIPD unit"
        intro="Find support tailored to your specific CIPD unit. We help with brief analysis, structure, referencing and draft review across Level 3, 5 and 7 units."
      />

      <Section tone="white">
        <div className="space-y-12">
          {unitsByLevel.map((group) => (
            <div key={group.level}>
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-900 font-bold text-gold-400">
                  L{group.level}
                </span>
                <h2 className="text-xl font-bold text-navy-900">{levelName[group.level]}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.units.map((u) => (
                  <Link
                    key={u.slug}
                    href={`/cipd-units/${u.slug}`}
                    className="card card-hover group flex flex-col"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-navy-900">{u.code}</span>
                      <Icon name="arrow" className="h-4 w-4 text-navy-300 group-hover:text-gold-600" />
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-navy-900 group-hover:text-gold-600">
                      {u.title}
                    </h3>
                    <p className="mt-1.5 flex-1 text-xs leading-relaxed text-navy-600">{u.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-3xl rounded-2xl border border-mist-200 bg-mist-50 p-5 text-center text-sm text-navy-600">
          Studying a unit not listed here? We support the full CIPD syllabus. Send us your unit code
          and brief for a quote.
        </p>
      </Section>

      <CtaBand />
    </>
  );
}
