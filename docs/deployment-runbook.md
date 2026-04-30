# Deployment Runbook — F&I Co-Pilot

**Scope:** local dev, env vars (no secrets), Deepgram setup, demo seed/reset,
test/build/deploy/rollback, common failures, and an owner/action table for
who does what when something breaks.

**Audience:** Adrian (primary), Ian (install support), any future engineer
joining the project. Takes ~10 minutes from a clean clone.

**Companion docs:**
- `docs/deploy-manus-runbook.md` — detailed Manus production deploy walk (older, more verbose; this file is the consolidated quick-reference)
- `docs/demo-seed.md` — demo seeder details and reset
- `docs/deepgram-readiness.md` — full Deepgram audit (env vars, failure modes, troubleshooting)
- `docs/data-retention-and-delete.md` — retention defaults, deletion sweep, demo-data wipe
- `docs/privacy-dpa-review.md` — what data the system touches
- `docs/korum-sprint-readiness-checklist.md` — pre/day-of/post for the May 1 install
- `docs/benstock-demo-checklist.md` — Paragon Honda demo script (May 5)
- `memory/SPRINT-STATE.md` — current branch state

This file deliberately contains **no secrets**. Every key, host, and token
is referenced by name only — values live in Manus secrets manager (prod)
and your local `.env` (dev).

---

## 1. Prerequisites

- Node.js 22.x (matches `.nvmrc` if present; otherwise current LTS works)
- pnpm 10.x (`corepack enable && corepack prepare pnpm@10.4.1 --activate`)
- Either MySQL 8.x locally OR a TiDB Cloud connection string (project uses
  the latter in prod; either works for dev)

## 2. Clone and install

```bash
git clone git@github.com:adrian8492/fi-copilot.git
cd fi-copilot
pnpm install --frozen-lockfile
cp .env.example .env
```

## 3. Environment variables (no secrets shown)

Open `.env` and fill these. The `.env.example` file in the repo has the
full list with brief comments.

| Var | Required for | Where to get the value |
|---|---|---|
| `DATABASE_URL` | DB connection | Local MySQL or TiDB Cloud dashboard. mysql:// URL with TLS for TiDB |
| `ENCRYPTION_KEY` | Reading/writing NPI columns | Generate once: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` — **save it; rotation is destructive** |
| `JWT_SECRET` | Auth cookies | Any 64-char random string (same generator as above) |
| `OAUTH_SERVER_URL` | Manus OAuth | Manus dashboard → project → OAuth |
| `VITE_APP_ID` | Manus OAuth | Manus dashboard |
| `OWNER_OPEN_ID` | Notifications + super-admin bootstrap | Your Manus OpenID |
| `BUILT_IN_FORGE_API_URL` + `BUILT_IN_FORGE_API_KEY` | LLM proxy + storage | Manus dashboard → API keys |
| `VITE_FRONTEND_FORGE_API_URL` + `VITE_FRONTEND_FORGE_API_KEY` | Frontend access to LLM/storage | Manus dashboard |
| `DEEPGRAM_API_KEY` | Live transcription | Deepgram console (https://console.deepgram.com); falls back to browser STT if absent |
| `RESEND_API_KEY` + `EMAIL_FROM` | Outbound emails (manager invites, etc.) | Resend dashboard; silent no-op if absent |
| `APP_BASE_URL` | Public link generation in emails | Your dev URL or hardcoded fallback |
| `PORT` | HTTP listener | Default `3000` |
| `NODE_ENV` | Behavior gate | `development` for local |

**Required to boot:** `DATABASE_URL`, `ENCRYPTION_KEY`, `JWT_SECRET`,
`OAUTH_SERVER_URL`, `VITE_APP_ID`. Everything else is optional with
graceful fallback.

## 4. Database setup

### Local MySQL

```bash
mysql -u root -p -e "CREATE DATABASE fi_copilot_dev;"
# Set DATABASE_URL=mysql://root:<password>@127.0.0.1:3306/fi_copilot_dev
```

### Apply migrations

```bash
pnpm exec drizzle-kit migrate
```

`drizzle-kit migrate` is idempotent — only applies migrations not already
in `__drizzle_migrations`. For a fresh DB it runs all 26 migrations
(`0000` → `0025`). For a TiDB connection that's already migrated by Manus,
this is a no-op.

**Do not use `pnpm db:push`** for production databases. It generates a
migration first, which can produce a file you didn't intend to ship. Use
`drizzle-kit migrate` directly.

## 5. Demo seed

The canonical demo seed is `scripts/seed-load-test.ts`. Every row it writes
is synthetic:
- Customer names from public name pools (no PII)
- Manager emails formatted `manager{N}@tenant{N}.test` (RFC 2606 reserved TLD)
- Deal numbers prefixed `T{tenant}-D{seq}` — easy to identify and reset

```bash
# Dry-run (default) — generates data, prints summary, no DB writes
pnpm exec tsx scripts/seed-load-test.ts

# Smaller dataset, fixed seed for reproducible runs
pnpm exec tsx scripts/seed-load-test.ts --count 200 --tenants 3 --seed 7

# Actually insert into the dev DB
pnpm exec tsx scripts/seed-load-test.ts --count 200 --tenants 3 --seed 7 --commit

# Reset — preview what would be deleted (every row matching dealNumber LIKE 'T%-D%')
pnpm exec tsx scripts/seed-load-test.ts --reset

# Reset for real
pnpm exec tsx scripts/seed-load-test.ts --reset --commit
```

The script refuses `--commit` when `NODE_ENV=production` — never write to
the live Korum/Paragon DB through it. To clean demo data from prod, do it
deliberately via SQL with a paper trail.

## 6. Run the dev server

```bash
pnpm dev
```

This is `tsx watch server/_core/index.ts`. Vite serves the client at
`http://localhost:3000`. Watch the terminal for two lines on first request:

```
[Database] Connected (MySQL)
Server running on http://localhost:3000/
```

If you see `[Database] Failed to connect`, check `DATABASE_URL`. If you
see `[OAuth] OAUTH_SERVER_URL is not configured`, the auth flow won't
work but other routes still load.

## 7. Deepgram transcription (optional)

Without `DEEPGRAM_API_KEY`, `/live-session` falls back to the browser's
built-in `SpeechRecognition` API. This works in Chrome and Edge; Safari
support is partial. Note privacy implications in
`docs/legal/privacy-review-notes.md` §2.

With the key set, the WebSocket gate forwards audio to Deepgram Nova-2
streaming and writes encrypted transcripts to the DB. Verify with the
included Deepgram smoke test:

```bash
pnpm test -- server/deepgram.test.ts
```

This test is `it.skipIf(!process.env.DEEPGRAM_API_KEY)` — passes silently
if the key is unset.

## 8. Quality gates

Run before every commit. Tests, typecheck, build are all expected to
pass on `main`:

```bash
pnpm check       # tsc --noEmit — should print nothing on success
pnpm test        # vitest run — should report 34 files, ~1444 tests
pnpm build       # vite + esbuild — produces dist/index.js + dist/public/
```

Test baseline as of 2026-04-30: **34 test files green, 1444 passed | 1
skipped (1445 total)**. The 1 skipped is the Deepgram env-gated test.

## 9. Deletion sweep dry-run

The hard-delete cron is `scripts/process-data-deletion.ts`. Run a dry-run
before any change to that file or to `db.ts`'s deletion helpers:

```bash
# Dry-run — prints classified plan, writes nothing
pnpm exec tsx scripts/process-data-deletion.ts

# Dry-run as of a specific date (useful for previewing future sweeps)
pnpm exec tsx scripts/process-data-deletion.ts --asof 2026-05-31

# Actually delete (refused in NODE_ENV=production unless ALLOW_PRODUCTION_DELETE=1 is set)
pnpm exec tsx scripts/process-data-deletion.ts --commit
```

Output goes to stdout AND to `memory/deletion-logs/YYYY-MM-DD.md`. The
log file is the audit trail FTC Safeguards reviewers will ask for.

## 10. Build for production

```bash
pnpm build
```

Outputs:
- `dist/index.js` — server bundle (esbuild, ESM, externals = `package.json` deps)
- `dist/public/` — Vite client bundle

Then `pnpm start` runs the server bundle. Manus does this automatically
on Publish. For local-prod testing, `NODE_ENV=production pnpm start` works.

## 11. Deploy to Manus

This section is the canonical post-deploy gate. The deeper procedural
walk (env-var inventory, version-history rollback table, migration
journal verification) lives in `docs/deploy-manus-runbook.md`; that file
is referenced when this one points at it explicitly.

### 11.1 — Pre-flight

1. Manus uses **manual migrations** — `drizzle-kit migrate` against the
   prod `DATABASE_URL` BEFORE clicking Publish. (As of 2026-04-30, all
   migrations through `0025` are already applied to prod.)
2. Confirm required env vars are set in Manus secrets (`DATABASE_URL`,
   `ENCRYPTION_KEY`, `JWT_SECRET`, `OAUTH_SERVER_URL`, `VITE_APP_ID`,
   `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_URL` + key, `DEEPGRAM_API_KEY`,
   `RESEND_API_KEY`, `EMAIL_FROM`, `APP_BASE_URL`). The full reference
   list is in `docs/deploy-manus-runbook.md` §1.2.
3. Capture the rollback target — Manus Management UI → ⋯ → Version
   History → note the currently running checkpoint version ID.

### 11.2 — Publish

Click **Publish** in the Manus Management UI. Watch the build logs for
the healthy signals:
- `pnpm install` ends with `Done in Xs using pnpm v10.4.1` and no
  `ERR_PNPM_*` errors
- `vite build` completes; the SessionDetail bundle warning is expected
- `esbuild server/_core/index.ts` finishes silently
- Server logs show `Server running on http://localhost:3000/`

### 11.3 — Post-deploy smoke test (target: under 2 minutes)

Run all five checks against the production URL
`https://finico-pilot-mqskutaj.manus.space`. ALL must pass before you
let traffic at the new bundle.

1. **`/api/health` returns 200.**
   ```bash
   curl -i https://finico-pilot-mqskutaj.manus.space/api/health
   ```
   Expect HTTP 200 + body `"status": "healthy"`. If 503 with
   `database: unhealthy`, TiDB is unreachable. If `encryption: missing`,
   the env var got dropped. If `deepgram: missing`, key is missing
   (degraded but not fatal — see `docs/deepgram-readiness.md`).

2. **`/compliance` returns 200.** Open
   `https://finico-pilot-mqskutaj.manus.space/compliance` in a browser.
   Public attestation page renders without auth. A login redirect or
   404 means the lazy-loaded route from `App.tsx` didn't ship.

3. **Login flow works.** Open `/login`, sign in with local credentials.
   Land on `/`. If sign-in fails, the most likely cause is a stale
   `JWT_SECRET`.

4. **Phase 5 schema present.**
   ```sql
   SHOW TABLES LIKE 'consent_logs';
   SHOW TABLES LIKE 'data_deletion_requests';
   SHOW COLUMNS FROM dealerships LIKE 'dpa%';     -- expect 3 rows: dpaSignedAt, dpaVersion, dpaSignedBy
   SHOW COLUMNS FROM product_menu LIKE 'pricing%'; -- expect 1 row: pricingModel
   ```
   Any missing table or column means migration 0022/0023/0024/0025
   didn't apply — go back to 11.1 step 1.

5. **`/yesterday-recap` renders for an existing dealership.** Sign in
   as a user with a `dealershipId` set. Navigate to `/yesterday-recap`
   — it should render the morning brief. A "BAD_REQUEST: No dealership
   context" toast means the user's `users.dealershipId` is null. Use
   any test admin account with a dealership.

If any check fails, **stop**. Roll back via Manus Management UI →
Version History → previous checkpoint → Rollback. Then triage. The
detailed migration-rollback SQL (for partially-applied schema changes)
lives in `docs/deploy-manus-runbook.md` §5.

### 11.4 — Rollback

Manus Management UI → ⋯ → Version History → previous checkpoint →
**Rollback**. Manus serves the prior bundle while you investigate.
Code rollback alone; if a destructive migration broke things, see
`docs/deploy-manus-runbook.md` §5.2 for the inverse SQL.

## 12. Rollback (local development)

If a local change went sideways:

```bash
git stash                       # save your changes
git checkout main && git pull   # back to known-good
pnpm install --frozen-lockfile  # in case lockfile changed
pnpm exec drizzle-kit migrate   # in case schema changed
```

For a destructive DB reset:

```bash
mysql -u root -p -e "DROP DATABASE fi_copilot_dev; CREATE DATABASE fi_copilot_dev;"
pnpm exec drizzle-kit migrate
pnpm exec tsx scripts/seed-load-test.ts --commit
```

## 13. Where things live

| Path | What |
|---|---|
| `server/_core/` | Manus-template internals — do not modify |
| `server/db.ts` | Drizzle helpers, ~2800 lines, single source of DB truth |
| `server/tenancy.ts` | Query-layer tenant isolation primitives |
| `server/routers.ts` | tRPC routers — every protected route lives here |
| `server/websocket.ts` + `server/http-stream.ts` | Live transcription gates |
| `client/src/pages/` | React pages |
| `drizzle/schema.ts` | Single source of schema truth |
| `drizzle/*.sql` | Generated migrations — `drizzle-kit migrate` applies these |
| `scripts/` | One-off and cron-like scripts |
| `docs/` | Operator + legal docs |
| `memory/` | Session journals, sprint state, deletion-log audit trail |

## 14. Common failures

| Symptom | Probable cause | Fast fix |
|---|---|---|
| `pnpm dev` boot loops with `[Database] Failed to connect` | `DATABASE_URL` is wrong, DB is down, or TLS-required URL is missing the TLS suffix | Verify `.env`. For TiDB Cloud, the URL must include `?ssl={"rejectUnauthorized":true}` or the equivalent flag |
| `pnpm test` reports "ENCRYPTION_KEY missing" failures | `.env` not loaded by the test runner | Run `pnpm test` from the repo root; vitest auto-loads `.env` only when invoked there |
| `pnpm build` fails with `ERR_PNPM_FROZEN_LOCKFILE_WITH_OUTDATED_LOCKFILE` | `package.json` and `pnpm-lock.yaml` drifted | `pnpm install` (without `--frozen-lockfile`) locally, commit the new lockfile, retry |
| Tests pass locally but fail in Manus build | Different Node version, or dotenv quirks | Pin to Node 22.x; verify Manus build logs |
| `/api/health` returns 503 with `database: unhealthy` | TiDB unreachable | Manus dashboard → DB connectivity check; if DB is up, restart the deploy |
| `/api/health` returns 503 with `encryption: missing` | `ENCRYPTION_KEY` env var dropped | Restore in Manus secrets and redeploy. **DO NOT generate a new key** — that breaks every existing encrypted column |
| `/live-session` shows "browser fallback" badge during a demo | Deepgram unreachable or `DEEPGRAM_API_KEY` invalid | See `docs/deepgram-readiness.md` § "Production troubleshooting" |
| Manager invite email link goes to wrong host | `APP_BASE_URL` not set in Manus secrets | Set to `https://finico-pilot-mqskutaj.manus.space`, redeploy |
| Demo seed `--commit` errors with "refusing to --commit with NODE_ENV=production" | Local shell exported `NODE_ENV=production` from a prior task | `unset NODE_ENV` then re-run, or prefix with `NODE_ENV=development` |
| Deletion sweep `--commit` errors with same message | Same — but if you're running it as the Manus cron, set `ALLOW_PRODUCTION_DELETE=1` in the cron env (not in your shell) | Configure the cron's env, not your local shell |

## 15. Owner / action table

Who responds to what when something breaks. "On call" means primary
responder; "Backup" steps in if primary is unreachable.

| Surface | On call | Backup | Action when broken |
|---|---|---|---|
| Manus production deploy (`finico-pilot-mqskutaj.manus.space`) | Adrian | Ian | Roll back via Manus Management UI → Version History; if rollback fails, escalate to Manus support |
| TiDB production database | Adrian | Manus support | Manus dashboard → DB → connectivity check; if DB is the issue, open a ticket |
| Deepgram (transcription sub-processor) | Adrian | (no backup; fall back to browser STT) | Verify key in console; check usage / billing page; if rate-limited, stagger recordings |
| Resend (email sub-processor) | Adrian | (silent no-op fallback) | Check Resend dashboard; manager invites can be re-sent manually if needed |
| Customer-initiated deletion request flow | Adrian | (the request itself queues the work; no human needed unless `manual_review` classification) | Check `memory/deletion-logs/` for any sweep that flagged manual_review |
| Korum install (May 1) — F&I manager onboarding issues | Adrian | Ian | See `docs/korum-sprint-readiness-checklist.md` § "Emergency cards" |
| Korum / Paragon DPA review | Adrian | Dealer counsel | See `docs/legal/dpa-template-v1.md` and `docs/privacy-dpa-review.md` § 7 |
| `pnpm test` regression on `main` | The committer (Adrian, in practice) | — | Tests below 1444/1445 baseline = block any deploy. Bisect, fix, push |
| `server/multi-tenant-isolation.test.ts` failure | The committer | Adrian | Cross-tenant regression = stop everything. Tenant isolation is the load-bearing invariant for Korum + Paragon co-existing |
| Compliance / privacy escalation from a customer | Adrian | Dealer DP (whose customer it is) | Route via `compliance@asuragroup.com` per DPA §6 |
