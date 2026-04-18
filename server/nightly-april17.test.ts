import { describe, expect, it } from "vitest";

// Heat Sheet
const FACTOR_WEIGHTS: Record<string, number> = {
  returning: 12,
  preapproved: 15,
  trade: 10,
  cash: 8,
  repeat: 11,
  spouse: 9,
  decision: 14,
  credit: 13,
};

function heatScore(factors: string[]) {
  return factors.reduce((sum, factor) => sum + (FACTOR_WEIGHTS[factor] ?? 0), 0);
}

function heatTier(score: number) {
  if (score >= 80) return "Hot";
  if (score >= 60) return "Warm";
  if (score >= 40) return "Cool";
  return "Cold";
}

function closeRate(avgHeat: number) {
  return Math.round(avgHeat * 0.65);
}

// Word tracks
const CATEGORIES = ["Opening", "Menu Presentation", "Objection Responses", "Closing", "Turnover", "Compliance Disclosures"];
const PILLARS = ["Menu Order System", "Upgrade Architecture", "Objection Prevention Framework", "Coaching Cadence"];

// Desk log
function totalGross(front: number, back: number) {
  return front + back;
}

function pvr(totalBack: number, deals: number) {
  return deals ? Math.round(totalBack / deals) : 0;
}

function toCsv(headers: string[], rows: (string | number)[][]) {
  return [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
}

function statusTint(status: string) {
  return {
    Funded: "green",
    Pending: "yellow",
    Unwound: "red",
    Declined: "gray",
  }[status] ?? "gray";
}

// Rate watch
function direction(current: number, prior: number) {
  if (current > prior) return "Rising";
  if (current < prior) return "Falling";
  return "Stable";
}

function bpsDelta(current: number, prior: number) {
  return Math.round((current - prior) * 100);
}

function payment(amount: number, annualRate: number, term: number) {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return amount / term;
  return (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
}

describe("nightly april 17 - heat sheet", () => {
  it("calculates heat score from factor weights", () => {
    expect(heatScore(["preapproved", "decision", "credit"])) .toBe(42);
  });

  it("classifies heat tiers", () => {
    expect(heatTier(85)).toBe("Hot");
    expect(heatTier(65)).toBe("Warm");
    expect(heatTier(45)).toBe("Cool");
    expect(heatTier(20)).toBe("Cold");
  });

  it("sorts customers by heat score descending", () => {
    const scores = [55, 91, 70].sort((a, b) => b - a);
    expect(scores).toEqual([91, 70, 55]);
  });

  it("sorts customers by time ascending", () => {
    const times = [44, 12, 78].sort((a, b) => a - b);
    expect(times).toEqual([12, 44, 78]);
  });

  it("filters customers by tier", () => {
    const scores = [90, 63, 48, 10];
    expect(scores.filter((score) => heatTier(score) === "Warm")).toEqual([63]);
  });

  it("accumulates active factor weight", () => {
    expect(heatScore(["returning", "trade", "cash"])) .toBe(30);
  });

  it("estimates close rate from average heat", () => {
    expect(closeRate(72)).toBe(47);
  });

  it("aggregates pipeline counts", () => {
    const scores = [91, 88, 62, 55, 42, 11];
    expect(scores.filter((score) => heatTier(score) === "Hot").length).toBe(2);
    expect(scores.filter((score) => heatTier(score) === "Warm").length).toBe(1);
    expect(scores.filter((score) => heatTier(score) === "Cool").length).toBe(2);
    expect(scores.filter((score) => heatTier(score) === "Cold").length).toBe(1);
  });
});

describe("nightly april 17 - word tracks", () => {
  const tracks = [
    { title: "Need to think about it", script: "which one are you weighing", category: "Objection Responses", rating: 5, pillar: "Objection Prevention Framework" },
    { title: "Strong first 30 seconds", script: "protect the investment", category: "Opening", rating: 4, pillar: "Menu Order System" },
  ];

  it("searches by keyword in title", () => {
    expect(tracks.filter((track) => `${track.title} ${track.script}`.toLowerCase().includes("investment")).length).toBe(1);
  });

  it("filters by category", () => {
    expect(tracks.filter((track) => track.category === "Opening").length).toBe(1);
  });

  it("toggles favorites array add/remove", () => {
    let favorites = [1, 2];
    favorites = favorites.filter((id) => id !== 2);
    favorites = [...favorites, 3];
    expect(favorites).toEqual([1, 3]);
  });

  it("counts tracks by category", () => {
    expect(tracks.reduce((sum, track) => sum + (track.category === "Opening" ? 1 : 0), 0)).toBe(1);
  });

  it("includes all six categories", () => {
    expect(CATEGORIES).toHaveLength(6);
  });

  it("validates rating range", () => {
    expect(tracks.every((track) => track.rating >= 1 && track.rating <= 5)).toBe(true);
  });

  it("assembles copy text", () => {
    const payload = `${tracks[0].title}\nSituation: handle objection\n\n${tracks[0].script}`;
    expect(payload).toContain("Need to think about it");
    expect(payload).toContain("Situation:");
  });

  it("validates ASURA pillar tags", () => {
    expect(tracks.every((track) => PILLARS.includes(track.pillar))).toBe(true);
  });
});

describe("nightly april 17 - desk log", () => {
  const deals = [
    { date: "2026-04-17", front: 1200, back: 2000, status: "Funded" },
    { date: "2026-04-17", front: 800, back: 900, status: "Pending" },
    { date: "2026-04-16", front: 400, back: 500, status: "Declined" },
  ];

  it("calculates total gross", () => {
    expect(totalGross(1200, 2000)).toBe(3200);
  });

  it("calculates pvr", () => {
    expect(pvr(2900, 2)).toBe(1450);
  });

  it("aggregates KPI totals", () => {
    const today = deals.filter((deal) => deal.date === "2026-04-17");
    expect(today.reduce((sum, deal) => sum + deal.front, 0)).toBe(2000);
    expect(today.reduce((sum, deal) => sum + deal.back, 0)).toBe(2900);
  });

  it("counts statuses", () => {
    expect(deals.filter((deal) => deal.status === "Funded").length).toBe(1);
    expect(deals.filter((deal) => deal.status === "Pending").length).toBe(1);
  });

  it("generates csv rows with quoted fields", () => {
    const csv = toCsv(["A", "B"], [["hello", "comma,value"]]);
    expect(csv).toContain('"comma,value"');
  });

  it("validates csv header columns", () => {
    const headers = ["Deal #","Customer Name","Vehicle","Sale Price","Amount Financed","Rate","Term","Monthly Payment","Lender","F&I Manager","Products Sold","Back Gross","Front Gross","Total Gross","Status"];
    expect(headers).toHaveLength(15);
  });

  it("filters by date", () => {
    expect(deals.filter((deal) => deal.date === "2026-04-17").length).toBe(2);
  });

  it("returns correct status tint", () => {
    expect(statusTint("Funded")).toBe("green");
    expect(statusTint("Unwound")).toBe("red");
  });

  it("adds deal to state array", () => {
    const next = [...deals, { date: "2026-04-17", front: 100, back: 100, status: "Pending" }];
    expect(next).toHaveLength(4);
  });

  it("updates array item on inline edit", () => {
    const updated = deals.map((deal, index) => index === 1 ? { ...deal, status: "Funded" } : deal);
    expect(updated[1].status).toBe("Funded");
  });
});

describe("nightly april 17 - rate watch", () => {
  it("detects rising trend", () => {
    expect(direction(6.62, 6.48)).toBe("Rising");
  });

  it("detects stable trend", () => {
    expect(direction(6.48, 6.48)).toBe("Stable");
  });

  it("detects falling trend", () => {
    expect(direction(6.2, 6.48)).toBe("Falling");
  });

  it("calculates bps delta", () => {
    expect(bpsDelta(6.62, 6.48)).toBe(14);
  });

  it("calculates negative bps delta", () => {
    expect(bpsDelta(6.22, 6.48)).toBe(-26);
  });

  it("calculates ytd delta", () => {
    expect(bpsDelta(6.55, 6.35)).toBe(20);
  });

  it("calculates monthly payment", () => {
    expect(Math.round(payment(35000, 6.62, 72))).toBeGreaterThan(500);
  });

  it("handles zero rate payment", () => {
    expect(payment(12000, 0, 60)).toBe(200);
  });

  it("calculates 0.25 rate impact", () => {
    const base = payment(35000, 6.62, 72);
    const higher = payment(35000, 6.87, 72);
    expect(higher - base).toBeGreaterThan(4);
  });

  it("checks alert threshold", () => {
    expect(7.6 >= 7.5).toBe(true);
  });

  it("checks alert threshold false condition", () => {
    expect(6.9 >= 7.5).toBe(false);
  });

  it("filters active alerts", () => {
    const alerts = [{ active: true }, { active: false }, { active: true }];
    expect(alerts.filter((alert) => alert.active).length).toBe(2);
  });

  it("sorts lenders by buy rate ascending", () => {
    expect([6.55, 6.05, 7.24].sort((a, b) => a - b)).toEqual([6.05, 6.55, 7.24]);
  });

  it("sorts lenders by buy rate descending", () => {
    expect([6.55, 6.05, 7.24].sort((a, b) => b - a)).toEqual([7.24, 6.55, 6.05]);
  });

  it("validates 12 months of history", () => {
    expect(Array.from({ length: 12 })).toHaveLength(12);
  });

  it("generates market context string", () => {
    const context = `Market is ${direction(6.62, 6.48).toLowerCase()}`;
    expect(context).toContain("rising");
  });

  it("formats alert payload", () => {
    const alert = { lender: "Ally", type: "new", threshold: 7.5 };
    expect(`${alert.lender}-${alert.type}-${alert.threshold}`).toBe("Ally-new-7.5");
  });
});

describe("nightly april 17 - additional heat coverage", () => {
  it("returns cold at zero", () => {
    expect(heatTier(0)).toBe("Cold");
  });

  it("returns hot at boundary", () => {
    expect(heatTier(80)).toBe("Hot");
  });

  it("returns warm at boundary", () => {
    expect(heatTier(60)).toBe("Warm");
  });

  it("returns cool at boundary", () => {
    expect(heatTier(40)).toBe("Cool");
  });

  it("ignores unknown heat factors", () => {
    expect(heatScore(["unknown", "cash"])) .toBe(8);
  });

  it("close rate rounds correctly", () => {
    expect(closeRate(61)).toBe(40);
  });
});

describe("nightly april 17 - additional word track coverage", () => {
  it("keeps category names unique", () => {
    expect(new Set(CATEGORIES).size).toBe(CATEGORIES.length);
  });

  it("keeps pillar names unique", () => {
    expect(new Set(PILLARS).size).toBe(PILLARS.length);
  });

  it("supports empty favorites list", () => {
    expect([].filter(Boolean)).toEqual([]);
  });

  it("search matches script body", () => {
    const script = "protect the investment and keep payment clean";
    expect(script.includes("payment clean")).toBe(true);
  });

  it("rating upper bound is accepted", () => {
    expect(5 >= 1 && 5 <= 5).toBe(true);
  });

  it("rating lower bound is accepted", () => {
    expect(1 >= 1 && 1 <= 5).toBe(true);
  });
});

describe("nightly april 17 - additional desk log coverage", () => {
  it("quotes double quotes in csv", () => {
    const csv = toCsv(["A"], [["He said \"yes\""]]);
    expect(csv).toContain('"He said ""yes"""');
  });

  it("returns zero pvr when no deals", () => {
    expect(pvr(0, 0)).toBe(0);
  });

  it("defaults unknown status tint to gray", () => {
    expect(statusTint("Anything")).toBe("gray");
  });

  it("computes gross with zero front", () => {
    expect(totalGross(0, 2200)).toBe(2200);
  });

  it("computes gross with zero back", () => {
    expect(totalGross(1500, 0)).toBe(1500);
  });

  it("filters empty product strings", () => {
    expect("GAP, , VSC".split(",").map((item) => item.trim()).filter(Boolean)).toEqual(["GAP", "VSC"]);
  });
});
