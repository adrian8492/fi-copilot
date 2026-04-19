# Manus Deploy Prompt — April 18, 2026

## App Info
- **App:** F&I Co-Pilot (ASURA Group)
- **App ID:** MQskutAJ8qMCMFRFedd6Fn
- **URL:** https://finico-pilot-mqskutaj.manus.space/
- **Auth token:** 8d65f4078e4e44c59387a2c6fe8eb551.4na7S8SMu0zeCtP19dMgEqmH
- **Repo branch:** main
- **Commit to deploy:** 724a325

## What's New (April 18 build)

Four new pages added tonight:

### 1. F&I Snapshot Report (`/fi-snapshot`)
- One-page printable manager performance snapshot
- 8-manager selector + period filter (This Month / Last Month / Last 90 / YTD)
- KPI grid: Deals, PVR, Revenue, Penetration %, Compliance, Coaching — each with 12-week sparkline
- Product Leaderboard table
- Objection Handling RadarChart (6 axes)
- Top 3 wins + 3 coaching focus areas
- PVR trend AreaChart + share/print buttons
- Sidebar: Performance section (after Weekend Recap)

### 2. Trade-In Analyzer (`/trade-in`)
- Year/Make/Condition ACV lookup → equity calculation (ACV - payoff)
- F&I impact panel for positive vs negative equity scenarios
- Financed amount, monthly payment (amortization), product affordability calculator
- Equity position BarChart + Deal Structuring Tips (rule-based)
- Sidebar: Operations section (after Lender Matrix)

### 3. Product Profitability Center (`/product-profit`)
- 10-product P&L table: Avg Retail, Avg Cost, Avg Gross, Margin %, Total Gross
- Margin waterfall BarChart, cost-vs-revenue ScatterChart, per-manager stacked BarChart
- Product mix PieChart + month-over-month toggle
- Underperforming product alerts (margin < 25%)
- Date range filter: MTD / Last 30 / Last 90 / YTD
- Sidebar: Business section (after Commission Calculator)

### 4. Coaching Session Planner (`/coaching-planner`)
- Manager list with due-for-coaching badges (> 14 days) + overdue alerts (> 21 days)
- Session form: type, datetime, agenda builder, notes, star rating, action items, follow-up date
- localStorage persistence
- Custom monthly calendar grid with session dots
- Coaching cadence KPI + session history (last 5 per manager)
- Sidebar: Performance section (after F&I Snapshot)

## Test Status
- **1074/1075 passing** (1 pre-existing deepgram env-var failure — safe to ignore)
- 0 TypeScript errors
- 46 new tests in `server/nightly-april18.test.ts`

## Full Page Inventory (all routes)
Dashboard, LiveSession, SessionHistory, SessionDetail, EagleEyeView, ObjectionAnalysis,
AdminPanel, Analytics, BatchUpload, ComplianceRules, Customers, CustomerDetail, ProductMenu,
DealRecovery, DealershipSettings, PipelineDiagnostics, ManagerScorecard, DemoMode,
SessionComparison, SessionPrintReport, NotificationCenter, Leaderboard, GoalTracker,
DealScoring, CoachingReportBuilder, TrainerDashboard, DealTimeline, MultiLocationRollup,
ShiftPerformance, TrainingCurriculum, ProfitAnalysis, CustomerJourney, OneOnOneTracker,
ComplianceAudit, ROICalculator, PayoffTracker, ManagerSchedule, ComplianceScorecard,
LenderMatrix, DealJacket, WeekendRecap, CommissionCalculator, FIBenchmarks, ObjectionLibrary,
DealFundingTracker, HeatSheet, WordTracks, DeskLog, RateWatch,
**FISnapshot**, **TradeIn**, **ProductProfit**, **CoachingPlanner** ← new tonight

## Smoke Test Checklist (after deploy)
- [ ] `/fi-snapshot` — manager dropdown works, KPI cards + sparklines render, radar chart loads
- [ ] `/trade-in` — ACV lookup returns values, equity calculation correct, tips appear on edge cases
- [ ] `/product-profit` — P&L table shows 10 products, charts render, underperforming alert visible
- [ ] `/coaching-planner` — manager list shows badges, session form saves to localStorage, calendar grid renders
- [ ] Sidebar — verify new entries appear in correct sections (Performance, Operations, Business)
- [ ] Mobile — bottom nav More drawer shows updated section links

## Deploy Command
```
# From Manus dashboard or CLI:
# Pull latest main and redeploy the app
```
