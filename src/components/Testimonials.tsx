import { Section, SectionHeading } from "@/components/ui";
import { testimonials } from "@/content/testimonials";

/**
 * Social proof block (AUDIT item 11) — real, owner-supplied Fiverr reviews
 * (see src/content/testimonials.ts for the sourcing rules). Visual only:
 * deliberately NO review/aggregateRating structured data.
 */

function Stars() {
  return (
    <div className="flex gap-0.5 text-gold-500" aria-label="5 out of 5 stars">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
          <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.29 3.95a1 1 0 0 0 .95.7h4.16c.97 0 1.37 1.24.59 1.81l-3.37 2.45a1 1 0 0 0-.36 1.12l1.28 3.95c.3.92-.75 1.69-1.54 1.12l-3.36-2.44a1 1 0 0 0-1.18 0l-3.36 2.44c-.79.57-1.84-.2-1.54-1.12l1.28-3.95a1 1 0 0 0-.36-1.12L2.06 9.39c-.78-.57-.38-1.81.59-1.81h4.16a1 1 0 0 0 .95-.7l1.29-3.95Z" />
        </svg>
      ))}
    </div>
  );
}

export function Testimonials({
  count = 6,
  tone = "white",
}: {
  count?: number;
  tone?: "white" | "mist";
}) {
  const shown = testimonials.slice(0, count);
  return (
    <Section tone={tone}>
      <SectionHeading
        eyebrow="What clients say"
        title="Trusted by CIPD learners worldwide"
        intro="Genuine 5-star reviews from our long-running Fiverr support service, where this practice began. Usernames withheld for client privacy."
      />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((t, i) => (
          <figure key={i} className="flex flex-col rounded-3xl border border-mist-200 bg-white p-6 shadow-soft">
            <Stars />
            <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-navy-700">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-4 border-t border-mist-100 pt-3 text-xs font-medium text-navy-500">
              Verified {t.source} client · {t.country}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
