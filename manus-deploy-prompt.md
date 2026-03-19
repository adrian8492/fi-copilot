# Manus Deploy Prompt — March 18, 2026
## Copy and paste this into Manus to deploy the F&I Co-Pilot

```
Pull the latest code from GitHub and rebuild the F&I Co-Pilot application.

Repository: https://github.com/adrian8492/fi-copilot
Branch: main

What changed (10 commits since last deploy):

1. feat(A2): ASURA OPS Scorecard — 4-pillar scoring engine (Menu Order, Upgrade Architecture, Objection Prevention, Coaching Cadence). Tier-1 Score 0-100. RadarChart UI. "ASURA Scorecard" tab in session detail.

2. feat(C-prep): Delphi AI Clone — "Ask Adrian" floating button on all authenticated pages. Slide-out iframe panel. Configurable via VITE_DELPHI_EMBED_URL env var.

3. feat(A4): Compliance Checklist Engine — 21 state-specific rules (CA/TX/FL/NY/OH + federal). ComplianceReport UI with red/yellow/green indicators. Auto-flags critical violations.

4. feat(B): Dashboard Enhancements — Tier-1 Score column in Eagle Eye leaderboard. ASURA Scorecard widget on main dashboard with sparkline.

5. feat(D-E-F-G): Bug fixes + Live Co-Pilot Panel + Session Export + Eagle Eye:

   Phase D — Bug fixes:
   - Transcript deduplication by utterance ID (no more duplicate lines)
   - utterance_end_ms increased to 1500ms (fixes speech fragmentation)
   - WebSocket progress events fixed (% no longer stuck at 0)

   Phase E — Live Session Co-Pilot Panel:
   - Real-time 6-step ASURA process stage indicator (detects which step is happening)
   - Script suggestions with exact word tracks per stage
   - Live execution score updating every 30 seconds
   - Compliance alert banner for risk phrases

   Phase F — Session Export PDF:
   - "Export PDF" button on every session detail page
   - Exports: transcript + ASURA scorecard + compliance report + top 5 coaching priorities
   - ASURA-branded PDF with dark navy header
   - Endpoint: GET /api/sessions/:id/export/pdf

   Phase G — Eagle Eye Enhancements:
   - Script Fidelity Score column (% of recommended phrases used)
   - Date range filter (Last 7/30/90 days / All time)
   - All columns now sortable
   - Export CSV button for DP/GM review

6. feat(A3): F&I Product Intelligence Database:
   - 9-product F&I intelligence database (VSA, GAP, Tire & Wheel, Key Replacement, Maintenance, Sealant, Windshield, Window Tint, Active Theft)
   - Each product has: category, cost ranges, dealer cost, commission structure, objections, ASURA talk tracks, state restrictions, upsell relationships
   - Product recommendation engine analyzes session transcripts to detect missed/improvable products
   - "Product Intelligence" tab in session detail page with recommendations, missed revenue, expandable product cards, full catalog browser
   - New DB migration: 0019_product_intelligence_fields.sql (adds 8 columns to product_intelligence table)
   - 21 new tests for product data integrity and recommendation engine

Steps:
1. git pull origin main
2. pnpm install (new dependencies added for PDF generation)
3. Run ALL database migrations in order: check drizzle/migrations/ for any new .sql files not yet run
4. Build and deploy
5. Verify 0 TypeScript errors
6. Verify all tests pass

Environment variables needed:
- VITE_DELPHI_EMBED_URL=https://delphi.ai/adriananania/embed (set this now — enables "Ask Adrian" button)
- All existing env vars (DATABASE_URL, DEEPGRAM_API_KEY, etc.) should already be set

After deploy, verify:
- The "Ask Adrian" button appears bottom-right on all pages
- The ASURA Scorecard tab appears in session detail
- The "Product Intelligence" tab appears in session detail (after ASURA Scorecard)
- The "Export PDF" button works on a completed session
- The Eagle Eye date range filter works
- No console errors on the live session page
```
