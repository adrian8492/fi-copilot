# Manus Deploy Prompt — F&I Co-Pilot
**Updated:** March 25, 2026 — Build db54ace

## What to Deploy

Deploy the latest build of the F&I Co-Pilot application from the GitHub repository to the Manus hosting environment.

**App ID:** MQskutAJ8qMCMFRFedd6Fn  
**Current URL:** https://finico-pilot-mqskutaj.manus.space/

## What's New in This Build

### Build db54ace — March 25, 2026
- **PDF/Print Reports:** `/session/:id/print` — full print-optimized session report with metadata, grade breakdown, compliance flags table, ASURA co-pilot suggestions, checklist results, coaching summary, and speaker-labeled transcript. "Download PDF Report" button wired in SessionDetail.
- **Deal Recovery Analytics:** Stats bar (Total Attempted, Won Back, Revenue Recovered, Win Rate %), 8-week Recharts bar chart, status filter (All/Pending/Attempted/Recovered/Lost), sort by Date/Revenue/Status. `dealRecovery.stats` tRPC procedure wired.
- **Pipeline Diagnostics Drill-Down:** Expandable row detail showing blocking factors, days-in-stage, health score (0–100), color-coded SLA indicators (green <3d, yellow 3–7d, red >7d), component-level health checks with re-check buttons.
- **Customer Detail Session Timeline:** Visual timeline with colored status dots, product acceptance history per session, "Schedule Follow-up" modal with date picker, wired to `getSessionsByCustomerId`.
- **Auto Coaching Report on Session End:** Template-based generation from grade scores — compliance/script fidelity/closing focus areas auto-selected, stored via `upsertCoachingReport`.
- **Bundle Analysis:** 5 chunks >500KB documented. SessionDetail (~1MB) flagged for future code-splitting.
- **TypeScript fixes:** Fixed 7 field name mismatches across schema/router layer (closingScore, productKnowledgeScore, createdAt, checklists path).
- **Test Suite:** 411/412 passing (1 pre-existing deepgram env failure)

### Build 6f72230 — March 24, 2026
- **Demo Mode:** Full 6-minute scripted replay, transcript, suggestions, compliance flags, checklist, final score
- **Manager Scorecard:** Export button, Top 3 Strengths / Top 3 Improvements cards
- **Alert Bell:** Unread alerts from compliance flags + low grades, mark-read support
- **Session Comparison:** Delta summary, color-coded score badges
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

1. Pull latest from `origin/main` (commit `db54ace`)
2. Install dependencies: `pnpm install --frozen-lockfile`
3. Build client: `pnpm build`
4. Run database migrations: `pnpm db:push` (or apply migration SQL from `drizzle/` folder)
5. Start server: `node dist/server/index.js` (or `pnpm start`)

## Health Check

After deploy, verify:
- `GET /api/health` returns `{"status":"ok","db":"connected",...}`
- Login flow works via Clerk OAuth
- Dashboard loads with KPI cards
- Live Session page loads and shows compliance checklist
- SessionDetail shows "Download PDF Report" button → navigates to `/session/:id/print`
- Deal Recovery page shows stats bar + weekly chart
- Pipeline Diagnostics shows rows that expand on click

## Known Issues / Notes

- **Deepgram real-time:** Requires `DEEPGRAM_API_KEY` to be set. If missing, app falls back to browser SpeechRecognition automatically — no crash.
- **SessionDetail bundle size:** ~1MB chunk flagged for future code-splitting. Does not block deploy.
- **90-day seed data:** If database is empty, run `node scripts/seed-90-days.mjs` with `DATABASE_URL` set.
- **WebSocket proxy:** Auto-falls back to HTTP streaming + SSE if proxy blocks WS upgrades.
- **MFA:** TOTP-based, optional. Users enable via Settings → Security.

## Rollback

Previous stable commit: `6f72230` (March 24 — Demo Mode, Alert Bell, Session Comparison)
To rollback: `git checkout 6f72230 && pnpm install && pnpm build`
