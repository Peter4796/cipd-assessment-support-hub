/**
 * Blog post loader (MDX migration tranche) — one markdown file per post.
 *
 * Posts live in src/content/posts/NNN-slug.md. The numeric prefix preserves
 * the curated publication order the old blog.ts array encoded (unit pillar
 * clusters render their guides in this order); the slug in the frontmatter
 * is the routing identity — filenames never appear in URLs.
 *
 * ADDING A POST: create the next-numbered file, follow the format of any
 * existing one (frontmatter values are JSON literals; body constructs:
 * "## " h2 · "### " h3 · "> " callout · "- " bullets · "1. " numbered ·
 * plain line = paragraph, blank line between blocks). The index, [slug]
 * route, sitemap and unit clusters pick it up automatically. `npm test`
 * validates every file; a malformed post FAILS THE BUILD (never ships a
 * broken article silently).
 *
 * Files are read once at module load (build time for the static pages).
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parsePost } from "@/lib/content/markdown";
import type { Post } from "@/content/types";

export type { Block, Post, PostMeta } from "@/content/types";

const POSTS_DIR = join(process.cwd(), "src/content/posts");

function loadPosts(): Post[] {
  const files = readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort(); // NNN- prefix defines the curated order

  const loaded = files.map((file) => {
    const { meta, body } = parsePost(readFileSync(join(POSTS_DIR, file), "utf8"), file);
    return { ...meta, body };
  });

  const seen = new Set<string>();
  for (const post of loaded) {
    if (seen.has(post.slug)) throw new Error(`duplicate post slug: ${post.slug}`);
    seen.add(post.slug);
  }
  return loaded;
}

export const posts: Post[] = loadPosts();

export function getPost(slug: string) {
  return posts.find((p) => p.slug === slug);
}

/** Posts that form the pillar cluster for a given unit code, in curated order. */
export function postsForUnit(code: string) {
  return posts.filter((p) => p.unit === code);
}

export const postsByDate = [...posts].sort((a, b) => (a.date < b.date ? 1 : -1));
