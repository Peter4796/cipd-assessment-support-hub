import { ButtonLink } from "@/components/ui";
import { whatsappLink, cta } from "@/lib/site";

/** Reusable conversion band — drop into the bottom of any page. */
export function CtaBand({
  title = "Send your assessment brief today and receive a clear quote",
  subtitle = "Tell us your level, deadline and word count. We'll reply quickly with a transparent quote and a simple support plan, with no obligation.",
  primaryHref = "/contact",
  primaryLabel = cta.sendBrief,
}: {
  title?: string;
  subtitle?: string;
  primaryHref?: string;
  primaryLabel?: string;
}) {
  return (
    <section className="section-sm bg-white">
      <div className="container-px">
        <div className="relative overflow-hidden rounded-3xl bg-navy-900 px-6 py-14 text-center sm:px-12">
          {/* Decorative accents */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold-500/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-teal-500/10 blur-2xl" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{title}</h2>
            <p className="mt-4 text-lg leading-relaxed text-navy-200">{subtitle}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href={primaryHref} variant="primary" withArrow>
                {primaryLabel}
              </ButtonLink>
              <ButtonLink href={whatsappLink()} variant="whatsapp" external>
                {cta.whatsapp}
              </ButtonLink>
            </div>
            <p className="mt-5 text-sm text-navy-400">
              Confidential · UK &amp; UAE · CIPD Level 3, 5 &amp; 7
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
