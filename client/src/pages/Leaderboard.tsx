import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { Trophy, Medal, Award, Crown, TrendingUp, TrendingDown, Minus } from "lucide-react";

type TimePeriod = "30" | "90" | "all";
type SortMetric = "overallScore" | "avgPvr" | "productPenetration" | "complianceScore";

function getRankBadge(rank: number) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
}

function getRankBg(rank: number) {
  if (rank === 1) return "bg-yellow-500/5 border-yellow-500/20";
  if (rank === 2) return "bg-slate-400/5 border-slate-400/20";
  if (rank === 3) return "bg-amber-600/5 border-amber-600/20";
  return "bg-card border-border";
}

export default function Leaderboard() {
  useEffect(() => { document.title = "Leaderboard | F&I Co-Pilot by ASURA Group"; }, []);
  const { user } = useAuth();
  const [period, setPeriod] = useState<TimePeriod>("30");
  const [sortBy, setSortBy] = useState<SortMetric>("overallScore");

  const weeks = period === "30" ? 4 : period === "90" ? 12 : 52;
  const { data: scorecard, isLoading } = trpc.analytics.managerScorecard.useQuery({ weeks });

  // Build weekly leaderboard entries from weeklyTrend data
  const leaderboard = useMemo(() => {
    if (!scorecard) return [];
    const trend = scorecard.weeklyTrend ?? [];
    if (trend.length === 0 && scorecard.summary) {
      // Single summary entry
      const s = scorecard.summary;
      return [{
        week: "Overall",
        overallScore: s.overallAvgScore,
        avgPvr: s.overallAvgPvr,
        productPenetration: s.overallAvgPpd,
        complianceScore: s.overallAvgCompliance,
        sessionCount: s.totalSessions,
      }];
    }
    return trend
      .filter((w) => w.sessions > 0)
      .map((w) => ({
        week: w.label,
        overallScore: w.avgScore,
        avgPvr: w.avgPvr,
        productPenetration: w.avgPpd,
        complianceScore: w.avgCompliance,
        sessionCount: w.sessions,
      }))
      .sort((a, b) => {
        const aVal = a[sortBy] ?? 0;
        const bVal = b[sortBy] ?? 0;
        return bVal - aVal;
      });
  }, [scorecard, sortBy]);

  const metricOptions: { key: SortMetric; label: string }[] = [
    { key: "overallScore", label: "Overall Score" },
    { key: "avgPvr", label: "PVR" },
    { key: "productPenetration", label: "Product Penetration" },
    { key: "complianceScore", label: "Compliance Score" },
  ];

  const periodOptions: { key: TimePeriod; label: string }[] = [
    { key: "30", label: "Last 30 Days" },
    { key: "90", label: "Last 90 Days" },
    { key: "all", label: "All Time" },
  ];

  const summary = scorecard?.summary;
  const trend = scorecard?.weeklyTrend ?? [];
  const trendIcon = summary?.scoreTrend === "up" ? <TrendingUp className="w-4 h-4 text-green-400" />
    : summary?.scoreTrend === "down" ? <TrendingDown className="w-4 h-4 text-red-400" />
    : <Minus className="w-4 h-4 text-muted-foreground" />;

  return (
    <AppLayout title="Performance Leaderboard" subtitle="Rank your weekly performance by key metrics">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Performance Leaderboard</h1>
              <p className="text-muted-foreground text-sm">
                {user?.name ? `${user.name}'s weekly rankings` : "See how your weeks stack up"}
              </p>
            </div>
          </div>
          {summary && (
            <div className="flex items-center gap-2">
              {trendIcon}
              <span className="text-sm text-muted-foreground">
                Avg Score: <span className={cn("font-bold", summary.overallAvgScore >= 85 ? "text-green-400" : summary.overallAvgScore >= 70 ? "text-yellow-400" : "text-red-400")}>
                  {Math.round(summary.overallAvgScore)}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-1.5">
            {periodOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setPeriod(opt.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                  period === opt.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {metricOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                  sortBy === opt.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-card text-muted-foreground border-border hover:border-blue-500/40"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Table */}
        <Card className="bg-card border-border overflow-hidden">
          {isLoading ? (
            <CardContent className="p-0">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 border-b border-border/50 animate-pulse bg-card" />
              ))}
            </CardContent>
          ) : leaderboard.length === 0 ? (
            <CardContent className="py-16 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-sm font-medium text-muted-foreground">No performance data available yet</p>
              <p className="text-xs text-muted-foreground mt-1">Complete sessions to populate the leaderboard</p>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 bg-muted/30">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">Rank</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Week</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overall Score</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">PVR</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Products/Deal</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compliance</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => {
                    const rank = idx + 1;
                    return (
                      <tr
                        key={entry.week}
                        className={cn(
                          "border-b border-border/40 transition-colors",
                          rank === 1 ? "bg-primary/10 border-l-2 border-l-primary" : getRankBg(rank),
                          "hover:bg-primary/5"
                        )}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center w-8 h-8">
                            {getRankBadge(rank)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                              {entry.week.slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {entry.week}
                                {rank === 1 && (
                                  <Badge variant="outline" className="ml-2 text-[9px] px-1 py-0 h-3.5 border-yellow-500/30 text-yellow-400">
                                    Best
                                  </Badge>
                                )}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{entry.sessionCount} session{entry.sessionCount !== 1 ? "s" : ""}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={cn("font-bold", entry.overallScore >= 85 ? "text-green-400" : entry.overallScore >= 70 ? "text-yellow-400" : "text-red-400")}>
                            {Math.round(entry.overallScore)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-foreground font-medium">
                            ${Math.round(entry.avgPvr).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-foreground">{entry.productPenetration.toFixed(1)}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={cn("font-medium", entry.complianceScore >= 80 ? "text-green-400" : entry.complianceScore >= 60 ? "text-yellow-400" : "text-red-400")}>
                            {Math.round(entry.complianceScore)}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-muted-foreground">{entry.sessionCount}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
