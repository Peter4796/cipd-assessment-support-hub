/**
 * Post serialization (MDX migration tranche) — pure, dependency-free.
 *
 * Each blog post lives in src/content/posts/NNN-slug.md: a frontmatter
 * header (JSON-literal values, so no YAML library and no parsing ambiguity)
 * followed by the body in a strict markdown subset that maps 1:1 onto the
 * existing Block model rendered by <RichContent/>:
 *
 *   ## text        → h2            ### text      → h3
 *   > text         → callout       - item lines  → ul
 *   1. item lines  → ol            any other line → p
 *
 * Blocks are separated by blank lines; every block is single-line (the
 * corpus contains no embedded newlines — enforced on serialize). Paragraph
 * lines that would collide with a construct token ("#", ">", "- ",
 * "N. ", or a leading backslash) are escaped with one backslash, which the
 * parser strips. `blocksToMarkdown` and `markdownToBlocks` are exact
 * inverses; the round-trip is test-enforced over the full real corpus.
 */

import type { Block, PostMeta } from "@/content/types";

const CONSTRUCT_RE = /^(#|>|- |\d+\. |\\)/;

function escapeParagraph(text: string): string {
  return CONSTRUCT_RE.test(text) ? `\\${text}` : text;
}

function unescapeParagraph(line: string): string {
  return line.startsWith("\\") ? line.slice(1) : line;
}

function assertSingleLine(text: string, where: string): void {
  if (text.includes("\n")) {
    throw new Error(`multi-line text is not supported (${where})`);
  }
}

export function blocksToMarkdown(blocks: Block[]): string {
  const chunks = blocks.map((block) => {
    switch (block.type) {
      case "h2":
        assertSingleLine(block.text, "h2");
        return `## ${block.text}`;
      case "h3":
        assertSingleLine(block.text, "h3");
        return `### ${block.text}`;
      case "callout":
        assertSingleLine(block.text, "callout");
        return `> ${block.text}`;
      case "ul":
        return block.items
          .map((item) => {
            assertSingleLine(item, "ul item");
            return `- ${item}`;
          })
          .join("\n");
      case "ol":
        return block.items
          .map((item, i) => {
            assertSingleLine(item, "ol item");
            return `${i + 1}. ${item}`;
          })
          .join("\n");
      case "p":
        assertSingleLine(block.text, "p");
        return escapeParagraph(block.text);
    }
  });
  return chunks.join("\n\n") + "\n";
}

export function markdownToBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  // Blocks are blank-line separated; list blocks span consecutive lines.
  for (const chunk of markdown.split(/\n{2,}/)) {
    const lines = chunk.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) continue;
    const first = lines[0];

    if (first.startsWith("## ")) {
      blocks.push({ type: "h2", text: first.slice(3) });
    } else if (first.startsWith("### ")) {
      blocks.push({ type: "h3", text: first.slice(4) });
    } else if (first.startsWith("> ")) {
      blocks.push({ type: "callout", text: first.slice(2) });
    } else if (first.startsWith("- ")) {
      blocks.push({ type: "ul", items: lines.map((l) => l.replace(/^- /, "")) });
    } else if (/^\d+\. /.test(first)) {
      blocks.push({ type: "ol", items: lines.map((l) => l.replace(/^\d+\. /, "")) });
    } else {
      // Paragraph: one block per line (serializer emits exactly one).
      for (const line of lines) {
        blocks.push({ type: "p", text: unescapeParagraph(line) });
      }
    }
  }
  return blocks;
}

// ─── Frontmatter (JSON-literal values, no YAML dependency) ───

const META_KEYS = [
  "slug",
  "title",
  "description",
  "category",
  "keyword",
  "date",
  "readMinutes",
  "unit",
  "related",
] as const;

export function serializePost(meta: PostMeta, body: Block[]): string {
  const lines: string[] = ["---"];
  for (const key of META_KEYS) {
    const value = meta[key];
    if (value === undefined) continue;
    lines.push(`${key}: ${JSON.stringify(value)}`);
  }
  lines.push("---", "");
  return lines.join("\n") + blocksToMarkdown(body);
}

export function parsePost(raw: string, file: string): { meta: PostMeta; body: Block[] } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) throw new Error(`missing frontmatter in ${file}`);

  const meta: Record<string, unknown> = {};
  for (const line of match[1].split("\n")) {
    if (!line.trim()) continue;
    const idx = line.indexOf(": ");
    if (idx === -1) throw new Error(`malformed frontmatter line in ${file}: ${line}`);
    const key = line.slice(0, idx);
    if (!(META_KEYS as readonly string[]).includes(key)) {
      throw new Error(`unknown frontmatter key "${key}" in ${file}`);
    }
    try {
      meta[key] = JSON.parse(line.slice(idx + 2));
    } catch {
      throw new Error(`unparseable frontmatter value for "${key}" in ${file}`);
    }
  }

  for (const required of ["slug", "title", "description", "category", "keyword", "date"]) {
    if (typeof meta[required] !== "string" || meta[required] === "") {
      throw new Error(`missing/invalid "${required}" in ${file}`);
    }
  }
  if (typeof meta.readMinutes !== "number" || meta.readMinutes < 1) {
    throw new Error(`missing/invalid "readMinutes" in ${file}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date as string)) {
    throw new Error(`invalid date in ${file}`);
  }
  if (
    !Array.isArray(meta.related) ||
    meta.related.some((r) => typeof r !== "string")
  ) {
    throw new Error(`missing/invalid "related" in ${file}`);
  }
  if (meta.unit !== undefined && typeof meta.unit !== "string") {
    throw new Error(`invalid "unit" in ${file}`);
  }

  return { meta: meta as PostMeta, body: markdownToBlocks(raw.slice(match[0].length)) };
}
