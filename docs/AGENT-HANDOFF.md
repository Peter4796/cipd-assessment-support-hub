# AGENT HANDOFF — CIPD Guidance

**Written:** 2026-07-14 at local commit `70939ee` (branch `main`, 2 commits ahead of origin).
**Audience:** a fresh coding agent with zero conversation history.
**Grounding:** everything below was verified against the repository, git history,
`AUDIT.md`, `docs/lead-acquisition.md`, the test suite (86 tests), the installed
`@vercel/blob` SDK source, and manually confirmed production behaviour. Where something
is an assumption rather than a verified fact, it is labelled as such.

---

## 1. PROJECT PURPOSE

**CIPD Guidance** (production: `https://www.cipdguidance.com`) is a specialist,
ethically-positioned academic support service for learners taking CIPD qualifications
(the UK professional body for HR). The owner runs an existing Fiverr-based CIPD support
operation; this site is its direct-acquisition channel.

- **Business model:** attract high-intent organic search traffic → convert to assessment
  support enquiries → owner reviews the requirement → quotes manually → client converts.
  Payment/fulfilment happen off-site (WhatsApp/email). There is no e-commerce.
- **Users & geographies:** HR professionals studying CIPD Level 3 (Foundation), Level 5
  (Associate Diploma) and Level 7 (Advanced Diploma), primarily in the **UK and UAE**.
- **Funnel strategy:** SEO content (unit-code pages + topical blog pillars) feeds a
  multi-step assessment-intake funnel at `/send-your-brief`. The core conversion action
  is "Send Your Assessment Brief". **Capture-first principle:** the lead is captured
  server-side *before* any WhatsApp handoff; WhatsApp is an optional continuation.
- **Ethical boundaries (non-negotiable product positioning):**
  - Guidance, coaching, review, editing, referencing, resubmission support — **never**
    "we write your assignment", never guaranteed grades. The reusable integrity
    statement lives at `src/lib/site.ts` → `integrityNotice`.
  - Pricing recommendations are **internal/admin-only**. No client-facing automatic
    price calculator may exist (a previous one was deliberately removed).
  - The site states it is independent and not affiliated with the CIPD (footer).
- **Copy rule from the owner:** no em-dashes in reader-facing copy (they read as
  AI-generated). Use commas/colons/periods. A lone "—" as an empty-value table
  placeholder is acceptable; internal email templates follow explicit owner formats.

## 2. CURRENT PRODUCTION ARCHITECTURE

| Layer | Implementation |
|---|---|
| Framework | Next.js **14.2.35**, App Router, TypeScript strict, Tailwind CSS 3 |
| Runtime | Vercel (serverless + edge for OG images); Node 21 locally |
| Repo | GitHub `Peter4796/cipd-assessment-support-hub`; push to `main` auto-deploys |
| Domain | Canonical **`https://www.cipdguidance.com`** (apex 308→www). DNS at Namecheap. Constant: `src/lib/site.ts` → `site.url` |
| Routes | 29 pages + 4 route handlers. Marketing pages live in the `src/app/(marketing)/` route group (shared header/footer/WhatsApp float). `/portal/*` (parked demo) and `/admin/*` have their own shells |
| Content | Typed data modules in `src/content/` (`blog.ts` 41 posts, `units.ts` 17 CIPD units, `levels.ts`, `services.ts`, `case-studies.ts`, `site-content.ts`) rendered by `src/components/RichContent.tsx`. Posts with `unit: "5CO01"` auto-link two-way with `/cipd-units/5co01` (pillar clusters) |
| Lead acquisition | `POST /api/leads` (validate → score → notify). Funnel UI: `src/components/funnel/AssessmentFunnel.tsx` at `/send-your-brief`. Legacy single form retained at `/contact` (`src/components/EnquiryForm.tsx`) — same API |
| Email | Resend REST via `src/lib/email/resend.ts` (fetch-based, no SDK). Templates: `src/lib/email/templates.ts`. Service layer: `src/lib/leads/notify.ts`. **The notification email IS the lead persistence** (no DB yet — deliberate, documented) |
| File storage | **Private** Vercel Blob store `cipd-assessment-files`, OIDC auth, presigned client uploads via `POST /api/uploads`; server-mediated downloads via `GET /admin/files/[...pathname]` (see §6 — critical) |
| Admin | `/admin/*` is a **demo dashboard** on localStorage (parked, no real data) EXCEPT `/admin/files/*` which is the real download route. Everything under `/admin` is protected by HTTP Basic Auth middleware (`src/middleware.ts`, fails closed on missing `ADMIN_PASSWORD`) |
| Analytics | Vercel Web Analytics; typed event layer `src/lib/analytics.ts` (the only sanctioned `track()` path). PII is excluded by construction |
| SEO | Site-wide OG/Twitter image (`src/app/opengraph-image.tsx`), canonicals on every indexable route, dynamic `sitemap.ts` (~80 URLs), `robots.ts` disallowing `/portal` `/admin` `/api`, FAQ/Article/Breadcrumb JSON-LD where relevant |

## 3. COMPLETED BUILD PHASES

Pre-P0 history (commits up to `8a7f1a5`): 3-phase marketing build — 11 core pages,
blog/resources/case studies/lead magnet, SEO expansion (17 unit pages, 41 posts, two
unit pillar clusters for 5CO01 and 5HR01), demo client portal + admin, brand/logo/OG,
admin Basic-Auth lock. Then `5241c84` added `AUDIT.md` (full audit + P0–P3 roadmap).

### P0 — Lead acquisition foundation (commit `eadb930`)
| Feature | Problem | Solution | Key files | Status | Tests |
|---|---|---|---|---|---|
| Server-side lead capture | Forms only composed WhatsApp/mailto messages; leads evaporated; lead-magnet emails were discarded | `POST /api/leads`: validation → scoring → Resend notification; honest 503 fallback to direct channels when delivery unavailable | `src/app/api/leads/route.ts`, `src/lib/leads/validation.ts`, `src/lib/leads/scoring.ts`, `src/lib/leads/notify.ts` | **Production-verified** | validation suite |
| Lead scoring | No prioritisation | Pure scorer + classification | `src/lib/leads/scoring.ts` | Live | scoring suite (boundaries + personas) |
| Subscriber capture | Lead-magnet emails silently discarded | `POST /api/subscribe` → Resend Audience contact + low-priority notification; download unlocks regardless | `src/app/api/subscribe/route.ts`, `src/components/LeadMagnetForm.tsx` | Live (Audience ID optional) | validation suite |
| Anti-abuse | Open endpoints | Honeypot + 2.5s time-gate (fake 200 to bots), in-memory rate limit (documented per-instance) | `src/lib/leads/rate-limit.ts`, `validation.ts` | Live | validation suite |
| OG image, canonicals, a11y nav, 404/error, analytics events, contextual CTAs | AUDIT.md P0 findings | See AUDIT.md §Roadmap items 2–6 | `opengraph-image.tsx`, per-page `alternates`, `Header.tsx`, `not-found.tsx`, `error.tsx`, `analytics.ts`, `leads/context.ts` | Live | urls/templates suites partially |
| Removed: client-facing price estimates + `/api/quote`; fake upload UI; portal footer link | Policy + honesty violations | Deleted/stripped | `portal/new`, `EnquiryForm` | Confirmed absent | — |

### P1 — Assessment intake funnel (commit `8d880cd`) + fixes (`f396faf`, `bf76292`, `70939ee`)
| Feature | Problem | Solution | Key files | Status | Tests |
|---|---|---|---|---|---|
| Multi-step funnel | Single form under-collected; serious clients had to repeat everything on WhatsApp | 7 steps: level → unit (searchable, level-filtered from `units.ts`) → support → details (conditional referred-criteria for resubmissions) → documents → contact (intl phone codes) → review/edit → submit | `src/app/(marketing)/send-your-brief/page.tsx`, `src/components/funnel/AssessmentFunnel.tsx` | **Production-verified** | funnel URL/prefill via `enquiryUrl` tests; runtime-verified in browser |
| Contextual prefill | CTAs lost context | `enquiryUrl({level,unit,support,submission,cta})` single builder; validated on parse AND server-side | `src/lib/leads/context.ts` | Live | uploads suite (`enquiryUrl`) |
| Form persistence | Refresh lost progress | sessionStorage, safe fields ONLY (never contact details/free text/attachment refs), 24h cutoff, restore banner, "Start a new enquiry" | `src/lib/funnel/persistence.ts` | Live (locally verified) | runtime-verified |
| Real private uploads | Fake filename-only uploads | See §6 (critical section) | `src/app/api/uploads/route.ts`, `src/components/funnel/FileUploader.tsx`, `src/lib/leads/uploads.ts` | **Production-verified** | uploads suite |
| Mediated downloads | Private blobs unreachable via raw URL | `GET /admin/files/[...pathname]` behind Basic Auth, streams via SDK | `src/app/admin/files/[...pathname]/route.ts` | **Production-verified** (direct URL) | templates suite asserts link shape |
| Lead schema v2 + scoring v2 | Funnel data richer than P0 | provider/submissionType/referredCriteria/attachments/funnel-meta; new attachment/context/intent points, max 147, thresholds 25/55/90 | `types.ts`, `scoring.ts` | Live | persona distribution suite |
| Upgraded notification | Owner needs one scannable email | Subject `[PRIORITY] CIPD Level 7 Resubmission — 7CO03 — Due 16 July`; DOCUMENTS section with explicit `Download <category> — <file>` labels; missing-brief/missing-feedback warnings | `src/lib/email/templates.ts` | **Production-verified** | templates suite |
| Resubmission landing page | Highest-intent persona had no page | `/cipd-resubmission-support` (FAQ + Breadcrumb JSON-LD, contextual CTAs) | `(marketing)/cipd-resubmission-support/page.tsx` | Live | — |
| Privacy page | None existed | `/privacy` — honest data handling incl. uploads + ~90-day retention | `(marketing)/privacy/page.tsx` | Live | — |
| URL hardening | Defense for outbound links | `src/lib/urls.ts` (see §5) | `urls.ts` | Committed locally (`bf76292`) | urls suite |

## 4. LEAD FUNNEL — EXACT END-TO-END FLOW

```
Visitor lands on any page
│  <AttributionCapture/> (marketing layout) stores first-touch UTM/referrer → sessionStorage
│  CTA built by enquiryUrl() carries ?level&unit&support&submission&cta
▼
/send-your-brief  ······················ src/app/(marketing)/send-your-brief/page.tsx
│  AssessmentFunnel.tsx: parsePrefill() validates query params; steps render;
│  saveFunnelProgress() persists safe fields; trackEvent() emits step events
▼
Step 5: document upload (optional) ····· src/components/funnel/FileUploader.tsx
│  GET /api/uploads → { available } (honest degradation when Blob unconfigured)
│  validateFile() client-side → buildBlobPathname() → uploadPresigned() [@vercel/blob/client]
│      → POST /api/uploads ············· src/app/api/uploads/route.ts
│          handleUploadPresigned() → getSignedToken → issueSignedToken() [OIDC]
│      → browser PUTs file directly to the PRIVATE store via single-use presigned URL
│  attachment metadata (pathname, category, size, mime — NO url) kept in component state
▼
Step 7: review → "Send My Assessment Enquiry"
│  POST /api/leads ····················· src/app/api/leads/route.ts
│      rateLimit() [rate-limit.ts] → validateLeadInput() [validation.ts]
│      (honeypot/time-gate → fake 200; normaliseAttachments() DISCARDS client URLs,
│       enforces enquiries/ namespace, category/MIME/size)
│      → scoreLead() [scoring.ts] → classification
│      → notifyLead() [notify.ts] → sendEmail() [email/resend.ts]
│         subject/html from leadNotificationSubject/Html() [email/templates.ts]
│         document links via mediatedFileUrl() [urls.ts] — canonical HTTPS
│      → 201 { ok, reference "CG-XXXXXX" }   (failure → honest fallback UI, never a dead end)
▼
Resend delivers to LEAD_NOTIFY_EMAIL (production: support@cipdguidance.com), reply_to = client
▼
Owner clicks "Download Assessment brief — <file>.pdf"
│  https://www.cipdguidance.com/admin/files/<encoded pathname>
▼
GET /admin/files/[...pathname] ········· src/app/admin/files/[...pathname]/route.ts
│  src/middleware.ts Basic Auth runs FIRST (fails closed without ADMIN_PASSWORD)
│  namespace check (enquiries/, no "..") → get(pathname, { access: "private" }) [OIDC]
│  → streamed Response (attachment disposition, no-store, noindex)
▼
Visitor confirmation: "Your assessment enquiry has been received." + reference
└─ optional "Continue on WhatsApp" — structured fields only, never free text or URLs
```

## 5. RESEND CONFIGURATION

- **Sending domain:** `notifications.cipdguidance.com` — verified in Resend, region
  Ireland (eu-west-1). This subdomain has **mail-only DNS** (no A record / web endpoint).
- **Recipient:** `LEAD_NOTIFY_EMAIL` → `support@cipdguidance.com` (production).
- **Env vars:** `RESEND_API_KEY` (sensitive, Production), `EMAIL_FROM` (verified sender
  on the sending domain), `LEAD_NOTIFY_EMAIL`, optional `RESEND_AUDIENCE_ID`
  (subscriber persistence; duplicate contacts → 409 treated as success).
- **Transport:** `src/lib/email/resend.ts` — plain `fetch` to `https://api.resend.com`
  (no SDK dependency). `reply_to` is set to the lead's email. When unconfigured, sends
  return `{ ok:false, error:"unconfigured" }` and the API surfaces an honest failure.
- **Tracking assumption (IMPORTANT):** during link debugging it was established that
  Resend click-tracking, if enabled, rewrites hrefs through the sending subdomain —
  which cannot serve TLS (mail-only DNS) and would break/warn on click. The
  application's own hrefs were verified correct. **Assume click/open tracking should
  remain OFF for this domain**; if links ever warn again, check the received email's
  raw href before touching code.
- **URL generation:** all outbound absolute links go through `src/lib/urls.ts`
  (`siteOrigin`/`absoluteUrl`/`mediatedFileUrl`): canonical origin preferred, fallback
  `https://${VERCEL_PROJECT_PRODUCTION_URL}` (hostname-only var handled), HTTPS forced,
  localhost rejected in production, preview links use `VERCEL_URL`, blob pathnames
  encoded per-segment. 14 tests in `src/lib/__tests__/urls.test.ts`.

## 6. VERCEL BLOB — CRITICAL AUTHENTICATION DECISION

> ⚠️ **DO NOT replace the OIDC presigned upload flow with `handleUpload` or a
> `BLOB_READ_WRITE_TOKEN`-based client upload without first re-auditing the installed
> `@vercel/blob` SDK source and the private-store authentication model.**

- **Installed version:** `@vercel/blob` **2.6.1** (also the latest published at audit
  time). Pinned facts below were read from `node_modules/@vercel/blob/dist/*` source,
  not from documentation.
- **Store:** `cipd-assessment-files`, **PRIVATE**, connected to this project
  (Production + Preview). Connection provisions `BLOB_STORE_ID` and
  `BLOB_WEBHOOK_PUBLIC_KEY`. **No `BLOB_READ_WRITE_TOKEN` exists** — private stores
  are not provisioned with one.
- **SDK credential resolution** (`resolveBlobAuth` in `dist/chunk-A7B3MEJ5.cjs`):
  explicit `token` option → **OIDC** (`VERCEL_OIDC_TOKEN` at runtime + `BLOB_STORE_ID`
  env, or `oidcToken`/`storeId` options) → `BLOB_READ_WRITE_TOKEN` env → throw.
  `VERCEL_OIDC_TOKEN` is injected by Vercel at runtime in Production/Preview and by
  `vercel env pull` locally (short-lived; re-pull when expired).
- **Why the classic flow is incompatible:** `handleUpload` and
  `generateClientTokenFromReadWriteToken` call `getReadWriteBlobTokenFromOptionsOrEnv`,
  which accepts ONLY an explicit token or `BLOB_READ_WRITE_TOKEN` — the client token
  is HMAC-signed *with* the read-write token (`signPayload(payload, readWriteToken)`).
  There is **no OIDC path for `handleUpload` in any published version**. With a private
  store and no RW token, that flow cannot authenticate, period.
- **Why the presigned flow was selected:** `issueSignedToken` goes through
  `requestApi` → `resolveBlobAuth` → **OIDC works**. Its completion webhooks verify
  against `BLOB_WEBHOOK_PUBLIC_KEY` (the SDK default) — exactly what the store
  provisioned. It is the intended private-store client-upload path.
- **Exact upload flow:** browser `uploadPresigned(pathname, file, { access:'private',
  handleUploadUrl:'/api/uploads', onUploadProgress })` → `POST /api/uploads`
  (`handleUploadPresigned`): validates `pathname.startsWith("enquiries/")` and the
  extension allowlist, then `issueSignedToken({ pathname, operations:['put'],
  allowedContentTypes: ALLOWED_MIME_TYPES, maximumSizeInBytes: 10MB,
  validUntil: now+10min })`, `urlOptions: { addRandomSuffix: true }` → browser PUTs
  directly to the store with the single-use presigned URL. The browser never receives
  store credentials.
- **Exact download flow:** email links `mediatedFileUrl(pathname)` →
  `/admin/files/[...pathname]` → Basic Auth middleware → namespace + `..` traversal
  check → `get(pathname, { access:'private' })` (OIDC) → `result.stream` returned with
  attachment disposition, `cache-control: private, no-store`, `x-robots-tag: noindex`.
- **Restrictions (single source of truth: `src/lib/leads/uploads.ts`):** namespace
  `enquiries/YYYY-MM/<category>/`; `sanitiseFileName()` strips paths/control chars/
  dangerous chars, caps at 80 chars; extensions pdf/doc/docx/txt/png/jpg/jpeg with a
  per-extension MIME allowlist (generic/absent declared MIME tolerated, contradiction
  rejected); 10 MB per file; 5 files per lead; traversal (`..`) rejected at upload
  authorisation, lead validation AND download; `isBlobConfigured()` =
  `BLOB_STORE_ID || BLOB_READ_WRITE_TOKEN` (availability probe → honest UI degradation).
- **Never change without re-auditing SDK source:** the upload flow choice; `access:
  'private'` anywhere it appears; the credential expectations of `/api/uploads` and
  `/admin/files`; `addRandomSuffix: true`; the attachment model's URL-free design.

## 7. SECURITY INVARIANTS (preserve all of these)

1. The Blob store remains **private**; uploads explicitly use `access: 'private'`.
2. Raw Blob URLs are **never** emailed, rendered, logged, or exposed to clients.
3. File downloads remain **server-mediated** via `/admin/files/[...pathname]`.
4. Everything under `/admin` stays behind the Basic Auth middleware (fails closed).
5. Client-supplied attachment URLs are **discarded** in `normaliseAttachments()` —
   only namespace-validated pathnames are kept (email link injection impossible).
6. No Blob credential in client code; no `NEXT_PUBLIC_*` Blob/secret variables;
   `VERCEL_OIDC_TOKEN` never referenced client-side.
7. Analytics never receives PII, document content, filenames, pathnames or URLs
   (enforced by the typed `SafeProps` in `src/lib/analytics.ts` — keep it that way).
8. Traversal (`..`) and out-of-namespace paths rejected at every layer.
9. Lead notification emails use canonical HTTPS URLs only (`src/lib/urls.ts`);
   email anchors contain no `target=`, `window.open` or `javascript:` (test-enforced).
10. Pricing recommendations remain **admin-only**; no client-facing automatic price
    calculator (`estimateQuote` in `src/lib/portal/quote.ts` is internal domain logic).
11. Never log credentials, message bodies or document contents; API errors are
    machine codes, never internals.
12. All user text is length-capped + control-char-stripped at validation and
    HTML-escaped at email render (`esc()` — the only HTML assembly point).
13. Capture-first stays: confirmation copy says "enquiry received", never "brief
    received" unless a file genuinely uploaded; failures degrade to direct channels.

## 8. ENVIRONMENT VARIABLES

| Variable | Purpose | Scope | Sensitive | Required | Consumed in |
|---|---|---|---|---|---|
| `ADMIN_USER` | Basic Auth username for `/admin` (default `admin`) | Prod (+local `.env.local`) | no | optional | `src/middleware.ts` |
| `ADMIN_PASSWORD` | Basic Auth password; `/admin` returns 503 without it (fails closed) | Prod (+local) | **yes** | **required** for admin access | `src/middleware.ts` |
| `RESEND_API_KEY` | Resend API auth; without it lead capture returns honest failure | Prod (set, Sensitive) | **yes** | **required** for capture | `src/lib/email/resend.ts` |
| `EMAIL_FROM` | Verified sender on `notifications.cipdguidance.com` | Prod | no | required | `src/lib/email/resend.ts` |
| `LEAD_NOTIFY_EMAIL` | Internal recipient (`support@cipdguidance.com`) | Prod | no | required | `src/lib/email/resend.ts` |
| `RESEND_AUDIENCE_ID` | Persistent subscriber contacts (lead magnet) | Prod | no | optional | `src/lib/email/resend.ts` |
| `BLOB_STORE_ID` | Provisioned by the connected private store; enables SDK OIDC | Prod+Preview (auto) | no | required for uploads | SDK internally; `src/lib/leads/uploads.ts` (`isBlobConfigured`) |
| `BLOB_WEBHOOK_PUBLIC_KEY` | Verifies presigned upload-completion callbacks (SDK default) | Prod+Preview (auto) | no | auto | `@vercel/blob` internally |
| `VERCEL_OIDC_TOKEN` | Runtime OIDC credential, injected by Vercel; short-lived via `vercel env pull` locally | runtime (auto) | **yes** | auto | `@vercel/blob` internally — never in app code |
| `BLOB_READ_WRITE_TOKEN` | **Legacy fallback only** — not provisioned for private stores, not required | — | **yes** | optional | `isBlobConfigured()` fallback branch |
| `NEXT_PUBLIC_SITE_URL` | Optional canonical-origin override for outbound links | any | no | optional | `src/lib/urls.ts` |
| `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL` / `VERCEL_ENV` | Hostname-only fallbacks + environment detection for `siteOrigin()` | auto | no | auto | `src/lib/urls.ts` |

Reference: `.env.example` (no secrets; setup instructions inline).

## 9. TEST ARCHITECTURE

**86 tests, 5 files, all green** (`npm test` → vitest 1.6.x; config `vitest.config.ts`,
`@` alias → `src`). Node 21.5 cannot run vitest 4.x (missing `util.styleText`) — keep 1.x
until Node is upgraded.

| Suite | File | Covers |
|---|---|---|
| Scoring | `src/lib/leads/__tests__/scoring.test.ts` | deadline/word-count banding, classification boundaries (25/55/90), attachment/context/intent points, persona distribution (L3 low → complete L5 HIGH → urgent L7/resubmission PRIORITY), max 147 |
| Validation | `src/lib/leads/__tests__/validation.test.ts` | normalisation, required-field codes, honeypot/time-gate, hostile-context sanitisation, oversized caps |
| Uploads (security-sensitive) | `src/lib/leads/__tests__/uploads.test.ts` | file-type/MIME/size allowlists incl. executables/archives rejection, filename sanitisation, pathname namespacing, **client-URL discard**, traversal rejection, max-files, `isBlobConfigured` OIDC/legacy/absent, `enquiryUrl` |
| Email templates (security-sensitive) | `src/lib/email/__tests__/templates.test.ts` | subject format, classification/score display, documents section + mediated `/admin/files` links, missing-brief/feedback warnings, **no `target=`/`_blank`/`window.open`/`javascript:`**, hostile-filename escaping, `esc()` |
| URLs (security-sensitive) | `src/lib/__tests__/urls.test.ts` | hostname-only env handling, no double-prefix, trailing slashes, prod-vs-preview, encoding of spaces/parentheses, **no http/localhost in production emails**, end-to-end template href assertion |

There is no dedicated download-route test file; its policy layers (namespace, traversal,
auth-before-handler) were runtime-verified and are indirectly pinned by the templates/urls
suites. A route-level unit test is a welcome P2 addition.

**Release gates (all must pass before any push):**
`npm test` · `npx tsc --noEmit` (or rely on build) · `npx next lint` · `npm run build`.
**Pushing `main` deploys production. Never push without explicit owner approval.**

## 10. VERIFIED PRODUCTION BEHAVIOUR

**Production-verified (owner-confirmed on the live site, 2026-07-14):**
- Real test enquiry submitted through the funnel.
- Private PDF uploaded to the private Blob store (OIDC presigned flow).
- Structured notification received at `support@cipdguidance.com` with correct
  assessment metadata, acquisition metadata, and HIGH-INTENT-band scoring displayed.
- The mediated `https://www.cipdguidance.com/admin/files/...` URL, opened directly in
  Chrome, downloads the PDF successfully (TLS valid, Basic Auth, streaming all working).

**Locally verified (dev runtime + tests, not yet re-confirmed in production):**
- Funnel step logic, prefill, persistence/restore/reset, mobile UX, fallback paths.
- API validation matrix (405/400/fake-200-bots/429/503), attachment-injection rejection.
- Download route auth/namespace/traversal behaviour.
- Commits `bf76292` + `70939ee` (URL utility, email label change) — **committed locally,
  not yet deployed**.

**Assumptions / not yet verified:**
- Behaviour of the two unpushed commits in production (identical logic, but unverified).
- Resend click-tracking state in the dashboard (assumed off / should be off — see §5).
- Preview-deployment link generation via `VERCEL_URL` (unit-tested, not exercised live).

**Open compatibility quirk (unresolved, cosmetic):** clicking the document link inside
**Namecheap PrivateEmail webmail** opens an orphaned `about:blank` tab and may not
visibly start the download. Root cause: PrivateEmail's own link handler force-opens
links in new tabs; our response is `Content-Disposition: attachment`, so the tab stays
blank. The email anchors themselves contain no `target`/script (test-enforced). The URL
works when opened directly in a browser. Workaround: open the email in a standard mail
client or copy the link. No further code fix is available at the template level.

## 11. KNOWN ISSUES AND TECHNICAL DEBT

1. **PrivateEmail link-click behaviour** — see §10; cosmetic, external, documented.
2. **`src/content/blog.ts` scale problem** — single ~2,900-line typed file holding 41
   posts. Blocks the 100–300 article roadmap (merge conflicts, editor performance).
   **MDX migration** (one file per post, typed frontmatter) is the accepted plan
   (AUDIT.md §3); contentlayer rejected (unmaintained).
3. **No database** — leads exist only as notification emails; no admin lead list,
   statuses, or blob-lead linkage (see §12).
4. **Demo portal/admin** — `/portal/*` parked (demo data, demo passcode in client
   bundle, price-estimate screens removed); `/admin` dashboard is demo-data-only.
   Quote constants ship in the (Basic-Auth-gated) admin JS bundle — acceptable while
   demo, must move server-side in P2.
5. **Upload retention is manual** — ~90-day deletion policy stated in `/privacy`, done
   by hand in Vercel → Storage (month-bucketed folders). Automation needs the DB.
6. **Rate limiting is per-serverless-instance** (documented in `rate-limit.ts`);
   a shared store (Upstash/KV) is the upgrade if abuse appears.
7. **Abandonment analytics is best-effort** (pagehide; counts are a floor).
8. **No malware scanning on uploads** (documented; files never executed/rendered
   server-side; scan-on-upload queue is the future approach).
9. Minor: presign-route errors surface as generic `upload_failed` (handleUploadPresigned
   wraps thrown codes); no skip-link on marketing pages; no RSS feed.
10. Outstanding AUDIT.md P1 items not yet built: social proof/testimonials block,
    structured-data expansion (Organization site-wide, Service on level pages),
    unit-model enrichment (learning outcomes/criteria/command verbs), form-field
    primitive consolidation.

## 12. P2 DATABASE TRANCHE — NEXT BUILD (do not implement without owner approval)

**Objective:** convert lead capture from email-as-persistence to durable storage and
turn `/admin` into the real operations dashboard.

**Why now:** every other foundation is live and production-verified. The DB unlocks:
lead list/history (emails are unqueryable), the status pipeline, blob-lead linkage
(enabling automated retention), scoring analytics, and duplicate/repeat-client insight.

**Proposed model:** persist the existing `Lead` type (`src/lib/leads/types.ts`) — it was
designed DB-ready: `id`, `createdAt`, `schemaVersion`, `status?`, `internalNotes?`,
`quote?`, `attachments` (pathname-keyed). Insert in `/api/leads` BEFORE notification;
notification failure must not lose the lead once the DB exists (invert the current
honest-failure contract at that point).

**Status pipeline (owner-specified, already defined in code):** `LEAD_STATUSES` in
`types.ts`: NEW_LEAD → BRIEF_REVIEWED → QUOTE_SENT → AWAITING_PAYMENT → IN_PROGRESS →
QUALITY_REVIEW → DELIVERED → REVISION → COMPLETED.

**Admin conversion:** replace the localStorage store (`src/lib/portal/store.ts`) with
DB-backed API routes; the demo UI (table, filters, detail, notes, status controls) was
built to survive a storage swap. Replace Basic-Auth+demo-passcode with one real auth at
the same time. Surface lead score/classification + deadline-first sorting.

**Admin-only quote engine:** `estimateQuote()` (`src/lib/portal/quote.ts`) is sound;
recompute server-side per lead and show as an internal suggestion next to a manual
amount field. Never client-facing.

**File-retention lifecycle:** DB rows link pathnames → leads; a scheduled job deletes
blobs (`del()` — server-side, OIDC-compatible) for unconverted leads older than the
retention window; update `/privacy` if the window changes.

**Migration considerations:** historical leads exist only as emails in
`support@cipdguidance.com` — accept as archive or hand-import. `schemaVersion`
distinguishes contact-form (1) vs funnel (2) leads.

**Recommended order:** DB provisioning decision → schema + insert in `/api/leads` →
admin list/detail read-only → status pipeline + notes → real admin auth → quote
suggestion surface → retention job → (separately) MDX content migration.

**Owner decisions required first:** database provider/cost (a prior Neon-vs-Supabase
discussion ended in "hold off"; Vercel-integrated Neon/Postgres was the lean
recommendation), real admin auth method, retention window confirmation, and whether
the parked client portal stays parked (recommendation: yes).

## 13. REJECTED OR SUPERSEDED APPROACHES (do not reintroduce)

| Approach | Why rejected |
|---|---|
| WhatsApp/mailto-only "lead capture" | Leads evaporated if the visitor didn't complete the handoff; no record existed. Superseded by capture-first `/api/leads`. Kept ONLY as the honest fallback when delivery fails |
| Filename-only fake uploads | UI implied receipt of documents that went nowhere — trust violation. Removed in P0; real uploads landed in P1 |
| Public Blob storage (capability URLs) | P1 shipped public-unguessable URLs as a documented compromise; superseded by the private store + OIDC + mediated downloads (`f396faf`). Do not regress to `access: 'public'` |
| Classic `handleUpload` client-token flow | Cannot authenticate against the private store: requires a static RW token that private stores don't issue (verified in SDK source). See §6 warning |
| Raw Blob URLs in notification emails | Unfetchable on a private store, and a link-injection surface. Replaced by pathname-only attachments + mediated links |
| Client-facing automatic price estimates (+ public `/api/quote`) | Contradicts owner's approval-first pricing policy. Removed in P0; estimator preserved as internal logic |
| URL restructuring to `/units/*`, `/levels/*` | Redirect churn during the fragile early-indexing window for zero ranking benefit. Keep keyword-rich existing URLs |
| Building out the client portal | Owner's WhatsApp-first workflow doesn't need client logins/payments; parked, footer link removed |
| Resend click-tracking as the *only* insecure-link theory | The app's href was verified correct; the warning matched tracking rewrites through the mail-only subdomain. Later isolated further to PrivateEmail's new-tab handler for the click-behaviour symptom. Lesson preserved: **inspect the received email's raw href before diagnosing link issues in code** |
| zod / SDK / testing-stack dependencies | Hand-rolled validation, fetch-based Resend, vitest-only — deliberate minimal-dependency policy. Total runtime deps added across P0/P1: `@vercel/blob` only |

## 14. GIT STATE (verified 2026-07-14 via `git log` / `git status`)

- **Branch:** `main` · **HEAD:** `70939ee` · **uncommitted changes: none**
- **Local is 2 commits AHEAD of `origin/main`** (deliberately unpushed — pushing
  auto-deploys production; owner releases explicitly):
  - `70939ee` fix(email): explicit download-action labels on document links
  - `bf76292` fix(urls): centralised, HTTPS-guaranteed absolute URL construction
- **Deployed production HEAD:** `f396faf` fix(blob): OIDC authentication for the
  private store; server-mediated downloads
- Earlier milestones: `8d880cd` (P1 funnel + uploads), `eadb930` (P0 lead foundation),
  `5241c84` (AUDIT.md), `8a7f1a5`…(SEO content batches), `96b95db` (admin Basic Auth).

## 15. FRESH AGENT STARTUP PROCEDURE

1. Read `docs/AGENT-HANDOFF.md` (this file) in full.
2. Read `AUDIT.md` (root) — architecture audit + prioritised roadmap context.
3. Read `docs/lead-acquisition.md` — the lead-system operating manual.
4. Inspect `git log --oneline -20` and verify §14 still holds.
5. Verify branch/status: `git branch --show-current && git status -sb` — note
   especially whether the two local commits have since been pushed/deployed.
6. Inspect `package.json` and confirm installed versions (`@vercel/blob` especially —
   if it changed, §6's SDK-source findings must be re-verified before touching uploads).
7. Trace the current lead/upload/download architecture against §4 (files listed there).
8. Run `npm test` — expect 86 passing. Investigate any deviation before proceeding.
9. Run `npx next lint` and `npm run build` (build includes the typecheck) — expect
   clean, ~95 static pages.
10. Produce a short repository-state verification report (git state, versions, test/
    build results, any drift from this document). **Do not modify code until that
    verification report is complete.** Never push to `main` (auto-deploys) without
    explicit owner approval.

---

Conversation history is non-authoritative. The repository, tests, installed SDK
source/types, deployment configuration, and verified production behaviour are the
sources of truth.
