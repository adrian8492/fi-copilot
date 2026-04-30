# Privacy + DPA Review — F&I Co-Pilot (Korum + Paragon Pilot)

**Status:** Pre-install review. Companion to `docs/legal/dpa-template-v1.md`.
**Audience:** Adrian (sign-off) + dealer counsel (Jim Koch / Paragon legal).
**Last updated:** 2026-04-30 (one day before Korum install on May 1).

**Companion docs:**
- `docs/legal/dpa-template-v1.md` — the operative legal document (Korum + Paragon counter-sign this)
- `docs/data-retention-and-delete.md` — operational details on retention/deletion behavior
- `docs/deepgram-readiness.md` — Deepgram-specific audit

The DPA template is the operative legal document. This file is the engineering
walk-through behind it: what data the system actually touches, how, and where.
Use this when answering legal-side questions or filling in a DPA Schedule A
(data inventory) per dealer.

---

## 1. Data the system collects

| Bucket | Where it comes from | Where it lives | Encryption posture |
|---|---|---|---|
| **F&I manager profile** | Manus OAuth handshake on login | `users` table | TLS in transit; plaintext at rest (no NPI here) |
| **Dealership profile** | `/onboarding` wizard (DP / dealership admin enters) | `dealerships`, `dealership_settings` | TLS in transit; plaintext at rest |
| **Customer name + deal info** | F&I manager-entered or StoneEagle nightly CSV | `sessions.customerName`, `customers` | **AES-256-GCM column-level encryption** on `sessions.customerName` |
| **Audio recording** (live session) | Browser mic → server WebSocket → Deepgram | `audio_recordings.fileKey` (S3-style object store reference) | TLS in transit; storage layer at-rest encryption |
| **Transcript text** | Deepgram Nova-2 streaming response | `transcripts.text` | **AES-256-GCM column-level encryption** |
| **Compliance flag excerpts** | LLM analysis of transcripts | `compliance_flags.excerpt` | **AES-256-GCM column-level encryption** |
| **Coaching grades + scores** | Server-side derived from transcripts + checklists | `performance_grades`, `session_checklists` | TLS in transit; plaintext at rest (no NPI) |
| **Audit log** | Every read/write on customer-scoped data | `audit_logs` | TLS in transit; plaintext at rest, retained 7 yr |
| **Two-party consent record** | `/live-session` consent modal (Phase 5a) | `consent_logs` | TLS in transit; plaintext at rest (timestamps + mode + IP) |
| **Data deletion request** | `/admin` deletion form or email to compliance@ | `data_deletion_requests` | TLS in transit; plaintext at rest |

NPI columns (per Gramm-Leach-Bliley): `sessions.customerName`,
`transcripts.text`, `compliance_flags.excerpt`. These are the three columns
encrypted at rest. The `_core/encryption.ts` module is the only path that
reads/writes them; rotation breaks irreversibly without the old key, hence
the runbook prohibition on rotating `ENCRYPTION_KEY` post-install.

## 2. Audio + transcript handling

1. **Capture.** F&I manager clicks Record on `/live-session`. Browser opens
   a WebSocket to the server. Audio frames stream up.
2. **Two-party consent gate (Phase 5a).** Before any audio reaches
   Deepgram, the server checks `consent_logs` for the session. Modes:
   - `pending`: no audio is forwarded; client gets an "awaiting consent" state.
   - `recording`: both manager and customer have attested. Audio flows.
   - `manager_only`: customer declined or revoked. Server still produces a
     transcript for the manager's side of the conversation, but the customer-
     side audio is dropped at the gate; the consent_log row records the
     `revokedAt` timestamp and reason.
3. **Transcription.** Audio is forwarded over a WSS connection to
   Deepgram's Nova-2 streaming endpoint. Deepgram returns interim + final
   transcript segments. Final segments are written to `transcripts` with
   the `text` column encrypted.
4. **Storage of audio.** Audio file references live in `audio_recordings`.
   Default retention: 90 days (per DPA §8). The retention column is
   `retentionExpiresAt`; an existing helper `getExpiredRecordings` and the
   new deletion sweep handle physical purge.
5. **Storage of transcripts.** Encrypted text in `transcripts`. Retained
   for the term of the agreement plus 90 days, unless the customer requests
   deletion via Phase 5b.

### Deepgram's role (sub-processor)

- **What Deepgram sees:** real-time audio frames + their transcribed text
  return path. They do NOT receive deal numbers, customer names, or any
  other CRM context — only the audio bytes.
- **Retention at Deepgram:** per their default contract terms, audio is not
  retained server-side (they bill on streaming minutes). Confirm in their
  DPA before signing the dealer-side DPA.
- **Region:** US, per DPA §5 sub-processor table.
- **Failure mode:** if `DEEPGRAM_API_KEY` is missing or Deepgram is
  unreachable, the WebSocket gate falls back to "manager only" → the
  transcript is sourced from the browser's built-in `SpeechRecognition` API,
  which is a Google service on Chrome / Edge and an Apple service on Safari.
  This has its own privacy posture and is **not** covered by Deepgram's DPA.
  → Open question for legal: do we surface this fallback to the customer,
  and if so where? See §7.

## 3. Storage / retention defaults

| Data type | Default retention | Override |
|---|---|---|
| Audio recordings | 90 days | Per-dealership in onboarding Step 5 (deferred — see SPRINT-STATE) |
| Transcripts + coaching artifacts | Term of agreement + 90 days | None per-dealer yet |
| Deal records (sessions row, no NPI) | Indefinite (financial-record reqs) | None |
| Audit logs | 7 years | None — fixed by FTC Safeguards posture |
| Consent logs | Tied to the session row's lifetime | Deletion request hard-deletes them |
| Data deletion requests | Indefinite (request itself is the audit trail) | None |

Override controls are on the post-pilot list — for the Korum/Paragon pilot,
defaults stand. DPA §8 lists these defaults verbatim.

## 4. Deletion process

Customer-initiated deletion is supported end-to-end:

1. **Request submission.** DP or dealership admin opens
   `/admin/customers/:id/delete-request` (or any customer's session detail
   page) and submits the form. Server creates a row in
   `data_deletion_requests` with `status="pending"` and `scheduledDeletionAt`
   set 30 days out. `notifyOwner` fires to the configured contact.
2. **30-day soft-delete window.** Customer or DP can cancel via the same
   admin UI, which flips `status="cancelled"`. Reads of the customer's
   sessions are NOT blocked during this window — the request is a *future*
   deletion, not an immediate access lock. Open question: should reads be
   gated during the window? Legal call. See §7.
3. **Hard-delete sweep.** `scripts/process-data-deletion.ts` runs daily
   (cron, starting ~May 31 — 30 days post-Korum). Sweep finds requests with
   `status="pending"` and `scheduledDeletionAt <= now()`, deletes:
   - `consent_logs` row(s) for the session(s)
   - All session-child rows via `db.deleteSessionData`: transcripts, copilot
     suggestions, compliance flags, performance grades, audio recordings,
     coaching reports, session checklists, objection logs.
   - The session row(s) itself.
   - The `customers` row if `customerId` was set on the request.
   Then flips `status="completed"` and notifies the owner.
4. **Manual review fallback.** If a request has neither `sessionId` nor
   `customerId` (text-only — customer email/name only), the sweep does
   nothing destructive and logs a `manual_review` line. Adrian handles
   these by hand.

**Audit trail.** Each sweep appends a JSONL block to
`memory/deletion-logs/YYYY-MM-DD.md`. Every request id, classification, and
session list is recorded. This is the source of truth for FTC Safeguards
audit requests.

## 5. Tenant isolation

- **Schema-level.** Every customer-scoped table has a `dealershipId`
  column. The Phase 1 work added this to 12 tables that lacked it. Phase 1.5
  hardened 6 cross-tenant write paths.
- **Query-level.** The `server/tenancy.ts` module exposes
  `assertTenantAccess`, `tenantFilter`, and `canAccessDealership`. Every
  read and write path either calls these directly or composes through
  helpers that do.
- **Test-level.** `server/multi-tenant-isolation.test.ts` is a 107-test
  suite of cross-tenant attempts (read, write, update, delete, list) that
  must all return 404 or NOT_FOUND from the perspective of the wrong tenant.
- **Super-admin layer.** `isSuperAdmin === true` users (Adrian + Ian)
  bypass tenant scoping deliberately — they can read across tenants for
  support and configuration. Every super-admin read still hits
  `audit_logs` with the actor + target dealership recorded.

DPA §4 reflects this posture verbatim ("cross-tenant access is impossible
at the query layer"). For an audit, the 107-test suite is the artifact you
hand to legal.

## 6. Compliance frameworks in scope

| Framework | How we comply | Where |
|---|---|---|
| **FTC Safeguards Rule** (16 CFR Part 314) | Encryption at rest + access controls + audit logging + breach notification + sub-processor controls | DPA §4, §5, §7 |
| **Gramm-Leach-Bliley (GLBA)** | NPI columns identified + encrypted; deal data retained only for legitimate business purpose | §1 above |
| **Washington RCW 9.73.030** (two-party consent) | Phase 5a consent gate enforced for all dealerships regardless of state | DPA §10 |
| **California Penal Code §632** | Same Phase 5a gate covers it | DPA §3 (Customer attests) |
| **TILA / Regulation Z** | Disclosures supported in deal-review and grading flows; not enforced at our layer | DPA §10 |
| **ECOA / Regulation B** | F&I Co-Pilot does not make automated lending decisions | DPA §10 |
| **State breach-notification laws** | 72-hour notice clause | DPA §7 |
| **SOC 2** | Type 1 attestation in progress; not yet attained | DPA §11; `/compliance` page |

## 7. Open questions for legal review

These are the items that should land on Jim Koch's pre-call agenda or
Paragon counsel's review. Each is an actual decision the engineering side
cannot resolve unilaterally.

1. **Browser SpeechRecognition fallback.** When Deepgram is unavailable,
   we silently fall back to the browser's built-in transcription (Google on
   Chrome, Apple on Safari). Should the customer be notified that audio is
   leaving the browser to a different sub-processor in this case? My read:
   yes, and we should disable the fallback by default and require an
   explicit per-dealership opt-in. Adrian / counsel call.
2. **Reads during the 30-day soft-delete window.** Today, DPs can read
   pending-deletion sessions. Should we lock reads, redact display fields,
   or leave as-is? The DPA says the customer has a right to "restriction
   of processing during dispute investigation" (§6) — does the soft-delete
   window count as that?
3. **DPA v1 content review.** The template was drafted by Claude. Items
   to verify with counsel before counter-signing:
   - §5 sub-processor table — is the list complete?
   - §7 72-hour breach notice — does this match Adrian's actual capability?
   - §8 retention defaults — does any state-level law require shorter
     retention for any of these (CA SB 1121, NY SHIELD, etc.)?
   - §10 SOC 2 timeline — Q3 2026 commitment is currently unwitnessed.
4. **Per-dealer DPA negotiations.** Korum and Paragon may want bespoke
   terms (audit cadence, governing law, term length). Track per-Customer
   customizations alongside the signed DPA in the dealership's onboarding
   folder. The in-app gate already records `dpaVersion`; bump
   `CURRENT_DPA_VERSION` in `client/src/pages/Onboarding.tsx` if v2 lands.
5. **Customer self-service deletion submission UI.** Phase 5b shipped
   the API + admin-side flow. Spec mentions a customer-facing endpoint;
   pilot scope is DP-on-customer's-behalf. Counsel call: is that enough
   for FTC Safeguards, or do we need a customer-direct path before
   ramping past the pilot?
6. **CCPA / CPRA exposure for California customers** (Paragon Honda is
   in NY but customer base may include CA residents). Current DPA is WA-
   centric. Review California-specific provisions before Paragon
   counter-signs.
7. **Children's data.** DPA §3.4 says no sub-13 data. Practical: we
   have no enforcement at the data layer beyond customer attestation.
   Acceptable?

## 8. Reference paths in this repo

- `drizzle/0022_consent_logs.sql` — Phase 5a consent table
- `drizzle/0023_data_deletion_requests.sql` — Phase 5b deletion requests
- `drizzle/0024_dpa_signing.sql` — DPA acceptance gate columns
- `client/src/pages/Compliance.tsx` — public `/compliance` attestation page
- `client/src/pages/Onboarding.tsx` — DPA acceptance Step 1 (Phase 5c)
- `server/_core/encryption.ts` — AES-256-GCM column encryption layer
- `server/tenancy.ts` — query-layer tenant isolation primitives
- `server/multi-tenant-isolation.test.ts` — 107 cross-tenant tests
- `server/db.ts` — `deleteSessionData`, `deleteConsentLogBySessionId`,
  `deleteCustomerByIdForDealership`, `getPendingDeletionRequestsDue`
- `scripts/process-data-deletion.ts` — daily hard-delete cron
- `docs/legal/dpa-template-v1.md` — operative legal document
