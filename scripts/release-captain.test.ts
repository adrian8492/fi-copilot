import { describe, it, expect } from "vitest";
import {
  deriveVerdict,
  deriveBlockers,
  deriveNextAction,
  buildReport,
  formatReport,
  parseHealthResponse,
  checkShaMatch,
  type CheckResult,
} from "./release-captain";

describe("release-captain pure logic", () => {
  // ── deriveVerdict ──────────────────────────────────────────────────────

  describe("deriveVerdict", () => {
    it("returns PASS when all checks pass", () => {
      const checks: CheckResult[] = [
        { name: "a", status: "pass", detail: "ok" },
        { name: "b", status: "pass", detail: "ok" },
      ];
      expect(deriveVerdict(checks)).toBe("PASS");
    });

    it("returns FAIL when any check fails", () => {
      const checks: CheckResult[] = [
        { name: "a", status: "pass", detail: "ok" },
        { name: "b", status: "fail", detail: "broken" },
      ];
      expect(deriveVerdict(checks)).toBe("FAIL");
    });

    it("returns WARN when checks have warnings but no failures", () => {
      const checks: CheckResult[] = [
        { name: "a", status: "pass", detail: "ok" },
        { name: "b", status: "warn", detail: "iffy" },
      ];
      expect(deriveVerdict(checks)).toBe("WARN");
    });

    it("FAIL takes precedence over WARN", () => {
      const checks: CheckResult[] = [
        { name: "a", status: "warn", detail: "iffy" },
        { name: "b", status: "fail", detail: "broken" },
      ];
      expect(deriveVerdict(checks)).toBe("FAIL");
    });

    it("returns PASS for empty checks", () => {
      expect(deriveVerdict([])).toBe("PASS");
    });

    it("ignores skip status", () => {
      const checks: CheckResult[] = [
        { name: "a", status: "pass", detail: "ok" },
        { name: "b", status: "skip", detail: "skipped" },
      ];
      expect(deriveVerdict(checks)).toBe("PASS");
    });
  });

  // ── deriveBlockers ─────────────────────────────────────────────────────

  describe("deriveBlockers", () => {
    it("extracts details from failed checks only", () => {
      const checks: CheckResult[] = [
        { name: "a", status: "pass", detail: "ok" },
        { name: "b", status: "fail", detail: "build failed" },
        { name: "c", status: "warn", detail: "dirty" },
        { name: "d", status: "fail", detail: "tests failed" },
      ];
      expect(deriveBlockers(checks)).toEqual(["build failed", "tests failed"]);
    });

    it("returns empty array when no failures", () => {
      expect(deriveBlockers([{ name: "a", status: "pass", detail: "ok" }])).toEqual([]);
    });
  });

  // ── deriveNextAction ───────────────────────────────────────────────────

  describe("deriveNextAction", () => {
    it("says ship it on PASS", () => {
      expect(deriveNextAction("PASS", [])).toContain("Ship it");
    });

    it("references first blocker on FAIL", () => {
      expect(deriveNextAction("FAIL", ["build broke", "tests broke"])).toContain("build broke");
    });

    it("suggests review on WARN", () => {
      expect(deriveNextAction("WARN", [])).toContain("Review warnings");
    });
  });

  // ── parseHealthResponse ────────────────────────────────────────────────

  describe("parseHealthResponse", () => {
    it("parses a fully healthy response", () => {
      const body = {
        status: "healthy",
        checks: {
          database: { status: "healthy", latencyMs: 5 },
          deepgram: { status: "configured" },
          llm: { status: "configured" },
          encryption: { status: "configured" },
        },
      };
      const results = parseHealthResponse(body);
      expect(results.every((r) => r.status === "pass")).toBe(true);
      expect(results).toHaveLength(5);
    });

    it("flags degraded status", () => {
      const body = {
        status: "degraded",
        checks: {
          database: { status: "unhealthy" },
          deepgram: { status: "configured" },
        },
      };
      const results = parseHealthResponse(body);
      const dbCheck = results.find((r) => r.name === "health-database");
      expect(dbCheck?.status).toBe("fail");
      const statusCheck = results.find((r) => r.name === "health-status");
      expect(statusCheck?.status).toBe("fail");
    });

    it("handles null/undefined body", () => {
      const results = parseHealthResponse(null);
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe("fail");
    });
  });

  // ── checkShaMatch ──────────────────────────────────────────────────────

  describe("checkShaMatch", () => {
    it("passes when HEAD matches expected", () => {
      const result = checkShaMatch("abc1234", "abc1234567890", null);
      expect(result.status).toBe("pass");
    });

    it("warns when origin matches but HEAD differs", () => {
      const result = checkShaMatch("abc1234", "def5678", "abc1234567890");
      expect(result.status).toBe("warn");
    });

    it("fails when neither matches", () => {
      const result = checkShaMatch("abc1234", "def5678", "ghi9012");
      expect(result.status).toBe("fail");
    });
  });

  // ── buildReport ────────────────────────────────────────────────────────

  describe("buildReport", () => {
    it("assembles a complete report", () => {
      const checks: CheckResult[] = [
        { name: "a", status: "pass", detail: "ok" },
      ];
      const report = buildReport(checks, "abc123", "def456");
      expect(report.verdict).toBe("PASS");
      expect(report.headSha).toBe("abc123");
      expect(report.originSha).toBe("def456");
      expect(report.blockers).toEqual([]);
      expect(report.timestamp).toBeTruthy();
    });
  });

  // ── formatReport ───────────────────────────────────────────────────────

  describe("formatReport", () => {
    it("includes verdict and next action in output", () => {
      const report = buildReport(
        [{ name: "test", status: "pass", detail: "all good" }],
        "abc123",
        null,
      );
      const output = formatReport(report);
      expect(output).toContain("PASS");
      expect(output).toContain("Ship it");
      expect(output).toContain("abc123");
      expect(output).toContain("[OK]");
    });

    it("shows blockers for FAIL verdict", () => {
      const report = buildReport(
        [{ name: "build", status: "fail", detail: "compilation error" }],
        "abc123",
        null,
      );
      const output = formatReport(report);
      expect(output).toContain("FAIL");
      expect(output).toContain("BLOCKERS");
      expect(output).toContain("compilation error");
      expect(output).toContain("[XX]");
    });
  });
});
