import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Treemap,
} from "recharts";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  BarChart3,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Hard-coded demo data ──────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const WORKING_DAYS_APRIL_2026 = [
  1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,
];

const MANAGERS = [
  { name: "Marcus Rivera", deals: 38, pvr: 1820, penetration: 72, compliance: 94, mtdRevenue: 69160, goal: 75000 },
  { name: "Sarah Chen", deals: 42, pvr: 1950, penetration: 78, compliance: 97, mtdRevenue: 81900, goal: 80000 },
  { name: "Derek Thompson", deals: 30, pvr: 1540, penetration: 61, compliance: 88, mtdRevenue: 46200, goal: 60000 },
  { name: "Lisa Kowalski", deals: 35, pvr: 1780, penetration: 69, compliance: 92, mtdRevenue: 62300, goal: 65000 },
  { name: "James Okafor", deals: 28, pvr: 1650, penetration: 64, compliance: 90, mtdRevenue: 46200, goal: 55000 },
  { name: "Priya Sharma", deals: 33, pvr: 1890, penetration: 75, compliance: 96, mtdRevenue: 62370, goal: 68000 },
];

const PRODUCTS = [
  { name: "VSC Extended", units: 112, revenue: 134400, margin: 62 },
  { name: "GAP Insurance", units: 98, revenue: 58800, margin: 71 },
  { name: "Paint Protection", units: 76, revenue: 30400, margin: 78 },
  { name: "Tire & Wheel", units: 68, revenue: 27200, margin: 65 },
  { name: "Theft Deterrent", units: 54, revenue: 16200, margin: 82 },
  { name: "Key Replacement", units: 82, revenue: 16400, margin: 74 },
  { name: "Windshield Protection", units: 45, revenue: 9000, margin: 80 },
  { name: "Maintenance Plan", units: 63, revenue: 37800, margin: 55 },
];

function generateDailyData() {
  const base = [
    { day: 1, deals: 10, revenue: 17200, avgPvr: 1720 },
    { day: 2, deals: 12, revenue: 21600, avgPvr: 1800 },
    { day: 3, deals: 9, revenue: 14400, avgPvr: 1600 },
    { day: 6, deals: 11, revenue: 19800, avgPvr: 1800 },
    { day: 7, deals: 14, revenue: 25200, avgPvr: 1800 },
    { day: 8, deals: 8, revenue: 12800, avgPvr: 1600 },
    { day: 9, deals: 13, revenue: 24700, avgPvr: 1900 },
    { day: 10, deals: 10, revenue: 18000, avgPvr: 1800 },
    { day: 13, deals: 12, revenue: 22800, avgPvr: 1900 },
    { day: 14, deals: 9, revenue: 15300, avgPvr: 1700 },
    { day: 15, deals: 15, revenue: 28500, avgPvr: 1900 },
    { day: 16, deals: 11, revenue: 19800, avgPvr: 1800 },
    { day: 17, deals: 10, revenue: 17000, avgPvr: 1700 },
    { day: 20, deals: 13, revenue: 24700, avgPvr: 1900 },
    { day: 21, deals: 12, revenue: 21600, avgPvr: 1800 },
    { day: 22, deals: 14, revenue: 26600, avgPvr: 1900 },
    { day: 23, deals: 0, revenue: 0, avgPvr: 0 },
    { day: 24, deals: 0, revenue: 0, avgPvr: 0 },
    { day: 27, deals: 0, revenue: 0, avgPvr: 0 },
    { day: 28, deals: 0, revenue: 0, avgPvr: 0 },
    { day: 29, deals: 0, revenue: 0, avgPvr: 0 },
    { day: 30, deals: 0, revenue: 0, avgPvr: 0 },
  ];
  return base;
}

const DAILY_DATA = generateDailyData();

const CURRENT_MONTH_TOTALS = {
  totalDeals: 206,
  totalRevenue: 368130,
  avgPvr: 1787,
  productPenetration: 70,
  reserveIncome: 82400,
  productIncome: 285730,
  totalBackGross: 368130,
};

const LAST_MONTH_TOTALS = {
  totalDeals: 218,
  totalRevenue: 378200,
  avgPvr: 1735,
  productPenetration: 67,
  reserveIncome: 78600,
  productIncome: 299600,
  totalBackGross: 378200,
};

const SAME_MONTH_LAST_YEAR = {
  totalDeals: 192,
  totalRevenue: 326400,
  avgPvr: 1700,
  productPenetration: 63,
  reserveIncome: 72800,
  productIncome: 253600,
  totalBackGross: 326400,
};

const MONTHLY_GOALS = {
  pvrTarget: 1850,
  penetrationTarget: 75,
  revenueTarget: 420000,
};

// ── Helpers ───────────────────────────────────────────────────────────

function fmt(n: number, prefix = "$") {
  if (n >= 1000) return `${prefix}${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `${prefix}${n.toLocaleString()}`;
}

function fmtFull(n: number) {
  return `$${n.toLocaleString()}`;
}

function DeltaArrow({ current, previous, suffix = "" }: { current: number; previous: number; suffix?: string }) {
  const delta = current - previous;
  const pct = previous > 0 ? Math.round((delta / previous) * 100) : 0;
  const isUp = delta > 0;
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", isUp ? "text-emerald-400" : "text-red-400")}>
      <Icon className="w-3.5 h-3.5" />
      {isUp ? "+" : ""}{pct}%{suffix}
    </span>
  );
}

// ── Treemap custom content ────────────────────────────────────────────

function TreemapContent(props: any) {
  const { x, y, width, height, name, units, margin } = props;
  if (width < 50 || height < 40) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={4}
        fill={`hsl(${margin * 1.2}, 70%, 45%)`}
        stroke="hsl(var(--background))" strokeWidth={2} />
      <text x={x + width / 2} y={y + height / 2 - 8} textAnchor="middle"
        fill="#fff" fontSize={width < 80 ? 10 : 12} fontWeight={600}>
        {name}
      </text>
      <text x={x + width / 2} y={y + height / 2 + 8} textAnchor="middle"
        fill="rgba(255,255,255,0.8)" fontSize={10}>
        {units} units
      </text>
    </g>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export default function MonthlyDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(3); // April = index 3
  const [selectedYear, setSelectedYear] = useState(2026);

  const dailyData = useMemo(() => DAILY_DATA, []);
  const totals = CURRENT_MONTH_TOTALS;
  const lastMonth = LAST_MONTH_TOTALS;
  const sameMonthLY = SAME_MONTH_LAST_YEAR;
  const goals = MONTHLY_GOALS;

  // Cumulative pacing chart data
  const pacingData = useMemo(() => {
    const goalTotal = goals.revenueTarget;
    const workingDays = WORKING_DAYS_APRIL_2026.length;
    let cumulative = 0;
    return dailyData.map((d, i) => {
      cumulative += d.revenue;
      const paceGoal = Math.round((goalTotal / workingDays) * (i + 1));
      return {
        day: `Apr ${d.day}`,
        dailyRevenue: d.revenue,
        cumulative,
        paceToGoal: paceGoal,
      };
    });
  }, [dailyData, goals.revenueTarget]);

  // Treemap data
  const treemapData = useMemo(() => {
    return PRODUCTS.map((p) => ({
      name: p.name,
      size: p.revenue,
      units: p.units,
      margin: p.margin,
    }));
  }, []);

  // Calendar data map
  const calendarMap = useMemo(() => {
    const map: Record<number, { deals: number; avgPvr: number }> = {};
    dailyData.forEach((d) => {
      map[d.day] = { deals: d.deals, avgPvr: d.avgPvr };
    });
    return map;
  }, [dailyData]);

  // Goal progress
  const pvrProgress = Math.min(100, Math.round((totals.avgPvr / goals.pvrTarget) * 100));
  const penProgress = Math.min(100, Math.round((totals.productPenetration / goals.penetrationTarget) * 100));
  const revProgress = Math.min(100, Math.round((totals.totalRevenue / goals.revenueTarget) * 100));

  // Month summary narrative
  const narrative = useMemo(() => {
    const lines: string[] = [];
    const revDelta = totals.totalRevenue - sameMonthLY.totalRevenue;
    const pvrDelta = totals.avgPvr - sameMonthLY.avgPvr;
    lines.push(
      `Through 16 working days, the store has closed ${totals.totalDeals} deals generating ${fmtFull(totals.totalRevenue)} in F&I revenue, tracking ${revProgress}% toward the monthly goal of ${fmtFull(goals.revenueTarget)}.`
    );
    lines.push(
      `Average PVR of ${fmtFull(totals.avgPvr)} is ${pvrDelta > 0 ? "up" : "down"} ${fmtFull(Math.abs(pvrDelta))} vs April 2025, with product penetration at ${totals.productPenetration}% (${totals.productPenetration > sameMonthLY.productPenetration ? "+" : ""}${totals.productPenetration - sameMonthLY.productPenetration}pp YoY).`
    );
    lines.push(
      `Sarah Chen leads the team with a $1,950 PVR and 97% compliance score. Six working days remain to close the ${fmtFull(goals.revenueTarget - totals.totalRevenue)} gap to target.`
    );
    return lines;
  }, [totals, sameMonthLY, goals, revProgress]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // April 2026 calendar grid
  const calendarWeeks = useMemo(() => {
    // April 2026 starts on Wednesday (index 3)
    const startDow = 3;
    const daysInMonth = 30;
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = Array(startDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(d);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  }, []);

  const comparisonMetrics = [
    { label: "Total Deals", key: "totalDeals" as const, prefix: "", suffix: "" },
    { label: "Total Revenue", key: "totalRevenue" as const, prefix: "$", suffix: "" },
    { label: "Avg PVR", key: "avgPvr" as const, prefix: "$", suffix: "" },
    { label: "Product Penetration", key: "productPenetration" as const, prefix: "", suffix: "%" },
    { label: "Reserve Income", key: "reserveIncome" as const, prefix: "$", suffix: "" },
    { label: "Product Income", key: "productIncome" as const, prefix: "$", suffix: "" },
  ];

  return (
    <AppLayout title="Monthly Dashboard" subtitle={`${MONTHS[selectedMonth]} ${selectedYear} Performance Overview`}>
      {/* Month selector */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handlePrevMonth} className="p-1.5 rounded-md hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg border border-border">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{MONTHS[selectedMonth]} {selectedYear}</span>
        </div>
        <button onClick={handleNextMonth} className="p-1.5 rounded-md hover:bg-muted transition-colors">
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Header KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Deals", value: totals.totalDeals.toString(), icon: Users, color: "text-blue-400", delta: { c: totals.totalDeals, p: sameMonthLY.totalDeals } },
          { label: "Total F&I Revenue", value: fmtFull(totals.totalRevenue), icon: DollarSign, color: "text-emerald-400", delta: { c: totals.totalRevenue, p: sameMonthLY.totalRevenue } },
          { label: "Avg PVR", value: fmtFull(totals.avgPvr), icon: TrendingUp, color: "text-purple-400", delta: { c: totals.avgPvr, p: sameMonthLY.avgPvr } },
          { label: "Product Penetration", value: `${totals.productPenetration}%`, icon: Target, color: "text-amber-400", delta: { c: totals.productPenetration, p: sameMonthLY.productPenetration } },
          { label: "Reserve Income", value: fmtFull(totals.reserveIncome), icon: DollarSign, color: "text-cyan-400", delta: { c: totals.reserveIncome, p: sameMonthLY.reserveIncome } },
          { label: "Product Income", value: fmtFull(totals.productIncome), icon: BarChart3, color: "text-indigo-400", delta: { c: totals.productIncome, p: sameMonthLY.productIncome } },
          { label: "Total Back Gross", value: fmtFull(totals.totalBackGross), icon: DollarSign, color: "text-green-400", delta: { c: totals.totalBackGross, p: sameMonthLY.totalBackGross } },
          { label: "PVR vs Last Year", value: `+$${totals.avgPvr - sameMonthLY.avgPvr}`, icon: TrendingUp, color: "text-emerald-400", delta: { c: totals.avgPvr, p: sameMonthLY.avgPvr } },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
                <kpi.icon className={cn("w-4 h-4", kpi.color)} />
              </div>
              <div className="text-xl font-bold">{kpi.value}</div>
              <DeltaArrow current={kpi.delta.c} previous={kpi.delta.p} suffix=" YoY" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Pacing Chart */}
      <Card className="border-border mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Daily Pacing — Cumulative F&I Revenue vs Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={pacingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => fmt(v)} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number, name: string) => [fmtFull(value), name === "cumulative" ? "Cumulative Revenue" : name === "paceToGoal" ? "Pace to Goal" : "Daily Revenue"]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="dailyRevenue" name="Daily Revenue" fill="#6366f1" opacity={0.6} radius={[3, 3, 0, 0]} />
                <Line type="monotone" dataKey="cumulative" name="Cumulative Revenue" stroke="#10b981" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="paceToGoal" name="Pace to Goal" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Month-at-a-Glance Calendar */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              Month at a Glance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                <div key={d} className="text-[10px] text-muted-foreground font-medium py-1">{d}</div>
              ))}
            </div>
            {calendarWeeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
                {week.map((day, di) => {
                  if (day === null) return <div key={di} />;
                  const info = calendarMap[day];
                  const isWeekend = di === 0 || di === 6;
                  const hasData = info && info.deals > 0;
                  let bg = "bg-muted/30";
                  if (hasData) {
                    if (info.avgPvr >= 1800) bg = "bg-emerald-500/20 border-emerald-500/30";
                    else if (info.avgPvr >= 1650) bg = "bg-yellow-500/20 border-yellow-500/30";
                    else bg = "bg-red-500/20 border-red-500/30";
                  }
                  return (
                    <div key={di} className={cn("rounded-md border border-border p-1 text-center min-h-[48px] flex flex-col justify-center", bg, isWeekend && !hasData && "opacity-40")}>
                      <div className="text-[10px] text-muted-foreground">{day}</div>
                      {hasData && (
                        <>
                          <div className="text-xs font-bold">{info.deals}d</div>
                          <div className="text-[9px] text-muted-foreground">${info.avgPvr}</div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground justify-center">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/30" /> PVR &ge; $1,800</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500/30" /> $1,650 - $1,799</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/30" /> Below $1,650</span>
            </div>
          </CardContent>
        </Card>

        {/* Product Mix Treemap */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              Product Mix — Size = Revenue, Color = Margin %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  aspectRatio={4 / 3}
                  content={<TreemapContent />}
                />
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manager Performance Table */}
      <Card className="border-border mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Manager Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 px-3 text-xs text-muted-foreground font-medium">Manager</th>
                  <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">Deals</th>
                  <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">PVR</th>
                  <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">Penetration</th>
                  <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">Compliance</th>
                  <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">MTD Revenue</th>
                  <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">vs Goal</th>
                </tr>
              </thead>
              <tbody>
                {MANAGERS.map((m) => {
                  const goalPct = Math.round((m.mtdRevenue / m.goal) * 100);
                  const onTrack = goalPct >= 75;
                  return (
                    <tr key={m.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium">{m.name}</td>
                      <td className="py-2.5 px-3 text-right">{m.deals}</td>
                      <td className="py-2.5 px-3 text-right font-medium">${m.pvr.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">{m.penetration}%</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={cn("inline-flex items-center gap-1", m.compliance >= 95 ? "text-emerald-400" : m.compliance >= 90 ? "text-yellow-400" : "text-red-400")}>
                          <ShieldCheck className="w-3 h-3" />{m.compliance}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">{fmtFull(m.mtdRevenue)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", onTrack ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
                          {goalPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Month Summary Narrative */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              Month Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {narrative.map((line, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Goal Progress Bars */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-green-400" />
              Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {[
                { label: "Avg PVR", current: totals.avgPvr, target: goals.pvrTarget, pct: pvrProgress, fmt: (n: number) => `$${n.toLocaleString()}` },
                { label: "Product Penetration", current: totals.productPenetration, target: goals.penetrationTarget, pct: penProgress, fmt: (n: number) => `${n}%` },
                { label: "Total Revenue", current: totals.totalRevenue, target: goals.revenueTarget, pct: revProgress, fmt: (n: number) => fmtFull(n) },
              ].map((g) => (
                <div key={g.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium">{g.label}</span>
                    <span className="text-xs text-muted-foreground">{g.fmt(g.current)} / {g.fmt(g.target)}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500",
                        g.pct >= 90 ? "bg-emerald-500" : g.pct >= 70 ? "bg-amber-500" : "bg-red-500"
                      )}
                      style={{ width: `${g.pct}%` }}
                    />
                  </div>
                  <div className="text-right mt-1">
                    <span className={cn("text-xs font-bold", g.pct >= 90 ? "text-emerald-400" : g.pct >= 70 ? "text-amber-400" : "text-red-400")}>
                      {g.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Panel */}
      <Card className="border-border mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Month-over-Month Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 px-3 text-xs text-muted-foreground font-medium">Metric</th>
                  <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">Apr 2026 (MTD)</th>
                  <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">Mar 2026</th>
                  <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">Apr 2025</th>
                </tr>
              </thead>
              <tbody>
                {comparisonMetrics.map((m) => {
                  const curr = totals[m.key];
                  const last = lastMonth[m.key];
                  const ly = sameMonthLY[m.key];
                  const fmtVal = (v: number) => m.prefix === "$" ? fmtFull(v) : `${v}${m.suffix}`;
                  return (
                    <tr key={m.key} className="border-b border-border/50">
                      <td className="py-2.5 px-3 text-muted-foreground">{m.label}</td>
                      <td className="py-2.5 px-3 text-right font-semibold">{fmtVal(curr)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="mr-2">{fmtVal(last)}</span>
                        <DeltaArrow current={curr} previous={last} />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="mr-2">{fmtVal(ly)}</span>
                        <DeltaArrow current={curr} previous={ly} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
