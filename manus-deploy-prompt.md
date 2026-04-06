# Manus Deploy Prompt — F&I Co-Pilot
**Updated:** April 5, 2026 — Build 5878ed6

## What to Deploy

Deploy the latest build of the F&I Co-Pilot application from the GitHub repository to the Manus hosting environment.

**App ID:** MQskutAJ8qMCMFRFedd6Fn  
**Current URL:** https://finico-pilot-mqskutaj.manus.space/

## What's New in This Build

### Build 5878ed6 — April 5, 2026
- **ROI Calculator:** `/roi-calculator` — Sales tool for DPs and GMs to see ASURA coaching financial impact. Input panel with 5 adjustable parameters (Current Avg PVR, Monthly Deal Volume, Number of F&I Managers, Current Product Penetration %, Monthly Coaching Investment). Output panel showing Projected PVR After ASURA (+$759 avg lift), Projected Monthly/Annual Revenue Increase, ROI Multiplier, Payback Period. "Before vs After" side-by-side comparison cards (PVR, Revenue, Penetration, Products per Deal). 12-month revenue projection chart (recharts Area: with vs without ASURA coaching). Sensitivity slider (±$200 from $759 baseline for conservative/aggressive scenarios). Share Report button (copies formatted summary to clipboard). Print-ready layout. Hero text references $200M+ in F&I revenue generated for clients. New "Business" sidebar section.
- **Product Payoff Tracker:** `/payoff-tracker` — Cancellation and claims analytics for F&I products. Top KPI bar (Total Products Sold MTD, Cancellation Rate %, Claims Rate %, Net Retention Revenue). 8-product retention table (VSC, GAP, Tire & Wheel, Paint Protection, Maintenance Plan, Theft Deterrent, Windshield, Key Replacement) showing Units Sold, Units Cancelled, Cancel Rate %, Claims Filed, Claims Paid, Avg Claim Cost, Net Revenue After Cancellations. 12-month cancellation trend chart (recharts Line, toggleable per product). Cancellation Window bar chart (0-30, 31-60, 61-90, 91-180, 180+ days since sale). Manager cancellation comparison table. "At Risk" alert cards (products with >5% MoM cancellation increase). Date range filter (MTD/Last 30/Last 90/YTD). CSV export. Added to sidebar under Operations.
- **Manager Schedule:** `/schedule` — Weekly F&I manager floor coverage scheduler. Grid layout (Mon-Sat × 9AM-8PM in 1-hour blocks). Click cell to assign a manager from dropdown. 4 color-coded managers. Coverage Score per time slot (red = 0 managers/unstaffed, yellow = 1/adequate, green = 2+/optimal). Weekly summary cards (Total Scheduled Hours per manager, Gap Hours, Peak Coverage Time). "Auto-Fill" button distributes managers evenly. Conflict detection (warns >50 hours/week). All localStorage persisted. Added to sidebar under Coaching.
- **Compliance Scorecard:** `/compliance-scorecard` — Per-manager compliance health scorecard. Summary KPIs (Avg Compliance Score, % Managers in Green, Most Improved, Most At-Risk). Manager scorecard cards with 5 compliance categories (TILA, ECOA, UDAP, State Law, Internal Policy). Color coding (Green ≥90, Yellow 70-89, Red <70). Compliance Trend sparkline per manager (last 8 weeks). Drill-down view (click manager → last 10 compliance events grouped by rule type). Compliance Leaderboard ranked by overall score. Risk Profile classification (Low Risk/Moderate Risk/High Risk based on scores and trend direction). Required Training auto-recommendations (score <70 → specific ASURA compliance module). Date range filter (Last 30/60/90). Added to sidebar under Admin after Compliance Audit.
- **Dark Mode Toggle:** Sun/moon icon in AppLayout sidebar footer. Tailwind dark class strategy with CSS variables. Persisted in localStorage key `fi-copilot-theme`. System preference detection via `prefers-color-scheme` media query. Dark palette: slate-900 backgrounds, slate-800 cards, slate-100 text, slate-700 borders, blue-600 accent. Recharts charts respect theme via CSS variables.
- **Test Suite:** 818/819 passing (1 pre-existing deepgram env failure — acceptable). +98 new tests in nightly-april5.test.ts covering ROI calculations, payoff tracking, schedule management, compliance scoring, dark mode.
- **TypeScript:** 0 errors

### Build 2a7d9f7 — March 31, 2026
- **Profit Analysis Dashboard:** `/profit-analysis` — Full F&I profit breakdown by product, manager, and time period. Top KPI bar (Total F&I Revenue MTD, Avg PVR front+back, Gross Profit per Deal, Product Penetration Rate). Revenue waterfall chart (recharts Bar: VSC, GAP, Tire & Wheel, Paint Protection, Maintenance Plan, Theft Deterrent, Windshield, Key Replacement contribution to total revenue). Manager profit leaderboard table (Name, Deals, Total F&I Revenue, Avg PVR, Top Product, Profit Trend sparkline). Profit vs Volume scatter plot (X = deal count, Y = total profit, bubble size = avg PVR per manager). Time period selector (MTD/QTD/YTD/Last 30/Last 90/Custom Range). "Missed Revenue" card with estimated lost revenue from declined products. CSV export. Added to sidebar under Operations.
- **Customer Journey Map:** `/customer-journey` — Visual flow of F&I customer experience. Horizontal step flow (Greeting → Needs Discovery → Menu Presentation → Product Discussion → Objection Handling → Closing → Delivery). Each step shows avg time spent, avg score, common issues/flags. Click step to expand top 3 ASURA OPS coaching tips per phase. Journey Score composite (weighted: Greeting 5%, Discovery 15%, Menu 25%, Products 25%, Objections 15%, Closing 10%, Delivery 5%). Manager comparison dropdown (side-by-side journey maps). Drop-off analysis bar chart (phase with most score degradation). Date range filter (Last 30/60/90 days). Added to sidebar under Performance.
- **Manager 1-on-1 Tracker:** `/one-on-ones` — Coaching meeting tracker for trainers and F&I managers. Meeting list view (date, manager, trainer, status Scheduled/Completed/Missed, key topics). "Schedule 1-on-1" modal (manager selector, date picker, time, topic textarea, recurring toggle weekly/biweekly/monthly). Meeting detail expand (editable agenda items, action items with assignee and due date, notes textarea, Follow Up Required checkbox). Action item tracker tab (all open items across 1-on-1s, sortable by due date and assignee). Calendar mini-view (month with dots on meeting days). Summary bar (Meetings This Month, Completion Rate, Open Action Items, Avg Duration). All localStorage persisted. New "Coaching" sidebar section created (Trainer Dashboard + Training Curriculum moved there + 1-on-1 Tracker added).
- **Compliance Audit Trail:** `/compliance-audit` — Complete audit log of compliance events across sessions. Table (Timestamp, Session ID, Manager, Rule Violated, Severity Critical/Warning/Info, Excerpt, Status Open/Resolved/Dismissed). Filters (severity, rule type TILA/ECOA/UDAP/State Law/Internal Policy, manager, date range, status). Summary cards (Total Flags 30d, Critical Count, Resolution Rate %, Avg Time to Resolve). Trend chart (recharts Area: 12 weeks stacked by severity). Resolution modal (mark resolved with required notes). CSV audit export. Click row → session detail. Added to sidebar under Admin.
- **Quick Actions Command Bar Enhancement:** Updated GlobalSearch (Cmd+K) with Quick Actions section when search is empty (Start New Session, View Analytics, Check Compliance, Open Leaderboard, Export Report, Schedule 1-on-1). Each action has icon + label + keyboard shortcut hint. Fuzzy matching for page names. Categorized search results (Pages/Sessions/Managers/Customers with headers). Recent searches in localStorage (max 5).

### Build 2e1181e — March 30, 2026
- **Multi-Location Rollup Dashboard:** `/multi-location` — Dealer group operators view. Top KPI bar, location card grid with color coding, trend arrows, sort controls, combined grade trend chart, export JSON, new "Operations" sidebar section.
- **Lender Rate Comparison Panel:** `LenderComparison.tsx` — "Lender Rates" toggle in ProductMenu. 5 lenders, rate table, credit tier selector, rate calculator, reserve spread bar chart, "Best Match" badge.
- **Shift Performance View:** `/shift-performance` — Day-of-week × shift heatmap, cell tooltips, summary bar, hourly line chart, staffing insight.
- **Training Curriculum Tracker:** `/training` — 6 ASURA OPS modules (22 lessons), progress bars, lesson checkboxes with localStorage, progress ring, assign modal.
- **Session Tags & Notes:** `SessionTags.tsx` — Tags + notes on SessionDetail, predefined + custom tags, pinned notes, localStorage persistence.

### Build 8465f4c — March 29, 2026
- F&I Scorecard PDF Export, Trainer Dashboard, Deal Timeline, Performance Benchmarking Panel, Objection Trend Tracker

### Build 46cda49 — March 28, 2026
- Deal Scoring Dashboard, Coaching Report Builder, Product Heatmap, Session Replay Timeline, Live Alerts Panel

### Build 2823d1f — March 27, 2026
- Goal Tracker, Weekly Coaching Insights, Session Export Modal, Global Search (Cmd+K), Analytics Drill-Down

### Build 5ab38e5 — March 26, 2026
- Notification Center, Leaderboard, Objection Playbook, RBAC Guards, Session History Stats, Dashboard Activity Feed

### Build 8d41db5 — March 25, 2026
- PDF/Print Report, Deal Recovery, Pipeline Diagnostics, Customer Detail, Auto Coaching Report, Bundle Analysis

### Build 0e6e6c1 — March 24, 2026
- Demo Mode, Manager Scorecard, Alert Bell, Session Comparison, Page Titles, Lazy Load Audit

### Build 9a57a4d — March 23, 2026
- Pagination, CSV Export, Mobile Responsive, Seed Data

### Build 8aa16a8 — March 22, 2026
- Federal Compliance Engine, Eagle Eye Date Range, 90-day Seed Script

## Deploy Steps

1. Pull latest from GitHub: `git pull origin main`
2. Install dependencies: `pnpm install`
3. Build: `pnpm build`
4. Start: `pnpm start`
5. Verify at: https://finico-pilot-mqskutaj.manus.space/

## Current Stats
- **Total Pages:** 39 (Dashboard, LiveSession, SessionHistory, SessionDetail, EagleEyeView, ObjectionAnalysis, AdminPanel, Analytics, BatchUpload, ComplianceRules, Customers, CustomerDetail, ProductMenu, DealRecovery, DealershipSettings, PipelineDiagnostics, ManagerScorecard, DemoMode, SessionComparison, SessionPrintReport, NotificationCenter, Leaderboard, GoalTracker, DealScoring, CoachingReportBuilder, TrainerDashboard, DealTimeline, MultiLocationRollup, ShiftPerformance, TrainingCurriculum, ProfitAnalysis, CustomerJourney, OneOnOneTracker, ComplianceAudit, ROICalculator, PayoffTracker, ManagerSchedule, ComplianceScorecard + GlobalSearch command bar)
- **Tests:** 818/819 passing (1 pre-existing deepgram env failure)
- **TypeScript:** 0 errors
- **Sidebar Sections:** Core, Performance, Coaching, Operations, Business, Admin

## Environment
- Node.js required
- pnpm for package management
- Environment variables from `.env` (see `.env.example`)
- PostgreSQL database (Drizzle ORM)
- Deepgram API key for live transcription (optional for demo mode)
