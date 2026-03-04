import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Eye, TrendingUp, DollarSign, Clock, Hash, Percent,
  Trophy, Medal, Award, ChevronUp, ChevronDown, Minus, Calendar, BookOpen,
} from "lucide-react";

type MetricKey = "score" | "pvr" | "recordingLengthMinutes" | "dealCount" | "utilizationRate" | "ppd" | "scriptFidelityScore";

const METRIC_OPTIONS: { key: MetricKey; label: string; icon: React.ReactNode; format: (v: number) => string }[] = [
  { key: "score", label: "Score", icon: <Trophy className="w-4 h-4" />, format: (v) => `${v.toFixed(1)}%` },
  { key: "pvr", label: "PVR", icon: <DollarSign className="w-4 h-4" />, format: (v) => `$${v.toLocaleString()}` },
  { key: "ppd", label: "Products/Deal", icon: <Hash className="w-4 h-4" />, format: (v) => v.toFixed(1) },
  { key: "recordingLengthMinutes", label: "Recording Length", icon: <Clock className="w-4 h-4" />, format: (v) => `${v.toFixed(0)}m` },
  { key: "dealCount", label: "Deal Count", icon: <Hash className="w-4 h-4" />, format: (v) => String(v) },
  { key: "utilizationRate", label: "Utilization", icon: <Percent className="w-4 h-4" />, format: (v) => `${v.toFixed(1)}%` },
  { key: "scriptFidelityScore", label: "Script Fidelity", icon: <BookOpen className="w-4 h-4" />, format: (v) => v > 0 ? `${v.toFixed(1)}` : "—" },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function ScoreBadge({ score }: { score: number }) {
  if (score >= 80) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      {score.toFixed(1)}%
    </span>
  );
  if (score >= 65) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
      <span className="w-2 h-2 rounded-full bg-amber-400" />
      {score.toFixed(1)}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-red-500/20 text-red-400 border border-red-500/30">
      <span className="w-2 h-2 rounded-full bg-red-400" />
      {score.toFixed(1)}%
    </span>
  );
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return <span className="w-5 h-5 flex items-center justify-center text-slate-500 font-bold text-sm">{rank}</span>;
}

type DatePreset = "7d" | "30d" | "90d" | "all";
const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
  { key: "all", label: "All Time" },
];
function getPresetDates(preset: DatePreset): { fromDate?: Date; toDate?: Date } {
  if (preset === "all") return {};
  const now = new Date();
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  return { fromDate: from, toDate: now };
}
export default function EagleEyeView() {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("score");
  const [sortField, setSortField] = useState<MetricKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [datePreset, setDatePreset] = useState<DatePreset>("30d");
  const dateRange = useMemo(() => getPresetDates(datePreset), [datePreset]);

  const { data: leaderboard = [], isLoading: loadingBoard } = trpc.eagleEye.leaderboard.useQuery(dateRange);
  const { data: trends, isLoading: loadingTrends } = trpc.eagleEye.trends.useQuery(dateRange);

  const activeMetricDef = METRIC_OPTIONS.find((m) => m.key === activeMetric)!;

  const sorted = useMemo(() => {
    return [...leaderboard].sort((a, b) => {
      const av = (a as unknown as Record<string, number>)[sortField] ?? 0;
      const bv = (b as unknown as Record<string, number>)[sortField] ?? 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [leaderboard, sortField, sortDir]);

  const handleSort = (field: MetricKey) => {
    if (sortField === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: MetricKey }) => {
    if (sortField !== field) return <Minus className="w-3 h-3 opacity-30" />;
    return sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />;
  };

  // Build group trend chart data
  const groupTrendData = trends?.groupTrend ?? [];
  const scriptFidelityTrendData = (trends?.scriptFidelityTrend ?? []) as Array<{ week: string; fidelity: number }>;

  // Build per-manager trend data for the active metric
  const managerTrendData = useMemo(() => {
    if (!trends?.managerTrends) return [];
    const allWeeks = new Set<string>();
    Object.values(trends.managerTrends).forEach((t) => t.forEach((p) => allWeeks.add(p.week)));
    return Array.from(allWeeks).sort().map((week) => {
      const point: Record<string, string | number> = { week };
      Object.entries(trends.managerTrends).forEach(([name, data]) => {
        const found = data.find((p) => p.week === week);
        if (found) point[name] = found.score;
      });
      return point;
    });
  }, [trends]);

  const managerNames = Object.keys(trends?.managerTrends ?? {});

  // Summary stats
  const avgScore = leaderboard.length > 0 ? leaderboard.reduce((s, m) => s + m.score, 0) / leaderboard.length : 0;
  const avgPvr = leaderboard.length > 0 ? leaderboard.reduce((s, m) => s + m.pvr, 0) / leaderboard.length : 0;
  const totalDeals = leaderboard.reduce((s, m) => s + m.dealCount, 0);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Eye className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Eagle Eye View</h1>
              <p className="text-slate-400 text-sm">Team performance leaderboard — all F&I managers</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
              <Calendar className="w-4 h-4 text-slate-400 ml-1" />
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setDatePreset(p.key)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    datePreset === p.key
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-400 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> ≥80%
              <span className="w-2 h-2 rounded-full bg-amber-400 ml-1" /> 65–79%
              <span className="w-2 h-2 rounded-full bg-red-400 ml-1" /> &lt;65%
            </div>
          </div>
        </div>

        {/* Summary KPI row */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10"><TrendingUp className="w-5 h-5 text-blue-400" /></div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Team Avg Score</p>
                <p className="text-2xl font-bold text-white">{avgScore.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10"><DollarSign className="w-5 h-5 text-emerald-400" /></div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Team Avg PVR</p>
                <p className="text-2xl font-bold text-white">${Math.round(avgPvr).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10"><Hash className="w-5 h-5 text-purple-400" /></div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Total Deals Graded</p>
                <p className="text-2xl font-bold text-white">{totalDeals}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metric Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 text-sm mr-1">View by:</span>
          {METRIC_OPTIONS.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeMetric === m.key
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Leaderboard Table */}
          <Card className="bg-slate-800/50 border-slate-700 xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Manager Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBoard ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-700/50 rounded-lg animate-pulse" />)}
                </div>
              ) : sorted.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No graded sessions yet. Complete sessions to see the leaderboard.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-3 text-slate-400 font-medium w-10">#</th>
                        <th className="text-left py-3 px-3 text-slate-400 font-medium">Manager</th>
                        <th className="text-left py-3 px-3 text-slate-400 font-medium">Dealership</th>
                        {METRIC_OPTIONS.map((m) => (
                          <th
                            key={m.key}
                            className="text-right py-3 px-3 text-slate-400 font-medium cursor-pointer hover:text-white select-none"
                            onClick={() => handleSort(m.key)}
                          >
                            <span className="flex items-center justify-end gap-1">
                              {m.label} <SortIcon field={m.key} />
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((manager, idx) => (
                        <tr
                          key={manager.userId}
                          className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${idx === 0 ? "bg-yellow-500/5" : ""}`}
                        >
                          <td className="py-4 px-3">
                            <RankIcon rank={idx + 1} />
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                {manager.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                              </div>
                              <span className="font-medium text-white">{manager.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-3 text-slate-400">{manager.dealership}</td>
                          <td className="py-4 px-3 text-right">
                            <ScoreBadge score={manager.score} />
                          </td>
                          <td className="py-4 px-3 text-right font-semibold text-emerald-400">${manager.pvr.toLocaleString()}</td>
                          <td className="py-4 px-3 text-right text-slate-300">{manager.ppd.toFixed(1)}</td>
                          <td className="py-4 px-3 text-right text-slate-300">{manager.recordingLengthMinutes.toFixed(0)}m</td>
                          <td className="py-4 px-3 text-right text-slate-300">{manager.dealCount}</td>
                          <td className="py-4 px-3 text-right text-slate-300">{manager.utilizationRate.toFixed(1)}%</td>
                          <td className="py-4 px-3 text-right">
                            {(manager as Record<string, unknown>).scriptFidelityScore as number > 0 ? (
                              <div className="group relative inline-block">
                                <span className={`text-sm font-semibold ${
                                  ((manager as Record<string, unknown>).scriptFidelityScore as number) >= 85 ? "text-emerald-400" :
                                  ((manager as Record<string, unknown>).scriptFidelityScore as number) >= 70 ? "text-amber-400" : "text-red-400"
                                }`}>
                                  {((manager as Record<string, unknown>).scriptFidelityScore as number).toFixed(1)}
                                </span>
                                <div className="absolute right-0 top-full mt-1 z-10 hidden group-hover:block w-52 bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl text-xs">
                                  <p className="text-slate-400 font-semibold mb-2 uppercase tracking-wider">Script Fidelity Breakdown</p>
                                  {[
                                    { label: "Process", key: "processAdherenceScore" },
                                    { label: "Menu Seq.", key: "menuSequenceScore" },
                                    { label: "Objection", key: "objectionResponseScore" },
                                    { label: "Transition", key: "transitionAccuracyScore" },
                                  ].map(item => {
                                    const val = ((manager as Record<string, unknown>)[item.key] as number) ?? 0;
                                    return (
                                      <div key={item.key} className="flex justify-between items-center mb-1">
                                        <span className="text-slate-400">{item.label}</span>
                                        <span className={val >= 85 ? "text-emerald-400 font-semibold" : val >= 70 ? "text-amber-400 font-semibold" : "text-red-400 font-semibold"}>{val.toFixed(1)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-600 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Group Score Trend */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Team Score Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTrends ? (
                <div className="h-48 bg-slate-700/30 rounded animate-pulse" />
              ) : groupTrendData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
                  Not enough data for trend analysis yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={groupTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="week" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      labelStyle={{ color: "#e2e8f0" }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 4 }} name="Team Avg Score" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Per-Manager Score Trend */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Individual Score Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTrends ? (
                <div className="h-48 bg-slate-700/30 rounded animate-pulse" />
              ) : managerTrendData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
                  Not enough data for individual trends yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={managerTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="week" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      labelStyle={{ color: "#e2e8f0" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    {managerNames.map((name, i) => (
                      <Line key={name} type="monotone" dataKey={name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Script Fidelity Trend */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  Script Fidelity Trend
                </CardTitle>
                <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded-full">ASURA Methodology</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Team average verbatim word track adherence over time</p>
            </CardHeader>
            <CardContent>
              {loadingTrends ? (
                <div className="h-48 bg-slate-700/30 rounded animate-pulse" />
              ) : scriptFidelityTrendData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-500 text-sm text-center px-4">
                  No script fidelity data yet &mdash; grades must be generated to populate this chart.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={scriptFidelityTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="week" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      labelStyle={{ color: "#e2e8f0" }}
                      formatter={(value: number) => [`${value}%`, "Script Fidelity"]}
                    />
                    <Line type="monotone" dataKey="fidelity" stroke="#a855f7" strokeWidth={2} dot={{ fill: "#a855f7", r: 4 }} name="Team Script Fidelity" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Metric Bar Chart */}
          <Card className="bg-slate-800/50 border-slate-700 xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                {activeMetricDef.icon}
                {activeMetricDef.label} — All Managers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBoard ? (
                <div className="h-48 bg-slate-700/30 rounded animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sorted} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 12 }} width={120} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      formatter={(value: number) => [activeMetricDef.format(value), activeMetricDef.label]}
                    />
                    <Bar dataKey={activeMetric} fill="#3b82f6" radius={[0, 4, 4, 0]}>
                      {sorted.map((entry, index) => (
                        <rect key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
