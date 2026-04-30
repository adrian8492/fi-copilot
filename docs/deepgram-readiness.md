# Deepgram Readiness — F&I Co-Pilot

**Purpose:** audit and operating manual for the Deepgram integration. Read
before any live demo, before any production install, and before any
question about transcription cost or failure handling.

**Companion docs:**
- `docs/deployment-runbook.md` — local dev quick-reference
- `docs/privacy-dpa-review.md` — sub-processor and consent posture
- `docs/data-retention-and-delete.md` — what gets stored after transcription

**No secrets in this doc.** Every key is referenced by name only.

---

## Required environment variables

| Var | Where it's read | Required? |
|---|---|---|
| `DEEPGRAM_API_KEY` | `server/websocket.ts` (`createDeepgramConnection` line ~213), `server/http-stream.ts` (`createDeepgramConnection` line ~210) | **No** — server-side falls back to browser SpeechRecognition when missing. But for any real demo or install, this MUST be set. |

Get a key at the Deepgram console (`console.deepgram.com`). Set it locally
in `.env`. Set it in Manus secrets for production. **Never commit.**

## Where the key is read

Two parallel transcription paths exist — same Deepgram engine, different
transports:

1. **WebSocket** (`server/websocket.ts`) — primary path. Browser opens a
   WS to `/ws/transcription/{sessionId}`, audio chunks stream up, server
   creates a Deepgram connection, transcripts stream back over the same WS.
2. **HTTP stream** (`server/http-stream.ts`) — fallback for environments
   that block WebSockets (rare). Long-poll equivalent. Same Deepgram engine
   under the hood.

Both files:
- Read `process.env.DEEPGRAM_API_KEY` at the top of `createDeepgramConnection`.
- Log `DEEPGRAM_API_KEY not set — using browser fallback` when missing.
- Connect to Deepgram's streaming endpoint via the official SDK.
- Emit a `deepgram_status` event to the client on connect / disconnect /
  error so `/live-session` can show a status badge.

## Expected model + config

- **Model:** Nova-2 (Deepgram's most accurate streaming model as of writing).
- **Encoding:** auto-detected from the browser's `MediaRecorder` output
  (typically WebM/Opus). No `encoding` or `sample_rate` is set explicitly —
  Deepgram detects from the audio frames.
- **Diarization:** enabled — speaker labels are written to
  `transcripts.speaker` ("manager" / "customer" / "unknown") via the
  ASURA voice-fingerprint logic in the same files.
- **Smart formatting:** enabled — punctuation, capitalization,
  number formatting are part of the response.
- **Keepalive:** server pings every 2s to prevent Deepgram from closing
  idle WS connections. See `keepalive` interval in
  `createDeepgramConnection`.

To verify the model in flight, watch the server logs after a recording
starts. You should see:
```
[WS] Deepgram connected for session {N}
[WS] Deepgram transcript event: is_final=true, speech_final=true, text="..."
```

## What happens on connection failure

The system fails graceful, not silent:

1. **API key missing.** Server logs
   `[WS] DEEPGRAM_API_KEY not set — using browser fallback`. Client
   `/live-session` falls back to the browser's built-in `SpeechRecognition`
   API (Chrome's `webkitSpeechRecognition`). The session continues; the
   transcript quality drops noticeably (no diarization, slower finalization,
   no smart formatting). The Korum onsite checklist requires verifying
   server-side transcription before the first real recording — exactly
   because this fallback is silent.
2. **API key invalid / expired.** Deepgram returns an auth error on connect.
   Server logs the error, broadcasts `deepgram_status: { connected: false,
   error: "..." }`, and falls back to browser STT. The reconnect logic
   below kicks in.
3. **Mid-session disconnect** (network blip). Server logs
   `[HTTP-Stream] Deepgram disconnected for session {N}` and triggers
   reconnect with exponential backoff. While reconnecting, audio chunks are
   buffered (up to a cap, then dropped). When Deepgram reconnects, buffered
   chunks are flushed.
4. **Mid-session error** (Deepgram-side). Same reconnect path as #3.
5. **Reconnect cap hit.** After a configurable number of attempts, server
   gives up and stays on browser fallback for the rest of the session. Log
   line: `[HTTP-Stream] Reconnecting Deepgram in {N}ms (attempt {M})` shows
   the attempt count.

The client's `LiveSession.tsx` listens for `deepgram_status` events and
updates a small badge in the top-right of the page. During a demo, watch
that badge — green means server-side, yellow/red means fallback.

## Browser microphone permissions

The browser owns mic access. The server cannot grant or test it.

**Chrome / Edge (recommended):**
1. Open `/live-session` in a fresh tab.
2. Click Record. Browser shows a mic permission prompt.
3. Click **Allow**. Optionally check **Remember this decision** so the
   prompt doesn't reappear on the same origin.
4. If permission was previously denied: open the site settings via the
   lock icon in the URL bar → Permissions → Microphone → Allow. Or via
   `chrome://settings/content/microphone`.

**Safari (macOS / iOS):**
- Browser SpeechRecognition support is partial. Server-side Deepgram
  works fine, but the browser fallback (when Deepgram is unavailable) is
  unreliable. Use Chrome on Korum/Paragon laptops for the install.

**Firefox:**
- Server-side Deepgram works. Browser SpeechRecognition has limited
  support — don't rely on the fallback path.

**Permission revoked mid-session.** If the user revokes mic access while
recording, the browser's MediaRecorder fires an error event. The client
catches it and stops the WS upstream. The session row stays in the DB but
no further transcript chunks arrive. Resume requires re-clicking Record
and re-attesting consent.

## Local troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `[WS] DEEPGRAM_API_KEY not set` in server logs | `.env` missing the key | Add to `.env`, restart `pnpm dev` |
| Mic permission prompt doesn't appear | Browser already denied at site level | Clear site settings, hard reload |
| Recording starts but no transcripts arrive | Deepgram WS failed silently in flight | Check server logs for `Deepgram closed` or `Deepgram error`. If Deepgram is unreachable, the system has fallen back to browser STT — verify with the `deepgram_status` badge |
| Audio recorded, transcripts empty | Audio frames aren't reaching Deepgram. Check browser console for WebSocket errors | Verify `/ws/transcription/{N}` route is mounted; verify CORS / proxy config |
| Transcripts arrive but no speaker labels | Diarization is failing — common when only one voice in the room | Ignore for solo demos; for real sessions, verify both manager and customer audio are being captured (mic placement) |

## Production troubleshooting

| Symptom | Where to look first |
|---|---|
| `/api/health` returns `deepgram: missing` | `DEEPGRAM_API_KEY` not set in Manus secrets — fix and redeploy |
| Health is `healthy` but every session falls back to browser | Key is set but invalid (rotated without updating Manus). Verify against the Deepgram console |
| Multiple sessions intermittently fall back mid-recording | Likely Deepgram rate-limit. Check the Deepgram console's usage page; either upgrade plan or stagger recordings |
| Audio recorded but no transcript saved to DB | Deepgram returned interim chunks but no `is_final=true` events. Network issue or session ended mid-utterance. The audio file is preserved in `audio_recordings`; transcript can be regenerated via the Deepgram batch API (post-hoc, not yet wired) |

## Cost / usage monitoring

**Status: not wired.** There is no in-app dashboard for Deepgram usage.
Monitor via the Deepgram console for now:
- Console → Usage → audio minutes consumed
- Console → Billing → current plan + month-to-date charges

**Action item (post-pilot):** add a `GET /api/admin/deepgram-usage` endpoint
that proxies the Deepgram management API and surfaces current usage on the
super-admin dashboard. Not blocking for Korum or Paragon installs.

**Pilot-window estimate:** Korum's 7 managers, ~40 sessions/day average,
~25 min per session = ~7,000 minutes/day. Deepgram Nova-2 streaming at the
standard tier is well within budget for a pilot. Watch the first week's
actuals.

## Verification before any live demo

Before clicking Record in front of Jim Koch or Brian Benstock:

1. Open `/live-session`, click Record.
2. Speak a 10-second test phrase ("Testing one two three, this is a
   transcription smoke test").
3. Confirm transcript appears within 2 seconds with timestamps and a
   speaker label.
4. Confirm the `deepgram_status` badge in the page UI shows green /
   "connected".
5. Stop the test recording. Don't save it as a "real" session.

If any of those four checks fails, the demo is not ready. Stop and triage
before bringing the customer in.

## Deepgram as a sub-processor (legal-side)

Per `docs/legal/dpa-template-v1.md` §5, Deepgram is listed as a sub-
processor handling audio + transcripts in the US. Per `docs/privacy-dpa-
review.md` §2, audio is forwarded over WSS only after Phase 5a two-party
consent is recorded in `consent_logs`. Deepgram does not retain audio
server-side under the default contract (verify in their DPA before
counter-signing the dealer-side DPA).

If a customer revokes consent mid-session, the consent gate flips
`recordingMode` to `manager_only` and the customer-side audio frames are
dropped at the server before they reach the Deepgram WS. The manager-side
audio continues; Deepgram still receives those frames. This is documented
behavior; the consent modal copy makes it clear.
