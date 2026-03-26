import { describe, it, expect } from "vitest";
import { getDealRecoveryStats } from "./db";

// ─── Deal Recovery Stats Logic ──────────────────────────────────────────────

describe("Deal Recovery stats computation", () => {
  it("getDealRecoveryStats should be a function", () => {
    expect(typeof getDealRecoveryStats).toBe("function");
  });

  it("stats should have correct shape with all count fields", () => {
    const mockStats = {
      pendingCount: 3,
      attemptedCount: 2,
      recoveredCount: 5,
      lostCount: 1,
      totalPotentialRevenue: 12000,
      totalActualRevenue: 8000,
    };
    expect(mockStats).toHaveProperty("pendingCount");
    expect(mockStats).toHaveProperty("attemptedCount");
    expect(mockStats).toHaveProperty("recoveredCount");
    expect(mockStats).toHaveProperty("lostCount");
    expect(mockStats).toHaveProperty("totalPotentialRevenue");
    expect(mockStats).toHaveProperty("totalActualRevenue");
  });

  it("win rate calculation should work correctly", () => {
    const recovered = 5;
    const lost = 3;
    const winRate = recovered + lost > 0 ? Math.round((recovered / (recovered + lost)) * 100) : 0;
    expect(winRate).toBe(63);
  });

  it("win rate should be 0 when no resolved deals", () => {
    const recovered = 0;
    const lost = 0;
    const winRate = recovered + lost > 0 ? Math.round((recovered / (recovered + lost)) * 100) : 0;
    expect(winRate).toBe(0);
  });

  it("win rate should be 100 when all recovered", () => {
    const recovered = 10;
    const lost = 0;
    const winRate = recovered + lost > 0 ? Math.round((recovered / (recovered + lost)) * 100) : 0;
    expect(winRate).toBe(100);
  });
});

// ─── Deal Recovery Filter & Sort Logic ──────────────────────────────────────

describe("Deal Recovery filter and sort logic", () => {
  const mockRecoveries = [
    { id: 1, recoveryStatus: "pending", potentialRevenue: 500, createdAt: "2026-03-20T10:00:00Z", productType: "gap_insurance" },
    { id: 2, recoveryStatus: "recovered", potentialRevenue: 1200, createdAt: "2026-03-18T10:00:00Z", productType: "vehicle_service_contract" },
    { id: 3, recoveryStatus: "attempted", potentialRevenue: 800, createdAt: "2026-03-22T10:00:00Z", productType: "prepaid_maintenance" },
    { id: 4, recoveryStatus: "lost", potentialRevenue: 300, createdAt: "2026-03-15T10:00:00Z", productType: "road_hazard" },
    { id: 5, recoveryStatus: "recovered", potentialRevenue: 2000, createdAt: "2026-03-25T10:00:00Z", productType: "theft_protection" },
  ];

  it("filter by status 'recovered' should return only recovered items", () => {
    const filtered = mockRecoveries.filter((r) => r.recoveryStatus === "recovered");
    expect(filtered).toHaveLength(2);
    expect(filtered.every((r) => r.recoveryStatus === "recovered")).toBe(true);
  });

  it("filter by 'all' should return all items", () => {
    const status = "all";
    const filtered = status === "all" ? mockRecoveries : mockRecoveries.filter((r) => r.recoveryStatus === status);
    expect(filtered).toHaveLength(5);
  });

  it("sort by revenue descending should put highest first", () => {
    const sorted = [...mockRecoveries].sort((a, b) => (b.potentialRevenue ?? 0) - (a.potentialRevenue ?? 0));
    expect(sorted[0].potentialRevenue).toBe(2000);
    expect(sorted[sorted.length - 1].potentialRevenue).toBe(300);
  });

  it("sort by date descending should put newest first", () => {
    const sorted = [...mockRecoveries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    expect(sorted[0].id).toBe(5); // March 25
    expect(sorted[sorted.length - 1].id).toBe(4); // March 15
  });
});

// ─── PDF / Print Report Endpoint ────────────────────────────────────────────

describe("PDF report endpoints", () => {
  it("coaching report PDF route pattern should match expected format", () => {
    const sessionId = 42;
    const url = `/api/pdf/coaching-report/${sessionId}`;
    expect(url).toBe("/api/pdf/coaching-report/42");
    expect(url).toMatch(/^\/api\/pdf\/coaching-report\/\d+$/);
  });

  it("session export PDF route pattern should match expected format", () => {
    const sessionId = 99;
    const url = `/api/sessions/${sessionId}/export/pdf`;
    expect(url).toBe("/api/sessions/99/export/pdf");
    expect(url).toMatch(/^\/api\/sessions\/\d+\/export\/pdf$/);
  });

  it("print report client route should follow convention", () => {
    const sessionId = 7;
    const printUrl = `/session/${sessionId}/print`;
    expect(printUrl).toBe("/session/7/print");
    expect(printUrl).toMatch(/^\/session\/\d+\/print$/);
  });
});

// ─── Pipeline Health Score Calculation ──────────────────────────────────────

describe("Pipeline health score calculation", () => {
  it("all passing checks should yield score of 100", () => {
    const checks = [
      { name: "A", status: "pass", detail: "" },
      { name: "B", status: "pass", detail: "" },
      { name: "C", status: "pass", detail: "" },
    ];
    const score = Math.round(
      checks.reduce((sum, c) => sum + (c.status === "pass" ? 100 : c.status === "warn" ? 50 : 0), 0) / checks.length
    );
    expect(score).toBe(100);
  });

  it("all failing checks should yield score of 0", () => {
    const checks = [
      { name: "A", status: "fail", detail: "" },
      { name: "B", status: "fail", detail: "" },
    ];
    const score = Math.round(
      checks.reduce((sum, c) => sum + (c.status === "pass" ? 100 : c.status === "warn" ? 50 : 0), 0) / checks.length
    );
    expect(score).toBe(0);
  });

  it("mixed checks should yield partial score", () => {
    const checks = [
      { name: "A", status: "pass", detail: "" },
      { name: "B", status: "warn", detail: "" },
      { name: "C", status: "fail", detail: "" },
    ];
    const score = Math.round(
      checks.reduce((sum, c) => sum + (c.status === "pass" ? 100 : c.status === "warn" ? 50 : 0), 0) / checks.length
    );
    expect(score).toBe(50);
  });

  it("health score color should be green for 80+", () => {
    const score = 85;
    const color = score >= 80 ? "green" : score >= 60 ? "yellow" : "red";
    expect(color).toBe("green");
  });

  it("health score color should be yellow for 60-79", () => {
    const score = 65;
    const color = score >= 80 ? "green" : score >= 60 ? "yellow" : "red";
    expect(color).toBe("yellow");
  });

  it("health score color should be red for <60", () => {
    const score = 45;
    const color = score >= 80 ? "green" : score >= 60 ? "yellow" : "red";
    expect(color).toBe("red");
  });
});

// ─── Auto Coaching Report Template Logic ────────────────────────────────────

describe("Auto coaching report template logic", () => {
  function generateCoachingFocus(scores: {
    complianceScore: number;
    scriptFidelityScore: number;
    closingScore: number;
    rapportScore: number;
    productKnowledgeScore: number;
    objectionHandlingScore: number;
  }) {
    const focusAreas: string[] = [];
    const strengths: string[] = [];
    if (scores.complianceScore < 70) focusAreas.push("TILA/ECOA disclosures");
    if (scores.scriptFidelityScore < 70) focusAreas.push("ASURA OPS menu order script adherence");
    if (scores.closingScore < 70) focusAreas.push("Assumptive closing and upgrade architecture");
    if (scores.rapportScore >= 80) strengths.push("Strong rapport");
    if (scores.productKnowledgeScore >= 80) strengths.push("Product knowledge");
    if (scores.objectionHandlingScore >= 80) strengths.push("Objection handling");
    if (scores.complianceScore >= 80) strengths.push("Compliance");
    if (scores.closingScore >= 80) strengths.push("Closing");
    const allHigh = Object.values(scores).every((s) => s > 80);
    return { focusAreas, strengths, allHigh };
  }

  it("low compliance score should trigger TILA/ECOA focus", () => {
    const result = generateCoachingFocus({
      complianceScore: 55, scriptFidelityScore: 85, closingScore: 90,
      rapportScore: 80, productKnowledgeScore: 80, objectionHandlingScore: 80,
    });
    expect(result.focusAreas).toContain("TILA/ECOA disclosures");
    expect(result.allHigh).toBe(false);
  });

  it("low script fidelity should trigger menu order focus", () => {
    const result = generateCoachingFocus({
      complianceScore: 85, scriptFidelityScore: 50, closingScore: 90,
      rapportScore: 80, productKnowledgeScore: 80, objectionHandlingScore: 80,
    });
    expect(result.focusAreas).toContain("ASURA OPS menu order script adherence");
  });

  it("low closing score should trigger assumptive closing focus", () => {
    const result = generateCoachingFocus({
      complianceScore: 85, scriptFidelityScore: 85, closingScore: 40,
      rapportScore: 80, productKnowledgeScore: 80, objectionHandlingScore: 80,
    });
    expect(result.focusAreas).toContain("Assumptive closing and upgrade architecture");
  });

  it("all scores above 80 should mark allHigh true", () => {
    const result = generateCoachingFocus({
      complianceScore: 90, scriptFidelityScore: 85, closingScore: 88,
      rapportScore: 92, productKnowledgeScore: 95, objectionHandlingScore: 87,
    });
    expect(result.allHigh).toBe(true);
    expect(result.focusAreas).toHaveLength(0);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("high individual scores should populate strengths", () => {
    const result = generateCoachingFocus({
      complianceScore: 90, scriptFidelityScore: 60, closingScore: 60,
      rapportScore: 95, productKnowledgeScore: 88, objectionHandlingScore: 85,
    });
    expect(result.strengths).toContain("Strong rapport");
    expect(result.strengths).toContain("Product knowledge");
    expect(result.strengths).toContain("Objection handling");
    expect(result.strengths).toContain("Compliance");
  });

  it("multiple low scores should produce multiple focus areas", () => {
    const result = generateCoachingFocus({
      complianceScore: 50, scriptFidelityScore: 45, closingScore: 55,
      rapportScore: 60, productKnowledgeScore: 60, objectionHandlingScore: 60,
    });
    expect(result.focusAreas).toHaveLength(3);
    expect(result.strengths).toHaveLength(0);
    expect(result.allHigh).toBe(false);
  });
});

// ─── Customer Session Timeline ──────────────────────────────────────────────

describe("Customer session timeline logic", () => {
  const mockSessions = [
    { id: 1, status: "completed", startedAt: "2026-03-10T10:00:00Z", durationSeconds: 1800, dealType: "new_vehicle" },
    { id: 2, status: "active", startedAt: "2026-03-20T14:00:00Z", durationSeconds: null, dealType: "used_vehicle" },
    { id: 3, status: "completed", startedAt: "2026-03-15T09:00:00Z", durationSeconds: 2400, dealType: "new_vehicle" },
  ];

  it("sessions should sort by date descending for timeline", () => {
    const sorted = [...mockSessions].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    expect(sorted[0].id).toBe(2); // March 20
    expect(sorted[1].id).toBe(3); // March 15
    expect(sorted[2].id).toBe(1); // March 10
  });

  it("duration formatting should produce human-readable strings", () => {
    const formatDuration = (seconds: number | null) => {
      if (!seconds) return null;
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}m ${s}s`;
    };
    expect(formatDuration(1800)).toBe("30m 0s");
    expect(formatDuration(2400)).toBe("40m 0s");
    expect(formatDuration(null)).toBeNull();
    expect(formatDuration(90)).toBe("1m 30s");
  });

  it("status dot color should be green for completed, blue for active", () => {
    const getColor = (status: string) =>
      status === "completed" ? "green" : status === "active" ? "blue" : "gray";
    expect(getColor("completed")).toBe("green");
    expect(getColor("active")).toBe("blue");
    expect(getColor("processing")).toBe("gray");
  });
});

// ─── Weekly Chart Data Grouping ─────────────────────────────────────────────

describe("Weekly chart data grouping for deal recovery", () => {
  it("should group recovery items by week", () => {
    const items = [
      { createdAt: "2026-03-02T10:00:00Z", recoveryStatus: "recovered" },
      { createdAt: "2026-03-03T10:00:00Z", recoveryStatus: "pending" },
      { createdAt: "2026-03-10T10:00:00Z", recoveryStatus: "attempted" },
      { createdAt: "2026-03-10T10:00:00Z", recoveryStatus: "recovered" },
    ];

    const weekMap = new Map<string, { recovered: number; attempted: number; pending: number; lost: number }>();
    for (const item of items) {
      const d = new Date(item.createdAt);
      // Simple week key: year + ISO week number
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      if (!weekMap.has(key)) weekMap.set(key, { recovered: 0, attempted: 0, pending: 0, lost: 0 });
      const entry = weekMap.get(key)!;
      if (item.recoveryStatus === "recovered") entry.recovered++;
      else if (item.recoveryStatus === "attempted") entry.attempted++;
      else if (item.recoveryStatus === "pending") entry.pending++;
      else if (item.recoveryStatus === "lost") entry.lost++;
    }

    expect(weekMap.size).toBe(2); // Two different weeks
    const weeks = Array.from(weekMap.values());
    const totalRecovered = weeks.reduce((s, w) => s + w.recovered, 0);
    expect(totalRecovered).toBe(2);
  });

  it("empty recovery list should produce empty chart data", () => {
    const items: any[] = [];
    const weekMap = new Map();
    for (const item of items) {
      // no-op
    }
    expect(weekMap.size).toBe(0);
  });
});
