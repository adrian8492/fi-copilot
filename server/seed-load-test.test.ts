/**
 * Load-test seed unit tests — Phase 4
 *
 * Cover the deterministic generator + per-tenant rollup. The script's main()
 * itself (DB write loop) is gated by --commit and tested in integration.
 */

import { describe, it, expect } from "vitest";
import {
  generateDeals,
  summarizeByTenant,
  parseArgs,
} from "../scripts/seed-load-test";

describe("generateDeals", () => {
  it("emits exactly `count` deals", () => {
    const deals = generateDeals({ count: 100, tenantCount: 5, seed: 42 });
    expect(deals).toHaveLength(100);
  });

  it("spreads deals across all tenants for the default size", () => {
    const deals = generateDeals({ count: 1000, tenantCount: 5, seed: 42 });
    const tenants = new Set(deals.map((d) => d.tenantId));
    expect(tenants.size).toBe(5);
  });

  it("is deterministic for a given seed", () => {
    const a = generateDeals({ count: 50, tenantCount: 3, seed: 7 });
    const b = generateDeals({ count: 50, tenantCount: 3, seed: 7 });
    expect(a).toEqual(b);
  });

  it("produces different output for different seeds", () => {
    const a = generateDeals({ count: 50, tenantCount: 3, seed: 7 });
    const b = generateDeals({ count: 50, tenantCount: 3, seed: 8 });
    // At least one differing field across the two arrays.
    const differs = a.some((d, i) => d.dealNumber !== b[i].dealNumber || d.pru !== b[i].pru);
    expect(differs).toBe(true);
  });

  it("dealNumbers are unique across the run", () => {
    const deals = generateDeals({ count: 1000, tenantCount: 5, seed: 1 });
    const numbers = new Set(deals.map((d) => d.dealNumber));
    expect(numbers.size).toBe(1000);
  });

  it("each manager is scoped to exactly one tenant (no cross-tenant managers)", () => {
    const deals = generateDeals({ count: 500, tenantCount: 4, managersPerTenant: 5, seed: 1 });
    const managerToTenant = new Map<number, number>();
    for (const d of deals) {
      const seen = managerToTenant.get(d.managerId);
      if (seen === undefined) managerToTenant.set(d.managerId, d.tenantId);
      else expect(seen).toBe(d.tenantId); // same manager always tied to same tenant
    }
  });

  it("PRU values land in a realistic range (1,400 - 4,200)", () => {
    const deals = generateDeals({ count: 1000, tenantCount: 5, seed: 42 });
    for (const d of deals) {
      expect(d.pru).toBeGreaterThanOrEqual(1400);
      expect(d.pru).toBeLessThanOrEqual(4200);
    }
  });

  it("deal dates fall within the rolling daysWindow before endDate", () => {
    const end = new Date("2026-04-25T00:00:00Z");
    const deals = generateDeals({ count: 200, tenantCount: 3, seed: 9, endDate: end, daysWindow: 30 });
    const earliest = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    for (const d of deals) {
      expect(d.dealDate.getTime()).toBeGreaterThanOrEqual(earliest.getTime());
      expect(d.dealDate.getTime()).toBeLessThanOrEqual(end.getTime());
    }
  });
});

describe("summarizeByTenant", () => {
  it("returns one entry per tenant with correct counts and averages", () => {
    const deals = [
      { tenantId: 1, pru: 1500 } as never,
      { tenantId: 1, pru: 2500 } as never,
      { tenantId: 2, pru: 2000 } as never,
    ];
    const summary = summarizeByTenant(deals);
    expect(summary.get(1)).toEqual({ count: 2, avgPru: 2000 });
    expect(summary.get(2)).toEqual({ count: 1, avgPru: 2000 });
  });

  it("handles empty input", () => {
    expect(summarizeByTenant([]).size).toBe(0);
  });
});

describe("parseArgs", () => {
  it("defaults to 1000 deals × 5 tenants, dry-run", () => {
    expect(parseArgs([])).toEqual({ count: 1000, tenantCount: 5, commit: false, seed: undefined });
  });

  it("accepts --count, --tenants, --commit, --seed", () => {
    expect(parseArgs(["--count", "200", "--tenants", "3", "--commit", "--seed", "9"])).toEqual({
      count: 200,
      tenantCount: 3,
      commit: true,
      seed: 9,
    });
  });

  it("rejects non-positive count or tenants", () => {
    expect(() => parseArgs(["--count", "0"])).toThrow();
    expect(() => parseArgs(["--tenants", "-3"])).toThrow();
  });
});
