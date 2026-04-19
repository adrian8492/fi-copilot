# Henry April 17 Build Task — Claude Code Instructions

## Context
You are building features for the F&I Co-Pilot app at /Users/adrian/.openclaw/workspace/Users/adrian/asura/fi-copilot/

Current state (as of April 17, 2026):
- 967/968 tests passing (1 pre-existing deepgram env failure — leave it alone)
- 0 TypeScript errors
- Latest commit: 04ceeef docs: refresh nightly verification for april 16

## Tonight's New Features

### 1. Heat Sheet (`/heat-sheet`) — HIGH
New page `client/src/pages/HeatSheet.tsx`:
- Real-time "heat" tracker showing which customers are most likely to close right now
- Customer list with heat score (0-100), color-coded: 🔴 Hot (80-100), 🟡 Warm (60-79), 🔵 Cool (40-59), ⚫ Cold (<40)
- Heat factors shown as badge chips: "returning customer", "pre-approved", "trade-in present", "cash buyer", "repeated visit", "spouse present", "decision maker confirmed", "credit pulled"
- KPI bar: Total in Pipeline, Hot Leads, Avg Heat Score, Est. Close Rate %
- Sort by: Heat Score (default), Customer Name, Time in Store, Vehicle Price
- Filter by: All / Hot / Warm / Cool / Cold
- Heat score breakdown modal (click a customer): shows individual factor weights
- "Take Action" button per row: opens quick notes input, tags reason for follow-up
- Auto-refresh indicator (simulated 30s refresh with countdown)
- Hard-coded demo: 20 customers with varied heat factors
- Add to sidebar under Performance section (after Weekend Recap)
- Lazy-loaded route at `/heat-sheet`

### 2. F&I Word Track Library (`/word-tracks`) — HIGH
New page `client/src/pages/WordTracks.tsx`:
- Organized library of proven F&I word tracks, scripts, and rebuttals
- Categories: Opening / Menu Presentation / Objection Responses / Closing / Turnover / Compliance Disclosures
- Left sidebar category filter (collapsible on mobile)
- Search bar: filter word tracks by keyword
- Each word track card shows:
  - Title (e.g., "The 'I need to think about it' Rebuttal")
  - Category badge
  - Situation (when to use it)
  - The full word track script (expandable)
  - ASURA Principle tag (which OPS pillar it supports)
  - Effectiveness rating (stars, 1-5)
  - Copy to Clipboard button
  - "Mark as Favorite" toggle (localStorage persisted)
- "Favorites" tab shows only starred tracks
- 25+ hard-coded word tracks across all categories
- Word track count badge per category
- Add to sidebar under Coaching section (after Objection Library)
- Lazy-loaded route at `/word-tracks`

### 3. Desk Log (`/desk-log`) — HIGH
New page `client/src/pages/DeskLog.tsx`:
- Digital version of the F&I desk log — tracks every deal worked each day
- Date selector: view log for specific date (default: today)
- Deal entry table: Deal #, Customer Name, Vehicle (YMM), Sale Price, Amount Financed, Rate, Term, Monthly Payment, Lender, F&I Manager, Products Sold (comma list), Back Gross, Front Gross, Total Gross, Status (Pending/Funded/Unwound/Declined)
- KPI summary row at top: Total Deals, Total Back Gross, Total Front Gross, Total Gross, Avg PVR, Funded Count, Pending Count
- Add Deal button: opens slide-in form panel (hard-coded — form captures all fields, stores in React state)
- Quick edit: click any cell to inline-edit (status dropdown especially important)
- Color coding: Funded = green row tint, Unwound = red, Pending = yellow, Declined = gray
- Export to CSV button (generates CSV string, triggers download)
- Print desk log (window.print())
- Hard-coded demo data: 12 deals for today's date
- Add to sidebar under Operations section (after Deal Funding Tracker)
- Lazy-loaded route at `/desk-log`

### 4. Rate Watch (`/rate-watch`) — MEDIUM
New page `client/src/pages/RateWatch.tsx`:
- Monitor buy rate trends and alerts for F&I managers
- Current rate environment summary: Prime Rate, Fed Funds Rate (mocked), Average Auto Buy Rate (new vs used), Direction indicator (Rising/Stable/Falling) with trend arrow
- Rate trend chart: recharts LineChart showing 12 months of avg buy rates (new vehicle vs used vehicle)
- Lender rate table: Lender Name, Current Buy Rate (new), Current Buy Rate (used), Last Change (date + bps delta), YTD Change (bps), Trend (up/down/flat icon)
- Rate alert panel: configured rate threshold alerts (e.g., "Alert when Ally new car rate exceeds 7.5%") — add/remove alerts, toggle active/inactive (localStorage persisted)
- "Rate Impact Calculator": enter deal amount + term, see monthly payment impact per 0.25% rate change
- Market context card: Fed meeting dates (mocked), analyst rate outlook (static text), "What this means for F&I" (static interpretation)
- Hard-coded demo: 10 lenders, 12 months of rate history, 3 pre-loaded alerts
- Add to sidebar under Operations section (after Lender Matrix)
- Lazy-loaded route at `/rate-watch`

### 5. Expand Test Suite to 1,020+ (MEDIUM)
Add `server/nightly-april17.test.ts` with tests for:

**Heat Sheet tests:**
- Heat score calculation from factor count and weights
- Heat tier classification (Hot/Warm/Cool/Cold from score)
- Customer sort by heat score (descending)
- Customer sort by time in store (ascending)
- Filter customers by heat tier
- Heat factor weight accumulation (sum of active factors)
- Close rate estimate from avg heat score
- Pipeline count aggregation (total, hot, warm, cool, cold)

**Word Track tests:**
- Word track search filter (by keyword in title/script)
- Category filter returns only matching tracks
- Favorite toggle logic (add/remove from favorites array)
- Word track count by category
- Category list completeness (all 6 categories present)
- Effectiveness rating validation (1-5 range)
- Copy text assembly (title + situation + script)
- ASURA pillar tag validation (must be one of 4 pillars)

**Desk Log tests:**
- Deal gross calculation (front + back = total gross)
- PVR calculation (total back gross / deal count)
- KPI summary aggregation (totals across all deals)
- Status filter: funded/pending/unwound/declined counts
- CSV row generation (proper field quoting and commas)
- CSV header validation (all required columns present)
- Date-based deal filtering
- Deal status color classification
- Add deal to log state (push to array)
- Inline edit: status update returns correct updated array

**Rate Watch tests:**
- Buy rate trend direction (compare last 2 months — rising/stable/falling)
- Rate change delta calculation (current - prior, in bps)
- YTD rate change (Jan vs current, in bps)
- Monthly payment calculation: P&I for amount/rate/term
- Rate impact per 0.25% change (delta in monthly payment)
- Alert threshold check (current rate vs alert threshold)
- Alert active/inactive filter
- Lender rate sort by current buy rate ascending
- Rate history data shape validation (12 months)
- Market context generation (rate direction string)

Target: 1,020+ tests passing (up from 967)

## Technical Requirements
- Use recharts for all charts (already installed)
- New pages lazy-loaded in App.tsx with React.Suspense
- New sidebar entries use correct section
- Hard-coded demo data only — no backend mutations
- localStorage for persistent UI state (favorites, alerts, YTD)
- TypeScript strict — 0 errors target
- Tests in server/nightly-april17.test.ts using vitest

## Sidebar Placement
- Heat Sheet → Performance section (after Weekend Recap)
- Word Tracks → Coaching section (after Objection Library)
- Desk Log → Operations section (after Deal Funding Tracker)
- Rate Watch → Operations section (after Lender Matrix)

## Commit When Done
git add -A
git commit -m "feat: heat sheet, word track library, desk log, rate watch, expand tests to 1020+"
git push origin main

## Definition of Done
- [ ] HeatSheet.tsx at /heat-sheet with heat scoring, color tiers, factor badges, sort/filter, action modal
- [ ] WordTracks.tsx at /word-tracks with category sidebar, search, 25+ tracks, favorites
- [ ] DeskLog.tsx at /desk-log with deal table, KPI bar, add deal form, CSV export, status colors
- [ ] RateWatch.tsx at /rate-watch with rate trend chart, lender table, alert panel, rate impact calc
- [ ] server/nightly-april17.test.ts with 50+ new tests
- [ ] 1,020+ tests passing
- [ ] 0 TypeScript errors
- [ ] Git commit + push
