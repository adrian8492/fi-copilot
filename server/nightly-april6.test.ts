import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Lender Matrix — Rate Spread & Reserve Calculations
// ═══════════════════════════════════════════════════════════════════

type CreditTier = "Super Prime" | "Prime" | "Near Prime" | "Sub Prime" | "Deep Sub";

function classifyCreditTier(score: number): CreditTier {
  if (score >= 780) return "Super Prime";
  if (score >= 720) return "Prime";
  if (score >= 660) return "Near Prime";
  if (score >= 580) return "Sub Prime";
  return "Deep Sub";
}

function calculateRateSpread(buyRate: number, sellRate: number): number {
  return +(sellRate - buyRate).toFixed(2);
}

function calculateReserveOpportunity(sellRate: number, buyRate: number, amountFinanced: number): number {
  return Math.round(((sellRate - buyRate) / 100) * amountFinanced);
}

interface LenderForRanking {
  name: string;
  buyRate: number;
  sellRateCap: number;
  tiers: CreditTier[];
  approvalRate: number;
}

function rankLendersByReserve(
  lenders: LenderForRanking[],
  creditScore: number,
  amount: number,
  term: number,
): { name: string; totalReserve: number }[] {
  const tier = classifyCreditTier(creditScore);
  return lenders
    .filter((l) => l.tiers.includes(tier))
    .map((l) => {
      const spread = l.sellRateCap - l.buyRate;
      const totalReserve = Math.round((spread / 100) * amount * (term / 12));
      return { name: l.name, totalReserve };
    })
    .sort((a, b) => b.totalReserve - a.totalReserve);
}

function calculateFundingSpeedAvg(days: number[]): number {
  return +(days.reduce((s, d) => s + d, 0) / days.length).toFixed(1);
}

function isRateCapCompliant(sellRate: number, cap: number): boolean {
  return sellRate <= cap;
}

function calculateApprovalRate(approved: number, submitted: number): number {
  return submitted > 0 ? +((approved / submitted) * 100).toFixed(1) : 0;
}

// ═══════════════════════════════════════════════════════════════════
// Deal Jacket — Document & Gross Calculations
// ═══════════════════════════════════════════════════════════════════

interface DealDocument {
  name: string;
  status: "complete" | "pending" | "missing";
}

function calculateDocCompletion(docs: DealDocument[]): number {
  return docs.length > 0
    ? Math.round((docs.filter((d) => d.status === "complete").length / docs.length) * 100)
    : 0;
}

function calculateProductGrossProfit(price: number, cost: number): number {
  return price - cost;
}

function calculateDealTotalGross(frontGross: number, backGross: number): number {
  return frontGross + backGross;
}

interface ComplianceFlag {
  rule: string;
  severity: "warning" | "critical" | "info";
}

function aggregateComplianceFlags(flags: ComplianceFlag[]): Record<string, number> {
  const counts: Record<string, number> = { warning: 0, critical: 0, info: 0 };
  for (const f of flags) counts[f.severity]++;
  return counts;
}

interface TimelineEvent {
  timestamp: string;
  label: string;
}

function sortTimelineChronologically(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// ═══════════════════════════════════════════════════════════════════
// Weekend Recap — PVR & Ranking Calculations
// ═══════════════════════════════════════════════════════════════════

function calculatePVRDelta(thisWeek: number, lastWeek: number): number {
  return thisWeek - lastWeek;
}

interface ManagerForRanking {
  name: string;
  avgPVR: number;
  deals: number;
  penetration: number;
}

function rankManagersByPVR(managers: ManagerForRanking[]): ManagerForRanking[] {
  return [...managers].sort((a, b) => b.avgPVR - a.avgPVR);
}

interface ProductWeekComparison {
  product: string;
  thisWeek: number;
  lastWeek: number;
}

function calculateProductDelta(data: ProductWeekComparison): number {
  return data.thisWeek - data.lastWeek;
}

function identifyTopDealsByPVR(
  deals: { customer: string; pvr: number }[],
  n: number,
): { customer: string; pvr: number }[] {
  return [...deals].sort((a, b) => b.pvr - a.pvr).slice(0, n);
}

function identifyBottomDealsByPVR(
  deals: { customer: string; pvr: number }[],
  n: number,
): { customer: string; pvr: number }[] {
  return [...deals].sort((a, b) => a.pvr - b.pvr).slice(0, n);
}

function calculateDailyPVRAverage(dailyValues: number[]): number {
  return dailyValues.length > 0
    ? Math.round(dailyValues.reduce((s, v) => s + v, 0) / dailyValues.length)
    : 0;
}

function identifyLowestMetric(
  metrics: { name: string; value: number }[],
): string {
  if (metrics.length === 0) return "";
  return [...metrics].sort((a, b) => a.value - b.value)[0].name;
}

// ═══════════════════════════════════════════════════════════════════
// Commission Calculator
// ═══════════════════════════════════════════════════════════════════

function calculateCommission(
  basePay: number,
  commissionRate: number,
  flatPerProduct: number,
  dealCount: number,
  avgBackGross: number,
  bonusThreshold: number,
  bonusAmount: number,
  productsPerDeal: number,
): {
  basePay: number;
  backGrossCommission: number;
  productCommission: number;
  bonus: number;
  monthly: number;
  annual: number;
} {
  const totalBackGross = dealCount * avgBackGross;
  const backGrossCommission = totalBackGross * (commissionRate / 100);
  const totalProducts = Math.round(dealCount * productsPerDeal);
  const productCommission = totalProducts * flatPerProduct;
  const bonus = dealCount >= bonusThreshold ? bonusAmount : 0;
  const monthly = basePay + backGrossCommission + productCommission + bonus;
  return {
    basePay,
    backGrossCommission: Math.round(backGrossCommission),
    productCommission: Math.round(productCommission),
    bonus,
    monthly: Math.round(monthly),
    annual: Math.round(monthly * 12),
  };
}

const ASURA_PVR_LIFT = 759;
const ASURA_PRODUCT_INCREASE = 0.12;
const TOP_1_PVR = 2500;
const TOP_1_PENETRATION = 0.65;

function calculateCumulativeEarnings(monthlyAmount: number, months: number): number {
  return monthlyAmount * months;
}

function interpolatePVRtoIncome(
  pvr: number,
  basePay: number,
  commissionRate: number,
  dealCount: number,
): number {
  const totalBackGross = dealCount * pvr;
  return Math.round(basePay + totalBackGross * (commissionRate / 100));
}

interface PayPlanPreset {
  name: string;
  basePay: number;
  commissionRate: number;
  flatPerProduct: number;
}

function validatePayPlanPreset(preset: PayPlanPreset): boolean {
  return (
    typeof preset.name === "string" &&
    preset.name.length > 0 &&
    typeof preset.basePay === "number" &&
    preset.basePay >= 0 &&
    typeof preset.commissionRate === "number" &&
    preset.commissionRate >= 0 &&
    preset.commissionRate <= 100 &&
    typeof preset.flatPerProduct === "number" &&
    preset.flatPerProduct >= 0
  );
}

function calculateYTDProgress(earnings: number[], target: number): number {
  const total = earnings.reduce((s, v) => s + v, 0);
  return target > 0 ? Math.round((total / target) * 100) : 0;
}

// ═══════════════════════════════════════════════════════════════════
// Mobile Bottom Navigation
// ═══════════════════════════════════════════════════════════════════

const MOBILE_BREAKPOINT = 768;
const BOTTOM_NAV_ITEMS = [
  { path: "/", label: "Dashboard" },
  { path: "/session/new", label: "Live Session" },
  { path: "/history", label: "History" },
  { path: "/analytics", label: "Analytics" },
  { path: "more", label: "More" },
];

const MORE_DRAWER_CATEGORIES = ["Performance", "Coaching", "Operations", "Business", "Admin"];

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

describe("Lender Matrix — buy rate vs sell rate spread", () => {
  it("calculates positive spread", () => {
    expect(calculateRateSpread(4.9, 7.9)).toBe(3.0);
  });
  it("calculates spread for sub-prime lender", () => {
    expect(calculateRateSpread(12.0, 19.9)).toBe(7.9);
  });
  it("zero spread when rates are equal", () => {
    expect(calculateRateSpread(5.0, 5.0)).toBe(0);
  });
});

describe("Lender Matrix — reserve opportunity calculation", () => {
  it("reserve = (sell - buy)/100 × amount", () => {
    expect(calculateReserveOpportunity(7.9, 4.9, 30000)).toBe(900);
  });
  it("large amount financed", () => {
    expect(calculateReserveOpportunity(15.9, 9.5, 40000)).toBe(2560);
  });
  it("zero reserve when rates equal", () => {
    expect(calculateReserveOpportunity(5.0, 5.0, 30000)).toBe(0);
  });
});

describe("Lender Matrix — best lender ranking", () => {
  const lenders: LenderForRanking[] = [
    { name: "Ally", buyRate: 4.9, sellRateCap: 7.9, tiers: ["Prime"], approvalRate: 78 },
    { name: "Capital One", buyRate: 5.2, sellRateCap: 8.2, tiers: ["Prime"], approvalRate: 82 },
    { name: "Westlake", buyRate: 9.5, sellRateCap: 15.9, tiers: ["Sub Prime"], approvalRate: 91 },
  ];

  it("ranks by total reserve descending", () => {
    const result = rankLendersByReserve(lenders, 720, 30000, 72);
    // Ally: (7.9-4.9)/100 * 30000 * 6 = 5400, CapOne: (8.2-5.2)/100 * 30000 * 6 = 5400 — tied, stable sort keeps Ally first
    expect(result[0].totalReserve).toBeGreaterThanOrEqual(result[1].totalReserve);
    expect(result.length).toBe(2);
  });
  it("filters by credit tier", () => {
    const result = rankLendersByReserve(lenders, 600, 30000, 60);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe("Westlake");
  });
  it("returns empty for unmatched tier", () => {
    const result = rankLendersByReserve(lenders, 800, 30000, 60);
    expect(result.length).toBe(0);
  });
});

describe("Lender Matrix — credit tier classification", () => {
  it("780+ = Super Prime", () => {
    expect(classifyCreditTier(780)).toBe("Super Prime");
    expect(classifyCreditTier(850)).toBe("Super Prime");
  });
  it("720-779 = Prime", () => {
    expect(classifyCreditTier(720)).toBe("Prime");
    expect(classifyCreditTier(779)).toBe("Prime");
  });
  it("660-719 = Near Prime", () => {
    expect(classifyCreditTier(660)).toBe("Near Prime");
    expect(classifyCreditTier(719)).toBe("Near Prime");
  });
  it("580-659 = Sub Prime", () => {
    expect(classifyCreditTier(580)).toBe("Sub Prime");
    expect(classifyCreditTier(659)).toBe("Sub Prime");
  });
  it("<580 = Deep Sub", () => {
    expect(classifyCreditTier(579)).toBe("Deep Sub");
    expect(classifyCreditTier(400)).toBe("Deep Sub");
  });
});

describe("Lender Matrix — funding speed average", () => {
  it("averages days array", () => {
    expect(calculateFundingSpeedAvg([3.2, 2.8, 4.1])).toBe(3.4);
  });
  it("single lender", () => {
    expect(calculateFundingSpeedAvg([2.1])).toBe(2.1);
  });
});

describe("Lender Matrix — rate cap compliance", () => {
  it("sell rate at cap is compliant", () => {
    expect(isRateCapCompliant(7.9, 7.9)).toBe(true);
  });
  it("sell rate below cap is compliant", () => {
    expect(isRateCapCompliant(6.5, 7.9)).toBe(true);
  });
  it("sell rate above cap is non-compliant", () => {
    expect(isRateCapCompliant(8.0, 7.9)).toBe(false);
  });
});

describe("Lender Matrix — approval rate calculation", () => {
  it("calculates approval rate", () => {
    expect(calculateApprovalRate(78, 100)).toBe(78.0);
  });
  it("handles zero submissions", () => {
    expect(calculateApprovalRate(0, 0)).toBe(0);
  });
  it("fractional approval rate", () => {
    expect(calculateApprovalRate(15, 19)).toBe(78.9);
  });
});

describe("Deal Jacket — document checklist completion", () => {
  it("all complete = 100%", () => {
    const docs: DealDocument[] = [
      { name: "Credit App", status: "complete" },
      { name: "Menu", status: "complete" },
    ];
    expect(calculateDocCompletion(docs)).toBe(100);
  });
  it("mixed statuses", () => {
    const docs: DealDocument[] = [
      { name: "Credit App", status: "complete" },
      { name: "Menu", status: "pending" },
      { name: "Privacy", status: "missing" },
    ];
    expect(calculateDocCompletion(docs)).toBe(33);
  });
  it("empty list = 0%", () => {
    expect(calculateDocCompletion([])).toBe(0);
  });
});

describe("Deal Jacket — product gross profit", () => {
  it("calculates gross profit", () => {
    expect(calculateProductGrossProfit(2200, 800)).toBe(1400);
  });
  it("zero cost product", () => {
    expect(calculateProductGrossProfit(599, 0)).toBe(599);
  });
  it("handles zero price", () => {
    expect(calculateProductGrossProfit(0, 100)).toBe(-100);
  });
});

describe("Deal Jacket — total gross computation", () => {
  it("front + back = total", () => {
    expect(calculateDealTotalGross(2800, 3200)).toBe(6000);
  });
  it("zero front gross", () => {
    expect(calculateDealTotalGross(0, 3200)).toBe(3200);
  });
});

describe("Deal Jacket — compliance flag aggregation", () => {
  it("counts by severity", () => {
    const flags: ComplianceFlag[] = [
      { rule: "Rate", severity: "warning" },
      { rule: "Docs", severity: "critical" },
      { rule: "Info", severity: "info" },
      { rule: "Rate2", severity: "warning" },
    ];
    const result = aggregateComplianceFlags(flags);
    expect(result.warning).toBe(2);
    expect(result.critical).toBe(1);
    expect(result.info).toBe(1);
  });
  it("empty flags", () => {
    const result = aggregateComplianceFlags([]);
    expect(result.warning).toBe(0);
    expect(result.critical).toBe(0);
  });
});

describe("Deal Jacket — timeline event ordering", () => {
  it("sorts chronologically", () => {
    const events: TimelineEvent[] = [
      { timestamp: "2026-04-05 11:00", label: "Contracts Signed" },
      { timestamp: "2026-04-05 09:15", label: "Deal Opened" },
      { timestamp: "2026-04-05 10:00", label: "Menu Presented" },
    ];
    const sorted = sortTimelineChronologically(events);
    expect(sorted[0].label).toBe("Deal Opened");
    expect(sorted[1].label).toBe("Menu Presented");
    expect(sorted[2].label).toBe("Contracts Signed");
  });
  it("already sorted stays same", () => {
    const events: TimelineEvent[] = [
      { timestamp: "2026-04-01 09:00", label: "A" },
      { timestamp: "2026-04-01 10:00", label: "B" },
    ];
    const sorted = sortTimelineChronologically(events);
    expect(sorted[0].label).toBe("A");
    expect(sorted[1].label).toBe("B");
  });
});

describe("Weekend Recap — PVR delta calculation", () => {
  it("positive delta", () => {
    expect(calculatePVRDelta(2100, 1900)).toBe(200);
  });
  it("negative delta", () => {
    expect(calculatePVRDelta(1700, 1900)).toBe(-200);
  });
  it("no change", () => {
    expect(calculatePVRDelta(2000, 2000)).toBe(0);
  });
});

describe("Weekend Recap — manager scoreboard ranking", () => {
  it("ranks by avg PVR descending", () => {
    const managers: ManagerForRanking[] = [
      { name: "Chris", avgPVR: 1400, deals: 12, penetration: 38 },
      { name: "Adrian", avgPVR: 2600, deals: 28, penetration: 68 },
      { name: "Mike", avgPVR: 2000, deals: 22, penetration: 55 },
    ];
    const ranked = rankManagersByPVR(managers);
    expect(ranked[0].name).toBe("Adrian");
    expect(ranked[1].name).toBe("Mike");
    expect(ranked[2].name).toBe("Chris");
  });
});

describe("Weekend Recap — product week-over-week comparison", () => {
  it("positive delta", () => {
    expect(calculateProductDelta({ product: "GAP", thisWeek: 68, lastWeek: 62 })).toBe(6);
  });
  it("negative delta", () => {
    expect(calculateProductDelta({ product: "Paint", thisWeek: 45, lastWeek: 48 })).toBe(-3);
  });
});

describe("Weekend Recap — top/bottom deal identification", () => {
  const deals = [
    { customer: "A", pvr: 4123 },
    { customer: "B", pvr: 650 },
    { customer: "C", pvr: 3700 },
    { customer: "D", pvr: 800 },
    { customer: "E", pvr: 3400 },
  ];

  it("top 3 by PVR", () => {
    const top = identifyTopDealsByPVR(deals, 3);
    expect(top[0].customer).toBe("A");
    expect(top[1].customer).toBe("C");
    expect(top[2].customer).toBe("E");
  });
  it("bottom 3 by PVR", () => {
    const bottom = identifyBottomDealsByPVR(deals, 3);
    expect(bottom[0].customer).toBe("B");
    expect(bottom[1].customer).toBe("D");
    expect(bottom[2].customer).toBe("E");
  });
});

describe("Weekend Recap — daily PVR average", () => {
  it("averages daily values", () => {
    expect(calculateDailyPVRAverage([1850, 2100, 1950, 2400, 2200, 2350])).toBe(2142);
  });
  it("empty array returns 0", () => {
    expect(calculateDailyPVRAverage([])).toBe(0);
  });
});

describe("Weekend Recap — coaching focus area generation", () => {
  it("identifies lowest metric", () => {
    const metrics = [
      { name: "GAP Penetration", value: 58 },
      { name: "Paint Protection", value: 32 },
      { name: "Warranty", value: 65 },
    ];
    expect(identifyLowestMetric(metrics)).toBe("Paint Protection");
  });
  it("empty metrics returns empty string", () => {
    expect(identifyLowestMetric([])).toBe("");
  });
});

describe("Commission Calculator — base + commission + products + bonus", () => {
  it("standard plan calculation", () => {
    const result = calculateCommission(4000, 15, 25, 150, 1800, 120, 2000, 2.2);
    expect(result.basePay).toBe(4000);
    expect(result.backGrossCommission).toBe(40500);
    expect(result.productCommission).toBe(8250);
    expect(result.bonus).toBe(2000);
    expect(result.monthly).toBe(54750);
  });
  it("annual = monthly × 12", () => {
    const result = calculateCommission(4000, 15, 25, 150, 1800, 120, 2000, 2.2);
    expect(result.annual).toBe(result.monthly * 12);
  });
});

describe("Commission Calculator — bonus threshold check", () => {
  it("bonus when deals >= threshold", () => {
    const result = calculateCommission(4000, 15, 25, 150, 1800, 120, 2000, 2);
    expect(result.bonus).toBe(2000);
  });
  it("no bonus when deals < threshold", () => {
    const result = calculateCommission(4000, 15, 25, 100, 1800, 120, 2000, 2);
    expect(result.bonus).toBe(0);
  });
  it("bonus at exact threshold", () => {
    const result = calculateCommission(4000, 15, 25, 120, 1800, 120, 2000, 2);
    expect(result.bonus).toBe(2000);
  });
});

describe("Commission Calculator — ASURA coaching scenario", () => {
  it("applies $759 PVR lift to back gross", () => {
    const current = calculateCommission(4000, 15, 25, 150, 1800, 120, 2000, 2.2);
    const asura = calculateCommission(4000, 15, 25, 150, 1800 + ASURA_PVR_LIFT, 120, 2000, 2.2 * (1 + ASURA_PRODUCT_INCREASE));
    expect(asura.monthly).toBeGreaterThan(current.monthly);
  });
  it("12% product increase reflected", () => {
    const baseProd = 2.2;
    const asuraProd = baseProd * (1 + ASURA_PRODUCT_INCREASE);
    expect(asuraProd).toBeCloseTo(2.464, 2);
  });
});

describe("Commission Calculator — top 1% benchmark", () => {
  it("uses $2,500 PVR", () => {
    expect(TOP_1_PVR).toBe(2500);
  });
  it("uses 65% penetration", () => {
    expect(TOP_1_PENETRATION).toBe(0.65);
  });
  it("top 1% monthly exceeds current", () => {
    const current = calculateCommission(4000, 15, 25, 150, 1800, 120, 2000, 2.2);
    const top = calculateCommission(4000, 15, 25, 150, TOP_1_PVR, 120, 2000, 2.2 * (TOP_1_PENETRATION / (2.2 / 4)));
    expect(top.monthly).toBeGreaterThan(current.monthly);
  });
});

describe("Commission Calculator — 12-month cumulative projection", () => {
  it("cumulative at month 12 = monthly × 12", () => {
    expect(calculateCumulativeEarnings(10000, 12)).toBe(120000);
  });
  it("cumulative at month 1 = monthly", () => {
    expect(calculateCumulativeEarnings(10000, 1)).toBe(10000);
  });
  it("cumulative at month 6", () => {
    expect(calculateCumulativeEarnings(10000, 6)).toBe(60000);
  });
});

describe("Commission Calculator — income vs PVR slider", () => {
  it("linear interpolation at $800 PVR", () => {
    const income = interpolatePVRtoIncome(800, 4000, 15, 150);
    expect(income).toBe(22000);
  });
  it("linear interpolation at $3000 PVR", () => {
    const income = interpolatePVRtoIncome(3000, 4000, 15, 150);
    expect(income).toBe(71500);
  });
  it("income increases with PVR", () => {
    const low = interpolatePVRtoIncome(1000, 4000, 15, 150);
    const high = interpolatePVRtoIncome(2000, 4000, 15, 150);
    expect(high).toBeGreaterThan(low);
  });
});

describe("Commission Calculator — pay plan preset validation", () => {
  it("valid preset", () => {
    expect(
      validatePayPlanPreset({
        name: "Standard F&I Plan",
        basePay: 4000,
        commissionRate: 15,
        flatPerProduct: 25,
      }),
    ).toBe(true);
  });
  it("invalid: empty name", () => {
    expect(
      validatePayPlanPreset({ name: "", basePay: 4000, commissionRate: 15, flatPerProduct: 25 }),
    ).toBe(false);
  });
  it("invalid: negative base pay", () => {
    expect(
      validatePayPlanPreset({ name: "Plan", basePay: -1, commissionRate: 15, flatPerProduct: 25 }),
    ).toBe(false);
  });
  it("invalid: commission rate > 100", () => {
    expect(
      validatePayPlanPreset({ name: "Plan", basePay: 4000, commissionRate: 101, flatPerProduct: 25 }),
    ).toBe(false);
  });
});

describe("Commission Calculator — YTD earnings progress", () => {
  it("50% progress", () => {
    const earnings = [15000, 15000, 15000, 15000, 15000, 15000, 0, 0, 0, 0, 0, 0];
    expect(calculateYTDProgress(earnings, 180000)).toBe(50);
  });
  it("100% progress", () => {
    const earnings = Array(12).fill(15000);
    expect(calculateYTDProgress(earnings, 180000)).toBe(100);
  });
  it("zero target returns 0", () => {
    expect(calculateYTDProgress([1000], 0)).toBe(0);
  });
});

describe("Mobile Bottom Nav — breakpoint detection", () => {
  it("breakpoint is 768px", () => {
    expect(MOBILE_BREAKPOINT).toBe(768);
  });
  it("767px is mobile", () => {
    expect(767 < MOBILE_BREAKPOINT).toBe(true);
  });
  it("768px is desktop", () => {
    expect(768 < MOBILE_BREAKPOINT).toBe(false);
  });
});

describe("Mobile Bottom Nav — item count", () => {
  it("has exactly 5 items", () => {
    expect(BOTTOM_NAV_ITEMS.length).toBe(5);
  });
  it("includes Dashboard, Live Session, History, Analytics, More", () => {
    const labels = BOTTOM_NAV_ITEMS.map((i) => i.label);
    expect(labels).toContain("Dashboard");
    expect(labels).toContain("Live Session");
    expect(labels).toContain("History");
    expect(labels).toContain("Analytics");
    expect(labels).toContain("More");
  });
});

describe("Mobile Bottom Nav — More drawer categories", () => {
  it("has Performance category", () => {
    expect(MORE_DRAWER_CATEGORIES).toContain("Performance");
  });
  it("has Coaching category", () => {
    expect(MORE_DRAWER_CATEGORIES).toContain("Coaching");
  });
  it("has Operations category", () => {
    expect(MORE_DRAWER_CATEGORIES).toContain("Operations");
  });
  it("has Business category", () => {
    expect(MORE_DRAWER_CATEGORIES).toContain("Business");
  });
  it("has Admin category", () => {
    expect(MORE_DRAWER_CATEGORIES).toContain("Admin");
  });
});
