import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  ArrowRight,
  TrendingDown,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Journey Phases ──────────────────────────────────────────
const PHASES = [
  "Greeting",
  "Needs Discovery",
  "Menu Presentation",
  "Product Discussion",
  "Objection Handling",
  "Closing",
  "Delivery",
] as const;
type Phase = (typeof PHASES)[number];

const PHASE_WEIGHTS: Record<Phase, number> = {
  Greeting: 0.05,
  "Needs Discovery": 0.15,
  "Menu Presentation": 0.25,
  "Product Discussion": 0.25,
  "Objection Handling": 0.15,
  Closing: 0.10,
  Delivery: 0.05,
};

interface PhaseData {
  avgTime: number; // minutes
  avgScore: number;
  issues: string[];
}

interface ManagerJourney {
  id: number;
  name: string;
  phases: Record<Phase, PhaseData>;
}

const COACHING_TIPS: Record<Phase, string[]> = {
  Greeting: [
    "Start with a warm, confident introduction — set the tone for trust",
    "Ask an open-ended question within the first 30 seconds to engage",
    "Mirror the customer's energy and communication style",
  ],
  "Needs Discovery": [
    "Use the SPIN framework: Situation, Problem, Implication, Need-Payoff",
    "Listen more than you speak — aim for a 70/30 listen-to-talk ratio",
    "Uncover lifestyle factors that tie into F&I product relevance",
  ],
  "Menu Presentation": [
    "Present all products on the menu — never pre-judge the customer",
    "Use the 3-option close: base, mid, and premium bundles",
    "Highlight real-world scenarios, not just features",
  ],
  "Product Discussion": [
    "Lead with the product that addresses their #1 concern from discovery",
    "Use customer-specific examples: 'Since you drive 20k miles/year...'",
    "Quantify the savings — monthly cost vs out-of-pocket repair cost",
  ],
  "Objection Handling": [
    "Acknowledge the concern before responding — 'I understand that...'",
    "Use the Feel-Felt-Found technique for common price objections",
    "Never argue — redirect with a question: 'What would make this feel right?'",
  ],
  Closing: [
    "Use the assumptive close — 'Let me add this to your paperwork'",
    "Summarize the bundle value before asking for the commitment",
    "If they hesitate, offer a bridge: 'Let's at least lock in the rate today'",
  ],
  Delivery: [
    "Recap every product purchased and what it covers",
    "Provide your card and direct number for any follow-up questions",
    "Thank them and ask for a referral or review",
  ],
};

const DEMO_MANAGERS: ManagerJourney[] = [
  {
    id: 1, name: "Marcus Rivera",
    phases: {
      Greeting: { avgTime: 2, avgScore: 88, issues: ["Rushed intro"] },
      "Needs Discovery": { avgTime: 8, avgScore: 82, issues: ["Missed lifestyle questions"] },
      "Menu Presentation": { avgTime: 12, avgScore: 79, issues: ["Skipped base option"] },
      "Product Discussion": { avgTime: 15, avgScore: 76, issues: ["Too feature-heavy"] },
      "Objection Handling": { avgTime: 10, avgScore: 72, issues: ["Defensive tone"] },
      Closing: { avgTime: 5, avgScore: 85, issues: [] },
      Delivery: { avgTime: 3, avgScore: 90, issues: [] },
    },
  },
  {
    id: 2, name: "Jessica Chen",
    phases: {
      Greeting: { avgTime: 3, avgScore: 92, issues: [] },
      "Needs Discovery": { avgTime: 10, avgScore: 88, issues: [] },
      "Menu Presentation": { avgTime: 14, avgScore: 84, issues: ["Pace too fast"] },
      "Product Discussion": { avgTime: 16, avgScore: 80, issues: ["Missed GAP opportunity"] },
      "Objection Handling": { avgTime: 8, avgScore: 78, issues: ["Didn't use Feel-Felt-Found"] },
      Closing: { avgTime: 6, avgScore: 86, issues: [] },
      Delivery: { avgTime: 4, avgScore: 91, issues: [] },
    },
  },
  {
    id: 3, name: "David Park",
    phases: {
      Greeting: { avgTime: 2, avgScore: 80, issues: ["Monotone delivery"] },
      "Needs Discovery": { avgTime: 6, avgScore: 70, issues: ["Too short", "Closed questions"] },
      "Menu Presentation": { avgTime: 10, avgScore: 68, issues: ["Skipped products"] },
      "Product Discussion": { avgTime: 12, avgScore: 65, issues: ["No customer scenarios"] },
      "Objection Handling": { avgTime: 12, avgScore: 60, issues: ["Argued with customer"] },
      Closing: { avgTime: 4, avgScore: 72, issues: ["Weak ask"] },
      Delivery: { avgTime: 2, avgScore: 82, issues: [] },
    },
  },
  {
    id: 4, name: "Sarah Kim",
    phases: {
      Greeting: { avgTime: 3, avgScore: 90, issues: [] },
      "Needs Discovery": { avgTime: 9, avgScore: 85, issues: [] },
      "Menu Presentation": { avgTime: 13, avgScore: 82, issues: ["Needs better visuals"] },
      "Product Discussion": { avgTime: 14, avgScore: 78, issues: ["Could personalize more"] },
      "Objection Handling": { avgTime: 9, avgScore: 75, issues: ["Gave up too soon"] },
      Closing: { avgTime: 5, avgScore: 83, issues: [] },
      Delivery: { avgTime: 3, avgScore: 89, issues: [] },
    },
  },
  {
    id: 5, name: "Tony Morales",
    phases: {
      Greeting: { avgTime: 2, avgScore: 86, issues: [] },
      "Needs Discovery": { avgTime: 7, avgScore: 78, issues: ["Surface-level questions"] },
      "Menu Presentation": { avgTime: 11, avgScore: 75, issues: ["Monotone"] },
      "Product Discussion": { avgTime: 13, avgScore: 74, issues: ["Feature dump"] },
      "Objection Handling": { avgTime: 11, avgScore: 70, issues: ["No acknowledgment"] },
      Closing: { avgTime: 6, avgScore: 80, issues: [] },
      Delivery: { avgTime: 3, avgScore: 87, issues: [] },
    },
  },
  {
    id: 6, name: "Linda Tran",
    phases: {
      Greeting: { avgTime: 3, avgScore: 91, issues: [] },
      "Needs Discovery": { avgTime: 9, avgScore: 86, issues: [] },
      "Menu Presentation": { avgTime: 13, avgScore: 81, issues: ["Could slow down"] },
      "Product Discussion": { avgTime: 15, avgScore: 77, issues: ["Missed upsell"] },
      "Objection Handling": { avgTime: 9, avgScore: 74, issues: ["Needs more empathy"] },
      Closing: { avgTime: 5, avgScore: 84, issues: [] },
      Delivery: { avgTime: 3, avgScore: 90, issues: [] },
    },
  },
];

const DATE_RANGES = ["Last 30", "Last 60", "Last 90"] as const;

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}

function computeJourneyScore(phases: Record<Phase, PhaseData>): number {
  let score = 0;
  for (const phase of PHASES) {
    score += phases[phase].avgScore * PHASE_WEIGHTS[phase];
  }
  return Math.round(score);
}

export default function CustomerJourney() {
  const [expandedPhase, setExpandedPhase] = useState<Phase | null>(null);
  const [dateRange, setDateRange] = useState<string>("Last 30");
  const [manager1Id, setManager1Id] = useState<number>(1);
  const [manager2Id, setManager2Id] = useState<number>(2);

  const manager1 = DEMO_MANAGERS.find((m) => m.id === manager1Id)!;
  const manager2 = DEMO_MANAGERS.find((m) => m.id === manager2Id)!;

  // Drop-off analysis: score degradation between phases
  const dropOffData = useMemo(() => {
    const allManagers = DEMO_MANAGERS;
    return PHASES.slice(1).map((phase, i) => {
      const prevPhase = PHASES[i];
      const avgPrev = allManagers.reduce((s, m) => s + m.phases[prevPhase].avgScore, 0) / allManagers.length;
      const avgCurr = allManagers.reduce((s, m) => s + m.phases[phase].avgScore, 0) / allManagers.length;
      return {
        transition: `${prevPhase.split(" ")[0]} → ${phase.split(" ")[0]}`,
        dropOff: Math.round((avgPrev - avgCurr) * 10) / 10,
      };
    });
  }, []);

  return (
    <AppLayout title="Customer Journey Map" subtitle="Visual flow of the F&I customer experience">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Date Range Filter */}
        <div className="flex flex-wrap gap-2">
          {DATE_RANGES.map((dr) => (
            <Button key={dr} variant={dateRange === dr ? "default" : "outline"} size="sm" onClick={() => setDateRange(dr)}>
              {dr} days
            </Button>
          ))}
        </div>

        {/* Journey Score */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Journey Score (Weighted Composite)</p>
              <p className="text-3xl font-bold text-foreground">{computeJourneyScore(manager1.phases)}</p>
            </div>
            <Badge variant="outline" className="text-xs">
              Weights: Greeting 5% · Discovery 15% · Menu 25% · Products 25% · Objections 15% · Closing 10% · Delivery 5%
            </Badge>
          </div>
        </Card>

        {/* Horizontal Step Flow */}
        <Card className="p-4 overflow-x-auto">
          <h3 className="text-sm font-semibold text-foreground mb-4">Journey Phases — {manager1.name}</h3>
          <div className="flex items-start gap-2 min-w-[900px]">
            {PHASES.map((phase, i) => {
              const data = manager1.phases[phase];
              const isExpanded = expandedPhase === phase;
              return (
                <div key={phase} className="flex items-start">
                  <div
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => setExpandedPhase(isExpanded ? null : phase)}
                  >
                    <div className="w-28 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-center">
                      <p className="text-xs font-semibold text-foreground leading-tight">{phase}</p>
                      <p className={`text-lg font-bold mt-1 ${getScoreColor(data.avgScore)}`}>{data.avgScore}</p>
                      <p className="text-[10px] text-muted-foreground">{data.avgTime} min avg</p>
                      {data.issues.length > 0 && (
                        <Badge variant="outline" className="text-[9px] mt-1 border-orange-500/30 text-orange-400">
                          {data.issues.length} issue{data.issues.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                      <div className="mt-1">
                        {isExpanded ? <ChevronDown className="w-3 h-3 mx-auto text-muted-foreground" /> : <ChevronRight className="w-3 h-3 mx-auto text-muted-foreground" />}
                      </div>
                    </div>
                    {/* Expanded coaching tips */}
                    {isExpanded && (
                      <div className="mt-2 w-48 p-3 rounded-lg border border-primary/20 bg-primary/5 text-left">
                        <p className="text-[10px] font-semibold text-primary uppercase mb-2">Coaching Tips</p>
                        {COACHING_TIPS[phase].map((tip, ti) => (
                          <p key={ti} className="text-[11px] text-foreground mb-1.5 leading-tight">
                            {ti + 1}. {tip}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  {i < PHASES.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground mt-8 mx-1 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Manager Comparison */}
        <Card className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Manager Comparison</h3>
            <select
              value={manager1Id}
              onChange={(e) => setManager1Id(Number(e.target.value))}
              className="text-sm bg-accent rounded px-2 py-1 border border-border text-foreground"
            >
              {DEMO_MANAGERS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">vs</span>
            <select
              value={manager2Id}
              onChange={(e) => setManager2Id(Number(e.target.value))}
              className="text-sm bg-accent rounded px-2 py-1 border border-border text-foreground"
            >
              {DEMO_MANAGERS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-xs text-muted-foreground">Phase</th>
                  <th className="text-center py-2 px-2 text-xs text-muted-foreground">{manager1.name}</th>
                  <th className="text-center py-2 px-2 text-xs text-muted-foreground">{manager2.name}</th>
                  <th className="text-center py-2 px-2 text-xs text-muted-foreground">Delta</th>
                </tr>
              </thead>
              <tbody>
                {PHASES.map((phase) => {
                  const s1 = manager1.phases[phase].avgScore;
                  const s2 = manager2.phases[phase].avgScore;
                  const delta = s1 - s2;
                  return (
                    <tr key={phase} className="border-b border-border/50">
                      <td className="py-2 px-2 text-foreground">{phase}</td>
                      <td className={`text-center py-2 px-2 font-semibold ${getScoreColor(s1)}`}>{s1}</td>
                      <td className={`text-center py-2 px-2 font-semibold ${getScoreColor(s2)}`}>{s2}</td>
                      <td className={`text-center py-2 px-2 font-semibold ${delta > 0 ? "text-green-400" : delta < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                        {delta > 0 ? "+" : ""}{delta}
                      </td>
                    </tr>
                  );
                })}
                <tr className="font-bold">
                  <td className="py-2 px-2 text-foreground">Journey Score</td>
                  <td className="text-center py-2 px-2 text-foreground">{computeJourneyScore(manager1.phases)}</td>
                  <td className="text-center py-2 px-2 text-foreground">{computeJourneyScore(manager2.phases)}</td>
                  <td className="text-center py-2 px-2 text-foreground">
                    {computeJourneyScore(manager1.phases) - computeJourneyScore(manager2.phases) > 0 ? "+" : ""}
                    {computeJourneyScore(manager1.phases) - computeJourneyScore(manager2.phases)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Drop-off Analysis */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Drop-off Analysis</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dropOffData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="transition" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip formatter={(v: number) => [`${v} pts`, "Score Drop"]} />
              <Bar dataKey="dropOff" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </AppLayout>
  );
}
