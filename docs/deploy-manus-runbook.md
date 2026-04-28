# Manus Production Deploy Runbook — Phase 5 + Phase 6

**Target deploy:** `main` branch, commit `7cb0f14` (Phase 6 — cost-plus pricing + admin dealership setup).
**Why now:** Korum Automotive Group install **Thursday May 1**. Phase 5 compliance
work (two-party consent, customer data deletion, `/compliance` page, DPA gate,
DPA template) is required for the install. Brian Benstock (Paragon Honda)
follows on **Monday May 5**.

**Owner:** Adrian. Walk this top-to-bottom; tick boxes in the final section as
you go. Total expected runtime: **~15 minutes** if nothing goes sideways.

> **Critical mental model.** Manus uses **manual migrations**. The build command
> (`pnpm install --frozen-lockfile && pnpm build`) does NOT auto-apply database
> migrations. You must apply them separately via `webdev_execute_sql` in the
> Manus sandbox, or by running `drizzle-kit migrate` with the production
> `DATABASE_URL`. Skipping this step means the deploy serves stale schema and
> the Phase 5 routes (`consent.*`, `dataDeletion.*`,
> `onboarding.saveProfile` with DPA fields) error at runtime against missing
> tables/columns.

---

## Section 1 — Pre-Flight Verification

Do all of these BEFORE clicking deploy. None take more than a minute.

### 1.1 — Confirm Manus is building from `main`

In the Manus dashboard, find the deploy/project settings for `finico-pilot-mqskutaj`.
The configured **build branch** is `main`.

**Current state (verified 2026-04-27):** The deploy branch is `main`. Both the
Manus `origin` remote and the `user_github` remote point to the same HEAD
(`39bf4c2`). The `feature/multi-tenant-pilot` branch is preserved at its tip
for reference but should not receive new commits — all its work has been merged
into `main`.

### 1.2 — Confirm required env vars are set in Manus secrets

The following environment variable keys are **confirmed present** in the Manus
project configuration as of 2026-04-27:

| Var | Status | Notes |
|---|---|---|
| `DATABASE_URL` | **Set** | TiDB connection: `gateway03.us-east-1.prod.aws.tidbcloud.com:4000` / DB: `MQskutAJ8qMCMFRFedd6Fn`. **Do not rotate.** |
| `ENCRYPTION_KEY` | **Set** | **CRITICAL — DO NOT CHANGE.** 64-char hex. AES-256-GCM field-level encryption on `sessions.customerName`, `transcripts.text`, `compliance_flags.excerpt`. Rotating makes every encrypted column unreadable (irrecoverable without old key). |
| `JWT_SECRET` | **Set** | Session cookies signed with this. **Do not change** — every active user gets logged out on rotation. |
| `OAUTH_SERVER_URL` | **Set** | Manus OAuth backend base URL. |
| `VITE_APP_ID` | **Set** | Manus OAuth application ID. |
| `OWNER_OPEN_ID` | **Set** | Owner's Manus OpenID. |
| `BUILT_IN_FORGE_API_URL` | **Set** | Manus LLM + storage proxy (server-side). |
| `BUILT_IN_FORGE_API_KEY` | **Set** | Bearer token for Manus built-in APIs (server-side). |
| `VITE_FRONTEND_FORGE_API_URL` | **Set** | Manus built-in APIs URL (frontend). |
| `VITE_FRONTEND_FORGE_API_KEY` | **Set** | Bearer token for frontend access to Manus APIs. |
| `DEEPGRAM_API_KEY` | **Set** | Nova-2 real-time transcription. Validated — Deepgram SDK instantiates correctly. |
| `RESEND_API_KEY` | **Set** | Manager invite emails + session summaries. |
| `EMAIL_FROM` | **Set** | Sender address for Resend emails. |
| `VITE_DELPHI_EMBED_URL` | **Set** | "Ask Adrian" Delphi.ai clone embed URL. |
| `VITE_APP_TITLE` | **Set** | App display title. |
| `VITE_APP_LOGO` | **Set** | App logo URL. |

**Not present / optional:**

| Var | Status | Impact |
|---|---|---|
| `APP_BASE_URL` | Not explicitly set | Falls back to hardcoded default in invite-email builder. Should be set to `https://finico-pilot-mqskutaj.manus.space` if invite emails need correct links. |
| `NODE_ENV` | Set automatically by Manus to `production` at deploy time | No action needed. |

### 1.3 — Confirm Manus build command

The default for this repo:
```
pnpm install --frozen-lockfile
pnpm build
```
Outputs `dist/index.js` (server bundle) plus `dist/public/` (Vite client bundle).

**Migrations are NOT auto-applied by the build command.** They must be applied
manually before or after deploy via `webdev_execute_sql` in the Manus sandbox
or `drizzle-kit migrate` with the production `DATABASE_URL`. See Section 2.

---

## Section 2 — Migration Sequence Check

Phase 5 + Phase 6 added four new migrations on top of Phase 1–4's `0020`–`0021`:

| File | Adds |
|---|---|
| `drizzle/0022_consent_logs.sql` | `consent_logs` table (Phase 5a — RCW 9.73.030 two-party consent audit trail) |
| `drizzle/0023_data_deletion_requests.sql` | `data_deletion_requests` table (Phase 5b — FTC Safeguards customer-deletion flow) |
| `drizzle/0024_dpa_signing.sql` | Adds `dpaSignedAt`, `dpaVersion`, `dpaSignedBy` columns to `dealerships` (Phase 5c — DPA acceptance gate) |
| `drizzle/0025_pricing_model.sql` | Adds `pricingModel` (enum: fixed_retail/cost_plus), `markupAmount` (float), `markupType` (enum: dollar/percent) columns to `product_menu` (Phase 6 — cost-plus pricing model) |

The latest migration is `0025_pricing_model`.

### 2.1 — Current migration state on production

**Verified 2026-04-27:** All 26 migrations (`0000` through `0025`) have been
applied to the production database via `webdev_execute_sql` in the Manus
sandbox. The migration journal (`drizzle/meta/_journal.json`) tracks entries
0–25 inclusive.

To re-verify at deploy time, run this against the production DB (use Manus's
DB query UI, or any MySQL client connected with the production `DATABASE_URL`):

```sql
SELECT id, hash, created_at
FROM __drizzle_migrations
ORDER BY id DESC
LIMIT 30;
```

This returns one row per migration that's already applied, newest first. The
`hash` matches an entry in `drizzle/meta/_journal.json` in the repo.

### 2.2 — Identify the gap

Match what came back to the entries in `drizzle/meta/_journal.json`:

```bash
cd ~/fi-copilot
cat drizzle/meta/_journal.json | python3 -m json.tool | head -60
```

Each `entries[N]` block has a `tag` (e.g., `"0022_consent_logs"`) and an
implicit hash. Anything in the journal that's NOT in `__drizzle_migrations`
needs to apply.

### 2.3 — Apply pending migrations (manual process)

Migrations are **manual** on Manus. There are two methods:

**Method A — via Manus sandbox (preferred):**

In a Manus task, use `webdev_execute_sql` to run each pending migration's SQL
content. Read the `.sql` file, then execute it:

```
# Example for a pending migration:
cat drizzle/0022_consent_logs.sql
# Then paste the SQL into webdev_execute_sql
```

**Method B — via `drizzle-kit migrate` with production DATABASE_URL:**

From the Manus sandbox with the **production** `DATABASE_URL` in your shell:

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

After it completes, re-run the query from 2.1 — all migrations through `0024`
should be in the result.

---

## Section 3 — Deploy Trigger

### 3.1 — Trigger the build

In the Manus Management UI for the project, click the **Publish** button (top-right).
Manus will:
1. Pull `main` at HEAD (`39bf4c2` or later)
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

Migrations are **manual** on this project. If you have not yet applied them in
Section 2.3, do so now before serving traffic. The deploy will start serving
requests immediately, and any Phase 5 route that touches `consent_logs`,
`data_deletion_requests`, or `dealerships.dpa*` will error if the tables/columns
don't exist.

---

## Section 4 — Post-Deploy Smoke Tests (target: under 2 minutes)

Run these against the production URL: **`https://finico-pilot-mqskutaj.manus.space`**.

**No staging/preview environment exists.** The Manus preview URL
(`https://3000-*.us1.manus.computer`) is the dev server running in the sandbox
and is NOT a staging environment — it shares the same production database. The
only deployed URL is the production domain above.

### 4.1 — Health endpoint returns 200

```bash
curl -i https://finico-pilot-mqskutaj.manus.space/api/health
```

Expect HTTP 200 and a JSON body with `"status": "healthy"`. Note the route is
**`/api/health`** (with `/api` prefix), not `/health`.

If you get HTTP 503 with `"status": "degraded"`: check the `checks.*` keys in
the body. Common culprits: `database: unhealthy` (TiDB unreachable),
`encryption: missing` (env var not set), `deepgram: missing` (env var not set
— degraded but not fatal).

### 4.2 — `/compliance` page returns 200

Open `https://finico-pilot-mqskutaj.manus.space/compliance` in a browser.
Should render the public attestation page (no auth required). If you see a 404
or login redirect, the new lazy-loaded route from `App.tsx` didn't ship.

### 4.3 — Login flow works

Open `https://finico-pilot-mqskutaj.manus.space/login`. Sign in with local
credentials (`adrian@asuragroup.com` / your password). Should land on `/`.
If sign-in fails, the most likely cause is a stale `JWT_SECRET`.

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

### 5.1 — Code rollback (Manus Management UI — preferred)

In the Manus Management UI, click the **More menu (three dots)** in the
top-right header, then select **Version history**. Find the previous successful
deploy checkpoint and click **Rollback**. Manus serves the prior bundle while
you investigate.

**Known checkpoint versions (newest first):**

| Version | Description |
|---|---|
| `7cb0f14` | Phase 6 — cost-plus pricing + admin dealership setup (current deploy target) |
| `39bf4c2` | Phase 5 Compliance Cut |
| `3aed086` | Frontend fixes + 8 new pages (fbb6adf sync) |
| `13c0583` | DEEPGRAM_API_KEY added |
| `1cc7001` | Multi-tenant pilot (feature/multi-tenant-pilot merge) |
| `67f9550` | 46-commit GitHub sync (20+ new pages) |

### 5.2 — Code rollback (git, if Manus dashboard rollback isn't enough)

The pre-Phase-5 known-good state on `main` is commit **`3a8dcdb`** (just the
seed-load-test fix, no Phase 5). To reset deploy to that:

```bash
cd ~/fi-copilot
git checkout main
git reset --hard 3a8dcdb  # destructive — only if you're sure
git push --force-with-lease origin main
```

> **Force-pushing `main` is destructive.** Don't do this without a clear
> need. The Phase 5 commits remain on `feature/multi-tenant-pilot` either way,
> so nothing is lost from the codebase — you're only un-shipping them.
> **Preferred method:** Use `webdev_rollback_checkpoint` in the Manus sandbox
> or the Management UI Version History panel instead.

### 5.3 — Migration rollback (if 0022/0023/0024 partially applied)

Drizzle does not generate down-migrations automatically. To roll back, run the
inverse SQL by hand against production:

```sql
-- Rollback 0024 (DPA signing columns)
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
- [x] Manus build branch confirmed as `main` (verified: `origin/main` and `user_github/main` both at `39bf4c2`)
- [x] `DATABASE_URL` unchanged (TiDB: `gateway03.us-east-1.prod.aws.tidbcloud.com:4000` / `MQskutAJ8qMCMFRFedd6Fn`)
- [x] `ENCRYPTION_KEY` unchanged (do not rotate — would break encrypted columns)
- [x] `JWT_SECRET` unchanged
- [x] `OAUTH_SERVER_URL` + Manus OAuth vars unchanged
- [x] `DEEPGRAM_API_KEY` set and validated (Deepgram SDK test passes)
- [x] `RESEND_API_KEY` set
- [ ] `APP_BASE_URL` set to `https://finico-pilot-mqskutaj.manus.space` (recommended — currently falls back to hardcoded default)

### Migration check (Section 2)
- [x] All 26 migrations (0000–0025) applied to production DB via `webdev_execute_sql`
- [x] `0025_pricing_model` applied — `product_menu.pricingModel`, `markupAmount`, `markupType` columns verified present
- [x] `consent_logs` table verified present
- [x] `data_deletion_requests` table verified present
- [x] `dealerships.dpaSignedAt/dpaVersion/dpaSignedBy` columns verified present

### Deploy (Section 3)
- [ ] Deploy triggered via Manus Publish button
- [ ] Build succeeded — no TS errors, no install errors
- [ ] Server log shows `Server running on http://localhost:...`

### Post-deploy smoke (Section 4) — all five must pass
- [ ] `/api/health` returns 200 with `"status": "healthy"`
- [ ] `/compliance` returns 200 (Phase 5c page renders)
- [ ] Login flow works (auth not broken)
- [ ] `consent_logs`, `data_deletion_requests` tables exist; `dealerships.dpa*` columns exist
- [ ] `/yesterday-recap` renders for an existing dealership

### Final
- [ ] Production URL (`https://finico-pilot-mqskutaj.manus.space`) accessible from a clean browser session (cmd-shift-N / private mode)
- [ ] Rollback plan reviewed; previous Manus checkpoint versions documented above
- [ ] Note logged in `memory/2026-04-27.md` with: deploy time, commit hash served, migration table state before/after, any anomalies

---

## Appendix A — Infrastructure Summary

| Item | Value |
|---|---|
| **Production URL** | `https://finico-pilot-mqskutaj.manus.space` |
| **Staging/Preview** | None — dev server in Manus sandbox shares production DB |
| **DB Host** | `gateway03.us-east-1.prod.aws.tidbcloud.com:4000` |
| **DB Name** | `MQskutAJ8qMCMFRFedd6Fn` |
| **DB Engine** | TiDB (MySQL-compatible) with TLS required |
| **Deploy Branch** | `main` |
| **Migration Strategy** | Manual — apply via `webdev_execute_sql` or `drizzle-kit migrate` |
| **Rollback Method** | Manus Management UI → Version History → Rollback to checkpoint |
| **Current Commit** | `7cb0f14` (Phase 6) |
| **Test Baseline** | 1402/1403 (1 known pre-existing `nightly-march24.test.ts` mock failure) |
| **TypeScript Errors** | 0 |

## Appendix B — Useful one-liners

```bash
# Latest commit on main
cd ~/fi-copilot && git log -1 --oneline main

# Last 20 commits on main (verify the Phase 5 merge is there)
cd ~/fi-copilot && git log --oneline main | head -20

# Sanity: the current local working tree should be clean and on main
cd ~/fi-copilot && git status

# Re-verify test baseline before deploy
cd ~/fi-copilot && pnpm check && pnpm test 2>&1 | tail -10
# Expect: 34/34 test files green, 1500+ passed | 1 skipped, 0 TS errors

# Spot-check Phase 5 files exist
cd ~/fi-copilot && ls drizzle/0022_consent_logs.sql drizzle/0023_data_deletion_requests.sql drizzle/0024_dpa_signing.sql client/src/pages/Compliance.tsx docs/legal/dpa-template-v1.md

# Health check against production
curl -i https://finico-pilot-mqskutaj.manus.space/api/health
```
