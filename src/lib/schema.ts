/**
 * Shared JSON-LD builders (AUDIT item 10) — pure, testable, one source of
 * truth for structured data. Rendered via <JsonLd/>.
 *
 * Honesty rules: no fabricated ratings/reviews/aggregate scores, ever; only
 * facts already public on the site (schema.org markup is a claim to search
 * engines). All URLs are canonical HTTPS via src/lib/urls.ts.
 */

import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/urls";
import type { Block } from "@/content/types";

/** Stable @id so every page's schema references one Organization node. */
export const ORGANIZATION_ID = `${site.url}/#organization`;

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: site.name,
    url: site.url,
    logo: absoluteUrl("/logo.png"),
    description:
      "Ethical CIPD assessment support: guidance, coaching, draft review, editing, Harvard referencing and resubmission support for Level 3, 5 and 7 learners.",
    email: site.contact.email,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: site.contact.whatsappDisplay,
      email: site.contact.email,
      availableLanguage: "English",
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function serviceJsonLd(input: {
  name: string;
  description: string;
  path: string;
  serviceType?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    serviceType: input.serviceType ?? "Academic support",
    provider: { "@id": ORGANIZATION_ID },
  };
}

export function faqJsonLd(pairs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pairs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/**
 * Derive FAQ pairs from a post body written in the FAQ pattern: each `###`
 * heading is a question, answered by the paragraph blocks that follow it
 * (callouts/lists are presentation, not answer text). Returns [] when the
 * structure doesn't hold, so callers can skip the schema safely.
 */
export function faqPairsFromBlocks(blocks: Block[]): Array<{ question: string; answer: string }> {
  const pairs: Array<{ question: string; answer: string }> = [];
  let question: string | null = null;
  let answer: string[] = [];
  const flush = () => {
    if (question && answer.length > 0) pairs.push({ question, answer: answer.join(" ") });
    question = null;
    answer = [];
  };
  for (const block of blocks) {
    if (block.type === "h3") {
      flush();
      question = block.text;
    } else if (block.type === "h2") {
      flush();
    } else if (block.type === "p" && question) {
      answer.push(block.text);
    }
  }
  flush();
  return pairs;
}
