import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { CtaBand } from "@/components/Cta";
import { samples } from "@/content/site-content";

export const metadata: Metadata = {
  title: "Samples & Work Quality",
  description:
    "See the standard of our CIPD assessment support: example introduction, criteria mapping table, Harvard reference formatting and tutor-feedback improvement notes. Quality demonstration only.",
};

// Illustrative criteria-mapping rows (anonymised, for demonstration only)
const criteriaRows = [
  { ac: "AC 1.1", task: "Explain the purpose of the report", where: "Introduction", status: "Covered" },
  { ac: "AC 2.1", task: "Analyse two reward approaches", where: "Section 2, p.4", status: "Covered" },
  { ac: "AC 2.2", task: "Evaluate suitability for the organisation", where: "Section 2, p.5", status: "Covered" },
  { ac: "AC 3.1", task: "Recommend an approach with justification", where: "Recommendations", status: "Covered" },
];

export default function SamplesPage() {
  return (
    <>
      <PageHero
        eyebrow="Samples & work quality"
        breadcrumb="Samples"
        title="See the standard we help you reach"
        intro="These short sample sections show the clarity, structure and referencing standard our support helps you achieve. They are illustrative extracts, not full assignments."
      />

      <Section tone="white">
        <div className="mx-auto max-w-4xl space-y-8">
          {samples.map((sample) => (
            <article key={sample.id} className="card">
              <div className="flex items-center gap-3">
                <span className="chip border-teal-200 bg-teal-50 text-teal-700">
                  {sample.label}
                </span>
              </div>
              <h2 className="mt-4 text-xl font-bold text-navy-900">{sample.title}</h2>
              <p className="mt-2 body-copy text-sm">{sample.intro}</p>

              {/* Body — table for criteria mapping, monospace block for others */}
              {sample.body === "TABLE" ? (
                <div className="mt-5 overflow-x-auto rounded-2xl border border-mist-200">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="bg-mist-100 text-navy-800">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Criterion</th>
                        <th className="px-4 py-3 font-semibold">Task requirement</th>
                        <th className="px-4 py-3 font-semibold">Where addressed</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-mist-200">
                      {criteriaRows.map((row) => (
                        <tr key={row.ac} className="bg-white">
                          <td className="px-4 py-3 font-semibold text-navy-900">{row.ac}</td>
                          <td className="px-4 py-3 text-navy-600">{row.task}</td>
                          <td className="px-4 py-3 text-navy-600">{row.where}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-700">
                              <Icon name="check" className="h-3 w-3" />
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-5 whitespace-pre-line rounded-2xl border border-mist-200 bg-mist-50 p-5 text-sm leading-relaxed text-navy-700">
                  {sample.body}
                </div>
              )}
            </article>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-gold-200 bg-gold-50 p-5">
          <p className="flex items-start gap-3 text-sm leading-relaxed text-navy-700">
            <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gold-500 text-navy-900">
              <Icon name="originality" className="h-4 w-4" />
            </span>
            <span>
              <strong className="text-navy-900">Disclaimer: </strong>
              These samples are provided for quality demonstration only. They are short,
              anonymised illustrative extracts, not complete assignments, and not for
              submission. All support we provide is intended to help you produce and submit your
              own original work in line with your study centre&apos;s academic integrity policy.
            </span>
          </p>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
