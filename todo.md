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
- [ ] Backend: Grading engine merges custom + federal compliance rules
- [x] Backend: PDF generation endpoint for Coaching Report
- [x] Frontend: Update Start Session modal with customer name, deal number, vehicle fields
- [x] Frontend: Compliance Rules Builder page (admin only)
- [ ] Frontend: Session History table shows customer name and deal number
- [ ] Frontend: Session Detail header shows customer/vehicle info
- [x] Frontend: "Download Report" button on Session Detail
- [ ] Polish: Dashboard KPI cards showing real PVR, PPD, utilization

## Sprint 4 — Verbatim Script Engine & Strict Grading

- [x] DB: Add compliance_rules table (custom rules builder)
- [ ] DB: Add vehicleYear, vehicleMake, vehicleModel to sessions table
- [x] Build asura-scripts.ts: full verbatim script library indexed by category, deal_stage, intent_trigger, source_document
- [x] Rebuild asura-engine.ts: verbatim-only mode, Script Fidelity Scoring (0-100), 7-step process grading, objection pattern → required_script mapping
- [x] Update websocket.ts: structured suggestion payload (script_text, category, deal_stage, source_document, fidelity_score)
- [ ] Update Live Session co-pilot panel: Script Suggestion / Exact Word Track / Process Stage / Execution Score display
- [x] Add scriptFidelityScore field to performanceGrades table
- [x] Update Session Detail and Eagle Eye View to show Script Fidelity Score
- [ ] System validation report endpoint
- [x] Run full test suite and checkpoint

## Bug Fixes (Session 3)
- [x] Fix Vite HMR WebSocket error (clientPort:443 + wss in vite.ts serverOptions)
- [x] Fix PostCSS @import ordering error (move Google Fonts to index.html)
- [x] Patch asura-scripts.ts: add title + urgency fields to all VerbatimScript objects

## Sprint 4 Continued — Script Fidelity Score Integration
- [x] Update runGradingEngine to include Script Fidelity Score (5 sub-scores)
- [x] Update upsertGrade in db.ts to persist all 5 Script Fidelity columns
- [x] Update Session Detail page to display Script Fidelity Score breakdown
- [ ] Update Eagle Eye View to show Script Fidelity Score in leaderboard

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
