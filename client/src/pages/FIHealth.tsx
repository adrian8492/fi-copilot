import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldCheck,
  Users,
  Zap,
  Target,
  Heart,
  Lightbulb,
  ChevronUp,
  ChevronDown,
  Minus,
} from "lucide-react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

// ── Types ───────────────────────────────────────────────────────────
interface DimensionScore {
  key: string;
  label: string;
  score: number;
  lastMonth: number;
  benchmark: number;
  weight: number;
  rawValue: string;
  topContributor: string;
  topDrag: string;
  icon: React.ReactNode;
}

interface MonthlyHistory {
  month: string;
  overall: number;
  pvr: number;
  penetration: number;
  compliance: number;
  satisfaction: number;
  lender: number;
  velocity: number;
}

interface Prescription {
  id: number;
  impact: number;
  action: string;
  dimension: string;
  estimatedGain: number;
}

interface DealershipData {
  id: string;
  name: string;
  overall: number;
  dimensions: DimensionScore[];
  history: MonthlyHistory[];
  prescriptions: Prescription[];
}

// ── Helpers ─────────────────────────────────────────────────────────
function letterGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-800";
  if (score >= 60) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

function scoreBorder(score: number): string {
  if (score >= 80) return "border-green-400";
  if (score >= 60) return "border-yellow-400";
  return "border-red-400";
}

function trendIcon(current: number, previous: number) {
  const delta = current - previous;
  if (delta > 0) return <ChevronUp className="w-4 h-4 text-green-600 inline" />;
  if (delta < 0) return <ChevronDown className="w-4 h-4 text-red-600 inline" />;
  return <Minus className="w-4 h-4 text-gray-400 inline" />;
}

function trendText(current: number, previous: number): string {
  const delta = current - previous;
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `${delta}`;
  return "0";
}

// ── Gauge color for recharts fill ──────────────────────────────────
function gaugeFill(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  return "#ef4444";
}

// ── Hard-coded demo data ───────────────────────────────────────────
function buildDimensions(
  pvr: number,
  pen: number,
  comp: number,
  sat: number,
  lend: number,
  vel: number,
  pvrLast: number,
  penLast: number,
  compLast: number,
  satLast: number,
  lendLast: number,
  velLast: number,
): DimensionScore[] {
  return [
    {
      key: "pvr",
      label: "PVR Performance",
      score: pvr,
      lastMonth: pvrLast,
      benchmark: 75,
      weight: 25,
      rawValue: "$1,842",
      topContributor: "VSC attach rate above 60%",
      topDrag: "GAP pricing below market",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      key: "penetration",
      label: "Product Penetration",
      score: pen,
      lastMonth: penLast,
      benchmark: 70,
      weight: 20,
      rawValue: "68%",
      topContributor: "Prepaid maintenance upsell",
      topDrag: "Tire & wheel below 30%",
      icon: <Target className="w-5 h-5" />,
    },
    {
      key: "compliance",
      label: "Compliance Health",
      score: comp,
      lastMonth: compLast,
      benchmark: 85,
      weight: 20,
      rawValue: "96%",
      topContributor: "Zero TILA violations this quarter",
      topDrag: "ECOA documentation gaps",
      icon: <ShieldCheck className="w-5 h-5" />,
    },
    {
      key: "satisfaction",
      label: "Customer Satisfaction",
      score: sat,
      lastMonth: satLast,
      benchmark: 72,
      weight: 15,
      rawValue: "4.3/5.0",
      topContributor: "Menu transparency scores",
      topDrag: "Wait time complaints",
      icon: <Heart className="w-5 h-5" />,
    },
    {
      key: "lender",
      label: "Lender Relationships",
      score: lend,
      lastMonth: lendLast,
      benchmark: 68,
      weight: 10,
      rawValue: "14 active",
      topContributor: "Strong captive approval rate",
      topDrag: "Subprime tier conversion lag",
      icon: <Users className="w-5 h-5" />,
    },
    {
      key: "velocity",
      label: "Team Velocity",
      score: vel,
      lastMonth: velLast,
      benchmark: 65,
      weight: 10,
      rawValue: "28 min avg",
      topContributor: "Digital menu adoption at 78%",
      topDrag: "New hire ramp time",
      icon: <Zap className="w-5 h-5" />,
    },
  ];
}

const DEALERSHIPS: DealershipData[] = [
  {
    id: "downtown",
    name: "Downtown Honda",
    overall: 82,
    dimensions: buildDimensions(85, 78, 92, 76, 80, 74, 82, 75, 90, 73, 78, 71),
    history: [
      { month: "Nov", overall: 74, pvr: 78, penetration: 70, compliance: 85, satisfaction: 68, lender: 72, velocity: 65 },
      { month: "Dec", overall: 76, pvr: 80, penetration: 72, compliance: 87, satisfaction: 70, lender: 74, velocity: 67 },
      { month: "Jan", overall: 78, pvr: 81, penetration: 74, compliance: 88, satisfaction: 72, lender: 76, velocity: 69 },
      { month: "Feb", overall: 79, pvr: 83, penetration: 75, compliance: 89, satisfaction: 73, lender: 77, velocity: 71 },
      { month: "Mar", overall: 80, pvr: 84, penetration: 76, compliance: 91, satisfaction: 74, lender: 79, velocity: 72 },
      { month: "Apr", overall: 82, pvr: 85, penetration: 78, compliance: 92, satisfaction: 76, lender: 80, velocity: 74 },
    ],
    prescriptions: [
      { id: 1, impact: 5, action: "Implement structured GAP repricing to match market — currently 12% below competitors", dimension: "PVR Performance", estimatedGain: 4 },
      { id: 2, impact: 4, action: "Launch tire & wheel bundle with VSC to lift penetration from 28% to target 45%", dimension: "Product Penetration", estimatedGain: 3 },
      { id: 3, impact: 4, action: "Schedule weekly ECOA documentation audits to close compliance gaps", dimension: "Compliance Health", estimatedGain: 2 },
      { id: 4, impact: 3, action: "Reduce average F&I wait time from 28 min to 20 min with express menu option", dimension: "Customer Satisfaction", estimatedGain: 3 },
      { id: 5, impact: 3, action: "Onboard 2 additional subprime lenders to improve approval spread", dimension: "Lender Relationships", estimatedGain: 2 },
    ],
  },
  {
    id: "eastside",
    name: "Eastside Toyota",
    overall: 71,
    dimensions: buildDimensions(72, 68, 82, 65, 70, 62, 70, 64, 80, 62, 68, 58),
    history: [
      { month: "Nov", overall: 62, pvr: 65, penetration: 58, compliance: 75, satisfaction: 56, lender: 62, velocity: 52 },
      { month: "Dec", overall: 64, pvr: 67, penetration: 60, compliance: 77, satisfaction: 58, lender: 64, velocity: 54 },
      { month: "Jan", overall: 66, pvr: 68, penetration: 62, compliance: 78, satisfaction: 60, lender: 66, velocity: 56 },
      { month: "Feb", overall: 68, pvr: 70, penetration: 64, compliance: 80, satisfaction: 62, lender: 68, velocity: 58 },
      { month: "Mar", overall: 69, pvr: 71, penetration: 66, compliance: 81, satisfaction: 63, lender: 69, velocity: 60 },
      { month: "Apr", overall: 71, pvr: 72, penetration: 68, compliance: 82, satisfaction: 65, lender: 70, velocity: 62 },
    ],
    prescriptions: [
      { id: 1, impact: 5, action: "Restructure menu presentation order — lead with highest-value products to boost PVR", dimension: "PVR Performance", estimatedGain: 5 },
      { id: 2, impact: 5, action: "Mandate role-play training 3x/week to improve product pitch effectiveness", dimension: "Product Penetration", estimatedGain: 4 },
      { id: 3, impact: 4, action: "Implement real-time CSI feedback loop to address satisfaction issues same-day", dimension: "Customer Satisfaction", estimatedGain: 4 },
      { id: 4, impact: 3, action: "Cross-train team on digital menu tools to cut transaction time by 25%", dimension: "Team Velocity", estimatedGain: 3 },
      { id: 5, impact: 3, action: "Expand credit union partnerships for better rate spread on used vehicles", dimension: "Lender Relationships", estimatedGain: 2 },
    ],
  },
  {
    id: "metro",
    name: "Metro Ford",
    overall: 56,
    dimensions: buildDimensions(55, 48, 72, 50, 58, 45, 58, 50, 74, 52, 60, 48),
    history: [
      { month: "Nov", overall: 50, pvr: 52, penetration: 42, compliance: 68, satisfaction: 44, lender: 54, velocity: 38 },
      { month: "Dec", overall: 51, pvr: 53, penetration: 44, compliance: 69, satisfaction: 45, lender: 55, velocity: 40 },
      { month: "Jan", overall: 52, pvr: 53, penetration: 45, compliance: 70, satisfaction: 46, lender: 56, velocity: 41 },
      { month: "Feb", overall: 53, pvr: 54, penetration: 46, compliance: 71, satisfaction: 48, lender: 57, velocity: 43 },
      { month: "Mar", overall: 55, pvr: 55, penetration: 47, compliance: 71, satisfaction: 49, lender: 58, velocity: 44 },
      { month: "Apr", overall: 56, pvr: 55, penetration: 48, compliance: 72, satisfaction: 50, lender: 58, velocity: 45 },
    ],
    prescriptions: [
      { id: 1, impact: 5, action: "Complete emergency retraining program for all F&I managers on menu selling fundamentals", dimension: "PVR Performance", estimatedGain: 8 },
      { id: 2, impact: 5, action: "Deploy product bundling strategy — current penetration at critical low of 48%", dimension: "Product Penetration", estimatedGain: 7 },
      { id: 3, impact: 5, action: "Hire experienced F&I closer to mentor existing team and lift velocity scores", dimension: "Team Velocity", estimatedGain: 6 },
      { id: 4, impact: 4, action: "Implement customer experience overhaul — current 50/100 satisfaction threatens retention", dimension: "Customer Satisfaction", estimatedGain: 5 },
      { id: 5, impact: 4, action: "Conduct full compliance audit and remediation — multiple State Law gaps identified", dimension: "Compliance Health", estimatedGain: 4 },
    ],
  },
];

const DIMENSION_KEYS = [
  { key: "overall", label: "Overall", color: "#6366f1" },
  { key: "pvr", label: "PVR", color: "#22c55e" },
  { key: "penetration", label: "Penetration", color: "#3b82f6" },
  { key: "compliance", label: "Compliance", color: "#a855f7" },
  { key: "satisfaction", label: "Satisfaction", color: "#f97316" },
  { key: "lender", label: "Lender", color: "#ec4899" },
  { key: "velocity", label: "Velocity", color: "#14b8a6" },
];

const RADAR_LABELS = ["PVR", "Penetration", "Compliance", "Satisfaction", "Lender", "Velocity"];

// ── Component ──────────────────────────────────────────────────────
export default function FIHealth() {
  useEffect(() => {
    document.title = "F&I Health Score | F&I Co-Pilot by ASURA Group";
  }, []);

  const [selectedDealer, setSelectedDealer] = useState(DEALERSHIPS[0].id);
  const [visibleLines, setVisibleLines] = useState<Set<string>>(new Set(["overall"]));

  const dealer = useMemo(
    () => DEALERSHIPS.find((d) => d.id === selectedDealer) ?? DEALERSHIPS[0],
    [selectedDealer],
  );

  const overallScore = dealer.overall;
  const grade = letterGrade(overallScore);

  const weightedBreakdown = useMemo(() => {
    return dealer.dimensions.map((d) => ({
      metric: d.label,
      weight: d.weight,
      rawValue: d.rawValue,
      score: d.score,
      weightedScore: Math.round((d.score * d.weight) / 100),
      benchmarkDelta: d.score - d.benchmark,
    }));
  }, [dealer]);

  const gaugeData = useMemo(() => {
    return [
      { name: "bg", value: 100, fill: "#e5e7eb" },
      { name: "score", value: overallScore, fill: gaugeFill(overallScore) },
    ];
  }, [overallScore]);

  const radarData = useMemo(() => {
    return RADAR_LABELS.map((label, i) => {
      const entry: Record<string, string | number> = { dimension: label };
      DEALERSHIPS.forEach((d) => {
        entry[d.name] = d.dimensions[i].score;
      });
      return entry;
    });
  }, []);

  function toggleLine(key: string) {
    setVisibleLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <AppLayout title="F&I Health Score" subtitle="Composite health score dashboard with detailed dimension breakdown">
      <div className="p-6 space-y-6">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <Select value={selectedDealer} onValueChange={setSelectedDealer}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select dealership" />
            </SelectTrigger>
            <SelectContent>
              {DEALERSHIPS.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge className={scoreBg(overallScore)}>
            <Activity className="w-3 h-3 mr-1" />
            Grade: {grade}
          </Badge>
        </div>

        {/* ── Gauge + Overall Score ─────────────────────────────────── */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Radial Gauge */}
              <div className="relative w-64 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="70%"
                    outerRadius="100%"
                    startAngle={180}
                    endAngle={0}
                    data={gaugeData}
                    barSize={20}
                  >
                    <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "#f3f4f6" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-bold ${scoreColor(overallScore)}`}>
                    {overallScore}
                  </span>
                  <span className={`text-3xl font-semibold ${scoreColor(overallScore)}`}>
                    {grade}
                  </span>
                  <span className="text-sm text-gray-500">Health Score</span>
                </div>
              </div>
              {/* Summary stats */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                {dealer.dimensions.map((dim) => (
                  <div key={dim.key} className={`p-3 rounded-lg border-2 ${scoreBorder(dim.score)}`}>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      {dim.icon}
                      {dim.label}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold ${scoreColor(dim.score)}`}>{dim.score}</span>
                      <span className="text-sm text-gray-500">
                        {trendIcon(dim.score, dim.lastMonth)} {trendText(dim.score, dim.lastMonth)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">Benchmark: {dim.benchmark}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Dimension Detail Cards ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dealer.dimensions.map((dim) => (
            <Card key={dim.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {dim.icon}
                  {dim.label}
                  <Badge className={`ml-auto ${scoreBg(dim.score)}`}>{dim.score}/100</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">vs Last Month</span>
                  <span className={dim.score >= dim.lastMonth ? "text-green-600" : "text-red-600"}>
                    {trendIcon(dim.score, dim.lastMonth)} {trendText(dim.score, dim.lastMonth)} pts
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">vs Benchmark ({dim.benchmark})</span>
                  <span className={dim.score >= dim.benchmark ? "text-green-600" : "text-red-600"}>
                    {dim.score - dim.benchmark >= 0 ? "+" : ""}{dim.score - dim.benchmark} pts
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Weight</span>
                  <span>{dim.weight}%</span>
                </div>
                <div className="pt-2 border-t text-xs space-y-1">
                  <div className="flex items-start gap-1">
                    <TrendingUp className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-green-700">{dim.topContributor}</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <TrendingDown className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                    <span className="text-red-700">{dim.topDrag}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Trend History LineChart ──────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">6-Month Health Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {DIMENSION_KEYS.map((dk) => (
                <Button
                  key={dk.key}
                  size="sm"
                  variant={visibleLines.has(dk.key) ? "default" : "outline"}
                  onClick={() => toggleLine(dk.key)}
                  className="text-xs"
                >
                  <span
                    className="w-3 h-3 rounded-full mr-1 inline-block"
                    style={{ backgroundColor: dk.color }}
                  />
                  {dk.label}
                </Button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={dealer.history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                {DIMENSION_KEYS.filter((dk) => visibleLines.has(dk.key)).map((dk) => (
                  <Line
                    key={dk.key}
                    type="monotone"
                    dataKey={dk.key}
                    name={dk.label}
                    stroke={dk.color}
                    strokeWidth={dk.key === "overall" ? 3 : 2}
                    dot={dk.key === "overall"}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Prescription Section ────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              AI-Generated Prescriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dealer.prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="flex items-start gap-4 p-3 rounded-lg border bg-gray-50"
                >
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-xs text-gray-500 uppercase">Impact</span>
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-4 rounded-sm ${
                            i < rx.impact ? "bg-indigo-500" : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{rx.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {rx.dimension}
                      </Badge>
                      <span className="text-xs text-green-600 font-medium">
                        +{rx.estimatedGain} pts estimated
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Score Breakdown Table ────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 pr-4">Metric</th>
                    <th className="pb-2 pr-4 text-right">Weight %</th>
                    <th className="pb-2 pr-4 text-right">Raw Value</th>
                    <th className="pb-2 pr-4 text-right">Score</th>
                    <th className="pb-2 pr-4 text-right">Weighted</th>
                    <th className="pb-2 text-right">vs Benchmark</th>
                  </tr>
                </thead>
                <tbody>
                  {weightedBreakdown.map((row) => (
                    <tr key={row.metric} className="border-b last:border-b-0">
                      <td className="py-2 pr-4 font-medium">{row.metric}</td>
                      <td className="py-2 pr-4 text-right">{row.weight}%</td>
                      <td className="py-2 pr-4 text-right text-gray-600">{row.rawValue}</td>
                      <td className="py-2 pr-4 text-right">
                        <span className={scoreColor(row.score)}>{row.score}</span>
                      </td>
                      <td className="py-2 pr-4 text-right">{row.weightedScore}</td>
                      <td className="py-2 text-right">
                        <span
                          className={
                            row.benchmarkDelta >= 0 ? "text-green-600" : "text-red-600"
                          }
                        >
                          {row.benchmarkDelta >= 0 ? "+" : ""}
                          {row.benchmarkDelta}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="pt-2">Overall</td>
                    <td className="pt-2 text-right">100%</td>
                    <td className="pt-2 text-right">—</td>
                    <td className="pt-2 text-right">
                      <span className={scoreColor(overallScore)}>{overallScore}</span>
                    </td>
                    <td className="pt-2 text-right">{overallScore}</td>
                    <td className="pt-2 text-right">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ── Dealership Comparison Radar ──────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dealership Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              {DEALERSHIPS.map((d) => (
                <div key={d.id} className="flex items-center gap-2">
                  <Badge className={scoreBg(d.overall)}>
                    {d.name}: {d.overall} ({letterGrade(d.overall)})
                  </Badge>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Radar
                  name="Downtown Honda"
                  dataKey="Downtown Honda"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.15}
                />
                <Radar
                  name="Eastside Toyota"
                  dataKey="Eastside Toyota"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.15}
                />
                <Radar
                  name="Metro Ford"
                  dataKey="Metro Ford"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.15}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
