import { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Building2, TrendingUp, TrendingDown, Minus, Download, DollarSign, MapPin, Users, Award,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useLocation } from "wouter";

// ─── Demo Data ────────────────────────────────────────────────────────────────
const LOCATION_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#8b5cf6", "#14b8a6"];

interface LocationData {
  id: number;
  name: string;
  city: string;
  managerCount: number;
  avgScore: number;
  lastMonthAvgScore: number;
  avgPvr: number;
  penetrationPct: number;
  weeklyScores: number[];
}

const DEMO_LOCATIONS: LocationData[] = [
  { id: 1, name: "Sunrise Honda", city: "Miami, FL", managerCount: 4, avgScore: 86, lastMonthAvgScore: 82, avgPvr: 3200, penetrationPct: 72, weeklyScores: [78, 80, 82, 83, 84, 85, 84, 86, 87, 85, 86, 86] },
  { id: 2, name: "Pacific Toyota", city: "San Diego, CA", managerCount: 3, avgScore: 74, lastMonthAvgScore: 71, avgPvr: 2800, penetrationPct: 65, weeklyScores: [68, 70, 71, 72, 70, 73, 74, 72, 73, 74, 75, 74] },
  { id: 3, name: "Mountain View Ford", city: "Denver, CO", managerCount: 5, avgScore: 91, lastMonthAvgScore: 88, avgPvr: 3600, penetrationPct: 78, weeklyScores: [84, 85, 86, 87, 88, 89, 88, 90, 90, 91, 91, 91] },
  { id: 4, name: "Lakeside Chevrolet", city: "Chicago, IL", managerCount: 3, avgScore: 58, lastMonthAvgScore: 62, avgPvr: 2100, penetrationPct: 48, weeklyScores: [64, 63, 62, 61, 60, 60, 59, 58, 59, 58, 57, 58] },
  { id: 5, name: "Harbor Nissan", city: "Seattle, WA", managerCount: 2, avgScore: 67, lastMonthAvgScore: 65, avgPvr: 2500, penetrationPct: 55, weeklyScores: [60, 62, 63, 64, 64, 65, 66, 65, 66, 67, 67, 67] },
  { id: 6, name: "Desert BMW", city: "Phoenix, AZ", managerCount: 4, avgScore: 82, lastMonthAvgScore: 80, avgPvr: 3400, penetrationPct: 70, weeklyScores: [76, 77, 78, 79, 80, 80, 81, 81, 82, 82, 82, 82] },
];

export function getLocationColor(score: number): "green" | "yellow" | "red" {
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  return "red";
}

export function getTrendDirection(current: number, previous: number): "up" | "down" | "flat" {
  const delta = current - previous;
  if (delta > 1) return "up";
  if (delta < -1) return "down";
  return "flat";
}

export function sortLocations(locations: LocationData[], sortBy: string): LocationData[] {
  const sorted = [...locations];
  switch (sortBy) {
    case "score": return sorted.sort((a, b) => b.avgScore - a.avgScore);
    case "alpha": return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "pvr": return sorted.sort((a, b) => b.avgPvr - a.avgPvr);
    case "improved": return sorted.sort((a, b) => (b.avgScore - b.lastMonthAvgScore) - (a.avgScore - a.lastMonthAvgScore));
    default: return sorted;
  }
}

export function computeRollupKPIs(locations: LocationData[]) {
  if (locations.length === 0) return { totalLocations: 0, combinedPvr: 0, bestLocation: "", lowestLocation: "" };
  const totalManagers = locations.reduce((s, l) => s + l.managerCount, 0);
  const combinedPvr = Math.round(locations.reduce((s, l) => s + l.avgPvr * l.managerCount, 0) / totalManagers);
  const best = [...locations].sort((a, b) => b.avgScore - a.avgScore)[0];
  const lowest = [...locations].sort((a, b) => a.avgScore - b.avgScore)[0];
  return { totalLocations: locations.length, combinedPvr, bestLocation: best.name, lowestLocation: lowest.name };
}

const WEEKS = Array.from({ length: 12 }, (_, i) => `W${i + 1}`);

export default function MultiLocationRollup() {
  useEffect(() => { document.title = "Multi-Location Rollup | F&I Co-Pilot by ASURA Group"; }, []);
  const [, navigate] = useLocation();
  const [sortBy, setSortBy] = useState("score");

  const kpis = useMemo(() => computeRollupKPIs(DEMO_LOCATIONS), []);
  const sortedLocations = useMemo(() => sortLocations(DEMO_LOCATIONS, sortBy), [sortBy]);

  const trendData = useMemo(() => {
    return WEEKS.map((week, wi) => {
      const row: Record<string, string | number> = { week };
      for (const loc of DEMO_LOCATIONS) {
        row[loc.name] = loc.weeklyScores[wi];
      }
      return row;
    });
  }, []);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ locations: DEMO_LOCATIONS, kpis, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "multi-location-rollup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const colorMap: Record<string, string> = {
    green: "border-green-500/30 bg-green-500/5",
    yellow: "border-yellow-500/30 bg-yellow-500/5",
    red: "border-red-500/30 bg-red-500/5",
  };

  const scoreColorMap: Record<string, string> = {
    green: "text-green-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
  };

  return (
    <AppLayout title="Multi-Location Rollup" subtitle="Dealer group performance across all rooftops">
      <div className="p-4 sm:p-6 space-y-6">
        {/* KPI Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Locations", value: kpis.totalLocations, icon: MapPin, color: "text-blue-400" },
            { label: "Combined PVR", value: `$${kpis.combinedPvr.toLocaleString()}`, icon: DollarSign, color: "text-green-400" },
            { label: "Best Performing", value: kpis.bestLocation, icon: Award, color: "text-emerald-400" },
            { label: "Lowest Performing", value: kpis.lowestLocation, icon: TrendingDown, color: "text-red-400" },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon className={cn("w-4 h-4", kpi.color)} />
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                </div>
                <p className="text-lg font-bold text-foreground truncate">{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Sort by:</p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] h-8 text-xs bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="alpha">Alphabetical</SelectItem>
                <SelectItem value="pvr">PVR</SelectItem>
                <SelectItem value="improved">Most Improved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export Rollup
          </Button>
        </div>

        {/* Location Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedLocations.map((loc) => {
            const tier = getLocationColor(loc.avgScore);
            const trend = getTrendDirection(loc.avgScore, loc.lastMonthAvgScore);
            const delta = loc.avgScore - loc.lastMonthAvgScore;

            return (
              <Card
                key={loc.id}
                className={cn("cursor-pointer hover:shadow-md transition-shadow", colorMap[tier])}
                onClick={() => navigate("/settings")}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{loc.name}</h3>
                      <p className="text-xs text-muted-foreground">{loc.city}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {trend === "up" && <TrendingUp className="w-4 h-4 text-green-400" />}
                      {trend === "down" && <TrendingDown className="w-4 h-4 text-red-400" />}
                      {trend === "flat" && <Minus className="w-4 h-4 text-muted-foreground" />}
                      <span className={cn("text-xs font-medium", delta > 0 ? "text-green-400" : delta < 0 ? "text-red-400" : "text-muted-foreground")}>
                        {delta > 0 ? "+" : ""}{delta}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Avg Score</p>
                      <p className={cn("text-xl font-bold", scoreColorMap[tier])}>{loc.avgScore}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Avg PVR</p>
                      <p className="text-xl font-bold text-foreground">${loc.avgPvr.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Managers</p>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <p className="text-sm font-semibold text-foreground">{loc.managerCount}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Penetration</p>
                      <p className="text-sm font-semibold text-foreground">{loc.penetrationPct}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Combined Grade Trend Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Combined Grade Trend — Last 12 Weeks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {DEMO_LOCATIONS.map((loc, i) => (
                    <Line
                      key={loc.id}
                      type="monotone"
                      dataKey={loc.name}
                      stroke={LOCATION_COLORS[i % LOCATION_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
