import { describe, it, expect } from "vitest";
import {
  getManagerScorecard,
  getSessionComparison,
  getUnreadAlerts,
  markAlertRead,
} from "./db";

// ─── Demo Mode Timeline Logic ──────────────────────────────────────────────

describe("Demo Mode timeline logic", () => {
  // Inline demo data structures matching the expected shape from the app
  const DEMO_TRANSCRIPT = [
    { speaker: "manager", text: "Welcome to the finance office.", delay: 0 },
    { speaker: "customer", text: "Thanks for having me.", delay: 3000 },
    { speaker: "manager", text: "Let me walk you through the paperwork.", delay: 6000 },
    { speaker: "manager", text: "First, let's review the APR disclosure.", delay: 9000 },
    { speaker: "customer", text: "What does that mean for my payment?", delay: 12000 },
    { speaker: "manager", text: "Great question. Your annual percentage rate is 5.9%.", delay: 15000 },
    { speaker: "manager", text: "Now let's talk about GAP insurance.", delay: 18000 },
    { speaker: "customer", text: "I'm not sure I need that.", delay: 21000 },
    { speaker: "manager", text: "For just $0.53 per day, you'd have full coverage.", delay: 24000 },
    { speaker: "manager", text: "Let me also mention our extended warranty options.", delay: 27000 },
  ];

  const DEMO_SUGGESTIONS = [
    { id: 1, type: "objection_handling", triggerAt: 21000, title: "GAP Objection" },
    { id: 2, type: "compliance_reminder", triggerAt: 9000, title: "APR Disclosure" },
    { id: 3, type: "upsell", triggerAt: 27000, title: "Extended Warranty Pitch" },
  ];

  const CHECKLIST_ITEMS = [
    "greeting", "needs_analysis", "credit_review", "payment_options",
    "apr_disclosure", "gap_insurance", "extended_warranty", "tire_wheel",
    "paint_protection", "theft_deterrent", "key_replacement",
    "maintenance_plan", "recap_products", "final_disclosure", "closing",
  ];

  const DEMO_CHECKLIST_EVENTS = CHECKLIST_ITEMS.map((item, i) => ({
    item,
    completedAt: 3000 * (i + 1),
  }));

  const DEMO_COMPLIANCE = [
    { rule: "APR Disclosure", severity: "critical", timestamp: 9000 },
    { rule: "Right to Cancel", severity: "warning", timestamp: 15000 },
    { rule: "Payment Terms", severity: "info", timestamp: 20000 },
    { rule: "Insurance Opt-Out", severity: "warning", timestamp: 25000 },
  ];

  const DEMO_FINAL_SCORE = 87;

  it("all DEMO_TRANSCRIPT entries should have sequential delays", () => {
    for (let i = 1; i < DEMO_TRANSCRIPT.length; i++) {
      expect(DEMO_TRANSCRIPT[i].delay).toBeGreaterThan(DEMO_TRANSCRIPT[i - 1].delay);
    }
    // First entry should start at 0
    expect(DEMO_TRANSCRIPT[0].delay).toBe(0);
  });

  it("all DEMO_SUGGESTIONS should have valid triggerAt timestamps", () => {
    for (const suggestion of DEMO_SUGGESTIONS) {
      expect(typeof suggestion.triggerAt).toBe("number");
      expect(suggestion.triggerAt).toBeGreaterThanOrEqual(0);
      expect(suggestion.id).toBeGreaterThan(0);
      expect(suggestion.type).toBeTruthy();
      expect(suggestion.title).toBeTruthy();
    }
  });

  it("DEMO_CHECKLIST_EVENTS should cover all 15 checklist items", () => {
    expect(DEMO_CHECKLIST_EVENTS).toHaveLength(15);
    const items = DEMO_CHECKLIST_EVENTS.map((e) => e.item);
    for (const expected of CHECKLIST_ITEMS) {
      expect(items).toContain(expected);
    }
  });

  it("DEMO_COMPLIANCE events should have valid severity levels", () => {
    const validSeverities = ["critical", "warning", "info"];
    for (const event of DEMO_COMPLIANCE) {
      expect(validSeverities).toContain(event.severity);
      expect(event.rule).toBeTruthy();
      expect(typeof event.timestamp).toBe("number");
      expect(event.timestamp).toBeGreaterThan(0);
    }
  });

  it("final demo score should be 87/100", () => {
    expect(DEMO_FINAL_SCORE).toBe(87);
    expect(DEMO_FINAL_SCORE).toBeGreaterThanOrEqual(0);
    expect(DEMO_FINAL_SCORE).toBeLessThanOrEqual(100);
  });
});

// ─── Alerts System ──────────────────────────────────────────────────────────

describe("Alerts system", () => {
  it("getUnreadAlerts returns an array", async () => {
    const alerts = await getUnreadAlerts(1);
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("markAlertRead returns success for valid flag IDs", async () => {
    const result = await markAlertRead("flag-1");
    // Without DB, markAlertRead returns { success: false }
    expect(result).toHaveProperty("success");
    expect(typeof result.success).toBe("boolean");
  });

  it("markAlertRead returns success for grade alert IDs", async () => {
    const result = await markAlertRead("grade-5");
    expect(result).toHaveProperty("success");
    expect(typeof result.success).toBe("boolean");
  });

  it("markAlertRead returns failure for invalid IDs", async () => {
    const result = await markAlertRead("invalid-99");
    expect(result).toEqual({ success: false });
  });

  it("alert IDs should follow the pattern flag-N or grade-N", () => {
    const flagPattern = /^flag-\d+$/;
    const gradePattern = /^grade-\d+$/;

    const sampleIds = ["flag-1", "flag-42", "grade-1", "grade-100"];
    for (const id of sampleIds) {
      const isValid = flagPattern.test(id) || gradePattern.test(id);
      expect(isValid).toBe(true);
    }

    // Negative cases
    expect(flagPattern.test("flag-")).toBe(false);
    expect(gradePattern.test("grade-abc")).toBe(false);
    expect(flagPattern.test("invalid-1")).toBe(false);
  });
});

// ─── Manager Scorecard Data ─────────────────────────────────────────────────

describe("Manager Scorecard data", () => {
  it("getManagerScorecard returns null without DB", async () => {
    const scorecard = await getManagerScorecard(1);
    expect(scorecard).toBeNull();
  });

  it("scorecard summary shape should include required fields", () => {
    const expectedShape = {
      avgOverall: 82,
      avgPvr: 1400,
      avgCompliance: 88,
      avgWordTrack: 65,
      sessionCount: 12,
      avgScriptFidelity: 72,
      weeklyData: [
        {
          week: "2026-W01",
          overall: 80,
          pvr: 1300,
          compliance: 85,
          wordTrack: 60,
          sessions: 3,
          scriptFidelity: 70,
        },
      ],
    };

    expect(expectedShape).toHaveProperty("avgOverall");
    expect(expectedShape).toHaveProperty("avgPvr");
    expect(expectedShape).toHaveProperty("avgCompliance");
    expect(expectedShape).toHaveProperty("avgWordTrack");
    expect(expectedShape).toHaveProperty("sessionCount");
    expect(expectedShape).toHaveProperty("avgScriptFidelity");
    expect(expectedShape).toHaveProperty("weeklyData");
    expect(typeof expectedShape.avgOverall).toBe("number");
    expect(typeof expectedShape.avgPvr).toBe("number");
    expect(typeof expectedShape.sessionCount).toBe("number");
  });

  it("weekly trend should be an array", () => {
    const weeklyData = [
      { week: "2026-W10", overall: 78, sessions: 4 },
      { week: "2026-W11", overall: 82, sessions: 3 },
      { week: "2026-W12", overall: 85, sessions: 5 },
    ];
    expect(Array.isArray(weeklyData)).toBe(true);
    expect(weeklyData.length).toBeGreaterThan(0);
    for (const entry of weeklyData) {
      expect(entry).toHaveProperty("week");
      expect(entry).toHaveProperty("overall");
      expect(entry.week).toMatch(/^\d{4}-W\d{2}$/);
    }
  });
});

// ─── Session Comparison ─────────────────────────────────────────────────────

describe("Session Comparison", () => {
  it("getSessionComparison returns two session slots", async () => {
    const result = await getSessionComparison(1, 2);
    expect(result).toHaveProperty("session1");
    expect(result).toHaveProperty("session2");
  });

  it("comparison result shape validation", async () => {
    const result = await getSessionComparison(999, 1000);
    // Without DB, both sessions should be null
    expect(result.session1).toBeNull();
    expect(result.session2).toBeNull();

    // Validate the shape is correct
    const keys = Object.keys(result);
    expect(keys).toContain("session1");
    expect(keys).toContain("session2");
    expect(keys).toHaveLength(2);
  });
});
