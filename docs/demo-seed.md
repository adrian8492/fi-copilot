# Demo Seed — F&I Co-Pilot

**Purpose:** how to load, label, and reset the demo dataset without
contaminating Korum/Paragon production data.

**Companion docs:**
- `docs/deployment-runbook.md` — local dev quick-reference (calls into this)
- `docs/data-retention-and-delete.md` — production deletion behavior
- `docs/korum-sprint-readiness-checklist.md` — install-day script
- `docs/benstock-demo-checklist.md` — Paragon demo script

---

## What's in the demo dataset

The canonical demo seeder is **`scripts/seed-load-test.ts`**. The name
reflects its origin (Phase 4 load-test) but it is the demo seeder for the
pilot. Every row it writes is synthetic by construction:

| Field | Pattern | Why it's safe |
|---|---|---|
| `customers.customerName` | First+Last from a fixed pool of common names | Public name pool — not derived from any real customer record |
| `users.email` | `manager{N}@tenant{N}.test` | `.test` is RFC 2606 reserved — guaranteed not a real domain |
| `sessions.dealNumber` | `T{tenant}-D{seq}` | StoneEagle deal numbers never use this prefix; safe to identify and reset |
| `sessions.dealershipId` | 1..N (default N=5) | Tenant isolation enforced by `server/tenancy.ts`; demo tenants live alongside real ones without read leakage |
| `sessions.pru` | $1,400–$4,200, realistic distribution | Deterministic LCG seeded by `--seed` (default 42) so runs are reproducible |
| `sessions.dealDate` | Within the last 30 days (configurable) | Recent enough to populate `/yesterday-recap` and `/eagle-eye` |

**No real PII is loaded.** No real customer names. No real dealer emails.
No real deal numbers.

## How to load demo data

From a clean local box:

```bash
# Dry-run (default) — generates data, prints summary, no DB writes
pnpm exec tsx scripts/seed-load-test.ts

# Actually insert
pnpm exec tsx scripts/seed-load-test.ts --commit

# Smaller dataset, fixed seed for reproducible runs
pnpm exec tsx scripts/seed-load-test.ts --count 200 --tenants 3 --seed 7 --commit

# Custom rolling window (deals in the last 14 days only)
# Note: window is set in code, not via CLI — edit the daysWindow option
# in seed-load-test.ts main() if needed for a one-off demo.
```

**Refused in production.** `--commit` errors out when `NODE_ENV=production`.
This protects the live Korum/Paragon DB. To put demo data into prod
deliberately, you would need to bypass the script (deliberate SQL with a
paper trail) — and you almost certainly don't want to.

## How to reset demo data

```bash
# Dry-run — count rows that would be deleted (matches dealNumber LIKE 'T%-D%')
pnpm exec tsx scripts/seed-load-test.ts --reset

# Actually delete
pnpm exec tsx scripts/seed-load-test.ts --reset --commit
```

`--reset --commit` is also refused in production. The reset path matches
**only** rows whose `dealNumber` follows the synthetic `T*-D*` prefix, so
even if it ran in production, it could not touch real StoneEagle data.
The double-gate (NODE_ENV refusal + prefix-match) is intentional.

Under the hood, reset uses `db.findSessionIdsByDealNumberLike` to enumerate
matching session ids, then `db.deleteSessionData(sessionId)` to cascade-
delete child rows (transcripts, suggestions, compliance flags, performance
grades, audio recordings, coaching reports, session checklists, objection
logs) and the session row itself.

## Static catalog seeders (separate from demo data)

| Script | What | Safe in production? |
|---|---|---|
| `scripts/run-seed.mjs` | Inserts the F&I product-intelligence catalog (VSC, GAP, etc.) into `product_intelligence`. Static reference data, no PII. | Yes — this is the canonical product catalog Korum/Paragon also use. Run once after a fresh DB. |
| `scripts/seed-90-days.mjs` | 13 weeks of fake performance data for a single user. Older script, **does not have dry-run/commit safeguards** — runs immediately. Use only on dev DBs. | No — never run in production. |
| `scripts/seed-test-deal.mjs` | 5 fake deals with full transcripts + grades + objections. Older script, runs on import. | No — dev only. |
| `scripts/seed-product-intelligence.ts` | Older variant of the product catalog. | Possibly redundant with `run-seed.mjs` — needs review. |

**Recommendation for the pilot:** lean on `seed-load-test.ts` (with
`--reset` for cleanup). `run-seed.mjs` is the only other safe-to-run
seeder; the rest are legacy.

## Demo tenant identity

The seed creates `dealershipId` 1..N rows but does not currently bind them
to a named "Korum DEMO" or "Paragon DEMO" dealership label. Real dealerships
live in the `dealerships` table with their own ids. For a clean demo
walkthrough, you have two options:

1. **Use `dealershipId=1`** (or whichever low id is unclaimed in your dev
   DB) and just speak about it as "the demo tenant". Don't show the
   `/admin/dealerships` list during a Korum or Paragon walkthrough — that
   would expose the bare numeric tenant ids and look unfinished.
2. **Pre-create a dealership row called "DEMO"** via
   `/admin/dealerships/new` before seeding, then pass that dealership's id
   as the seed's tenant scope (requires a small code edit in
   `seed-load-test.ts` main() to use a fixed tenant id instead of 1..N).

For Korum on May 1: option 1 is fine. For Paragon on May 5: option 2
makes the demo feel more polished. Decide before each demo.

## Resetting the entire dev DB

Sometimes it's easier to nuke and reload. From a local box:

```bash
mysql -u root -p -e "DROP DATABASE fi_copilot_dev; CREATE DATABASE fi_copilot_dev;"
pnpm exec drizzle-kit migrate
pnpm exec tsx scripts/run-seed.mjs                   # product catalog
pnpm exec tsx scripts/seed-load-test.ts --commit     # demo deals
```

This is destructive and obviously local-only. Never run against production.

## Sanity checks after seeding

```bash
# Sessions in scope
mysql -u root -p fi_copilot_dev -e "SELECT dealershipId, COUNT(*) FROM sessions WHERE dealNumber LIKE 'T%-D%' GROUP BY dealershipId;"

# Per-tenant PVR average
mysql -u root -p fi_copilot_dev -e "SELECT s.dealershipId, AVG(g.pvr) FROM sessions s JOIN performance_grades g ON g.sessionId=s.id WHERE s.dealNumber LIKE 'T%-D%' GROUP BY s.dealershipId;"
```

If a query against `dealershipId=999` returns rows from another tenant,
that's a tenancy regression — block the demo and run
`server/multi-tenant-isolation.test.ts` before continuing.

## Common failures

| Symptom | Cause | Fix |
|---|---|---|
| `--commit` errors with "refusing to --commit with NODE_ENV=production" | Local shell has NODE_ENV=production exported (probably from a prior session). | `unset NODE_ENV` then re-run, OR run with `NODE_ENV=development pnpm exec tsx scripts/seed-load-test.ts --commit`. |
| Insert reports `skipped` for every row | Idempotency — these dealNumbers already exist. Demo data was already seeded. | Run `--reset --commit` first, then re-seed. |
| `[Database] Failed to connect` | `DATABASE_URL` is wrong or DB is down. | Verify `DATABASE_URL` in `.env` and `mysql -u <user> -p` works. |
| Tests fail after seeding | Seeded data is leaking into test DB. | Tests should use `vitest`'s in-memory mocks (see `server/db.ts` mocks in test files). If a test depends on the live DB, that's a test bug. |
