# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

F&I Co-Pilot is a real-time AI coaching and compliance platform for automotive dealership Finance & Insurance (F&I) managers. It captures live sales conversations via audio transcription (Deepgram), provides real-time coaching suggestions using the proprietary ASURA Elite methodology, grades sessions against a rubric, flags federal regulatory violations (TILA, ECOA, UDAP, CLA), and tracks performance metrics.

## Commands

```bash
pnpm install                # Install dependencies (uses pnpm 10.4.1)
pnpm dev                    # Start dev server (tsx watch, auto-reload)
pnpm build                  # Build for production (Vite client + esbuild server → dist/)
pnpm start                  # Run production build
pnpm check                  # TypeScript type checking (tsc --noEmit)
pnpm format                 # Prettier formatting
pnpm test                   # Run all tests (vitest)
pnpm db:push                # Generate and run Drizzle migrations
```

Tests live in `server/**/*.test.ts` and run in Node environment via vitest. There is no single-test flag needed beyond `vitest run path/to/test.ts`.

## Architecture

### Monorepo Layout (single package.json)

- **`client/`** — React 19 SPA (Vite, Tailwind 4, Shadcn/Radix UI, wouter router)
- **`server/`** — Express + tRPC backend (tsx in dev, esbuild for prod)
- **`shared/`** — Constants, types, and error classes shared between client/server
- **`drizzle/`** — MySQL schema and migrations (Drizzle ORM)
- **`scripts/`** — Database seed scripts

### Path Aliases

| Alias | Maps To |
|-------|---------|
| `@/*` | `client/src/*` |
| `@shared/*` | `shared/*` |
| `@assets` | `attached_assets/` |

### Server Entry Point

`server/_core/index.ts` bootstraps Express with:
1. OAuth callback routes (`/api/oauth/callback`)
2. tRPC API at `/api/trpc` (all business logic — 70+ procedures)
3. PDF download REST routes (binary streaming)
4. HTTP streaming fallback at `/api/session/*` (SSE for proxied environments)
5. WebSocket server at `/ws/session` for real-time F&I sessions
6. Vite dev middleware (development) or static file serving (production)

### Key Server Modules

| File | Purpose |
|------|---------|
| `server/routers.ts` | All tRPC procedures (users, sessions, transcripts, suggestions, compliance, grades, analytics, coaching, dealerships, invitations) |
| `server/db.ts` | Drizzle ORM query layer (50+ operations, singleton DB connection from `DATABASE_URL`) |
| `server/websocket.ts` | Real-time session orchestration: Deepgram audio streaming → transcript → dual compliance check → co-pilot suggestion pipeline → DB persistence |
| `server/http-stream.ts` | SSE-based fallback for WebSocket-blocked environments (same logic as websocket.ts) |
| `server/asura-engine.ts` | ASURA proprietary coaching framework: system prompt, 13 regex triggers, response cache, grading rubric |
| `server/asura-scripts.ts` | Verbatim word track library indexed by deal stage and trigger keywords |
| `server/compliance-engine.ts` | Federal compliance ruleset (8 categories, 30+ rules: TILA/Reg Z, CLA/Reg M, ECOA/Reg B, UDAP/UDAAP, GAP, VSC) |
| `server/pdf-report.ts` | PDFKit-based session report generation |
| `server/storage.ts` | S3 file operations for audio recordings |

### Real-Time Processing Pipeline

When a live session is active:
1. Audio chunks stream via WebSocket (or HTTP POST fallback) to Deepgram for transcription
2. Falls back to browser SpeechRecognition if Deepgram unavailable
3. Each final transcript triggers a **2-layer compliance scan**:
   - Layer 1: ASURA proprietary regex triggers (fast, <5ms)
   - Layer 2: Federal compliance rules (TILA, ECOA, UDAP, CLA patterns)
4. **3-tier co-pilot suggestion pipeline**:
   - Tier 1: ASURA response cache (regex match → pre-scripted suggestion)
   - Tier 2: Script library keyword lookup by detected deal stage
   - Tier 3: LLM rolling analysis (Claude API, every 20s or 50 words)
5. All results broadcast to client and persisted to DB

### Client Architecture

- **Router:** wouter — routes defined in `client/src/App.tsx`
- **API:** tRPC client initialized in `client/src/lib/trpc.ts` with superjson transformer, React Query for caching
- **Auth:** OAuth-based via `useAuth()` hook — JWT in `__manus_session` cookie, auto-redirect on UNAUTHORIZED
- **UI Components:** Shadcn (new-york style) in `client/src/components/ui/`
- **Key pages:** Dashboard, LiveSession (recording + real-time coaching), SessionDetail (review/grading), Analytics, EagleEyeView (leaderboard), ComplianceRules, AdminPanel

### Database

MySQL via Drizzle ORM. Schema in `drizzle/schema.ts` with 16 tables: dealerships, users, sessions, transcripts, copilotSuggestions, complianceFlags, performanceGrades, audioRecordings, coachingReports, sessionChecklists, objectionLogs, complianceRules, scriptLibrary, auditLogs, invitations.

Key relationships: users → dealerships (many-to-one), sessions → users (many-to-one), transcripts/suggestions/flags/grades/checklists → sessions (many-to-one).

### Environment Variables

Required: `DATABASE_URL`, `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`
Optional: `NODE_ENV`, `PORT`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`

### Formatting

Prettier: 2-space indent, double quotes, trailing commas (ES5), semicolons, 80-char width.
