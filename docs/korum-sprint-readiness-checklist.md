# Korum Sprint Readiness Checklist — F&I Co-Pilot

**Install:** Thursday May 1 — Korum Automotive Group, Puyallup WA.
**Director:** Jim Koch. **Managers in scope:** 7 F&I managers.

**Companion docs:**
- `docs/deployment-runbook.md` — local dev + deploy + rollback (consolidated)
- `docs/deploy-manus-runbook.md` — verbose Manus deploy walk
- `docs/legal/dpa-template-v1.md` — DPA Jim signs in onboarding
- `docs/privacy-dpa-review.md` — what's collected and how
- `docs/data-retention-and-delete.md` — retention defaults + deletion behavior
- `docs/deepgram-readiness.md` — transcription audit + troubleshooting
- `docs/demo-walkthrough-korum-benstock.md` — demo script (5-min + 15-min)
- `docs/demo-seed.md` — demo seeder details

Print this or pull it up on the laptop. Tick boxes as you go. Anything
unticked at the end goes into the post-install journal at
`memory/2026-05-01.md`.

---

## Pre-sprint (Wed Apr 30 evening — the night before)

**Production deploy state**

- [ ] `APP_BASE_URL` set in Manus secrets to `https://finico-pilot-mqskutaj.manus.space` (only env var still missing per SPRINT-STATE).
- [ ] Manus Publish triggered. `/api/health` returns 200.
- [ ] All five post-deploy smoke checks in `docs/deployment-runbook.md` §11.3 green (`/api/health` 200, `/compliance` 200, login works, Phase 5 schema present, `/yesterday-recap` renders).
- [ ] Rollback target captured (Manus Management UI → Version History → previous checkpoint version ID written down on this checklist).
- [ ] Korum dealership pre-configured via `/admin/dealerships/:id/setup`. Phase 6 wizard. Step status reads "complete".
- [ ] All 7 manager invite emails dispatched. Confirm with one test recipient that the link resolves (use a personal address as a smoke).

**Laptop bag**

- [ ] Laptop charged + charger.
- [ ] Two USB mics or a USB audio interface (don't trust the venue).
- [ ] Hotspot phone with active data plan as internet fallback.
- [ ] Printed DPA + Korum's countersigned copy of `docs/legal/dpa-template-v1.md`, OR confirm the in-app DPA gate covers it (DPA acceptance is recorded in `dealerships.dpaSignedAt/dpaVersion/dpaSignedBy` per Phase 5c).
- [ ] Phone with the rollback contact's number on speed dial (Manus support / Adrian's #2).

**Don't claim anything we can't ship**

Do NOT say or imply during the install:
- "We have SOC 2." We don't yet — DPA §11 says Type 1 expected Q3 2026.
- "Audio never leaves Deepgram." Browser fallback is a different sub-processor; see privacy review §2.
- "We can recover deleted data." After the 30-day window, hard-delete is irreversible (Phase 5b spec).
- Specific PVR claims about what Korum will hit. The pilot's measurable lift will come out of the data, not from prediction.

OK to say:
- "F&I Co-Pilot is single-tenant isolated at the query layer — there's no path for another dealer's data to bleed in."
- "Two-party consent is enforced for every recording, regardless of state."
- "Customer data is encrypted at rest with AES-256-GCM."
- "Customer-deletion requests soft-delete in 24 hours, hard-delete on day 31."

## Day-of (Thursday May 1, on-site)

### Arrival

- [ ] Confirm Wi-Fi access. Get the password from Jim's office. Don't connect until you've verified the SSID with Jim or his assistant.
- [ ] Test internet: `curl -i https://finico-pilot-mqskutaj.manus.space/api/health` should return 200. If it fails, switch to hotspot before doing anything else.
- [ ] Set up the laptop in the F&I office or wherever Jim is hosting. Plug in mic. Test mic levels in OS settings.
- [ ] Open `https://finico-pilot-mqskutaj.manus.space` in a fresh Chrome window. Sign in as `adrian@asuragroup.com`.

### Mic + browser permissions check

Before recording anything live with a real customer, walk Jim through the permissions flow on his laptop and on at least one manager's machine.

- [ ] Open `/live-session` in Chrome.
- [ ] Click Record. Browser prompts for mic permission. **Allow** + check **Remember this decision**.
- [ ] If permission was previously denied: Settings → Privacy and Security → Site Settings → Microphone → revoke and re-allow for the production URL.
- [ ] On Safari (iOS / macOS): the browser fallback transcription has limited support. Default workstation is Chrome.
- [ ] Verify the WebSocket connection state in the page UI shows "connected" and the transcript pane updates within ~2 seconds of speaking.

### Deepgram key + connection sanity

The key is set in Manus secrets per the deploy runbook §1.2 — but verify it's actually live before the first recording.

- [ ] Click Record. Speak a 10-second test phrase. Confirm the transcript pane fills with **server-side** transcription (not the browser fallback).
  - **Server-side signal:** transcript chunks arrive ~200-400ms after speaking, with timestamps and speaker labels.
  - **Browser fallback signal:** chunks arrive only on pauses, no timestamps, no speaker labels.
- [ ] If browser fallback is firing instead: Deepgram key is missing or invalid. Stop, hit the runbook §4 smoke checks, and don't proceed until server-side transcription is live.

### Demo tenant walkthrough (Jim + first one or two managers)

Run through the demo flow on the seeded data, NOT on a real customer's session. The demo seed (`scripts/seed-load-test.ts`) populates a synthetic tenant; real Korum data won't show until the StoneEagle nightly export lands.

If demo data is already in production from a prior smoke test, that's fine — it stays segregated from Korum's actual `dealershipId` tenant. If you need to wipe demo data from prod first, it has to be done deliberately via SQL with a paper trail (the `--commit --reset` script refuses production by design).

- [ ] Show **`/yesterday-recap`** — the morning brief Brian Benstock asked for. Walk through the headline + 3 today's-decisions section.
- [ ] Show **`/eagle-eye`** leaderboard. Explain how `performanceGrades.overallScore` is computed.
- [ ] Show **`/live-session`**. Click Record. Walk Jim through the **two-party consent modal** — show what the customer sees, what gets stamped to `consent_logs`. Mention the revoke button.
- [ ] Show **`/compliance`** (public, no auth). This is what Korum can link to in a customer-facing privacy page if they want.
- [ ] Show **`/admin/dealerships/:korum-id/setup`** in case Jim wants to tweak the cost-plus pricing model on the product menu. This is the Phase 6 wizard.
- [ ] Show **deletion request flow**: open a customer detail page, click "Request data deletion", confirm `data_deletion_requests` row is created with `scheduledDeletionAt` set 30 days out.

### Manager onboarding

Each of the 7 F&I managers should:

- [ ] Receive their invite email (sent the night before per §A).
- [ ] Click the link → land on the OAuth handshake → sign in with Manus.
- [ ] Land on `/` with their dealership pre-set.
- [ ] Open `/profile` and verify their name + email + dealership look correct.
- [ ] Sit down for a 5-minute walkthrough of `/live-session` — especially the consent modal. Each manager personally clicks Record once and speaks a test phrase to verify their workstation's mic permissions.

### First real recording (with Jim's blessing)

Pick one manager, one customer, one deal. The customer must be on-site and willing. Walk through:

- [ ] Manager opens `/live-session`. Customer is in the room.
- [ ] Manager clicks Record. Two-party consent modal appears on the manager's screen.
- [ ] Manager turns the screen to the customer. Customer reads the consent text. Customer clicks **I Consent** (or **I Decline** — both are valid).
- [ ] Manager clicks **I Consent** on his side.
- [ ] Recording begins. Verify the transcript pane updates as the deal proceeds.
- [ ] At deal close: manager clicks Stop. Session moves to `status="completed"`.
- [ ] Verify session shows up on `/sessions` list and `/eagle-eye` leaderboard.

If the customer **declines or revokes** mid-session: confirm `recordingMode` flips to `manager_only` and the customer-side audio is dropped at the gate. The transcript continues from the manager's mic only.

### End-of-day cleanup

- [ ] Note any UX friction in `memory/2026-05-01.md` for next-morning fixup.
- [ ] Capture screenshots of any error toasts or unexpected states. Tag the file path you saw the error on.
- [ ] Confirm overnight: the StoneEagle nightly export ran at 2 AM PT (Wed Apr 30 → Thu May 1 first window), data populated `sessions` and `customers` tables for Korum's tenant. Adrian + Jim have access to the morning recap.
- [ ] If any customer requested data deletion during the day, confirm the request lives in `data_deletion_requests` with `scheduledDeletionAt` 30 days out. Hard-delete is automated by `scripts/process-data-deletion.ts` starting ~May 31.
- [ ] Don't run the demo `--reset` against prod. Don't run the deletion `--commit` against prod. Both are blocked by design but reflexes count.

## Post-sprint (within 24 hours of leaving Korum)

- [ ] Update `memory/SPRINT-STATE.md` with install state, any deferred follow-ups.
- [ ] If any DPA terms came up that aren't in `docs/legal/dpa-template-v1.md`, draft a v2 patch and bump `CURRENT_DPA_VERSION` in `client/src/pages/Onboarding.tsx`.
- [ ] Slack the install report to Oliver — date, attendees, what shipped, what didn't, what's deferred.
- [ ] Schedule a check-in with Jim at the 7-day mark to validate the data is flowing and the managers are still using the tool.

---

## Emergency cards

**If `/api/health` returns 503:**
1. Check `checks.*` keys in the response body.
2. If `database: unhealthy`: TiDB is unreachable — call Manus support.
3. If `encryption: missing`: env var got dropped — reset and redeploy.
4. If `deepgram: missing`: degraded but not fatal — sessions fall back to browser STT. Don't recommend recording until you fix it.

**If a manager can't sign in:**
1. Confirm their invite email arrived.
2. Confirm the `users.email` column has their address (case-insensitive).
3. Confirm `users.dealershipId` is set to Korum's id.
4. If all three are correct, the OAuth handshake is failing — check `OAUTH_SERVER_URL` is set in Manus secrets.

**If Deepgram drops mid-session:**
1. The WebSocket gate falls back automatically to browser STT.
2. Transcript quality drops — surface this to Jim immediately so he can pause the recording rather than ship a degraded transcript.
3. Investigate after the session: the `DEEPGRAM_API_KEY` may be rate-limited or expired.

**If a customer requests immediate deletion (not 30 days):**
1. Submit the deletion request normally.
2. Adrian (super-admin) can accelerate via `scripts/process-data-deletion.ts --asof <today>` — but ONLY in dev/staging. Production hard-delete only runs on the cron schedule, which is fine for FTC Safeguards.
3. If a same-day delete is legally required (e.g., subpoena), do it via SQL with Adrian on the line.

**Rollback the deploy:**
- Manus Management UI → ⋯ → Version History → previous checkpoint → Rollback.
- Then call Adrian. Don't try to fix forward without him.

---

**Last updated:** 2026-04-30 (install-eve).
**Owner:** Adrian. **Co-pilot at install:** Ian.
