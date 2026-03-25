import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Activity, Mic, Database, Brain, Shield, FileText, Wifi } from "lucide-react";

const statusIcons: Record<string, React.ReactNode> = {
  pass: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
  fail: <XCircle className="h-5 w-5 text-red-400" />,
  warn: <AlertTriangle className="h-5 w-5 text-amber-400" />,
};

const statusColors: Record<string, string> = {
  pass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  fail: "bg-red-500/10 text-red-400 border-red-500/20",
  warn: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const checkIcons: Record<string, React.ReactNode> = {
  "Deepgram API Key": <Mic className="h-4 w-4" />,
  "Deepgram Live Stream": <Activity className="h-4 w-4" />,
  "Database": <Database className="h-4 w-4" />,
  "LLM API (Forge)": <Brain className="h-4 w-4" />,
  "Transport Mode": <Wifi className="h-4 w-4" />,
  "Compliance Engine": <Shield className="h-4 w-4" />,
  "ASURA Script Library": <FileText className="h-4 w-4" />,
};

export default function PipelineDiagnostics() {
  useEffect(() => { document.title = "Pipeline Diagnostics | F&I Co-Pilot by ASURA Group"; }, []);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const { data, isLoading, refetch, isFetching } = trpc.diagnostics.pipelineHealth.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const handleRefresh = () => {
    setLastRefresh(new Date());
    refetch();
  };

  const isHealthy = data?.status === "healthy" || data?.status === "operational";
  const overallColor = isHealthy ? "text-emerald-400" : data?.status === "degraded" ? "text-amber-400" : "text-red-400";
  const overallBg = isHealthy ? "bg-emerald-500/10 border-emerald-500/30" : data?.status === "degraded" ? "bg-amber-500/10 border-amber-500/30" : "bg-red-500/10 border-red-500/30";

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-6 w-6 text-cyan-400" />
              Pipeline Diagnostics
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time health check of the transcription, co-pilot, and compliance pipeline
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isFetching}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Checking..." : "Run Diagnostics"}
          </Button>
        </div>

        {/* Overall Status */}
        {data && (
          <Card className={`border ${overallBg}`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`text-3xl font-bold ${overallColor}`}>
                    {isHealthy ? "✓" : data.status === "degraded" ? "⚠" : "✗"}
                  </div>
                  <div>
                    <div className={`text-lg font-semibold ${overallColor} uppercase`}>
                      {data.status}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {data.checks.filter(c => c.status === "pass").length}/{data.checks.length} checks passed
                      {data.uptime != null && ` · Server uptime: ${Math.floor(data.uptime / 60)}m ${data.uptime % 60}s`}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {lastRefresh ? `Last checked: ${lastRefresh.toLocaleTimeString()}` : ""}
                  <br />
                  {data.environment}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-3" />
              <p className="text-muted-foreground">Running pipeline diagnostics...</p>
            </CardContent>
          </Card>
        )}

        {/* Individual Checks */}
        {data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Component Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.checks.map((check, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${statusColors[check.status]}`}
                >
                  <div className="mt-0.5">{statusIcons[check.status]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {checkIcons[check.name] || <Activity className="h-4 w-4" />}
                      <span className="font-medium text-sm">{check.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${statusColors[check.status]}`}
                      >
                        {check.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs mt-1 opacity-80 break-words">{check.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Architecture Diagram */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pipeline Architecture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono text-muted-foreground bg-black/30 rounded-lg p-4 overflow-x-auto">
              <pre>{`┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Chrome Browser │     │   Express Server  │     │    Deepgram     │
│                 │     │                   │     │   (nova-2)      │
│ getUserMedia()  │────▶│ POST /api/session │────▶│                 │
│ MediaRecorder   │     │      /audio       │     │ Live STT        │
│ (WebM/Opus)     │     │                   │     │                 │
│                 │◀────│ SSE /api/session  │◀────│ Transcript      │
│ EventSource     │     │      /events      │     │ Events          │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
              ┌─────▼─────┐        ┌──────▼──────┐
              │  ASURA     │        │  Federal    │
              │  Co-Pilot  │        │  Compliance │
              │  Engine    │        │  Engine     │
              │            │        │             │
              │ • Quick    │        │ • TILA      │
              │   triggers │        │ • ECOA      │
              │ • LLM      │        │ • UDAP      │
              │   analysis │        │ • CLA       │
              │ • Script   │        │ • GAP/VSC   │
              │   library  │        │ • Contract  │
              └────────────┘        └─────────────┘

Transport: HTTP Streaming (WebSocket blocked by proxy)
Audio:     WebM/Opus from MediaRecorder → binary POST
Events:    Server-Sent Events (SSE) for real-time updates
`}</pre>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Troubleshooting Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-1">No transcript appearing?</h4>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Check that microphone permission is granted in Chrome (look for the mic icon in the address bar)</li>
                <li>Verify the audio level indicator shows activity when you speak</li>
                <li>Check that Deepgram API Key and Live Stream show "pass" above</li>
                <li>Open Chrome DevTools Console (F12) and look for <code className="bg-black/30 px-1 rounded">[Pipeline]</code> or <code className="bg-black/30 px-1 rounded">[HTTP-Stream]</code> messages</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Co-pilot suggestions not appearing?</h4>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Suggestions require 20+ seconds of conversation or 50+ words of transcript</li>
                <li>Quick triggers fire instantly on specific keywords (e.g., "how much", "too expensive", "warranty")</li>
                <li>Verify LLM API (Forge) shows "pass" above</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Compliance alerts not firing?</h4>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Compliance checks only run on manager speech (speaker 0 / left channel)</li>
                <li>Rules trigger on specific phrases — try saying "this product is required" or "you have to buy this"</li>
                <li>Verify Compliance Engine shows "pass" above</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Transport Mode shows "warn"?</h4>
              <p className="ml-2">
                This is expected. The Manus hosting proxy does not support WebSocket upgrades, so the app
                automatically uses HTTP streaming (POST for audio, SSE for events). This is functionally
                equivalent and does not affect transcription quality.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
