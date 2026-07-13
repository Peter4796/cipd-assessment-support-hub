# CIPD Guidance — Engineering, Product, SEO & Conversion Audit

**Date:** 2026-07-13 · **Scope:** full repository at commit `8a7f1a5` · **Status:** audit only, no changes made.

This audit is deliberately blunt. The site is well-built for its age (clean design system, 90 statically-rendered pages, real topical clusters, disciplined ethical positioning), but it has one flaw that outweighs everything else combined, and a set of SEO/UX gaps that are cheap to fix and expensive to ignore.

---

## Executive summary — the five findings that matter most

1. **There is no server-side lead capture. None.** The "Send Your Assessment Brief" form composes a `wa.me`/`mailto:` message client-side and hands off. If the visitor doesn't complete that handoff (app switch fails, mail client not configured, they hesitate), the lead evaporates without a trace. The lead-magnet form is worse: it collects name/email/level/country/deadline and **stores them nowhere** — every email address ever typed into it has been discarded. For a lead-generation business, this is the single most important problem in the codebase.
2. **No Open Graph image exists anywhere.** `twitter.card` is set to `summary_large_image` with no image. Every time the site is shared — including **on WhatsApp, the primary channel** — the link unfurls with no preview. This directly undermines the core acquisition loop.
3. **Canonical URLs exist on only 3 of 33 route files** (blog posts, case studies, unit pages). Home, levels, services, pricing, contact and all index pages have none.
4. **The conversion funnel is unmeasurable.** Vercel Analytics tracks pageviews only. Zero custom events. You cannot currently answer "how many people started the enquiry form?" or "which article produces WhatsApp clicks?"
5. **Content architecture won't survive the stated goal.** `src/content/blog.ts` is a single 2,209-line TypeScript file holding 41 posts. At 100–300 articles this becomes a merge-conflict machine with slow editor performance and no non-developer editing path.

A sixth, strategic point: the **client portal is a distraction for this business**. Your operational reality (Fiverr-style workflow, WhatsApp-first clients) does not need client logins, demo payments, or a five-stage client-facing tracker. The **admin side** is worth making real; the client portal should be parked. WhatsApp *is* your client portal.

---

## PHASE 1 — Codebase audit

### Architecture & routing — GOOD, with caveats
- Next.js 14 App Router, TypeScript, Tailwind. Route groups separate `(marketing)` from `/portal` and `/admin` shells cleanly. 90 pages build statically; blog/case-study/unit routes SSG via `generateStaticParams`.
- **Verdict:** sound foundation. Do not rewrite.

### Component architecture — GOOD
- Sensible primitives (`ui.tsx`: ButtonLink/Section/SectionHeading/CheckList; `PageHero`, `CtaBand`, `Icon`). Pages compose primitives rather than restyling.
- **Debt:** form field styling (`inputCls`/`labelCls` strings) is copy-pasted across `EnquiryForm`, `LeadMagnetForm`, `portal/new`, and both login pages — five near-identical copies. Extract a `<Field>`/`<Input>` set when the lead form is rebuilt (not before; don't churn working code).

### State management — ADEQUATE for demo, not for production
- Portal/admin use a `localStorage` store via `useSyncExternalStore` (`src/lib/portal/store.ts`), seeded from `seed.ts`. Honest, well-documented demo. Two hydration bugs were already found and fixed (cached snapshots; mounted-gate on auth redirects) — the pattern is now correct but remains browser-only.
- **Implication:** admin "data" is per-browser fiction until a database lands.

### Data architecture — the strongest and weakest part
- **Strong:** all content is typed data (`Post`, `Unit`, `CaseStudy`, `Level`, `Service`) rendered through one `RichContent` block renderer. The `unit?: string` field on posts powers automatic two-way pillar linking — genuinely good design that already produced two working topical clusters (5CO01, 5HR01).
- **Weak:** `units.ts` lacks the fields the topical-authority plan needs: no learning outcomes, no assessment criteria, no command verbs, no related-services mapping. The `Post` taxonomy is a single free-text `category` string; no tags, no controlled vocabulary.
- **Weak:** one-file-per-collection doesn't scale (see finding 5).

### Type safety — GOOD. Strict TS, typed content schemas, no `any` leakage found.

### Error handling & loading states — MISSING
- No `error.tsx`, no custom `not-found.tsx`, no `loading.tsx` anywhere. A content typo that throws at render shows the default Next error screen; 404s show the unstyled default. Cheap to fix, meaningful for trust.

### Form architecture — the core business gap
- `EnquiryForm` (contact page): client-only; "submit" reveals WhatsApp/email compose buttons. Two-step friction, zero persistence, zero notification to you.
- `LeadMagnetForm`: collects PII, `handleSubmit` is a stub — **data is discarded**. The "no spam" promise is currently trivially true because nothing is stored.
- `portal/new`: writes to localStorage only, and — important — **shows the auto-calculated price estimate directly to the client**, which contradicts your requirement that pricing be an internal recommendation only.

### File upload — cosmetic
- `FileDrop` and the contact form capture **file names only**. Nothing is uploaded anywhere. Users reasonably believe they've sent you their brief. This is a trust risk: the UI over-promises.

### Security
- `/admin` is behind fail-closed HTTP Basic Auth middleware (`src/middleware.ts`) driven by `ADMIN_PASSWORD` env — good stopgap. Password comparison is not constant-time (minor; acceptable at this threat level).
- The in-app admin passcode `cipd-admin` ships in the client bundle (`session.ts` exports it) — fine *only* because Basic Auth sits in front and the data is fake. Must be removed when real data lands.
- No rate limiting on `/api/quote` (harmless today — pure function, no persistence).
- No secrets in repo; `.env.local` gitignored; `.env.example` documented. Good.

### Performance — GOOD
- ~96KB first-load JS on marketing pages, all static, fonts via `next/font`, images optimized (logo 77KB, favicon 6.9KB). No blocking third parties. No action needed beyond adding an OG image (which is a static asset, not a perf cost).

### Mobile & accessibility — MOSTLY GOOD, one real failure
- Mobile-first layouts throughout; mobile menu works; forms are single-column on small screens.
- **Failure:** desktop nav dropdowns (Services, Resources) are `group-hover` only — **keyboard and touch-precision users cannot open them**. The child links are reachable elsewhere (footer, index pages), so it's not a hard block, but it's a WCAG miss on the primary nav.
- Accordion uses real `<button>`s with `aria-expanded` — good. `aria-label` on WhatsApp float — good. No skip-link (minor).

### Technical SEO
| Item | Status |
|---|---|
| Metadata (title/description/keywords) | ✅ Every page, well-written |
| Sitemap | ✅ Dynamic, 77 URLs, auto-includes new content |
| robots.txt | ✅ Correct; blocks /portal /admin /api |
| noindex on private routes | ✅ |
| Canonicals | ❌ Only blog/[slug], case-studies/[slug], cipd-units/[code] |
| OG image | ❌ **Absent entirely** |
| Structured data | ⚠️ FAQPage on /faq, Article on posts. Missing: Organization/ProfessionalService (site-wide), BreadcrumbList, FAQPage on the two `*-faqs` pillar articles and unit pages, Service schema on service/level pages |
| Breadcrumbs | ⚠️ Visual only (PageHero), no schema |
| RSS feed | ❌ None (nice-to-have for a content site) |
| Duplicate-content risk | ✅ Low — pillar guides and unit pages are differentiated; no thin programmatic pages |

### Analytics readiness — pageviews only. `@vercel/analytics` installed; `track()` never called.

### Conversion UX
- Strengths: persistent WhatsApp float, dual hero CTAs, CtaBand on every page, unit pages carry contextual CTAs, trust strip and integrity positioning are consistent.
- Weaknesses: enquiry form friction (see above); the pricing page explains quote-based pricing well but is a dead end for measurement; no urgency-aware path (a "deadline in 3 days" visitor gets the same funnel as everyone).

### Maintainability — GOOD except content scale (finding 5) and the duplicated form styling.

---

## PHASE 2 — Product audit (persona journeys)

**A. Level 5 learner starting a new assessment (e.g. searches "5CO01 assignment help")**
- Lands on `/cipd-units/5co01` or a pillar guide. ✅ Best-served persona: hub + 8 guides + CTAs exist.
- Trust concerns: "is this legit / ethical / confidential?" — integrity notice helps; **no testimonials/social proof anywhere** is the gap.
- Barrier: the CTA leads to a form that doesn't actually send anything to you.
- Ideal CTA: "Send your 5CO01 brief, get a quote today" → multi-step form pre-filled with unit=5CO01. **Currently the contact form has no unit pre-fill from unit pages** — an easy, high-leverage fix.

**B. Level 7 learner struggling with critical analysis**
- Lands on `/blog/what-is-critical-analysis-in-cipd` or `/cipd-level-7-support`. Content serves them; the level page is strong.
- Gap: no 7-series pillar yet (7CO01 planned); critical-analysis article should cross-link harder to Level 7 support and 7CO01 unit page.
- Trust concern at L7: expertise depth. A "who reviews your work" / credentials block would materially help this persona. Currently anonymous.

**C. Resubmission after assessor feedback**
- Highest-intent, most emotionally urgent persona. Content exists (resubmission guide, tutor-feedback guide, resubmission case study). 
- Gap: **no dedicated `/resubmission-support` service landing page** — resubmission is a bullet inside /services. This persona deserves a page whose headline mirrors their situation ("Referred on a CIPD unit? …") with a feedback-upload-first form. Search terms like "CIPD resubmission help" currently land on a blog post with generic CTAs.

**D. UAE professional, urgent deadline**
- Lands on `/blog/studying-cipd-in-the-uae` or a unit page. WhatsApp-first design fits them perfectly.
- Gaps: no urgency path (the form treats a 48-hour deadline like a 30-day one); UAE reassurance signals (time-zone coverage, response time) exist on /contact but not near unit-page CTAs; a "Fast-turnaround support" mention would convert here. The unused `whatsappUae*` config fields suggest a second line was planned — either use or remove.

**E. Informational reader, not ready to buy**
- Lands on any hub article. Reads, leaves. The lead magnet exists to catch them — **but its form discards their email**, so the entire nurture path is broken. Fixing capture + a simple "CIPD tips" email trickle turns this persona from bounce into pipeline.

**Overall:** journeys A and B are ~70% served; C and E are materially underserved; D is one urgency-flag away from well-served. All five share the same root blocker: no real lead capture.

---

## PHASE 3 — SEO architecture (target state)

### URL structure — recommendation: KEEP existing URLs
The brief proposes `/units/[code]` and `/levels/3|5|7`. The site already ranks-in-progress on `/cipd-units/[code]` and `/cipd-level-N-support`, which are keyword-richer and already in Google's index (69+ URLs submitted). **Renaming now = redirect churn during the most fragile indexing window, for zero ranking benefit.** Keep current URLs. If aesthetic consistency matters later, add 301s in `next.config.mjs` as a P3.

`/guides/[slug]` as a separate namespace from `/blog/[slug]` is also not recommended yet: it splits authority and creates a "which bucket?" decision for every article. The existing `category` + `unit` fields already distinguish guides from news-style posts. Revisit only if editorial volume genuinely demands it.

### Unit data model (extend `src/content/units.ts`)
```ts
type Unit = {
  code; slug; level; title; qualification; summary; overview;   // existing
  category: "core" | "specialist" | "research";                  // NEW
  learningOutcomes: { id: string; text: string }[];              // NEW
  assessmentCriteriaNotes: string[];                             // NEW (guidance, not verbatim CIPD text — avoid copyright)
  commandVerbs: string[];                                        // NEW
  challenges: string[];                                          // existing
  relatedServices: string[];                                     // NEW → /services anchors
  faqs?: { q: string; a: string }[];                             // NEW → FAQPage schema on unit pages
}
```
Related guides/articles need no new field — `postsForUnit(code)` already derives them.

### Content storage — MDX, migrated at the current 41-post checkpoint
- **Recommendation: native `@next/mdx`, one file per article** under `src/content/posts/*.mdx` with typed frontmatter (zod-validated at build). No CMS yet — a CMS adds cost/complexity before there's an editor who isn't a developer. Contentlayer is unmaintained; avoid.
- Migration is mechanical (the block model maps 1:1 to markdown) and gets cheaper the sooner it happens. At 100+ posts in one .ts file, editor performance and git conflicts become a real tax.
- Taxonomy: keep `category` (controlled list: Getting started, Assessment writing, Referencing, Research skills, Critical thinking, Resubmissions, Study skills, Student guides, plus one per pillar unit) and add `tags: string[]` for cross-cutting themes (UAE, Level 5, urgent, reflective-writing).
- Internal linking: current `related: slug[]` (manual) + `unit` (automatic) is the right blend. Add one automatic layer: "more in {category}" fallback when `related` < 3. Do **not** build a semantic-similarity engine; manual curation is winning here.
- Breadcrumbs: render Home → Blog → Category → Post and emit `BreadcrumbList` JSON-LD from the same data.
- Schema: Article (exists) + FAQPage on any post/unit with `faqs` + Organization site-wide + Service on level/service pages.
- Canonical strategy: self-referencing canonical on **every** route via a shared helper. Sitemap: current dynamic implementation is correct; add `lastModified` from real post dates for units too.

---

## PHASE 4 — Lead generation system (design)

### The flow: "Send Your Assessment Brief" — 3 steps, not 10 fields
Single-page multi-step (state persisted to `sessionStorage` on every change):

1. **Step 1 — The assessment** (lowest friction, highest info): Level (3 big buttons) → Unit code (autocomplete from `units.ts`, free-text allowed) → Support type (the 5 types from ops: Assessment guidance / Draft review & improvement / Resubmission support / Tutor feedback interpretation / Harvard referencing) → Word count → Deadline (date picker with "urgent" auto-badge ≤ 5 days).
2. **Step 2 — The files** (optional, skippable): brief upload + tutor-feedback upload (shown only when support type is resubmission/feedback-interpretation). Client-side validation: pdf/doc/docx/png/jpg, ≤10MB, progress bar. Storage: **Vercel Blob** (free tier) — private, tokenized URLs.
3. **Step 3 — You**: Name, Email, WhatsApp number with country-code select (default +44/+971 by locale). Submit → `POST /api/leads`.

Server side (`/api/leads`): validate (zod) → compute lead score → email you via **Resend** (free tier, 3k/mo) with all fields + file links → return reference number → confirmation screen offering WhatsApp deep-link *as a bonus channel, not the only channel*. When the deferred database lands, the same route also inserts a row; nothing else changes.

Entry points: hero CTA, CtaBand, unit pages (pre-filled `?unit=5CO01&level=5`), resubmission page (pre-filled support type). Error recovery: failed submit keeps state and offers WhatsApp fallback — the current handoff becomes the *backup*, which is its proper role.

### Lead scoring
```
score = level(3:10, 5:20, 7:30)
      + support(guidance:10, referencing:10, draft review:20, feedback interp:20, resubmission:30)
      + urgency(≤3d:30, ≤7d:20, ≤14d:10, else 0)
      + wordCount(≥5000:15, ≥3000:10, ≥1500:5)
      + briefUploaded:15 + feedbackUploaded:10
      + whatsappProvided:10 + emailProvided:5
Classification: <40 LOW · 40–69 WARM · 70–99 HIGH · ≥100 or (urgent + brief + WhatsApp) PRIORITY
```
Computed server-side in `/api/leads`, included in the notification email subject (`[PRIORITY 112] 5CO01 resubmission, 3 days`), stored when DB exists.

---

## PHASE 5 — Admin operations (design)

Reuse the existing admin UI shell (table, filters, detail view, notes, quote panel — all already built) but:
1. Back it with the real DB (Neon, deferred by owner — this is the dependency gate).
2. Replace the 5-status pipeline with the 9 operational statuses: NEW LEAD → BRIEF REVIEWED → QUOTE SENT → AWAITING PAYMENT → IN PROGRESS → QUALITY REVIEW → DELIVERED → REVISION → COMPLETED. This is a constants change (`statuses.ts`) — the pipeline component is already generic.
3. Add lead score + priority flag columns and a deadline-proximity sort (urgent-first is already half-built: the red ≤3d badge exists).
4. Status history: append-only `activity` array already models this; persist it.
5. **Quotation engine:** `estimateQuote()` already computes level/word-count/urgency/support-type pricing. Two changes: (a) keep it admin-only — **remove the client-facing "instant estimate" screen** in `portal/new` (contradicts approval-first pricing); (b) surface it in the admin lead detail as "suggested: £X–Y" next to a manual amount field (this UI also already exists).
6. Replace Basic-Auth+demo-passcode with a single proper auth (env-credentialled session or Auth.js) **at the same time real data lands, not before**.

The client-facing portal (`/portal/*`): **park it.** Keep the code, remove footer link, revisit only if repeat clients ever ask for it.

---

## PHASE 6 — Analytics (design)

Implementation: `track()` from the already-installed `@vercel/analytics` — zero new dependencies, works on the current plan (custom events have plan limits; if exceeded, graduate to self-hosted Umami/Plausible later — P3).

One helper `src/lib/analytics.ts` with typed event names:
`lead_form_started`, `lead_form_step_completed {step}`, `lead_form_abandoned` (beforeunload with unsent state), `brief_upload_started/completed`, `lead_created {score_band, level, support}`, `whatsapp_clicked {location}`, `email_clicked`, `service_page_viewed`, `unit_page_viewed {code}`, `article_viewed {slug}`, `article_cta_clicked {slug}`, `pricing_viewed`.

Funnel: Visitor → content/unit page → `lead_form_started` → step 2 → step 3 → `lead_created` → (offline) quote → client. The offline tail lives in the admin DB, not analytics. Wire `whatsapp_clicked` everywhere immediately — it's today's real conversion and currently invisible.

---

## PHASE 7 — Prioritised roadmap

| # | Item | Class | Problem → Impact | Solution | Complexity |
|---|------|-------|------------------|----------|------------|
| 1 | **Server-side lead capture** (`/api/leads` + Resend email + confirmation screen; wire EnquiryForm & LeadMagnetForm into it) | **P0** | Leads evaporate; magnet emails discarded → direct revenue loss daily | API route + zod + Resend (free acct + domain verify needed from owner) | Low-Med |
| 2 | **OG image** (1200×630 branded, referenced site-wide) + og/twitter image metadata | **P0** | Every WhatsApp/LinkedIn share unfurls blank → weakens the primary channel | Static asset + 2 lines in root metadata | Low |
| 3 | **Canonical URLs on all routes** via shared metadata helper | **P0** | Index-splitting risk during fragile early indexing | `alternates.canonical` per page | Low |
| 4 | **whatsapp_clicked + core event tracking** | **P0** | Flying blind on the only working conversion path | `track()` helper + instrument CTAs | Low |
| 5 | Custom 404 + error.tsx (branded, with CTA) | P0 | Default error pages leak trust | Two small components | Low |
| 6 | Keyboard-accessible nav dropdowns (click-toggle + focus-within) | P0 | WCAG failure on primary nav | Header.tsx focus handling | Low |
| 7 | **Multi-step "Send Your Assessment Brief" form** with persistence, validation, scoring, unit pre-fill from unit pages | **P1** | Current form under-collects and under-converts | New `LeadForm` + `/api/leads` v2 | Med |
| 8 | **File uploads (Vercel Blob)** for brief + tutor feedback | P1 | UI currently implies uploads that don't happen | Blob + progress UI + server tokens | Med |
| 9 | Resubmission service landing page (`/resubmission-support`) | P1 | Highest-intent persona has no dedicated page | New page reusing existing sections | Low |
| 10 | Structured data expansion (Organization, BreadcrumbList, FAQPage on units & pillar FAQs, Service) | P1 | Rich-result opportunities unclaimed | Shared JSON-LD helpers | Low-Med |
| 11 | Social proof block (testimonials/ratings, anonymised) | P1 | Zero third-party trust signals site-wide | Component + owner-supplied quotes (dependency: real reviews, e.g. from Fiverr history) | Low |
| 12 | MDX migration (one file per post, zod frontmatter) | P1 | 2,209-line blog.ts blocks the 100–300 article plan | `@next/mdx` + mechanical migration script | Med |
| 13 | Unit model enrichment (LOs, criteria notes, command verbs, FAQs, related services) | P1 | Unit pages are thinner than pillar guides; schema needs the data | Extend `units.ts` + unit page sections | Med |
| 14 | Remove client-facing instant price estimate; keep estimator admin-only | P2 | Contradicts approval-first pricing policy | Delete estimate screen in portal/new (or park portal entirely) | Low |
| 15 | Real database (Neon) + admin on live leads + 9-status pipeline + real admin auth | P2 | Admin is a demo; ops still run in WhatsApp threads | Deferred by owner (cost/setup decision already made); design ready | Med-High |
| 16 | Lead scoring surfaced in admin + deadline-first sorting | P2 | Prioritisation is manual | Depends on #15 | Low |
| 17 | Consolidate form primitives (`<Field>`) during #7 | P2 | 5× duplicated styling | Refactor within new form work | Low |
| 18 | Email nurture for lead-magnet subscribers | P3 | No path from reader → client over time | Resend broadcasts or ESP; needs #1 first | Med |
| 19 | URL aliasing (`/units/*` → 301 → `/cipd-units/*`) if ever desired | P3 | Cosmetic only | next.config redirects | Low |
| 20 | RSS feed, skip-link, self-hosted analytics upgrade | P3 | Marginal gains | — | Low |

**Recommended order:** 1 → 2 → 3 → 4 → 5 → 6 (one focused P0 pass, ~a day of work, no new paid services except a free Resend account) → then 7+8+17 as one project (the new lead engine) → 9, 10, 11 → 12, 13 → then the DB tranche (14–16) when the owner green-lights Neon.

**Explicit non-goals reaffirmed:** no rewrite, no CMS yet, no programmatic thin pages, no client portal investment, no new UI framework, no dependency additions beyond `resend` and (later) `@vercel/blob` + MDX tooling.
