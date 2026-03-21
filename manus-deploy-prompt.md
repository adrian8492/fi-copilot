# Manus Deploy Prompt — F&I Co-Pilot

**Last Updated:** March 20, 2026 — 10:15 PM PST  
**Build:** A5 — Mission Control V2 Live Data Wiring  
**Commit:** e30ee41  
**Tests:** 348/349 passing | TypeScript: 0 errors

---

## Deploy Instructions

This is a Node.js + React application. Deploy the latest commit from `origin/main`.

### Environment Variables Required

See `ENV_REFERENCE.md` for full documentation. Critical variables:

```
DATABASE_URL=                    # PostgreSQL connection string
SESSION_SECRET=                  # Random 32+ char string for session cookies
ENCRYPTION_KEY=                  # 64-char hex string for PII encryption (AES-256-GCM)
DEEPGRAM_API_KEY=                # Real-time transcription (Deepgram Nova-2)
OPENAI_API_KEY=                  # LLM grading engine (GPT-4o or compatible)
RESEND_API_KEY=                  # Email notifications (optional)
EMAIL_FROM=                      # Sender address for emails (optional)
NODE_ENV=production
PORT=3000
```

### Build & Start

```bash
pnpm install
pnpm build
node dist/index.js
```

### Database Setup

On first deploy, run migrations:
```bash
pnpm db:push
```

### What's New in This Build (A5)

This build focused on the Mission Control V2 dashboard (`/mission-control/index-v2.html`) — wiring static placeholder data to live filesystem reads via the API server (`api-server.js` on port 8743). No changes to the F&I Co-Pilot app itself.

1. **Agents Tab — Live Data**: Dynamic cards for Oliver, Henry, Thomas, Scout. Pulls last-run timestamps from memory files, output counts from content/scripts directories, and last git commit info. Shows task history, current status, and next scheduled run time per agent.

2. **Activity Feed**: Reverse-chronological log of the last 20 real events — git commits and file creation timestamps across `content/scripts/` and `memory/research/`. Agent attribution included.

3. **Docs Tab — 164 Documents**: Expanded from hardcoded entries to dynamic filesystem scan across 11 categories. Added Reels (36), LinkedIn (14), Shorts (13), Twitter (13), Brand Materials. Includes H1 title parsing, DRAFT/REVIEW/APPROVED status detection, and file size/modified date display.

4. **Calendar Tab**: Updated to real cron schedule — Oliver 7:00/7:15 AM, Scout 7:20–7:30 AM, Thomas every 4h content batches, Oliver 9 PM rollup, Henry 10 PM nightly build.

5. **New API Endpoints**:
   - `GET /api/agents/status` — Live agent status from filesystem
   - `GET /api/activity` — Last 50 activity events
   - `GET /api/schedule` — Real cron schedule

### Previous Builds

| Build | Feature | Commit |
|-------|---------|--------|
| A3    | F&I Product Intelligence Database — 9-product catalog, recommendation engine, session tab | 1e954a9 |
| A4    | Pagination + CSV Export + Mobile Responsive Polish | de54112 |
| A5    | Mission Control V2 — Live Agent Data, Docs Scanner, Activity Feed, Calendar | e30ee41 |

### App URL

https://finico-pilot-mqskutaj.manus.space/

### Login

- Email: `adrian@asuragroup.com`
- Password: `Asura2026!`

### Notes

- The app uses CFPB-compliant encryption for PII (customer names encrypted at rest with AES-256-GCM)
- MFA was removed from the codebase — email/password login only
- WebSocket connections are authenticated via session cookie; HTTP fallback (SSE) also authenticated
- Rate limiting: 200 req/15min on /api/trpc, 100 req/15min on /api/session
- Gzip compression enabled on all responses except SSE streams
- Static assets cached 365 days (immutable), HTML no-cache
- Health endpoint: `GET /api/health` — returns DB, Deepgram, LLM, Encryption status

---

## What's Next (A6 candidates)

Based on remaining todo.md items:

1. **Email Notifications** — Wire session summary email after grading completes (Resend integration is ready, just needs wiring in routers.ts `grades.generate` handler). Needs `RESEND_API_KEY`.
2. **Customer Management Polish** — Customer search, edit form, session history on CustomerDetail page (pages exist but may need data wiring)
3. **Product Menu UI Polish** — Ensure ProductMenu.tsx admin page is fully wired with create/edit/delete
4. **Real-Time Analytics Enhancements** — Deepen Eagle Eye View with drill-down per manager, trend sparklines on scorecard
5. **Deepgram Integration Hardening** — Test reconnect logic, improve error recovery, add audio level monitoring
6. **Mission Control V2 — Live Refresh** — Auto-poll endpoints every 60s so Agents tab updates without page reload
