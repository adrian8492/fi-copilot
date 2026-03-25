import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Upload, FileAudio, CheckCircle2, AlertCircle, Loader2,
  X, Play, RefreshCw, Trash2,
} from "lucide-react";

type UploadFile = {
  id: string;
  file: File;
  status: "pending" | "uploading" | "processing" | "done" | "error";
  progress: number;
  sessionId?: number;
  recordingId?: number;
  error?: string;
};

export default function BatchUpload() {
  useEffect(() => { document.title = "Batch Upload | F&I Co-Pilot by ASURA Group"; }, []);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: myRecordings, refetch: refetchRecordings } = trpc.recordings.myRecordings.useQuery({ limit: 20 });

  const createSession = trpc.sessions.create.useMutation();
  const uploadRecording = trpc.recordings.upload.useMutation();
  const transcribeRecording = trpc.recordings.transcribe.useMutation();
  const generateGrade = trpc.grades.generate.useMutation();

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const newFiles: UploadFile[] = Array.from(incoming)
      .filter((f) => f.type.startsWith("audio/") || f.name.match(/\.(mp3|wav|m4a|ogg|webm|mp4)$/i))
      .map((f) => ({
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        file: f,
        status: "pending",
        progress: 0,
      }));
    if (newFiles.length === 0) {
      toast.error("Please upload audio files (mp3, wav, m4a, ogg, webm)");
      return;
    }
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const updateFile = (id: string, update: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...update } : f)));
  };

  const processFile = async (uploadFile: UploadFile) => {
    updateFile(uploadFile.id, { status: "uploading", progress: 10 });
    try {
      // 1. Create a session for this recording
      const session = await createSession.mutateAsync({
        customerName: uploadFile.file.name.replace(/\.[^.]+$/, ""),
        dealType: "retail_finance",
        consentObtained: true,
        consentMethod: "electronic" as const,
      });
      updateFile(uploadFile.id, { sessionId: session.id, progress: 30 });

      // 2. Convert file to base64 for upload
      const arrayBuffer = await uploadFile.file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
      const base64 = btoa(binary);
      const dataUrl = `data:${uploadFile.file.type || "audio/mpeg"};base64,${base64}`;

      // 3. Upload recording
      const recording = await uploadRecording.mutateAsync({
        sessionId: session.id,
        fileName: uploadFile.file.name,
        mimeType: uploadFile.file.type || "audio/mpeg",
        fileSizeBytes: uploadFile.file.size,
        fileDataBase64: base64,
      });
      updateFile(uploadFile.id, { recordingId: recording.id, status: "processing", progress: 60 });

      // 4. Transcribe
      await transcribeRecording.mutateAsync({
        recordingId: recording.id,
        sessionId: session.id,
      });
      updateFile(uploadFile.id, { progress: 85 });

      // 5. Auto-grade — run the full ASURA grading engine on the transcript
      try {
        await generateGrade.mutateAsync({ sessionId: session.id });
        toast.success(`Graded: ${uploadFile.file.name}`);
      } catch {
        // Grading failure is non-fatal — session is still transcribed
        toast.warning(`Transcribed but grading failed for ${uploadFile.file.name}`);
      }
      updateFile(uploadFile.id, { status: "done", progress: 100 });
      refetchRecordings();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Processing failed";
      updateFile(uploadFile.id, { status: "error", error: msg });
    }
  };

  const processAll = async () => {
    const pending = files.filter((f) => f.status === "pending");
    for (const f of pending) {
      await processFile(f);
    }
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const statusIcon = (status: UploadFile["status"]) => {
    if (status === "done") return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    if (status === "error") return <AlertCircle className="w-4 h-4 text-red-400" />;
    if (status === "uploading" || status === "processing") return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    return <FileAudio className="w-4 h-4 text-muted-foreground" />;
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const doneCount = files.filter((f) => f.status === "done").length;

  return (
    <AppLayout title="Batch Upload" subtitle="Process historical recordings for training and analysis">
      <div className="p-6 space-y-6">
        {/* Drop Zone */}
        <Card
          className={cn(
            "border-2 border-dashed transition-colors cursor-pointer",
            isDragging ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="py-12 text-center">
            <Upload className={cn("w-10 h-10 mx-auto mb-3 transition-colors", isDragging ? "text-primary" : "text-muted-foreground opacity-50")} />
            <p className="text-sm font-medium text-foreground mb-1">
              {isDragging ? "Drop files here" : "Drag & drop audio files or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">Supports MP3, WAV, M4A, OGG, WebM (max 16MB each)</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </CardContent>
        </Card>

        {/* File Queue */}
        {files.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  Upload Queue
                  <span className="ml-2 text-muted-foreground font-normal">
                    {doneCount}/{files.length} processed
                  </span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-muted-foreground"
                    onClick={() => setFiles([])}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Clear All
                  </Button>
                  {pendingCount > 0 && (
                    <Button size="sm" onClick={processAll} className="gap-2 text-xs">
                      <Play className="w-3 h-3" /> Process {pendingCount} File{pendingCount !== 1 ? "s" : ""}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/20 border border-border">
                  {statusIcon(f.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground truncate">{f.file.name}</p>
                      <Badge variant="outline" className={cn(
                        "text-[10px] shrink-0",
                        f.status === "done" ? "border-green-500/30 text-green-400" :
                        f.status === "error" ? "border-red-500/30 text-red-400" :
                        f.status === "pending" ? "border-border text-muted-foreground" :
                        "border-primary/30 text-primary"
                      )}>
                        {f.status}
                      </Badge>
                    </div>
                    {(f.status === "uploading" || f.status === "processing") && (
                      <Progress value={f.progress} className="h-1.5" />
                    )}
                    {f.error && <p className="text-xs text-red-400 mt-0.5">{f.error}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(f.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {f.status === "error" && (
                      <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => processFile(f)}>
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    )}
                    {(f.status === "pending" || f.status === "done" || f.status === "error") && (
                      <Button size="icon" variant="ghost" className="w-7 h-7 text-muted-foreground" onClick={() => removeFile(f.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Recordings */}
        {myRecordings && myRecordings.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Recent Recordings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {myRecordings.map((rec) => (
                <div key={rec.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 border border-border">
                  <FileAudio className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{rec.fileName ?? `Recording #${rec.id}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {rec.fileSizeBytes ? `${(rec.fileSizeBytes / 1024 / 1024).toFixed(1)} MB` : ""} • Session #{rec.sessionId}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[10px] shrink-0",
                    rec.status === "transcribed" ? "border-green-500/30 text-green-400" :
                    rec.status === "processing" ? "border-primary/30 text-primary" :
                    rec.status === "failed" ? "border-red-500/30 text-red-400" :
                    "border-border text-muted-foreground"
                  )}>
                    {rec.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
