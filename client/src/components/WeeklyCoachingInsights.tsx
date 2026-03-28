import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Flame,
  AlertTriangle,
  Award,
  ChevronRight,
} from "lucide-react";

const SCORE_CATEGORIES = [
  { key: "scriptFidelityScore", label: "Script Fidelity" },
  { key: "rapportScore", label: "Rapport" },
  { key: "objectionHandlingScore", label: "Objection Handling" },
  { key: "closingTechniqueScore", label: "Closing Technique" },
  { key: "productPresentationScore", label: "Product Presentation" },
] as const;

type ScoreKey = (typeof SCORE_CATEGORIES)[number]["key"];

function avgForKey(grades: Record<string, unknown>[], key: string): number {
  const valid = grades
    .map((g) => g[key])
    .filter((v): v is number => typeof v === "number" && v > 0);
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

export default function WeeklyCoachingInsights() {
  const { data: grades, isLoading } = trpc.grades.myHistory.useQuery({
    limit: 20,
  });

  const insights = useMemo(() => {
    if (!grades || grades.length === 0) return null;

    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    const thisWeek = grades.filter((g) => {
      const t = new Date(g.gradedAt).getTime();
      return now - t <= sevenDays;
    });

    const priorWeek = grades.filter((g) => {
      const t = new Date(g.gradedAt).getTime();
      return now - t > sevenDays && now - t <= sevenDays * 2;
    });

    if (thisWeek.length === 0) return null;

    // Compute avg subscores this week
    const categoryAvgs = SCORE_CATEGORIES.map((cat) => ({
      ...cat,
      avg: avgForKey(thisWeek as Record<string, unknown>[], cat.key),
    })).filter((c) => c.avg > 0);

    const bestArea =
      categoryAvgs.length > 0
        ? categoryAvgs.reduce((best, c) => (c.avg > best.avg ? c : best))
        : null;

    const weakestArea =
      categoryAvgs.length > 0
        ? categoryAvgs.reduce((worst, c) => (c.avg < worst.avg ? c : worst))
        : null;

    // Trend: compare overall avg this week vs prior week
    const thisWeekAvg = avgForKey(
      thisWeek as Record<string, unknown>[],
      "overallScore",
    );
    const priorWeekAvg = avgForKey(
      priorWeek as Record<string, unknown>[],
      "overallScore",
    );

    let trend: "up" | "down" | "flat" = "flat";
    if (priorWeek.length > 0) {
      const diff = thisWeekAvg - priorWeekAvg;
      if (diff > 2) trend = "up";
      else if (diff < -2) trend = "down";
    }

    // Streak: consecutive grades from most recent with overallScore >= 80
    let streak = 0;
    for (const g of grades) {
      if (typeof g.overallScore === "number" && g.overallScore >= 80) {
        streak++;
      } else {
        break;
      }
    }

    return {
      thisWeekCount: thisWeek.length,
      thisWeekAvg: Math.round(thisWeekAvg * 10) / 10,
      bestArea,
      weakestArea:
        weakestArea && bestArea && weakestArea.key !== bestArea.key
          ? weakestArea
          : null,
      trend,
      streak,
      priorWeekAvg: Math.round(priorWeekAvg * 10) / 10,
    };
  }, [grades]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-purple-500" />
            Weekly Coaching Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading insights...</p>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-purple-500" />
            Weekly Coaching Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete sessions to see coaching insights
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-5 w-5 text-purple-500" />
          Weekly Coaching Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trend indicator */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Avg Score This Week
          </span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{insights.thisWeekAvg}</span>
            {insights.trend === "up" && (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Improving</span>
              </div>
            )}
            {insights.trend === "down" && (
              <div className="flex items-center gap-1 text-red-500">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-medium">Declining</span>
              </div>
            )}
            {insights.trend === "flat" && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Minus className="h-4 w-4" />
                <span className="text-xs font-medium">Steady</span>
              </div>
            )}
          </div>
        </div>

        {/* Best area */}
        {insights.bestArea && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-green-600" />
              <span className="text-sm">Best Area</span>
            </div>
            <Badge
              variant="secondary"
              className={cn(
                "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
              )}
            >
              {insights.bestArea.label} ({Math.round(insights.bestArea.avg)})
            </Badge>
          </div>
        )}

        {/* Weakest area */}
        {insights.weakestArea && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-500" />
              <span className="text-sm">Focus Here This Week</span>
            </div>
            <Badge
              variant="secondary"
              className={cn(
                "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
              )}
            >
              {insights.weakestArea.label} (
              {Math.round(insights.weakestArea.avg)})
            </Badge>
          </div>
        )}

        {/* Streak */}
        {insights.streak > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm">Hot Streak</span>
            </div>
            <span className="text-sm font-semibold text-orange-600">
              {insights.streak} session{insights.streak !== 1 ? "s" : ""} above
              80
            </span>
          </div>
        )}

        {/* Session count */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Based on {insights.thisWeekCount} session
            {insights.thisWeekCount !== 1 ? "s" : ""} in the last 7 days
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
