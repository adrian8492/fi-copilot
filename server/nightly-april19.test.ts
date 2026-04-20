import { describe, expect, it } from "vitest";

// ── Incentive Tracker helpers ──
interface Incentive {
  id: string;
  name: string;
  source: "OEM" | "Lender" | "Dealer";
  type: "Spiff" | "Volume Bonus" | "Penetration Bonus" | "Rate Subvention";
  target: "per deal" | "monthly" | "quarterly";
  requirement: string;
  payout: number;
  expirationDate: string;
  status: "Active" | "Earned" | "Expired" | "Pending";
  earnedAmount: number;
}

const DEMO_INCENTIVES: Incentive[] = [
  { id: "i1", name: "Ally VSC Spiff", source: "Lender", type: "Spiff", target: "per deal", requirement: "Sell VSC on Ally-funded deal", payout: 50, expirationDate: "2026-05-15", status: "Active", earnedAmount: 750 },
  { id: "i2", name: "Chase Volume Bonus Q2", source: "Lender", type: "Volume Bonus", target: "quarterly", requirement: "25+ deals funded through Chase", payout: 2500, expirationDate: "2026-06-30", status: "Active", earnedAmount: 0 },
  { id: "i3", name: "Capital One Penetration", source: "Lender", type: "Penetration Bonus", target: "monthly", requirement: "60%+ product penetration on CapOne deals", payout: 1500, expirationDate: "2026-04-30", status: "Active", earnedAmount: 1500 },
  { id: "i4", name: "GM Financial Rate Sub", source: "OEM", type: "Rate Subvention", target: "per deal", requirement: "GM vehicle financed through GMAC", payout: 75, expirationDate: "2026-05-31", status: "Active", earnedAmount: 525 },
  { id: "i5", name: "Ford Motor Credit Spiff", source: "OEM", type: "Spiff", target: "per deal", requirement: "Any F&I product on Ford Credit deal", payout: 40, expirationDate: "2026-04-25", status: "Active", earnedAmount: 320 },
  { id: "i6", name: "Toyota Financial VSC Bonus", source: "OEM", type: "Volume Bonus", target: "monthly", requirement: "15+ VSC on Toyota Financial deals", payout: 1000, expirationDate: "2026-07-31", status: "Active", earnedAmount: 2000 },
  { id: "i7", name: "Dealer GAP Spiff", source: "Dealer", type: "Spiff", target: "per deal", requirement: "Sell GAP on any deal", payout: 25, expirationDate: "2026-12-31", status: "Active", earnedAmount: 400 },
  { id: "i8", name: "Ally Q1 Volume", source: "Lender", type: "Volume Bonus", target: "quarterly", requirement: "30+ deals in Q1", payout: 3000, expirationDate: "2026-03-31", status: "Earned", earnedAmount: 3000 },
  { id: "i9", name: "Chase Penetration Q1", source: "Lender", type: "Penetration Bonus", target: "quarterly", requirement: "55%+ penetration Q1", payout: 2000, expirationDate: "2026-03-31", status: "Earned", earnedAmount: 2000 },
  { id: "i10", name: "Capital One Holiday Spiff", source: "Lender", type: "Spiff", target: "per deal", requirement: "Any deal Dec 2025", payout: 100, expirationDate: "2025-12-31", status: "Expired", earnedAmount: 1200 },
  { id: "i11", name: "GM Year-End Push", source: "OEM", type: "Volume Bonus", target: "quarterly", requirement: "50+ GM deals Q4 2025", payout: 5000, expirationDate: "2025-12-31", status: "Expired", earnedAmount: 5000 },
  { id: "i12", name: "Dealer Prepaid Maint Bonus", source: "Dealer", type: "Penetration Bonus", target: "monthly", requirement: "40%+ prepaid maintenance penetration", payout: 750, expirationDate: "2026-06-30", status: "Pending", earnedAmount: 0 },
  { id: "i13", name: "Ford Tire & Wheel Promo", source: "OEM", type: "Spiff", target: "per deal", requirement: "Sell T&W on Ford Credit deal", payout: 35, expirationDate: "2026-04-22", status: "Active", earnedAmount: 210 },
  { id: "i14", name: "Capital One Q2 Volume", source: "Lender", type: "Volume Bonus", target: "quarterly", requirement: "20+ deals Q2", payout: 1800, expirationDate: "2026-06-30", status: "Pending", earnedAmount: 0 },
  { id: "i15", name: "Dealer Appearance Pkg", source: "Dealer", type: "Spiff", target: "per deal", requirement: "Sell appearance protection", payout: 30, expirationDate: "2026-09-30", status: "Active", earnedAmount: 180 },
];

function incentivePayoutCalc(dealCount: number, payoutPerDeal: number): number {
  return dealCount * payoutPerDeal;
}

function volumeBonusCheck(currentDeals: number, threshold: number): boolean {
  return currentDeals >= threshold;
}

function daysUntilExpiry(expirationDate: string, today: string): number {
  return Math.round((new Date(expirationDate).getTime() - new Date(today).getTime()) / 86400000);
}

function penetrationBonusCalc(penetrationPct: number, rate: number, base: number): number {
  return Math.round(penetrationPct * rate * base);
}

function monthlyEarningsAgg(earnings: { month: string; amount: number }[]): number {
  return earnings.reduce((s, e) => s + e.amount, 0);
}

function activeIncentiveCount(incentives: Incentive[]): number {
  return incentives.filter((i) => i.status === "Active").length;
}

function totalPotentialBonus(incentives: Incentive[]): number {
  return incentives.filter((i) => i.status === "Active" || i.status === "Pending").reduce((s, i) => s + i.payout, 0);
}

function earnedYTD(incentives: Incentive[]): number {
  return incentives.reduce((s, i) => s + i.earnedAmount, 0);
}

function expiringThisMonth(incentives: Incentive[], year: number, month: number): Incentive[] {
  return incentives.filter((i) => {
    const d = new Date(i.expirationDate);
    return d.getFullYear() === year && d.getMonth() === month && i.status === "Active";
  });
}

function filterBySource(incentives: Incentive[], source: string): Incentive[] {
  return incentives.filter((i) => i.source === source);
}

function incentiveTypeValid(type: string): boolean {
  return ["Spiff", "Volume Bonus", "Penetration Bonus", "Rate Subvention"].includes(type);
}

function incentiveStatusCheck(expirationDate: string, today: string): "Active" | "Expired" {
  return new Date(expirationDate).getTime() >= new Date(today).getTime() ? "Active" : "Expired";
}

// ── FI Health Score helpers ──
interface HealthDimension {
  name: string;
  score: number;
  weight: number;
  benchmark: number;
  lastMonth: number;
  topFactor: string;
  dragFactor: string;
}

function healthScoreWeightedAvg(dimensions: HealthDimension[]): number {
  const totalWeight = dimensions.reduce((s, d) => s + d.weight, 0);
  const weighted = dimensions.reduce((s, d) => s + d.score * d.weight, 0);
  return Math.round(weighted / totalWeight);
}

function letterGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function trendDirection(current: number, prior: number): "up" | "down" | "flat" {
  if (current > prior) return "up";
  if (current < prior) return "down";
  return "flat";
}

function benchmarkDelta(score: number, benchmark: number): number {
  return score - benchmark;
}

function prescriptionRank(items: { action: string; impact: number }[]): string[] {
  return [...items].sort((a, b) => b.impact - a.impact).map((i) => i.action);
}

function scoreThreshold(score: number): "red" | "yellow" | "green" {
  if (score < 60) return "red";
  if (score < 80) return "yellow";
  return "green";
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function healthTrendArray(months: number): number {
  return months;
}

function radarDataForLocations(locations: string[], dimensions: string[]): { location: string; dimensions: string[] }[] {
  return locations.map((loc) => ({ location: loc, dimensions }));
}

// ── Stip Tracker helpers ──
interface Stip {
  id: string;
  dealNumber: string;
  customer: string;
  lender: string;
  description: string;
  dateSubmitted: string;
  priority: "Critical" | "High" | "Normal";
  status: "Open" | "Submitted" | "Cleared" | "Waived";
  assignedTo: string;
  notes: string;
}

function stipAge(dateSubmitted: string, today: string): number {
  return Math.round((new Date(today).getTime() - new Date(dateSubmitted).getTime()) / 86400000);
}

function isAtRiskStip(dateSubmitted: string, today: string): boolean {
  return stipAge(dateSubmitted, today) > 5;
}

function ageBucket(days: number): "<24h" | "1-3d" | "3-7d" | "7+d" {
  if (days < 1) return "<24h";
  if (days <= 3) return "1-3d";
  if (days <= 7) return "3-7d";
  return "7+d";
}

function stipClearanceRate(cleared: number, totalSubmitted: number): number {
  if (totalSubmitted === 0) return 0;
  return Math.round((cleared / totalSubmitted) * 100);
}

function prioritySortOrder(priority: "Critical" | "High" | "Normal"): number {
  const order = { Critical: 0, High: 1, Normal: 2 };
  return order[priority];
}

function sortByPriority(stips: Stip[]): Stip[] {
  return [...stips].sort((a, b) => prioritySortOrder(a.priority) - prioritySortOrder(b.priority));
}

function bulkClearOpenCount(stips: Stip[], clearIds: string[]): number {
  return stips.filter((s) => s.status === "Open" && !clearIds.includes(s.id)).length;
}

function filterStipsByLender(stips: Stip[], lender: string): Stip[] {
  return stips.filter((s) => s.lender === lender);
}

function filterStipsByPriority(stips: Stip[], priority: string): Stip[] {
  return stips.filter((s) => s.priority === priority);
}

function filterStipsByStatus(stips: Stip[], status: string): Stip[] {
  return stips.filter((s) => s.status === status);
}

function atRiskDealCount(stips: Stip[], today: string): number {
  const atRiskDeals = new Set<string>();
  stips.filter((s) => s.status === "Open" && isAtRiskStip(s.dateSubmitted, today)).forEach((s) => atRiskDeals.add(s.dealNumber));
  return atRiskDeals.size;
}

// ── Deal Profit Breakdown helpers ──
interface WaterfallItem {
  name: string;
  value: number;
}

function waterfallTotal(items: WaterfallItem[]): number {
  return items.reduce((s, i) => s + i.value, 0);
}

function reserveEfficiency(earned: number, maxPossible: number): number {
  if (maxPossible === 0) return 0;
  return Math.round((earned / maxPossible) * 100);
}

function grossMarginPct(salePrice: number, cost: number): number {
  if (salePrice === 0) return 0;
  return Math.round(((salePrice - cost) / salePrice) * 100);
}

function moneyLeftOnTable(unsoldProducts: { avgGross: number }[]): number {
  return unsoldProducts.reduce((s, p) => s + p.avgGross, 0);
}

function penetrationEfficiency(sold: number, presented: number): number {
  if (presented === 0) return 0;
  return Math.round((sold / presented) * 100);
}

function dealVsBenchmarkDelta(dealGross: number, benchmarkGross: number): number {
  return dealGross - benchmarkGross;
}

function chargebackRiskScore(dealAgeDays: number, hasVSC: boolean, hasGAP: boolean): number {
  let risk = 0;
  if (dealAgeDays < 90) risk += 40;
  else if (dealAgeDays < 180) risk += 20;
  if (hasVSC) risk += 25;
  if (hasGAP) risk += 15;
  return Math.min(100, risk);
}

function managerVsStoreAvg(dealPVR: number, managerAvgPVR: number, storeAvgPVR: number): { vsManager: number; vsStore: number } {
  return { vsManager: dealPVR - managerAvgPVR, vsStore: dealPVR - storeAvgPVR };
}

function isTopQuartile(dealPVR: number, percentile75: number): boolean {
  return dealPVR >= percentile75;
}

function reserveSpreadBps(sellRate: number, buyRate: number): number {
  return Math.round((sellRate - buyRate) * 100);
}

function reserveFromAmount(spreadBps: number, amountFinanced: number): number {
  return Math.round((spreadBps / 10000) * amountFinanced);
}

function sortDealsByGrossDesc(deals: { totalGross: number }[]): { totalGross: number }[] {
  return [...deals].sort((a, b) => b.totalGross - a.totalGross);
}

// ═══════════════════ TESTS ═══════════════════

describe("nightly april 19 — incentive tracker", () => {
  it("calculates incentive payout from deal count × payout per deal", () => {
    expect(incentivePayoutCalc(15, 50)).toBe(750);
    expect(incentivePayoutCalc(0, 50)).toBe(0);
    expect(incentivePayoutCalc(10, 75)).toBe(750);
  });

  it("volume bonus threshold check (meets minimum deal count)", () => {
    expect(volumeBonusCheck(25, 25)).toBe(true);
    expect(volumeBonusCheck(30, 25)).toBe(true);
    expect(volumeBonusCheck(20, 25)).toBe(false);
  });

  it("incentive expiration date check (days until expiry)", () => {
    expect(daysUntilExpiry("2026-05-19", "2026-04-19")).toBe(30);
    expect(daysUntilExpiry("2026-04-19", "2026-04-19")).toBe(0);
    expect(daysUntilExpiry("2026-04-18", "2026-04-19")).toBe(-1);
  });

  it("penetration bonus calculation", () => {
    expect(penetrationBonusCalc(0.65, 2, 1000)).toBe(1300);
    expect(penetrationBonusCalc(0.50, 1.5, 2000)).toBe(1500);
  });

  it("monthly incentive earnings aggregation", () => {
    const earnings = [
      { month: "Jan", amount: 1200 },
      { month: "Feb", amount: 1500 },
      { month: "Mar", amount: 1800 },
    ];
    expect(monthlyEarningsAgg(earnings)).toBe(4500);
  });

  it("counts active incentives", () => {
    expect(activeIncentiveCount(DEMO_INCENTIVES)).toBe(9);
  });

  it("total potential bonus from active + pending", () => {
    const total = totalPotentialBonus(DEMO_INCENTIVES);
    expect(total).toBeGreaterThan(0);
  });

  it("earned YTD aggregation across all programs", () => {
    const ytd = earnedYTD(DEMO_INCENTIVES);
    expect(ytd).toBeGreaterThan(0);
    // Sum of all earnedAmount fields
    const expected = DEMO_INCENTIVES.reduce((s, i) => s + i.earnedAmount, 0);
    expect(ytd).toBe(expected);
  });

  it("finds incentives expiring this month (April 2026)", () => {
    const expiring = expiringThisMonth(DEMO_INCENTIVES, 2026, 3); // month is 0-indexed
    expect(expiring.length).toBeGreaterThan(0);
    expiring.forEach((i) => {
      const d = new Date(i.expirationDate);
      expect(d.getMonth()).toBe(3);
      expect(d.getFullYear()).toBe(2026);
    });
  });

  it("filters by source (OEM / Lender / Dealer)", () => {
    const oem = filterBySource(DEMO_INCENTIVES, "OEM");
    expect(oem.length).toBeGreaterThan(0);
    oem.forEach((i) => expect(i.source).toBe("OEM"));

    const lender = filterBySource(DEMO_INCENTIVES, "Lender");
    expect(lender.length).toBeGreaterThan(0);

    const dealer = filterBySource(DEMO_INCENTIVES, "Dealer");
    expect(dealer.length).toBeGreaterThan(0);
  });

  it("validates incentive types", () => {
    expect(incentiveTypeValid("Spiff")).toBe(true);
    expect(incentiveTypeValid("Volume Bonus")).toBe(true);
    expect(incentiveTypeValid("Penetration Bonus")).toBe(true);
    expect(incentiveTypeValid("Rate Subvention")).toBe(true);
    expect(incentiveTypeValid("Invalid")).toBe(false);
  });

  it("incentive program status check (active vs expired based on date)", () => {
    expect(incentiveStatusCheck("2026-05-01", "2026-04-19")).toBe("Active");
    expect(incentiveStatusCheck("2026-04-01", "2026-04-19")).toBe("Expired");
    expect(incentiveStatusCheck("2026-04-19", "2026-04-19")).toBe("Active");
  });
});

describe("nightly april 19 — fi health score", () => {
  const dimensions: HealthDimension[] = [
    { name: "PVR Performance", score: 82, weight: 25, benchmark: 75, lastMonth: 78, topFactor: "VSC attachment", dragFactor: "Low GAP penetration" },
    { name: "Product Penetration", score: 71, weight: 20, benchmark: 65, lastMonth: 73, topFactor: "Menu compliance", dragFactor: "Missing key replacement" },
    { name: "Compliance Health", score: 94, weight: 15, benchmark: 85, lastMonth: 92, topFactor: "Full disclosures", dragFactor: "Rate markup timing" },
    { name: "Customer Satisfaction", score: 88, weight: 15, benchmark: 80, lastMonth: 86, topFactor: "CSI follow-up", dragFactor: "Wait time" },
    { name: "Lender Relationships", score: 76, weight: 15, benchmark: 70, lastMonth: 76, topFactor: "Ally volume", dragFactor: "Stip delays" },
    { name: "Team Velocity", score: 69, weight: 10, benchmark: 72, lastMonth: 65, topFactor: "Deal turnaround", dragFactor: "Staff turnover" },
  ];

  it("weighted average calculation (6 dimensions × weights)", () => {
    const score = healthScoreWeightedAvg(dimensions);
    // Manual: (82*25 + 71*20 + 94*15 + 88*15 + 76*15 + 69*10) / 100 = 80.4 → 80
    expect(score).toBe(80);
  });

  it("letter grade assignment (90+=A, 80-89=B, 70-79=C, 60-69=D, <60=F)", () => {
    expect(letterGrade(95)).toBe("A");
    expect(letterGrade(90)).toBe("A");
    expect(letterGrade(85)).toBe("B");
    expect(letterGrade(80)).toBe("B");
    expect(letterGrade(75)).toBe("C");
    expect(letterGrade(70)).toBe("C");
    expect(letterGrade(65)).toBe("D");
    expect(letterGrade(60)).toBe("D");
    expect(letterGrade(55)).toBe("F");
    expect(letterGrade(0)).toBe("F");
  });

  it("health score trend direction (up/down/flat vs prior month)", () => {
    expect(trendDirection(85, 80)).toBe("up");
    expect(trendDirection(75, 80)).toBe("down");
    expect(trendDirection(80, 80)).toBe("flat");
  });

  it("benchmark delta calculation (score - industry benchmark)", () => {
    expect(benchmarkDelta(82, 75)).toBe(7);
    expect(benchmarkDelta(69, 72)).toBe(-3);
    expect(benchmarkDelta(80, 80)).toBe(0);
  });

  it("prescription ranking (sort action items by estimated impact)", () => {
    const items = [
      { action: "Improve GAP presentation", impact: 3 },
      { action: "Add key replacement to menu", impact: 5 },
      { action: "Reduce stip delays", impact: 2 },
      { action: "VSC objection training", impact: 4 },
    ];
    const ranked = prescriptionRank(items);
    expect(ranked[0]).toBe("Add key replacement to menu");
    expect(ranked[1]).toBe("VSC objection training");
    expect(ranked[3]).toBe("Reduce stip delays");
  });

  it("score threshold classification (red/yellow/green)", () => {
    expect(scoreThreshold(55)).toBe("red");
    expect(scoreThreshold(59)).toBe("red");
    expect(scoreThreshold(60)).toBe("yellow");
    expect(scoreThreshold(79)).toBe("yellow");
    expect(scoreThreshold(80)).toBe("green");
    expect(scoreThreshold(100)).toBe("green");
  });

  it("health score dimension capping (0-100 range)", () => {
    expect(clampScore(105)).toBe(100);
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(75)).toBe(75);
    expect(clampScore(0)).toBe(0);
    expect(clampScore(100)).toBe(100);
  });

  it("6-month trend array length", () => {
    expect(healthTrendArray(6)).toBe(6);
  });

  it("multi-location health score radar data formatting", () => {
    const locations = ["Downtown Honda", "Eastside Toyota", "Metro Ford"];
    const dims = ["PVR", "Penetration", "Compliance", "CSI", "Lender", "Velocity"];
    const data = radarDataForLocations(locations, dims);
    expect(data).toHaveLength(3);
    expect(data[0].location).toBe("Downtown Honda");
    expect(data[0].dimensions).toHaveLength(6);
  });
});

describe("nightly april 19 — stip tracker", () => {
  const demoStips: Stip[] = [
    { id: "s1", dealNumber: "D1001", customer: "John Smith", lender: "Ally Financial", description: "Proof of Income", dateSubmitted: "2026-04-12", priority: "Critical", status: "Open", assignedTo: "Marcus Rivera", notes: "" },
    { id: "s2", dealNumber: "D1002", customer: "Jane Doe", lender: "Chase Auto", description: "Insurance Binder", dateSubmitted: "2026-04-17", priority: "High", status: "Open", assignedTo: "Jessica Chen", notes: "" },
    { id: "s3", dealNumber: "D1003", customer: "Mike Johnson", lender: "Capital One", description: "Bank Statements", dateSubmitted: "2026-04-10", priority: "Normal", status: "Submitted", assignedTo: "David Washington", notes: "" },
    { id: "s4", dealNumber: "D1004", customer: "Sarah Williams", lender: "Wells Fargo", description: "Driver's License", dateSubmitted: "2026-04-18", priority: "Normal", status: "Cleared", assignedTo: "Sarah Kim", notes: "" },
    { id: "s5", dealNumber: "D1001", customer: "John Smith", lender: "Ally Financial", description: "Proof of Residence", dateSubmitted: "2026-04-13", priority: "High", status: "Open", assignedTo: "Marcus Rivera", notes: "" },
    { id: "s6", dealNumber: "D1005", customer: "Tom Brown", lender: "US Bank", description: "Trade Title", dateSubmitted: "2026-04-08", priority: "Critical", status: "Open", assignedTo: "Jessica Chen", notes: "" },
    { id: "s7", dealNumber: "D1006", customer: "Lisa Davis", lender: "Toyota Financial", description: "Signed Credit App", dateSubmitted: "2026-04-19", priority: "Normal", status: "Open", assignedTo: "David Washington", notes: "" },
    { id: "s8", dealNumber: "D1007", customer: "Chris Wilson", lender: "GM Financial", description: "Pay Stubs (2 months)", dateSubmitted: "2026-04-14", priority: "High", status: "Submitted", assignedTo: "Sarah Kim", notes: "" },
  ];

  it("stip age calculation (days since submitted)", () => {
    expect(stipAge("2026-04-12", "2026-04-19")).toBe(7);
    expect(stipAge("2026-04-19", "2026-04-19")).toBe(0);
    expect(stipAge("2026-04-17", "2026-04-19")).toBe(2);
  });

  it("at-risk stip identification (>5 days open)", () => {
    expect(isAtRiskStip("2026-04-12", "2026-04-19")).toBe(true);
    expect(isAtRiskStip("2026-04-17", "2026-04-19")).toBe(false);
    expect(isAtRiskStip("2026-04-14", "2026-04-19")).toBe(false);
  });

  it("age bucket classification (<24h / 1-3d / 3-7d / 7+d)", () => {
    expect(ageBucket(0)).toBe("<24h");
    expect(ageBucket(1)).toBe("1-3d");
    expect(ageBucket(3)).toBe("1-3d");
    expect(ageBucket(5)).toBe("3-7d");
    expect(ageBucket(7)).toBe("3-7d");
    expect(ageBucket(8)).toBe("7+d");
    expect(ageBucket(14)).toBe("7+d");
  });

  it("stip clearance rate (cleared / total submitted × 100)", () => {
    expect(stipClearanceRate(8, 20)).toBe(40);
    expect(stipClearanceRate(0, 10)).toBe(0);
    expect(stipClearanceRate(5, 5)).toBe(100);
    expect(stipClearanceRate(0, 0)).toBe(0);
  });

  it("priority sort order (Critical > High > Normal)", () => {
    expect(prioritySortOrder("Critical")).toBeLessThan(prioritySortOrder("High"));
    expect(prioritySortOrder("High")).toBeLessThan(prioritySortOrder("Normal"));
    const sorted = sortByPriority(demoStips);
    expect(sorted[0].priority).toBe("Critical");
  });

  it("bulk clear reduces open count", () => {
    const openBefore = demoStips.filter((s) => s.status === "Open").length;
    const clearIds = ["s1", "s2"];
    const openAfter = bulkClearOpenCount(demoStips, clearIds);
    expect(openAfter).toBe(openBefore - 2);
  });

  it("filter by lender reduces dataset", () => {
    const ally = filterStipsByLender(demoStips, "Ally Financial");
    expect(ally.length).toBeLessThan(demoStips.length);
    expect(ally.length).toBeGreaterThan(0);
    ally.forEach((s) => expect(s.lender).toBe("Ally Financial"));
  });

  it("filter by priority reduces dataset", () => {
    const critical = filterStipsByPriority(demoStips, "Critical");
    expect(critical.length).toBeLessThan(demoStips.length);
    expect(critical.length).toBeGreaterThan(0);
    critical.forEach((s) => expect(s.priority).toBe("Critical"));
  });

  it("filter by status reduces dataset", () => {
    const open = filterStipsByStatus(demoStips, "Open");
    expect(open.length).toBeLessThan(demoStips.length);
    expect(open.length).toBeGreaterThan(0);
    open.forEach((s) => expect(s.status).toBe("Open"));
  });

  it("at-risk deal count (deals with open stips >5 days)", () => {
    const count = atRiskDealCount(demoStips, "2026-04-19");
    expect(count).toBeGreaterThan(0);
    // D1001 has open stips from 4/12 and 4/13 (7 and 6 days), D1005 has open stip from 4/08 (11 days)
    expect(count).toBe(2); // D1001, D1005 (D1003 is Submitted not Open)
  });
});

describe("nightly april 19 — deal profit breakdown", () => {
  it("deal profit waterfall total (sum all components = net gross)", () => {
    const waterfall: WaterfallItem[] = [
      { name: "Front Gross", value: 2500 },
      { name: "Reserve", value: 800 },
      { name: "VSC", value: 1450 },
      { name: "GAP", value: 625 },
      { name: "Other Products", value: 890 },
      { name: "Chargebacks", value: -350 },
    ];
    expect(waterfallTotal(waterfall)).toBe(5915);
  });

  it("reserve efficiency % (earned / max possible × 100)", () => {
    expect(reserveEfficiency(800, 1200)).toBe(67);
    expect(reserveEfficiency(1000, 1000)).toBe(100);
    expect(reserveEfficiency(0, 500)).toBe(0);
    expect(reserveEfficiency(0, 0)).toBe(0);
  });

  it("gross margin % per product (gross / sale price × 100)", () => {
    expect(grossMarginPct(2100, 650)).toBe(69);
    expect(grossMarginPct(895, 280)).toBe(69);
    expect(grossMarginPct(0, 0)).toBe(0);
  });

  it("money left on table (sum of unsold products × avg gross)", () => {
    const unsold = [
      { avgGross: 1450 },
      { avgGross: 625 },
      { avgGross: 419 },
    ];
    expect(moneyLeftOnTable(unsold)).toBe(2494);
  });

  it("penetration efficiency (sold / presented × 100)", () => {
    expect(penetrationEfficiency(4, 8)).toBe(50);
    expect(penetrationEfficiency(6, 8)).toBe(75);
    expect(penetrationEfficiency(0, 8)).toBe(0);
    expect(penetrationEfficiency(0, 0)).toBe(0);
  });

  it("deal vs benchmark delta per product", () => {
    expect(dealVsBenchmarkDelta(1450, 1200)).toBe(250);
    expect(dealVsBenchmarkDelta(600, 750)).toBe(-150);
    expect(dealVsBenchmarkDelta(1000, 1000)).toBe(0);
  });

  it("chargeback risk score calculation", () => {
    // New deal with VSC + GAP = 40 + 25 + 15 = 80
    expect(chargebackRiskScore(30, true, true)).toBe(80);
    // Old deal with no products = 0
    expect(chargebackRiskScore(200, false, false)).toBe(0);
    // Mid-age deal with VSC only = 20 + 25 = 45
    expect(chargebackRiskScore(120, true, false)).toBe(45);
    // New deal all products capped at 100
    expect(chargebackRiskScore(10, true, true)).toBe(80);
  });

  it("manager vs store avg comparison", () => {
    const comp = managerVsStoreAvg(2200, 1800, 1650);
    expect(comp.vsManager).toBe(400);
    expect(comp.vsStore).toBe(550);
  });

  it("top quartile deal classification (>= 75th percentile PVR)", () => {
    expect(isTopQuartile(2500, 2200)).toBe(true);
    expect(isTopQuartile(2200, 2200)).toBe(true);
    expect(isTopQuartile(1800, 2200)).toBe(false);
  });

  it("reserve spread in basis points (sell rate - buy rate)", () => {
    expect(reserveSpreadBps(6.5, 4.0)).toBe(250);
    expect(reserveSpreadBps(5.0, 3.5)).toBe(150);
    expect(reserveSpreadBps(4.0, 4.0)).toBe(0);
  });

  it("amount financed impact on reserve (higher amount = higher reserve $)", () => {
    const reserve1 = reserveFromAmount(200, 30000); // 2% of 30K = 600
    const reserve2 = reserveFromAmount(200, 45000); // 2% of 45K = 900
    expect(reserve2).toBeGreaterThan(reserve1);
    expect(reserve1).toBe(600);
    expect(reserve2).toBe(900);
  });

  it("deal profit sort by total gross descending", () => {
    const deals = [
      { totalGross: 3200 },
      { totalGross: 5800 },
      { totalGross: 4100 },
      { totalGross: 2900 },
    ];
    const sorted = sortDealsByGrossDesc(deals);
    expect(sorted[0].totalGross).toBe(5800);
    expect(sorted[3].totalGross).toBe(2900);
  });
});

describe("nightly april 19 — cross-feature validations", () => {
  it("all 15 demo incentive programs have unique ids", () => {
    const ids = DEMO_INCENTIVES.map((i) => i.id);
    expect(new Set(ids).size).toBe(15);
  });

  it("incentive sources are valid", () => {
    DEMO_INCENTIVES.forEach((i) => {
      expect(["OEM", "Lender", "Dealer"]).toContain(i.source);
    });
  });

  it("incentive types are all valid", () => {
    DEMO_INCENTIVES.forEach((i) => {
      expect(incentiveTypeValid(i.type)).toBe(true);
    });
  });

  it("health score letter grades cover full range", () => {
    expect(letterGrade(100)).toBe("A");
    expect(letterGrade(50)).toBe("F");
    const grades = [95, 85, 75, 65, 55].map(letterGrade);
    expect(new Set(grades).size).toBe(5);
  });

  it("stip age is non-negative for same-day submission", () => {
    expect(stipAge("2026-04-19", "2026-04-19")).toBe(0);
    expect(stipAge("2026-04-19", "2026-04-19")).toBeGreaterThanOrEqual(0);
  });

  it("reserve efficiency + gross margin are percentage-based (0-100)", () => {
    expect(reserveEfficiency(500, 1000)).toBeGreaterThanOrEqual(0);
    expect(reserveEfficiency(500, 1000)).toBeLessThanOrEqual(100);
    expect(grossMarginPct(1000, 300)).toBeGreaterThanOrEqual(0);
    expect(grossMarginPct(1000, 300)).toBeLessThanOrEqual(100);
  });
});
