# Manus Deploy Prompt — F&I Co-Pilot
**Updated:** April 17, 2026 — New feature build ready to deploy

Deploy the latest build of the F&I Co-Pilot application from the GitHub repository to the Manus hosting environment.

**App ID:** MQskutAJ8qMCMFRFedd6Fn  
**Current URL:** https://finico-pilot-mqskutaj.manus.space/

## What’s New in This Build

### April 17, 2026 build
- **Heat Sheet:** `/heat-sheet` — live customer heat tracker with KPI bar, heat tiers, factor badges, sort/filter controls, action notes, and heat-score breakdown modal
- **Word Track Library:** `/word-tracks` — searchable F&I script library with category filters, 25+ hard-coded tracks, favorites, copy-to-clipboard, and ASURA OPS pillar tags
- **Desk Log:** `/desk-log` — daily digital desk log with KPI summary, editable deal table, add-deal slide-over, CSV export, print support, and status-based highlighting
- **Rate Watch:** `/rate-watch` — lender rate-monitoring workspace with 12-month buy-rate trends, lender table, alert tracking, market context, and payment impact calculator
- **Navigation updates:**
  - Performance: added Heat Sheet
  - Coaching: added Word Tracks
  - Operations: added Desk Log and Rate Watch
- **Test suite:** 1028/1029 passing, with 61 new tests in `server/nightly-april17.test.ts`
- **Known failure:** the single remaining failing test is still the pre-existing `server/deepgram.test.ts` env check because `DEEPGRAM_API_KEY` is not set
- **TypeScript:** 0 errors

### Existing key routes already on main
- `/lender-matrix`
- `/deal-jacket`
- `/weekend-recap`
- `/commission-calculator`
- `/benchmarks`
- `/objection-library`
- `/funding-tracker`

## Deploy Steps
1. Pull latest from GitHub: `git pull origin main`
2. Install dependencies: `pnpm install`
3. Build: `pnpm build`
4. Start: `pnpm start`

## Post-Deploy Smoke Test
Verify these routes load cleanly:
- `/heat-sheet`
- `/word-tracks`
- `/desk-log`
- `/rate-watch`
- `/lender-matrix`
- `/deal-jacket`
- `/weekend-recap`
- `/commission-calculator`

Also verify:
- Mobile bottom nav on a narrow viewport
- More drawer opens and shows the new links
- CSV export works on `/desk-log`
- Favorites persist on `/word-tracks`
- Rate alerts persist on `/rate-watch`

## Current Stats
- **Total pages:** 47
- **Tests:** 1028/1029 passing
- **TypeScript:** 0 errors
- **Known issue:** missing `DEEPGRAM_API_KEY` causes the only failing test
