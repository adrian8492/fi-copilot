# SPRINT-STATE — Korum/Benstock Pilot Handoff

**This is the canonical resume document. Read it first. Anything else is reference.**

## Where you are

| Field | Value |
|---|---|
| Branch | `feature/multi-tenant-pilot` |
| Last commit | `ffbc980` (Phase 5c DPA template — Phase 5 fully shipped) |
| GitHub | `git@github.com:adrian8492/fi-copilot.git` |
| PR url | `https://github.com/adrian8492/fi-copilot/pull/new/feature/multi-tenant-pilot` |
| Spec — Phases 1-4 | `~/asura-build/content/briefs/fi-copilot-benstock-pilot-sprint.md` |
| Spec — Phase 5 (current) | `~/asura-build/content/briefs/fi-copilot-phase-5-compliance.md` |
| Operating rules | `~/asura-build/.claude-code-rules.md` (read on every fresh session) |

## Test baseline (do NOT regress)

- `pnpm check`: **0 TypeScript errors**
- `pnpm test`: **32/32 test files green. 1402 passed | 1 skipped | 0 failed** (out of 1403)
- The 1 skipped is `server/deepgram.test.ts` env-gated check (`it.skipIf(!process.env.DEEPGRAM_API_KEY)`); passes in real boxed env, skips in CI/sandbox
- Net new tests across all of Phase 5: **+26** (Phase 5a +11, Phase 5b +12, Phase 5c +3)
- Any new work must keep tests at or above 1402 with 0 failing test files

## Anything in progress?

**No.** Every commit on the branch is a clean checkpoint. No half-done features, no stashed changes, no uncommitted edits. Working tree is clean. You can safely `git pull` and start anywhere.

## Phase status

| Phase | Status | Last commit |
|---|---|---|
| Phase 1 — query-level tenant enforcement + 25 isolation tests | ✅ shipped | `213e3a4` |
| Phase 1.5 — cross-tenant write hardening on 6 mutations + 8 tests | ✅ shipped | `c896d02` |
| Phase 2 — onboarding 5-step wizard (backend + frontend) | ✅ shipped | `df81004` |
| Phase 3a — `/yesterday-recap` (Brian's #1 ask) | ✅ shipped | `fc5a5ea` |
| Phase 3b — StoneEagle nightly CSV ingest + 22 tests | ✅ shipped | `c5d49fe` |
| Phase 3c — Deepgram env-test cleanup | ✅ shipped | `768ea04` |
| Phase 4 — load-test seed + operator runbook | ✅ shipped | `e80d237` |
| Phase 4.x deferred-list cleanup (5 of 6) | ✅ shipped | `26ad0d8` |
| **Phase 5a — Two-party recording consent (RCW 9.73.030)** | **✅ shipped** | **`6fbaa7b`** |
| **Phase 5b — Data-deletion request + audit-trail accessor (FTC Safeguards)** | **✅ shipped** | **`8c31285`** |
| **Phase 5c — `/compliance` page + DPA gate + DPA template v1** | **✅ shipped** | **`67750db` + `ffbc980`** |

## Korum/Benstock timeline (per Phase 5 spec, last updated 2026-04-25)

| Date | Milestone | Status |
|---|---|---|
| Sat Apr 25 | Phase 5 build (this session) | ✅ done |
| Sun Apr 26 | Manus redeploy + smoke test | Adrian |
| Mon Apr 27 | Adrian + Ian dry-run with mock data on live URL | Adrian |
| Tue Apr 28 | Final compliance review + Jim Koch pre-call to walk DPA | Adrian |
| Wed Apr 30 | StoneEagle nightly export starts populating production data | Adrian + Jim |
| **Thu May 1** | **Korum install on-site — Puyallup, WA** | Adrian + Ian |
| Fri May 2 – Sun May 4 | Bug fixes + manager training | Adrian |
| **Mon May 5** | **Brian Benstock install (Paragon Honda)** | Adrian |

5+ days of buffer remain between today and the install.

## Decisions pending Adrian (none are blocking)

1. **PR vs keep-going.** Branch is PR-ready (24 commits ahead of master). Adrian can merge to `master` whenever he wants (after Manus deploy + Korum smoke), or keep iterating until install day.
2. **Auth swap timing (Clerk).** Spec says Clerk; we kept Manus OAuth for the pilot. Mechanical post-pilot swap when Adrian provides Clerk creds (only `server/_core/oauth.ts` knows about the OAuth provider).
3. **NOT NULL hardening on the 12 child-table `dealershipId` columns + the new `consent_logs.dealershipId` is already NOT NULL.** Phase 1 columns all nullable for safe migration. After Korum's first nightly StoneEagle import (Tue Apr 28) populates them, a migration to flip NOT NULL is the right next step.
4. **Compliance rules tenancy semantics for legacy rules.** Existing rules with `dealershipId = NULL` ("global"). New code allows null-dealership admins to manage null-dealership rules (back-compat). Once Korum is live, may want to backfill rules with their owning tenant or formalize "null = federal/global, super-admin-only".
5. **DPA `v1` content review.** The DPA template at `docs/legal/dpa-template-v1.md` was drafted by Claude. Adrian/legal should review before Korum + Paragon counter-sign. The in-app gate already records `dpaVersion="v1"`; if v2 lands, bump `CURRENT_DPA_VERSION` in `client/src/pages/Onboarding.tsx`.

## Next tasks ranked by value (pick whichever; all independent)

### 1. Hard-delete cron for data-deletion requests (~1.5 hr)

Phase 5b shipped the request + 30-day soft-delete. Still need the cron sweep.

`scripts/process-data-deletion.ts`:
- Read pending requests where `scheduledDeletionAt <= now()` via `getPendingDeletionRequestsDue`
- For each: hard-delete in this order to respect FKs:
  - `transcripts`, `copilot_suggestions`, `compliance_flags`, `performance_grades`, `audio_recordings`, `coaching_reports`, `session_checklists`, `objection_logs`, `deal_recovery`, `asura_scorecards`, `consent_logs`, `audit_logs` (tenant-scoped) — for the session(s) in scope
  - `customers` row if customerId is set
  - The session row last
- Mark request `completed` via `completeDataDeletionRequest`
- Notify Adrian via `notifyOwner` on each completion
- Refuse `NODE_ENV=production` without `--commit` (mirror the seed script's safety)
- Log to `memory/deletion-logs/YYYY-MM-DD.md` for audit trail

First run not needed until ~May 31 (30 days after Korum install).

### 2. Dealership-local timezone for `/yesterday-recap` day boundary (~1 hr)

Same task that was queued before Phase 5. Now even more relevant since Brian Benstock's Paragon install is May 5 and he's NYC-based. Spec at the previous SPRINT-STATE entry — unchanged.

### 3. Tenancy health-check admin endpoint (~30 min)

Same as before. `admin.tenancyHealth` returning invariant counts. Pure read endpoint, low blast radius, high diagnostic value. Especially useful after first StoneEagle ingest to verify cross-tenant doesn't leak.

### 4. ADR + decision: session-child write auto-stamping

Same long-running deferred decision from before Phase 5. Worth an ADR not a code change. Adrian's call.

## Phase 5 file map (new since last handoff)

| Path | What |
|---|---|
| `drizzle/0022_consent_logs.sql` | Phase 5a — consent_logs table |
| `drizzle/0023_data_deletion_requests.sql` | Phase 5b — deletion request table |
| `drizzle/0024_dpa_signing.sql` | Phase 5c — `dpaSignedAt` / `dpaVersion` / `dpaSignedBy` on dealerships |
| `client/src/pages/Compliance.tsx` | Public `/compliance` attestation page (no auth) |
| `docs/legal/dpa-template-v1.md` | DPA v1 template (Adrian customizes per dealer) |
| `client/src/pages/LiveSession.tsx` | Two-party consent modal + revoke Dialog (Phase 5a) |
| `client/src/pages/Onboarding.tsx` | Step 1 DPA acceptance gate + version constant (Phase 5c) |
| `server/db.ts` | +12 helpers across consent_logs + data_deletion_requests + audit trail |
| `server/routers.ts` | +`consent` router + `dataDeletion` router + `admin.auditTrailForCustomer` |
| `server/websocket.ts` + `server/http-stream.ts` | Phase 5a WS + HTTP gate now reads consent_logs first |
| `server/multi-tenant-isolation.test.ts` | +26 isolation tests across Phase 5 |
| `memory/2026-04-25.md` | This session's daily journal |

## Architectural context to preserve

- **Schema dialect: MySQL** (NOT Postgres). `drizzle.config.ts` is `dialect: "mysql"`. All Drizzle syntax in spec snippets needs MySQL adaptation: `pgTable` → `mysqlTable`, `uuid().defaultRandom()` → `int().autoincrement()` or `varchar` with manual UUID, `jsonb` → `json`, `timestamp({withTimezone: true})` → `timestamp` (MySQL handles TZ differently).
- **Schema lives at `drizzle/schema.ts`**, not `shared/schema.ts`.
- **Tenancy enforcement layer is at `server/tenancy.ts`** — `resolveTenantScope`, `assertTenantAccess`, `tenantFilter`, `canAccessDealership`. New code should reuse these primitives. The legacy `assertSessionAccess` helper in routers.ts is also still in use and is correct — don't replace it indiscriminately. Phase 5a/5b/5c all use `assertSessionAccess`.
- **Phase 5a consent gate has TWO layers:**
  1. `consent_logs` row — primary source of truth (recordingMode + revokedAt). When present, it overrides the legacy `session.consentObtained` field.
  2. Legacy `session.consentObtained` flag — fallback for pre-Phase-5a sessions. Kept for back-compat with existing tests.
  Both `server/websocket.ts` and `server/http-stream.ts` apply this two-layer check before invoking Deepgram.
- **`_core/` and `shared/_core/` directories are Manus-template internals** — do not modify. Underscore prefix means hands-off (oauth, sdk, env, encryption, llm, voiceTranscription).
- **Auth is Manus OAuth + bcrypt local-login + jose JWT cookies + MFA via otpauth.** Clerk is specced for post-pilot; not wired. `_core/oauth.ts` is the only file that knows about the OAuth provider.
- **Deepgram is fully wired** in `server/websocket.ts` and `server/http-stream.ts` (Nova-2 model). Frontend connection status lives in `client/src/pages/LiveSession.tsx`. Don't re-implement.
- **Email via Resend** through `server/_core/email.ts:sendEmail` — gracefully no-ops without `RESEND_API_KEY`. Builders for: critical compliance alert, session summary, weekly digest, onboarding invite.
- **`notifyOwner`** (`_core/notification.ts`) is wired in Phase 5b's data-deletion submit. Throws when `forgeApiKey` is unset; we `.catch()` and log so the user-facing flow is unaffected. Real notification fires in Manus deploy where the env var exists.
- **`consent_logs.sessionId` is UNIQUE.** One row per session. Mid-session revoke updates the same row (sets `revokedAt` + `revocationReason` + flips `recordingMode` to "manager_only"). Multi-revocation cycles are intentionally not modeled.

## Korum/Benstock context

- **Korum Automotive Group:** Puyallup WA. F&I Director Jim Koch. 7 F&I managers. **Install: Thursday May 1** (postponed from Apr 27 in the Phase 5 spec to give compliance buffer).
- **Brian Benstock at Paragon Honda:** install **Monday May 5**. NADA-visible, category-validating.
- **Both share one MySQL database.** Cross-tenant data leak ends the pilot.
- **Data source: StoneEagle nightly 2 AM PT.** Korum's first export Wed Apr 30. Sample CSV from Jim Koch on Sunday for ingest mapping validation.
- **DEEPGRAM_API_KEY:** in `.env.local` on the box.
- **Existing deployed URL:** `https://finico-pilot-mqskutaj.manus.space` (current single-tenant demo). Multi-tenant deploy target: `finico-pilot-live.manus.space` (per spec; not yet provisioned).

## Commit timeline (this session — Phase 5, 4 commits)

| Hash | What |
|---|---|
| `6fbaa7b` | Phase 5a — two-party recording consent (consent_logs + tRPC `consent` router + WS/HTTP gate + LiveSession.tsx modal + revoke Dialog + 11 tests) |
| `8c31285` | Phase 5b — data-deletion request (data_deletion_requests + `dataDeletion` router + `admin.auditTrailForCustomer` + notifyOwner + 12 tests) |
| `67750db` | Phase 5c — `/compliance` public page + DPA gate on `onboarding.saveProfile` + Onboarding.tsx Step 1 UI lock + 0024 migration + 3 tests |
| `ffbc980` | Phase 5c (cont.) — DPA template v1 in `docs/legal/` |

## Items NOT done (and why)

- **Hard-delete cron for data-deletion requests.** Deferred — first deletion not due till ~May 31. Top-of-list for next session per ranking above.
- **Dealership-controlled retention policy in onboarding Step 5.** Defaults baked in (90-day audio, 7-year audit logs). Per-dealer override is polish, not legal blocker.
- **Encryption-at-rest deep verification.** Existing `_core/encryption.ts` already does AES-256-GCM column-level encryption. Phase 5 spec called for a "verification pass" — current state is good enough for the pilot; proper independent verification (a security review) is a post-pilot task.
- **Customer self-service deletion submission UI.** Phase 5b shipped the API + admin-side flow. Spec mentions a customer-facing endpoint but the pilot goes through DP-on-customer's-behalf, which is the right scope for the install conversation.
- **DPA template content review by legal.** Drafted by Claude. Should be reviewed before Korum/Paragon counter-sign. Listed as decision pending Adrian.
- **`/compliance` page localization / formal SOC 2 report links.** SOC 2 is "in progress, expected Q3 2026." Page already says so.
- **Full Clerk auth swap.** Same as before Phase 5.
- **Manus deploy + mobile smoke + Korum install.** Adrian's hands.

## Operating rules (still in effect — from `~/asura-build/.claude-code-rules.md`)

- Autonomous mode: don't ask before proceeding. Make the best call, log to memory, keep going.
- Commit + push every meaningful checkpoint. Never commit broken code (`pnpm check` + `pnpm test` before each commit).
- Pull spec every 2 hours.
- At 70% context: commit, push, update SPRINT-STATE, then `/compact` (Adrian's manual trigger when at keyboard).
- Defaults: Clerk for auth (deferred for pilot), MySQL via Drizzle (don't change), match existing styling, write tests inline, fail-closed security.
- Stop conditions: tests below 1402, TS errors, real security risk, sprint complete, Adrian explicitly stops.
