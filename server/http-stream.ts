/**
 * HTTP Streaming Fallback for Live Sessions
 *
 * When the hosting proxy blocks WebSocket upgrades, the client falls back to:
 *   POST /api/session/start   → start a session (returns sessionId + streamToken)
 *   POST /api/session/audio   → send audio chunks (binary body)
 *   POST /api/session/text    → send browser SpeechRecognition text
 *   GET  /api/session/events  → SSE stream for transcript/suggestion/compliance events
 *   POST /api/session/end     → end session
 *
 * Internally reuses the same Deepgram + ASURA engine logic from websocket.ts.
 */

import { Router, Request, Response, NextFunction } from "express";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { insertCopilotSuggestion, insertComplianceFlag, insertTranscript, getSessionById, getConsentLogBySession } from "./db";
import { sdk } from "./_core/sdk";
import type { User } from "../drizzle/schema";
import {
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
import { invokeLLM } from "./_core/llm";

// ─── Types ───────────────────────────────────────────────────────────────────
interface StreamSession {
  sessionId: number;
  userId: number;
  startTime: number;
  transcriptBuffer: string[];
  analysisBuffer: string;
  lastAnalysisTime: number;
  elapsedSeconds: number;
  currentDealStage: string;
  deepgramConnection: ReturnType<ReturnType<typeof createClient>["listen"]["live"]> | null;
  usingDeepgram: boolean;
  reconnectAttempts: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  keepaliveTimer: ReturnType<typeof setInterval> | null;
  // SSE clients listening for events
  sseClients: Set<Response>;
  // Token for auth
  token: string;
  // Per-session audio chunk counter
  audioChunkCount: number;
  // Buffer audio chunks that arrive before Deepgram is ready
  audioBuffer: Buffer[];
  lastFinalText: string;
  // DB failure tracking
  dbFailCount: number;
  // Suggestion deduplication
  recentScriptIds: Map<string, number>;
  // Event queue for polling fallback
  eventQueue: Array<{ seq: number; event: string; data: unknown; ts: number }>;
  eventSeq: number;
}

// Active HTTP-stream sessions keyed by token
const httpSessions = new Map<string, StreamSession>();

function generateToken(): string {
  return `hs_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ─── Broadcast to all SSE clients ────────────────────────────────────────────
function broadcast(session: StreamSession, event: string, data: unknown) {
  // Buffer event in queue for polling clients
  session.eventSeq++;
  session.eventQueue.push({ seq: session.eventSeq, event, data, ts: Date.now() });
  // Cap at 500 entries — drop oldest
  if (session.eventQueue.length > 500) {
    session.eventQueue = session.eventQueue.slice(-500);
  }

  // Push to SSE clients
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  session.sseClients.forEach((res) => {
    try { res.write(payload); } catch { session.sseClients.delete(res); }
  });
}

// ─── Compliance Engine (same as websocket.ts) ────────────────────────────────
function checkComplianceRules(text: string, elapsedSeconds: number) {
  const asuraFlags = asuraComplianceCheck(text, elapsedSeconds).map(flag => ({
    severity: flag.severity as "critical" | "warning" | "info",
    rule: flag.rule,
    description: flag.description,
    excerpt: text.substring(0, 200),
    timestamp: elapsedSeconds,
    category: "ASURA_PROPRIETARY",
  }));

  const federalViolations = scanTranscriptForViolations(text, elapsedSeconds);
  const federalFlags = federalViolations.map(v => ({
    severity: v.severity as "critical" | "warning" | "info",
    rule: `${COMPLIANCE_CATEGORY_LABELS[v.category] ?? v.category}: ${v.ruleId}`,
    description: v.description,
    excerpt: text.substring(0, 200),
    timestamp: elapsedSeconds,
    category: v.category,
  }));

  return [...asuraFlags, ...federalFlags];
}

// ─── Quick Suggestion (same as websocket.ts) ─────────────────────────────────
function generateQuickSuggestion(
  text: string,
  fullTranscript?: string,
  state?: StreamSession,
): { type: string; title: string; content: string; script: string; urgency: string; framework: string; scriptId: string; dealStage?: string } | null {
  const quick = asuraQuickTrigger(text);
  if (quick) return quick;

  const dealStage = fullTranscript ? detectDealStage(fullTranscript) : undefined;
  if (dealStage && state && dealStage !== state.currentDealStage) {
    state.currentDealStage = dealStage;
    broadcast(state, "stage_update", { stage: dealStage });
  }
  const matched = retrieveScript(text, dealStage);
  if (matched) {
    return {
      type: matched.scriptCategory as string,
      title: matched.title,
      content: matched.coachingNote ?? "Use the ASURA verbatim script below.",
      script: matched.scriptText,
      urgency: matched.urgency,
      framework: matched.sourceDocument,
      scriptId: matched.id ?? "",
      dealStage: dealStage ?? matched.dealStage,
    };
  }
  return null;
}

// ─── LLM Suggestion (same as websocket.ts) ───────────────────────────────────
const RESPONSE_CACHE: Record<string, unknown> = {};

async function generateLLMSuggestion(
  transcriptBuffer: string[],
  context: { elapsedSeconds: number }
) {
  const recentTranscript = transcriptBuffer.slice(-10).join("\n");
  const cacheKey = recentTranscript.substring(0, 100);
  if (RESPONSE_CACHE[cacheKey]) return null;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an elite F&I coaching assistant. Analyze the conversation and provide ONE actionable coaching suggestion. Focus on: product presentation opportunities, objection handling techniques, compliance requirements, or closing strategies. Be specific and reference ASURA methodology when applicable. Elapsed time: ${context.elapsedSeconds}s.`,
        },
        { role: "user", content: `Recent F&I conversation:\n${recentTranscript}\n\nProvide ONE coaching suggestion as JSON.` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "coaching_suggestion",
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
    RESPONSE_CACHE[cacheKey] = true;
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
    console.error("[HTTP-Stream] LLM co-pilot error:", err);
    return null;
  }
}

// ─── Deepgram Connection Factory ─────────────────────────────────────────────
function createDeepgramConnection(state: StreamSession) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    console.warn("[HTTP-Stream] DEEPGRAM_API_KEY not set — using browser fallback");
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
  });

  connection.on(LiveTranscriptionEvents.Open, () => {
    state.usingDeepgram = true;
    state.reconnectAttempts = 0;
    console.log(`[HTTP-Stream] Deepgram connected for session ${state.sessionId}`);
    broadcast(state, "deepgram_status", { connected: true, model: "nova-2" });

    // Flush any buffered audio chunks that arrived before Deepgram was ready
    if (state.audioBuffer.length > 0) {
      console.log(`[HTTP-Stream] Flushing ${state.audioBuffer.length} buffered audio chunks to Deepgram`);
      for (const chunk of state.audioBuffer) {
        try { connection.send(chunk as unknown as ArrayBuffer); } catch { /* ignore */ }
      }
      state.audioBuffer = [];
    }

    if (state.keepaliveTimer) clearInterval(state.keepaliveTimer);
    state.keepaliveTimer = setInterval(() => {
      try {
        if (connection.getReadyState() === 1) {
          connection.keepAlive();
        }
      } catch { /* ignore */ }
    }, 2000);
  });

  connection.on(LiveTranscriptionEvents.Transcript, async (data) => {
    const alt = data?.channel?.alternatives?.[0];
    if (!alt || !alt.transcript?.trim()) return;
    const isFinal: boolean = data.is_final ?? false;
    const speechFinal: boolean = (data as Record<string, unknown>).speech_final === true;
    const text: string = alt.transcript;
    const confidence: number = alt.confidence ?? 1.0;
    const speakerIndex: number = (alt.words as Array<{ speaker?: number }> | undefined)?.[0]?.speaker ?? 0;
    const speaker: "manager" | "customer" = speakerIndex === 0 ? "manager" : "customer";
    const words = alt.words as Array<{ start?: number; end?: number }> | undefined;
    const elapsedNow = Math.floor((Date.now() - state.startTime) / 1000);
    const startTime = words?.[0]?.start != null ? Math.round(words[0].start!) : elapsedNow;
    const endTime = words?.[words.length - 1]?.end != null ? Math.round(words[words.length - 1].end!) : undefined;

    // Skip speech_final events (duplicates of is_final)
    if (speechFinal) return;
    
    // Skip duplicate final text
    if (isFinal && state.lastFinalText === text) return;
    if (isFinal) state.lastFinalText = text;
    
    broadcast(state, "transcript", { text, speaker, startTime, endTime, isFinal, confidence, source: "deepgram" });

    if (!isFinal) return;

    state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
    console.log(`[HTTP-Stream] Deepgram transcript (session ${state.sessionId}): "${text.substring(0, 60)}" [${speaker}] final=${isFinal}`);

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
      console.error(`[HTTP-Stream] insertTranscript failed (total failures: ${state.dbFailCount}) for session ${state.sessionId}`);
      if (state.dbFailCount % 3 === 1) {
        broadcast(state, "error", { message: `Transcript save failed (${state.dbFailCount} failures). Audio recording is still active.` });
      }
    }


    try {
      if (speaker === "manager") {
        const flags = checkComplianceRules(text, state.elapsedSeconds);
        for (const flag of flags) {
          try { await insertComplianceFlag({ sessionId: state.sessionId, ...flag }); } catch (e) { console.error("[HTTP-Stream] insertComplianceFlag error:", e); }
          broadcast(state, "compliance_flag", flag);
        }
      }
    } catch (err) {
      console.error("[HTTP-Stream] compliance error:", err);
    }

    state.analysisBuffer += ` ${text}`;
    state.transcriptBuffer.push(`${speaker.toUpperCase()}: ${text}`);

    try {
      const fullTranscript = state.transcriptBuffer.join(" ");
      const quickSuggestion = generateQuickSuggestion(state.analysisBuffer, fullTranscript, state);
      const DEDUP_MS = 90_000;
      const nowMs = Date.now();
      if (quickSuggestion) {
        const sid = (quickSuggestion.scriptId as string) ?? (quickSuggestion.title as string);
        const lastFired = state.recentScriptIds.get(sid);
        if (lastFired && (nowMs - lastFired) < DEDUP_MS) {
          console.log(`[HTTP-Stream] Dedup: skipping "${sid}"`);
        } else {
          state.recentScriptIds.set(sid, nowMs);
          const triggered = state.analysisBuffer.substring(0, 100);
          let dbId: number | null = null;
          try {
            dbId = await insertCopilotSuggestion({
              sessionId: state.sessionId,
              type: quickSuggestion.type as Parameters<typeof insertCopilotSuggestion>[0]["type"],
              title: quickSuggestion.title as string,
              content: quickSuggestion.content as string,
              script: quickSuggestion.script as string,
              framework: quickSuggestion.framework as string,
              scriptId: quickSuggestion.scriptId as string,
              priority: (quickSuggestion.urgency ?? "medium") as "high" | "medium" | "low",
              triggeredBy: triggered,
            });
          } catch (e) { console.error("[HTTP-Stream] insertCopilotSuggestion error:", e); }
          broadcast(state, "suggestion", { ...quickSuggestion, id: dbId, triggeredBy: triggered, dealStage: state.currentDealStage });
        }
        state.analysisBuffer = "";
        state.lastAnalysisTime = nowMs;
      } else {
        const timeSince = nowMs - state.lastAnalysisTime;
        const wordCount = state.analysisBuffer.split(" ").length;
        if (timeSince > 20000 || wordCount > 50) {
          state.lastAnalysisTime = nowMs;
          const llmSugg = await generateLLMSuggestion(state.transcriptBuffer, { elapsedSeconds: state.elapsedSeconds });
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
              } catch (e) { console.error("[HTTP-Stream] insertCopilotSuggestion LLM error:", e); }
              broadcast(state, "suggestion", { ...llmSugg, id: dbId, dealStage: state.currentDealStage });
            }
          }
          state.analysisBuffer = "";
        }
      }
    } catch (err) {
      console.error("[HTTP-Stream] suggestion processing error:", err);
    }
  });

  connection.on(LiveTranscriptionEvents.Error, (err) => {
    console.error(`[HTTP-Stream] Deepgram error for session ${state.sessionId}:`, err);
    state.usingDeepgram = false;
    if (state.keepaliveTimer) { clearInterval(state.keepaliveTimer); state.keepaliveTimer = null; }
    if (state.reconnectAttempts >= 3) {
      broadcast(state, "deepgram_status", { connected: false, error: "Deepgram error — using browser fallback" });
    }
    scheduleReconnect(state);
  });

  connection.on(LiveTranscriptionEvents.Close, () => {
    console.warn(`[HTTP-Stream] Deepgram closed for session ${state.sessionId}`);
    state.usingDeepgram = false;
    if (state.keepaliveTimer) { clearInterval(state.keepaliveTimer); state.keepaliveTimer = null; }
    if (state.reconnectAttempts >= 3) {
      broadcast(state, "deepgram_status", { connected: false, error: "Deepgram disconnected — using browser fallback" });
    }
    scheduleReconnect(state);
  });

  return connection;
}

function scheduleReconnect(state: StreamSession) {
  const delay = Math.min(300 * Math.pow(1.5, Math.min(state.reconnectAttempts, 5)), 2000);
  state.reconnectAttempts++;
  console.log(`[HTTP-Stream] Reconnecting Deepgram in ${delay}ms (attempt ${state.reconnectAttempts})`);
  if (state.reconnectTimer) clearTimeout(state.reconnectTimer);
  state.reconnectTimer = setTimeout(() => {
    if (httpSessions.has(state.token)) {
      state.deepgramConnection = createDeepgramConnection(state);
    }
  }, delay);
}

// ─── Express Router ──────────────────────────────────────────────────────────
export function createHttpStreamRouter(): Router {
  const router = Router();

  // ─── Auth middleware: authenticate all HTTP-stream requests ────────────────
  const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await sdk.authenticateRequest(req as any);
      (req as any).__user = user;
      next();
    } catch {
      res.status(401).json({ error: "Authentication required" });
    }
  };

  // POST /api/session/start — Initialize an HTTP-stream session
  router.post("/start", requireAuth, async (req: Request, res: Response) => {
    const { sessionId } = req.body;
    const authUser = (req as any).__user as User;
    const userId = authUser?.id ?? req.body.userId;
    if (!sessionId || !userId) {
      return res.status(400).json({ error: "sessionId required" });
    }

    // Validate session ownership
    const session = authUser ? await getSessionById(sessionId) : null;
    if (authUser && session && session.userId !== authUser.id) {
      return res.status(403).json({ error: "Not authorized for this session" });
    }
    // Phase 5a two-party consent gate (consent_logs takes precedence; legacy
    // session.consentObtained is the fallback for pre-Phase-5a sessions).
    const consentLog = await getConsentLogBySession(sessionId);
    if (consentLog) {
      if (consentLog.revokedAt) {
        return res.status(403).json({ error: "CONSENT_REVOKED: Recording consent was revoked for this session." });
      }
      if (consentLog.recordingMode !== "recording") {
        return res.status(403).json({ error: "CONSENT_INCOMPLETE: Both customer and manager must consent before recording." });
      }
    } else if (session && !session.consentObtained) {
      return res.status(403).json({ error: "CONSENT_REQUIRED: Recording consent must be obtained before streaming." });
    }

    const token = generateToken();
    const state: StreamSession = {
      sessionId,
      userId,
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
      sseClients: new Set(),
      token,
      audioChunkCount: 0,
      audioBuffer: [],
      lastFinalText: "",
      dbFailCount: 0,
      recentScriptIds: new Map(),
      eventQueue: [],
      eventSeq: 0,
    };

    state.deepgramConnection = createDeepgramConnection(state);
    httpSessions.set(token, state);

    console.log(`[HTTP-Stream] Session ${sessionId} started (token: ${token.slice(0, 10)}...) — Deepgram: ${!!state.deepgramConnection}`);
    res.json({
      token,
      transcriptionMode: state.deepgramConnection ? "deepgram" : "browser",
    });
  });

  // GET /api/session/events?token=xxx — SSE event stream
  router.get("/events", (req: Request, res: Response) => {
    const token = req.query.token as string;
    const state = token ? httpSessions.get(token) : undefined;
    if (!state) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    });
    res.write("event: connected\ndata: {\"ok\":true}\n\n");

    state.sseClients.add(res);
    console.log(`[HTTP-Stream] SSE client connected for session ${state.sessionId} (${state.sseClients.size} clients)`);

    // Keepalive comment every 15s to prevent proxy timeout
    const keepalive = setInterval(() => {
      try { res.write(": keepalive\n\n"); } catch { clearInterval(keepalive); }
    }, 15000);

    req.on("close", () => {
      state.sseClients.delete(res);
      clearInterval(keepalive);
      console.log(`[HTTP-Stream] SSE client disconnected for session ${state.sessionId} (${state.sseClients.size} remaining)`);
    });
  });

  // POST /api/session/audio — Receive binary audio chunk
  router.post("/audio", (req: Request, res: Response) => {
    const token = req.headers["x-stream-token"] as string;
    const state = token ? httpSessions.get(token) : undefined;
    if (!state) {
      return res.status(404).json({ error: "Session not found" });
    }

    state.audioChunkCount++;
    const bodyLen = Buffer.isBuffer(req.body) ? req.body.length : 0;
    if (state.audioChunkCount <= 5 || state.audioChunkCount % 40 === 0) {
      console.log(`[HTTP-Stream] Audio chunk #${state.audioChunkCount} received (${bodyLen} bytes) for session ${state.sessionId}`);
    }

    // Update elapsed time on every audio chunk so duration is always current
    state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);

    if (!state.deepgramConnection) {
      if (state.audioChunkCount <= 2) console.log(`[HTTP-Stream] No Deepgram connection — browser fallback mode`);
      return res.status(200).json({ ok: true, mode: "browser" });
    }

    try {
      const readyState = state.deepgramConnection.getReadyState();
      if (readyState === 1) {
        // Deepgram is open — send directly
        state.deepgramConnection.send(req.body as unknown as ArrayBuffer);
      } else if (readyState === 0) {
        // Deepgram is still connecting — buffer the chunk (max 50 chunks ~ 12.5s at 250ms)
        if (state.audioBuffer.length < 50) {
          state.audioBuffer.push(Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body as ArrayBuffer));
          if (state.audioChunkCount <= 3) console.log(`[HTTP-Stream] Buffering audio chunk #${state.audioChunkCount} (Deepgram connecting...)`);
        }
      } else {
        if (state.audioChunkCount <= 5) console.warn(`[HTTP-Stream] Deepgram not ready (state: ${readyState}) — dropping chunk`);
      }
    } catch (err) {
      console.error(`[HTTP-Stream] Error sending audio to Deepgram:`, err);
    }

    res.status(200).json({ ok: true });
  });
  // POST /api/session/text — Browser SpeechRecognition text fallback
  router.post("/text", async (req: Request, res: Response) => {
    const token = req.headers["x-stream-token"] as string;
    const state = token ? httpSessions.get(token) : undefined;
    if (!state) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (state.usingDeepgram) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const { text, speaker, startTime, endTime, confidence, isFinal } = req.body;
    if (!text) return res.status(400).json({ error: "text required" });

    state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);

    // Send response immediately, then process in background
    broadcast(state, "transcript", { text, speaker: speaker ?? "unknown", startTime, isFinal: isFinal ?? true, confidence, source: "browser" });
    res.status(200).json({ ok: true });

    // Background processing (non-blocking)
    (async () => {
      try {
        if (isFinal !== false) {
          await insertTranscript({
            sessionId: state.sessionId,
            speaker: speaker ?? "unknown",
            text,
            startTime,
            endTime,
            confidence,
            isFinal: isFinal ?? true,
          });
        }
      } catch (err) {
        console.error("[HTTP-Stream] insertTranscript error:", err);
      }

      state.analysisBuffer += ` ${text}`;
      state.transcriptBuffer.push(`${(speaker ?? "unknown").toUpperCase()}: ${text}`);

      try {
        if ((speaker ?? "unknown") === "manager" && isFinal !== false) {
          const flags = checkComplianceRules(text, state.elapsedSeconds);
          for (const flag of flags) {
            try {
              await insertComplianceFlag({ sessionId: state.sessionId, ...flag });
            } catch (e) { console.error("[HTTP-Stream] insertComplianceFlag error:", e); }
            broadcast(state, "compliance_flag", flag);
          }
        }
      } catch (err) {
        console.error("[HTTP-Stream] compliance check error:", err);
      }

      try {
        const fullTx = state.transcriptBuffer.join(" ");
        const quickSugg = generateQuickSuggestion(state.analysisBuffer, fullTx, state);
        const DEDUP_MS_B = 90_000;
        const nowB = Date.now();
        if (quickSugg) {
          const sid = (quickSugg.scriptId as string) ?? (quickSugg.title as string);
          const lastFired = state.recentScriptIds.get(sid);
          if (lastFired && (nowB - lastFired) < DEDUP_MS_B) {
            console.log(`[HTTP-Stream] Dedup (browser): skipping "${sid}"`);
          } else {
            state.recentScriptIds.set(sid, nowB);
            const triggered = state.analysisBuffer.substring(0, 100);
            let dbId: number | null = null;
            try {
              dbId = await insertCopilotSuggestion({
                sessionId: state.sessionId,
                type: quickSugg.type as Parameters<typeof insertCopilotSuggestion>[0]["type"],
                title: quickSugg.title as string,
                content: quickSugg.content as string,
                script: quickSugg.script as string,
                framework: quickSugg.framework as string,
                scriptId: quickSugg.scriptId as string,
                priority: (quickSugg.urgency ?? "medium") as "high" | "medium" | "low",
                triggeredBy: triggered,
              });
            } catch (e) { console.error("[HTTP-Stream] insertCopilotSuggestion error:", e); }
            broadcast(state, "suggestion", { ...quickSugg, id: dbId, triggeredBy: triggered, dealStage: state.currentDealStage });
          }
          state.analysisBuffer = "";
          state.lastAnalysisTime = nowB;
        }
      } catch (err) {
        console.error("[HTTP-Stream] suggestion error:", err);
      }
    })();
  });

  // GET /api/session/poll?token=X&since=Y — Poll for buffered events
  router.get("/poll", (req: Request, res: Response) => {
    const token = req.query.token as string;
    const since = parseInt(req.query.since as string, 10) || 0;
    const state = token ? httpSessions.get(token) : undefined;
    if (!state) {
      return res.status(404).json({ error: "Session not found" });
    }

    const events = state.eventQueue.filter((e) => e.seq > since);
    const nextSeq = state.eventSeq;
    res.json({ events, nextSeq });
  });

  // POST /api/session/end — End the HTTP-stream session
  router.post("/end", async (req: Request, res: Response) => {
    const token = req.headers["x-stream-token"] as string || req.body?.token;
    const state = token ? httpSessions.get(token) : undefined;
    if (!state) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Give Deepgram 1.5s to drain any final transcripts before closing
    if (state.deepgramConnection) {
      try {
        const dgReady = state.deepgramConnection.getReadyState();
        if (dgReady === 1) {
          console.log(`[HTTP-Stream] Draining Deepgram for session ${state.sessionId} (1.5s)...`);
          await new Promise<void>((resolve) => setTimeout(resolve, 1500));
        }
        state.deepgramConnection.requestClose();
      } catch { /* ignore */ }
    }
    if (state.reconnectTimer) clearTimeout(state.reconnectTimer);
    if (state.keepaliveTimer) clearInterval(state.keepaliveTimer);

    // Compute final elapsed time from startTime
    const finalElapsed = Math.floor((Date.now() - state.startTime) / 1000);
    state.elapsedSeconds = finalElapsed;

    broadcast(state, "session_ended", { sessionId: state.sessionId, durationSeconds: finalElapsed, dbFailCount: state.dbFailCount });

    // Close all SSE connections
    state.sseClients.forEach((client) => {
      try { client.end(); } catch { /* ignore */ }
    });

    httpSessions.delete(token);
    console.log(`[HTTP-Stream] Session ${state.sessionId} ended after ${finalElapsed}s`);
    res.json({ ok: true, durationSeconds: finalElapsed });
  });

  // POST /api/session/ping — Keepalive
  router.post("/ping", (req: Request, res: Response) => {
    const token = req.headers["x-stream-token"] as string;
    const state = token ? httpSessions.get(token) : undefined;
    if (!state) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json({ ok: true, elapsed: Math.floor((Date.now() - state.startTime) / 1000) });
  });

  return router;
}
