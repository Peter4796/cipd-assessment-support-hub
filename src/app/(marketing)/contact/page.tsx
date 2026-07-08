import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { EnquiryForm } from "@/components/EnquiryForm";
import { site, whatsappLink, emailLink, integrityNotice } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact: Send Your CIPD Assessment Brief",
  description:
    "Contact CIPD Guidance. Send your assessment brief, deadline and word count via WhatsApp, email or our enquiry form for a fast, confidential quote.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        breadcrumb="Contact"
        title="Send your assessment brief for a free quote"
        intro="Share your CIPD level, deadline and word count and we'll reply quickly with a clear, no-obligation quote. Prefer to chat first? Message us on WhatsApp."
      />

      <Section tone="mist">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          {/* Contact options */}
          <div className="space-y-4">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="card card-hover flex items-center gap-4"
            >
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-[#25D366] text-white">
                <Icon name="whatsapp" className="h-6 w-6" />
              </span>
              <div>
                <p className="font-semibold text-navy-900">Chat on WhatsApp</p>
                <p className="text-sm text-navy-600">{site.contact.whatsappDisplay}</p>
              </div>
            </a>

            <a href={emailLink()} className="card card-hover flex items-center gap-4">
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-navy-900 text-gold-400">
                <Icon name="feedback" className="h-6 w-6" />
              </span>
              <div>
                <p className="font-semibold text-navy-900">Email us</p>
                <p className="text-sm text-navy-600">{site.contact.email}</p>
              </div>
            </a>

            <div className="card">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-600">
                Serving learners across
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {site.markets.map((m) => (
                  <span key={m} className="chip">
                    <Icon name="check" className="h-3.5 w-3.5 text-gold-500" />
                    {m}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-navy-600">
                We work across UK and Gulf time zones and reply quickly, including around tight
                deadlines.
              </p>
            </div>

            <div className="rounded-2xl border border-teal-200 bg-white p-5">
              <p className="text-sm leading-relaxed text-navy-600">
                <span className="font-semibold text-teal-700">Confidential: </span>
                {integrityNotice}
              </p>
            </div>
          </div>

          {/* Form */}
          <div>
            <EnquiryForm />
          </div>
        </div>
      </Section>
    </>
  );
}
