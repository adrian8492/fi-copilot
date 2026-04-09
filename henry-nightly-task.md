# Henry Nightly Task — April 6, 2026

## Priority: HIGH — Lender Matrix Dashboard, Deal Jacket Viewer, Weekend Recap Report, Commission Calculator, Mobile Bottom Nav, Test Coverage Expansion

## Context
Previous build (April 5) completed: ROI Calculator, Product Payoff Tracker, Manager Schedule, Compliance Scorecard, Dark Mode Toggle.
Current test state: 818/819 passing (1 pre-existing deepgram env var failure).
Git: 8211772 — docs: update manus deploy prompt and nightly task for April 5 build
TypeScript: 0 errors — clean baseline.

All pages exist: Dashboard, LiveSession, SessionHistory, SessionDetail, EagleEyeView, ObjectionAnalysis,
AdminPanel, Analytics, BatchUpload, ComplianceRules, Customers, CustomerDetail, ProductMenu,
DealRecovery, DealershipSettings, PipelineDiagnostics, ManagerScorecard, DemoMode, SessionComparison,
SessionPrintReport, NotificationCenter, Leaderboard, GoalTracker, DealScoring, CoachingReportBuilder,
TrainerDashboard, DealTimeline, MultiLocationRollup, ShiftPerformance, TrainingCurriculum,
ProfitAnalysis, CustomerJourney, OneOnOneTracker, ComplianceAudit, ROICalculator, PayoffTracker,
ManagerSchedule, ComplianceScorecard + GlobalSearch command bar + Dark Mode toggle.

## Tonight's Tasks

### 1. Lender Matrix Dashboard (HIGH)
New page `LenderMatrix.tsx` at `/lender-matrix`:
- Comprehensive lender rate and approval matrix for F&I managers to maximize deal structure
- Top KPI bar: Avg Buy Rate (across all lenders), Avg Sell Rate, Avg Reserve Spread, Approval Rate %, Avg Funding Time (days)
- Lender comparison table: Lender Name, Credit Tier Range (Super Prime/Prime/Near Prime/Sub Prime/Deep Sub), Buy Rate %, Sell Rate Cap %, Max Reserve bps, Flat Fee Option ($), Max Term (months), Avg Approval Time (hours), Approval Rate %, YTD Volume ($), Status (Active/Preferred/Inactive)
- Lenders: Ally Financial, Capital One, Chase Auto, Wells Fargo, US Bank, Westlake Financial, Credit Acceptance, TD Auto Finance, Bank of America, Regional Credit Union (10 lenders)
- Rate spread visualization: recharts Bar chart showing buy rate vs sell rate per lender (grouped bars), color-coded by credit tier (filter dropdown)
- "Best Lender Finder" tool: Select credit score range + deal amount + term → shows ranked lender recommendations sorted by total reserve opportunity
- Funding speed chart: recharts horizontal BarChart — avg days from contract to funding per lender
- "Reserve Opportunity" heatmap: credit tier (rows) × lender (columns), cell color = max reserve bps (green = high, red = low)
- Date range filter: Last 30 / Last 90 / YTD
- Hard-coded demo data: 10 lenders, 5 credit tiers, 12 months of volume history
- Add to sidebar under Operations section (after Payoff Tracker)
- Lazy-loaded route at `/lender-matrix`

### 2. Deal Jacket Viewer (HIGH)
New page `DealJacket.tsx` at `/deal-jacket`:
- Digital deal jacket aggregating all documents and data for a single deal in one view
- Deal selector: searchable dropdown of recent deals (last 30 days, show customer name + deal date + vehicle)
- Deal summary header: Customer Name, Vehicle (Year Make Model), Deal Date, F&I Manager, Deal Type (Finance/Lease/Cash), Sale Price, Amount Financed, Rate, Term, Monthly Payment, Lender
- Document checklist card: list of required documents with status (✅ Complete / ⏳ Pending / ❌ Missing)
  - Documents: Credit Application, Menu Presentation, Product Disclosure Forms (per product), Rate Markup Disclosure, Privacy Notice, Arbitration Agreement, GAP Waiver (if GAP sold), Warranty Contract, Adverse Action Notice (if applicable)
- Product summary card: all products sold in this deal — Product Name, Price, Cost, Gross Profit, Penetration Flag (first-time buyer for this product?)
- Compliance check card: shows any compliance flags triggered during this deal's session (linked to ComplianceAudit data)
- Deal financials breakdown: stacked bar showing Front Gross + Back Gross + Total Gross
- "Deal Score" badge: pull ASURA OPS score for this deal's session (link to session detail)
- Timeline: chronological events (deal opened, credit pulled, menu presented, products selected, contracts signed, funded)
- Print/PDF button: print-ready deal jacket summary
- Hard-coded demo data: 15 recent deals with full detail
- Add to sidebar under main nav section (after Product Menu)
- Lazy-loaded route at `/deal-jacket`

### 3. Weekend Recap Report (HIGH)
New page `WeekendRecap.tsx` at `/weekend-recap`:
- Automated weekly performance summary — designed for Monday morning review
- Report period selector: This Week / Last Week / Custom Date Range
- Executive Summary card: Total Deals, Total F&I Revenue, Avg PVR, PVR vs Prior Week (delta arrow), Product Penetration %, Top Performing Manager, Biggest Win (highest single-deal PVR)
- "Manager Scoreboard" table: Manager Name, Deals, F&I Revenue, Avg PVR, Product Penetration %, Compliance Score, Coaching Score, Rank (1-N, with medal emoji for top 3)
- Product performance breakdown: BarChart showing units sold per product this week vs last week (grouped bars)
- "Wins & Opportunities" section:
  - Wins: Top 3 deals by PVR (customer name, vehicle, PVR, products sold)
  - Opportunities: Bottom 3 deals by PVR (what was missed — products declined, low score areas)
- Day-by-day trend: LineChart showing daily PVR average across the week (Mon-Sat)
- Coaching focus areas: AI-generated suggestions based on week's data (e.g., "GAP penetration dropped 8% — review objection handling" or "Thursday PVR spiked — replicate that energy")
- "Share with GM" button: copies formatted text summary to clipboard
- Print-ready layout with window.print()
- Hard-coded demo data: 2 weeks of daily deals, 6 managers, all products
- Add to sidebar under Performance section (after Customer Journey)
- Lazy-loaded route at `/weekend-recap`

### 4. Commission Calculator (HIGH)
New page `CommissionCalculator.tsx` at `/commission-calculator`:
- Help F&I managers estimate their monthly commission based on production
- Input panel: Base Pay ($), Commission Rate on Back Gross (%), Flat per Product ($), Monthly Deal Count, Avg Back Gross per Deal ($), Bonus Threshold (deals), Bonus Amount ($)
- Output panel: Estimated Base Pay, Estimated Back Gross Commission, Estimated Per-Product Commission, Bonus (if threshold met), Total Estimated Monthly Comp, Annualized Comp
- "What-If" scenario cards: Show 3 scenarios side-by-side:
  - Current Pace: based on entered values
  - With ASURA Coaching: +$759 PVR lift applied to back gross, +12% more products per deal
  - Top 1%: benchmark target ($2,500+ PVR, 65%+ penetration)
- Monthly projection chart: recharts Area showing 12-month cumulative earnings trajectory for all 3 scenarios
- "Income vs PVR" slider: adjust PVR from $800 to $3,000 and see real-time comp impact
- Pay plan presets dropdown: "Standard F&I Plan", "Flat Rate Plan", "Tiered Bonus Plan" — each pre-fills different commission structures
- YTD tracker: input actual monthly earnings (localStorage persisted), show progress chart vs annual target
- Print/share summary
- Hard-coded demo defaults: $4,000 base, 15% commission, $25/product, 150 deals, $1,800 avg back gross, 120 deal bonus threshold, $2,000 bonus
- Add to sidebar under Business section (after ROI Calculator)
- Lazy-loaded route at `/commission-calculator`

### 5. Mobile Bottom Navigation Bar (MEDIUM)
Update `AppLayout.tsx`:
- Detect screen size with existing `useMobile` hook
- On mobile (< 768px), render a fixed bottom navigation bar instead of sidebar
- Bottom nav items: Dashboard (home icon), Live Session (mic icon), History (clock icon), Analytics (chart icon), More (menu icon)
- "More" opens a slide-up drawer/modal with categorized links to all other pages
- Active state: filled icon + label text + primary color underline
- Tab bar styling: bg-card, border-t, h-16, safe-area-inset-bottom padding for iOS
- Bottom nav respects dark mode
- Sidebar still renders on desktop (≥768px) — no change to desktop layout
- All existing mobile hamburger menu behavior preserved as fallback

### 6. Expand Test Suite to 870+ (MEDIUM)
Add `server/nightly-april6.test.ts` with tests for:
- Lender buy rate vs sell rate spread calculation
- Reserve opportunity calculation (sell rate - buy rate) × amount financed
- Best lender ranking algorithm (sort by total reserve for given credit/amount/term)
- Credit tier classification from score ranges (Super Prime 780+, Prime 720-779, Near Prime 660-719, Sub Prime 580-659, Deep Sub <580)
- Funding speed average calculation per lender
- Rate cap compliance check (sell rate ≤ cap)
- Lender approval rate calculation (approved / submitted × 100)
- Deal jacket document checklist completion percentage
- Product gross profit calculation per deal (price - cost)
- Deal total gross computation (front + back)
- Compliance flag aggregation per deal
- Deal timeline event ordering (chronological sort)
- Weekend recap PVR delta calculation (this week vs last)
- Manager scoreboard ranking (by avg PVR)
- Product week-over-week unit comparison
- Top/bottom deal identification by PVR
- Day-by-day PVR average calculation
- Coaching focus area generation (identify lowest metric)
- Commission calculation: base + (back gross × rate) + (products × flat) + bonus
- Commission bonus threshold check (deals ≥ threshold)
- ASURA coaching scenario: apply $759 lift + 12% product increase to commission
- Top 1% benchmark scenario calculation ($2,500 PVR, 65% penetration)
- 12-month cumulative earnings projection
- Income vs PVR slider linear interpolation
- Pay plan preset data structure validation
- YTD earnings progress percentage
- Mobile breakpoint detection (< 768px)
- Bottom nav item count (5 items)
- "More" drawer page categorization (Performance, Coaching, Operations, Business, Admin)
Target: 870+ tests passing (up from 818)

## Technical Notes
- No build step for dev — Vite dev server, vanilla tRPC
- Tests: pnpm test (target: 870+/871+)
- TypeScript: pnpm check (target: 0 errors)
- The 1 deepgram.test.ts failure is pre-existing and acceptable
- Use recharts for all charts (already installed)
- New pages must be lazy-loaded in App.tsx with React.Suspense
- New pages use existing AppLayout sidebar
- Lender Matrix goes under Operations section (after Payoff Tracker)
- Deal Jacket goes under main nav section (after Product Menu)
- Weekend Recap goes under Performance section (after Customer Journey)
- Commission Calculator goes under Business section (after ROI Calculator)
- All new pages use hard-coded demo data (no backend mutations needed)
- Commission Calculator YTD tracker uses localStorage for persistence
- Mobile bottom nav uses existing useMobile hook
- Credit tiers: Super Prime (780+), Prime (720-779), Near Prime (660-719), Sub Prime (580-659), Deep Sub (<580)
- ASURA coaching lift = $759 PVR (Adrian's real track record)
- Commission demo defaults reflect realistic F&I pay plans

## Definition of Done
- [x] Lender Matrix at /lender-matrix with comparison table, rate spread chart, best lender finder, reserve heatmap
- [x] Deal Jacket at /deal-jacket with document checklist, product summary, compliance check, deal timeline
- [x] Weekend Recap at /weekend-recap with executive summary, manager scoreboard, wins/opportunities, coaching focus
- [x] Commission Calculator at /commission-calculator with 3 scenarios, projection chart, PVR slider, pay plan presets
- [x] Mobile bottom navigation bar with 5-item tab bar and "More" drawer
- [x] 897/898 tests passing (870+ target exceeded, 1 pre-existing deepgram env failure remains)
- [x] 0 TypeScript errors
- [x] Git commit + push

## When Done
1. Git add, commit: "feat: lender matrix, deal jacket, weekend recap, commission calculator, mobile bottom nav"
2. Push to origin main
3. Update this file with completion notes
4. Write/update manus-deploy-prompt.md

## Completion Notes — April 6, 2026
**Completed by**: Henry (Claude Code + verification pass)
**Tests**: 897/898 passing (79 new tests in nightly-april6.test.ts; 1 pre-existing deepgram env failure)
**TypeScript**: 0 errors

### What was built:
1. **Lender Matrix Dashboard** (`/lender-matrix`) — 10-lender comparison matrix with KPI bar, grouped buy-rate vs sell-rate chart, best lender finder ranked by reserve opportunity, funding speed chart, reserve heatmap, credit-tier filter, and YTD/demo lender data.
2. **Deal Jacket Viewer** (`/deal-jacket`) — searchable recent-deals selector, deal summary header, document checklist with complete/pending/missing states, product gross breakdown, compliance flag card, gross visualization, deal score badge, and chronological timeline with print support.
3. **Weekend Recap Report** (`/weekend-recap`) — Monday-morning executive summary, manager scoreboard ranked by PVR, week-over-week product comparison, top wins vs missed opportunities, daily PVR trend, coaching focus callouts, clipboard share, and print layout.
4. **Commission Calculator** (`/commission-calculator`) — monthly comp estimator with pay-plan presets, current vs ASURA vs top-1% scenarios, cumulative earnings projection, income-vs-PVR slider, YTD tracker persisted in localStorage, and share/print actions.
5. **Mobile Bottom Navigation** — fixed 5-item bottom tab bar on mobile (`Dashboard`, `Live Session`, `History`, `Analytics`, `More`) with active-state underline, safe-area padding, dark-mode support, and slide-up categorized drawer for the rest of the app.
6. **Test Suite Expansion** — new `server/nightly-april6.test.ts` covering lender calculations, deal jacket shaping, weekend recap metrics, commission math, and mobile navigation logic.

### Sidebar/navigation updates:
- **Core nav**: added Deal Jacket
- **Performance**: added Weekend Recap
- **Operations**: added Lender Matrix
- **Business**: added Commission Calculator
- **Mobile**: added bottom navigation + More drawer categories

### Verification:
- `pnpm check` ✅
- `pnpm test` ✅ except for the known pre-existing `server/deepgram.test.ts` env-var failure

### What’s next:
- Deploy the latest `main` build to Manus
- Smoke-test `/lender-matrix`, `/deal-jacket`, `/weekend-recap`, and `/commission-calculator`

## Re-verification — April 8, 2026
**Verified by**: Henry (Claude Code)
- `pnpm check` ✅ — 0 TypeScript errors
- `pnpm test` ✅ — 897/898 passing (1 pre-existing deepgram env failure)
- All 4 new pages confirmed in `App.tsx` routes and lazy-loaded
- Mobile bottom nav confirmed in `AppLayout.tsx`
- `manus-deploy-prompt.md` updated for April 8 deployment
