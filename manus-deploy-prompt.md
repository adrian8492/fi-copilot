# Manus Deploy Prompt — F&I Co-Pilot

Deploy the latest `main` branch of the F&I Co-Pilot app from:
`/Users/adrian/.openclaw/workspace/Users/adrian/asura/fi-copilot`

## Current status
This repo is **deploy-ready** as of the April 27, 2026 nightly verification.

### What was fixed (April 26 nightly)
- Fixed `scripts/seed-load-test.ts` deterministic date-generation bug — `dealMs` could exceed `endDate` by 1ms due to floating-point overflow in the LCG RNG; clamped with `Math.min()` to guarantee dates stay within the rolling window
- Restored green test baseline: 1376/1377 passing, 1 skipped (pre-existing deepgram env)

### Previous builds on `main`
- April 21 (completed April 23): Chargeback Tracker, F&I Trainer Mode, Monthly Performance Dashboard, Deal Structuring Calculator
- April 20: Contract Checklist, F&I Manager Report Card, Funding Queue, Gross Per Unit Tracker
- April 19: Incentive Tracker, F&I Health Score, Stip Tracker, Deal Profit Breakdown
- April 18: F&I Snapshot, Trade-In Analyzer, Product Profitability, Coaching Planner
- April 17: Heat Sheet, Word Tracks, Desk Log, Rate Watch
- April 6: Lender Matrix, Deal Jacket, Weekend Recap, Commission Calculator, Mobile Bottom Nav

### Verification (April 27)
- `pnpm check` — 0 TypeScript errors
- `pnpm test` — 1376/1377 passing, 1 skipped
- No blocking failures — repo remains green
- Working tree clean after verification commit and push

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

## Smoke-test focus
- Sidebar placement in correct sections
- Mobile More drawer categorization
- Monthly Dashboard pacing chart, calendar heatmap, treemap, and comparison panel
- Deal Structure payment grid, lender recommendations, optimizer, save/load behavior
- Chargeback filters, KPI math, trend chart, reserve calculator
- Trainer Mode scenario flow, scoring, word track retrieval, and localStorage progress
- Funding Queue bulk actions and detail slide-out
- Contract Checklist fund-readiness gating

## Notes
- Repo is deploy-ready — no blocking test failures remain
- The 1 skipped test is `server/deepgram.test.ts` which requires `DEEPGRAM_API_KEY` env var (not a code issue)
- All new pages are lazy-loaded in `App.tsx` and registered in `AppLayout.tsx` sidebar

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
