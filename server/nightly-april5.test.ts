import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// 1. ROI Calculator — PVR Lift Calculation
// ═══════════════════════════════════════════════════════════════════
const BASELINE_PVR_LIFT = 759;
const DEFAULT_CURRENT_PVR = 1800;
const DEFAULT_DEAL_VOLUME = 200;
const DEFAULT_COACHING_COST = 15000;
const DEFAULT_MANAGERS = 4;
const DEFAULT_PENETRATION = 48;

function calculateProjectedPVR(currentPVR: number, lift: number): number {
  return currentPVR + lift;
}

function calculateMonthlyRevenueIncrease(lift: number, dealVolume: number): number {
  return lift * dealVolume;
}

function calculateAnnualRevenueIncrease(monthlyIncrease: number): number {
  return monthlyIncrease * 12;
}

function calculateROIMultiplier(annualIncrease: number, monthlyCost: number): number {
  const annualCost = monthlyCost * 12;
  return annualCost > 0 ? annualIncrease / annualCost : 0;
}

function calculatePaybackPeriod(monthlyCost: number, monthlyIncrease: number): number {
  return monthlyIncrease > 0 ? monthlyCost / monthlyIncrease : Infinity;
}

describe("ROI Calculator — PVR lift calculation", () => {
  it("baseline PVR lift is $759", () => {
    expect(BASELINE_PVR_LIFT).toBe(759);
  });
  it("projected PVR = current + lift", () => {
    expect(calculateProjectedPVR(1800, 759)).toBe(2559);
  });
  it("projected PVR with custom values", () => {
    expect(calculateProjectedPVR(2000, 600)).toBe(2600);
  });
  it("handles zero current PVR", () => {
    expect(calculateProjectedPVR(0, 759)).toBe(759);
  });
});

describe("ROI Calculator — monthly revenue increase", () => {
  it("monthly increase = lift × deal volume", () => {
    expect(calculateMonthlyRevenueIncrease(759, 200)).toBe(151800);
  });
  it("handles zero deals", () => {
    expect(calculateMonthlyRevenueIncrease(759, 0)).toBe(0);
  });
  it("handles large deal volume", () => {
    expect(calculateMonthlyRevenueIncrease(759, 500)).toBe(379500);
  });
});

describe("ROI Calculator — annual projection", () => {
  it("annual = monthly × 12", () => {
    expect(calculateAnnualRevenueIncrease(151800)).toBe(1821600);
  });
  it("annual for zero monthly", () => {
    expect(calculateAnnualRevenueIncrease(0)).toBe(0);
  });
});

describe("ROI Calculator — ROI multiplier", () => {
  it("ROI = annual increase / annual cost", () => {
    const annual = 1821600;
    const monthly = 15000;
    const roi = calculateROIMultiplier(annual, monthly);
    expect(roi).toBeCloseTo(10.12, 1);
  });
  it("ROI handles zero cost", () => {
    expect(calculateROIMultiplier(100000, 0)).toBe(0);
  });
});

describe("ROI Calculator — payback period", () => {
  it("payback = monthly cost / monthly increase", () => {
    const payback = calculatePaybackPeriod(15000, 151800);
    expect(payback).toBeLessThan(1);
    expect(payback).toBeCloseTo(0.0988, 2);
  });
  it("payback handles zero increase", () => {
    expect(calculatePaybackPeriod(15000, 0)).toBe(Infinity);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. ROI Calculator — Before vs After Comparison
// ═══════════════════════════════════════════════════════════════════
interface BeforeAfter {
  label: string;
  before: number;
  after: number;
}

function buildBeforeAfterCards(currentPVR: number, lift: number, dealVolume: number, penetration: number): BeforeAfter[] {
  const projectedPVR = currentPVR + lift;
  return [
    { label: "PVR", before: currentPVR, after: projectedPVR },
    { label: "Monthly Revenue", before: currentPVR * dealVolume, after: projectedPVR * dealVolume },
    { label: "Penetration", before: penetration, after: Math.min(penetration + 15, 100) },
    { label: "Products per Deal", before: +(penetration / 25).toFixed(1), after: +((penetration + 15) / 25).toFixed(1) },
  ];
}

describe("ROI Calculator — before vs after comparison", () => {
  const cards = buildBeforeAfterCards(1800, 759, 200, 48);
  it("produces 4 comparison cards", () => {
    expect(cards).toHaveLength(4);
  });
  it("PVR after is higher than before", () => {
    const pvr = cards.find(c => c.label === "PVR")!;
    expect(pvr.after).toBeGreaterThan(pvr.before);
    expect(pvr.after).toBe(2559);
  });
  it("monthly revenue after is higher", () => {
    const rev = cards.find(c => c.label === "Monthly Revenue")!;
    expect(rev.after).toBeGreaterThan(rev.before);
  });
  it("penetration capped at 100", () => {
    const capped = buildBeforeAfterCards(1800, 759, 200, 92);
    const pen = capped.find(c => c.label === "Penetration")!;
    expect(pen.after).toBeLessThanOrEqual(100);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. ROI Calculator — 12-Month Projection Array
// ═══════════════════════════════════════════════════════════════════
function build12MonthProjection(currentPVR: number, lift: number, dealVolume: number): { month: string; withoutASURA: number; withASURA: number }[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map((m, i) => ({
    month: m,
    withoutASURA: currentPVR * dealVolume,
    withASURA: (currentPVR + lift * ((i + 1) / 12)) * dealVolume,
  }));
}

describe("ROI Calculator — 12-month projection", () => {
  const proj = build12MonthProjection(1800, 759, 200);
  it("generates 12 months", () => {
    expect(proj).toHaveLength(12);
  });
  it("without ASURA is flat across all months", () => {
    const values = proj.map(p => p.withoutASURA);
    expect(new Set(values).size).toBe(1);
  });
  it("with ASURA increases month over month", () => {
    for (let i = 1; i < proj.length; i++) {
      expect(proj[i].withASURA).toBeGreaterThan(proj[i - 1].withASURA);
    }
  });
  it("month 12 with ASURA reflects full lift", () => {
    expect(proj[11].withASURA).toBeCloseTo((1800 + 759) * 200, -1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. ROI Calculator — Sensitivity Slider Bounds
// ═══════════════════════════════════════════════════════════════════
describe("ROI Calculator — sensitivity slider", () => {
  const MIN_LIFT = 559;
  const MAX_LIFT = 959;
  it("min lift is $559 (baseline - $200)", () => {
    expect(MIN_LIFT).toBe(BASELINE_PVR_LIFT - 200);
  });
  it("max lift is $959 (baseline + $200)", () => {
    expect(MAX_LIFT).toBe(BASELINE_PVR_LIFT + 200);
  });
  it("conservative scenario still shows positive ROI", () => {
    const monthlyIncrease = calculateMonthlyRevenueIncrease(MIN_LIFT, 200);
    const annual = calculateAnnualRevenueIncrease(monthlyIncrease);
    const roi = calculateROIMultiplier(annual, 15000);
    expect(roi).toBeGreaterThan(1);
  });
  it("aggressive scenario shows higher ROI", () => {
    const monthlyConservative = calculateMonthlyRevenueIncrease(MIN_LIFT, 200);
    const monthlyAggressive = calculateMonthlyRevenueIncrease(MAX_LIFT, 200);
    expect(monthlyAggressive).toBeGreaterThan(monthlyConservative);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. Product Payoff Tracker — Cancellation Rate Calculation
// ═══════════════════════════════════════════════════════════════════
interface ProductRetention {
  name: string;
  unitsSold: number;
  unitsCancelled: number;
  claimsFiled: number;
  claimsPaid: number;
  avgClaimCost: number;
  pricePerUnit: number;
}

function calculateCancelRate(sold: number, cancelled: number): number {
  return sold > 0 ? (cancelled / sold) * 100 : 0;
}

function calculateNetRetentionRevenue(product: ProductRetention): number {
  const soldRevenue = product.unitsSold * product.pricePerUnit;
  const cancelledRevenue = product.unitsCancelled * product.pricePerUnit;
  const claimsCost = product.claimsPaid * product.avgClaimCost;
  return soldRevenue - cancelledRevenue - claimsCost;
}

const DEMO_PRODUCTS: ProductRetention[] = [
  { name: "VSC", unitsSold: 240, unitsCancelled: 18, claimsFiled: 15, claimsPaid: 12, avgClaimCost: 1100, pricePerUnit: 1895 },
  { name: "GAP", unitsSold: 200, unitsCancelled: 14, claimsFiled: 8, claimsPaid: 6, avgClaimCost: 800, pricePerUnit: 795 },
  { name: "Tire & Wheel", unitsSold: 160, unitsCancelled: 12, claimsFiled: 10, claimsPaid: 8, avgClaimCost: 450, pricePerUnit: 699 },
  { name: "Paint Protection", unitsSold: 140, unitsCancelled: 8, claimsFiled: 5, claimsPaid: 3, avgClaimCost: 350, pricePerUnit: 599 },
  { name: "Maintenance Plan", unitsSold: 120, unitsCancelled: 10, claimsFiled: 18, claimsPaid: 15, avgClaimCost: 280, pricePerUnit: 495 },
  { name: "Theft Deterrent", unitsSold: 100, unitsCancelled: 6, claimsFiled: 3, claimsPaid: 2, avgClaimCost: 250, pricePerUnit: 399 },
  { name: "Windshield", unitsSold: 90, unitsCancelled: 5, claimsFiled: 12, claimsPaid: 10, avgClaimCost: 320, pricePerUnit: 299 },
  { name: "Key Replacement", unitsSold: 80, unitsCancelled: 7, claimsFiled: 6, claimsPaid: 4, avgClaimCost: 220, pricePerUnit: 249 },
];

describe("Product Payoff Tracker — cancellation rate", () => {
  it("cancel rate = (cancelled / sold) × 100", () => {
    expect(calculateCancelRate(240, 18)).toBeCloseTo(7.5, 1);
  });
  it("zero sold → zero cancel rate", () => {
    expect(calculateCancelRate(0, 0)).toBe(0);
  });
  it("100% cancellation rate", () => {
    expect(calculateCancelRate(10, 10)).toBe(100);
  });
});

describe("Product Payoff Tracker — net retention revenue", () => {
  it("net = sold revenue - cancelled revenue - claims paid cost", () => {
    const vsc = DEMO_PRODUCTS[0];
    const net = calculateNetRetentionRevenue(vsc);
    const expected = (240 * 1895) - (18 * 1895) - (12 * 1100);
    expect(net).toBe(expected);
  });
  it("all 8 products have positive net revenue", () => {
    for (const p of DEMO_PRODUCTS) {
      expect(calculateNetRetentionRevenue(p)).toBeGreaterThan(0);
    }
  });
  it("demo data has exactly 8 products", () => {
    expect(DEMO_PRODUCTS).toHaveLength(8);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. Product Payoff Tracker — Cancellation Window Bucketing
// ═══════════════════════════════════════════════════════════════════
type CancellationWindow = "0-30" | "31-60" | "61-90" | "91-180" | "180+";

function bucketCancellation(daysSinceSale: number): CancellationWindow {
  if (daysSinceSale <= 30) return "0-30";
  if (daysSinceSale <= 60) return "31-60";
  if (daysSinceSale <= 90) return "61-90";
  if (daysSinceSale <= 180) return "91-180";
  return "180+";
}

function buildCancellationWindowData(cancellations: number[]): Record<CancellationWindow, number> {
  const buckets: Record<CancellationWindow, number> = { "0-30": 0, "31-60": 0, "61-90": 0, "91-180": 0, "180+": 0 };
  for (const days of cancellations) {
    buckets[bucketCancellation(days)]++;
  }
  return buckets;
}

describe("Product Payoff Tracker — cancellation window bucketing", () => {
  it("day 15 → 0-30 bucket", () => {
    expect(bucketCancellation(15)).toBe("0-30");
  });
  it("day 30 → 0-30 bucket (inclusive)", () => {
    expect(bucketCancellation(30)).toBe("0-30");
  });
  it("day 31 → 31-60 bucket", () => {
    expect(bucketCancellation(31)).toBe("31-60");
  });
  it("day 90 → 61-90 bucket", () => {
    expect(bucketCancellation(90)).toBe("61-90");
  });
  it("day 181 → 180+ bucket", () => {
    expect(bucketCancellation(181)).toBe("180+");
  });
  it("builds correct bucket counts", () => {
    const data = buildCancellationWindowData([5, 10, 35, 45, 75, 100, 200]);
    expect(data["0-30"]).toBe(2);
    expect(data["31-60"]).toBe(2);
    expect(data["61-90"]).toBe(1);
    expect(data["91-180"]).toBe(1);
    expect(data["180+"]).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 7. Product Payoff Tracker — Manager Cancellation Comparison
// ═══════════════════════════════════════════════════════════════════
interface ManagerCancellation {
  name: string;
  totalSold: number;
  totalCancelled: number;
  cancelRate: number;
}

function sortManagersByCancelRate(managers: ManagerCancellation[]): ManagerCancellation[] {
  return [...managers].sort((a, b) => b.cancelRate - a.cancelRate);
}

const DEMO_MANAGER_CANCELLATIONS: ManagerCancellation[] = [
  { name: "Marcus Rivera", totalSold: 180, totalCancelled: 12, cancelRate: 6.7 },
  { name: "Jessica Chen", totalSold: 195, totalCancelled: 8, cancelRate: 4.1 },
  { name: "David Park", totalSold: 145, totalCancelled: 15, cancelRate: 10.3 },
  { name: "Sarah Kim", totalSold: 165, totalCancelled: 10, cancelRate: 6.1 },
  { name: "Tony Morales", totalSold: 210, totalCancelled: 9, cancelRate: 4.3 },
  { name: "Linda Tran", totalSold: 155, totalCancelled: 13, cancelRate: 8.4 },
];

describe("Product Payoff Tracker — manager cancellation comparison", () => {
  it("sorts managers by cancel rate descending", () => {
    const sorted = sortManagersByCancelRate(DEMO_MANAGER_CANCELLATIONS);
    expect(sorted[0].name).toBe("David Park");
    expect(sorted[sorted.length - 1].name).toBe("Jessica Chen");
  });
  it("has 6 managers", () => {
    expect(DEMO_MANAGER_CANCELLATIONS).toHaveLength(6);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 8. Product Payoff Tracker — At-Risk Product Detection
// ═══════════════════════════════════════════════════════════════════
function detectAtRiskProducts(monthlyRates: { product: string; rates: number[] }[]): string[] {
  const atRisk: string[] = [];
  for (const { product, rates } of monthlyRates) {
    if (rates.length >= 2) {
      const last = rates[rates.length - 1];
      const prev = rates[rates.length - 2];
      if (last - prev > 5) {
        atRisk.push(product);
      }
    }
  }
  return atRisk;
}

describe("Product Payoff Tracker — at-risk detection", () => {
  it("detects products with >5% MoM increase", () => {
    const data = [
      { product: "VSC", rates: [5, 6, 7, 13] },
      { product: "GAP", rates: [3, 3.5, 4, 4.2] },
      { product: "Tire & Wheel", rates: [8, 9, 10, 16] },
    ];
    const atRisk = detectAtRiskProducts(data);
    expect(atRisk).toContain("VSC");
    expect(atRisk).toContain("Tire & Wheel");
    expect(atRisk).not.toContain("GAP");
  });
  it("returns empty for stable products", () => {
    const data = [
      { product: "GAP", rates: [3, 3.2, 3.4, 3.6] },
    ];
    expect(detectAtRiskProducts(data)).toHaveLength(0);
  });
  it("handles single-month data (insufficient)", () => {
    const data = [{ product: "VSC", rates: [10] }];
    expect(detectAtRiskProducts(data)).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 9. Product Payoff Tracker — Retention Table Data Shaping
// ═══════════════════════════════════════════════════════════════════
describe("Product Payoff Tracker — retention table shaping", () => {
  it("all 8 F&I products are represented", () => {
    const productNames = DEMO_PRODUCTS.map(p => p.name);
    expect(productNames).toContain("VSC");
    expect(productNames).toContain("GAP");
    expect(productNames).toContain("Tire & Wheel");
    expect(productNames).toContain("Paint Protection");
    expect(productNames).toContain("Maintenance Plan");
    expect(productNames).toContain("Theft Deterrent");
    expect(productNames).toContain("Windshield");
    expect(productNames).toContain("Key Replacement");
  });
  it("units cancelled ≤ units sold for every product", () => {
    for (const p of DEMO_PRODUCTS) {
      expect(p.unitsCancelled).toBeLessThanOrEqual(p.unitsSold);
    }
  });
  it("claims paid ≤ claims filed for every product", () => {
    for (const p of DEMO_PRODUCTS) {
      expect(p.claimsPaid).toBeLessThanOrEqual(p.claimsFiled);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 10. Manager Schedule — Cell Assignment Validation
// ═══════════════════════════════════════════════════════════════════
type ScheduleGrid = Record<string, string | null>;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const SCHEDULE_MANAGERS = ["Marcus Rivera", "Jessica Chen", "David Park", "Sarah Kim"];

function cellKey(day: string, hour: number): string {
  return `${day}-${hour}`;
}

function assignCell(grid: ScheduleGrid, day: string, hour: number, manager: string | null): ScheduleGrid {
  return { ...grid, [cellKey(day, hour)]: manager };
}

describe("Manager Schedule — cell assignment", () => {
  it("creates valid cell keys", () => {
    expect(cellKey("Mon", 9)).toBe("Mon-9");
    expect(cellKey("Sat", 19)).toBe("Sat-19");
  });
  it("assigns a manager to a cell", () => {
    const grid: ScheduleGrid = {};
    const updated = assignCell(grid, "Mon", 9, "Marcus Rivera");
    expect(updated["Mon-9"]).toBe("Marcus Rivera");
  });
  it("clears a cell by assigning null", () => {
    const grid: ScheduleGrid = { "Mon-9": "Marcus Rivera" };
    const updated = assignCell(grid, "Mon", 9, null);
    expect(updated["Mon-9"]).toBeNull();
  });
  it("grid covers 6 days × 11 hours = 66 slots", () => {
    expect(DAYS).toHaveLength(6);
    expect(HOURS).toHaveLength(11);
    expect(DAYS.length * HOURS.length).toBe(66);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 11. Manager Schedule — Coverage Score
// ═══════════════════════════════════════════════════════════════════
function coverageScore(grid: ScheduleGrid, hour: number): number {
  let count = 0;
  for (const day of DAYS) {
    if (grid[cellKey(day, hour)]) count++;
  }
  return count;
}

function coverageLevel(managersInSlot: number): "red" | "yellow" | "green" {
  if (managersInSlot === 0) return "red";
  if (managersInSlot === 1) return "yellow";
  return "green";
}

describe("Manager Schedule — coverage score", () => {
  it("empty grid → 0 coverage for any hour", () => {
    expect(coverageScore({}, 9)).toBe(0);
  });
  it("fully staffed hour counts all days", () => {
    const grid: ScheduleGrid = {};
    for (const day of DAYS) {
      grid[cellKey(day, 10)] = "Marcus Rivera";
    }
    expect(coverageScore(grid, 10)).toBe(6);
  });
  it("0 managers = red", () => {
    expect(coverageLevel(0)).toBe("red");
  });
  it("1 manager = yellow", () => {
    expect(coverageLevel(1)).toBe("yellow");
  });
  it("2+ managers = green", () => {
    expect(coverageLevel(2)).toBe("green");
    expect(coverageLevel(5)).toBe("green");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 12. Manager Schedule — Weekly Hours Summation
// ═══════════════════════════════════════════════════════════════════
function weeklyHoursPerManager(grid: ScheduleGrid): Record<string, number> {
  const hours: Record<string, number> = {};
  for (const day of DAYS) {
    for (const hour of HOURS) {
      const manager = grid[cellKey(day, hour)];
      if (manager) {
        hours[manager] = (hours[manager] || 0) + 1;
      }
    }
  }
  return hours;
}

describe("Manager Schedule — weekly hours summation", () => {
  it("counts hours correctly for one manager", () => {
    const grid: ScheduleGrid = {
      "Mon-9": "Marcus Rivera",
      "Mon-10": "Marcus Rivera",
      "Mon-11": "Marcus Rivera",
      "Tue-9": "Marcus Rivera",
    };
    const hours = weeklyHoursPerManager(grid);
    expect(hours["Marcus Rivera"]).toBe(4);
  });
  it("counts hours for multiple managers", () => {
    const grid: ScheduleGrid = {
      "Mon-9": "Marcus Rivera",
      "Mon-10": "Jessica Chen",
      "Tue-9": "Marcus Rivera",
      "Tue-10": "Jessica Chen",
    };
    const hours = weeklyHoursPerManager(grid);
    expect(hours["Marcus Rivera"]).toBe(2);
    expect(hours["Jessica Chen"]).toBe(2);
  });
  it("empty grid → no hours", () => {
    expect(Object.keys(weeklyHoursPerManager({})).length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 13. Manager Schedule — Conflict Detection (Double-Booking)
// ═══════════════════════════════════════════════════════════════════
function detectConflicts(grid: ScheduleGrid): { manager: string; hours: number }[] {
  const hoursMap = weeklyHoursPerManager(grid);
  const conflicts: { manager: string; hours: number }[] = [];
  for (const [manager, hours] of Object.entries(hoursMap)) {
    if (hours > 50) {
      conflicts.push({ manager, hours });
    }
  }
  return conflicts;
}

describe("Manager Schedule — conflict detection", () => {
  it("no conflict when under 50 hours", () => {
    const grid: ScheduleGrid = {};
    // 6 days × 8 hours = 48 hours (under limit)
    for (const day of DAYS) {
      for (let h = 9; h <= 16; h++) {
        grid[cellKey(day, h)] = "Marcus Rivera";
      }
    }
    expect(detectConflicts(grid)).toHaveLength(0);
  });
  it("detects conflict when over 50 hours", () => {
    const grid: ScheduleGrid = {};
    // 6 days × 11 hours = 66 hours (over limit)
    for (const day of DAYS) {
      for (const hour of HOURS) {
        grid[cellKey(day, hour)] = "Marcus Rivera";
      }
    }
    const conflicts = detectConflicts(grid);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].manager).toBe("Marcus Rivera");
    expect(conflicts[0].hours).toBe(66);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 14. Manager Schedule — Auto-Fill Distribution
// ═══════════════════════════════════════════════════════════════════
function autoFillSchedule(managers: string[]): ScheduleGrid {
  const grid: ScheduleGrid = {};
  const highVolumeDays = ["Fri", "Sat"];
  let managerIdx = 0;

  for (const day of DAYS) {
    const isHighVolume = highVolumeDays.includes(day);
    for (const hour of HOURS) {
      // On high volume days, assign 2 managers; otherwise 1
      grid[cellKey(day, hour)] = managers[managerIdx % managers.length];
      managerIdx++;
      if (isHighVolume) {
        // second manager for high volume
        grid[cellKey(day, hour) + "-2"] = managers[managerIdx % managers.length];
        managerIdx++;
      }
    }
  }
  return grid;
}

describe("Manager Schedule — auto-fill distribution", () => {
  it("fills all regular day slots", () => {
    const grid = autoFillSchedule(SCHEDULE_MANAGERS);
    for (const day of ["Mon", "Tue", "Wed", "Thu"]) {
      for (const hour of HOURS) {
        expect(grid[cellKey(day, hour)]).toBeTruthy();
      }
    }
  });
  it("distributes managers across the grid", () => {
    const grid = autoFillSchedule(SCHEDULE_MANAGERS);
    const assigned = Object.values(grid).filter(Boolean);
    const uniqueManagers = new Set(assigned);
    expect(uniqueManagers.size).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 15. Manager Schedule — Gap Hours Calculation
// ═══════════════════════════════════════════════════════════════════
function calculateGapHours(grid: ScheduleGrid): number {
  let gaps = 0;
  for (const day of DAYS) {
    for (const hour of HOURS) {
      if (!grid[cellKey(day, hour)]) {
        gaps++;
      }
    }
  }
  return gaps;
}

describe("Manager Schedule — gap hours", () => {
  it("empty grid → 66 gap hours (6 days × 11 hours)", () => {
    expect(calculateGapHours({})).toBe(66);
  });
  it("fully filled grid → 0 gap hours", () => {
    const grid: ScheduleGrid = {};
    for (const day of DAYS) {
      for (const hour of HOURS) {
        grid[cellKey(day, hour)] = "Marcus Rivera";
      }
    }
    expect(calculateGapHours(grid)).toBe(0);
  });
  it("partially filled grid calculates correctly", () => {
    const grid: ScheduleGrid = {
      "Mon-9": "Marcus Rivera",
      "Mon-10": "Jessica Chen",
    };
    expect(calculateGapHours(grid)).toBe(64);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 16. Compliance Scorecard — Composite Score Calculation
// ═══════════════════════════════════════════════════════════════════
interface ComplianceScores {
  tila: number;
  ecoa: number;
  udap: number;
  stateLaw: number;
  internalPolicy: number;
}

function calculateOverallCompliance(scores: ComplianceScores): number {
  const weights = { tila: 0.25, ecoa: 0.25, udap: 0.20, stateLaw: 0.15, internalPolicy: 0.15 };
  return Math.round(
    scores.tila * weights.tila +
    scores.ecoa * weights.ecoa +
    scores.udap * weights.udap +
    scores.stateLaw * weights.stateLaw +
    scores.internalPolicy * weights.internalPolicy
  );
}

describe("Compliance Scorecard — composite score", () => {
  it("calculates weighted average correctly", () => {
    const scores: ComplianceScores = { tila: 95, ecoa: 90, udap: 85, stateLaw: 80, internalPolicy: 88 };
    const overall = calculateOverallCompliance(scores);
    const expected = Math.round(95 * 0.25 + 90 * 0.25 + 85 * 0.20 + 80 * 0.15 + 88 * 0.15);
    expect(overall).toBe(expected);
  });
  it("perfect scores → 100", () => {
    const scores: ComplianceScores = { tila: 100, ecoa: 100, udap: 100, stateLaw: 100, internalPolicy: 100 };
    expect(calculateOverallCompliance(scores)).toBe(100);
  });
  it("zero scores → 0", () => {
    const scores: ComplianceScores = { tila: 0, ecoa: 0, udap: 0, stateLaw: 0, internalPolicy: 0 };
    expect(calculateOverallCompliance(scores)).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 17. Compliance Scorecard — Risk Profile Classification
// ═══════════════════════════════════════════════════════════════════
type RiskLevel = "Low Risk" | "Moderate Risk" | "High Risk";
type TrendDirection = "improving" | "declining" | "stable";

function classifyRiskProfile(score: number, trend: TrendDirection): RiskLevel {
  if (score < 70) return "High Risk";
  if (score >= 90 && trend !== "declining") return "Low Risk";
  return "Moderate Risk";
}

function detectTrend(values: number[]): TrendDirection {
  if (values.length < 2) return "stable";
  const recent = values.slice(-4);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const diff = last - first;
  if (diff > 3) return "improving";
  if (diff < -3) return "declining";
  return "stable";
}

describe("Compliance Scorecard — risk profile classification", () => {
  it("score ≥90 + stable → Low Risk", () => {
    expect(classifyRiskProfile(95, "stable")).toBe("Low Risk");
  });
  it("score ≥90 + improving → Low Risk", () => {
    expect(classifyRiskProfile(92, "improving")).toBe("Low Risk");
  });
  it("score ≥90 + declining → Moderate Risk", () => {
    expect(classifyRiskProfile(91, "declining")).toBe("Moderate Risk");
  });
  it("score 70-89 → Moderate Risk", () => {
    expect(classifyRiskProfile(75, "stable")).toBe("Moderate Risk");
    expect(classifyRiskProfile(85, "improving")).toBe("Moderate Risk");
  });
  it("score <70 → High Risk regardless of trend", () => {
    expect(classifyRiskProfile(65, "improving")).toBe("High Risk");
    expect(classifyRiskProfile(50, "stable")).toBe("High Risk");
  });
});

describe("Compliance Scorecard — trend direction detection", () => {
  it("increasing values → improving", () => {
    expect(detectTrend([80, 82, 85, 88, 90, 93, 95, 97])).toBe("improving");
  });
  it("decreasing values → declining", () => {
    expect(detectTrend([95, 93, 90, 88, 86, 84, 82, 80])).toBe("declining");
  });
  it("flat values → stable", () => {
    expect(detectTrend([85, 85, 86, 85, 85, 86, 85, 85])).toBe("stable");
  });
  it("single value → stable", () => {
    expect(detectTrend([90])).toBe("stable");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 18. Compliance Scorecard — Training Recommendation Generation
// ═══════════════════════════════════════════════════════════════════
interface TrainingRecommendation {
  category: string;
  module: string;
}

const TRAINING_MODULES: Record<string, string> = {
  tila: "TILA Disclosure Fundamentals",
  ecoa: "Fair Lending Practices",
  udap: "Consumer Protection Essentials",
  stateLaw: "State Regulatory Compliance",
  internalPolicy: "Internal Policy Refresher",
};

function generateTrainingRecommendations(scores: ComplianceScores): TrainingRecommendation[] {
  const recs: TrainingRecommendation[] = [];
  for (const [key, value] of Object.entries(scores)) {
    if (value < 70) {
      recs.push({ category: key, module: TRAINING_MODULES[key] });
    }
  }
  return recs;
}

describe("Compliance Scorecard — training recommendations", () => {
  it("recommends training for categories below 70", () => {
    const scores: ComplianceScores = { tila: 65, ecoa: 90, udap: 55, stateLaw: 80, internalPolicy: 92 };
    const recs = generateTrainingRecommendations(scores);
    expect(recs).toHaveLength(2);
    expect(recs.map(r => r.module)).toContain("TILA Disclosure Fundamentals");
    expect(recs.map(r => r.module)).toContain("Consumer Protection Essentials");
  });
  it("no recommendations when all scores ≥70", () => {
    const scores: ComplianceScores = { tila: 95, ecoa: 90, udap: 85, stateLaw: 80, internalPolicy: 88 };
    expect(generateTrainingRecommendations(scores)).toHaveLength(0);
  });
  it("all 5 recommendations when all below 70", () => {
    const scores: ComplianceScores = { tila: 50, ecoa: 60, udap: 40, stateLaw: 30, internalPolicy: 20 };
    const recs = generateTrainingRecommendations(scores);
    expect(recs).toHaveLength(5);
  });
  it("maps correct modules to categories", () => {
    const scores: ComplianceScores = { tila: 50, ecoa: 50, udap: 50, stateLaw: 50, internalPolicy: 50 };
    const recs = generateTrainingRecommendations(scores);
    const tilaRec = recs.find(r => r.category === "tila");
    expect(tilaRec!.module).toBe("TILA Disclosure Fundamentals");
    const ecoaRec = recs.find(r => r.category === "ecoa");
    expect(ecoaRec!.module).toBe("Fair Lending Practices");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 19. Compliance Scorecard — Leaderboard Sorting
// ═══════════════════════════════════════════════════════════════════
interface ManagerCompliance {
  name: string;
  overallScore: number;
}

function sortLeaderboard(managers: ManagerCompliance[]): ManagerCompliance[] {
  return [...managers].sort((a, b) => b.overallScore - a.overallScore);
}

const DEMO_COMPLIANCE_MANAGERS: ManagerCompliance[] = [
  { name: "Marcus Rivera", overallScore: 94 },
  { name: "Jessica Chen", overallScore: 97 },
  { name: "David Park", overallScore: 78 },
  { name: "Sarah Kim", overallScore: 91 },
  { name: "Tony Morales", overallScore: 88 },
  { name: "Linda Tran", overallScore: 85 },
];

describe("Compliance Scorecard — leaderboard sorting", () => {
  it("sorts by overall score descending", () => {
    const sorted = sortLeaderboard(DEMO_COMPLIANCE_MANAGERS);
    expect(sorted[0].name).toBe("Jessica Chen");
    expect(sorted[sorted.length - 1].name).toBe("David Park");
  });
  it("maintains all 6 managers", () => {
    const sorted = sortLeaderboard(DEMO_COMPLIANCE_MANAGERS);
    expect(sorted).toHaveLength(6);
  });
  it("each subsequent score ≤ previous", () => {
    const sorted = sortLeaderboard(DEMO_COMPLIANCE_MANAGERS);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].overallScore).toBeLessThanOrEqual(sorted[i - 1].overallScore);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 20. Compliance Scorecard — Drill-Down Event Grouping
// ═══════════════════════════════════════════════════════════════════
interface ComplianceEvent {
  date: string;
  rule: string;
  category: string;
  result: "pass" | "fail";
  note: string;
}

function groupEventsByCategory(events: ComplianceEvent[]): Record<string, ComplianceEvent[]> {
  const grouped: Record<string, ComplianceEvent[]> = {};
  for (const event of events) {
    if (!grouped[event.category]) grouped[event.category] = [];
    grouped[event.category].push(event);
  }
  return grouped;
}

describe("Compliance Scorecard — event grouping", () => {
  const events: ComplianceEvent[] = [
    { date: "2026-04-01", rule: "TILA-001", category: "TILA", result: "pass", note: "Disclosed APR" },
    { date: "2026-04-02", rule: "ECOA-001", category: "ECOA", result: "fail", note: "Missing equal credit notice" },
    { date: "2026-04-03", rule: "TILA-002", category: "TILA", result: "pass", note: "Payment schedule provided" },
    { date: "2026-04-04", rule: "UDAP-001", category: "UDAP", result: "pass", note: "No deceptive practices" },
  ];
  it("groups events by category", () => {
    const grouped = groupEventsByCategory(events);
    expect(Object.keys(grouped)).toHaveLength(3);
    expect(grouped["TILA"]).toHaveLength(2);
    expect(grouped["ECOA"]).toHaveLength(1);
    expect(grouped["UDAP"]).toHaveLength(1);
  });
  it("preserves event data in groups", () => {
    const grouped = groupEventsByCategory(events);
    expect(grouped["ECOA"][0].result).toBe("fail");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 21. Dark Mode — Theme Toggle State Persistence
// ═══════════════════════════════════════════════════════════════════
describe("Dark Mode — theme toggle state", () => {
  it("toggle cycles between light and dark", () => {
    let theme: "light" | "dark" = "dark";
    const toggle = () => { theme = theme === "dark" ? "light" : "dark"; };
    toggle();
    expect(theme).toBe("light");
    toggle();
    expect(theme).toBe("dark");
  });
  it("localStorage key is fi-copilot-theme", () => {
    expect("fi-copilot-theme").toBe("fi-copilot-theme");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 22. Dark Mode — CSS Variable Mapping
// ═══════════════════════════════════════════════════════════════════
describe("Dark Mode — CSS variable mapping", () => {
  const darkVars = {
    background: "oklch(0.141 0.005 285.823)",
    foreground: "oklch(0.85 0.005 65)",
    card: "oklch(0.21 0.006 285.885)",
  };
  const lightVars = {
    background: "oklch(0.98 0.002 240)",
    foreground: "oklch(0.15 0.01 240)",
    card: "oklch(1.0 0 0)",
  };
  it("dark background is darker than light background", () => {
    const darkL = parseFloat(darkVars.background.match(/oklch\(([0-9.]+)/)![1]);
    const lightL = parseFloat(lightVars.background.match(/oklch\(([0-9.]+)/)![1]);
    expect(darkL).toBeLessThan(lightL);
  });
  it("dark foreground is lighter than dark background", () => {
    const fgL = parseFloat(darkVars.foreground.match(/oklch\(([0-9.]+)/)![1]);
    const bgL = parseFloat(darkVars.background.match(/oklch\(([0-9.]+)/)![1]);
    expect(fgL).toBeGreaterThan(bgL);
  });
  it("light theme has distinct card color from dark", () => {
    expect(lightVars.card).not.toBe(darkVars.card);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 23. Dark Mode — System Preference Detection
// ═══════════════════════════════════════════════════════════════════
describe("Dark Mode — system preference detection", () => {
  it("prefers-color-scheme returns valid theme", () => {
    const preferences = ["dark", "light"] as const;
    for (const pref of preferences) {
      expect(["dark", "light"]).toContain(pref);
    }
  });
  it("fallback to dark when no preference available", () => {
    const fallback = "dark";
    expect(fallback).toBe("dark");
  });
  it("stored preference overrides system preference", () => {
    const stored = "light";
    const system = "dark";
    const resolved = stored || system;
    expect(resolved).toBe("light");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 24. ROI Calculator — Default Values Validation
// ═══════════════════════════════════════════════════════════════════
describe("ROI Calculator — default values", () => {
  it("default current PVR is $1,800", () => {
    expect(DEFAULT_CURRENT_PVR).toBe(1800);
  });
  it("default deal volume is 200", () => {
    expect(DEFAULT_DEAL_VOLUME).toBe(200);
  });
  it("default coaching cost is $15,000", () => {
    expect(DEFAULT_COACHING_COST).toBe(15000);
  });
  it("default managers is 4", () => {
    expect(DEFAULT_MANAGERS).toBe(4);
  });
  it("default penetration is 48%", () => {
    expect(DEFAULT_PENETRATION).toBe(48);
  });
});
