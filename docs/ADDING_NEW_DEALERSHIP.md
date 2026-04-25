# Adding a new dealership

Operator runbook for onboarding a new dealer group onto F&I Co-Pilot.
Adrian / Ian execute this end-to-end on install day; the steps below
match the system's actual data flow as of `feature/multi-tenant-pilot`.

## 0 — Pre-install (Fri/Sun before install day)

Collect from the F&I Director (e.g., Jim Koch at Korum):

- Legal name + slug (URL-safe, lowercase) — e.g., `Korum Automotive Group` → `korum`
- Location (city, state)
- Brand mix (list)
- Monthly unit volume
- Current F&I PRU
- 90-day target PRU (optional)
- F&I Director's email (becomes the dealership admin account)
- F&I manager roster: name + email per manager
- 30-day baselines: VSA pen %, GAP pen %, Appearance pen %, chargeback rate %, CIT aging avg days
- Coaching cadence: day, time, who runs it (F&I director / ASURA coach / DP)
- StoneEagle export schedule confirmation (CSV emailed/SFTP-dropped at 1:30 AM PT nightly)

## 1 — Create the dealership row (super admin only)

Adrian does this from the existing admin panel (`/admin`) — uses
`admin.createDealership` tRPC mutation:

```ts
admin.createDealership({ name: "Korum Automotive Group", slug: "korum", plan: "beta" })
```

Note the returned `id` — that's the **dealership ID** every other step uses.

## 2 — Create the F&I Director's user account

Two paths:

**A. They sign up via OAuth, then Adrian links them.**

```ts
admin.assignUserToDealership({ userId: <theirUserId>, dealershipId: <fromStep1> })
admin.updateUserRole({ userId: <theirUserId>, role: "admin" })
```

**B. Adrian creates a local-login account and sends them credentials.**

(See existing `auth.localLogin` flow — out of scope for this doc.)

## 3 — Director runs the 5-step onboarding wizard

The director navigates to `/onboarding`. The wizard auto-resumes at the last
completed step + 1, so they can start, save, and come back. Backend routes:

| Step | Route | Saves to |
|------|-------|----------|
| 1. Profile | `onboarding.saveProfile` | `dealerships.{location, brandMix, unitVolumeMonthly, pruBaseline, pruTarget}` |
| 2. Products | `onboarding.saveProducts` | `product_menu` (one row per protection) |
| 3. F&I team | `onboarding.saveTeam` | `invitations` (one per manager, returns redeemable tokens) |
| 4. Baseline | `onboarding.saveBaseline` | `dealership_settings.{vsaPenBaseline, ...}` |
| 5. Cadence | `onboarding.saveCadence` | `dealership_settings.{coachingCadenceDay, ...}` + flips `onboardingComplete=true` |

Tenant safety is structural: every onboarding mutation reads
`ctx.user.dealershipId` rather than accepting a dealership ID from input,
so a director cannot accidentally onboard the wrong tenant.

## 4 — Send manager invite links

Step 3 returned an `invites: [{ email, token }]` array. Each manager visits
`/join?token=<tok>` (page already exists at `client/src/pages/JoinPage.tsx`),
signs in, and is auto-attached to the dealership.

For the pilot, Adrian/Ian email the invite links manually. Resend
integration (`server/_core/email.ts`) is wired but the template/trigger
isn't yet — TODO post-pilot.

## 5 — Set up the StoneEagle nightly drop

On install day, configure StoneEagle to send the dealership's nightly CSV
export to:

- A watched folder on Adrian's mac mini (`~/asura-ingest/stoneeagle/inbox/`),
  OR
- A dedicated email-to-folder relay

Then add a cron entry:

```cron
0 2 * * * cd ~/fi-copilot && tsx scripts/stoneeagle-ingest.ts ~/asura-ingest/stoneeagle/inbox/<filename>.csv --dealership <fromStep1>
```

The ingest script:
- Dedupes on `(dealershipId, dealNumber)` — re-running is safe
- Refuses to attribute a deal to a manager from a different dealership
  (fail-closed — logs the row to errors and continues)
- Writes a JSON-line summary to `memory/ingest-logs/stoneeagle-YYYY-MM-DD.log`

Use `--dry-run` first against a sample CSV to confirm column mappings.

## 6 — Verify

After the first nightly drop completes, confirm:

- `pnpm test` is green (1345+ passing)
- Director logs in → `/yesterday-recap` renders with real data
- Director sees only their own dealership's deals (multi-tenant
  isolation tests cover this; spot-check by querying `sessions` for
  another dealership's `dealNumber` and confirming it 404s)
- Each F&I manager can see their own grade history but NOT other
  managers' (already enforced by `assertSessionAccess`)

## 7 — Deploy to the live workspace

(Adrian's hands — Manus deploy. Not automated. URL convention:
`<dealership-slug>.fi-copilot.app` post-pilot.)

---

## Useful queries (super-admin diagnostics)

| Question | Query |
|---|---|
| How many sessions has Korum had this week? | `getDealershipDigest(<korumId>, <weekStart>, <now>)` |
| Cross-tenant leak check (should always be empty) | `SELECT * FROM sessions WHERE dealershipId IS NULL` |
| Per-tenant row counts | `SELECT dealershipId, COUNT(*) FROM sessions GROUP BY dealershipId` |
| Audit trail for a tenant | `getAuditLogs(...)` filtered by their user IDs |

## When something looks wrong

- Tenancy bug suspected → run `pnpm test server/multi-tenant-isolation.test.ts`
  (30+ tests covering all known cross-tenant exploitation surfaces)
- StoneEagle ingest failing → check `memory/ingest-logs/stoneeagle-YYYY-MM-DD.log`
- Onboarding stuck → check `dealerships.onboardingStep` for that tenant; can
  manually advance via super-admin DB update if a step is bugged

## Load-testing a tenant

```sh
tsx scripts/seed-load-test.ts --count 1000 --tenants 5 --commit
```

Refuses to run with `NODE_ENV=production`. Generates deterministic,
reproducible deals across N synthetic tenants for perf and isolation
verification. Default (no `--commit`) is dry-run only.
