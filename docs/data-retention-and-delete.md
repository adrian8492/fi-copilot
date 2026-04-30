# Data Retention and Delete — F&I Co-Pilot

**Purpose:** how data flows in, how long it stays, how it gets removed.
Operations-side companion to the legal-side `docs/privacy-dpa-review.md`.

**Companion docs:**
- `docs/legal/dpa-template-v1.md` — operative legal commitment
- `docs/privacy-dpa-review.md` — data inventory + open legal questions
- `docs/demo-seed.md` — demo-data lifecycle (independent of customer data)
- `docs/deepgram-readiness.md` — sub-processor specifics

---

## What gets stored, by lifecycle stage

### 1. On user signup / OAuth handshake

| Table | Columns | NPI? | Encryption |
|---|---|---|---|
| `users` | name, email, dealershipId, role, isSuperAdmin, etc. | No | TLS in transit, plaintext at rest |
| `audit_logs` | actor + action + resource + timestamp | No | TLS in transit, plaintext at rest |

### 2. On dealership onboarding

| Table | Columns | NPI? | Encryption |
|---|---|---|---|
| `dealerships` | name, address, contact, dpaSignedAt, dpaVersion, dpaSignedBy, ... | No | TLS in transit, plaintext at rest |
| `dealership_settings` | per-dealer feature flags + retention overrides | No | TLS in transit, plaintext at rest |
| `product_menu` | products + pricingModel + markup | No | TLS in transit, plaintext at rest |

### 3. On a live session start

| Table | Columns | NPI? | Encryption |
|---|---|---|---|
| `sessions` | userId, dealershipId, customerName, dealNumber, status, startedAt | **customerName: NPI** | `customerName` column AES-256-GCM |
| `customers` (if customer is selected from existing list) | name, email, contact info | **All NPI** | per-column encryption per Phase 1 hardening |
| `consent_logs` | sessionId, customerConsentAt, managerConsentAt, recordingMode, ipAddress | No (timestamps + mode) | TLS in transit, plaintext at rest |

### 4. During the live session

| Table | Columns | NPI? | Encryption |
|---|---|---|---|
| `audio_recordings` | sessionId, fileKey (S3-style ref), retentionExpiresAt | Audio is NPI | TLS in transit; storage layer at-rest encryption |
| `transcripts` | sessionId, speaker, text, startTime, isFinal | **text: NPI** | `text` column AES-256-GCM |
| `copilot_suggestions` | sessionId, suggestion text, when triggered | Possibly — references customer details | TLS in transit, plaintext at rest |
| `compliance_flags` | sessionId, ruleId, excerpt, severity | **excerpt: NPI** | `excerpt` column AES-256-GCM |

### 5. On session end / post-processing

| Table | Columns | NPI? | Encryption |
|---|---|---|---|
| `session_checklists` | 17-point coverage scores | No | TLS in transit, plaintext at rest |
| `performance_grades` | overallScore, rapport, compliance, PVR, PPD, etc. | No | TLS in transit, plaintext at rest |
| `objection_logs` | product, concern type, was-resolved | No | TLS in transit, plaintext at rest |
| `coaching_reports` | manager-facing summary | Possibly — references session content | TLS in transit, plaintext at rest |

### 6. On customer deletion request submission

| Table | Columns | NPI? | Encryption |
|---|---|---|---|
| `data_deletion_requests` | dealershipId, requestedBy, customerId, sessionId, customerEmail, customerName, status, scheduledDeletionAt | **email + name: NPI** | TLS in transit, plaintext at rest (request-level metadata; the customer's actual data lives in the tables above and gets purged on day 31) |

## Retention defaults

Defaults baked into the system. Per-dealer overrides are on the post-pilot
backlog (DPA §8 codifies these).

| Data type | Default | Override path |
|---|---|---|
| Audio recordings | **90 days** | `audio_recordings.retentionExpiresAt` per row; sweep via existing `getExpiredRecordings` query |
| Transcripts + coaching artifacts | **Term of agreement + 90 days** | None per-dealer yet |
| Deal records (sessions row, no NPI) | **Indefinite** (financial-record requirements) | None |
| Audit logs | **7 years** (FTC Safeguards posture) | None — fixed |
| Consent logs | Tied to the session row's lifetime | Hard-deleted alongside session on customer deletion |
| Data deletion requests | **Indefinite** (the request itself is the audit trail) | None |
| Customer-initiated deletion override | Day 31 hard-delete (30-day soft-delete window first) | Customer or DP can cancel during the 30-day window |

## How customer-initiated deletion works

End-to-end flow:

1. **Submission.** DP or dealership admin opens a customer detail page
   and submits the **Request data deletion** form. Server creates a row
   in `data_deletion_requests` with `status="pending"` and
   `scheduledDeletionAt = now() + 30 days`. `notifyOwner` fires (silent
   no-op if `forgeApiKey` is unset).
2. **Soft-delete window (30 days).** The customer or DP can cancel via
   the same admin UI, which flips `status="cancelled"`. During this
   window, reads of the customer's sessions are NOT blocked by default.
   This is an open legal question — see
   `docs/privacy-dpa-review.md` §7.
3. **Hard-delete sweep.** `scripts/process-data-deletion.ts` runs as a
   daily Manus cron starting ~May 31 (30 days after the Korum install).
   The sweep:
   - Calls `db.getPendingDeletionRequestsDue(now())` to find requests
     past their `scheduledDeletionAt`.
   - For each request, classifies as `session` (sessionId set), `customer`
     (customerId set, no sessionId), or `manual_review` (text-only).
   - For `session` and `customer` classifications, deletes in this order
     (dependency-respecting):
     1. `consent_logs` row(s) for the session(s) via
        `db.deleteConsentLogBySessionId`
     2. All session-child rows via `db.deleteSessionData`: transcripts,
        copilot_suggestions, compliance_flags, performance_grades,
        audio_recordings, coaching_reports, session_checklists,
        objection_logs.
     3. The `sessions` row itself (also via `deleteSessionData`).
     4. The `customers` row (only if `customerId` was set on the request)
        via `db.deleteCustomerByIdForDealership` — tenant-scoped for
        defense-in-depth.
   - For `manual_review` (no FK on the request — text-only), the sweep
     logs and skips. Adrian handles these by hand.
   - Marks the request `completed` via `db.completeDataDeletionRequest`.
   - Calls `notifyOwner` with the run summary (silent no-op without
     `forgeApiKey`).
4. **Audit trail.** Every sweep appends a JSONL block to
   `memory/deletion-logs/YYYY-MM-DD.md` with the request id,
   classification, dealership id, sessionIds touched, and counts. This is
   the canonical record FTC Safeguards reviewers will ask for.

## Running the deletion sweep — dry-run

The script is `scripts/process-data-deletion.ts`. Default is **dry-run**
(no destructive writes).

```bash
# Dry-run — print classified plans, write nothing to DB
pnpm exec tsx scripts/process-data-deletion.ts

# Dry-run as of a specific date (preview future sweeps before they happen)
pnpm exec tsx scripts/process-data-deletion.ts --asof 2026-05-31

# Limit how many requests to plan in one run (default 1000)
pnpm exec tsx scripts/process-data-deletion.ts --limit 50

# Actually delete — refused in production unless ALLOW_PRODUCTION_DELETE=1 is set
pnpm exec tsx scripts/process-data-deletion.ts --commit
```

**Production safety.** The script refuses `--commit` when
`NODE_ENV=production` unless `ALLOW_PRODUCTION_DELETE=1` is also set. The
Manus cron sets the override; humans poking at the prod DB do not.
Accidental hard-deletes from a dev box are blocked by design.

**Output goes to two places:**
1. **stdout** — JSON summary plus per-request plan lines
2. **`memory/deletion-logs/YYYY-MM-DD.md`** — appended (one block per
   sweep). This is the audit trail.

## How to delete demo data

Demo data uses a deal-number prefix (`T*-D*`) that real StoneEagle data
never produces. Wipe demo with:

```bash
# Dry-run
pnpm exec tsx scripts/seed-load-test.ts --reset

# Actually delete
pnpm exec tsx scripts/seed-load-test.ts --reset --commit
```

`--reset --commit` is also refused when `NODE_ENV=production`. Even if it
were not, the prefix-match guarantees only synthetic rows can be touched.

For full details on the demo seed lifecycle, see `docs/demo-seed.md`.

## Tenant isolation assumptions

Every retention and deletion path respects tenant scope:

- `db.getPendingDeletionRequestsDue` returns requests across all tenants
  (because it's run by the cron, which is super-admin-equivalent), but
  each request carries its own `dealershipId`. The deletion path then
  scopes by that id when calling `deleteCustomerByIdForDealership`.
- `db.deleteSessionData(sessionId)` deletes child rows by `sessionId`
  alone, not by `dealershipId`. This is safe because each session's child
  rows are uniquely tied by sessionId — no cross-session leakage is
  possible. (Tenant isolation is enforced upstream — only sessions a
  caller is allowed to see can become deletion targets.)
- `db.deleteCustomerByIdForDealership(customerId, dealershipId)` enforces
  tenant scope at the DELETE statement: it will only match a customer row
  whose `dealershipId` matches the request's. A misconfigured request
  with a customerId from tenant A and a dealershipId from tenant B will
  delete zero rows.
- Phase 1 + 1.5 hardened 12 child tables and 6 cross-tenant write paths.
  The 107-test `server/multi-tenant-isolation.test.ts` is the regression
  baseline for tenancy invariants. Any deletion-related schema or helper
  change must keep that suite green.

## Open legal / DPA questions

These move the needle on retention/deletion behavior and are flagged in
`docs/privacy-dpa-review.md` §7 for legal review:

1. **30-day soft-delete window — block reads?** Today, DPs can read
   pending-deletion sessions during the window. DPA §6 says customers
   have the right to "restriction of processing during dispute
   investigation". Does the soft-delete count? Counsel call.
2. **State-specific retention.** Audio = 90 days. Audit logs = 7 years.
   Some state-level laws (CA SB 1121, NY SHIELD, IL BIPA) may set
   shorter ceilings or extra disclosure requirements. Verify per state
   each dealer's customers reside in.
3. **Customer self-service deletion submission UI.** Today the DP
   submits on the customer's behalf. Spec mentions a customer-direct
   path; not in pilot scope. Does FTC Safeguards require it before
   ramping past the pilot?
4. **Reads during a deletion sweep run.** The cron runs daily; if a
   read hits a session mid-deletion, the result is undefined (race).
   Mitigation: run the cron at 3 AM PT when usage is near-zero. Future:
   wrap the sweep in a row-level read lock per session.
5. **DPA v1 review.** Drafted by Claude, not yet counsel-reviewed. See
   privacy review §7 item 3 for specific clauses to flag.

## Action plan before Korum's first hard-delete (~May 31)

The first hard-delete due date is approximately 30 days after the Korum
install (May 1 + 30 = May 31), assuming a customer requests deletion on
day 1. In practice, the first request is likely to come later, giving
more buffer.

- [ ] **By May 15:** stand up the Manus cron for
      `scripts/process-data-deletion.ts --commit`. Set
      `ALLOW_PRODUCTION_DELETE=1` in the cron's env. Daily at 3 AM PT.
- [ ] **By May 22:** verify the cron has run at least once successfully.
      Log file `memory/deletion-logs/{date}.md` should exist with
      `pendingFound: 0` blocks.
- [ ] **By May 29:** dry-run once more with `--asof 2026-06-01` to
      preview the first real deletion if Korum has any pending requests.
- [ ] **May 31:** first real hard-delete fires. Watch logs. Verify
      `notifyOwner` reaches Adrian.

If anything blocks the cron, fall back to running the script manually
from the dev box pointed at production with `ALLOW_PRODUCTION_DELETE=1`
explicitly set in that one shell. Document each manual run in the daily
journal.
