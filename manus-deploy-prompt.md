# Manus Deploy Prompt — F&I Co-Pilot

**Last Updated:** March 22, 2026
**Build:** A7 — Federal Compliance Engine + WebSocket Fix + Eagle Eye Date Range
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

### What's New in This Build (A7)

Federal Compliance Engine exports, WebSocket fix, Eagle Eye custom date range.

1. **WebSocket Fix (websocket.ts)** — Fixed indentation inconsistencies in Deepgram transcript handler and compliance check block. Both `pnpm check` and esbuild compile cleanly.

2. **Federal Compliance Engine Exports (compliance-engine.ts)** — Added `analyzeTranscript()`, `getRulesByCategory()`, `getAllRules()` public API exports. Engine covers TILA/Reg Z, CLA/Reg M, ECOA/Reg B, UDAP/UDAAP, Contract Elements, GAP, VSC, Aftermarket, and 5 state-specific rule sets (CA, TX, FL, NY, OH).

3. **Eagle Eye Custom Date Range (EagleEyeView.tsx)** — Added "Custom" preset with native start/end date pickers. Users can now filter the leaderboard and trends by any arbitrary date range alongside the existing 7d/30d/90d/all presets.

4. **Compliance Wiring** — Already fully wired: `websocket.ts` runs `scanTranscriptForViolations()` on every final transcript, pushes flags via WebSocket, creates DB records, sends critical email alerts.

### Previous Builds

| Build | Feature | Commit |
|-------|---------|--------|
| A3    | F&I Product Intelligence Database — 9-product catalog, recommendation engine, session tab | 1e954a9 |
| A4    | Pagination + CSV Export + Mobile Responsive Polish | de54112 |
| A5    | Mission Control V2 — Live Agent Data, Docs Scanner, Activity Feed, Calendar | e30ee41 |
| A6    | Phase 3 Completion — CSV Export, Mobile Responsive, Pagination, .env.example | 751ed72 |
| A7    | Federal Compliance Engine + WebSocket Fix + Eagle Eye Date Range | — |

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
