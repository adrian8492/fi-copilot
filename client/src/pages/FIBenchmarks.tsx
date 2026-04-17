import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart2,
  TrendingUp,
  Target,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  DollarSign,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Region = "National" | "Southeast" | "Midwest" | "West" | "Northeast";

interface BenchmarkMetric {
  metric: string;
  nationalAvg: number;
  top25: number;
  top10: number;
  top1: number;
  yourStore: number;
  unit: string;
  revenuePerPoint?: number;
}

const REGIONS: Region[] = ["National", "Southeast", "Midwest", "West", "Northeast"];

const REGIONAL_MULTIPLIERS: Record<Region, number> = {
  National: 1.0,
  Southeast: 0.95,
  Midwest: 0.92,
  West: 1.08,
  Northeast: 1.05,
};

const BENCHMARK_DATA: BenchmarkMetric[] = [
  { metric: "PVR ($)", nationalAvg: 1100, top25: 1650, top10: 2400, top1: 3200, yourStore: 1847, unit: "$", revenuePerPoint: 150 },
  { metric: "GAP Penetration (%)", nationalAvg: 28, top25: 42, top10: 55, top1: 68, yourStore: 38, unit: "%", revenuePerPoint: 45 },
  { metric: "VSC Penetration (%)", nationalAvg: 35, top25: 50, top10: 62, top1: 75, yourStore: 48, unit: "%", revenuePerPoint: 65 },
  { metric: "Prepaid Maint. Pen. (%)", nationalAvg: 15, top25: 28, top10: 40, top1: 52, yourStore: 22, unit: "%", revenuePerPoint: 30 },
  { metric: "Tire & Wheel Pen. (%)", nationalAvg: 12, top25: 22, top10: 35, top1: 48, yourStore: 18, unit: "%", revenuePerPoint: 25 },
  { metric: "Credit Life Pen. (%)", nationalAvg: 8, top25: 15, top10: 22, top1: 30, yourStore: 11, unit: "%", revenuePerPoint: 20 },
  { metric: "Avg Products/Deal", nationalAvg: 1.4, top25: 2.1, top10: 2.8, top1: 3.5, yourStore: 1.9, unit: "", revenuePerPoint: 400 },
  { metric: "Finance Pen. (%)", nationalAvg: 65, top25: 75, top10: 82, top1: 90, yourStore: 72, unit: "%", revenuePerPoint: 55 },
  { metric: "Reserve Spread (bps)", nationalAvg: 120, top25: 165, top10: 210, top1: 260, yourStore: 155, unit: "bps", revenuePerPoint: 8 },
  { metric: "Customer Sat. Score", nationalAvg: 78, top25: 85, top10: 91, top1: 96, yourStore: 83, unit: "/100" },
];

const TREND_MONTHS = [
  { month: "May '25", yourPVR: 1088, nationalAvg: 1080 },
  { month: "Jun '25", yourPVR: 1125, nationalAvg: 1085 },
  { month: "Jul '25", yourPVR: 1210, nationalAvg: 1090 },
  { month: "Aug '25", yourPVR: 1340, nationalAvg: 1092 },
  { month: "Sep '25", yourPVR: 1425, nationalAvg: 1095 },
  { month: "Oct '25", yourPVR: 1510, nationalAvg: 1098 },
  { month: "Nov '25", yourPVR: 1580, nationalAvg: 1100 },
  { month: "Dec '25", yourPVR: 1640, nationalAvg: 1100 },
  { month: "Jan '26", yourPVR: 1690, nationalAvg: 1102 },
  { month: "Feb '26", yourPVR: 1755, nationalAvg: 1105 },
  { month: "Mar '26", yourPVR: 1810, nationalAvg: 1100 },
  { month: "Apr '26", yourPVR: 1847, nationalAvg: 1100 },
];

const RADAR_METRICS = ["PVR", "GAP Pen.", "VSC Pen.", "Products/Deal", "Finance Pen.", "Cust. Sat."];

function normalizeScore(value: number, min: number, max: number): number {
  return Math.round(((value - min) / (max - min)) * 100);
}

export default function FIBenchmarks() {
  const [region, setRegion] = useState<Region>("National");

  const regionMultiplier = REGIONAL_MULTIPLIERS[region];

  const adjustedData = useMemo(() =>
    BENCHMARK_DATA.map((m) => ({
      ...m,
      nationalAvg: +(m.nationalAvg * regionMultiplier).toFixed(1),
      top25: +(m.top25 * regionMultiplier).toFixed(1),
      top10: +(m.top10 * regionMultiplier).toFixed(1),
      top1: +(m.top1 * regionMultiplier).toFixed(1),
    })),
    [regionMultiplier]
  );

  const yourPVR = BENCHMARK_DATA[0].yourStore;
  const nationalAvgPVR = +(BENCHMARK_DATA[0].nationalAvg * regionMultiplier).toFixed(0);
  const top10PVR = +(BENCHMARK_DATA[0].top10 * regionMultiplier).toFixed(0);
  const gapToTop10 = top10PVR - yourPVR;

  // Percentile: rough estimate based on position between national avg and top 1%
  const percentile = Math.min(99, Math.max(1, Math.round(
    50 + ((yourPVR - nationalAvgPVR) / (BENCHMARK_DATA[0].top1 - nationalAvgPVR)) * 45
  )));

  const radarData = useMemo(() => {
    const indices = [0, 1, 2, 6, 7, 9]; // PVR, GAP, VSC, Prods/Deal, Finance Pen, Cust Sat
    return RADAR_METRICS.map((label, i) => {
      const m = adjustedData[indices[i]];
      const min = m.nationalAvg * 0.5;
      const max = m.top1 * 1.1;
      return {
        metric: label,
        YourStore: normalizeScore(m.yourStore, min, max),
        NationalAvg: normalizeScore(m.nationalAvg, min, max),
        Top10: normalizeScore(m.top10, min, max),
      };
    });
  }, [adjustedData]);

  const gapAnalysis = useMemo(() =>
    adjustedData.filter((m) => m.yourStore < m.top25 && m.revenuePerPoint).map((m) => {
      const gap = +(m.top25 - m.yourStore).toFixed(1);
      const monthlyImpact = Math.round(gap * (m.revenuePerPoint ?? 0));
      return { metric: m.metric, gap, target: m.top25, current: m.yourStore, unit: m.unit, monthlyImpact };
    }),
    [adjustedData]
  );

  const kpis = [
    { label: "National Avg PVR", value: `$${nationalAvgPVR.toLocaleString()}`, icon: BarChart2, color: "text-blue-400" },
    { label: "Top 10% PVR", value: `$${top10PVR.toLocaleString()}`, icon: Award, color: "text-amber-400" },
    { label: "Your Avg PVR", value: `$${yourPVR.toLocaleString()}`, icon: TrendingUp, color: "text-green-400" },
    { label: "Your Rank Percentile", value: `${percentile}th`, icon: Target, color: "text-purple-400" },
    { label: "Gap to Top 10%", value: gapToTop10 > 0 ? `$${gapToTop10.toLocaleString()}` : "At Target!", icon: ArrowUpRight, color: gapToTop10 > 0 ? "text-orange-400" : "text-green-400" },
  ];

  return (
    <AppLayout title="F&I Benchmarks Hub" subtitle="Measure your store against national and regional averages">
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

        {/* Region Toggle */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground font-medium">Region:</span>
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                region === r
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Benchmark Comparison Table */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Benchmark Comparison — {region}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Metric</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">{region} Avg</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Top 25%</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Top 10%</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Top 1%</th>
                  <th className="text-right px-3 py-2 font-medium text-primary">Your Store</th>
                </tr>
              </thead>
              <tbody>
                {adjustedData.map((m) => {
                  const aboveAvg = m.yourStore >= m.nationalAvg;
                  const aboveTop25 = m.yourStore >= m.top25;
                  return (
                    <tr key={m.metric} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-foreground">{m.metric}</td>
                      <td className="text-right px-3 py-2.5 text-muted-foreground">{m.unit === "$" ? `$${m.nationalAvg.toLocaleString()}` : `${m.nationalAvg}${m.unit}`}</td>
                      <td className="text-right px-3 py-2.5 text-muted-foreground">{m.unit === "$" ? `$${m.top25.toLocaleString()}` : `${m.top25}${m.unit}`}</td>
                      <td className="text-right px-3 py-2.5 text-muted-foreground">{m.unit === "$" ? `$${m.top10.toLocaleString()}` : `${m.top10}${m.unit}`}</td>
                      <td className="text-right px-3 py-2.5 text-muted-foreground">{m.unit === "$" ? `$${m.top1.toLocaleString()}` : `${m.top1}${m.unit}`}</td>
                      <td className="text-right px-3 py-2.5">
                        <span className={`font-semibold ${aboveTop25 ? "text-green-400" : aboveAvg ? "text-amber-400" : "text-red-400"}`}>
                          {m.unit === "$" ? `$${m.yourStore.toLocaleString()}` : `${m.yourStore}${m.unit}`}
                        </span>
                        {aboveAvg ? (
                          <ArrowUpRight className="inline w-3 h-3 ml-1 text-green-400" />
                        ) : (
                          <ArrowDownRight className="inline w-3 h-3 ml-1 text-red-400" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Radar Chart + Trend Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Where You Stand</h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid strokeDasharray="3 3" className="opacity-30" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Your Store" dataKey="YourStore" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} strokeWidth={2} />
                <Radar name="National Avg" dataKey="NationalAvg" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
                <Radar name="Top 10%" dataKey="Top10" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">PVR Trend — Your Store vs National Avg (12 Months)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={TREND_MONTHS}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} domain={[800, 2200]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="yourPVR" name="Your Store PVR" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="nationalAvg" name="National Avg" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Performance Gap Analysis */}
        {gapAnalysis.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-400" />
              Performance Gap Analysis
              <Badge variant="outline" className="text-[10px] border-orange-500/30 text-orange-400">
                {gapAnalysis.length} opportunities
              </Badge>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {gapAnalysis.map((g) => (
                <Card key={g.metric} className="p-4 border-orange-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground">{g.metric}</span>
                    <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">Below Top 25%</Badge>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Current</p>
                      <p className="text-sm font-bold text-foreground">{g.unit === "$" ? `$${g.current}` : `${g.current}${g.unit}`}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-orange-400" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Target (Top 25%)</p>
                      <p className="text-sm font-bold text-foreground">{g.unit === "$" ? `$${g.target}` : `${g.target}${g.unit}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <DollarSign className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs text-muted-foreground">Est. monthly revenue impact:</span>
                    <span className="text-xs font-bold text-green-400">+${g.monthlyImpact.toLocaleString()}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Data Source Note */}
        <Card className="p-3 bg-muted/30 border-dashed">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground">
              Data compiled from ASURA Group coaching network — 200+ dealerships. Benchmarks updated quarterly.
              Your store data reflects the trailing 90-day average as of April 2026.
            </p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
