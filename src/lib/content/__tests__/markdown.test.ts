import { describe, expect, it } from "vitest";
import {
  blocksToMarkdown,
  markdownToBlocks,
  parsePost,
  serializePost,
} from "@/lib/content/markdown";
import type { Block, PostMeta } from "@/content/types";

const meta: PostMeta = {
  slug: "example-post",
  title: 'Quotes "inside" titles: and colons',
  description: "A description.",
  category: "Getting started",
  keyword: "cipd keyword",
  date: "2026-07-17",
  readMinutes: 6,
  related: ["another-post", "third-post"],
  unit: "5CO01",
  pillar: "5CO01",
  tags: ["level-5", "assignment-guides"],
  reviewed: "2026-07-17",
};

const body: Block[] = [
  { type: "p", text: "An ordinary paragraph." },
  { type: "h2", text: "1. A heading that starts with a number" },
  { type: "h3", text: "Sub-heading" },
  { type: "ul", items: ["First bullet", "Second bullet: with colon"] },
  { type: "ol", items: ["Step one", "Step two"] },
  { type: "callout", text: "Rule of thumb: callouts survive." },
  { type: "p", text: "1. A paragraph that LOOKS like a numbered list item." },
  { type: "p", text: "- A paragraph that looks like a bullet." },
  { type: "p", text: "## A paragraph that looks like a heading." },
  { type: "p", text: "> A paragraph that looks like a callout." },
  { type: "p", text: "\\Already starts with a backslash." },
];

describe("block markdown codec", () => {
  it("round-trips every construct including collision-prone paragraphs", () => {
    expect(markdownToBlocks(blocksToMarkdown(body))).toEqual(body);
  });

  it("serialises collision-prone paragraphs with an escape", () => {
    const md = blocksToMarkdown([{ type: "p", text: "1. Not a list" }]);
    expect(md).toBe("\\1. Not a list\n");
  });

  it("full post round-trip preserves metadata exactly", () => {
    const back = parsePost(serializePost(meta, body), "example.md");
    expect(back.meta).toEqual(meta);
    expect(back.body).toEqual(body);
  });

  it("omits the optional unit key cleanly", () => {
    const noUnit = { ...meta, unit: undefined };
    const raw = serializePost(noUnit, body);
    expect(raw).not.toContain("unit:");
    expect(parsePost(raw, "x.md").meta.unit).toBeUndefined();
  });

  it("omits optional tags/reviewed cleanly", () => {
    const bare = { ...meta, tags: undefined, reviewed: undefined };
    const raw = serializePost(bare, body);
    expect(raw).not.toContain("tags:");
    expect(raw).not.toContain("reviewed:");
    const back = parsePost(raw, "x.md").meta;
    expect(back.tags).toBeUndefined();
    expect(back.reviewed).toBeUndefined();
  });

  it("enforces pillar presence and unit consistency", () => {
    expect(() =>
      parsePost(serializePost(meta, body).replace('pillar: "5CO01"\n', ""), "p.md")
    ).toThrow(/"pillar"/);
    expect(() =>
      parsePost(serializePost(meta, body).replace('pillar: "5CO01"', 'pillar: "5HR01"'), "p.md")
    ).toThrow(/must equal "unit"/);
    expect(() =>
      parsePost(serializePost(meta, body).replace('reviewed: "2026-07-17"', 'reviewed: "17/07/2026"'), "r.md")
    ).toThrow(/"reviewed"/);
    expect(() =>
      parsePost(serializePost(meta, body).replace('tags: ["level-5","assignment-guides"]', 'tags: ["ok",42]'), "t.md")
    ).toThrow(/"tags"/);
  });

  it("rejects malformed files with actionable errors", () => {
    expect(() => parsePost("no frontmatter", "bad.md")).toThrow(/frontmatter in bad.md/);
    expect(() =>
      parsePost(serializePost(meta, body).replace('date: "2026-07-17"', 'date: "17/07/2026"'), "d.md")
    ).toThrow(/invalid date/);
    expect(() =>
      parsePost(serializePost(meta, body).replace('slug: "example-post"\n', ""), "s.md")
    ).toThrow(/"slug"/);
    expect(() =>
      parsePost(serializePost(meta, body).replace("keyword:", "keywrod:"), "k.md")
    ).toThrow(/unknown frontmatter key/);
  });

  it("rejects multi-line text at serialisation time", () => {
    expect(() => blocksToMarkdown([{ type: "p", text: "two\nlines" }])).toThrow(/multi-line/);
  });
});
