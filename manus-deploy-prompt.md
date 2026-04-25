# Manus Deploy Prompt — F&I Co-Pilot

Deploy the latest `main` branch of the F&I Co-Pilot app from:
`/Users/adrian/.openclaw/workspace/Users/adrian/asura/fi-copilot`

## Current status
This repo is **ready for April 24 deployment**.

### What was built (April 21 nightly, completed April 23)
- `/chargeback-tracker` — Chargeback Tracker with KPI bar, 25-record chargeback table, reason PieChart, monthly trend, manager impact, at-risk deals, reserve calculator
- `/trainer-mode` — F&I Trainer Mode with 6 interactive scenarios (credit-challenged, lease return, first-time buyer, cash deal, high PVR, objection gauntlet), ASURA OPS pillar scoring, word tracks, localStorage progress
- `/monthly-dashboard` — Monthly Performance Dashboard with KPI bar, daily pacing chart, calendar heatmap, manager table, product treemap, goal progress, comparison panel
- `/deal-structure` — Deal Structuring Calculator with payment grid, product affordability, structure optimizer, lender recommendation, deal health indicator, localStorage save

### Verification
- `pnpm check` — 0 TypeScript errors
- `pnpm test` — 1274/1275 passing (1 pre-existing `server/deepgram.test.ts` failure — missing `DEEPGRAM_API_KEY`)
- All 4 new pages lazy-loaded in `App.tsx`
- Sidebar entries added: Monthly Dashboard (Performance), Trainer Mode (Coaching), Deal Structure (Operations), Chargeback Tracker (Business)

## Smoke-test these routes
- `/monthly-dashboard`
- `/deal-structure`
- `/chargeback-tracker`
- `/trainer-mode`

## Smoke-test focus
- Sidebar placement in correct sections
- Mobile More drawer categorization
- Monthly Dashboard pacing chart, calendar heatmap, treemap, and comparison panel
- Deal Structure payment grid, lender recommendations, optimizer, save/load behavior
- Chargeback filters, KPI math, trend chart, reserve calculator
- Trainer Mode scenario flow, scoring, word track retrieval, and localStorage progress

## All pages in the app (46 pages)
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
