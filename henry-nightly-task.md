# Henry Nightly Task — March 28, 2026

## Priority: HIGH — Deal Scoring Dashboard, Coaching Report Builder, Product Performance Heatmap, Session Replay Timeline, Real-Time Alerts Panel, Test Coverage Expansion

## Context
Previous build (March 27) completed: Goal Tracker, Weekly Coaching Insights, Session Export Modal (CSV/JSON), Global Search (Cmd+K), Analytics drill-down by dealership + MoM deltas.
Current test state: 479/480 passing (1 pre-existing deepgram env var failure).
Git: 5f4dbb9 — docs: update manus deploy prompt for March 27 build
TypeScript: 0 errors — clean baseline.

All pages exist: Dashboard, LiveSession, SessionHistory, SessionDetail, EagleEyeView, ObjectionAnalysis,
AdminPanel, Analytics, BatchUpload, ComplianceRules, Customers, CustomerDetail, ProductMenu,
DealRecovery, DealershipSettings, PipelineDiagnostics, ManagerScorecard, DemoMode, SessionComparison,
SessionPrintReport, NotificationCenter, Leaderboard, GoalTracker.

## Tonight's Tasks

### 1. Deal Scoring Dashboard (HIGH)
New page `DealScoring.tsx` at `/deal-scoring`:
- Shows all deals (sessions) with a calculated "Deal Score" — composite metric:
  - PVR contribution (40% weight): actual PVR vs dealership avg
  - Product penetration (30%): products accepted / products presented
  - Compliance score (20%): from session grade
  - Customer sentiment (10%): derived from objection count (fewer = better)
- Deal Score displayed as 0–100, color-coded (red <60, yellow 60–79, green 80+)
- Table view: Customer, Date, PVR, Products Sold, Compliance %, Deal Score, badge
- Sort by any column, filter by score tier (All/Green/Yellow/Red)
- Summary KPI bar: Avg Deal Score, % Green Deals, Total PVR, Best Deal Score
- Add to sidebar nav under "Analytics"
- Lazy-loaded route in App.tsx at `/deal-scoring`

### 2. Coaching Report Builder (HIGH)
New page `CoachingReportBuilder.tsx` at `/coaching-report`:
- Build custom PDF-ready coaching reports for individual F&I managers
- Manager selector (from `auth.myRooftops` or user list)
- Date range picker (last 30 / last 90 / custom)
- Report sections (toggleable checkboxes):
  - Performance Summary (grade trend sparkline, avg score)
  - Strength/Weakness Breakdown (top 3 each)
  - Objection Pattern Analysis (top 3 objection types)
  - Deal-by-Deal Score Table
  - ASURA OPS Checklist Compliance %
  - Personalized Coaching Recommendations (3 bullet points, template-generated client-side)
- "Preview Report" shows styled report preview below form
- "Download PDF" triggers `window.print()` on the preview section
- Add to sidebar nav under "Coaching"
- Lazy-loaded route in App.tsx at `/coaching-report`

### 3. Product Performance Heatmap (MEDIUM)
New component `ProductHeatmap.tsx`:
- Heatmap grid: rows = F&I products (VSC, GAP, Tire/Wheel, Paint/Fabric, etc.), columns = days of week (Mon–Sun)
- Cell value = avg product acceptance rate for that product on that day
- Color intensity = acceptance rate (white = 0%, dark green = 100%)
- Tooltip showing exact % and deal count on hover
- Data sourced client-side from sessions/products loaded via existing tRPC
- Display on Analytics page (new tab "Product Heatmap" alongside existing charts)
- Also accessible standalone from `ProductMenu.tsx` page as a "Performance Heatmap" button/section

### 4. Session Replay Timeline (MEDIUM)
New component `SessionReplayTimeline.tsx`:
- Available in `SessionDetail.tsx` as a new tab ("Replay Timeline")
- Visual horizontal timeline of the session by minute
- Events plotted as markers: compliance flags (red), objections raised (orange), product mentions (blue), checklist completions (green)
- Clicking a marker scrolls the transcript to that timestamp
- Show overall "session arc" — grade by time segment (first third / middle / last third)
- Build with recharts or pure CSS positioning (no new dependencies)

### 5. Real-Time Alerts Panel (MEDIUM)
New component `LiveAlertsPanel.tsx`:
- Available in `LiveSession.tsx` as a right-side collapsible panel
- Shows real-time alerts as they fire during the session:
  - Compliance warnings (TILA/ECOA/UDAP flags)
  - Low-score moments ("Closing technique below threshold")
  - Objection detected ("Customer pushed back on price")
  - Missed product mention ("VSC not yet offered")
- Alerts accumulate as session progresses (simulated with demo data in non-live mode)
- Each alert: icon, severity badge, timestamp, short description
- "Dismiss" button per alert, "Dismiss All" at top
- Panel toggle button in LiveSession header

### 6. Expand Test Suite to 510+ (MEDIUM)
Add `server/nightly-march28.test.ts` with tests for:
- Deal Score calculation (PVR contribution, penetration, compliance, sentiment weights)
- Deal Score color tier logic (red/yellow/green thresholds)
- Deal Score sorting and filtering
- Coaching report section toggles (all on, all off, partial)
- Coaching report date range filter logic
- Product heatmap data aggregation (by product × day of week)
- Product heatmap color intensity calculation
- Session replay timeline event parsing (compliance flags, objections, products, checklist)
- Session arc grade calculation (first/middle/last third)
- Live alerts panel accumulation logic
- Alert severity classification
- Summary KPI calculations (avg deal score, % green)
Target: 510+ tests passing (up from 479)

## Technical Notes
- No build step for dev — Vite dev server, vanilla tRPC
- Tests: pnpm test (target: 510+/511)
- TypeScript: pnpm check (target: 0 errors)
- The 1 deepgram.test.ts failure is pre-existing and acceptable
- Use recharts for heatmap and timeline visuals (already installed)
- New pages must be lazy-loaded in App.tsx with React.Suspense
- Print CSS for CoachingReportBuilder preview section (similar pattern to SessionPrintReport.tsx)
- DealScoring and CoachingReportBuilder should use existing AppLayout sidebar

## Definition of Done
- [ ] Deal Scoring Dashboard at /deal-scoring with composite score, table, KPI bar
- [ ] Coaching Report Builder at /coaching-report with sections, preview, print
- [ ] Product Performance Heatmap on Analytics + ProductMenu
- [ ] Session Replay Timeline tab in SessionDetail
- [ ] Real-Time Alerts Panel in LiveSession
- [ ] 510+ tests passing
- [ ] 0 TypeScript errors
- [ ] Git commit + push

## When Done
1. Git add, commit: "feat: deal scoring dashboard, coaching report builder, product heatmap, session replay timeline, live alerts panel"
2. Push to origin main
3. Update this file with completion notes
4. Write/update manus-deploy-prompt.md

---

# Henry Nightly Task — March 27, 2026

## Priority: HIGH — Goal Tracker, AI Coaching Insights, Session Export (CSV/JSON), Search Enhancements, Analytics Deep Dive

## Context
Previous build (March 26) completed: Notification Center, Leaderboard, Objection Playbook panel, Role-Based Access UI guards, Session History stats bar, Dashboard activity feed.
Current test state: 445/446 passing (1 pre-existing deepgram env var failure).
Git: 29eaa78 — docs: update manus deploy prompt for March 26 build
TypeScript: 0 errors — clean baseline.

All pages exist: Dashboard, LiveSession, SessionHistory, SessionDetail, EagleEyeView, ObjectionAnalysis,
AdminPanel, Analytics, BatchUpload, ComplianceRules, Customers, CustomerDetail, ProductMenu,
DealRecovery, DealershipSettings, PipelineDiagnostics, ManagerScorecard, DemoMode, SessionComparison,
SessionPrintReport, NotificationCenter, Leaderboard.

## Tonight's Tasks

### 1. Monthly Goal Tracker (HIGH)
New page `GoalTracker.tsx` at `/goals`:
- F&I managers set monthly PVR and product penetration goals
- UI: "Set Goal" form — metric selector (PVR / Product Penetration / Compliance Score / Overall Score), target value, time period (month)
- Progress bar per goal showing current vs target with % complete
- Pull current performance from `analytics.summary` tRPC procedure
- Hard-coded default goals for demo: PVR $3,200, Penetration 68%, Compliance 95%, Score 82/100
- Goal cards: metric name, target, current, gap ("$247 behind"), color-coded (red/yellow/green)
- Add to AppLayout sidebar nav
- Add lazy-loaded route in App.tsx at `/goals`

### 2. AI Coaching Insights — Weekly Summary Card (HIGH)
New component `WeeklyCoachingInsights.tsx`:
- Pull last 7 days of sessions + grades via existing tRPC procedures
- Generate client-side summary:
  - Best performing area (highest avg subscore)
  - Weakest area (lowest avg subscore) — "Focus Here This Week"
  - Grade trend: up/down/flat vs prior 7 days
  - Most common objection type from `objections.byProduct` (if data available)
  - Streak: consecutive sessions above 80
- Surface as a card on Dashboard (replace or augment the ASURA OPS scorecard widget position)
- Also accessible as a standalone panel on the Analytics page (bottom section)
- No new tRPC procedures — compute client-side from existing data

### 3. Session Export — CSV and JSON (HIGH)
Enhance `SessionHistory.tsx`:
- Existing CSV export button already exports basic session data
- Replace/enhance with Export Modal:
  - Format: CSV or JSON
  - Scope: Current page / All sessions / Date range (start/end date pickers)
  - Fields to include: checkboxes for Transcript, Grade, Compliance Flags, Deal Details
  - "Export" button triggers download
  - CSV: flat structure (one row per session, grade columns appended)
  - JSON: full nested object per session
- Wire to existing `sessions.exportCsv` tRPC procedure for CSV
- For JSON: client-side construction from already-loaded data + `sessions.list` full fetch
- Show export progress indicator for large exports (>50 sessions)

### 4. Global Search (MEDIUM)
New component `GlobalSearch.tsx`:
- Keyboard shortcut: Cmd+K (or Ctrl+K) opens a command palette modal
- Search across: sessions (by customer name, deal number), objections (by keyword), customers (by name)
- Results grouped by type with icons
- Click to navigate
- Wire to existing `sessions.search` tRPC proc + client-side filter of loaded customers
- Add Cmd+K listener in AppLayout
- Escape to close
- Show recent searches (localStorage, last 5)

### 5. Analytics — Drill-Down by Dealership (MEDIUM)
Enhance `Analytics.tsx`:
- Add dealership selector dropdown at the top (pull from `dealerships.list` tRPC)
- Filter all charts to selected dealership (pass dealershipId to existing queries where supported)
- Add "Comparison Mode" toggle: show two dealerships side-by-side on grade trend chart
- Add Net Revenue Estimate panel: sessions × avg PVR estimate, styled as a KPI card
- Show month-over-month delta for each KPI card (vs prior 30 days)

### 6. Expand Test Suite to 470+ (MEDIUM)
Add `server/nightly-march27.test.ts` with tests for:
- Goal tracker default goals structure (unit: correct metric names, targets)
- Goal progress calculation (current vs target, % complete, gap, color logic)
- Weekly coaching insights: best/worst area calculation from grade array
- Weekly coaching insights: streak calculation (consecutive sessions >80)
- Session export scope filter logic (current page vs all vs date range)
- Global search result grouping (sessions vs objections vs customers)
- Analytics dealership filter (query param passes through correctly)
- Net revenue estimate calculation (sessions × PVR)
- MoM delta calculation (current 30d vs prior 30d)
Target: 470+ tests passing (up from 445)

## Technical Notes
- No build step for dev — Vite dev server, vanilla tRPC
- Tests: pnpm test (target: 470+/471)
- TypeScript: pnpm check (target: 0 errors)
- The 1 deepgram.test.ts failure is pre-existing and acceptable
- Use recharts for progress/sparkline visuals (already installed)
- New pages must be lazy-loaded in App.tsx with React.Suspense
- GlobalSearch modal: use cmdk or build with existing shadcn Dialog + Command component

## Definition of Done
- [x] Goal Tracker page at /goals with progress cards
- [x] Weekly Coaching Insights card on Dashboard + Analytics
- [x] Session Export modal with CSV/JSON/scope options
- [x] Global Search (Cmd+K) command palette
- [x] Analytics dealership drill-down + MoM deltas
- [x] 470+ tests passing
- [x] 0 TypeScript errors
- [x] Git commit + push

## When Done
1. Git add, commit: "feat: goal tracker, coaching insights, session export modal, global search, analytics drill-down"
2. Push to origin main
3. Update this file with completion notes
4. Write/update manus-deploy-prompt.md

---

## Prior Completion Notes

### March 27, 2026

**Completed by:** Henry (Claude Code) — 2026-03-27 ~22:10 PST

All March 27 tasks completed:
- **Goal Tracker**: `GoalTracker.tsx` at `/goals` — set monthly PVR/Penetration/Compliance/Score goals with form, progress bars (color-coded red/yellow/green), gap text ("$247 behind" / "On Track!"), default demo goals pre-populated, pulls current metrics from `analytics.summary`.
- **Weekly Coaching Insights**: `WeeklyCoachingInsights.tsx` — client-side computed card showing best/weakest performance area (from 5 subscores), grade trend (up/down/flat vs prior 7 days), consecutive session streak (>=80), displayed on Dashboard (full-width) and Analytics (bottom section).
- **Session Export Modal**: `SessionExportModal.tsx` — replaces simple CSV button in SessionHistory with full modal: CSV/JSON format toggle, scope selector (Current Page/All/Date Range with date pickers), field checkboxes (Transcript/Grade/Compliance/Deal Details), progress indicator for large exports.
- **Global Search (Cmd+K)**: `GlobalSearch.tsx` — command palette modal with `useGlobalSearchShortcut` hook in AppLayout, searches sessions via `sessions.search` tRPC, grouped results with icons, keyboard navigation (arrows/enter/escape), recent searches in localStorage (last 5).
- **Analytics Drill-Down**: Dealership selector using `auth.myRooftops`, MoM delta indicators on KPI cards (score, PVR), Net Revenue Estimate panel (sessions × avg PVR), 5-column KPI grid.
- **34 new tests** in `server/nightly-march27.test.ts` covering goal defaults/progress/color logic, coaching insights best/worst area + streak, export scope filtering, search grouping, dealership filter params, net revenue calculation, MoM delta calculation.
- **479/480 tests passing** (1 pre-existing deepgram failure)
- `pnpm check`: 0 TypeScript errors
- Git: `2823d1f` — "feat: goal tracker, coaching insights, session export modal, global search, analytics drill-down"

### March 26, 2026

**Completed by:** Henry (Claude Code) — 2026-03-26 ~22:55 PST

All March 26 tasks completed:
- **Notification Center**: `NotificationCenter.tsx` at `/notifications` — filter tabs (All/Unread/Critical/Warnings), mark all read, severity icons, session links, empty state. "View All Notifications" link added to AlertBell dropdown.
- **Leaderboard**: `Leaderboard.tsx` at `/leaderboard` — weekly performance rankings by Overall Score/PVR/Product Penetration/Compliance, time period toggles (30/90/All), rank badges (gold/silver/bronze), best week highlight.
- **Objection Playbook**: ObjectionAnalysis right-side panel with all 10 ASURA word tracks, keyword search, copy-to-clipboard per objection.
- **RBAC Guards**: `useRole()` hook reading from auth context, `AccessDenied.tsx` component, AppLayout nav items filtered by role, role badge in sidebar user profile. Admin-only: AdminPanel, DealershipSettings, ComplianceRules. Manager+: BatchUpload, EagleEyeView, ManagerScorecard.
- **Session History Stats Bar**: Total Sessions, Avg Grade, Best PVR, Avg Duration, Recharts sparkline for grade trend.
- **Dashboard Activity Feed**: Recent Activity panel combining last 5 sessions + 3 compliance alerts + 2 deal recoveries, sorted by time, clickable navigation.
- **34 new tests** in `server/nightly-march26.test.ts` covering notification filters, leaderboard ranking/sorting, role access control, objection playbook search, session stats computation, activity feed aggregation.
- **445/446 tests passing** (1 pre-existing deepgram failure)
- `pnpm check`: 0 TypeScript errors
- Git: `778e2ba` — "feat: notification center, leaderboard, objection playbook, RBAC guards, activity feed"


### March 25, 2026

**Completed by:** Henry (Claude Code) — 2026-03-25 ~22:49 PST

All March 25 tasks completed:
- **PDF/Print Report**: `SessionPrintReport.tsx` at `/session/:id/print` — full print-optimized report with session metadata, grade breakdown, compliance flags table, ASURA co-pilot suggestions, checklist results, coaching report, full speaker-labeled transcript. Print CSS styles for clean output. `PrintReportButton` component already wired in SessionDetail.
- **Deal Recovery Analytics**: Stats bar (Total Attempted, Won Back, Revenue Recovered, Win Rate %), 8-week stacked bar chart (Recharts), status filter (All/Pending/Attempted/Recovered/Lost), sort by Date/Revenue/Status. tRPC `dealRecovery.stats` procedure wired.
- **Pipeline Diagnostics**: Expandable row detail, pipeline health score (0-100) with color coding (green/yellow/red), component-level health checks with re-check buttons, troubleshooting guide.
- **Customer Detail**: Visual session timeline with colored status dots, product acceptance history, "Schedule Follow-up" button with date picker modal, wired to `getSessionsByCustomerId` via tRPC.
- **Auto Coaching Report**: Template-based auto-generation on session end — compliance/script fidelity/closing focus areas, strength identification, stored via `upsertCoachingReport`.
- **Bundle Analysis**: 5 chunks >500KB identified, documented in App.tsx comment. SessionDetail (1MB) is largest candidate for future splitting.
- **TypeScript fixes**: Fixed field name mismatches (`closingScore` → `closingTechniqueScore`, `productKnowledgeScore` → `productPresentationScore`, `createdAt` → `startedAt`, `checklist` → `checklists` tRPC path).
- **411/412 tests passing** (1 pre-existing deepgram failure)
- `pnpm check`: 0 TypeScript errors

### March 24, 2026

**Completed by:** Henry (Claude Code) — 2026-03-24 ~22:15 PST

All March 24 tasks completed:
- **Demo Mode**: Full 6-minute scripted replay with timeline, transcript, ASURA co-pilot suggestions, compliance flags, 15-point checklist, final score 87/100, PVR $2,847. Start/Pause/Reset controls. No backend required.
- **Manager Scorecard**: Already wired to `analytics.managerScorecard` tRPC procedure. Added Export Scorecard button (window.print), Top 3 Strengths / Top 3 Improvements cards with ranked metrics.
- **Alert Bell**: New `AlertBell.tsx` component in AppLayout header. Backend: `getUnreadAlerts(userId)` sources from unresolved compliance flags (critical/warning) + low grades (<60%). `markAlertRead(alertId)` resolves flags. tRPC `alerts.list` + `alerts.markRead` procedures added.
- **Session Comparison**: Enhanced with AppLayout wrapper, delta summary section with color-coded indicators, Badge deltas per score category. Already routed at `/compare`.
- **document.title**: Added to all 18 page components ("Page Name | F&I Co-Pilot by ASURA Group").
- **Lazy Load Audit**: All pages (except Dashboard + Login) confirmed lazy-loaded with React.Suspense spinner fallback.
- **Seed Data**: `scripts/seed-90-days.mjs` exists. Session count depends on DB — document-only, no build failure.
- 15 new tests in `server/nightly-march24.test.ts`
- **382/383 tests passing** (1 pre-existing deepgram failure)
- `pnpm check`: 0 TypeScript errors

### March 23, 2026

**Completed by:** Henry (Claude Code) — 2026-03-23 ~22:06 PST

All March 23 tasks were confirmed already implemented in prior builds:
- TypeScript pagination errors fixed, `pnpm check` clean
- Cursor-based pagination in AdminPanel + SessionHistory
- Export CSV button in SessionHistory
- Mobile responsive AppLayout, LiveSession, Dashboard
- 19 new tests added in `server/pagination-export.test.ts`
- **367/368 tests passing** (1 pre-existing deepgram failure)
- Git: `340dc21` — "feat: pagination, CSV export, mobile responsive, seed data"

### March 22, 2026

**Completed by:** Henry (Claude Code) — 2026-03-22 ~22:05 PST

- Federal Compliance Engine built + wired to WebSocket
- Eagle Eye custom date range picker
- 90-day seed script ready
- 348/349 tests passing
- Git: `cd5fd53`
