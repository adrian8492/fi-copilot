import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Download,
  X,
  Clock,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLocation } from "wouter";

// ── Types ──────────────────────────────────────────────────
type Severity = "Critical" | "Warning" | "Info";
type AuditStatus = "Open" | "Resolved" | "Dismissed";
type RuleType = "TILA" | "ECOA" | "UDAP" | "State Law" | "Internal Policy";

interface ComplianceEvent {
  id: number;
  timestamp: string;
  sessionId: string;
  managerName: string;
  rule: RuleType;
  severity: Severity;
  excerpt: string;
  status: AuditStatus;
  resolutionNotes?: string;
}

// ── Demo Data ──────────────────────────────────────────────
const MANAGERS = ["Marcus Rivera", "Jessica Chen", "David Park", "Sarah Kim", "Tony Morales"];
const RULES: RuleType[] = ["TILA", "ECOA", "UDAP", "State Law", "Internal Policy"];
const EXCERPTS: Record<RuleType, string[]> = {
  TILA: [
    "APR not disclosed before product presentation",
    "Finance charge explanation missing from recording",
    "Truth in Lending form not referenced during disclosure",
  ],
  ECOA: [
    "Marital status question asked during credit discussion",
    "Income source inquiry beyond scope",
    "Discriminatory language detected in product offering",
  ],
  UDAP: [
    "Product benefit overstated — 'covers everything'",
    "Pressure language detected during closing",
    "Misleading comparison with competitor product",
  ],
  "State Law": [
    "Cancellation rights not disclosed within required timeframe",
    "State-specific form not mentioned during delivery",
    "Extended warranty duration exceeds state limit",
  ],
  "Internal Policy": [
    "Menu not presented before individual product discussion",
    "Greeting script not followed",
    "Post-delivery follow-up call not made within 48 hours",
  ],
};

function generateDemoEvents(): ComplianceEvent[] {
  const events: ComplianceEvent[] = [];
  const severities: Severity[] = ["Critical", "Warning", "Info"];
  const statuses: AuditStatus[] = ["Open", "Resolved", "Dismissed"];

  for (let i = 1; i <= 50; i++) {
    const rule = RULES[i % RULES.length];
    const excerptOptions = EXCERPTS[rule];
    const severity = i <= 8 ? "Critical" : i <= 25 ? "Warning" : "Info";
    const status = i <= 20 ? statuses[i % 3] : i <= 35 ? "Open" : "Resolved";
    const sessionNum = ((i - 1) % 20) + 1;
    const dayOffset = Math.floor((i - 1) / 2);
    const date = new Date(2026, 2, 31 - dayOffset);

    events.push({
      id: i,
      timestamp: date.toISOString().slice(0, 16).replace("T", " "),
      sessionId: `S-${1000 + sessionNum}`,
      managerName: MANAGERS[i % MANAGERS.length],
      rule,
      severity,
      excerpt: excerptOptions[i % excerptOptions.length],
      status,
      resolutionNotes: status === "Resolved" ? "Reviewed and addressed in coaching session" : undefined,
    });
  }
  return events;
}

const DEMO_EVENTS = generateDemoEvents();

// Trend data: 12 weeks
function generateTrendData() {
  const weeks = [];
  for (let w = 12; w >= 1; w--) {
    weeks.push({
      week: `W${13 - w}`,
      Critical: Math.floor(Math.random() * 3) + 1,
      Warning: Math.floor(Math.random() * 6) + 2,
      Info: Math.floor(Math.random() * 8) + 3,
    });
  }
  return weeks;
}
const TREND_DATA = generateTrendData();

const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: "border-red-500/30 text-red-400 bg-red-500/10",
  Warning: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
  Info: "border-blue-500/30 text-blue-400 bg-blue-500/10",
};

const STATUS_COLORS: Record<AuditStatus, string> = {
  Open: "border-orange-500/30 text-orange-400 bg-orange-500/10",
  Resolved: "border-green-500/30 text-green-400 bg-green-500/10",
  Dismissed: "border-gray-500/30 text-gray-400 bg-gray-500/10",
};

export default function ComplianceAudit() {
  const [events, setEvents] = useState(DEMO_EVENTS);
  const [severityFilter, setSeverityFilter] = useState<Severity | "All">("All");
  const [ruleFilter, setRuleFilter] = useState<RuleType | "All">("All");
  const [managerFilter, setManagerFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<AuditStatus | "All">("All");
  const [resolutionModal, setResolutionModal] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [, navigate] = useLocation();

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (severityFilter !== "All" && e.severity !== severityFilter) return false;
      if (ruleFilter !== "All" && e.rule !== ruleFilter) return false;
      if (managerFilter !== "All" && e.managerName !== managerFilter) return false;
      if (statusFilter !== "All" && e.status !== statusFilter) return false;
      return true;
    });
  }, [events, severityFilter, ruleFilter, managerFilter, statusFilter]);

  // Summary cards (last 30 days)
  const criticalCount = events.filter((e) => e.severity === "Critical").length;
  const resolvedCount = events.filter((e) => e.status === "Resolved").length;
  const resolutionRate = events.length > 0 ? Math.round((resolvedCount / events.length) * 100) : 0;

  const handleResolve = () => {
    if (resolutionModal === null || !resolutionNotes.trim()) return;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === resolutionModal
          ? { ...e, status: "Resolved" as AuditStatus, resolutionNotes: resolutionNotes.trim() }
          : e
      )
    );
    setResolutionModal(null);
    setResolutionNotes("");
  };

  const exportCSV = () => {
    const headers = ["Timestamp", "Session ID", "Manager", "Rule", "Severity", "Excerpt", "Status"];
    const rows = filtered.map((e) =>
      [e.timestamp, e.sessionId, e.managerName, e.rule, e.severity, `"${e.excerpt}"`, e.status].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compliance-audit.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout title="Compliance Audit Trail" subtitle="Complete audit log of all compliance events">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Shield className="w-4 h-4" /> Total Flags (30d)</div>
            <p className="text-2xl font-bold text-foreground">{events.length}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><AlertTriangle className="w-4 h-4" /> Critical</div>
            <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp className="w-4 h-4" /> Resolution Rate</div>
            <p className="text-2xl font-bold text-foreground">{resolutionRate}%</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Clock className="w-4 h-4" /> Avg Time to Resolve</div>
            <p className="text-2xl font-bold text-foreground">2.4 days</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as typeof severityFilter)} className="text-sm bg-accent rounded px-2 py-1.5 border border-border text-foreground">
            <option value="All">All Severity</option>
            <option value="Critical">Critical</option>
            <option value="Warning">Warning</option>
            <option value="Info">Info</option>
          </select>
          <select value={ruleFilter} onChange={(e) => setRuleFilter(e.target.value as typeof ruleFilter)} className="text-sm bg-accent rounded px-2 py-1.5 border border-border text-foreground">
            <option value="All">All Rules</option>
            {RULES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)} className="text-sm bg-accent rounded px-2 py-1.5 border border-border text-foreground">
            <option value="All">All Managers</option>
            {MANAGERS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="text-sm bg-accent rounded px-2 py-1.5 border border-border text-foreground">
            <option value="All">All Status</option>
            <option value="Open">Open</option>
            <option value="Resolved">Resolved</option>
            <option value="Dismissed">Dismissed</option>
          </select>
          <Button variant="outline" size="sm" className="ml-auto" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>

        {/* Trend Chart */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Compliance Flags — 12 Week Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={TREND_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip />
              <Area type="monotone" dataKey="Info" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              <Area type="monotone" dataKey="Warning" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
              <Area type="monotone" dataKey="Critical" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Audit Table */}
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-3 text-xs text-muted-foreground">Timestamp</th>
                <th className="text-left py-3 px-3 text-xs text-muted-foreground">Session</th>
                <th className="text-left py-3 px-3 text-xs text-muted-foreground">Manager</th>
                <th className="text-left py-3 px-3 text-xs text-muted-foreground">Rule</th>
                <th className="text-left py-3 px-3 text-xs text-muted-foreground">Severity</th>
                <th className="text-left py-3 px-3 text-xs text-muted-foreground">Excerpt</th>
                <th className="text-left py-3 px-3 text-xs text-muted-foreground">Status</th>
                <th className="text-left py-3 px-3 text-xs text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="py-2 px-3 text-xs text-muted-foreground whitespace-nowrap">{e.timestamp}</td>
                  <td className="py-2 px-3">
                    <button className="text-primary text-xs hover:underline" onClick={() => navigate(`/session/${e.sessionId.replace("S-", "")}`)}>
                      {e.sessionId}
                    </button>
                  </td>
                  <td className="py-2 px-3 text-xs text-foreground">{e.managerName}</td>
                  <td className="py-2 px-3"><Badge variant="outline" className="text-[10px]">{e.rule}</Badge></td>
                  <td className="py-2 px-3"><Badge variant="outline" className={`text-[10px] ${SEVERITY_COLORS[e.severity]}`}>{e.severity}</Badge></td>
                  <td className="py-2 px-3 text-xs text-foreground max-w-[200px] truncate">{e.excerpt}</td>
                  <td className="py-2 px-3"><Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[e.status]}`}>{e.status}</Badge></td>
                  <td className="py-2 px-3">
                    {e.status === "Open" && (
                      <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => { setResolutionModal(e.id); setResolutionNotes(""); }}>
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Resolve
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">No compliance events match the current filters</div>
          )}
        </Card>

        {/* Resolution Modal */}
        {resolutionModal !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Resolve Compliance Flag</h3>
                <button onClick={() => setResolutionModal(null)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Provide resolution notes to mark this flag as resolved.
              </p>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full text-sm bg-accent/30 rounded p-2 border border-border text-foreground min-h-[80px] resize-none mb-3"
                placeholder="Resolution notes (required)..."
              />
              <Button onClick={handleResolve} className="w-full" disabled={!resolutionNotes.trim()}>
                <CheckCircle2 className="w-4 h-4 mr-1" /> Mark as Resolved
              </Button>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
