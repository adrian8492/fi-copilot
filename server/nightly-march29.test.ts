import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// 1. Scorecard PDF Export Data Formatting
// ═══════════════════════════════════════════════════════════════════
interface ScorecardData {
  managerName: string;
  dealership: string;
  dateRange: string;
  overallScore: number;
  subscores: { label: string; value: number }[];
  strengths: { label: string; value: number }[];
  improvements: { label: string; value: number }[];
  gradeTrend: number[];
  sessionsCount: number;
  avgPvr: number;
  penetrationPct: number;
}

function formatScorecardData(
  name: string,
  dealership: string,
  scores: Record<string, number>,
  trend: number[],
  sessions: number,
  pvr: number,
  penetration: number,
): ScorecardData {
  const subscoreLabels = ["Rapport", "Needs Discovery", "Product Presentation", "Objection Handling", "Closing"];
  const subscores = subscoreLabels.map((label) => ({ label, value: scores[label] ?? 0 }));
  const sorted = [...subscores].sort((a, b) => b.value - a.value);
  return {
    managerName: name,
    dealership,
    dateRange: "Last 30 Days",
    overallScore: Math.round(subscores.reduce((s, sc) => s + sc.value, 0) / subscores.length),
    subscores,
    strengths: sorted.slice(0, 3),
    improvements: [...subscores].sort((a, b) => a.value - b.value).slice(0, 3),
    gradeTrend: trend,
    sessionsCount: sessions,
    avgPvr: pvr,
    penetrationPct: penetration,
  };
}

describe("Scorecard PDF Export — data formatting", () => {
  const scores = { Rapport: 85, "Needs Discovery": 72, "Product Presentation": 90, "Objection Handling": 65, Closing: 78 };
  const data = formatScorecardData("Test Manager", "Test Dealer", scores, [80, 82, 84], 24, 3100, 68);

  it("formats manager name and dealership correctly", () => {
    expect(data.managerName).toBe("Test Manager");
    expect(data.dealership).toBe("Test Dealer");
  });
  it("computes overall score as average of subscores", () => {
    expect(data.overallScore).toBe(78); // (85+72+90+65+78)/5 = 78
  });
  it("has exactly 5 subscores", () => {
    expect(data.subscores).toHaveLength(5);
    expect(data.subscores.map((s) => s.label)).toEqual([
      "Rapport", "Needs Discovery", "Product Presentation", "Objection Handling", "Closing",
    ]);
  });
  it("strengths are top 3 by value descending", () => {
    expect(data.strengths[0].label).toBe("Product Presentation");
    expect(data.strengths[0].value).toBe(90);
    expect(data.strengths).toHaveLength(3);
  });
  it("improvements are bottom 3 by value ascending", () => {
    expect(data.improvements[0].label).toBe("Objection Handling");
    expect(data.improvements[0].value).toBe(65);
  });
  it("preserves grade trend array", () => {
    expect(data.gradeTrend).toEqual([80, 82, 84]);
  });
  it("includes key metrics", () => {
    expect(data.sessionsCount).toBe(24);
    expect(data.avgPvr).toBe(3100);
    expect(data.penetrationPct).toBe(68);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. Trainer Dashboard KPI Calculations
// ═══════════════════════════════════════════════════════════════════
interface Manager {
  id: number;
  name: string;
  score: number;
  lastMonthScore: number;
  pvr: number;
  compliance: number;
}

function computeTrainerKPIs(managers: Manager[]) {
  const avgScore = Math.round(managers.reduce((s, m) => s + m.score, 0) / managers.length);
  const mostImproved = [...managers].sort((a, b) => (b.score - b.lastMonthScore) - (a.score - a.lastMonthScore))[0];
  const mostAtRisk = [...managers].sort((a, b) => a.score - b.score)[0];
  return { totalManagers: managers.length, avgScore, mostImproved, mostAtRisk };
}

describe("Trainer Dashboard — KPI calculations", () => {
  const managers: Manager[] = [
    { id: 1, name: "Alice", score: 90, lastMonthScore: 80, pvr: 3000, compliance: 95 },
    { id: 2, name: "Bob", score: 70, lastMonthScore: 72, pvr: 2500, compliance: 80 },
    { id: 3, name: "Carol", score: 55, lastMonthScore: 50, pvr: 2100, compliance: 68 },
  ];

  it("calculates average score correctly", () => {
    const kpi = computeTrainerKPIs(managers);
    expect(kpi.avgScore).toBe(72); // (90+70+55)/3 = 71.67 → 72
  });
  it("identifies most improved as largest positive delta", () => {
    const kpi = computeTrainerKPIs(managers);
    expect(kpi.mostImproved.name).toBe("Alice"); // +10
  });
  it("identifies most at-risk as lowest score", () => {
    const kpi = computeTrainerKPIs(managers);
    expect(kpi.mostAtRisk.name).toBe("Carol"); // 55
  });
  it("reports correct total manager count", () => {
    const kpi = computeTrainerKPIs(managers);
    expect(kpi.totalManagers).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. Manager Card Color Tier Logic
// ═══════════════════════════════════════════════════════════════════
function getColorTier(score: number): "green" | "yellow" | "red" {
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  return "red";
}

describe("Manager card color tier thresholds", () => {
  it("score >= 80 is green", () => { expect(getColorTier(80)).toBe("green"); });
  it("score 100 is green", () => { expect(getColorTier(100)).toBe("green"); });
  it("score 79 is yellow", () => { expect(getColorTier(79)).toBe("yellow"); });
  it("score 60 is yellow", () => { expect(getColorTier(60)).toBe("yellow"); });
  it("score 59 is red", () => { expect(getColorTier(59)).toBe("red"); });
  it("score 0 is red", () => { expect(getColorTier(0)).toBe("red"); });
});

// ═══════════════════════════════════════════════════════════════════
// 4. Deal Timeline — Grouping by Week
// ═══════════════════════════════════════════════════════════════════
function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const dayOfWeek = d.getDay();
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - dayOfWeek);
  return startOfWeek.toISOString().slice(0, 10);
}

function groupByWeek<T extends { date: string }>(deals: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const deal of deals) {
    const key = getWeekKey(deal.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(deal);
  }
  return groups;
}

describe("Deal Timeline — grouping by week", () => {
  const deals = [
    { date: "2026-03-29T10:00:00Z", id: 1 },
    { date: "2026-03-28T10:00:00Z", id: 2 },
    { date: "2026-03-22T10:00:00Z", id: 3 },
    { date: "2026-03-15T10:00:00Z", id: 4 },
  ];
  it("groups deals into correct week buckets", () => {
    const groups = groupByWeek(deals);
    expect(groups.size).toBeGreaterThanOrEqual(2);
  });
  it("same-week deals share the same key", () => {
    // Mon Mar 23 and Fri Mar 27 are in the same Sun–Sat week (Sun Mar 22 – Sat Mar 28)
    const key1 = getWeekKey("2026-03-23T10:00:00Z");
    const key2 = getWeekKey("2026-03-27T10:00:00Z");
    expect(key1).toBe(key2);
  });
  it("different-week deals get different keys", () => {
    const key1 = getWeekKey("2026-03-29T10:00:00Z");
    const key2 = getWeekKey("2026-03-15T10:00:00Z");
    expect(key1).not.toBe(key2);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. Deal Timeline — Filtering
// ═══════════════════════════════════════════════════════════════════
interface Deal {
  id: number;
  score: number;
  manager: string;
  dealership: string;
}

function filterDeals(
  deals: Deal[],
  scoreTier: "all" | "green" | "yellow" | "red",
  manager: string,
  dealership: string,
): Deal[] {
  return deals.filter((d) => {
    if (scoreTier !== "all" && getColorTier(d.score) !== scoreTier) return false;
    if (manager !== "all" && d.manager !== manager) return false;
    if (dealership !== "all" && d.dealership !== dealership) return false;
    return true;
  });
}

describe("Deal Timeline — filtering", () => {
  const deals: Deal[] = [
    { id: 1, score: 85, manager: "Alice", dealership: "Honda" },
    { id: 2, score: 65, manager: "Bob", dealership: "Toyota" },
    { id: 3, score: 45, manager: "Alice", dealership: "Honda" },
  ];
  it("filters by score tier", () => {
    expect(filterDeals(deals, "green", "all", "all")).toHaveLength(1);
    expect(filterDeals(deals, "yellow", "all", "all")).toHaveLength(1);
    expect(filterDeals(deals, "red", "all", "all")).toHaveLength(1);
  });
  it("filters by manager", () => {
    expect(filterDeals(deals, "all", "Alice", "all")).toHaveLength(2);
    expect(filterDeals(deals, "all", "Bob", "all")).toHaveLength(1);
  });
  it("filters by dealership", () => {
    expect(filterDeals(deals, "all", "all", "Honda")).toHaveLength(2);
  });
  it("combines multiple filters", () => {
    expect(filterDeals(deals, "green", "Alice", "Honda")).toHaveLength(1);
    expect(filterDeals(deals, "red", "Bob", "all")).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. Deal Timeline — Summary Strip Calculations
// ═══════════════════════════════════════════════════════════════════
function computeTimelineSummary(deals: Array<{ score: number; pvr: number }>) {
  if (deals.length === 0) return { avgScore: 0, totalPvr: 0, bestPvr: 0 };
  return {
    avgScore: Math.round(deals.reduce((s, d) => s + d.score, 0) / deals.length),
    totalPvr: deals.reduce((s, d) => s + d.pvr, 0),
    bestPvr: Math.max(...deals.map((d) => d.pvr)),
  };
}

describe("Deal Timeline — summary strip calculations", () => {
  const deals = [
    { score: 80, pvr: 3000 },
    { score: 60, pvr: 2000 },
    { score: 90, pvr: 4000 },
  ];
  it("calculates average deal score", () => {
    expect(computeTimelineSummary(deals).avgScore).toBe(77); // (80+60+90)/3 = 76.67 → 77
  });
  it("calculates total PVR", () => {
    expect(computeTimelineSummary(deals).totalPvr).toBe(9000);
  });
  it("finds best PVR", () => {
    expect(computeTimelineSummary(deals).bestPvr).toBe(4000);
  });
  it("handles empty deals", () => {
    const summary = computeTimelineSummary([]);
    expect(summary.avgScore).toBe(0);
    expect(summary.totalPvr).toBe(0);
    expect(summary.bestPvr).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 7. Benchmarking — Gap Calculation
// ═══════════════════════════════════════════════════════════════════
function computeGap(current: number, benchmark: number) {
  return {
    absolute: current - benchmark,
    percentage: benchmark > 0 ? Math.round(((current - benchmark) / benchmark) * 100) : 0,
  };
}

describe("Benchmarking — gap calculation", () => {
  it("positive gap when above benchmark", () => {
    const gap = computeGap(90, 74);
    expect(gap.absolute).toBe(16);
    expect(gap.percentage).toBe(22);
  });
  it("negative gap when below benchmark", () => {
    const gap = computeGap(60, 74);
    expect(gap.absolute).toBe(-14);
    expect(gap.percentage).toBe(-19);
  });
  it("zero gap when equal", () => {
    const gap = computeGap(74, 74);
    expect(gap.absolute).toBe(0);
    expect(gap.percentage).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 8. Benchmarking — Status Logic
// ═══════════════════════════════════════════════════════════════════
type GapStatus = "Above" | "Below" | "On Par";

function getGapStatus(current: number, benchmark: number): GapStatus {
  if (current > benchmark) return "Above";
  if (current < benchmark - benchmark * 0.05) return "Below";
  return "On Par";
}

describe("Benchmarking — status logic", () => {
  it("Above when current > benchmark", () => {
    expect(getGapStatus(80, 74)).toBe("Above");
  });
  it("Below when current < benchmark by more than 5%", () => {
    expect(getGapStatus(60, 74)).toBe("Below"); // 74 - 3.7 = 70.3 → 60 < 70.3
  });
  it("On Par when within 5% below", () => {
    expect(getGapStatus(72, 74)).toBe("On Par"); // 74 - 3.7 = 70.3 → 72 > 70.3
  });
  it("On Par when equal", () => {
    expect(getGapStatus(74, 74)).toBe("On Par"); // 74 > 74 is false, 74 < 70.3 is false → On Par
  });
});

// ═══════════════════════════════════════════════════════════════════
// 9. Coaching Action Generation from Gaps
// ═══════════════════════════════════════════════════════════════════
function generateCoachingActions(gaps: Array<{ metric: string; status: GapStatus; gap: number }>) {
  const belowItems = gaps.filter((g) => g.status === "Below");
  if (belowItems.length === 0) return ["Continue maintaining above-benchmark performance across all metrics."];
  const actions: string[] = [];
  for (const item of belowItems.slice(0, 3)) {
    actions.push(`Improve ${item.metric} by ${Math.abs(item.gap)} points to reach benchmark.`);
  }
  return actions;
}

describe("Coaching action generation from gaps", () => {
  it("generates actions only for Below metrics", () => {
    const gaps = [
      { metric: "Score", status: "Above" as GapStatus, gap: 10 },
      { metric: "PVR", status: "Below" as GapStatus, gap: -200 },
      { metric: "Penetration", status: "Below" as GapStatus, gap: -8 },
    ];
    const actions = generateCoachingActions(gaps);
    expect(actions.length).toBeGreaterThanOrEqual(2);
    expect(actions.length).toBeLessThanOrEqual(3);
    expect(actions[0]).toContain("PVR");
  });
  it("returns maintenance message when no gaps below", () => {
    const gaps = [{ metric: "Score", status: "Above" as GapStatus, gap: 10 }];
    const actions = generateCoachingActions(gaps);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toContain("maintaining");
  });
  it("limits to 3 actions maximum", () => {
    const gaps = [
      { metric: "A", status: "Below" as GapStatus, gap: -5 },
      { metric: "B", status: "Below" as GapStatus, gap: -10 },
      { metric: "C", status: "Below" as GapStatus, gap: -15 },
      { metric: "D", status: "Below" as GapStatus, gap: -20 },
    ];
    const actions = generateCoachingActions(gaps);
    expect(actions.length).toBeLessThanOrEqual(3);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 10. Objection Trend — Line Data Shaping (8 weeks × 5 types)
// ═══════════════════════════════════════════════════════════════════
const OBJECTION_TYPES = ["Price/Payment", "Rate", "Trade Value", "Not Needed", "Think About It"] as const;

function generateTrendData(weekCount: number): Array<Record<string, number | string>> {
  const weeks: Array<Record<string, number | string>> = [];
  for (let w = 0; w < weekCount; w++) {
    const row: Record<string, number | string> = { week: `W${w + 1}` };
    for (const type of OBJECTION_TYPES) {
      row[type] = 5 + Math.floor(Math.random() * 15);
    }
    weeks.push(row);
  }
  return weeks;
}

describe("Objection Trend — data shaping (8 weeks × 5 types)", () => {
  const data = generateTrendData(8);
  it("generates exactly 8 weeks of data", () => {
    expect(data).toHaveLength(8);
  });
  it("each week has all 5 objection types", () => {
    for (const week of data) {
      for (const type of OBJECTION_TYPES) {
        expect(typeof week[type]).toBe("number");
      }
    }
  });
  it("each week has a week label", () => {
    expect(data[0].week).toBe("W1");
    expect(data[7].week).toBe("W8");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 11. "Fastest Growing" Detection
// ═══════════════════════════════════════════════════════════════════
function detectFastestGrowing(data: Array<Record<string, number | string>>): string | null {
  if (data.length < 2) return null;
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  let maxDelta = -Infinity;
  let result = "";
  for (const type of OBJECTION_TYPES) {
    const delta = (last[type] as number) - (prev[type] as number);
    if (delta > maxDelta) { maxDelta = delta; result = type; }
  }
  return maxDelta > 0 ? result : null;
}

describe("Fastest Growing detection", () => {
  it("identifies the type with largest positive week-over-week delta", () => {
    const data = [
      { week: "W1", "Price/Payment": 10, Rate: 5, "Trade Value": 4, "Not Needed": 8, "Think About It": 6 },
      { week: "W2", "Price/Payment": 15, Rate: 5, "Trade Value": 3, "Not Needed": 9, "Think About It": 6 },
    ];
    expect(detectFastestGrowing(data)).toBe("Price/Payment"); // +5
  });
  it("returns null when all deltas are non-positive", () => {
    const data = [
      { week: "W1", "Price/Payment": 10, Rate: 5, "Trade Value": 4, "Not Needed": 8, "Think About It": 6 },
      { week: "W2", "Price/Payment": 10, Rate: 5, "Trade Value": 4, "Not Needed": 8, "Think About It": 6 },
    ];
    expect(detectFastestGrowing(data)).toBeNull();
  });
  it("returns null with insufficient data", () => {
    expect(detectFastestGrowing([])).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 12. "Trending Down" Detection
// ═══════════════════════════════════════════════════════════════════
function detectTrendingDown(data: Array<Record<string, number | string>>): string | null {
  if (data.length < 2) return null;
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  let minDelta = Infinity;
  let result = "";
  for (const type of OBJECTION_TYPES) {
    const delta = (last[type] as number) - (prev[type] as number);
    if (delta < minDelta) { minDelta = delta; result = type; }
  }
  return minDelta < 0 ? result : null;
}

describe("Trending Down detection", () => {
  it("identifies the type with largest negative delta", () => {
    const data = [
      { week: "W1", "Price/Payment": 10, Rate: 5, "Trade Value": 8, "Not Needed": 8, "Think About It": 6 },
      { week: "W2", "Price/Payment": 12, Rate: 5, "Trade Value": 3, "Not Needed": 9, "Think About It": 6 },
    ];
    expect(detectTrendingDown(data)).toBe("Trade Value"); // -5
  });
  it("returns null when no deltas are negative", () => {
    const data = [
      { week: "W1", "Price/Payment": 10, Rate: 5, "Trade Value": 4, "Not Needed": 8, "Think About It": 6 },
      { week: "W2", "Price/Payment": 12, Rate: 7, "Trade Value": 5, "Not Needed": 10, "Think About It": 8 },
    ];
    expect(detectTrendingDown(data)).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 13. Objection Word Track Lookup
// ═══════════════════════════════════════════════════════════════════
const WORD_TRACKS: Record<string, string> = {
  "Price/Payment": "Compared to what? Let me show you what the actual monthly impact is.",
  "Rate": "I hear you on the rate. The good news is this protection locks in at today's cost.",
  "Trade Value": "I understand — you feel the trade number should be higher.",
  "Not Needed": "Most people feel that way at first. The customers who are most glad they added protection are the ones who never thought they'd need it.",
  "Think About It": "Of course. What specifically were you still on the fence about?",
};

describe("Objection word track lookup", () => {
  it("returns correct track for Price/Payment", () => {
    expect(WORD_TRACKS["Price/Payment"]).toContain("monthly impact");
  });
  it("returns correct track for Rate", () => {
    expect(WORD_TRACKS["Rate"]).toContain("rate");
  });
  it("returns correct track for Trade Value", () => {
    expect(WORD_TRACKS["Trade Value"]).toContain("trade");
  });
  it("returns correct track for Not Needed", () => {
    expect(WORD_TRACKS["Not Needed"]).toContain("feel that way");
  });
  it("returns correct track for Think About It", () => {
    expect(WORD_TRACKS["Think About It"]).toContain("fence");
  });
  it("all 5 objection types have word tracks", () => {
    for (const type of OBJECTION_TYPES) {
      expect(WORD_TRACKS[type]).toBeDefined();
      expect(WORD_TRACKS[type].length).toBeGreaterThan(10);
    }
  });
});
