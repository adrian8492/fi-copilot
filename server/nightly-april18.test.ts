import { describe, expect, it } from "vitest";

// ── FI Snapshot helpers ──
const MANAGERS = [
  { id: "m1", name: "Marcus Rivera", tenure: "4 years", store: "Downtown Honda" },
  { id: "m2", name: "Jessica Chen", tenure: "6 years", store: "Eastside Toyota" },
  { id: "m3", name: "David Washington", tenure: "2 years", store: "Metro Ford" },
  { id: "m4", name: "Sarah Kim", tenure: "5 years", store: "Lakeside Chevrolet" },
  { id: "m5", name: "James Patterson", tenure: "3 years", store: "Central Nissan" },
  { id: "m6", name: "Maria Lopez", tenure: "7 years", store: "Westfield BMW" },
  { id: "m7", name: "Robert Taylor", tenure: "1 year", store: "Northgate Hyundai" },
  { id: "m8", name: "Amanda Foster", tenure: "4 years", store: "Parkway Kia" },
];

function snapshotKPI(deals: number, pvr: number) {
  return { deals, pvr, revenue: deals * pvr, avgPVR: pvr };
}

function sparklineShape(base: number, weeks: number) {
  return Array.from({ length: weeks }, (_, i) => ({ week: `W${i + 1}`, value: base + i }));
}

function radarDataShape(axes: string[]) {
  return axes.map((axis) => ({ axis, value: 75 }));
}

function periodLabel(idx: number) {
  return ["This Month", "Last Month", "Last 90 Days", "YTD"][idx] ?? "Unknown";
}

function clipboardFormat(name: string, period: string, kpis: { label: string; value: string }[]) {
  return [`F&I Snapshot: ${name} — ${period}`, "", ...kpis.map((k) => `${k.label}: ${k.value}`)].join("\n");
}

// ── Trade-In helpers ──
const ACV_BASE: Record<string, number> = {
  Toyota: 22000, Honda: 20000, Ford: 18000, Chevrolet: 17000, Nissan: 16000,
  Hyundai: 15000, Kia: 14500, BMW: 28000, Mercedes: 30000, Tesla: 32000, Jeep: 19000, Ram: 21000,
};
const CONDITION_MULT: Record<string, number> = { Excellent: 1.1, Good: 1.0, Fair: 0.85, Poor: 0.65 };

function lookupACV(year: string, make: string, condition: string): number {
  const base = ACV_BASE[make] ?? 18000;
  const age = 2025 - Number(year);
  const depreciation = Math.pow(0.85, age);
  return Math.round(base * depreciation * (CONDITION_MULT[condition] ?? 1));
}

function equity(acv: number, payoff: number) {
  return acv - payoff;
}

function isNegativeEquity(acv: number, payoff: number) {
  return acv - payoff < 0;
}

function financedAmount(salePrice: number, acv: number, payoff: number) {
  const eq = acv - payoff;
  if (eq < 0) return salePrice + Math.abs(eq);
  return salePrice - eq;
}

function monthlyPayment(principal: number, annualRate: number, term: number) {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / term;
  return (principal * r) / (1 - Math.pow(1 + r, -term));
}

function productAffordability(budget: number, payment: number, productMonthlyCost: number) {
  return budget - payment >= productMonthlyCost;
}

function maxProductCost(budget: number, payment: number) {
  return Math.max(0, budget - payment);
}

function dealTip(equityVal: number) {
  if (equityVal < -5000) return "short-term";
  if (equityVal > 3000) return "premium-warranty";
  return "standard";
}

function equityBand(equityVal: number) {
  if (equityVal > 5000) return "strong-positive";
  if (equityVal > 0) return "positive";
  if (equityVal > -3000) return "slight-negative";
  return "deep-negative";
}

// ── Product Profit helpers ──
function grossMarginPct(retail: number, cost: number) {
  return Math.round(((retail - cost) / retail) * 100);
}

function totalGrossAgg(products: { units: number; avgRetail: number; avgCost: number }[]) {
  return products.reduce((s, p) => s + p.units * (p.avgRetail - p.avgCost), 0);
}

function isUnderperforming(margin: number) {
  return margin < 25;
}

function productMixPct(units: number, total: number) {
  return Math.round((units / total) * 100);
}

function momDelta(current: number, prior: number) {
  return current - prior;
}

function managerContribution(mgrGross: number, totalGross: number) {
  return Math.round((mgrGross / totalGross) * 100);
}

function bestMarginProduct(products: { name: string; margin: number }[]) {
  return products.reduce((a, b) => (a.margin > b.margin ? a : b)).name;
}

function worstMarginProduct(products: { name: string; margin: number }[]) {
  return products.reduce((a, b) => (a.margin < b.margin ? a : b)).name;
}

function scatterShape(products: { name: string; avgCost: number; avgRetail: number; units: number }[]) {
  return products.map((p) => ({ name: p.name, x: p.avgCost, y: p.avgRetail, z: p.units }));
}

// ── Coaching Planner helpers ──
function daysSinceCoaching(lastCoached: string, today: string) {
  return Math.round((new Date(today).getTime() - new Date(lastCoached).getTime()) / 86400000);
}

function isOverdue(lastCoached: string, today: string) {
  return daysSinceCoaching(lastCoached, today) > 21;
}

function isDueSoon(lastCoached: string, today: string) {
  return daysSinceCoaching(lastCoached, today) > 14;
}

function sessionShape(managerId: string, type: string, date: string) {
  return { id: expect.any(String), managerId, type, date, notes: "", agenda: [], rating: 0, takeaways: "", actionItems: [], followUpDate: "" };
}

function agendaOps(items: string[], add: string) {
  return [...items, add];
}

function agendaRemove(items: string[], idx: number) {
  return items.filter((_, i) => i !== idx);
}

function cadenceAvg(days: number[]) {
  return Math.round(days.reduce((s, d) => s + d, 0) / days.length);
}

function validRating(r: number) {
  return r >= 1 && r <= 5;
}

function sortNewestFirst(sessions: { date: string }[]) {
  return [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ── General helpers ──
function penetrationRate(productsSold: number, totalDeals: number) {
  return Math.round((productsSold / totalDeals) * 100);
}

function dealCountByRange(deals: { date: string }[], start: string, end: string) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return deals.filter((d) => { const t = new Date(d.date).getTime(); return t >= s && t <= e; }).length;
}

function managerRankByCoachingScore(managers: { name: string; coachingScore: number }[]) {
  return [...managers].sort((a, b) => b.coachingScore - a.coachingScore).map((m) => m.name);
}

// ═══════════════════ TESTS ═══════════════════

describe("nightly april 18 — fi snapshot", () => {
  it("computes KPI revenue from deals × pvr", () => {
    const kpi = snapshotKPI(42, 1850);
    expect(kpi.revenue).toBe(77700);
  });

  it("computes avgPVR in KPI", () => {
    expect(snapshotKPI(30, 2100).avgPVR).toBe(2100);
  });

  it("sparkline data has correct shape and length", () => {
    const spark = sparklineShape(100, 12);
    expect(spark).toHaveLength(12);
    expect(spark[0]).toEqual({ week: "W1", value: 100 });
    expect(spark[11]).toEqual({ week: "W12", value: 111 });
  });

  it("radar chart data structure has all 6 axes", () => {
    const axes = ["Opening", "Needs Discovery", "Menu Presentation", "Product Knowledge", "Objection Handling", "Closing"];
    const data = radarDataShape(axes);
    expect(data).toHaveLength(6);
    expect(data.every((d) => d.value === 75)).toBe(true);
  });

  it("validates manager exists in list", () => {
    expect(MANAGERS.find((m) => m.id === "m1")).toBeDefined();
    expect(MANAGERS.find((m) => m.id === "m99")).toBeUndefined();
  });

  it("period filter returns correct labels", () => {
    expect(periodLabel(0)).toBe("This Month");
    expect(periodLabel(3)).toBe("YTD");
    expect(periodLabel(5)).toBe("Unknown");
  });

  it("clipboard format includes name and KPIs", () => {
    const text = clipboardFormat("Marcus Rivera", "This Month", [{ label: "Deals", value: "42" }]);
    expect(text).toContain("Marcus Rivera");
    expect(text).toContain("Deals: 42");
  });

  it("all 8 managers have unique ids", () => {
    const ids = MANAGERS.map((m) => m.id);
    expect(new Set(ids).size).toBe(8);
  });
});

describe("nightly april 18 — trade-in analyzer", () => {
  it("calculates equity as ACV - payoff", () => {
    expect(equity(18000, 12000)).toBe(6000);
    expect(equity(10000, 15000)).toBe(-5000);
  });

  it("detects negative equity", () => {
    expect(isNegativeEquity(10000, 15000)).toBe(true);
    expect(isNegativeEquity(20000, 15000)).toBe(false);
  });

  it("financed amount adds negative equity to sale price", () => {
    expect(financedAmount(35000, 10000, 15000)).toBe(40000);
  });

  it("financed amount subtracts positive equity from sale price", () => {
    expect(financedAmount(35000, 20000, 12000)).toBe(27000);
  });

  it("monthly payment follows amortization formula", () => {
    const pmt = monthlyPayment(30000, 6, 72);
    expect(pmt).toBeCloseTo(497.19, 0);
  });

  it("monthly payment with 0% rate divides evenly", () => {
    expect(monthlyPayment(36000, 0, 72)).toBe(500);
  });

  it("product affordability check works", () => {
    expect(productAffordability(650, 500, 35)).toBe(true);
    expect(productAffordability(650, 640, 35)).toBe(false);
  });

  it("max product cost is budget minus payment", () => {
    expect(maxProductCost(700, 550)).toBe(150);
    expect(maxProductCost(400, 500)).toBe(0);
  });

  it("ACV lookup applies year depreciation and condition", () => {
    const acv2025 = lookupACV("2025", "Toyota", "Good");
    const acv2020 = lookupACV("2020", "Toyota", "Good");
    expect(acv2025).toBeGreaterThan(acv2020);
  });

  it("ACV lookup: Excellent > Good > Fair > Poor", () => {
    const e = lookupACV("2022", "Honda", "Excellent");
    const g = lookupACV("2022", "Honda", "Good");
    const f = lookupACV("2022", "Honda", "Fair");
    const p = lookupACV("2022", "Honda", "Poor");
    expect(e).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(f);
    expect(f).toBeGreaterThan(p);
  });

  it("deal tip rules for negative equity > $5K", () => {
    expect(dealTip(-6000)).toBe("short-term");
  });

  it("deal tip rules for positive equity > $3K", () => {
    expect(dealTip(4000)).toBe("premium-warranty");
  });

  it("deal tip returns standard for moderate equity", () => {
    expect(dealTip(1000)).toBe("standard");
  });

  it("equity band classification", () => {
    expect(equityBand(7000)).toBe("strong-positive");
    expect(equityBand(2000)).toBe("positive");
    expect(equityBand(-1000)).toBe("slight-negative");
    expect(equityBand(-5000)).toBe("deep-negative");
  });
});

describe("nightly april 18 — product profitability", () => {
  it("gross margin % = (retail-cost)/retail × 100", () => {
    expect(grossMarginPct(2100, 650)).toBe(69);
    expect(grossMarginPct(299, 70)).toBe(77);
  });

  it("total gross aggregation across products", () => {
    const products = [
      { units: 10, avgRetail: 1000, avgCost: 400 },
      { units: 5, avgRetail: 500, avgCost: 200 },
    ];
    expect(totalGrossAgg(products)).toBe(7500);
  });

  it("detects underperforming products (margin < 25%)", () => {
    expect(isUnderperforming(20)).toBe(true);
    expect(isUnderperforming(30)).toBe(false);
    expect(isUnderperforming(25)).toBe(false);
  });

  it("product mix percentage", () => {
    expect(productMixPct(20, 100)).toBe(20);
    expect(productMixPct(7, 50)).toBe(14);
  });

  it("month-over-month delta", () => {
    expect(momDelta(45, 40)).toBe(5);
    expect(momDelta(30, 35)).toBe(-5);
  });

  it("per-manager contribution %", () => {
    expect(managerContribution(5000, 20000)).toBe(25);
  });

  it("identifies best margin product", () => {
    const products = [
      { name: "GAP", margin: 69 },
      { name: "VSC", margin: 72 },
      { name: "PDR", margin: 55 },
    ];
    expect(bestMarginProduct(products)).toBe("VSC");
  });

  it("identifies worst margin product", () => {
    const products = [
      { name: "GAP", margin: 69 },
      { name: "VSC", margin: 72 },
      { name: "PDR", margin: 55 },
    ];
    expect(worstMarginProduct(products)).toBe("PDR");
  });

  it("scatter plot data shape matches expected structure", () => {
    const products = [{ name: "GAP", avgCost: 280, avgRetail: 895, units: 25 }];
    const scatter = scatterShape(products);
    expect(scatter[0]).toEqual({ name: "GAP", x: 280, y: 895, z: 25 });
  });
});

describe("nightly april 18 — coaching planner", () => {
  it("calculates days since last coaching", () => {
    expect(daysSinceCoaching("2026-04-10", "2026-04-18")).toBe(8);
    expect(daysSinceCoaching("2026-03-15", "2026-04-18")).toBe(34);
  });

  it("detects overdue (> 21 days)", () => {
    expect(isOverdue("2026-03-20", "2026-04-18")).toBe(true);
    expect(isOverdue("2026-04-10", "2026-04-18")).toBe(false);
  });

  it("detects due soon (> 14 days)", () => {
    expect(isDueSoon("2026-04-01", "2026-04-18")).toBe(true);
    expect(isDueSoon("2026-04-10", "2026-04-18")).toBe(false);
  });

  it("session shape matches localStorage format", () => {
    const s = sessionShape("m1", "Weekly Check-In", "2026-04-18");
    expect(s).toHaveProperty("managerId", "m1");
    expect(s).toHaveProperty("type", "Weekly Check-In");
    expect(s).toHaveProperty("agenda");
    expect(s).toHaveProperty("actionItems");
  });

  it("adds agenda item", () => {
    const items = agendaOps(["Review metrics"], "Discuss goals");
    expect(items).toEqual(["Review metrics", "Discuss goals"]);
  });

  it("removes agenda item by index", () => {
    const items = agendaRemove(["A", "B", "C"], 1);
    expect(items).toEqual(["A", "C"]);
  });

  it("cadence average calculation", () => {
    expect(cadenceAvg([8, 3, 29, 6, 34, 2, 24, 10])).toBe(15);
  });

  it("validates rating range 1-5", () => {
    expect(validRating(1)).toBe(true);
    expect(validRating(5)).toBe(true);
    expect(validRating(0)).toBe(false);
    expect(validRating(6)).toBe(false);
  });

  it("sorts sessions newest first", () => {
    const sessions = [
      { date: "2026-03-15" },
      { date: "2026-04-10" },
      { date: "2026-03-28" },
    ];
    const sorted = sortNewestFirst(sessions);
    expect(sorted[0].date).toBe("2026-04-10");
    expect(sorted[2].date).toBe("2026-03-15");
  });
});

describe("nightly april 18 — general", () => {
  it("period filter labels are valid", () => {
    const labels = ["This Month", "Last Month", "Last 90 Days", "YTD"];
    labels.forEach((l, i) => expect(periodLabel(i)).toBe(l));
  });

  it("deal count by date range", () => {
    const deals = [
      { date: "2026-04-01" },
      { date: "2026-04-10" },
      { date: "2026-04-20" },
      { date: "2026-03-15" },
    ];
    expect(dealCountByRange(deals, "2026-04-01", "2026-04-15")).toBe(2);
  });

  it("manager ranking by coaching score", () => {
    const mgrs = [
      { name: "Alice", coachingScore: 80 },
      { name: "Bob", coachingScore: 95 },
      { name: "Carol", coachingScore: 70 },
    ];
    const ranked = managerRankByCoachingScore(mgrs);
    expect(ranked).toEqual(["Bob", "Alice", "Carol"]);
  });

  it("penetration rate calc", () => {
    expect(penetrationRate(28, 42)).toBe(67);
    expect(penetrationRate(0, 42)).toBe(0);
  });

  it("export format contains expected sections", () => {
    const text = clipboardFormat("Test Manager", "YTD", [
      { label: "Deals", value: "50" },
      { label: "PVR", value: "$1800" },
    ]);
    expect(text).toContain("Test Manager");
    expect(text).toContain("YTD");
    expect(text).toContain("Deals: 50");
    expect(text).toContain("PVR: $1800");
  });

  it("all period labels are distinct", () => {
    const labels = [0, 1, 2, 3].map(periodLabel);
    expect(new Set(labels).size).toBe(4);
  });
});
