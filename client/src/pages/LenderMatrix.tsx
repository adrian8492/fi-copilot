import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Percent,
  Search,
  Filter,
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
  Cell,
} from "recharts";

// ── Credit Tiers ────────────────────────────────────────────────────
type CreditTier = "Super Prime" | "Prime" | "Near Prime" | "Sub Prime" | "Deep Sub";
const CREDIT_TIERS: CreditTier[] = ["Super Prime", "Prime", "Near Prime", "Sub Prime", "Deep Sub"];

function classifyCreditTier(score: number): CreditTier {
  if (score >= 780) return "Super Prime";
  if (score >= 720) return "Prime";
  if (score >= 660) return "Near Prime";
  if (score >= 580) return "Sub Prime";
  return "Deep Sub";
}

const TIER_COLORS: Record<CreditTier, string> = {
  "Super Prime": "#22c55e",
  "Prime": "#3b82f6",
  "Near Prime": "#eab308",
  "Sub Prime": "#f97316",
  "Deep Sub": "#ef4444",
};

// ── Date Range ──────────────────────────────────────────────────────
type DateRange = "30" | "90" | "ytd";

// ── Lender Data ─────────────────────────────────────────────────────
interface Lender {
  name: string;
  tiers: CreditTier[];
  buyRate: number;
  sellRateCap: number;
  maxReserveBps: number;
  flatFee: number;
  maxTerm: number;
  avgApprovalHours: number;
  approvalRate: number;
  ytdVolume: number;
  status: "Active" | "Preferred" | "Inactive";
  avgFundingDays: number;
  reserveByTier: Record<CreditTier, number>;
}

const LENDERS: Lender[] = [
  { name: "Ally Financial", tiers: ["Super Prime", "Prime", "Near Prime"], buyRate: 4.9, sellRateCap: 7.9, maxReserveBps: 250, flatFee: 150, maxTerm: 84, avgApprovalHours: 2.1, approvalRate: 78, ytdVolume: 4250000, status: "Preferred", avgFundingDays: 3.2, reserveByTier: { "Super Prime": 250, "Prime": 220, "Near Prime": 180, "Sub Prime": 0, "Deep Sub": 0 } },
  { name: "Capital One", tiers: ["Super Prime", "Prime", "Near Prime", "Sub Prime"], buyRate: 5.2, sellRateCap: 8.2, maxReserveBps: 275, flatFee: 125, maxTerm: 84, avgApprovalHours: 1.8, approvalRate: 82, ytdVolume: 5100000, status: "Preferred", avgFundingDays: 2.8, reserveByTier: { "Super Prime": 275, "Prime": 240, "Near Prime": 200, "Sub Prime": 150, "Deep Sub": 0 } },
  { name: "Chase Auto", tiers: ["Super Prime", "Prime"], buyRate: 4.5, sellRateCap: 7.0, maxReserveBps: 200, flatFee: 175, maxTerm: 72, avgApprovalHours: 3.5, approvalRate: 65, ytdVolume: 3800000, status: "Active", avgFundingDays: 4.1, reserveByTier: { "Super Prime": 200, "Prime": 180, "Near Prime": 0, "Sub Prime": 0, "Deep Sub": 0 } },
  { name: "Wells Fargo", tiers: ["Super Prime", "Prime", "Near Prime"], buyRate: 5.0, sellRateCap: 7.5, maxReserveBps: 225, flatFee: 200, maxTerm: 84, avgApprovalHours: 2.5, approvalRate: 71, ytdVolume: 3200000, status: "Active", avgFundingDays: 3.6, reserveByTier: { "Super Prime": 225, "Prime": 200, "Near Prime": 160, "Sub Prime": 0, "Deep Sub": 0 } },
  { name: "US Bank", tiers: ["Super Prime", "Prime", "Near Prime"], buyRate: 4.8, sellRateCap: 7.8, maxReserveBps: 240, flatFee: 100, maxTerm: 78, avgApprovalHours: 2.0, approvalRate: 75, ytdVolume: 2900000, status: "Active", avgFundingDays: 3.0, reserveByTier: { "Super Prime": 240, "Prime": 210, "Near Prime": 175, "Sub Prime": 0, "Deep Sub": 0 } },
  { name: "Westlake Financial", tiers: ["Near Prime", "Sub Prime", "Deep Sub"], buyRate: 9.5, sellRateCap: 15.9, maxReserveBps: 500, flatFee: 300, maxTerm: 72, avgApprovalHours: 1.2, approvalRate: 91, ytdVolume: 6200000, status: "Preferred", avgFundingDays: 2.1, reserveByTier: { "Super Prime": 0, "Prime": 0, "Near Prime": 350, "Sub Prime": 500, "Deep Sub": 450 } },
  { name: "Credit Acceptance", tiers: ["Sub Prime", "Deep Sub"], buyRate: 12.0, sellRateCap: 19.9, maxReserveBps: 600, flatFee: 400, maxTerm: 60, avgApprovalHours: 0.8, approvalRate: 95, ytdVolume: 7800000, status: "Active", avgFundingDays: 1.5, reserveByTier: { "Super Prime": 0, "Prime": 0, "Near Prime": 0, "Sub Prime": 600, "Deep Sub": 550 } },
  { name: "TD Auto Finance", tiers: ["Super Prime", "Prime", "Near Prime"], buyRate: 5.1, sellRateCap: 8.1, maxReserveBps: 260, flatFee: 130, maxTerm: 84, avgApprovalHours: 2.3, approvalRate: 74, ytdVolume: 3500000, status: "Active", avgFundingDays: 3.4, reserveByTier: { "Super Prime": 260, "Prime": 230, "Near Prime": 190, "Sub Prime": 0, "Deep Sub": 0 } },
  { name: "Bank of America", tiers: ["Super Prime", "Prime"], buyRate: 4.6, sellRateCap: 7.1, maxReserveBps: 210, flatFee: 185, maxTerm: 72, avgApprovalHours: 3.0, approvalRate: 68, ytdVolume: 3000000, status: "Active", avgFundingDays: 4.5, reserveByTier: { "Super Prime": 210, "Prime": 190, "Near Prime": 0, "Sub Prime": 0, "Deep Sub": 0 } },
  { name: "Regional Credit Union", tiers: ["Super Prime", "Prime", "Near Prime", "Sub Prime"], buyRate: 4.2, sellRateCap: 6.9, maxReserveBps: 200, flatFee: 75, maxTerm: 84, avgApprovalHours: 4.0, approvalRate: 60, ytdVolume: 1800000, status: "Active", avgFundingDays: 5.2, reserveByTier: { "Super Prime": 200, "Prime": 180, "Near Prime": 150, "Sub Prime": 120, "Deep Sub": 0 } },
];

// ── KPI Calculations ────────────────────────────────────────────────
const avgBuyRate = +(LENDERS.reduce((s, l) => s + l.buyRate, 0) / LENDERS.length).toFixed(2);
const avgSellRate = +(LENDERS.reduce((s, l) => s + l.sellRateCap, 0) / LENDERS.length).toFixed(2);
const avgReserveSpread = +(avgSellRate - avgBuyRate).toFixed(2);
const avgApprovalRate = Math.round(LENDERS.reduce((s, l) => s + l.approvalRate, 0) / LENDERS.length);
const avgFundingTime = +(LENDERS.reduce((s, l) => s + l.avgFundingDays, 0) / LENDERS.length).toFixed(1);

export default function LenderMatrix() {
  const [dateRange, setDateRange] = useState<DateRange>("90");
  const [tierFilter, setTierFilter] = useState<CreditTier | "All">("All");
  const [finderScore, setFinderScore] = useState(720);
  const [finderAmount, setFinderAmount] = useState(30000);
  const [finderTerm, setFinderTerm] = useState(72);

  // Rate spread chart data
  const rateSpreadData = useMemo(() => {
    const filtered = tierFilter === "All" ? LENDERS : LENDERS.filter(l => l.tiers.includes(tierFilter));
    return filtered.map(l => ({
      name: l.name.length > 12 ? l.name.slice(0, 12) + "…" : l.name,
      "Buy Rate": l.buyRate,
      "Sell Rate Cap": l.sellRateCap,
    }));
  }, [tierFilter]);

  // Funding speed data
  const fundingData = useMemo(() =>
    [...LENDERS].sort((a, b) => a.avgFundingDays - b.avgFundingDays).map(l => ({
      name: l.name.length > 14 ? l.name.slice(0, 14) + "…" : l.name,
      days: l.avgFundingDays,
    }))
  , []);

  // Best lender finder results
  const finderResults = useMemo(() => {
    const tier = classifyCreditTier(finderScore);
    return LENDERS
      .filter(l => l.tiers.includes(tier))
      .map(l => {
        const reserveSpread = l.sellRateCap - l.buyRate;
        const totalReserve = Math.round((reserveSpread / 100) * finderAmount * (finderTerm / 12));
        return { ...l, totalReserve, tier };
      })
      .sort((a, b) => b.totalReserve - a.totalReserve);
  }, [finderScore, finderAmount, finderTerm]);

  const statusColor = (s: string) =>
    s === "Preferred" ? "bg-green-500/10 text-green-500 border-green-500/20" :
    s === "Active" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
    "bg-red-500/10 text-red-500 border-red-500/20";

  const inputClass = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <AppLayout title="Lender Matrix Dashboard" subtitle="Compare lender rates, reserves, and funding performance">
      <div className="p-4 lg:p-6 space-y-6">
        {/* KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Avg Buy Rate", value: `${avgBuyRate}%`, icon: Percent, color: "text-blue-500" },
            { label: "Avg Sell Rate", value: `${avgSellRate}%`, icon: TrendingUp, color: "text-green-500" },
            { label: "Avg Reserve Spread", value: `${avgReserveSpread}%`, icon: DollarSign, color: "text-purple-500" },
            { label: "Approval Rate", value: `${avgApprovalRate}%`, icon: CheckCircle, color: "text-emerald-500" },
            { label: "Avg Funding Time", value: `${avgFundingTime}d`, icon: Clock, color: "text-orange-500" },
          ].map((kpi) => (
            <Card key={kpi.label} className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{kpi.value}</p>
            </Card>
          ))}
        </div>

        {/* Date Range + Tier Filter */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1">
            {([["30", "Last 30"], ["90", "Last 90"], ["ytd", "YTD"]] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setDateRange(val)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${dateRange === val ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as CreditTier | "All")}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
            >
              <option value="All">All Credit Tiers</option>
              {CREDIT_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Lender Comparison Table */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Lender Comparison Matrix</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Lender</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Credit Tiers</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Buy Rate</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Sell Cap</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Max Reserve</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Flat Fee</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Max Term</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Approval Hrs</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Approval %</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">YTD Volume</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {LENDERS.filter(l => tierFilter === "All" || l.tiers.includes(tierFilter)).map((l) => (
                  <tr key={l.name} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">{l.name}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {l.tiers.map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: TIER_COLORS[t] + "20", color: TIER_COLORS[t] }}>{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="text-right px-3 py-2.5 text-foreground">{l.buyRate}%</td>
                    <td className="text-right px-3 py-2.5 text-foreground">{l.sellRateCap}%</td>
                    <td className="text-right px-3 py-2.5 text-foreground">{l.maxReserveBps} bps</td>
                    <td className="text-right px-3 py-2.5 text-foreground">${l.flatFee}</td>
                    <td className="text-right px-3 py-2.5 text-foreground">{l.maxTerm}mo</td>
                    <td className="text-right px-3 py-2.5 text-foreground">{l.avgApprovalHours}h</td>
                    <td className="text-right px-3 py-2.5 text-foreground">{l.approvalRate}%</td>
                    <td className="text-right px-3 py-2.5 text-foreground">${(l.ytdVolume / 1000000).toFixed(1)}M</td>
                    <td className="text-center px-3 py-2.5">
                      <Badge variant="outline" className={statusColor(l.status)}>{l.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rate Spread Chart */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Buy Rate vs Sell Rate by Lender</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rateSpreadData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, "auto"]} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Buy Rate" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Sell Rate Cap" fill="#22c55e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Funding Speed Chart */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Avg Days to Funding</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fundingData} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                <Bar dataKey="days" fill="#f97316" radius={[0, 4, 4, 0]}>
                  {fundingData.map((_, i) => (
                    <Cell key={i} fill={i < 3 ? "#22c55e" : i < 6 ? "#eab308" : "#f97316"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Best Lender Finder */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Best Lender Finder</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Credit Score</label>
              <input type="number" value={finderScore} onChange={(e) => setFinderScore(+e.target.value)} className={inputClass} min={300} max={850} />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">Tier: {classifyCreditTier(finderScore)}</span>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Deal Amount ($)</label>
              <input type="number" value={finderAmount} onChange={(e) => setFinderAmount(+e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Term (months)</label>
              <input type="number" value={finderTerm} onChange={(e) => setFinderTerm(+e.target.value)} className={inputClass} />
            </div>
            <div className="flex items-end">
              <Badge className="bg-primary/10 text-primary border-primary/20">{finderResults.length} lenders available</Badge>
            </div>
          </div>
          {finderResults.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Rank</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Lender</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Buy Rate</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Sell Cap</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Total Reserve Est.</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Approval %</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {finderResults.map((l, i) => (
                    <tr key={l.name} className={`border-t border-border ${i === 0 ? "bg-green-500/5" : "hover:bg-muted/30"} transition-colors`}>
                      <td className="px-3 py-2.5 font-bold text-foreground">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</td>
                      <td className="px-3 py-2.5 font-medium text-foreground">{l.name}</td>
                      <td className="text-right px-3 py-2.5 text-foreground">{l.buyRate}%</td>
                      <td className="text-right px-3 py-2.5 text-foreground">{l.sellRateCap}%</td>
                      <td className="text-right px-3 py-2.5 font-bold text-green-500">${l.totalReserve.toLocaleString()}</td>
                      <td className="text-right px-3 py-2.5 text-foreground">{l.approvalRate}%</td>
                      <td className="text-center px-3 py-2.5"><Badge variant="outline" className={statusColor(l.status)}>{l.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Reserve Opportunity Heatmap */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Reserve Opportunity Heatmap (Max Reserve bps)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Credit Tier</th>
                  {LENDERS.map(l => (
                    <th key={l.name} className="text-center px-2 py-2 font-medium text-muted-foreground whitespace-nowrap">{l.name.length > 10 ? l.name.slice(0, 10) + "…" : l.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CREDIT_TIERS.map(tier => (
                  <tr key={tier} className="border-t border-border">
                    <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">{tier}</td>
                    {LENDERS.map(l => {
                      const bps = l.reserveByTier[tier];
                      const intensity = bps > 0 ? Math.min(bps / 600, 1) : 0;
                      const bg = bps > 0
                        ? `rgba(34, 197, 94, ${0.1 + intensity * 0.5})`
                        : "rgba(239, 68, 68, 0.1)";
                      return (
                        <td key={l.name} className="text-center px-2 py-2.5 font-medium" style={{ backgroundColor: bg, color: bps > 0 ? "#22c55e" : "#ef4444" }}>
                          {bps > 0 ? bps : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: "rgba(34, 197, 94, 0.15)" }} /> Low</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: "rgba(34, 197, 94, 0.35)" }} /> Medium</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: "rgba(34, 197, 94, 0.6)" }} /> High</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }} /> N/A</span>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
