import { describe, expect, it } from "vitest";

// ── Contract Checklist helpers ──
interface ChecklistItem {
  id: string;
  section: string;
  name: string;
  required: boolean;
  status: "complete" | "pending" | "missing";
}

const SECTIONS = [
  "Identification Docs",
  "Credit Documents",
  "F&I Product Contracts",
  "Rate/Markup Disclosures",
  "Signature Completeness",
  "Lender Stipulations",
];

const DEMO_CHECKLIST: ChecklistItem[] = [
  { id: "c1", section: "Identification Docs", name: "Driver License Copy", required: true, status: "complete" },
  { id: "c2", section: "Identification Docs", name: "Proof of Insurance", required: true, status: "complete" },
  { id: "c3", section: "Identification Docs", name: "Proof of Residence", required: false, status: "pending" },
  { id: "c4", section: "Credit Documents", name: "Credit Application", required: true, status: "complete" },
  { id: "c5", section: "Credit Documents", name: "Credit Bureau Report", required: true, status: "complete" },
  { id: "c6", section: "Credit Documents", name: "Income Verification", required: true, status: "missing" },
  { id: "c7", section: "Credit Documents", name: "Bank Statements", required: false, status: "pending" },
  { id: "c8", section: "F&I Product Contracts", name: "VSC Contract", required: true, status: "complete" },
  { id: "c9", section: "F&I Product Contracts", name: "GAP Waiver", required: true, status: "complete" },
  { id: "c10", section: "F&I Product Contracts", name: "Paint Protection Agreement", required: false, status: "missing" },
  { id: "c11", section: "F&I Product Contracts", name: "Tire & Wheel Contract", required: false, status: "complete" },
  { id: "c12", section: "Rate/Markup Disclosures", name: "Rate Markup Disclosure", required: true, status: "complete" },
  { id: "c13", section: "Rate/Markup Disclosures", name: "Truth in Lending", required: true, status: "pending" },
  { id: "c14", section: "Rate/Markup Disclosures", name: "Privacy Notice", required: true, status: "complete" },
  { id: "c15", section: "Signature Completeness", name: "Buyer Signature - Contract", required: true, status: "complete" },
  { id: "c16", section: "Signature Completeness", name: "Co-Buyer Signature", required: false, status: "missing" },
  { id: "c17", section: "Signature Completeness", name: "Arbitration Agreement Sig", required: true, status: "pending" },
  { id: "c18", section: "Lender Stipulations", name: "Proof of Income (Stip)", required: true, status: "missing" },
  { id: "c19", section: "Lender Stipulations", name: "Verified Employment", required: true, status: "complete" },
  { id: "c20", section: "Lender Stipulations", name: "Down Payment Receipt", required: false, status: "complete" },
];

function completionPercent(items: ChecklistItem[]): number {
  if (items.length === 0) return 0;
  return Math.round((items.filter((i) => i.status === "complete").length / items.length) * 100);
}

function isReadyToFund(items: ChecklistItem[]): boolean {
  return items.every((i) => i.status === "complete");
}

function criticalItems(items: ChecklistItem[]): ChecklistItem[] {
  return items.filter((i) => i.required && i.status !== "complete");
}

function sectionCompletion(items: ChecklistItem[], section: string): { complete: number; total: number } {
  const sectionItems = items.filter((i) => i.section === section);
  return {
    complete: sectionItems.filter((i) => i.status === "complete").length,
    total: sectionItems.length,
  };
}

function countByStatus(items: ChecklistItem[], status: "complete" | "pending" | "missing"): number {
  return items.filter((i) => i.status === status).length;
}

function estTimeToClear(pendingCount: number, missingCount: number): number {
  // 5 min per pending, 15 min per missing
  return pendingCount * 5 + missingCount * 15;
}

function progressColor(pct: number): string {
  if (pct < 70) return "red";
  if (pct < 90) return "yellow";
  return "green";
}

function requiredItemCount(items: ChecklistItem[]): number {
  return items.filter((i) => i.required).length;
}

// ── Report Card helpers ──
interface ManagerGrade {
  manager: string;
  month: string;
  pvr: number;
  productPenetration: number;
  complianceScore: number;
  coachingAdherence: number;
  customerSatisfaction: number;
}

const WEIGHTS = { pvr: 0.35, productPenetration: 0.25, complianceScore: 0.20, coachingAdherence: 0.10, customerSatisfaction: 0.10 };

function weightedScore(grade: ManagerGrade): number {
  return Math.round(
    grade.pvr * WEIGHTS.pvr +
    grade.productPenetration * WEIGHTS.productPenetration +
    grade.complianceScore * WEIGHTS.complianceScore +
    grade.coachingAdherence * WEIGHTS.coachingAdherence +
    grade.customerSatisfaction * WEIGHTS.customerSatisfaction
  );
}

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

function gpa(grade: string): number {
  const map: Record<string, number> = {
    "A+": 4.0, "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7,
    "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "D-": 0.7, "F": 0.0,
  };
  return map[grade] ?? 0.0;
}

function peerRanking(managers: ManagerGrade[]): { manager: string; score: number }[] {
  return managers.map((m) => ({ manager: m.manager, score: weightedScore(m) })).sort((a, b) => b.score - a.score);
}

function teamAverage(managers: ManagerGrade[], field: keyof Omit<ManagerGrade, "manager" | "month">): number {
  if (managers.length === 0) return 0;
  return Math.round(managers.reduce((s, m) => s + m[field], 0) / managers.length);
}

function bottomCategories(grade: ManagerGrade, n: number): string[] {
  const cats: { name: string; score: number }[] = [
    { name: "PVR", score: grade.pvr },
    { name: "Product Penetration", score: grade.productPenetration },
    { name: "Compliance Score", score: grade.complianceScore },
    { name: "Coaching Adherence", score: grade.coachingAdherence },
    { name: "Customer Satisfaction", score: grade.customerSatisfaction },
  ];
  return cats.sort((a, b) => a.score - b.score).slice(0, n).map((c) => c.name);
}

function sixMonthTrend(data: ManagerGrade[]): number[] {
  return data.map((d) => weightedScore(d));
}

const DEMO_MANAGERS: ManagerGrade[] = [
  { manager: "Sarah Mitchell", month: "Apr 2026", pvr: 92, productPenetration: 88, complianceScore: 95, coachingAdherence: 80, customerSatisfaction: 90 },
  { manager: "James Rodriguez", month: "Apr 2026", pvr: 78, productPenetration: 72, complianceScore: 85, coachingAdherence: 70, customerSatisfaction: 75 },
  { manager: "Ashley Chen", month: "Apr 2026", pvr: 95, productPenetration: 91, complianceScore: 98, coachingAdherence: 88, customerSatisfaction: 94 },
  { manager: "Marcus Thompson", month: "Apr 2026", pvr: 65, productPenetration: 60, complianceScore: 72, coachingAdherence: 55, customerSatisfaction: 68 },
  { manager: "Rachel Kim", month: "Apr 2026", pvr: 85, productPenetration: 80, complianceScore: 90, coachingAdherence: 82, customerSatisfaction: 88 },
  { manager: "David Patel", month: "Apr 2026", pvr: 70, productPenetration: 68, complianceScore: 78, coachingAdherence: 60, customerSatisfaction: 72 },
  { manager: "Lauren Williams", month: "Apr 2026", pvr: 88, productPenetration: 85, complianceScore: 92, coachingAdherence: 75, customerSatisfaction: 86 },
  { manager: "Chris Martinez", month: "Apr 2026", pvr: 82, productPenetration: 76, complianceScore: 88, coachingAdherence: 72, customerSatisfaction: 80 },
];

// ── Funding Queue helpers ──
interface FundingDeal {
  id: number;
  customer: string;
  lender: string;
  amountFinanced: number;
  contractDate: string;
  submittedDate: string | null;
  daysOut: number;
  status: "Pending" | "Submitted" | "Approved" | "Funded" | "Chargeback";
  stipsRemaining: number;
  chargebackRisk: number;
}

const DEMO_QUEUE: FundingDeal[] = [
  { id: 1, customer: "John Adams", lender: "Ally", amountFinanced: 28500, contractDate: "2026-04-10", submittedDate: "2026-04-11", daysOut: 10, status: "Submitted", stipsRemaining: 1, chargebackRisk: 10 },
  { id: 2, customer: "Maria Garcia", lender: "Chase", amountFinanced: 35200, contractDate: "2026-04-12", submittedDate: "2026-04-12", daysOut: 8, status: "Approved", stipsRemaining: 0, chargebackRisk: 5 },
  { id: 3, customer: "Robert Lee", lender: "Capital One", amountFinanced: 22100, contractDate: "2026-04-05", submittedDate: null, daysOut: 15, status: "Pending", stipsRemaining: 3, chargebackRisk: 45 },
  { id: 4, customer: "Jennifer Smith", lender: "Wells Fargo", amountFinanced: 41000, contractDate: "2026-04-15", submittedDate: "2026-04-16", daysOut: 5, status: "Funded", stipsRemaining: 0, chargebackRisk: 0 },
  { id: 5, customer: "David Brown", lender: "US Bank", amountFinanced: 18900, contractDate: "2026-04-08", submittedDate: "2026-04-09", daysOut: 12, status: "Submitted", stipsRemaining: 2, chargebackRisk: 30 },
  { id: 6, customer: "Susan Miller", lender: "TD Auto", amountFinanced: 31500, contractDate: "2026-04-14", submittedDate: "2026-04-15", daysOut: 6, status: "Funded", stipsRemaining: 0, chargebackRisk: 0 },
  { id: 7, customer: "James Wilson", lender: "Westlake", amountFinanced: 15800, contractDate: "2026-04-03", submittedDate: null, daysOut: 17, status: "Pending", stipsRemaining: 4, chargebackRisk: 65 },
  { id: 8, customer: "Linda Davis", lender: "Credit Acceptance", amountFinanced: 19200, contractDate: "2026-04-16", submittedDate: "2026-04-17", daysOut: 4, status: "Approved", stipsRemaining: 0, chargebackRisk: 15 },
  { id: 9, customer: "Michael Taylor", lender: "Ally", amountFinanced: 27600, contractDate: "2026-04-18", submittedDate: "2026-04-18", daysOut: 2, status: "Submitted", stipsRemaining: 1, chargebackRisk: 8 },
  { id: 10, customer: "Karen White", lender: "Chase", amountFinanced: 44500, contractDate: "2026-04-01", submittedDate: "2026-04-02", daysOut: 19, status: "Chargeback", stipsRemaining: 0, chargebackRisk: 90 },
];

function agingDays(contractDate: string, today: string): number {
  return Math.round((new Date(today).getTime() - new Date(contractDate).getTime()) / 86400000);
}

function filterByStatus(deals: FundingDeal[], status: string): FundingDeal[] {
  if (status === "All") return deals;
  return deals.filter((d) => d.status === status);
}

function filterByAging(deals: FundingDeal[], bucket: string): FundingDeal[] {
  if (bucket === "All") return deals;
  if (bucket === "0-2") return deals.filter((d) => d.daysOut <= 2);
  if (bucket === "3-5") return deals.filter((d) => d.daysOut >= 3 && d.daysOut <= 5);
  return deals.filter((d) => d.daysOut > 5); // "5+"
}

function queueTotalPending(deals: FundingDeal[]): number {
  return deals.filter((d) => d.status !== "Funded" && d.status !== "Chargeback").reduce((s, d) => s + d.amountFinanced, 0);
}

function fundedToday(deals: FundingDeal[], today: string): number {
  return deals.filter((d) => d.status === "Funded" && d.submittedDate !== null).length;
}

function avgDaysToFund(deals: FundingDeal[]): number {
  const funded = deals.filter((d) => d.status === "Funded" && d.submittedDate);
  if (funded.length === 0) return 0;
  return Math.round(funded.reduce((s, d) => s + d.daysOut, 0) / funded.length);
}

function oldestDeal(deals: FundingDeal[]): number {
  const pending = deals.filter((d) => d.status !== "Funded" && d.status !== "Chargeback");
  if (pending.length === 0) return 0;
  return Math.max(...pending.map((d) => d.daysOut));
}

function chargebackRiskDeals(deals: FundingDeal[], threshold: number): FundingDeal[] {
  return deals.filter((d) => d.chargebackRisk >= threshold).sort((a, b) => b.chargebackRisk - a.chargebackRisk);
}

function fundingVelocity(dailyCounts: number[]): number {
  if (dailyCounts.length === 0) return 0;
  return Math.round(dailyCounts.reduce((s, c) => s + c, 0) / dailyCounts.length);
}

function totalInQueue(deals: FundingDeal[]): number {
  return deals.filter((d) => d.status !== "Funded").length;
}

// ── GPU Tracker helpers ──
interface GpuRecord {
  month: string;
  manager: string;
  fiGpu: number;
  frontGpu: number;
  vsc: number;
  gap: number;
  paint: number;
  tireWheel: number;
  ancillary: number;
  dealCount: number;
}

const DEMO_GPU: GpuRecord[] = [
  { month: "Apr 2026", manager: "Sarah Mitchell", fiGpu: 1950, frontGpu: 1200, vsc: 680, gap: 420, paint: 310, tireWheel: 280, ancillary: 260, dealCount: 22 },
  { month: "Apr 2026", manager: "James Rodriguez", fiGpu: 1450, frontGpu: 1050, vsc: 520, gap: 350, paint: 220, tireWheel: 180, ancillary: 180, dealCount: 18 },
  { month: "Apr 2026", manager: "Ashley Chen", fiGpu: 2150, frontGpu: 1350, vsc: 750, gap: 480, paint: 350, tireWheel: 300, ancillary: 270, dealCount: 25 },
  { month: "Apr 2026", manager: "Marcus Thompson", fiGpu: 1180, frontGpu: 920, vsc: 420, gap: 280, paint: 180, tireWheel: 150, ancillary: 150, dealCount: 15 },
  { month: "Apr 2026", manager: "Rachel Kim", fiGpu: 1780, frontGpu: 1150, vsc: 620, gap: 400, paint: 280, tireWheel: 250, ancillary: 230, dealCount: 20 },
  { month: "Apr 2026", manager: "David Patel", fiGpu: 1320, frontGpu: 980, vsc: 470, gap: 310, paint: 200, tireWheel: 170, ancillary: 170, dealCount: 16 },
  { month: "Apr 2026", manager: "Lauren Williams", fiGpu: 1850, frontGpu: 1180, vsc: 650, gap: 410, paint: 290, tireWheel: 260, ancillary: 240, dealCount: 21 },
  { month: "Apr 2026", manager: "Chris Martinez", fiGpu: 1620, frontGpu: 1080, vsc: 580, gap: 370, paint: 250, tireWheel: 210, ancillary: 210, dealCount: 19 },
  // Prior month for trend comparisons
  { month: "Mar 2026", manager: "Sarah Mitchell", fiGpu: 1880, frontGpu: 1150, vsc: 650, gap: 400, paint: 300, tireWheel: 270, ancillary: 260, dealCount: 20 },
  { month: "Mar 2026", manager: "James Rodriguez", fiGpu: 1380, frontGpu: 1000, vsc: 500, gap: 330, paint: 210, tireWheel: 170, ancillary: 170, dealCount: 17 },
  { month: "Mar 2026", manager: "Ashley Chen", fiGpu: 2080, frontGpu: 1300, vsc: 720, gap: 460, paint: 340, tireWheel: 290, ancillary: 270, dealCount: 24 },
  { month: "Mar 2026", manager: "Marcus Thompson", fiGpu: 1120, frontGpu: 880, vsc: 400, gap: 260, paint: 170, tireWheel: 140, ancillary: 150, dealCount: 14 },
];

function combinedGpu(record: GpuRecord): number {
  return record.fiGpu + record.frontGpu;
}

function fiGpuAvg(records: GpuRecord[]): number {
  if (records.length === 0) return 0;
  return Math.round(records.reduce((s, r) => s + r.fiGpu, 0) / records.length);
}

function managerRanking(records: GpuRecord[]): { manager: string; fiGpu: number }[] {
  return records.map((r) => ({ manager: r.manager, fiGpu: r.fiGpu })).sort((a, b) => b.fiGpu - a.fiGpu);
}

function productLineBreakdown(record: GpuRecord): { product: string; amount: number }[] {
  return [
    { product: "VSC", amount: record.vsc },
    { product: "GAP", amount: record.gap },
    { product: "Paint Protection", amount: record.paint },
    { product: "Tire & Wheel", amount: record.tireWheel },
    { product: "Ancillary", amount: record.ancillary },
  ];
}

function gpuBucket(gpu: number): string {
  if (gpu < 500) return "$0-500";
  if (gpu < 1000) return "$500-1000";
  if (gpu < 1500) return "$1000-1500";
  if (gpu < 2000) return "$1500-2000";
  if (gpu < 2500) return "$2000-2500";
  return "$2500+";
}

function benchmarkComparison(fiGpu: number): { vsNational: number; vsTop25: number; vsTop10: number } {
  return {
    vsNational: fiGpu - 1286,
    vsTop25: fiGpu - 1750,
    vsTop10: fiGpu - 2150,
  };
}

function totalCombinedGross(records: GpuRecord[]): number {
  return records.reduce((s, r) => s + (r.fiGpu + r.frontGpu) * r.dealCount, 0);
}

function bestMonth(records: GpuRecord[]): string {
  const byMonth = new Map<string, number>();
  for (const r of records) {
    byMonth.set(r.month, (byMonth.get(r.month) || 0) + r.fiGpu);
  }
  let best = "";
  let bestVal = 0;
  for (const [month, val] of byMonth) {
    if (val > bestVal) { best = month; bestVal = val; }
  }
  return best;
}

function bestManager(records: GpuRecord[]): string {
  const ranked = managerRanking(records);
  return ranked.length > 0 ? ranked[0].manager : "";
}

function gpuTrend(current: number, prior: number): "up" | "down" | "flat" {
  if (current > prior) return "up";
  if (current < prior) return "down";
  return "flat";
}

// ═══════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════

describe("Contract Checklist — completion & readiness", () => {
  it("should calculate completion percentage correctly", () => {
    expect(completionPercent(DEMO_CHECKLIST)).toBe(60);
  });

  it("should return 100% for all-complete items", () => {
    const allComplete = DEMO_CHECKLIST.map((i) => ({ ...i, status: "complete" as const }));
    expect(completionPercent(allComplete)).toBe(100);
  });

  it("should return 0% for empty list", () => {
    expect(completionPercent([])).toBe(0);
  });

  it("should identify not ready to fund when items incomplete", () => {
    expect(isReadyToFund(DEMO_CHECKLIST)).toBe(false);
  });

  it("should identify ready to fund when all complete", () => {
    const allComplete = DEMO_CHECKLIST.map((i) => ({ ...i, status: "complete" as const }));
    expect(isReadyToFund(allComplete)).toBe(true);
  });

  it("should find all critical (required + incomplete) items", () => {
    const critical = criticalItems(DEMO_CHECKLIST);
    expect(critical.length).toBe(4); // Income Verification, Truth in Lending, Arbitration Sig, Proof of Income Stip
    expect(critical.every((i) => i.required && i.status !== "complete")).toBe(true);
  });

  it("should count items by status", () => {
    expect(countByStatus(DEMO_CHECKLIST, "complete")).toBe(12);
    expect(countByStatus(DEMO_CHECKLIST, "pending")).toBe(4);
    expect(countByStatus(DEMO_CHECKLIST, "missing")).toBe(4);
  });

  it("should calculate section completion for Identification Docs", () => {
    const result = sectionCompletion(DEMO_CHECKLIST, "Identification Docs");
    expect(result).toEqual({ complete: 2, total: 3 });
  });

  it("should calculate section completion for Credit Documents", () => {
    const result = sectionCompletion(DEMO_CHECKLIST, "Credit Documents");
    expect(result).toEqual({ complete: 2, total: 4 });
  });

  it("should calculate section completion for F&I Product Contracts", () => {
    const result = sectionCompletion(DEMO_CHECKLIST, "F&I Product Contracts");
    expect(result).toEqual({ complete: 3, total: 4 });
  });

  it("should estimate time to clear (5min pending + 15min missing)", () => {
    expect(estTimeToClear(5, 4)).toBe(85); // 25 + 60
  });

  it("should return 0 time when nothing to clear", () => {
    expect(estTimeToClear(0, 0)).toBe(0);
  });

  it("should assign red for < 70%", () => {
    expect(progressColor(55)).toBe("red");
    expect(progressColor(69)).toBe("red");
  });

  it("should assign yellow for 70-89%", () => {
    expect(progressColor(70)).toBe("yellow");
    expect(progressColor(89)).toBe("yellow");
  });

  it("should assign green for 90%+", () => {
    expect(progressColor(90)).toBe("green");
    expect(progressColor(100)).toBe("green");
  });

  it("should count required items", () => {
    expect(requiredItemCount(DEMO_CHECKLIST)).toBe(14);
  });

  it("should validate all 6 sections exist", () => {
    const sectionSet = new Set(DEMO_CHECKLIST.map((i) => i.section));
    SECTIONS.forEach((s) => expect(sectionSet.has(s)).toBe(true));
  });
});

describe("Report Card — weighted grades & GPA", () => {
  const sarah = DEMO_MANAGERS[0];
  const marcus = DEMO_MANAGERS[3];

  it("should calculate weighted score correctly", () => {
    // 92*0.35 + 88*0.25 + 95*0.20 + 80*0.10 + 90*0.10 = 32.2 + 22 + 19 + 8 + 9 = 90.2 → 90
    expect(weightedScore(sarah)).toBe(90);
  });

  it("should calculate weighted score for lower performer", () => {
    // 65*0.35 + 60*0.25 + 72*0.20 + 55*0.10 + 68*0.10 = 22.75 + 15 + 14.4 + 5.5 + 6.8 = 64.45 → 64
    expect(weightedScore(marcus)).toBe(64);
  });

  it("should map A- for score 90", () => {
    expect(letterGrade(90)).toBe("A-");
  });

  it("should map A+ for score 97+", () => {
    expect(letterGrade(97)).toBe("A+");
    expect(letterGrade(100)).toBe("A+");
  });

  it("should map B for score 83-86", () => {
    expect(letterGrade(83)).toBe("B");
    expect(letterGrade(86)).toBe("B");
  });

  it("should map D for score 63-66", () => {
    expect(letterGrade(64)).toBe("D");
  });

  it("should map F for score below 60", () => {
    expect(letterGrade(59)).toBe("F");
    expect(letterGrade(0)).toBe("F");
  });

  it("should return correct GPA values", () => {
    expect(gpa("A+")).toBe(4.0);
    expect(gpa("A")).toBe(4.0);
    expect(gpa("B+")).toBe(3.3);
    expect(gpa("C")).toBe(2.0);
    expect(gpa("F")).toBe(0.0);
  });

  it("should rank managers by weighted score descending", () => {
    const ranked = peerRanking(DEMO_MANAGERS);
    expect(ranked[0].manager).toBe("Ashley Chen");
    expect(ranked[ranked.length - 1].manager).toBe("Marcus Thompson");
  });

  it("should calculate team average for PVR", () => {
    const avg = teamAverage(DEMO_MANAGERS, "pvr");
    const expected = Math.round((92 + 78 + 95 + 65 + 85 + 70 + 88 + 82) / 8);
    expect(avg).toBe(expected);
  });

  it("should identify bottom 2 categories", () => {
    const bottom = bottomCategories(sarah, 2);
    // Sarah: pvr=92, pp=88, compliance=95, coaching=80, csat=90 → bottom 2: coaching(80), pp(88)
    expect(bottom).toContain("Coaching Adherence");
  });

  it("should produce 6-month trend as array of scores", () => {
    const sarahMonths: ManagerGrade[] = [
      { ...sarah, month: "Nov 2025", pvr: 85, productPenetration: 82, complianceScore: 90, coachingAdherence: 75, customerSatisfaction: 85 },
      { ...sarah, month: "Dec 2025" },
      { ...sarah, month: "Jan 2026" },
      { ...sarah, month: "Feb 2026" },
      { ...sarah, month: "Mar 2026" },
      sarah,
    ];
    const trend = sixMonthTrend(sarahMonths);
    expect(trend).toHaveLength(6);
    expect(trend[5]).toBe(weightedScore(sarah));
  });

  it("should handle A- GPA as 3.7", () => {
    expect(gpa("A-")).toBe(3.7);
  });
});

describe("Funding Queue — aging, filtering & KPIs", () => {
  it("should calculate aging days correctly", () => {
    expect(agingDays("2026-04-10", "2026-04-20")).toBe(10);
    expect(agingDays("2026-04-20", "2026-04-20")).toBe(0);
  });

  it("should filter by status Pending", () => {
    const pending = filterByStatus(DEMO_QUEUE, "Pending");
    expect(pending.length).toBe(2);
    expect(pending.every((d) => d.status === "Pending")).toBe(true);
  });

  it("should filter by status Funded", () => {
    const funded = filterByStatus(DEMO_QUEUE, "Funded");
    expect(funded.length).toBe(2);
  });

  it("should return all deals for status All", () => {
    expect(filterByStatus(DEMO_QUEUE, "All").length).toBe(10);
  });

  it("should filter by aging bucket 0-2 days", () => {
    const short = filterByAging(DEMO_QUEUE, "0-2");
    expect(short.every((d) => d.daysOut <= 2)).toBe(true);
  });

  it("should filter by aging bucket 3-5 days", () => {
    const mid = filterByAging(DEMO_QUEUE, "3-5");
    expect(mid.every((d) => d.daysOut >= 3 && d.daysOut <= 5)).toBe(true);
  });

  it("should filter by aging bucket 5+ days", () => {
    const old = filterByAging(DEMO_QUEUE, "5+");
    expect(old.every((d) => d.daysOut > 5)).toBe(true);
  });

  it("should calculate total $ pending (excludes Funded and Chargeback)", () => {
    const total = queueTotalPending(DEMO_QUEUE);
    // Pending: 22100+15800, Submitted: 28500+18900+27600, Approved: 35200+19200
    expect(total).toBe(22100 + 15800 + 28500 + 18900 + 27600 + 35200 + 19200);
  });

  it("should calculate avg days to fund for funded deals", () => {
    const avg = avgDaysToFund(DEMO_QUEUE);
    // Funded deals: Jennifer (5), Susan (6) → avg = 5.5 → 6
    expect(avg).toBe(6);
  });

  it("should find oldest deal in queue (non-funded, non-chargeback)", () => {
    expect(oldestDeal(DEMO_QUEUE)).toBe(17); // James Wilson, 17 days
  });

  it("should identify high chargeback risk deals", () => {
    const risky = chargebackRiskDeals(DEMO_QUEUE, 30);
    expect(risky.length).toBe(4); // Karen(90), James Wilson(65), Robert(45), David(30)
    expect(risky[0].chargebackRisk).toBe(90);
  });

  it("should calculate funding velocity average", () => {
    expect(fundingVelocity([3, 5, 2, 4, 6, 3, 5])).toBe(4);
  });

  it("should count total in queue (non-funded)", () => {
    expect(totalInQueue(DEMO_QUEUE)).toBe(8);
  });

  it("should handle empty queue gracefully", () => {
    expect(avgDaysToFund([])).toBe(0);
    expect(oldestDeal([])).toBe(0);
    expect(queueTotalPending([])).toBe(0);
  });
});

describe("GPU Tracker — calculations & benchmarks", () => {
  const sarah = DEMO_GPU[0];
  const ashleyApr = DEMO_GPU[2];
  const marcusApr = DEMO_GPU[3];
  const aprRecords = DEMO_GPU.filter((r) => r.month === "Apr 2026");

  it("should calculate combined GPU (FI + Front)", () => {
    expect(combinedGpu(sarah)).toBe(3150); // 1950 + 1200
  });

  it("should calculate F&I GPU average across managers", () => {
    const avg = fiGpuAvg(aprRecords);
    const expected = Math.round((1950 + 1450 + 2150 + 1180 + 1780 + 1320 + 1850 + 1620) / 8);
    expect(avg).toBe(expected);
  });

  it("should rank managers by F&I GPU descending", () => {
    const ranked = managerRanking(aprRecords);
    expect(ranked[0].manager).toBe("Ashley Chen");
    expect(ranked[0].fiGpu).toBe(2150);
    expect(ranked[ranked.length - 1].manager).toBe("Marcus Thompson");
  });

  it("should break down GPU by product line", () => {
    const breakdown = productLineBreakdown(sarah);
    expect(breakdown).toHaveLength(5);
    expect(breakdown[0]).toEqual({ product: "VSC", amount: 680 });
    expect(breakdown[1]).toEqual({ product: "GAP", amount: 420 });
  });

  it("should classify GPU into correct buckets", () => {
    expect(gpuBucket(450)).toBe("$0-500");
    expect(gpuBucket(500)).toBe("$500-1000");
    expect(gpuBucket(999)).toBe("$500-1000");
    expect(gpuBucket(1000)).toBe("$1000-1500");
    expect(gpuBucket(1500)).toBe("$1500-2000");
    expect(gpuBucket(2000)).toBe("$2000-2500");
    expect(gpuBucket(2500)).toBe("$2500+");
    expect(gpuBucket(3000)).toBe("$2500+");
  });

  it("should compare against national benchmarks", () => {
    const cmp = benchmarkComparison(1950);
    expect(cmp.vsNational).toBe(664);  // 1950 - 1286
    expect(cmp.vsTop25).toBe(200);     // 1950 - 1750
    expect(cmp.vsTop10).toBe(-200);    // 1950 - 2150
  });

  it("should compare below-average GPU against benchmarks", () => {
    const cmp = benchmarkComparison(1180);
    expect(cmp.vsNational).toBe(-106);
    expect(cmp.vsTop25).toBe(-570);
  });

  it("should calculate total combined gross", () => {
    const total = totalCombinedGross(aprRecords);
    // Sum of (fiGpu + frontGpu) * dealCount for each manager
    const expected = (3150 * 22) + (2500 * 18) + (3500 * 25) + (2100 * 15) + (2930 * 20) + (2300 * 16) + (3030 * 21) + (2700 * 19);
    expect(total).toBe(expected);
  });

  it("should find best month by total F&I GPU", () => {
    expect(bestMonth(DEMO_GPU)).toBe("Apr 2026");
  });

  it("should find best manager by F&I GPU", () => {
    expect(bestManager(aprRecords)).toBe("Ashley Chen");
  });

  it("should determine GPU trend direction", () => {
    expect(gpuTrend(1950, 1880)).toBe("up");
    expect(gpuTrend(1120, 1180)).toBe("down");
    expect(gpuTrend(1500, 1500)).toBe("flat");
  });

  it("should handle product line sum matching fiGpu", () => {
    const breakdown = productLineBreakdown(sarah);
    const sum = breakdown.reduce((s, p) => s + p.amount, 0);
    expect(sum).toBe(sarah.vsc + sarah.gap + sarah.paint + sarah.tireWheel + sarah.ancillary);
  });

  it("should handle empty records for fiGpuAvg", () => {
    expect(fiGpuAvg([])).toBe(0);
  });
});
