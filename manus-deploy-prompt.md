# Manus Deploy Prompt — F&I Co-Pilot
**Updated:** March 23, 2026 — Build 340dc21

## What to Deploy

Deploy the latest build of the F&I Co-Pilot application from the GitHub repository to the Manus hosting environment.

**App ID:** MQskutAJ8qMCMFRFedd6Fn  
**Current URL:** https://finico-pilot-mqskutaj.manus.space/

## What's New in This Build

### Build 340dc21 — March 23, 2026
- **Pagination:** All session list, audit log, and admin session views now paginated with prev/next UI and page indicators
- **CSV Export:** "Export CSV" button in Session History exports all filtered sessions as a CSV file download
- **Mobile Responsive:** Hamburger overlay sidebar on mobile, stacked panels in Live Session, 2-col dashboard grid on mobile
- **Test Suite:** 367 passing tests (up from 348)
- **19 new tests:** Pagination count functions, bulk export, mobile features

### Build cd5fd53 — March 22, 2026
- **Federal Compliance Engine:** Full rule set — TILA/Reg Z, CLA/Reg M, ECOA/Reg B, UDAP/UDAAP, F&I product disclosures
- **WebSocket:** Syntax indentation fixed, compiles cleanly
- **Eagle Eye Date Range:** Custom date range picker on Eagle Eye leaderboard view
- **Test Suite:** 348 passing

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

1. Pull latest from `origin/main` (commit `340dc21`)
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

## Known Issues / Notes

- **Deepgram real-time:** Requires `DEEPGRAM_API_KEY` to be set. If missing, the app falls back to browser SpeechRecognition automatically — no crash.
- **90-day seed data:** If the database is empty, run `node scripts/seed-90-days.mjs` with `DATABASE_URL` set to populate realistic test data.
- **WebSocket proxy:** If the hosting proxy blocks WebSocket upgrades (common on shared hosts), the client automatically falls back to HTTP streaming + SSE. No manual config needed.
- **MFA:** TOTP-based MFA is implemented but optional. Users can enable it via Settings → Security.

## Rollback

Previous stable commit: `cd5fd53` (March 22 — Federal compliance engine)
To rollback: `git checkout cd5fd53 && pnpm install && pnpm build`
