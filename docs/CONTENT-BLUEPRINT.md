# CIPD Guidance — Knowledge Platform Blueprint (Phase 3)

**Written 2026-07-17.** The strategic design governing all future content and
resource development. Goal: the most trusted free CIPD knowledge base online,
maximising qualified enquiries at premium-brand quality. No article ships
outside this blueprint.

## PART 1 — SITE AUDIT (prioritised by business impact)

1. **No unit index page content** (HIGH): /cipd-units exists but is a thin list;
   it should become the Units pillar (level-grouped, qualification explainer).
2. **15 of 17 units have no article cluster** (HIGH): only 5CO01/5HR01 have
   guides; every unit page invites "free guides" it cannot show. This is the
   single largest authority + conversion gap.
3. **Missing money pages** (HIGH): no dedicated pages for Harvard referencing
   service intent, urgent-deadline intent, or "CIPD assignment examples"
   intent (high-volume queries currently landing on blog posts with generic CTAs).
4. **Duplicate intent risk** (MEDIUM): level pillar guides (blog) vs level
   support pages (service) both target "CIPD level N" queries; resolve by
   making service pages commercial-intent canonical targets and blog pillars
   informational ("study guide") with distinct titles; cross-link pairs.
5. **EEAT gaps** (MEDIUM): no author/credentials block ("who reviews your
   work"), no editorial policy page, no dated review stamps on guidance
   content, no About-page depth on methodology. Fix with an anonymised
   credentials block (owner-approved wording), /editorial-policy, and
   reviewed-on dates in article frontmatter.
6. **Internal linking is manual-only sideways** (MEDIUM): `related` + unit
   auto-links exist; no category hubs, no "more in this topic" fallback, no
   downwards links to resources. Blueprint Part 7 fixes structurally.
7. **Navigation ceiling** (MEDIUM): header holds 7 items; a knowledge hub needs
   a "Guides" mega-menu (by level, by topic, by resource type) and a footer
   sitemap by cluster.
8. **Weak pages** (LOW): /samples (thin), /how-it-works (no schema/FAQ),
   /pricing (dead end: add FAQ + lead magnet). /portal remains parked.
9. **Conversion opportunities** (LOW): exit-intent-free contextual lead magnet
   boxes per cluster (Part 9); deadline-aware CTA variant ("due this week?")
   on urgent-intent pages.

## PART 2 — GEOGRAPHIC POSITIONING (decided + implemented)

Options considered: UK-only (largest market, forfeits everything else);
UK+UAE (status quo, told other Gulf/Africa/Asia visitors "not for you");
UK+GCC (better, still capped); International (widest funnel, risks diluting
credibility). **Chosen: international with explicit UK & Gulf expertise** —
the widest search and conversion surface with credibility anchored where the
track record is. Implemented across hero, tagline, metadata, trust points,
About, FAQs, footer (commit 74870ff). SEO consequences: keep the UAE article
and Gulf FAQ (existing equity), add country-guide articles (Part 4) rather
than country subdomains/folders; single canonical .com, English-only.

## PART 3 — INFORMATION ARCHITECTURE

```
Home
├── Support (commercial)            ├── Learn (informational)
│   ├── /services (+ per-service    │   ├── /cipd-units (Units pillar)
│   │   anchors)                    │   │   └── /cipd-units/[code] (17)
│   ├── /cipd-level-{3,5,7}-support │   ├── /guides ("Knowledge Hub" index =
│   ├── /cipd-resubmission-support  │   │   today's /blog, re-labelled; URL
│   ├── /harvard-referencing-support│   │   /blog kept, no redirect churn)
│   │   (NEW money page)            │   │   └── /blog/[slug] (all articles)
│   ├── /urgent-cipd-help (NEW)     │   ├── Topic hubs (NEW, /blog?topic= or
│   ├── /pricing · /how-it-works    │   │   /topics/[slug] category pages)
│   └── /send-your-brief (funnel)   │   ├── Academic Writing Centre (topic hub)
│                                   │   ├── Command Verb Library (NEW page)
├── Resources                       │   ├── Referencing Centre (topic hub)
│   ├── /resources (library index)  │   └── Study Skills hub
│   ├── Downloads (lead magnets,    ├── Trust
│   │   one landing page each)      │   ├── /about (+credentials block)
│   ├── /case-studies               │   ├── /faq · /glossary (NEW)
│   └── Templates (within downloads)│   └── /editorial-policy (NEW)
└── /contact · /privacy
```

Why each exists: **service pages** capture commercial intent and hold the
Service schema; **unit pages** are the conversion workhorses (highest-intent
informational traffic); **topic hubs** create crawlable category authority and
kill orphaning; **Command Verb Library and Glossary** are link-magnet reference
assets (every article links into them, they link out to clusters, and they
target definitional queries); **download landing pages** give every lead
magnet an indexable, shareable URL feeding the subscriber pipeline;
**editorial policy + credentials** are EEAT infrastructure. Blog URLs stay at
/blog/* (indexing equity; "no URL churn" rule stands).

## PART 4 — TOPIC CLUSTERS (complete map)

Qualification clusters: **L3, L5, L7** (pillar = level support page + level
study-guide article), **17 unit clusters** (pillar = unit page; 5-8 guides
each: complete guide, structure, common mistakes, criteria explained, FAQs,
examples-discussion). Skills clusters: **Academic Writing** (structure, tone,
paragraphs, word count), **Critical Analysis**, **Reflective Writing**,
**Harvard Referencing**, **Tutor Feedback & Resubmissions**, **Study Skills**
(planning, time, motivation, exams-vs-assignments). Subject-knowledge clusters
(support unit clusters; one hub article + spokes each): **HR Strategy, L&D,
OD, Leadership, Employment Law basics, Employee Relations, Reward, People
Analytics, Wellbeing**. Missing clusters identified: **AI in Academic Work +
Academic Integrity** (rising search + brand-defining ethical stance),
**Choosing a CIPD Qualification** (top-of-funnel: "is CIPD worth it", "level 3
vs 5", "CIPD vs SHRM"), **Country Guides** (studying CIPD in UAE ✓, add Saudi
Arabia, Qatar, Ireland, Kenya, Nigeria, India, remote/online), **Working while
studying** (the persona's lived reality).

## PART 5 — PILLAR PAGES

Every article belongs to exactly one pillar (`pillar` frontmatter key, NEW).
Pillars: the 3 level pages, 17 unit pages, and one hub article per skills/
subject cluster (2,500+ words, definitive, updated not replaced). Pillar
pages list every spoke automatically (extend the `postsForUnit` pattern to
`postsForPillar`). Rule: **no isolated posts** — an article proposal without a
pillar is rejected or a new cluster is designed first.

## PART 6 — ARTICLE TEMPLATE

Frontmatter additions: `pillar`, `tags[]`, `reviewed` (date). Body order:
1. **Hook intro** (the reader's situation, promise of the answer, 2-3 lines).
2. **"In this guide you'll learn"** (3-5 bullets = learning objectives).
3. **Core concepts** (h2 sections, one idea each, command-verb-aware depth).
4. **Practical guidance** (numbered steps or applied walkthrough).
5. **Worked example** (realistic scenario, never real client work).
6. **Common mistakes** (list + why each costs marks).
7. **Callout** (tutor tip / integrity note where relevant).
8. **FAQs** (3-5, h3-question format → auto FAQPage schema, already built).
9. **Related guides** (`related` links) + relevant download.
10. **Contextual CTA** (enquiryUrl with level/unit prefill, varied copy).
SEO: keyword in title/description/first h2 naturally; 1,200-2,000 words
standard, pillars longer; one internal link per ~150 words.

## PART 7 — INTERNAL LINKING

Every article links: **up** to its pillar (auto, from `pillar` key), **across**
to 2-4 siblings (`related`, curated) + automatic "more in {cluster}" fallback
when related < 3, **down** to one download landing page and glossary/command-
verb entries where terms appear. Pillars link to every spoke (auto). Unit
pages ↔ level pages ↔ service pages already interlink. Orphan guard: extend
the corpus test — every post must have a valid `pillar`, ≥1 inbound link
(pillar listing counts), and valid `related` slugs (already enforced).

## PART 8 — REUSABLE COMPONENTS (markdown block extensions)

Extend the markdown codec with marked callout variants (one new token each,
round-trip tested like the existing `>` callout): `>! warning` (integrity/
mistake warnings, red), `>* tutor tip` (gold), `>? quick summary` (top-of-
article TL;DR box), plus existing lists/callout. Component library additions:
`<ChecklistBox>` (interactive tick list), `<DownloadCard>` (lead magnet
embed), `<RelatedResources>`, contextual `<CtaBlock>` variants (standard,
urgent-deadline, resubmission), FAQ accordion (exists). Rule: components are
rendered FROM markdown constructs or frontmatter, never hand-coded per
article, so 300 articles stay maintainable.

## PART 9 — LEAD MAGNETS

Existing: assessment planning checklist. Build (one landing page + PDF each,
delivered via existing /api/subscribe): **Assignment planning checklist**
(refresh), **Harvard referencing checklist**, **Critical analysis
self-check**, **Pre-submission checklist**, **Study planner** (term-length),
**Word count planner** (per-task allocation calculator sheet), **Tutor
feedback decoder worksheet**, **Resubmission planner**. Additional
recommendations: **Command verb cheat sheet** (natural #1 performer for this
audience), **Reflective writing model bank** (structures + sentence stems),
**CIPD level chooser quiz/sheet** (top-of-funnel), **AI-use disclosure
template** (integrity cluster, brand-defining). Each magnet maps to one
cluster and appears contextually in that cluster's articles only.

## PART 10 — PRODUCTION SYSTEM (AI-assisted, quality-gated)

Roles: strategist (owner+agent, monthly cluster priorities) → drafting agent →
editorial pass → owner spot-review → publish. Per-article pipeline:
1. **Brief** from the cluster map: slug, pillar, keyword, intent, related
   slugs, magnet, CTA context (a `briefs/` queue file per batch).
2. **Draft** by agent following Part 6 template + voice rules (no em-dashes,
   ethical positioning, UK spelling, no CIPD-copyright text, no fabricated
   stats/quotes; guidance-not-writing framing in every CTA).
3. **Machine gates** (extend corpus tests): frontmatter valid, pillar exists,
   related resolve, no em-dash, no "AC n.n" patterns, length bounds, exactly
   one CTA, FAQ structure parses.
4. **Editorial review** (agent second pass, different session): fact-check
   claims, tone, intent match, internal-link quality; then owner skims flagged
   items only. Facts rule: no statistics or legal claims without a verifiable
   source named in the text; when uncertain, write principle not number.
5. **Publish** in batches of 5-8 (one commit per batch, gates green), monthly
   `reviewed` refresh sweep for top-20-traffic articles.
Cadence: 8-12 articles/week sustainable → Phase 3A in 3 weeks, 3B in ~2
months, 3C across the year.

## PART 11 — PUBLISHING ROADMAP

**Phase 3A — 25 articles (first: convert existing demand).** Complete guides +
common mistakes + FAQs for the 6 highest-enquiry units missing clusters
(5CO02, 5CO03, 5HR02, 5HR03, 7CO03 resubmission-heavy, 3CO04) = 18; Harvard
referencing cluster core (4, supports the new money page); resubmission spokes
(3). Why first: bottom-funnel, maps to what leads already ask for, thickens
the pages that already rank.
**Phase 3B — 75 articles (complete the map).** Finish all 17 unit clusters
(≈40), academic writing + critical analysis + reflective writing cores (≈18),
L3/L7 study-guide pillars + choosing-CIPD cluster (≈10), country guides wave 1
(UAE refresh, KSA, Qatar, Nigeria, Kenya, India, remote) (≈7). Why second:
full topical authority on qualification terms before competing on broader HR
terms.
**Phase 3C — 200 articles (own the subject).** Subject-knowledge clusters
(HR strategy, L&D, OD, leadership, law basics, ER, reward, analytics,
wellbeing ≈120), AI + integrity cluster (≈15), study skills + working-while-
studying (≈25), glossary buildout + criteria-explained long tail (≈40). Why
last: highest volume, lowest intent; converts via internal links into the
cluster system built in 3A/3B.

Sequencing principle throughout: **money pages → unit authority → skills
authority → subject authority.** Review this document quarterly against
Search Console data; it is authoritative until superseded.
