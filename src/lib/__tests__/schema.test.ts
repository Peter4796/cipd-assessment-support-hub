import { describe, expect, it } from "vitest";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  faqPairsFromBlocks,
  ORGANIZATION_ID,
  organizationJsonLd,
  serviceJsonLd,
} from "@/lib/schema";
import type { Block } from "@/content/types";

describe("organizationJsonLd", () => {
  const org = organizationJsonLd();

  it("is a well-formed Organization with canonical HTTPS URLs", () => {
    expect(org["@type"]).toBe("Organization");
    expect(org["@id"]).toBe("https://www.cipdguidance.com/#organization");
    expect(org.url).toBe("https://www.cipdguidance.com");
    expect(org.logo).toBe("https://www.cipdguidance.com/logo.png");
  });

  it("never fabricates ratings or reviews", () => {
    const json = JSON.stringify(org);
    for (const banned of ['"aggregateRating"', '"review"', '"ratingValue"']) {
      expect(json).not.toContain(banned);
    }
  });
});

describe("breadcrumbJsonLd", () => {
  it("builds sequential positions with absolute URLs", () => {
    const bc = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: "A Post", path: "/blog/a-post" },
    ]);
    expect(bc["@type"]).toBe("BreadcrumbList");
    expect(bc.itemListElement.map((i) => i.position)).toEqual([1, 2, 3]);
    expect(bc.itemListElement[2].item).toBe("https://www.cipdguidance.com/blog/a-post");
  });
});

describe("serviceJsonLd", () => {
  it("references the shared Organization node as provider", () => {
    const svc = serviceJsonLd({
      name: "CIPD Level 5 Support",
      description: "Guidance for Associate Diploma learners.",
      path: "/cipd-level-5-support",
      serviceType: "CIPD Level 5 assessment support",
    });
    expect(svc["@type"]).toBe("Service");
    expect(svc.provider).toEqual({ "@id": ORGANIZATION_ID });
    expect(svc.url).toBe("https://www.cipdguidance.com/cipd-level-5-support");
  });
});

describe("faqPairsFromBlocks", () => {
  const faqBody: Block[] = [
    { type: "p", text: "Intro paragraph that is not an answer." },
    { type: "h3", text: "Can I use my own organisation?" },
    { type: "p", text: "Yes, and it is usually the best approach." },
    { type: "p", text: "A second answer paragraph." },
    { type: "h3", text: "How many words is it?" },
    { type: "p", text: "Word counts vary by centre." },
    { type: "callout", text: "A callout that is presentation, not answer text." },
    { type: "h2", text: "A closing section" },
    { type: "p", text: "Text after an h2 is not an answer." },
  ];

  it("pairs each h3 with its following paragraphs", () => {
    expect(faqPairsFromBlocks(faqBody)).toEqual([
      {
        question: "Can I use my own organisation?",
        answer: "Yes, and it is usually the best approach. A second answer paragraph.",
      },
      { question: "How many words is it?", answer: "Word counts vary by centre." },
    ]);
  });

  it("returns [] for non-FAQ structures", () => {
    expect(
      faqPairsFromBlocks([
        { type: "h2", text: "Ordinary article" },
        { type: "p", text: "Ordinary paragraph." },
      ])
    ).toEqual([]);
  });

  it("drops a trailing question with no answer", () => {
    expect(
      faqPairsFromBlocks([
        { type: "h3", text: "Unanswered?" },
      ])
    ).toEqual([]);
  });
});

describe("faqJsonLd", () => {
  it("maps pairs to Question/Answer entities", () => {
    const faq = faqJsonLd([{ question: "Q?", answer: "A." }]);
    expect(faq["@type"]).toBe("FAQPage");
    expect(faq.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "Q?",
      acceptedAnswer: { "@type": "Answer", text: "A." },
    });
  });
});
