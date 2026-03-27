# Manus Deploy Prompt — F&I Co-Pilot
**Updated:** March 26, 2026 — Build aae5e02

## What to Deploy

Deploy the latest build of the F&I Co-Pilot application from the GitHub repository to the Manus hosting environment.

**App ID:** MQskutAJ8qMCMFRFedd6Fn  
**Current URL:** https://finico-pilot-mqskutaj.manus.space/

## What's New in This Build

### Build aae5e02 / 778e2ba — March 26, 2026
- **Notification Center:** Full inbox at `/notifications` — filter tabs (All/Unread/Critical/Warnings), icons by severity, mark all as read, session deep-links. "View All Notifications" link from AlertBell dropdown.
- **Performance Leaderboard:** `/leaderboard` — ranks managers by Overall Score, PVR, Product Penetration, Compliance Score. Rank badges (#1 gold, #2 silver, #3 bronze), time toggles (30d/90d/All Time), current user row highlight. Trophy icon header. Wired to `analytics.managerScorecard`.
- **Objection Analysis — ASURA Playbook Panel:** Right-side panel in ObjectionAnalysis with all 10 top F&I objections + ASURA word tracks. Keyword search, "Copy Script" button per objection, usage count from real data when available.
- **Role-Based Access Control (UI Guards):** `useRole()` hook reads `ctx.user.role`. Admin-only: AdminPanel, DealershipSettings, ComplianceRules. Manager+: BatchUpload, EagleEyeView, ManagerScorecard. AccessDenied card (no redirect). Role badge on avatar in header. Nav links filtered by role.
- **Session History Quick Stats Bar:** Above-table stats — Total Sessions, Avg Grade, Best PVR, Avg Duration. Trend arrow when current page avg > previous page avg. Recharts sparkline for grade trend.
- **Dashboard Recent Activity Feed:** Right-side panel (desktop) / bottom (mobile) — last 5 sessions + last 3 compliance flags + last 2 deal recoveries. Icon, description, time-ago, clickable navigation.
- **Test Suite:** 445/446 passing (1 pre-existing deepgram env failure — acceptable)
- **TypeScript:** 0 errors

### Build db54ace — March 25, 2026
- **PDF/Print Reports:** `/session/:id/print` — full print-optimized session report with metadata, grade breakdown, compliance flags table, ASURA co-pilot suggestions, checklist results, coaching summary, and speaker-labeled transcript. "Download PDF Report" button wired in SessionDetail.
- **Deal Recovery Analytics:** Stats bar (Total Attempted, Won Back, Revenue Recovered, Win Rate %), 8-week Recharts bar chart, status filter (All/Pending/Attempted/Recovered/Lost), sort by Date/Revenue/Status. `dealRecovery.stats` tRPC procedure wired.
- **Pipeline Diagnostics Drill-Down:** Expandable row detail showing blocking factors, days-in-stage, health score (0–100), color-coded SLA indicators (green <3d, yellow 3–7d, red >7d), component-level health checks with re-check buttons.
- **Customer Detail Session Timeline:** Visual timeline with colored status dots, product acceptance history per session, "Schedule Follow-up" modal with date picker, wired to `getSessionsByCustomerId`.
- **Auto Coaching Report on Session End:** Template-based generation from grade scores, stored via `upsertCoachingReport`.
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

1. Pull latest from `origin/main` (commit `aae5e02`)
2. Install dependencies: `pnpm install --frozen-lockfile`
3. Build client: `pnpm build`
4. Run database migrations: `pnpm db:push` (or apply migration SQL from `drizzle/` folder)
5. Start server: `node dist/server/index.js` (or `pnpm start`)

## Health Check

After deploy, verify:
- `GET /api/health` returns `{"status":"ok","db":"connected",...}`
- Login flow works via Clerk OAuth
- Dashboard loads with KPI cards + Recent Activity Feed panel
- `/notifications` — Notification Center loads with filter tabs
- `/leaderboard` — Leaderboard shows manager rankings with badges
- ObjectionAnalysis page shows ASURA Playbook panel on right side
- Admin-only pages (AdminPanel, DealershipSettings, ComplianceRules) show AccessDenied for non-admin users
- SessionHistory shows stats bar (Total, Avg Grade, Best PVR, Avg Duration) above table

## Known Issues / Notes

- **Deepgram real-time:** Requires `DEEPGRAM_API_KEY` to be set. If missing, app falls back to browser SpeechRecognition automatically — no crash.
- **SessionDetail bundle size:** ~1MB chunk flagged for future code-splitting. Does not block deploy.
- **RBAC is UI-only:** Role guards are client-side UI only. Server-side tRPC procedures do not yet enforce role restrictions — full server-side RBAC is a future task.
- **90-day seed data:** If database is empty, run `node scripts/seed-90-days.mjs` with `DATABASE_URL` set.
- **WebSocket proxy:** Auto-falls back to HTTP streaming + SSE if proxy blocks WS upgrades.

## Rollback

Previous stable commit: `b5aa2cc` (March 25 — PDF reports, Deal Recovery, Pipeline Diagnostics)
To rollback: `git checkout b5aa2cc && pnpm install && pnpm build`
