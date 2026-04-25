# SPRINT-STATE — Korum/Benstock Pilot Handoff

**This is the canonical resume document. Read it first. Anything else is reference.**

## Where you are

| Field | Value |
|---|---|
| Branch | `feature/multi-tenant-pilot` |
| Last commit | `26ad0d8` (final state — 5 of 6 deferred items closed, #4 deliberately skipped) |
| GitHub | `git@github.com:adrian8492/fi-copilot.git` |
| PR url | `https://github.com/adrian8492/fi-copilot/pull/new/feature/multi-tenant-pilot` |
| Spec | `~/asura-build/content/briefs/fi-copilot-benstock-pilot-sprint.md` (pull every 2hr) |
| Operating rules | `~/asura-build/.claude-code-rules.md` (read on every fresh session) |

## Test baseline (do NOT regress)

- `pnpm check`: **0 TypeScript errors**
- `pnpm test`: **32/32 test files green. 1376 passed | 1 skipped | 0 failed** (out of 1377)
- The 1 skipped is `server/deepgram.test.ts` env-gated check (`it.skipIf(!process.env.DEEPGRAM_API_KEY)`); passes in real boxed env, skips in CI/sandbox
- Phase 4c (deploy) and any new work must keep tests at or above 1376 with 0 failing test files

## Anything in progress?

**No.** Every commit on the branch is a clean checkpoint. No half-done features, no stashed changes, no uncommitted edits. Working tree is clean. You can safely `git pull` and start anywhere.

## Decisions pending Adrian (none are blocking, but worth knowing)

1. **PR vs keep-going.** Branch is PR-ready. Adrian can merge to `master` whenever he wants (after Manus deploy + Korum smoke), or keep iterating on `feature/multi-tenant-pilot` until install day.
2. **Auth swap timing.** Spec says Clerk; we kept Manus OAuth for the pilot. The swap is mechanical post-pilot when Adrian provides Clerk creds (only `server/_core/oauth.ts` knows about the OAuth provider).
3. **NOT NULL hardening on the 12 child-table `dealershipId` columns.** Currently all nullable for safe migration. After Korum's first nightly StoneEagle import (Tue Apr 28) populates them, a migration to flip NOT NULL is the right next step.
4. **Compliance rules tenancy semantics for legacy rules.** Existing rules in production have `dealershipId = NULL` ("global"). The new code allows null-dealership admins to manage null-dealership rules (back-compat). Once Korum is live, may want to either backfill all rules with their owning tenant or formalize "null = federal/global, super-admin-only" as the explicit semantic.

## Next 3 tasks ranked by value (pick whichever; all independent)

### 1. Dealership-local timezone for `/yesterday-recap` day boundary (~1 hr)

Currently `recaps.yesterday` computes "yesterday" using server local time:
```ts
const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
```
This works fine when the server runs in PT and Korum + Paragon are both Pacific. For Brian Benstock (Paragon Honda) in NYC, "yesterday" relative to a Pacific-running server cuts off at 9 PM ET — wrong window for an 8 AM ET morning brief.

Fix:
- Add `timezone varchar(64)` column to `dealerships` (e.g., `"America/Los_Angeles"`, `"America/New_York"`)
- Default to `"America/Los_Angeles"` for existing rows (Korum's tz)
- Compute the day boundary in the dealership's tz using `Intl.DateTimeFormat` or `date-fns-tz` (already in deps via `date-fns@4.1.0` — check before adding new dep)
- Update `recaps.yesterday` to read `dealership.timezone` and compute window accordingly
- Update Onboarding Step 1 to capture timezone (a select dropdown of common US tz)
- Test: assert different dealerships get different windows

This is the only remaining `/yesterday-recap` polish item from the spec. Lands meaningful value before Brian's May 1 install.

### 2. ADR + decision: session-child write auto-stamping (the one deliberate skip in the deferred list)

Documented at the bottom of this file as a non-decision. Worth a real ADR after Adrian reviews. Two paths:

- **Keep current (NULL dealershipId on child rows, JOIN-required reads).** Safer — fail-closed against lazy queries. Architecturally simpler. Read patterns standardized on `assertSessionAccess`. **My recommendation.**
- **Auto-stamp at write (mirror the auditLogs pattern in `e264616`).** More flexible for ad-hoc reporting queries that don't want to JOIN. Permits a query path that bypasses session-ownership check — needs documentation that this is intentional, not a regression.

If the second path is chosen, reuse the auto-stamp pattern (auto-derive from sessionId in the helper) + cap perf cost via a request-scoped LRU cache for high-frequency inserts (transcripts in live sessions).

### 3. Tenancy health-check admin endpoint (~30 min)

Add `admin.tenancyHealth` (super-admin only) returning invariant counts. Useful for production diagnostics, especially after Korum's first nightly StoneEagle ingest:

- `sessionsWithNullDealership` — should always be 0 going forward (newer rows always stamped via routes; only legacy may be null)
- `usersWithNullDealershipExceptSuperAdmin` — Adrian + ASURA staff are the only legitimate nulls; anything else is a bug
- `transcriptsOrphaned` — transcripts whose sessionId points to a nonexistent session
- `recoveryRowsWithoutSessions` — same for deal_recovery
- Per-tenant row counts (a sanity check before/after ingests)

Pure read endpoint, low blast radius, high diagnostic value.

## Architectural context to preserve

- **Schema dialect: MySQL** (NOT Postgres). `drizzle.config.ts` is `dialect: "mysql"`. All Drizzle syntax in spec snippets needs MySQL adaptation: `pgTable` → `mysqlTable`, `uuid().defaultRandom()` → `int().autoincrement()` or `varchar` with manual UUID, `jsonb` → `json`, `timestamp({withTimezone: true})` → `timestamp` (MySQL handles TZ differently).
- **Schema lives at `drizzle/schema.ts`**, not `shared/schema.ts` (spec is wrong on this path).
- **Tenancy enforcement layer is at `server/tenancy.ts`** — `resolveTenantScope`, `assertTenantAccess`, `tenantFilter`, `canAccessDealership`. New code should reuse these primitives. Reading data → `tenantFilter(scope, table.dealershipId)` in WHERE clauses. Verifying access → `assertTenantAccess(scope, row)` after a fetch. The legacy `assertSessionAccess` helper in routers.ts is also still in use and is correct — don't replace it indiscriminately.
- **`_core/` and `shared/_core/` directories are Manus-template internals** — do not modify. Underscore prefix means hands-off (oauth, sdk, env, encryption, llm, voiceTranscription).
- **Auth is Manus OAuth + bcrypt local-login + jose JWT cookies + MFA via otpauth.** Clerk is specced for post-pilot; not wired. `_core/oauth.ts` is the only file that knows about the OAuth provider.
- **Deepgram is fully wired** in `server/websocket.ts` and `server/http-stream.ts` (Nova-2 model). Frontend connection status lives in `client/src/pages/LiveSession.tsx`. Don't re-implement.
- **Email via Resend** through `server/_core/email.ts:sendEmail` — gracefully no-ops without `RESEND_API_KEY`. Builders for: critical compliance alert, session summary, weekly digest, onboarding invite.
- **Two `0019_*` migrations coexist** (`0019_far_squadron_sinister.sql` + `0019_product_intelligence_fields.sql`) — parallel-branch artifact from before this work. Don't touch.

## Korum/Benstock context

- **Korum Automotive Group:** Puyallup WA. F&I Director Jim Koch. 7 F&I managers. **Install: Monday April 27** (3 days from 2026-04-25).
- **Brian Benstock at Paragon Honda:** install ~May 1-5. NADA-visible, category-validating.
- **Both share one MySQL database.** Cross-tenant data leak ends the pilot.
- **Data source: StoneEagle nightly 2 AM PT.** Korum's first export Tue Apr 28. Sample CSV from Jim Koch on Sunday for ingest mapping validation.
- **DEEPGRAM_API_KEY:** in `.env.local` on the box.
- **Existing deployed URL:** `https://finico-pilot-mqskutaj.manus.space` (current single-tenant demo). Multi-tenant deploy target: `finico-pilot-live.manus.space` (per spec; not yet provisioned).

## File map

| Path | What |
|---|---|
| `drizzle/schema.ts` | All tables — 23 of them, MySQL |
| `drizzle/0020_multi_tenant_pilot.sql` | Phase 1 migration (12 child tables get `dealershipId` + index) |
| `drizzle/0021_onboarding_profile_baseline_cadence.sql` | Phase 2 migration (dealership profile + baseline + cadence fields) |
| `server/tenancy.ts` | The enforcement primitives (use these in new code) |
| `server/db.ts` | All DB helpers. ~2400 lines. Has `findSessionByDealNumber`, `getDealershipById`, `getDealershipDigest`, `getProductMenuItemById`, `getDealRecoveryById`, `getComplianceFlagById`, `getComplianceRuleById` from this sprint |
| `server/routers.ts` | All tRPC routes. ~2600 lines. New routers: `onboarding`, `recaps`. Existing tightened: `sessions.delete`, `productMenu.delete/upsert`, `dealRecovery.updateStatus`, `customers.update`, `compliance.resolveFlag/createRule/updateRule/deleteRule`, `admin.listUsers` |
| `server/multi-tenant-isolation.test.ts` | 50+ isolation tests across 10 describe blocks |
| `server/stoneeagle-ingest.test.ts` | 22 unit tests for the ingest |
| `server/seed-load-test.test.ts` | 13 unit tests for the seed generator |
| `scripts/stoneeagle-ingest.ts` | Nightly CSV ingest. Cron-able. `tsx scripts/stoneeagle-ingest.ts <csv> --dealership <id>` |
| `scripts/seed-load-test.ts` | Deterministic 1000 deals × 5 tenants. Refuses NODE_ENV=production with `--commit` |
| `client/src/pages/Onboarding.tsx` | 5-step DP wizard. Auto-resumes from last completed step |
| `client/src/pages/YesterdayRecap.tsx` | Brian's morning brief. 10-min auto-refresh, today's 3 decisions |
| `docs/ADDING_NEW_DEALERSHIP.md` | Operator runbook for install day |
| `memory/2026-04-24.md` | Daily journal — full timeline of this autonomous session |
| `memory/SPRINT-STATE.md` | This file |

## Commit timeline (this autonomous session)

19 commits on `feature/multi-tenant-pilot`:

| Hash | What |
|---|---|
| `213e3a4` | Phase 1 — tenant enforcement layer + 25 isolation tests + migration 0020 |
| `c896d02` | Phase 1.5 — cross-tenant write hardening (6 mutation routes) + 8 tests |
| `5f1bac9` | Phase 2 backend — onboarding tRPC router + 11 tests + migration 0021 |
| `df81004` | Phase 2 frontend — Onboarding.tsx 5-step wizard |
| `fc5a5ea` | Phase 3a — /yesterday-recap backend + frontend + 5 tests |
| `c5d49fe` | Phase 3b — StoneEagle ingest script + 22 tests |
| `768ea04` | Phase 3c — Deepgram env-test cleanup |
| `e80d237` | Phase 4 — load-test seed + 13 tests + operator runbook |
| `37b3a3f` | QoL — admin auto-redirect to /onboarding |
| `d2053fc` | docs — first SPRINT-STATE refresh |
| `c91d2b1` | docs — daily journal full timeline |
| `938f491` | fix — admin.listUsers cross-tenant leak |
| `e640697` | fix — compliance.createRule/updateRule/deleteRule cross-tenant |
| `b98c961` | feat — Resend email delivery for invites |
| `4efe736` | feat — today's 3 decisions + 10-min auto-refresh on /yesterday-recap |
| `278cfea` | docs — SPRINT-STATE update after deferred-list cleanup |
| `e264616` | feat — audit-log auto-stamp dealershipId via userId lookup |
| `26ad0d8` | docs — final state, #4 deliberately skipped with rationale |
| `(this)` | docs — comprehensive handoff for next session + .env.example APP_BASE_URL |

Net new tests: **+102** (1274/1275 → 1376/1377 passing).

## Cold-start checklist for next session

1. `cd ~/asura-build && git pull` — pull spec updates from Oliver
2. `cd ~/fi-copilot && git pull` — pull this branch
3. Read this file (you just did)
4. Read the operating rules at `~/asura-build/.claude-code-rules.md`
5. `pnpm test` — verify baseline (must be 1376/1377 passing, 32/32 files green)
6. `pnpm check` — verify 0 TS errors
7. Pick one of the "Next 3 tasks" above OR check git log for new spec direction Oliver pushed
8. Continue autonomous mode per the operating rules — commit + push aggressively, write state to disk before any compact

## Items NOT being done (and why)

- **Session-child write auto-stamping (deferred #4).** Deliberately skipped. Current NULL state is fail-closed against lazy queries that forget to JOIN sessions. Auto-stamping would weaken that invariant. ADR home, not a quick autonomous task. Adrian's call.
- **Full Clerk auth swap.** Requires Adrian to create Clerk app + Google OAuth provider. Existing Manus OAuth covers all pilot needs. Swap is mechanical post-pilot.
- **Manus deploy + mobile smoke + Korum install.** Adrian's hands. Cannot be automated.
- **Real StoneEagle CSV column mapping validation.** Waiting on Sunday sample from Jim Koch.

## Operating rules (still in effect — from `~/asura-build/.claude-code-rules.md`)

- Autonomous mode: don't ask before proceeding. Make the best call, log to memory, keep going.
- Commit + push every meaningful checkpoint. Never commit broken code (`pnpm check` + `pnpm test` before each commit).
- Pull spec every 2 hours.
- At 70% context: commit, push, update SPRINT-STATE, then `/compact` (Adrian's manual trigger when at keyboard).
- Defaults: Clerk for auth (deferred for pilot), MySQL via Drizzle (don't change), match existing styling, write tests inline, fail-closed security.
- Stop conditions: tests below 1376, TS errors, real security risk, sprint complete, Adrian explicitly stops.
