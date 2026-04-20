# Manus Deploy Prompt — April 19, 2026

## App Info
- **App:** F&I Co-Pilot (ASURA Group)
- **App ID:** MQskutAJ8qMCMFRFedd6Fn
- **URL:** https://finico-pilot-mqskutaj.manus.space/
- **Auth token:** 8d65f4078e4e44c59387a2c6fe8eb551.4na7S8SMu0zeCtP19dMgEqmH
- **Repo branch:** main
- **Commit to deploy:** latest `main` after April 19 nightly build

## What's New (April 19 build)

Four new pages added tonight:

### 1. Incentive Tracker (`/incentive-tracker`)
- Tracks OEM, lender, and dealer incentive programs
- KPI bar: active incentives, total potential bonus, earned YTD, expiring this month
- 15-program table with source, type, target, payout, expiration, and status
- Earned vs potential BarChart + 12-month earnings AreaChart
- Expiring-soon alert card for programs within 30 days
- Incentive earnings calculator by program and deal count / penetration
- Filters for source, type, and status
- localStorage-backed program tracking
- Sidebar: Business section

### 2. F&I Health Score (`/fi-health`)
- Composite F&I department score with letter grade
- Overall gauge + 6 dimension score cards: PVR, penetration, compliance, CSI, lender relations, team velocity
- Trend chart with 6-month history
- AI-style prescription list ranked by estimated impact
- Score breakdown table with weights, raw values, and benchmark deltas
- Radar comparison across 3 demo locations
- Sidebar: Performance section

### 3. Stip Tracker (`/stip-tracker`)
- Tracks lender stips and deal funding requirements
- KPI bar: open stips, avg days open, cleared today, at-risk deals
- 20-row stip table with priority, status, assigned owner, and notes
- Age-bucket heatmap and 30-day clearance trend chart
- Quick actions per row: submitted, cleared, escalate
- Bulk clear flow and at-risk deals panel
- Filters for lender, priority, status, and assigned manager
- Sidebar: Operations section

### 4. Deal Profit Breakdown (`/deal-profit`)
- Per-deal gross analysis with searchable recent-deal selector
- Deal header with customer, vehicle, lender, manager, and total gross
- Waterfall-style profit chart: front gross, reserve, products, chargebacks, net F&I gross
- Product breakdown table with gross margin % and benchmark deltas
- Reserve efficiency detail: buy/sell rate, spread bps, max reserve, efficiency %
- Money-left-on-table section for missed products
- Comparison vs manager avg, store avg, and top quartile
- Chargeback risk score and penetration efficiency
- Sidebar: Business section

## Test Status
- **1123/1124 passing**
- 0 TypeScript errors
- 1 pre-existing failure remains: `server/deepgram.test.ts` because `DEEPGRAM_API_KEY` is not set
- New coverage added in `server/nightly-april19.test.ts`

## Smoke Test Checklist (after deploy)
- [ ] `/incentive-tracker` — filters work, charts render, calculator updates projected earnings
- [ ] `/fi-health` — overall score renders, trend chart loads, prescriptions and radar chart display
- [ ] `/stip-tracker` — table filters work, age buckets render, at-risk panel shows flagged deals
- [ ] `/deal-profit` — deal selector switches records, waterfall renders, reserve and product tables populate
- [ ] Sidebar — verify new entries appear in correct sections
- [ ] Mobile — verify More drawer includes the new routes in the right categories

## Deploy Command
```
# From Manus dashboard or CLI:
# Pull latest main and redeploy the app
```
