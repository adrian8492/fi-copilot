import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

type GradeKey = 'overallScore' | 'rapportScore' | 'productPresentationScore' | 'objectionHandlingScore' | 'closingScore' | 'complianceScore' | 'scriptFidelityScore';

export function SessionComparison() {
  const [session1Id, setSession1Id] = useState<string>('');
  const [session2Id, setSession2Id] = useState<string>('');

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
    if (Math.abs(diff) < 0.1) return { icon: Minus, color: 'text-muted-foreground' };
    if (diff > 0) return { icon: ArrowUp, color: 'text-green-500' };
    return { icon: ArrowDown, color: 'text-red-500' };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getGradeValue = (sessionData: any, key: GradeKey): number | null => {
    if (!sessionData) return null;
    const grades = sessionData.performance_grades;
    if (!grades) return null;
    return grades[key] as number | null;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Session Comparison</h1>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground mb-2 block">
              First Session
            </label>
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
          
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Second Session
            </label>
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
      </div>

      {comparison && comparison.session1 && comparison.session2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">
                {comparison.session1.sessions.customerName || 'Session 1'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {scoreKeys.map(({ key, label }) => {
                const score1 = getGradeValue(comparison.session1, key);
                const score2 = getGradeValue(comparison.session2, key);
                const indicator = score1 != null && score2 != null
                  ? getScoreIndicator(score1, score2)
                  : { icon: Minus, color: 'text-muted-foreground' };
                const Icon = indicator.icon;
                
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-foreground">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {score1 != null ? score1.toFixed(1) : 'N/A'}
                      </span>
                      <Icon className={cn("h-4 w-4", indicator.color)} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">
                {comparison.session2.sessions.customerName || 'Session 2'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {scoreKeys.map(({ key, label }) => {
                const score1 = getGradeValue(comparison.session1, key);
                const score2 = getGradeValue(comparison.session2, key);
                const indicator = score1 != null && score2 != null
                  ? getScoreIndicator(score2, score1)
                  : { icon: Minus, color: 'text-muted-foreground' };
                const Icon = indicator.icon;
                
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-foreground">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {score2 != null ? score2.toFixed(1) : 'N/A'}
                      </span>
                      <Icon className={cn("h-4 w-4", indicator.color)} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {(!session1Id || !session2Id) && (
        <div className="text-center py-12 text-muted-foreground">
          Select two sessions above to compare their performance metrics side by side.
        </div>
      )}
    </div>
  );
}

export default SessionComparison;
