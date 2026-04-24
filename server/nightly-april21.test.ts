import { describe, it, expect } from "vitest";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChargebackRecord {
  id: string;
  dealId: string;
  manager: string;
  amount: number;
  reason: string;
  status: "open" | "resolved" | "disputed";
  closeDate: string; // ISO date
  chargebackDate: string;
}

interface ManagerRetention {
  manager: string;
  grossIncome: number;
  netIncome: number;
}

interface MonthlyChargeback {
  month: string; // "YYYY-MM"
  amount: number;
}

interface TrainerChoice {
  pillar: string;
  points: number;
}

interface TrainerScenario {
  id: string;
  totalStages: number;
  completedStages: number;
  choices: TrainerChoice[];
}

interface WordTrack {
  scenarioId: string;
  stage: number;
  text: string;
}

interface DailyPVR {
  date: string;
  pvr: number;
  deals: number;
}

interface MonthSummary {
  month: string;
  revenue: number;
  deals: number;
  avgPVR: number;
}

interface ProductMix {
  product: string;
  revenue: number;
}

interface ManagerPVR {
  manager: string;
  totalRevenue: number;
  deals: number;
}

interface DealStructure {
  salePrice: number;
  downPayment: number;
  tradeEquity: number;
  annualRate: number;
  termMonths: number;
  buyRate: number;
  sellRate: number;
}

interface LenderRule {
  lender: string;
  minScore: number;
  maxScore: number;
  sellRateCap: number;
}

interface SavedStructure {
  id: string;
  label: string;
  structure: DealStructure;
  savedAt: string;
}

// ─── Demo Data ───────────────────────────────────────────────────────────────

const DEMO_CHARGEBACKS: ChargebackRecord[] = [
  { id: "cb1", dealId: "d1", manager: "Alice", amount: 1200, reason: "Early Payoff", status: "open", closeDate: "2026-03-15", chargebackDate: "2026-04-10" },
  { id: "cb2", dealId: "d2", manager: "Alice", amount: 800, reason: "Cancellation", status: "resolved", closeDate: "2026-02-20", chargebackDate: "2026-04-05" },
  { id: "cb3", dealId: "d3", manager: "Bob", amount: 1500, reason: "Early Payoff", status: "open", closeDate: "2026-04-01", chargebackDate: "2026-04-18" },
  { id: "cb4", dealId: "d4", manager: "Bob", amount: 600, reason: "Fraud", status: "disputed", closeDate: "2026-01-10", chargebackDate: "2026-03-20" },
  { id: "cb5", dealId: "d5", manager: "Alice", amount: 950, reason: "Cancellation", status: "open", closeDate: "2026-03-28", chargebackDate: "2026-04-15" },
  { id: "cb6", dealId: "d6", manager: "Carol", amount: 1100, reason: "Early Payoff", status: "resolved", closeDate: "2026-02-05", chargebackDate: "2026-03-10" },
  { id: "cb7", dealId: "d7", manager: "Carol", amount: 700, reason: "Cancellation", status: "open", closeDate: "2026-04-05", chargebackDate: "2026-04-20" },
  { id: "cb8", dealId: "d8", manager: "Bob", amount: 2000, reason: "Fraud", status: "resolved", closeDate: "2026-03-01", chargebackDate: "2026-04-12" },
];

const DEMO_MANAGER_RETENTION: ManagerRetention[] = [
  { manager: "Alice", grossIncome: 25000, netIncome: 21000 },
  { manager: "Bob", grossIncome: 30000, netIncome: 22500 },
  { manager: "Carol", grossIncome: 18000, netIncome: 16200 },
];

const DEMO_AT_RISK_DEALS = [
  { dealId: "d10", daysSinceClose: 45, score: 55 },
  { dealId: "d11", daysSinceClose: 100, score: 40 },
  { dealId: "d12", daysSinceClose: 30, score: 80 },
  { dealId: "d13", daysSinceClose: 60, score: 65 },
  { dealId: "d14", daysSinceClose: 89, score: 69 },
  { dealId: "d15", daysSinceClose: 91, score: 50 },
];

const DEMO_SCENARIOS: TrainerScenario[] = [
  {
    id: "s1",
    totalStages: 5,
    completedStages: 5,
    choices: [
      { pillar: "Transparency", points: 20 },
      { pillar: "Protection", points: 15 },
      { pillar: "Value", points: 18 },
      { pillar: "Compliance", points: 12 },
      { pillar: "Empathy", points: 20 },
    ],
  },
  {
    id: "s2",
    totalStages: 4,
    completedStages: 2,
    choices: [
      { pillar: "Transparency", points: 10 },
      { pillar: "Protection", points: 8 },
    ],
  },
  {
    id: "s3",
    totalStages: 6,
    completedStages: 6,
    choices: [
      { pillar: "Transparency", points: 18 },
      { pillar: "Protection", points: 20 },
      { pillar: "Value", points: 14 },
      { pillar: "Compliance", points: 19 },
      { pillar: "Empathy", points: 16 },
      { pillar: "Transparency", points: 5 },
    ],
  },
];

const DEMO_WORD_TRACKS: WordTrack[] = [
  { scenarioId: "s1", stage: 1, text: "I want to make sure you're fully protected today." },
  { scenarioId: "s1", stage: 2, text: "Let me walk you through what's included." },
  { scenarioId: "s1", stage: 3, text: "This coverage has saved customers thousands." },
  { scenarioId: "s2", stage: 1, text: "Congratulations on your new vehicle!" },
  { scenarioId: "s2", stage: 2, text: "Let's look at some options together." },
];

const DEMO_DAILY_PVR: DailyPVR[] = [
  { date: "2026-04-01", pvr: 1800, deals: 3 },
  { date: "2026-04-02", pvr: 2100, deals: 2 },
  { date: "2026-04-03", pvr: 1500, deals: 4 },
  { date: "2026-04-04", pvr: 2400, deals: 1 },
  { date: "2026-04-05", pvr: 1900, deals: 3 },
  { date: "2026-04-06", pvr: 0, deals: 0 },
  { date: "2026-04-07", pvr: 2200, deals: 2 },
  { date: "2026-04-08", pvr: 1700, deals: 3 },
  { date: "2026-04-09", pvr: 2000, deals: 2 },
  { date: "2026-04-10", pvr: 1600, deals: 4 },
];

const DEMO_MONTH_SUMMARIES: MonthSummary[] = [
  { month: "2026-01", revenue: 52000, deals: 30, avgPVR: 1733 },
  { month: "2026-02", revenue: 58000, deals: 32, avgPVR: 1813 },
  { month: "2026-03", revenue: 61000, deals: 34, avgPVR: 1794 },
  { month: "2026-04", revenue: 45000, deals: 24, avgPVR: 1875 },
  { month: "2025-04", revenue: 48000, deals: 28, avgPVR: 1714 },
];

const DEMO_PRODUCT_MIX: ProductMix[] = [
  { product: "VSC", revenue: 18000 },
  { product: "GAP", revenue: 9000 },
  { product: "Paint Protection", revenue: 4500 },
  { product: "Tire & Wheel", revenue: 6000 },
  { product: "Key Replacement", revenue: 2500 },
];

const DEMO_MANAGER_PVR: ManagerPVR[] = [
  { manager: "Alice", totalRevenue: 18000, deals: 10 },
  { manager: "Bob", totalRevenue: 22000, deals: 14 },
  { manager: "Carol", totalRevenue: 12000, deals: 6 },
];

const DEMO_LENDER_MATRIX: LenderRule[] = [
  { lender: "Chase", minScore: 720, maxScore: 850, sellRateCap: 4.5 },
  { lender: "Capital One", minScore: 620, maxScore: 780, sellRateCap: 7.9 },
  { lender: "Ally", minScore: 580, maxScore: 750, sellRateCap: 9.5 },
  { lender: "Westlake", minScore: 450, maxScore: 619, sellRateCap: 18.0 },
];

// ─── Helper Functions ────────────────────────────────────────────────────────

// -- Chargeback Tracker --

function chargebackRate(chargebacks: number, totalDeals: number): number {
  if (totalDeals === 0) return 0;
  return Math.round((chargebacks / totalDeals) * 10000) / 100;
}

function netRetentionRate(rec: ManagerRetention): number {
  if (rec.grossIncome === 0) return 0;
  return Math.round((rec.netIncome / rec.grossIncome) * 10000) / 100;
}

function chargebackReserve(monthlyGross: number, cbRate: number): number {
  return Math.round((monthlyGross * cbRate) / 100);
}

function isAtRisk(daysSinceClose: number, score: number): boolean {
  return daysSinceClose < 90 && score < 70;
}

function monthlyChargebackTrend(records: ChargebackRecord[]): MonthlyChargeback[] {
  const map = new Map<string, number>();
  for (const r of records) {
    const month = r.chargebackDate.slice(0, 7);
    map.set(month, (map.get(month) || 0) + r.amount);
  }
  return Array.from(map.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function chargebackReasonBreakdown(records: ChargebackRecord[]): { reason: string; pct: number }[] {
  if (records.length === 0) return [];
  const counts = new Map<string, number>();
  for (const r of records) {
    counts.set(r.reason, (counts.get(r.reason) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([reason, count]) => ({
    reason,
    pct: Math.round((count / records.length) * 10000) / 100,
  }));
}

function averageChargebackAmount(records: ChargebackRecord[]): number {
  if (records.length === 0) return 0;
  return Math.round(records.reduce((s, r) => s + r.amount, 0) / records.length);
}

function filterByStatus(records: ChargebackRecord[], status: ChargebackRecord["status"]): ChargebackRecord[] {
  return records.filter((r) => r.status === status);
}

function filterByManager(records: ChargebackRecord[], manager: string): ChargebackRecord[] {
  return records.filter((r) => r.manager === manager);
}

function daysSinceClose(closeDate: string, today: string): number {
  const close = new Date(closeDate);
  const now = new Date(today);
  return Math.floor((now.getTime() - close.getTime()) / (1000 * 60 * 60 * 24));
}

// -- Trainer Mode --

function pillarScores(choices: TrainerChoice[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const c of choices) {
    map.set(c.pillar, (map.get(c.pillar) || 0) + c.points);
  }
  return map;
}

function scenarioCompletionPct(scenario: TrainerScenario): number {
  if (scenario.totalStages === 0) return 0;
  return Math.round((scenario.completedStages / scenario.totalStages) * 100);
}

function isTop1Benchmark(score: number): boolean {
  return score >= 85;
}

function getWordTrack(tracks: WordTrack[], scenarioId: string, stage: number): string | null {
  const found = tracks.find((t) => t.scenarioId === scenarioId && t.stage === stage);
  return found ? found.text : null;
}

function bestPillar(choices: TrainerChoice[]): string {
  const scores = pillarScores(choices);
  let best = "";
  let max = -1;
  for (const [pillar, pts] of scores) {
    if (pts > max) {
      max = pts;
      best = pillar;
    }
  }
  return best;
}

function weakestPillar(choices: TrainerChoice[]): string {
  const scores = pillarScores(choices);
  let worst = "";
  let min = Infinity;
  for (const [pillar, pts] of scores) {
    if (pts < min) {
      min = pts;
      worst = pillar;
    }
  }
  return worst;
}

function totalScore(choices: TrainerChoice[]): number {
  return choices.reduce((s, c) => s + c.points, 0);
}

// -- Monthly Dashboard --

function monthlyPacing(revenueToDate: number, daysElapsed: number, totalWorkingDays: number): number {
  if (daysElapsed === 0) return 0;
  return Math.round((revenueToDate / daysElapsed) * totalWorkingDays);
}

function daysRemainingInMonth(today: string): number {
  const parts = today.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  const lastDay = new Date(year, month, 0).getDate();
  return lastDay - day;
}

function dailyAvgPVR(days: DailyPVR[]): number {
  const withDeals = days.filter((d) => d.deals > 0);
  if (withDeals.length === 0) return 0;
  return Math.round(withDeals.reduce((s, d) => s + d.pvr, 0) / withDeals.length);
}

function goalProgressPct(actual: number, target: number): number {
  if (target === 0) return 0;
  return Math.round((actual / target) * 10000) / 100;
}

function monthDelta(current: MonthSummary, prior: MonthSummary): number {
  return current.revenue - prior.revenue;
}

function sameMonthLastYearComparison(
  summaries: MonthSummary[],
  currentMonth: string,
): { current: MonthSummary | null; lastYear: MonthSummary | null } {
  const [year, mo] = currentMonth.split("-");
  const lastYearMonth = `${Number(year) - 1}-${mo}`;
  return {
    current: summaries.find((s) => s.month === currentMonth) || null,
    lastYear: summaries.find((s) => s.month === lastYearMonth) || null,
  };
}

function productMixShare(mix: ProductMix[]): { product: string; sharePct: number }[] {
  const total = mix.reduce((s, p) => s + p.revenue, 0);
  if (total === 0) return [];
  return mix.map((p) => ({
    product: p.product,
    sharePct: Math.round((p.revenue / total) * 10000) / 100,
  }));
}

function managerRankingByPVR(managers: ManagerPVR[]): ManagerPVR[] {
  return [...managers].sort((a, b) => {
    const pvrA = a.deals > 0 ? a.totalRevenue / a.deals : 0;
    const pvrB = b.deals > 0 ? b.totalRevenue / b.deals : 0;
    return pvrB - pvrA;
  });
}

function calendarDayColor(pvr: number, target: number): "green" | "yellow" | "red" {
  const ratio = target > 0 ? pvr / target : 0;
  if (ratio >= 1) return "green";
  if (ratio >= 0.75) return "yellow";
  return "red";
}

function monthNarrative(summary: MonthSummary, target: number): string {
  const pct = target > 0 ? Math.round((summary.revenue / target) * 100) : 0;
  if (pct >= 100) return `${summary.month}: Target achieved with ${summary.deals} deals at $${summary.avgPVR} avg PVR.`;
  if (pct >= 75) return `${summary.month}: On pace at ${pct}% of target with ${summary.deals} deals.`;
  return `${summary.month}: Behind target at ${pct}% with ${summary.deals} deals. Action needed.`;
}

// -- Deal Structure Calculator --

function amountFinanced(salePrice: number, downPayment: number, tradeEquity: number): number {
  return salePrice - downPayment - tradeEquity;
}

function monthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualRate === 0) return Math.round((principal / termMonths) * 100) / 100;
  const r = annualRate / 1200;
  const factor = Math.pow(1 + r, termMonths);
  return Math.round((principal * (r * factor) / (factor - 1)) * 100) / 100;
}

function reserveAmount(sellRate: number, buyRate: number, financed: number): number {
  return Math.round(((sellRate - buyRate) * financed) / 2400 * 100) / 100;
}

function productAffordable(basePayment: number, productMonthly: number, targetPayment: number): boolean {
  return basePayment + productMonthly <= targetPayment;
}

function structureOptimizer(
  salePrice: number,
  down: number,
  tradeEq: number,
  rates: number[],
  terms: number[],
  pvrTarget: number,
  paymentCap: number,
  productRevenue: number,
): { rate: number; term: number; payment: number } | null {
  const af = amountFinanced(salePrice, down, tradeEq);
  for (const rate of rates) {
    for (const term of terms) {
      const pmt = monthlyPayment(af, rate, term);
      if (pmt <= paymentCap && productRevenue >= pvrTarget) {
        return { rate, term, payment: pmt };
      }
    }
  }
  return null;
}

function lenderMatch(score: number, matrix: LenderRule[]): LenderRule[] {
  return matrix.filter((l) => score >= l.minScore && score <= l.maxScore);
}

function dealHealthScore(pvr: number, chargebackRisk: number): "green" | "yellow" | "red" {
  if (pvr >= 1800 && chargebackRisk < 5) return "green";
  if (pvr >= 1200 || chargebackRisk < 10) return "yellow";
  return "red";
}

function sellRateCompliant(sellRate: number, lender: LenderRule): boolean {
  return sellRate <= lender.sellRateCap;
}

function paymentGrid(
  principal: number,
  rates: number[],
  terms: number[],
): { rate: number; term: number; payment: number }[] {
  const grid: { rate: number; term: number; payment: number }[] = [];
  for (const rate of rates) {
    for (const term of terms) {
      grid.push({ rate, term, payment: monthlyPayment(principal, rate, term) });
    }
  }
  return grid;
}

function validateSavedStructures(items: SavedStructure[], maxItems: number): boolean {
  return items.length <= maxItems;
}

function creditTier(score: number): string {
  if (score >= 780) return "Super Prime";
  if (score >= 720) return "Prime";
  if (score >= 660) return "Near Prime";
  if (score >= 580) return "Sub Prime";
  return "Deep Sub";
}

function productsNeededForPVR(currentPVR: number, target: number, avgProductRevenue: number): number {
  if (avgProductRevenue <= 0) return 0;
  const gap = target - currentPVR;
  if (gap <= 0) return 0;
  return Math.ceil(gap / avgProductRevenue);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Chargeback Tracker", () => {
  it("should calculate chargeback rate", () => {
    expect(chargebackRate(8, 200)).toBe(4);
  });

  it("should return 0 chargeback rate when no deals", () => {
    expect(chargebackRate(5, 0)).toBe(0);
  });

  it("should calculate chargeback rate with decimals", () => {
    expect(chargebackRate(3, 50)).toBe(6);
  });

  it("should calculate net retention rate for Alice", () => {
    expect(netRetentionRate(DEMO_MANAGER_RETENTION[0])).toBe(84);
  });

  it("should calculate net retention rate for Bob", () => {
    expect(netRetentionRate(DEMO_MANAGER_RETENTION[1])).toBe(75);
  });

  it("should calculate net retention rate for Carol", () => {
    expect(netRetentionRate(DEMO_MANAGER_RETENTION[2])).toBe(90);
  });

  it("should handle zero gross income in retention", () => {
    expect(netRetentionRate({ manager: "X", grossIncome: 0, netIncome: 0 })).toBe(0);
  });

  it("should calculate chargeback reserve", () => {
    expect(chargebackReserve(50000, 4)).toBe(2000);
  });

  it("should calculate chargeback reserve with low rate", () => {
    expect(chargebackReserve(30000, 2.5)).toBe(750);
  });

  it("should identify at-risk deals correctly", () => {
    const atRisk = DEMO_AT_RISK_DEALS.filter((d) => isAtRisk(d.daysSinceClose, d.score));
    expect(atRisk.length).toBe(3);
    expect(atRisk.map((d) => d.dealId)).toEqual(["d10", "d13", "d14"]);
  });

  it("should not flag deal with days >= 90 as at risk", () => {
    expect(isAtRisk(91, 50)).toBe(false);
  });

  it("should not flag deal with score >= 70 as at risk", () => {
    expect(isAtRisk(30, 80)).toBe(false);
  });

  it("should aggregate monthly chargeback trend", () => {
    const trend = monthlyChargebackTrend(DEMO_CHARGEBACKS);
    expect(trend.length).toBe(2);
    expect(trend[0].month).toBe("2026-03");
    expect(trend[0].amount).toBe(1100 + 600); // cb6 + cb4
    expect(trend[1].month).toBe("2026-04");
  });

  it("should calculate chargeback reason breakdown percentages", () => {
    const breakdown = chargebackReasonBreakdown(DEMO_CHARGEBACKS);
    const earlyPayoff = breakdown.find((b) => b.reason === "Early Payoff");
    expect(earlyPayoff).toBeDefined();
    // 3 out of 8 = 37.5%
    expect(earlyPayoff!.pct).toBe(37.5);
  });

  it("should calculate cancellation reason percentage", () => {
    const breakdown = chargebackReasonBreakdown(DEMO_CHARGEBACKS);
    const cancellation = breakdown.find((b) => b.reason === "Cancellation");
    expect(cancellation!.pct).toBe(37.5);
  });

  it("should handle empty chargeback list for breakdown", () => {
    expect(chargebackReasonBreakdown([])).toEqual([]);
  });

  it("should calculate average chargeback amount", () => {
    expect(averageChargebackAmount(DEMO_CHARGEBACKS)).toBe(1106);
  });

  it("should return 0 average for empty records", () => {
    expect(averageChargebackAmount([])).toBe(0);
  });

  it("should filter chargebacks by open status", () => {
    const open = filterByStatus(DEMO_CHARGEBACKS, "open");
    expect(open.length).toBe(4);
  });

  it("should filter chargebacks by resolved status", () => {
    const resolved = filterByStatus(DEMO_CHARGEBACKS, "resolved");
    expect(resolved.length).toBe(3);
  });

  it("should filter chargebacks by disputed status", () => {
    const disputed = filterByStatus(DEMO_CHARGEBACKS, "disputed");
    expect(disputed.length).toBe(1);
  });

  it("should filter chargebacks by manager Alice", () => {
    const alice = filterByManager(DEMO_CHARGEBACKS, "Alice");
    expect(alice.length).toBe(3);
  });

  it("should filter chargebacks by manager Bob", () => {
    const bob = filterByManager(DEMO_CHARGEBACKS, "Bob");
    expect(bob.length).toBe(3);
  });

  it("should calculate days since close", () => {
    expect(daysSinceClose("2026-04-01", "2026-04-22")).toBe(21);
  });

  it("should calculate days since close across months", () => {
    expect(daysSinceClose("2026-03-15", "2026-04-22")).toBe(38);
  });
});

describe("Trainer Mode", () => {
  it("should score by pillar for scenario s1", () => {
    const scores = pillarScores(DEMO_SCENARIOS[0].choices);
    expect(scores.get("Transparency")).toBe(20);
    expect(scores.get("Protection")).toBe(15);
    expect(scores.get("Value")).toBe(18);
    expect(scores.get("Compliance")).toBe(12);
    expect(scores.get("Empathy")).toBe(20);
  });

  it("should accumulate points across choices with same pillar", () => {
    const scores = pillarScores(DEMO_SCENARIOS[2].choices);
    // Transparency: 18 + 5 = 23
    expect(scores.get("Transparency")).toBe(23);
  });

  it("should calculate total score across all choices", () => {
    expect(totalScore(DEMO_SCENARIOS[0].choices)).toBe(85);
  });

  it("should calculate total score for partial scenario", () => {
    expect(totalScore(DEMO_SCENARIOS[1].choices)).toBe(18);
  });

  it("should calculate scenario completion percentage (100%)", () => {
    expect(scenarioCompletionPct(DEMO_SCENARIOS[0])).toBe(100);
  });

  it("should calculate scenario completion percentage (50%)", () => {
    expect(scenarioCompletionPct(DEMO_SCENARIOS[1])).toBe(50);
  });

  it("should handle zero total stages", () => {
    expect(scenarioCompletionPct({ id: "x", totalStages: 0, completedStages: 0, choices: [] })).toBe(0);
  });

  it("should identify top-1% benchmark for score 85", () => {
    expect(isTop1Benchmark(85)).toBe(true);
  });

  it("should reject below top-1% benchmark for score 84", () => {
    expect(isTop1Benchmark(84)).toBe(false);
  });

  it("should identify top-1% benchmark for score 100", () => {
    expect(isTop1Benchmark(100)).toBe(true);
  });

  it("should retrieve word track by scenario and stage", () => {
    expect(getWordTrack(DEMO_WORD_TRACKS, "s1", 2)).toBe(
      "Let me walk you through what's included.",
    );
  });

  it("should return null for missing word track", () => {
    expect(getWordTrack(DEMO_WORD_TRACKS, "s1", 99)).toBeNull();
  });

  it("should identify best pillar for scenario s1", () => {
    // Transparency=20, Empathy=20 — first found wins
    expect(["Transparency", "Empathy"]).toContain(bestPillar(DEMO_SCENARIOS[0].choices));
  });

  it("should identify weakest pillar for scenario s1", () => {
    expect(weakestPillar(DEMO_SCENARIOS[0].choices)).toBe("Compliance");
  });

  it("should identify best pillar for scenario s3", () => {
    // Transparency=23, Protection=20, Compliance=19, Empathy=16, Value=14
    expect(bestPillar(DEMO_SCENARIOS[2].choices)).toBe("Transparency");
  });

  it("should identify weakest pillar for scenario s3", () => {
    expect(weakestPillar(DEMO_SCENARIOS[2].choices)).toBe("Value");
  });
});

describe("Monthly Dashboard", () => {
  it("should calculate monthly pacing", () => {
    // 45000 revenue / 15 days elapsed * 22 working days
    expect(monthlyPacing(45000, 15, 22)).toBe(66000);
  });

  it("should return 0 pacing when no days elapsed", () => {
    expect(monthlyPacing(0, 0, 22)).toBe(0);
  });

  it("should calculate days remaining in April 2026", () => {
    expect(daysRemainingInMonth("2026-04-22")).toBe(8);
  });

  it("should calculate days remaining on last day of month", () => {
    expect(daysRemainingInMonth("2026-04-30")).toBe(0);
  });

  it("should calculate days remaining on first day", () => {
    expect(daysRemainingInMonth("2026-04-01")).toBe(29);
  });

  it("should calculate daily average PVR excluding zero-deal days", () => {
    // 9 days with deals: (1800+2100+1500+2400+1900+2200+1700+2000+1600)/9
    expect(dailyAvgPVR(DEMO_DAILY_PVR)).toBe(1911);
  });

  it("should return 0 daily avg PVR for empty list", () => {
    expect(dailyAvgPVR([])).toBe(0);
  });

  it("should calculate goal progress percentage", () => {
    expect(goalProgressPct(45000, 60000)).toBe(75);
  });

  it("should return 0 progress when target is 0", () => {
    expect(goalProgressPct(45000, 0)).toBe(0);
  });

  it("should calculate month vs prior month delta", () => {
    const current = DEMO_MONTH_SUMMARIES[2]; // March: 61000
    const prior = DEMO_MONTH_SUMMARIES[1]; // Feb: 58000
    expect(monthDelta(current, prior)).toBe(3000);
  });

  it("should find same-month-last-year comparison", () => {
    const result = sameMonthLastYearComparison(DEMO_MONTH_SUMMARIES, "2026-04");
    expect(result.current).toBeDefined();
    expect(result.current!.revenue).toBe(45000);
    expect(result.lastYear).toBeDefined();
    expect(result.lastYear!.revenue).toBe(48000);
  });

  it("should return null when no last year data", () => {
    const result = sameMonthLastYearComparison(DEMO_MONTH_SUMMARIES, "2026-01");
    expect(result.current).toBeDefined();
    expect(result.lastYear).toBeNull();
  });

  it("should calculate product mix revenue share", () => {
    const shares = productMixShare(DEMO_PRODUCT_MIX);
    const vsc = shares.find((s) => s.product === "VSC");
    // 18000 / 40000 = 45%
    expect(vsc!.sharePct).toBe(45);
  });

  it("should sum all product mix shares to ~100%", () => {
    const shares = productMixShare(DEMO_PRODUCT_MIX);
    const total = shares.reduce((s, p) => s + p.sharePct, 0);
    expect(total).toBeCloseTo(100, 0);
  });

  it("should rank managers by PVR", () => {
    const ranked = managerRankingByPVR(DEMO_MANAGER_PVR);
    // Carol: 2000, Alice: 1800, Bob: ~1571
    expect(ranked[0].manager).toBe("Carol");
    expect(ranked[1].manager).toBe("Alice");
    expect(ranked[2].manager).toBe("Bob");
  });

  it("should classify green calendar day", () => {
    expect(calendarDayColor(2000, 1800)).toBe("green");
  });

  it("should classify yellow calendar day", () => {
    expect(calendarDayColor(1500, 1800)).toBe("yellow");
  });

  it("should classify red calendar day", () => {
    expect(calendarDayColor(1000, 1800)).toBe("red");
  });

  it("should generate achieved narrative", () => {
    const summary: MonthSummary = { month: "2026-03", revenue: 61000, deals: 34, avgPVR: 1794 };
    expect(monthNarrative(summary, 60000)).toContain("Target achieved");
  });

  it("should generate on-pace narrative", () => {
    const summary: MonthSummary = { month: "2026-04", revenue: 45000, deals: 24, avgPVR: 1875 };
    expect(monthNarrative(summary, 60000)).toContain("On pace");
  });

  it("should generate behind-target narrative", () => {
    const summary: MonthSummary = { month: "2026-04", revenue: 30000, deals: 16, avgPVR: 1875 };
    expect(monthNarrative(summary, 60000)).toContain("Behind target");
  });
});

describe("Deal Structure Calculator", () => {
  it("should calculate amount financed", () => {
    expect(amountFinanced(35000, 5000, 3000)).toBe(27000);
  });

  it("should calculate amount financed with zero down", () => {
    expect(amountFinanced(35000, 0, 0)).toBe(35000);
  });

  it("should calculate monthly payment (amortization)", () => {
    // P=27000, rate=5.9%, term=72
    const pmt = monthlyPayment(27000, 5.9, 72);
    expect(pmt).toBeCloseTo(446.19, 0);
  });

  it("should calculate monthly payment at 0% rate", () => {
    expect(monthlyPayment(24000, 0, 60)).toBe(400);
  });

  it("should return 0 payment for 0 principal", () => {
    expect(monthlyPayment(0, 5.9, 72)).toBe(0);
  });

  it("should calculate reserve amount", () => {
    // (5.9 - 3.5) * 27000 / 2400
    const reserve = reserveAmount(5.9, 3.5, 27000);
    expect(reserve).toBeCloseTo(27, 0);
  });

  it("should check product affordability - affordable", () => {
    expect(productAffordable(450, 35, 500)).toBe(true);
  });

  it("should check product affordability - not affordable", () => {
    expect(productAffordable(450, 60, 500)).toBe(false);
  });

  it("should check product affordability - exact boundary", () => {
    expect(productAffordable(450, 50, 500)).toBe(true);
  });

  it("should find optimal structure meeting PVR and payment targets", () => {
    const result = structureOptimizer(35000, 5000, 3000, [4.9, 5.9, 6.9], [60, 72, 84], 1500, 500, 1800);
    expect(result).not.toBeNull();
    expect(result!.payment).toBeLessThanOrEqual(500);
  });

  it("should return null when no structure meets criteria", () => {
    const result = structureOptimizer(50000, 0, 0, [9.9], [36], 3000, 200, 1000);
    expect(result).toBeNull();
  });

  it("should match lenders for credit score 750", () => {
    const matches = lenderMatch(750, DEMO_LENDER_MATRIX);
    expect(matches.map((l) => l.lender).sort()).toEqual(["Ally", "Capital One", "Chase"]);
  });

  it("should match lenders for credit score 600", () => {
    const matches = lenderMatch(600, DEMO_LENDER_MATRIX);
    expect(matches.map((l) => l.lender)).toEqual(["Ally", "Westlake"]);
  });

  it("should match no lenders for very low score", () => {
    expect(lenderMatch(400, DEMO_LENDER_MATRIX).length).toBe(0);
  });

  it("should classify deal health as green", () => {
    expect(dealHealthScore(2000, 3)).toBe("green");
  });

  it("should classify deal health as yellow", () => {
    expect(dealHealthScore(1500, 7)).toBe("yellow");
  });

  it("should classify deal health as red", () => {
    expect(dealHealthScore(1000, 15)).toBe("red");
  });

  it("should verify sell rate compliance - compliant", () => {
    expect(sellRateCompliant(4.0, DEMO_LENDER_MATRIX[0])).toBe(true);
  });

  it("should verify sell rate compliance - non-compliant", () => {
    expect(sellRateCompliant(5.0, DEMO_LENDER_MATRIX[0])).toBe(false);
  });

  it("should generate 9-cell payment grid for 3 rates x 3 terms", () => {
    const grid = paymentGrid(27000, [4.9, 5.9, 6.9], [60, 72, 84]);
    expect(grid.length).toBe(9);
    expect(grid[0].rate).toBe(4.9);
    expect(grid[0].term).toBe(60);
    expect(grid[0].payment).toBeGreaterThan(0);
  });

  it("should validate localStorage structures within limit", () => {
    const items: SavedStructure[] = Array.from({ length: 10 }, (_, i) => ({
      id: `s${i}`,
      label: `Deal ${i}`,
      structure: { salePrice: 30000, downPayment: 3000, tradeEquity: 0, annualRate: 5.9, termMonths: 72, buyRate: 3.5, sellRate: 5.9 },
      savedAt: "2026-04-22",
    }));
    expect(validateSavedStructures(items, 10)).toBe(true);
  });

  it("should reject localStorage structures exceeding limit", () => {
    const items: SavedStructure[] = Array.from({ length: 11 }, (_, i) => ({
      id: `s${i}`,
      label: `Deal ${i}`,
      structure: { salePrice: 30000, downPayment: 3000, tradeEquity: 0, annualRate: 5.9, termMonths: 72, buyRate: 3.5, sellRate: 5.9 },
      savedAt: "2026-04-22",
    }));
    expect(validateSavedStructures(items, 10)).toBe(false);
  });

  it("should classify Super Prime credit tier", () => {
    expect(creditTier(800)).toBe("Super Prime");
  });

  it("should classify Prime credit tier", () => {
    expect(creditTier(750)).toBe("Prime");
  });

  it("should classify Near Prime credit tier", () => {
    expect(creditTier(680)).toBe("Near Prime");
  });

  it("should classify Sub Prime credit tier", () => {
    expect(creditTier(600)).toBe("Sub Prime");
  });

  it("should classify Deep Sub credit tier", () => {
    expect(creditTier(520)).toBe("Deep Sub");
  });

  it("should classify boundary score 780 as Super Prime", () => {
    expect(creditTier(780)).toBe("Super Prime");
  });

  it("should classify boundary score 720 as Prime", () => {
    expect(creditTier(720)).toBe("Prime");
  });

  it("should calculate products needed to hit PVR target", () => {
    expect(productsNeededForPVR(1200, 1800, 300)).toBe(2);
  });

  it("should return 0 products when already at target", () => {
    expect(productsNeededForPVR(2000, 1800, 300)).toBe(0);
  });

  it("should handle fractional products needed (ceil)", () => {
    expect(productsNeededForPVR(1000, 1800, 500)).toBe(2);
  });
});
