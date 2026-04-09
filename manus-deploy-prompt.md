# Manus Deploy Prompt — F&I Co-Pilot
**Updated:** April 8, 2026 — Verified and ready to deploy

## What to Deploy

Deploy the latest build of the F&I Co-Pilot application from the GitHub repository to the Manus hosting environment.

**App ID:** MQskutAJ8qMCMFRFedd6Fn  
**Current URL:** https://finico-pilot-mqskutaj.manus.space/

## What's New in This Build

### Build a9c98bc — April 6, 2026 (verified April 8)
- **Lender Matrix Dashboard:** `/lender-matrix` — lender comparison workspace for structuring finance deals. Includes KPI bar (Avg Buy Rate, Avg Sell Rate, Avg Reserve Spread, Approval Rate, Avg Funding Time), 10-lender comparison table, grouped buy-rate vs sell-rate chart, Best Lender Finder ranked by reserve opportunity for selected score/amount/term, funding speed chart, reserve opportunity heatmap by credit tier, and date/tier filtering.
- **Deal Jacket Viewer:** `/deal-jacket` — digital deal jacket for recent deals. Includes searchable deal selector, summary header (customer, vehicle, deal type, lender, rate, term, payment), required-document checklist with complete/pending/missing states, product summary with gross profit, compliance flag card, gross breakdown visualization, ASURA deal score badge, full timeline, and print-ready layout.
- **Weekend Recap Report:** `/weekend-recap` — Monday-morning executive summary view. Includes total deals, total F&I revenue, avg PVR, prior-week delta, penetration, top manager, biggest win, ranked manager scoreboard, week-over-week product comparison chart, wins/opportunities cards, daily PVR trend, coaching focus insights, clipboard share, and print layout.
- **Commission Calculator:** `/commission-calculator` — F&I income estimator. Includes base pay / commission / product flat / deal volume / back gross / bonus inputs, current-vs-ASURA-vs-top-1% scenario cards, 12-month cumulative earnings projection, income-vs-PVR slider, pay-plan presets, YTD earnings tracker saved in localStorage, and share/print actions.
- **Mobile Bottom Navigation:** mobile-only fixed bottom tab bar with 5 primary destinations (Dashboard, Live Session, History, Analytics, More), active-state underline, safe-area padding, dark-mode support, and slide-up categorized drawer for the rest of the application.
- **Navigation Updates:** added Deal Jacket to core nav, Weekend Recap to Performance, Lender Matrix to Operations, and Commission Calculator to Business.
- **Test Suite:** 897/898 passing. Added 79 new tests in `server/nightly-april6.test.ts`. The only failing test remains the pre-existing `server/deepgram.test.ts` environment-variable failure.
- **TypeScript:** 0 errors.

### Build 5878ed6 — April 5, 2026
- **ROI Calculator:** `/roi-calculator` — Sales tool for DPs and GMs to see ASURA coaching financial impact. Input panel with 5 adjustable parameters (Current Avg PVR, Monthly Deal Volume, Number of F&I Managers, Current Product Penetration %, Monthly Coaching Investment). Output panel showing Projected PVR After ASURA (+$759 avg lift), Projected Monthly/Annual Revenue Increase, ROI Multiplier, Payback Period. "Before vs After" side-by-side comparison cards (PVR, Revenue, Penetration, Products per Deal). 12-month revenue projection chart (recharts Area: with vs without ASURA coaching). Sensitivity slider (±$200 from $759 baseline for conservative/aggressive scenarios). Share Report button (copies formatted summary to clipboard). Print-ready layout. Hero text references $200M+ in F&I revenue generated for clients. New "Business" sidebar section.
- **Product Payoff Tracker:** `/payoff-tracker` — Cancellation and claims analytics for F&I products. Top KPI bar (Total Products Sold MTD, Cancellation Rate %, Claims Rate %, Net Retention Revenue). 8-product retention table (VSC, GAP, Tire & Wheel, Paint Protection, Maintenance Plan, Theft Deterrent, Windshield, Key Replacement) showing Units Sold, Units Cancelled, Cancel Rate %, Claims Filed, Claims Paid, Avg Claim Cost, Net Revenue After Cancellations. 12-month cancellation trend chart (recharts Line, toggleable per product). Cancellation Window bar chart (0-30, 31-60, 61-90, 91-180, 180+ days since sale). Manager cancellation comparison table. "At Risk" alert cards (products with >5% MoM cancellation increase). Date range filter (MTD/Last 30/Last 90/YTD). CSV export. Added to sidebar under Operations.
- **Manager Schedule:** `/schedule` — Weekly F&I manager floor coverage scheduler. Grid layout (Mon-Sat × 9AM-8PM in 1-hour blocks). Click cell to assign a manager from dropdown. 4 color-coded managers. Coverage Score per time slot (red = 0 managers/unstaffed, yellow = 1/adequate, green = 2+/optimal). Weekly summary cards (Total Scheduled Hours per manager, Gap Hours, Peak Coverage Time). "Auto-Fill" button distributes managers evenly. Conflict detection (warns >50 hours/week). All localStorage persisted. Added to sidebar under Coaching.
- **Compliance Scorecard:** `/compliance-scorecard` — Per-manager compliance health scorecard. Summary KPIs (Avg Compliance Score, % Managers in Green, Most Improved, Most At-Risk). Manager scorecard cards with 5 compliance categories (TILA, ECOA, UDAP, State Law, Internal Policy). Color coding (Green ≥90, Yellow 70-89, Red <70). Compliance Trend sparkline per manager (last 8 weeks). Drill-down view (click manager → last 10 compliance events grouped by rule type). Compliance Leaderboard ranked by overall score. Risk Profile classification (Low Risk/Moderate Risk/High Risk based on scores and trend direction). Required Training auto-recommendations (score <70 → specific ASURA compliance module). Date range filter (Last 30/60/90). Added to sidebar under Admin after Compliance Audit.
- **Dark Mode Toggle:** Sun/moon icon in AppLayout sidebar footer. Tailwind dark class strategy with CSS variables. Persisted in localStorage key `fi-copilot-theme`. System preference detection via `prefers-color-scheme` media query. Dark palette: slate-900 backgrounds, slate-800 cards, slate-100 text, slate-700 borders, blue-600 accent. Recharts charts respect theme via CSS variables.
- **Test Suite:** 818/819 passing (1 pre-existing deepgram env failure — acceptable). +98 new tests in nightly-april5.test.ts covering ROI calculations, payoff tracking, schedule management, compliance scoring, dark mode.
- **TypeScript:** 0 errors

## Deploy Steps

1. Pull latest from GitHub: `git pull origin main`
2. Install dependencies: `pnpm install`
3. Build: `pnpm build`
4. Start: `pnpm start`
5. Verify these routes:
   - `/lender-matrix`
   - `/deal-jacket`
   - `/weekend-recap`
   - `/commission-calculator`
6. Verify mobile bottom nav on a narrow viewport
7. Verify at: https://finico-pilot-mqskutaj.manus.space/

## Current Stats
- **Total Pages:** 43
- **Tests:** 897/898 passing (1 pre-existing deepgram env failure)
- **TypeScript:** 0 errors
- **Sidebar Sections:** Core, Performance, Coaching, Operations, Business, Admin
- **Mobile Navigation:** bottom tab bar + More drawer

## Environment
- Node.js required
- pnpm for package management
- Environment variables from `.env` (see `.env.example`)
- PostgreSQL database (Drizzle ORM)
- Deepgram API key for live transcription (optional for demo mode; currently causes the single known test failure when unset)
