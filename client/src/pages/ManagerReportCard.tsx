import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Printer,
  Share2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  ClipboardCopy,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────
interface CategoryScore {
  category: string;
  key: string;
  weight: number;
  score: number;
}

interface MonthData {
  month: string;
  scores: CategoryScore[];
}

interface Manager {
  id: string;
  name: string;
  initials: string;
  months: MonthData[];
}

// ── Grade helpers ───────────────────────────────────────────────────
function letterGrade(score: number): string {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 63) return "D";
  if (score >= 60) return "D-";
  return "F";
}

function gpa(score: number): number {
  const grade = letterGrade(score);
  const map: Record<string, number> = {
    "A+": 4.0, A: 4.0, "A-": 3.7,
    "B+": 3.3, B: 3.0, "B-": 2.7,
    "C+": 2.3, C: 2.0, "C-": 1.7,
    "D+": 1.3, D: 1.0, "D-": 0.7,
    F: 0.0,
  };
  return map[grade] ?? 0.0;
}

function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "text-emerald-500";
  if (grade.startsWith("B")) return "text-blue-500";
  if (grade.startsWith("C")) return "text-amber-500";
  if (grade.startsWith("D")) return "text-orange-500";
  return "text-red-500";
}

function gradeBadgeVariant(grade: string): "default" | "secondary" | "destructive" | "outline" {
  if (grade.startsWith("A") || grade.startsWith("B")) return "default";
  if (grade.startsWith("C")) return "secondary";
  return "destructive";
}

// ── Categories ──────────────────────────────────────────────────────
const CATEGORIES = [
  { category: "PVR", key: "pvr", weight: 0.35 },
  { category: "Product Penetration", key: "penetration", weight: 0.25 },
  { category: "Compliance Score", key: "compliance", weight: 0.20 },
  { category: "Coaching Adherence", key: "coaching", weight: 0.10 },
  { category: "Customer Satisfaction", key: "csat", weight: 0.10 },
];

// ── Months ──────────────────────────────────────────────────────────
const MONTHS = [
  { value: "2025-11", label: "November 2025" },
  { value: "2025-12", label: "December 2025" },
  { value: "2026-01", label: "January 2026" },
  { value: "2026-02", label: "February 2026" },
  { value: "2026-03", label: "March 2026" },
  { value: "2026-04", label: "April 2026" },
];

// ── Seeded random ───────────────────────────────────────────────────
function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Demo data ───────────────────────────────────────────────────────
const MANAGER_NAMES = [
  { name: "Sarah Mitchell", initials: "SM" },
  { name: "James Rodriguez", initials: "JR" },
  { name: "Ashley Chen", initials: "AC" },
  { name: "Marcus Thompson", initials: "MT" },
  { name: "Rachel Kim", initials: "RK" },
  { name: "David Patel", initials: "DP" },
  { name: "Lauren Williams", initials: "LW" },
  { name: "Chris Martinez", initials: "CM" },
];

function generateManagers(): Manager[] {
  return MANAGER_NAMES.map((m, mi) => {
    const rand = seededRand((mi + 1) * 7919);
    // Base scores per category (manager personality)
    const bases = [
      60 + Math.floor(rand() * 30), // pvr
      55 + Math.floor(rand() * 35), // penetration
      70 + Math.floor(rand() * 25), // compliance
      60 + Math.floor(rand() * 30), // coaching
      65 + Math.floor(rand() * 30), // csat
    ];
    const months: MonthData[] = MONTHS.map((mo) => {
      const scores: CategoryScore[] = CATEGORIES.map((cat, ci) => {
        const drift = Math.floor(rand() * 15) - 5;
        const score = Math.max(45, Math.min(100, bases[ci] + drift));
        return { ...cat, score };
      });
      return { month: mo.value, scores };
    });
    return {
      id: `mgr-${mi + 1}`,
      name: m.name,
      initials: m.initials,
      months,
    };
  });
}

const MANAGERS = generateManagers();

// ── Chart colors ────────────────────────────────────────────────────
const COLORS = {
  blue: "#3b82f6",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  purple: "#8b5cf6",
};
const CATEGORY_COLORS = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.red, COLORS.purple];

// ── Coaching narrative ──────────────────────────────────────────────
function coachingNarrative(name: string, scores: CategoryScore[], overall: number): string {
  const grade = letterGrade(overall);
  const firstName = name.split(" ")[0];
  const sorted = [...scores].sort((a, b) => a.score - b.score);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  if (grade.startsWith("A")) {
    return `${firstName} is performing at an elite level this month. Their strongest area is ${strongest.category} (${strongest.score}/100), which sets a benchmark for the team. To sustain this trajectory, focus on mentoring peers and exploring advanced product bundling strategies. Even top performers benefit from stretch goals — consider targeting a perfect compliance score next month.`;
  }
  if (grade.startsWith("B")) {
    return `${firstName} is delivering solid, above-average results. ${strongest.category} (${strongest.score}/100) is a clear strength. The primary opportunity lies in ${weakest.category} (${weakest.score}/100), which is pulling the overall grade down. A focused 30-day improvement plan on ${weakest.category} could push ${firstName} into the A-tier. Schedule a mid-month check-in to track progress.`;
  }
  if (grade.startsWith("C")) {
    return `${firstName} is performing at an average level with room for meaningful improvement. ${weakest.category} (${weakest.score}/100) needs immediate attention, while ${strongest.category} (${strongest.score}/100) shows capability. Recommend daily coaching touchpoints and structured role-play sessions targeting the bottom two categories. Set a 2-week milestone to reassess.`;
  }
  return `${firstName} is significantly below expectations this month. ${weakest.category} (${weakest.score}/100) is critically low. An intensive performance improvement plan is required: daily 1-on-1 sessions, shadowing a top performer, and structured product training. If scores do not improve within 60 days, consider role reassignment. ${strongest.category} (${strongest.score}/100) is the one bright spot to build confidence from.`;
}

// ── Improvement plan ────────────────────────────────────────────────
function improvementActions(cat: CategoryScore): string[] {
  const actions: Record<string, string[]> = {
    pvr: [
      "Review top 10 highest-PVR deals from last quarter and identify common product bundles",
      "Practice 3 value-building word tracks daily before first customer interaction",
      "Shadow the highest-PVR manager for 2 full sessions this week",
    ],
    penetration: [
      "Audit last 20 deals to identify which products were not presented",
      "Implement a mandatory full-menu presentation checklist for every deal",
      "Complete the advanced product knowledge certification by end of month",
    ],
    compliance: [
      "Review all compliance deficiencies from last audit and create corrective action plan",
      "Complete the quarterly compliance refresher training module",
      "Implement a pre-submission deal jacket checklist to catch errors before funding",
    ],
    coaching: [
      "Attend all scheduled coaching sessions — zero missed sessions this month",
      "Complete assigned role-play exercises within 48 hours of assignment",
      "Submit weekly self-assessment reports to training manager",
    ],
    csat: [
      "Review all negative customer feedback from last month and identify patterns",
      "Practice empathy-first communication framework in every customer interaction",
      "Follow up with 5 recent customers to gather improvement feedback",
    ],
  };
  return actions[cat.key] ?? ["Develop a targeted improvement plan with your direct supervisor"];
}

// ── Component ───────────────────────────────────────────────────────
export default function ManagerReportCard() {
  const [selectedManager, setSelectedManager] = useState(MANAGERS[0].id);
  const [selectedMonth, setSelectedMonth] = useState("2026-04");

  useEffect(() => {
    document.title = "F&I Manager Report Card | F&I Co-Pilot by ASURA Group";
  }, []);

  const manager = useMemo(
    () => MANAGERS.find((m) => m.id === selectedManager) ?? MANAGERS[0],
    [selectedManager]
  );

  const monthData = useMemo(
    () => manager.months.find((m) => m.month === selectedMonth) ?? manager.months[manager.months.length - 1],
    [manager, selectedMonth]
  );

  const overallScore = useMemo(() => {
    return Math.round(
      monthData.scores.reduce((sum, s) => sum + s.score * s.weight, 0)
    );
  }, [monthData]);

  const overallGrade = letterGrade(overallScore);
  const overallGPA = gpa(overallScore);

  // Trend data (6 months)
  const trendData = useMemo(() => {
    return manager.months.map((m) => {
      const score = Math.round(
        m.scores.reduce((sum, s) => sum + s.score * s.weight, 0)
      );
      const monthLabel = MONTHS.find((mo) => mo.value === m.month)?.label.split(" ")[0].slice(0, 3) ?? m.month;
      return { month: monthLabel, score };
    });
  }, [manager]);

  // Radar data
  const radarData = useMemo(() => {
    return monthData.scores.map((s) => ({
      category: s.category.length > 12 ? s.category.split(" ")[0] : s.category,
      fullCategory: s.category,
      score: s.score,
    }));
  }, [monthData]);

  // Team average for peer comparison
  const teamAverage = useMemo(() => {
    const monthManagers = MANAGERS.map((m) => {
      const md = m.months.find((mo) => mo.month === selectedMonth);
      return md?.scores ?? [];
    }).filter((s) => s.length > 0);

    return CATEGORIES.map((cat, ci) => {
      const avg = Math.round(
        monthManagers.reduce((sum, scores) => sum + scores[ci].score, 0) / monthManagers.length
      );
      return { category: cat.category, key: cat.key, avg };
    });
  }, [selectedMonth]);

  const peerComparisonData = useMemo(() => {
    return monthData.scores.map((s, i) => ({
      category: s.category.length > 14 ? s.category.split(" ")[0] : s.category,
      fullCategory: s.category,
      manager: s.score,
      teamAvg: teamAverage[i]?.avg ?? 0,
    }));
  }, [monthData, teamAverage]);

  // Bottom 2 categories for improvement plan
  const bottomTwo = useMemo(() => {
    return [...monthData.scores].sort((a, b) => a.score - b.score).slice(0, 2);
  }, [monthData]);

  const monthLabel = MONTHS.find((m) => m.value === selectedMonth)?.label ?? selectedMonth;

  const handleShare = () => {
    const lines = [
      `F&I Manager Report Card — ${manager.name}`,
      `Month: ${monthLabel}`,
      `Overall Grade: ${overallGrade} (${overallScore}/100, GPA: ${overallGPA.toFixed(1)})`,
      "",
      "Category Breakdown:",
      ...monthData.scores.map(
        (s) =>
          `  ${s.category}: ${s.score}/100 (${letterGrade(s.score)}) — Weight: ${(s.weight * 100).toFixed(0)}%`
      ),
      "",
      "Improvement Focus:",
      ...bottomTwo.map((s) => `  • ${s.category} (${s.score}/100)`),
    ];
    navigator.clipboard.writeText(lines.join("\n")).catch(() => {});
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout
      title="F&I Manager Report Card"
      subtitle="Monthly performance grades for individual F&I managers"
    >
      <div className="p-4 lg:p-6 space-y-6">
        {/* ── Filters ────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <label className="text-sm text-muted-foreground mb-1 block">Manager</label>
            <Select value={selectedManager} onValueChange={setSelectedManager}>
              <SelectTrigger className="bg-card border">
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                {MANAGERS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px] max-w-xs">
            <label className="text-sm text-muted-foreground mb-1 block">Month</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="bg-card border">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 ml-auto pt-5">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <ClipboardCopy className="h-4 w-4 mr-2" />
              Share with Manager
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* ── Grade Card Header ──────────────────────────────────── */}
        <Card className="bg-card border">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Photo placeholder */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {manager.initials}
              </div>
              {/* Name and month */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-foreground">{manager.name}</h2>
                <p className="text-muted-foreground">{monthLabel} Performance Report</p>
              </div>
              {/* Overall grade */}
              <div className="text-center">
                <div className={`text-6xl font-black ${gradeColor(overallGrade)}`}>
                  {overallGrade}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Score: {overallScore}/100
                </div>
                <div className="text-sm text-muted-foreground">
                  GPA: {overallGPA.toFixed(1)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Grade Breakdown Table ──────────────────────────────── */}
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="text-foreground">Grade Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Category</th>
                    <th className="text-center py-3 px-2 text-muted-foreground font-medium">Weight</th>
                    <th className="text-center py-3 px-2 text-muted-foreground font-medium">Raw Score</th>
                    <th className="text-center py-3 px-2 text-muted-foreground font-medium">Weighted Score</th>
                    <th className="text-center py-3 px-2 text-muted-foreground font-medium">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {monthData.scores.map((s, i) => {
                    const weighted = Math.round(s.score * s.weight * 10) / 10;
                    const grade = letterGrade(s.score);
                    return (
                      <tr key={s.key} className="border-b last:border-0">
                        <td className="py-3 px-2 text-foreground font-medium flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full inline-block"
                            style={{ backgroundColor: CATEGORY_COLORS[i] }}
                          />
                          {s.category}
                        </td>
                        <td className="py-3 px-2 text-center text-muted-foreground">
                          {(s.weight * 100).toFixed(0)}%
                        </td>
                        <td className="py-3 px-2 text-center text-foreground">{s.score}</td>
                        <td className="py-3 px-2 text-center text-foreground">{weighted.toFixed(1)}</td>
                        <td className="py-3 px-2 text-center">
                          <Badge variant={gradeBadgeVariant(grade)}>
                            {grade}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Total row */}
                  <tr className="border-t-2 font-bold">
                    <td className="py-3 px-2 text-foreground">Overall</td>
                    <td className="py-3 px-2 text-center text-muted-foreground">100%</td>
                    <td className="py-3 px-2 text-center text-foreground">{overallScore}</td>
                    <td className="py-3 px-2 text-center text-foreground">{overallScore.toFixed(1)}</td>
                    <td className="py-3 px-2 text-center">
                      <Badge variant={gradeBadgeVariant(overallGrade)}>
                        {overallGrade}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ── Charts Row ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend chart */}
          <Card className="bg-card border">
            <CardHeader>
              <CardTitle className="text-foreground text-base">6-Month Grade Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis domain={[40, 100]} tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={COLORS.blue}
                    strokeWidth={3}
                    dot={{ r: 5, fill: COLORS.blue }}
                    name="Overall Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Radar chart */}
          <Card className="bg-card border">
            <CardHeader>
              <CardTitle className="text-foreground text-base">Performance Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid className="opacity-30" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke={COLORS.purple}
                    fill={COLORS.purple}
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ── Peer Comparison ────────────────────────────────────── */}
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="text-foreground text-base">
              Peer Comparison — {manager.name.split(" ")[0]} vs Team Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peerComparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={110}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="manager" name={manager.name.split(" ")[0]} fill={COLORS.blue} radius={[0, 4, 4, 0]} />
                <Bar dataKey="teamAvg" name="Team Average" fill={COLORS.amber} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Coaching Narrative ──────────────────────────────────── */}
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="text-foreground text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              AI Coaching Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">
              {coachingNarrative(manager.name, monthData.scores, overallScore)}
            </p>
          </CardContent>
        </Card>

        {/* ── Improvement Plan ───────────────────────────────────── */}
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="text-foreground text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Improvement Plan — Bottom 2 Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {bottomTwo.map((cat) => {
              const grade = letterGrade(cat.score);
              const actions = improvementActions(cat);
              return (
                <div key={cat.key} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive">{grade}</Badge>
                    <span className="font-semibold text-foreground">{cat.category}</span>
                    <span className="text-sm text-muted-foreground">({cat.score}/100)</span>
                  </div>
                  <ul className="space-y-2 ml-2">
                    {actions.map((action, ai) => (
                      <li key={ai} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
