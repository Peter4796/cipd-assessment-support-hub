/**
 * Client testimonials — REAL reviews only, owner-supplied (2026-07-17) from
 * the long-running Fiverr CIPD support service that preceded this site.
 *
 * Rules:
 *  - Never invent, embellish or paraphrase beyond the marked edits below.
 *    Light trims and bracketed substitutions (removing the tutor's first
 *    name, which would mean nothing to site visitors) are the only changes.
 *  - Reviewer usernames are withheld for privacy; country shown as displayed
 *    on the public review.
 *  - NO review/aggregateRating structured data anywhere (self-serving review
 *    markup violates search guidelines; the block is for humans).
 */

export type Testimonial = {
  quote: string;
  country: string;
  source: "Fiverr";
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "She did an excellent job on my CIPD assessment, followed the requirements carefully, and delivered high-quality work. I would definitely recommend her and work with her again.",
    country: "United States",
    source: "Fiverr",
  },
  {
    quote:
      "The work is just impeccable. Truly a professional and a real pleasure to work with. The work is flawless, well written and is exactly what she promised to deliver. Thank you!",
    country: "United Kingdom",
    source: "Fiverr",
  },
  {
    quote: "Deeply knowledgeable and amazing to work with!",
    country: "Saudi Arabia",
    source: "Fiverr",
  },
  {
    quote:
      "Her quality work is commendable, and her cooperative nature ensured everything was delivered on time. Thank you for the excellent work!",
    country: "United States",
    source: "Fiverr",
  },
  {
    quote:
      "Her research skills are impeccable, and the quality of her work never disappoints!",
    country: "United States",
    source: "Fiverr",
  },
  {
    quote:
      "Thank you very much for such an amazing work. It was a pleasure working with you and will definitely come back again, thanks.",
    country: "United States",
    source: "Fiverr",
  },
];
