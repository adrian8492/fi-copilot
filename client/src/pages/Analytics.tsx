import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useEffect } from "react";

const PIE_COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#84cc16","#ec4899","#14b8a6"];



export default function Analytics() {
  useEffect(() => { document.title = "Analytics | F&I Co-Pilot by ASURA Group"; }, []);
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

  return (
    <AppLayout title="Analytics" subtitle="Performance trends and insights">
      <div className="p-6 space-y-6">
        {/* KPI Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Avg Score", value: avgScore ? `${avgScore}/100` : "—", color: "text-indigo-400" },
            { label: "Avg PVR", value: avgPvr ? `$${avgPvr.toLocaleString()}` : "—", color: "text-emerald-400" },
            { label: "Sessions (8 wks)", value: totalSessions ? `${totalSessions}` : "—", color: "text-amber-400" },
            { label: "Total Graded", value: summary?.totalGrades ? `${summary.totalGrades}` : "—", color: "text-violet-400" },
          ].map(({ label, value, color }) => (
            <Card key={label} className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
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
