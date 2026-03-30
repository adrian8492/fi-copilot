# Manus Deploy Prompt — F&I Co-Pilot
**Updated:** March 29, 2026 — Build 8465f4c

## What to Deploy

Deploy the latest build of the F&I Co-Pilot application from the GitHub repository to the Manus hosting environment.

**App ID:** MQskutAJ8qMCMFRFedd6Fn  
**Current URL:** https://finico-pilot-mqskutaj.manus.space/

## What's New in This Build

### Build 8465f4c — March 29, 2026
- **F&I Scorecard PDF Export:** `ScorecardPDFExport.tsx` — Print-optimized full-page PDF scorecard accessible from ManagerScorecard page via "Export Scorecard PDF" button. SVG score gauge with color ring, 5 subscore bars (Rapport, Needs Discovery, Product Presentation, Objection Handling, Closing), two-column strengths/improvements layout, grade trend sparkline, key metrics (sessions, PVR, penetration), ASURA OPS branding footer. `@media print` CSS hides app chrome and shows only the scorecard. "Print / Save as PDF" triggers `window.print()`.
- **Trainer Dashboard:** `/trainer` — For coaches/trainers monitoring multiple managers. Top KPI bar (Total Managers, Avg Score This Month, Most Improved, Most At-Risk). Manager card grid with color coding (green ≥80, yellow 60–79, red <60), trend arrows (vs last month), PVR/compliance metrics, 4-week sparkline per card. Sort controls (Score/A-Z/Most Improved/At-Risk), dealership filter. "View Full Scorecard" link → `/scorecard?id=X`, "Send Coaching Note" modal with textarea (client-side toast). Added to sidebar nav.
- **Deal Timeline:** `/deal-timeline` — Chronological timeline of all deals grouped by week (collapsible sections). Each deal shows date, customer, manager, dealership, score badge (color-coded), product badges, PVR. Sidebar filters: score tier (All/Green/Yellow/Red), manager, dealership. Summary strip: Deals This Week, Avg Deal Score, Best PVR, Total Revenue. "Export Timeline" downloads filtered deals as JSON. Click deal → `/session/:id`. Added to sidebar nav.
- **Performance Benchmarking Panel:** `BenchmarkingPanel.tsx` — New "Benchmarking" tab in Analytics page. Horizontal grouped bar chart (recharts) comparing individual manager vs dealership average vs ASURA national benchmark (Avg Score 74, PVR $2,850, Penetration 61%) for 5 metrics. Gap analysis table with status (Above/Below/On Par). "Areas to Close" section with auto-generated 2–3 coaching actions. Manager selector dropdown. Top 10% thresholds shown (Score 91, PVR $3,900, Penetration 78%).
- **Objection Trend Tracker:** `ObjectionTrendTracker.tsx` — New "Trends" tab in ObjectionAnalysis page. Line chart (recharts): 8-week objection frequency, one line per type (Price/Payment, Rate, Trade Value, Not Needed, Think About It). "Fastest Growing" and "Trending Down" badges on chart legend. Week-over-week comparison table (count, delta %, trend arrow). "Focus Area" callout card highlighting top objection with ASURA word track.
- **Test Suite:** 579/580 passing (1 pre-existing deepgram env failure — acceptable). +52 new tests.
- **TypeScript:** 0 errors

### Build 46cda49 — March 28, 2026
- **Deal Scoring Dashboard:** `/deal-scoring` — Composite deal score (PVR 40%, Penetration 30%, Compliance 20%, Customer Sentiment 10%), color-coded 0–100 score (red/yellow/green), sortable table, tier filter (All/Green/Yellow/Red), KPI bar (Avg Deal Score, % Green Deals, Total PVR, Best Deal Score). Added to sidebar nav.
- **Coaching Report Builder:** `/coaching-report` — Build custom PDF-ready coaching reports. Manager selector, date range (Last 30/Last 90/Custom), 6 toggleable sections (Performance Summary, Strengths/Weaknesses, Objection Patterns, Deal Table, Checklist Compliance, Coaching Recommendations), styled live preview, `window.print()` PDF download. Added to sidebar nav.
- **Product Performance Heatmap:** `ProductHeatmap.tsx` — Recharts heatmap grid showing F&I product acceptance rates by day of week. Color intensity = acceptance %. Hover tooltips show exact % and deal count. Available as "Product Heatmap" tab in Analytics page and collapsible section in ProductMenu page.
- **Session Replay Timeline:** `SessionReplayTimeline.tsx` — Horizontal visual timeline in SessionDetail "Replay Timeline" tab. Events plotted as colored markers (compliance=red, objections=orange, product mentions=blue, checklist=green). Click marker to scroll transcript. Session arc shows grade by first/middle/last third of session.
- **Real-Time Alerts Panel:** `LiveAlertsPanel.tsx` — Collapsible right panel in LiveSession. Accumulates live alerts (compliance warnings, low-score moments, objection detected, missed product mention). Dismiss per alert + Dismiss All. Toggle button in LiveSession header.
- **Test Suite:** 527/528 passing (1 pre-existing deepgram env failure — acceptable). +48 new tests.
- **TypeScript:** 0 errors

### Build 5f4dbb9 / 2823d1f — March 27, 2026
- **Goal Tracker:** `/goals` — Monthly PVR, Penetration, Compliance, and Score goal cards with progress bars (color-coded red/yellow/green), gap text ("$247 behind" / "On Track!"), default demo goals pre-populated, pulls current metrics from `analytics.summary`. Added to sidebar nav.
- **Weekly Coaching Insights:** `WeeklyCoachingInsights.tsx` — client-side weekly summary card: best/weakest performance area (from 5 subscores), grade trend (up/down/flat vs prior 7 days), consecutive session streak (>=80). Displayed on Dashboard (full-width below activity feed) and Analytics (bottom section).
- **Session Export Modal:** Enhanced SessionHistory export — full modal with CSV/JSON format toggle, scope selector (Current Page / All Sessions / Date Range with date pickers), field checkboxes (Transcript / Grade / Compliance / Deal Details), progress indicator for large exports (>50 sessions).
- **Global Search (Cmd+K):** Command palette modal — search sessions (customer name, deal number), customers (by name), objections (by keyword). Results grouped by type with icons. Recent searches persisted in localStorage (last 5). Cmd+K / Ctrl+K to open, Escape to close. Wired to `sessions.search` tRPC procedure.
- **Analytics Drill-Down:** Dealership selector dropdown at top filters all charts. Comparison Mode toggle shows two dealerships on grade trend chart. Net Revenue Estimate KPI card (sessions × avg PVR). Month-over-month delta indicators on all KPI cards.
- **479/480 tests passing**

### Build aae5e02 / 778e2ba — March 26, 2026
- **Notification Center:** Full inbox at `/notifications` — filter tabs (All/Unread/Critical/Warnings), icons by severity, mark all as read, session deep-links.
- **Performance Leaderboard:** `/leaderboard` — ranks managers by Overall Score, PVR, Product Penetration, Compliance Score. Rank badges (#1 gold, #2 silver, #3 bronze), time toggles (30d/90d/All Time).
- **Objection Analysis — ASURA Playbook Panel:** Right-side panel with all 10 top F&I objections + ASURA word tracks. Keyword search, "Copy Script" button.
- **Role-Based Access Control (UI Guards):** `useRole()` hook. Admin-only: AdminPanel, DealershipSettings, ComplianceRules. Manager+: BatchUpload, EagleEyeView, ManagerScorecard. AccessDenied card. Nav links filtered.
- **Session History Quick Stats Bar:** Total Sessions, Avg Grade, Best PVR, Avg Duration, grade sparkline.
- **Dashboard Recent Activity Feed:** Last 5 sessions + 3 compliance flags + 2 deal recoveries with time-ago.
- **445/446 tests passing**

### Build db54ace — March 25, 2026
- **PDF/Print Reports:** `/session/:id/print` — full print-optimized session report.
- **Deal Recovery Analytics:** Stats bar, 8-week bar chart, status filter, sort.
- **Pipeline Diagnostics Drill-Down:** Health score, color-coded SLA, re-check buttons.
- **Customer Detail Session Timeline:** Visual timeline, follow-up modal, product history.
- **Auto Coaching Report on Session End**
- **411/412 tests passing**

### Build 6f72230 — March 24, 2026
- Demo Mode, Manager Scorecard export, Alert Bell, Session Comparison delta view
- **382/383 tests passing**

### Build 340dc21 — March 23, 2026
- Cursor-based pagination, CSV export, mobile responsive layout
- **367/368 tests passing**

### Build cd5fd53 — March 22, 2026
- Federal Compliance Engine (TILA/Reg Z, CLA/Reg M, ECOA, UDAP/UDAAP), Eagle Eye date range
- **348/349 tests passing**

## Required Environment Variables

Ensure ALL of the following are set in the Manus environment before deployment:

```
# Database
DATABASE_URL=<neon-postgres-connection-string>

# Auth (Clerk)
CLERK_SECRET_KEY=<clerk-secret>
CLERK_PUBLISHABLE_KEY=<clerk-publishable-key>
VITE_CLERK_PUBLISHABLE_KEY=<same-as-above>

# AI
OPENAI_API_KEY=<openai-key>
DEEPGRAM_API_KEY=<deepgram-key>

# Email (Resend — optional, enables compliance alert emails)
RESEND_API_KEY=<resend-key>
EMAIL_FROM=<from-email>

# Encryption (CFPB PII encryption)
ENCRYPTION_KEY=<64-char-hex-string>

# App
NODE_ENV=production
PORT=3000
```

See `ENV_REFERENCE.md` in the repo root for full documentation of each variable.

## Deployment Steps

1. Pull latest from `origin/main` (commit `8465f4c`)
2. Install dependencies: `pnpm install --frozen-lockfile`
3. Build client: `pnpm build`
4. Run database migrations: `pnpm db:push` (or apply migration SQL from `drizzle/` folder)
5. Start server: `node dist/server/index.js` (or `pnpm start`)

## Health Check

After deploy, verify:
- `GET /api/health` returns `{"status":"ok","db":"connected",...}`
- Login flow works via Clerk OAuth
- Dashboard loads with KPI cards + Recent Activity Feed + Weekly Coaching Insights card
- `/deal-scoring` — Deal Scoring Dashboard shows composite score table and KPI bar
- `/coaching-report` — Coaching Report Builder shows manager selector, toggleable sections, print button
- Analytics page → "Product Heatmap" tab shows product × day-of-week heatmap
- SessionDetail → "Replay Timeline" tab shows horizontal event timeline
- LiveSession → alert panel toggle button appears in header, panel slides open
- `/goals` — Goal Tracker shows 4 goal cards with progress bars
- Cmd+K opens Global Search command palette; typing filters results
- SessionHistory export button opens modal with CSV/JSON/scope options
- Analytics page shows dealership selector dropdown and MoM deltas on KPI cards
- `/notifications` — Notification Center loads with filter tabs
- `/leaderboard` — Leaderboard shows manager rankings with badges
- ObjectionAnalysis page shows ASURA Playbook panel on right side
- Admin-only pages (AdminPanel, DealershipSettings, ComplianceRules) show AccessDenied for non-admin users
- ManagerScorecard → "Export Scorecard PDF" button opens print-optimized PDF view
- `/trainer` — Trainer Dashboard shows manager grid with KPIs, coaching note modal
- `/deal-timeline` — Deal Timeline shows week-grouped deals with filters and JSON export
- Analytics → "Benchmarking" tab shows grouped bar chart and gap analysis table
- ObjectionAnalysis → "Trends" tab shows 8-week trend lines and focus area card

## Known Issues / Notes

- **Deepgram real-time:** Requires `DEEPGRAM_API_KEY` to be set. If missing, app falls back to browser SpeechRecognition — no crash.
- **SessionDetail bundle size:** ~1MB chunk flagged for future code-splitting. Does not block deploy.
- **RBAC is UI-only:** Role guards are client-side only. Server-side tRPC role enforcement is a future task.
- **Global Search localStorage:** Recent searches stored per-browser. Clears on localStorage wipe.
- **Live Alerts Panel:** In non-live/demo sessions, alerts are simulated from session data. Real-time alerts require active WebSocket session.
- **Product Heatmap:** Color intensity computed client-side from loaded session data — requires session history data to populate. Empty state shown when no data.
- **90-day seed data:** If database is empty, run `node scripts/seed-90-days.mjs` with `DATABASE_URL` set.
- **WebSocket proxy:** Auto-falls back to HTTP streaming + SSE if proxy blocks WS upgrades.

## Rollback

Previous stable commit: `46cda49` (March 28 — Deal Scoring, Coaching Report Builder, Product Heatmap, Session Replay Timeline, Live Alerts Panel)
To rollback: `git checkout 46cda49 && pnpm install && pnpm build`
