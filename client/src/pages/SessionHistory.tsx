import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Search, Clock, Shield, ChevronRight, Mic, Plus,
  ChevronUp, ChevronDown, Minus, Car, Hash, User, Calendar,
  ChevronLeft, Download, Loader2, BarChart3, Star, DollarSign, TrendingUp,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import SessionExportModal from "@/components/SessionExportModal";

type SortField = "customerName" | "dealNumber" | "vehicleType" | "dealType" | "startedAt" | "durationSeconds" | "status";

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <Minus className="w-3 h-3 opacity-30" />;
  return dir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "border-green-500/30 text-green-400 bg-green-500/10",
  active: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  processing: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  archived: "border-slate-500/30 text-slate-400 bg-slate-500/10",
};

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  new: "New",
  used: "Used",
  cpo: "CPO",
};

const DEAL_TYPE_LABELS: Record<string, string> = {
  retail_finance: "Retail Finance",
  lease: "Lease",
  cash: "Cash",
};

export default function SessionHistory() {
  useEffect(() => { document.title = "Session History | F&I Co-Pilot by ASURA Group"; }, []);
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("startedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [csvExporting, setCsvExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // ─── Pagination ───────────────────────────────────────────────────────────
  const PAGE_SIZE = 25;
  const [page, setPage] = useState(0);

  const { data: sessionsData, isLoading } = trpc.sessions.list.useQuery({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
  const sessions = sessionsData?.rows;
  const totalSessions = sessionsData?.total ?? 0;
  const { data: recentGrades } = trpc.grades.myHistory.useQuery({ limit: 10 });
  const totalPages = Math.max(1, Math.ceil(totalSessions / PAGE_SIZE));

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    if (!sessions) return [];
    let result = sessions;

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Text search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) =>
        s.customerName?.toLowerCase().includes(q) ||
        s.dealNumber?.toLowerCase().includes(q) ||
        s.dealType?.toLowerCase().includes(q) ||
        s.vehicleType?.toLowerCase().includes(q)
      );
    }

    // Sort
    return [...result].sort((a, b) => {
      let av: string | number = 0;
      let bv: string | number = 0;
      if (sortField === "startedAt") {
        av = new Date(a.startedAt).getTime();
        bv = new Date(b.startedAt).getTime();
      } else if (sortField === "durationSeconds") {
        av = a.durationSeconds ?? 0;
        bv = b.durationSeconds ?? 0;
      } else {
        av = (a[sortField] ?? "") as string;
        bv = (b[sortField] ?? "") as string;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [sessions, search, statusFilter, sortField, sortDir]);

  const statusCounts = useMemo(() => {
    if (!sessions) return {};
    return (sessions ?? []).reduce((acc, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [sessions]);

  // Quick Stats
  const quickStats = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;
    const durations = sessions.filter((s) => s.durationSeconds).map((s) => s.durationSeconds!);
    const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const grades = recentGrades ?? [];
    const avgGrade = grades.length > 0 ? Math.round(grades.reduce((a, g) => a + (g.overallScore ?? 0), 0) / grades.length) : null;
    const bestPvr = grades.length > 0 ? Math.max(...grades.map((g) => Number((g as Record<string, unknown>).pvr ?? 0))) : null;
    const sparkData = grades.slice().reverse().map((g, i) => ({ i, score: g.overallScore ?? 0 }));
    return { total: totalSessions, avgGrade, bestPvr, avgDuration, sparkData };
  }, [sessions, recentGrades, totalSessions]);

  const utils = trpc.useUtils();

  const handleExportCsv = async () => {
    if (!sessions || sessions.length === 0) return;
    setCsvExporting(true);
    try {
      const ids = sessions.map((s) => s.id);
      const result = await utils.sessions.bulkExport.fetch({ sessionIds: ids, format: "csv" });
      const blob = new Blob([result.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast("Failed to export CSV");
    } finally {
      setCsvExporting(false);
    }
  };

  const ThHeader = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
    <th
      className={cn("py-3 px-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white select-none whitespace-nowrap", className)}
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        <SortIcon active={sortField === field} dir={sortDir} />
      </span>
    </th>
  );

  return (
    <AppLayout title="Session History" subtitle="All recorded F&I interactions">
      <div className="p-6 space-y-5">
        {/* Header Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search customer, deal #, type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5">
            {["all", "completed", "active", "processing"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                  statusFilter === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                )}
              >
                {s === "all" ? `All (${totalSessions})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${statusCounts[s] ?? 0})`}
              </button>
            ))}
          </div>

          <Button variant="outline" onClick={() => setExportModalOpen(true)} disabled={!sessions?.length}
            className="gap-2 shrink-0 ml-auto">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button onClick={() => navigate("/session/new")} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> New Session
          </Button>
        </div>

        {/* Quick Stats Bar */}
        {quickStats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Card className="bg-card border-border">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Sessions</p>
                  <p className="text-lg font-bold text-foreground">{quickStats.total}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg Grade</p>
                  <p className={cn("text-lg font-bold", quickStats.avgGrade && quickStats.avgGrade >= 80 ? "text-emerald-400" : quickStats.avgGrade && quickStats.avgGrade >= 65 ? "text-yellow-400" : "text-foreground")}>
                    {quickStats.avgGrade != null ? `${quickStats.avgGrade}%` : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Best PVR</p>
                  <p className="text-lg font-bold text-foreground">
                    {quickStats.bestPvr && quickStats.bestPvr > 0 ? `$${Math.round(quickStats.bestPvr).toLocaleString()}` : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg Duration</p>
                  <p className="text-lg font-bold text-foreground">
                    {quickStats.avgDuration > 0 ? `${Math.floor(quickStats.avgDuration / 60)}m` : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
            {quickStats.sparkData.length >= 2 && (
              <Card className="bg-card border-border">
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Grade Trend</p>
                  <div className="h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={quickStats.sparkData}>
                        <Area type="monotone" dataKey="score" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Table */}
        <Card className="bg-card border-border overflow-hidden">
          {isLoading ? (
            <CardContent className="p-0">
              <div className="space-y-0">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-14 border-b border-border/50 bg-card animate-pulse" />
                ))}
              </div>
            </CardContent>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 bg-muted/30">
                  <tr>
                    <ThHeader field="customerName" label="Customer" />
                    <ThHeader field="dealNumber" label="Deal #" />
                    <ThHeader field="vehicleType" label="Vehicle" />
                    <ThHeader field="dealType" label="Deal Type" />
                    <ThHeader field="status" label="Status" />
                    <ThHeader field="startedAt" label="Date" />
                    <ThHeader field="durationSeconds" label="Duration" />
                    <th className="py-3 px-4 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((session, idx) => (
                    <tr
                      key={session.id}
                      className={cn(
                        "border-b border-border/40 hover:bg-primary/5 cursor-pointer transition-colors group",
                        idx % 2 === 0 ? "" : "bg-muted/10"
                      )}
                      onClick={() => navigate(`/session/${session.id}`)}
                    >
                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground leading-tight">
                              {session.customerName ?? <span className="text-muted-foreground italic">No name</span>}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Session #{session.id}</p>
                          </div>
                          {session.consentObtained && (
                            <Shield className="w-3 h-3 text-green-400 shrink-0" />
                          )}
                        </div>
                      </td>

                      {/* Deal # */}
                      <td className="py-3.5 px-4">
                        {session.dealNumber ? (
                          <div className="flex items-center gap-1.5 text-foreground">
                            <Hash className="w-3 h-3 text-muted-foreground" />
                            <span className="font-mono text-sm">{session.dealNumber}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
                      </td>

                      {/* Vehicle */}
                      <td className="py-3.5 px-4">
                        {session.vehicleType ? (
                          <div className="flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-foreground">{VEHICLE_TYPE_LABELS[session.vehicleType] ?? session.vehicleType}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
                      </td>

                      {/* Deal Type */}
                      <td className="py-3.5 px-4">
                        <span className="text-foreground">
                          {DEAL_TYPE_LABELS[session.dealType ?? ""] ?? session.dealType ?? <span className="text-muted-foreground/50 text-xs">—</span>}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-semibold capitalize", STATUS_COLORS[session.status] ?? "border-border text-muted-foreground")}
                        >
                          {session.status}
                        </Badge>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs whitespace-nowrap">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(session.startedAt), "MMM d, yyyy")}
                          <span className="text-muted-foreground/50">{format(new Date(session.startedAt), "h:mm a")}</span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4">
                        {session.durationSeconds ? (
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Clock className="w-3 h-3" />
                            {Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
                      </td>

                      {/* Arrow */}
                      <td className="py-3.5 px-4">
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <CardContent className="py-16 text-center">
              <Mic className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {search || statusFilter !== "all" ? "No sessions match your filters" : "No sessions recorded yet"}
              </p>
              {!search && statusFilter === "all" && (
                <Button className="mt-4 gap-2" onClick={() => navigate("/session/new")}>
                  <Plus className="w-4 h-4" /> Start Your First Session
                </Button>
              )}
            </CardContent>
          )}
        </Card>

        {/* Pagination */}
        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalSessions)} of {totalSessions} sessions
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                  disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="w-3 h-3" /> Prev
                </Button>
                <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                  disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  Next <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        )}
        {/* Export Modal */}
        <SessionExportModal
          open={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          currentPageSessions={(filtered ?? []).map((s) => ({
            id: s.id,
            customerName: s.customerName,
            dealNumber: s.dealNumber,
            startedAt: s.startedAt,
            status: s.status,
            vehicleType: s.vehicleType,
            dealType: s.dealType,
            durationSeconds: s.durationSeconds,
          }))}
          totalSessions={totalSessions}
        />
      </div>
    </AppLayout>
  );
}
