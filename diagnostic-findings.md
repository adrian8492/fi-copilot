# F&I Co-Pilot Live Transcription Diagnostic Findings

## Root Cause Analysis

### Finding 1: WebSocket Blocked by Manus Proxy (CONFIRMED)
- Local WebSocket (`ws://127.0.0.1:3000/ws/session`) → WORKS ✅
- Deployed WebSocket (`wss://finico-pilot-mqskutaj.manus.space/ws/session`) → FAILS ❌ (HTTP 200 instead of 101 Upgrade)
- The Manus hosting proxy does NOT forward WebSocket upgrade requests
- Client correctly falls back to HTTP streaming mode

### Finding 2: Deepgram API Key and Connection (CONFIRMED WORKING)
- API key is valid (HTTP 200 from Deepgram projects endpoint)
- Live streaming connection opens successfully from server
- Deepgram Nova-2 model connects and responds

### Finding 3: HTTP Streaming Pipeline Works at Server Level (CONFIRMED)
- POST /api/session/start → Returns token + deepgram mode ✅
- GET /api/session/events → SSE stream opens ✅
- POST /api/session/audio → Receives and forwards audio chunks ✅
- POST /api/session/text → Processes text (but returns ignored:true when Deepgram active) ✅

### Finding 4: OAuth Login Failure (CRITICAL)
- OAuth callback fails with ECONNRESET error
- Users cannot log in to the deployed site
- Without login, they can't start a session at all
- Error: DrizzleQueryError on user insert/update

### Finding 5: No User Session Logs in Browser Console
- No [Pipeline] logs found in browser console
- This means the user never successfully started a live session
- The issue may be upstream: login failure prevents session creation

## Identified Issues

### Issue A: OAuth ECONNRESET (Blocks Everything)
The OAuth callback fails with ECONNRESET, preventing user login.
This is likely a transient database connection issue but blocks all functionality.

### Issue B: WebSocket Blocked by Proxy (Expected, Has Fallback)
The HTTP streaming fallback exists and works. But the fallback has a subtle issue:
when Deepgram connects via HTTP stream, the browser SpeechRecognition text is 
ignored (`ignored: true`). This is correct behavior IF audio chunks are being
sent and Deepgram is transcribing them. But if the browser can't access the
microphone (e.g., in Preview panel), no audio chunks are sent, and no text
fallback works either.

### Issue C: Browser Microphone Access in Preview Panel
The Manus Preview panel may not support getUserMedia (microphone access).
The user needs to open the site directly in a new browser tab, not in the
Preview panel.

## Fix Plan

1. Fix OAuth ECONNRESET with retry logic
2. Improve HTTP streaming resilience
3. Add clear user guidance about opening in a new tab for microphone access
4. Add a diagnostic/health check page accessible from the UI
