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
- [ ] Custom compliance rule builder
