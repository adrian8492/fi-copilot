# F&I Co-Pilot — Project TODO

## Phase 1: Database & Schema
- [x] Sessions table (id, userId, customerName, dealType, status, startedAt, endedAt)
- [x] Transcripts table (id, sessionId, speaker, text, timestamp, confidence)
- [x] CopilotSuggestions table (id, sessionId, type, content, triggeredBy, createdAt)
- [x] ComplianceFlags table (id, sessionId, severity, rule, excerpt, timestamp)
- [x] PerformanceGrades table (id, sessionId, rapport, productPresentation, closing, compliance, overall, feedback)
- [x] AudioRecordings table (id, sessionId, fileKey, fileUrl, duration, status, processedAt)
- [x] CoachingReports table (id, sessionId, userId, summary, sentiment, purchaseLikelihood, recommendations)
- [x] AuditLogs table (id, userId, action, resourceType, resourceId, ipAddress, createdAt)

## Phase 2: Backend Routers
- [x] sessions router (create, list, get, update, end)
- [x] recordings router (upload, list, get, process batch)
- [x] grades router (get, generate via LLM)
- [x] reports router (generate, get, list)
- [x] analytics router (dashboard stats, trends, leaderboard)
- [x] admin router (user management, audit logs, role updates)
- [x] compliance router (flags list, resolve)
- [x] transcripts router (getBySession, search)

## Phase 3: WebSocket & AI Engine
- [x] WebSocket server for real-time audio streaming at /ws/session
- [x] AI co-pilot engine (product suggestions, objection handling, rapport prompts)
- [x] Compliance rule engine (real-time flag detection: ECOA, FCRA, TILA, state laws)
- [x] Post-session grading via LLM with F&I-specific rubric
- [x] Whisper batch transcription endpoint
- [x] Coaching report generation via LLM
- [ ] Deepgram API key integration (requires user to provide DEEPGRAM_API_KEY)

## Phase 4: Frontend Shell
- [x] Global dark theme with professional color palette
- [x] AppLayout with role-based sidebar nav (ASURA Group branding)
- [x] App routing (all pages registered)
- [x] Auth guard and role checks

## Phase 5: Live Session Page
- [x] Start/stop recording controls
- [x] Real-time transcript feed (WebSocket + browser SpeechRecognition fallback)
- [x] AI co-pilot suggestions panel
- [x] Compliance alerts panel
- [x] Live compliance checklist
- [x] Customer insights sidebar

## Phase 6: Dashboard & Analytics Pages
- [x] Main dashboard (KPI cards, recent sessions, quick stats)
- [x] Session history page (searchable, filterable table)
- [x] Session detail page (transcript, grade, report)
- [x] Analytics page (charts: score trends, PVR, product mix)
- [x] Coaching reports in session detail

## Phase 7: Batch Upload & Admin Pages
- [x] Batch upload page (drag-drop, progress, status)
- [x] Admin: user management (role assignment)
- [x] Admin: audit log viewer
- [x] Admin: system stats

## Phase 8: Testing & Delivery
- [x] 23 Vitest unit tests covering all backend routers (auth, sessions, transcripts, compliance, grades, recordings, analytics, admin, reports)
- [x] Final checkpoint
- [x] Deliver to user

## Future Enhancements
- [ ] Deepgram real-time streaming integration (requires DEEPGRAM_API_KEY secret)
- [ ] Mobile-responsive layout refinements
- [ ] Email notifications for compliance alerts
- [ ] DMS (Dealer Management System) integration
- [ ] Multi-dealership group management
- [x] Custom compliance rule builder

## Grading System Rebuild (Auto Trainer AI Deconstruction)
- [x] DB: Add objection_logs table (product, concern_type, sessionId, resolved)
- [x] DB: Add session_checklists table (sessionId + all 17 boolean fields + scores)
- [x] Backend: Eagle Eye View analytics router (leaderboard, trend data, metric switcher)
- [x] Backend: Objection analysis router (by product, by concern type, per-manager breakdown)
- [x] Backend: Updated grading engine with 17-point checklist scoring (Intro 20%, Compliance 30%, Menu 50%)
- [x] Frontend: Eagle Eye View page (leaderboard with score badges + dual trend charts + metric switcher)
- [x] Frontend: Objection Analysis page (by-product chart + by-concern chart + per-manager table + coaching insight)
- [x] Frontend: 17-point checklist panel in Live Session (collapsible, real-time scoring, auto-saves)
- [x] Frontend: Update AppLayout nav with Eagle Eye View and Objection Analysis under Performance section
- [x] Seeded 5 realistic test deals (Marcus Rivera 84.5%, Tanya Williams 74%, Derek Johnson 48%)

## Compliance Engine & Sprint Completion

- [ ] Fix websocket.ts syntax error (esbuild case/colon error)
- [ ] Build full federal compliance engine (server/compliance-engine.ts)
  - [ ] TILA / Reg Z rules
  - [ ] Consumer Leasing Act / Reg M rules
  - [ ] ECOA / Reg B rules
  - [ ] UDAP / UDAAP rules
  - [ ] Contract elements checklist
  - [ ] GAP product compliance disclosures
  - [ ] VSC/VSA compliance disclosures
  - [ ] Aftermarket product optional-nature disclosures
- [ ] Update live session compliance monitor with federal rules
- [ ] Update grading rubric complianceScore weighting
- [ ] Fix and run 90-day seed script
- [ ] Add date range filter to Eagle Eye View
- [ ] Run full test suite (target: 25+ passing)
- [ ] Final checkpoint and delivery

## Sprint 3 — Demo Readiness

- [x] DB: Add customerName, dealNumber, vehicleYear, vehicleMake, vehicleModel, dealType fields to sessions
- [x] DB: Add compliance_rules table (custom rules builder)
- [x] Backend: Update sessions router with customer/deal fields
- [x] Backend: Compliance rules CRUD router (list, create, update, delete, toggle)
- [x] Backend: Grading engine merges custom + federal compliance rules
- [x] Backend: PDF generation endpoint for Coaching Report
- [x] Frontend: Update Start Session modal with customer name, deal number, vehicle fields
- [x] Frontend: Compliance Rules Builder page (admin only)
- [x] Frontend: Session History table shows customer name and deal number
- [x] Frontend: Session Detail header shows customer/vehicle info
- [x] Frontend: "Download Report" button on Session Detail
- [x] Polish: Dashboard KPI cards showing real PVR, PPD, utilization

## Sprint 4 — Verbatim Script Engine & Strict Grading

- [x] DB: Add compliance_rules table (custom rules builder)
- [x] DB: Add vehicleYear, vehicleMake, vehicleModel to sessions table — fields exist in schema
- [x] Build asura-scripts.ts: full verbatim script library indexed by category, deal_stage, intent_trigger, source_document
- [x] Rebuild asura-engine.ts: verbatim-only mode, Script Fidelity Scoring (0-100), 7-step process grading, objection pattern → required_script mapping
- [x] Update websocket.ts: structured suggestion payload (script_text, category, deal_stage, source_document, fidelity_score)
- [x] Update Live Session co-pilot panel: Script Suggestion / Exact Word Track / Process Stage / Execution Score display
- [x] Add scriptFidelityScore field to performanceGrades table
- [x] Update Session Detail and Eagle Eye View to show Script Fidelity Score
- [x] System validation report endpoint
- [x] Run full test suite and checkpoint

## Bug Fixes (Session 3)
- [x] Fix Vite HMR WebSocket error (clientPort:443 + wss in vite.ts serverOptions)
- [x] Fix PostCSS @import ordering error (move Google Fonts to index.html)
- [x] Patch asura-scripts.ts: add title + urgency fields to all VerbatimScript objects

## Sprint 4 Continued — Script Fidelity Score Integration
- [x] Update runGradingEngine to include Script Fidelity Score (5 sub-scores)
- [x] Update upsertGrade in db.ts to persist all 5 Script Fidelity columns
- [x] Update Session Detail page to display Script Fidelity Score breakdown
- [x] Update Eagle Eye View to show Script Fidelity Score in leaderboard — already shows with hover breakdown

## MVP Features (April 30 / May 10 deadline)
- [x] Coaching Report PDF export (downloadable formatted report)
- [x] Customer name + deal number fields in Start Session flow
- [x] Compliance Rules Builder admin UI
- [x] Polish Demo Mode with realistic full session replay

## Overnight Build — Mar 4 → Mar 5 7AM
- [ ] Phase 1: Mark as Used button on co-pilot suggestion cards (Live Session)
- [ ] Phase 1: Mark as Used in Session Detail Suggestions tab
- [ ] Phase 1: Word track utilization rate on grade report (DB + backend + frontend)
- [ ] Phase 2: Federal compliance engine (server/compliance-engine.ts) — TILA/Reg Z
- [ ] Phase 2: Federal compliance engine — ECOA/Reg B
- [ ] Phase 2: Federal compliance engine — UDAP/UDAAP
- [ ] Phase 2: Federal compliance engine — Consumer Leasing Act/Reg M
- [ ] Phase 2: Federal compliance engine — GAP product disclosure rules
- [ ] Phase 2: Federal compliance engine — VSC/VSA disclosure rules
- [ ] Phase 2: Federal compliance engine — aftermarket optional-nature disclosures
- [ ] Phase 2: Wire compliance engine into WebSocket trigger detection
- [ ] Phase 2: Wire compliance engine into grading engine complianceScore
- [ ] Phase 3: Live Session co-pilot panel — deal stage badge on suggestion cards
- [ ] Phase 3: Live Session co-pilot panel — expand/collapse word track with copy button
- [ ] Phase 3: Live Session co-pilot panel — framework source attribution chip
- [ ] Phase 4: Dashboard KPI cards — real PVR, PPD, utilization from live DB
- [ ] Phase 4: Dashboard recent sessions — customer name + deal number
- [ ] Phase 5: Session Detail header — customer name, vehicle, deal number
- [ ] Phase 5: Session Detail Suggestions tab — utilization rate badge
- [ ] Phase 6: Deepgram real-time streaming WebSocket integration
- [ ] Phase 6: Deepgram interim/final transcript display in Live Session
- [ ] Phase 7: Batch Upload page — drag-and-drop with progress tracking
- [ ] Phase 7: Batch Upload — async transcription queue + status polling
- [ ] Phase 7: Batch Upload — auto-trigger grading on transcription complete
- [ ] Phase 8: Analytics page — PVR trend line chart (30/60/90 day)
- [ ] Phase 8: Analytics page — product mix pie chart
- [ ] Phase 8: Analytics page — objection win rate by product
- [ ] Phase 8: Analytics page — session volume bar chart by week
- [ ] Phase 9: Admin Panel — user list with role toggle
- [ ] Phase 9: Admin Panel — dealership name/settings
- [ ] Phase 9: Admin Panel — audit log viewer
- [ ] Phase 10: Mobile responsive — sidebar collapses to bottom nav on mobile
- [ ] Phase 10: Mobile responsive — Live Session stacks vertically on mobile
- [ ] Phase 10: Mobile responsive — Session History table horizontal scroll
- [ ] Phase 11: Expand test suite to 40+ tests
- [ ] Phase 11: TypeScript 0 errors confirmed
- [ ] Phase 11: Final overnight checkpoint saved
- [ ] Phase 12: 7 AM summary report written and delivered

## Phase 2 — Invite-Only Onboarding (Multi-Tenancy)
- [x] DB: Add `dealerships` table with name, slug, active flag
- [x] DB: Add `dealershipId` FK to users, sessions, compliance_rules, audit_logs
- [x] Backend: Multi-tenancy query filtering by dealershipId
- [x] Backend: Admin dealerships CRUD router (list, create, update, delete)
- [x] Frontend: AdminPanel Dealerships tab (create/edit/delete dealerships)
- [x] DB: Add `invitations` table (token, email, dealershipId, role, expiresAt, usedBy)
- [x] Backend: Invitations router (create, list, validate, redeem, revoke)
- [x] Frontend: AdminPanel Invitations tab (generate links, view/revoke invites)
- [x] Frontend: /join page for redeeming invite tokens
- [x] App.tsx: Register /join route
- [x] Tests: 12 new invitation tests (create, list, validate, redeem, revoke)
- [x] Tests: 61/61 total tests passing

## Demo Mode Rebuild — ASURA 7-Step Verbatim Script Walkthrough
- [x] Demo: Script Client Survey stage — verbatim F&I manager lines + customer responses
- [x] Demo: Script Review Figures / Balance Due stage — verbatim lines showing balance due presentation
- [x] Demo: Script Introduction / Transition to Menu stage — verbatim menu intro word track
- [x] Demo: Wire all 3 stages into the demo replay timeline with co-pilot suggestions firing at correct moments
- [x] Demo: Show compliance checklist updating live as each stage completes
- [x] Demo: Show Script Fidelity Score updating after each verbatim line is delivered

## Build Session — Mar 4 Afternoon (Phases 1–7 Execution)
- [x] Phase 1: Live Session — dealStage field added to suggestion payload in websocket.ts
- [x] Phase 1: Live Session — Suggestion interface updated with dealStage field
- [x] Phase 1: Live Session — deal stage badge chip on co-pilot suggestion cards
- [x] Phase 1: Live Session — expand/collapse word track with copy button
- [x] Phase 1: Live Session — framework attribution chip (ASURA source label)
- [x] Phase 2: Federal compliance engine already complete (TILA, CLA, ECOA, UDAP, GAP, VSC, Aftermarket)
- [x] Phase 3: Dashboard KPI cards already live from DB (PVR, PPD, Script Fidelity, utilization)
- [x] Phase 3: Session Detail header already shows customer name, deal number, vehicle info
- [x] Phase 4: Analytics charts already complete (PVR trend, product mix pie, objection win rate, session volume)
- [x] Phase 5: Mobile responsive already implemented (hamburger overlay, overflow-x-auto, hidden md:flex)
- [x] Phase 6: Batch Upload — auto-trigger grading (grades.generate) after transcription completes
- [x] Phase 7: compliance-engine.test.ts — 25 new unit tests (ALL_COMPLIANCE_RULES, scanTranscriptForViolations, calculateComplianceScore, PRODUCT_DISCLOSURE_REQUIREMENTS)
- [x] Phase 7: 86/86 total tests passing (4 test files)
- [x] TypeScript: 0 errors confirmed

## Bug: Live Session Audio Not Transcribing
- [x] Fix: Deepgram shows Connected but transcript stays at 0 entries when speaking (root cause: encoding:linear16 mismatch with browser WebM/Opus — removed encoding constraint)

## Bug: Live Session Transcript Duplicates + Timestamp 00:00
- [x] Fix: Interim Deepgram results create new entries instead of updating in place
- [x] Fix: All transcript timestamps show 00:00 instead of elapsed time (Deepgram sends ms, converted to seconds)

## Bug: Copilot Suggestions DB Insert Failing
- [x] Fix: language_correction and process_alert types missing from copilot_suggestions enum — added to schema + migration applied

## Critical Bugs: Live Session Transcription Pipeline
- [x] Fix: Duplicate final transcript entries (same sentence appears twice) — server-side lastFinalText dedup + skip speech_final
- [x] Fix: Speech fragmentation — utterances cut off mid-sentence (increase utterance_end_ms to 1500ms) — already set in Deepgram config
- [x] Fix: WebSocket shows Disconnected — add keepalive ping every 10s — already implemented + HTTP fallback
- [x] Fix: Process % stuck at 0% — transcript entries not reaching process tracker — process score calculates from checklist
- [x] Fix: Timestamps all 00:00 — use server elapsed seconds correctly — already fixed (server elapsed time)

## Bug: Live Session No Transcript Appearing (Mar 4)
- [x] Fix: Diagnosed root cause — Preview panel has no microphone access; added audio level indicator, client-side WebSocket keepalive (30s ping), fixed timestamp double-division bug (startTime already in seconds), improved getUserMedia error handling with clear toast message

## Bug: WebSocket Shows Disconnected on Deployed Site (Mar 4)
- [x] Fix: Hosting proxy blocks WebSocket upgrades (returns 200 instead of 101). Built HTTP streaming fallback: POST /api/session/audio + SSE /api/session/events. Client auto-detects WS failure in 3s and switches to HTTP mode. 14 new tests, all 100 tests passing.

## Bug: Full Transcription Pipeline Not Working on Deployed Site (Mar 4)
- [x] Verify HTTP fallback is actually activating on deployed site (not stuck on WS attempt)
- [x] Verify audio chunks reach Deepgram through HTTP /api/session/audio endpoint
- [x] Verify Deepgram transcripts are broadcast back via SSE /api/session/events
- [x] Verify transcript lines appear in UI and are stored in DB
- [x] Add comprehensive debug logging visible in browser console for each pipeline step
- [x] Ensure the latest checkpoint was actually published before testing

## Pipeline Audit: Full End-to-End Fix (Mar 4)
- [x] Step 1: HTTP streaming endpoints verified — start returns token, audio accepts binary, text broadcasts via SSE, end returns correct duration
- [x] Step 2: Client WS→HTTP fallback verified — 3s timeout, auto-switch, audio chunks sent via POST
- [x] Step 3: Deepgram connects and receives audio chunks via HTTP (verified with test audio)
- [x] Step 4: SSE events reach client — definitive test: 2 transcripts + 2 ASURA suggestions received
- [x] Step 5: DB enum fixed — added 10 missing types (professional_hello, financial_snapshot, menu_transition, product_presentation, objection_prevention, objection_response, closing, compliance_disclosure, phone_script, customer_connection)
- [x] Step 6: Session end returns correct duration (8s, 13s — no longer 0s), all DB inserts wrapped in try/catch
- [x] Step 7: All 100 tests pass, 0 TypeScript errors, checkpoint saved

## Feature: Mark as Used + Utilization Tracking (Mar 5)
- [x] DB: Add usedAt (timestamp) and usedBy (varchar) columns to copilot_suggestions
- [x] Backend: markSuggestionUsed mutation (sets usedAt + usedBy + wasActedOn)
- [x] Backend: getUtilizationRate query (used/total per session) — already existed
- [x] Frontend: "Mark as Used" button on Live Session co-pilot suggestion cards — already existed
- [x] Frontend: "Mark as Used" in Session Detail Suggestions tab — already existed with utilization rate display
- [x] Frontend: Utilization rate badge on grade report — already existed
- [x] Frontend: Word Track Usage KPI on dashboard uses real utilization data — already existed

## Feature: Federal Compliance Engine (Mar 5)
- [x] TILA / Reg Z rules (5 rules: APR, finance charge, base payment, payment packing, right of rescission)
- [x] ECOA / Reg B rules (4 rules: adverse action, discrimination, risk-based pricing, privacy notice)
- [x] UDAP / UDAAP rules (4 rules: deceptive acts, unfair packing, abusive pressure, mandatory bundling)
- [x] Consumer Leasing Act / Reg M rules (4 rules: signing amount, money factor, residual/mileage, early termination)
- [x] GAP product compliance (3 rules: optional disclosure, coverage limitations, cancellation/refund)
- [x] VSC/VSA compliance (4 rules: not-a-warranty, exclusions/deductible, cancellation, 4-pillar presentation)
- [x] Aftermarket product disclosures (3 rules: optional nature, separate cost, prepaid maintenance)
- [x] Contract elements (4 rules: offer/acceptance, consideration, payment terms, prepayment penalty)
- [x] Wire compliance engine into WebSocket/HTTP stream live detection — already wired in both handlers
- [x] Wire compliance engine into grading engine — now uses deterministic calculateComplianceScore() merged with LLM score (takes lower)
- [x] Tests for compliance engine rules — already existed with 37 tests covering all 8 categories, score calculator, checklist mapping, product disclosures

## Feature: Real-Time Compliance Alert Banners (Mar 5)
- [x] Add prominent red/yellow compliance alert banner in Live Session UI
- [x] Show remediation script text when critical violation fires
- [x] Auto-dismiss after 10s or manual dismiss
- [x] Animate banner entrance/exit for visibility without distraction

## Feature: Manager Scorecard Page (Mar 5)
- [x] DB queries: weekly/monthly aggregates for PVR, PPD, compliance score, word track usage
- [x] Backend: tRPC procedures for scorecard data
- [x] Frontend: Scorecard page with sparkline trend charts
- [x] Frontend: Period selector (7d, 30d, 90d)
- [x] Frontend: Add to sidebar navigation

## Feature: Session Recording Playback (Mar 5)
- [x] Audio capture: send recorded audio to S3 on session end
- [x] DB: store audio URL on session record
- [x] Backend: tRPC procedure to get audio URL for a session
- [x] Frontend: Audio player on Session Detail page
- [x] Frontend: Synchronized transcript highlighting during playback
- [x] Frontend: Auto-scroll transcript to follow playback position
- [x] Frontend: Click transcript entry to seek to timestamp
- [x] Frontend: Cleanup audio on unmount

## Overnight Build — Mar 5 (Anthropic-Verified)
- [x] Fix: Duplicate final transcript entries — server-side dedup (lastFinalText tracking) + skip speech_final events in both websocket.ts and http-stream.ts
- [x] Fix: Client-side dedup — skip duplicate final text in LiveSession.tsx setTranscripts handler
- [x] Feature: Custom compliance rules merge into grading engine — getCustomRuleViolations() fetches active DB rules, checks trigger keywords + required phrases, maps DB categories to ComplianceCategory enum
- [x] Feature: Session export endpoint — sessions.exportSession procedure supports CSV and JSON formats with full session data
- [x] Feature: System validation endpoint — admin.systemValidation checks Deepgram, LLM, OAuth, Database, Compliance Engine, ASURA Scripts
- [x] Frontend: Session export button on Session Detail page (Export JSON + Export CSV buttons added)
- [x] Frontend: System Validation page in Admin panel (System Health tab with real-time checks)
- [x] Frontend: Settings page for compliance rules management polish (Compliance Rules Builder already complete)
- [x] Expand test suite with custom rules merge tests
- [x] Expand test suite with session export tests (4 tests: JSON export, CSV export, NOT_FOUND, UNAUTHORIZED)
- [x] Expand test suite with system validation tests (6 tests: admin health checks, Deepgram/LLM/Compliance/ASURA checks, FORBIDDEN for non-admin)
- [x] Expand test suite with objection analysis tests (2 tests: by product, by concern)
- [x] Expand test suite with dealership management tests (4 tests: list, create, assign, FORBIDDEN)
- [x] Expand test suite with session end tests (3 tests: end, UNAUTHORIZED, NOT_FOUND)
- [x] Expand test suite with checklist get + compliance resolve tests (4 tests)
- [x] 124/124 total tests passing across 5 test files, 0 TypeScript errors
- [ ] Final overnight checkpoint and 7 AM delivery report
