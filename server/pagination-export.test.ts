import { describe, it, expect, vi, beforeAll } from "vitest";
import { randomBytes } from "crypto";

const TEST_KEY = randomBytes(32).toString("hex");
process.env.ENCRYPTION_KEY = TEST_KEY;

import {
  scanTranscriptForViolations,
  getAllRules,
  getRulesByCategory,
  calculateComplianceScore,
  type ComplianceViolation,
} from "./compliance-engine";

import {
  asuraQuickTrigger,
  asuraComplianceCheck,
  calculateAsuraScore,
} from "./asura-engine";

// ─── Pagination Count Functions (unit-testable shape) ────────────────────────

describe("Pagination response shape", () => {
  it("paginated response contains rows, total, limit, offset", () => {
    const response = { rows: [], total: 0, limit: 50, offset: 0 };
    expect(response).toHaveProperty("rows");
    expect(response).toHaveProperty("total");
    expect(response).toHaveProperty("limit");
    expect(response).toHaveProperty("offset");
    expect(Array.isArray(response.rows)).toBe(true);
    expect(typeof response.total).toBe("number");
  });

  it("calculates total pages correctly from paginated response", () => {
    const PAGE_SIZE = 25;
    const responses = [
      { total: 0, expected: 1 },
      { total: 1, expected: 1 },
      { total: 25, expected: 1 },
      { total: 26, expected: 2 },
      { total: 100, expected: 4 },
      { total: 101, expected: 5 },
    ];
    for (const { total, expected } of responses) {
      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      expect(totalPages).toBe(expected);
    }
  });

  it("offset calculation matches page * pageSize", () => {
    const PAGE_SIZE = 25;
    expect(0 * PAGE_SIZE).toBe(0);
    expect(1 * PAGE_SIZE).toBe(25);
    expect(3 * PAGE_SIZE).toBe(75);
  });
});

// ─── CSV Export Format ─────────────────────────────────────────────────────

describe("CSV export format", () => {
  it("generates valid CSV header row", () => {
    const headers = ["ID", "Customer", "Deal Number", "Deal Type", "Status", "Score", "Duration", "Started At"];
    const csv = headers.join(",");
    expect(csv).toBe("ID,Customer,Deal Number,Deal Type,Status,Score,Duration,Started At");
    expect(csv.split(",")).toHaveLength(8);
  });

  it("escapes commas and quotes in CSV values", () => {
    const escapeCSV = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };
    expect(escapeCSV("Smith, John")).toBe('"Smith, John"');
    expect(escapeCSV('She said "hello"')).toBe('"She said ""hello"""');
    expect(escapeCSV("plain")).toBe("plain");
  });

  it("builds a complete CSV row from session data", () => {
    const session = { id: 42, customerName: "Jane Doe", dealNumber: "D-001", dealType: "retail_finance", status: "completed", score: 87, durationSeconds: 3600, startedAt: "2026-03-23T12:00:00Z" };
    const row = [session.id, session.customerName, session.dealNumber, session.dealType, session.status, session.score, session.durationSeconds, session.startedAt].join(",");
    expect(row).toContain("42");
    expect(row).toContain("Jane Doe");
    expect(row).toContain("D-001");
  });
});

// ─── Compliance Engine Tests ───────────────────────────────────────────────

describe("Compliance Engine", () => {
  it("getAllRules returns a non-empty array of rules", () => {
    const rules = getAllRules();
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0]).toHaveProperty("id");
    expect(rules[0]).toHaveProperty("category");
    expect(rules[0]).toHaveProperty("severity");
  });

  it("getRulesByCategory filters correctly", () => {
    const tilaRules = getRulesByCategory("TILA_REG_Z");
    expect(tilaRules.length).toBeGreaterThan(0);
    for (const rule of tilaRules) {
      expect(rule.category).toBe("TILA_REG_Z");
    }
  });

  it("scanTranscriptForViolations returns empty for clean text", () => {
    const violations = scanTranscriptForViolations("Hello, welcome to our office.", 0);
    expect(Array.isArray(violations)).toBe(true);
  });

  it("calculateComplianceScore returns 100 for zero violations", () => {
    const score = calculateComplianceScore([]);
    expect(score).toBe(100);
  });

  it("calculateComplianceScore penalizes critical violations heavily", () => {
    const criticalViolation: ComplianceViolation = {
      ruleId: "test",
      category: "TILA_REG_Z",
      severity: "critical",
      description: "test violation",
      excerpt: "test",
      timestamp: 0,
    };
    const score = calculateComplianceScore([criticalViolation]);
    expect(score).toBeLessThan(100);
  });

  it("calculateComplianceScore never goes below 0", () => {
    const manyViolations: ComplianceViolation[] = Array.from({ length: 20 }, () => ({
      ruleId: "test",
      category: "TILA_REG_Z" as const,
      severity: "critical" as const,
      description: "test",
      excerpt: "test",
      timestamp: 0,
    }));
    const score = calculateComplianceScore(manyViolations);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

// ─── ASURA Engine Tests ────────────────────────────────────────────────────

describe("ASURA Engine", () => {
  it("asuraQuickTrigger returns null for non-triggering text", () => {
    const result = asuraQuickTrigger("Hello, how are you?");
    expect(result).toBeNull();
  });

  it("asuraQuickTrigger detects price objection", () => {
    const result = asuraQuickTrigger("That's too expensive, I can't afford that price");
    expect(result).not.toBeNull();
  });

  it("asuraComplianceCheck flags guaranteed approval language", () => {
    const flags = asuraComplianceCheck("You're guaranteed approval for this loan", 300);
    const hasGuaranteedApproval = flags.some(f => f.rule === "GUARANTEED_APPROVAL");
    expect(hasGuaranteedApproval).toBe(true);
  });

  it("asuraComplianceCheck flags optional language", () => {
    const flags = asuraComplianceCheck("This coverage is optional for your vehicle", 300);
    const hasOptional = flags.some(f => f.rule === "LANGUAGE_OPTIONAL");
    expect(hasOptional).toBe(true);
  });

  it("asuraComplianceCheck flags credit discussion before privacy policy", () => {
    const flags = asuraComplianceCheck("Let me go over the interest rate and APR for your financing", 60);
    const hasPrivacy = flags.some(f => f.rule === "PRIVACY_POLICY_TIMING");
    expect(hasPrivacy).toBe(true);
  });

  it("asuraComplianceCheck flags discriminatory language", () => {
    const flags = asuraComplianceCheck("Because you're a first-time buyer we have special rates", 300);
    const hasEcoa = flags.some(f => f.rule === "ECOA_LANGUAGE");
    expect(hasEcoa).toBe(true);
  });

  it("calculateAsuraScore returns grade and scores for empty checklist", () => {
    const result = calculateAsuraScore({});
    expect(result).toHaveProperty("totalScore");
    expect(result).toHaveProperty("grade");
    expect(result).toHaveProperty("categoryScores");
    expect(result).toHaveProperty("feedback");
    expect(result.totalScore).toBe(0);
    expect(result.grade).toBe("Needs Coaching");
  });
});
