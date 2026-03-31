# Henry Nightly Task — March 30, 2026

## Priority: HIGH — Multi-Location Rollup, Lender Rate Comparison, Shift Performance View, Training Curriculum Tracker, Session Tags, Test Coverage Expansion

## Context
Previous build (March 29) completed: F&I Scorecard PDF Export, Trainer Dashboard, Deal Timeline View, Performance Benchmarking Panel, Objection Trend Tracker.
Current test state: 579/580 passing (1 pre-existing deepgram env var failure).
Git: ed705c4 — docs: update nightly task completion notes and manus deploy prompt for March 29 build
TypeScript: 0 errors — clean baseline.

All pages exist: Dashboard, LiveSession, SessionHistory, SessionDetail, EagleEyeView, ObjectionAnalysis,
AdminPanel, Analytics, BatchUpload, ComplianceRules, Customers, CustomerDetail, ProductMenu,
DealRecovery, DealershipSettings, PipelineDiagnostics, ManagerScorecard, DemoMode, SessionComparison,
SessionPrintReport, NotificationCenter, Leaderboard, GoalTracker, DealScoring, CoachingReportBuilder,
TrainerDashboard, DealTimeline.

## Tonight's Tasks

### 1. Multi-Location Rollup Dashboard (HIGH)
New page `MultiLocationRollup.tsx` at `/multi-location`:
- For dealer group operators managing multiple rooftops from one view
- Top KPI bar: Total Locations, Combined PVR, Best Performing Location, Lowest Performing Location
- Location grid (card layout): each card shows dealership name, manager count, avg score, avg PVR, penetration %, trend arrow (up/down/flat vs prior month)
- Color coding per card: green (avg score ≥80), yellow (60–79), red (<60)
- Sort controls: by Score / Alphabetical / PVR / Most Improved
- Click card → navigates to `/settings` (dealership detail)
- Combined grade trend chart (recharts Line): all locations overlaid, one line per location, last 12 weeks
- "Export Rollup" button downloads JSON summary of all locations
- Add to sidebar nav under a new "Operations" section after the Performance section
- Lazy-loaded route in App.tsx at `/multi-location`

### 2. Lender Rate Comparison Panel (HIGH)
New component `LenderComparison.tsx`:
- Accessible from ProductMenu page as a new tab "Lender Rates"
- Hard-coded demo lender data (5 lenders: Capital One Auto, Ally Financial, Chase Auto, Wells Fargo Dealer, US Bank DFS)
- Table columns: Lender Name, Base Rate (APR%), Buydown Rate, Reserve Spread, Max Term (months), Min Credit Score
- Color coding: best rate highlighted green, worst red
- "Rate Calculator" section: input fields for Amount Financed + Term + Credit Tier → shows estimated monthly payment per lender
- Bar chart (recharts): visual comparison of reserve spread across lenders for selected credit tier
- Credit tier selector: Tier 1 (720+), Tier 2 (680-719), Tier 3 (620-679), Tier 4 (<620)
- "Best Match" highlight: auto-highlights the lender with best reserve opportunity for selected tier

### 3. Shift Performance View (HIGH)
New page `ShiftPerformance.tsx` at `/shift-performance`:
- Analyze F&I performance by time-of-day and day-of-week
- Heatmap grid (recharts): rows = days of week (Mon-Sat), columns = shifts (Morning 8-12, Afternoon 12-5, Evening 5-9)
- Cell color = avg deal score for that day+shift combo (green/yellow/red)
- Cell tooltip: avg score, deal count, avg PVR for that slot
- Summary bar: Best Performing Shift, Worst Performing Shift, Peak Deal Volume shift
- Below heatmap: line chart showing avg deal score by hour-of-day (0-23)
- Filter by manager, dealership, date range (last 30/60/90 days)
- "Staffing Insight" callout: auto-generated text like "Your strongest scores happen Tuesday afternoons — consider scheduling your top closer there"
- Data computed client-side from session timestamps + scores
- Add to sidebar nav under "Analytics" section (after Deal Timeline)
- Lazy-loaded route at `/shift-performance`

### 4. Training Curriculum Tracker (MEDIUM)
New page `TrainingCurriculum.tsx` at `/training`:
- Track F&I manager progress through ASURA OPS training modules
- Module list (hard-coded demo curriculum):
  1. "The Menu Order System" — 4 lessons
  2. "The Upgrade Architecture" — 3 lessons
  3. "The Objection Prevention Framework" — 5 lessons
  4. "The Coaching Cadence" — 3 lessons
  5. "Compliance Essentials" — 4 lessons
  6. "Advanced Closing Techniques" — 3 lessons
- Each module card shows: module name, lesson count, completion % (progress bar), status badge (Not Started / In Progress / Completed)
- Click module → expands to show individual lessons with checkboxes (toggle complete, persisted in localStorage)
- Overall progress ring at top: X of 22 lessons completed, % complete
- "Assign Training" button: opens modal to select a manager from dropdown and assign a module (client-side only, shows toast)
- Completion certificate preview: when all modules complete, show a "Training Complete" celebration card with confetti emoji
- Add to sidebar nav under "Coaching" section (after Trainer Dashboard)
- Lazy-loaded route at `/training`

### 5. Session Tags & Notes System (MEDIUM)
New component `SessionTags.tsx`:
- Displayed on SessionDetail page below the grade section
- Tag system: predefined tags (Hot Lead, Follow Up, Coaching Moment, Great Close, Compliance Issue, Escalation) + custom tag input
- Tags displayed as colored badges (each predefined tag has a consistent color)
- Click tag to remove, "+" button to add from predefined list or type custom
- Notes section below tags: textarea for free-form session notes
- All data persisted in localStorage keyed by session ID
- "Pinned Notes" section: checkbox to pin important notes (shows yellow star)
- Tags filterable from SessionHistory page: add tag filter dropdown to existing filters
- When tags exist for a session, show tag count badge on the session row in SessionHistory

### 6. Expand Test Suite to 620+ (MEDIUM)
Add `server/nightly-march30.test.ts` with tests for:
- Multi-location rollup KPI calculations (combined PVR = weighted avg, best/lowest location detection)
- Location card color tier logic (green/yellow/red thresholds)
- Location sort logic (by score, alphabetical, PVR, most improved)
- Lender comparison rate data structure (5 lenders, required fields present)
- Rate calculator payment formula (A * r(1+r)^n / ((1+r)^n - 1) where r = monthly rate)
- Best match detection (highest reserve spread for given tier)
- Credit tier threshold validation (720+, 680-719, 620-679, <620)
- Shift performance heatmap data shaping (7 days × 3 shifts matrix)
- Peak shift detection (shift with highest avg score)
- Hour-of-day aggregation (24-bucket array from session timestamps)
- Staffing insight generation (text includes best shift day + time)
- Training curriculum module structure (6 modules, 22 total lessons)
- Module completion percentage calculation (completed/total × 100)
- Overall progress calculation (sum of completed across all modules)
- Lesson toggle logic (complete/incomplete state transitions)
- Session tag operations (add, remove, predefined color mapping)
- Session tag persistence key format (sessionId-based)
- Pinned notes logic (pin/unpin toggle, pinned notes sorted first)
- Tag filter matching (session matches if it has any of selected tags)
- Tag count badge calculation (count of tags per session)
Target: 620+ tests passing (up from 579)

## Technical Notes
- No build step for dev — Vite dev server, vanilla tRPC
- Tests: pnpm test (target: 620+/621)
- TypeScript: pnpm check (target: 0 errors)
- The 1 deepgram.test.ts failure is pre-existing and acceptable
- Use recharts for all charts (already installed)
- New pages must be lazy-loaded in App.tsx with React.Suspense
- New pages use existing AppLayout sidebar
- Add "Operations" nav section in AppLayout for Multi-Location Rollup
- Training Curriculum uses localStorage for lesson completion persistence
- Session Tags use localStorage keyed by session ID
- Lender data is hard-coded demo data (no backend needed)
- Shift Performance computes from existing session data (timestamps + scores)

## Definition of Done
- [ ] Multi-Location Rollup at /multi-location with location grid, KPIs, combined trend chart, export
- [ ] Lender Rate Comparison as ProductMenu tab with calculator and bar chart
- [ ] Shift Performance at /shift-performance with heatmap, hour chart, staffing insight
- [ ] Training Curriculum at /training with module cards, lesson checkboxes, progress ring
- [ ] Session Tags & Notes on SessionDetail with localStorage persistence + SessionHistory filter
- [ ] 620+ tests passing
- [ ] 0 TypeScript errors
- [ ] Git commit + push

## When Done
1. Git add, commit: "feat: multi-location rollup, lender comparison, shift performance, training curriculum, session tags"
2. Push to origin main
3. Update this file with completion notes
4. Write/update manus-deploy-prompt.md

---

## Prior Completion Notes

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
