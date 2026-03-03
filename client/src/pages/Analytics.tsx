import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Star, Mic, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
          </div>
          <Icon className={cn("w-5 h-5 mt-1", color)} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const { data: summary } = trpc.analytics.summary.useQuery();
  const { data: gradeTrend } = trpc.analytics.myGradeTrend.useQuery({ limit: 15 });

  const trendData = gradeTrend?.map((g, i) => ({
    session: `S${i + 1}`,
    score: g.overallScore ?? 0,
    rapport: g.rapportScore ?? 0,
    objections: g.objectionHandlingScore ?? 0,
    closing: g.closingTechniqueScore ?? 0,
  })).reverse() ?? [];

  const avgScore = trendData.length > 0
    ? Math.round(trendData.reduce((a, b) => a + b.score, 0) / trendData.length)
    : 0;

  return (
    <AppLayout title="Analytics" subtitle="Performance trends and insights">
      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Sessions"
            value={summary?.totalSessions ?? 0}
            icon={Mic}
            color="text-blue-400"
          />
          <StatCard
            label="Avg Overall Score"
            value={summary?.avgScore ? `${Math.round(summary.avgScore)}%` : "—"}
            icon={Star}
            color="text-yellow-400"
          />
          <StatCard
            label="Avg Duration"
            value={summary?.totalGrades ? `${summary.totalGrades} graded` : "—"}
            icon={Clock}
            color="text-purple-400"
          />
          <StatCard
            label="Score Trend"
            value={avgScore > 0 ? `${avgScore}%` : "—"}
            icon={TrendingUp}
            color={avgScore >= 80 ? "text-green-400" : avgScore >= 65 ? "text-yellow-400" : "text-red-400"}
          />
        </div>

        {/* Score Trend Chart */}
        {trendData.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Score Trend (Last {trendData.length} Sessions)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="session" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Overall" />
                  <Line type="monotone" dataKey="rapport" stroke="#60a5fa" strokeWidth={1.5} dot={false} name="Rapport" />
                  <Line type="monotone" dataKey="objections" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Objections" />
                  <Line type="monotone" dataKey="closing" stroke="#34d399" strokeWidth={1.5} dot={false} name="Closing" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Category Breakdown */}
        {trendData.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trendData.slice(-8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="session" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  />
                  <Legend />
                  <Bar dataKey="rapport" fill="#60a5fa" name="Rapport" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="objections" fill="#f59e0b" name="Objections" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="closing" fill="#34d399" name="Closing" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {trendData.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="py-16 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-sm font-medium text-muted-foreground">
                Complete sessions and generate grades to see your analytics
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
