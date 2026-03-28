import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Target, TrendingUp, Plus, DollarSign, Percent, Shield, Star, Check, X,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

type MetricKey = "pvr" | "penetration" | "compliance" | "score";

interface Goal {
  id: string;
  metric: MetricKey;
  target: number;
  period: string; // e.g. "2026-03"
}

const METRIC_CONFIG: Record<MetricKey, { label: string; icon: React.ReactNode; prefix: string; suffix: string }> = {
  pvr: { label: "PVR", icon: <DollarSign className="w-5 h-5" />, prefix: "$", suffix: "" },
  penetration: { label: "Product Penetration", icon: <Percent className="w-5 h-5" />, prefix: "", suffix: "%" },
  compliance: { label: "Compliance Score", icon: <Shield className="w-5 h-5" />, prefix: "", suffix: "%" },
  score: { label: "Overall Score", icon: <Star className="w-5 h-5" />, prefix: "", suffix: "/100" },
};

function formatValue(metric: MetricKey, value: number): string {
  const cfg = METRIC_CONFIG[metric];
  if (metric === "pvr") return `${cfg.prefix}${Math.round(value).toLocaleString()}`;
  if (metric === "score") return `${Math.round(value)}${cfg.suffix}`;
  return `${Math.round(value)}${cfg.suffix}`;
}

function getProgressColor(pct: number): string {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function getProgressTextColor(pct: number): string {
  if (pct >= 80) return "text-green-400";
  if (pct >= 50) return "text-yellow-400";
  return "text-red-400";
}

function getProgressBorderColor(pct: number): string {
  if (pct >= 80) return "border-green-500/30";
  if (pct >= 50) return "border-yellow-500/30";
  return "border-red-500/30";
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const DEFAULT_GOALS: Goal[] = [
  { id: "default-pvr", metric: "pvr", target: 3200, period: getCurrentMonth() },
  { id: "default-penetration", metric: "penetration", target: 68, period: getCurrentMonth() },
  { id: "default-compliance", metric: "compliance", target: 95, period: getCurrentMonth() },
  { id: "default-score", metric: "score", target: 82, period: getCurrentMonth() },
];

export default function GoalTracker() {
  useEffect(() => { document.title = "Goal Tracker | F&I Co-Pilot by ASURA Group"; }, []);

  const [goals, setGoals] = useState<Goal[]>(DEFAULT_GOALS);
  const [newMetric, setNewMetric] = useState<MetricKey>("pvr");
  const [newTarget, setNewTarget] = useState("");
  const [newPeriod, setNewPeriod] = useState(getCurrentMonth());

  const { data: summary, isLoading } = trpc.analytics.summary.useQuery();

  const currentValues = useMemo<Record<MetricKey, number>>(() => {
    if (!summary) return { pvr: 0, penetration: 0, compliance: 0, score: 0 };
    const complianceScore = Math.min(100, Math.max(0, 100 - (summary.criticalFlags ?? 0)));
    const penetrationPct = Math.min(100, ((summary.avgPpd ?? 0) / 5) * 100);
    return {
      pvr: summary.avgPvr ?? 0,
      penetration: penetrationPct,
      compliance: complianceScore,
      score: summary.avgScore ?? 0,
    };
  }, [summary]);

  function handleAddGoal() {
    const target = parseFloat(newTarget);
    if (isNaN(target) || target <= 0) return;
    const goal: Goal = {
      id: `goal-${Date.now()}`,
      metric: newMetric,
      target,
      period: newPeriod,
    };
    setGoals((prev) => [...prev, goal]);
    setNewTarget("");
  }

  function handleRemoveGoal(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  const chartData = useMemo(() => {
    return goals.map((g) => {
      const current = currentValues[g.metric];
      const pct = g.target > 0 ? Math.min(100, (current / g.target) * 100) : 0;
      return {
        name: METRIC_CONFIG[g.metric].label,
        pct: Math.round(pct),
        current,
        target: g.target,
      };
    });
  }, [goals, currentValues]);

  return (
    <AppLayout title="Goal Tracker" subtitle="Set and track monthly F&I performance goals">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Target className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Goal Tracker</h1>
            <p className="text-muted-foreground text-sm">Set monthly PVR and product penetration goals</p>
          </div>
        </div>

        {/* Set Goal Form */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              Set New Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Metric</label>
                <select
                  value={newMetric}
                  onChange={(e) => setNewMetric(e.target.value as MetricKey)}
                  className="block w-48 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="pvr">PVR</option>
                  <option value="penetration">Product Penetration</option>
                  <option value="compliance">Compliance Score</option>
                  <option value="score">Overall Score</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Target Value</label>
                <input
                  type="number"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder={newMetric === "pvr" ? "3200" : "85"}
                  className="block w-36 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Period (Month)</label>
                <input
                  type="month"
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(e.target.value)}
                  className="block w-44 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <Button onClick={handleAddGoal} className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                Add Goal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Chart */}
        {chartData.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Goal Progress Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} unit="%" />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(value: number) => [`${value}%`, "Progress"]}
                  />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.pct >= 80 ? "#22c55e" : entry.pct >= 50 ? "#eab308" : "#ef4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Goal Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-card border-border animate-pulse">
                <CardContent className="p-6 h-40" />
              </Card>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-16 text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-sm font-medium text-muted-foreground">No goals set yet</p>
              <p className="text-xs text-muted-foreground mt-1">Use the form above to add your first goal</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const cfg = METRIC_CONFIG[goal.metric];
              const current = currentValues[goal.metric];
              const pct = goal.target > 0 ? Math.min(100, (current / goal.target) * 100) : 0;
              const roundedPct = Math.round(pct);
              const gap = goal.target - current;
              const onTrack = gap <= 0;

              let gapText: string;
              if (onTrack) {
                gapText = "On Track!";
              } else if (goal.metric === "pvr") {
                gapText = `$${Math.round(gap).toLocaleString()} behind`;
              } else if (goal.metric === "score") {
                gapText = `${Math.round(gap)} pts behind`;
              } else {
                gapText = `${Math.round(gap)}% behind`;
              }

              return (
                <Card
                  key={goal.id}
                  className={cn(
                    "bg-card border transition-all hover:shadow-md",
                    getProgressBorderColor(roundedPct),
                  )}
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Top row: icon + metric name + remove button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          roundedPct >= 80 ? "bg-green-500/10 text-green-400"
                            : roundedPct >= 50 ? "bg-yellow-500/10 text-yellow-400"
                            : "bg-red-500/10 text-red-400",
                        )}>
                          {cfg.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{cfg.label}</p>
                          <p className="text-[10px] text-muted-foreground">{goal.period}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveGoal(goal.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remove goal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Values row */}
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground">Current </span>
                        <span className={cn("text-lg font-bold", getProgressTextColor(roundedPct))}>
                          {formatValue(goal.metric, current)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">Target </span>
                        <span className="text-lg font-bold text-foreground">
                          {formatValue(goal.metric, goal.target)}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="w-full h-3 rounded-full bg-muted/50 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", getProgressColor(roundedPct))}
                          style={{ width: `${Math.min(100, roundedPct)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-4",
                            onTrack
                              ? "border-green-500/30 text-green-400"
                              : roundedPct >= 50
                                ? "border-yellow-500/30 text-yellow-400"
                                : "border-red-500/30 text-red-400",
                          )}
                        >
                          {onTrack ? <Check className="w-3 h-3 mr-0.5" /> : null}
                          {gapText}
                        </Badge>
                        <span className={cn("text-xs font-bold", getProgressTextColor(roundedPct))}>
                          {roundedPct}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
