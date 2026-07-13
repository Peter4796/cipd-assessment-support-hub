import { TrackedLink } from "@/components/track/TrackedLink";
import { Icon } from "@/components/Icon";
import { whatsappLink, cta } from "@/lib/site";

/**
 * Reusable conversion band — drop into the bottom of any page.
 * Pass `location` so clicks are attributable ("article" fires
 * article_cta_clicked; everything else fires service_cta_clicked).
 * Pass `primaryHref` (e.g. from enquiryUrl()) to carry page context into the
 * enquiry form.
 */
export function CtaBand({
  title = "Send your assessment details today and receive a clear quote",
  subtitle = "Tell us your level, deadline and word count. We'll reply quickly with a transparent quote and a simple support plan, with no obligation.",
  primaryHref = "/contact",
  primaryLabel = cta.sendBrief,
  location = "cta_band",
}: {
  title?: string;
  subtitle?: string;
  primaryHref?: string;
  primaryLabel?: string;
  location?: string;
}) {
  const primaryEvent = location === "article" ? "article_cta_clicked" : "service_cta_clicked";

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
              <TrackedLink
                href={primaryHref}
                event={primaryEvent}
                eventProps={{ location }}
                className="btn-primary"
              >
                {primaryLabel}
                <Icon name="arrow" className="h-4 w-4" />
              </TrackedLink>
              <TrackedLink
                href={whatsappLink()}
                external
                event="whatsapp_clicked"
                eventProps={{ location }}
                className="btn-whatsapp"
              >
                <Icon name="whatsapp" className="h-4 w-4" />
                {cta.whatsapp}
              </TrackedLink>
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
