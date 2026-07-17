/**
 * Content model types (extracted from blog.ts in the MDX migration).
 * The Block model is the single long-form rendering contract, shared by
 * blog posts (now one .md file each under src/content/posts/) and the
 * typed case studies; <RichContent/> renders it.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; text: string };

export type PostMeta = {
  slug: string;
  title: string;
  description: string; // meta description + card excerpt
  category: string;
  keyword: string; // primary SEO keyword
  date: string; // ISO
  readMinutes: number;
  related: string[]; // slugs
  unit?: string; // optional unit code (e.g. "5CO01") — links the post into a unit pillar cluster
  pillar: string; // cluster spine (Blueprint Part 5): a unit code, a pillar page path ("/cipd-resubmission-support"), or a hub article slug (a hub self-references)
  tags?: string[]; // topical tags for future topic hubs
  reviewed?: string; // ISO date of last editorial review; presence marks a Phase 3 production article and enables the stricter corpus gates
};

export type Post = PostMeta & { body: Block[] };
