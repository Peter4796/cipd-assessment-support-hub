/**
 * Corpus guard: validates every real post file on every test run — a
 * malformed article fails here (and the loader also fails the production
 * build, so a broken post can never ship silently).
 */

import { describe, expect, it } from "vitest";
import { getPost, posts, postsByDate, postsForUnit } from "@/content/posts";

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
});
