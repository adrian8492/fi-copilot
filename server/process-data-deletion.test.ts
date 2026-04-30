/**
 * Unit tests for the pure parts of scripts/process-data-deletion.ts.
 *
 * The DB-touching path is exercised through the deletion-related db.ts
 * functions in multi-tenant-isolation.test.ts and dataDeletion.test.ts.
 * Here we verify classification, arg parsing, and plan-line formatting.
 */

import { describe, it, expect } from "vitest";
import {
  classifyRequest,
  parseArgs,
  formatPlanLine,
  type DataDeletionRequestLike,
  type DeletionPlan,
} from "../scripts/process-data-deletion";

const baseReq: DataDeletionRequestLike = {
  id: 1,
  dealershipId: 10,
  customerId: null,
  sessionId: null,
  customerEmail: null,
  customerName: null,
  status: "pending",
  scheduledDeletionAt: new Date("2026-05-31T00:00:00Z"),
};

describe("classifyRequest", () => {
  it("returns 'session' when sessionId is set", () => {
    expect(classifyRequest({ ...baseReq, sessionId: 42 })).toBe("session");
  });

  it("returns 'session' when both sessionId and customerId are set (sessionId wins)", () => {
    expect(classifyRequest({ ...baseReq, sessionId: 42, customerId: 7 })).toBe("session");
  });

  it("returns 'customer' when only customerId is set", () => {
    expect(classifyRequest({ ...baseReq, customerId: 7 })).toBe("customer");
  });

  it("returns 'manual_review' when neither FK is set (text-only request)", () => {
    expect(
      classifyRequest({ ...baseReq, customerEmail: "x@y.com", customerName: "Jane Doe" }),
    ).toBe("manual_review");
  });
});

describe("parseArgs", () => {
  it("defaults to dry-run, asof now, limit 1000", () => {
    const args = parseArgs([]);
    expect(args.commit).toBe(false);
    expect(args.limit).toBe(1000);
    expect(args.asof).toBeInstanceOf(Date);
  });

  it("--commit sets commit=true", () => {
    expect(parseArgs(["--commit"]).commit).toBe(true);
  });

  it("--asof parses an ISO date", () => {
    const args = parseArgs(["--asof", "2026-05-31"]);
    expect(args.asof.toISOString().slice(0, 10)).toBe("2026-05-31");
  });

  it("--asof rejects garbage", () => {
    expect(() => parseArgs(["--asof", "not-a-date"])).toThrow();
  });

  it("--limit parses a positive integer", () => {
    expect(parseArgs(["--limit", "50"]).limit).toBe(50);
  });

  it("--limit rejects 0 or negative", () => {
    expect(() => parseArgs(["--limit", "0"])).toThrow();
    expect(() => parseArgs(["--limit", "-3"])).toThrow();
  });
});

describe("formatPlanLine", () => {
  const baseSessionPlan: DeletionPlan = {
    requestId: 1,
    dealershipId: 10,
    classification: "session",
    sessionIds: [42],
    customerId: null,
  };

  it("session classification shows session ids inline", () => {
    expect(formatPlanLine(baseSessionPlan)).toBe(
      "request=1 dealership=10 class=session sessions=1 (42)",
    );
  });

  it("truncates session id list past 5 entries", () => {
    const p: DeletionPlan = { ...baseSessionPlan, sessionIds: [1, 2, 3, 4, 5, 6, 7] };
    const out = formatPlanLine(p);
    expect(out).toContain("sessions=7 (1,2,3,4,5,…)");
  });

  it("customer classification includes customerId tag", () => {
    const p: DeletionPlan = {
      requestId: 2,
      dealershipId: 11,
      classification: "customer",
      sessionIds: [99, 100],
      customerId: 7,
    };
    expect(formatPlanLine(p)).toBe(
      "request=2 dealership=11 class=customer sessions=2 (99,100) customerId=7",
    );
  });

  it("manual_review classification includes the reason", () => {
    const p: DeletionPlan = {
      requestId: 3,
      dealershipId: 12,
      classification: "manual_review",
      sessionIds: [],
      customerId: null,
      reasonIfManual: "request has no sessionId or customerId",
    };
    expect(formatPlanLine(p)).toBe(
      `request=3 dealership=12 class=manual_review reason="request has no sessionId or customerId"`,
    );
  });

  it("manual_review without explicit reason falls back to default text", () => {
    const p: DeletionPlan = {
      requestId: 4,
      dealershipId: 13,
      classification: "manual_review",
      sessionIds: [],
      customerId: null,
    };
    expect(formatPlanLine(p)).toContain(`reason="no FK on request"`);
  });
});
