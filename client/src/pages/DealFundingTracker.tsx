import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  FileText,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Building2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from "recharts";

type FundingStatus = "Contract Signed" | "Submitted to Lender" | "Pending Stipulations" | "Approved" | "Funded";
const PIPELINE_STAGES: FundingStatus[] = ["Contract Signed", "Submitted to Lender", "Pending Stipulations", "Approved", "Funded"];

interface Stipulation {
  name: string;
  resolved: boolean;
}

interface Deal {
  id: string;
  customer: string;
  vehicle: string;
  lender: string;
  amountFinanced: number;
  contractDate: string;
  submittedDate: string | null;
  fundedDate: string | null;
  status: FundingStatus;
  stips: Stipulation[];
  manager: string;
}

const DEALS: Deal[] = [
  { id: "D-4401", customer: "James Wilson", vehicle: "2026 Toyota Camry", lender: "Ally Financial", amountFinanced: 32500, contractDate: "2026-04-01", submittedDate: "2026-04-01", fundedDate: "2026-04-04", status: "Funded", stips: [{ name: "Proof of Insurance", resolved: true }, { name: "Driver License", resolved: true }], manager: "Mike Chen" },
  { id: "D-4402", customer: "Sarah Martinez", vehicle: "2026 Honda CR-V", lender: "Chase Auto", amountFinanced: 38200, contractDate: "2026-04-02", submittedDate: "2026-04-02", fundedDate: "2026-04-05", status: "Funded", stips: [{ name: "Proof of Insurance", resolved: true }], manager: "Lisa Park" },
  { id: "D-4403", customer: "Robert Kim", vehicle: "2025 Ford F-150", lender: "Capital One", amountFinanced: 45800, contractDate: "2026-04-03", submittedDate: "2026-04-03", fundedDate: "2026-04-07", status: "Funded", stips: [{ name: "Paystub", resolved: true }, { name: "Proof of Insurance", resolved: true }], manager: "Mike Chen" },
  { id: "D-4404", customer: "Emily Nguyen", vehicle: "2026 Hyundai Tucson", lender: "Wells Fargo", amountFinanced: 29400, contractDate: "2026-04-04", submittedDate: "2026-04-04", fundedDate: "2026-04-08", status: "Funded", stips: [{ name: "Driver License", resolved: true }], manager: "Jake Ross" },
  { id: "D-4405", customer: "David Brown", vehicle: "2026 Chevrolet Equinox", lender: "TD Auto Finance", amountFinanced: 33900, contractDate: "2026-04-05", submittedDate: "2026-04-05", fundedDate: "2026-04-09", status: "Funded", stips: [], manager: "Lisa Park" },
  { id: "D-4406", customer: "Maria Lopez", vehicle: "2025 Nissan Rogue", lender: "US Bank", amountFinanced: 31200, contractDate: "2026-04-06", submittedDate: "2026-04-07", fundedDate: "2026-04-10", status: "Funded", stips: [{ name: "Proof of Insurance", resolved: true }, { name: "Bank Statement", resolved: true }], manager: "Mike Chen" },
  { id: "D-4407", customer: "Kevin Patel", vehicle: "2026 Kia Sportage", lender: "Ally Financial", amountFinanced: 28700, contractDate: "2026-04-07", submittedDate: "2026-04-07", fundedDate: "2026-04-11", status: "Funded", stips: [{ name: "Driver License", resolved: true }], manager: "Jake Ross" },
  { id: "D-4408", customer: "Jennifer Chen", vehicle: "2026 Toyota RAV4", lender: "Bank of America", amountFinanced: 36500, contractDate: "2026-04-08", submittedDate: "2026-04-08", fundedDate: "2026-04-12", status: "Funded", stips: [], manager: "Lisa Park" },
  { id: "D-4409", customer: "Thomas Garcia", vehicle: "2026 Honda Pilot", lender: "Chase Auto", amountFinanced: 42100, contractDate: "2026-04-09", submittedDate: "2026-04-09", fundedDate: "2026-04-13", status: "Funded", stips: [{ name: "Paystub", resolved: true }, { name: "Co-signer Required", resolved: true }], manager: "Mike Chen" },
  { id: "D-4410", customer: "Amanda White", vehicle: "2026 Subaru Outback", lender: "Capital One", amountFinanced: 35600, contractDate: "2026-04-10", submittedDate: "2026-04-10", fundedDate: "2026-04-14", status: "Funded", stips: [{ name: "Proof of Insurance", resolved: true }], manager: "Jake Ross" },
  { id: "D-4411", customer: "Chris Taylor", vehicle: "2025 Ram 1500", lender: "Westlake Financial", amountFinanced: 48200, contractDate: "2026-04-10", submittedDate: "2026-04-11", fundedDate: null, status: "Approved", stips: [{ name: "Clean Title", resolved: true }, { name: "Proof of Insurance", resolved: true }], manager: "Mike Chen" },
  { id: "D-4412", customer: "Nicole Johnson", vehicle: "2026 Mazda CX-5", lender: "Ally Financial", amountFinanced: 34100, contractDate: "2026-04-11", submittedDate: "2026-04-11", fundedDate: null, status: "Approved", stips: [{ name: "Driver License", resolved: true }], manager: "Lisa Park" },
  { id: "D-4413", customer: "Ryan Anderson", vehicle: "2026 Ford Bronco Sport", lender: "Wells Fargo", amountFinanced: 39800, contractDate: "2026-04-12", submittedDate: "2026-04-12", fundedDate: null, status: "Pending Stipulations", stips: [{ name: "Proof of Insurance", resolved: true }, { name: "Paystub", resolved: false }, { name: "Bank Statement", resolved: false }], manager: "Jake Ross" },
  { id: "D-4414", customer: "Stephanie Lee", vehicle: "2026 Toyota Highlander", lender: "Chase Auto", amountFinanced: 44500, contractDate: "2026-04-13", submittedDate: "2026-04-13", fundedDate: null, status: "Pending Stipulations", stips: [{ name: "Co-signer Required", resolved: false }, { name: "Proof of Insurance", resolved: true }, { name: "Driver License", resolved: true }], manager: "Mike Chen" },
  { id: "D-4415", customer: "Brian Wright", vehicle: "2025 Chevrolet Silverado", lender: "Credit Acceptance", amountFinanced: 41300, contractDate: "2026-04-13", submittedDate: "2026-04-14", fundedDate: null, status: "Pending Stipulations", stips: [{ name: "Paystub", resolved: false }, { name: "Proof of Insurance", resolved: false }, { name: "Bank Statement", resolved: true }], manager: "Lisa Park" },
  { id: "D-4416", customer: "Ashley Davis", vehicle: "2026 Honda Accord", lender: "TD Auto Finance", amountFinanced: 30800, contractDate: "2026-04-14", submittedDate: "2026-04-14", fundedDate: null, status: "Submitted to Lender", stips: [], manager: "Jake Ross" },
  { id: "D-4417", customer: "Daniel Harris", vehicle: "2026 Hyundai Palisade", lender: "US Bank", amountFinanced: 46200, contractDate: "2026-04-14", submittedDate: "2026-04-15", fundedDate: null, status: "Submitted to Lender", stips: [], manager: "Mike Chen" },
  { id: "D-4418", customer: "Megan Clark", vehicle: "2026 Kia Telluride", lender: "Ally Financial", amountFinanced: 43700, contractDate: "2026-04-15", submittedDate: "2026-04-15", fundedDate: null, status: "Submitted to Lender", stips: [], manager: "Lisa Park" },
  { id: "D-4419", customer: "Jason Scott", vehicle: "2025 Nissan Pathfinder", lender: "Capital One", amountFinanced: 37900, contractDate: "2026-04-15", submittedDate: null, fundedDate: null, status: "Contract Signed", stips: [], manager: "Jake Ross" },
  { id: "D-4420", customer: "Laura Adams", vehicle: "2026 Toyota Tacoma", lender: "Bank of America", amountFinanced: 39200, contractDate: "2026-04-16", submittedDate: null, fundedDate: null, status: "Contract Signed", stips: [], manager: "Mike Chen" },
];

const MANAGERS = Array.from(new Set(DEALS.map((d) => d.manager)));
const LENDERS = Array.from(new Set(DEALS.map((d) => d.lender)));
const TODAY = new Date("2026-04-16");

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function daysSince(date: string): number {
  return Math.round((TODAY.getTime() - new Date(date).getTime()) / 86400000);
}

const STATUS_COLORS: Record<FundingStatus, string> = {
  "Contract Signed": "border-blue-500/30 text-blue-400",
  "Submitted to Lender": "border-purple-500/30 text-purple-400",
  "Pending Stipulations": "border-amber-500/30 text-amber-400",
  "Approved": "border-cyan-500/30 text-cyan-400",
  "Funded": "border-green-500/30 text-green-400",
};

export default function DealFundingTracker() {
  const [statusFilter, setStatusFilter] = useState<FundingStatus | "All">("All");
  const [managerFilter, setManagerFilter] = useState<string>("All");
  const [lenderFilter, setLenderFilter] = useState<string>("All");
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null);

  const filteredDeals = useMemo(() =>
    DEALS.filter((d) => {
      if (statusFilter !== "All" && d.status !== statusFilter) return false;
      if (managerFilter !== "All" && d.manager !== managerFilter) return false;
      if (lenderFilter !== "All" && d.lender !== lenderFilter) return false;
      return true;
    }),
    [statusFilter, managerFilter, lenderFilter]
  );

  // KPIs
  const pendingDeals = DEALS.filter((d) => d.status !== "Funded");
  const totalPending = pendingDeals.reduce((s, d) => s + d.amountFinanced, 0);
  const fundedDeals = DEALS.filter((d) => d.status === "Funded");
  const avgDaysToFund = fundedDeals.length > 0
    ? +(fundedDeals.reduce((s, d) => s + daysBetween(d.contractDate, d.fundedDate!), 0) / fundedDeals.length).toFixed(1)
    : 0;
  const longestPending = pendingDeals.length > 0
    ? Math.max(...pendingDeals.map((d) => daysSince(d.contractDate)))
    : 0;
  const sevenDaysAgo = new Date(TODAY.getTime() - 7 * 86400000);
  const fundedThisWeek = fundedDeals.filter((d) => new Date(d.fundedDate!) >= sevenDaysAgo).length;
  const submittedDeals = DEALS.filter((d) => d.submittedDate);
  const fundingRate = submittedDeals.length > 0
    ? Math.round((fundedDeals.length / submittedDeals.length) * 100)
    : 0;

  // Pipeline counts
  const stageCounts = useMemo(() =>
    PIPELINE_STAGES.map((stage) => ({
      stage,
      count: DEALS.filter((d) => d.status === stage).length,
      total: DEALS.filter((d) => d.status === stage).reduce((s, d) => s + d.amountFinanced, 0),
    })),
    []
  );

  // Lender scorecard
  const lenderScorecard = useMemo(() => {
    const map = new Map<string, number[]>();
    fundedDeals.forEach((d) => {
      const days = daysBetween(d.contractDate, d.fundedDate!);
      map.set(d.lender, [...(map.get(d.lender) ?? []), days]);
    });
    return Array.from(map.entries())
      .map(([lender, days]) => ({ lender, avgDays: +(days.reduce((s: number, d: number) => s + d, 0) / days.length).toFixed(1), count: days.length }))
      .sort((a, b) => a.avgDays - b.avgDays);
  }, []);

  // Monthly trend data
  const trendData = useMemo(() => {
    const byDay = new Map<number, { funded: number; totalDays: number; count: number }>();
    for (let day = 1; day <= 16; day++) {
      byDay.set(day, { funded: 0, totalDays: 0, count: 0 });
    }
    fundedDeals.forEach((d) => {
      const day = new Date(d.fundedDate!).getDate();
      const entry = byDay.get(day);
      if (entry) {
        entry.funded++;
        entry.totalDays += daysBetween(d.contractDate, d.fundedDate!);
        entry.count++;
      }
    });
    return Array.from(byDay.entries()).map(([day, data]) => ({
      day: `Apr ${day}`,
      funded: data.funded,
      avgDaysToFund: data.count > 0 ? +(data.totalDays / data.count).toFixed(1) : 0,
    }));
  }, []);

  const kpis = [
    { label: "Total Pending Funding", value: `$${totalPending.toLocaleString()}`, icon: DollarSign, color: "text-blue-400" },
    { label: "Avg Days to Fund", value: `${avgDaysToFund}`, icon: Clock, color: "text-green-400" },
    { label: "Longest Pending (days)", value: `${longestPending}`, icon: AlertTriangle, color: longestPending > 7 ? "text-amber-400" : "text-green-400" },
    { label: "Funded This Week", value: `${fundedThisWeek}`, icon: CheckCircle2, color: "text-green-400" },
    { label: "Funding Rate", value: `${fundingRate}%`, icon: TrendingUp, color: "text-purple-400" },
  ];

  return (
    <AppLayout title="Deal Funding Tracker" subtitle="Track deals from contract to funded">
      <div className="p-4 lg:p-6 space-y-6">
        {/* KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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

        {/* Pipeline Visualization */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Funding Pipeline</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            {stageCounts.map((s, i) => (
              <div key={s.stage} className="flex-1 relative">
                <div className={`p-3 rounded-lg border ${STATUS_COLORS[s.stage as FundingStatus].replace("text-", "border-")} bg-muted/30`}>
                  <p className="text-[10px] font-medium text-muted-foreground truncate">{s.stage}</p>
                  <p className="text-lg font-bold text-foreground">{s.count}</p>
                  <p className="text-[10px] text-muted-foreground">${(s.total / 1000).toFixed(0)}k</p>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-muted-foreground/40">→</div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FundingStatus | "All")}
            className="px-3 py-1.5 rounded-md text-xs bg-muted border border-border text-foreground"
          >
            <option value="All">All Statuses</option>
            {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={managerFilter}
            onChange={(e) => setManagerFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md text-xs bg-muted border border-border text-foreground"
          >
            <option value="All">All Managers</option>
            {MANAGERS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={lenderFilter}
            onChange={(e) => setLenderFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md text-xs bg-muted border border-border text-foreground"
          >
            <option value="All">All Lenders</option>
            {LENDERS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Deals Table */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Deals ({filteredDeals.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Deal #</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden md:table-cell">Vehicle</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden lg:table-cell">Lender</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden lg:table-cell">Contract</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Days</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden md:table-cell">Manager</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((deal) => {
                  const pending = deal.status !== "Funded";
                  const ageDays = pending ? daysSince(deal.contractDate) : daysBetween(deal.contractDate, deal.fundedDate!);
                  const aging = pending && ageDays > 14 ? "text-red-400 bg-red-500/10" : pending && ageDays > 7 ? "text-amber-400 bg-amber-500/10" : "";
                  const isExpanded = expandedDeal === deal.id;
                  const unresolvedStips = deal.stips.filter((s) => !s.resolved);

                  return (
                    <>
                      <tr
                        key={deal.id}
                        className={`border-t border-border hover:bg-muted/30 transition-colors cursor-pointer ${aging ? "bg-opacity-20" : ""}`}
                        onClick={() => setExpandedDeal(isExpanded ? null : deal.id)}
                      >
                        <td className="px-3 py-2.5 font-medium text-foreground">{deal.id}</td>
                        <td className="px-3 py-2.5 text-foreground">{deal.customer}</td>
                        <td className="px-3 py-2.5 text-muted-foreground hidden md:table-cell">{deal.vehicle}</td>
                        <td className="px-3 py-2.5 text-muted-foreground hidden lg:table-cell">{deal.lender}</td>
                        <td className="text-right px-3 py-2.5 text-foreground">${deal.amountFinanced.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-muted-foreground hidden lg:table-cell">{deal.contractDate}</td>
                        <td className={`text-center px-3 py-2.5 font-medium rounded ${aging}`}>
                          {ageDays}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[deal.status]}`}>
                            {deal.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground hidden md:table-cell">{deal.manager}</td>
                        <td className="px-3 py-2.5 text-center">
                          {(deal.stips.length > 0 || isExpanded) && (
                            isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground inline" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground inline" />
                          )}
                        </td>
                      </tr>
                      {isExpanded && deal.stips.length > 0 && (
                        <tr key={`${deal.id}-stips`} className="bg-muted/20">
                          <td colSpan={10} className="px-6 py-3">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Stipulations ({deal.stips.filter((s) => s.resolved).length}/{deal.stips.length} resolved)
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {deal.stips.map((stip) => (
                                <Badge
                                  key={stip.name}
                                  variant="outline"
                                  className={`text-[10px] ${stip.resolved ? "border-green-500/30 text-green-400" : "border-red-500/30 text-red-400"}`}
                                >
                                  {stip.resolved ? "✓" : "○"} {stip.name}
                                </Badge>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Lender Scorecard + Monthly Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Lender Funding Speed (Avg Days)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Lender</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Avg Days</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Deals</th>
                  </tr>
                </thead>
                <tbody>
                  {lenderScorecard.map((l) => (
                    <tr key={l.lender} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-foreground">{l.lender}</td>
                      <td className={`text-right px-3 py-2.5 font-semibold ${l.avgDays <= 3 ? "text-green-400" : l.avgDays <= 5 ? "text-amber-400" : "text-red-400"}`}>
                        {l.avgDays}
                      </td>
                      <td className="text-right px-3 py-2.5 text-muted-foreground">{l.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Funding Trend — April 2026</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={50} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="funded" name="Funded Deals" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="avgDaysToFund" name="Avg Days to Fund" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
