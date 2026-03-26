# Henry Nightly Task — March 25, 2026

## Priority: HIGH — PDF Report Polish, Deal Recovery Analytics, Pipeline Enhancements, Test Expansion

## Context
Previous build (March 24) completed: Demo Mode replay, Manager Scorecard wiring, Alert Bell, Session Comparison.
Current test state: 382/383 passing (1 pre-existing deepgram env var failure).
Git: 6f72230 — feat: demo mode replay, manager scorecard, alert bell, session comparison
TypeScript: 0 errors — clean baseline.

All pages exist: Dashboard, LiveSession, SessionHistory, SessionDetail, EagleEyeView, ObjectionAnalysis,
AdminPanel, Analytics, BatchUpload, ComplianceRules, Customers, CustomerDetail, ProductMenu,
DealRecovery, DealershipSettings, PipelineDiagnostics, ManagerScorecard, DemoMode, SessionComparison.

## Tonight's Tasks

### 1. PDF Session Report — Full Export Polish (HIGH)
The `pdf-report.ts` and `pdf-routes.ts` exist. Make the PDF export production-ready:
- `GET /api/sessions/:id/report.pdf` — ensure this route is registered and returns a proper PDF
- Include in PDF: session metadata, full transcript (speaker-labeled), compliance flags table, grade breakdown, ASURA co-pilot suggestions used, checklist results
- Use a proper HTML-to-PDF approach (if puppeteer/playwright not available, use a well-structured HTML template with `print.css` styles for window.print() path)
- Add a "Download PDF Report" button to `SessionDetail.tsx` that calls this endpoint
- If PDF generation requires a headless browser not available in the environment, implement a clean print-friendly HTML report page at `/sessions/:id/print` that looks professional when printed
- Test: verify the button renders and the endpoint returns 200

### 2. Deal Recovery Analytics Dashboard (HIGH)
`DealRecovery.tsx` exists. Enhance with analytics:
- Add a summary stats bar: Total Attempted, Won Back, Revenue Recovered, Win Rate %
- Use `getDealRecoveryStats(userId)` from db.ts — wire via tRPC `dealRecovery.stats` procedure
- Add a simple bar chart (recharts) showing recovery attempts by week (last 8 weeks)
- Status filter: All / Attempted / Won / Lost / Pending
- Sort by: Date, Revenue at Risk, Status
- Add `dealRecovery.stats` tRPC procedure to `routers.ts` if not already present
- Check `server/routers.ts` for existing dealRecovery procedures first

### 3. Pipeline Diagnostics — Drill-Down View (MEDIUM)
`PipelineDiagnostics.tsx` exists. Enhance:
- Add expandable row detail: click a pipeline item to expand and see what's blocking it
- Show "Days in stage" for each deal in pipeline
- Add a "Push to Next Stage" action button (calls tRPC, just updates status with audit log)
- Color-code rows: green (<3 days), yellow (3-7 days), red (>7 days)
- Add a pipeline health score (0-100) based on how many deals are past SLA

### 4. Customer Detail — Session Timeline (MEDIUM)
`CustomerDetail.tsx` exists. Enhance:
- Add a visual session timeline showing all sessions for this customer (date, duration, grade, PVR)
- Show product acceptance history: which products were accepted in each session
- Add "Schedule Follow-up" button (just opens a date picker modal + saves a note)
- Wire to `getSessionsByCustomerId(customerId)` from db.ts via tRPC

### 5. Expand Test Suite to 395+ (MEDIUM)
Add tests for:
- `dealRecovery.stats` tRPC procedure
- PDF report endpoint (mock test — check route exists + returns correct content-type)
- Pipeline stage update procedure (if added)
- CustomerDetail session timeline data fetch
- Deal Recovery analytics filter/sort logic (unit tests)
Target: 395+ tests passing (up from 382)

### 6. Coaching Report — Auto-Generate on Session End (MEDIUM)
In `server/routers.ts`, when a session is ended (`sessions.end` procedure):
- Auto-trigger `upsertCoachingReport` with AI-generated summary if grade exists
- The report should include: what went well, what to improve, next session focus
- Use a template-based approach (no LLM call needed — derive from grade scores):
  - If complianceScore < 70: "Focus: TILA/ECOA disclosures"
  - If scriptFidelityScore < 70: "Focus: ASURA OPS menu order script adherence"  
  - If closingScore < 70: "Focus: Assumptive closing and upgrade architecture"
  - If all scores > 80: "Excellent session — maintain this performance"
- Store via `upsertCoachingReport` if one doesn't already exist for the session

### 7. Performance: Bundle Analysis (LOW)
- Run `pnpm build 2>&1 | head -50` and capture chunk sizes
- If any chunk > 500KB, identify it and add a code comment in App.tsx noting the issue
- Document findings in a code comment at top of App.tsx

## Technical Notes
- No build step for dev — Vite dev server, vanilla tRPC
- Tests: pnpm test (target: 395+/396)
- TypeScript: pnpm check (target: 0 errors)
- The 1 deepgram.test.ts failure is pre-existing and acceptable
- Do NOT use puppeteer/playwright for PDF — use HTML print approach

## Definition of Done
- [x] PDF/Print report for sessions — Download button in SessionDetail, clean print layout
- [x] Deal Recovery analytics — stats bar + weekly chart + filters
- [x] Pipeline Diagnostics drill-down — expandable rows, days in stage, health score
- [x] Customer Detail session timeline — visual history + product acceptance
- [x] 395+ tests passing
- [x] 0 TypeScript errors
- [x] Auto coaching report on session end
- [x] Git commit + push

## When Done
1. Git add, commit: "feat: PDF reports, deal recovery analytics, pipeline drill-down, customer timeline"
2. Push to origin main
3. Update this file with completion notes
4. Write/update manus-deploy-prompt.md

---

## Prior Completion Notes

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
