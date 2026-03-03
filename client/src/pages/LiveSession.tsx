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
  type: string;
  title: string;
  content: string;
  priority: "high" | "medium" | "low";
  triggeredBy: string;
  timestamp: number;
}

interface ComplianceFlag {
  severity: "critical" | "warning" | "info";
  rule: string;
  description: string;
  excerpt: string;
  timestamp: number;
}

type SpeakerMode = "manager" | "customer" | "auto";
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

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  const createSession = trpc.sessions.create.useMutation();
  const endSessionMutation = trpc.sessions.end.useMutation();
  const analyzeTranscript = trpc.transcripts.analyze.useMutation();
  const generateGrade = trpc.grades.generate.useMutation();

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

  // WebSocket connection
  const connectWebSocket = useCallback((sid: number) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/session`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: "start_session", sessionId: sid, userId: user?.id }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case "transcript":
          if (msg.data?.text) {
            setTranscripts((prev) => {
              const entry: TranscriptEntry = {
                id: `${Date.now()}-${Math.random()}`,
                speaker: msg.data.speaker ?? "unknown",
                text: msg.data.text,
                timestamp: msg.data.startTime ?? elapsed,
                isFinal: msg.data.isFinal ?? true,
              };
              return [...prev, entry];
            });
          }
          break;
        case "suggestion":
          if (msg.data) {
            setSuggestions((prev) => [{ ...msg.data, timestamp: Date.now() }, ...prev].slice(0, 10));
            setActiveTab("copilot");
          }
          break;
        case "compliance_flag":
          if (msg.data) {
            setComplianceFlags((prev) => [{ ...msg.data, timestamp: Date.now() }, ...prev]);
            if (msg.data.severity === "critical") {
              toast.error(`Compliance: ${msg.data.rule}`, { description: msg.data.description });
              setActiveTab("compliance");
            }
          }
          break;
        case "session_ended":
          setIsRecording(false);
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = () => {
      toast.error("Connection error. Transcript may be incomplete.");
    };
  }, [user?.id, elapsed]);

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

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "transcript_chunk",
            text,
            speaker,
            isFinal,
            confidence: result[0].confidence,
            startTime: elapsed,
          }));
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Connect WebSocket
      connectWebSocket(session.id);

      // Start recording
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);

      // Start speech recognition
      setTimeout(() => startSpeechRecognition(), 500);

      toast.success("Session started. Recording active.");
    } catch (e) {
      toast.error("Failed to start session. Check microphone permissions.");
      console.error(e);
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;

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

    // Notify WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "end_session" }));
      wsRef.current.close();
    }

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
            <span className="text-[10px] font-medium text-muted-foreground">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>

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
          <div className="w-80 xl:w-96 flex flex-col shrink-0">
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
                    return (
                      <div key={i} className={cn(
                        "suggestion-card p-3 rounded-xl border",
                        s.priority === "high" ? "bg-red-500/5 border-red-500/20" :
                        s.priority === "medium" ? "bg-yellow-500/5 border-yellow-500/20" :
                        "bg-blue-500/5 border-blue-500/20"
                      )}>
                        <div className="flex items-start gap-2.5">
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                            s.priority === "high" ? "bg-red-500/15" :
                            s.priority === "medium" ? "bg-yellow-500/15" : "bg-blue-500/15"
                          )}>
                            <Icon className={cn(
                              "w-3.5 h-3.5",
                              s.priority === "high" ? "text-red-400" :
                              s.priority === "medium" ? "text-yellow-400" : "text-blue-400"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-bold text-foreground truncate">{s.title}</p>
                              <Badge variant="outline" className={cn(
                                "text-[9px] px-1.5 py-0 h-4 shrink-0",
                                s.priority === "high" ? "border-red-500/30 text-red-400" :
                                s.priority === "medium" ? "border-yellow-500/30 text-yellow-400" : "border-blue-500/30 text-blue-400"
                              )}>
                                {s.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{s.content}</p>
                          </div>
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
