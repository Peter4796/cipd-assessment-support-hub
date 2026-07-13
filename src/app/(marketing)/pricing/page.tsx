import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Section, ButtonLink } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { CtaBand } from "@/components/Cta";
import { pricingPackages } from "@/content/site-content";
import { whatsappLink, cta } from "@/lib/site";
import { enquiryUrl } from "@/lib/leads/context";

export const metadata: Metadata = {
  title: "Pricing: CIPD Assessment Support Packages",
  description:
    "Flexible CIPD assessment support packages: Brief Review & Structure, Draft Review & Improvement, and a Full Assessment Guidance Package. Request a tailored quote.",
  alternates: { canonical: "/pricing" },
};

const factors = ["CIPD level", "Word count", "Deadline", "Complexity of the brief"];

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        breadcrumb="Pricing"
        title="Flexible packages, priced around your assessment"
        intro="Every CIPD assessment is different, so we quote each one individually. Choose the package that fits where you are, and we'll send a clear, no-obligation quote."
      />

      {/* Packages */}
      <Section tone="white">
        <div className="grid gap-6 lg:grid-cols-3">
          {pricingPackages.map((pkg) => (
            <div
              key={pkg.name}
              className={`relative flex flex-col rounded-3xl border p-7 shadow-card transition-all ${
                pkg.featured
                  ? "border-gold-300 bg-navy-900 text-white ring-1 ring-gold-300"
                  : "border-mist-200 bg-white"
              }`}
            >
              {pkg.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-gold-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-navy-900">
                  Most popular
                </span>
              )}
              <h2
                className={`text-xl font-bold ${pkg.featured ? "text-white" : "text-navy-900"}`}
              >
                {pkg.name}
              </h2>
              <p
                className={`mt-1 text-sm font-medium ${
                  pkg.featured ? "text-gold-300" : "text-teal-600"
                }`}
              >
                {pkg.best}
              </p>
              <p
                className={`mt-4 text-sm leading-relaxed ${
                  pkg.featured ? "text-navy-200" : "text-navy-600"
                }`}
              >
                {pkg.description}
              </p>

              <div
                className={`mt-6 border-t pt-6 ${
                  pkg.featured ? "border-white/10" : "border-mist-200"
                }`}
              >
                <p
                  className={`text-3xl font-bold ${
                    pkg.featured ? "text-white" : "text-navy-900"
                  }`}
                >
                  Custom quote
                </p>
                <p
                  className={`mt-1 text-xs ${
                    pkg.featured ? "text-navy-300" : "text-navy-500"
                  }`}
                >
                  Based on your level, word count &amp; deadline
                </p>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span
                      className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full ${
                        pkg.featured
                          ? "bg-gold-500/20 text-gold-300"
                          : "bg-teal-100 text-teal-700"
                      }`}
                    >
                      <Icon name="check" className="h-3.5 w-3.5" />
                    </span>
                    <span
                      className={`text-sm ${pkg.featured ? "text-navy-100" : "text-navy-700"}`}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                {pkg.featured ? (
                  <ButtonLink href={enquiryUrl({ cta: "mid_page" })} variant="primary" className="w-full" withArrow>
                    {cta.requestQuote}
                  </ButtonLink>
                ) : (
                  <ButtonLink href={enquiryUrl({ cta: "mid_page" })} variant="outline" className="w-full">
                    {cta.requestQuote}
                  </ButtonLink>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Why quote-based */}
        <div className="mx-auto mt-14 max-w-3xl rounded-3xl border border-mist-200 bg-mist-50 p-8 text-center">
          <h2 className="text-2xl font-bold text-navy-900">Why we quote each assessment</h2>
          <p className="mt-3 body-copy">
            A fair price depends on the specifics of your assessment. We look at:
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {factors.map((f) => (
              <span key={f} className="chip">
                <Icon name="check" className="h-3.5 w-3.5 text-gold-500" />
                {f}
              </span>
            ))}
          </div>
          <p className="mt-6 text-sm text-navy-500">
            Send your brief and deadline and we&apos;ll reply quickly with a transparent quote,
            no obligation, and no pressure.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href={enquiryUrl({ cta: "mid_page" })} variant="navy" withArrow>
              {cta.sendBrief}
            </ButtonLink>
            <ButtonLink href={whatsappLink()} variant="whatsapp" external>
              {cta.whatsapp}
            </ButtonLink>
          </div>
        </div>
      </Section>

      <CtaBand
        title="Ready for your tailored quote?"
        subtitle="Tell us your CIPD level, word count and deadline. We'll match you to the right package and send a clear quote."
        primaryLabel={cta.requestQuote}
      />
    </>
  );
}
