# Manus Deploy Prompt — F&I Co-Pilot

**Last Updated:** March 19, 2026 — 10:12 PM PST  
**Build:** A4 — Pagination + CSV Export + Mobile Responsive Polish  
**Commit:** de54112  
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

### What's New in This Build (A4)

1. **Pagination** — Session History, Admin Panel (Sessions tab + Audit Log tab) now paginate at 25 items/page with prev/next controls and "Showing X–Y of Z" indicators. No more loading 1000+ rows at once.

2. **CSV Export** — "Export CSV" button in Session History toolbar. Exports current view to a timestamped CSV file (`sessions-export-YYYY-MM-DD.csv`) with columns: ID, Customer, Deal Number, Vehicle, Type, Status, Score, PVR, Script Fidelity, Created At.

3. **Mobile Responsive Polish**:
   - Dashboard: KPI stats in 2×3 grid on mobile, quick action banner stacks vertically
   - Live Session: control buttons wrap on small screens, 36px min touch targets
   - AppLayout: hamburger overlay sidebar (was already working, verified)

4. **Test Suite Jump**: bcryptjs dependency was missing from node_modules — installed it, unblocking 146 tests. Total now 348 passing (was 189).

### Previous Builds

| Build | Feature | Commit |
|-------|---------|--------|
| A3    | F&I Product Intelligence Database — 9-product catalog, recommendation engine, session tab | 1e954a9 |
| A4    | Pagination + CSV Export + Mobile Responsive Polish | de54112 |

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

## What's Next (A5 candidates)

Based on remaining todo.md items:

1. **Email Notifications** — Wire session summary email after grading completes (Resend integration is ready, just needs wiring in routers.ts `grades.generate` handler). Needs `RESEND_API_KEY`.
2. **Customer Management Polish** — Customer search, edit form, session history on CustomerDetail page (pages exist but may need data wiring)
3. **Product Menu UI Polish** — Ensure ProductMenu.tsx admin page is fully wired with create/edit/delete
4. **Real-Time Analytics Enhancements** — Deepen Eagle Eye View with drill-down per manager, trend sparklines on scorecard
5. **Deepgram Integration Hardening** — Test reconnect logic, improve error recovery, add audio level monitoring
