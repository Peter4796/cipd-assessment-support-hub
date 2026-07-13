import type { Metadata } from "next";
import { Suspense } from "react";
import { AssessmentFunnel } from "@/components/funnel/AssessmentFunnel";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Send Your Assessment Brief",
  description:
    "Send your CIPD assessment brief for a fast, confidential quote. Tell us your level, unit and deadline, upload your documents, and we'll respond with the right support option.",
  alternates: { canonical: "/send-your-brief" },
};

const reassurance = [
  "Confidential: your documents are used only to review your enquiry",
  "No obligation: you'll receive a clear quote to consider",
  "Fast replies on WhatsApp and email, UK & UAE time zones",
];

export default function SendYourBriefPage() {
  return (
    <section className="bg-mist-100 py-10 sm:py-14">
      <div className="container-px">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h1 className="text-3xl font-bold text-navy-900 sm:text-4xl">
            Send Your Assessment Brief
          </h1>
          <p className="mt-3 text-navy-600">
            A few quick questions so we can review your assessment properly and respond with the
            right support, usually the same day.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="mx-auto max-w-2xl rounded-3xl border border-mist-200 bg-white p-10 text-center text-sm text-navy-500 shadow-card">
              Loading…
            </div>
          }
        >
          <AssessmentFunnel />
        </Suspense>

        <ul className="mx-auto mt-8 flex max-w-2xl flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6">
          {reassurance.map((r) => (
            <li key={r} className="flex items-center gap-2 text-xs text-navy-500">
              <Icon name="check" className="h-3.5 w-3.5 flex-none text-teal-600" />
              {r}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
