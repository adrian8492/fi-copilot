# Henry Nightly Task — April 5, 2026

## Priority: HIGH — ROI Calculator, Payoff Tracking Dashboard, Manager Availability Scheduler, Compliance Scorecard, Dark Mode Toggle, Test Coverage Expansion

## Context
Previous build (March 31) completed: Profit Analysis Dashboard, Customer Journey Map, Manager 1-on-1 Tracker, Compliance Audit Trail, Quick Actions Enhancement.
Current test state: 720/721 passing (1 pre-existing deepgram env var failure).
Git: bafea0c — docs: update nightly task completion notes and manus deploy prompt for March 31 build
TypeScript: 0 errors — clean baseline.

All pages exist: Dashboard, LiveSession, SessionHistory, SessionDetail, EagleEyeView, ObjectionAnalysis,
AdminPanel, Analytics, BatchUpload, ComplianceRules, Customers, CustomerDetail, ProductMenu,
DealRecovery, DealershipSettings, PipelineDiagnostics, ManagerScorecard, DemoMode, SessionComparison,
SessionPrintReport, NotificationCenter, Leaderboard, GoalTracker, DealScoring, CoachingReportBuilder,
TrainerDashboard, DealTimeline, MultiLocationRollup, ShiftPerformance, TrainingCurriculum,
ProfitAnalysis, CustomerJourney, OneOnOneTracker, ComplianceAudit + GlobalSearch command bar.

## Tonight's Tasks

### 1. ROI Calculator (HIGH)
New page `ROICalculator.tsx` at `/roi-calculator`:
- Help DPs and GMs see the financial impact of ASURA coaching on their F&I department
- Input panel: Current Avg PVR, Monthly Deal Volume, Number of F&I Managers, Current Product Penetration %, Monthly Coaching Investment ($)
- Output panel: Projected PVR After ASURA (use +$759 avg lift from Adrian's track record), Projected Monthly F&I Revenue Increase, Annual Revenue Increase, ROI Multiplier (revenue increase / coaching cost), Payback Period (months)
- "Before vs After" comparison cards: side-by-side showing current state vs projected ASURA state for PVR, Revenue, Penetration, Products per Deal
- Revenue projection chart (recharts Area): 12-month forecast showing revenue trajectory with and without ASURA coaching
- Sensitivity slider: allow adjusting the PVR lift assumption (±$200 from $759 baseline) to show conservative/aggressive scenarios
- "Share Report" button: copies a formatted text summary to clipboard
- Print-ready layout with window.print()
- Hard-coded demo defaults: Current PVR $1,800, 200 deals/month, 4 managers, 48% penetration, $15,000/month coaching
- Add to sidebar nav — new "Business" section at the bottom (before Admin section)
- Lazy-loaded route in App.tsx at `/roi-calculator`

### 2. Product Payoff Tracker (HIGH)
New page `PayoffTracker.tsx` at `/payoff-tracker`:
- Track and visualize product cancellation and claims data
- Top KPI bar: Total Products Sold (MTD), Cancellation Rate %, Claims Rate %, Net Retention Revenue
- Product retention table: Product Name, Units Sold, Units Cancelled, Cancel Rate %, Claims Filed, Claims Paid, Avg Claim Cost, Net Revenue After Cancellations
- Products: VSC, GAP, Tire & Wheel, Paint Protection, Maintenance Plan, Theft Deterrent, Windshield, Key Replacement
- Cancellation trend chart (recharts Line): monthly cancellation rate over 12 months, per product (toggleable lines)
- "Cancellation Window" analysis: bar chart showing cancellations by days-since-sale (0-30, 31-60, 61-90, 91-180, 180+)
- Manager cancellation comparison: table showing cancel rate per manager (some managers' product pitches create more buyer's remorse)
- "At Risk" alert cards: highlight products with rising cancellation trends (>5% increase month-over-month)
- Date range filter: MTD / Last 30 / Last 90 / YTD
- CSV export of retention data
- Hard-coded demo data: 8 products, 6 managers, 12 months of history
- Add to sidebar under Operations section
- Lazy-loaded route at `/payoff-tracker`

### 3. Manager Availability & Schedule (HIGH)
New page `ManagerSchedule.tsx` at `/schedule`:
- Weekly schedule grid for F&I manager floor coverage
- Grid layout: days of week (Mon-Sat) × time slots (9AM-8PM in 1-hour blocks)
- Each cell can be assigned a manager (click cell → dropdown of managers)
- Color-coded by manager (each manager gets a distinct color)
- "Coverage Score" per time slot: shows if understaffed (0 managers = red), adequate (1 = yellow), optimal (2+ = green)
- Weekly summary: Total Scheduled Hours per manager, Gap Hours (unstaffed slots), Peak Coverage Time
- "Auto-Fill" button: distributes managers evenly across the week based on deal volume data from ShiftPerformance (e.g., more coverage on high-volume days)
- Conflict detection: warns if a manager is double-booked or exceeds 50 hours/week
- All data persisted in localStorage
- Hard-coded demo: 4 managers, pre-filled sample schedule
- Add to sidebar under Coaching section
- Lazy-loaded route at `/schedule`

### 4. Compliance Scorecard (HIGH)
New page `ComplianceScorecard.tsx` at `/compliance-scorecard`:
- Per-manager compliance health scorecard
- Manager selector dropdown (default: show all managers in grid)
- Scorecard card per manager: Name, Overall Compliance Score (0-100), TILA Score, ECOA Score, UDAP Score, State Law Score, Internal Policy Score
- Color coding: Green ≥90, Yellow 70-89, Red <70
- "Compliance Trend" sparkline per manager (last 8 weeks)
- Drill-down view (click manager): show last 10 compliance events for that manager, grouped by rule type
- "Compliance Leaderboard" ranking: sorted by overall compliance score
- "Risk Profile" section: classify managers as Low Risk / Moderate Risk / High Risk based on score thresholds and trend direction
- "Required Training" auto-recommendations: if a manager scores <70 in a category, suggest specific ASURA compliance training module
- Summary KPIs: Avg Compliance Score (all managers), % Managers in Green, Most Improved (vs last month), Most At-Risk
- Date range filter: Last 30 / Last 60 / Last 90
- Hard-coded demo data: 6 managers, 90 days of compliance events, 5 rule categories
- Add to sidebar under Admin section (after Compliance Audit)
- Lazy-loaded route at `/compliance-scorecard`

### 5. Dark Mode / Theme Toggle (MEDIUM)
Update `AppLayout.tsx` and global styles:
- Add theme toggle button to sidebar footer (sun/moon icon)
- Implement dark mode using CSS variables and Tailwind dark class
- Toggle persisted in localStorage key `fi-copilot-theme`
- Dark palette: bg-slate-900, card bg-slate-800, text-slate-100, borders-slate-700, primary accent stays blue-600
- Ensure all existing recharts charts respect dark mode (use CSS variable for axis/label colors)
- Dashboard, Analytics, and at least 5 other pages should look clean in dark mode
- System preference detection: default to user's OS preference (`prefers-color-scheme`)

### 6. Expand Test Suite to 770+ (MEDIUM)
Add `server/nightly-april5.test.ts` with tests for:
- ROI PVR lift calculation ($759 baseline + sensitivity range)
- Monthly revenue increase formula (lift × deals)
- Annual projection (monthly × 12)
- ROI multiplier calculation (revenue increase / coaching cost)
- Payback period calculation (investment / monthly increase)
- Before vs After comparison data structure
- 12-month projection array generation (with and without coaching)
- Sensitivity slider bounds (min/max PVR lift)
- Product cancellation rate calculation (cancelled / sold × 100)
- Net retention revenue formula (sold revenue - cancelled revenue - claims paid)
- Cancellation window bucketing (5 time ranges)
- Manager cancellation comparison sorting
- At-risk product detection (>5% MoM increase)
- Product retention table data shaping (8 products)
- Schedule grid cell assignment validation (manager + day + hour)
- Coverage score calculation (0/1/2+ managers per slot)
- Weekly hours per manager summation
- Conflict detection (double-booking same hour)
- Auto-fill distribution algorithm (even spread)
- Gap hours calculation (unstaffed slots count)
- Compliance score composite calculation (5 categories weighted)
- Risk profile classification (Low/Moderate/High thresholds)
- Training recommendation generation (score <70 → specific module)
- Compliance leaderboard sorting (by overall score)
- Compliance trend direction detection (improving/declining/stable)
- Manager compliance drill-down event grouping
- Dark mode theme toggle state persistence
- Theme CSS variable mapping (light → dark values)
- System preference detection logic
Target: 770+ tests passing (up from 720)

## Technical Notes
- No build step for dev — Vite dev server, vanilla tRPC
- Tests: pnpm test (target: 770+/771+)
- TypeScript: pnpm check (target: 0 errors)
- The 1 deepgram.test.ts failure is pre-existing and acceptable
- Use recharts for all charts (already installed)
- New pages must be lazy-loaded in App.tsx with React.Suspense
- New pages use existing AppLayout sidebar
- ROI Calculator goes in new "Business" sidebar section (between Operations and Admin)
- Payoff Tracker goes under Operations section
- Manager Schedule goes under Coaching section
- Compliance Scorecard goes under Admin section (after Compliance Audit)
- All new pages use hard-coded demo data (no backend mutations needed)
- Manager Schedule uses localStorage for schedule persistence
- Dark mode uses Tailwind `dark:` class strategy + CSS variables
- ROI default PVR lift = $759 (Adrian's real track record — from USER.md)
- $200M+ F&I revenue generated for clients — use this in ROI Calculator hero text

## Definition of Done
- [ ] ROI Calculator at /roi-calculator with input panel, before/after cards, revenue projection chart, sensitivity slider
- [ ] Product Payoff Tracker at /payoff-tracker with retention table, cancellation trends, at-risk alerts
- [ ] Manager Schedule at /schedule with weekly grid, coverage scoring, auto-fill, conflict detection
- [ ] Compliance Scorecard at /compliance-scorecard with per-manager scores, risk profiles, training recommendations
- [ ] Dark mode toggle in sidebar with localStorage persistence and system preference detection
- [ ] 770+ tests passing
- [ ] 0 TypeScript errors
- [ ] Git commit + push

## When Done
1. Git add, commit: "feat: ROI calculator, payoff tracker, manager schedule, compliance scorecard, dark mode"
2. Push to origin main
3. Update this file with completion notes
4. Write/update manus-deploy-prompt.md
