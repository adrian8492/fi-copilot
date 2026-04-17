import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// F&I Benchmarks — Percentile, Gap, Regional, Radar
// ═══════════════════════════════════════════════════════════════════

function calculatePercentile(yourValue: number, nationalAvg: number, top1Value: number): number {
  return Math.min(99, Math.max(1, Math.round(
    50 + ((yourValue - nationalAvg) / (top1Value - nationalAvg)) * 45
  )));
}

function calculatePerformanceGap(target: number, actual: number): number {
  return +(target - actual).toFixed(2);
}

function calculateGapRevenueImpact(gap: number, revenuePerPoint: number): number {
  return Math.round(gap * revenuePerPoint);
}

interface RegionalMultipliers {
  [key: string]: number;
}

const REGIONAL_MULTIPLIERS: RegionalMultipliers = {
  National: 1.0,
  Southeast: 0.95,
  Midwest: 0.92,
  West: 1.08,
  Northeast: 1.05,
};

function getRegionalBenchmark(baseValue: number, region: string): number {
  const multiplier = REGIONAL_MULTIPLIERS[region] ?? 1.0;
  return +(baseValue * multiplier).toFixed(1);
}

function normalizeForRadar(value: number, min: number, max: number): number {
  return Math.round(((value - min) / (max - min)) * 100);
}

function shapeRadarData(
  metrics: { label: string; yourStore: number; nationalAvg: number; top10: number; top1: number }[]
): { metric: string; YourStore: number; NationalAvg: number; Top10: number }[] {
  return metrics.map((m) => {
    const min = m.nationalAvg * 0.5;
    const max = m.top1 * 1.1;
    return {
      metric: m.label,
      YourStore: normalizeForRadar(m.yourStore, min, max),
      NationalAvg: normalizeForRadar(m.nationalAvg, min, max),
      Top10: normalizeForRadar(m.top10, min, max),
    };
  });
}

function calculateYoYImprovement(currentPVR: number, priorPVR: number): number {
  return +((currentPVR - priorPVR) / priorPVR * 100).toFixed(1);
}

describe("F&I Benchmarks — percentile calculation", () => {
  it("calculates percentile for above-average store", () => {
    expect(calculatePercentile(1847, 1100, 3200)).toBe(66);
  });
  it("returns 50 when at national average", () => {
    expect(calculatePercentile(1100, 1100, 3200)).toBe(50);
  });
  it("caps at 99", () => {
    expect(calculatePercentile(5000, 1100, 3200)).toBe(99);
  });
  it("floors at 1 for far-below-average", () => {
    expect(calculatePercentile(-5000, 1100, 3200)).toBe(1);
  });
});

describe("F&I Benchmarks — performance gap calculation", () => {
  it("positive gap when below target", () => {
    expect(calculatePerformanceGap(2400, 1847)).toBe(553);
  });
  it("zero gap when at target", () => {
    expect(calculatePerformanceGap(1847, 1847)).toBe(0);
  });
  it("negative gap when above target", () => {
    expect(calculatePerformanceGap(1500, 1847)).toBe(-347);
  });
});

describe("F&I Benchmarks — gap revenue impact estimate", () => {
  it("calculates monthly revenue impact", () => {
    expect(calculateGapRevenueImpact(553, 150)).toBe(82950);
  });
  it("zero impact for zero gap", () => {
    expect(calculateGapRevenueImpact(0, 150)).toBe(0);
  });
  it("handles fractional gap", () => {
    expect(calculateGapRevenueImpact(0.5, 400)).toBe(200);
  });
});

describe("F&I Benchmarks — regional benchmark data lookup", () => {
  it("returns national baseline unchanged", () => {
    expect(getRegionalBenchmark(1100, "National")).toBe(1100);
  });
  it("applies southeast multiplier", () => {
    expect(getRegionalBenchmark(1100, "Southeast")).toBe(1045);
  });
  it("applies west multiplier", () => {
    expect(getRegionalBenchmark(1100, "West")).toBe(1188);
  });
  it("falls back to 1.0 for unknown region", () => {
    expect(getRegionalBenchmark(1100, "Unknown")).toBe(1100);
  });
});

describe("F&I Benchmarks — radar chart data shaping", () => {
  it("shapes 6 metrics into normalized 0-100 scores", () => {
    const metrics = [
      { label: "PVR", yourStore: 1847, nationalAvg: 1100, top10: 2400, top1: 3200 },
      { label: "GAP", yourStore: 38, nationalAvg: 28, top10: 55, top1: 68 },
      { label: "VSC", yourStore: 48, nationalAvg: 35, top10: 62, top1: 75 },
      { label: "Products", yourStore: 1.9, nationalAvg: 1.4, top10: 2.8, top1: 3.5 },
      { label: "Finance", yourStore: 72, nationalAvg: 65, top10: 82, top1: 90 },
      { label: "Satisfaction", yourStore: 83, nationalAvg: 78, top10: 91, top1: 96 },
    ];
    const result = shapeRadarData(metrics);
    expect(result).toHaveLength(6);
    result.forEach((r) => {
      expect(r.YourStore).toBeGreaterThanOrEqual(0);
      expect(r.YourStore).toBeLessThanOrEqual(100);
      expect(r.NationalAvg).toBeGreaterThanOrEqual(0);
      expect(r.Top10).toBeGreaterThanOrEqual(0);
    });
  });
  it("YourStore > NationalAvg when store beats average", () => {
    const metrics = [{ label: "PVR", yourStore: 1847, nationalAvg: 1100, top10: 2400, top1: 3200 }];
    const result = shapeRadarData(metrics);
    expect(result[0].YourStore).toBeGreaterThan(result[0].NationalAvg);
  });
});

describe("F&I Benchmarks — YoY improvement calculation", () => {
  it("calculates improvement percentage", () => {
    expect(calculateYoYImprovement(1847, 1088)).toBe(69.8);
  });
  it("zero for no change", () => {
    expect(calculateYoYImprovement(1100, 1100)).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Objection Library — Search, Filter, Practice, Category
// ═══════════════════════════════════════════════════════════════════

interface ObjectionRecord {
  id: number;
  objection: string;
  category: string;
  difficulty: number;
  response: string;
}

function filterByCategory(objections: ObjectionRecord[], category: string): ObjectionRecord[] {
  if (category === "All") return objections;
  return objections.filter((o) => o.category === category);
}

function searchObjections(objections: ObjectionRecord[], keyword: string): ObjectionRecord[] {
  const q = keyword.toLowerCase();
  return objections.filter(
    (o) => o.objection.toLowerCase().includes(q) || o.response.toLowerCase().includes(q)
  );
}

function sortByDifficulty(objections: ObjectionRecord[], ascending: boolean): ObjectionRecord[] {
  return [...objections].sort((a, b) => ascending ? a.difficulty - b.difficulty : b.difficulty - a.difficulty);
}

function togglePracticed(practiced: Set<number>, id: number): Set<number> {
  const next = new Set(practiced);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

function countPracticed(practiced: Set<number>): number {
  return practiced.size;
}

function getObjectionOfDay(objections: ObjectionRecord[], dayOfYear: number): ObjectionRecord {
  return objections[dayOfYear % objections.length];
}

function weeklyProgressPercent(practiced: number, total: number): number {
  return total > 0 ? Math.round((practiced / total) * 100) : 0;
}

const SAMPLE_OBJECTIONS: ObjectionRecord[] = [
  { id: 1, objection: "My payment is already too high", category: "Price/Payment", difficulty: 2, response: "Let me show you how these protections save you money." },
  { id: 2, objection: "I don't need a warranty, this car is new", category: "Product Value", difficulty: 3, response: "Factory warranty covers you for a few years but most expensive repairs happen years 4-7." },
  { id: 3, objection: "I don't trust dealership add-ons", category: "Trust/Dealership", difficulty: 4, response: "These are backed by A-rated insurance companies." },
  { id: 4, objection: "My insurance covers everything", category: "I Already Have It", difficulty: 3, response: "Insurance covers accidents, not mechanical breakdowns." },
  { id: 5, objection: "Let me think about it", category: "Timing/Urgency", difficulty: 4, response: "Today's rate is locked to this transaction." },
  { id: 6, objection: "My credit is bad, will products affect approval?", category: "Credit/Approval", difficulty: 2, response: "Products are added after approval, they don't affect your credit decision." },
];

describe("Objection Library — category filtering", () => {
  it("returns all when category is All", () => {
    expect(filterByCategory(SAMPLE_OBJECTIONS, "All")).toHaveLength(6);
  });
  it("filters by Price/Payment", () => {
    expect(filterByCategory(SAMPLE_OBJECTIONS, "Price/Payment")).toHaveLength(1);
  });
  it("returns empty for non-existent category", () => {
    expect(filterByCategory(SAMPLE_OBJECTIONS, "NonExistent")).toHaveLength(0);
  });
});

describe("Objection Library — search", () => {
  it("finds by keyword in objection text (case-insensitive)", () => {
    expect(searchObjections(SAMPLE_OBJECTIONS, "WARRANTY")).toHaveLength(1);
  });
  it("finds by keyword in response text", () => {
    expect(searchObjections(SAMPLE_OBJECTIONS, "A-rated")).toHaveLength(1);
  });
  it("returns all for empty search", () => {
    expect(searchObjections(SAMPLE_OBJECTIONS, "")).toHaveLength(6);
  });
  it("returns none when no match", () => {
    expect(searchObjections(SAMPLE_OBJECTIONS, "xyznonexistent")).toHaveLength(0);
  });
});

describe("Objection Library — difficulty sort", () => {
  it("sorts ascending", () => {
    const sorted = sortByDifficulty(SAMPLE_OBJECTIONS, true);
    expect(sorted[0].difficulty).toBe(2);
    expect(sorted[sorted.length - 1].difficulty).toBe(4);
  });
  it("sorts descending", () => {
    const sorted = sortByDifficulty(SAMPLE_OBJECTIONS, false);
    expect(sorted[0].difficulty).toBe(4);
  });
});

describe("Objection Library — practice mode state", () => {
  it("marks an objection as practiced", () => {
    const result = togglePracticed(new Set(), 1);
    expect(result.has(1)).toBe(true);
  });
  it("unmarks a practiced objection", () => {
    const result = togglePracticed(new Set([1, 2]), 1);
    expect(result.has(1)).toBe(false);
    expect(result.has(2)).toBe(true);
  });
  it("counts practiced objections", () => {
    expect(countPracticed(new Set([1, 3, 5]))).toBe(3);
  });
});

describe("Objection Library — objection of the day", () => {
  it("selects by day of year modulo", () => {
    const obj = getObjectionOfDay(SAMPLE_OBJECTIONS, 106); // day 106 % 6 = 4
    expect(obj.id).toBe(5);
  });
  it("wraps around for large day values", () => {
    const obj = getObjectionOfDay(SAMPLE_OBJECTIONS, 366);
    expect(obj).toBeDefined();
  });
});

describe("Objection Library — weekly practice progress", () => {
  it("calculates percentage", () => {
    expect(weeklyProgressPercent(15, 25)).toBe(60);
  });
  it("returns 0 for no total", () => {
    expect(weeklyProgressPercent(0, 0)).toBe(0);
  });
  it("returns 100 for all practiced", () => {
    expect(weeklyProgressPercent(25, 25)).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Deal Funding Tracker — Pipeline, Aging, Days, Stips, Lender
// ═══════════════════════════════════════════════════════════════════

type FundingStatus = "Contract Signed" | "Submitted to Lender" | "Pending Stipulations" | "Approved" | "Funded";
const PIPELINE_STAGES: FundingStatus[] = ["Contract Signed", "Submitted to Lender", "Pending Stipulations", "Approved", "Funded"];

function classifyAging(daysPending: number): "current" | "amber" | "red" {
  if (daysPending > 14) return "red";
  if (daysPending > 7) return "amber";
  return "current";
}

function calculateDaysToFund(contractDate: string, fundedDate: string): number {
  return Math.round((new Date(fundedDate).getTime() - new Date(contractDate).getTime()) / 86400000);
}

interface StipRecord {
  name: string;
  resolved: boolean;
}

function stipsCompletionRate(stips: StipRecord[]): number {
  if (stips.length === 0) return 100;
  return Math.round((stips.filter((s) => s.resolved).length / stips.length) * 100);
}

function lenderAvgDaysToFund(deals: { lender: string; daysToFund: number }[], lenderName: string): number {
  const lenderDeals = deals.filter((d) => d.lender === lenderName);
  if (lenderDeals.length === 0) return 0;
  return +(lenderDeals.reduce((s, d) => s + d.daysToFund, 0) / lenderDeals.length).toFixed(1);
}

function calculateFundingRate(funded: number, submitted: number): number {
  return submitted > 0 ? Math.round((funded / submitted) * 100) : 0;
}

interface FundingDeal {
  id: string;
  status: FundingStatus;
  amountFinanced: number;
  contractDate: string;
  fundedDate: string | null;
  lender: string;
  manager: string;
}

function aggregateFundingByDay(deals: FundingDeal[]): { day: number; funded: number }[] {
  const map = new Map<number, number>();
  deals.filter((d) => d.fundedDate).forEach((d) => {
    // Parse date parts to avoid timezone offset issues
    const parts = d.fundedDate!.split("-");
    const day = parseInt(parts[2], 10);
    map.set(day, (map.get(day) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([day, funded]) => ({ day, funded })).sort((a, b) => a.day - b.day);
}

function filterDealsByStatus(deals: FundingDeal[], status: FundingStatus): FundingDeal[] {
  return deals.filter((d) => d.status === status);
}

function totalPendingFunding(deals: FundingDeal[]): number {
  return deals.filter((d) => d.status !== "Funded").reduce((s, d) => s + d.amountFinanced, 0);
}

function longestPendingDeal(deals: FundingDeal[], today: string): number {
  const pending = deals.filter((d) => d.status !== "Funded");
  if (pending.length === 0) return 0;
  return Math.max(...pending.map((d) => calculateDaysToFund(d.contractDate, today)));
}

function fundedThisWeek(deals: FundingDeal[], today: string): number {
  const todayMs = new Date(today).getTime();
  const weekAgoMs = todayMs - 7 * 86400000;
  return deals.filter((d) => d.fundedDate && new Date(d.fundedDate).getTime() >= weekAgoMs).length;
}

function filterDealsByManager(deals: FundingDeal[], manager: string): FundingDeal[] {
  return deals.filter((d) => d.manager === manager);
}

function filterDealsByLender(deals: FundingDeal[], lender: string): FundingDeal[] {
  return deals.filter((d) => d.lender === lender);
}

describe("Deal Funding — pipeline stages", () => {
  it("has 5 ordered stages", () => {
    expect(PIPELINE_STAGES).toHaveLength(5);
    expect(PIPELINE_STAGES[0]).toBe("Contract Signed");
    expect(PIPELINE_STAGES[4]).toBe("Funded");
  });
});

describe("Deal Funding — aging classification", () => {
  it("current for 0-7 days", () => {
    expect(classifyAging(3)).toBe("current");
    expect(classifyAging(7)).toBe("current");
  });
  it("amber for 8-14 days", () => {
    expect(classifyAging(8)).toBe("amber");
    expect(classifyAging(14)).toBe("amber");
  });
  it("red for 15+ days", () => {
    expect(classifyAging(15)).toBe("red");
    expect(classifyAging(30)).toBe("red");
  });
});

describe("Deal Funding — days to fund calculation", () => {
  it("calculates days between contract and funded date", () => {
    expect(calculateDaysToFund("2026-04-01", "2026-04-04")).toBe(3);
  });
  it("returns 0 for same day", () => {
    expect(calculateDaysToFund("2026-04-10", "2026-04-10")).toBe(0);
  });
});

describe("Deal Funding — stips completion rate", () => {
  it("100% when all resolved", () => {
    expect(stipsCompletionRate([{ name: "POI", resolved: true }, { name: "DL", resolved: true }])).toBe(100);
  });
  it("50% when half resolved", () => {
    expect(stipsCompletionRate([{ name: "POI", resolved: true }, { name: "Paystub", resolved: false }])).toBe(50);
  });
  it("100% for empty stips", () => {
    expect(stipsCompletionRate([])).toBe(100);
  });
  it("0% when none resolved", () => {
    expect(stipsCompletionRate([{ name: "POI", resolved: false }, { name: "DL", resolved: false }])).toBe(0);
  });
});

describe("Deal Funding — lender avg days to fund", () => {
  const deals = [
    { lender: "Ally", daysToFund: 3 },
    { lender: "Ally", daysToFund: 5 },
    { lender: "Chase", daysToFund: 4 },
  ];
  it("calculates average for lender", () => {
    expect(lenderAvgDaysToFund(deals, "Ally")).toBe(4);
  });
  it("returns 0 for unknown lender", () => {
    expect(lenderAvgDaysToFund(deals, "Unknown")).toBe(0);
  });
});

describe("Deal Funding — funding rate calculation", () => {
  it("calculates funded/submitted percentage", () => {
    expect(calculateFundingRate(10, 18)).toBe(56);
  });
  it("returns 0 when no submissions", () => {
    expect(calculateFundingRate(0, 0)).toBe(0);
  });
  it("returns 100 when all funded", () => {
    expect(calculateFundingRate(5, 5)).toBe(100);
  });
});

describe("Deal Funding — monthly trend aggregation", () => {
  const deals: FundingDeal[] = [
    { id: "1", status: "Funded", amountFinanced: 30000, contractDate: "2026-04-01", fundedDate: "2026-04-04", lender: "Ally", manager: "Mike" },
    { id: "2", status: "Funded", amountFinanced: 35000, contractDate: "2026-04-02", fundedDate: "2026-04-04", lender: "Chase", manager: "Lisa" },
    { id: "3", status: "Funded", amountFinanced: 40000, contractDate: "2026-04-05", fundedDate: "2026-04-08", lender: "Ally", manager: "Mike" },
  ];
  it("groups funded deals by day of month", () => {
    const result = aggregateFundingByDay(deals);
    expect(result.find((d) => d.day === 4)?.funded).toBe(2);
    expect(result.find((d) => d.day === 8)?.funded).toBe(1);
  });
});

describe("Deal Funding — status filter", () => {
  const deals: FundingDeal[] = [
    { id: "1", status: "Funded", amountFinanced: 30000, contractDate: "2026-04-01", fundedDate: "2026-04-04", lender: "Ally", manager: "Mike" },
    { id: "2", status: "Pending Stipulations", amountFinanced: 35000, contractDate: "2026-04-05", fundedDate: null, lender: "Chase", manager: "Lisa" },
  ];
  it("filters by status", () => {
    expect(filterDealsByStatus(deals, "Funded")).toHaveLength(1);
    expect(filterDealsByStatus(deals, "Pending Stipulations")).toHaveLength(1);
    expect(filterDealsByStatus(deals, "Approved")).toHaveLength(0);
  });
});

describe("Deal Funding — pending funding total", () => {
  const deals: FundingDeal[] = [
    { id: "1", status: "Funded", amountFinanced: 30000, contractDate: "2026-04-01", fundedDate: "2026-04-04", lender: "Ally", manager: "Mike" },
    { id: "2", status: "Pending Stipulations", amountFinanced: 35000, contractDate: "2026-04-05", fundedDate: null, lender: "Chase", manager: "Lisa" },
    { id: "3", status: "Submitted to Lender", amountFinanced: 40000, contractDate: "2026-04-06", fundedDate: null, lender: "Ally", manager: "Mike" },
  ];
  it("sums non-funded deal amounts", () => {
    expect(totalPendingFunding(deals)).toBe(75000);
  });
});

describe("Deal Funding — longest pending deal", () => {
  const deals: FundingDeal[] = [
    { id: "1", status: "Pending Stipulations", amountFinanced: 35000, contractDate: "2026-04-05", fundedDate: null, lender: "Chase", manager: "Lisa" },
    { id: "2", status: "Contract Signed", amountFinanced: 40000, contractDate: "2026-04-01", fundedDate: null, lender: "Ally", manager: "Mike" },
    { id: "3", status: "Funded", amountFinanced: 30000, contractDate: "2026-03-15", fundedDate: "2026-04-01", lender: "Ally", manager: "Mike" },
  ];
  it("finds max days for pending deals", () => {
    expect(longestPendingDeal(deals, "2026-04-16")).toBe(15);
  });
});

describe("Deal Funding — funded this week count", () => {
  const deals: FundingDeal[] = [
    { id: "1", status: "Funded", amountFinanced: 30000, contractDate: "2026-04-01", fundedDate: "2026-04-14", lender: "Ally", manager: "Mike" },
    { id: "2", status: "Funded", amountFinanced: 35000, contractDate: "2026-04-05", fundedDate: "2026-04-10", lender: "Chase", manager: "Lisa" },
    { id: "3", status: "Funded", amountFinanced: 25000, contractDate: "2026-04-02", fundedDate: "2026-04-04", lender: "Ally", manager: "Mike" },
  ];
  it("counts deals funded within last 7 days", () => {
    expect(fundedThisWeek(deals, "2026-04-16")).toBe(2);
  });
});

describe("Deal Funding — manager filter", () => {
  const deals: FundingDeal[] = [
    { id: "1", status: "Funded", amountFinanced: 30000, contractDate: "2026-04-01", fundedDate: "2026-04-04", lender: "Ally", manager: "Mike Chen" },
    { id: "2", status: "Funded", amountFinanced: 35000, contractDate: "2026-04-05", fundedDate: "2026-04-08", lender: "Chase", manager: "Lisa Park" },
  ];
  it("filters by manager name", () => {
    expect(filterDealsByManager(deals, "Mike Chen")).toHaveLength(1);
    expect(filterDealsByManager(deals, "Lisa Park")).toHaveLength(1);
  });
});

describe("Deal Funding — lender filter", () => {
  const deals: FundingDeal[] = [
    { id: "1", status: "Funded", amountFinanced: 30000, contractDate: "2026-04-01", fundedDate: "2026-04-04", lender: "Ally Financial", manager: "Mike" },
    { id: "2", status: "Funded", amountFinanced: 35000, contractDate: "2026-04-05", fundedDate: "2026-04-08", lender: "Chase Auto", manager: "Lisa" },
  ];
  it("filters by lender name", () => {
    expect(filterDealsByLender(deals, "Ally Financial")).toHaveLength(1);
    expect(filterDealsByLender(deals, "Chase Auto")).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Data Structure Validation
// ═══════════════════════════════════════════════════════════════════

describe("Benchmark data structure validation", () => {
  const benchmarkEntry = {
    metric: "PVR ($)",
    nationalAvg: 1100,
    top25: 1650,
    top10: 2400,
    top1: 3200,
    yourStore: 1847,
    unit: "$",
  };
  it("has all required fields", () => {
    expect(benchmarkEntry).toHaveProperty("metric");
    expect(benchmarkEntry).toHaveProperty("nationalAvg");
    expect(benchmarkEntry).toHaveProperty("top25");
    expect(benchmarkEntry).toHaveProperty("top10");
    expect(benchmarkEntry).toHaveProperty("top1");
    expect(benchmarkEntry).toHaveProperty("yourStore");
    expect(benchmarkEntry).toHaveProperty("unit");
  });
  it("values are in ascending order", () => {
    expect(benchmarkEntry.nationalAvg).toBeLessThan(benchmarkEntry.top25);
    expect(benchmarkEntry.top25).toBeLessThan(benchmarkEntry.top10);
    expect(benchmarkEntry.top10).toBeLessThan(benchmarkEntry.top1);
  });
});

describe("Objection card data structure validation", () => {
  const objection = {
    id: 1,
    objection: "My payment is too high",
    response: "Let me show you how protections save money.",
    category: "Price/Payment",
    difficulty: 2,
  };
  it("has required fields", () => {
    expect(objection).toHaveProperty("objection");
    expect(objection).toHaveProperty("response");
    expect(objection).toHaveProperty("category");
    expect(objection).toHaveProperty("difficulty");
  });
  it("difficulty is 1-5", () => {
    expect(objection.difficulty).toBeGreaterThanOrEqual(1);
    expect(objection.difficulty).toBeLessThanOrEqual(5);
  });
});

describe("Deal funding record structure validation", () => {
  const deal = {
    id: "D-4401",
    customer: "James Wilson",
    vehicle: "2026 Toyota Camry",
    lender: "Ally Financial",
    amountFinanced: 32500,
    contractDate: "2026-04-01",
    submittedDate: "2026-04-01",
    fundedDate: "2026-04-04",
    status: "Funded" as FundingStatus,
    manager: "Mike Chen",
  };
  it("has all required status fields", () => {
    expect(deal).toHaveProperty("id");
    expect(deal).toHaveProperty("status");
    expect(deal).toHaveProperty("amountFinanced");
    expect(deal).toHaveProperty("contractDate");
    expect(deal).toHaveProperty("fundedDate");
    expect(deal).toHaveProperty("lender");
    expect(deal).toHaveProperty("manager");
  });
  it("status is a valid pipeline stage", () => {
    expect(PIPELINE_STAGES).toContain(deal.status);
  });
});

describe("Combined pipeline stage count", () => {
  it("has exactly 5 stages", () => {
    expect(PIPELINE_STAGES).toHaveLength(5);
  });
  it("starts with Contract Signed and ends with Funded", () => {
    expect(PIPELINE_STAGES[0]).toBe("Contract Signed");
    expect(PIPELINE_STAGES[PIPELINE_STAGES.length - 1]).toBe("Funded");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Credit Tier Classification (reuse from lender matrix)
// ═══════════════════════════════════════════════════════════════════

type CreditTier = "Super Prime" | "Prime" | "Near Prime" | "Sub Prime" | "Deep Sub";

function classifyCreditTier(score: number): CreditTier {
  if (score >= 780) return "Super Prime";
  if (score >= 720) return "Prime";
  if (score >= 660) return "Near Prime";
  if (score >= 580) return "Sub Prime";
  return "Deep Sub";
}

describe("Credit tier classification (reuse)", () => {
  it("Super Prime for 780+", () => {
    expect(classifyCreditTier(800)).toBe("Super Prime");
  });
  it("Prime for 720-779", () => {
    expect(classifyCreditTier(750)).toBe("Prime");
  });
  it("Near Prime for 660-719", () => {
    expect(classifyCreditTier(680)).toBe("Near Prime");
  });
  it("Sub Prime for 580-659", () => {
    expect(classifyCreditTier(600)).toBe("Sub Prime");
  });
  it("Deep Sub for <580", () => {
    expect(classifyCreditTier(500)).toBe("Deep Sub");
  });
});
