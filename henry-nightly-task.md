# Henry Nightly Task — March 31, 2026

## Priority: HIGH — Profit Analysis Dashboard, Customer Journey Map, Manager 1-on-1 Tracker, Compliance Audit Log, Dark/Light Theme Polish, Test Coverage Expansion

## Context
Previous build (March 30) completed: Multi-Location Rollup, Lender Rate Comparison, Shift Performance View, Training Curriculum Tracker, Session Tags & Notes.
Current test state: 645/646 passing (1 pre-existing deepgram env var failure).
Git: e308244 — docs: update manus deploy prompt for March 30 build
TypeScript: 0 errors — clean baseline.

All pages exist: Dashboard, LiveSession, SessionHistory, SessionDetail, EagleEyeView, ObjectionAnalysis,
AdminPanel, Analytics, BatchUpload, ComplianceRules, Customers, CustomerDetail, ProductMenu,
DealRecovery, DealershipSettings, PipelineDiagnostics, ManagerScorecard, DemoMode, SessionComparison,
SessionPrintReport, NotificationCenter, Leaderboard, GoalTracker, DealScoring, CoachingReportBuilder,
TrainerDashboard, DealTimeline, MultiLocationRollup, ShiftPerformance, TrainingCurriculum.

## Tonight's Tasks

### 1. Profit Analysis Dashboard (HIGH)
New page `ProfitAnalysis.tsx` at `/profit-analysis`:
- F&I profit breakdown by product, manager, and time period
- Top KPI bar: Total F&I Revenue (MTD), Avg PVR (front + back), Gross Profit per Deal, Product Penetration Rate
- Revenue waterfall chart (recharts Bar): show contribution of each F&I product to total revenue (VSC, GAP, Tire & Wheel, Paint Protection, Maintenance Plan, Theft Deterrent, Windshield, Key Replacement)
- Manager profit leaderboard table: Name, Deals, Total F&I Revenue, Avg PVR, Top Product, Profit Trend (sparkline)
- Profit vs Volume scatter plot: X = deal count, Y = total profit, bubble size = avg PVR per manager
- Time period selector: MTD / QTD / YTD / Last 30 / Last 90 / Custom Range
- "Missed Revenue" card: estimate of lost revenue from declined products (deals × avg acceptance rate gap × avg product price)
- Export profit summary as CSV
- Hard-coded demo data: 6 managers, 8 products, 90 days of deal history
- Add to sidebar nav under "Operations" section
- Lazy-loaded route in App.tsx at `/profit-analysis`

### 2. Customer Journey Map (HIGH)
New page `CustomerJourney.tsx` at `/customer-journey`:
- Visual flow of the F&I customer experience from entry to delivery
- Horizontal step flow (styled divs, not recharts): Greeting → Needs Discovery → Menu Presentation → Product Discussion → Objection Handling → Closing → Delivery
- Each step shows: avg time spent (minutes), avg score for that phase, common issues/flags
- Click step → expands to show top 3 coaching tips for that phase from ASURA OPS
- "Journey Score" composite: weighted average across all phases (Greeting 5%, Discovery 15%, Menu 25%, Products 25%, Objections 15%, Closing 10%, Delivery 5%)
- Manager comparison: dropdown to compare two managers' journey maps side-by-side
- "Drop-off Analysis" section: bar chart showing which phase has the most score degradation
- Date range filter: Last 30 / Last 60 / Last 90 days
- Hard-coded demo journey data keyed per manager
- Add to sidebar nav under "Performance" section (after Training Curriculum)
- Lazy-loaded route at `/customer-journey`

### 3. Manager 1-on-1 Tracker (HIGH)
New page `OneOnOneTracker.tsx` at `/one-on-ones`:
- Track coaching 1-on-1 meetings between trainers and F&I managers
- Meeting list view: date, manager name, trainer name, status (Scheduled / Completed / Missed), key topics
- "Schedule 1-on-1" button: opens modal with manager selector, date picker, time, topic textarea, recurring toggle (weekly/biweekly/monthly)
- Meeting detail view (click row → expand): agenda items (editable text list), action items with assignee and due date, notes textarea, "Follow Up Required" checkbox
- Action item tracker: separate tab showing all open action items across all 1-on-1s, sortable by due date and assignee
- Calendar mini-view: month calendar with dots on days that have 1-on-1s scheduled
- All data persisted in localStorage
- Hard-coded demo: 4 managers, 8 past meetings, 3 upcoming
- Status summary bar: Meetings This Month, Completion Rate, Open Action Items, Avg Meeting Duration
- Add to sidebar nav under "Coaching" section (create new section between Performance and Operations, move Trainer Dashboard and Training Curriculum here too)
- Lazy-loaded route at `/one-on-ones`

### 4. Compliance Audit Trail (HIGH)
New page `ComplianceAudit.tsx` at `/compliance-audit`:
- Complete audit log of all compliance events across sessions
- Table columns: Timestamp, Session ID, Manager, Rule Violated, Severity (Critical/Warning/Info), Excerpt, Status (Open/Resolved/Dismissed)
- Filters: severity level, rule type (TILA, ECOA, UDAP, State Law, Internal Policy), manager, date range, status
- Summary cards: Total Flags (30d), Critical Count, Resolution Rate %, Avg Time to Resolve
- Trend chart (recharts Area): compliance flags per week over last 12 weeks, stacked by severity
- "Export Audit" button: downloads CSV of all filtered flags
- Click row → links to session detail page for context
- "Resolution Modal": on each row, button to mark as Resolved with resolution notes
- Hard-coded demo data: 50 compliance events across 20 sessions, 5 managers, mix of severities
- Add to sidebar nav under "Admin" section (after Compliance Rules)
- Lazy-loaded route at `/compliance-audit`

### 5. Quick Actions Command Bar Enhancement (MEDIUM)
Update `GlobalSearch.tsx`:
- Add "Quick Actions" section below search results when search is empty
- Quick actions list: Start New Session, View Analytics, Check Compliance, Open Leaderboard, Export Report, Schedule 1-on-1
- Each action has icon + label + keyboard shortcut hint
- Actions navigate directly to the target page
- Recent searches persist in localStorage (max 5)
- Search result categories: Pages, Sessions, Managers, Customers (visually separated with headers)
- Add fuzzy matching for page names (e.g., "profit" matches "Profit Analysis")

### 6. Expand Test Suite to 690+ (MEDIUM)
Add `server/nightly-march31.test.ts` with tests for:
- Profit analysis revenue waterfall calculation (8 products, sum = total revenue)
- Manager profit leaderboard sorting (by revenue, by PVR, by deal count)
- Avg PVR calculation (total F&I revenue / total deals)
- Missed revenue estimation formula (gap × price × deal count)
- Product penetration rate calculation (accepted / offered × 100)
- Profit vs volume data shaping (manager → {deals, profit, avgPVR})
- Customer journey phase scoring (7 phases, weighted composite)
- Journey score weighted average calculation (weights sum to 100%)
- Drop-off analysis detection (phase with largest score decrease)
- Manager journey comparison data structure (two managers side-by-side)
- Phase coaching tips lookup (3 tips per phase, 7 phases)
- One-on-one meeting status transitions (Scheduled → Completed/Missed)
- Meeting scheduling validation (future date required, manager required)
- Action item status tracking (open/completed states)
- Recurring meeting generation (weekly = 7 days, biweekly = 14, monthly = 30)
- Meeting completion rate calculation (completed / (completed + missed) × 100)
- Calendar dot computation (meetings grouped by date)
- Compliance audit severity counts (critical/warning/info grouping)
- Resolution rate calculation (resolved / total × 100)
- Compliance flag filtering (multi-criteria: severity + rule + manager + date + status)
- Compliance trend data shaping (12-week buckets, stacked by severity)
- Resolution modal validation (notes required for resolution)
- Audit CSV export column structure (7 required columns)
- Quick action navigation mapping (6 actions → 6 routes)
- Fuzzy page name matching (partial string matches)
- Recent search localStorage persistence (max 5, FIFO eviction)
- Search result category grouping (4 categories: Pages/Sessions/Managers/Customers)
Target: 690+ tests passing (up from 645)

## Technical Notes
- No build step for dev — Vite dev server, vanilla tRPC
- Tests: pnpm test (target: 690+/691)
- TypeScript: pnpm check (target: 0 errors)
- The 1 deepgram.test.ts failure is pre-existing and acceptable
- Use recharts for all charts (already installed)
- New pages must be lazy-loaded in App.tsx with React.Suspense
- New pages use existing AppLayout sidebar
- Create "Coaching" nav section in AppLayout: move Trainer Dashboard, Training Curriculum from Performance, add 1-on-1 Tracker
- Profit Analysis goes under Operations section
- Customer Journey goes under Performance section
- Compliance Audit goes under Admin section
- All new pages use hard-coded demo data (no backend mutations needed)
- 1-on-1 Tracker uses localStorage for meeting/action item persistence
- Quick Actions enhancement updates existing GlobalSearch.tsx component

## Definition of Done
- [x] Profit Analysis at /profit-analysis with waterfall chart, manager leaderboard, scatter plot, missed revenue card
- [x] Customer Journey at /customer-journey with step flow, journey score, manager comparison, drop-off analysis
- [x] Manager 1-on-1 Tracker at /one-on-ones with meeting list, scheduler modal, action items, calendar mini-view
- [x] Compliance Audit at /compliance-audit with audit table, filters, trend chart, resolution modal
- [x] Quick Actions enhancement in GlobalSearch with actions, fuzzy matching, categorized results
- [x] 720/721 tests passing (exceeded 690+ target by 30)
- [x] 0 TypeScript errors
- [x] Git commit + push (2a7d9f7)

## When Done
1. Git add, commit: "feat: profit analysis, customer journey map, 1-on-1 tracker, compliance audit trail, quick actions"
2. Push to origin main
3. Update this file with completion notes
4. Write/update manus-deploy-prompt.md

---

## Prior Completion Notes

### March 31, 2026

**Completed by:** Henry (Claude Code) — 2026-03-31 ~22:10 PST

All March 31 tasks completed:
- **Profit Analysis Dashboard**: `ProfitAnalysis.tsx` at `/profit-analysis` (325 lines) — top KPI bar (Total F&I Revenue MTD, Avg PVR, Gross Profit per Deal, Product Penetration Rate), revenue waterfall chart (recharts Bar: VSC, GAP, Tire & Wheel, Paint Protection, Maintenance Plan, Theft Deterrent, Windshield, Key Replacement), manager profit leaderboard table (Name, Deals, Total F&I Revenue, Avg PVR, Top Product, Profit Trend sparkline), profit vs volume scatter plot (X = deal count, Y = total profit, bubble size = avg PVR), time period selector (MTD/QTD/YTD/Last 30/Last 90/Custom Range), "Missed Revenue" card with estimated lost revenue calculation, CSV export. Added to sidebar under Operations.
- **Customer Journey Map**: `CustomerJourney.tsx` at `/customer-journey` (365 lines) — horizontal step flow (Greeting → Needs Discovery → Menu Presentation → Product Discussion → Objection Handling → Closing → Delivery), each step shows avg time/score/common issues, click-to-expand coaching tips from ASURA OPS per phase, Journey Score composite (weighted: Greeting 5%, Discovery 15%, Menu 25%, Products 25%, Objections 15%, Closing 10%, Delivery 5%), manager comparison dropdown (side-by-side), drop-off analysis bar chart, date range filter (Last 30/60/90). Added to sidebar under Performance.
- **Manager 1-on-1 Tracker**: `OneOnOneTracker.tsx` at `/one-on-ones` (443 lines) — meeting list view (date, manager, trainer, status, topics), "Schedule 1-on-1" modal (manager selector, date picker, time, topic textarea, recurring toggle), meeting detail expand (agenda items, action items with assignee/due date, notes, follow-up checkbox), action item tracker tab (all open items, sortable), calendar mini-view (month with dots on meeting days), summary bar (Meetings This Month, Completion Rate, Open Action Items, Avg Duration), all localStorage persisted. Created new "Coaching" sidebar section (moved Trainer Dashboard + Training Curriculum there, added 1-on-1 Tracker).
- **Compliance Audit Trail**: `ComplianceAudit.tsx` at `/compliance-audit` (324 lines) — audit log table (Timestamp, Session ID, Manager, Rule Violated, Severity, Excerpt, Status), filters (severity, rule type TILA/ECOA/UDAP/State Law/Internal Policy, manager, date range, status), summary cards (Total Flags 30d, Critical Count, Resolution Rate %, Avg Time to Resolve), trend chart (recharts Area: 12 weeks stacked by severity), resolution modal (mark resolved with notes), CSV export, click row → session detail. Added to sidebar under Admin.
- **Quick Actions Enhancement**: Updated `GlobalSearch.tsx` (469 lines) — quick actions section when search empty (Start New Session, View Analytics, Check Compliance, Open Leaderboard, Export Report, Schedule 1-on-1) with icons + keyboard shortcut hints, fuzzy matching for page names, categorized search results (Pages/Sessions/Managers/Customers), recent searches in localStorage (max 5).
- **75 new tests** in `server/nightly-march31.test.ts` (780 lines) covering profit analysis revenue waterfall calculation, manager profit leaderboard sorting, avg PVR calculation, missed revenue estimation, product penetration rate, profit vs volume data shaping, customer journey phase scoring, journey score weighted average, drop-off analysis detection, manager journey comparison, phase coaching tips lookup, 1-on-1 meeting status transitions, scheduling validation, action item tracking, recurring meeting generation, completion rate calculation, calendar dot computation, compliance audit severity counts, resolution rate, multi-criteria filtering, compliance trend shaping, resolution modal validation, CSV export structure, quick action navigation mapping, fuzzy matching, recent search persistence, search result categorization.
- **720/721 tests passing** (1 pre-existing deepgram failure) — exceeded 690+ target by 30
- `pnpm check`: 0 TypeScript errors
- Git: `2a7d9f7` — feat: profit analysis, customer journey map, 1-on-1 tracker, compliance audit trail, quick actions

**Total codebase growth:** +2,635 lines across 9 files

**Current page count:** 35 pages (Dashboard, LiveSession, SessionHistory, SessionDetail, EagleEyeView, ObjectionAnalysis, AdminPanel, Analytics, BatchUpload, ComplianceRules, Customers, CustomerDetail, ProductMenu, DealRecovery, DealershipSettings, PipelineDiagnostics, ManagerScorecard, DemoMode, SessionComparison, SessionPrintReport, NotificationCenter, Leaderboard, GoalTracker, DealScoring, CoachingReportBuilder, TrainerDashboard, DealTimeline, MultiLocationRollup, ShiftPerformance, TrainingCurriculum, ProfitAnalysis, CustomerJourney, OneOnOneTracker, ComplianceAudit + GlobalSearch command bar)

### March 30, 2026

**Completed by:** Henry (Claude Code) — 2026-03-30 ~22:12 PST

All March 30 tasks completed:
- **Multi-Location Rollup Dashboard**: `MultiLocationRollup.tsx` at `/multi-location` — top KPI bar (Total Locations, Combined PVR, Best/Lowest Performing), location card grid with color coding (green ≥80, yellow 60–79, red <60), trend arrows, sort controls (Score/Alphabetical/PVR/Most Improved), click card → `/settings`, combined grade trend chart (recharts Line, all locations overlaid, 12 weeks), "Export Rollup" JSON download. Added to sidebar under new "Operations" section.
- **Lender Rate Comparison Panel**: `LenderComparison.tsx` — accessible from ProductMenu as "Lender Rates" toggle. 5 lenders (Capital One Auto, Ally Financial, Chase Auto, Wells Fargo Dealer, US Bank DFS), rate table with color-coded best/worst rates, credit tier selector (Tier 1–4), rate calculator (amount + term → estimated monthly payment per lender), reserve spread bar chart, "Best Match" highlight badge.
- **Shift Performance View**: `ShiftPerformance.tsx` at `/shift-performance` — heatmap grid (Mon–Sat × Morning/Afternoon/Evening), cell color by avg score (green/yellow/red), cell tooltip with score/deals/PVR, summary bar (Best/Worst Performing, Peak Volume), hourly line chart (score by hour 0–23), staffing insight callout, date range filter. Added to sidebar under Performance.
- **Training Curriculum Tracker**: `TrainingCurriculum.tsx` at `/training` — 6 modules (22 lessons total), module cards with progress bars and status badges (Not Started/In Progress/Completed), expandable lesson checkboxes (localStorage persistence), overall progress ring, "Assign Training" modal, completion celebration card. Added to sidebar under Performance.
- **Session Tags & Notes**: `SessionTags.tsx` — displayed on SessionDetail below grade section. 6 predefined tags (Hot Lead, Follow Up, Coaching Moment, Great Close, Compliance Issue, Escalation) + custom tags, colored badges, click to remove, notes textarea, pinned notes with star, all localStorage-persisted by session ID.
- **66 new tests** in `server/nightly-march30.test.ts` covering multi-location rollup KPIs (weighted PVR, best/lowest detection), location card color tiers, location sort logic (4 modes), lender data structure validation, rate calculator payment formula, best match detection, credit tier thresholds, shift heatmap data shaping, peak shift detection, hour-of-day aggregation, staffing insight generation, training curriculum structure (6 modules, 22 lessons), module completion percentage, overall progress calculation, lesson toggle logic, session tag operations, tag persistence key format, pinned notes logic, tag filter matching, tag count badge calculation.
- **645/646 tests passing** (1 pre-existing deepgram failure)
- `pnpm check`: 0 TypeScript errors

### March 29, 2026

**Completed by:** Henry (Claude Code) — 2026-03-29 ~22:12 PST

All March 29 tasks completed:
- **F&I Scorecard PDF Export**: `ScorecardPDFExport.tsx` — print-optimized full-page PDF layout with score gauge (SVG ring), 5 subscore bars, two-column strengths/improvements, grade trend sparkline, key metrics (sessions/PVR/penetration), ASURA OPS branding footer. Print CSS with `@media print` hides rest of app. "Export Scorecard PDF" button wired into ManagerScorecard.tsx next to existing Export button.
- **Trainer Dashboard**: `TrainerDashboard.tsx` at `/trainer` — top KPI bar (Total Managers, Avg Score, Most Improved, Most At-Risk), manager card grid with color coding (green ≥80, yellow 60–79, red <60), trend arrows, PVR/compliance metrics, 4-week sparkline. Sort controls (Score/A-Z/Most Improved/At-Risk), dealership filter dropdown. "View Full Scorecard" link per card → `/scorecard?id=X`. "Send Coaching Note" button opens modal with textarea and send (client-side success toast). Added to sidebar nav.
- **Deal Timeline**: `DealTimeline.tsx` at `/deal-timeline` — chronological timeline grouped by week (collapsible sections), deal entries showing date, customer, manager, score badge, product badges, PVR. Filters: score tier (All/Green/Yellow/Red), manager, dealership. Summary strip: Deals This Week, Avg Deal Score, Best PVR, Total Revenue. "Export Timeline" downloads JSON. Click deal → `/session/:id`. Added to sidebar nav.
- **Performance Benchmarking Panel**: `BenchmarkingPanel.tsx` — accessible from Analytics "Benchmarking" tab. Grouped horizontal bar chart (recharts) comparing manager vs dealership avg vs national benchmark for 5 metrics (Score, PVR, Penetration, Compliance, Script Fidelity). Gap analysis table with status (Above/Below/On Par). "Areas to Close" section with 2–3 auto-generated coaching actions. Manager selector dropdown. National benchmark: Avg Score 74, PVR $2,850, Penetration 61%. Top 10%: Score 91, PVR $3,900, Penetration 78%.
- **Objection Trend Tracker**: `ObjectionTrendTracker.tsx` — accessible from ObjectionAnalysis "Trends" tab. Line chart (recharts): 8-week objection frequency, one line per type (Price/Payment, Rate, Trade Value, Not Needed, Think About It). "Fastest Growing" and "Trending Down" badges. Week-over-week comparison table with delta % and trend arrows. Focus Area callout card with ASURA word track for top objection.
- **52 new tests** in `server/nightly-march29.test.ts` covering scorecard PDF data formatting (subscores, strengths/improvements ordering), trainer dashboard KPI calculations (avg score, most improved, most at-risk), color tier thresholds (green/yellow/red), deal timeline week grouping (ISO week boundaries), deal filtering (score tier, manager, dealership, combined), timeline summary (avg score, total PVR, best PVR), benchmarking gap calculation (absolute, percentage), gap status logic (Above/Below/On Par), coaching action generation (below-only, 3 max), objection trend data shaping (8×5 matrix), fastest growing detection (largest positive delta), trending down detection (largest negative delta), word track lookup (all 5 types).
- **579/580 tests passing** (1 pre-existing deepgram failure)
- `pnpm check`: 0 TypeScript errors

### March 28, 2026

**Completed by:** Henry (Claude Code) — 2026-03-28 ~22:48 PST

All March 28 tasks completed:
- **Deal Scoring Dashboard**: `DealScoring.tsx` at `/deal-scoring` — composite deal score (PVR 40%, Penetration 30%, Compliance 20%, Customer Sentiment 10%), sortable table with tier filter (All/Green/Yellow/Red), KPI summary bar (Avg Deal Score, % Green Deals, Total PVR, Best Deal Score). Added to sidebar nav.
- **Coaching Report Builder**: `CoachingReportBuilder.tsx` at `/coaching-report` — manager selector, date range (Last 30 / Last 90 / Custom), 6 toggleable report sections (Performance Summary, Strength/Weakness Breakdown, Objection Patterns, Deal-by-Deal Table, Checklist Compliance, Coaching Recommendations), styled report preview below form, `window.print()` PDF download. Added to sidebar nav.
- **Product Performance Heatmap**: `ProductHeatmap.tsx` — recharts heatmap grid (F&I products × days of week), color intensity by acceptance rate, hover tooltips with exact % and deal count. Added as "Product Heatmap" tab in Analytics.tsx and collapsible section in ProductMenu.tsx.
- **Session Replay Timeline**: `SessionReplayTimeline.tsx` — horizontal visual timeline with colored event markers (compliance=red, objections=orange, product mentions=blue, checklist=green), click-to-scroll transcript, session arc grade display (first/middle/last third). Added as "Replay Timeline" tab in SessionDetail.tsx.
- **Real-Time Alerts Panel**: `LiveAlertsPanel.tsx` — collapsible right panel in LiveSession.tsx, accumulates compliance warnings, low-score moments, objection detected, and missed product alerts, dismiss per alert + "Dismiss All", toggle button in LiveSession header.
- **48 new tests** in `server/nightly-march28.test.ts`
- **527/528 tests passing** (1 pre-existing deepgram failure)

### March 27, 2026

**Completed by:** Henry (Claude Code) — 2026-03-27 ~22:10 PST

All March 27 tasks completed:
- **Goal Tracker**: `GoalTracker.tsx` at `/goals` — monthly goals with progress bars, gap text, default demo goals.
- **Weekly Coaching Insights**: `WeeklyCoachingInsights.tsx` — best/weakest area, grade trend, streak counter.
- **Session Export Modal**: `SessionExportModal.tsx` — CSV/JSON format, scope selector, field checkboxes, progress indicator.
- **Global Search (Cmd+K)**: `GlobalSearch.tsx` — command palette, tRPC search, keyboard nav, recent searches.
- **Analytics Drill-Down**: Dealership selector, MoM delta indicators, Net Revenue Estimate panel.
- **34 new tests** — 479/480 passing

### March 26, 2026
- Notification Center, Leaderboard, Objection Playbook, RBAC Guards, Session History Stats Bar, Dashboard Activity Feed — 445/446 passing

### March 25, 2026
- PDF/Print Report, Deal Recovery Analytics, Pipeline Diagnostics, Customer Detail, Auto Coaching Report, Bundle Analysis — 411/412 passing

### March 24, 2026
- Demo Mode, Manager Scorecard, Alert Bell, Session Comparison, document.title, Lazy Load Audit — 382/383 passing

### March 23, 2026
- Pagination, CSV Export, Mobile Responsive, Seed Data — 367/368 passing

### March 22, 2026
- Federal Compliance Engine, Eagle Eye Date Range, 90-day Seed Script — 348/349 passing
