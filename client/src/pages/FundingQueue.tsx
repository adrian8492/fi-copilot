import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  X,
  ClipboardCopy,
  Flag,
  ShieldAlert,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────
type DealStatus = "Pending" | "Submitted" | "Approved" | "Funded" | "Chargeback";

interface FundingDeal {
  id: number;
  customer: string;
  vehicle: string;
  lender: string;
  amountFinanced: number;
  contractDate: string;
  submittedDate: string | null;
  daysOut: number;
  status: DealStatus;
  stipsRemaining: number;
  priority: boolean;
  chargebackRisk: number;
  chargebackReason: string;
  stips: { name: string; cleared: boolean }[];
  lenderContact: string;
  notes: string;
}

// ── Demo data ─────────────────────────────────────────────────────────
const DEALS: FundingDeal[] = [
  { id: 1, customer: "James Wilson", vehicle: "2026 Toyota Camry LE", lender: "Ally", amountFinanced: 32500, contractDate: "2026-04-02", submittedDate: "2026-04-02", daysOut: 0, status: "Funded", stipsRemaining: 0, priority: false, chargebackRisk: 5, chargebackReason: "", stips: [{ name: "Proof of Insurance", cleared: true }, { name: "Driver License", cleared: true }], lenderContact: "Jenny Marks (800-555-0101)", notes: "Clean deal, funded quickly." },
  { id: 2, customer: "Sarah Martinez", vehicle: "2026 Honda CR-V EX", lender: "Chase", amountFinanced: 38200, contractDate: "2026-04-03", submittedDate: "2026-04-03", daysOut: 0, status: "Funded", stipsRemaining: 0, priority: false, chargebackRisk: 8, chargebackReason: "", stips: [{ name: "Proof of Insurance", cleared: true }], lenderContact: "Tom Reese (800-555-0102)", notes: "Funded on day 3." },
  { id: 3, customer: "Robert Kim", vehicle: "2025 Ford F-150 XLT", lender: "Capital One", amountFinanced: 45800, contractDate: "2026-04-04", submittedDate: "2026-04-04", daysOut: 0, status: "Funded", stipsRemaining: 0, priority: false, chargebackRisk: 3, chargebackReason: "", stips: [{ name: "Paystub", cleared: true }, { name: "Proof of Insurance", cleared: true }], lenderContact: "Diana Cole (800-555-0103)", notes: "" },
  { id: 4, customer: "Emily Nguyen", vehicle: "2026 Hyundai Tucson SEL", lender: "Wells Fargo", amountFinanced: 29400, contractDate: "2026-04-05", submittedDate: "2026-04-05", daysOut: 0, status: "Funded", stipsRemaining: 0, priority: false, chargebackRisk: 10, chargebackReason: "", stips: [{ name: "Driver License", cleared: true }], lenderContact: "Marcus Lee (800-555-0104)", notes: "" },
  { id: 5, customer: "David Brown", vehicle: "2026 Chevrolet Equinox LT", lender: "US Bank", amountFinanced: 33900, contractDate: "2026-04-06", submittedDate: "2026-04-06", daysOut: 0, status: "Funded", stipsRemaining: 0, priority: false, chargebackRisk: 4, chargebackReason: "", stips: [], lenderContact: "Amy Walsh (800-555-0105)", notes: "No stips needed." },
  { id: 6, customer: "Maria Lopez", vehicle: "2025 Nissan Rogue SV", lender: "TD Auto", amountFinanced: 31200, contractDate: "2026-04-07", submittedDate: "2026-04-07", daysOut: 0, status: "Funded", stipsRemaining: 0, priority: false, chargebackRisk: 12, chargebackReason: "", stips: [{ name: "Bank Statement", cleared: true }], lenderContact: "Kevin Grant (800-555-0106)", notes: "" },
  { id: 7, customer: "Kevin Patel", vehicle: "2026 Kia Sportage X-Line", lender: "Ally", amountFinanced: 28700, contractDate: "2026-04-08", submittedDate: "2026-04-08", daysOut: 0, status: "Funded", stipsRemaining: 0, priority: false, chargebackRisk: 6, chargebackReason: "", stips: [{ name: "Driver License", cleared: true }], lenderContact: "Jenny Marks (800-555-0101)", notes: "" },
  { id: 8, customer: "Jennifer Chen", vehicle: "2026 Toyota RAV4 XLE", lender: "Westlake", amountFinanced: 36500, contractDate: "2026-04-09", submittedDate: "2026-04-09", daysOut: 0, status: "Funded", stipsRemaining: 0, priority: false, chargebackRisk: 15, chargebackReason: "", stips: [], lenderContact: "Paula Diaz (800-555-0107)", notes: "" },
  { id: 9, customer: "Thomas Garcia", vehicle: "2026 Honda Pilot EX-L", lender: "Chase", amountFinanced: 42100, contractDate: "2026-04-10", submittedDate: "2026-04-10", daysOut: 1, status: "Approved", stipsRemaining: 0, priority: false, chargebackRisk: 9, chargebackReason: "", stips: [{ name: "Proof of Insurance", cleared: true }, { name: "Paystub", cleared: true }], lenderContact: "Tom Reese (800-555-0102)", notes: "Approved, waiting on funding wire." },
  { id: 10, customer: "Amanda White", vehicle: "2026 Subaru Outback Premium", lender: "Capital One", amountFinanced: 35600, contractDate: "2026-04-11", submittedDate: "2026-04-11", daysOut: 2, status: "Approved", stipsRemaining: 0, priority: false, chargebackRisk: 7, chargebackReason: "", stips: [{ name: "Proof of Insurance", cleared: true }], lenderContact: "Diana Cole (800-555-0103)", notes: "" },
  { id: 11, customer: "Chris Taylor", vehicle: "2025 Ram 1500 Big Horn", lender: "Westlake", amountFinanced: 48200, contractDate: "2026-04-11", submittedDate: "2026-04-12", daysOut: 3, status: "Approved", stipsRemaining: 0, priority: false, chargebackRisk: 22, chargebackReason: "High LTV ratio, thin credit file", stips: [{ name: "Proof of Insurance", cleared: true }, { name: "Bank Statement", cleared: true }], lenderContact: "Paula Diaz (800-555-0107)", notes: "Lender reviewing final docs." },
  { id: 12, customer: "Nicole Johnson", vehicle: "2026 Mazda CX-5 Touring", lender: "Ally", amountFinanced: 34100, contractDate: "2026-04-12", submittedDate: "2026-04-12", daysOut: 4, status: "Submitted", stipsRemaining: 1, priority: false, chargebackRisk: 18, chargebackReason: "Missing proof of income", stips: [{ name: "Proof of Insurance", cleared: true }, { name: "Paystub", cleared: false }], lenderContact: "Jenny Marks (800-555-0101)", notes: "Customer promised paystubs by Friday." },
  { id: 13, customer: "Ryan Anderson", vehicle: "2026 Ford Bronco Sport BL", lender: "Wells Fargo", amountFinanced: 39800, contractDate: "2026-04-12", submittedDate: "2026-04-13", daysOut: 4, status: "Submitted", stipsRemaining: 2, priority: true, chargebackRisk: 35, chargebackReason: "Two open stips, lender deadline approaching", stips: [{ name: "Proof of Insurance", cleared: true }, { name: "Paystub", cleared: false }, { name: "Bank Statement", cleared: false }], lenderContact: "Marcus Lee (800-555-0104)", notes: "Called customer twice, no response." },
  { id: 14, customer: "Stephanie Lee", vehicle: "2026 Toyota Highlander LE", lender: "Chase", amountFinanced: 44500, contractDate: "2026-04-13", submittedDate: "2026-04-13", daysOut: 3, status: "Submitted", stipsRemaining: 1, priority: false, chargebackRisk: 14, chargebackReason: "", stips: [{ name: "Co-signer ID", cleared: false }, { name: "Proof of Insurance", cleared: true }], lenderContact: "Tom Reese (800-555-0102)", notes: "Co-signer coming in tomorrow." },
  { id: 15, customer: "Brian Wright", vehicle: "2025 Chevy Silverado 1500", lender: "Credit Acceptance", amountFinanced: 41300, contractDate: "2026-04-13", submittedDate: "2026-04-14", daysOut: 3, status: "Submitted", stipsRemaining: 1, priority: false, chargebackRisk: 45, chargebackReason: "Credit Acceptance high flat cancel rate, payment call pending", stips: [{ name: "Proof of Insurance", cleared: false }, { name: "Bank Statement", cleared: true }], lenderContact: "Ron Harper (800-555-0108)", notes: "Subprime deal, monitor closely." },
  { id: 16, customer: "Ashley Davis", vehicle: "2026 Honda Accord Sport", lender: "TD Auto", amountFinanced: 30800, contractDate: "2026-04-14", submittedDate: "2026-04-15", daysOut: 2, status: "Submitted", stipsRemaining: 0, priority: false, chargebackRisk: 6, chargebackReason: "", stips: [{ name: "Driver License", cleared: true }], lenderContact: "Kevin Grant (800-555-0106)", notes: "" },
  { id: 17, customer: "Daniel Harris", vehicle: "2026 Hyundai Palisade SEL", lender: "US Bank", amountFinanced: 46200, contractDate: "2026-04-14", submittedDate: "2026-04-15", daysOut: 2, status: "Submitted", stipsRemaining: 0, priority: false, chargebackRisk: 8, chargebackReason: "", stips: [], lenderContact: "Amy Walsh (800-555-0105)", notes: "Awaiting lender review." },
  { id: 18, customer: "Megan Clark", vehicle: "2026 Kia Telluride SX", lender: "Ally", amountFinanced: 43700, contractDate: "2026-04-15", submittedDate: null, daysOut: 5, status: "Pending", stipsRemaining: 2, priority: true, chargebackRisk: 55, chargebackReason: "Not yet submitted, 5 days old, two open stips", stips: [{ name: "Proof of Insurance", cleared: false }, { name: "Proof of Income", cleared: false }], lenderContact: "Jenny Marks (800-555-0101)", notes: "Customer unresponsive. Escalate." },
  { id: 19, customer: "Jason Scott", vehicle: "2025 Nissan Pathfinder SL", lender: "Capital One", amountFinanced: 37900, contractDate: "2026-04-15", submittedDate: null, daysOut: 5, status: "Pending", stipsRemaining: 1, priority: true, chargebackRisk: 42, chargebackReason: "Aging deal, insurance stip unresolved", stips: [{ name: "Proof of Insurance", cleared: false }], lenderContact: "Diana Cole (800-555-0103)", notes: "Follow up with customer Monday." },
  { id: 20, customer: "Laura Adams", vehicle: "2026 Toyota Tacoma SR5", lender: "Wells Fargo", amountFinanced: 39200, contractDate: "2026-04-16", submittedDate: null, daysOut: 4, status: "Pending", stipsRemaining: 0, priority: false, chargebackRisk: 11, chargebackReason: "", stips: [{ name: "Driver License", cleared: true }], lenderContact: "Marcus Lee (800-555-0104)", notes: "Paperwork being reviewed internally." },
  { id: 21, customer: "Marcus Rivera", vehicle: "2026 Ford Explorer XLT", lender: "TD Auto", amountFinanced: 42800, contractDate: "2026-04-17", submittedDate: null, daysOut: 3, status: "Pending", stipsRemaining: 1, priority: false, chargebackRisk: 16, chargebackReason: "", stips: [{ name: "Bank Statement", cleared: false }, { name: "Driver License", cleared: true }], lenderContact: "Kevin Grant (800-555-0106)", notes: "Customer emailed bank statements." },
  { id: 22, customer: "Patricia Okafor", vehicle: "2026 Chevrolet Traverse LT", lender: "Credit Acceptance", amountFinanced: 35400, contractDate: "2026-04-18", submittedDate: null, daysOut: 2, status: "Pending", stipsRemaining: 0, priority: false, chargebackRisk: 38, chargebackReason: "Subprime lender, first payment default risk", stips: [{ name: "Proof of Insurance", cleared: true }], lenderContact: "Ron Harper (800-555-0108)", notes: "Ready to submit." },
  { id: 23, customer: "Victor Reyes", vehicle: "2025 Honda Civic Sport", lender: "Chase", amountFinanced: 26800, contractDate: "2026-04-19", submittedDate: null, daysOut: 1, status: "Pending", stipsRemaining: 0, priority: false, chargebackRisk: 5, chargebackReason: "", stips: [], lenderContact: "Tom Reese (800-555-0102)", notes: "New deal, processing." },
  { id: 24, customer: "Brenda Jacobs", vehicle: "2026 Subaru Forester Premium", lender: "US Bank", amountFinanced: 33100, contractDate: "2026-04-06", submittedDate: "2026-04-06", daysOut: 0, status: "Chargeback", stipsRemaining: 0, priority: true, chargebackRisk: 95, chargebackReason: "Customer returned vehicle within 3 days, full unwind", stips: [{ name: "Proof of Insurance", cleared: true }], lenderContact: "Amy Walsh (800-555-0105)", notes: "Deal unwound. Refund processed." },
  { id: 25, customer: "Derek Howard", vehicle: "2026 Mazda CX-50 Turbo", lender: "Westlake", amountFinanced: 40600, contractDate: "2026-04-08", submittedDate: "2026-04-09", daysOut: 0, status: "Chargeback", stipsRemaining: 0, priority: true, chargebackRisk: 88, chargebackReason: "First payment default, lender charged back", stips: [{ name: "Proof of Insurance", cleared: true }, { name: "Paystub", cleared: true }], lenderContact: "Paula Diaz (800-555-0107)", notes: "Collections involved. Escalated to GM." },
];

const ALL_STATUSES: DealStatus[] = ["Pending", "Submitted", "Approved", "Funded", "Chargeback"];
const LENDERS = Array.from(new Set(DEALS.map((d) => d.lender))).sort();

// ── Funding velocity data (last 14 days) ──────────────────────────────
const VELOCITY_DATA = [
  { date: "Apr 7", funded: 1 },
  { date: "Apr 8", funded: 2 },
  { date: "Apr 9", funded: 1 },
  { date: "Apr 10", funded: 3 },
  { date: "Apr 11", funded: 1 },
  { date: "Apr 12", funded: 2 },
  { date: "Apr 13", funded: 0 },
  { date: "Apr 14", funded: 2 },
  { date: "Apr 15", funded: 1 },
  { date: "Apr 16", funded: 2 },
  { date: "Apr 17", funded: 1 },
  { date: "Apr 18", funded: 0 },
  { date: "Apr 19", funded: 1 },
  { date: "Apr 20", funded: 0 },
];

// ── Helpers ───────────────────────────────────────────────────────────
function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function statusColor(status: DealStatus): string {
  switch (status) {
    case "Funded": return "bg-emerald-600 text-white";
    case "Approved": return "bg-sky-600 text-white";
    case "Submitted": return "bg-amber-500 text-white";
    case "Pending": return "bg-orange-500 text-white";
    case "Chargeback": return "bg-red-600 text-white";
  }
}

function rowBg(deal: FundingDeal): string {
  if (deal.status === "Funded") return "bg-emerald-500/10";
  if (deal.status === "Submitted" || deal.status === "Approved") return "bg-amber-500/10";
  if (deal.status === "Pending" && deal.daysOut >= 5) return "bg-red-500/10";
  return "";
}

// ── Component ─────────────────────────────────────────────────────────
export default function FundingQueue() {
  useEffect(() => {
    document.title = "Funding Queue | F&I Co-Pilot by ASURA Group";
  }, []);

  const [statusFilter, setStatusFilter] = useState<DealStatus | "All">("All");
  const [agingFilter, setAgingFilter] = useState<string>("All");
  const [lenderFilter, setLenderFilter] = useState<string>("All");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedDeal, setSelectedDeal] = useState<FundingDeal | null>(null);
  const [deals, setDeals] = useState<FundingDeal[]>(DEALS);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // ── Filtering ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = deals;
    if (statusFilter !== "All") list = list.filter((d) => d.status === statusFilter);
    if (lenderFilter !== "All") list = list.filter((d) => d.lender === lenderFilter);
    if (agingFilter === "0-2") list = list.filter((d) => d.daysOut <= 2);
    else if (agingFilter === "3-5") list = list.filter((d) => d.daysOut >= 3 && d.daysOut <= 5);
    else if (agingFilter === "5+") list = list.filter((d) => d.daysOut > 5);
    return list;
  }, [deals, statusFilter, lenderFilter, agingFilter]);

  // ── KPIs ──────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const inQueue = deals.filter((d) => d.status !== "Funded" && d.status !== "Chargeback");
    const fundedToday = deals.filter((d) => d.status === "Funded");
    const avgDays = inQueue.length > 0 ? (inQueue.reduce((s, d) => s + d.daysOut, 0) / inQueue.length).toFixed(1) : "0";
    const oldest = inQueue.length > 0 ? Math.max(...inQueue.map((d) => d.daysOut)) : 0;
    const totalPending = inQueue.reduce((s, d) => s + d.amountFinanced, 0);
    return {
      inQueue: inQueue.length,
      fundedToday: fundedToday.length,
      avgDays,
      oldest,
      totalPending,
    };
  }, [deals]);

  // ── Chargeback risk deals ─────────────────────────────────────────
  const chargebackRiskDeals = useMemo(
    () => deals.filter((d) => d.chargebackRisk >= 30 && d.status !== "Chargeback").sort((a, b) => b.chargebackRisk - a.chargebackRisk),
    [deals],
  );

  // ── Bulk actions ──────────────────────────────────────────────────
  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((d) => d.id)));
    }
  }

  function bulkUpdateStatus(newStatus: DealStatus) {
    setDeals((prev) =>
      prev.map((d) => (selectedIds.has(d.id) ? { ...d, status: newStatus, daysOut: newStatus === "Funded" ? 0 : d.daysOut, submittedDate: newStatus === "Submitted" && !d.submittedDate ? "2026-04-20" : d.submittedDate } : d)),
    );
    setSelectedIds(new Set());
  }

  // ── End of day summary ────────────────────────────────────────────
  function copyEndOfDaySummary() {
    const funded = deals.filter((d) => d.status === "Funded");
    const pending = deals.filter((d) => d.status === "Pending");
    const submitted = deals.filter((d) => d.status === "Submitted");
    const approved = deals.filter((d) => d.status === "Approved");
    const chargebacks = deals.filter((d) => d.status === "Chargeback");

    const lines = [
      "=== FUNDING QUEUE END-OF-DAY SUMMARY ===",
      `Date: April 20, 2026`,
      "",
      `Funded: ${funded.length} deals (${fmtCurrency(funded.reduce((s, d) => s + d.amountFinanced, 0))})`,
      `Approved (awaiting funding): ${approved.length} deals`,
      `Submitted (in lender review): ${submitted.length} deals`,
      `Pending (not yet submitted): ${pending.length} deals`,
      `Chargebacks: ${chargebacks.length} deals`,
      "",
      `Total $ Pending: ${fmtCurrency(deals.filter((d) => d.status !== "Funded" && d.status !== "Chargeback").reduce((s, d) => s + d.amountFinanced, 0))}`,
      `Avg Days to Fund: ${kpis.avgDays}`,
      `Oldest Deal: ${kpis.oldest} days`,
      "",
      "--- Deals Requiring Attention ---",
      ...deals
        .filter((d) => d.priority && d.status !== "Funded")
        .map((d) => `  * ${d.customer} - ${d.vehicle} (${d.lender}) - ${d.status} - ${d.daysOut}d out`),
      "",
      "Generated by F&I Co-Pilot by ASURA Group",
    ];

    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  }

  return (
    <AppLayout title="Funding Queue" subtitle="Real-time view of all deals pending funding">
      <div className="p-4 lg:p-6 space-y-6">

        {/* ── KPI Bar ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><Clock className="h-5 w-5 text-blue-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total in Queue</p>
                <p className="text-2xl font-bold">{kpis.inQueue}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10"><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Funded Today</p>
                <p className="text-2xl font-bold">{kpis.fundedToday}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10"><TrendingUp className="h-5 w-5 text-amber-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Days to Fund</p>
                <p className="text-2xl font-bold">{kpis.avgDays}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Oldest Deal</p>
                <p className="text-2xl font-bold">{kpis.oldest}d</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10"><DollarSign className="h-5 w-5 text-purple-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total $ Pending</p>
                <p className="text-2xl font-bold">{fmtCurrency(kpis.totalPending)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Filters & Tabs ───────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Status tabs */}
          <div className="flex flex-wrap gap-1">
            {(["All", ...ALL_STATUSES] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "default" : "outline"}
                onClick={() => setStatusFilter(s)}
              >
                {s}
                {s !== "All" && (
                  <span className="ml-1 text-xs opacity-70">
                    ({deals.filter((d) => d.status === s).length})
                  </span>
                )}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Aging filter */}
            <Select value={agingFilter} onValueChange={setAgingFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Aging" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Aging</SelectItem>
                <SelectItem value="0-2">0-2 days</SelectItem>
                <SelectItem value="3-5">3-5 days</SelectItem>
                <SelectItem value="5+">5+ days</SelectItem>
              </SelectContent>
            </Select>

            {/* Lender filter */}
            <Select value={lenderFilter} onValueChange={setLenderFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Lender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Lenders</SelectItem>
                {LENDERS.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* End of Day */}
            <Button variant="outline" size="sm" onClick={copyEndOfDaySummary}>
              <ClipboardCopy className="h-4 w-4 mr-1" />
              {copiedSummary ? "Copied!" : "End of Day"}
            </Button>
          </div>
        </div>

        {/* ── Bulk actions ─────────────────────────────────────────── */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
            <span className="text-sm font-medium">{selectedIds.size} deal{selectedIds.size > 1 ? "s" : ""} selected</span>
            <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus("Submitted")}>Mark as Submitted</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus("Funded")}>Mark as Funded</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Clear</Button>
          </div>
        )}

        {/* ── Deal Table ───────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-3 w-10">
                      <Checkbox checked={filtered.length > 0 && selectedIds.size === filtered.length} onCheckedChange={toggleAll} />
                    </th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Vehicle</th>
                    <th className="p-3">Lender</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3">Contract</th>
                    <th className="p-3">Submitted</th>
                    <th className="p-3 text-center">Days Out</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Stips</th>
                    <th className="p-3 text-center">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((deal) => (
                    <tr
                      key={deal.id}
                      className={`border-b hover:bg-muted/50 cursor-pointer transition-colors ${rowBg(deal)}`}
                      onClick={() => setSelectedDeal(deal)}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selectedIds.has(deal.id)} onCheckedChange={() => toggleSelect(deal.id)} />
                      </td>
                      <td className="p-3 font-medium">{deal.customer}</td>
                      <td className="p-3 text-muted-foreground">{deal.vehicle}</td>
                      <td className="p-3">{deal.lender}</td>
                      <td className="p-3 text-right font-mono">{fmtCurrency(deal.amountFinanced)}</td>
                      <td className="p-3 text-muted-foreground">{deal.contractDate}</td>
                      <td className="p-3 text-muted-foreground">{deal.submittedDate ?? "—"}</td>
                      <td className="p-3 text-center">
                        <span className={deal.daysOut >= 5 ? "text-red-500 font-bold" : deal.daysOut >= 3 ? "text-amber-500 font-semibold" : ""}>
                          {deal.daysOut}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge className={statusColor(deal.status)}>{deal.status}</Badge>
                      </td>
                      <td className="p-3 text-center">
                        {deal.stipsRemaining > 0 ? (
                          <span className="text-amber-500 font-semibold">{deal.stipsRemaining}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {deal.priority && <Flag className="h-4 w-4 text-red-500 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-muted-foreground">No deals match the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ── Charts & Risk Panel ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funding Velocity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Funding Velocity (Last 14 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={VELOCITY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                  <Bar dataKey="funded" name="Deals Funded" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chargeback Risk Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                Chargeback Risk Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {chargebackRiskDeals.length === 0 ? (
                <p className="text-muted-foreground text-sm">No high-risk deals detected.</p>
              ) : (
                chargebackRiskDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 cursor-pointer hover:bg-red-500/10 transition-colors"
                    onClick={() => setSelectedDeal(deal)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{deal.customer}</span>
                      <Badge variant="destructive">{deal.chargebackRisk}% risk</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{deal.vehicle} — {deal.lender}</p>
                    <p className="text-xs text-red-400 mt-1">{deal.chargebackReason}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Slide-out Deal Detail Panel ──────────────────────────── */}
        {selectedDeal && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedDeal(null)}
            />
            {/* Panel */}
            <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-card border-l z-50 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{selectedDeal.customer}</h2>
                    <p className="text-sm text-muted-foreground">{selectedDeal.vehicle}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDeal(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Status & Amount */}
                <div className="flex items-center gap-3">
                  <Badge className={statusColor(selectedDeal.status)}>{selectedDeal.status}</Badge>
                  {selectedDeal.priority && <Badge variant="destructive">Priority</Badge>}
                  <span className="ml-auto text-xl font-bold">{fmtCurrency(selectedDeal.amountFinanced)}</span>
                </div>

                {/* Deal Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Lender</p>
                    <p className="font-medium">{selectedDeal.lender}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Days Out</p>
                    <p className={`font-medium ${selectedDeal.daysOut >= 5 ? "text-red-500" : ""}`}>{selectedDeal.daysOut} days</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Contract Date</p>
                    <p className="font-medium">{selectedDeal.contractDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Submitted Date</p>
                    <p className="font-medium">{selectedDeal.submittedDate ?? "Not submitted"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Chargeback Risk</p>
                    <p className={`font-medium ${selectedDeal.chargebackRisk >= 30 ? "text-red-500" : selectedDeal.chargebackRisk >= 15 ? "text-amber-500" : "text-emerald-500"}`}>
                      {selectedDeal.chargebackRisk}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Stips Remaining</p>
                    <p className="font-medium">{selectedDeal.stipsRemaining}</p>
                  </div>
                </div>

                {/* Lender Contact */}
                <div>
                  <h3 className="text-sm font-semibold mb-1">Lender Contact</h3>
                  <p className="text-sm text-muted-foreground">{selectedDeal.lenderContact}</p>
                </div>

                {/* Stip Checklist */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Stipulation Checklist</h3>
                  {selectedDeal.stips.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No stipulations required.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDeal.stips.map((stip, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          {stip.cleared ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                          )}
                          <span className={stip.cleared ? "line-through text-muted-foreground" : ""}>{stip.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chargeback Reason */}
                {selectedDeal.chargebackReason && (
                  <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5">
                    <h3 className="text-sm font-semibold text-red-500 mb-1">Chargeback Risk Note</h3>
                    <p className="text-sm text-muted-foreground">{selectedDeal.chargebackReason}</p>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <h3 className="text-sm font-semibold mb-1">Notes</h3>
                  <div className="p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <p className="text-sm text-muted-foreground">{selectedDeal.notes || "No notes."}</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2">
                  {selectedDeal.status === "Pending" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setDeals((prev) => prev.map((d) => d.id === selectedDeal.id ? { ...d, status: "Submitted" as DealStatus, submittedDate: "2026-04-20" } : d));
                        setSelectedDeal({ ...selectedDeal, status: "Submitted", submittedDate: "2026-04-20" });
                      }}
                    >
                      Mark as Submitted
                    </Button>
                  )}
                  {(selectedDeal.status === "Submitted" || selectedDeal.status === "Approved") && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setDeals((prev) => prev.map((d) => d.id === selectedDeal.id ? { ...d, status: "Funded" as DealStatus, daysOut: 0 } : d));
                        setSelectedDeal({ ...selectedDeal, status: "Funded", daysOut: 0 });
                      }}
                    >
                      Mark as Funded
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setSelectedDeal(null)}>Close</Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
