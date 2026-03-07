import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { Server as HttpServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { insertCopilotSuggestion, insertComplianceFlag, insertTranscript, getSessionById } from "./db";
import { sdk } from "./_core/sdk";
import type { User } from "../drizzle/schema";
import {
  ASURA_COPILOT_SYSTEM_PROMPT,
  ASURA_RESPONSE_CACHE,
  asuraQuickTrigger,
  asuraComplianceCheck,
} from "./asura-engine";
import {
  scanTranscriptForViolations,
  COMPLIANCE_CATEGORY_LABELS,
} from "./compliance-engine";
import {
  retrieveScript,
  detectDealStage,
} from "./asura-scripts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ClientMessage {
  type: "start_session" | "audio_chunk" | "transcript_chunk" | "end_session" | "ping";
  sessionId?: number;
  userId?: number;
  text?: string;
  speaker?: "manager" | "customer" | "unknown";
  startTime?: number;
  endTime?: number;
  confidence?: number;
  isFinal?: boolean;
}

interface ServerMessage {
  type:
    | "connected"
    | "transcript"
    | "suggestion"
    | "compliance_flag"
    | "session_ended"
    | "error"
    | "pong"
    | "analysis_complete"
    | "deepgram_status"
    | "stage_update";
  data?: unknown;
  message?: string;
  timestamp?: number;
}

// ─── Session State ────────────────────────────────────────────────────────────
interface SessionState {
  sessionId: number;
  userId: number;
  startTime: number;
  transcriptBuffer: string[];
  analysisBuffer: string;
  lastAnalysisTime: number;
  elapsedSeconds: number;
  currentDealStage: string;
  // Deepgram
  deepgramConnection: ReturnType<ReturnType<typeof createClient>["listen"]["live"]> | null;
  usingDeepgram: boolean;
  reconnectAttempts: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  keepaliveTimer: ReturnType<typeof setInterval> | null;
  audioBuffer: Buffer[];
  lastFinalText: string;
  // DB failure tracking
  dbFailCount: number;
  // Suggestion deduplication — track recently-fired scriptIds to prevent repeats
  recentScriptIds: Map<string, number>; // scriptId → timestamp
}

const activeSessions = new Map<WebSocket, SessionState>();

// ─── ASURA + Federal Compliance Engine ───────────────────────────────────────
function checkComplianceRules(text: string, elapsedSeconds: number) {
  // Layer 1: ASURA proprietary compliance rules
  const asuraFlags = asuraComplianceCheck(text, elapsedSeconds).map(flag => ({
    severity: flag.severity as "critical" | "warning" | "info",
    rule: flag.rule,
    description: flag.description,
    excerpt: text.substring(0, 200),
    timestamp: elapsedSeconds,
    category: "ASURA_PROPRIETARY",
  }));

  // Layer 2: Federal compliance engine (TILA/Reg Z, ECOA/Reg B, UDAP/UDAAP, CLA/Reg M, Contract, F&I Products)
  const federalViolations = scanTranscriptForViolations(text, elapsedSeconds);
  const federalFlags = federalViolations.map(v => ({
    severity: v.severity,
    rule: v.ruleId,
    description: `[${COMPLIANCE_CATEGORY_LABELS[v.category]}] ${v.description}`,
    excerpt: v.excerpt,
    timestamp: elapsedSeconds,
    category: v.category as string,
    remediation: v.remediation,
  }));

  return [...asuraFlags, ...federalFlags];
}

// ─── ASURA Response Cache (alias for import) ──────────────────────────────────
const RESPONSE_CACHE = ASURA_RESPONSE_CACHE;

// ─── ASURA LLM System Prompt (from asura-engine.ts) ──────────────────────────
const LLM_COPILOT_SYSTEM_PROMPT = ASURA_COPILOT_SYSTEM_PROMPT;

async function generateLLMSuggestion(
  transcriptBuffer: string[],
  sessionContext: { vehicleType?: string; dealType?: string; elapsedSeconds: number }
): Promise<{ type: string; title: string; content: string; script: string; urgency: "high" | "medium" | "low"; framework: string; scriptId: string; triggeredBy: string } | null> {
  try {
    const recentLines = transcriptBuffer.slice(-15).join("\n");
    if (!recentLines.trim()) return null;
    const contextNote = `Session context: ${sessionContext.dealType ?? "retail"} deal, ${sessionContext.vehicleType ?? "vehicle"}, ${Math.floor(sessionContext.elapsedSeconds / 60)}m ${sessionContext.elapsedSeconds % 60}s elapsed.`;
    const { invokeLLM } = await import("./_core/llm.js");
    const response = await invokeLLM({
      messages: [
        { role: "system", content: LLM_COPILOT_SYSTEM_PROMPT },
        { role: "user", content: `${contextNote}\n\nRecent conversation:\n${recentLines}\n\nProvide ONE suggestion as JSON:` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "copilot_suggestion",
          strict: true,
          schema: {
            type: "object",
            properties: {
              type: { type: "string" },
              title: { type: "string" },
              content: { type: "string" },
              script: { type: "string" },
              framework: { type: "string" },
              urgency: { type: "string" },
              triggeredBy: { type: "string" },
              scriptId: { type: "string" },
            },
            required: ["type", "title", "content", "script", "framework", "urgency", "triggeredBy", "scriptId"],
            additionalProperties: false,
          },
        },
      },
    });
    const rawContent = response?.choices?.[0]?.message?.content;
    const raw = typeof rawContent === "string" ? rawContent : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      type: parsed.type ?? "general_tip",
      title: parsed.title ?? "Coaching Tip",
      content: parsed.content ?? "",
      script: parsed.script ?? "",
      urgency: (parsed.urgency === "high" || parsed.urgency === "medium" || parsed.urgency === "low") ? parsed.urgency : "medium",
      framework: parsed.framework ?? "ASURA Elite F&I Methodology",
      scriptId: parsed.scriptId ?? "",
      triggeredBy: parsed.triggeredBy ?? "",
    };
  } catch (err) {
    console.error("[WS] LLM co-pilot error:", err);
    return null;
  }
}

// ─── ASURA Quick Trigger Wrapper ─────────────────────────────────────────────
function generateQuickSuggestion(
  text: string,
  fullTranscript?: string,
  state?: SessionState,
  send?: (msg: ServerMessage) => void
): (typeof RESPONSE_CACHE[string] & { dealStage?: string }) | null {
  // Layer 1: ASURA regex triggers (instant, <5ms)
  const quick = asuraQuickTrigger(text);
  if (quick) return quick;

  // Layer 2: Script library keyword match (asura-scripts.ts)
  const dealStage = fullTranscript ? detectDealStage(fullTranscript) : undefined;
  // Emit stage update if stage changed
  if (dealStage && state && send && dealStage !== state.currentDealStage) {
    state.currentDealStage = dealStage;
    send({ type: "stage_update", data: { stage: dealStage } });
  }
  const matched = retrieveScript(text, dealStage);
  if (matched) {
    return {
      type: matched.scriptCategory as string,
      title: matched.title,
      content: matched.coachingNote ?? "Use the ASURA verbatim script below.",
      script: matched.scriptText,
      urgency: (matched.urgency === "critical" ? "high" : matched.urgency) as "high" | "medium" | "low",
      framework: matched.sourceDocument,
      scriptId: matched.id ?? "",
      dealStage: dealStage ?? matched.dealStage,
    };
  }
  return null;
}

// ─── Deepgram Connection Factory ──────────────────────────────────────────────
function createDeepgramConnection(
  state: SessionState,
  ws: WebSocket,
  send: (msg: ServerMessage) => void
) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    console.warn("[WS] DEEPGRAM_API_KEY not set — using browser fallback");
    return null;
  }

  const deepgram = createClient(apiKey);
  const connection = deepgram.listen.live({
    model: "nova-2",
    language: "en-US",
    smart_format: true,
    diarize: true,
    interim_results: true,
    endpointing: 500,
    punctuate: true,
    utterance_end_ms: 1500,
    vad_events: true,
    // No encoding/sample_rate — Deepgram auto-detects WebM/Opus from browser MediaRecorder
  });

  connection.on(LiveTranscriptionEvents.Open, () => {
    state.usingDeepgram = true;
    state.reconnectAttempts = 0;
    console.log(`[WS] Deepgram connected for session ${state.sessionId}`);
    send({ type: "deepgram_status", data: { connected: true, model: "nova-2" } });

    // Flush any buffered audio chunks that arrived before Deepgram was ready
    if (state.audioBuffer.length > 0) {
      console.log(`[WS] Flushing ${state.audioBuffer.length} buffered audio chunks to Deepgram`);
      for (const chunk of state.audioBuffer) {
        try { connection.send(chunk as unknown as ArrayBuffer); } catch { /* ignore */ }
      }
      state.audioBuffer = [];
    }

    // Keepalive: send a keep-alive ping every 2s to prevent Deepgram from
    // ever closing the connection during pauses in speech.
    if (state.keepaliveTimer) clearInterval(state.keepaliveTimer);
    state.keepaliveTimer = setInterval(() => {
      try {
        if (connection.getReadyState() === 1) {
          // Deepgram SDK keepAlive method sends the proper keep-alive frame
          connection.keepAlive();
        }
      } catch { /* ignore */ }
    }, 2000);
  });

   connection.on(LiveTranscriptionEvents.Transcript, async (data) => {
    const alt = data?.channel?.alternatives?.[0];
    console.log(`[WS] Deepgram transcript event: is_final=${data?.is_final}, speech_final=${(data as any)?.speech_final}, text="${alt?.transcript?.substring(0, 50) ?? '(empty)'}"`);
    if (!alt || !alt.transcript?.trim()) return;
    const isFinal: boolean = data.is_final ?? false;
    const speechFinal: boolean = (data as Record<string, unknown>).speech_final === true;
    const text: string = alt.transcript;
    const confidence: number = alt.confidence ?? 1.0;
    // Speaker diarization: speaker 0 = F&I manager, speaker 1 = customer
    const speakerIndex: number = (alt.words as Array<{ speaker?: number }> | undefined)?.[0]?.speaker ?? 0;
    const speaker: "manager" | "customer" = speakerIndex === 0 ? "manager" : "customer";
    const words = alt.words as Array<{ start?: number; end?: number }> | undefined;
    // Use server elapsed time (seconds) — word-level timestamps from Deepgram are
    // audio-relative and unreliable for display; server elapsed is always accurate.
    const elapsedNow = Math.floor((Date.now() - state.startTime) / 1000);
    const startTime = words?.[0]?.start != null ? Math.round(words[0].start!) : elapsedNow;
    const endTime = words?.[words.length - 1]?.end != null ? Math.round(words[words.length - 1].end!) : undefined;
    // Skip speech_final events (duplicates of is_final)
    if (speechFinal) return;
    
    // Skip duplicate final text (Deepgram can send the same final twice)
    if (isFinal && state.lastFinalText === text) return;
    if (isFinal) state.lastFinalText = text;
    
    send({
      type: "transcript",
      data: { text, speaker, startTime, endTime, isFinal, confidence, source: "deepgram" },
    });

    if (!isFinal) return;

    state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);

    // Persist to DB with retry (insertTranscript now returns boolean)
    const dbOk = await insertTranscript({
      sessionId: state.sessionId,
      speaker,
      text,
      startTime,
      endTime,
      confidence,
      isFinal: true,
    });
    if (!dbOk) {
      state.dbFailCount++;
      console.error(`[WS] insertTranscript failed (total failures: ${state.dbFailCount}) for session ${state.sessionId}`);
      // Notify client every 3 failures so they know transcripts may be lost
      if (state.dbFailCount % 3 === 1) {
        send({ type: "error", message: `Transcript save failed (${state.dbFailCount} failures). Audio recording is still active.` });
      }
    }

    // Compliance check (manager speech only)
    if (speaker === "manager") {
      const flags = checkComplianceRules(text, state.elapsedSeconds);
      for (const flag of flags) {
        try {
          await insertComplianceFlag({ sessionId: state.sessionId, ...flag });
        } catch (err) {
          console.error(`[WS] insertComplianceFlag error:`, err);
        }
        send({ type: "compliance_flag", data: flag });
      }
    }

    // Co-pilot analysis
    state.analysisBuffer += ` ${text}`;
    state.transcriptBuffer.push(`${speaker.toUpperCase()}: ${text}`);
    // Quick regex trigger (instant, <5ms)
    const fullTranscript = state.transcriptBuffer.join(" ");
    const quickSuggestion = generateQuickSuggestion(state.analysisBuffer, fullTranscript, state, send);
    // Dedup: skip if same scriptId fired in last 90 seconds
    const DEDUP_WINDOW_MS = 90_000;
    const now = Date.now();
    if (quickSuggestion) {
      const sid = quickSuggestion.scriptId ?? quickSuggestion.title;
      const lastFired = state.recentScriptIds.get(sid);
      if (lastFired && (now - lastFired) < DEDUP_WINDOW_MS) {
        // Skip duplicate — same script fired recently
        console.log(`[WS] Dedup: skipping duplicate suggestion "${sid}" (fired ${Math.round((now - lastFired) / 1000)}s ago)`);
      } else {
        state.recentScriptIds.set(sid, now);
        const triggered = state.analysisBuffer.substring(0, 100);
        let dbId: number | null = null;
        try {
          dbId = await insertCopilotSuggestion({
            sessionId: state.sessionId,
            type: quickSuggestion.type as Parameters<typeof insertCopilotSuggestion>[0]["type"],
            title: quickSuggestion.title,
            content: quickSuggestion.content,
            script: quickSuggestion.script,
            framework: quickSuggestion.framework,
            scriptId: quickSuggestion.scriptId,
            priority: quickSuggestion.urgency,
            triggeredBy: triggered,
          });
        } catch (err) {
          console.error(`[WS] insertCopilotSuggestion error:`, err);
        }
        send({ type: "suggestion", data: { ...quickSuggestion, id: dbId, triggeredBy: triggered, dealStage: state.currentDealStage } });
      }
      state.analysisBuffer = "";
      state.lastAnalysisTime = Date.now();
    } else {
      // LLM rolling context analysis (every 20s or 50 words)
      const timeSince = now - state.lastAnalysisTime;
      const wordCount = state.analysisBuffer.split(" ").length;
      if (timeSince > 20000 || wordCount > 50) {
        state.lastAnalysisTime = now;
        const llmSuggestion = await generateLLMSuggestion(
          state.transcriptBuffer,
          { elapsedSeconds: state.elapsedSeconds }
        );
        if (llmSuggestion) {
          const llmSid = llmSuggestion.scriptId ?? llmSuggestion.title;
          const llmLastFired = state.recentScriptIds.get(llmSid);
          if (!llmLastFired || (now - llmLastFired) >= DEDUP_WINDOW_MS) {
            state.recentScriptIds.set(llmSid, now);
            let dbId: number | null = null;
            try {
              dbId = await insertCopilotSuggestion({
                sessionId: state.sessionId,
                type: llmSuggestion.type as Parameters<typeof insertCopilotSuggestion>[0]["type"],
                title: llmSuggestion.title,
                content: llmSuggestion.content,
                script: llmSuggestion.script,
                framework: llmSuggestion.framework,
                scriptId: llmSuggestion.scriptId,
                priority: llmSuggestion.urgency,
                triggeredBy: llmSuggestion.triggeredBy.substring(0, 100),
              });
            } catch (err) {
              console.error(`[WS] insertCopilotSuggestion error:`, err);
            }
            send({ type: "suggestion", data: { ...llmSuggestion, id: dbId, dealStage: state.currentDealStage } });
          }
        }
        state.analysisBuffer = "";
      }
    }
  });

  connection.on(LiveTranscriptionEvents.Error, (err) => {
    console.error(`[WS] Deepgram error for session ${state.sessionId}:`, err);
    state.usingDeepgram = false;
    if (state.keepaliveTimer) { clearInterval(state.keepaliveTimer); state.keepaliveTimer = null; }
    // Only tell the client it's disconnected if we've exhausted reconnect attempts
    if (state.reconnectAttempts >= 3) {
      send({ type: "deepgram_status", data: { connected: false, error: "Deepgram error — using browser fallback" } });
    }
    scheduleReconnect(state, ws, send);
  });
  connection.on(LiveTranscriptionEvents.Close, () => {
    if (activeSessions.has(ws)) {
      console.warn(`[WS] Deepgram closed for session ${state.sessionId}`);
      state.usingDeepgram = false;
      if (state.keepaliveTimer) { clearInterval(state.keepaliveTimer); state.keepaliveTimer = null; }
      // Only tell the client it's disconnected if we've exhausted reconnect attempts
      if (state.reconnectAttempts >= 3) {
        send({ type: "deepgram_status", data: { connected: false, error: "Deepgram disconnected — using browser fallback" } });
      }
      scheduleReconnect(state, ws, send);
    }
  });

  return connection;
}

function scheduleReconnect(
  state: SessionState,
  ws: WebSocket,
  send: (msg: ServerMessage) => void
) {
  // No max cap — always reconnect while the session is active.
  // Delay caps at 2s so the user never waits more than 2 seconds.
  const delay = Math.min(300 * Math.pow(1.5, Math.min(state.reconnectAttempts, 5)), 2000);
  state.reconnectAttempts++;
  console.log(`[WS] Reconnecting Deepgram in ${delay}ms (attempt ${state.reconnectAttempts})`);
  if (state.reconnectTimer) clearTimeout(state.reconnectTimer);
  state.reconnectTimer = setTimeout(() => {
    if (activeSessions.has(ws)) {
      state.deepgramConnection = createDeepgramConnection(state, ws, send);
    }
  }, delay);
}

// ─── WebSocket Server Setup ───────────────────────────────────────────────────
export function setupWebSocketServer(server: HttpServer) {
  // Use noServer mode so we manually route HTTP upgrade requests.
  // If we pass { server, path } to WebSocketServer, the ws library registers
  // an 'upgrade' listener that calls abortHandshake(socket, 400) for any
  // path that doesn't match "/ws/session" — including Vite's HMR endpoint.
  // That destroys the socket before Vite can handle it, causing the
  // "[vite] failed to connect to websocket" console error.
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", async (req, socket, head) => {
    const url = req.url ?? "";
    const pathname = url.includes("?") ? url.slice(0, url.indexOf("?")) : url;
    if (pathname === "/ws/session") {
      // Authenticate the WebSocket upgrade request
      let user: User | null = null;
      try {
        user = await sdk.authenticateRequest(req as any);
      } catch {
        console.warn("[WS] Unauthenticated upgrade request rejected");
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }
      wss.handleUpgrade(req, socket as import("net").Socket, head, (ws) => {
        (ws as any).__user = user;
        wss.emit("connection", ws, req);
      });
    }
  });

  wss.on("connection", (ws: WebSocket) => {
    console.log("[WS] New client connected");

    const send = (msg: ServerMessage) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ ...msg, timestamp: Date.now() }));
      }
    };

    ws.on("message", async (raw: Buffer | string, isBinary: boolean) => {
      // ── Binary audio → forward directly to Deepgram ───────────────────────
      if (isBinary) {
        const state = activeSessions.get(ws);
        if (!state) return;
        // Update elapsed time on every audio chunk
        state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
        if (!state.deepgramConnection) {
          console.log(`[WS] Binary chunk received but no Deepgram connection`);
          return;
        }
        try {
          const readyState = state.deepgramConnection.getReadyState();
          if (readyState === 1) {
            state.deepgramConnection.send(raw as unknown as ArrayBuffer);
          } else if (readyState === 0 && state.audioBuffer.length < 50) {
            // Deepgram still connecting — buffer the chunk
            state.audioBuffer.push(Buffer.isBuffer(raw) ? raw : Buffer.from(raw as unknown as ArrayBuffer));
          } else {
            console.log(`[WS] Deepgram not ready (state=${readyState}), dropping audio chunk`);
          }
        } catch (err) {
          console.error(`[WS] Error sending audio to Deepgram:`, err);
        }
        return;
      }

      // ── JSON control messages ──────────────────────────────────────────────
      let msg: ClientMessage;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        send({ type: "error", message: "Invalid message format" });
        return;
      }

      switch (msg.type) {
        case "ping":
          send({ type: "pong" });
          break;

        case "start_session": {
          if (!msg.sessionId || !msg.userId) {
            send({ type: "error", message: "sessionId and userId required" });
            return;
          }
          // Validate session ownership: the authenticated user must own this session
          const wsUser = (ws as any).__user as User | null;
          const wsSession = await getSessionById(msg.sessionId);
          if (wsUser && wsSession && wsSession.userId !== wsUser.id) {
            send({ type: "error", message: "Not authorized for this session" });
            return;
          }
          // CFPB: Block recording unless consent was obtained
          if (wsSession && !wsSession.consentObtained) {
            send({ type: "error", message: "CONSENT_REQUIRED: Recording consent must be obtained before streaming." });
            return;
          }
          const state: SessionState = {
            sessionId: msg.sessionId,
            userId: msg.userId,
            startTime: Date.now(),
            transcriptBuffer: [],
            analysisBuffer: "",
            lastAnalysisTime: Date.now(),
            elapsedSeconds: 0,
            currentDealStage: "introduction",
            deepgramConnection: null,
            usingDeepgram: false,
            reconnectAttempts: 0,
            reconnectTimer: null,
            keepaliveTimer: null,
            audioBuffer: [],
            lastFinalText: "",
            dbFailCount: 0,
            recentScriptIds: new Map(),
          };
          activeSessions.set(ws, state);
          state.deepgramConnection = createDeepgramConnection(state, ws, send);

          send({
            type: "connected",
            data: {
              sessionId: msg.sessionId,
              message: "Session started. Recording active.",
              transcriptionMode: state.deepgramConnection ? "deepgram" : "browser",
            },
          });
          console.log(`[WS] Session ${msg.sessionId} started — Deepgram: ${!!state.deepgramConnection}`);
          break;
        }

        // Browser SpeechRecognition fallback (text-based, used when Deepgram is unavailable)
        case "transcript_chunk": {
          const state = activeSessions.get(ws);
          if (!state || !msg.text) return;
          if (state.usingDeepgram) return; // Ignore browser fallback if Deepgram is active

          state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
          const speaker = msg.speaker ?? "unknown";

          if (msg.isFinal !== false) {
            await insertTranscript({
              sessionId: state.sessionId,
              speaker,
              text: msg.text,
              startTime: msg.startTime,
              endTime: msg.endTime,
              confidence: msg.confidence,
              isFinal: msg.isFinal ?? true,
            });
          }

          send({
            type: "transcript",
            data: { text: msg.text, speaker, startTime: msg.startTime, isFinal: msg.isFinal ?? true, confidence: msg.confidence, source: "browser" },
          });

          state.analysisBuffer += ` ${msg.text}`;
          state.transcriptBuffer.push(`${speaker.toUpperCase()}: ${msg.text}`);
          if (speaker === "manager" && msg.isFinal !== false) {
            const flags = checkComplianceRules(msg.text, state.elapsedSeconds);
            for (const flag of flags) {
              await insertComplianceFlag({ sessionId: state.sessionId, ...flag });
              send({ type: "compliance_flag", data: flag });
            }
          }
          // Quick regex trigger (instant)
          const fullTx = state.transcriptBuffer.join(" ");
          const quickSugg = generateQuickSuggestion(state.analysisBuffer, fullTx, state, send);
          const DEDUP_MS = 90_000;
          const nowMs = Date.now();
          if (quickSugg) {
            const sid = quickSugg.scriptId ?? quickSugg.title;
            const lastFired = state.recentScriptIds.get(sid);
            if (lastFired && (nowMs - lastFired) < DEDUP_MS) {
              console.log(`[WS] Dedup (browser): skipping "${sid}"`);
            } else {
              state.recentScriptIds.set(sid, nowMs);
              const triggered = state.analysisBuffer.substring(0, 100);
              let dbId: number | null = null;
              try {
                dbId = await insertCopilotSuggestion({
                  sessionId: state.sessionId,
                  type: quickSugg.type as Parameters<typeof insertCopilotSuggestion>[0]["type"],
                  title: quickSugg.title,
                  content: quickSugg.content,
                  script: quickSugg.script,
                  framework: quickSugg.framework,
                  scriptId: quickSugg.scriptId,
                  priority: quickSugg.urgency,
                  triggeredBy: triggered,
                });
              } catch (err) { console.error(`[WS] insertCopilotSuggestion error:`, err); }
              send({ type: "suggestion", data: { ...quickSugg, id: dbId, triggeredBy: triggered, dealStage: state.currentDealStage } });
            }
            state.analysisBuffer = "";
            state.lastAnalysisTime = nowMs;
          } else {
            const timeSince = nowMs - state.lastAnalysisTime;
            const wordCount = state.analysisBuffer.split(" ").length;
            if (timeSince > 20000 || wordCount > 50) {
              state.lastAnalysisTime = nowMs;
              const llmSugg = await generateLLMSuggestion(
                state.transcriptBuffer,
                { elapsedSeconds: state.elapsedSeconds }
              );
              if (llmSugg) {
                const llmSid = llmSugg.scriptId ?? llmSugg.title;
                const llmLast = state.recentScriptIds.get(llmSid);
                if (!llmLast || (nowMs - llmLast) >= DEDUP_MS) {
                  state.recentScriptIds.set(llmSid, nowMs);
                  let dbId: number | null = null;
                  try {
                    dbId = await insertCopilotSuggestion({
                      sessionId: state.sessionId,
                      type: llmSugg.type as Parameters<typeof insertCopilotSuggestion>[0]["type"],
                      title: llmSugg.title,
                      content: llmSugg.content,
                      script: llmSugg.script,
                      framework: llmSugg.framework,
                      scriptId: llmSugg.scriptId,
                      priority: llmSugg.urgency,
                      triggeredBy: llmSugg.triggeredBy.substring(0, 100),
                    });
                  } catch (err) { console.error(`[WS] insertCopilotSuggestion error:`, err); }
                  send({ type: "suggestion", data: { ...llmSugg, id: dbId, dealStage: state.currentDealStage } });
                }
              }
              state.analysisBuffer = "";
            }
          }
          break;
        }
        case "end_session": {
          const state = activeSessions.get(ws);
          if (!state) return;
          // Give Deepgram 1.5s to drain any final transcripts before closing
          if (state.deepgramConnection) {
            try {
              const dgReady = state.deepgramConnection.getReadyState();
              if (dgReady === 1) {
                console.log(`[WS] Draining Deepgram for session ${state.sessionId} (1.5s)...`);
                await new Promise<void>((resolve) => setTimeout(resolve, 1500));
              }
              state.deepgramConnection.requestClose();
            } catch { /* ignore */ }
          }
          if (state.reconnectTimer) clearTimeout(state.reconnectTimer);
          if (state.keepaliveTimer) clearInterval(state.keepaliveTimer);
          // Compute final elapsed time
          const finalElapsed = Math.floor((Date.now() - state.startTime) / 1000);
          state.elapsedSeconds = finalElapsed;
          activeSessions.delete(ws);
          send({ type: "session_ended", data: { sessionId: state.sessionId, durationSeconds: finalElapsed, dbFailCount: state.dbFailCount } });
          console.log(`[WS] Session ${state.sessionId} ended after ${finalElapsed}s (DB failures: ${state.dbFailCount})`);
          break;
        }
      }
    });

    ws.on("close", () => {
      const state = activeSessions.get(ws);
      if (state) {
        if (state.deepgramConnection) { try { state.deepgramConnection.requestClose(); } catch { /* ignore */ } }
        if (state.reconnectTimer) clearTimeout(state.reconnectTimer);
        activeSessions.delete(ws);
      }
      console.log("[WS] Client disconnected");
    });

    ws.on("error", (err: Error) => {
      console.error("[WS] Error:", err);
      activeSessions.delete(ws);
    });
  });

  console.log("[WS] WebSocket server ready at /ws/session");
  return wss;
}
