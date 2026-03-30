import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Users, TrendingUp, TrendingDown, Minus, AlertTriangle, Star,
  ArrowUpDown, Building2, MessageSquare, ExternalLink, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "wouter";

// Demo data for trainer view (multiple managers)
const DEMO_MANAGERS = [
  { id: 1, name: "Marcus Rivera", dealership: "Sunrise Honda", score: 87, lastMonthScore: 82, pvr: 3200, compliance: 94, weeklyScores: [80, 83, 85, 87] },
  { id: 2, name: "Jasmine Nguyen", dealership: "Sunset Toyota", score: 92, lastMonthScore: 88, pvr: 3450, compliance: 97, weeklyScores: [88, 89, 91, 92] },
  { id: 3, name: "David Park", dealership: "Valley BMW", score: 74, lastMonthScore: 71, pvr: 2800, compliance: 82, weeklyScores: [70, 72, 73, 74] },
  { id: 4, name: "Sarah Mitchell", dealership: "Sunrise Honda", score: 65, lastMonthScore: 70, pvr: 2400, compliance: 75, weeklyScores: [72, 70, 67, 65] },
  { id: 5, name: "Carlos Mendez", dealership: "Eastside Ford", score: 55, lastMonthScore: 48, pvr: 2100, compliance: 68, weeklyScores: [48, 50, 53, 55] },
  { id: 6, name: "Emily Zhang", dealership: "Valley BMW", score: 81, lastMonthScore: 80, pvr: 3100, compliance: 89, weeklyScores: [80, 80, 81, 81] },
  { id: 7, name: "Robert Williams", dealership: "Eastside Ford", score: 58, lastMonthScore: 62, pvr: 2200, compliance: 70, weeklyScores: [64, 62, 60, 58] },
  { id: 8, name: "Angela Foster", dealership: "Sunset Toyota", score: 78, lastMonthScore: 73, pvr: 2950, compliance: 86, weeklyScores: [73, 75, 76, 78] },
];

type SortKey = "score" | "alpha" | "improved" | "at-risk";

function getColorTier(score: number): "green" | "yellow" | "red" {
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  return "red";
}

function TrendArrow({ current, previous }: { current: number; previous: number }) {
  const delta = current - previous;
  if (delta > 2) return <TrendingUp className="w-4 h-4 text-green-400" />;
  if (delta < -2) return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

function MiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4)}`).join(" ");
  return (
    <svg width={w} height={h}>
      <polyline points={points} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function TrainerDashboard() {
  useEffect(() => { document.title = "Trainer Dashboard | F&I Co-Pilot by ASURA Group"; }, []);
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [filterDealership, setFilterDealership] = useState("all");
  const [coachingModal, setCoachingModal] = useState<{ id: number; name: string } | null>(null);
  const [coachingNote, setCoachingNote] = useState("");

  const managers = DEMO_MANAGERS;
  const dealerships = Array.from(new Set(managers.map((m) => m.dealership)));

  const filtered = useMemo(() => {
    let list = filterDealership === "all" ? managers : managers.filter((m) => m.dealership === filterDealership);
    switch (sortBy) {
      case "score":
        return [...list].sort((a, b) => b.score - a.score);
      case "alpha":
        return [...list].sort((a, b) => a.name.localeCompare(b.name));
      case "improved":
        return [...list].sort((a, b) => (b.score - b.lastMonthScore) - (a.score - a.lastMonthScore));
      case "at-risk":
        return [...list].sort((a, b) => a.score - b.score);
      default:
        return list;
    }
  }, [managers, sortBy, filterDealership]);

  // KPIs
  const avgScore = Math.round(managers.reduce((s, m) => s + m.score, 0) / managers.length);
  const mostImproved = [...managers].sort((a, b) => (b.score - b.lastMonthScore) - (a.score - a.lastMonthScore))[0];
  const mostAtRisk = [...managers].sort((a, b) => a.score - b.score)[0];

  const handleSendNote = () => {
    toast.success(`Coaching note sent to ${coachingModal?.name}`);
    setCoachingModal(null);
    setCoachingNote("");
  };

  const tierColors = {
    green: "border-green-500/30 bg-green-500/5",
    yellow: "border-yellow-500/30 bg-yellow-500/5",
    red: "border-red-500/30 bg-red-500/5",
  };

  return (
    <AppLayout title="Trainer Dashboard" subtitle="Monitor your team's performance">
      <div className="p-6 space-y-6">
        {/* KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Managers</p>
              <p className="text-2xl font-bold text-foreground">{managers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Avg Score This Month</p>
              <p className="text-2xl font-bold text-indigo-400">{avgScore}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Most Improved</p>
              <p className="text-sm font-bold text-green-400">{mostImproved.name}</p>
              <p className="text-xs text-muted-foreground">+{mostImproved.score - mostImproved.lastMonthScore} pts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Most At-Risk</p>
              <p className="text-sm font-bold text-red-400">{mostAtRisk.name}</p>
              <p className="text-xs text-muted-foreground">Score: {mostAtRisk.score}</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sort:</span>
            {(["score", "alpha", "improved", "at-risk"] as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                  sortBy === key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                {key === "score" ? "Score" : key === "alpha" ? "A-Z" : key === "improved" ? "Most Improved" : "At-Risk"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterDealership}
              onChange={(e) => setFilterDealership(e.target.value)}
              className="text-xs bg-card border border-border rounded-lg px-3 py-1.5 text-foreground"
            >
              <option value="all">All Dealerships</option>
              {dealerships.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Manager Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((mgr) => {
            const tier = getColorTier(mgr.score);
            return (
              <Card key={mgr.id} className={cn("transition-all hover:shadow-lg", tierColors[tier])}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{mgr.name}</p>
                      <p className="text-xs text-muted-foreground">{mgr.dealership}</p>
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      tier === "green" ? "border-green-500/30 text-green-400" :
                      tier === "yellow" ? "border-yellow-500/30 text-yellow-400" :
                      "border-red-500/30 text-red-400"
                    )}>
                      {mgr.score}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <TrendArrow current={mgr.score} previous={mgr.lastMonthScore} />
                    <span className="text-xs text-muted-foreground">
                      {mgr.score - mgr.lastMonthScore > 0 ? "+" : ""}{mgr.score - mgr.lastMonthScore} vs last month
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">PVR</p>
                      <p className="font-semibold text-foreground">${mgr.pvr.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Compliance</p>
                      <p className="font-semibold text-foreground">{mgr.compliance}%</p>
                    </div>
                  </div>

                  <MiniSparkline data={mgr.weeklyScores} />

                  <div className="flex gap-2 pt-1">
                    <Link href={`/scorecard?id=${mgr.id}`}>
                      <Button variant="outline" size="sm" className="text-xs gap-1 flex-1">
                        <ExternalLink className="w-3 h-3" /> Scorecard
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1 flex-1"
                      onClick={() => setCoachingModal({ id: mgr.id, name: mgr.name })}
                    >
                      <MessageSquare className="w-3 h-3" /> Coach
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Coaching Note Modal */}
      {coachingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Send Coaching Note</h3>
              <button onClick={() => { setCoachingModal(null); setCoachingNote(""); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">To: {coachingModal.name}</p>
            <textarea
              value={coachingNote}
              onChange={(e) => setCoachingNote(e.target.value)}
              placeholder="Write your coaching note..."
              className="w-full h-32 rounded-lg border border-border bg-background text-foreground p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setCoachingModal(null); setCoachingNote(""); }}>
                Cancel
              </Button>
              <Button onClick={handleSendNote} disabled={!coachingNote.trim()}>
                Send Note
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
