/**
 * AsuraScorecard.tsx
 *
 * 4-pillar ASURA OPS Scorecard UI component.
 * Shows:
 *  - Tier-1 Score (overall, 0–100)
 *  - Radar-style 4-pillar breakdown (using Recharts RadarChart)
 *  - Per-pillar bar scores with criteria detail
 *  - Coaching priorities action list
 *  - Generate button if no scorecard exists
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw, Target, TrendingUp, ShieldCheck, BookOpen,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types (mirrors server-side) ──────────────────────────────────────────────
interface CriterionResult {
  id: string;
  label: string;
  passed: boolean;
  points: number;
  maxPoints: number;
  evidence?: string;
}

interface PillarScore {
  score: number;
  criteria: CriterionResult[];
  insights: string[];
}

interface ScorecardData {
  id: number;
  sessionId: number;
  tier1Score: number;
  tier: string;
  menuOrderScore: number;
  upgradeArchitectureScore: number;
  objectionPreventionScore: number;
  coachingCadenceScore: number;
  menuOrderPillar: PillarScore | null;
  upgradeArchitecturePillar: PillarScore | null;
  objectionPreventionPillar: PillarScore | null;
  coachingCadencePillar: PillarScore | null;
  coachingPriorities: string[] | null;
  gradedAt: string | Date;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string }) {
  const config: Record<string, { cls: string; label: string }> = {
    "Tier-1": { cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", label: "🏆 Tier-1 Operator" },
    "Tier-2": { cls: "bg-amber-500/20 text-amber-400 border-amber-500/40", label: "📈 Tier-2" },
    "Tier-3": { cls: "bg-orange-500/20 text-orange-400 border-orange-500/40", label: "⚠️ Tier-3" },
    "Below-Tier": { cls: "bg-red-500/20 text-red-400 border-red-500/40", label: "🔴 Below Tier" },
  };
  const c = config[tier] ?? config["Below-Tier"];
  return (
    <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border", c.cls)}>
      {c.label}
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 85 ? "#10b981" :
    score >= 70 ? "#f59e0b" :
    score >= 55 ? "#f97316" :
    "#ef4444";

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
        <circle
          cx="50" cy="50" r="40" fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      <div className="relative text-center">
        <p className="text-2xl font-bold" style={{ color }}>{score}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight">Tier-1<br />Score</p>
      </div>
    </div>
  );
}

function PillarBar({
  label, score, icon: Icon, pillar,
}: {
  label: string;
  score: number;
  icon: React.ElementType;
  pillar: PillarScore | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const color =
    score >= 85 ? "bg-emerald-500" :
    score >= 70 ? "bg-amber-500" :
    score >= 55 ? "bg-orange-500" :
    "bg-red-500";
  const textColor =
    score >= 85 ? "text-emerald-400" :
    score >= 70 ? "text-amber-400" :
    score >= 55 ? "text-orange-400" :
    "text-red-400";

  return (
    <div className="space-y-2">
      <div
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setExpanded(!expanded)}
      >
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground flex-1">{label}</span>
        <span className={cn("text-sm font-bold tabular-nums", textColor)}>{score}/100</span>
        {pillar && (
          expanded
            ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Expandable criteria detail */}
      {expanded && pillar && (
        <div className="pl-6 space-y-3 pt-1">
          {/* Criteria list */}
          <div className="space-y-2">
            {pillar.criteria.map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                {c.passed
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  : <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-foreground">{c.label}</span>
                    <span className={cn("text-xs font-semibold tabular-nums shrink-0", c.passed ? "text-emerald-400" : "text-muted-foreground")}>
                      {c.points}/{c.maxPoints}
                    </span>
                  </div>
                  {c.evidence && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{c.evidence}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Insights */}
          {pillar.insights.length > 0 && (
            <div className="space-y-1.5">
              {pillar.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-1.5 p-2 rounded-md bg-accent/30 border border-border">
                  <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Radar Chart Data ─────────────────────────────────────────────────────────

function ScorecardRadar({ scorecard }: { scorecard: ScorecardData }) {
  const data = [
    { pillar: "Menu Order", score: scorecard.menuOrderScore, fullMark: 100 },
    { pillar: "Upgrade Arch.", score: scorecard.upgradeArchitectureScore, fullMark: 100 },
    { pillar: "Objection Prev.", score: scorecard.objectionPreventionScore, fullMark: 100 },
    { pillar: "Coaching Cadence", score: scorecard.coachingCadenceScore, fullMark: 100 },
  ];

  const tier1Score = scorecard.tier1Score;
  const fillColor =
    tier1Score >= 85 ? "#10b981" :
    tier1Score >= 70 ? "#f59e0b" :
    tier1Score >= 55 ? "#f97316" :
    "#ef4444";

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="pillar"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke={fillColor}
          fill={fillColor}
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            color: "hsl(var(--foreground))",
            fontSize: "12px",
          }}
          formatter={(value: number) => [`${value}/100`, "Score"]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface AsuraScorecardProps {
  sessionId: number;
  hasTranscript: boolean;
}

export function AsuraScorecard({ sessionId, hasTranscript }: AsuraScorecardProps) {
  const utils = trpc.useUtils();

  const { data: scorecard, isLoading } = trpc.scorecards.getBySession.useQuery({ sessionId });

  const scoreMutation = trpc.scorecards.score.useMutation({
    onSuccess: () => {
      utils.scorecards.getBySession.invalidate({ sessionId });
      utils.scorecards.myAverage.invalidate();
      toast.success("ASURA OPS Scorecard generated!");
    },
    onError: (err) => toast.error(err.message || "Scorecard generation failed."),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!scorecard) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-14 text-center space-y-4">
          <Target className="w-12 h-12 text-muted-foreground mx-auto opacity-30" />
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">ASURA OPS Scorecard</p>
            <p className="text-xs text-muted-foreground">
              No scorecard generated yet. Run the 4-pillar analysis to get the Tier-1 Score.
            </p>
          </div>
          {hasTranscript ? (
            <Button
              onClick={() => scoreMutation.mutate({ sessionId })}
              disabled={scoreMutation.isPending}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", scoreMutation.isPending && "animate-spin")} />
              {scoreMutation.isPending ? "Scoring..." : "Generate ASURA Scorecard"}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              A transcript is required before scoring. Record audio first.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const typed = scorecard as unknown as ScorecardData;

  return (
    <div className="space-y-6">
      {/* Header Row: Score Ring + Tier Badge + Re-score */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Score Ring */}
            <ScoreRing score={typed.tier1Score} />

            {/* Right side */}
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
                <div>
                  <h3 className="text-lg font-bold text-foreground">ASURA OPS Scorecard</h3>
                  <p className="text-xs text-muted-foreground">
                    4-pillar evaluation • Graded {new Date(typed.gradedAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </p>
                </div>
                <div className="sm:ml-auto">
                  <TierBadge tier={typed.tier} />
                </div>
              </div>

              {/* Pillar score chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Menu Order", score: typed.menuOrderScore },
                  { label: "Upgrade Arch.", score: typed.upgradeArchitectureScore },
                  { label: "Objection Prev.", score: typed.objectionPreventionScore },
                  { label: "Coaching Cadence", score: typed.coachingCadenceScore },
                ].map(({ label, score }) => (
                  <div
                    key={label}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-semibold border",
                      score >= 85 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                      score >= 70 ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                      score >= 55 ? "bg-orange-500/10 border-orange-500/30 text-orange-400" :
                      "bg-red-500/10 border-red-500/30 text-red-400"
                    )}
                  >
                    {label}: {score}
                  </div>
                ))}
              </div>

              {/* Re-score button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => scoreMutation.mutate({ sessionId })}
                disabled={scoreMutation.isPending}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", scoreMutation.isPending && "animate-spin")} />
                Re-score
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              4-Pillar Radar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScorecardRadar scorecard={typed} />
          </CardContent>
        </Card>

        {/* Pillar Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pillar Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">Click a pillar to see criteria detail</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <PillarBar
              label="Menu Order System"
              score={typed.menuOrderScore}
              icon={BookOpen}
              pillar={typed.menuOrderPillar}
            />
            <PillarBar
              label="Upgrade Architecture"
              score={typed.upgradeArchitectureScore}
              icon={TrendingUp}
              pillar={typed.upgradeArchitecturePillar}
            />
            <PillarBar
              label="Objection Prevention"
              score={typed.objectionPreventionScore}
              icon={ShieldCheck}
              pillar={typed.objectionPreventionPillar}
            />
            <PillarBar
              label="Coaching Cadence"
              score={typed.coachingCadenceScore}
              icon={RefreshCw}
              pillar={typed.coachingCadencePillar}
            />
          </CardContent>
        </Card>
      </div>

      {/* Coaching Priorities */}
      {typed.coachingPriorities && typed.coachingPriorities.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Top Coaching Priorities
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Ranked by impact — fix these first to move the score
            </p>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {typed.coachingPriorities.map((priority, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground leading-relaxed">{priority}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AsuraScorecard;
