import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus, GitCompareArrows } from 'lucide-react';

type GradeKey = 'overallScore' | 'rapportScore' | 'productPresentationScore' | 'objectionHandlingScore' | 'closingScore' | 'complianceScore' | 'scriptFidelityScore';

export function SessionComparison() {
  const [session1Id, setSession1Id] = useState<string>('');
  const [session2Id, setSession2Id] = useState<string>('');

  useEffect(() => {
    document.title = "Compare Sessions | F&I Co-Pilot by ASURA Group";
  }, []);

  const { data: sessionsData } = trpc.sessions.list.useQuery({ limit: 100 });
  const sessions = sessionsData?.rows;

  const { data: comparison } = trpc.sessions.compare.useQuery(
    {
      sessionId1: parseInt(session1Id),
      sessionId2: parseInt(session2Id),
    },
    {
      enabled: !!session1Id && !!session2Id,
    }
  );

  const scoreKeys: { key: GradeKey; label: string }[] = [
    { key: 'overallScore', label: 'Overall Score' },
    { key: 'rapportScore', label: 'Rapport' },
    { key: 'productPresentationScore', label: 'Product Presentation' },
    { key: 'objectionHandlingScore', label: 'Objection Handling' },
    { key: 'closingScore', label: 'Closing Technique' },
    { key: 'complianceScore', label: 'Compliance' },
    { key: 'scriptFidelityScore', label: 'Script Fidelity' },
  ];

  const getScoreIndicator = (score1: number, score2: number) => {
    const diff = score1 - score2;
    if (Math.abs(diff) < 0.1) return { icon: Minus, color: 'text-muted-foreground', diff: 0 };
    if (diff > 0) return { icon: ArrowUp, color: 'text-green-500', diff: Math.round(diff * 10) / 10 };
    return { icon: ArrowDown, color: 'text-red-500', diff: Math.round(diff * 10) / 10 };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getGradeValue = (sessionData: any, key: GradeKey): number | null => {
    if (!sessionData) return null;
    const grades = sessionData.performance_grades;
    if (!grades) return null;
    return grades[key] as number | null;
  };

  return (
    <AppLayout title="Session Comparison" subtitle="Side-by-side performance analysis">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <GitCompareArrows className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Compare Two Sessions</h2>
            <p className="text-xs text-muted-foreground">Select two sessions to see grade deltas and differences</p>
          </div>
        </div>

        {/* Session Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">First Session</label>
            <Select value={session1Id} onValueChange={setSession1Id}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Select first session" />
              </SelectTrigger>
              <SelectContent>
                {sessions?.map((session) => (
                  <SelectItem key={session.id} value={session.id.toString()}>
                    {new Date(session.startedAt).toLocaleDateString()} - {session.customerName || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Second Session</label>
            <Select value={session2Id} onValueChange={setSession2Id}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Select second session" />
              </SelectTrigger>
              <SelectContent>
                {sessions?.map((session) => (
                  <SelectItem key={session.id} value={session.id.toString()}>
                    {new Date(session.startedAt).toLocaleDateString()} - {session.customerName || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {comparison && comparison.session1 && comparison.session2 && (
          <>
            {/* Grade Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-sm">
                    {comparison.session1.sessions.customerName || 'Session 1'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scoreKeys.map(({ key, label }) => {
                    const score1 = getGradeValue(comparison.session1, key);
                    const score2 = getGradeValue(comparison.session2, key);
                    const indicator = score1 != null && score2 != null
                      ? getScoreIndicator(score1, score2)
                      : { icon: Minus, color: 'text-muted-foreground', diff: 0 };
                    const Icon = indicator.icon;

                    return (
                      <div key={key} className="flex items-center justify-between py-1">
                        <span className="text-sm text-foreground">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {score1 != null ? score1.toFixed(1) : 'N/A'}
                          </span>
                          <Icon className={cn("h-4 w-4", indicator.color)} />
                          {indicator.diff !== 0 && (
                            <Badge variant="outline" className={cn("text-[10px] px-1",
                              indicator.diff > 0 ? "border-green-500/30 text-green-400" : "border-red-500/30 text-red-400"
                            )}>
                              {indicator.diff > 0 ? "+" : ""}{indicator.diff}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-sm">
                    {comparison.session2.sessions.customerName || 'Session 2'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scoreKeys.map(({ key, label }) => {
                    const score1 = getGradeValue(comparison.session1, key);
                    const score2 = getGradeValue(comparison.session2, key);
                    const indicator = score1 != null && score2 != null
                      ? getScoreIndicator(score2, score1)
                      : { icon: Minus, color: 'text-muted-foreground', diff: 0 };
                    const Icon = indicator.icon;

                    return (
                      <div key={key} className="flex items-center justify-between py-1">
                        <span className="text-sm text-foreground">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {score2 != null ? score2.toFixed(1) : 'N/A'}
                          </span>
                          <Icon className={cn("h-4 w-4", indicator.color)} />
                          {indicator.diff !== 0 && (
                            <Badge variant="outline" className={cn("text-[10px] px-1",
                              indicator.diff > 0 ? "border-green-500/30 text-green-400" : "border-red-500/30 text-red-400"
                            )}>
                              {indicator.diff > 0 ? "+" : ""}{indicator.diff}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Delta Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <GitCompareArrows className="w-4 h-4 text-muted-foreground" />
                  Delta Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {scoreKeys.slice(0, 4).map(({ key, label }) => {
                    const s1 = getGradeValue(comparison.session1, key) ?? 0;
                    const s2 = getGradeValue(comparison.session2, key) ?? 0;
                    const diff = Math.round((s1 - s2) * 10) / 10;
                    return (
                      <div key={key} className="text-center p-3 rounded-lg bg-accent/30 border border-border/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                        <p className={cn("text-lg font-bold", diff > 0 ? "text-green-400" : diff < 0 ? "text-red-400" : "text-muted-foreground")}>
                          {diff > 0 ? "+" : ""}{diff}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {diff > 0 ? "Session 1 leads" : diff < 0 ? "Session 2 leads" : "Equal"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {(!session1Id || !session2Id) && (
          <div className="text-center py-12 text-muted-foreground">
            Select two sessions above to compare their performance metrics side by side.
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default SessionComparison;
