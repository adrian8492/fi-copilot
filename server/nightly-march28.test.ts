import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// 1. Deal Score Calculation (weights)
// ═══════════════════════════════════════════════════════════════════
function calculateDealScore(
  pvr: number,
  avgPvr: number,
  productsAccepted: number,
  productsPresented: number,
  complianceScore: number,
  objectionCount: number,
): number {
  const pvrComponent = avgPvr > 0 ? Math.min(100, (pvr / avgPvr) * 100) : 50;
  const penetrationComponent = productsPresented > 0 ? (productsAccepted / productsPresented) * 100 : 0;
  const complianceComponent = Math.min(100, Math.max(0, complianceScore));
  const sentimentComponent = Math.max(0, Math.min(100, 100 - objectionCount * 20));
  const score = Math.round(
    pvrComponent * 0.4 + penetrationComponent * 0.3 + complianceComponent * 0.2 + sentimentComponent * 0.1
  );
  return Math.min(100, Math.max(0, score));
}

describe("Deal Score calculation (weights)", () => {
  it("perfect deal should score near 100", () => {
    const score = calculateDealScore(3000, 3000, 5, 5, 100, 0);
    expect(score).toBeGreaterThanOrEqual(95);
  });
  it("PVR weight is 40%", () => {
    const highPvr = calculateDealScore(6000, 3000, 0, 5, 0, 5);
    const lowPvr = calculateDealScore(0, 3000, 0, 5, 0, 5);
    expect(highPvr - lowPvr).toBeGreaterThanOrEqual(35);
  });
  it("penetration weight is 30%", () => {
    const full = calculateDealScore(0, 3000, 5, 5, 0, 5);
    const none = calculateDealScore(0, 3000, 0, 5, 0, 5);
    expect(full - none).toBe(30);
  });
  it("compliance weight is 20%", () => {
    const full = calculateDealScore(0, 3000, 0, 5, 100, 5);
    const none = calculateDealScore(0, 3000, 0, 5, 0, 5);
    expect(full - none).toBe(20);
  });
  it("sentiment weight is 10%", () => {
    const happy = calculateDealScore(0, 3000, 0, 5, 0, 0);
    const angry = calculateDealScore(0, 3000, 0, 5, 0, 5);
    expect(happy - angry).toBe(10);
  });
  it("score is clamped between 0 and 100", () => {
    expect(calculateDealScore(100000, 1, 10, 1, 200, 0)).toBeLessThanOrEqual(100);
    expect(calculateDealScore(0, 3000, 0, 5, 0, 100)).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. Deal Score Color Tier Thresholds
// ═══════════════════════════════════════════════════════════════════
function getDealScoreColor(score: number): "red" | "yellow" | "green" {
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  return "red";
}

describe("Deal Score color tier thresholds", () => {
  it("score 80+ is green", () => { expect(getDealScoreColor(80)).toBe("green"); });
  it("score 95 is green", () => { expect(getDealScoreColor(95)).toBe("green"); });
  it("score 60-79 is yellow", () => { expect(getDealScoreColor(60)).toBe("yellow"); });
  it("score 79 is yellow", () => { expect(getDealScoreColor(79)).toBe("yellow"); });
  it("score <60 is red", () => { expect(getDealScoreColor(59)).toBe("red"); });
  it("score 0 is red", () => { expect(getDealScoreColor(0)).toBe("red"); });
});

// ═══════════════════════════════════════════════════════════════════
// 3. Deal Score Sorting and Filtering
// ═══════════════════════════════════════════════════════════════════
describe("Deal Score sort/filter logic", () => {
  const deals = [
    { customer: "Alice", dealScore: 92, tier: "green" as const },
    { customer: "Bob", dealScore: 65, tier: "yellow" as const },
    { customer: "Carol", dealScore: 45, tier: "red" as const },
    { customer: "Dave", dealScore: 88, tier: "green" as const },
  ];

  it("sort desc by dealScore", () => {
    const sorted = [...deals].sort((a, b) => b.dealScore - a.dealScore);
    expect(sorted[0].customer).toBe("Alice");
    expect(sorted[3].customer).toBe("Carol");
  });
  it("sort asc by dealScore", () => {
    const sorted = [...deals].sort((a, b) => a.dealScore - b.dealScore);
    expect(sorted[0].customer).toBe("Carol");
  });
  it("filter green tier", () => {
    const green = deals.filter((d) => d.tier === "green");
    expect(green).toHaveLength(2);
  });
  it("filter red tier", () => {
    const red = deals.filter((d) => d.tier === "red");
    expect(red).toHaveLength(1);
    expect(red[0].customer).toBe("Carol");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. Coaching Report Section Toggle Logic
// ═══════════════════════════════════════════════════════════════════
describe("Coaching report section toggle logic", () => {
  const DEFAULT_SECTIONS = [
    { id: "performance", enabled: true },
    { id: "strengths", enabled: true },
    { id: "objections", enabled: true },
    { id: "deals", enabled: true },
    { id: "compliance", enabled: true },
    { id: "recommendations", enabled: true },
  ];

  function toggleSection(sections: typeof DEFAULT_SECTIONS, id: string) {
    return sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
  }

  it("all sections enabled by default", () => {
    expect(DEFAULT_SECTIONS.every((s) => s.enabled)).toBe(true);
  });
  it("toggle disables a section", () => {
    const result = toggleSection(DEFAULT_SECTIONS, "performance");
    expect(result.find((s) => s.id === "performance")!.enabled).toBe(false);
  });
  it("toggle re-enables a section", () => {
    const disabled = toggleSection(DEFAULT_SECTIONS, "performance");
    const reenabled = toggleSection(disabled, "performance");
    expect(reenabled.find((s) => s.id === "performance")!.enabled).toBe(true);
  });
  it("toggling one does not affect others", () => {
    const result = toggleSection(DEFAULT_SECTIONS, "deals");
    expect(result.filter((s) => s.enabled)).toHaveLength(5);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. Coaching Report Date Range Filter
// ═══════════════════════════════════════════════════════════════════
describe("Coaching report date range filter", () => {
  function filterByRange(sessions: { date: string }[], range: "30" | "90" | "custom", customStart?: string, customEnd?: string) {
    const now = Date.now();
    return sessions.filter((s) => {
      const d = new Date(s.date).getTime();
      if (range === "30") return d >= now - 30 * 86400000;
      if (range === "90") return d >= now - 90 * 86400000;
      if (range === "custom" && customStart && customEnd)
        return d >= new Date(customStart).getTime() && d <= new Date(customEnd).getTime();
      return true;
    });
  }

  const sessions = [
    { date: new Date(Date.now() - 10 * 86400000).toISOString() },
    { date: new Date(Date.now() - 50 * 86400000).toISOString() },
    { date: new Date(Date.now() - 100 * 86400000).toISOString() },
  ];

  it("last 30 days filters correctly", () => {
    expect(filterByRange(sessions, "30")).toHaveLength(1);
  });
  it("last 90 days filters correctly", () => {
    expect(filterByRange(sessions, "90")).toHaveLength(2);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. Product Heatmap Data Aggregation (product × day)
// ═══════════════════════════════════════════════════════════════════
describe("Product heatmap aggregation (product × day)", () => {
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const PRODUCTS = ["VSC", "GAP", "Tire & Wheel"];

  function aggregateHeatmap(sessions: { dayIndex: number; accepted: Record<string, boolean> }[]) {
    const buckets: Record<string, { total: number; accepted: number }> = {};
    for (const p of PRODUCTS) for (const d of DAYS) buckets[`${p}|${d}`] = { total: 0, accepted: 0 };
    for (const s of sessions) {
      const day = DAYS[s.dayIndex];
      for (const p of PRODUCTS) {
        buckets[`${p}|${day}`].total++;
        if (s.accepted[p]) buckets[`${p}|${day}`].accepted++;
      }
    }
    return Object.entries(buckets).map(([key, val]) => {
      const [product, day] = key.split("|");
      return { product, day, rate: val.total > 0 ? Math.round((val.accepted / val.total) * 100) : 0 };
    });
  }

  const sessions = [
    { dayIndex: 0, accepted: { VSC: true, GAP: false, "Tire & Wheel": true } },
    { dayIndex: 0, accepted: { VSC: true, GAP: true, "Tire & Wheel": false } },
    { dayIndex: 2, accepted: { VSC: false, GAP: true, "Tire & Wheel": true } },
  ];

  it("aggregates by product and day", () => {
    const data = aggregateHeatmap(sessions);
    const vscMon = data.find((d) => d.product === "VSC" && d.day === "Mon");
    expect(vscMon!.rate).toBe(100);
  });
  it("GAP Monday acceptance rate is 50%", () => {
    const data = aggregateHeatmap(sessions);
    const gapMon = data.find((d) => d.product === "GAP" && d.day === "Mon");
    expect(gapMon!.rate).toBe(50);
  });
  it("empty day has 0% rate", () => {
    const data = aggregateHeatmap(sessions);
    const vscTue = data.find((d) => d.product === "VSC" && d.day === "Tue");
    expect(vscTue!.rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 7. Product Heatmap Color Intensity Calculation
// ═══════════════════════════════════════════════════════════════════
function getHeatmapColor(rate: number): string {
  if (rate >= 80) return "bg-green-600";
  if (rate >= 60) return "bg-green-500/70";
  if (rate >= 40) return "bg-green-500/40";
  if (rate >= 20) return "bg-green-500/20";
  if (rate > 0) return "bg-green-500/10";
  return "bg-muted/30";
}

describe("Product heatmap color intensity calculation", () => {
  it("0% is muted", () => { expect(getHeatmapColor(0)).toBe("bg-muted/30"); });
  it("10% is lightest green", () => { expect(getHeatmapColor(10)).toBe("bg-green-500/10"); });
  it("50% is medium green", () => { expect(getHeatmapColor(50)).toBe("bg-green-500/40"); });
  it("90% is darkest green", () => { expect(getHeatmapColor(90)).toBe("bg-green-600"); });
});

// ═══════════════════════════════════════════════════════════════════
// 8. Session Replay Event Parsing
// ═══════════════════════════════════════════════════════════════════
describe("Session replay timeline event parsing", () => {
  interface TimelineEvent {
    type: "compliance" | "objection" | "product" | "checklist";
    timestamp: number;
    label: string;
  }

  function parseEvents(flags: { rule: string; timestamp?: string }[], transcripts: { text: string; offsetMs?: number }[], startMs: number): TimelineEvent[] {
    const events: TimelineEvent[] = [];
    flags.forEach((f, i) => {
      events.push({ type: "compliance", timestamp: f.timestamp ? Math.round((new Date(f.timestamp).getTime() - startMs) / 1000) : i * 60, label: f.rule });
    });
    const objKw = ["don't need", "too expensive"];
    const prodKw = ["VSC", "GAP"];
    transcripts.forEach((t, i) => {
      const text = t.text.toLowerCase();
      for (const kw of objKw) { if (text.includes(kw)) { events.push({ type: "objection", timestamp: (t.offsetMs ?? 0) / 1000, label: "Objection" }); break; } }
      for (const kw of prodKw) { if (text.includes(kw.toLowerCase())) { events.push({ type: "product", timestamp: (t.offsetMs ?? 0) / 1000, label: kw }); break; } }
    });
    return events;
  }

  it("parses compliance flags", () => {
    const events = parseEvents([{ rule: "TILA" }], [], 0);
    expect(events.some((e) => e.type === "compliance")).toBe(true);
  });
  it("parses objection keywords", () => {
    const events = parseEvents([], [{ text: "I don't need that", offsetMs: 60000 }], 0);
    expect(events.some((e) => e.type === "objection")).toBe(true);
  });
  it("parses product mentions", () => {
    const events = parseEvents([], [{ text: "Let me tell you about the VSC", offsetMs: 30000 }], 0);
    expect(events.some((e) => e.type === "product")).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 9. Session Arc Grade Calculation
// ═══════════════════════════════════════════════════════════════════
describe("Session arc grade calculation (first/middle/last third)", () => {
  function computeArc(events: { type: string; timestamp: number }[]): { first: string; mid: string; last: string } {
    if (events.length === 0) return { first: "N/A", mid: "N/A", last: "N/A" };
    const max = Math.max(...events.map((e) => e.timestamp));
    if (max === 0) return { first: "N/A", mid: "N/A", last: "N/A" };
    const third = max / 3;
    function grade(evts: typeof events) {
      const neg = evts.filter((e) => e.type === "compliance").length * 2 + evts.filter((e) => e.type === "objection").length;
      if (neg === 0) return "A";
      if (neg <= 1) return "B";
      if (neg <= 3) return "C";
      return "D";
    }
    return {
      first: grade(events.filter((e) => e.timestamp <= third)),
      mid: grade(events.filter((e) => e.timestamp > third && e.timestamp <= third * 2)),
      last: grade(events.filter((e) => e.timestamp > third * 2)),
    };
  }

  it("no events gives N/A", () => {
    expect(computeArc([]).first).toBe("N/A");
  });
  it("clean segment gets A", () => {
    const arc = computeArc([{ type: "checklist", timestamp: 50 }, { type: "product", timestamp: 100 }]);
    expect(arc.first).toBe("A");
  });
  it("compliance-heavy segment gets lower grade", () => {
    const arc = computeArc([
      { type: "compliance", timestamp: 10 },
      { type: "compliance", timestamp: 20 },
      { type: "objection", timestamp: 25 },
      { type: "checklist", timestamp: 100 },
    ]);
    expect(["C", "D"]).toContain(arc.first);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 10. Live Alerts Panel Accumulation Logic
// ═══════════════════════════════════════════════════════════════════
describe("Live alerts accumulation logic", () => {
  interface Alert { id: string; dismissed: boolean; type: string }

  function accumulateAlerts(existing: Alert[], newAlerts: Omit<Alert, "dismissed">[]): Alert[] {
    const ids = new Set(existing.map((a) => a.id));
    const merged = [...existing];
    for (const a of newAlerts) {
      if (!ids.has(a.id)) merged.push({ ...a, dismissed: false });
    }
    return merged;
  }

  it("adds new alerts", () => {
    const result = accumulateAlerts([], [{ id: "a1", type: "compliance" }]);
    expect(result).toHaveLength(1);
  });
  it("does not duplicate existing alerts", () => {
    const existing = [{ id: "a1", dismissed: false, type: "compliance" }];
    const result = accumulateAlerts(existing, [{ id: "a1", type: "compliance" }]);
    expect(result).toHaveLength(1);
  });
  it("preserves dismissed state", () => {
    const existing = [{ id: "a1", dismissed: true, type: "compliance" }];
    const result = accumulateAlerts(existing, [{ id: "a1", type: "compliance" }]);
    expect(result[0].dismissed).toBe(true);
  });

  function dismissAlert(alerts: Alert[], id: string): Alert[] {
    return alerts.map((a) => (a.id === id ? { ...a, dismissed: true } : a));
  }

  it("dismiss single alert", () => {
    const alerts = [{ id: "a1", dismissed: false, type: "compliance" }, { id: "a2", dismissed: false, type: "score" }];
    const result = dismissAlert(alerts, "a1");
    expect(result[0].dismissed).toBe(true);
    expect(result[1].dismissed).toBe(false);
  });

  function dismissAll(alerts: Alert[]): Alert[] {
    return alerts.map((a) => ({ ...a, dismissed: true }));
  }

  it("dismiss all alerts", () => {
    const alerts = [{ id: "a1", dismissed: false, type: "compliance" }, { id: "a2", dismissed: false, type: "score" }];
    const result = dismissAll(alerts);
    expect(result.every((a) => a.dismissed)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 11. Alert Severity Classification
// ═══════════════════════════════════════════════════════════════════
describe("Alert severity classification", () => {
  function classifySeverity(type: string): "critical" | "warning" | "info" {
    if (type === "compliance") return "critical";
    if (type === "score" || type === "objection") return "warning";
    return "info";
  }

  it("compliance is critical", () => { expect(classifySeverity("compliance")).toBe("critical"); });
  it("score is warning", () => { expect(classifySeverity("score")).toBe("warning"); });
  it("objection is warning", () => { expect(classifySeverity("objection")).toBe("warning"); });
  it("missed_product is info", () => { expect(classifySeverity("missed_product")).toBe("info"); });
});

// ═══════════════════════════════════════════════════════════════════
// 12. KPI Summary Calculations
// ═══════════════════════════════════════════════════════════════════
describe("KPI summary calculations", () => {
  const deals = [
    { dealScore: 92, tier: "green" as const, pvr: 3200 },
    { dealScore: 85, tier: "green" as const, pvr: 2800 },
    { dealScore: 65, tier: "yellow" as const, pvr: 1500 },
    { dealScore: 45, tier: "red" as const, pvr: 800 },
  ];

  it("average deal score", () => {
    const avg = Math.round(deals.reduce((s, d) => s + d.dealScore, 0) / deals.length);
    expect(avg).toBe(72);
  });
  it("% green deals", () => {
    const pct = Math.round((deals.filter((d) => d.tier === "green").length / deals.length) * 100);
    expect(pct).toBe(50);
  });
  it("total PVR", () => {
    const total = deals.reduce((s, d) => s + d.pvr, 0);
    expect(total).toBe(8300);
  });
  it("best deal score", () => {
    const best = Math.max(...deals.map((d) => d.dealScore));
    expect(best).toBe(92);
  });
});
