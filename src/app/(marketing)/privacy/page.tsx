import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy & Data Handling",
  description:
    "How CIPD Guidance handles your enquiry details, assessment documents, email notifications and analytics, including retention and deletion requests.",
  alternates: { canonical: "/privacy" },
};

/**
 * Honest, plain-English privacy statement (P1.12). Factual descriptions of
 * what the site actually does — no fabricated legal guarantees. Update this
 * page whenever data handling changes (it is referenced from the footer and
 * the enquiry funnel).
 */
export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacy"
        breadcrumb="Privacy"
        title="Privacy and data handling"
        intro="A plain-English explanation of what we collect, why, and how long we keep it."
      />
      <Section tone="white">
        <div className="rich-text mx-auto max-w-3xl">
          <h2>What we collect and why</h2>
          <p>
            When you send an assessment enquiry, we collect the details you provide: your name,
            email address, WhatsApp number if you share it, country, CIPD level, unit, deadline,
            word count and your description of the support you need. We use this information
            only to review your enquiry, respond to you, and prepare a quote.
          </p>

          <h2>Assessment documents</h2>
          <p>
            If you upload documents (an assessment brief, a draft, or assessor feedback), they
            are stored in a private file store (Vercel Blob). The documents are not publicly
            accessible; they can only be retrieved through our own authenticated systems, and
            are accessed only by us to review your enquiry. Only upload documents relevant to
            your enquiry, and remove unnecessary personal or confidential workplace information
            where possible.
          </p>

          <h2>Email notifications</h2>
          <p>
            Your enquiry is delivered to us as an internal email through Resend, our email
            provider. If you request our free checklist, your email address is stored with
            Resend so we can provide the resource and occasional CIPD study tips; you can
            unsubscribe at any time.
          </p>

          <h2>Analytics</h2>
          <p>
            We use Vercel Web Analytics to understand how the site is used (pages viewed,
            buttons clicked). Analytics never receives your name, email address, phone number,
            documents or the text of your enquiry.
          </p>

          <h2>Retention and deletion</h2>
          <p>
            Enquiry emails are retained as our record of your enquiry. Uploaded documents for
            enquiries that do not proceed are deleted periodically, normally within 90 days.
            You can ask us to delete your enquiry details and documents at any time by
            messaging us on WhatsApp or emailing us, and we will do so.
          </p>

          <h2>What we don&apos;t do</h2>
          <p>
            We do not sell or share your information with third parties for marketing. We do
            not use your documents for anything other than reviewing your enquiry and providing
            the support you request.
          </p>
        </div>
      </Section>
    </>
  );
}
