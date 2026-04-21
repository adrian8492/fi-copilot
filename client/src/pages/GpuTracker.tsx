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
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Award,
  Users,
  Download,
  Calendar,
} from "lucide-react";
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────
interface MonthlyGpu {
  month: string;
  manager: string;
  fiGpu: number;
  frontGpu: number;
  vsc: number;
  gap: number;
  paint: number;
  tireWheel: number;
  ancillary: number;
  dealCount: number;
}

// ── Constants ─────────────────────────────────────────────────────
const MANAGERS = [
  "Sarah Mitchell",
  "James Rodriguez",
  "Ashley Chen",
  "Marcus Thompson",
  "Rachel Kim",
  "David Patel",
  "Lauren Williams",
  "Chris Martinez",
];

const MONTHS = [
  "May 2025",
  "Jun 2025",
  "Jul 2025",
  "Aug 2025",
  "Sep 2025",
  "Oct 2025",
  "Nov 2025",
  "Dec 2025",
  "Jan 2026",
  "Feb 2026",
  "Mar 2026",
  "Apr 2026",
];

const GPU_TARGET = 1800;

const BENCHMARKS = {
  nationalAvg: 1286,
  top25: 1750,
  top10: 2150,
};

// ── Seeded random for reproducible demo data ──────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Generate Demo Data ────────────────────────────────────────────
function generateDemoData(): MonthlyGpu[] {
  const rand = seededRandom(42);
  const data: MonthlyGpu[] = [];

  // Per-manager baseline skill levels for realistic variance
  const managerSkill: Record<string, { fiBias: number; frontBias: number }> = {
    "Sarah Mitchell": { fiBias: 1.15, frontBias: 1.05 },
    "James Rodriguez": { fiBias: 0.95, frontBias: 1.10 },
    "Ashley Chen": { fiBias: 1.20, frontBias: 0.95 },
    "Marcus Thompson": { fiBias: 0.90, frontBias: 1.15 },
    "Rachel Kim": { fiBias: 1.10, frontBias: 1.00 },
    "David Patel": { fiBias: 0.85, frontBias: 0.90 },
    "Lauren Williams": { fiBias: 1.05, frontBias: 1.08 },
    "Chris Martinez": { fiBias: 1.00, frontBias: 0.98 },
  };

  // Seasonal multiplier (summer/year-end stronger)
  const seasonalMultiplier = [
    1.02, 1.05, 1.08, 1.03, 0.95, 0.92, 0.90, 1.00, 1.04, 1.06, 1.10, 1.12,
  ];

  for (let mi = 0; mi < MONTHS.length; mi++) {
    const month = MONTHS[mi];
    const seasonal = seasonalMultiplier[mi];

    for (const manager of MANAGERS) {
      const skill = managerSkill[manager];
      const baseFi = 1550 * skill.fiBias * seasonal;
      const baseFront = 1100 * skill.frontBias * seasonal;

      const fiGpu = Math.round(baseFi + (rand() - 0.5) * 500);
      const frontGpu = Math.round(baseFront + (rand() - 0.5) * 400);

      // Product line breakdown that sums close to fiGpu
      const vscPct = 0.38 + (rand() - 0.5) * 0.08;
      const gapPct = 0.22 + (rand() - 0.5) * 0.06;
      const paintPct = 0.15 + (rand() - 0.5) * 0.04;
      const twPct = 0.14 + (rand() - 0.5) * 0.04;
      const ancPct = 1 - vscPct - gapPct - paintPct - twPct;

      data.push({
        month,
        manager,
        fiGpu: Math.max(800, Math.min(2400, fiGpu)),
        frontGpu: Math.max(500, Math.min(1800, frontGpu)),
        vsc: Math.round(fiGpu * vscPct),
        gap: Math.round(fiGpu * gapPct),
        paint: Math.round(fiGpu * paintPct),
        tireWheel: Math.round(fiGpu * twPct),
        ancillary: Math.round(fiGpu * Math.max(0.05, ancPct)),
        dealCount: Math.round(14 + rand() * 12),
      });
    }
  }
  return data;
}

const ALL_DATA = generateDemoData();

// ── Helpers ───────────────────────────────────────────────────────
function fmt(n: number): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function TrendArrow({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const delta = ((current - previous) / previous) * 100;
  const up = delta >= 0;
  return (
    <span className={`inline-flex items-center text-xs font-medium ml-2 ${up ? "text-emerald-500" : "text-red-500"}`}>
      {up ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────
export default function GpuTracker() {
  const [dateRange, setDateRange] = useState<string>("ytd");
  const [managerFilter, setManagerFilter] = useState<string>("all");

  useEffect(() => {
    document.title = "GPU Tracker | F&I Co-Pilot by ASURA Group";
  }, []);

  // Filter data by date range and manager
  const filteredData = useMemo(() => {
    let months: string[];
    switch (dateRange) {
      case "30":
        months = MONTHS.slice(-1);
        break;
      case "90":
        months = MONTHS.slice(-3);
        break;
      case "180":
        months = MONTHS.slice(-6);
        break;
      default:
        months = MONTHS; // YTD = full 12 months
    }

    let data = ALL_DATA.filter((d) => months.includes(d.month));
    if (managerFilter !== "all") {
      data = data.filter((d) => d.manager === managerFilter);
    }
    return data;
  }, [dateRange, managerFilter]);

  // Previous period data for trend comparison
  const previousPeriodData = useMemo(() => {
    let count: number;
    switch (dateRange) {
      case "30":
        count = 1;
        break;
      case "90":
        count = 3;
        break;
      case "180":
        count = 6;
        break;
      default:
        count = 12;
    }
    const endIdx = MONTHS.length - count;
    const startIdx = Math.max(0, endIdx - count);
    const months = MONTHS.slice(startIdx, endIdx);
    let data = ALL_DATA.filter((d) => months.includes(d.month));
    if (managerFilter !== "all") {
      data = data.filter((d) => d.manager === managerFilter);
    }
    return data;
  }, [dateRange, managerFilter]);

  // ── KPI Calculations ──────────────────────────────────────────
  const kpis = useMemo(() => {
    if (filteredData.length === 0) {
      return { totalGpu: 0, fiGpu: 0, frontGpu: 0, combinedGross: 0, bestMonth: "N/A", bestManager: "N/A" };
    }

    const totalDeals = filteredData.reduce((s, d) => s + d.dealCount, 0);
    const totalFiGross = filteredData.reduce((s, d) => s + d.fiGpu * d.dealCount, 0);
    const totalFrontGross = filteredData.reduce((s, d) => s + d.frontGpu * d.dealCount, 0);

    const fiGpu = Math.round(totalFiGross / totalDeals);
    const frontGpu = Math.round(totalFrontGross / totalDeals);
    const totalGpu = fiGpu + frontGpu;
    const combinedGross = totalFiGross + totalFrontGross;

    // Best month by F&I GPU
    const monthMap = new Map<string, { gross: number; deals: number }>();
    filteredData.forEach((d) => {
      const cur = monthMap.get(d.month) || { gross: 0, deals: 0 };
      cur.gross += d.fiGpu * d.dealCount;
      cur.deals += d.dealCount;
      monthMap.set(d.month, cur);
    });
    let bestMonth = "";
    let bestMonthGpu = 0;
    monthMap.forEach((v, k) => {
      const gpu = v.gross / v.deals;
      if (gpu > bestMonthGpu) {
        bestMonthGpu = gpu;
        bestMonth = k;
      }
    });

    // Best manager by F&I GPU
    const mgrMap = new Map<string, { gross: number; deals: number }>();
    filteredData.forEach((d) => {
      const cur = mgrMap.get(d.manager) || { gross: 0, deals: 0 };
      cur.gross += d.fiGpu * d.dealCount;
      cur.deals += d.dealCount;
      mgrMap.set(d.manager, cur);
    });
    let bestManager = "";
    let bestMgrGpu = 0;
    mgrMap.forEach((v, k) => {
      const gpu = v.gross / v.deals;
      if (gpu > bestMgrGpu) {
        bestMgrGpu = gpu;
        bestManager = k;
      }
    });

    return { totalGpu, fiGpu, frontGpu, combinedGross, bestMonth, bestManager };
  }, [filteredData]);

  // Previous period KPIs for trend arrows
  const prevKpis = useMemo(() => {
    if (previousPeriodData.length === 0) {
      return { totalGpu: 0, fiGpu: 0, frontGpu: 0, combinedGross: 0 };
    }
    const totalDeals = previousPeriodData.reduce((s, d) => s + d.dealCount, 0);
    const totalFiGross = previousPeriodData.reduce((s, d) => s + d.fiGpu * d.dealCount, 0);
    const totalFrontGross = previousPeriodData.reduce((s, d) => s + d.frontGpu * d.dealCount, 0);
    const fiGpu = Math.round(totalFiGross / totalDeals);
    const frontGpu = Math.round(totalFrontGross / totalDeals);
    return { totalGpu: fiGpu + frontGpu, fiGpu, frontGpu, combinedGross: totalFiGross + totalFrontGross };
  }, [previousPeriodData]);

  // ── Monthly GPU Trend (ComposedChart) ─────────────────────────
  const monthlyTrend = useMemo(() => {
    const map = new Map<string, { fiGross: number; frontGross: number; deals: number }>();
    filteredData.forEach((d) => {
      const cur = map.get(d.month) || { fiGross: 0, frontGross: 0, deals: 0 };
      cur.fiGross += d.fiGpu * d.dealCount;
      cur.frontGross += d.frontGpu * d.dealCount;
      cur.deals += d.dealCount;
      map.set(d.month, cur);
    });

    const months = MONTHS.filter((m) => map.has(m));
    return months.map((m) => {
      const v = map.get(m)!;
      return {
        month: m.replace(" 20", " '"),
        fiGpu: Math.round(v.fiGross / v.deals),
        frontGpu: Math.round(v.frontGross / v.deals),
        target: GPU_TARGET,
      };
    });
  }, [filteredData]);

  // ── Manager Comparison (last 30 days = last month in data) ────
  const managerComparison = useMemo(() => {
    const lastMonth = MONTHS[MONTHS.length - 1];
    const monthData = ALL_DATA.filter((d) => d.month === lastMonth);
    return monthData
      .map((d) => ({
        manager: d.manager.split(" ")[0],
        fullName: d.manager,
        fiGpu: d.fiGpu,
      }))
      .sort((a, b) => b.fiGpu - a.fiGpu);
  }, []);

  // ── GPU by Product Line (stacked, monthly) ────────────────────
  const productLineData = useMemo(() => {
    const map = new Map<string, { vsc: number; gap: number; paint: number; tireWheel: number; ancillary: number; deals: number }>();
    filteredData.forEach((d) => {
      const cur = map.get(d.month) || { vsc: 0, gap: 0, paint: 0, tireWheel: 0, ancillary: 0, deals: 0 };
      cur.vsc += d.vsc * d.dealCount;
      cur.gap += d.gap * d.dealCount;
      cur.paint += d.paint * d.dealCount;
      cur.tireWheel += d.tireWheel * d.dealCount;
      cur.ancillary += d.ancillary * d.dealCount;
      cur.deals += d.dealCount;
      map.set(d.month, cur);
    });

    const months = MONTHS.filter((m) => map.has(m));
    return months.map((m) => {
      const v = map.get(m)!;
      return {
        month: m.replace(" 20", " '"),
        VSC: Math.round(v.vsc / v.deals),
        GAP: Math.round(v.gap / v.deals),
        Paint: Math.round(v.paint / v.deals),
        "Tire & Wheel": Math.round(v.tireWheel / v.deals),
        Ancillary: Math.round(v.ancillary / v.deals),
      };
    });
  }, [filteredData]);

  // ── GPU Distribution Histogram ────────────────────────────────
  const gpuDistribution = useMemo(() => {
    const buckets = [
      { label: "$0-500", min: 0, max: 500, count: 0 },
      { label: "$500-1K", min: 500, max: 1000, count: 0 },
      { label: "$1K-1.5K", min: 1000, max: 1500, count: 0 },
      { label: "$1.5K-2K", min: 1500, max: 2000, count: 0 },
      { label: "$2K-2.5K", min: 2000, max: 2500, count: 0 },
      { label: "$2.5K+", min: 2500, max: Infinity, count: 0 },
    ];
    filteredData.forEach((d) => {
      const bucket = buckets.find((b) => d.fiGpu >= b.min && d.fiGpu < b.max);
      if (bucket) bucket.count += d.dealCount;
    });
    return buckets.map((b) => ({ bucket: b.label, deals: b.count }));
  }, [filteredData]);

  // ── Radial Gauge (current month) ──────────────────────────────
  const gaugeData = useMemo(() => {
    const lastMonth = MONTHS[MONTHS.length - 1];
    let relevantData = ALL_DATA.filter((d) => d.month === lastMonth);
    if (managerFilter !== "all") {
      relevantData = relevantData.filter((d) => d.manager === managerFilter);
    }
    if (relevantData.length === 0) return [{ name: "Actual", value: 0, gpu: 0, fill: "#3b82f6" }];
    const totalDeals = relevantData.reduce((s, d) => s + d.dealCount, 0);
    const totalFi = relevantData.reduce((s, d) => s + d.fiGpu * d.dealCount, 0);
    const actual = Math.round(totalFi / totalDeals);
    const pct = Math.min(100, Math.round((actual / GPU_TARGET) * 100));
    return [{ name: "Actual", value: pct, gpu: actual, fill: actual >= GPU_TARGET ? "#10b981" : "#3b82f6" }];
  }, [managerFilter]);

  // ── Export CSV ────────────────────────────────────────────────
  const handleExport = () => {
    const headers = "Month,Manager,F&I GPU,Front GPU,VSC,GAP,Paint,Tire & Wheel,Ancillary,Deal Count";
    const rows = filteredData.map(
      (d) => `${d.month},${d.manager},${d.fiGpu},${d.frontGpu},${d.vsc},${d.gap},${d.paint},${d.tireWheel},${d.ancillary},${d.dealCount}`
    );
    const csv = [headers, ...rows].join("\n");
    navigator.clipboard.writeText(csv);
  };

  // ── KPI Card Data ─────────────────────────────────────────────
  const kpiCards = [
    { title: "Total GPU (F&I + Front)", value: fmt(kpis.totalGpu), icon: DollarSign, current: kpis.totalGpu, previous: prevKpis.totalGpu },
    { title: "F&I GPU", value: fmt(kpis.fiGpu), icon: BarChart3, current: kpis.fiGpu, previous: prevKpis.fiGpu },
    { title: "Front-End GPU", value: fmt(kpis.frontGpu), icon: TrendingUp, current: kpis.frontGpu, previous: prevKpis.frontGpu },
    { title: "Combined Gross", value: fmt(kpis.combinedGross), icon: Target, current: kpis.combinedGross, previous: prevKpis.combinedGross },
    { title: "Best Month", value: kpis.bestMonth, icon: Calendar, current: 0, previous: 0, hideTrend: true },
    { title: "Best Manager", value: kpis.bestManager, icon: Award, current: 0, previous: 0, hideTrend: true },
  ];

  return (
    <AppLayout title="Gross Per Unit Tracker" subtitle="Track and visualize GPU trends across time, managers, and product lines">
      <div className="p-4 lg:p-6 space-y-6">
        {/* ── Filters ──────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="180">Last 180 Days</SelectItem>
              <SelectItem value="ytd">YTD</SelectItem>
            </SelectContent>
          </Select>

          <Select value={managerFilter} onValueChange={setManagerFilter}>
            <SelectTrigger className="w-[180px]">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Managers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Managers</SelectItem>
              {MANAGERS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* ── KPI Grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {kpiCards.map((kpi) => (
            <Card key={kpi.title} className="bg-card border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{kpi.title}</span>
                  <kpi.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline">
                  <span className="text-xl font-bold text-foreground">{kpi.value}</span>
                  {!kpi.hideTrend && <TrendArrow current={kpi.current} previous={kpi.previous} />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Charts Grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly GPU Trend */}
          <Card className="bg-card border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Monthly F&I GPU Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => fmt(value)}
                  />
                  <Legend />
                  <Bar dataKey="fiGpu" name="F&I GPU" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="frontGpu" name="Front GPU" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Line dataKey="target" name="Target" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Manager Comparison */}
          <Card className="bg-card border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Manager Ranking — F&I GPU (Current Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={managerComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis dataKey="manager" type="category" width={70} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(value: number) => fmt(value)}
                  />
                  <Bar dataKey="fiGpu" name="F&I GPU" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* GPU by Product Line */}
          <Card className="bg-card border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">GPU by Product Line</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productLineData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(value: number) => fmt(value)}
                  />
                  <Legend />
                  <Bar dataKey="VSC" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="GAP" stackId="a" fill="#10b981" />
                  <Bar dataKey="Paint" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="Tire & Wheel" stackId="a" fill="#8b5cf6" />
                  <Bar dataKey="Ancillary" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* GPU Distribution Histogram */}
          <Card className="bg-card border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">GPU Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gpuDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  />
                  <Bar dataKey="deals" name="Deal Count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Target vs Actual Gauge */}
          <Card className="bg-card border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Target vs Actual — Current Month</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  startAngle={180}
                  endAngle={0}
                  data={gaugeData}
                  barSize={20}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    background={{ fill: "hsl(var(--muted))" }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="-mt-24 text-center">
                <p className="text-3xl font-bold text-foreground">{fmt(gaugeData[0].gpu ?? 0)}</p>
                <p className="text-sm text-muted-foreground">of {fmt(GPU_TARGET)} target</p>
                <Badge variant={gaugeData[0].value >= 100 ? "default" : "secondary"} className="mt-1">
                  {gaugeData[0].value}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* GPU Benchmarks Panel */}
          <Card className="bg-card border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">GPU Benchmarks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { label: "National Average", value: BENCHMARKS.nationalAvg, color: "text-muted-foreground" },
                  { label: "Top 25%", value: BENCHMARKS.top25, color: "text-blue-500" },
                  { label: "Top 10%", value: BENCHMARKS.top10, color: "text-emerald-500" },
                ].map((b) => {
                  const yourGpu = kpis.fiGpu;
                  const pct = yourGpu > 0 ? Math.round(((yourGpu - b.value) / b.value) * 100) : 0;
                  const above = pct >= 0;
                  return (
                    <div key={b.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className={`text-sm font-medium ${b.color}`}>{b.label}</p>
                        <p className="text-lg font-bold text-foreground">{fmt(b.value)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Your F&I GPU</p>
                        <p className={`text-sm font-semibold ${above ? "text-emerald-500" : "text-red-500"}`}>
                          {above ? "+" : ""}{pct}% {above ? "above" : "below"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-3 rounded-lg border border-dashed">
                <p className="text-xs text-muted-foreground mb-1">Your Current F&I GPU</p>
                <p className="text-2xl font-bold text-foreground">{fmt(kpis.fiGpu)}</p>
                <Badge
                  variant="outline"
                  className={`mt-1 ${
                    kpis.fiGpu >= BENCHMARKS.top10
                      ? "border-emerald-500 text-emerald-500"
                      : kpis.fiGpu >= BENCHMARKS.top25
                      ? "border-blue-500 text-blue-500"
                      : kpis.fiGpu >= BENCHMARKS.nationalAvg
                      ? "border-yellow-500 text-yellow-500"
                      : "border-red-500 text-red-500"
                  }`}
                >
                  {kpis.fiGpu >= BENCHMARKS.top10
                    ? "Top 10%"
                    : kpis.fiGpu >= BENCHMARKS.top25
                    ? "Top 25%"
                    : kpis.fiGpu >= BENCHMARKS.nationalAvg
                    ? "Above Average"
                    : "Below Average"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
