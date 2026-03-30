import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, AlertCircle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const OBJECTION_TYPES = ["Price/Payment", "Rate", "Trade Value", "Not Needed", "Think About It"] as const;

const TYPE_COLORS: Record<string, string> = {
  "Price/Payment": "#ef4444",
  "Rate": "#f59e0b",
  "Trade Value": "#6366f1",
  "Not Needed": "#8b5cf6",
  "Think About It": "#06b6d4",
};

const WORD_TRACKS: Record<string, string> = {
  "Price/Payment": "Compared to what? Let me show you what the actual monthly impact is — most customers are surprised it's less than a cup of coffee a day.",
  "Rate": "I hear you on the rate. The good news is this protection locks in at today's cost — if you finance it into your payment, you're covering yourself without a separate bill.",
  "Trade Value": "I understand — you feel the trade number should be higher. Let me show you how the F&I products actually increase the total value of this deal for you.",
  "Not Needed": "Most people feel that way at first. The customers who are most glad they added protection are the ones who never thought they'd need it.",
  "Think About It": "Of course. What specifically were you still on the fence about? I want to make sure I've answered all your questions before you leave today.",
};

// Generate 8 weeks of demo trend data
function generateTrendData() {
  const weeks: Array<Record<string, number | string>> = [];
  const now = new Date(2026, 2, 29);
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - w * 7);
    const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const row: Record<string, number | string> = { week: label };
    // Simulated trends
    row["Price/Payment"] = 12 + Math.floor(Math.random() * 8) + (7 - w);
    row["Rate"] = 6 + Math.floor(Math.random() * 5);
    row["Trade Value"] = 4 + Math.floor(Math.random() * 4);
    row["Not Needed"] = 8 + Math.floor(Math.random() * 6) - Math.floor(w * 0.5);
    row["Think About It"] = 10 + Math.floor(Math.random() * 5);
    weeks.push(row);
  }
  return weeks;
}

interface TrendBadge {
  type: string;
  label: "Fastest Growing" | "Trending Down";
  delta: number;
}

function computeTrendBadges(data: Array<Record<string, number | string>>): TrendBadge[] {
  if (data.length < 2) return [];
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  let maxDelta = -Infinity;
  let minDelta = Infinity;
  let fastestGrowing = "";
  let trendingDown = "";

  for (const type of OBJECTION_TYPES) {
    const delta = (last[type] as number) - (prev[type] as number);
    if (delta > maxDelta) { maxDelta = delta; fastestGrowing = type; }
    if (delta < minDelta) { minDelta = delta; trendingDown = type; }
  }

  const badges: TrendBadge[] = [];
  if (maxDelta > 0) badges.push({ type: fastestGrowing, label: "Fastest Growing", delta: maxDelta });
  if (minDelta < 0) badges.push({ type: trendingDown, label: "Trending Down", delta: minDelta });
  return badges;
}

export default function ObjectionTrendTracker() {
  const trendData = useMemo(generateTrendData, []);
  const badges = useMemo(() => computeTrendBadges(trendData), [trendData]);

  // Table data: compare this week vs last week
  const thisWeek = trendData[trendData.length - 1];
  const lastWeek = trendData[trendData.length - 2];

  const tableRows = OBJECTION_TYPES.map((type) => {
    const current = (thisWeek?.[type] as number) ?? 0;
    const previous = (lastWeek?.[type] as number) ?? 0;
    const deltaPct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;
    return { type, current, previous, deltaPct };
  });

  // Focus area: top objection type this week
  const focusType = tableRows.sort((a, b) => b.current - a.current)[0];

  return (
    <div className="space-y-6">
      {/* Line Chart */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Objection Frequency — Last 8 Weeks</CardTitle>
            <div className="flex gap-2">
              {badges.map((b) => (
                <Badge
                  key={b.type}
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    b.label === "Fastest Growing" ? "border-red-500/30 text-red-400" : "border-green-500/30 text-green-400"
                  )}
                >
                  {b.label === "Fastest Growing" ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {b.type}: {b.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Legend />
              {OBJECTION_TYPES.map((type) => (
                <Line
                  key={type}
                  type="monotone"
                  dataKey={type}
                  stroke={TYPE_COLORS[type]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Comparison Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            Week-over-Week Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">Objection Type</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground">This Week</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground">Last Week</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground">Delta %</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground">Trend</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.type} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[row.type] }} />
                        <span className="font-medium text-foreground">{row.type}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-foreground">{row.current}</td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground">{row.previous}</td>
                    <td className={cn("py-2.5 px-3 text-center font-semibold", row.deltaPct > 0 ? "text-red-400" : row.deltaPct < 0 ? "text-green-400" : "text-muted-foreground")}>
                      {row.deltaPct > 0 ? "+" : ""}{row.deltaPct}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.deltaPct > 0 ? <TrendingUp className="w-4 h-4 text-red-400 mx-auto" /> :
                       row.deltaPct < 0 ? <TrendingDown className="w-4 h-4 text-green-400 mx-auto" /> :
                       <Minus className="w-4 h-4 text-muted-foreground mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Focus Area Card */}
      {focusType && (
        <Card className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              Focus Area This Week: {focusType.type}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">{focusType.current} objections this week — highest volume</p>
            <div className="bg-card/50 rounded-lg p-3 border border-border">
              <p className="text-xs font-semibold text-primary mb-1">ASURA Word Track</p>
              <p className="text-sm text-foreground italic">"{WORD_TRACKS[focusType.type]}"</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
