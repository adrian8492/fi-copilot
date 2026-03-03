import { Server as HttpServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { invokeLLM } from "./_core/llm";
import { insertTranscript, insertCopilotSuggestion, insertComplianceFlag, getSessionById } from "./db";

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
  type: "connected" | "transcript" | "suggestion" | "compliance_flag" | "session_ended" | "error" | "pong" | "analysis_complete";
  data?: unknown;
  message?: string;
  timestamp?: number;
}

// ─── Compliance Rules Engine ──────────────────────────────────────────────────
const COMPLIANCE_RULES = [
  {
    id: "base_payment",
    rule: "Base Payment Disclosure",
    severity: "critical" as const,
    patterns: [/monthly payment/i, /payment is/i, /your payment/i],
    requiresContext: ["base payment", "without products", "before products"],
    description: "Base payment must be disclosed before presenting F&I products",
  },
  {
    id: "risk_based_pricing",
    rule: "Risk-Based Pricing Notice",
    severity: "critical" as const,
    patterns: [/interest rate/i, /apr/i, /rate is/i, /your rate/i],
    requiresContext: ["risk-based pricing", "credit score", "based on your credit"],
    description: "Risk-based pricing notice required when rate differs from best available",
  },
  {
    id: "privacy_policy",
    rule: "Privacy Policy Disclosure",
    severity: "warning" as const,
    patterns: [/privacy/i, /information/i, /share your/i],
    requiresContext: ["privacy policy", "privacy notice", "your information"],
    description: "Privacy policy must be presented and acknowledged",
  },
  {
    id: "high_pressure",
    rule: "High-Pressure Sales Tactics",
    severity: "warning" as const,
    patterns: [/you must/i, /you have to/i, /required to/i, /mandatory/i, /no choice/i],
    description: "Avoid language that implies products are mandatory or required",
  },
  {
    id: "misrepresentation",
    rule: "Product Misrepresentation",
    severity: "critical" as const,
    patterns: [/guaranteed/i, /covers everything/i, /100% covered/i, /always pays/i],
    description: "Avoid absolute guarantees about product coverage",
  },
];

function checkComplianceRules(text: string, elapsedSeconds: number): Array<{
  severity: "critical" | "warning" | "info";
  rule: string;
  description: string;
  excerpt: string;
  timestamp: number;
}> {
  const flags = [];
  for (const rule of COMPLIANCE_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        flags.push({
          severity: rule.severity,
          rule: rule.rule,
          description: rule.description,
          excerpt: text.substring(0, 200),
          timestamp: elapsedSeconds,
        });
        break;
      }
    }
  }
  return flags;
}

// ─── AI Co-Pilot Real-Time Analysis ──────────────────────────────────────────
const COPILOT_TRIGGERS = {
  objection_price: /too expensive|can't afford|too much|over budget|don't need it|not worth it/i,
  objection_coverage: /already have|covered by|don't need coverage|have insurance/i,
  objection_think: /think about it|need to think|let me think|talk to my wife|talk to my husband|spouse/i,
  product_gap: /gap|total loss|owe more than/i,
  product_vsc: /warranty|break down|repair|mechanical/i,
  product_maintenance: /maintenance|oil change|service/i,
  closing_opportunity: /sounds good|that makes sense|okay|alright|i'll take it/i,
  rapport: /how long|do you have|family|kids|drive to work/i,
};

async function generateCopilotSuggestion(text: string, conversationContext: string[]): Promise<{
  type: string;
  title: string;
  content: string;
  priority: string;
  triggeredBy: string;
} | null> {
  // Quick pattern matching for immediate suggestions (no LLM latency)
  const lowerText = text.toLowerCase();

  if (COPILOT_TRIGGERS.objection_price.test(text)) {
    return {
      type: "objection_handling",
      title: "Price Objection Detected",
      content: "Acknowledge the concern, then reframe: 'I completely understand. Let me show you what this breaks down to per day — we're talking about the cost of a coffee to protect a $40,000 investment.' Then ask: 'What specifically concerns you about the investment?'",
      priority: "high",
      triggeredBy: text.substring(0, 100),
    };
  }

  if (COPILOT_TRIGGERS.objection_think.test(text)) {
    return {
      type: "closing_technique",
      title: "Think It Over Objection",
      content: "Use the 'Think It Over' close: 'I appreciate that. What specifically would you like to think about? Is it the investment, the coverage, or something else?' Isolate the real objection before they leave.",
      priority: "high",
      triggeredBy: text.substring(0, 100),
    };
  }

  if (COPILOT_TRIGGERS.objection_coverage.test(text)) {
    return {
      type: "objection_handling",
      title: "Coverage Objection — Probe Deeper",
      content: "Ask: 'What made you feel like you already had this covered?' Then listen carefully. Most existing coverage has gaps — find them and re-offer the product that fills the specific gap they identified.",
      priority: "high",
      triggeredBy: text.substring(0, 100),
    };
  }

  if (COPILOT_TRIGGERS.closing_opportunity.test(text)) {
    return {
      type: "closing_technique",
      title: "Closing Signal Detected",
      content: "Customer is showing buying signals. Use the 'Which' close now: 'Would you prefer the monthly payment option or would you like to include it in the deal today?' Move toward commitment.",
      priority: "high",
      triggeredBy: text.substring(0, 100),
    };
  }

  if (COPILOT_TRIGGERS.product_gap.test(text)) {
    return {
      type: "product_recommendation",
      title: "GAP Insurance Opportunity",
      content: "Customer mentioned total loss scenario. Introduce GAP: 'That's exactly why GAP protection exists — if your vehicle is totaled and you owe more than it's worth, GAP covers that difference completely. On a new vehicle, you could be upside down by $5,000-$8,000 in the first year.'",
      priority: "medium",
      triggeredBy: text.substring(0, 100),
    };
  }

  if (COPILOT_TRIGGERS.rapport.test(text)) {
    return {
      type: "rapport_building",
      title: "Rapport Building Opportunity",
      content: "Great discovery moment. Continue building connection before pivoting to products. Ask follow-up questions about their lifestyle to personalize your product recommendations.",
      priority: "low",
      triggeredBy: text.substring(0, 100),
    };
  }

  return null;
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
}

const activeSessions = new Map<WebSocket, SessionState>();

// ─── WebSocket Server Setup ───────────────────────────────────────────────────
export function setupWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: "/ws/session" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("[WS] New client connected");

    const send = (msg: ServerMessage) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ ...msg, timestamp: Date.now() }));
      }
    };

    ws.on("message", async (raw: Buffer | string) => {
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
          activeSessions.set(ws, {
            sessionId: msg.sessionId,
            userId: msg.userId,
            startTime: Date.now(),
            transcriptBuffer: [],
            analysisBuffer: "",
            lastAnalysisTime: Date.now(),
            elapsedSeconds: 0,
          });
          send({ type: "connected", data: { sessionId: msg.sessionId, message: "Session started. Recording active." } });
          console.log(`[WS] Session ${msg.sessionId} started for user ${msg.userId}`);
          break;
        }

        case "transcript_chunk": {
          const state = activeSessions.get(ws);
          if (!state || !msg.text) return;

          state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);

          // Save transcript to DB
          if (msg.isFinal !== false) {
            await insertTranscript({
              sessionId: state.sessionId,
              speaker: msg.speaker ?? "unknown",
              text: msg.text,
              startTime: msg.startTime,
              endTime: msg.endTime,
              confidence: msg.confidence,
              isFinal: msg.isFinal ?? true,
            });
          }

          // Broadcast transcript back to client
          send({
            type: "transcript",
            data: {
              text: msg.text,
              speaker: msg.speaker ?? "unknown",
              startTime: msg.startTime,
              isFinal: msg.isFinal ?? true,
              confidence: msg.confidence,
            },
          });

          // Add to analysis buffer
          state.analysisBuffer += ` ${msg.text}`;
          state.transcriptBuffer.push(`${msg.speaker ?? "unknown"}: ${msg.text}`);

          // Run compliance check on every final transcript
          if (msg.isFinal !== false && msg.speaker === "manager") {
            const complianceIssues = checkComplianceRules(msg.text, state.elapsedSeconds);
            for (const issue of complianceIssues) {
              await insertComplianceFlag({ sessionId: state.sessionId, ...issue });
              send({ type: "compliance_flag", data: issue });
            }
          }

          // Run AI co-pilot every ~30 seconds or when buffer is large enough
          const timeSinceLastAnalysis = Date.now() - state.lastAnalysisTime;
          const bufferWordCount = state.analysisBuffer.split(" ").length;

          if (timeSinceLastAnalysis > 20000 || bufferWordCount > 50) {
            state.lastAnalysisTime = Date.now();
            const recentContext = state.transcriptBuffer.slice(-10).join("\n");

            // Quick pattern-based suggestion (immediate, no latency)
            const quickSuggestion = await generateCopilotSuggestion(state.analysisBuffer, state.transcriptBuffer);
            if (quickSuggestion) {
              const { type: sType, title, content, priority, triggeredBy } = quickSuggestion;
              await insertCopilotSuggestion({ sessionId: state.sessionId, type: sType as Parameters<typeof insertCopilotSuggestion>[0]['type'], title, content, priority: priority as 'high'|'medium'|'low', triggeredBy });
              send({ type: "suggestion", data: quickSuggestion });
            }

            state.analysisBuffer = "";
          }
          break;
        }

        case "end_session": {
          const state = activeSessions.get(ws);
          if (!state) return;
          activeSessions.delete(ws);
          send({ type: "session_ended", data: { sessionId: state.sessionId, durationSeconds: state.elapsedSeconds } });
          console.log(`[WS] Session ${state.sessionId} ended after ${state.elapsedSeconds}s`);
          break;
        }
      }
    });

    ws.on("close", () => {
      activeSessions.delete(ws);
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
