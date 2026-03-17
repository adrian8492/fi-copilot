import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  ArrowLeft, Star, Shield, FileText, Mic, Clock,
  TrendingUp, AlertTriangle, CheckCircle2, RefreshCw, Download,
  Lightbulb, Copy, CheckCheck, ThumbsUp, User, Car, Hash, Tag, Trash2, DollarSign, Save, Target,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AudioWaveform from "@/components/AudioWaveform";
import { SessionNotes } from "@/components/SessionNotes";
import { PrintReportButton } from "@/components/PrintReportButton";
import { AsuraScorecard } from "@/components/AsuraScorecard";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function ScoreBar({ label, score, max = 100 }: { label: string; score: number | null; max?: number }) {
  const pct = score !== null ? Math.round((score / max) * 100) : 0;
  const color = pct >= 85 ? "bg-green-500" : pct >= 70 ? "bg-yellow-500" : pct >= 55 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("text-xs font-bold", pct >= 85 ? "text-green-400" : pct >= 70 ? "text-yellow-400" : pct >= 55 ? "text-orange-400" : "text-red-400")}>
          {score !== null ? `${score}/${max}` : "—"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const sessionId = parseInt(id ?? "0");

  const { data: session, isLoading } = trpc.sessions.get.useQuery({ id: sessionId });
  const { data: grade, refetch: refetchGrade } = trpc.grades.get.useQuery({ sessionId });
  const { data: transcripts } = trpc.transcripts.getBySession.useQuery({ sessionId });
  const { data: complianceFlags } = trpc.compliance.getFlags.useQuery({ sessionId });
  const { data: coachingReport } = trpc.reports.get.useQuery({ sessionId });
  const { data: sessionFull } = trpc.sessions.getWithDetails.useQuery({ id: sessionId });
  const { data: utilization, refetch: refetchUtilization } = trpc.transcripts.getUtilization.useQuery({ sessionId });
  const { data: recordings } = trpc.recordings.getBySession.useQuery({ sessionId });
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const markUsedMutation = trpc.transcripts.markUsed.useMutation({
    onSuccess: () => refetchUtilization(),
  });
  const [usedIds, setUsedIds] = useState<Set<number>>(new Set());
  const suggestions = sessionFull?.suggestions ?? [];
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleMarkUsed = (suggId: number) => {
    setUsedIds(prev => new Set(Array.from(prev).concat(suggId)));
    markUsedMutation.mutate({ suggestionId: suggId, wasActedOn: true });
    toast.success("Word track marked as used!");
  };
  const copyScript = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateGrade = trpc.grades.generate.useMutation({
    onSuccess: () => { refetchGrade(); toast.success("Grade generated!"); },
    onError: () => toast.error("Grade generation failed."),
  });
  const generateCoaching = trpc.reports.generate.useMutation({
    onSuccess: () => toast.success("Coaching report generated!"),
    onError: () => toast.error("Report generation failed."),
  });

  // Deal details state
  const [dealEdit, setDealEdit] = useState<{
    vehicleYear: string; vehicleMake: string; vehicleModel: string; vin: string;
    salePrice: string; tradeValue: string; amountFinanced: string; lenderName: string;
    apr: string; termMonths: string; monthlyPayment: string;
  } | null>(null);
  const updateDealDetails = trpc.sessions.updateDealDetails.useMutation({
    onSuccess: () => {
      utils.sessions.get.invalidate({ id: sessionId });
      setDealEdit(null);
      toast.success("Deal details saved.");
    },
    onError: (err) => toast.error(err.message || "Failed to save deal details."),
  });
  const handleSaveDeal = () => {
    if (!dealEdit) return;
    const parseNum = (s: string) => s.trim() === "" ? null : parseFloat(s);
    const parseIntVal = (s: string): number | null => s.trim() === "" ? null : Number.parseInt(s, 10);
    updateDealDetails.mutate({
      sessionId,
      vehicleYear: dealEdit.vehicleYear || null,
      vehicleMake: dealEdit.vehicleMake || null,
      vehicleModel: dealEdit.vehicleModel || null,
      vin: dealEdit.vin || null,
      salePrice: parseNum(dealEdit.salePrice),
      tradeValue: parseNum(dealEdit.tradeValue),
      amountFinanced: parseNum(dealEdit.amountFinanced),
      lenderName: dealEdit.lenderName || null,
      apr: parseNum(dealEdit.apr),
      termMonths: parseIntVal(dealEdit.termMonths),
      monthlyPayment: parseNum(dealEdit.monthlyPayment),
    });
  };

  const deleteSession = trpc.sessions.delete.useMutation({
    onSuccess: () => {
      toast.success("Session and all associated data permanently deleted.");
      navigate("/history");
    },
    onError: (err: { message: string }) => toast.error(err.message || "Failed to delete session."),
  });
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const reTranscribe = trpc.recordings.reTranscribe.useMutation({
    onSuccess: (data) => {
      utils.transcripts.getBySession.invalidate({ sessionId });
      toast.success(`Re-transcription complete: ${data.newTranscriptCount} segments created (${data.deletedCount} old entries replaced)`);
    },
    onError: (err) => toast.error(err.message || "Re-transcription failed"),
  });

  // Auto-scroll transcript during playback
  useEffect(() => {
    if (!isPlaying || !transcripts || transcripts.length === 0) return;
    const activeIdx = transcripts.findIndex((entry, idx) => {
      const entryTime = entry.startTime ?? 0;
      const nextTime = idx < transcripts.length - 1 ? (transcripts[idx + 1].startTime ?? Infinity) : Infinity;
      return currentPlaybackTime >= entryTime && currentPlaybackTime < nextTime;
    });
    if (activeIdx >= 0) {
      const el = document.getElementById(`transcript-${transcripts[activeIdx].id}`);
      if (el && transcriptScrollRef.current) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentPlaybackTime, isPlaying, transcripts]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (isLoading) {
    return (
      <AppLayout title="Session Detail">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!session) {
    return (
      <AppLayout title="Session Not Found">
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Session not found.</p>
          <Button className="mt-4" onClick={() => navigate("/history")}>Back to History</Button>
        </div>
      </AppLayout>
    );
  }

  const overallScore = grade?.overallScore ?? null;
  const scoreColor = overallScore !== null
    ? overallScore >= 85 ? "text-green-400" : overallScore >= 70 ? "text-yellow-400" : overallScore >= 55 ? "text-orange-400" : "text-red-400"
    : "text-muted-foreground";

  const criticalFlags = (complianceFlags ?? []).filter((f) => f.severity === "critical");
  const warningFlags = (complianceFlags ?? []).filter((f) => f.severity === "warning");
  void warningFlags;

  return (
    <AppLayout
      title={session.customerName ? `Session: ${session.customerName}` : `Session #${session.id}`}
      subtitle={`${session.dealType?.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? "Retail Finance"} • ${format(new Date(session.startedAt), "MMM d, yyyy h:mm a")}`}
    >
      <div className="p-6 space-y-6">
        {/* Back + Status Bar */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => navigate("/history")}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
              onClick={() => {
                const url = `/api/pdf/coaching-report/${session.id}`;
                const a = document.createElement("a");
                a.href = url;
                a.download = `coaching-report-${(session.customerName ?? `session-${session.id}`).toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
            >
              <Download className="w-4 h-4" /> Download Report
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => {
                const link = document.createElement("a");
                const query = new URLSearchParams({ sessionId: String(sessionId), format: "json" });
                // Use tRPC query to fetch export data
                fetch(`/api/trpc/sessions.exportSession?input=${encodeURIComponent(JSON.stringify({ sessionId, format: "json" }))}`, { credentials: "include" })
                  .then(r => r.json())
                  .then(res => {
                    const data = res?.result?.data ?? res;
                    const blob = new Blob([typeof data.data === 'string' ? data.data : JSON.stringify(data, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    link.href = url;
                    link.download = data.filename ?? `session-${sessionId}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    toast.success("Session exported as JSON");
                  })
                  .catch(() => toast.error("Export failed"));
              }}
            >
              <FileText className="w-3.5 h-3.5" /> Export JSON
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => {
                fetch(`/api/trpc/sessions.exportSession?input=${encodeURIComponent(JSON.stringify({ sessionId, format: "csv" }))}`, { credentials: "include" })
                  .then(r => r.json())
                  .then(res => {
                    const data = res?.result?.data ?? res;
                    const blob = new Blob([typeof data.data === 'string' ? data.data : ''], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = data.filename ?? `session-${sessionId}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    toast.success("Session exported as CSV");
                  })
                  .catch(() => toast.error("Export failed"));
              }}
            >
              <FileText className="w-3.5 h-3.5" /> Export CSV
            </Button>
            <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteReason(""); }}>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs text-red-400 border-red-400/30 hover:bg-red-400/10"
                  disabled={deleteSession.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" /> {deleteSession.isPending ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Permanently Delete Session?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this session and all associated data including transcripts, compliance flags, grades, coaching reports, checklists, and audio recordings. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="px-1">
                  <label className="text-sm font-medium text-foreground">Reason for deletion</label>
                  <input
                    type="text"
                    className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Customer requested data removal"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    maxLength={500}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={!deleteReason.trim()}
                    onClick={() => deleteSession.mutate({ sessionId, reason: deleteReason.trim() })}
                  >
                    Delete Permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <Badge variant="outline" className={cn(
            "text-xs",
            session.status === "completed" ? "border-green-500/30 text-green-400" :
            session.status === "active" ? "border-blue-500/30 text-blue-400 animate-pulse" :
            "border-border text-muted-foreground"
          )}>
            {session.status}
          </Badge>
          {session.consentObtained && (
            <Badge variant="outline" className="text-xs border-green-500/20 text-green-400/80">
              <Shield className="w-3 h-3 mr-1" /> Consent Recorded
            </Badge>
          )}
        </div>

        {/* Deal Info Strip */}
        {(session.customerName || session.dealNumber || session.vehicleType || session.dealType) && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border">
            {session.customerName && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">{session.customerName}</span>
              </div>
            )}
            {session.dealNumber && (
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Deal <span className="font-semibold text-foreground">{session.dealNumber}</span></span>
              </div>
            )}
            {session.vehicleType && (
              <div className="flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground capitalize">{session.vehicleType}</span>
              </div>
            )}
            {session.dealType && (
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground capitalize">{session.dealType.replace(/_/g, " ")}</span>
              </div>
            )}
            <div className="ml-auto text-xs text-muted-foreground">
              {format(new Date(session.startedAt), "MMM d, yyyy h:mm a")}
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[
            { label: "Overall Score", value: overallScore !== null ? `${overallScore}%` : "—", icon: Star, color: scoreColor },
            { label: "Duration", value: session.durationSeconds ? `${Math.floor(session.durationSeconds / 60)}m ${session.durationSeconds % 60}s` : "—", icon: Clock, color: "text-blue-400" },
            { label: "Compliance Flags", value: `${criticalFlags.length} critical`, icon: AlertTriangle, color: criticalFlags.length > 0 ? "text-red-400" : "text-green-400" },
            { label: "Transcript Lines", value: transcripts?.length ?? 0, icon: FileText, color: "text-purple-400" },
            { label: "Script Fidelity", value: grade?.scriptFidelityScore !== null && grade?.scriptFidelityScore !== undefined ? `${grade.scriptFidelityScore}%` : "—", icon: CheckCircle2, color: (grade?.scriptFidelityScore ?? 0) >= 70 ? "text-green-400" : "text-orange-400" },
            { label: "Word Tracks Used", value: utilization ? `${utilization.used}/${utilization.total}` : "—", icon: ThumbsUp, color: (utilization?.utilizationRate ?? 0) >= 60 ? "text-green-400" : "text-yellow-400" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className={cn("text-xl font-bold mt-1", stat.color)}>{stat.value}</p>
                  </div>
                  <stat.icon className={cn("w-5 h-5 mt-0.5", stat.color)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Coaching Insights */}
        {grade && (
          <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-primary">Quick Coaching Insights</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {grade.strengths && (
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-medium text-green-400 uppercase tracking-wider">Strength</p>
                          <p className="text-xs text-muted-foreground">{grade.strengths}</p>
                        </div>
                      </div>
                    )}
                    {grade.improvements && (
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-medium text-yellow-400 uppercase tracking-wider">Focus Area</p>
                          <p className="text-xs text-muted-foreground">{grade.improvements}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {grade.coachingNotes && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Action Items</p>
                      <p className="text-xs text-muted-foreground">{grade.coachingNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="grade">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="grade">Performance Grade</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="suggestions" className="gap-1.5">
              Co-Pilot Suggestions
              {suggestions.length > 0 && (
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{suggestions.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="coaching">Coaching Report</TabsTrigger>
            <TabsTrigger value="deal-details" className="gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              Deal Details
            </TabsTrigger>
            <TabsTrigger value="asura-scorecard" className="gap-1.5">
              <Target className="w-3.5 h-3.5" />
              ASURA Scorecard
            </TabsTrigger>
          </TabsList>

          {/* Grade Tab */}
          <TabsContent value="grade" className="mt-4">
            {grade ? (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Score Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ScoreBar label="Rapport Building" score={grade.rapportScore} max={25} />
                    <ScoreBar label="Product Presentation" score={grade.productPresentationScore} max={25} />
                    <ScoreBar label="Objection Handling" score={grade.objectionHandlingScore} max={25} />
                    <ScoreBar label="Closing Technique" score={grade.closingTechniqueScore} max={25} />
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">Overall Score</span>
                        <span className={cn("text-2xl font-bold", scoreColor)}>{overallScore}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Grade Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: "Compliance Score", value: grade.complianceScore, max: 100 },
                      { label: "Utilization Rate", value: grade.utilizationRate ? Math.round(grade.utilizationRate * 100) : null, max: 100 },
                    ].map((item) => (
                      <ScoreBar key={item.label} label={item.label} score={item.value} max={item.max} />
                    ))}
                    {(grade.strengths || grade.improvements) && (
                      <div className="mt-4 p-3 rounded-lg bg-accent/30 border border-border space-y-2">
                        {grade.strengths && <><p className="text-xs font-semibold text-green-400">Strengths</p><p className="text-sm text-foreground">{grade.strengths}</p></>}
                        {grade.improvements && <><p className="text-xs font-semibold text-yellow-400 mt-2">Areas to Improve</p><p className="text-sm text-foreground">{grade.improvements}</p></>}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Script Fidelity Score Card */}
                {(grade.scriptFidelityScore != null || grade.processAdherenceScore != null) && (
                  <Card className="bg-card border-border lg:col-span-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm">Script Fidelity Score</CardTitle>
                        <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/40">ASURA Methodology</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Measures adherence to ASURA verbatim word tracks and 7-step process sequence</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {[
                          { label: "Script Fidelity", value: grade.scriptFidelityScore, desc: "Verbatim keyword adherence" },
                          { label: "Process Adherence", value: grade.processAdherenceScore, desc: "7-step process completion" },
                          { label: "Menu Sequence", value: grade.menuSequenceScore, desc: "Menu presentation order" },
                          { label: "Objection Response", value: grade.objectionResponseScore, desc: "Objection scripts used" },
                          { label: "Transition Accuracy", value: grade.transitionAccuracyScore, desc: "Stage transitions" },
                        ].map((item) => {
                          const v = item.value ?? 0;
                          const color = v >= 80 ? "text-green-400" : v >= 60 ? "text-yellow-400" : "text-red-400";
                          const bg = v >= 80 ? "bg-green-400/10" : v >= 60 ? "bg-yellow-400/10" : "bg-red-400/10";
                          return (
                            <div key={item.label} className={`rounded-lg p-3 border border-border ${bg} text-center`}>
                              <p className={`text-2xl font-bold ${color}`}>{item.value != null ? `${Math.round(item.value)}%` : "—"}</p>
                              <p className="text-xs font-semibold text-foreground mt-1">{item.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium text-muted-foreground mb-4">No grade generated yet</p>
                  {transcripts && transcripts.length > 0 ? (
                    <Button
                      onClick={() => generateGrade.mutate({ sessionId })}
                      disabled={generateGrade.isPending}
                      className="gap-2"
                    >
                      <RefreshCw className={cn("w-4 h-4", generateGrade.isPending && "animate-spin")} />
                      {generateGrade.isPending ? "Generating..." : "Generate Grade"}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">A transcript is required before grading. Record a session or upload audio first.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-muted-foreground"
                        disabled
                      >
                        <RefreshCw className="w-4 h-4" />
                        Generate Grade
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Transcript Tab */}
          <TabsContent value="transcript" className="mt-4 space-y-4">
            {/* Audio Player */}
            {recordings && recordings.length > 0 && (
              <Card className="bg-card border-border">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0 shrink-0"
                      onClick={() => {
                        if (!audioRef.current) {
                          const audio = new Audio(recordings[0].fileUrl);
                          audioRef.current = audio;
                          audio.ontimeupdate = () => setCurrentPlaybackTime(audio.currentTime);
                          audio.onended = () => setIsPlaying(false);
                          audio.onpause = () => setIsPlaying(false);
                          audio.onplay = () => setIsPlaying(true);
                        }
                        if (isPlaying) {
                          audioRef.current.pause();
                        } else {
                          audioRef.current.play();
                        }
                      }}
                    >
                      {isPlaying ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mic className="w-3 h-3" /> Session Recording
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {Math.floor(currentPlaybackTime / 60)}:{String(Math.floor(currentPlaybackTime % 60)).padStart(2, "0")}
                          {audioRef.current?.duration ? ` / ${Math.floor(audioRef.current.duration / 60)}:${String(Math.floor(audioRef.current.duration % 60)).padStart(2, "0")}` : ""}
                        </span>
                      </div>
                      <AudioWaveform
                        audioUrl={recordings[0].fileUrl}
                        currentTime={currentPlaybackTime}
                        duration={audioRef.current?.duration ?? (session.durationSeconds ?? 0)}
                        isPlaying={isPlaying}
                        onSeek={(time) => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = time;
                          }
                        }}
                        height={40}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transcript with synchronized highlighting */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Full Transcript</CardTitle>
                  <div className="flex items-center gap-2">
                    {recordings && recordings.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs gap-1.5 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                        onClick={() => {
                          if (confirm("This will delete all existing transcripts and re-process the audio recording. Continue?")) {
                            reTranscribe.mutate({ sessionId });
                          }
                        }}
                        disabled={reTranscribe.isPending}
                      >
                        <RefreshCw className={cn("w-3 h-3", reTranscribe.isPending && "animate-spin")} />
                        {reTranscribe.isPending ? "Re-transcribing..." : "Re-transcribe from Recording"}
                      </Button>
                    )}
                    {recordings && recordings.length > 0 && isPlaying && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] animate-pulse">SYNCED</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">{transcripts?.length ?? 0} entries</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {transcripts && transcripts.length > 0 ? (
                  <div ref={transcriptScrollRef} className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {transcripts.map((entry, idx) => {
                      const entryTime = entry.startTime ?? 0;
                      const nextTime = idx < transcripts.length - 1 ? (transcripts[idx + 1].startTime ?? Infinity) : Infinity;
                      const isActive = isPlaying && currentPlaybackTime >= entryTime && currentPlaybackTime < nextTime;
                      return (
                        <div
                          key={entry.id}
                          id={`transcript-${entry.id}`}
                          className={cn(
                            "flex gap-3 transition-all duration-300 rounded-lg p-1 -m-1",
                            entry.speaker === "customer" && "flex-row-reverse",
                            isActive && "bg-primary/5 ring-1 ring-primary/20"
                          )}
                          onClick={() => {
                            if (audioRef.current && recordings && recordings.length > 0) {
                              audioRef.current.currentTime = entryTime;
                              if (!isPlaying) audioRef.current.play();
                            }
                          }}
                          style={{ cursor: recordings && recordings.length > 0 ? "pointer" : "default" }}
                        >
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                            isActive ? "bg-primary text-primary-foreground" :
                            entry.speaker === "manager" ? "bg-primary/20 text-primary" :
                            entry.speaker === "customer" ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
                          )}>
                            {entry.speaker === "manager" ? "M" : entry.speaker === "customer" ? "C" : "?"}
                          </div>
                          <div className={cn("flex-1 max-w-[80%]", entry.speaker === "customer" && "flex flex-col items-end")}>
                            <div className={cn(
                              "inline-block px-3 py-2 rounded-xl text-sm transition-colors",
                              isActive ? "bg-primary/15 border border-primary/30 text-foreground font-medium" :
                              entry.speaker === "manager" ? "bg-primary/10 border border-primary/15 text-foreground" :
                              entry.speaker === "customer" ? "bg-green-500/10 border border-green-500/15 text-foreground" :
                              "bg-card border border-border text-foreground"
                            )}>
                              {entry.text}
                            </div>
                            <div className="flex items-center gap-2 mt-1 px-1">
                              <span className="text-[10px] text-muted-foreground">
                                {entry.speaker} • {entry.startTime !== null ? `${Math.floor(entryTime / 60)}:${String(Math.floor(entryTime % 60)).padStart(2, "0")}` : "—"}
                              </span>
                              {entry.confidence !== null && entry.confidence !== undefined && (
                                <span className={cn(
                                  "text-[9px] font-medium px-1.5 py-0.5 rounded-full",
                                  entry.confidence >= 0.9 ? "bg-green-500/15 text-green-400" :
                                  entry.confidence >= 0.7 ? "bg-yellow-500/15 text-yellow-400" :
                                  "bg-red-500/15 text-red-400"
                                )}>
                                  {Math.round(entry.confidence * 100)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Mic className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-muted-foreground mb-4">No transcript available</p>
                    {recordings && recordings.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                        onClick={() => reTranscribe.mutate({ sessionId })}
                        disabled={reTranscribe.isPending}
                      >
                        <RefreshCw className={cn("w-4 h-4", reTranscribe.isPending && "animate-spin")} />
                        {reTranscribe.isPending ? "Re-transcribing..." : "Re-transcribe from Recording"}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="mt-4">
            <div className="space-y-4">
              {complianceFlags && complianceFlags.length > 0 ? complianceFlags.map((flag) => (
                <Card key={flag.id} className={cn(
                  "border",
                  (flag.severity as string) === "critical" ? "bg-red-500/5 border-red-500/20" :
                  (flag.severity as string) === "warning" ? "bg-yellow-500/5 border-yellow-500/20" :
                  "bg-blue-500/5 border-blue-500/20"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className={cn(
                          "w-4 h-4 mt-0.5 shrink-0",
                          (flag.severity as string) === "critical" ? "text-red-400" :
                          (flag.severity as string) === "warning" ? "text-yellow-400" : "text-blue-400"
                      )} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground">{flag.rule}</p>
                          <Badge variant="outline" className={cn(
                            "text-[10px]",
                            (flag.severity as string) === "critical" ? "border-red-500/30 text-red-400" :
                            (flag.severity as string) === "warning" ? "border-yellow-500/30 text-yellow-400" : "border-blue-500/30 text-blue-400"
                          )}>
                            {flag.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{flag.description}</p>
                        {flag.excerpt && (
                          <p className="text-xs text-muted-foreground/60 mt-2 italic">"{flag.excerpt}"</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <Card className="bg-card border-border">
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3 opacity-60" />
                    <p className="text-sm font-medium text-muted-foreground">No compliance issues detected</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Co-Pilot Suggestions Tab */}
          <TabsContent value="suggestions" className="mt-4">
            {/* Utilization Rate Header */}
            {utilization && suggestions.length > 0 && (
              <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-card border border-border">
                <ThumbsUp className="w-4 h-4 text-emerald-400" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground">Word Track Utilization</p>
                  <p className="text-xs text-muted-foreground">{utilization.used} of {utilization.total} suggestions marked as used</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-xl font-bold", utilization.utilizationRate >= 70 ? "text-emerald-400" : utilization.utilizationRate >= 40 ? "text-yellow-400" : "text-red-400")}>
                    {utilization.utilizationRate}%
                  </p>
                </div>
              </div>
            )}
            {suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.map((s) => {
                  const isHigh = s.priority === "high";
                  const isMed = s.priority === "medium";
                  const borderBg = isHigh ? "border-red-500/30 bg-red-500/5" : isMed ? "border-yellow-500/30 bg-yellow-500/5" : "border-blue-500/30 bg-blue-500/5";
                  const badgeColor = isHigh ? "border-red-500/30 text-red-400" : isMed ? "border-yellow-500/30 text-yellow-400" : "border-blue-500/30 text-blue-400";
                  const iconColor = isHigh ? "text-red-400" : isMed ? "text-yellow-400" : "text-blue-400";
                  return (
                    <Card key={s.id} className={cn("border", borderBg)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Lightbulb className={cn("w-4 h-4 mt-0.5 shrink-0", iconColor)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="text-sm font-semibold text-foreground">{s.title}</p>
                              <Badge variant="outline" className={cn("text-[10px]", badgeColor)}>{s.priority}</Badge>
                              <Badge variant="outline" className="text-[10px] border-border text-muted-foreground capitalize">
                                {s.type.replace(/_/g, " ")}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground/50 ml-auto">
                                {format(new Date(s.createdAt), "h:mm:ss a")}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{s.content}</p>
                            {s.script && (
                              <div className="bg-background/60 border border-border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Verbatim Word Track</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[10px] gap-1"
                                    onClick={() => copyScript(s.script!, s.id)}
                                  >
                                    {copiedId === s.id
                                      ? <CheckCheck className="w-3 h-3 text-green-400" />
                                      : <Copy className="w-3 h-3" />}
                                    {copiedId === s.id ? "Copied" : "Copy"}
                                  </Button>
                                </div>
                                <p className="text-sm text-foreground italic leading-relaxed">&ldquo;{s.script}&rdquo;</p>
                                {s.framework && (
                                  <p className="text-[10px] text-muted-foreground/50 mt-2">Source: {s.framework}</p>
                                )}
                              </div>
                            )}
                            {s.triggeredBy && (
                              <p className="text-[10px] text-muted-foreground/40 mt-2">Triggered by: &ldquo;{s.triggeredBy}&rdquo;</p>
                            )}
                            {/* Mark as Used */}
                            <div className="mt-3 flex justify-end">
                              {(s.wasActedOn || usedIds.has(s.id)) ? (
                                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                                  <ThumbsUp className="w-3.5 h-3.5" /> Used in session
                                </span>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-3 text-xs gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                  onClick={() => handleMarkUsed(s.id)}
                                >
                                  <ThumbsUp className="w-3 h-3" /> Mark as Used
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <Lightbulb className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium text-muted-foreground">No co-pilot suggestions recorded for this session</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">Suggestions are captured in real-time during live sessions</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Coaching Report Tab */}
          <TabsContent value="coaching" className="mt-4">
            {coachingReport ? (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">AI Coaching Report</CardTitle>
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary">AI Report</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm prose-invert max-w-none">
                    <Streamdown>{coachingReport.executiveSummary ?? coachingReport.recommendations ?? ""}</Streamdown>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium text-muted-foreground mb-4">No grade generated yet</p>
                  {transcripts && transcripts.length > 0 ? (
                    <Button
                      onClick={() => generateGrade.mutate({ sessionId })}
                      disabled={generateGrade.isPending}
                      className="gap-2"
                    >
                      <RefreshCw className={cn("w-4 h-4", generateGrade.isPending && "animate-spin")} />
                      {generateGrade.isPending ? "Generating..." : "Generate Grade"}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">A transcript is required before grading. Record a session or upload audio first.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-muted-foreground"
                        disabled
                      >
                        <RefreshCw className="w-4 h-4" />
                        Generate Grade
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Deal Details Tab */}
          <TabsContent value="deal-details" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Deal Details
                  </CardTitle>
                  {!dealEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDealEdit({
                        vehicleYear: session.vehicleYear ?? "",
                        vehicleMake: session.vehicleMake ?? "",
                        vehicleModel: session.vehicleModel ?? "",
                        vin: session.vin ?? "",
                        salePrice: session.salePrice != null ? String(session.salePrice) : "",
                        tradeValue: session.tradeValue != null ? String(session.tradeValue) : "",
                        amountFinanced: session.amountFinanced != null ? String(session.amountFinanced) : "",
                        lenderName: session.lenderName ?? "",
                        apr: session.apr != null ? String(session.apr) : "",
                        termMonths: session.termMonths != null ? String(session.termMonths) : "",
                        monthlyPayment: session.monthlyPayment != null ? String(session.monthlyPayment) : "",
                      })}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {dealEdit ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Year</Label>
                        <Input value={dealEdit.vehicleYear} onChange={e => setDealEdit(p => p && ({ ...p, vehicleYear: e.target.value }))} placeholder="2024" maxLength={4} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Make</Label>
                        <Input value={dealEdit.vehicleMake} onChange={e => setDealEdit(p => p && ({ ...p, vehicleMake: e.target.value }))} placeholder="Toyota" />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-xs">Model</Label>
                        <Input value={dealEdit.vehicleModel} onChange={e => setDealEdit(p => p && ({ ...p, vehicleModel: e.target.value }))} placeholder="Camry XSE" />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-xs">VIN</Label>
                        <Input value={dealEdit.vin} onChange={e => setDealEdit(p => p && ({ ...p, vin: e.target.value }))} placeholder="1HGCM82633A004352" maxLength={17} className="font-mono" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Sale Price ($)</Label>
                        <Input type="number" value={dealEdit.salePrice} onChange={e => setDealEdit(p => p && ({ ...p, salePrice: e.target.value }))} placeholder="32500" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Trade Value ($)</Label>
                        <Input type="number" value={dealEdit.tradeValue} onChange={e => setDealEdit(p => p && ({ ...p, tradeValue: e.target.value }))} placeholder="8000" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Amount Financed ($)</Label>
                        <Input type="number" value={dealEdit.amountFinanced} onChange={e => setDealEdit(p => p && ({ ...p, amountFinanced: e.target.value }))} placeholder="24500" />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-xs">Lender</Label>
                        <Input value={dealEdit.lenderName} onChange={e => setDealEdit(p => p && ({ ...p, lenderName: e.target.value }))} placeholder="Chase Auto" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">APR (%)</Label>
                        <Input type="number" step="0.01" value={dealEdit.apr} onChange={e => setDealEdit(p => p && ({ ...p, apr: e.target.value }))} placeholder="6.99" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Term (months)</Label>
                        <Input type="number" value={dealEdit.termMonths} onChange={e => setDealEdit(p => p && ({ ...p, termMonths: e.target.value }))} placeholder="72" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Monthly Payment ($)</Label>
                        <Input type="number" value={dealEdit.monthlyPayment} onChange={e => setDealEdit(p => p && ({ ...p, monthlyPayment: e.target.value }))} placeholder="425" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => setDealEdit(null)}>Cancel</Button>
                      <Button size="sm" onClick={handleSaveDeal} disabled={updateDealDetails.isPending} className="gap-2">
                        <Save className="w-3.5 h-3.5" />
                        {updateDealDetails.isPending ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Vehicle", value: [session.vehicleYear, session.vehicleMake, session.vehicleModel].filter(Boolean).join(" ") || null },
                      { label: "VIN", value: session.vin, mono: true },
                      { label: "Sale Price", value: session.salePrice != null ? `$${Number(session.salePrice).toLocaleString()}` : null },
                      { label: "Trade Value", value: session.tradeValue != null ? `$${Number(session.tradeValue).toLocaleString()}` : null },
                      { label: "Amount Financed", value: session.amountFinanced != null ? `$${Number(session.amountFinanced).toLocaleString()}` : null },
                      { label: "Lender", value: session.lenderName },
                      { label: "APR", value: session.apr != null ? `${session.apr}%` : null },
                      { label: "Term", value: session.termMonths != null ? `${session.termMonths} mo` : null },
                      { label: "Monthly Payment", value: session.monthlyPayment != null ? `$${Number(session.monthlyPayment).toLocaleString()}` : null },
                    ].map(({ label, value, mono }) => (
                      <div key={label} className="space-y-0.5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                        <p className={cn("text-sm font-medium", mono && "font-mono text-xs", !value && "text-muted-foreground italic")}>
                          {value ?? "Not entered"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ASURA OPS Scorecard Tab */}
          <TabsContent value="asura-scorecard" className="mt-4">
            <AsuraScorecard
              sessionId={sessionId}
              hasTranscript={!!(transcripts && transcripts.length > 0)}
            />
          </TabsContent>
        </Tabs>

        {/* Session Notes */}
        <SessionNotes sessionId={sessionId} initialNotes={session?.notes ?? null} />

        {/* Print Report */}
        <div className="flex justify-end">
          <PrintReportButton />
        </div>
      </div>
    </AppLayout>
  );
}
