# Lead acquisition architecture (P0)

Implemented 2026-07-13 against the plan in [AUDIT.md](../AUDIT.md). This note is the
operating manual for the lead system: flow, configuration, scoring, events, and the
honest statement of what is and is not persisted.

## LEAD ACQUISITION FLOW

```
Visitor
  → Enquiry form (/contact — EnquiryForm.tsx; prefillable via ?level&unit&support)
  → POST /api/leads
      → server validation + normalisation   (src/lib/leads/validation.ts)
      → lead scoring + classification       (src/lib/leads/scoring.ts)
      → internal notification email         (src/lib/leads/notify.ts → Resend)
  → Confirmation: "Your assessment enquiry has been received." + reference
  → Optional WhatsApp continuation (structured message, no free-text content)
```

**The key principle:** the lead is captured at API success, *before* any WhatsApp
handoff. WhatsApp is a continuation channel, not the capture mechanism. If the API
cannot deliver (unconfigured/failed), the form degrades to the legacy direct
WhatsApp/email compose flow so no enquiry is ever dead-ended.

## Persistence — the honest version

**There is no database.** A lead exists only during request execution and is then
delivered as an email to `LEAD_NOTIFY_EMAIL`. The notification email IS the lead
record. This is stated in code at the top of `src/app/api/leads/route.ts` and
`src/lib/leads/types.ts`. Consequences:

- If Resend delivery fails, the API returns an error and the visitor is shown the
  direct-channel fallback — we never claim capture that didn't happen.
- The `Lead` type already carries `id`, `createdAt`, `status`, notes/quote/attachment
  extension points, so the P2 database tranche adds an insert without remodelling.

**Subscribers** (lead magnet → `POST /api/subscribe`) get real persistence when
`RESEND_AUDIENCE_ID` is set: contacts are stored in a Resend Audience (free tier).
A low-priority `[Subscriber]` notification email is also sent; acceptable at current
volume, becomes a digest/dashboard later. Subscribers are a nurture stage and are
deliberately excluded from assessment lead scoring.

## Required environment variables

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend API access — without it lead capture is inactive |
| `EMAIL_FROM` | Verified sender, e.g. `CIPD Guidance <leads@cipdguidance.com>` |
| `LEAD_NOTIFY_EMAIL` | Inbox that receives lead + subscriber notifications |
| `RESEND_AUDIENCE_ID` | Optional — persistent subscriber contacts |

**Manual setup (owner):** create the free Resend account → verify the
`cipdguidance.com` domain (DNS records at Namecheap) → create an API key → set the
variables in Vercel (all environments) → redeploy. Until then the form uses the
fallback path and the site behaves exactly as before this work.

## Lead scoring (internal only)

Defined in `src/lib/leads/scoring.ts`, unit-tested in `__tests__/scoring.test.ts`.
Never shown to visitors, never returned by the API, never sent to analytics with PII.

| Factor | Points |
|---|---|
| Level 3 / 5 / 7 | +5 / +15 / +20 |
| Guidance / referencing | +5 |
| Draft review | +10 |
| Feedback interpretation | +15 |
| Resubmission | +20 |
| Deadline: today or overdue / ≤3d / ≤7d / >7d / none | +20 / +15 / +10 / +5 / 0 |
| Words: 1–1,999 / 2–3,999 / 4–5,999 / 6,000+ | +5 / +10 / +15 / +20 |
| Unit code / WhatsApp / detailed message (≥40 chars) | +5 each |

Classification: **0–20 LOW_INTENT · 21–40 WARM · 41–60 HIGH_INTENT · 61+ PRIORITY**.
File-upload scoring is deferred to P1 with real uploads.

## Notification email

`src/lib/email/templates.ts` (all user content HTML-escaped) via the transport in
`src/lib/email/resend.ts` (fetch-based, no SDK). Subject:
`[PRIORITY] New CIPD Lead — Level 5 — 5HR01 — Resubmission support`. Sections:
classification/score banner, CONTACT, ASSESSMENT, CLIENT MESSAGE, ACQUISITION
(source page/type, referrer, UTM), NEXT ACTION (WhatsApp deep-link when a number was
given, otherwise mailto). `reply_to` is set to the client so replying just works.

## Contextual CTAs

`enquiryUrl({ level, unit, support })` in `src/lib/leads/context.ts` is the single
builder for contextual enquiry links (`/contact?level=5&unit=5CO01&support=resubmission`).
Wired into unit-page CTAs (level+unit), level-page CTAs (level), and `CtaBand`'s
`primaryHref`. Query values are validated client-side on prefill AND re-validated
server-side. First-touch referrer/UTM attribution is captured to sessionStorage by
`<AttributionCapture/>` (marketing layout) and attached to submissions.

## Anti-abuse

Honeypot field (`website`) + minimum-elapsed-time gate (2.5s) — both return a fake
success so bots learn nothing. In-memory rate limit (8/hour/IP) — **per serverless
instance**, documented in `src/lib/leads/rate-limit.ts`; a shared store is the
upgrade path if real abuse appears. Text inputs are length-capped and
control-character-stripped; emails escape everything at render.

## Analytics events

Typed layer in `src/lib/analytics.ts` (wraps `@vercel/analytics` `track()`); the
only sanctioned emit path. **PII is never sent** — no names, emails, numbers,
message text.

Active: `lead_form_started`, `lead_form_submitted`, `lead_created`,
`lead_form_error`, `whatsapp_clicked` (props: location, source_page_type,
cipd_level, unit_code), `email_clicked`, `lead_magnet_submitted`,
`service_cta_clicked`, `article_cta_clicked`.

Reserved for P1 (typed but not emitted): `lead_form_step_completed`,
`lead_form_abandoned`, `brief_upload_started`, `brief_upload_completed`,
`unit_page_viewed`, `pricing_viewed`.

## Deferred boundaries

- **P1 — file uploads (Vercel Blob):** the enquiry form intentionally has NO upload
  control; visitors are invited to share documents via WhatsApp/email after capture.
  Confirmation copy says "enquiry received", never "brief received".
- **P1 — multi-step form** with step events and upload scoring.
- **P2 — database (Neon):** insert in `/api/leads` before notification; admin
  dashboard reads real leads; 9-status pipeline (`LEAD_STATUSES` in types.ts).
- **Parked:** client portal (footer link removed; routes remain, demo-labelled,
  with client-facing price estimates removed).

---

# P1 — Multi-step assessment intake funnel (added 2026-07-14)

## Funnel architecture

Route: **`/send-your-brief`** (`AssessmentFunnel.tsx`). `/contact` remains for
general contact with the original single-screen form; both post to the same
`/api/leads` contract.

Steps: `level → unit → support → details → documents → contact → review`.
The unit step derives its searchable list from `src/content/units.ts` (single
source of truth, filtered by the chosen level). The details step reveals the
referred-criteria field only for resubmissions.

### Contextual prefill rules
`enquiryUrl({ level, unit, support, submission, cta })` in
`src/lib/leads/context.ts` is the only builder for funnel links
(e.g. `/send-your-brief?level=5&unit=5CO01&support=resubmission&cta=hero`).
Values are validated on parse AND re-validated server-side; invalid values are
ignored, and prefilled values are always user-changeable. Wired entry points:
home hero, header/mobile quote CTAs, unit pages (level+unit), level pages
(level), pricing, CtaBand default, article-end CTAs (topic-based support
prefill: Referencing → harvard_referencing, Feedback → feedback_interpretation,
Resubmissions → resubmission), and the resubmission landing page
(`/cipd-resubmission-support` → support+submission preselected).

### Form persistence (P1.4)
`src/lib/funnel/persistence.ts` — sessionStorage, 24h staleness cutoff.
PERSISTED: step, level, unit, support, submission, word count, deadline,
provider, entry CTA, start time. NOT PERSISTED: name, email, WhatsApp number,
free-text description, referred-criteria text, attachment metadata/URLs.
Restores never jump past the documents step (files aren't persisted). "Start a
new enquiry" clears everything. No beforeunload dialogs — persistence makes
refresh safe instead.

## File uploads (P1.3)

Client-direct uploads to **Vercel Blob** via `@vercel/blob/client` with the
token endpoint `POST /api/uploads` (`GET` = availability probe used for honest
degradation when `BLOB_READ_WRITE_TOKEN` is absent).

Rules (single source: `src/lib/leads/uploads.ts`): pdf/doc/docx/txt/png/jpg,
10 MB per file, 5 files max, extension+MIME+size validated client-side, pinned
into the Blob token server-side, and attachments re-validated a third time in
`/api/leads` (`normaliseAttachments`) — including a **Blob-host URL allowlist**
so attacker-supplied URLs can never be injected into the notification email.
Filenames are sanitised; pathnames are namespaced
`enquiries/YYYY-MM/<category>/<name>` with a random suffix always appended.

### Upload security model (documented decision)
Vercel Blob client uploads are **public-with-unguessable-URL** (capability
URLs); private/authenticated blob access is not available in this setup. The
mitigations: random suffixes, no directory listing, URLs surfaced only inside
the internal notification email, never logged, never sent to analytics, never
shown to visitors. Practical equivalence: "anyone with the link" sharing.
The P2 upgrade is files behind the admin dashboard with authenticated access.
**Malware scanning is not implemented** — documents are never executed or
rendered server-side and are opened deliberately by the owner; a scan-on-upload
queue is the correct future approach if volume grows.

### Retention / cleanup (operational limitation)
There is no automated cleanup yet (requires the P2 database to know which
blobs belong to unconverted enquiries). POLICY: delete documents for enquiries
that don't proceed within ~90 days, manually via Vercel → Storage → Blob
(month-bucketed folders make this easy). The privacy page states this policy.

## Lead model & scoring changes (P1.5–P1.6)

`Lead` gained: provider, submissionType, referredCriteria, attachments
(typed `LeadAttachment[]`), funnel meta (entryCta/startedAt/completedAt/
durationSeconds), reachedReview, `schemaVersion` (1 = contact form,
2 = funnel). P0 payloads remain valid (all new fields optional).

Scoring additions: brief +15 · draft +10 · feedback +15 (resubmissions only) ·
provider +2 · referred criteria +5 (resubmissions only) · review reached +5.
Max is now 147. **Re-derived thresholds:** 0–25 LOW · 26–55 WARM ·
56–90 HIGH · 91+ PRIORITY.

Distribution analysis (unit-tested personas):
| Persona | Score | Class |
|---|---|---|
| L3 informational, nothing else | 10 | LOW |
| L5 guidance, 30d, 2k words | 35 | WARM |
| P0-style contact-form resubmission (no files) | 70 | HIGH |
| Complete L5 draft review + brief + review step | 80 | HIGH |
| Urgent complete L7 + brief | 95 | PRIORITY |
| Complete L5 resubmission + brief + feedback | 115 | PRIORITY |
| Theoretical maximum | 147 | PRIORITY |

## Notification upgrades (P1.7)

Subject: `[PRIORITY] CIPD Level 7 Resubmission — 7CO03 — Due 16 July`.
Body adds: unit title, submission type (RESUBMISSION highlighted), referred
criteria, provider, DOCUMENTS section with capability links + sizes, red
warnings when the brief is missing ("Assessment brief not uploaded — request
it before quoting") or a resubmission lacks feedback, entry CTA and form
completion time. Files are linked, never attached.

## Analytics (P1.8)

Events now emitted: `lead_form_step_viewed`, `lead_form_step_completed`,
`lead_form_validation_error`, `lead_form_abandoned` (pagehide, best-effort —
counts are a floor; the reliable funnel read is step-completed drop-off),
`brief_upload_started/completed/failed` (category enum only, never filenames),
`lead_review_reached`, plus all P0 events. Funnel view spec lives at the
bottom of `src/lib/analytics.ts`. PII rules unchanged and enforced by type.

## Environment variables (P1 delta)

| Variable | Purpose |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob uploads — create a Blob store in Vercel → Storage; auto-injected in production |

## P2 boundaries (unchanged)
Database (Neon) → persistent leads, blob-lead linking, automated retention;
admin dashboard on the 9-status pipeline; authenticated file access. The
funnel and API were shaped so P2 adds persistence without contract changes.
