# Sprint State — Korum/Benstock Pilot

**Last updated:** 2026-04-25 (live; updated continuously by autonomous Claude Code session)
**Branch:** `feature/multi-tenant-pilot`
**Last commit:** `c896d02` (Phase 1.5 — cross-tenant write hardening)

## Where we are

| Phase | Status | Commit |
|---|---|---|
| Phase 1 — Multi-tenant query enforcement layer + 25 isolation tests | ✅ shipped | `213e3a4` |
| Phase 1.5 — Cross-tenant write hardening (6 mutation routes) | ✅ shipped | `c896d02` |
| Phase 2 — Onboarding wizard + invite flow | 🟡 in progress | — |
| Phase 3 — StoneEagle ingest + /yesterday-recap + Deepgram | ⏳ pending | — |
| Phase 4 — QA + production deploy | ⏳ pending | — |

## Test baseline

- `pnpm check`: 0 TypeScript errors
- `pnpm test`: 1307 / 1308 passing (1 fail is pre-existing deepgram env, documented)
- Phase 2 must keep tests at or above 1308 - 1 = 1307 passing

## Decisions made this session

### 2026-04-25 — Phase 2 auth strategy: keep Manus OAuth for pilot, defer full Clerk swap
Spec says "Use Clerk." Reality: I don't have Clerk API keys (CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY) and creating a Clerk app + Google OAuth provider config requires Adrian to be hands-on (DNS verification, OAuth consent screen, etc.). The existing Manus OAuth already supports everything Korum/Paragon need: sessions, MFA, dealership/rooftop assignments, JWT cookies, audit logs. Per fail-closed rule, swapping working auth in mid-sprint is the riskier option.

**Path forward:** Build onboarding wizard + invite flow on top of existing Manus OAuth. The dealership creation, invite generation, invite redemption all already exist as tRPC routes (`admin.createDealership`, `invitations.create`, `invitations.redeem`). Frontend wires those together. When Adrian provides Clerk creds post-pilot, swap is mechanical (server/_core/oauth.ts is the only file that knows about the OAuth provider).

### 2026-04-25 — Phase 1.5 deferrals (entangled with existing tests)
- `compliance.createRule/updateRule/deleteRule` cross-tenant fixes — deferred. Existing fi-copilot.test.ts passes admin ctx with no dealershipId; strict tenant check on rules would break those tests. Will refactor with Phase 2.

## Blockers

- None — proceeding.

## Critical context to preserve across compactions

- MySQL dialect (NOT Postgres) — adapt all spec syntax inline
- Schema is at `drizzle/schema.ts`, NOT `shared/schema.ts` (spec is wrong about this path)
- `_core/` and `shared/_core/` are Manus-template internals — do not modify
- `getUserAccessibleDealershipIds` + `assertSessionAccess` already exist; build on top of them
- New `server/tenancy.ts` is the canonical enforcement layer going forward
- 21 existing migrations 0000-0019, plus new 0020_multi_tenant_pilot.sql; two 0019_* files coexist (parallel-branch artifact, leaving alone)
- Auto-memory entry at `~/.claude/projects/-home-adrian2410-agents/memory/project_fi_copilot_pilot.md`
- Sprint journal at `~/fi-copilot/memory/2026-04-24.md`
- Spec at `~/asura-build/content/briefs/fi-copilot-benstock-pilot-sprint.md` — pull every 2hr
- Operating rules at `~/asura-build/.claude-code-rules.md` (Oliver published 2026-04-25)

## Korum/Benstock context

- **Korum:** Puyallup WA, 7 F&I managers, F&I Director Jim Koch. **Install Mon Apr 27.**
- **Brian Benstock at Paragon Honda:** install ~May 1-5. NADA-visible.
- **Data source:** StoneEagle nightly 2 AM PT. Korum's first export Tue Apr 28.
- **DEEPGRAM_API_KEY:** in `.env.local` already.

## Recovery if a session crashes

1. Read this file
2. Read `memory/2026-04-24.md` (sprint journal)
3. Read `~/asura-build/content/briefs/fi-copilot-benstock-pilot-sprint.md`
4. Read `~/asura-build/.claude-code-rules.md`
5. `git log feature/multi-tenant-pilot --oneline -10`
6. Pick up from "Where we are" table
