import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Award,
  Users,
  Target,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────
type ComplianceCategory = "TILA" | "ECOA" | "UDAP" | "State Law" | "Internal Policy";

interface ComplianceEvent {
  date: string;
  rule: ComplianceCategory;
  result: "pass" | "fail";
  note: string;
}

interface ManagerCompliance {
  id: number;
  name: string;
  overallScore: number;
  categoryScores: Record<ComplianceCategory, number>;
  trend: number[];
  lastMonthScore: number;
  events: ComplianceEvent[];
}

// ── Constants ───────────────────────────────────────────────────────
const CATEGORIES: ComplianceCategory[] = ["TILA", "ECOA", "UDAP", "State Law", "Internal Policy"];
const DATE_RANGES = ["Last 30", "Last 60", "Last 90"] as const;

const TRAINING_MAP: Record<ComplianceCategory, string> = {
  TILA: "TILA Disclosure Fundamentals",
  ECOA: "Fair Lending Practices",
  UDAP: "Consumer Protection Essentials",
  "State Law": "State Regulatory Compliance",
  "Internal Policy": "Internal Policy Refresher",
};

// ── Hard-coded demo data ────────────────────────────────────────────
const MANAGERS: ManagerCompliance[] = [
  {
    id: 1,
    name: "Marcus Rivera",
    overallScore: 94,
    categoryScores: { TILA: 96, ECOA: 93, UDAP: 95, "State Law": 92, "Internal Policy": 94 },
    trend: [88, 89, 90, 91, 92, 93, 93, 94],
    lastMonthScore: 91,
    events: [
      { date: "2026-04-02", rule: "TILA", result: "pass", note: "APR disclosure verified within tolerance" },
      { date: "2026-04-01", rule: "ECOA", result: "pass", note: "Equal credit terms applied correctly" },
      { date: "2026-03-29", rule: "UDAP", result: "pass", note: "Product benefits accurately represented" },
      { date: "2026-03-27", rule: "State Law", result: "pass", note: "State-specific disclosures complete" },
      { date: "2026-03-25", rule: "Internal Policy", result: "pass", note: "Customer acknowledgment obtained" },
      { date: "2026-03-22", rule: "TILA", result: "pass", note: "Finance charge calculation correct" },
      { date: "2026-03-20", rule: "ECOA", result: "fail", note: "Missing adverse action notice documentation" },
      { date: "2026-03-18", rule: "UDAP", result: "pass", note: "No misleading product descriptions found" },
      { date: "2026-03-15", rule: "State Law", result: "pass", note: "Cancellation rights properly disclosed" },
      { date: "2026-03-12", rule: "Internal Policy", result: "pass", note: "Manager sign-off completed on time" },
    ],
  },
  {
    id: 2,
    name: "Jessica Chen",
    overallScore: 97,
    categoryScores: { TILA: 98, ECOA: 97, UDAP: 96, "State Law": 97, "Internal Policy": 96 },
    trend: [93, 94, 95, 95, 96, 96, 97, 97],
    lastMonthScore: 95,
    events: [
      { date: "2026-04-03", rule: "TILA", result: "pass", note: "All Truth-in-Lending disclosures accurate" },
      { date: "2026-04-01", rule: "ECOA", result: "pass", note: "No discriminatory pricing patterns detected" },
      { date: "2026-03-30", rule: "UDAP", result: "pass", note: "Clear and fair product presentations" },
      { date: "2026-03-28", rule: "State Law", result: "pass", note: "State filing requirements met" },
      { date: "2026-03-26", rule: "Internal Policy", result: "pass", note: "Deal jacket documentation complete" },
      { date: "2026-03-24", rule: "TILA", result: "pass", note: "Payment schedule disclosed correctly" },
      { date: "2026-03-22", rule: "ECOA", result: "pass", note: "Consistent credit evaluation criteria used" },
      { date: "2026-03-19", rule: "UDAP", result: "pass", note: "Product pricing clearly communicated" },
      { date: "2026-03-17", rule: "State Law", result: "pass", note: "Warranty disclosures per state guidelines" },
      { date: "2026-03-14", rule: "Internal Policy", result: "pass", note: "Supervisor review completed within SLA" },
    ],
  },
  {
    id: 3,
    name: "David Park",
    overallScore: 78,
    categoryScores: { TILA: 82, ECOA: 85, UDAP: 65, "State Law": 80, "Internal Policy": 78 },
    trend: [82, 81, 80, 79, 78, 78, 77, 78],
    lastMonthScore: 80,
    events: [
      { date: "2026-04-02", rule: "UDAP", result: "fail", note: "Overstated coverage benefits on VSC presentation" },
      { date: "2026-04-01", rule: "TILA", result: "pass", note: "Interest rate disclosed within guidelines" },
      { date: "2026-03-29", rule: "ECOA", result: "pass", note: "Consistent underwriting documentation" },
      { date: "2026-03-27", rule: "UDAP", result: "fail", note: "GAP coverage terms not fully explained" },
      { date: "2026-03-25", rule: "State Law", result: "pass", note: "Contract cancellation terms disclosed" },
      { date: "2026-03-23", rule: "Internal Policy", result: "fail", note: "Missing required customer signature on addendum" },
      { date: "2026-03-20", rule: "TILA", result: "pass", note: "Total of payments calculation verified" },
      { date: "2026-03-18", rule: "UDAP", result: "fail", note: "Tire & Wheel benefits exaggerated in pitch" },
      { date: "2026-03-15", rule: "ECOA", result: "pass", note: "Rate markup within ECOA guidelines" },
      { date: "2026-03-12", rule: "State Law", result: "fail", note: "State-mandated cooling-off period not mentioned" },
    ],
  },
  {
    id: 4,
    name: "Sarah Kim",
    overallScore: 91,
    categoryScores: { TILA: 93, ECOA: 90, UDAP: 92, "State Law": 88, "Internal Policy": 92 },
    trend: [87, 88, 89, 90, 90, 91, 91, 91],
    lastMonthScore: 90,
    events: [
      { date: "2026-04-03", rule: "TILA", result: "pass", note: "Finance terms clearly presented to buyer" },
      { date: "2026-04-01", rule: "ECOA", result: "pass", note: "No adverse impact patterns in credit decisions" },
      { date: "2026-03-30", rule: "UDAP", result: "pass", note: "Product limitations properly disclosed" },
      { date: "2026-03-28", rule: "State Law", result: "fail", note: "Minor delay in state-required form submission" },
      { date: "2026-03-26", rule: "Internal Policy", result: "pass", note: "All checklists completed before delivery" },
      { date: "2026-03-23", rule: "TILA", result: "pass", note: "Balloon payment terms properly disclosed" },
      { date: "2026-03-21", rule: "ECOA", result: "pass", note: "Equal treatment verified in rate assignment" },
      { date: "2026-03-18", rule: "UDAP", result: "pass", note: "Maintenance plan terms transparent" },
      { date: "2026-03-16", rule: "State Law", result: "pass", note: "Lemon law disclosures provided" },
      { date: "2026-03-13", rule: "Internal Policy", result: "pass", note: "Deal review sign-off on file" },
    ],
  },
  {
    id: 5,
    name: "Tony Morales",
    overallScore: 72,
    categoryScores: { TILA: 68, ECOA: 75, UDAP: 70, "State Law": 74, "Internal Policy": 73 },
    trend: [78, 77, 76, 75, 74, 73, 72, 72],
    lastMonthScore: 75,
    events: [
      { date: "2026-04-03", rule: "TILA", result: "fail", note: "APR rounding error on buyer's order" },
      { date: "2026-04-01", rule: "ECOA", result: "pass", note: "Credit terms consistent across demographics" },
      { date: "2026-03-30", rule: "UDAP", result: "fail", note: "Failed to disclose deductible on VSC" },
      { date: "2026-03-28", rule: "State Law", result: "pass", note: "Complied with state doc fee cap" },
      { date: "2026-03-26", rule: "Internal Policy", result: "fail", note: "Late submission of deal recap form" },
      { date: "2026-03-23", rule: "TILA", result: "fail", note: "Amount financed discrepancy on contract" },
      { date: "2026-03-21", rule: "ECOA", result: "fail", note: "Inconsistent rate markup flagged for review" },
      { date: "2026-03-18", rule: "UDAP", result: "pass", note: "Product pricing within acceptable range" },
      { date: "2026-03-16", rule: "State Law", result: "fail", note: "Missing state-required arbitration disclosure" },
      { date: "2026-03-13", rule: "Internal Policy", result: "fail", note: "No manager approval on high-markup deal" },
    ],
  },
  {
    id: 6,
    name: "Linda Tran",
    overallScore: 88,
    categoryScores: { TILA: 90, ECOA: 91, UDAP: 87, "State Law": 85, "Internal Policy": 87 },
    trend: [84, 85, 86, 86, 87, 87, 88, 88],
    lastMonthScore: 86,
    events: [
      { date: "2026-04-02", rule: "TILA", result: "pass", note: "All rate disclosures within tolerance" },
      { date: "2026-04-01", rule: "ECOA", result: "pass", note: "Fair lending practices documented" },
      { date: "2026-03-29", rule: "UDAP", result: "pass", note: "Accurate product descriptions provided" },
      { date: "2026-03-27", rule: "State Law", result: "fail", note: "Incomplete state-specific addendum" },
      { date: "2026-03-25", rule: "Internal Policy", result: "pass", note: "Compliance checklist fully executed" },
      { date: "2026-03-22", rule: "TILA", result: "pass", note: "Monthly payment disclosure correct" },
      { date: "2026-03-20", rule: "ECOA", result: "pass", note: "No disparate impact in deal structuring" },
      { date: "2026-03-18", rule: "UDAP", result: "fail", note: "Unclear cancellation terms on GAP product" },
      { date: "2026-03-15", rule: "State Law", result: "pass", note: "Tax and fee disclosures accurate" },
      { date: "2026-03-12", rule: "Internal Policy", result: "pass", note: "All required forms in deal jacket" },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 90) return { bg: "bg-green-500/10", text: "text-green-400" };
  if (score >= 70) return { bg: "bg-yellow-500/10", text: "text-yellow-400" };
  return { bg: "bg-red-500/10", text: "text-red-400" };
}

function riskLevel(manager: ManagerCompliance): "Low" | "Moderate" | "High" {
  const trendDeclining = manager.trend[manager.trend.length - 1] < manager.trend[0];
  if (manager.overallScore < 70) return "High";
  if (manager.overallScore < 90 || trendDeclining) return "Moderate";
  return "Low";
}

function riskColor(risk: "Low" | "Moderate" | "High") {
  if (risk === "Low") return "text-green-400";
  if (risk === "Moderate") return "text-yellow-400";
  return "text-red-400";
}

function MiniSparkline({ data, color = "#22c55e" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// ── Component ───────────────────────────────────────────────────────
export default function ComplianceScorecard() {
  const [dateRange, setDateRange] = useState<string>("Last 30");
  const [selectedManagerFilter, setSelectedManagerFilter] = useState<string>("All Managers");
  const [selectedManager, setSelectedManager] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const filteredManagers = useMemo(() => {
    if (selectedManagerFilter === "All Managers") return MANAGERS;
    return MANAGERS.filter((m) => m.name === selectedManagerFilter);
  }, [selectedManagerFilter]);

  const avgScore = useMemo(
    () => Math.round(MANAGERS.reduce((s, m) => s + m.overallScore, 0) / MANAGERS.length),
    [],
  );

  const greenPercent = useMemo(
    () => Math.round((MANAGERS.filter((m) => m.overallScore >= 90).length / MANAGERS.length) * 100),
    [],
  );

  const mostImproved = useMemo(() => {
    let best: ManagerCompliance | null = null;
    let bestDelta = -Infinity;
    for (const m of MANAGERS) {
      const delta = m.overallScore - m.lastMonthScore;
      if (delta > bestDelta) {
        bestDelta = delta;
        best = m;
      }
    }
    return best;
  }, []);

  const mostAtRisk = useMemo(() => {
    return [...MANAGERS].sort((a, b) => a.overallScore - b.overallScore)[0];
  }, []);

  const leaderboard = useMemo(() => {
    return [...filteredManagers].sort((a, b) => b.overallScore - a.overallScore);
  }, [filteredManagers]);

  const expandedManager = useMemo(() => {
    if (selectedManager === null) return null;
    return MANAGERS.find((m) => m.id === selectedManager) ?? null;
  }, [selectedManager]);

  return (
    <AppLayout title="Compliance Scorecard" subtitle="Per-manager compliance health and risk assessment">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {DATE_RANGES.map((dr) => (
            <Button
              key={dr}
              variant={dateRange === dr ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(dr)}
            >
              {dr}
            </Button>
          ))}
          <div className="relative ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="min-w-[160px] justify-between"
            >
              {selectedManagerFilter}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-md border border-border bg-card shadow-lg">
                {["All Managers", ...MANAGERS.map((m) => m.name)].map((opt) => (
                  <button
                    key={opt}
                    className="block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent/50 first:rounded-t-md last:rounded-b-md"
                    onClick={() => {
                      setSelectedManagerFilter(opt);
                      setDropdownOpen(false);
                      setSelectedManager(null);
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Target className="w-4 h-4" /> Avg Compliance Score
            </div>
            <p className="text-2xl font-bold text-foreground">{avgScore}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CheckCircle className="w-4 h-4" /> Managers in Green
            </div>
            <p className="text-2xl font-bold text-green-400">{greenPercent}%</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="w-4 h-4" /> Most Improved
            </div>
            <p className="text-2xl font-bold text-foreground">{mostImproved?.name ?? "—"}</p>
            {mostImproved && (
              <p className="text-xs text-green-400 mt-1">
                +{mostImproved.overallScore - mostImproved.lastMonthScore} pts vs last month
              </p>
            )}
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <AlertTriangle className="w-4 h-4" /> Most At-Risk
            </div>
            <p className="text-2xl font-bold text-red-400">{mostAtRisk.name}</p>
            <p className="text-xs text-muted-foreground mt-1">Score: {mostAtRisk.overallScore}</p>
          </Card>
        </div>

        {/* Scorecard Grid */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Manager Compliance Cards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredManagers.map((m) => {
              const sc = scoreColor(m.overallScore);
              const isExpanded = selectedManager === m.id;
              return (
                <Card
                  key={m.id}
                  className="p-4 cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => setSelectedManager(isExpanded ? null : m.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{m.name}</h4>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <Badge className={`${sc.bg} ${sc.text} border-0 font-bold`}>{m.overallScore}</Badge>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-wrap gap-1">
                      {CATEGORIES.map((cat) => {
                        const catSc = scoreColor(m.categoryScores[cat]);
                        return (
                          <span
                            key={cat}
                            className={`text-xs px-2 py-0.5 rounded ${catSc.bg} ${catSc.text}`}
                          >
                            {cat}: {m.categoryScores[cat]}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">8-week trend</span>
                    <MiniSparkline
                      data={m.trend}
                      color={m.overallScore >= 90 ? "#22c55e" : m.overallScore >= 70 ? "#eab308" : "#ef4444"}
                    />
                  </div>

                  {/* Expanded drill-down */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border" onClick={(e) => e.stopPropagation()}>
                      <h5 className="text-xs font-semibold text-foreground mb-2">
                        Recent Compliance Events
                      </h5>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {m.events.map((evt, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-xs p-2 rounded bg-accent/30"
                          >
                            {evt.result === "pass" ? (
                              <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">{evt.date}</span>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {evt.rule}
                                </Badge>
                                <Badge
                                  className={`text-[10px] px-1.5 py-0 border-0 ${
                                    evt.result === "pass"
                                      ? "bg-green-500/10 text-green-400"
                                      : "bg-red-500/10 text-red-400"
                                  }`}
                                >
                                  {evt.result}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground mt-0.5">{evt.note}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compliance Leaderboard */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-foreground">Compliance Leaderboard</h3>
            </div>
            <div className="space-y-2">
              {leaderboard.map((m, i) => {
                const sc = scoreColor(m.overallScore);
                return (
                  <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-accent/30">
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {CATEGORIES.map((c) => `${c}: ${m.categoryScores[c]}`).join(" · ")}
                      </p>
                    </div>
                    <Badge className={`${sc.bg} ${sc.text} border-0 font-bold`}>{m.overallScore}</Badge>
                    <MiniSparkline
                      data={m.trend}
                      color={m.overallScore >= 90 ? "#22c55e" : m.overallScore >= 70 ? "#eab308" : "#ef4444"}
                    />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Risk Profile */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-foreground">Risk Profile</h3>
            </div>
            <div className="space-y-2">
              {filteredManagers.map((m) => {
                const risk = riskLevel(m);
                const rc = riskColor(risk);
                const trendDir =
                  m.trend[m.trend.length - 1] > m.trend[0]
                    ? "improving"
                    : m.trend[m.trend.length - 1] === m.trend[0]
                      ? "stable"
                      : "declining";
                return (
                  <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-accent/30">
                    <Shield className={`w-5 h-5 ${rc} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Score: {m.overallScore} · Trend: {trendDir}
                      </p>
                    </div>
                    <Badge
                      className={`border-0 ${
                        risk === "Low"
                          ? "bg-green-500/10 text-green-400"
                          : risk === "Moderate"
                            ? "bg-yellow-500/10 text-yellow-400"
                            : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {risk} Risk
                    </Badge>
                    {trendDir === "improving" ? (
                      <TrendingUp className="w-4 h-4 text-green-400 shrink-0" />
                    ) : trendDir === "declining" ? (
                      <TrendingDown className="w-4 h-4 text-red-400 shrink-0" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Required Training Recommendations */}
        {(() => {
          const recommendations: { manager: string; category: ComplianceCategory; training: string; score: number }[] = [];
          for (const m of filteredManagers) {
            for (const cat of CATEGORIES) {
              if (m.categoryScores[cat] < 70) {
                recommendations.push({
                  manager: m.name,
                  category: cat,
                  training: TRAINING_MAP[cat],
                  score: m.categoryScores[cat],
                });
              }
            }
          }
          if (recommendations.length === 0) return null;
          return (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-semibold text-foreground">Required Training Recommendations</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {recommendations.map((rec, i) => (
                  <Card key={i} className="p-4 border-orange-500/20 bg-orange-500/5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{rec.manager}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {rec.category} score: <span className="text-red-400 font-medium">{rec.score}</span>
                        </p>
                        <p className="text-xs text-orange-400 font-medium mt-2">
                          Recommended: {rec.training}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </AppLayout>
  );
}
