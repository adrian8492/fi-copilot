import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Target, TrendingUp, AlertCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

// National benchmarks (hard-coded demo values)
const NATIONAL_BENCHMARK = { avgScore: 74, pvr: 2850, penetration: 61, compliance: 78, scriptFidelity: 70 };
const TOP_10_THRESHOLD = { avgScore: 91, pvr: 3900, penetration: 78, compliance: 95, scriptFidelity: 92 };

// Demo managers for selector
const DEMO_MANAGERS = [
  { id: 1, name: "Marcus Rivera", score: 87, pvr: 3200, penetration: 72, compliance: 94, scriptFidelity: 85 },
  { id: 2, name: "Jasmine Nguyen", score: 92, pvr: 3450, penetration: 76, compliance: 97, scriptFidelity: 90 },
  { id: 3, name: "David Park", score: 74, pvr: 2800, penetration: 58, compliance: 82, scriptFidelity: 68 },
  { id: 4, name: "Sarah Mitchell", score: 65, pvr: 2400, penetration: 52, compliance: 75, scriptFidelity: 60 },
  { id: 5, name: "Carlos Mendez", score: 55, pvr: 2100, penetration: 45, compliance: 68, scriptFidelity: 52 },
];

// Dealership average (computed from demo managers)
function getDealershipAvg() {
  const count = DEMO_MANAGERS.length;
  return {
    avgScore: Math.round(DEMO_MANAGERS.reduce((s, m) => s + m.score, 0) / count),
    pvr: Math.round(DEMO_MANAGERS.reduce((s, m) => s + m.pvr, 0) / count),
    penetration: Math.round(DEMO_MANAGERS.reduce((s, m) => s + m.penetration, 0) / count),
    compliance: Math.round(DEMO_MANAGERS.reduce((s, m) => s + m.compliance, 0) / count),
    scriptFidelity: Math.round(DEMO_MANAGERS.reduce((s, m) => s + m.scriptFidelity, 0) / count),
  };
}

type GapStatus = "Above" | "Below" | "On Par";

function getGapStatus(current: number, benchmark: number): GapStatus {
  if (current > benchmark) return "Above";
  if (current < benchmark - benchmark * 0.05) return "Below";
  return "On Par";
}

function generateCoachingActions(gaps: Array<{ metric: string; status: GapStatus; gap: number }>) {
  const belowItems = gaps.filter((g) => g.status === "Below");
  if (belowItems.length === 0) return ["Continue maintaining above-benchmark performance across all metrics."];
  const actions: string[] = [];
  for (const item of belowItems.slice(0, 3)) {
    switch (item.metric) {
      case "Overall Score":
        actions.push(`Focus on overall session quality — target ${Math.abs(item.gap)} point improvement through structured practice sessions.`);
        break;
      case "PVR":
        actions.push(`Increase per-vehicle revenue by $${Math.abs(item.gap)} through better product bundling and value presentation.`);
        break;
      case "Penetration":
        actions.push(`Boost product penetration by ${Math.abs(item.gap)}% — present all products on every deal, even when customer seems resistant.`);
        break;
      case "Compliance":
        actions.push(`Improve compliance score by ${Math.abs(item.gap)}% — review TILA/Reg Z disclosure requirements and practice scripted compliance language.`);
        break;
      case "Script Fidelity":
        actions.push(`Raise script fidelity by ${Math.abs(item.gap)}% — use the ASURA word tracks consistently and record practice sessions for self-review.`);
        break;
    }
  }
  return actions.slice(0, 3);
}

export default function BenchmarkingPanel() {
  const [selectedManager, setSelectedManager] = useState(DEMO_MANAGERS[0]);
  const dealershipAvg = useMemo(getDealershipAvg, []);

  const metrics = [
    { metric: "Overall Score", current: selectedManager.score, dealership: dealershipAvg.avgScore, national: NATIONAL_BENCHMARK.avgScore, top10: TOP_10_THRESHOLD.avgScore, suffix: "" },
    { metric: "PVR", current: selectedManager.pvr, dealership: dealershipAvg.pvr, national: NATIONAL_BENCHMARK.pvr, top10: TOP_10_THRESHOLD.pvr, suffix: "$" },
    { metric: "Penetration", current: selectedManager.penetration, dealership: dealershipAvg.penetration, national: NATIONAL_BENCHMARK.penetration, top10: TOP_10_THRESHOLD.penetration, suffix: "%" },
    { metric: "Compliance", current: selectedManager.compliance, dealership: dealershipAvg.compliance, national: NATIONAL_BENCHMARK.compliance, top10: TOP_10_THRESHOLD.compliance, suffix: "%" },
    { metric: "Script Fidelity", current: selectedManager.scriptFidelity, dealership: dealershipAvg.scriptFidelity, national: NATIONAL_BENCHMARK.scriptFidelity, top10: TOP_10_THRESHOLD.scriptFidelity, suffix: "%" },
  ];

  const chartData = metrics.map((m) => ({
    metric: m.metric,
    Current: m.current,
    "Dealership Avg": m.dealership,
    "National Benchmark": m.national,
  }));

  const gapAnalysis = metrics.map((m) => ({
    metric: m.metric,
    current: m.current,
    benchmark: m.national,
    gap: m.current - m.national,
    status: getGapStatus(m.current, m.national),
    suffix: m.suffix,
  }));

  const coachingActions = generateCoachingActions(gapAnalysis);

  return (
    <div className="space-y-6">
      {/* Manager Selector */}
      <div className="flex items-center gap-3">
        <Target className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Manager:</span>
        <select
          value={selectedManager.id}
          onChange={(e) => setSelectedManager(DEMO_MANAGERS.find((m) => m.id === Number(e.target.value)) ?? DEMO_MANAGERS[0])}
          className="text-xs bg-card border border-border rounded-lg px-3 py-1.5 text-foreground"
        >
          {DEMO_MANAGERS.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Grouped Bar Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Manager vs Dealership vs National Benchmark</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis type="category" dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={100} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="Current" fill="#6366f1" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Dealership Avg" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              <Bar dataKey="National Benchmark" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gap Analysis Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            Gap Analysis vs National Benchmark
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">Metric</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground">Current</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground">Benchmark</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground">Gap</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {gapAnalysis.map((row) => (
                  <tr key={row.metric} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="py-2.5 px-3 font-medium text-foreground">{row.metric}</td>
                    <td className="py-2.5 px-3 text-center text-foreground">
                      {row.suffix === "$" ? `$${row.current.toLocaleString()}` : `${row.current}${row.suffix}`}
                    </td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground">
                      {row.suffix === "$" ? `$${row.benchmark.toLocaleString()}` : `${row.benchmark}${row.suffix}`}
                    </td>
                    <td className={cn("py-2.5 px-3 text-center font-semibold", row.gap >= 0 ? "text-green-400" : "text-red-400")}>
                      {row.gap >= 0 ? "+" : ""}{row.suffix === "$" ? `$${row.gap.toLocaleString()}` : `${row.gap}${row.suffix}`}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        row.status === "Above" ? "border-green-500/30 text-green-400" :
                        row.status === "Below" ? "border-red-500/30 text-red-400" :
                        "border-yellow-500/30 text-yellow-400"
                      )}>
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Areas to Close */}
      <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Areas to Close
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {coachingActions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
