# Overnight Build Plan — Mar 5 (Continue through 7 AM)

## Priority 1: Critical Bug Fixes
- [ ] Fix duplicate final transcript entries (speech_final creates duplicates)
- [ ] Fix speech fragmentation (increase utterance_end_ms to 1500ms)
- [ ] Fix process % stuck at 0% in live session

## Priority 2: Sprint 3 Remaining
- [ ] Session History table: show customer name and deal number columns
- [ ] Grading engine: merge custom compliance rules with federal rules
- [ ] Dashboard KPI polish: ensure all 6 cards pull real DB data

## Priority 3: Sprint 4 Remaining  
- [ ] Live Session co-pilot panel: Script Suggestion / Exact Word Track / Process Stage / Execution Score display
- [ ] Eagle Eye View: show Script Fidelity Score in leaderboard table
- [ ] System validation report endpoint

## Priority 4: UX Polish & New Features
- [ ] Audio waveform visualization on playback UI
- [ ] "No Microphone Detected" banner for environments without mic access
- [ ] Session export (PDF transcript + grade + coaching report bundle)
- [ ] Email notifications for critical compliance alerts
- [ ] Date range filter on Eagle Eye View

## Priority 5: Overnight Build Unchecked Items (already done but not marked)
- Mark all items that are actually complete as [x]

## Priority 6: Test Suite Expansion
- [ ] Expand to 120+ tests
- [ ] Add tests for scorecard, recording playback, compliance banners
- [ ] Add tests for session history customer info
- [ ] Add integration tests for grading engine with custom rules

## Priority 7: Final Verification
- [ ] Use Anthropic connector to audit all features
- [ ] 0 TypeScript errors
- [ ] All tests passing
- [ ] Save final checkpoint
- [ ] Schedule 7 AM report

## API/Third-Party Status
- Deepgram: API key already configured (DEEPGRAM_API_KEY secret set)
- No additional API keys needed for current features
- Future: DMS integration will need dealer-specific API credentials
