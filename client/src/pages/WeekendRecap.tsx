import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Trophy,
  Target,
  Printer,
  Copy,
  Star,
  AlertTriangle,
  Lightbulb,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ── Report Period ───────────────────────────────────────────────────
type Period = "this-week" | "last-week" | "custom";

// ── Demo Data ───────────────────────────────────────────────────────
interface ManagerData {
  name: string;
  deals: number;
  revenue: number;
  avgPVR: number;
  penetration: number;
  complianceScore: number;
  coachingScore: number;
}

interface DealHighlight {
  customerName: string;
  vehicle: string;
  pvr: number;
  products: string[];
  manager: string;
}

const THIS_WEEK_MANAGERS: ManagerData[] = [
  { name: "Adrian Anania", deals: 28, revenue: 72800, avgPVR: 2600, penetration: 68, complianceScore: 97, coachingScore: 95 },
  { name: "Mike Torres", deals: 22, revenue: 44000, avgPVR: 2000, penetration: 55, complianceScore: 92, coachingScore: 88 },
  { name: "Lisa Park", deals: 19, revenue: 38000, avgPVR: 2000, penetration: 52, complianceScore: 95, coachingScore: 90 },
  { name: "Jake Wilson", deals: 15, revenue: 24000, avgPVR: 1600, penetration: 42, complianceScore: 88, coachingScore: 78 },
  { name: "Sarah Kim", deals: 20, revenue: 38000, avgPVR: 1900, penetration: 50, complianceScore: 93, coachingScore: 85 },
  { name: "Chris Davis", deals: 12, revenue: 16800, avgPVR: 1400, penetration: 38, complianceScore: 85, coachingScore: 72 },
];

const LAST_WEEK_MANAGERS: ManagerData[] = [
  { name: "Adrian Anania", deals: 25, revenue: 62500, avgPVR: 2500, penetration: 65, complianceScore: 96, coachingScore: 94 },
  { name: "Mike Torres", deals: 20, revenue: 36000, avgPVR: 1800, penetration: 50, complianceScore: 90, coachingScore: 85 },
  { name: "Lisa Park", deals: 18, revenue: 34200, avgPVR: 1900, penetration: 48, complianceScore: 94, coachingScore: 88 },
  { name: "Jake Wilson", deals: 14, revenue: 19600, avgPVR: 1400, penetration: 40, complianceScore: 86, coachingScore: 75 },
  { name: "Sarah Kim", deals: 18, revenue: 32400, avgPVR: 1800, penetration: 47, complianceScore: 91, coachingScore: 82 },
  { name: "Chris Davis", deals: 10, revenue: 13000, avgPVR: 1300, penetration: 35, complianceScore: 83, coachingScore: 70 },
];

const THIS_WEEK_DAILY_PVR = [
  { day: "Mon", pvr: 1850 },
  { day: "Tue", pvr: 2100 },
  { day: "Wed", pvr: 1950 },
  { day: "Thu", pvr: 2400 },
  { day: "Fri", pvr: 2200 },
  { day: "Sat", pvr: 2350 },
];

const LAST_WEEK_DAILY_PVR = [
  { day: "Mon", pvr: 1700 },
  { day: "Tue", pvr: 1800 },
  { day: "Wed", pvr: 1900 },
  { day: "Thu", pvr: 2000 },
  { day: "Fri", pvr: 1850 },
  { day: "Sat", pvr: 2100 },
];

const PRODUCTS_THIS_WEEK = [
  { product: "Extended Warranty", thisWeek: 82, lastWeek: 75 },
  { product: "GAP Insurance", thisWeek: 68, lastWeek: 62 },
  { product: "Paint Protection", thisWeek: 45, lastWeek: 48 },
  { product: "Tire & Wheel", thisWeek: 38, lastWeek: 35 },
  { product: "Key Replacement", thisWeek: 30, lastWeek: 28 },
  { product: "Dent Protection", thisWeek: 22, lastWeek: 25 },
];

const TOP_DEALS: DealHighlight[] = [
  { customerName: "David Kim", vehicle: "2026 BMW X3 M40i", pvr: 4123, products: ["Extended Warranty", "GAP", "Paint Protection", "Key Replacement"], manager: "Adrian Anania" },
  { customerName: "Kevin Patel", vehicle: "2026 Lexus RX 350h", pvr: 3700, products: ["Extended Warranty", "GAP", "Paint", "Key", "Tire & Wheel"], manager: "Adrian Anania" },
  { customerName: "Sarah Chen", vehicle: "2025 Honda CR-V Hybrid", pvr: 3403, products: ["Extended Warranty", "GAP", "Tire & Wheel", "Key Replacement"], manager: "Mike Torres" },
];

const BOTTOM_DEALS: DealHighlight[] = [
  { customerName: "Chris Martinez", vehicle: "2025 Nissan Sentra S", pvr: 650, products: [], manager: "Chris Davis" },
  { customerName: "Brandon Smith", vehicle: "2026 RAM 1500 Big Horn", pvr: 800, products: ["Extended Warranty"], manager: "Mike Torres" },
  { customerName: "Jennifer Taylor", vehicle: "2025 Kia Sportage SX", pvr: 900, products: ["Extended Warranty"], manager: "Jake Wilson" },
];

const COACHING_FOCUS = [
  { area: "GAP Penetration", message: "GAP penetration rose 6pts to 58% — strong week. Keep reinforcing gap value with near-prime buyers.", type: "positive" as const },
  { area: "Paint Protection", message: "Paint protection dropped 3pts — review objection handling for 'I'll wax it myself' responses.", type: "negative" as const },
  { area: "Thursday Energy", message: "Thursday PVR spiked to $2,400 avg — identify what drove this and replicate daily.", type: "positive" as const },
  { area: "Low Performers", message: "Chris Davis averaging $1,400 PVR — schedule focused 1-on-1 coaching on menu presentation.", type: "negative" as const },
];

export default function WeekendRecap() {
  const [period, setPeriod] = useState<Period>("this-week");

  const managers = period === "last-week" ? LAST_WEEK_MANAGERS : THIS_WEEK_MANAGERS;
  const dailyPvr = period === "last-week" ? LAST_WEEK_DAILY_PVR : THIS_WEEK_DAILY_PVR;

  // Sort managers by PVR for ranking
  const rankedManagers = useMemo(() =>
    [...managers].sort((a, b) => b.avgPVR - a.avgPVR).map((m, i) => ({ ...m, rank: i + 1 }))
  , [managers]);

  // Executive summary calculations
  const totalDeals = managers.reduce((s, m) => s + m.deals, 0);
  const totalRevenue = managers.reduce((s, m) => s + m.revenue, 0);
  const avgPVR = Math.round(totalRevenue / totalDeals);
  const avgPenetration = Math.round(managers.reduce((s, m) => s + m.penetration, 0) / managers.length);
  const topManager = rankedManagers[0];
  const biggestWin = TOP_DEALS[0];

  // Prior week comparison
  const priorTotalDeals = LAST_WEEK_MANAGERS.reduce((s, m) => s + m.deals, 0);
  const priorTotalRevenue = LAST_WEEK_MANAGERS.reduce((s, m) => s + m.revenue, 0);
  const priorAvgPVR = Math.round(priorTotalRevenue / priorTotalDeals);
  const pvrDelta = avgPVR - priorAvgPVR;

  const medalEmoji = (rank: number) => rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

  const handleShareWithGM = () => {
    const lines = [
      "F&I Weekend Recap — Week of April 6, 2026",
      "============================================",
      "",
      `Total Deals: ${totalDeals} | Revenue: $${totalRevenue.toLocaleString()} | Avg PVR: $${avgPVR.toLocaleString()} (${pvrDelta >= 0 ? "+" : ""}$${pvrDelta})`,
      `Product Penetration: ${avgPenetration}% | Top Manager: ${topManager.name}`,
      "",
      "Manager Rankings:",
      ...rankedManagers.map(m => `  ${medalEmoji(m.rank)} ${m.name} — ${m.deals} deals, $${m.avgPVR.toLocaleString()} PVR, ${m.penetration}% pen`),
      "",
      "Top Win: " + biggestWin.customerName + " — $" + biggestWin.pvr.toLocaleString() + " PVR (" + biggestWin.products.join(", ") + ")",
      "",
      "Powered by ASURA F&I Co-Pilot",
    ];
    navigator.clipboard.writeText(lines.join("\n"));
  };

  return (
    <AppLayout title="Weekend Recap Report" subtitle="Weekly F&I performance summary for Monday morning review">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Period Selector + Actions */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex gap-1">
            {([["this-week", "This Week"], ["last-week", "Last Week"]] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setPeriod(val)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${period === val ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShareWithGM} className="gap-1.5">
              <Copy className="w-4 h-4" /> Share with GM
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Total Deals", value: totalDeals.toString(), icon: Target, color: "text-blue-500" },
            { label: "F&I Revenue", value: `$${(totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, color: "text-green-500" },
            { label: "Avg PVR", value: `$${avgPVR.toLocaleString()}`, icon: TrendingUp, color: "text-purple-500" },
            { label: "PVR vs Prior", value: `${pvrDelta >= 0 ? "+" : ""}$${pvrDelta}`, icon: pvrDelta >= 0 ? ArrowUp : ArrowDown, color: pvrDelta >= 0 ? "text-green-500" : "text-red-500" },
            { label: "Penetration", value: `${avgPenetration}%`, icon: Target, color: "text-orange-500" },
            { label: "Top Manager", value: topManager.name.split(" ")[0], icon: Trophy, color: "text-yellow-500" },
            { label: "Biggest Win", value: `$${biggestWin.pvr.toLocaleString()}`, icon: Star, color: "text-emerald-500" },
          ].map(kpi => (
            <Card key={kpi.label} className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                <span className="text-[10px] text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-lg font-bold text-foreground">{kpi.value}</p>
            </Card>
          ))}
        </div>

        {/* Manager Scoreboard */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Manager Scoreboard
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground w-12">Rank</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Manager</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Deals</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">F&I Revenue</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Avg PVR</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Penetration</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Compliance</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Coaching</th>
                </tr>
              </thead>
              <tbody>
                {rankedManagers.map(m => (
                  <tr key={m.name} className={`border-t border-border ${m.rank <= 3 ? "bg-primary/5" : ""} hover:bg-muted/30 transition-colors`}>
                    <td className="text-center px-3 py-2.5 text-lg">{medalEmoji(m.rank)}</td>
                    <td className="px-3 py-2.5 font-medium text-foreground">{m.name}</td>
                    <td className="text-right px-3 py-2.5 text-foreground">{m.deals}</td>
                    <td className="text-right px-3 py-2.5 text-foreground">${m.revenue.toLocaleString()}</td>
                    <td className="text-right px-3 py-2.5 font-bold text-foreground">${m.avgPVR.toLocaleString()}</td>
                    <td className="text-right px-3 py-2.5 text-foreground">{m.penetration}%</td>
                    <td className="text-right px-3 py-2.5">
                      <span className={m.complianceScore >= 95 ? "text-green-500" : m.complianceScore >= 90 ? "text-blue-500" : "text-yellow-500"}>{m.complianceScore}%</span>
                    </td>
                    <td className="text-right px-3 py-2.5">
                      <span className={m.coachingScore >= 90 ? "text-green-500" : m.coachingScore >= 80 ? "text-blue-500" : "text-yellow-500"}>{m.coachingScore}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Performance */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Product Units: This Week vs Last Week</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={PRODUCTS_THIS_WEEK} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="product" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="thisWeek" name="This Week" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="lastWeek" name="Last Week" fill="#94a3b8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Day-by-Day PVR Trend */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Daily PVR Average (Mon–Sat)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyPvr}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[1500, 2600]} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Line type="monotone" dataKey="pvr" name="Avg PVR" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 5, fill: "#8b5cf6" }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Wins & Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Wins */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-yellow-500" /> Top 3 Wins by PVR
            </h3>
            <div className="space-y-3">
              {TOP_DEALS.map((d, i) => (
                <div key={i} className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground">{d.customerName}</span>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">${d.pvr.toLocaleString()} PVR</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{d.vehicle} — {d.manager}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {d.products.map(p => <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">{p}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Opportunities */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Opportunities (Low PVR Deals)
            </h3>
            <div className="space-y-3">
              {BOTTOM_DEALS.map((d, i) => (
                <div key={i} className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground">{d.customerName}</span>
                    <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">${d.pvr.toLocaleString()} PVR</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{d.vehicle} — {d.manager}</p>
                  <p className="text-[10px] text-orange-400 mt-1">
                    {d.products.length === 0 ? "No products sold — full menu presentation missed" : `Only ${d.products.length} product — ${d.products.join(", ")}`}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Coaching Focus Areas */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-yellow-500" /> Coaching Focus Areas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {COACHING_FOCUS.map((c, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${c.type === "positive" ? "bg-green-500/5 border-green-500/10" : "bg-orange-500/5 border-orange-500/10"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {c.type === "positive" ? <TrendingUp className="w-3.5 h-3.5 text-green-500" /> : <TrendingDown className="w-3.5 h-3.5 text-orange-500" />}
                  <span className="text-xs font-bold text-foreground">{c.area}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{c.message}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
