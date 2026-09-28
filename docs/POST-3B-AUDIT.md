# Post-Phase-3B Audit — CIPD Guidance

**Date:** 2026-08-07 · **Repo state:** `e557264` (= origin/main = production)
**Business target:** first 10 paying clients whose original acquisition source is cipdguidance.com.
**Scope:** assessment only. Nothing in this report has been implemented. Findings are grounded in the repository; where a fact requires external access (Search Console, Vercel dashboard, the production database), it is explicitly marked as unverifiable from here.

---

## A. Exact production state

- **Deployed:** commit `e557264`. `main` = `origin/main`; push auto-deploys production (no CI in between — see §K).
- **Gates at audit time (run locally):** vitest suite green, `tsc --noEmit` clean, `next lint` clean, `next build` compiles. The corpus loader validates all 126 posts at build time, so a malformed post cannot ship.
- **Working tree divergence:** two untracked page directories, `src/app/(marketing)/harvard-referencing-support/` and `src/app/(marketing)/urgent-cipd-help/`. Both are complete, production-quality pages (full metadata, canonicals, Service + FAQPage + Breadcrumb JSON-LD, CTA prefill). They are **not committed, not in the sitemap, and have zero inbound links** — work was interrupted mid-wiring. Current state is the worst of both worlds; a decision is P0 (§M.1).
- **Platform:** Next.js 14.2.35 App Router on Vercel; Neon Postgres as lead system of record; private Vercel Blob with mediated downloads; Resend for alerts and subscriber contacts; daily retention cron; admin dashboard with status pipeline and internal quote engine.

## B. Content inventory

- **126 blog posts, ~167k words, 27 clusters.** 17 unit clusters (all units covered), 4 skills-core pillars (structure, critical analysis, reflective writing, study skills), Harvard referencing cluster (7), resubmission cluster (5), choosing-CIPD cluster incl. 7 country guides and 3 level study guides.
- **90 posts carry `reviewed`** (Phase 3A/3B standard: 1,100+ words, strict machine gates). **36 legacy posts (2026-06/07 era) are below current standards** (~500–700 words) and deliberately unstamped — upgrading them requires real content work, queued behind traffic data.
- **6 lead magnets**, each with a landing page and printable download; auto-rendered per cluster via `src/content/pillars.ts`.
- 17 unit pages, 3 level support pages, services/pricing/how-it-works/FAQ/about, 3 case studies.
- Machine-enforced editorial gates in `src/content/__tests__/posts.test.ts`: pillar resolution (no orphan posts), related-slug resolution, em-dash ban, FAQPage parse, and reviewed-article gates (length, single CTA, no criteria reproduction).

## C. Search / indexation readiness

Full technical sweep performed (sitemap, canonicals, robots, redirects, discovery, thin pages, schema, HTTP behaviour). Summary:

**Sound (verified):**
- `metadataBase` set; 100% canonical coverage on indexable pages; canonicals built from routing identity, never request params.
- All 126 posts at click depth 2 (home → /blog → article); no pagination gaps; no orphans among tracked routes; header dropdown links are always in the DOM.
- robots.ts + layout noindex + `x-robots-tag` defence in depth on /admin, /portal, /api; not-found page noindexed; no accidental noindex anywhere.
- FAQPage schema is content-backed on every emitting page (blog derivation reads the actual rendered blocks; all 17 units have backing guidance). No fabricated ratings/reviews anywhere.
- 404 behaviour correct on all dynamic routes; `generateStaticParams` coverage exact; no soft-404 vectors.
- Blog study guides vs level support pages: intent differentiation held (verified titles).

**Issues (by severity):**

| # | Finding | Severity |
|---|---|---|
| C1 | Article JSON-LD missing `dateModified` — the `reviewed` date exists on 90 posts and is already used by the sitemap, but dropped from schema | High |
| C2 | Article JSON-LD missing `image` (no per-post image exists) — blocks Article rich results on all 126 posts | High |
| C3 | The two money pages: uncommitted + unlinked + not in sitemap (decision needed) | High |
| C4 | Apex→www redirect is not version-controlled (empty next.config, cron-only vercel.json) — **must be verified in the Vercel domains dashboard (owner)** | High (unverifiable from repo) |
| C5 | `/send-your-brief` is indexable but ~60 crawlable words and duplicates `/contact` intent → recommend `noindex, follow` | Medium |
| C6 | `public/downloads/*.html` (6 printables) are crawlable, ungated near-duplicates of the `/resources/*` landing pages → disallow or noindex | Medium |
| C7 | No in-body internal links anywhere — the `Block` model has no link variant. All article linking is structural (banner/related/magnet). Biggest structural SEO lever available | Medium |
| C8 | Level support pages link down to nothing (no units, no articles) — one-way link flow into a dead end | Medium |
| C9 | `/samples` thin with essay-mill-adjacent query intent → thicken or noindex | Medium |
| C10 | Sitemap static-route `lastModified` frozen at 2026-07-08 | Medium |
| C11 | No named human author (Article author = Organization); Organization has no `sameAs`/entity signals | Medium |
| C12 | Homepage passes no editorial links to /blog, /resources, /cipd-units (nav-only reachability) | Low |
| C13 | `tags` frontmatter populated on all 126 posts but no topic-hub route consumes it (dormant, harmless) | Info |

**Interpreting the previously observed GSC exclusions** (technical vs authority — do not conflate):
- *Discovered / crawled – currently not indexed*: for a site whose corpus is mostly 4–6 weeks old with low external authority, this is primarily an **authority/quality-threshold signal**, not a bug. The technical fixes above (C1–C10) remove excuses; links and time remove the cause.
- *Duplicate without user-selected canonical*: plausible technical culprits found: `downloads/*.html` twins (C6) and, if the apex redirect is missing (C4), dual-host duplication.
- *Page with redirect*: expected from trailing-slash 308s and (if configured) apex→www — benign.
- A fresh GSC pull is the prerequisite for saying more; that is an owner action (§M.2). **No GSC data was available to this audit and none is invented here.**

## D. Analytics state

- **Vercel Web Analytics is live** with a typed, PII-safe event layer (`src/lib/analytics.ts`): 17 events covering CTA clicks (with placement token + source route), the full funnel (started → 4 step-completions → review → created), magnet submissions, WhatsApp/email clicks, upload outcomes. Property allowlist makes PII leakage impossible by construction. A written funnel-reading spec exists in the module.
- **Access gap:** the Vercel connector available to this environment is authenticated to the wrong team scope, so no analytics numbers appear in this audit. The data exists; reading it requires the owner (dashboard) or a connector re-auth (§M.2).
- **Not integrated:** Google Search Console (no code needed — property verification is an owner action). No server-side event store: events live only in Vercel's product (retention/aggregation limits apply); the DB captures the lead-level funnel from submission onward, which is the part that matters for revenue attribution.

## E. Content-to-lead attribution (highest-priority finding)

**What each lead already persists** (Neon `leads` table): `source_page`, `source_page_type` (derived from the *landing* page), `referrer`, `utm_source/medium/campaign`, `entry_cta` (CTA placement token), user-confirmed `level/unit_code/support_type/submission_type`, `country`, `deadline`, `word_count`, scoring, full status milestones (`contacted_at` → `quote_sent_at` → `payment_confirmed_at` → `completed_at`/`lost_at` + `lost_reason`), and admin quote fields (`quoted_amount`, `quote_currency`, recommendation snapshot).

**Answerable today:** enquiries by landing-page *type* (article vs unit vs level vs home), by CTA placement, by referrer/UTM, by unit and support type; quote rate, quote amounts, win/loss, and time-to-milestone for all of those. First-touch discipline is already correct (sessionStorage, first touch wins).

**The gaps (exactly three):**
1. **Landing page *path* is captured but never submitted.** `captureAttribution()` stores `landedOn` in sessionStorage; `buildAcquisitionContext()` uses it only to derive the type. Result: *“Which article generated this enquiry?”* is unanswerable; *“an article did”* is. This is a one-column, one-field fix touching context → funnel payload → validation → schema → repository (+ tests, + migration).
2. **Lead-magnet subscribers never reach the database.** `/api/subscribe` validates a full acquisition context, then stores the contact only in Resend + a notification email. Magnet conversion rates and magnet→enquiry linkage (email join at analysis time) are impossible today. Fix: a small `subscribers` table persisting what is already collected (email, resource slug, acquisition context, created_at) with a retention policy consistent with the existing cron.
3. **Actual paid amount is not recorded** — `quoted_amount` is the revenue proxy. A `paid_amount`/`paid_currency` pair entered manually at payment confirmation closes it.

All three extensions are first-party, use data already being collected or already entered by the owner, add **no new personal data categories, no cookies, no fingerprinting**. This is the recommended maximum: anything beyond it (session replay, third-party analytics, cross-site IDs) fails the privacy bar and is not needed to answer the business questions.

## F. Conversion measurement

- Pre-submission: measurable in Vercel Analytics (CTA click rate by placement/route; step drop-off per the funnel spec).
- Post-submission: fully measurable from the DB (enquiry → quote → payment-confirmed → completed, all timestamped; loss reasons recorded).
- **Missing piece:** nobody can *see* this without writing SQL. The admin dashboard is operational (work a lead) not analytical (understand the funnel). A small `/admin/insights` page of read-only rollups — enquiries/quotes/wins/revenue by landing page, cluster, CTA, source, month — turns the existing data into the business model in §5 of the directive. Depends on E.1 for page-level granularity.
- With E.1–E.3 + GSC access, every metric in the directive's business-performance model becomes computable except "organic sessions" (Vercel Analytics, exists) and impressions/clicks/indexation (GSC, owner action). Revenue-per-1,000-organic-visitors then falls out arithmetically.

## G. Authority / backlink readiness

**Genuinely linkable assets already live:** the command-verb cheat sheet + library article; the Harvard referencing pillar + printable checklist; the reflective model bank (structures + sentence stems); the critical analysis self-check; the resubmission planner; country guides for KSA/Qatar/Nigeria/Kenya/India (rare, honest content in an underserved niche); the three-level comparison guide. These are the assets outreach can legitimately pitch to HR/education/student-advice/professional-development sites.

**Gaps:** no glossary (3C scope); no statistics/original-research page (see §H — the strongest future link asset); no named author or credentials block and no editorial-policy page (blueprint E-E-A-T items, still unbuilt — this now matters for both Google and buyers); Organization schema has no `sameAs` (no LinkedIn/social entity anchors).

**Honest constraint:** authority, not technique, is the binding limit on indexation for a 5-week-old content estate. The fixes in §C remove technical excuses; only links and time move the authority needle. Excluded on principle per directive: purchased links, PBNs, farms, automated submissions.

## H. Original-research readiness (framework only — no findings manufactured)

The lead schema already supports anonymised aggregates on: level, unit, support type, first-vs-resubmission, deadline pressure (days-to-deadline at enquiry), word counts, country, monthly seasonality — and, later, referral-theme coding from `referred_criteria` (free text; publish coded themes only, never quotes).

**Publication rules (mandatory):** aggregates only; minimum n≥30 per published statistic; suppress any cell n<5; no provider names ever (`provider` field is analytically useful, publicly radioactive); no free-text excerpts; country splits only at region level until volume justifies more. **Current volume is almost certainly far below threshold** — the framework's trigger is sample size, not calendar. When triggered, a quarterly "CIPD Learner Insights" page becomes the single strongest link-earning asset the site could own.

## I. "Ask CIPD Guidance" readiness

- **Corpus: ready.** 126 posts (90 at current standard), clean structured Block model, per-cluster FAQs, unit guidance module — an unusually good retrieval substrate. Citation targets (slugs), related-resources surfaces, and the contextual enquiry CTA (`enquiryUrl`) all exist.
- **Architecture (when built):** build-time embedding index over posts + unit guidance + FAQs → retrieval → grounded answer with citations to our slugs → refusal on insufficient grounding → unanswered-question log (feeds editorial queue) → contextual CTA. Guardrails: answers only from approved public content; explicit refusal of assignment-writing requests; rate limiting; no memory of personal data.
- **Recommendation: technically ready, commercially premature → P2 with a trigger.** The assistant converts traffic the site does not yet have, adds an ops/moderation surface, and answers none of the five feature-creep questions better than attribution/GSC/authority work does today. Suggested trigger: sustained ≥1,000 organic sessions/month or ≥20 enquiries/month, and GSC evidence that content gaps (not authority) are the limiter.

## J. Payments / proposals readiness

- **Today:** manual quoting in admin (recommendation engine + manually set amount/currency/notes), WhatsApp/email delivery, off-site payment, manual status advance. This is correct at current volume.
- **Eventually required for the target flow** (lead → quote → proposal → acceptance → deposit/payment → status → delivery): signed single-use proposal URLs rendering a client-facing quote; acceptance capture (timestamp + IP-free consent record); a payment provider (Stripe or similar — **paid third-party service, owner account required**); deposit/balance logic; receipt generation; webhook → `AWAITING_PAYMENT → IN_PROGRESS` auto-advance. Schema is ~80% ready (statuses, milestones, quote fields exist); estimated effort 1–2 focused weeks when justified.
- **Status: PARK** per directive, with trigger = enough qualified enquiries that manual invoicing is a real operational cost (suggest: >10 quotes/month).

## K. Technical debt

1. **No CI.** Gates run locally; push auto-deploys production. Vercel's build enforces corpus validity + types, but vitest and lint never run on deploy. A minimal GitHub Action (vitest + tsc + lint on push) closes a real ship-a-regression risk.
2. **No inline links in the Block model** — was a content-model deferral, now an SEO cost (C7). Codec + renderer + gates change.
3. Article JSON-LD built inline in the blog page, not in `src/lib/schema.ts` (escapes schema unit tests).
4. Sitemap static `lastModified` frozen (C10); `urls.ts` has a dead ternary branch (cosmetic).
5. Dev-server quirk: posts load at module init; new articles need a dev-server restart (documented in memory, catches every content session).
6. 36 legacy posts below editorial standard (known, queued behind traffic data).
7. `/portal` parked demo still ships (noindexed, auth-gated; dead weight only).
8. `AUDIT.md` (July) is stale; `AGENT-HANDOFF.md` updated through the consolidation pass but does not mention the uncommitted money pages.

## L. Security / privacy

**Strong posture, verified in code:** private Blob store with server-mediated, auth-gated downloads; constant-time Basic Auth that fails closed; honeypot + time-gate + rate limiting on both capture endpoints; client-supplied URLs discarded server-side; analytics PII-safe by construction; 90/180-day retention cron with orphan sweep; honest capture semantics (lead never silently lost).

**Concerns / watch items:**
- Subscriber records live in Resend (US processor) with no local record — simultaneously a data-minimisation plus and an attribution/erasure-tracking minus; the proposed `subscribers` table should align with the existing retention policy and be reflected in the privacy page.
- `referred_criteria` free text can contain personal data; covered by retention, but keep it out of analytics and any research output (already the rule).
- Admin is single-factor Basic Auth — acceptable at current scale; rotate credentials periodically; revisit if a second operator is added.
- Placeholder contact details from early build must be confirmed replaced before any paid promotion (owner check).

## M. Highest-ROI next actions — prioritised roadmap

Every item: **Why · Impact · Complexity · Dependencies · Owner action? · Paid service?**

### P0 — blocks acquisition, conversion, or measurement

1. **Decide and ship (or delete) the two money pages** (`/harvard-referencing-support`, `/urgent-cipd-help`) — commit + wire into nav, footer, sitemap, pillar registry. *Why:* they capture the two highest-commercial-intent queries the content estate feeds; currently they are built but unreachable. *Impact:* direct conversion surface for existing article traffic. *Complexity:* XS (wiring was mid-flight). *Deps:* none. *Owner:* approve direction (work was interrupted mid-wiring). *Paid:* no.
2. **Unblock measurement access (owner):** (a) verify cipdguidance.com in Google Search Console (DNS or meta-tag — no code) and export the current coverage + performance view; (b) either re-authenticate the Vercel connector to the correct team scope or review the Web Analytics dashboard directly. *Why:* the entire Published→Indexed→Clicks half of the funnel is invisible until this happens; Phase 3C sizing depends on it. *Impact:* unlocks C, D, and the go/no-go on future content. *Complexity:* XS. *Owner:* **yes — cannot be done from the repo.** *Paid:* no.
3. **Verify apex→www redirect in the Vercel domains panel** (owner, 5 minutes). *Why:* if absent, the site is duplicated across two hosts. *Paid:* no.
4. **Landing-page attribution: persist `landedOn` → `landing_page` column** (context → payload → validation → schema → migration → tests). *Why:* answers "which article generated this enquiry" — the audit's single most important gap given the business target. *Impact:* every content-ROI question becomes answerable. *Complexity:* S (~1 day with tests). *Deps:* none. *Owner:* no. *Paid:* no.
5. **Persist subscribers to the DB** (small table; data already collected). *Why:* magnet conversion + magnet→lead linkage; currently invisible. *Complexity:* S. *Deps:* privacy-page wording tweak (owner glance). *Paid:* no.
6. **Article schema: add `dateModified` (from `reviewed`) and `image`** (site OG image as fallback; per-post images later). *Why:* rich-result eligibility across 126 posts + freshness signal already earned. *Complexity:* S (move Article builder into `schema.ts`, add tests). *Paid:* no.
7. **Index hygiene pair:** `noindex, follow` on `/send-your-brief`; disallow/noindex `public/downloads/*.html`. *Why:* removes the two clearest duplicate/thin signals feeding GSC exclusions and protects magnet gating. *Complexity:* XS. *Paid:* no.

### P1 — high expected business impact

8. **Inline-link support in the Block model** + a contextual linking pass across pillars and commercial-adjacent articles. *Why:* the largest structural SEO lever on the site; every article currently hoards its authority. *Complexity:* M (codec + renderer + gates + curated pass). *Deps:* none technically; do after P0.6. *Paid:* no.
9. **Level pages link down** to their units and study guides (LevelPage). *Why:* fixes one-way link flow into the three most commercial pages. *Complexity:* S. *Paid:* no.
10. **`/admin/insights` rollup page** — enquiries, quote rate, win rate, revenue (quoted + paid) by landing page, cluster, CTA, source, month. *Why:* turns existing data into the directive's business model; makes "which content creates revenue" a page, not a query. *Complexity:* M. *Deps:* P0.4/P0.5 for full granularity; useful even before. *Paid:* no.
11. **`paid_amount` field + revenue rollups.** *Why:* revenue currently proxied by quotes. *Complexity:* XS–S. *Owner:* enters amounts at payment confirmation. *Paid:* no.
12. **E-E-A-T block: named author/credentials + `/editorial-policy`** (blueprint items, owner-approved wording needed). *Why:* trust for buyers and for Google on advice content; prerequisite for outreach credibility. *Complexity:* S–M. *Owner:* approve anonymisation level + wording. *Paid:* no.
13. **Minimal CI on push** (vitest + tsc + lint via GitHub Actions). *Why:* production currently deploys ungated beyond the build. *Complexity:* S. *Paid:* no (free tier sufficient).
14. **Sitemap `lastModified` from real content dates** (fold into P0.6 commit if convenient). *Complexity:* XS.

### P2 — valuable, not urgent

15. **Outreach kit for existing linkable assets** (one-pager per asset; personal outreach by owner to HR/education/student sites). *Owner:* yes — outreach is human work. *Paid:* no (declining paid links on principle).
16. **/samples: thicken or noindex** (decision + possibly content work).
17. **Legacy-36 upgrade waves**, prioritised by GSC page data once available. *Deps:* P0.2.
18. **Topic hubs consuming `tags`** — when corpus growth or GSC shows need.
19. **Guides mega-menu + footer sitemap** — nav ceiling is real but not the current constraint.
20. **Ask CIPD Guidance MVP** — trigger: ≥1k organic sessions/mo or ≥20 enquiries/mo (see §I). *Paid:* yes — LLM API costs.
21. **Original-research page** — trigger: n≥30 publishable sample (see §H).

### PARK — explicitly not now

22. **Payments/proposal automation** — trigger: >10 quotes/month (see §J). *Paid when built:* Stripe or similar.
23. **Phase 3C content tranche (~200 articles)** — blocked on GSC evidence that the existing 126 are being indexed and clicked; publishing more into an authority ceiling compounds the "discovered – not indexed" pile.
24. **Portal revival**, country-guides wave 2, glossary buildout — 3C-adjacent, same gate.

---

### The one-paragraph version

The machine is built and clean: 126 posts, sound technical SEO, hardened capture, quote pipeline, typed analytics. What stands between this repo and the first 10 site-sourced clients is not another feature tranche — it is (1) two owner actions that unlock measurement (GSC, analytics access, redirect check), (2) three small first-party attribution extensions so every enquiry names the page that earned it, (3) shipping the two already-built money pages, and (4) patient authority work on assets that already deserve links. Content production should stay stopped until GSC says the existing estate is being consumed.
