/**
 * Derived acquisition channel classifier (AI Discovery P0) — a REPORTING
 * LAYER ONLY. Raw attribution fields (utm_source/medium/campaign, referrer,
 * landing/source page) are never mutated, replaced or backfilled; this
 * module derives a channel + source label from them at read time.
 *
 * EVIDENCE RULE: "AI Assistant" is assigned only on signals proven reliable
 * in production or documented by the platform (ChatGPT appends
 * utm_source=chatgpt.com; Copilot observed as utm_source=copilot.com with
 * corroborating referrer copilot.microsoft.com; Perplexity documents
 * utm_source=perplexity.ai). Gemini, Claude and anything else without a
 * distinguishing signal are NEVER guessed — they fall through to Organic /
 * Referral / Direct honestly. Unknown stays Unknown.
 */

export type AcquisitionChannel =
  | "AI Assistant"
  | "Paid Search"
  | "Organic Search"
  | "Social"
  | "Referral"
  | "Direct / Unknown"
  | "Other";

export type ClassifiedAcquisition = {
  channel: AcquisitionChannel;
  /** Specific assistant / engine / network when reliably known. */
  source?: string;
};

/** Reliable AI signals: utm_source value or referrer hostname → label. */
const AI_UTM_SOURCES: Record<string, string> = {
  "chatgpt.com": "ChatGPT",
  "copilot.com": "Copilot",
  "perplexity.ai": "Perplexity",
  perplexity: "Perplexity", // documented variant
};

const AI_REFERRER_HOSTS: Record<string, string> = {
  "chatgpt.com": "ChatGPT",
  "chat.openai.com": "ChatGPT",
  "copilot.microsoft.com": "Copilot",
  "perplexity.ai": "Perplexity",
};

const SEARCH_HOSTS: Record<string, string> = {
  google: "Google",
  bing: "Bing",
  duckduckgo: "DuckDuckGo",
  ecosia: "Ecosia",
  yahoo: "Yahoo",
  yandex: "Yandex",
  baidu: "Baidu",
};

const SOCIAL_HOSTS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  "t.co": "X",
  "twitter.com": "X",
  "x.com": "X",
  youtube: "YouTube",
  tiktok: "TikTok",
  reddit: "Reddit",
  pinterest: "Pinterest",
};

const PAID_MEDIUMS = new Set(["cpc", "ppc", "paid", "paidsearch", "paid_social", "display"]);

function hostOf(referrer: string | undefined | null): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
    // A self-referrer carries no acquisition information.
    if (host === "cipdguidance.com" || host === "localhost") return null;
    return host;
  } catch {
    return null;
  }
}

function matchHost(host: string, table: Record<string, string>): string | undefined {
  for (const [needle, label] of Object.entries(table)) {
    if (host === needle || host.endsWith(`.${needle}`) || host.includes(needle)) return label;
  }
  return undefined;
}

export function classifyAcquisition(raw: {
  utmSource?: string | null;
  utmMedium?: string | null;
  referrer?: string | null;
}): ClassifiedAcquisition {
  const utmSource = raw.utmSource?.trim().toLowerCase() || null;
  const utmMedium = raw.utmMedium?.trim().toLowerCase() || null;
  const host = hostOf(raw.referrer);

  // 1. AI Assistant — the strongest deliberate signal first (ChatGPT sends
  //    the UTM with no referrer, so UTM must win), then corroborating hosts.
  if (utmSource && AI_UTM_SOURCES[utmSource]) {
    return { channel: "AI Assistant", source: AI_UTM_SOURCES[utmSource] };
  }
  if (host) {
    const ai = AI_REFERRER_HOSTS[host] ?? matchHost(host, AI_REFERRER_HOSTS);
    if (ai) return { channel: "AI Assistant", source: ai };
  }

  // 2. Paid — declared medium only; we store no click ids.
  if (utmMedium && PAID_MEDIUMS.has(utmMedium)) {
    return { channel: "Paid Search", source: utmSource ?? undefined };
  }

  // 3. Social — declared or referred.
  if (utmMedium === "social" || (utmSource && matchHost(utmSource, SOCIAL_HOSTS))) {
    return { channel: "Social", source: utmSource ? matchHost(utmSource, SOCIAL_HOSTS) : undefined };
  }
  if (host) {
    const social = matchHost(host, SOCIAL_HOSTS);
    if (social) return { channel: "Social", source: social };
  }

  // 4. Organic search — a search-engine referrer with no overriding UTM.
  if (host) {
    const engine = matchHost(host, SEARCH_HOSTS);
    if (engine) return { channel: "Organic Search", source: engine };
  }

  // 5. Campaign-tagged but unrecognised: honest "Other", raw source kept.
  if (utmSource) return { channel: "Other", source: utmSource };

  // 6. Any other external referrer.
  if (host) return { channel: "Referral", source: host };

  // 7. Nothing to go on.
  return { channel: "Direct / Unknown" };
}
