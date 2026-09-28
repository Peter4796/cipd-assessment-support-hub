# Context Handoff — CIPD Guidance (written 2026-09-28)

For the next working session. Everything here was verified against the repo and production on 2026-09-28. Treat the repository as source of truth; this document is the map.

## 0. Environment gotchas (read first)

- **The repo moved.** It now lives at `/Users/la/Desktop/Projects/cipd website` (was `/Users/la/Desktop/cipd website`). The Claude session cwd `/Users/la/cipd website` is an empty shell — always use absolute paths into the Projects location. Check `.claude/launch.json` still points at the right directory before using the preview server.
- **GitHub auth works now**: `gh` is logged in as Peter4796 (keyring) and wired as git credential helper. Pushes work from the session. The owner's own terminal lacks `/opt/homebrew/bin` on PATH, so give him full-path commands if he must run `gh` himself.
- `DATABASE_URL` is in `.env.local` (production Neon — reads are fine, be careful with writes). `npm run db:migrate` applies drizzle migrations; use `node --env-file=.env.local` for scripts.
- Dev server: posts load once at module init — **restart the preview server** to see new/edited posts.
- Today the working tree is DIRTY on purpose — see §2.

## 1. Business context

- Owner: George (georgekanja.10@gmail.com — identification/attribution only). Site: **www.cipdguidance.com**, repo `Peter4796/cipd-assessment-support-hub`, Vercel auto-deploys `main` → **pushing main = deploying production; only push on explicit owner instruction.**
- Business: ethical CIPD assessment support (guidance/review/coaching — never writing assignments, never guarantees). Positioning: global, with UK + Gulf emphasis (never UAE-only, never geo-restricted).
- **Objective: first 10 paying clients acquired through cipdguidance.com** (not Fiverr). Strategy phase: MEASURE → DIAGNOSE → OPTIMISE → BUILD. Do NOT start Phase 3C content; the corpus must compound first.
- Voice rules: **no em-dashes ever** (owner reads them as AI), UK spelling, no invented facts/statistics/prices/providers, country content uses the "check job adverts" recognition method only.

## 2. Exact current state

**Deployed (origin/main = local HEAD = `1316f47`, live and verified 2026-08-27):**
- P0.1 Money pages `/harvard-referencing-support` + `/urgent-cipd-help` — live, in nav/footer/sitemap(172 URLs)/PILLAR_PAGES, full schema, CTA prefills.
- P0.2 First-touch landing-page attribution — `landing_page` persisted per lead (verified end-to-end on production).
- P0.3 `subscribers` table — magnet signups persist first-party alongside Resend.
- P0.4 Realised revenue — `paid_amount/paid_currency/paid_at` + admin "Payment received" panel (distinct from quotes).
- P0.5 Article schema — `dateModified` (only where `reviewed` exists) + `image`, builder in `src/lib/schema.ts`.
- DB migrations 0001–0003 applied to production Neon.

**Uncommitted in the working tree (P0.6, finished but commit was interrupted 2026-08-31):**
- `src/app/(marketing)/send-your-brief/page.tsx` → `robots: {index:false, follow:true}` + decision comment
- `src/app/sitemap.ts` → `/send-your-brief` removed
- 6 × `public/downloads/*.html` → `<meta name="robots" content="noindex">` (kept crawlable deliberately so the directive is seen)
- Also untracked: `docs/POST-3B-AUDIT.md` (the 2026-08-07 audit report; fine to commit alongside).
- **Next session's first task: re-run gates, commit P0.6 (message drafted in git-log style of prior commits), ask owner to approve push.** Gates were green when the edits were applied.

**Not started (P1 queue — ALREADY APPROVED by owner on 2026-08-31, "go on P0.6 and the P1 sequence"):**
1. **Inline-link model**: render `[label](/path)` in paragraph/list/callout blocks (`src/components/RichContent.tsx`); strip link syntax in `faqPairsFromBlocks` (schema answers stay plain); corpus gate in `src/content/__tests__/posts.test.ts` (internal-only hrefs, every target resolves: blog slugs, PILLAR_PAGES, static routes, /resources/*, /cipd-units/*); codec round-trip test. Codec (`src/lib/content/markdown.ts`) needs no change — text is stored verbatim.
2. **Editorial linking pass** (~30 pages): convert existing exact-title mentions of other posts into links (first mention only, never self-link); referencing-cluster CTA phrases → `/harvard-referencing-support`; resubmission spokes → `/cipd-resubmission-support`; fix pillar↔spoke asymmetry (reflective spoke outranks its pillar). Priority targets = striking-distance list in §3.
3. **LevelPage down-links**: `src/components/LevelPage.tsx` currently links to almost nothing — add that level's units, its study guide, resources.
4. **CTR pass on exactly 5 pages** (titles/metas only, keep slugs): `cipd-vs-shrm-which-is-right` (94 imp, 0% CTR), `secondary-referencing-explained` (117, 1.7%), `3co04-employee-lifecycle-explained`, `critical-analysis-self-check` (pos 6, 0%), `is-cipd-level-7-worth-it`. **Protect (do not touch): `referencing-cipd-sources` (pos 6.6), `5hr01-complete-guide` (12.5% CTR).**
5. **WhatsApp attribution**: include current page URL in prefilled wa.me message + landing-page property on `whatsapp_clicked`. (Evidence: the first real prospect arrived via WhatsApp, invisible to the lead system.)
6. **Minimal CI**: GitHub Action running vitest + tsc + lint on push (production currently deploys with only the build as a gate).

## 3. GSC evidence base (export 2026-08-27, 3 months, in `~/Downloads/cipdguidance.com-Performance-on-Search-2026-08-27.xlsx`)

- Trajectory: weekly impressions 38→150→98→349→227→800→517 — genuine acceleration, tiny base (~2.4k imp, 76 clicks, 3.2% CTR total).
- Ranking mass sits at positions 11–30 → **authority ceiling, not technical failure**. Say so; don't over-rewrite on-page.
- Striking distance (pos 8–30, imp≥20): reflective-models-compared (153/15.8), secondary-referencing-explained (117/16.0), cipd-vs-shrm (94/12.9), 3co04-employee-lifecycle (61/13.8), 5hr02-workforce-planning (55/20.8), harvard-referencing-complete-guide (48/12.2), is-cipd-level-7-worth-it (48/14.7), studying-cipd-in-india (48/9.2), 7hr02-strategic-workforce-planning (48/18.0), how-to-pass-cipd-level-5 (41/11.6), cipd-resubmission-support (37/8.8 — the one ranking money page), plus 7co03, 5co01, descriptive-vs-critical, word-count, 7hr03.
- Commercial gap: "cipd level 5 assignment help/answers/examples" (~60+ visible imp) ranks ~80 — real demand, no adequate destination (P2 decision: upgrade `/cipd-level-5-support` + `/samples`; never full sample downloads — integrity analysis in transcript).
- Countries: UK dominant (51/76 clicks). India guide quietly ranking (pos 9.2). UAE weak (pos 38.6). Keep global + UK/Gulf emphasis; no new geo pages.
- Devices: desktop/mobile position gap = query-mix, not technical. No CWV action.
- Cannibalisation: none requiring merges; differentiation held.
- Query sheet covers only ~19% of impressions — **query→page mapping needs owner's per-page GSC exports** (Pages → URL → Queries → Export for the ~10 targets above).

## 4. Parked (triggers, owner-affirmed)

- **Phase 3C content** (~200 queue in blueprint): parked until GSC shows the current 126 compounding; expand winning clusters only.
- **Ask CIPD Guidance** AI assistant: trigger ≈1k organic sessions/mo (currently ~76 clicks/3mo). Corpus technically ready.
- **Payments/proposal automation**: trigger >10 quotes/mo (currently 0 quoted; 1 lead total in DB as of 2026-08-27).

## 5. Owner actions outstanding

- Per-page GSC query exports (top ~10 pages, see §3) — unlocks precise CTR rewrites.
- Privacy page one-liner covering first-party subscriber storage (wording approval).
- E-E-A-T author block + editorial-policy page wording (P2, needs his sign-off).
- Vercel Web Analytics: connector was authed to wrong scope ("peter-gitahis-projects"); he reads the dashboard directly or re-auths.
- GSC "Request indexing" for the two money pages (may already be done).

## 6. Machinery reference (unchanged since P2/3B; full detail in AGENT-HANDOFF.md and CONTENT-BLUEPRINT.md)

- Content: 126 posts (90 `reviewed`, ~167k words, 27 clusters) in `src/content/posts/NNN-slug.md`; strict codec (one block per line, JSON frontmatter values, key order slug/title/description/category/keyword/date/readMinutes/unit?/pillar/tags/reviewed/related); malformed post fails build.
- Gates per change: vitest (244 incl. 7 skipped) + tsc + lint + `next build` + browser verification of affected journeys; commit only when green; **push only on owner instruction**; commits end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Pillars/magnets: `src/content/pillars.ts` (PILLAR_PAGES incl. both money pages; magnetForPillar, 6 magnets). CTA prefill: `enquiryUrl()` in `src/lib/leads/context.ts` (fixed CtaLocation tokens). Leads/attribution: `src/lib/leads/*`, `src/lib/db/*` (schema has full acquisition + quote + paid + status milestones). Analytics: `src/lib/analytics.ts` (typed, PII-safe).
- Security invariants: private Blob + mediated downloads, Basic Auth admin, honeypots/rate limits, retention cron 03:00 UTC, no secrets client-side. Do not weaken.
