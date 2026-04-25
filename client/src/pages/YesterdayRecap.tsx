import { useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Sun,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  Coffee,
  ArrowRight,
  Clock,
  Target,
} from "lucide-react";
import { useLocation } from "wouter";

/**
 * /yesterday-recap — Brian Benstock's #1 ask. Phone-first, scannable in 2 min.
 *
 * Spec sections (from fi-copilot-benstock-pilot-sprint.md):
 *   1. Yesterday headline (1-sentence summary)
 *   2. The Numbers (5 stat cards)
 *   3. Deals that need action today
 *   4. Manager performance pulse
 *   5. Coaching moments
 *   6. Today's 3 decisions (AI-suggested — Phase 4)
 */
export default function YesterdayRecap() {
  const [, navigate] = useLocation();
  // Auto-refresh every 10 min so the page stays current through the morning.
  // Brian opens this over coffee — we want fresh numbers when he checks back.
  const recap = trpc.recaps.yesterday.useQuery(undefined, {
    refetchInterval: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const date = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }, []);

  if (recap.isLoading) {
    return (
      <AppLayout title="Yesterday's recap">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (recap.isError || !recap.data) {
    return (
      <AppLayout title="Yesterday's recap">
        <div className="max-w-md mx-auto p-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {recap.error?.message ?? "Unable to load recap. Try again later."}
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const data = recap.data;
  const stoneEagleNotYet = data.numbers.vsaPenetration === null;

  return (
    <AppLayout title="Yesterday's recap">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5 pb-20">
        {/* Header — date + coffee icon (it's the morning brief) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Morning brief</p>
              <h1 className="text-lg font-bold text-foreground">{date}</h1>
            </div>
          </div>
          <Sun className="w-5 h-5 text-amber-400" />
        </div>

        {/* 1. Headline */}
        <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/30">
          <CardContent className="pt-5 pb-5">
            <p className="text-base leading-relaxed text-foreground font-medium">
              {data.headline}
            </p>
          </CardContent>
        </Card>

        {/* 1.5 — Today's 3 decisions (auto-derived from yesterday's worst signals) */}
        {data.decisions && data.decisions.length > 0 && (
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Today's {data.decisions.length} decision{data.decisions.length === 1 ? "" : "s"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.decisions.map((d, idx) => (
                <button
                  key={d.id}
                  onClick={() => navigate(d.href)}
                  className="w-full text-left flex items-start gap-3 p-3 rounded-md border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-sm text-foreground leading-snug">{d.text}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 2. The Numbers */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            The Numbers
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Units delivered" value={String(data.numbers.unitsDelivered)} />
            <StatCard label="Avg F&I PRU" value={`$${data.numbers.avgPru.toLocaleString()}`} />
            <StatCard label="Avg overall score" value={`${data.numbers.avgScore}`} suffix="/100" />
            <StatCard label="Pending sessions" value={String(data.numbers.pendingSessions)} />
          </div>
          {stoneEagleNotYet && (
            <p className="mt-2 text-xs text-muted-foreground italic flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              VSA / GAP penetration + front/back gross come online with the
              first StoneEagle nightly import.
            </p>
          )}
        </div>

        {/* 3. Deals that need action today */}
        {(data.numbers.thinDeals > 0 || data.numbers.criticalUnresolvedFlags > 0 || data.numbers.pendingSessions > 0) && (
          <Card className="border-amber-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Deals that need action today
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {data.numbers.criticalUnresolvedFlags > 0 && (
                <ActionRow
                  label={`${data.numbers.criticalUnresolvedFlags} critical compliance flag${data.numbers.criticalUnresolvedFlags === 1 ? "" : "s"} unresolved`}
                  onClick={() => navigate("/compliance-audit")}
                />
              )}
              {data.numbers.thinDeals > 0 && (
                <ActionRow
                  label={`${data.numbers.thinDeals} thin deal${data.numbers.thinDeals === 1 ? "" : "s"} (PRU < $1,200) — re-contact opportunity`}
                  onClick={() => navigate("/eagle-eye")}
                />
              )}
              {data.numbers.pendingSessions > 0 && (
                <ActionRow
                  label={`${data.numbers.pendingSessions} pending session${data.numbers.pendingSessions === 1 ? "" : "s"} not yet completed`}
                  onClick={() => navigate("/history")}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* 4. Manager performance pulse */}
        {data.managers.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Manager performance pulse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.managers.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/scorecard?userId=${m.userId}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.sessionCount} session{m.sessionCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold">${m.avgPru.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{m.avgScore}/100</p>
                    </div>
                    {m.avgPru >= 1700 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : m.avgPru >= 1200 ? (
                      <Badge variant="outline" className="text-xs">flat</Badge>
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 5. Coaching moments */}
        {data.coachingMoments.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Coaching moments from yesterday
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.coachingMoments.map((m, idx) => (
                <div
                  key={`${m.sessionId}-${idx}`}
                  className="p-3 rounded-md border border-border bg-card"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-foreground">{m.manager}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => navigate(`/session/${m.sessionId}`)}
                    >
                      Deal #{m.sessionId} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{m.suggestion}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Empty state if no data at all */}
        {data.numbers.unitsDelivered === 0 && data.coachingMoments.length === 0 && (
          <Card>
            <CardContent className="pt-6 pb-6 text-center">
              <p className="text-sm text-muted-foreground">
                No deal activity yesterday. Check back after today's deliveries
                are written up.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">
        {value}
        {suffix && <span className="text-sm font-normal text-muted-foreground ml-0.5">{suffix}</span>}
      </p>
    </div>
  );
}

function ActionRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
    >
      <span className="text-sm text-foreground">{label}</span>
      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}
