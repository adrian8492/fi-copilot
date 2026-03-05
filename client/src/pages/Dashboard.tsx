import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { useState } from "react";
import { Search } from "lucide-react";

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

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data: summary } = trpc.analytics.summary.useQuery();
  const { data: sessions } = trpc.sessions.list.useQuery({ limit: 5, offset: 0 });
  const { data: grades } = trpc.grades.myHistory.useQuery({ limit: 5 });

  const avgScore = grades && grades.length > 0
    ? Math.round(grades.reduce((a, g) => a + (g.overallScore ?? 0), 0) / grades.length)
    : null;

  return (
    <AppLayout title="Dashboard" subtitle="Your F&I performance overview">
      <div className="p-6 space-y-6">
        {/* Quick Action Banner */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Ready to start a session?</h2>
              <p className="text-sm text-muted-foreground mt-1">Launch the live co-pilot to get real-time coaching on your next deal.</p>
            </div>
            <Button
              size="lg"
              className="gap-2 font-semibold shrink-0"
              onClick={() => navigate("/session/new")}
            >
              <Mic className="w-4 h-4" />
              Start Live Session
            </Button>
          </div>
          <div className="absolute right-32 top-0 bottom-0 flex items-center opacity-5">
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
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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

        <div className="grid lg:grid-cols-2 gap-6">
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
              {sessions && sessions.length > 0 ? sessions.map((session) => (
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
