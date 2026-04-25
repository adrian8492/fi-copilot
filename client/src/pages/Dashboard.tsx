import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Mic,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Zap,
  Star,
  DollarSign,
  Package,
  BookOpen,
  ThumbsUp,
  Target,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import WeeklyCoachingInsights from "@/components/WeeklyCoachingInsights";
import { useState, useEffect, useMemo } from "react";
import { Search, Shield, RefreshCw, Activity } from "lucide-react";

function getScoreColor(score: number) {
  if (score >= 85) return "text-green-400";
  if (score >= 70) return "text-yellow-400";
  if (score >= 55) return "text-orange-400";
  return "text-red-400";
}

function getScoreBg(score: number) {
  if (score >= 85) return "bg-green-500/10 border-green-500/20";
  if (score >= 70) return "bg-yellow-500/10 border-yellow-500/20";
  if (score >= 55) return "bg-orange-500/10 border-orange-500/20";
  return "bg-red-500/10 border-red-500/20";
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? "#4ade80" : score >= 70 ? "#facc15" : score >= 55 ? "#fb923c" : "#f87171";

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="5" className="text-border" />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease-out" }}
      />
    </svg>
  );
}

function TierPill({ tier }: { tier: string }) {
  const cls =
    tier === "Tier-1" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" :
    tier === "Tier-2" ? "bg-amber-500/20 text-amber-400 border-amber-500/40" :
    tier === "Tier-3" ? "bg-orange-500/20 text-orange-400 border-orange-500/40" :
    "bg-red-500/20 text-red-400 border-red-500/40";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${cls}`}>{tier}</span>;
}

function ASURAScorecardWidget() {
  const [, navigate] = useLocation();
  const { data: avg, isLoading } = trpc.scorecards.myAverage.useQuery();
  const { data: recent } = trpc.scorecards.myScorecards.useQuery({ limit: 5, offset: 0 });

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="h-24 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!avg || avg.sessionCount === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">ASURA OPS Scorecard</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="py-6 text-center">
          <p className="text-xs text-muted-foreground">
            No scorecards yet. Open a completed session → ASURA Scorecard tab to generate your first score.
          </p>
        </CardContent>
      </Card>
    );
  }

  const tier =
    avg.avgTier1Score >= 85 ? "Tier-1" :
    avg.avgTier1Score >= 70 ? "Tier-2" :
    avg.avgTier1Score >= 55 ? "Tier-3" :
    "Below-Tier";

  const pillars = [
    { label: "Menu Order", score: avg.avgMenuOrder },
    { label: "Upgrade Arch.", score: avg.avgUpgradeArchitecture },
    { label: "Objection Prev.", score: avg.avgObjectionPrevention },
    { label: "Coaching Cadence", score: avg.avgCoachingCadence },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">ASURA OPS Scorecard</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => navigate("/history")}>
            View sessions <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tier-1 Score + Tier */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${
                avg.avgTier1Score >= 85 ? "text-emerald-400" :
                avg.avgTier1Score >= 70 ? "text-amber-400" :
                avg.avgTier1Score >= 55 ? "text-orange-400" : "text-red-400"
              }`}>
                {Math.round(avg.avgTier1Score)}
              </span>
              <span className="text-sm text-muted-foreground">/ 100 avg</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <TierPill tier={tier} />
              <span className="text-xs text-muted-foreground">{avg.sessionCount} session{avg.sessionCount !== 1 ? "s" : ""} scored</span>
            </div>
          </div>
          {/* Recent trend sparkline */}
          {recent && recent.length >= 2 && (
            <div className="flex items-end gap-0.5 h-10">
              {recent.slice().reverse().map((sc: Record<string, unknown>, i: number) => {
                const s = Number(sc.tier1Score ?? 0);
                const h = Math.max(4, Math.round((s / 100) * 40));
                const color = s >= 85 ? "bg-emerald-400" : s >= 70 ? "bg-amber-400" : s >= 55 ? "bg-orange-400" : "bg-red-400";
                return <div key={i} className={`w-2 rounded-sm ${color}`} style={{ height: h }} title={`${s}`} />;
              })}
            </div>
          )}
        </div>

        {/* Pillar mini-bars */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {pillars.map(({ label, score }) => {
            const pct = Math.round(score);
            const color = pct >= 85 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : pct >= 55 ? "bg-orange-500" : "bg-red-500";
            const textColor = pct >= 85 ? "text-emerald-400" : pct >= 70 ? "text-amber-400" : pct >= 55 ? "text-orange-400" : "text-red-400";
            return (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground truncate">{label}</span>
                  <span className={`text-[10px] font-bold ${textColor}`}>{pct}</span>
                </div>
                <div className="h-1 rounded-full bg-border overflow-hidden">
                  <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  useEffect(() => { document.title = "Dashboard | F&I Co-Pilot by ASURA Group"; }, []);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: summary } = trpc.analytics.summary.useQuery();
  const { data: sessionsData } = trpc.sessions.list.useQuery({ limit: 5, offset: 0 });
  const sessions = sessionsData?.rows;
  const { data: grades } = trpc.grades.myHistory.useQuery({ limit: 5 });

  // Auto-redirect dealership admins to /onboarding when their store hasn't
  // finished the 5-step setup. Non-admin F&I managers stay on the dashboard
  // (they can't run onboarding anyway and shouldn't be bounced).
  const onboardingStatus = trpc.onboarding.getStatus.useQuery(undefined, {
    // only run once we know the user's role; spares one round-trip for guests
    enabled: !!user,
  });
  useEffect(() => {
    if (!user || !onboardingStatus.data) return;
    const u = user as { role?: string; isSuperAdmin?: boolean; isGroupAdmin?: boolean };
    const isAdmin = u.role === "admin" || u.isSuperAdmin || u.isGroupAdmin;
    if (!isAdmin) return;
    if (onboardingStatus.data.hasDealership && !onboardingStatus.data.dealership.onboardingComplete) {
      navigate("/onboarding");
    }
  }, [user, onboardingStatus.data, navigate]);

  const avgScore = grades && grades.length > 0
    ? Math.round(grades.reduce((a, g) => a + (g.overallScore ?? 0), 0) / grades.length)
    : null;

  return (
    <AppLayout title="Dashboard" subtitle="Your F&I performance overview">
      <div className="p-6 space-y-6">
        {/* Quick Action Banner */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Ready to start a session?</h2>
              <p className="text-sm text-muted-foreground mt-1">Launch the live co-pilot to get real-time coaching on your next deal.</p>
            </div>
            <Button
              size="lg"
              className="gap-2 font-semibold shrink-0 w-full sm:w-auto"
              onClick={() => navigate("/session/new")}
            >
              <Mic className="w-4 h-4" />
              Start Live Session
            </Button>
          </div>
          <div className="absolute right-32 top-0 bottom-0 hidden sm:flex items-center opacity-5">
            <Zap className="w-40 h-40 text-primary" />
          </div>
        </div>

        {/* Stats Grid */}
        {(() => {
          const s = summary as {
            totalSessions?: number; completedSessions?: number;
            avgScore?: number; avgPvr?: number; avgPpd?: number;
            scriptFidelityAvg?: number; wordTrackUtilizationRate?: number;
            criticalFlags?: number;
          } | undefined;
          const pvr = s?.avgPvr ?? 0;
          const ppd = s?.avgPpd ?? 0;
          const fidelity = s?.scriptFidelityAvg ?? 0;
          const utilization = s?.wordTrackUtilizationRate ?? 0;
          const stats = [
            {
              label: "Avg PVR",
              value: pvr > 0 ? `$${Math.round(pvr).toLocaleString()}` : "—",
              sub: "Per vehicle retailed",
              icon: DollarSign,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
            },
            {
              label: "Avg PPD",
              value: ppd > 0 ? ppd.toFixed(1) : "—",
              sub: "Products per deal",
              icon: Package,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
            },
            {
              label: "Script Fidelity",
              value: fidelity > 0 ? `${Math.round(fidelity)}%` : "—",
              sub: "ASURA script adherence",
              icon: BookOpen,
              color: fidelity >= 80 ? "text-green-400" : fidelity >= 60 ? "text-yellow-400" : "text-red-400",
              bg: fidelity >= 80 ? "bg-green-500/10" : fidelity >= 60 ? "bg-yellow-500/10" : "bg-red-500/10",
            },
            {
              label: "Word Track Usage",
              value: utilization > 0 ? `${utilization}%` : "—",
              sub: "Co-pilot suggestions used",
              icon: ThumbsUp,
              color: "text-violet-400",
              bg: "bg-violet-500/10",
            },
            {
              label: "Compliance Flags",
              value: s?.criticalFlags ?? 0,
              sub: "Critical unresolved",
              icon: AlertTriangle,
              color: (s?.criticalFlags ?? 0) > 0 ? "text-red-400" : "text-green-400",
              bg: (s?.criticalFlags ?? 0) > 0 ? "bg-red-500/10" : "bg-green-500/10",
            },
            {
              label: "Sessions",
              value: s?.totalSessions ?? 0,
              sub: `${s?.completedSessions ?? 0} completed`,
              icon: Mic,
              color: "text-primary",
              bg: "bg-primary/10",
            },
          ];
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {stats.map((stat) => (
                <Card key={stat.label} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                    </div>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs font-semibold text-foreground mt-0.5">{stat.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sessions */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Recent Sessions</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => navigate("/history")}>
                  View all <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {sessions && sessions.length > 0 ? sessions.map((session: (typeof sessions)[number]) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/session/${session.id}`)}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    session.status === "active" ? "bg-green-400 animate-pulse" :
                    session.status === "completed" ? "bg-blue-400" : "bg-muted-foreground"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {session.customerName ?? "Unknown Customer"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.dealType?.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Retail Finance"} •{" "}
                      {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${
                    session.status === "active" ? "border-green-500/30 text-green-400" :
                    session.status === "completed" ? "border-blue-500/30 text-blue-400" : "border-border text-muted-foreground"
                  }`}>
                    {session.status}
                  </Badge>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Mic className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-muted-foreground">No sessions yet</p>
                  <Button size="sm" className="mt-3" onClick={() => navigate("/session/new")}>
                    Start your first session
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Trend */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Performance Scores</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => navigate("/analytics")}>
                  Analytics <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {grades && grades.length > 0 ? (
                <div className="space-y-3">
                  {grades.slice(0, 4).map((grade, i) => (
                    <div key={grade.id} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-primary">{i + 1}</span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(grade.gradedAt), { addSuffix: true })}
                          </span>
                          <span className={`text-xs font-bold ${getScoreColor(grade.overallScore ?? 0)}`}>
                            {grade.overallScore ?? 0}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${grade.overallScore ?? 0}%`,
                              background: grade.overallScore && grade.overallScore >= 85 ? "#4ade80" :
                                grade.overallScore && grade.overallScore >= 70 ? "#facc15" : "#f87171",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-muted-foreground">Complete sessions to see your scores</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Weekly Coaching Insights — full width */}
        <WeeklyCoachingInsights />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ASURA OPS Scorecard Widget */}
          <ASURAScorecardWidget />

          {/* Recent Activity Feed */}
          <RecentActivityFeed />
        </div>

        {/* Session Search */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <SessionSearchBar />
          </CardContent>
        </Card>
      </div>
      <WelcomeScreen />
    </AppLayout>
  );
}

function RecentActivityFeed() {
  const [, navigate] = useLocation();
  const { data: sessionsData } = trpc.sessions.list.useQuery({ limit: 5, offset: 0 });
  const { data: alerts = [] } = trpc.alerts.list.useQuery({ limit: 3 });
  const { data: recoveries } = trpc.dealRecovery.myRecoveries.useQuery({ limit: 2, offset: 0 });

  const items = useMemo(() => {
    const feed: { id: string; icon: React.ReactNode; label: string; detail: string; time: Date; href?: string }[] = [];

    // Last 5 sessions
    for (const s of (sessionsData?.rows ?? []).slice(0, 5)) {
      feed.push({
        id: `s-${s.id}`,
        icon: <Mic className="w-3.5 h-3.5 text-blue-400" />,
        label: s.customerName ?? `Session #${s.id}`,
        detail: `${s.status === "active" ? "In progress" : "Completed"} — ${s.dealType?.replace("_", " ") ?? "session"}`,
        time: new Date(s.startedAt),
        href: `/session/${s.id}`,
      });
    }

    // Last 3 compliance alerts
    for (const a of alerts.slice(0, 3)) {
      feed.push({
        id: `a-${a.id}`,
        icon: <Shield className="w-3.5 h-3.5 text-red-400" />,
        label: a.message,
        detail: a.severity === "critical" ? "Critical compliance flag" : "Warning flag",
        time: new Date(a.createdAt),
        href: a.sessionId ? `/session/${a.sessionId}` : undefined,
      });
    }

    // Last 2 deal recoveries
    for (const r of ((recoveries as Record<string, unknown>[] | undefined) ?? []).slice(0, 2)) {
      feed.push({
        id: `r-${r.id}`,
        icon: <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />,
        label: `Deal Recovery — ${(r.recoveryStatus as string)?.replace("_", " ") ?? "pending"}`,
        detail: r.potentialRevenue ? `$${Number(r.potentialRevenue).toLocaleString()} potential` : "Recovery tracked",
        time: new Date((r.createdAt as string) ?? Date.now()),
      });
    }

    return feed.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10);
  }, [sessionsData, alerts, recoveries]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length > 0 ? items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors"
            onClick={() => item.href && navigate(item.href)}
          >
            <div className="w-7 h-7 rounded-full bg-accent/50 flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{item.label}</p>
              <p className="text-[10px] text-muted-foreground truncate">{item.detail}</p>
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
              {formatDistanceToNow(item.time, { addSuffix: true })}
            </span>
          </div>
        )) : (
          <div className="text-center py-6">
            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-xs text-muted-foreground">No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SessionSearchBar() {
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const { data: results } = trpc.sessions.search.useQuery(
    { query, limit: 5 },
    { enabled: query.length >= 2 }
  );

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sessions by customer, deal number..."
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
        />
      </div>
      {query.length >= 2 && results && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 overflow-hidden">
          {results.map((session: { id: number; customerName: string | null; dealNumber: string | null; startedAt: Date }) => (
            <button
              key={session.id}
              onClick={() => { navigate(`/session/${session.id}`); setQuery(""); }}
              className="w-full px-4 py-2.5 text-left hover:bg-accent flex items-center justify-between text-sm"
            >
              <span className="text-foreground">{session.customerName || `Session #${session.id}`}</span>
              <span className="text-muted-foreground text-xs">{session.dealNumber || ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
