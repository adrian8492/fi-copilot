# Manus Deploy Prompt — F&I Co-Pilot

Deploy the latest `main` branch of the F&I Co-Pilot app from:
`/Users/adrian/.openclaw/workspace/Users/adrian/asura/fi-copilot`

## Current status
This repo is **deploy-ready** as of the May 2, 2026 nightly verification.

### Latest verification (May 2)
- `pnpm check` ✅ — 0 TypeScript errors
- `APP_BASE_URL=https://finico-pilot-mqskutaj.manus.space pnpm test` ✅ — **1465/1466 passing, 1 skipped**
- No blocking failures in the current application test suite when production APP_BASE_URL is provided
- Claude Code stalled without output on tonight’s run, so verification was completed manually
- Working tree was clean before the nightly docs refresh commit

### Important notes
- The remaining skipped coverage is still the env-dependent Deepgram test (`server/deepgram.test.ts`) and is not a code regression
- `server/app-base-url.test.ts` expects `APP_BASE_URL` to include `finico-pilot-mqskutaj.manus.space`; set that env var for local/test verification
- Test output also includes non-blocking log noise for missing `DATABASE_URL` / `OAUTH_SERVER_URL` and notification env config in isolated test mode, but the suite still passes

### Recent builds on `main`
- April 21 (completed April 23): Chargeback Tracker, F&I Trainer Mode, Monthly Performance Dashboard, Deal Structuring Calculator
- April 20: Contract Checklist, F&I Manager Report Card, Funding Queue, Gross Per Unit Tracker
- April 19: Incentive Tracker, F&I Health Score, Stip Tracker, Deal Profit Breakdown
- April 18: F&I Snapshot, Trade-In Analyzer, Product Profitability, Coaching Planner
- April 17: Heat Sheet, Word Tracks, Desk Log, Rate Watch
- April 6: Lender Matrix, Deal Jacket, Weekend Recap, Commission Calculator, Mobile Bottom Nav

## Smoke-test these routes
- `/chargeback-tracker`
- `/trainer-mode`
- `/monthly-dashboard`
- `/deal-structure`
- `/contract-checklist`
- `/report-card`
- `/funding-queue`
- `/gpu-tracker`
- `/incentive-tracker`
- `/fi-health`
- `/stip-tracker`
- `/deal-profit`
- `/fi-snapshot`
- `/trade-in`
- `/product-profit`
- `/coaching-planner`
- `/heat-sheet`
- `/word-tracks`
- `/desk-log`
- `/rate-watch`
- `/lender-matrix`
- `/deal-jacket`
- `/weekend-recap`
- `/commission-calculator`

## Smoke-test focus
- Sidebar placement in correct sections
- Mobile More drawer categorization across all recent pages
- Monthly Dashboard pacing chart, calendar heatmap, treemap, and comparison panel
- Deal Structure payment grid, lender recommendations, optimizer, and save/load behavior
- Chargeback filters, KPI math, trend chart, and reserve calculator
- Trainer Mode scenario flow, scoring, word track retrieval, and localStorage progress
- Funding Queue bulk actions and detail slide-out
- Contract Checklist fund-readiness gating
- Lender Matrix best-lender finder and reserve heatmap
- Deal Jacket selector, checklist states, and print layout
- Weekend Recap scoreboard, coaching focus, and share-with-GM flow
- Commission Calculator scenarios, YTD tracker persistence, and PVR slider

## All pages in the app (60+ pages)
Dashboard, Live Session, Session History, Session Detail, Eagle Eye View, Objection Analysis,
Admin Panel, Analytics, Batch Upload, Compliance Rules, Customers, Customer Detail, Product Menu,
Deal Recovery, Dealership Settings, Pipeline Diagnostics, Manager Scorecard, Demo Mode, Session Comparison,
Session Print Report, Notification Center, Leaderboard, Goal Tracker, Deal Scoring, Coaching Report Builder,
Trainer Dashboard, Deal Timeline, Multi-Location Rollup, Shift Performance, Training Curriculum,
Profit Analysis, Customer Journey, One-on-One Tracker, Compliance Audit, ROI Calculator, Payoff Tracker,
Manager Schedule, Compliance Scorecard, Lender Matrix, Deal Jacket, Weekend Recap, Commission Calculator,
F&I Benchmarks, Objection Library, Deal Funding Tracker, Heat Sheet, Word Tracks, Desk Log, Rate Watch,
F&I Snapshot, Trade-In Analyzer, Product Profitability, Coaching Planner, Incentive Tracker, F&I Health Score,
Stip Tracker, Deal Profit Breakdown, Contract Checklist, Manager Report Card, Funding Queue, GPU Tracker,
Chargeback Tracker, Trainer Mode, Monthly Dashboard, Deal Structure
+ GlobalSearch command bar + Dark Mode toggle + Mobile Bottom Nav with More drawer
