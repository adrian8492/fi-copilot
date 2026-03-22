# Henry Nightly Task — March 21, 2026

## Priority: HIGH — Phase 3 Completion + Pagination

## Context
Previous build (March 20) completed Mission Control V2 live data wiring.
Current test state: 348/349 passing (1 pre-existing deepgram env var failure).

## Tonight's Tasks

### 1. Phase 3 Remaining — CSV Export + Mobile Polish (HIGH)

**3.3b: Export CSV button in SessionHistory.tsx**
- Add "Export CSV" button to SessionHistory page header
- Wire to existing sessions.bulkExport procedure (already exists in routers.ts)
- Export selected sessions or all filtered sessions
- Trigger download via Blob URL

**3.4a: Mobile responsive AppLayout.tsx**
- Sidebar collapses to bottom nav on mobile (<768px)
- Hamburger → slide-in overlay sidebar (already partially done — verify and polish)
- Bottom nav bar with 4-5 key icons for mobile
- Ensure no horizontal overflow on mobile screens

**3.4b: Mobile responsive LiveSession.tsx**
- Stacks vertically on mobile (transcript + co-pilot panel stack instead of side-by-side)
- Controls accessible on small screens
- Compliance alerts don't overflow

**3.4c: Mobile responsive Dashboard.tsx**
- KPI cards stack 2x2 on tablet, 1x4 on mobile
- Charts resize correctly
- Recent sessions table scrolls horizontally

### 2. Phase 2 Remaining — Pagination (MEDIUM)

**2.5a: Add count DB functions to db.ts**
- getSessionCount(dealershipId?: number): Promise<number>
- getSessionCountByDealershipIds(ids: number[]): Promise<number>
- getSessionCountByUser(userId: string): Promise<number>
- getAuditLogCount(userIds?: string[]): Promise<number>

**2.5b: Update tRPC procedures to return paginated results**
- admin.allSessions → { rows, total, limit, offset }
- admin.auditLogs → { rows, total, limit, offset }
- sessions.list → { rows, total, limit, offset }
- Input: limit (default 25), offset (default 0)

**2.5c: Add pagination UI to AdminPanel.tsx**
- Sessions tab: prev/next buttons + "Showing X–Y of Z" label
- Audit Logs tab: same pattern

**2.5d: Add pagination UI to SessionHistory.tsx**
- Prev/next buttons + page info label
- Respect existing search/filter params

### 3. .env.example (LOW)
- Create .env.example listing all required and optional env vars
- Group by category (Database, Auth, AI, Email, etc.)
- Add comments explaining each var

## Technical Notes
- No build step — Vite dev server, vanilla tRPC
- Tests: pnpm test (target: 348+/349)
- TypeScript: pnpm check (target: 0 errors)
- The 1 deepgram.test.ts failure is pre-existing and acceptable

## Definition of Done
- [x] CSV export button in SessionHistory working
- [x] Mobile layout for AppLayout, LiveSession, Dashboard (tested with Chrome DevTools resize)
- [x] Pagination on admin.allSessions, admin.auditLogs, sessions.list
- [x] Pagination UI on AdminPanel + SessionHistory
- [x] .env.example created
- [x] 348+/349 tests passing
- [x] 0 TypeScript errors
- [x] Git commit + push

## When Done
1. Git add, commit: "feat: Phase 3 completion — CSV export, mobile responsive, pagination"
2. Push to origin main
3. Update this file with completion notes
4. Write manus-deploy-prompt.md

---

## Completion Notes — March 21, 2026

**Completed by:** Henry (Claude Agent)
**Time:** ~10 min
**Tests:** 348/349 passing (1 pre-existing deepgram env var failure)
**TypeScript:** 0 errors

### What was done

**Phase 3 — CSV Export + Mobile Polish:**
- CSV Export in SessionHistory.tsx — already implemented (bulkExport procedure + Blob download)
- **AppLayout.tsx** — Added mobile bottom nav bar (5 icons: Home, Record, History, Analytics, Admin) with `lg:hidden` fixed positioning; added `pb-16 lg:pb-0` to main content to prevent overlap
- **LiveSession.tsx** — Changed main content from `flex` to `flex flex-col md:flex-row`; made Co-Pilot panel visible on mobile (`h-[50vh]` stacked below transcript with `border-t`)
- **Dashboard.tsx** — Changed KPI grid from `grid-cols-2` to `grid-cols-1 sm:grid-cols-2` for proper 1-col mobile / 2-col tablet stacking

**Phase 2 — Pagination:**
- All pagination DB functions already existed (`getSessionCount`, `getSessionCountByUser`, `getSessionCountByDealershipIds`, `getAuditLogCount`)
- All tRPC procedures already return `{ rows, total, limit, offset }` format
- Pagination UI already existed in both AdminPanel.tsx and SessionHistory.tsx with prev/next buttons + page info

**Housekeeping:**
- Created `.env.example` with all env vars grouped by category (Database, Encryption, Auth, AI, Email, Frontend, Analytics, Server) with explanatory comments
