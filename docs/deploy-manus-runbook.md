# Manus Production Deploy Runbook — Phase 5 Compliance Cut

**Target deploy:** `main` branch, commit `ca4dbf1` (post-Phase-5 consolidation).
**Why now:** Korum Automotive Group install **Thursday May 1**. Phase 5 compliance
work (two-party consent, customer data deletion, `/compliance` page, DPA gate,
DPA template) is required for the install. Brian Benstock (Paragon Honda)
follows on **Monday May 5**.

**Owner:** Adrian. Walk this top-to-bottom; tick boxes in the final section as
you go. Total expected runtime: **~15 minutes** if nothing goes sideways.

> **Critical mental model.** `pnpm build` does NOT auto-apply migrations.
> Migrations are a separate manual step. Skipping them = the deploy serves
> stale schema, the Phase 5 routes (`consent.*`, `dataDeletion.*`,
> `onboarding.saveProfile` with DPA fields) error at runtime against missing
> tables/columns.

---

## Section 1 — Pre-Flight Verification

Do all of these BEFORE clicking deploy. None take more than a minute.

### 1.1 — Confirm Manus is building from `main`

In the Manus dashboard, find the deploy/project settings for `finico-pilot-...`.
Verify the configured **build branch** is `main`.

If it's currently set to `feature/multi-tenant-pilot`: **switch it to `main`**
and save before triggering. The merged history is on `main` as of `ca4dbf1`;
the feature branch is preserved at tip `9863f53` for reference but should not
receive new commits.

### 1.2 — Confirm required env vars are set in Manus secrets

These MUST exist, with the same values they had on the previous successful deploy:

| Var | Why it's load-bearing |
|---|---|
| `DATABASE_URL` | TiDB connection string. **Do not rotate** — losing it severs the live data. Format: `mysql://...@gateway03.us-east-1.prod.aws.tidbcloud.com:4000/MQskutAJ8qMCMFRFedd6Fn` |
| `ENCRYPTION_KEY` | **CRITICAL — DO NOT CHANGE.** 64-char hex. Used for AES-256-GCM field-level encryption on `sessions.customerName`, `transcripts.text`, `compliance_flags.excerpt`. Rotating it makes every encrypted column un-readable (irrecoverable without the old key). |
| `JWT_SECRET` | Session cookies signed with this. **Do not change** — every active user gets logged out on rotation. |
| `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID`, `OWNER_OPEN_ID`, `OWNER_NAME` | Manus OAuth wiring. Inherited from previous deploy — should already be set. |
| `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` | Manus's LLM + storage proxy. Inherited. |
| `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY` | Same, frontend-exposed half. |

These are **new or newly-required** for Phase 5:

| Var | Status to check | If missing |
|---|---|---|
| `DEEPGRAM_API_KEY` | Get value from `~/.env.local` on the box, or `TOOLS.md`. | Live transcription falls back to browser Web Speech API. Acceptable but degraded — the Deepgram Nova-2 quality is a Korum demo selling point. |
| `RESEND_API_KEY` | **You haven't provided this yet — flag if missing.** | Manager invite emails silently no-op. Workaround for install day: copy-paste invite tokens from `onboarding.saveTeam` response. |
| `EMAIL_FROM` | Defaults to `F&I Co-Pilot <noreply@ficopilotsystem.com>`. | OK to leave default. |
| `APP_BASE_URL` | New in Phase 2.5. Should be `https://finico-pilot-mqskutaj.manus.space` (current Manus URL) or whatever the new Phase 5 deploy URL is. | Falls back to a hardcoded default in the invite-email builder. Set this if the deploy URL has changed. |
| `NODE_ENV` | Should be `production` on Manus. | If unset, the seed-load-test script's safety check is bypassed (it refuses `--commit` only when `NODE_ENV=production`). |

### 1.3 — Confirm Manus build command

The default for this repo:
```
pnpm install --frozen-lockfile
pnpm build
```
Outputs `dist/index.js` (server bundle) plus `dist/public/` (Vite client bundle).

**Verify the build command in Manus dashboard does NOT include `pnpm db:push`.**
If it does, that's fine — migrations apply automatically. If it doesn't (the
default), you'll run them in Section 2.

---

## Section 2 — Migration Sequence Check

Phase 5 added three new migrations on top of Phase 1–4's `0020`–`0021`:

| File | Adds |
|---|---|
| `drizzle/0022_consent_logs.sql` | `consent_logs` table (Phase 5a — RCW 9.73.030 two-party consent audit trail) |
| `drizzle/0023_data_deletion_requests.sql` | `data_deletion_requests` table (Phase 5b — FTC Safeguards customer-deletion flow) |
| `drizzle/0024_dpa_signing.sql` | Adds `dpaSignedAt`, `dpaVersion`, `dpaSignedBy` columns to `dealerships` (Phase 5c — DPA acceptance gate) |

### 2.1 — Find what's currently applied on production

Drizzle tracks applied migrations in a table called **`__drizzle_migrations`**.
Run this against the production DB (use Manus's DB query UI, or any MySQL
client connected with the production `DATABASE_URL`):

```sql
SELECT id, hash, created_at
FROM __drizzle_migrations
ORDER BY id DESC
LIMIT 30;
```

This returns one row per migration that's already applied, newest first. The
`hash` matches an entry in `drizzle/meta/_journal.json` in the repo.

> **Old probe in `.manus/db/db-query-*.json`** showed only migration `0000`
> applied as of early March 2026. Do NOT trust those — they're stale. Re-run
> the query above for current state.

### 2.2 — Identify the gap

Match what came back to the entries in `drizzle/meta/_journal.json`:

```bash
cd ~/fi-copilot
cat drizzle/meta/_journal.json | python3 -m json.tool | head -60
```

Each `entries[N]` block has a `tag` (e.g., `"0022_consent_logs"`) and an
implicit hash. Anything in the journal that's NOT in `__drizzle_migrations`
needs to apply.

### 2.3 — Apply pending migrations

From your local machine with the **production** `DATABASE_URL` in your shell:

```bash
cd ~/fi-copilot
DATABASE_URL='<production-mysql-url>' pnpm exec drizzle-kit migrate
```

`drizzle-kit migrate` is **idempotent** — it only applies migrations not in
`__drizzle_migrations`. You can re-run it safely; it'll no-op if everything is
current.

**Do NOT use `pnpm db:push`** here. That command runs `drizzle-kit generate`
first, which would diff your local schema against the DB and possibly create a
*new* migration file you didn't intend to ship. Stick with `drizzle-kit migrate`.

After it completes, re-run the query from 2.1 — `0022`, `0023`, `0024` should
be in the result.

---

## Section 3 — Deploy Trigger

### 3.1 — Trigger the build

In the Manus dashboard for the project, click the deploy/redeploy button. Manus
will:
1. Pull `main` at HEAD (`ca4dbf1` or later)
2. Run `pnpm install --frozen-lockfile`
3. Run `pnpm build`
4. Restart the server process with `node dist/index.js`

### 3.2 — What to watch in build logs

**Healthy build signals:**
- `pnpm install` ends with `Done in Xs using pnpm v10.4.1` and no `ERR_PNPM_*` errors
- `vite build` reports bundle sizes (you'll see `SessionDetail` at ~1MB; that's
  expected — see the bundle-analysis comment at the top of `client/src/App.tsx`)
- `esbuild server/_core/index.ts ...` finishes silently
- Server logs show `Server running on http://localhost:3000/` (or whatever port
  Manus assigned)

**Worrisome signals (abort and investigate):**
- `ERR_PNPM_FROZEN_LOCKFILE_WITH_OUTDATED_LOCKFILE` — `pnpm-lock.yaml` and
  `package.json` drifted; do not deploy
- TypeScript errors during build — should not happen because `main` is at green
  baseline (1402/1403 tests, 0 TS errors). If you see these, the wrong branch
  is being built.
- `[Database] Failed to connect` in server logs — `DATABASE_URL` is wrong or
  the TiDB instance is unreachable

### 3.3 — Migration apply window

If you ran `drizzle-kit migrate` in Section 2.3, this is already done. Skip to
Section 4.

If your Manus build command runs `pnpm db:push` automatically: watch the build
logs for lines like:
```
[✓] Your SQL migration file ➜ drizzle/0022_consent_logs.sql
[✓] Your SQL migration file ➜ drizzle/0023_data_deletion_requests.sql
[✓] Your SQL migration file ➜ drizzle/0024_dpa_signing.sql
```
(or just the apply-step output if `migrate` not `generate` is run).

---

## Section 4 — Post-Deploy Smoke Tests (target: under 2 minutes)

Run these against the production URL (e.g., `https://finico-pilot-mqskutaj.manus.space`).

### 4.1 — Health endpoint returns 200

```bash
curl -i https://<production-url>/api/health
```

Expect HTTP 200 and a JSON body with `"status": "healthy"`. Note the route is
**`/api/health`** (with `/api` prefix), not `/health`.

If you get HTTP 503 with `"status": "degraded"`: check the `checks.*` keys in
the body. Common culprits: `database: unhealthy` (TiDB unreachable),
`encryption: missing` (env var not set), `deepgram: missing` (env var not set
— degraded but not fatal).

### 4.2 — `/compliance` page returns 200

Open `https://<production-url>/compliance` in a browser. Should render the
public attestation page (no auth required). If you see a 404 or login redirect,
the new lazy-loaded route from `App.tsx` didn't ship.

### 4.3 — Login flow works

Open `https://<production-url>/login`. Sign in with your Manus account or
local-login credentials. Should land on `/`. If sign-in itself fails, the most
likely cause is a stale `JWT_SECRET` or `OAUTH_SERVER_URL`.

### 4.4 — `consent_logs` table exists

```sql
SHOW TABLES LIKE 'consent_logs';
DESCRIBE consent_logs;
```

`SHOW TABLES` should return one row. `DESCRIBE` should list columns including
`session_id`, `dealership_id`, `customer_name`, `consent_type`, `event`,
`recorded_at`. If the table is missing, migration 0022 didn't apply — go back
to Section 2.3.

Bonus: while you're there, also confirm `data_deletion_requests` exists
(migration 0023) and `dealerships.dpaSignedAt` column exists (migration 0024):
```sql
SHOW TABLES LIKE 'data_deletion_requests';
SHOW COLUMNS FROM dealerships LIKE 'dpa%';
```
The column query should return three rows (`dpaSignedAt`, `dpaVersion`,
`dpaSignedBy`).

### 4.5 — `/yesterday-recap` renders for an existing dealership

Sign in as a user with a `dealershipId` set (yourself with admin role works).
Navigate to `/yesterday-recap`. Should render the morning brief — headline,
stats, "today's 3 decisions" if any signals are present.

If you see a "BAD_REQUEST: No dealership context" toast, the user's
`users.dealershipId` is null. Use any test admin account with a dealership.

---

## Section 5 — Rollback Plan

### 5.1 — Code rollback (Manus dashboard)

In Manus's deploy history, find the previous successful deploy (the one before
this one) and click "Restore" or "Redeploy this version." Manus serves the
prior bundle while you investigate.

### 5.2 — Code rollback (git, if Manus dashboard rollback isn't enough)

The pre-Phase-5 known-good state on `main` is commit **`3a8dcdb`** (just the
seed-load-test fix, no Phase 5). To reset deploy to that:

```bash
cd ~/fi-copilot
git checkout main
git reset --hard 3a8dcdb  # destructive — only if you're sure
git push --force-with-lease origin main
```

⚠️ **Force-pushing `main` is destructive.** Don't do this without a clear
need. The Phase 5 commits remain on `feature/multi-tenant-pilot` either way,
so nothing is lost from the codebase — you're only un-shipping them.

### 5.3 — Migration rollback (if 0022/0023/0024 partially applied)

Drizzle does not generate down-migrations automatically. To roll back, run the
inverse SQL by hand against production:

```sql
-- Rollback 0024 (DPA signing fields on dealerships)
ALTER TABLE dealerships DROP COLUMN dpaSignedAt;
ALTER TABLE dealerships DROP COLUMN dpaVersion;
ALTER TABLE dealerships DROP COLUMN dpaSignedBy;

-- Rollback 0023 (data deletion requests table)
DROP TABLE IF EXISTS data_deletion_requests;

-- Rollback 0022 (consent logs table)
DROP TABLE IF EXISTS consent_logs;

-- Mark them as un-applied so a re-deploy will re-run them later
DELETE FROM __drizzle_migrations
WHERE id IN (
  SELECT id FROM (
    SELECT id FROM __drizzle_migrations ORDER BY id DESC LIMIT 3
  ) AS sub
);
```

The two-step `DELETE FROM ... WHERE id IN (SELECT id FROM ...)` pattern is
TiDB/MySQL's required idiom — you can't delete from a subquery referencing the
same table directly.

### 5.4 — Data loss assessment if you roll back

- `consent_logs`: drops every two-party-consent event recorded since the
  Phase 5a deploy. Re-deploying will start a fresh log; existing live sessions
  will need consent re-attested. Acceptable.
- `data_deletion_requests`: drops any pending customer deletion requests. If
  Korum has not yet triggered any (no Phase 5b traffic before the Korum
  install), no real data is lost. Otherwise: copy the rows out before drop.
- `dealerships.dpa*`: drops Korum's DPA acceptance signature row. Requires Jim
  Koch to re-sign in the onboarding wizard. Mildly annoying, not catastrophic.

---

## Section 6 — Sign-Off Checklist

Tick as you go. Don't proceed past any unchecked item without a written reason
in `memory/2026-04-27.md`.

### Pre-flight (Section 1)
- [ ] Manus build branch confirmed as `main`
- [ ] `DATABASE_URL` unchanged (TiDB connection string)
- [ ] `ENCRYPTION_KEY` unchanged (do not rotate — would break encrypted columns)
- [ ] `JWT_SECRET` unchanged
- [ ] `OAUTH_SERVER_URL` + Manus OAuth vars unchanged
- [ ] `DEEPGRAM_API_KEY` set (or accepted as degraded for the demo)
- [ ] `RESEND_API_KEY` set, OR explicit decision to copy-paste invite tokens manually on install day
- [ ] `APP_BASE_URL` set to current production URL

### Migration check (Section 2)
- [ ] Pre-deploy migration count documented (paste the `__drizzle_migrations` query result somewhere — `memory/2026-04-27.md` is fine)
- [ ] Pending migrations identified (`0022`, `0023`, `0024` confirmed missing or already applied)
- [ ] `drizzle-kit migrate` run against production (or confirmed Manus auto-applies)
- [ ] Post-migration query shows `0022`, `0023`, `0024` present

### Deploy (Section 3)
- [ ] Deploy triggered in Manus dashboard
- [ ] Build succeeded — no TS errors, no install errors
- [ ] Server log shows `Server running on http://localhost:...`

### Post-deploy smoke (Section 4) — all five must pass
- [ ] `/api/health` returns 200 with `"status": "healthy"`
- [ ] `/compliance` returns 200 (Phase 5c page renders)
- [ ] Login flow works (auth not broken)
- [ ] `consent_logs`, `data_deletion_requests` tables exist; `dealerships.dpa*` columns exist
- [ ] `/yesterday-recap` renders for an existing dealership

### Final
- [ ] Production URL accessible from a clean browser session (cmd-shift-N / private mode)
- [ ] Rollback plan reviewed; previous Manus deploy version known
- [ ] Note logged in `memory/2026-04-27.md` with: deploy time, commit hash served, migration table state before/after, any anomalies

---

## Appendix — Useful one-liners

```bash
# Latest commit on main
cd ~/fi-copilot && git log -1 --oneline main

# Last 20 commits on main (verify the Phase 5 merge is there)
cd ~/fi-copilot && git log --oneline main | head -20

# Sanity: the current local working tree should be clean and on main
cd ~/fi-copilot && git status

# Re-verify test baseline before deploy
cd ~/fi-copilot && pnpm check && pnpm test 2>&1 | tail -10
# Expect: 32/32 test files green, 1402 passed | 1 skipped (1403 total), 0 TS errors

# Spot-check Phase 5 files exist
cd ~/fi-copilot && ls drizzle/0022_consent_logs.sql drizzle/0023_data_deletion_requests.sql drizzle/0024_dpa_signing.sql client/src/pages/Compliance.tsx docs/legal/dpa-template-v1.md
```
