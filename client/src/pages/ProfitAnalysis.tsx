import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Download,
  AlertTriangle,
  Package,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from "recharts";

// ── Hard-coded demo data ──────────────────────────────────────────
const PRODUCTS = [
  "VSC",
  "GAP",
  "Tire & Wheel",
  "Paint Protection",
  "Maintenance Plan",
  "Theft Deterrent",
  "Windshield",
  "Key Replacement",
];

const PRODUCT_PRICES: Record<string, number> = {
  VSC: 1895,
  GAP: 795,
  "Tire & Wheel": 699,
  "Paint Protection": 599,
  "Maintenance Plan": 495,
  "Theft Deterrent": 399,
  Windshield: 299,
  "Key Replacement": 249,
};

interface ManagerProfit {
  id: number;
  name: string;
  deals: number;
  totalRevenue: number;
  avgPvr: number;
  topProduct: string;
  trend: number[];
  productBreakdown: Record<string, number>;
  acceptanceRates: Record<string, number>;
}

const MANAGERS: ManagerProfit[] = [
  {
    id: 1, name: "Marcus Rivera", deals: 48, totalRevenue: 168200, avgPvr: 3504,
    topProduct: "VSC", trend: [3200, 3350, 3400, 3504, 3550, 3620],
    productBreakdown: { VSC: 62400, GAP: 28800, "Tire & Wheel": 22400, "Paint Protection": 18200, "Maintenance Plan": 14400, "Theft Deterrent": 10800, Windshield: 6400, "Key Replacement": 4800 },
    acceptanceRates: { VSC: 0.72, GAP: 0.68, "Tire & Wheel": 0.55, "Paint Protection": 0.52, "Maintenance Plan": 0.48, "Theft Deterrent": 0.42, Windshield: 0.38, "Key Replacement": 0.35 },
  },
  {
    id: 2, name: "Jessica Chen", deals: 52, totalRevenue: 175800, avgPvr: 3381,
    topProduct: "VSC", trend: [3100, 3200, 3250, 3381, 3420, 3500],
    productBreakdown: { VSC: 65000, GAP: 30200, "Tire & Wheel": 24000, "Paint Protection": 17600, "Maintenance Plan": 15200, "Theft Deterrent": 12000, Windshield: 7200, "Key Replacement": 4600 },
    acceptanceRates: { VSC: 0.74, GAP: 0.70, "Tire & Wheel": 0.58, "Paint Protection": 0.50, "Maintenance Plan": 0.50, "Theft Deterrent": 0.44, Windshield: 0.40, "Key Replacement": 0.32 },
  },
  {
    id: 3, name: "David Park", deals: 38, totalRevenue: 121600, avgPvr: 3200,
    topProduct: "VSC", trend: [2900, 3000, 3100, 3200, 3250, 3280],
    productBreakdown: { VSC: 42000, GAP: 22000, "Tire & Wheel": 18000, "Paint Protection": 14600, "Maintenance Plan": 10800, "Theft Deterrent": 7200, Windshield: 4200, "Key Replacement": 2800 },
    acceptanceRates: { VSC: 0.68, GAP: 0.62, "Tire & Wheel": 0.50, "Paint Protection": 0.46, "Maintenance Plan": 0.42, "Theft Deterrent": 0.35, Windshield: 0.30, "Key Replacement": 0.28 },
  },
  {
    id: 4, name: "Sarah Kim", deals: 44, totalRevenue: 149600, avgPvr: 3400,
    topProduct: "GAP", trend: [3050, 3150, 3300, 3400, 3450, 3500],
    productBreakdown: { VSC: 50000, GAP: 32000, "Tire & Wheel": 20000, "Paint Protection": 16000, "Maintenance Plan": 13200, "Theft Deterrent": 9400, Windshield: 5600, "Key Replacement": 3400 },
    acceptanceRates: { VSC: 0.70, GAP: 0.76, "Tire & Wheel": 0.52, "Paint Protection": 0.48, "Maintenance Plan": 0.46, "Theft Deterrent": 0.40, Windshield: 0.36, "Key Replacement": 0.30 },
  },
  {
    id: 5, name: "Tony Morales", deals: 56, totalRevenue: 184800, avgPvr: 3300,
    topProduct: "VSC", trend: [3000, 3100, 3200, 3300, 3350, 3400],
    productBreakdown: { VSC: 68000, GAP: 33600, "Tire & Wheel": 26000, "Paint Protection": 19200, "Maintenance Plan": 16000, "Theft Deterrent": 11200, Windshield: 7200, "Key Replacement": 3600 },
    acceptanceRates: { VSC: 0.76, GAP: 0.72, "Tire & Wheel": 0.60, "Paint Protection": 0.54, "Maintenance Plan": 0.52, "Theft Deterrent": 0.46, Windshield: 0.42, "Key Replacement": 0.34 },
  },
  {
    id: 6, name: "Linda Tran", deals: 42, totalRevenue: 138600, avgPvr: 3300,
    topProduct: "VSC", trend: [3100, 3150, 3200, 3300, 3320, 3380],
    productBreakdown: { VSC: 48000, GAP: 26000, "Tire & Wheel": 19800, "Paint Protection": 15600, "Maintenance Plan": 12600, "Theft Deterrent": 8600, Windshield: 5000, "Key Replacement": 3000 },
    acceptanceRates: { VSC: 0.71, GAP: 0.66, "Tire & Wheel": 0.54, "Paint Protection": 0.49, "Maintenance Plan": 0.45, "Theft Deterrent": 0.38, Windshield: 0.34, "Key Replacement": 0.29 },
  },
];

const TIME_PERIODS = ["MTD", "QTD", "YTD", "Last 30", "Last 90", "Custom Range"] as const;

const BENCHMARK_ACCEPTANCE = 0.80;

function MiniSparkline({ data, color = "#22c55e" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export default function ProfitAnalysis() {
  const [period, setPeriod] = useState<string>("Last 90");
  const [sortBy, setSortBy] = useState<"revenue" | "pvr" | "deals">("revenue");

  const totalRevenue = useMemo(() => MANAGERS.reduce((s, m) => s + m.totalRevenue, 0), []);
  const totalDeals = useMemo(() => MANAGERS.reduce((s, m) => s + m.deals, 0), []);
  const avgPvr = useMemo(() => Math.round(totalRevenue / totalDeals), [totalRevenue, totalDeals]);

  const avgPenetration = useMemo(() => {
    const allRates = MANAGERS.flatMap((m) => Object.values(m.acceptanceRates));
    return Math.round((allRates.reduce((s, r) => s + r, 0) / allRates.length) * 100);
  }, []);

  // Waterfall data
  const waterfallData = useMemo(() => {
    return PRODUCTS.map((p) => ({
      name: p,
      revenue: MANAGERS.reduce((s, m) => s + (m.productBreakdown[p] || 0), 0),
    }));
  }, []);

  // Manager leaderboard sorted
  const sortedManagers = useMemo(() => {
    return [...MANAGERS].sort((a, b) => {
      if (sortBy === "revenue") return b.totalRevenue - a.totalRevenue;
      if (sortBy === "pvr") return b.avgPvr - a.avgPvr;
      return b.deals - a.deals;
    });
  }, [sortBy]);

  // Scatter data
  const scatterData = useMemo(() => {
    return MANAGERS.map((m) => ({
      name: m.name,
      deals: m.deals,
      profit: m.totalRevenue,
      avgPvr: m.avgPvr,
    }));
  }, []);

  // Missed revenue
  const missedRevenue = useMemo(() => {
    let missed = 0;
    for (const m of MANAGERS) {
      for (const p of PRODUCTS) {
        const rate = m.acceptanceRates[p] || 0;
        const gap = BENCHMARK_ACCEPTANCE - rate;
        if (gap > 0) {
          missed += gap * (PRODUCT_PRICES[p] || 0) * m.deals;
        }
      }
    }
    return Math.round(missed);
  }, []);

  const exportCSV = () => {
    const headers = ["Manager", "Deals", "Total Revenue", "Avg PVR", "Top Product"];
    const rows = MANAGERS.map((m) => [m.name, m.deals, m.totalRevenue, m.avgPvr, m.topProduct].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "profit-analysis.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

  return (
    <AppLayout title="Profit Analysis" subtitle="F&I profit breakdown by product, manager, and time period">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Time Period Selector */}
        <div className="flex flex-wrap gap-2">
          {TIME_PERIODS.map((tp) => (
            <Button
              key={tp}
              variant={period === tp ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(tp)}
            >
              {tp}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={exportCSV} className="ml-auto">
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>

        {/* KPI Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="w-4 h-4" /> Total F&I Revenue ({period})
            </div>
            <p className="text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="w-4 h-4" /> Avg PVR
            </div>
            <p className="text-2xl font-bold text-foreground">${avgPvr.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <BarChart3 className="w-4 h-4" /> Gross Profit / Deal
            </div>
            <p className="text-2xl font-bold text-foreground">${avgPvr.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Package className="w-4 h-4" /> Product Penetration
            </div>
            <p className="text-2xl font-bold text-foreground">{avgPenetration}%</p>
          </Card>
        </div>

        {/* Revenue Waterfall Chart */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Revenue by F&I Product</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {waterfallData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Manager Profit Leaderboard */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Manager Profit Leaderboard</h3>
              <div className="flex gap-1">
                {(["revenue", "pvr", "deals"] as const).map((s) => (
                  <Button key={s} variant={sortBy === s ? "default" : "ghost"} size="sm" className="text-xs h-7" onClick={() => setSortBy(s)}>
                    {s === "revenue" ? "Revenue" : s === "pvr" ? "PVR" : "Deals"}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {sortedManagers.map((m, i) => (
                <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-accent/30">
                  <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.deals} deals · ${m.totalRevenue.toLocaleString()} · PVR ${m.avgPvr}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{m.topProduct}</Badge>
                  <MiniSparkline data={m.trend} />
                </div>
              ))}
            </div>
          </Card>

          {/* Profit vs Volume Scatter */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Profit vs Volume</h3>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="deals" name="Deals" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="profit" name="Profit" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <ZAxis dataKey="avgPvr" range={[200, 600]} name="Avg PVR" />
                <Tooltip formatter={(v: number, name: string) => [name === "Profit" ? `$${v.toLocaleString()}` : name === "Avg PVR" ? `$${v}` : v, name]} />
                <Scatter data={scatterData} fill="#3b82f6">
                  {scatterData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Missed Revenue Card */}
        <Card className="p-4 border-orange-500/20 bg-orange-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Missed Revenue Opportunity</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Based on an 80% benchmark acceptance rate, estimated lost revenue from declined products:
              </p>
              <p className="text-2xl font-bold text-orange-400 mt-2">${missedRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Formula: (benchmark rate - actual rate) x product price x deal count, summed across all managers and products
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
