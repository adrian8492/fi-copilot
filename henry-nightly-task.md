# Henry Nightly Task — March 26, 2026

## Priority: HIGH — Notification Center, Leaderboard, Objection Analysis Polish, Role-Based Access, Test Expansion

## Context
Previous build (March 25) completed: PDF/Print reports, Deal Recovery analytics dashboard, Pipeline Diagnostics drill-down, Customer Detail session timeline, auto coaching report on session end.
Current test state: 411/412 passing (1 pre-existing deepgram env var failure).
Git: b5aa2cc — docs: update manus deploy prompt for March 25 build
TypeScript: 0 errors — clean baseline.

All pages exist: Dashboard, LiveSession, SessionHistory, SessionDetail, EagleEyeView, ObjectionAnalysis,
AdminPanel, Analytics, BatchUpload, ComplianceRules, Customers, CustomerDetail, ProductMenu,
DealRecovery, DealershipSettings, PipelineDiagnostics, ManagerScorecard, DemoMode, SessionComparison,
SessionPrintReport.

## Tonight's Tasks

### 1. Notification Center — Full Inbox (HIGH)
The `AlertBell` component exists. Build a full Notification Center:
- New page `NotificationCenter.tsx` at `/notifications`
- Pull all alerts via `alerts.list` tRPC procedure (already exists)
- Show: icon (🔴 critical, 🟡 warning, 🔵 info), title, message, timestamp, session link
- Mark all as read button (bulk `alerts.markRead` mutation)
- Filter tabs: All / Unread / Critical / Warnings
- Empty state: "All clear — no alerts" with checkmark icon
- Add "View All Notifications" link from AlertBell dropdown to `/notifications`
- Add route in App.tsx (lazy loaded)

### 2. Performance Leaderboard (HIGH)
New page `Leaderboard.tsx` at `/leaderboard`:
- Pull from `analytics.managerScorecard` tRPC procedure
- Rank managers by: Overall Score, PVR, Product Penetration, Compliance Score
- Show rank badge (#1 gold, #2 silver, #3 bronze), name, dealership, score
- Toggle: Last 30 days / Last 90 days / All Time
- Highlight current user's row
- Trophy icon in header, clean table layout
- Add to AppLayout nav sidebar
- Add route in App.tsx (lazy loaded)

### 3. Objection Analysis — AI Playbook Panel (HIGH)
`ObjectionAnalysis.tsx` exists. Enhance:
- Add right-side panel: "ASURA Objection Playbook"
- Hard-code the top 10 F&I objections with ASURA word tracks:
  1. "I don't want any add-ons" → "I completely understand. The only reason I bring this up is..."
  2. "I need to think about it" → "Of course. What specifically were you still on the fence about?"
  3. "It costs too much" → "Compared to what? Let me show you what the actual monthly impact is..."
  4. "I already have coverage" → "That's great. What type of coverage do you have? Let me make sure there's no overlap..."
  5. "My dealer back home does this cheaper" → "I believe you. The difference is what's inside the contract..."
  6. "I just want the car payment" → "I hear you. Everything I'm going to show you fits into one monthly number..."
  7. "I don't believe in extended warranties" → "Most people feel that way until they see how manufacturers design vehicles today..."
  8. "My mechanic handles everything" → "Great. This actually works alongside that relationship, not instead of it..."
  9. "I'll add it later" → "I wish I could offer this later — these programs are only available at time of purchase..."
  10. "I never use these things" → "You're probably right. Most people don't. But the ones who need it once..."
- Add search/filter by keyword
- Add a "Copy Script" button per objection
- Show usage count from actual objection data if available

### 4. Role-Based Access Control — UI Guards (MEDIUM)
Currently all pages are accessible to any authenticated user. Add UI-level guards:
- Create `useRole()` hook that reads `ctx.user.role` from tRPC `auth.me` (already exists)
- Roles: `admin`, `manager`, `viewer`
- Admin-only pages: AdminPanel, DealershipSettings, ComplianceRules
- Manager+ pages: BatchUpload, EagleEyeView, ManagerScorecard
- All authenticated: everything else
- Show "Access Denied" card with role info if unauthorized (not a redirect — just block render)
- Add role badge to user avatar in AppLayout header
- Wire `useRole()` in AppLayout so nav links hide inaccessible pages

### 5. Session History — Quick Stats Bar (MEDIUM)
`SessionHistory.tsx` exists. Add:
- Stats bar above the table: Total Sessions, Avg Grade, Best PVR, Avg Duration
- Calculate from the currently loaded sessions (client-side, no new API needed)
- Show trend arrow if current page avg grade > previous page avg grade
- Mini sparkline (recharts) for grade trend across visible sessions

### 6. Dashboard — Recent Activity Feed (MEDIUM)
`Dashboard.tsx` exists. Add:
- "Recent Activity" panel (right side on desktop, bottom on mobile)
- Pull last 5 sessions + last 3 compliance flags + last 2 deal recoveries
- Each item: icon, description, time ago ("2 hours ago"), click to navigate
- Use existing tRPC procedures — no new procedures needed

### 7. Expand Test Suite to 425+ (MEDIUM)
Add tests for:
- NotificationCenter route existence and filter logic
- Leaderboard tRPC data fetch (analytics.managerScorecard)
- Role-based access hook logic (unit test)
- Objection playbook search filter (unit test)
- Session history stats bar calculation (unit test)
- Dashboard activity feed data aggregation
Target: 425+ tests passing (up from 411)

## Technical Notes
- No build step for dev — Vite dev server, vanilla tRPC
- Tests: pnpm test (target: 425+/426)
- TypeScript: pnpm check (target: 0 errors)
- The 1 deepgram.test.ts failure is pre-existing and acceptable
- Use recharts for sparklines (already installed)
- New pages must be lazy-loaded in App.tsx with React.Suspense

## Definition of Done
- [ ] Notification Center page at /notifications
- [ ] Leaderboard page at /leaderboard with ranking
- [ ] Objection Analysis playbook panel with ASURA word tracks
- [ ] Role-based UI guards + useRole() hook
- [ ] Session History quick stats bar
- [ ] Dashboard recent activity feed
- [ ] 425+ tests passing
- [ ] 0 TypeScript errors
- [ ] Git commit + push

## When Done
1. Git add, commit: "feat: notification center, leaderboard, objection playbook, RBAC guards, activity feed"
2. Push to origin main
3. Update this file with completion notes
4. Write/update manus-deploy-prompt.md

---

## Prior Completion Notes

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
