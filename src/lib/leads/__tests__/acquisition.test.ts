/**
 * Channel classifier tests (AI Discovery P0). The production-observed cases
 * are pinned exactly; the evidence rule (never guess an assistant) is
 * enforced by the Gemini/Claude cases.
 */

import { describe, expect, it } from "vitest";
import { classifyAcquisition } from "@/lib/leads/acquisition";

describe("classifyAcquisition — AI Assistant (evidence-backed only)", () => {
  it("classifies the production Gabriela case: utm_source=chatgpt.com, no referrer", () => {
    expect(classifyAcquisition({ utmSource: "chatgpt.com", referrer: null })).toEqual({
      channel: "AI Assistant",
      source: "ChatGPT",
    });
  });

  it("classifies the production Copilot cases (utm alone, and utm + referrer)", () => {
    expect(classifyAcquisition({ utmSource: "copilot.com" })).toEqual({
      channel: "AI Assistant",
      source: "Copilot",
    });
    expect(
      classifyAcquisition({ utmSource: "copilot.com", referrer: "https://copilot.microsoft.com/" })
    ).toEqual({ channel: "AI Assistant", source: "Copilot" });
  });

  it("classifies Perplexity by documented utm or referrer", () => {
    expect(classifyAcquisition({ utmSource: "perplexity.ai" }).source).toBe("Perplexity");
    expect(classifyAcquisition({ utmSource: "perplexity" }).source).toBe("Perplexity");
    expect(
      classifyAcquisition({ referrer: "https://www.perplexity.ai/search?q=x" }).source
    ).toBe("Perplexity");
  });

  it("classifies an AI referrer host even without UTM (chat.openai.com)", () => {
    expect(classifyAcquisition({ referrer: "https://chat.openai.com/" })).toEqual({
      channel: "AI Assistant",
      source: "ChatGPT",
    });
  });

  it("NEVER guesses Gemini or Claude: no reliable signal means no AI label", () => {
    // Gemini traffic is indistinguishable from Google.
    expect(classifyAcquisition({ referrer: "https://www.google.com/" })).toEqual({
      channel: "Organic Search",
      source: "Google",
    });
    // Claude citations carry no UTM and no referrer.
    expect(classifyAcquisition({})).toEqual({ channel: "Direct / Unknown" });
  });
});

describe("classifyAcquisition — the rest of the taxonomy", () => {
  it("paid search by declared medium, keeping the raw source", () => {
    expect(classifyAcquisition({ utmSource: "google", utmMedium: "cpc" })).toEqual({
      channel: "Paid Search",
      source: "google",
    });
  });

  it("organic search engines", () => {
    expect(classifyAcquisition({ referrer: "https://www.bing.com/search?q=cipd" }).channel).toBe(
      "Organic Search"
    );
    expect(classifyAcquisition({ referrer: "https://duckduckgo.com/" }).source).toBe("DuckDuckGo");
  });

  it("social by referrer or declared source", () => {
    expect(classifyAcquisition({ referrer: "https://www.linkedin.com/feed/" })).toEqual({
      channel: "Social",
      source: "LinkedIn",
    });
    expect(classifyAcquisition({ utmSource: "facebook", utmMedium: "social" }).channel).toBe(
      "Social"
    );
    expect(classifyAcquisition({ referrer: "https://t.co/abc" }).source).toBe("X");
  });

  it("unknown campaign tags stay honest 'Other' with the raw value visible", () => {
    expect(classifyAcquisition({ utmSource: "newsletter-sept" })).toEqual({
      channel: "Other",
      source: "newsletter-sept",
    });
  });

  it("other external referrers are Referral with the host", () => {
    expect(classifyAcquisition({ referrer: "https://www.hrzone.com/some-article" })).toEqual({
      channel: "Referral",
      source: "hrzone.com",
    });
  });

  it("self-referrers and malformed referrers carry no information", () => {
    expect(classifyAcquisition({ referrer: "https://www.cipdguidance.com/blog/x" }).channel).toBe(
      "Direct / Unknown"
    );
    expect(classifyAcquisition({ referrer: "not a url" }).channel).toBe("Direct / Unknown");
  });

  it("AI utm outranks everything else present", () => {
    expect(
      classifyAcquisition({
        utmSource: "chatgpt.com",
        utmMedium: "cpc",
        referrer: "https://www.google.com/",
      })
    ).toEqual({ channel: "AI Assistant", source: "ChatGPT" });
  });
});
