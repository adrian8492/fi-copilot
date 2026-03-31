import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// 1. Multi-Location Rollup — KPI Calculations
// ═══════════════════════════════════════════════════════════════════
interface LocationData {
  id: number;
  name: string;
  managerCount: number;
  avgScore: number;
  lastMonthAvgScore: number;
  avgPvr: number;
  penetrationPct: number;
}

function computeRollupKPIs(locations: LocationData[]) {
  if (locations.length === 0) return { totalLocations: 0, combinedPvr: 0, bestLocation: "", lowestLocation: "" };
  const totalManagers = locations.reduce((s, l) => s + l.managerCount, 0);
  const combinedPvr = Math.round(locations.reduce((s, l) => s + l.avgPvr * l.managerCount, 0) / totalManagers);
  const best = [...locations].sort((a, b) => b.avgScore - a.avgScore)[0];
  const lowest = [...locations].sort((a, b) => a.avgScore - b.avgScore)[0];
  return { totalLocations: locations.length, combinedPvr, bestLocation: best.name, lowestLocation: lowest.name };
}

describe("Multi-Location Rollup — KPI calculations", () => {
  const locations: LocationData[] = [
    { id: 1, name: "Honda Miami", managerCount: 4, avgScore: 86, lastMonthAvgScore: 82, avgPvr: 3200, penetrationPct: 72 },
    { id: 2, name: "Toyota SD", managerCount: 3, avgScore: 74, lastMonthAvgScore: 71, avgPvr: 2800, penetrationPct: 65 },
    { id: 3, name: "Ford Denver", managerCount: 5, avgScore: 91, lastMonthAvgScore: 88, avgPvr: 3600, penetrationPct: 78 },
  ];

  it("computes combined PVR as weighted average by manager count", () => {
    const kpis = computeRollupKPIs(locations);
    // (3200*4 + 2800*3 + 3600*5) / (4+3+5) = (12800+8400+18000)/12 = 39200/12 = 3266.67 → 3267
    expect(kpis.combinedPvr).toBe(3267);
  });
  it("detects best performing location by score", () => {
    expect(computeRollupKPIs(locations).bestLocation).toBe("Ford Denver");
  });
  it("detects lowest performing location by score", () => {
    expect(computeRollupKPIs(locations).lowestLocation).toBe("Toyota SD");
  });
  it("reports correct total location count", () => {
    expect(computeRollupKPIs(locations).totalLocations).toBe(3);
  });
  it("handles empty locations array", () => {
    const kpis = computeRollupKPIs([]);
    expect(kpis.totalLocations).toBe(0);
    expect(kpis.combinedPvr).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. Location Card Color Tier Logic
// ═══════════════════════════════════════════════════════════════════
function getLocationColor(score: number): "green" | "yellow" | "red" {
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  return "red";
}

describe("Location card color tier logic", () => {
  it("score >= 80 is green", () => { expect(getLocationColor(80)).toBe("green"); });
  it("score 100 is green", () => { expect(getLocationColor(100)).toBe("green"); });
  it("score 79 is yellow", () => { expect(getLocationColor(79)).toBe("yellow"); });
  it("score 60 is yellow", () => { expect(getLocationColor(60)).toBe("yellow"); });
  it("score 59 is red", () => { expect(getLocationColor(59)).toBe("red"); });
  it("score 0 is red", () => { expect(getLocationColor(0)).toBe("red"); });
});

// ═══════════════════════════════════════════════════════════════════
// 3. Location Sort Logic
// ═══════════════════════════════════════════════════════════════════
function sortLocations(locations: LocationData[], sortBy: string): LocationData[] {
  const sorted = [...locations];
  switch (sortBy) {
    case "score": return sorted.sort((a, b) => b.avgScore - a.avgScore);
    case "alpha": return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "pvr": return sorted.sort((a, b) => b.avgPvr - a.avgPvr);
    case "improved": return sorted.sort((a, b) => (b.avgScore - b.lastMonthAvgScore) - (a.avgScore - a.lastMonthAvgScore));
    default: return sorted;
  }
}

describe("Location sort logic", () => {
  const locations: LocationData[] = [
    { id: 1, name: "Honda", managerCount: 3, avgScore: 74, lastMonthAvgScore: 71, avgPvr: 2800, penetrationPct: 65 },
    { id: 2, name: "Ford", managerCount: 4, avgScore: 91, lastMonthAvgScore: 88, avgPvr: 3600, penetrationPct: 78 },
    { id: 3, name: "Chevy", managerCount: 2, avgScore: 58, lastMonthAvgScore: 50, avgPvr: 2100, penetrationPct: 48 },
  ];

  it("sorts by score descending", () => {
    const sorted = sortLocations(locations, "score");
    expect(sorted[0].name).toBe("Ford");
    expect(sorted[2].name).toBe("Chevy");
  });
  it("sorts alphabetically", () => {
    const sorted = sortLocations(locations, "alpha");
    expect(sorted[0].name).toBe("Chevy");
    expect(sorted[1].name).toBe("Ford");
    expect(sorted[2].name).toBe("Honda");
  });
  it("sorts by PVR descending", () => {
    const sorted = sortLocations(locations, "pvr");
    expect(sorted[0].name).toBe("Ford");
  });
  it("sorts by most improved (largest score delta)", () => {
    const sorted = sortLocations(locations, "improved");
    // Chevy: +8, Honda: +3, Ford: +3
    expect(sorted[0].name).toBe("Chevy");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. Lender Comparison — Data Structure Validation
// ═══════════════════════════════════════════════════════════════════
type CreditTier = "tier1" | "tier2" | "tier3" | "tier4";

interface LenderRate {
  lender: string;
  tiers: Record<CreditTier, { baseRate: number; buydownRate: number; reserveSpread: number; maxTerm: number; minCreditScore: number }>;
}

const LENDER_DATA: LenderRate[] = [
  { lender: "Capital One Auto", tiers: { tier1: { baseRate: 4.49, buydownRate: 2.99, reserveSpread: 1.50, maxTerm: 72, minCreditScore: 720 }, tier2: { baseRate: 5.99, buydownRate: 4.49, reserveSpread: 1.50, maxTerm: 72, minCreditScore: 680 }, tier3: { baseRate: 8.49, buydownRate: 6.99, reserveSpread: 1.50, maxTerm: 60, minCreditScore: 620 }, tier4: { baseRate: 12.99, buydownRate: 10.99, reserveSpread: 2.00, maxTerm: 48, minCreditScore: 500 } } },
  { lender: "Ally Financial", tiers: { tier1: { baseRate: 4.29, buydownRate: 2.79, reserveSpread: 1.50, maxTerm: 84, minCreditScore: 720 }, tier2: { baseRate: 5.79, buydownRate: 4.29, reserveSpread: 1.50, maxTerm: 72, minCreditScore: 680 }, tier3: { baseRate: 7.99, buydownRate: 6.49, reserveSpread: 1.50, maxTerm: 60, minCreditScore: 620 }, tier4: { baseRate: 11.99, buydownRate: 9.99, reserveSpread: 2.00, maxTerm: 48, minCreditScore: 500 } } },
  { lender: "Chase Auto", tiers: { tier1: { baseRate: 4.69, buydownRate: 3.19, reserveSpread: 1.50, maxTerm: 72, minCreditScore: 720 }, tier2: { baseRate: 6.19, buydownRate: 4.69, reserveSpread: 1.50, maxTerm: 72, minCreditScore: 680 }, tier3: { baseRate: 8.99, buydownRate: 7.49, reserveSpread: 1.50, maxTerm: 60, minCreditScore: 620 }, tier4: { baseRate: 13.49, buydownRate: 11.49, reserveSpread: 2.00, maxTerm: 48, minCreditScore: 500 } } },
  { lender: "Wells Fargo Dealer", tiers: { tier1: { baseRate: 4.39, buydownRate: 2.89, reserveSpread: 1.50, maxTerm: 75, minCreditScore: 720 }, tier2: { baseRate: 5.89, buydownRate: 4.39, reserveSpread: 1.50, maxTerm: 72, minCreditScore: 680 }, tier3: { baseRate: 8.29, buydownRate: 6.79, reserveSpread: 1.50, maxTerm: 60, minCreditScore: 620 }, tier4: { baseRate: 12.49, buydownRate: 10.49, reserveSpread: 2.00, maxTerm: 48, minCreditScore: 500 } } },
  { lender: "US Bank DFS", tiers: { tier1: { baseRate: 4.59, buydownRate: 3.09, reserveSpread: 1.50, maxTerm: 72, minCreditScore: 720 }, tier2: { baseRate: 6.09, buydownRate: 4.59, reserveSpread: 1.50, maxTerm: 72, minCreditScore: 680 }, tier3: { baseRate: 8.69, buydownRate: 7.19, reserveSpread: 1.50, maxTerm: 60, minCreditScore: 620 }, tier4: { baseRate: 13.19, buydownRate: 11.19, reserveSpread: 2.00, maxTerm: 48, minCreditScore: 500 } } },
];

describe("Lender comparison — data structure", () => {
  it("has exactly 5 lenders", () => {
    expect(LENDER_DATA).toHaveLength(5);
  });
  it("each lender has all required tiers", () => {
    for (const lender of LENDER_DATA) {
      for (const tier of ["tier1", "tier2", "tier3", "tier4"] as CreditTier[]) {
        const t = lender.tiers[tier];
        expect(t.baseRate).toBeGreaterThan(0);
        expect(t.buydownRate).toBeGreaterThan(0);
        expect(t.reserveSpread).toBeGreaterThan(0);
        expect(t.maxTerm).toBeGreaterThan(0);
        expect(t.minCreditScore).toBeGreaterThan(0);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. Rate Calculator — Payment Formula
// ═══════════════════════════════════════════════════════════════════
function calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualRate <= 0) return principal / termMonths;
  const r = annualRate / 100 / 12;
  const n = termMonths;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

describe("Rate calculator — payment formula", () => {
  it("calculates correct monthly payment for standard loan", () => {
    // $30,000 at 4.49% for 60 months
    const payment = calculateMonthlyPayment(30000, 4.49, 60);
    expect(payment).toBeCloseTo(559.65, 0);
  });
  it("calculates payment for 0% APR as simple division", () => {
    const payment = calculateMonthlyPayment(30000, 0, 60);
    expect(payment).toBe(500);
  });
  it("returns 0 for zero principal", () => {
    expect(calculateMonthlyPayment(0, 5, 60)).toBe(0);
  });
  it("returns 0 for zero term", () => {
    expect(calculateMonthlyPayment(30000, 5, 0)).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. Best Match Detection — Highest Reserve Spread
// ═══════════════════════════════════════════════════════════════════
function findBestMatch(lenders: LenderRate[], tier: CreditTier): string {
  let best = "";
  let bestSpread = -1;
  for (const l of lenders) {
    const spread = l.tiers[tier].reserveSpread;
    if (spread > bestSpread) {
      bestSpread = spread;
      best = l.lender;
    }
  }
  return best;
}

describe("Best match detection — highest reserve spread", () => {
  it("finds lender with highest reserve spread for tier4", () => {
    const best = findBestMatch(LENDER_DATA, "tier4");
    // All tier4 have 2.00 reserve; first one wins
    expect(best).toBe("Capital One Auto");
  });
  it("finds lender with highest reserve spread for tier1", () => {
    const best = findBestMatch(LENDER_DATA, "tier1");
    // All tier1 have 1.50 reserve; first one wins
    expect(best).toBe("Capital One Auto");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 7. Credit Tier Threshold Validation
// ═══════════════════════════════════════════════════════════════════
function getCreditTierFromScore(score: number): CreditTier {
  if (score >= 720) return "tier1";
  if (score >= 680) return "tier2";
  if (score >= 620) return "tier3";
  return "tier4";
}

describe("Credit tier threshold validation", () => {
  it("720+ is tier1", () => { expect(getCreditTierFromScore(720)).toBe("tier1"); });
  it("750 is tier1", () => { expect(getCreditTierFromScore(750)).toBe("tier1"); });
  it("719 is tier2", () => { expect(getCreditTierFromScore(719)).toBe("tier2"); });
  it("680 is tier2", () => { expect(getCreditTierFromScore(680)).toBe("tier2"); });
  it("679 is tier3", () => { expect(getCreditTierFromScore(679)).toBe("tier3"); });
  it("620 is tier3", () => { expect(getCreditTierFromScore(620)).toBe("tier3"); });
  it("619 is tier4", () => { expect(getCreditTierFromScore(619)).toBe("tier4"); });
  it("500 is tier4", () => { expect(getCreditTierFromScore(500)).toBe("tier4"); });
});

// ═══════════════════════════════════════════════════════════════════
// 8. Shift Performance — Heatmap Data Shaping
// ═══════════════════════════════════════════════════════════════════
interface ShiftCell {
  day: string;
  shift: string;
  avgScore: number;
  dealCount: number;
  avgPvr: number;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHIFTS = ["Morning", "Afternoon", "Evening"];

function buildHeatmapMatrix(cells: ShiftCell[]): ShiftCell[][] {
  const matrix: ShiftCell[][] = [];
  for (const day of DAYS) {
    const row: ShiftCell[] = [];
    for (const shift of SHIFTS) {
      const cell = cells.find((c) => c.day === day && c.shift === shift);
      row.push(cell ?? { day, shift, avgScore: 0, dealCount: 0, avgPvr: 0 });
    }
    matrix.push(row);
  }
  return matrix;
}

describe("Shift performance — heatmap data shaping", () => {
  const cells: ShiftCell[] = [
    { day: "Mon", shift: "Morning", avgScore: 72, dealCount: 8, avgPvr: 2600 },
    { day: "Mon", shift: "Afternoon", avgScore: 78, dealCount: 12, avgPvr: 2900 },
    { day: "Tue", shift: "Evening", avgScore: 70, dealCount: 6, avgPvr: 2500 },
  ];

  it("produces 6 rows (Mon-Sat)", () => {
    const matrix = buildHeatmapMatrix(cells);
    expect(matrix).toHaveLength(6);
  });
  it("each row has 3 shifts", () => {
    const matrix = buildHeatmapMatrix(cells);
    for (const row of matrix) {
      expect(row).toHaveLength(3);
    }
  });
  it("fills missing cells with zero defaults", () => {
    const matrix = buildHeatmapMatrix(cells);
    const wedMorning = matrix[2][0]; // Wed Morning
    expect(wedMorning.avgScore).toBe(0);
    expect(wedMorning.dealCount).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 9. Peak Shift Detection
// ═══════════════════════════════════════════════════════════════════
function findPeakShift(cells: ShiftCell[]): ShiftCell | null {
  if (cells.length === 0) return null;
  return [...cells].sort((a, b) => b.avgScore - a.avgScore)[0];
}

describe("Peak shift detection", () => {
  const cells: ShiftCell[] = [
    { day: "Mon", shift: "Morning", avgScore: 72, dealCount: 8, avgPvr: 2600 },
    { day: "Sat", shift: "Afternoon", avgScore: 88, dealCount: 16, avgPvr: 3400 },
    { day: "Tue", shift: "Evening", avgScore: 70, dealCount: 6, avgPvr: 2500 },
  ];

  it("identifies shift with highest avg score", () => {
    const peak = findPeakShift(cells);
    expect(peak?.day).toBe("Sat");
    expect(peak?.shift).toBe("Afternoon");
    expect(peak?.avgScore).toBe(88);
  });
  it("returns null for empty array", () => {
    expect(findPeakShift([])).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 10. Hour-of-Day Aggregation
// ═══════════════════════════════════════════════════════════════════
function computeHourlyData(cells: ShiftCell[]): Array<{ hour: number; avgScore: number }> {
  const hourBuckets: number[] = new Array(24).fill(0);
  const hourCounts: number[] = new Array(24).fill(0);
  for (const cell of cells) {
    let startHour: number;
    let endHour: number;
    if (cell.shift === "Morning") { startHour = 8; endHour = 12; }
    else if (cell.shift === "Afternoon") { startHour = 12; endHour = 17; }
    else { startHour = 17; endHour = 21; }
    const hours = endHour - startHour;
    const perHour = cell.dealCount / hours;
    for (let h = startHour; h < endHour; h++) {
      hourBuckets[h] += cell.avgScore * perHour;
      hourCounts[h] += perHour;
    }
  }
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    avgScore: hourCounts[h] > 0 ? Math.round(hourBuckets[h] / hourCounts[h]) : 0,
  }));
}

describe("Hour-of-day aggregation", () => {
  const cells: ShiftCell[] = [
    { day: "Mon", shift: "Morning", avgScore: 80, dealCount: 8, avgPvr: 3000 },
    { day: "Mon", shift: "Afternoon", avgScore: 70, dealCount: 10, avgPvr: 2500 },
  ];

  it("produces 24 buckets", () => {
    expect(computeHourlyData(cells)).toHaveLength(24);
  });
  it("hours 0-7 have zero score (no morning data before 8am)", () => {
    const data = computeHourlyData(cells);
    for (let h = 0; h < 8; h++) {
      expect(data[h].avgScore).toBe(0);
    }
  });
  it("morning hours (8-11) have score from morning shift", () => {
    const data = computeHourlyData(cells);
    expect(data[8].avgScore).toBe(80);
    expect(data[11].avgScore).toBe(80);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 11. Staffing Insight Generation
// ═══════════════════════════════════════════════════════════════════
function generateStaffingInsight(best: ShiftCell | null): string {
  if (!best) return "Not enough data to generate staffing insights.";
  return `Your strongest scores happen ${best.day} ${best.shift.toLowerCase()}s (avg ${best.avgScore}) — consider scheduling your top closer there.`;
}

describe("Staffing insight generation", () => {
  it("generates text including best shift day and time", () => {
    const best: ShiftCell = { day: "Sat", shift: "Afternoon", avgScore: 88, dealCount: 16, avgPvr: 3400 };
    const insight = generateStaffingInsight(best);
    expect(insight).toContain("Sat");
    expect(insight).toContain("afternoon");
    expect(insight).toContain("88");
  });
  it("returns fallback message when no data", () => {
    const insight = generateStaffingInsight(null);
    expect(insight).toContain("Not enough data");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 12. Training Curriculum — Module Structure
// ═══════════════════════════════════════════════════════════════════
interface Lesson { id: string; title: string; }
interface TrainingModule { id: string; name: string; lessons: Lesson[]; }

const CURRICULUM: TrainingModule[] = [
  { id: "m1", name: "The Menu Order System", lessons: [{ id: "m1-l1", title: "L1" }, { id: "m1-l2", title: "L2" }, { id: "m1-l3", title: "L3" }, { id: "m1-l4", title: "L4" }] },
  { id: "m2", name: "The Upgrade Architecture", lessons: [{ id: "m2-l1", title: "L1" }, { id: "m2-l2", title: "L2" }, { id: "m2-l3", title: "L3" }] },
  { id: "m3", name: "The Objection Prevention Framework", lessons: [{ id: "m3-l1", title: "L1" }, { id: "m3-l2", title: "L2" }, { id: "m3-l3", title: "L3" }, { id: "m3-l4", title: "L4" }, { id: "m3-l5", title: "L5" }] },
  { id: "m4", name: "The Coaching Cadence", lessons: [{ id: "m4-l1", title: "L1" }, { id: "m4-l2", title: "L2" }, { id: "m4-l3", title: "L3" }] },
  { id: "m5", name: "Compliance Essentials", lessons: [{ id: "m5-l1", title: "L1" }, { id: "m5-l2", title: "L2" }, { id: "m5-l3", title: "L3" }, { id: "m5-l4", title: "L4" }] },
  { id: "m6", name: "Advanced Closing Techniques", lessons: [{ id: "m6-l1", title: "L1" }, { id: "m6-l2", title: "L2" }, { id: "m6-l3", title: "L3" }] },
];

const TOTAL_LESSONS = CURRICULUM.reduce((s, m) => s + m.lessons.length, 0);

describe("Training curriculum — module structure", () => {
  it("has exactly 6 modules", () => {
    expect(CURRICULUM).toHaveLength(6);
  });
  it("has 22 total lessons", () => {
    expect(TOTAL_LESSONS).toBe(22);
  });
  it("each module has a unique id", () => {
    const ids = CURRICULUM.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 13. Module Completion Percentage
// ═══════════════════════════════════════════════════════════════════
function getModuleCompletionPct(completedIds: Set<string>, mod: TrainingModule): number {
  const completed = mod.lessons.filter((l) => completedIds.has(l.id)).length;
  return Math.round((completed / mod.lessons.length) * 100);
}

describe("Module completion percentage", () => {
  it("0% when none completed", () => {
    expect(getModuleCompletionPct(new Set(), CURRICULUM[0])).toBe(0);
  });
  it("50% when 2 of 4 completed", () => {
    expect(getModuleCompletionPct(new Set(["m1-l1", "m1-l2"]), CURRICULUM[0])).toBe(50);
  });
  it("100% when all completed", () => {
    expect(getModuleCompletionPct(new Set(["m1-l1", "m1-l2", "m1-l3", "m1-l4"]), CURRICULUM[0])).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 14. Overall Progress Calculation
// ═══════════════════════════════════════════════════════════════════
function getOverallProgress(completedIds: Set<string>): { completed: number; total: number; pct: number } {
  let completed = 0;
  for (const mod of CURRICULUM) {
    completed += mod.lessons.filter((l) => completedIds.has(l.id)).length;
  }
  return { completed, total: TOTAL_LESSONS, pct: Math.round((completed / TOTAL_LESSONS) * 100) };
}

describe("Overall progress calculation", () => {
  it("0 of 22 when none completed", () => {
    const p = getOverallProgress(new Set());
    expect(p.completed).toBe(0);
    expect(p.total).toBe(22);
    expect(p.pct).toBe(0);
  });
  it("correct count when some completed", () => {
    const p = getOverallProgress(new Set(["m1-l1", "m2-l1", "m3-l1"]));
    expect(p.completed).toBe(3);
    expect(p.pct).toBe(14); // 3/22 = 13.6 → 14
  });
});

// ═══════════════════════════════════════════════════════════════════
// 15. Lesson Toggle Logic
// ═══════════════════════════════════════════════════════════════════
describe("Lesson toggle logic", () => {
  it("adding a lesson id marks it completed", () => {
    const ids = new Set<string>();
    ids.add("m1-l1");
    expect(ids.has("m1-l1")).toBe(true);
  });
  it("removing a lesson id marks it incomplete", () => {
    const ids = new Set<string>(["m1-l1", "m1-l2"]);
    ids.delete("m1-l1");
    expect(ids.has("m1-l1")).toBe(false);
    expect(ids.has("m1-l2")).toBe(true);
  });
  it("toggle complete then incomplete", () => {
    const ids = new Set<string>();
    ids.add("m1-l1"); // complete
    expect(ids.has("m1-l1")).toBe(true);
    ids.delete("m1-l1"); // incomplete
    expect(ids.has("m1-l1")).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 16. Session Tag Operations
// ═══════════════════════════════════════════════════════════════════
const PREDEFINED_TAGS = ["Hot Lead", "Follow Up", "Coaching Moment", "Great Close", "Compliance Issue", "Escalation"];

const TAG_COLOR_MAP: Record<string, string> = {
  "Hot Lead": "border-red-500/30 text-red-400 bg-red-500/10",
  "Follow Up": "border-blue-500/30 text-blue-400 bg-blue-500/10",
  "Coaching Moment": "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
  "Great Close": "border-green-500/30 text-green-400 bg-green-500/10",
  "Compliance Issue": "border-orange-500/30 text-orange-400 bg-orange-500/10",
  "Escalation": "border-purple-500/30 text-purple-400 bg-purple-500/10",
};

describe("Session tag operations", () => {
  it("can add a tag to array", () => {
    const tags: string[] = [];
    tags.push("Hot Lead");
    expect(tags).toContain("Hot Lead");
  });
  it("can remove a tag from array", () => {
    const tags = ["Hot Lead", "Follow Up"];
    const filtered = tags.filter((t) => t !== "Hot Lead");
    expect(filtered).toEqual(["Follow Up"]);
  });
  it("predefined color mapping has all 6 tags", () => {
    for (const tag of PREDEFINED_TAGS) {
      expect(TAG_COLOR_MAP[tag]).toBeDefined();
      expect(TAG_COLOR_MAP[tag].length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 17. Session Tag Persistence Key Format
// ═══════════════════════════════════════════════════════════════════
function getStorageKey(sessionId: string): string {
  return `asura-session-tags-${sessionId}`;
}

describe("Session tag persistence key format", () => {
  it("formats key with session id", () => {
    expect(getStorageKey("abc123")).toBe("asura-session-tags-abc123");
  });
  it("different sessions produce different keys", () => {
    expect(getStorageKey("a")).not.toBe(getStorageKey("b"));
  });
});

// ═══════════════════════════════════════════════════════════════════
// 18. Pinned Notes Logic
// ═══════════════════════════════════════════════════════════════════
function sortPinnedFirst(notes: string[], pinnedNotes: string[]): string[] {
  const pinned = notes.filter((n) => pinnedNotes.includes(n));
  const unpinned = notes.filter((n) => !pinnedNotes.includes(n));
  return [...pinned, ...unpinned];
}

describe("Pinned notes logic", () => {
  it("pinned notes appear first", () => {
    const sorted = sortPinnedFirst(["note1", "note2", "note3"], ["note3"]);
    expect(sorted[0]).toBe("note3");
  });
  it("pin/unpin toggle works", () => {
    const pinnedNotes = ["note1"];
    // Unpin
    const unpinned = pinnedNotes.filter((n) => n !== "note1");
    expect(unpinned).toEqual([]);
    // Pin new
    unpinned.push("note2");
    expect(unpinned).toContain("note2");
  });
  it("unpinned notes maintain order after pinned", () => {
    const sorted = sortPinnedFirst(["a", "b", "c"], ["c"]);
    expect(sorted).toEqual(["c", "a", "b"]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 19. Tag Filter Matching
// ═══════════════════════════════════════════════════════════════════
function sessionMatchesTags(sessionTags: string[], filterTags: string[]): boolean {
  if (filterTags.length === 0) return true;
  return filterTags.some((ft) => sessionTags.includes(ft));
}

describe("Tag filter matching", () => {
  it("matches when session has one of the filter tags", () => {
    expect(sessionMatchesTags(["Hot Lead", "Follow Up"], ["Hot Lead"])).toBe(true);
  });
  it("does not match when no overlap", () => {
    expect(sessionMatchesTags(["Hot Lead"], ["Follow Up"])).toBe(false);
  });
  it("matches all sessions when filter is empty", () => {
    expect(sessionMatchesTags(["Hot Lead"], [])).toBe(true);
    expect(sessionMatchesTags([], [])).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 20. Tag Count Badge Calculation
// ═══════════════════════════════════════════════════════════════════
function getTagCount(tags: string[]): number {
  return tags.length;
}

describe("Tag count badge calculation", () => {
  it("counts tags correctly", () => {
    expect(getTagCount(["Hot Lead", "Follow Up"])).toBe(2);
  });
  it("returns 0 for empty tags", () => {
    expect(getTagCount([])).toBe(0);
  });
  it("counts single tag", () => {
    expect(getTagCount(["Escalation"])).toBe(1);
  });
});
