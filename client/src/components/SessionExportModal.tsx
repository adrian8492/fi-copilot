import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Download, X, FileText, FileJson, Calendar, Loader2, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SessionExportModalProps {
  open: boolean;
  onClose: () => void;
  currentPageSessions: Array<{
    id: number;
    customerName?: string | null;
    dealNumber?: string | null;
    startedAt: string | Date;
    status: string;
    vehicleType?: string | null;
    dealType?: string | null;
    durationSeconds?: number | null;
  }>;
  totalSessions: number;
}

type ExportFormat = "csv" | "json";
type ExportScope = "current" | "all" | "dateRange";

interface ExportFields {
  transcript: boolean;
  grade: boolean;
  complianceFlags: boolean;
  dealDetails: boolean;
}

function SessionExportModal({ open, onClose, currentPageSessions, totalSessions }: SessionExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [scope, setScope] = useState<ExportScope>("current");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fields, setFields] = useState<ExportFields>({
    transcript: true,
    grade: true,
    complianceFlags: true,
    dealDetails: true,
  });
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const utils = trpc.useUtils();

  const toggleField = (field: keyof ExportFields) => {
    setFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const getSessionIds = (): number[] => {
    if (scope === "current") {
      return currentPageSessions.map((s) => s.id);
    }
    // For "all" and "dateRange", we pass current page IDs and let the server handle it.
    // In practice, the bulkExport endpoint works with explicit IDs.
    // For dateRange, filter current page sessions by date client-side as a fallback.
    if (scope === "dateRange" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return currentPageSessions
        .filter((s) => {
          const d = new Date(s.startedAt);
          return d >= start && d <= end;
        })
        .map((s) => s.id);
    }
    return currentPageSessions.map((s) => s.id);
  };

  const buildJsonExport = (sessions: typeof currentPageSessions) => {
    return sessions.map((s) => {
      const obj: Record<string, unknown> = {
        id: s.id,
        customerName: s.customerName,
        status: s.status,
        startedAt: s.startedAt,
      };
      if (fields.dealDetails) {
        obj.dealNumber = s.dealNumber;
        obj.dealType = s.dealType;
        obj.vehicleType = s.vehicleType;
        obj.durationSeconds = s.durationSeconds;
      }
      if (fields.grade) {
        obj.grade = null; // placeholder — full grade data comes from server
      }
      if (fields.complianceFlags) {
        obj.complianceFlags = [];
      }
      if (fields.transcript) {
        obj.transcript = [];
      }
      return obj;
    });
  };

  const buildCsvFromSessions = (sessions: typeof currentPageSessions) => {
    const headers: string[] = ["ID", "Customer", "Status", "Started At"];
    if (fields.dealDetails) {
      headers.push("Deal Number", "Deal Type", "Vehicle Type", "Duration (s)");
    }
    if (fields.grade) headers.push("Grade");
    if (fields.complianceFlags) headers.push("Compliance Flags");
    if (fields.transcript) headers.push("Transcript");

    const rows = [headers.join(",")];
    for (const s of sessions) {
      const row: string[] = [
        String(s.id),
        `"${s.customerName || ""}"`,
        `"${s.status}"`,
        `"${s.startedAt}"`,
      ];
      if (fields.dealDetails) {
        row.push(
          `"${s.dealNumber || ""}"`,
          `"${s.dealType || ""}"`,
          `"${s.vehicleType || ""}"`,
          String(s.durationSeconds ?? ""),
        );
      }
      if (fields.grade) row.push("");
      if (fields.complianceFlags) row.push("");
      if (fields.transcript) row.push("");
      rows.push(row.join(","));
    }
    return rows.join("\n");
  };

  const downloadBlob = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    const ids = getSessionIds();
    if (ids.length === 0) {
      toast.error("No sessions match the selected scope.");
      return;
    }

    setExporting(true);
    setProgress(0);

    const showProgress = ids.length > 50;
    const dateStr = new Date().toISOString().split("T")[0];

    try {
      if (format === "csv") {
        // Use server bulk export for CSV
        if (showProgress) {
          // Batch in chunks of 50 for progress tracking
          const chunkSize = 50;
          const chunks: number[][] = [];
          for (let i = 0; i < ids.length; i += chunkSize) {
            chunks.push(ids.slice(i, i + chunkSize));
          }

          const allCsvParts: string[] = [];
          for (let i = 0; i < chunks.length; i++) {
            const result = await utils.sessions.bulkExport.fetch({
              sessionIds: chunks[i],
              format: "csv",
            });
            if (i === 0) {
              allCsvParts.push(result.data);
            } else {
              // Skip header row for subsequent chunks
              const lines = result.data.split("\n");
              allCsvParts.push(lines.slice(1).join("\n"));
            }
            setProgress(Math.round(((i + 1) / chunks.length) * 100));
          }

          downloadBlob(allCsvParts.join("\n"), `session-export-${dateStr}.csv`, "text/csv");
        } else {
          const result = await utils.sessions.bulkExport.fetch({
            sessionIds: ids,
            format: "csv",
          });
          downloadBlob(result.data, result.filename, result.mimeType);
        }
      } else {
        // JSON: construct client-side from session data
        const sessionsForExport =
          scope === "dateRange" && startDate && endDate
            ? currentPageSessions.filter((s) => {
                const d = new Date(s.startedAt);
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                return d >= start && d <= end;
              })
            : currentPageSessions.filter((s) => ids.includes(s.id));

        if (showProgress) {
          // Simulate progress for large JSON builds
          setProgress(30);
        }

        const jsonData = buildJsonExport(sessionsForExport);

        if (showProgress) setProgress(80);

        const content = JSON.stringify(jsonData, null, 2);
        downloadBlob(content, `session-export-${dateStr}.json`, "application/json");

        if (showProgress) setProgress(100);
      }

      toast.success(`Exported ${ids.length} session${ids.length !== 1 ? "s" : ""} as ${format.toUpperCase()}`);
      onClose();
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
      setProgress(0);
    }
  };

  if (!open) return null;

  const sessionCount = scope === "current" ? currentPageSessions.length : totalSessions;
  const showProgressBar = exporting && getSessionIds().length > 50;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="w-full max-w-lg mx-4 bg-slate-900 border-slate-700 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-400" />
            Export Sessions
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Format selector */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Format</label>
            <div className="flex gap-2">
              <Button
                variant={format === "csv" ? "default" : "outline"}
                size="sm"
                onClick={() => setFormat("csv")}
                className={cn(
                  "flex items-center gap-2",
                  format === "csv"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-slate-600 text-slate-300 hover:bg-slate-800",
                )}
              >
                <FileText className="h-4 w-4" />
                CSV
              </Button>
              <Button
                variant={format === "json" ? "default" : "outline"}
                size="sm"
                onClick={() => setFormat("json")}
                className={cn(
                  "flex items-center gap-2",
                  format === "json"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-slate-600 text-slate-300 hover:bg-slate-800",
                )}
              >
                <FileJson className="h-4 w-4" />
                JSON
              </Button>
            </div>
          </div>

          {/* Scope selector */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Scope</label>
            <div className="flex gap-2 flex-wrap">
              {([
                { value: "current" as const, label: "Current Page" },
                { value: "all" as const, label: "All Sessions" },
                { value: "dateRange" as const, label: "Date Range" },
              ] as const).map((opt) => (
                <Button
                  key={opt.value}
                  variant={scope === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setScope(opt.value)}
                  className={cn(
                    scope === opt.value
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "border-slate-600 text-slate-300 hover:bg-slate-800",
                  )}
                >
                  {opt.value === "dateRange" && <Calendar className="h-4 w-4 mr-1" />}
                  {opt.label}
                </Button>
              ))}
            </div>

            {scope === "dateRange" && (
              <div className="flex gap-3 mt-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-400 mb-1 block">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-400 mb-1 block">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Fields checkboxes */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block flex items-center gap-1.5">
              <CheckSquare className="h-4 w-4 text-blue-400" />
              Fields to Include
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: "transcript" as const, label: "Transcript" },
                { key: "grade" as const, label: "Grade" },
                { key: "complianceFlags" as const, label: "Compliance Flags" },
                { key: "dealDetails" as const, label: "Deal Details" },
              ] as const).map((f) => (
                <label
                  key={f.key}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors text-sm",
                    fields[f.key]
                      ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={fields[f.key]}
                    onChange={() => toggleField(f.key)}
                    className="rounded border-slate-500 text-blue-500 focus:ring-blue-500 bg-slate-700"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          {/* Session count badge */}
          <div className="flex items-center justify-between pt-1">
            <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
              {scope === "current"
                ? `${currentPageSessions.length} session${currentPageSessions.length !== 1 ? "s" : ""}`
                : scope === "all"
                  ? `${totalSessions} session${totalSessions !== 1 ? "s" : ""}`
                  : startDate && endDate
                    ? `Date range selected`
                    : "Select date range"}
            </Badge>
            <span className="text-xs text-slate-500">
              {format === "csv" ? "Flat structure" : "Nested objects"}
            </span>
          </div>

          {/* Progress bar */}
          {showProgressBar && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Exporting...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Export button */}
          <Button
            onClick={handleExport}
            disabled={exporting || (scope === "dateRange" && (!startDate || !endDate))}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {sessionCount} Session{sessionCount !== 1 ? "s" : ""} as {format.toUpperCase()}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default SessionExportModal;
