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
import { resolvePillar } from "@/content/pillars";
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
