/**
 * Inline internal links inside Block text (P1.1).
 *
 * Syntax: [Label](/internal/path) — the ONLY inline markup the content model
 * supports. Hrefs must be site-absolute paths ("/..."), never external URLs,
 * so link equity stays first-party by construction; the corpus gate in
 * src/content/__tests__/posts.test.ts additionally proves every target
 * resolves to a real route. The codec (markdown.ts) stores text verbatim, so
 * round-tripping is unaffected; the renderer and the FAQ-schema derivation
 * interpret the syntax at the edges via this module.
 */

export type InlineSegment =
  | { kind: "text"; text: string }
  | { kind: "link"; label: string; href: string };

/**
 * [label](/path) or [label](https://allowed-host/...) — label has no
 * brackets/newlines. Internal paths link freely; external hrefs exist ONLY
 * for primary-source citations and must match CITATION_HOSTS (enforced by
 * the corpus gate). Nothing else external is ever linkable from a body.
 */
export const INLINE_LINK_RE = /\[([^\[\]\n]+)\]\(((?:\/|https:\/\/)[^)\s]*)\)/g;

/** Primary-source hosts bodies may cite (AI-P1.2). Extend deliberately. */
export const CITATION_HOSTS = new Set(["cipd.org", "www.cipd.org", "shrm.org", "www.shrm.org"]);

export function isCitationHref(href: string): boolean {
  if (!href.startsWith("https://")) return false;
  try {
    return CITATION_HOSTS.has(new URL(href).hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** Split a block's text into text and link segments, in order. */
export function splitInline(text: string): InlineSegment[] {
  const out: InlineSegment[] = [];
  let last = 0;
  for (const m of Array.from(text.matchAll(INLINE_LINK_RE))) {
    if (m.index! > last) out.push({ kind: "text", text: text.slice(last, m.index) });
    out.push({ kind: "link", label: m[1], href: m[2] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

/** Replace link syntax with its label: schema text and excerpts stay plain. */
export function stripInlineLinks(text: string): string {
  return text.replace(INLINE_LINK_RE, "$1");
}

/** Every inline link in a text, for the corpus gates. */
export function extractInlineLinks(text: string): Array<{ label: string; href: string }> {
  return Array.from(text.matchAll(INLINE_LINK_RE)).map((m) => ({ label: m[1], href: m[2] }));
}
