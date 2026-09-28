/**
 * Corpus guard: validates every real post file on every test run — a
 * malformed article fails here (and the loader also fails the production
 * build, so a broken post can never ship silently).
 */

import { describe, expect, it } from "vitest";
import {
  getPost,
  posts,
  postsByDate,
  postsForPillar,
  postsForUnit,
  relatedWithClusterFallback,
} from "@/content/posts";
import { PILLAR_PAGES, resolvePillar } from "@/content/pillars";
import { extractInlineLinks, INLINE_LINK_RE } from "@/lib/content/inline";
import { units } from "@/content/units";
import { faqPairsFromBlocks } from "@/lib/schema";
import type { Post } from "@/content/types";

const textOf = (post: Post) =>
  post.body
    .map((b) => ("text" in b ? b.text : b.items.join(" ")))
    .join(" ");

const wordCount = (post: Post) => textOf(post).split(/\s+/).filter(Boolean).length;

describe("post corpus", () => {
  it("loads the full corpus with unique slugs", () => {
    expect(posts.length).toBeGreaterThanOrEqual(41);
    expect(new Set(posts.map((p) => p.slug)).size).toBe(posts.length);
  });

  it("every related slug points at a real post", () => {
    const slugs = new Set(posts.map((p) => p.slug));
    for (const post of posts) {
      for (const related of post.related) {
        expect(slugs.has(related), `${post.slug} → ${related}`).toBe(true);
      }
    }
  });

  it("unit pillar clusters resolve", () => {
    expect(postsForUnit("5CO01").length).toBeGreaterThanOrEqual(8);
    expect(postsForUnit("5HR01").length).toBeGreaterThanOrEqual(8);
    for (const p of postsForUnit("5CO01")) expect(p.unit).toBe("5CO01");
  });

  it("postsByDate is newest-first and getPost resolves", () => {
    for (let i = 1; i < postsByDate.length; i++) {
      expect(postsByDate[i - 1].date >= postsByDate[i].date).toBe(true);
    }
    expect(getPost(posts[0].slug)).toEqual(posts[0]);
    expect(getPost("no-such-post")).toBeUndefined();
  });

  it("every post has a non-empty body starting sensibly", () => {
    for (const post of posts) {
      expect(post.body.length, post.slug).toBeGreaterThan(3);
      expect(post.description.length, post.slug).toBeGreaterThan(40);
    }
  });

  it("every pillar resolves (no isolated posts)", () => {
    for (const post of posts) {
      const target = resolvePillar(post.pillar, (slug) => getPost(slug)?.title);
      expect(target, `${post.slug} → pillar "${post.pillar}"`).not.toBeNull();
    }
  });

  it("postsForPillar returns the cluster spokes, excluding the hub itself", () => {
    expect(postsForPillar("5CO01").length).toBeGreaterThanOrEqual(8);
    const choosing = postsForPillar("complete-guide-to-cipd-qualifications");
    expect(choosing.length).toBeGreaterThanOrEqual(3);
    expect(choosing.some((p) => p.slug === "complete-guide-to-cipd-qualifications")).toBe(false);
  });

  it("cluster fallback tops related up to 3 without self or duplicates", () => {
    for (const post of posts) {
      const links = relatedWithClusterFallback(post);
      const slugs = links.map((p) => p.slug);
      expect(slugs, post.slug).not.toContain(post.slug);
      expect(new Set(slugs).size, post.slug).toBe(slugs.length);
      const clusterSize = postsForPillar(post.pillar).filter((p) => p.slug !== post.slug).length;
      const reachable = Math.min(3, Math.max(post.related.length, clusterSize));
      expect(links.length, post.slug).toBeGreaterThanOrEqual(reachable);
    }
  });
});

describe("editorial machine gates (Blueprint Part 10)", () => {
  it("no em-dashes anywhere in the corpus (owner voice rule)", () => {
    for (const post of posts) {
      const everything = [post.title, post.description, textOf(post)].join(" ");
      expect(everything.includes("—"), post.slug).toBe(false);
    }
  });

  it("FAQ-slug articles parse into at least 3 FAQ pairs (FAQPage schema)", () => {
    for (const post of posts.filter((p) => p.slug.endsWith("-faqs"))) {
      expect(faqPairsFromBlocks(post.body).length, post.slug).toBeGreaterThanOrEqual(3);
    }
  });

  // Stricter gates for Phase 3 production articles, marked by `reviewed`.
  // The pre-Phase-3 corpus (shorter posts, quoted "AC n.n" examples) is
  // exempt until the monthly refresh sweep stamps it.
  const produced = posts.filter((p) => p.reviewed !== undefined);

  it("reviewed articles respect length bounds (1,200-2,000 standard, hubs longer)", () => {
    for (const post of produced) {
      const words = wordCount(post);
      const isHub = post.slug === post.pillar || post.slug.endsWith("-complete-guide");
      expect(words, `${post.slug}: ${words} words`).toBeGreaterThanOrEqual(1100);
      expect(words, `${post.slug}: ${words} words`).toBeLessThanOrEqual(isHub ? 3200 : 2200);
    }
  });

  it("reviewed articles never reproduce CIPD criteria references (AC n.n)", () => {
    for (const post of produced) {
      expect(/\bAC ?\d\.\d/.test(textOf(post)), post.slug).toBe(false);
    }
  });

  it("reviewed articles close with exactly one guidance CTA paragraph", () => {
    for (const post of produced) {
      const ctas = post.body.filter(
        (b) => b.type === "p" && /\bour [^.]*support\b/i.test(b.text)
      );
      expect(ctas.length, post.slug).toBe(1);
      // Guidance-not-writing framing: the CTA never promises to write.
      expect(/we (write|will write|can write)/i.test(textOf(post)), post.slug).toBe(false);
    }
  });

  it("reviewed articles carry curated related links and tags", () => {
    for (const post of produced) {
      expect(post.related.length, post.slug).toBeGreaterThanOrEqual(2);
      expect(post.tags?.length ?? 0, post.slug).toBeGreaterThanOrEqual(1);
    }
  });
});

// ── Inline internal links (P1.1) ──
// Non-blog routes a body link may target. Keep in sync with the sitemap's
// static list; the gate fails loudly when a link names a route this list
// and the derived sets don't know.
const LINKABLE_STATIC = new Set([
  "/", "/about", "/services", "/how-it-works", "/pricing", "/samples",
  "/faq", "/contact", "/resources", "/blog", "/case-studies", "/cipd-units",
  "/send-your-brief",
  "/resources/cipd-assessment-planning-checklist",
  "/resources/harvard-referencing-checklist",
  "/resources/cipd-resubmission-planner",
  "/resources/reflective-writing-model-bank",
  "/resources/cipd-command-verb-cheat-sheet",
  "/resources/critical-analysis-self-check",
  ...Object.keys(PILLAR_PAGES),
]);

describe("inline internal links (P1.1)", () => {
  const slugs = new Set(posts.map((p) => p.slug));
  const unitPaths = new Set(units.map((u) => `/cipd-units/${u.slug}`));

  it("every inline link is internal, well-formed and resolves to a real page", () => {
    for (const post of posts) {
      for (const block of post.body) {
        const texts =
          block.type === "ul" || block.type === "ol" ? block.items : [block.text];
        for (const text of texts) {
          for (const { label, href } of extractInlineLinks(text)) {
            expect(label.trim().length, `${post.slug}: empty link label`).toBeGreaterThan(0);
            expect(href, `${post.slug}: link must be a bare internal path (${href})`).toMatch(
              /^\/[a-z0-9\-\/]*$/
            );
            const resolves = href.startsWith("/blog/")
              ? slugs.has(href.slice("/blog/".length))
              : LINKABLE_STATIC.has(href) || unitPaths.has(href);
            expect(resolves, `${post.slug}: link target does not resolve: ${href}`).toBe(true);
          }
        }
      }
    }
  });

  it("headings, titles and descriptions carry no link syntax", () => {
    for (const post of posts) {
      expect(post.title).not.toMatch(INLINE_LINK_RE);
      expect(post.description).not.toMatch(INLINE_LINK_RE);
      for (const block of post.body) {
        if (block.type === "h2" || block.type === "h3") {
          expect(block.text, `${post.slug}: link in heading`).not.toMatch(INLINE_LINK_RE);
        }
      }
    }
  });

  it("FAQ schema derivation strips link syntax from answers", () => {
    const pairs = faqPairsFromBlocks([
      { type: "h3", text: "Where can I read more?" },
      { type: "p", text: "See [the full guide](/blog/harvard-referencing-complete-guide) for detail." },
      { type: "p", text: "It covers every source type." },
    ]);
    expect(pairs[0].answer).toBe("See the full guide for detail. It covers every source type.");
    expect(pairs[0].answer).not.toContain("](");
  });
});
