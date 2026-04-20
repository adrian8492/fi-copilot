import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Gift,
  TrendingUp,
  AlertTriangle,
  Star,
  Calculator,
  Filter,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────
type IncentiveSource = "OEM" | "Lender" | "Dealer";
type IncentiveType = "Spiff" | "Volume Bonus" | "Penetration Bonus" | "Rate Subvention";
type IncentiveTarget = "Per Deal" | "Monthly" | "Quarterly";
type IncentiveStatus = "Active" | "Earned" | "Expired" | "Pending";

interface Incentive {
  id: number;
  program: string;
  source: IncentiveSource;
  type: IncentiveType;
  target: IncentiveTarget;
  requirement: string;
  payout: number;
  earned: number;
  expiration: string;
  status: IncentiveStatus;
}

// ── Demo Incentives ────────────────────────────────────────────────
const INCENTIVES: Incentive[] = [
  { id: 1, program: "Ally VSC Spiff Q2", source: "Lender", type: "Spiff", target: "Per Deal", requirement: "Sell Ally VSC on funded deal", payout: 75, earned: 1500, expiration: "2026-06-30", status: "Active" },
  { id: 2, program: "Chase GAP Volume Bonus", source: "Lender", type: "Volume Bonus", target: "Monthly", requirement: "20+ GAP contracts/month", payout: 2000, earned: 6000, expiration: "2026-05-15", status: "Active" },
  { id: 3, program: "Capital One Penetration Bonus", source: "Lender", type: "Penetration Bonus", target: "Quarterly", requirement: "55%+ F&I penetration on Cap One deals", payout: 5000, earned: 5000, expiration: "2026-06-30", status: "Earned" },
  { id: 4, program: "GM Financial Rate Subvention", source: "OEM", type: "Rate Subvention", target: "Per Deal", requirement: "Use GM Financial subvented rate", payout: 150, earned: 3600, expiration: "2026-04-30", status: "Active" },
  { id: 5, program: "Ford Protect VSC Push", source: "OEM", type: "Spiff", target: "Per Deal", requirement: "Sell Ford Protect ESP on new Ford", payout: 100, earned: 2400, expiration: "2026-05-01", status: "Active" },
  { id: 6, program: "Toyota Financial Services Bonus", source: "OEM", type: "Volume Bonus", target: "Monthly", requirement: "30+ TFS contracts/month", payout: 3000, earned: 9000, expiration: "2026-12-31", status: "Active" },
  { id: 7, program: "Ally Ancillary Bundle Bonus", source: "Lender", type: "Penetration Bonus", target: "Quarterly", requirement: "3+ products per deal avg on Ally deals", payout: 4000, earned: 0, expiration: "2026-06-30", status: "Pending" },
  { id: 8, program: "Dealer Tire & Wheel Spiff", source: "Dealer", type: "Spiff", target: "Per Deal", requirement: "Sell T&W protection on any deal", payout: 50, earned: 1800, expiration: "2026-12-31", status: "Active" },
  { id: 9, program: "Chase Preferred Lender Bonus", source: "Lender", type: "Volume Bonus", target: "Quarterly", requirement: "50%+ finance share through Chase", payout: 7500, earned: 7500, expiration: "2026-03-31", status: "Earned" },
  { id: 10, program: "Capital One Express Spiff", source: "Lender", type: "Spiff", target: "Per Deal", requirement: "Submit within 2 hrs of approval", payout: 25, earned: 625, expiration: "2026-04-25", status: "Active" },
  { id: 11, program: "Dealer PPM Push Q2", source: "Dealer", type: "Penetration Bonus", target: "Monthly", requirement: "40%+ prepaid maintenance penetration", payout: 1500, earned: 0, expiration: "2026-06-30", status: "Pending" },
  { id: 12, program: "GM Financial Volume Tier", source: "OEM", type: "Volume Bonus", target: "Quarterly", requirement: "75+ GM Financial contracts/quarter", payout: 6000, earned: 0, expiration: "2026-06-30", status: "Active" },
  { id: 13, program: "Ally Winter Rate Program", source: "Lender", type: "Rate Subvention", target: "Per Deal", requirement: "Use Ally subvented rate on used", payout: 100, earned: 2200, expiration: "2026-03-15", status: "Expired" },
  { id: 14, program: "Dealer Key Replacement Spiff", source: "Dealer", type: "Spiff", target: "Per Deal", requirement: "Sell key replacement on any deal", payout: 35, earned: 910, expiration: "2026-12-31", status: "Active" },
  { id: 15, program: "Ford Motor Credit Conquest", source: "OEM", type: "Volume Bonus", target: "Monthly", requirement: "10+ conquest finance deals/month", payout: 2500, earned: 2500, expiration: "2026-05-10", status: "Active" },
];

// ── Monthly Earnings Data (12 months) ──────────────────────────────
const MONTHLY_EARNINGS = [
  { month: "May", earned: 3200 },
  { month: "Jun", earned: 4100 },
  { month: "Jul", earned: 3800 },
  { month: "Aug", earned: 5200 },
  { month: "Sep", earned: 4700 },
  { month: "Oct", earned: 5500 },
  { month: "Nov", earned: 6100 },
  { month: "Dec", earned: 7200 },
  { month: "Jan", earned: 4800 },
  { month: "Feb", earned: 5100 },
  { month: "Mar", earned: 6300 },
  { month: "Apr", earned: 5500 },
];

// ── localStorage Key ───────────────────────────────────────────────
const STARRED_KEY = "fi-copilot-incentive-starred";

function loadStarred(): number[] {
  try {
    const saved = localStorage.getItem(STARRED_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveStarred(ids: number[]) {
  localStorage.setItem(STARRED_KEY, JSON.stringify(ids));
}

// ── Helpers ────────────────────────────────────────────────────────
function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function statusColor(status: IncentiveStatus): string {
  switch (status) {
    case "Active": return "text-green-500 border-green-500/30 bg-green-500/10";
    case "Earned": return "text-blue-500 border-blue-500/30 bg-blue-500/10";
    case "Expired": return "text-red-500 border-red-500/30 bg-red-500/10";
    case "Pending": return "text-amber-500 border-amber-500/30 bg-amber-500/10";
  }
}

export default function IncentiveTracker() {
  useEffect(() => {
    document.title = "Incentive Tracker | F&I Co-Pilot by ASURA Group";
  }, []);

  // Filters
  const [filterSource, setFilterSource] = useState<string>("All");
  const [filterType, setFilterType] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  // Starred programs (localStorage)
  const [starred, setStarred] = useState<number[]>(loadStarred);
  useEffect(() => { saveStarred(starred); }, [starred]);

  const toggleStar = (id: number) => {
    setStarred((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // Calculator state
  const [calcProgram, setCalcProgram] = useState<string>(String(INCENTIVES[0].id));
  const [calcDeals, setCalcDeals] = useState(20);
  const [calcPenetration, setCalcPenetration] = useState(50);

  // Filtered incentives
  const filtered = useMemo(() => {
    return INCENTIVES.filter((inc) => {
      if (filterSource !== "All" && inc.source !== filterSource) return false;
      if (filterType !== "All" && inc.type !== filterType) return false;
      if (filterStatus !== "All" && inc.status !== filterStatus) return false;
      return true;
    });
  }, [filterSource, filterType, filterStatus]);

  // KPIs
  const activeCount = INCENTIVES.filter((i) => i.status === "Active").length;
  const totalPotential = INCENTIVES.filter((i) => i.status !== "Expired").reduce((s, i) => s + i.payout, 0);
  const earnedYTD = INCENTIVES.reduce((s, i) => s + i.earned, 0);
  const expiringThisMonth = INCENTIVES.filter((i) => {
    const days = daysUntil(i.expiration);
    return days >= 0 && days <= 30 && i.status !== "Expired";
  }).length;

  // Earned vs Potential chart data (top 8 by payout)
  const earnedVsPotentialData = useMemo(() => {
    return INCENTIVES
      .filter((i) => i.status !== "Expired")
      .sort((a, b) => b.payout - a.payout)
      .slice(0, 8)
      .map((i) => ({
        name: i.program.length > 20 ? i.program.slice(0, 18) + "..." : i.program,
        Earned: i.earned,
        Potential: i.payout,
      }));
  }, []);

  // Expiring soon (within 30 days)
  const expiringSoon = useMemo(() => {
    return INCENTIVES
      .filter((i) => {
        const days = daysUntil(i.expiration);
        return days >= 0 && days <= 30 && i.status !== "Expired";
      })
      .sort((a, b) => daysUntil(a.expiration) - daysUntil(b.expiration));
  }, []);

  // Calculator projected earnings
  const calcResult = useMemo(() => {
    const program = INCENTIVES.find((i) => String(i.id) === calcProgram);
    if (!program) return 0;
    if (program.target === "Per Deal") {
      return program.payout * calcDeals;
    }
    if (program.type === "Penetration Bonus") {
      return calcPenetration >= parseInt(program.requirement) ? program.payout : program.payout * (calcPenetration / 100);
    }
    return program.payout;
  }, [calcProgram, calcDeals, calcPenetration]);

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <AppLayout
      title="Incentive Tracker"
      subtitle="Track manufacturer, lender, and dealer incentive programs and bonus earnings"
    >
      <div className="p-4 lg:p-6 space-y-6">
        {/* ── Top KPI Bar ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Active Incentives",
              value: String(activeCount),
              icon: Gift,
              color: "text-green-500",
              bg: "bg-green-500/10",
            },
            {
              label: "Total Potential Bonus",
              value: `$${totalPotential.toLocaleString()}`,
              icon: DollarSign,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              label: "Earned YTD",
              value: `$${earnedYTD.toLocaleString()}`,
              icon: TrendingUp,
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
            },
            {
              label: "Expiring This Month",
              value: String(expiringThisMonth),
              icon: Clock,
              color: "text-amber-500",
              bg: "bg-amber-500/10",
            },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}
                  >
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="text-xl font-bold">{kpi.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Filters ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Sources</SelectItem>
              <SelectItem value="OEM">OEM</SelectItem>
              <SelectItem value="Lender">Lender</SelectItem>
              <SelectItem value="Dealer">Dealer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Spiff">Spiff</SelectItem>
              <SelectItem value="Volume Bonus">Volume Bonus</SelectItem>
              <SelectItem value="Penetration Bonus">Penetration Bonus</SelectItem>
              <SelectItem value="Rate Subvention">Rate Subvention</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Earned">Earned</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          {(filterSource !== "All" || filterType !== "All" || filterStatus !== "All") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterSource("All");
                setFilterType("All");
                setFilterStatus("All");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* ── Incentive Table ─────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Incentive Programs ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 pr-2 w-8"></th>
                    <th className="pb-2">Program</th>
                    <th className="pb-2">Source</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Target</th>
                    <th className="pb-2">Requirement</th>
                    <th className="pb-2 text-right">Payout</th>
                    <th className="pb-2 text-right">Earned</th>
                    <th className="pb-2">Expires</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inc) => {
                    const days = daysUntil(inc.expiration);
                    const isStarred = starred.includes(inc.id);
                    return (
                      <tr
                        key={inc.id}
                        className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                      >
                        <td className="py-2 pr-2">
                          <button
                            onClick={() => toggleStar(inc.id)}
                            className="hover:scale-110 transition-transform"
                            title={isStarred ? "Remove from My Programs" : "Add to My Programs"}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                isStarred
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-2 font-medium">{inc.program}</td>
                        <td className="py-2">
                          <Badge variant="outline" className="text-xs">
                            {inc.source}
                          </Badge>
                        </td>
                        <td className="py-2 text-xs text-muted-foreground">
                          {inc.type}
                        </td>
                        <td className="py-2 text-xs text-muted-foreground">
                          {inc.target}
                        </td>
                        <td className="py-2 text-xs text-muted-foreground max-w-[200px] truncate">
                          {inc.requirement}
                        </td>
                        <td className="py-2 text-right font-medium">
                          ${inc.payout.toLocaleString()}
                        </td>
                        <td className="py-2 text-right font-medium text-green-500">
                          ${inc.earned.toLocaleString()}
                        </td>
                        <td className="py-2 text-xs">
                          <span
                            className={
                              days >= 0 && days <= 14
                                ? "text-red-500 font-medium"
                                : days >= 0 && days <= 30
                                  ? "text-amber-500"
                                  : "text-muted-foreground"
                            }
                          >
                            {inc.expiration}
                          </span>
                        </td>
                        <td className="py-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${statusColor(inc.status)}`}
                          >
                            {inc.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ── Charts Row ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earned vs Potential */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Earned vs Potential by Program</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={earnedVsPotentialData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 10 }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => `$${v.toLocaleString()}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Earned" fill="#22c55e" radius={[0, 2, 2, 0]} />
                  <Bar dataKey="Potential" fill="#3b82f6" radius={[0, 2, 2, 0]} opacity={0.5} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Earnings Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Monthly Incentive Earnings Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={MONTHLY_EARNINGS}>
                  <defs>
                    <linearGradient id="gradEarned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`$${v.toLocaleString()}`, "Earned"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="earned"
                    stroke="#22c55e"
                    fill="url(#gradEarned)"
                    strokeWidth={2}
                    name="Earned"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ── Expiring Soon + Calculator ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expiring Soon Alert */}
          <Card className="border-red-500/20">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {expiringSoon.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No programs expiring within 30 days.
                </p>
              ) : (
                expiringSoon.map((inc) => {
                  const days = daysUntil(inc.expiration);
                  return (
                    <div
                      key={inc.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{inc.program}</p>
                        <p className="text-xs text-muted-foreground">
                          {inc.source} &middot; Payout: ${inc.payout.toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`ml-2 shrink-0 ${
                          days <= 7
                            ? "text-red-500 border-red-500/30 bg-red-500/10"
                            : days <= 14
                              ? "text-orange-500 border-orange-500/30 bg-orange-500/10"
                              : "text-amber-500 border-amber-500/30 bg-amber-500/10"
                        }`}
                      >
                        {days} day{days !== 1 ? "s" : ""} left
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Incentive Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                Incentive Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Select Program
                </label>
                <Select value={calcProgram} onValueChange={setCalcProgram}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCENTIVES.filter((i) => i.status !== "Expired").map((i) => (
                      <SelectItem key={i.id} value={String(i.id)}>
                        {i.program}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Deal Count
                  </label>
                  <input
                    type="number"
                    value={calcDeals}
                    onChange={(e) => setCalcDeals(+e.target.value)}
                    className={inputClass}
                    min={0}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Penetration (%)
                  </label>
                  <input
                    type="number"
                    value={calcPenetration}
                    onChange={(e) => setCalcPenetration(+e.target.value)}
                    className={inputClass}
                    min={0}
                    max={100}
                  />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Projected Earnings
                </p>
                <p className="text-3xl font-bold text-primary">
                  ${Math.round(calcResult).toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Based on{" "}
                  {INCENTIVES.find((i) => String(i.id) === calcProgram)?.target ===
                  "Per Deal"
                    ? `${calcDeals} deals`
                    : `${calcPenetration}% penetration`}{" "}
                  at $
                  {INCENTIVES.find(
                    (i) => String(i.id) === calcProgram
                  )?.payout.toLocaleString()}{" "}
                  payout
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── My Programs (starred) ───────────────────────────────── */}
        {starred.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                My Programs ({starred.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {INCENTIVES.filter((i) => starred.includes(i.id)).map((inc) => (
                  <div
                    key={inc.id}
                    className="p-3 rounded-lg bg-accent/50 border border-border/50"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-sm">{inc.program}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ml-2 shrink-0 ${statusColor(inc.status)}`}
                      >
                        {inc.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {inc.source} &middot; {inc.type}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Payout: ${inc.payout.toLocaleString()}
                      </span>
                      <span className="text-green-500 font-medium">
                        Earned: ${inc.earned.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
