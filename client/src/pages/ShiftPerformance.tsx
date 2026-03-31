import { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Clock, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Sun, Sunset, Moon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const SHIFTS = ["Morning", "Afternoon", "Evening"] as const;
const SHIFT_RANGES: Record<string, string> = { Morning: "8am–12pm", Afternoon: "12pm–5pm", Evening: "5pm–9pm" };
const SHIFT_ICONS: Record<string, typeof Sun> = { Morning: Sun, Afternoon: Sunset, Evening: Moon };

export interface ShiftCell {
  day: string;
  shift: string;
  avgScore: number;
  dealCount: number;
  avgPvr: number;
}

// ─── Demo Data Generation ─────────────────────────────────────────────────────
function generateShiftData(): ShiftCell[] {
  const cells: ShiftCell[] = [];
  const base: Record<string, Record<string, { score: number; count: number; pvr: number }>> = {
    Mon: { Morning: { score: 72, count: 8, pvr: 2600 }, Afternoon: { score: 78, count: 12, pvr: 2900 }, Evening: { score: 65, count: 5, pvr: 2200 } },
    Tue: { Morning: { score: 74, count: 9, pvr: 2700 }, Afternoon: { score: 85, count: 14, pvr: 3200 }, Evening: { score: 70, count: 6, pvr: 2500 } },
    Wed: { Morning: { score: 71, count: 7, pvr: 2500 }, Afternoon: { score: 76, count: 11, pvr: 2800 }, Evening: { score: 68, count: 4, pvr: 2300 } },
    Thu: { Morning: { score: 75, count: 10, pvr: 2800 }, Afternoon: { score: 82, count: 13, pvr: 3100 }, Evening: { score: 72, count: 7, pvr: 2600 } },
    Fri: { Morning: { score: 78, count: 11, pvr: 2900 }, Afternoon: { score: 80, count: 15, pvr: 3000 }, Evening: { score: 74, count: 8, pvr: 2700 } },
    Sat: { Morning: { score: 82, count: 14, pvr: 3100 }, Afternoon: { score: 88, count: 16, pvr: 3400 }, Evening: { score: 76, count: 6, pvr: 2800 } },
  };
  for (const day of DAYS) {
    for (const shift of SHIFTS) {
      const d = base[day][shift];
      cells.push({ day, shift, avgScore: d.score, dealCount: d.count, avgPvr: d.pvr });
    }
  }
  return cells;
}

export function getShiftColor(score: number): string {
  if (score >= 80) return "bg-green-500/70 text-white";
  if (score >= 70) return "bg-yellow-500/60 text-white";
  return "bg-red-500/50 text-white";
}

export function buildHeatmapMatrix(cells: ShiftCell[]): ShiftCell[][] {
  const matrix: ShiftCell[][] = [];
  for (const day of DAYS) {
    const row: ShiftCell[] = [];
    for (const shift of SHIFTS) {
      const cell = cells.find((c) => c.day === day && c.shift === shift);
      row.push(cell ?? { day, shift, avgScore: 0, dealCount: 0, avgPvr: 0 });
    }
    matrix.push(row);
  }
  return matrix;
}

export function findPeakShift(cells: ShiftCell[]): ShiftCell | null {
  if (cells.length === 0) return null;
  return [...cells].sort((a, b) => b.avgScore - a.avgScore)[0];
}

export function findWorstShift(cells: ShiftCell[]): ShiftCell | null {
  if (cells.length === 0) return null;
  return [...cells].sort((a, b) => a.avgScore - b.avgScore)[0];
}

export function findPeakVolumeShift(cells: ShiftCell[]): ShiftCell | null {
  if (cells.length === 0) return null;
  return [...cells].sort((a, b) => b.dealCount - a.dealCount)[0];
}

export function computeHourlyData(cells: ShiftCell[]): Array<{ hour: number; avgScore: number }> {
  const hourBuckets: number[] = new Array(24).fill(0);
  const hourCounts: number[] = new Array(24).fill(0);
  for (const cell of cells) {
    let startHour: number;
    let endHour: number;
    if (cell.shift === "Morning") { startHour = 8; endHour = 12; }
    else if (cell.shift === "Afternoon") { startHour = 12; endHour = 17; }
    else { startHour = 17; endHour = 21; }
    const hours = endHour - startHour;
    const perHour = cell.dealCount / hours;
    for (let h = startHour; h < endHour; h++) {
      hourBuckets[h] += cell.avgScore * perHour;
      hourCounts[h] += perHour;
    }
  }
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    avgScore: hourCounts[h] > 0 ? Math.round(hourBuckets[h] / hourCounts[h]) : 0,
  }));
}

export function generateStaffingInsight(best: ShiftCell | null): string {
  if (!best) return "Not enough data to generate staffing insights.";
  return `Your strongest scores happen ${best.day} ${best.shift.toLowerCase()}s (avg ${best.avgScore}) — consider scheduling your top closer there.`;
}

const DEMO_CELLS = generateShiftData();

export default function ShiftPerformance() {
  useEffect(() => { document.title = "Shift Performance | F&I Co-Pilot by ASURA Group"; }, []);
  const [dateRange, setDateRange] = useState("30");

  const matrix = useMemo(() => buildHeatmapMatrix(DEMO_CELLS), []);
  const peak = useMemo(() => findPeakShift(DEMO_CELLS), []);
  const worst = useMemo(() => findWorstShift(DEMO_CELLS), []);
  const peakVolume = useMemo(() => findPeakVolumeShift(DEMO_CELLS), []);
  const hourlyData = useMemo(() => computeHourlyData(DEMO_CELLS).filter((d) => d.avgScore > 0), []);
  const insight = useMemo(() => generateStaffingInsight(peak), [peak]);

  return (
    <AppLayout title="Shift Performance" subtitle="F&I performance by time of day and day of week">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="60">Last 60 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Best Performing Shift", value: peak ? `${peak.day} ${peak.shift} (${peak.avgScore})` : "—", icon: TrendingUp, color: "text-green-400" },
            { label: "Worst Performing Shift", value: worst ? `${worst.day} ${worst.shift} (${worst.avgScore})` : "—", icon: TrendingDown, color: "text-red-400" },
            { label: "Peak Deal Volume", value: peakVolume ? `${peakVolume.day} ${peakVolume.shift} (${peakVolume.dealCount} deals)` : "—", icon: Clock, color: "text-blue-400" },
          ].map((item) => (
            <Card key={item.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className={cn("w-4 h-4", item.color)} />
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
                </div>
                <p className="text-sm font-bold text-foreground">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Heatmap */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Performance Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-16" />
                    {SHIFTS.map((shift) => {
                      const Icon = SHIFT_ICONS[shift];
                      return (
                        <th key={shift} className="text-center px-3 py-2 text-xs font-medium text-muted-foreground">
                          <div className="flex items-center justify-center gap-1">
                            <Icon className="w-3 h-3" />
                            {shift}
                          </div>
                          <p className="text-[10px] text-muted-foreground/60 font-normal">{SHIFT_RANGES[shift]}</p>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row, ri) => (
                    <tr key={DAYS[ri]}>
                      <td className="px-3 py-2 text-xs font-semibold text-foreground">{DAYS[ri]}</td>
                      {row.map((cell) => (
                        <td key={`${cell.day}-${cell.shift}`} className="px-2 py-2">
                          <div
                            className={cn("rounded-lg p-3 text-center transition-all hover:scale-105 cursor-default", getShiftColor(cell.avgScore))}
                            title={`Avg Score: ${cell.avgScore} | Deals: ${cell.dealCount} | Avg PVR: $${cell.avgPvr}`}
                          >
                            <p className="text-lg font-bold">{cell.avgScore}</p>
                            <p className="text-[10px] opacity-80">{cell.dealCount} deals</p>
                            <p className="text-[10px] opacity-80">${cell.avgPvr} PVR</p>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Staffing Insight */}
        <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-primary mb-1">Staffing Insight</p>
                <p className="text-xs text-muted-foreground">{insight}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Average Deal Score by Hour of Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(h) => `${h}:00`}
                  />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    labelFormatter={(h) => `${h}:00`}
                  />
                  <Line type="monotone" dataKey="avgScore" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
