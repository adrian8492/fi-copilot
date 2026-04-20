import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowUpCircle,
  Send,
  Filter,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Types ────────────────────────────────────────────────────────────
type Priority = "Critical" | "High" | "Normal";
type StipStatus = "Open" | "Submitted" | "Cleared" | "Waived";

interface Stip {
  id: number;
  dealNumber: string;
  customer: string;
  lender: string;
  description: string;
  dateSubmitted: string;
  daysOpen: number;
  priority: Priority;
  status: StipStatus;
  assignedTo: string;
  notes: string;
}

// ── Demo data ────────────────────────────────────────────────────────
const MANAGERS = ["Marcus Rivera", "Jessica Chen", "David Washington", "Sarah Kim"];
const LENDERS = ["Ally", "Chase", "Capital One", "Wells Fargo", "US Bank", "Toyota Financial", "GM Financial"];

const INITIAL_STIPS: Stip[] = [
  { id: 1, dealNumber: "D-5501", customer: "Carlos Mendez", lender: "Ally", description: "Proof of Income", dateSubmitted: "2026-04-12", daysOpen: 7, priority: "Critical", status: "Open", assignedTo: "Marcus Rivera", notes: "Customer called, will bring paystubs" },
  { id: 2, dealNumber: "D-5502", customer: "Angela Brooks", lender: "Chase", description: "Insurance Binder", dateSubmitted: "2026-04-14", daysOpen: 5, priority: "High", status: "Submitted", assignedTo: "Jessica Chen", notes: "Sent to agent, awaiting binder" },
  { id: 3, dealNumber: "D-5503", customer: "Tyler Morrison", lender: "Capital One", description: "Bank Statements (2 months)", dateSubmitted: "2026-04-15", daysOpen: 4, priority: "High", status: "Open", assignedTo: "David Washington", notes: "" },
  { id: 4, dealNumber: "D-5504", customer: "Priya Sharma", lender: "Wells Fargo", description: "Driver's License Copy", dateSubmitted: "2026-04-17", daysOpen: 2, priority: "Normal", status: "Submitted", assignedTo: "Sarah Kim", notes: "Scanned copy sent" },
  { id: 5, dealNumber: "D-5505", customer: "Robert Franklin", lender: "US Bank", description: "Trade Title", dateSubmitted: "2026-04-10", daysOpen: 9, priority: "Critical", status: "Open", assignedTo: "Marcus Rivera", notes: "Lien holder releasing title, 3-5 business days" },
  { id: 6, dealNumber: "D-5506", customer: "Mei-Ling Wu", lender: "Toyota Financial", description: "Signed Credit App", dateSubmitted: "2026-04-18", daysOpen: 1, priority: "Normal", status: "Submitted", assignedTo: "Jessica Chen", notes: "E-signed, uploaded" },
  { id: 7, dealNumber: "D-5507", customer: "Derek Howard", lender: "GM Financial", description: "Proof of Residence", dateSubmitted: "2026-04-16", daysOpen: 3, priority: "Normal", status: "Cleared", assignedTo: "David Washington", notes: "Utility bill accepted" },
  { id: 8, dealNumber: "D-5508", customer: "Natasha Volkov", lender: "Ally", description: "Bank Statements (2 months)", dateSubmitted: "2026-04-11", daysOpen: 8, priority: "Critical", status: "Open", assignedTo: "Sarah Kim", notes: "Waiting on customer" },
  { id: 9, dealNumber: "D-5509", customer: "James O'Brien", lender: "Chase", description: "Proof of Income", dateSubmitted: "2026-04-13", daysOpen: 6, priority: "High", status: "Submitted", assignedTo: "Marcus Rivera", notes: "Employer verification in progress" },
  { id: 10, dealNumber: "D-5510", customer: "Destiny Clark", lender: "Capital One", description: "Insurance Binder", dateSubmitted: "2026-04-19", daysOpen: 0, priority: "Normal", status: "Open", assignedTo: "Jessica Chen", notes: "Just requested" },
  { id: 11, dealNumber: "D-5511", customer: "Ahmad Hassan", lender: "Wells Fargo", description: "Driver's License Copy", dateSubmitted: "2026-04-18", daysOpen: 1, priority: "Normal", status: "Cleared", assignedTo: "David Washington", notes: "Verified and cleared" },
  { id: 12, dealNumber: "D-5501", customer: "Carlos Mendez", lender: "Ally", description: "Proof of Residence", dateSubmitted: "2026-04-12", daysOpen: 7, priority: "High", status: "Submitted", assignedTo: "Marcus Rivera", notes: "Lease agreement submitted" },
  { id: 13, dealNumber: "D-5512", customer: "Brenda Jacobs", lender: "US Bank", description: "Signed Credit App", dateSubmitted: "2026-04-15", daysOpen: 4, priority: "Normal", status: "Waived", assignedTo: "Sarah Kim", notes: "Lender waived requirement" },
  { id: 14, dealNumber: "D-5513", customer: "Victor Reyes", lender: "Toyota Financial", description: "Trade Title", dateSubmitted: "2026-04-09", daysOpen: 10, priority: "Critical", status: "Open", assignedTo: "Jessica Chen", notes: "Title lost, duplicate ordered from DMV" },
  { id: 15, dealNumber: "D-5514", customer: "Lauren Mitchell", lender: "GM Financial", description: "Bank Statements (2 months)", dateSubmitted: "2026-04-17", daysOpen: 2, priority: "Normal", status: "Submitted", assignedTo: "David Washington", notes: "Digital statements uploaded" },
  { id: 16, dealNumber: "D-5515", customer: "Chris Nakamura", lender: "Ally", description: "Insurance Binder", dateSubmitted: "2026-04-14", daysOpen: 5, priority: "High", status: "Open", assignedTo: "Sarah Kim", notes: "Agent on vacation, follow-up Monday" },
  { id: 17, dealNumber: "D-5508", customer: "Natasha Volkov", lender: "Ally", description: "Proof of Residence", dateSubmitted: "2026-04-11", daysOpen: 8, priority: "High", status: "Open", assignedTo: "Sarah Kim", notes: "Needs utility bill or bank statement" },
  { id: 18, dealNumber: "D-5516", customer: "Patricia Okafor", lender: "Chase", description: "Driver's License Copy", dateSubmitted: "2026-04-19", daysOpen: 0, priority: "Normal", status: "Open", assignedTo: "Marcus Rivera", notes: "Customer coming in today" },
  { id: 19, dealNumber: "D-5517", customer: "Ryan Gallagher", lender: "Capital One", description: "Proof of Income", dateSubmitted: "2026-04-16", daysOpen: 3, priority: "Normal", status: "Cleared", assignedTo: "Jessica Chen", notes: "3 paystubs verified" },
  { id: 20, dealNumber: "D-5518", customer: "Simone Baptiste", lender: "Wells Fargo", description: "Signed Credit App", dateSubmitted: "2026-04-13", daysOpen: 6, priority: "High", status: "Submitted", assignedTo: "David Washington", notes: "Re-signed with corrected info" },
];

// ── Trend data: daily stip clearance rate last 30 days ───────────────
const CLEARANCE_TREND = [
  { date: "Mar 20", cleared: 3, opened: 4 }, { date: "Mar 21", cleared: 2, opened: 3 },
  { date: "Mar 22", cleared: 4, opened: 2 }, { date: "Mar 23", cleared: 1, opened: 5 },
  { date: "Mar 24", cleared: 5, opened: 3 }, { date: "Mar 25", cleared: 3, opened: 4 },
  { date: "Mar 26", cleared: 0, opened: 1 }, { date: "Mar 27", cleared: 2, opened: 3 },
  { date: "Mar 28", cleared: 4, opened: 5 }, { date: "Mar 29", cleared: 6, opened: 2 },
  { date: "Mar 30", cleared: 3, opened: 4 }, { date: "Mar 31", cleared: 1, opened: 3 },
  { date: "Apr 1", cleared: 2, opened: 6 }, { date: "Apr 2", cleared: 5, opened: 2 },
  { date: "Apr 3", cleared: 4, opened: 3 }, { date: "Apr 4", cleared: 3, opened: 5 },
  { date: "Apr 5", cleared: 2, opened: 4 }, { date: "Apr 6", cleared: 6, opened: 2 },
  { date: "Apr 7", cleared: 4, opened: 3 }, { date: "Apr 8", cleared: 1, opened: 5 },
  { date: "Apr 9", cleared: 3, opened: 4 }, { date: "Apr 10", cleared: 5, opened: 1 },
  { date: "Apr 11", cleared: 2, opened: 3 }, { date: "Apr 12", cleared: 4, opened: 5 },
  { date: "Apr 13", cleared: 3, opened: 2 }, { date: "Apr 14", cleared: 7, opened: 3 },
  { date: "Apr 15", cleared: 2, opened: 4 }, { date: "Apr 16", cleared: 5, opened: 2 },
  { date: "Apr 17", cleared: 4, opened: 6 }, { date: "Apr 18", cleared: 3, opened: 4 },
];

// ── Priority badge colors ────────────────────────────────────────────
const PRIORITY_BADGE: Record<Priority, string> = {
  Critical: "bg-red-500/20 text-red-400 border-red-500/30",
  High: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Normal: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const STATUS_BADGE: Record<StipStatus, string> = {
  Open: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Submitted: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Cleared: "bg-green-500/20 text-green-400 border-green-500/30",
  Waived: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function StipTracker() {
  const [stips, setStips] = useState<Stip[]>(INITIAL_STIPS);
  const [lenderFilter, setLenderFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [managerFilter, setManagerFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Filtered stips
  const filtered = useMemo(
    () =>
      stips.filter((s) => {
        if (lenderFilter !== "All" && s.lender !== lenderFilter) return false;
        if (priorityFilter !== "All" && s.priority !== priorityFilter) return false;
        if (statusFilter !== "All" && s.status !== statusFilter) return false;
        if (managerFilter !== "All" && s.assignedTo !== managerFilter) return false;
        return true;
      }),
    [stips, lenderFilter, priorityFilter, statusFilter, managerFilter]
  );

  // KPIs
  const openStips = stips.filter((s) => s.status === "Open").length;
  const avgDaysOpen =
    stips.filter((s) => s.status === "Open" || s.status === "Submitted").length > 0
      ? +(
          stips
            .filter((s) => s.status === "Open" || s.status === "Submitted")
            .reduce((sum, s) => sum + s.daysOpen, 0) /
          stips.filter((s) => s.status === "Open" || s.status === "Submitted").length
        ).toFixed(1)
      : 0;
  const clearedToday = stips.filter((s) => s.status === "Cleared" && s.daysOpen <= 1).length;
  const atRiskDeals = new Set(
    stips.filter((s) => s.daysOpen > 5 && s.status !== "Cleared" && s.status !== "Waived").map((s) => s.dealNumber)
  ).size;

  // Age buckets
  const ageBuckets = useMemo(() => {
    const active = stips.filter((s) => s.status === "Open" || s.status === "Submitted");
    return [
      { label: "<24h", count: active.filter((s) => s.daysOpen < 1).length, color: "bg-green-500/20 border-green-500/40 text-green-400" },
      { label: "1-3 days", count: active.filter((s) => s.daysOpen >= 1 && s.daysOpen <= 3).length, color: "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" },
      { label: "3-7 days", count: active.filter((s) => s.daysOpen > 3 && s.daysOpen <= 7).length, color: "bg-orange-500/20 border-orange-500/40 text-orange-400" },
      { label: "7+ days", count: active.filter((s) => s.daysOpen > 7).length, color: "bg-red-500/20 border-red-500/40 text-red-400" },
    ];
  }, [stips]);

  // At-risk deals
  const atRiskStips = useMemo(
    () => stips.filter((s) => s.daysOpen > 5 && s.status !== "Cleared" && s.status !== "Waived"),
    [stips]
  );

  // Actions
  const updateStatus = (id: number, newStatus: StipStatus) => {
    setStips((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
  };

  const escalate = (id: number) => {
    setStips((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, priority: "Critical", notes: s.notes + " [ESCALATED]" } : s
      )
    );
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.id)));
    }
  };

  const bulkClear = () => {
    setStips((prev) =>
      prev.map((s) => (selectedIds.has(s.id) ? { ...s, status: "Cleared" as StipStatus } : s))
    );
    setSelectedIds(new Set());
  };

  const kpis = [
    { label: "Open Stips", value: openStips, icon: FileText, color: "text-blue-400" },
    { label: "Avg Days Open", value: avgDaysOpen, icon: Clock, color: "text-amber-400" },
    { label: "Stips Cleared Today", value: clearedToday, icon: CheckCircle2, color: "text-green-400" },
    { label: "At-Risk Deals", value: atRiskDeals, icon: AlertTriangle, color: "text-red-400" },
  ];

  return (
    <AppLayout title="Stip Tracker" subtitle="Track deal stipulations required by lenders to fund deals">
      <div className="p-4 lg:p-6 space-y-6">
        {/* KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{kpi.value}</p>
            </Card>
          ))}
        </div>

        {/* Age Bucket View */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Stip Age Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ageBuckets.map((bucket) => (
              <Card key={bucket.label} className={`p-4 border ${bucket.color}`}>
                <p className="text-[11px] font-medium opacity-80">{bucket.label}</p>
                <p className="text-2xl font-bold mt-1">{bucket.count}</p>
                <p className="text-[10px] opacity-60">active stips</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Clearance Trend Chart */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Daily Stip Clearance Rate (Last 30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={CLEARANCE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f1f1f", border: "1px solid #333", borderRadius: 8 }}
                  labelStyle={{ color: "#ccc" }}
                />
                <Line type="monotone" dataKey="cleared" stroke="#22c55e" strokeWidth={2} name="Cleared" dot={false} />
                <Line type="monotone" dataKey="opened" stroke="#ef4444" strokeWidth={2} name="Opened" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Filters</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Select value={lenderFilter} onValueChange={setLenderFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Lender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Lenders</SelectItem>
                {LENDERS.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Priorities</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Cleared">Cleared</SelectItem>
                <SelectItem value="Waived">Waived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={managerFilter} onValueChange={setManagerFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Assigned To" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Managers</SelectItem>
                {MANAGERS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Bulk Actions + Stip Table */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Stipulations ({filtered.length})
            </h3>
            {selectedIds.size > 0 && (
              <Button size="sm" onClick={bulkClear} className="gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Clear Selected ({selectedIds.size})
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-2">
                    <Checkbox
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="pb-2 pr-3 text-[11px] text-muted-foreground font-medium">Deal / Customer</th>
                  <th className="pb-2 pr-3 text-[11px] text-muted-foreground font-medium">Lender</th>
                  <th className="pb-2 pr-3 text-[11px] text-muted-foreground font-medium">Stip Description</th>
                  <th className="pb-2 pr-3 text-[11px] text-muted-foreground font-medium">Submitted</th>
                  <th className="pb-2 pr-3 text-[11px] text-muted-foreground font-medium">Days Open</th>
                  <th className="pb-2 pr-3 text-[11px] text-muted-foreground font-medium">Priority</th>
                  <th className="pb-2 pr-3 text-[11px] text-muted-foreground font-medium">Status</th>
                  <th className="pb-2 pr-3 text-[11px] text-muted-foreground font-medium">Assigned To</th>
                  <th className="pb-2 pr-3 text-[11px] text-muted-foreground font-medium">Notes</th>
                  <th className="pb-2 text-[11px] text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((stip) => (
                  <tr
                    key={stip.id}
                    className={`border-b border-border/50 hover:bg-muted/30 ${
                      stip.daysOpen > 5 && stip.status !== "Cleared" && stip.status !== "Waived"
                        ? "bg-red-500/5"
                        : ""
                    }`}
                  >
                    <td className="py-2.5 pr-2">
                      <Checkbox
                        checked={selectedIds.has(stip.id)}
                        onCheckedChange={() => toggleSelect(stip.id)}
                      />
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="font-medium text-foreground text-xs">{stip.dealNumber}</div>
                      <div className="text-[11px] text-muted-foreground">{stip.customer}</div>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">{stip.lender}</td>
                    <td className="py-2.5 pr-3 text-xs text-foreground">{stip.description}</td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">{stip.dateSubmitted}</td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`text-xs font-semibold ${
                          stip.daysOpen > 7
                            ? "text-red-400"
                            : stip.daysOpen > 5
                            ? "text-orange-400"
                            : stip.daysOpen > 3
                            ? "text-amber-400"
                            : "text-green-400"
                        }`}
                      >
                        {stip.daysOpen}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge variant="outline" className={`text-[10px] ${PRIORITY_BADGE[stip.priority]}`}>
                        {stip.priority}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge variant="outline" className={`text-[10px] ${STATUS_BADGE[stip.status]}`}>
                        {stip.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">{stip.assignedTo}</td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground max-w-[160px] truncate" title={stip.notes}>
                      {stip.notes || "—"}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1">
                        {stip.status === "Open" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[10px]"
                            onClick={() => updateStatus(stip.id, "Submitted")}
                            title="Mark Submitted"
                          >
                            <Send className="w-3 h-3" />
                          </Button>
                        )}
                        {(stip.status === "Open" || stip.status === "Submitted") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[10px] text-green-400"
                            onClick={() => updateStatus(stip.id, "Cleared")}
                            title="Mark Cleared"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </Button>
                        )}
                        {stip.priority !== "Critical" && stip.status !== "Cleared" && stip.status !== "Waived" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[10px] text-red-400"
                            onClick={() => escalate(stip.id)}
                            title="Escalate"
                          >
                            <ArrowUpCircle className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No stips match filters.</p>
            )}
          </div>
        </Card>

        {/* At-Risk Deals Panel */}
        <Card className="p-4 border-red-500/30">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-red-400">At-Risk Deals (Stips Open &gt;5 Days)</h3>
          </div>
          {atRiskStips.length === 0 ? (
            <p className="text-muted-foreground text-sm">No at-risk stips. All stips are within acceptable timelines.</p>
          ) : (
            <div className="space-y-2">
              {atRiskStips.map((stip) => (
                <div
                  key={stip.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-xs font-semibold text-foreground">{stip.dealNumber}</span>
                      <span className="text-xs text-muted-foreground ml-2">{stip.customer}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{stip.lender}</span>
                    <span className="text-xs text-foreground">{stip.description}</span>
                    <Badge variant="outline" className={`text-[10px] ${PRIORITY_BADGE[stip.priority]}`}>
                      {stip.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-red-400">{stip.daysOpen} days</span>
                    <span className="text-[11px] text-muted-foreground">{stip.assignedTo}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] text-green-400"
                      onClick={() => updateStatus(stip.id, "Cleared")}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
