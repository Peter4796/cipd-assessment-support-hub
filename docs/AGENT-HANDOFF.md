# AGENT HANDOFF — CIPD Guidance

**Written:** 2026-07-17 at local commit `bd57720` (branch `main`).
**Audience:** a fresh coding agent with zero conversation history.
**Grounding:** verified against the repository, git history, the test suite
(194 hermetic + 7 live-database integration tests), the installed `@vercel/blob`
and `@neondatabase/serverless` SDK sources, and production behaviour confirmed on
the live site. Where something is an assumption it is labelled as such.

> **PROJECT LOCATION:** the repository lives at **`/Users/la/Desktop/cipd website`**
> (moved from `/Users/la/cipd website` on 2026-07-16; a stray shell of the old
> path may persist). Verify with `git -C <path> log -1` before working.

---

## 1. PROJECT PURPOSE

**CIPD Guidance** (production: `https://www.cipdguidance.com`) is a specialist,
ethically-positioned academic support service for learners taking CIPD
qualifications (the UK professional body for HR). The owner runs an existing
Fiverr-based CIPD support operation; this site is its direct-acquisition channel,
with clients from the UK, UAE, Kenya, Nigeria, the US and elsewhere.

- **Business model:** organic search traffic → assessment-support enquiries →
  owner reviews → quotes manually (WhatsApp/email) → client converts. Payment and
  fulfilment happen off-site. No e-commerce.
- **Funnel:** SEO content feeds the multi-step intake at `/send-your-brief`.
  **Capture-first:** the lead is persisted server-side before any WhatsApp
  handoff; WhatsApp is an optional continuation.
- **Ethical boundaries (non-negotiable):** guidance, coaching, review, editing,
  referencing, resubmission support — never "we write your assignment", never
  guaranteed grades. Reusable integrity statement: `src/lib/site.ts` →
  `integrityNotice`. Pricing is admin-only; no client-facing calculator. The site
  states independence from the CIPD (footer).
- **Copy rule from the owner:** no em-dashes in reader-facing copy (they read as
  AI-generated). Use commas/colons/periods.

## 2. CURRENT PRODUCTION ARCHITECTURE

| Layer | Implementation |
|---|---|
| Framework | Next.js **14.2.35**, App Router, TypeScript strict, Tailwind CSS 3 |
| Runtime | Vercel (serverless + edge for OG images); Node 21 locally |
| Repo | GitHub `Peter4796/cipd-assessment-support-hub`; **push to `main` auto-deploys production** |
| Domain | Canonical `https://www.cipdguidance.com` (apex 308→www). DNS at Namecheap |
| **Database** | **Neon Postgres 17** (project `cipd-leads`, database `neondb`, eu-west-2) via the Vercel Marketplace integration. **The database is the system of record for leads.** Access: Drizzle ORM over `@neondatabase/serverless` HTTP driver — see §4 |
| Lead capture | `POST /api/leads`: validate → score → dedup → **persist** → notify (email is an alert, not the record) — see §3 |
| Admin | `/admin` is a real operations dashboard on live rows (list/filters/detail/status pipeline/notes/quote engine), server components + server actions, behind HTTP Basic Auth middleware (fails closed; constant-time compare). `/admin/files/[...pathname]` streams private blobs. `/portal/*` remains a parked demo |
| File storage | **Private** Vercel Blob store `cipd-assessment-files`, OIDC auth, presigned client uploads via `POST /api/uploads`; server-mediated downloads only — see §6 |
| Retention | Daily Vercel Cron (03:00 UTC) at `GET /api/cron/retention`: policy deletion (90/180-day windows), 48h orphan sweep, alert-email retry — see §8 |
| Email | Resend REST via `src/lib/email/resend.ts` (fetch-based, no SDK). Sending domain `notifications.cipdguidance.com` (mail-only DNS; keep click-tracking OFF). Recipient `LEAD_NOTIFY_EMAIL` |
| Phone input | `react-phone-number-input` + `libphonenumber-js`: all ~245 countries, searchable selector, E.164 values end-to-end (`src/components/PhoneNumberField.tsx`); server normalisation in `normaliseWhatsapp` |
| Content | **Blog: one markdown file per post** in `src/content/posts/NNN-slug.md` (41 posts; numeric prefix = curated order, slug in frontmatter = URL). Loader `src/content/posts.ts` parses a strict markdown subset (dependency-free codec in `src/lib/content/markdown.ts`: `##`/`###`/`>` callout/`-`/`1.` lists/paragraphs, frontmatter values are JSON literals) into the same Block model rendered by `RichContent`; a malformed post fails tests AND the build. Other collections stay typed TS modules (`units.ts`, `case-studies.ts` etc., types in `src/content/types.ts`). Migration was proven lossless (round-trip + rendered-output parity vs production). Inline formatting (links/bold) is deliberately not supported yet; adding it is the next content-model step if SEO internal linking demands it |
| Analytics | Vercel Web Analytics; typed `src/lib/analytics.ts` (PII excluded by construction) |
| SEO | Site-wide OG image, canonicals everywhere, dynamic sitemap, robots disallowing `/portal` `/admin` `/api` |

## 3. LEAD LIFECYCLE — END-TO-END

```
Visitor → funnel (/send-your-brief) or contact form
│  attachments upload FIRST via OIDC presigned flow (§6) — pathnames only
▼
POST /api/leads ─ src/app/api/leads/route.ts
│  rateLimit → validateLeadInput (honeypot/time-gate → fake 200;
│  normaliseAttachments DISCARDS client URLs; whatsapp → E.164)
│  → scoreLead (internal only, max 147; thresholds 26/56/91)
│  → leadFingerprint (email+level+unit+support+submission+deadline+words+
│     message+sorted pathnames — NEVER email alone)
│  → dedup: identical fingerprint within 15 min → 200 with ORIGINAL reference
│  → INSERT lead + attachments + initial NEW status event (atomic db.batch)
│  → notifyLead (Resend alert; failure recorded on the row, never rolls back)
│  Responses: captured if EITHER durable channel holds it:
│    DB ok + email ok → 201 · DB ok + email fail → 201 (notify_error stored,
│    admin badge, cron retries) · DB fail + email ok → 201 with
│    [NOT PERSISTED] subject marker · both fail → 5xx honest fallback
│    No DATABASE_URL → exact pre-P2 email-as-record behaviour
▼
Owner: email alert (subject `[PRIORITY] CIPD Level 7 Resubmission — 7CO03 —
Due 16 July`, mediated download links, "Open lead CG-XXXXXX in the dashboard")
AND the /admin dashboard row
▼
/admin (Basic Auth): list with status pills/filters/urgency; detail page:
status pipeline (10 statuses, first-entry milestone timestamps, terminal
reopen guard, lost reason), internal notes, quote panel (recommendation vs
actual), WhatsApp/mailto actions, mediated downloads, per-file "Delete now"
▼
Daily cron: retention deletion + orphan sweep + alert retry (§8)
```

**Status model (owner-approved):** `NEW → REVIEWING → CONTACTED → QUOTE_SENT →
AWAITING_PAYMENT → IN_PROGRESS → QUALITY_REVIEW → DELIVERED → COMPLETED`, plus
`LOST` (terminal, reachable from any non-terminal). Terminals: COMPLETED, LOST;
leaving one requires the explicit reopen control. Archiving is the `archived_at`
FIELD, not a status. Transitions are flexible admin state with an append-only
`lead_status_events` history; milestone timestamps (`contacted_at`,
`quote_sent_at`, `payment_confirmed_at` on AWAITING_PAYMENT→IN_PROGRESS,
`work_started_at`, `delivered_at`, `completed_at`, `lost_at`) stamp on first
entry and are never overwritten. Logic: `src/lib/leads/status.ts` (pure) +
`updateLeadStatus` in the repository.

**Quote engine (ADMIN ONLY, owner-approved 2026-07-16):**
`src/lib/admin/quote.ts`. USD. `mid = (60 + 30×words/1000) × support × level ×
urgency`, floored at per-support minimums, rounded to $5.
Support multipliers: guidance 1.00 · draft review 0.70 · resubmission 0.85 ·
feedback interpretation 0.45 · referencing 0.40. Minimums: $60/$50/$60/$35/$30.
Level: L3 0.90 · L5 1.00 · L7 1.25. Urgency: <24h(or overdue) 1.40 · 1–3d 1.25 ·
4–7d 1.10 · else 1.00. The recommendation is computed server-side per request
and appears ONLY in authenticated admin HTML; the actual quote (manually
editable amount + currency + notes + `quoted_at`) is stored WITH a
recomputed-server-side recommendation snapshot (`quote_recommended_mid`).
`src/lib/portal/quote.ts` is legacy demo-portal code — do not use for pricing.

## 4. DATABASE — SCHEMA, ACCESS, MIGRATIONS, RECOVERY

- **Schema:** `src/lib/db/schema.ts` — `leads` (50 columns: identity, client,
  assessment, scoring, acquisition, funnel meta, operational status +
  milestones, admin-only quote fields, notification state, dedup fingerprint),
  `lead_attachments` (pathname-only storage reference + retention/deletion
  bookkeeping that SURVIVES blob deletion), `lead_notes`, `lead_status_events`.
  All children FK → leads ON DELETE CASCADE. Statuses/classifications are text
  columns validated in the app layer (no pg enums, deliberate).
- **Client:** `src/lib/db/client.ts`. `isDbConfigured()` = presence of
  `DATABASE_URL` (mirrors `isBlobConfigured()` honest degradation).
  ⚠️ **`fetchOptions: { cache: "no-store" }` on the neon() client is
  LOAD-BEARING**: the HTTP driver queries via fetch(), which Next's Data Cache
  on Vercel will otherwise cache — a production bug (2026-07-17) served stale
  empty admin queries while the data existed. Never remove it.
- **Transactions:** the HTTP driver has NO interactive transactions; atomic
  multi-statement writes use `db().batch([...])` (executed as one transaction).
- **Repository:** `src/lib/db/leads.ts` is the ONLY module that queries lead
  tables. Routes/pages/actions call it; they never build queries.
- **Migrations:** plain SQL in `drizzle/` generated by `npm run db:generate`
  (offline diff of schema.ts), applied by `npm run db:migrate` (needs
  `DATABASE_URL`; drizzle.config.ts falls back to reading `.env.local`).
  History table: `drizzle.__drizzle_migrations`. Applied: `0000_p2_lead_persistence`.
  **Procedure for schema changes:** edit schema.ts → `db:generate` → review the
  SQL → commit BOTH → `db:migrate` locally against Neon → deploy. Never edit an
  applied migration file; add a new one.
- **Recovery:** Neon free tier keeps point-in-time restore (~24h window) via
  branch-from-timestamp in the Neon console (Branches → create from past time;
  swap connection string or restore over main). The database holds ONLY lead
  operations data; the site itself is fully code-defined. Worst-case loss of the
  DB loses lead history but not the site: alert emails at
  `support@cipdguidance.com` remain an independent paper trail. Blob files are
  NOT in the database; deleting a lead row cascades its attachment ROWS but not
  the blobs (the orphan sweep then removes those blobs after 48h).
- **Local dev:** `vercel env pull .env.local` provides `DATABASE_URL` (+ blob
  OIDC vars). Integration tests:
  `node --env-file=.env.local node_modules/vitest/vitest.mjs run
  src/lib/db/__tests__/leads.integration.test.ts` — they auto-skip without
  `DATABASE_URL` and leave the database exactly as found.

## 5. RESEND CONFIGURATION

Unchanged from P1 except role: the notification is an ALERT (the DB is the
record). Sending domain `notifications.cipdguidance.com` (Ireland region,
mail-only DNS — **keep click/open tracking OFF**; tracking rewrites break links
through the TLS-less subdomain). `reply_to` = the client. Failure recording:
`notified_at` / `notify_error` / `notify_attempts` on the lead row; the daily
cron retries recent failures (last 48h, <5 attempts). All outbound URLs go
through `src/lib/urls.ts` (canonical HTTPS; blob pathnames encoded per-segment).
Known cosmetic quirk: Namecheap PrivateEmail webmail opens download links in an
orphaned tab (their handler + our attachment disposition); the URL itself works.

## 6. VERCEL BLOB — CRITICAL AUTHENTICATION MODEL (unchanged, still binding)

> ⚠️ Do NOT replace the OIDC presigned upload flow with `handleUpload` or a
> `BLOB_READ_WRITE_TOKEN` client flow without re-auditing the installed SDK.

- Store `cipd-assessment-files`, **PRIVATE**, connected to the project. Provisions
  `BLOB_STORE_ID` + `BLOB_WEBHOOK_PUBLIC_KEY`; **no RW token exists** for private
  stores. SDK (`@vercel/blob` 2.6.1) resolves credentials: explicit token → OIDC
  (`VERCEL_OIDC_TOKEN` + `BLOB_STORE_ID`) → RW token env → throw.
- Upload: browser `uploadPresigned` → `POST /api/uploads`
  (`handleUploadPresigned` → `issueSignedToken`, namespace + extension/MIME/size
  checks, 10 MB, 5 files, `addRandomSuffix`) → browser PUTs to the store.
  `handleUpload` (classic) CANNOT authenticate against a private store.
- Download: ONLY via `GET /admin/files/[...pathname]` (Basic Auth middleware →
  namespace + traversal check → `get(pathname, {access:'private'})` → streamed
  attachment). `del()` and `list()` used by retention resolve OIDC the same way.
- Rules single source of truth: `src/lib/leads/uploads.ts`.

## 7. SECURITY INVARIANTS (preserve every one)

1. Blob store stays private; `access: 'private'` everywhere; raw blob URLs never
   stored, emailed, rendered, logged, or sent to analytics — pathnames only.
2. Downloads stay server-mediated; `/admin/*` (pages, actions, files, everything)
   stays behind the fail-closed Basic Auth middleware (constant-time compare).
3. Client-supplied attachment URLs are discarded in `normaliseAttachments()`.
4. No Blob/DB credential in client code; no `NEXT_PUBLIC_*` secrets;
   `VERCEL_OIDC_TOKEN`/`DATABASE_URL` never referenced client-side.
5. Lead score, classification and EVERYTHING quote-related are internal:
   admin HTML and internal email only — never public pages, client bundles,
   API responses, or analytics.
6. Analytics receives no PII/filenames/pathnames (typed `SafeProps`).
7. Traversal (`..`) and out-of-namespace paths rejected at every layer.
8. All user text length-capped + control-char-stripped at validation;
   HTML-escaped at render (`esc()` in templates is the only HTML assembly).
9. Server actions validate/allowlist every input (amounts strictly positive
   integers; statuses/currencies allowlisted; attachment deletion resolved
   through the lead, never by raw id).
10. Cron fails closed: no `CRON_SECRET` → 503; wrong bearer → 401.
11. Logs carry counts, references and machine codes — never message bodies,
    filenames or credentials. Email failure never rolls back a persisted lead.
12. Capture-first: the client sees success when EITHER durable channel holds
    the lead; failures degrade to direct channels, never a dead end.
13. Never push `main` without explicit owner approval (auto-deploys production).

## 8. RETENTION AUTOMATION (P2.5)

- **Policy** (`src/lib/leads/retention.ts`, pure; owner decision 2026-07-16):
  orphaned uploads (no lead row) 48h after upload; LOST leads 90 days after
  `lost_at` capped at 180 days after submission; never-progressed leads
  (NEW/REVIEWING/CONTACTED/QUOTE_SENT) 90 days after submission; COMPLETED 180
  days after `completed_at`; proceeded/active leads never auto-deleted.
- **Job:** `GET /api/cron/retention` (vercel.json, daily 03:00 UTC; Hobby-plan
  compatible). Storage deletion strictly precedes DB marking
  (`deleted_at`/`deletion_reason` survive; failures increment
  `delete_attempts`, retried to a cap of 10 then surfaced). Also: orphan sweep
  (paginated `list({prefix:'enquiries/'})` vs `allKnownPathnames()`), alert
  retry. `?dry=1` reports without acting. Manual per-file deletion: "Delete
  now" on the admin detail page (`owner_request` reason).
- **Privacy page:** the live wording at `/privacy` predates automation and was
  deliberately NOT changed (owner reviews wording before any public change).
  Retention of completed-lead documents (180d) is not yet reflected there.

## 9. TEST ARCHITECTURE

**194 hermetic tests, 14 files** (`npm test`, vitest 1.6.x; Node 21 cannot run
vitest 4 — keep 1.x until Node upgrade) **+ 7 live-database integration tests**
(see §4 for invocation; auto-skip without `DATABASE_URL`).

| Suite | Covers |
|---|---|
| scoring / validation / uploads / templates / urls | P0/P1 suites, unchanged guarantees (incl. security-sensitive: client-URL discard, no-script emails, canonical HTTPS) |
| phone | 245-country dataset, six-country E.164 matrix incl. KE trunk-zero, locale defaults, search filter |
| fingerprint | dedup identity: multi-field, order-insensitive, never email-alone |
| api/leads route | capture contract matrix (DB×email outcomes), dedup, honeypot, unconfigured degradation |
| status | first-entry milestone stamps, no overwrite, terminal reopen guard, LOST reasons |
| admin/quote | owner's six representative pricing scenarios + multiplier/minimum/urgency behaviour |
| admin/filters | searchParam validation, urgency windows, date helpers |
| retention + cron route | policy windows/caps/boundaries, delete-before-mark ordering, retry bookkeeping, dry run, orphan sweep, fail-closed auth |
| integration (live Neon) | atomic insert, fingerprint lookup, notify state, admin reads, pipeline walk, quote persistence, cascade delete |

**Release gates before any push:** `npm test` · `npx tsc --noEmit` ·
`npx next lint` · `npm run build` (94 static pages expected).

## 10. ENVIRONMENT VARIABLES

| Variable | Purpose | Required |
|---|---|---|
| `DATABASE_URL` | Neon Postgres (auto-injected by the Marketplace integration, all environments) | for persistence/admin/cron |
| `CRON_SECRET` | Bearer auth for `/api/cron/retention`; generate long random; Vercel Cron sends it automatically | for retention automation |
| `RESEND_API_KEY` / `EMAIL_FROM` / `LEAD_NOTIFY_EMAIL` | Alert email transport | for alerts |
| `RESEND_AUDIENCE_ID` | Lead-magnet subscriber storage | optional |
| `ADMIN_USER` / `ADMIN_PASSWORD` | Basic Auth for `/admin` (fails closed without password) | for admin |
| `BLOB_STORE_ID` / `BLOB_WEBHOOK_PUBLIC_KEY` / `VERCEL_OIDC_TOKEN` | Private blob OIDC (auto) | auto |
| `NEXT_PUBLIC_SITE_URL` + Vercel URL vars | canonical-origin fallbacks | optional |

Reference `.env.example`. Local: `vercel env pull .env.local` (re-pull when the
short-lived OIDC token expires).

## 11. COMPLETED PHASES (chronological)

Pre-P0 marketing build → `AUDIT.md` (5241c84) → **P0** lead-capture foundation
(eadb930) → **P1** funnel + private uploads + mediated downloads (8d880cd,
f396faf, bf76292, 70939ee) → **P2.1** database foundation (cd00ab9) →
**phone input** (12cda05) → **P2.2** persistence/dedup/failure semantics
(3d2a91d) → **P2.3** real admin dashboard (09a80b4) → **P2.4** admin operations
(633500b) → **no-store cache fix** (64aa28f, load-bearing — see §4) → **P2.5**
retention automation (bd57720) → **P2.6** this document.

All production-verified through a real enquiry (`CG-PV8PN7`-era testing):
funnel with international phone, private upload, scored alert email with
dashboard link, database row, admin operations.

## 12. NEXT WORK (priority order, owner-approved sequencing)

1. ~~MDX content migration~~ — DONE (this tranche): one .md per post, provably lossless.
   (blog.ts at 2,209 lines is the bottleneck). Native `@next/mdx`, one file per
   post, typed frontmatter. Contentlayer rejected (unmaintained).
2. Outstanding AUDIT P1 items: social proof block, structured-data expansion
   (Organization site-wide, Service on level pages), unit-model enrichment.
3. Privacy wording update for retention windows — owner must approve wording
   before publication (see §8).
4. Deferred/optional: shared rate-limit store if abuse appears, malware
   scan-on-upload queue, RSS, skip-link.

## 13. REJECTED APPROACHES (do not reintroduce)

All P0/P1 rejections stand (public blob URLs, classic handleUpload, client
price calculator, URL restructuring, client portal investment, zod/SDK
dependencies). P2 additions:

| Approach | Why rejected |
|---|---|
| Supabase as DB | Owner chose Neon: leaner fit, Vercel-native env provisioning, HTTP driver; no need for Auth/RLS/Realtime |
| Prisma / raw SQL | Drizzle chosen: schema-as-TS (agent-readable), plain SQL migrations, no codegen/engine, tiny runtime |
| pg enums for statuses | text + app validation — pipeline can evolve without enum migrations |
| Auth provider for admin | Basic Auth retained (single owner, HTTPS, fails closed, hardened constant-time); revisit only with a second operator or compromise |
| Hard status state machine | Flexible transitions + append-only history + terminal reopen guard — single-owner corrections must stay possible |
| ARCHIVED as a status | `archived_at` field preserves the final COMPLETED/LOST outcome |

## 14. GIT / DEPLOY STATE (verified 2026-07-17)

- Branch `main` at `bd57720` + the P2.6 docs commit; earlier phases through
  `64aa28f` are pushed and live in production.
- **Pushing `main` auto-deploys production. Never push without explicit owner
  approval.** The owner performs pushes.
- Production spot checks: apex 308→www; `/admin` 401 unauthenticated;
  `GET /api/leads` 405; `/api/cron/retention` fails closed pending
  `CRON_SECRET`.

## 15. FRESH AGENT STARTUP PROCEDURE

1. Read this file, `AUDIT.md`, `docs/lead-acquisition.md`.
2. Confirm the project path (see banner) and `git log --oneline -10` against §11.
3. `npm test` (expect 194 passing, 7 skipped without DATABASE_URL),
   `npx tsc --noEmit`, `npx next lint`, `npm run build` (94 pages).
4. If touching the database: read §4 fully (batch transactions, no-store,
   migration procedure). If touching uploads/downloads: §6. If touching
   quotes/scoring: §3 + invariant 5.
5. Produce a short repository-state verification report before modifying code.

---

Conversation history is non-authoritative. The repository, tests, installed SDK
sources, deployment configuration and verified production behaviour are the
sources of truth.
