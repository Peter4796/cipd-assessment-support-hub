# Lead Response & Escalation System — Phase 1 (2026-09-28)

Why: a genuine HIGH_INTENT lead (score 85, L5 resubmission, deadline supplied) sat in NEW past its deadline; a second lead was moved to REVIEWING and also never contacted. The single alert email delivered both times — one email at one moment carried all the operational weight. This system makes an unhandled urgent lead loud, visible and impossible to lose silently, without touching the capture contract.

## Architecture (all pure logic in `src/lib/leads/operations.ts`)

- **Notifications ledger** (`notifications` table, migration 0004; repo `src/lib/db/notifications.ts`): one row per one-shot outbound (`ack`, `escalation_1`, `escalation_2`, `digest`), UNIQUE `dedupe_key` = the idempotency contract. Claim semantics: insert-claim via `ON CONFLICT DO NOTHING`; failed rows retryable via atomic CAS takeover up to 5 attempts; crashed in-flight claims recoverable after 10 min; `sent` rows can never repeat. Machine codes + provider ids only; rows cascade with their lead.
- **"Untouched"** (approved): counts as handled only on `contacted_at`, a deliberate admin note, status progression beyond REVIEWING, archive, or terminal status. NEW→REVIEWING alone does NOT count; admin page views are never tracked.
- **Deadline bands** (date-only honest, owner-timezone day boundaries): overdue / today / tomorrow / within_48h / within_72h / later / none. `OWNER_TIMEZONE` (default `Africa/Nairobi`) is read in exactly one place.
- **Escalations**: urgent = HIGH_INTENT/PRIORITY or deadline-critical (overdue/today — this elevates WARM leads). #1 at 30 min (15 min when deadline-critical), #2 at 2 h, only while untouched, only for leads created after the cutover.
- **Automation cutover** (`LEAD_AUTOMATION_CUTOVER`, ISO instant): unset ⇒ ack + escalations are OFF (fails closed). Pre-cutover leads are never auto-messaged but DO appear in Needs Attention and the digest. This is the historical-lead protection and doubles as a kill switch.
- **Client acknowledgement**: owner-approved wording, transactional, sent only after successful persistence, ledger-claimed, best-effort, reply-to the owner address, no audience add, no attachments. Never sent in `[NOT PERSISTED]` fallback mode.
- **Daily digest**: once per owner-local day at/after 08:00 Nairobi, only when actionable (untouched / deadlines ≤72h or overdue / stale quotes >72h / stale REVIEWING-CONTACTED >48h), deep-links into admin. Includes historical leads (visibility, not messaging).
- **Needs Attention** (`/admin/attention`): open leads ordered by an internal attention score, UI shows only transparent reason chips. All Leads unchanged.
- **Channels** (`src/lib/notify/channels.ts`): email active; SMS is a declared kind failing honestly until the next tranche. Future SMS content: reference, level, deadline band, "check admin" — nothing else.

## Active now vs dormant

| Capability | State on current (free) infra |
|---|---|
| Capture contract, internal alert, alert retry | Unchanged, active |
| Client acknowledgement | Active once `LEAD_AUTOMATION_CUTOVER` is set |
| Needs Attention view | Active immediately |
| Daily digest ~08:05 Nairobi | Active via new free daily Vercel cron (05:05 UTC) |
| Escalation #1/#2 timeliness | **Dormant** — logic complete and tested; the daily cron gives one safety-net pass/day, so escalations for leads <48 h old fire at most once daily, not at 30 min/2 h |
| SMS | Next tranche |

**The ONE action that activates 15-minute escalation later** (no code change): point any scheduler at the route every ~15 min with the existing secret — e.g. a GitHub Actions workflow step `curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://www.cipdguidance.com/api/cron/leads` on `schedule: "*/15 * * * *"` (secret stored as a GH Actions secret), or upgrade Vercel and tighten the vercel.json schedule. Idempotency makes any frequency/overlap safe.

## Environment

`OWNER_TIMEZONE` (optional, default Africa/Nairobi) · `LEAD_AUTOMATION_CUTOVER` (REQUIRED to enable ack+escalations; set to the deployment instant, e.g. `2026-09-29T00:00:00Z`) · existing: `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `LEAD_NOTIFY_EMAIL`, `DATABASE_URL`.

## Deploy / verify / rollback

1. Apply migration 0004 (`npm run db:migrate`) — additive, safe before code.
2. Set `LEAD_AUTOMATION_CUTOVER` in Vercel env to the deploy instant (skip to keep automation off).
3. Push (deploys code + the new daily cron).
4. Verify: `curl -H "Authorization: Bearer $CRON_SECRET" "https://www.cipdguidance.com/api/cron/leads?dry=1"` → JSON summary, `escalationsPlanned: 0` expected for historical leads; open `/admin/attention`; submit a test lead if desired (it will be acknowledged).
5. Rollback: unset `LEAD_AUTOMATION_CUTOVER` (instant automation off) or revert the commits; the ledger table is inert without callers.
