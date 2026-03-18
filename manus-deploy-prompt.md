# Manus Deploy Prompt — March 17, 2026
## Copy and paste this into Manus to update the live Co-Pilot

```
Pull the latest code from GitHub and rebuild the F&I Co-Pilot application.

Repository: https://github.com/adrian8492/fi-copilot
Branch: main

What changed (5 new commits):

1. feat(A2): ASURA OPS Scorecard — 4-pillar scoring engine that evaluates F&I sessions against Menu Order System, Upgrade Architecture, Objection Prevention Framework, and Coaching Cadence. Produces a Tier-1 Score (0-100). New UI component with radar chart and pillar breakdown. New "ASURA Scorecard" tab in session detail.

2. feat(C-prep): Delphi AI Clone integration — "Ask Adrian" floating button on every authenticated page. Opens a slide-out panel with an iframe embed. URL configurable via VITE_DELPHI_EMBED_URL environment variable. Set this to the Delphi.ai embed URL when provided.

3. feat(A4): Compliance Checklist Engine — automated compliance scanning against session transcripts. 21 state-specific rules for CA, TX, FL, NY, OH plus federal baseline. ComplianceReport UI with red/yellow/green indicators. Auto-flags non-compliant sessions.

4. feat(B): Dashboard Enhancements — Tier-1 Score column added to Eagle Eye leaderboard (color-coded, sortable). ASURA Scorecard widget on main Dashboard with average score, tier badge, 4-pillar mini-bars, and trend sparkline.

5. docs: overnight build log updated.

Steps:
1. git pull origin main
2. Install any new dependencies: pnpm install
3. Run database migrations (new table: asura_scorecards)
4. Build and deploy
5. Verify 0 TypeScript errors
6. Verify all tests pass

No new environment variables needed except VITE_DELPHI_EMBED_URL (can be set later when Adrian provides the Delphi embed link).
```
