import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Target,
  ShieldCheck,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Calendar,
  Printer,
  ThumbsUp,
  ArrowUpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import ScorecardPDFExport from "@/components/ScorecardPDFExport";

// ─── Sparkline Component ────────────────────────────────────────────────────
function Sparkline({
  data,
  color = "#6366f1",
  height = 40,
  width = 120,
  showDots = false,
  fillOpacity = 0.15,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  showDots?: boolean;
  fillOpacity?: number;
}) {
  if (data.length < 2) return <div style={{ width, height }} className="flex items-center justify-center text-xs text-muted-foreground">—</div>;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;
  const effectiveHeight = height - padding * 2;
  const effectiveWidth = width - padding * 2;

  const points = data.map((v, i) => ({
    x: padding + (i / (data.length - 1)) * effectiveWidth,
    y: padding + effectiveHeight - ((v - min) / range) * effectiveHeight,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const fillPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#grad-${color.replace("#", "")})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {showDots && points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2} fill={color} />
      ))}
      {/* Last point dot */}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={3} fill={color} stroke="var(--background)" strokeWidth={1.5} />
    </svg>
  );
}

// ─── Trend Icon ─────────────────────────────────────────────────────────────
function TrendIcon({ trend, className }: { trend: string; className?: string }) {
  if (trend === "up") return <TrendingUp className={cn("w-4 h-4 text-green-400", className)} />;
  if (trend === "down") return <TrendingDown className={cn("w-4 h-4 text-red-400", className)} />;
  return <Minus className={cn("w-4 h-4 text-muted-foreground", className)} />;
}

// ─── Metric Card ────────────────────────────────────────────────────────────
function MetricCard({
  title,
  value,
  suffix,
  icon: Icon,
  sparkData,
  sparkColor,
  trend,
  trendLabel,
  highlight,
}: {
  title: string;
  value: string | number;
  suffix?: string;
  icon: React.ElementType;
  sparkData: number[];
  sparkColor: string;
  trend?: string;
  trendLabel?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all hover:shadow-lg",
      highlight && "border-primary/30 bg-primary/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              highlight ? "bg-primary/20" : "bg-accent"
            )}>
              <Icon className={cn("w-4 h-4", highlight ? "text-primary" : "text-muted-foreground")} />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{title}</span>
          </div>
          {trend && (
            <div className="flex items-center gap-1">
              <TrendIcon trend={trend} />
              {trendLabel && <span className={cn(
                "text-[10px] font-medium",
                trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-muted-foreground"
              )}>{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-foreground">
              {value}
              {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
            </p>
          </div>
          <Sparkline data={sparkData} color={sparkColor} width={100} height={36} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Weekly Breakdown Table ─────────────────────────────────────────────────
function WeeklyBreakdown({ data }: { data: Array<{
  label: string;
  sessions: number;
  avgScore: number;
  avgPvr: number;
  avgPpd: number;
  avgCompliance: number;
  avgScriptFidelity: number;
  criticalFlags: number;
  utilizationRate: number;
}> }) {
  if (data.length === 0) return (
    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
      No weekly data available yet. Complete sessions to see trends.
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">Week</th>
            <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground">Deals</th>
            <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground">Avg Score</th>
            <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground">Avg PVR</th>
            <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground">Avg PPD</th>
            <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground">Compliance</th>
            <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground">Script</th>
            <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground">Flags</th>
            <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground">Utilization</th>
          </tr>
        </thead>
        <tbody>
          {data.map((week, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
              <td className="py-2.5 px-3 font-medium text-foreground">{week.label}</td>
              <td className="py-2.5 px-3 text-center">{week.sessions}</td>
              <td className="py-2.5 px-3 text-center">
                <Badge variant="outline" className={cn(
                  "text-xs",
                  week.avgScore >= 80 ? "border-green-500/30 text-green-400" :
                  week.avgScore >= 60 ? "border-yellow-500/30 text-yellow-400" :
                  "border-red-500/30 text-red-400"
                )}>
                  {week.avgScore}%
                </Badge>
              </td>
              <td className="py-2.5 px-3 text-center text-foreground">${week.avgPvr.toLocaleString()}</td>
              <td className="py-2.5 px-3 text-center text-foreground">{week.avgPpd}</td>
              <td className="py-2.5 px-3 text-center">
                <span className={cn(
                  week.avgCompliance >= 80 ? "text-green-400" :
                  week.avgCompliance >= 60 ? "text-yellow-400" : "text-red-400"
                )}>{week.avgCompliance}%</span>
              </td>
              <td className="py-2.5 px-3 text-center">
                <span className={cn(
                  week.avgScriptFidelity >= 80 ? "text-green-400" :
                  week.avgScriptFidelity >= 60 ? "text-yellow-400" : "text-red-400"
                )}>{week.avgScriptFidelity}%</span>
              </td>
              <td className="py-2.5 px-3 text-center">
                {week.criticalFlags > 0 ? (
                  <Badge variant="destructive" className="text-xs">{week.criticalFlags}</Badge>
                ) : (
                  <span className="text-green-400 text-xs">0</span>
                )}
              </td>
              <td className="py-2.5 px-3 text-center text-foreground">{week.utilizationRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ManagerScorecard() {
  useEffect(() => { document.title = "Manager Scorecard | F&I Co-Pilot by ASURA Group"; }, []);
  const [weeks] = useState(12);
  const { data, isLoading } = trpc.analytics.managerScorecard.useQuery({ weeks });

  const sparklines = useMemo(() => {
    if (!data?.weeklyTrend) return { scores: [], pvrs: [], ppds: [], compliance: [], fidelity: [], utilization: [] };
    const t = data.weeklyTrend;
    return {
      scores: t.map((w) => w.avgScore),
      pvrs: t.map((w) => w.avgPvr),
      ppds: t.map((w) => w.avgPpd),
      compliance: t.map((w) => w.avgCompliance),
      fidelity: t.map((w) => w.avgScriptFidelity),
      utilization: t.map((w) => w.utilizationRate),
    };
  }, [data]);

  if (isLoading) {
    return (
      <AppLayout title="Manager Scorecard" subtitle="Your performance trends">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-28">
                  <div className="h-4 w-24 bg-accent rounded mb-4" />
                  <div className="h-8 w-16 bg-accent rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const summary = data?.summary;
  const weeklyTrend = data?.weeklyTrend ?? [];

  return (
    <AppLayout title="Manager Scorecard" subtitle="Your weekly/monthly performance trends">
      <div className="p-6 space-y-6">
        {/* Summary Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Performance Overview</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Last {weeks} weeks ({summary?.totalSessions ?? 0} sessions)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> Export Scorecard
            </Button>
            <ScorecardPDFExport data={{
              managerName: "F&I Manager",
              dealership: "Dealership",
              dateRange: `Last ${weeks} weeks`,
              overallScore: summary?.overallAvgScore ?? 0,
              subscores: [
                { label: "Rapport", value: summary?.overallAvgScore ?? 0 },
                { label: "Needs Discovery", value: summary?.overallAvgScriptFidelity ?? 0 },
                { label: "Product Presentation", value: summary?.overallUtilization ?? 0 },
                { label: "Objection Handling", value: summary?.overallAvgCompliance ?? 0 },
                { label: "Closing", value: summary?.overallAvgScore ?? 0 },
              ],
              strengths: [
                { label: "Compliance Score", value: summary?.overallAvgCompliance ?? 0 },
                { label: "Script Fidelity", value: summary?.overallAvgScriptFidelity ?? 0 },
                { label: "Overall Score", value: summary?.overallAvgScore ?? 0 },
              ].sort((a, b) => b.value - a.value),
              improvements: [
                { label: "Compliance Score", value: summary?.overallAvgCompliance ?? 0 },
                { label: "Script Fidelity", value: summary?.overallAvgScriptFidelity ?? 0 },
                { label: "Overall Score", value: summary?.overallAvgScore ?? 0 },
              ].sort((a, b) => a.value - b.value),
              gradeTrend: sparklines.scores,
              sessionsCount: summary?.totalSessions ?? 0,
              avgPvr: summary?.overallAvgPvr ?? 0,
              penetrationPct: summary?.overallUtilization ?? 0,
            }} />
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Overall Score"
            value={summary?.overallAvgScore ?? 0}
            suffix="%"
            icon={Target}
            sparkData={sparklines.scores}
            sparkColor="#6366f1"
            trend={summary?.scoreTrend}
            trendLabel={summary?.scoreTrend === "up" ? "Improving" : summary?.scoreTrend === "down" ? "Declining" : "Steady"}
            highlight
          />
          <MetricCard
            title="Avg PVR"
            value={`$${(summary?.overallAvgPvr ?? 0).toLocaleString()}`}
            icon={DollarSign}
            sparkData={sparklines.pvrs}
            sparkColor="#22c55e"
            trend={summary?.pvrTrend}
            trendLabel={summary?.pvrTrend === "up" ? "Growing" : summary?.pvrTrend === "down" ? "Dropping" : "Stable"}
          />
          <MetricCard
            title="Avg PPD"
            value={summary?.overallAvgPpd ?? 0}
            suffix="products"
            icon={Target}
            sparkData={sparklines.ppds}
            sparkColor="#f59e0b"
          />
          <MetricCard
            title="Compliance Score"
            value={summary?.overallAvgCompliance ?? 0}
            suffix="%"
            icon={ShieldCheck}
            sparkData={sparklines.compliance}
            sparkColor={
              (summary?.overallAvgCompliance ?? 0) >= 80 ? "#22c55e" :
              (summary?.overallAvgCompliance ?? 0) >= 60 ? "#f59e0b" : "#ef4444"
            }
          />
          <MetricCard
            title="Script Fidelity"
            value={summary?.overallAvgScriptFidelity ?? 0}
            suffix="%"
            icon={BookOpen}
            sparkData={sparklines.fidelity}
            sparkColor="#8b5cf6"
          />
          <MetricCard
            title="Word Track Usage"
            value={summary?.overallUtilization ?? 0}
            suffix="%"
            icon={CheckCircle2}
            sparkData={sparklines.utilization}
            sparkColor="#06b6d4"
          />
        </div>

        {/* Critical Flags Alert */}
        {(summary?.totalCriticalFlags ?? 0) > 0 && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-400">
                  {summary?.totalCriticalFlags} Unresolved Critical Compliance Flag{(summary?.totalCriticalFlags ?? 0) > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Review flagged sessions in Session History to address compliance issues.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-green-400" />
                Top Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(() => {
                const scores = [
                  { label: "Compliance Score", value: summary?.overallAvgCompliance ?? 0 },
                  { label: "Script Fidelity", value: summary?.overallAvgScriptFidelity ?? 0 },
                  { label: "Overall Score", value: summary?.overallAvgScore ?? 0 },
                  { label: "Word Track Usage", value: summary?.overallUtilization ?? 0 },
                ];
                return scores
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 3)
                  .map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-md bg-green-500/5 border border-green-500/10">
                      <span className="text-sm text-foreground">{s.label}</span>
                      <span className="text-sm font-bold text-green-400">{s.value}%</span>
                    </div>
                  ));
              })()}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4 text-amber-400" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(() => {
                const scores = [
                  { label: "Compliance Score", value: summary?.overallAvgCompliance ?? 0 },
                  { label: "Script Fidelity", value: summary?.overallAvgScriptFidelity ?? 0 },
                  { label: "Overall Score", value: summary?.overallAvgScore ?? 0 },
                  { label: "Word Track Usage", value: summary?.overallUtilization ?? 0 },
                ];
                return scores
                  .sort((a, b) => a.value - b.value)
                  .slice(0, 3)
                  .map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-md bg-amber-500/5 border border-amber-500/10">
                      <span className="text-sm text-foreground">{s.label}</span>
                      <span className={cn("text-sm font-bold", s.value >= 60 ? "text-amber-400" : "text-red-400")}>{s.value}%</span>
                    </div>
                  ));
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Weekly Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Weekly Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <WeeklyBreakdown data={weeklyTrend} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
