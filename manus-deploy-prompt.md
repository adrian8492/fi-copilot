# Manus Deploy Prompt — April 20, 2026

## App Info
- **App:** F&I Co-Pilot (ASURA Group)
- **App ID:** MQskutAJ8qMCMFRFedd6Fn
- **URL:** https://finico-pilot-mqskutaj.manus.space/
- **Auth token:** 8d65f4078e4e44c59387a2c6fe8eb551.4na7S8SMu0zeCtP19dMgEqmH
- **Repo branch:** main
- **Commit to deploy:** latest `main` after April 20 nightly build

## What's New (April 20 build)

Four new pages added tonight:

### 1. Contract Checklist (`/contract-checklist`)
- Pre-funding contract audit tool for validating fundable deals before they leave the box
- Deal selector with 15 demo deals showing customer, date, and lender
- Checklist grouped into Identification Docs, Credit Documents, F&I Product Contracts, Rate/Markup Disclosures, Signature Completeness, and Lender Stipulations
- Progress bar with red/yellow/green thresholds and a Ready to Fund badge at 100%
- KPI bar: total items, complete, pending, missing, estimated time to clear
- Critical-items panel for all required incomplete items
- Per-section progress status, editable notes, print action, and submit button gated until fully complete
- Sidebar: Operations section

### 2. F&I Manager Report Card (`/report-card`)
- Monthly report card for individual F&I managers with school-style letter grade and GPA
- Manager selector for 8 demo managers and month picker for last 6 months
- Grade header with initials avatar, manager name, month, overall grade, score, and GPA
- Weighted grade breakdown table across PVR, product penetration, compliance, coaching adherence, and customer satisfaction
- 6-month trend LineChart, radar chart, and peer comparison bar chart
- AI-style coaching narrative plus improvement plan for the bottom 2 categories
- Clipboard share and print actions
- Sidebar: Performance section

### 3. Funding Queue (`/funding-queue`)
- Funding pipeline view for all pending, submitted, approved, funded, and chargeback deals
- KPI bar: total in queue, funded today, avg days to fund, oldest deal, total dollars pending
- Deal table with status tabs, aging filter, lender filter, color-coded rows, priority flags, and stip counts
- Bulk actions for selected rows: mark as submitted or funded
- Slide-out deal detail panel with stip checklist, lender contact, risk note, notes, and quick actions
- Funding velocity BarChart for last 14 days
- Chargeback risk alert panel and end-of-day clipboard summary button
- Sidebar: Operations section

### 4. Gross Per Unit Tracker (`/gpu-tracker`)
- GPU dashboard for F&I and front-end gross trends across time and managers
- KPI cards: total GPU, F&I GPU, front-end GPU, combined gross, best month, best manager
- Monthly ComposedChart with F&I GPU bars, front GPU bars, and target line
- Manager ranking horizontal bar chart
- Product-line stacked bar chart for VSC, GAP, Paint, Tire & Wheel, and Ancillary
- GPU distribution histogram and radial target-vs-actual gauge
- GPU benchmarks panel for national average, top 25%, and top 10%
- Date-range and manager filters plus clipboard CSV export
- Sidebar: Business section

## Test Status
- **1180/1181 passing**
- 0 TypeScript errors
- 1 pre-existing failure remains: `server/deepgram.test.ts` because `DEEPGRAM_API_KEY` is not set
- New coverage added in `server/nightly-april20.test.ts` with 57 tests

## Smoke Test Checklist (after deploy)
- [ ] `/contract-checklist` — deal selector changes records, progress updates, critical items show correctly, submit button only enables at 100%
- [ ] `/report-card` — manager/month switching works, grade header updates, charts render, share/print actions respond
- [ ] `/funding-queue` — status tabs and filters work, bulk actions update rows, slide-out detail panel opens, end-of-day summary copies cleanly
- [ ] `/gpu-tracker` — date-range and manager filters update charts, radial gauge renders, benchmark panel reflects current GPU, export copies CSV
- [ ] Sidebar — verify Report Card, Contract Checklist, Funding Queue, and GPU Tracker appear in the correct sections
- [ ] Mobile — verify More drawer includes the new pages in the correct categories

## Deploy Command
```
# From Manus dashboard or CLI:
# Pull latest main and redeploy the app
```
