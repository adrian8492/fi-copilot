import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Mic, MicOff, Square, Zap, AlertTriangle, CheckCircle2,
  Lightbulb, Shield, Clock, ChevronDown, User, Users,
  ClipboardList, Circle, ShieldCheck, XCircle, Copy, BookOpen, ThumbsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TranscriptEntry {
  id: string;
  speaker: "manager" | "customer" | "unknown";
  text: string;
  timestamp: number;
  isFinal: boolean;
}

interface Suggestion {
  id?: number;
  type: string;
  title: string;
  content: string;
  script?: string;          // VERBATIM ASURA word track
  framework?: string;       // Source framework/document
  dealStage?: string;       // ASURA 7-step deal stage
  urgency?: "high" | "medium" | "low";
  priority: "high" | "medium" | "low";
  triggeredBy: string;
  timestamp: number;
  wasActedOn?: boolean;
}

interface ComplianceFlag {
  severity: "critical" | "warning" | "info";
  rule: string;
  description: string;
  excerpt: string;
  timestamp: number;
}

type SpeakerMode = "manager" | "customer" | "auto";

// ─── 17-Point Checklist Definition ───────────────────────────────────────────
const CHECKLIST_SECTIONS = [
  {
    id: "introduction",
    label: "Introduction",
    weight: 0.20,
    weightLabel: "20%",
    color: "blue" as const,
    items: [
      { key: "fiManagerGreeting", label: "F&I Manager Introduction & Greeting" },
      { key: "statedTitleWork", label: "Stated Title Work Timeline" },
      { key: "statedFactoryWarranty", label: "Stated Factory Warranty Details" },
      { key: "statedFinancialOptions", label: "Stated Financial Options & Rate" },
      { key: "statedTimeFrame", label: "Stated Time Frame for Appointment" },
      { key: "introductionToFirstForms", label: "Introduction to First Forms" },
    ],
  },
  {
    id: "compliance",
    label: "General Compliance",
    weight: 0.30,
    weightLabel: "30%",
    color: "amber" as const,
    items: [
      { key: "privacyPolicyMentioned", label: "Privacy Policy Disclosed" },
      { key: "riskBasedPricingMentioned", label: "Risk-Based Pricing Disclosed" },
      { key: "disclosedBasePayment", label: "Base Payment Disclosed Before Menu" },
    ],
  },
  {
    id: "menu",
    label: "Menu Presentation",
    weight: 0.50,
    weightLabel: "50%",
    color: "emerald" as const,
    items: [
      { key: "presentedPrepaidMaintenance", label: "Presented Prepaid Maintenance" },
      { key: "presentedVehicleServiceContract", label: "Presented Vehicle Service Contract" },
      { key: "presentedGap", label: "Presented GAP Insurance" },
      { key: "presentedInteriorExteriorProtection", label: "Presented Interior/Exterior Protection" },
      { key: "presentedRoadHazard", label: "Presented Road Hazard" },
      { key: "presentedPaintlessDentRepair", label: "Presented Paintless Dent Repair" },
      { key: "customerQuestionsAddressed", label: "Customer Questions Addressed" },
      { key: "whichClosingQuestionAsked", label: "Closing Question Asked" },
    ],
  },
];

type ChecklistState = Record<string, boolean>;

function calcSectionScore(section: typeof CHECKLIST_SECTIONS[0], state: ChecklistState) {
  const checked = section.items.filter((i) => state[i.key]).length;
  return Math.round((checked / section.items.length) * 100);
}

function calcOverallScore(state: ChecklistState) {
  return Math.round(
    CHECKLIST_SECTIONS.reduce((sum, sec) => sum + calcSectionScore(sec, state) * sec.weight, 0)
  );
}
type SpeechRecognitionCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; [j: number]: { transcript: string; confidence: number } } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

const SUGGESTION_TYPE_ICONS: Record<string, React.ElementType> = {
  objection_handling: Shield,
  product_recommendation: Zap,
  closing_technique: CheckCircle2,
  compliance_reminder: AlertTriangle,
  rapport_building: Users,
  general_tip: Lightbulb,
};

export default function LiveSession() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Setup state
  const [showSetup, setShowSetup] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [dealNumber, setDealNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<"new" | "used" | "cpo">("new");
  const [dealType, setDealType] = useState<"retail_finance" | "lease" | "cash">("retail_finance");
  const [consentObtained, setConsentObtained] = useState(false);

  // Session state
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speakerMode, setSpeakerMode] = useState<SpeakerMode>("manager");

  // Data state
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [complianceFlags, setComplianceFlags] = useState<ComplianceFlag[]>([]);
  const [activeTab, setActiveTab] = useState<"copilot" | "compliance">("copilot");

  // Deal stage tracking
  const [currentDealStage, setCurrentDealStage] = useState<string>("introduction");
  // Deepgram / transcription status
  const [deepgramConnected, setDeepgramConnected] = useState(false);
  const [transcriptionMode, setTranscriptionMode] = useState<"deepgram" | "browser" | "pending">("pending");

  // Audio level indicator
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioChunksSent, setAudioChunksSent] = useState(0);

  // Connection mode: "ws" (WebSocket) or "http" (HTTP streaming fallback)
  const [connectionMode, setConnectionMode] = useState<"ws" | "http" | "pending">("pending");
  const httpTokenRef = useRef<string | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const keepaliveRef = useRef<NodeJS.Timeout | null>(null);

  // Expanded word tracks
  const [expandedScripts, setExpandedScripts] = useState<Record<number, boolean>>({});

  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistState>({});
  const [checklistExpanded, setChecklistExpanded] = useState<Record<string, boolean>>({ introduction: true, compliance: true, menu: true });
  const [showChecklist, setShowChecklist] = useState(false);

  const createSession = trpc.sessions.create.useMutation();
  const endSessionMutation = trpc.sessions.end.useMutation();
  const analyzeTranscript = trpc.transcripts.analyze.useMutation();
  const generateGrade = trpc.grades.generate.useMutation();
  const upsertChecklist = trpc.checklists.upsert.useMutation();
  const logObjection = trpc.objections.log.useMutation();
  const markUsedMutation = trpc.transcripts.markUsed.useMutation();

  const handleMarkUsed = (suggIdx: number, suggId?: number) => {
    setSuggestions(prev => prev.map((s, i) => i === suggIdx ? { ...s, wasActedOn: true } : s));
    if (suggId) markUsedMutation.mutate({ suggestionId: suggId, wasActedOn: true });
    toast.success("Word track marked as used!");
  };

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  // Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ─── Shared event handler for both WS and SSE messages ─────────────────────
  const handleServerEvent = useCallback((type: string, data: Record<string, unknown>) => {
    switch (type) {
      case "transcript":
        if (data?.text) {
          const isFinalMsg: boolean = (data.isFinal as boolean) ?? true;
          const tsSeconds: number = data.startTime != null
            ? Math.round(data.startTime as number)
            : elapsed;
          setTranscripts((prev) => {
            if (!isFinalMsg) {
              const lastIdx = prev.length - 1;
              if (lastIdx >= 0 && !prev[lastIdx].isFinal &&
                  prev[lastIdx].speaker === ((data.speaker as string) ?? "unknown")) {
                const updated = [...prev];
                updated[lastIdx] = { ...updated[lastIdx], text: data.text as string };
                return updated;
              }
            }
            const entry: TranscriptEntry = {
              id: `${Date.now()}-${Math.random()}`,
              speaker: (data.speaker as TranscriptEntry["speaker"]) ?? "unknown",
              text: data.text as string,
              timestamp: tsSeconds,
              isFinal: isFinalMsg,
            };
            return [...prev, entry];
          });
        }
        break;
      case "suggestion":
        if (data) {
          const sugg: Suggestion = {
            ...(data as unknown as Suggestion),
            priority: ((data.urgency ?? data.priority ?? "medium") as Suggestion["priority"]),
            timestamp: Date.now(),
          };
          setSuggestions((prev) => [sugg, ...prev].slice(0, 10));
          setActiveTab("copilot");
        }
        break;
      case "compliance_flag":
        if (data) {
          setComplianceFlags((prev) => [{ ...(data as unknown as ComplianceFlag), timestamp: Date.now() }, ...prev]);
          if (data.severity === "critical") {
            toast.error(`Compliance: ${data.rule}`, { description: data.description as string });
            setActiveTab("compliance");
          }
        }
        break;
      case "deepgram_status":
        if (data?.connected) {
          setDeepgramConnected(true);
          setTranscriptionMode("deepgram");
        } else {
          setDeepgramConnected(false);
          setTranscriptionMode("browser");
        }
        break;
      case "connected":
        if (data?.transcriptionMode === "deepgram") {
          setTranscriptionMode("deepgram");
        } else if (data?.transcriptionMode === "browser") {
          setTranscriptionMode("browser");
        }
        break;
      case "stage_update":
        if (data?.stage) {
          setCurrentDealStage(data.stage as string);
        }
        break;
      case "session_ended":
        setIsRecording(false);
        break;
    }
  }, [elapsed]);

  // ─── HTTP Streaming Fallback ────────────────────────────────────────────────
  const connectHttpStream = useCallback(async (sid: number) => {
    try {
      const resp = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, userId: user?.id }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const { token, transcriptionMode: mode } = await resp.json();
      httpTokenRef.current = token;
      setConnectionMode("http");
      setIsConnected(true);
      console.log("[HTTP-Stream] Connected with token", token.slice(0, 10), "mode:", mode);

      if (mode === "deepgram") {
        setTranscriptionMode("deepgram");
        setDeepgramConnected(true);
      }

      // Open SSE for server → client events
      const sse = new EventSource(`/api/session/events?token=${token}`);
      sseRef.current = sse;

      const eventTypes = ["transcript", "suggestion", "compliance_flag", "deepgram_status", "stage_update", "session_ended"];
      eventTypes.forEach((evtType) => {
        sse.addEventListener(evtType, (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handleServerEvent(evtType, data);
          } catch { /* ignore parse errors */ }
        });
      });

      sse.onerror = () => {
        console.warn("[HTTP-Stream] SSE connection error");
      };

      // Keepalive ping every 30s
      if (keepaliveRef.current) clearInterval(keepaliveRef.current);
      keepaliveRef.current = setInterval(() => {
        if (httpTokenRef.current) {
          fetch("/api/session/ping", {
            method: "POST",
            headers: { "X-Stream-Token": httpTokenRef.current },
          }).catch(() => {});
        }
      }, 30000);

      return true;
    } catch (err) {
      console.error("[HTTP-Stream] Failed to start:", err);
      return false;
    }
  }, [user?.id, handleServerEvent]);

  // ─── WebSocket connection (primary) ─────────────────────────────────────────
  const connectWebSocket = useCallback((sid: number) => {
    return new Promise<boolean>((resolve) => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/session`);
      wsRef.current = ws;

      // Timeout: if WS doesn't open in 3s, reject and fall back to HTTP
      const timeout = setTimeout(() => {
        console.warn("[WS] Connection timeout — falling back to HTTP streaming");
        ws.close();
        resolve(false);
      }, 3000);

      ws.onopen = () => {
        clearTimeout(timeout);
        setIsConnected(true);
        setConnectionMode("ws");
        ws.send(JSON.stringify({ type: "start_session", sessionId: sid, userId: user?.id }));
        // Client-side keepalive: send ping every 30s
        if (keepaliveRef.current) clearInterval(keepaliveRef.current);
        keepaliveRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
        resolve(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleServerEvent(msg.type, msg.data ?? msg);
        } catch { /* ignore */ }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setDeepgramConnected(false);
        if (keepaliveRef.current) { clearInterval(keepaliveRef.current); keepaliveRef.current = null; }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    });
  }, [user?.id, handleServerEvent]);

  // Speech recognition for live transcription
  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognitionImpl = ((window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as SpeechRecognitionCtor | undefined;
    const SpeechRecognition = SpeechRecognitionImpl;
    if (!SpeechRecognition || !SpeechRecognitionImpl) {
      toast.warning("Speech recognition not supported. Transcripts will be available after upload.");
      return;
    }

    const recognition = new SpeechRecognitionImpl!();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript.trim();
        if (!text) continue;

        const isFinal = result.isFinal;
        const speaker = speakerMode === "auto" ? "unknown" : speakerMode;

        // Send via WebSocket or HTTP depending on connection mode
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "transcript_chunk",
            text,
            speaker,
            isFinal,
            confidence: result[0].confidence,
            startTime: elapsed,
          }));
        } else if (httpTokenRef.current) {
          fetch("/api/session/text", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Stream-Token": httpTokenRef.current,
            },
            body: JSON.stringify({
              text,
              speaker,
              isFinal,
              confidence: result[0].confidence,
              startTime: elapsed,
            }),
          }).catch(() => {});
        }
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== "no-speech") console.error("[Speech]", e.error);
    };

    recognition.onend = () => {
      if (isRecording && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch {}
      }
    };

    recognition.start();
  }, [speakerMode, elapsed, isRecording]);

  const handleStartSession = async () => {
    if (!consentObtained) {
      toast.error("Recording consent is required before starting a session.");
      return;
    }

    try {
      const session = await createSession.mutateAsync({
        customerName: customerName || undefined,
        dealNumber: dealNumber || undefined,
        vehicleType,
        dealType,
        consentObtained: true,
        consentMethod: "verbal",
      });

      if (!session) throw new Error("Failed to create session");
      setSessionId(session.id);
      setShowSetup(false);

      // Get microphone access
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micErr: unknown) {
        const errMsg = micErr instanceof Error ? micErr.message : String(micErr);
        toast.error(`Microphone access denied: ${errMsg}`, {
          description: "Please allow microphone access in your browser settings and try again. The Preview panel may not support microphone — try opening the site directly.",
          duration: 10000,
        });
        console.error("[Mic] getUserMedia failed:", micErr);
        return;
      }
      streamRef.current = stream;

      // Set up audio level meter for visual feedback
      try {
        const audioCtx = new AudioContext();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
          setAudioLevel(Math.round(avg));
          animFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch { /* AudioContext not available — skip level meter */ }

      // Try WebSocket first, fall back to HTTP streaming if WS fails
      let wsConnected = false;
      try {
        wsConnected = await connectWebSocket(session.id);
      } catch {
        wsConnected = false;
      }

      if (!wsConnected) {
        console.log("[Session] WebSocket failed — switching to HTTP streaming");
        const httpOk = await connectHttpStream(session.id);
        if (!httpOk) {
          toast.error("Failed to connect to server. Please try again.");
          return;
        }
        toast.info("Using HTTP streaming mode (WebSocket unavailable).", { duration: 5000 });
      }

      // Start recording — stream audio chunks via WS or HTTP
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size <= 0) return;
        // WebSocket mode: send binary directly
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(e.data);
          setAudioChunksSent((c) => c + 1);
        }
        // HTTP mode: POST binary audio chunk
        else if (httpTokenRef.current) {
          e.data.arrayBuffer().then((buf) => {
            fetch("/api/session/audio", {
              method: "POST",
              headers: {
                "Content-Type": "application/octet-stream",
                "X-Stream-Token": httpTokenRef.current!,
              },
              body: buf,
            }).catch(() => {});
          });
          setAudioChunksSent((c) => c + 1);
        }
      };
      mediaRecorder.start(250); // 250ms chunks for low latency
      setIsRecording(true);

      // Browser SpeechRecognition fallback — only start if Deepgram is NOT active.
      setTimeout(() => {
        setTranscriptionMode((mode) => {
          if (mode !== "deepgram") {
            startSpeechRecognition();
          }
          return mode;
        });
      }, 1000);

      toast.success("Session started. Recording active.");
    } catch (e) {
      toast.error("Failed to start session. Check microphone permissions.");
      console.error(e);
    }
  };

  const toggleChecklistItem = (key: string) => {
    const next = { ...checklist, [key]: !checklist[key] };
    setChecklist(next);
    if (sessionId) {
      upsertChecklist.mutate({ sessionId, ...next });
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;

    // Save checklist before ending
    if (Object.keys(checklist).length > 0) {
      await upsertChecklist.mutateAsync({ sessionId, ...checklist });
    }

    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }

    // Stop stream
    streamRef.current?.getTracks().forEach((t) => t.stop());

    // Stop audio level meter
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    if (audioContextRef.current) { try { audioContextRef.current.close(); } catch {} audioContextRef.current = null; }
    setAudioLevel(0);

    // Stop keepalive
    if (keepaliveRef.current) { clearInterval(keepaliveRef.current); keepaliveRef.current = null; }

    // Notify server via WebSocket or HTTP
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "end_session" }));
      wsRef.current.close();
    } else if (httpTokenRef.current) {
      try {
        await fetch("/api/session/end", {
          method: "POST",
          headers: { "X-Stream-Token": httpTokenRef.current },
        });
      } catch { /* ignore */ }
    }

    // Close SSE connection
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    httpTokenRef.current = null;
    setConnectionMode("pending");

    setIsRecording(false);

    // End session in DB
    await endSessionMutation.mutateAsync({ id: sessionId, durationSeconds: elapsed });

    // Generate grade if we have transcripts
    if (transcripts.length > 0) {
      toast.info("Generating performance grade...");
      try {
        await generateGrade.mutateAsync({ sessionId });
        toast.success("Session graded successfully!");
      } catch {
        toast.warning("Grade generation failed. You can retry from the session detail page.");
      }
    }

    navigate(`/session/${sessionId}`);
  };

  const handleManualAnalysis = async () => {
    if (!sessionId || transcripts.length === 0) return;
    const recent = transcripts.slice(-5).map((t) => `${t.speaker}: ${t.text}`).join("\n");
    try {
      const result = await analyzeTranscript.mutateAsync({ sessionId, recentText: recent });
      if (result.suggestions?.length > 0) {
        setSuggestions((prev) => [
          ...result.suggestions.map((s: Omit<Suggestion, 'timestamp'>) => ({ ...s, timestamp: Date.now() })),
          ...prev,
        ].slice(0, 10));
      }
      toast.success("Analysis complete");
    } catch {
      toast.error("Analysis failed");
    }
  };

  // Setup Dialog
  if (showSetup) {
    return (
      <AppLayout title="New Live Session" subtitle="Configure your session before recording">
        <div className="p-6 max-w-2xl mx-auto">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" />
                Session Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input placeholder="e.g. John Smith" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Deal Number</Label>
                  <Input placeholder="e.g. 12345" value={dealNumber} onChange={(e) => setDealNumber(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as typeof vehicleType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                      <SelectItem value="cpo">CPO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Deal Type</Label>
                  <Select value={dealType} onValueChange={(v) => setDealType(v as typeof dealType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail_finance">Retail Finance</SelectItem>
                      <SelectItem value="lease">Lease</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Consent */}
              <div className={cn(
                "p-4 rounded-xl border-2 transition-colors cursor-pointer",
                consentObtained ? "border-green-500/40 bg-green-500/5" : "border-border bg-accent/30"
              )} onClick={() => setConsentObtained(!consentObtained)}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                    consentObtained ? "bg-green-500 border-green-500" : "border-border"
                  )}>
                    {consentObtained && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Recording Consent Obtained</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      I confirm that the customer has been verbally informed that this interaction will be recorded for quality and training purposes, as required by applicable state recording consent laws.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>Cancel</Button>
                <Button
                  className="flex-1 gap-2 font-semibold"
                  onClick={handleStartSession}
                  disabled={!consentObtained || createSession.isPending}
                >
                  <Mic className="w-4 h-4" />
                  {createSession.isPending ? "Starting..." : "Start Recording"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Live Session UI
  return (
    <AppLayout
      title={customerName ? `Session: ${customerName}` : "Live Session"}
      subtitle={`Deal #${dealNumber || "—"} • ${dealType.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}`}
    >
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        {/* Session Control Bar */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-4 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className={cn("w-2.5 h-2.5 rounded-full", isRecording ? "bg-red-500 recording-dot" : "bg-muted-foreground")} />
            <span className="text-sm font-mono font-bold text-foreground">{formatTime(elapsed)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border">
            <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-green-400" : "bg-red-400")} />
            <span className="text-[10px] font-medium text-muted-foreground">
              {isConnected
                ? connectionMode === "http" ? "Connected (HTTP)" : "Connected"
                : "Connecting..."}
            </span>
          </div>
          {isRecording && (
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold",
              transcriptionMode === "deepgram"
                ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                : transcriptionMode === "browser"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-muted/30 border-border text-muted-foreground"
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse",
                transcriptionMode === "deepgram" ? "bg-blue-400" :
                transcriptionMode === "browser" ? "bg-amber-400" : "bg-muted-foreground"
              )} />
              {transcriptionMode === "deepgram" ? "Deepgram Nova-2" :
               transcriptionMode === "browser" ? "Browser Fallback" : "Connecting..."}
            </div>
          )}

          {/* Audio Level Indicator */}
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border">
              <div className="flex items-end gap-px h-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1 rounded-full transition-all duration-100",
                      audioLevel > i * 20 ? "bg-green-400" : "bg-muted-foreground/30"
                    )}
                    style={{ height: `${Math.max(3, (i + 1) * 3)}px` }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {audioLevel > 10 ? "Audio" : "Silent"}
              </span>
            </div>
          )}

          {/* Deal Stage Badge */}
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-[10px] font-semibold text-violet-400 capitalize">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              {currentDealStage.replace(/_/g, " ")}
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Speaker:</span>
            {(["manager", "customer", "auto"] as SpeakerMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setSpeakerMode(mode)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors",
                  speakerMode === mode ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Process Score badge */}
            {sessionId && (
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
                calcOverallScore(checklist) >= 80 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                calcOverallScore(checklist) >= 65 ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                "bg-red-500/10 border-red-500/30 text-red-400"
              )}>
                Process: {calcOverallScore(checklist)}%
              </div>
            )}
            <Button
              variant={showChecklist ? "default" : "outline"}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setShowChecklist((v) => !v)}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Checklist
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleManualAnalysis}
              disabled={analyzeTranscript.isPending || transcripts.length === 0}
            >
              <Zap className="w-3.5 h-3.5" />
              Analyze
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 text-xs font-semibold"
              onClick={handleEndSession}
              disabled={endSessionMutation.isPending}
            >
              <Square className="w-3.5 h-3.5" />
              End Session
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* 17-Point Checklist Panel (collapsible) */}
          {showChecklist && (
            <div className="hidden md:flex w-72 flex-col shrink-0 border-r border-border overflow-y-auto bg-background/50">
              <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">17-Point Checklist</span>
                </div>
                <div className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full",
                  calcOverallScore(checklist) >= 80 ? "bg-emerald-500/20 text-emerald-400" :
                  calcOverallScore(checklist) >= 65 ? "bg-amber-500/20 text-amber-400" :
                  "bg-red-500/20 text-red-400"
                )}>
                  {calcOverallScore(checklist)}%
                </div>
              </div>
              {/* Section score summary */}
              <div className="grid grid-cols-3 gap-1 p-2 border-b border-border">
                {CHECKLIST_SECTIONS.map((sec) => {
                  const score = calcSectionScore(sec, checklist);
                  return (
                    <div key={sec.id} className="text-center p-1.5 rounded-lg bg-card">
                      <div className={cn("text-sm font-bold",
                        sec.color === "blue" ? "text-blue-400" :
                        sec.color === "amber" ? "text-amber-400" : "text-emerald-400"
                      )}>{score}%</div>
                      <div className="text-[9px] text-muted-foreground leading-tight">{sec.label}</div>
                      <div className="text-[9px] text-muted-foreground/60">{sec.weightLabel}</div>
                    </div>
                  );
                })}
              </div>
              {/* Checklist items */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {CHECKLIST_SECTIONS.map((section) => (
                  <div key={section.id}>
                    <button
                      onClick={() => setChecklistExpanded((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className={cn("w-3.5 h-3.5",
                          section.color === "blue" ? "text-blue-400" :
                          section.color === "amber" ? "text-amber-400" : "text-emerald-400"
                        )} />
                        <span className={cn("text-xs font-semibold",
                          section.color === "blue" ? "text-blue-400" :
                          section.color === "amber" ? "text-amber-400" : "text-emerald-400"
                        )}>{section.label}</span>
                      </div>
                      <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform",
                        checklistExpanded[section.id] ? "rotate-180" : ""
                      )} />
                    </button>
                    {checklistExpanded[section.id] && (
                      <div className="mt-1 space-y-0.5">
                        {section.items.map((item) => {
                          const checked = !!checklist[item.key];
                          return (
                            <button
                              key={item.key}
                              onClick={() => toggleChecklistItem(item.key)}
                              className={cn(
                                "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-all text-xs",
                                checked ? "bg-emerald-500/10 border border-emerald-500/20" : "hover:bg-accent border border-transparent"
                              )}
                            >
                              {checked
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                : <Circle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                              }
                              <span className={checked ? "text-emerald-300" : "text-muted-foreground"}>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transcript Panel */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-border">
            <div className="px-4 py-2 border-b border-border flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Transcript</span>
              <Badge variant="outline" className="text-[10px] ml-auto">{transcripts.length} entries</Badge>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {transcripts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <Mic className="w-7 h-7 text-primary/60" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Listening for speech...</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Start speaking. The transcript will appear here in real-time.
                  </p>
                </div>
              ) : (
                transcripts.map((entry) => (
                  <div key={entry.id} className={cn("transcript-entry flex gap-3", entry.speaker === "customer" && "flex-row-reverse")}>
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                      entry.speaker === "manager" ? "bg-primary/20 text-primary" :
                      entry.speaker === "customer" ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
                    )}>
                      {entry.speaker === "manager" ? "M" : entry.speaker === "customer" ? "C" : "?"}
                    </div>
                    <div className={cn(
                      "flex-1 max-w-[80%]",
                      entry.speaker === "customer" && "flex flex-col items-end"
                    )}>
                      <div className={cn(
                        "inline-block px-3 py-2 rounded-xl text-sm",
                        entry.speaker === "manager" ? "bg-primary/10 border border-primary/15 text-foreground rounded-tl-sm" :
                        entry.speaker === "customer" ? "bg-green-500/10 border border-green-500/15 text-foreground rounded-tr-sm" :
                        "bg-card border border-border text-foreground"
                      )}>
                        {entry.text}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 px-1">
                        {entry.speaker === "manager" ? "F&I Manager" : entry.speaker === "customer" ? "Customer" : "Unknown"} • {formatTime(entry.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>

          {/* Co-Pilot Panel */}
          <div className="hidden md:flex w-80 xl:w-96 flex-col shrink-0">
            {/* Tab Bar */}
            <div className="flex border-b border-border">
              {[
                { id: "copilot" as const, label: "Co-Pilot", icon: Zap, count: suggestions.length },
                { id: "compliance" as const, label: "Compliance", icon: Shield, count: complianceFlags.filter(f => f.severity === "critical").length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold transition-colors",
                    activeTab === tab.id
                      ? "text-primary border-b-2 border-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={cn(
                      "w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center",
                      tab.id === "compliance" ? "bg-red-500 text-white" : "bg-primary text-primary-foreground"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {activeTab === "copilot" && (
                suggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <Zap className="w-8 h-8 text-primary/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">AI Co-Pilot Active</p>
                    <p className="text-xs text-muted-foreground mt-1">Coaching suggestions will appear here as the conversation progresses.</p>
                  </div>
                ) : (
                  suggestions.map((s, i) => {
                    const Icon = SUGGESTION_TYPE_ICONS[s.type] ?? Lightbulb;
                    const isExpanded = expandedScripts[i] ?? true;
                    const STAGE_LABELS: Record<string, string> = {
                      introduction: "Introduction",
                      customer_connection: "Client Survey",
                      financial_snapshot: "Financial Snapshot",
                      menu_presentation: "Menu Presentation",
                      product_walkthrough: "Product Walkthrough",
                      objection_handling: "Objection Handling",
                      closing: "Closing",
                      post_close: "Post-Close",
                    };
                    return (
                      <div key={i} className={cn(
                        "suggestion-card rounded-xl border overflow-hidden",
                        s.wasActedOn ? "opacity-60" : "",
                        s.priority === "high" ? "bg-red-500/5 border-red-500/20" :
                        s.priority === "medium" ? "bg-yellow-500/5 border-yellow-500/20" :
                        "bg-blue-500/5 border-blue-500/20"
                      )}>
                        {/* Header */}
                        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                          <div className={cn(
                            "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
                            s.priority === "high" ? "bg-red-500/15" :
                            s.priority === "medium" ? "bg-yellow-500/15" : "bg-blue-500/15"
                          )}>
                            <Icon className={cn(
                              "w-3 h-3",
                              s.priority === "high" ? "text-red-400" :
                              s.priority === "medium" ? "text-yellow-400" : "text-blue-400"
                            )} />
                          </div>
                          <p className="text-xs font-bold text-foreground flex-1 leading-tight">{s.title}</p>
                          <Badge variant="outline" className={cn(
                            "text-[9px] px-1.5 py-0 h-4 shrink-0 uppercase",
                            s.priority === "high" ? "border-red-500/30 text-red-400" :
                            s.priority === "medium" ? "border-yellow-500/30 text-yellow-400" : "border-blue-500/30 text-blue-400"
                          )}>
                            {s.priority}
                          </Badge>
                        </div>

                        {/* Deal Stage + Framework chips */}
                        {(s.dealStage || s.framework) && (
                          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                            {s.dealStage && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[9px] font-semibold text-violet-400 uppercase tracking-wide">
                                <div className="w-1 h-1 rounded-full bg-violet-400" />
                                {STAGE_LABELS[s.dealStage] ?? s.dealStage.replace(/_/g, " ")}
                              </span>
                            )}
                            {s.framework && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/5 border border-primary/15 text-[9px] text-primary/70 max-w-full truncate">
                                <BookOpen className="w-2 h-2 shrink-0" />
                                {s.framework}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Coaching context */}
                        <div className="px-3 pb-2">
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{s.content}</p>
                        </div>

                        {/* Verbatim Script Block — collapsible */}
                        {s.script && (
                          <div className="mx-3 mb-2 rounded-lg bg-background/60 border border-border/60 overflow-hidden">
                            <button
                              onClick={() => setExpandedScripts(prev => ({ ...prev, [i]: !isExpanded }))}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 bg-primary/5 border-b border-border/40 hover:bg-primary/10 transition-colors"
                            >
                              <div className="flex items-center gap-1.5">
                                <BookOpen className="w-3 h-3 text-primary/70" />
                                <span className="text-[10px] font-bold text-primary/80 uppercase tracking-wider">Exact Word Track</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(s.script!); toast.success("Script copied!"); }}
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                  Copy
                                </button>
                                <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform", isExpanded ? "rotate-180" : "")} />
                              </div>
                            </button>
                            {isExpanded && (
                              <p className="px-2.5 py-2 text-[11px] text-foreground leading-relaxed italic font-medium">
                                &ldquo;{s.script}&rdquo;
                              </p>
                            )}
                          </div>
                        )}

                        {/* Mark as Used */}
                        <div className="px-3 pb-2.5 flex items-center justify-end">
                          {s.wasActedOn ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                              <ThumbsUp className="w-3 h-3" /> Used
                            </span>
                          ) : (
                            <button
                              onClick={() => handleMarkUsed(i, s.id)}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all"
                            >
                              <ThumbsUp className="w-2.5 h-2.5" /> Mark as Used
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )
              )}

              {activeTab === "compliance" && (
                complianceFlags.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <CheckCircle2 className="w-8 h-8 text-green-400/50 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No Compliance Issues</p>
                    <p className="text-xs text-muted-foreground mt-1">Compliance monitoring is active. Any issues will appear here.</p>
                  </div>
                ) : (
                  complianceFlags.map((flag, i) => (
                    <div key={i} className={cn(
                      "p-3 rounded-xl border",
                      flag.severity === "critical" ? "bg-red-500/5 border-red-500/25" :
                      flag.severity === "warning" ? "bg-yellow-500/5 border-yellow-500/25" :
                      "bg-blue-500/5 border-blue-500/25"
                    )}>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={cn(
                          "w-3.5 h-3.5 mt-0.5 shrink-0",
                          flag.severity === "critical" ? "text-red-400" :
                          flag.severity === "warning" ? "text-yellow-400" : "text-blue-400"
                        )} />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-bold text-foreground">{flag.rule}</p>
                            <Badge variant="outline" className={cn(
                              "text-[9px] px-1.5 py-0 h-4",
                              flag.severity === "critical" ? "border-red-500/30 text-red-400" :
                              flag.severity === "warning" ? "border-yellow-500/30 text-yellow-400" : "border-blue-500/30 text-blue-400"
                            )}>
                              {flag.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{flag.description}</p>
                          {flag.excerpt && (
                            <p className="text-[10px] text-muted-foreground/60 mt-1 italic truncate">"{flag.excerpt}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
