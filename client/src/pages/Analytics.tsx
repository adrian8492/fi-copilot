import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Building2, DollarSign } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import WeeklyCoachingInsights from "@/components/WeeklyCoachingInsights";

const PIE_COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#84cc16","#ec4899","#14b8a6"];



// MoM delta helper
function MomDelta({ current, prior, prefix = "", suffix = "" }: { current: number; prior: number; prefix?: string; suffix?: string }) {
  if (prior === 0 && current === 0) return null;
  const delta = current - prior;
  const pct = prior > 0 ? Math.round((delta / prior) * 100) : 0;
  const isUp = delta > 0;
  const isDown = delta < 0;
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  return (
    <div className={cn("flex items-center gap-1 text-[10px] mt-1", isUp ? "text-emerald-400" : isDown ? "text-red-400" : "text-muted-foreground")}>
      <Icon className="w-3 h-3" />
      <span>{isUp ? "+" : ""}{prefix}{delta}{suffix} ({isUp ? "+" : ""}{pct}%) vs prior 30d</span>
    </div>
  );
}

export default function Analytics() {
  useEffect(() => { document.title = "Analytics | F&I Co-Pilot by ASURA Group"; }, []);
  const [selectedDealership, setSelectedDealership] = useState<string>("all");
  const { data: dealerships } = trpc.auth.myRooftops.useQuery();
  const { data: summary } = trpc.analytics.summary.useQuery();
  const { data: gradeTrend } = trpc.analytics.myGradeTrend.useQuery({ limit: 20 });
  const { data: pvrTrend } = trpc.analytics.pvrTrend.useQuery({ limit: 30 });
  const { data: productMix } = trpc.analytics.productMix.useQuery();
  const { data: sessionVolume } = trpc.analytics.sessionVolume.useQuery({ weeks: 8 });


  const trendData = gradeTrend?.map((g, i) => ({
    session: `S${i + 1}`,
    score: g.overallScore ?? 0,
    scriptFidelity: g.scriptFidelityScore ?? 0,
    rapport: g.rapportScore ?? 0,
    objections: g.objectionHandlingScore ?? 0,
    closing: g.closingTechniqueScore ?? 0,
  })).reverse() ?? [];

  const avgScore = trendData.length > 0
    ? Math.round(trendData.reduce((a, b) => a + b.score, 0) / trendData.length)
    : 0;

  const avgPvr = pvrTrend && pvrTrend.length > 0
    ? Math.round(pvrTrend.reduce((a, b) => a + b.pvr, 0) / pvrTrend.length)
    : 0;

  const totalSessions = sessionVolume?.reduce((a, b) => a + b.total, 0) ?? 0;

  // MoM (month-over-month) delta estimation: first half vs second half of trend data
  const momScore = useMemo(() => {
    if (!trendData.length) return { current: 0, prior: 0 };
    const mid = Math.floor(trendData.length / 2);
    const recent = trendData.slice(mid);
    const older = trendData.slice(0, mid);
    const recentAvg = recent.length > 0 ? Math.round(recent.reduce((a, b) => a + b.score, 0) / recent.length) : 0;
    const olderAvg = older.length > 0 ? Math.round(older.reduce((a, b) => a + b.score, 0) / older.length) : 0;
    return { current: recentAvg, prior: olderAvg };
  }, [trendData]);

  const momPvr = useMemo(() => {
    if (!pvrTrend?.length) return { current: 0, prior: 0 };
    const mid = Math.floor(pvrTrend.length / 2);
    const recent = pvrTrend.slice(mid);
    const older = pvrTrend.slice(0, mid);
    const recentAvg = recent.length > 0 ? Math.round(recent.reduce((a, b) => a + b.pvr, 0) / recent.length) : 0;
    const olderAvg = older.length > 0 ? Math.round(older.reduce((a, b) => a + b.pvr, 0) / older.length) : 0;
    return { current: recentAvg, prior: olderAvg };
  }, [pvrTrend]);

  // Net revenue estimate
  const netRevenue = totalSessions * avgPvr;

  return (
    <AppLayout title="Analytics" subtitle="Performance trends and insights">
      <div className="p-6 space-y-6">
        {/* Dealership Selector */}
        {dealerships && dealerships.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Dealership:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedDealership("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                  selectedDealership === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                All Dealerships
              </button>
              {dealerships.map((d) => (
                <button
                  key={d.dealershipId}
                  onClick={() => setSelectedDealership(String(d.dealershipId))}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                    selectedDealership === String(d.dealershipId)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/40"
                  )}
                >
                  {d.dealershipName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* KPI Summary Row with MoM Deltas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Avg Score", value: avgScore ? `${avgScore}/100` : "—", color: "text-indigo-400", mom: momScore },
            { label: "Avg PVR", value: avgPvr ? `$${avgPvr.toLocaleString()}` : "—", color: "text-emerald-400", mom: momPvr },
            { label: "Sessions (8 wks)", value: totalSessions ? `${totalSessions}` : "—", color: "text-amber-400", mom: null },
            { label: "Total Graded", value: summary?.totalGrades ? `${summary.totalGrades}` : "—", color: "text-violet-400", mom: null },
            { label: "Net Revenue Est.", value: netRevenue > 0 ? `$${netRevenue.toLocaleString()}` : "—", color: "text-cyan-400", mom: null },
          ].map(({ label, value, color, mom }) => (
            <Card key={label} className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                {mom && mom.prior > 0 && <MomDelta current={mom.current} prior={mom.prior} />}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Score Trend + Script Fidelity */}
        {trendData.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Score Trend — Last {trendData.length} Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="session" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Overall" />
                  <Line type="monotone" dataKey="scriptFidelity" stroke="#10b981" strokeWidth={1.5} dot={false} name="Script Fidelity" />
                  <Line type="monotone" dataKey="objections" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Objection Handling" />
                  <Line type="monotone" dataKey="closing" stroke="#34d399" strokeWidth={1.5} dot={false} name="Closing" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* PVR & PPD Trend */}
        {pvrTrend && pvrTrend.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">PVR & Products Per Deal Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={pvrTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis yAxisId="pvr" orientation="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${v}`} />
                  <YAxis yAxisId="ppd" orientation="right" domain={[0, 6]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(value: number, name: string) => name === "PVR" ? [`$${(value as number).toLocaleString()}`, name] : [(value as number).toFixed(1), name]}
                  />
                  <Legend />
                  <Line yAxisId="pvr" type="monotone" dataKey="pvr" stroke="#10b981" strokeWidth={2} dot={false} name="PVR" />
                  <Line yAxisId="ppd" type="monotone" dataKey="ppd" stroke="#6366f1" strokeWidth={1.5} dot={false} name="PPD" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Product Mix + Objection Win Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {productMix && productMix.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Product Objection Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={productMix} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                      label={({ name, percent }: { name: string; percent: number }) => `${name} ${Math.round(percent * 100)}%`}
                      labelLine={false}
                    >
                      {productMix.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                      formatter={(value: number, _name: string, props: { payload?: { winRate?: number } }) =>
                        [`${value} objections (${props.payload?.winRate ?? 0}% win rate)`, "Volume"]
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {productMix && productMix.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Objection Win Rate by Product</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={productMix} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={70} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                      formatter={(value: number) => [`${value}%`, "Win Rate"]}
                    />
                    <Bar dataKey="winRate" radius={[0, 4, 4, 0]} name="Win Rate">
                      {productMix.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.winRate >= 70 ? "#10b981" : entry.winRate >= 50 ? "#f59e0b" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Session Volume by Week */}
        {sessionVolume && sessionVolume.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Session Volume — Last 8 Weeks</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sessionVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total Sessions" />
                  <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}



        {/* Weekly Coaching Insights */}
        <WeeklyCoachingInsights />

        {trendData.length === 0 && !pvrTrend?.length && !sessionVolume?.length && (
          <Card className="bg-card border-border">
            <CardContent className="py-16 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-sm font-medium text-muted-foreground">
                Complete sessions and generate grades to see your analytics
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
