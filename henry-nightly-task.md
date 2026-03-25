# Henry Nightly Task — March 24, 2026

## Priority: HIGH — Demo Mode Polish, Manager Scorecard, Notification System, Deal Recovery UX

## Context
Previous build (March 23) completed: Pagination, CSV export, mobile responsive, seed data, 367/368 tests.
Current test state: 367/368 passing (1 pre-existing deepgram env var failure).
Git: 8a0ce67 — docs: update nightly task completion notes and deploy prompt.
TypeScript: 0 errors — clean baseline.

All pages exist: Dashboard, LiveSession, SessionHistory, SessionDetail, EagleEyeView, ObjectionAnalysis,
AdminPanel, Analytics, BatchUpload, ComplianceRules, Customers, CustomerDetail, ProductMenu,
DealRecovery, DealershipSettings, PipelineDiagnostics, ManagerScorecard, DemoMode.

## Tonight's Tasks

### 1. Demo Mode — Full Realistic Session Replay (HIGH)
The `DemoMode.tsx` page exists but needs to be a compelling, fully scripted demo:
- Auto-play a realistic 6-minute F&I session (VSC, GAP, Appearance Protection)
- Transcript lines feed in over time (simulate real-time speech)
- Co-pilot suggestions appear at correct moments (pre-scripted ASURA scripts)
- Compliance flags fire when appropriate (TILA disclosure, GAP explanation, ECOA)
- 17-point checklist auto-checks as session progresses
- Final grades auto-generate at end: overall 87%, PVR $2,847
- "Start Demo" / "Reset Demo" buttons — no Deepgram required
- Use `useEffect` + `setInterval` to drive the timeline
- Store the demo script inline (no backend calls needed except optionally to save a demo session)

### 2. Manager Scorecard Page — Real Data Wiring (HIGH)
`ManagerScorecard.tsx` exists. Make sure it's fully wired to real tRPC data:
- Check what tRPC procedures it uses — if stubbed/mocked, wire to real analytics router
- Show: overall score, Script Fidelity Score, compliance rate, avg PVR, session count
- Last 30 days vs prior 30 days delta (up/down arrow + %)
- Top 3 strengths, top 3 improvement areas (from grades/checklist data)
- Export scorecard button (PDF or print view via `window.print()`)
- If the analytics router lacks a `managerScorecard` procedure, add it to `server/routers.ts` + `server/db.ts`

### 3. Notification / Alert Feed (MEDIUM)
Add an in-app notification system:
- `server/db.ts`: Add `getUnreadAlerts(userId)` and `markAlertRead(alertId)` functions
  - Source from existing `complianceFlags` (severity=critical) and `coachingReports` (low grades)
- `server/routers.ts`: Add `alerts.list` (returns last 20 unread) and `alerts.markRead`
- `client/src/components/AlertBell.tsx`: Bell icon in AppLayout header showing unread count badge
  - Click → dropdown with alert list (icon, message, time, "Mark read" action)
  - Shows compliance violations and low performance alerts
- Wire into AppLayout header next to user avatar

### 4. Session Comparison Page (MEDIUM)
Build `SessionComparison.tsx` (page file may already exist — check):
- Select 2 sessions from dropdowns (searchable select)
- Side-by-side grade comparison: compliance score, script fidelity, rapport, closing
- Transcript diff view: color-coded highlights of what was said vs not said
- Delta indicators: which session scored higher in each category
- Add route `/compare` to App.tsx if not present
- Add to sidebar nav under Performance section

### 5. Expand Test Suite to 380+ (MEDIUM)
Add tests for:
- `alerts.list` and `alerts.markRead` tRPC procedures
- `analytics.managerScorecard` procedure (if added)
- Demo Mode timeline logic (unit-testable pieces)
- Session comparison procedure (if added)
Target: 380+ tests passing (up from 367)

### 6. Seed Data — Verify 90-day Data Exists (LOW)
- Check if database has sessions data: query `sessions` table row count via `server/db.ts`
- If `scripts/seed-90-days.mjs` hasn't been run (or DB count < 20), document clearly in this file
- Don't fail the build over this — just note status

### 7. Performance: Lazy Load Optimization (LOW)
- Audit `client/src/App.tsx` — ensure ALL page components use `lazy()` except Dashboard + Login
- Check if React.Suspense is properly wrapping routes with a spinner fallback
- Add `<title>` tag updates per page (use `document.title` in useEffect in each page component)
  - Format: "Page Name | F&I Co-Pilot by ASURA Group"

## Technical Notes
- No build step — Vite dev server, vanilla tRPC
- Tests: pnpm test (target: 380+/381)
- TypeScript: pnpm check (target: 0 errors)
- The 1 deepgram.test.ts failure is pre-existing and acceptable
- Demo Mode should work 100% without any backend env vars

## Definition of Done
- [x] Demo Mode: fully scripted, auto-playing session replay with real-time transcript, suggestions, compliance, grades
- [x] Manager Scorecard: real data wired, delta comparisons, export button
- [x] Alert Bell: in AppLayout header, unread count badge, dropdown with compliance/grade alerts
- [x] Session Comparison: side-by-side grade + transcript comparison with delta indicators
- [x] 382+ tests passing
- [x] 0 TypeScript errors
- [x] Git commit + push

## When Done
1. Git add, commit: "feat: demo mode, manager scorecard, alert bell, session comparison"
2. Push to origin main
3. Update this file with completion notes
4. Write/update manus-deploy-prompt.md

---

## Prior Completion Notes

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
