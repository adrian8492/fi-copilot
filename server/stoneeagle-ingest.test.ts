/**
 * StoneEagle ingest tests — Phase 3b
 *
 * Cover the three units that matter most:
 *   1. CSV parser (handles BOM, CRLF, quoted fields with embedded commas, escaped quotes)
 *   2. Row mapper (skips required-field rejections, parses currency/booleans tolerantly)
 *   3. ingestDeals (idempotency, missing user, cross-tenant manager, dry-run)
 */

import { describe, it, expect, vi } from "vitest";
import {
  parseCsv,
  mapRow,
  ingestDeals,
  parseArgs,
  type StoneEagleDeal,
} from "../scripts/stoneeagle-ingest";

// ─── parseCsv ─────────────────────────────────────────────────────────────────

describe("parseCsv", () => {
  it("returns rows keyed by lowercase headers", () => {
    const text = `Deal_ID,Deal_Date,Manager_Email\nD-1,2026-04-24,sarah@korum.com`;
    const rows = parseCsv(text);
    expect(rows).toEqual([{ deal_id: "D-1", deal_date: "2026-04-24", manager_email: "sarah@korum.com" }]);
  });

  it("strips BOM and tolerates CRLF line endings", () => {
    const text = `\uFEFFa,b\r\n1,2\r\n3,4`;
    const rows = parseCsv(text);
    expect(rows).toEqual([{ a: "1", b: "2" }, { a: "3", b: "4" }]);
  });

  it("handles quoted fields with embedded commas", () => {
    const text = `name,address\n"Smith, Jane","123 Main St, Apt 4"`;
    const rows = parseCsv(text);
    expect(rows[0]).toEqual({ name: "Smith, Jane", address: "123 Main St, Apt 4" });
  });

  it("handles escaped double quotes (\"\") inside fields", () => {
    const text = `a,b\n"He said ""hi""","ok"`;
    const rows = parseCsv(text);
    expect(rows[0].a).toBe('He said "hi"');
  });

  it("returns empty array for empty input", () => {
    expect(parseCsv("")).toEqual([]);
    expect(parseCsv("just,headers")).toEqual([]);
  });

  it("ignores blank lines mid-file", () => {
    const text = `a,b\n1,2\n\n3,4\n`;
    const rows = parseCsv(text);
    expect(rows).toHaveLength(2);
  });
});

// ─── mapRow ───────────────────────────────────────────────────────────────────

describe("mapRow", () => {
  it("returns null when required fields missing", () => {
    expect(mapRow({})).toBeNull();
    expect(mapRow({ deal_id: "D-1" })).toBeNull();
    expect(mapRow({ deal_id: "D-1", deal_date: "2026-04-24" })).toBeNull();
  });

  it("returns null on unparseable date", () => {
    expect(mapRow({ deal_id: "D-1", deal_date: "not-a-date", manager_email: "x@y.com" })).toBeNull();
  });

  it("parses required fields and lowercases email", () => {
    const d = mapRow({
      deal_id: "D-1",
      deal_date: "2026-04-24",
      manager_email: "Sarah@Korum.COM",
    });
    expect(d?.dealId).toBe("D-1");
    expect(d?.managerEmail).toBe("sarah@korum.com");
    expect(d?.dealDate.toISOString().startsWith("2026-04-24")).toBe(true);
  });

  it("parses currency strings ($1,850.50) tolerantly", () => {
    const d = mapRow({
      deal_id: "D-1",
      deal_date: "2026-04-24",
      manager_email: "x@y.com",
      pru: "$1,850.50",
      sale_price: "$32,995",
      front_gross: "1,200",
    });
    expect(d?.pru).toBe(1850.5);
    expect(d?.salePrice).toBe(32995);
    expect(d?.frontGross).toBe(1200);
  });

  it("parses booleans across Y/N, 1/0, true/false (case-insensitive)", () => {
    const d = mapRow({
      deal_id: "D-1",
      deal_date: "2026-04-24",
      manager_email: "x@y.com",
      vsa: "Y",
      gap: "no",
      appearance: "1",
      tire_wheel: "FALSE",
      key_replacement: "true",
      maintenance: "",
    });
    expect(d?.vsaSold).toBe(true);
    expect(d?.gapSold).toBe(false);
    expect(d?.appearanceSold).toBe(true);
    expect(d?.tireWheelSold).toBe(false);
    expect(d?.keyReplacementSold).toBe(true);
    expect(d?.maintenanceSold).toBeNull();
  });

  it("treats blank optional numerics as null", () => {
    const d = mapRow({
      deal_id: "D-1",
      deal_date: "2026-04-24",
      manager_email: "x@y.com",
      pru: "",
      sale_price: "",
    });
    expect(d?.pru).toBeNull();
    expect(d?.salePrice).toBeNull();
  });
});

// ─── parseArgs ────────────────────────────────────────────────────────────────

describe("parseArgs", () => {
  it("parses positional csv path + --dealership flag", () => {
    expect(parseArgs(["data.csv", "--dealership", "42"])).toEqual({
      csvPath: "data.csv",
      dealershipId: 42,
      dryRun: false,
    });
  });

  it("accepts --dry-run", () => {
    expect(parseArgs(["data.csv", "--dealership", "42", "--dry-run"]).dryRun).toBe(true);
  });

  it("accepts -d shorthand", () => {
    expect(parseArgs(["-d", "7", "data.csv"]).dealershipId).toBe(7);
  });

  it("throws on missing required args", () => {
    expect(() => parseArgs([])).toThrow();
    expect(() => parseArgs(["data.csv"])).toThrow();
    expect(() => parseArgs(["--dealership", "42"])).toThrow();
  });
});

// ─── ingestDeals ──────────────────────────────────────────────────────────────

const STORE_A = 100;
const STORE_B = 200;

function makeDeal(overrides: Partial<StoneEagleDeal> = {}): StoneEagleDeal {
  return {
    dealId: "D-1",
    dealDate: new Date("2026-04-24"),
    managerEmail: "sarah@korum.com",
    managerName: null,
    vin: null, vehicleYear: null, vehicleMake: null, vehicleModel: null,
    salePrice: null, tradeValue: null, amountFinanced: null,
    apr: null, termMonths: null, monthlyPayment: null,
    pru: 1850, frontGross: null, backGross: null,
    productsCount: 3,
    vsaSold: true, gapSold: true, appearanceSold: false,
    tireWheelSold: null, keyReplacementSold: null, maintenanceSold: null,
    ...overrides,
  };
}

describe("ingestDeals", () => {
  it("inserts new deals and returns counts", async () => {
    const deps = {
      findSessionByDealNumber: vi.fn().mockResolvedValue(null),
      createSession: vi.fn().mockResolvedValue({ id: 1 }),
      getUserByEmail: vi.fn().mockResolvedValue({ id: 5, dealershipId: STORE_A }),
    };
    const summary = await ingestDeals([makeDeal(), makeDeal({ dealId: "D-2" })], STORE_A, deps);
    expect(summary.inserted).toBe(2);
    expect(summary.skipped).toBe(0);
    expect(deps.createSession).toHaveBeenCalledTimes(2);
    expect(deps.createSession).toHaveBeenCalledWith(expect.objectContaining({
      dealershipId: STORE_A,
      dealNumber: "D-1",
      userId: 5,
    }));
  });

  it("skips deals that already exist (idempotent)", async () => {
    const deps = {
      findSessionByDealNumber: vi.fn().mockResolvedValueOnce({ id: 99 }).mockResolvedValueOnce(null),
      createSession: vi.fn().mockResolvedValue({ id: 1 }),
      getUserByEmail: vi.fn().mockResolvedValue({ id: 5, dealershipId: STORE_A }),
    };
    const summary = await ingestDeals([makeDeal(), makeDeal({ dealId: "D-2" })], STORE_A, deps);
    expect(summary.inserted).toBe(1);
    expect(summary.skipped).toBe(1);
    expect(deps.createSession).toHaveBeenCalledTimes(1);
  });

  it("records an error for unknown manager email", async () => {
    const deps = {
      findSessionByDealNumber: vi.fn().mockResolvedValue(null),
      createSession: vi.fn(),
      getUserByEmail: vi.fn().mockResolvedValue(null),
    };
    const summary = await ingestDeals([makeDeal()], STORE_A, deps);
    expect(summary.inserted).toBe(0);
    expect(summary.errors).toHaveLength(1);
    expect(summary.errors[0].reason).toContain("no user");
    expect(deps.createSession).not.toHaveBeenCalled();
  });

  it("refuses to attribute a deal to a manager from another dealership (fail-closed)", async () => {
    const deps = {
      findSessionByDealNumber: vi.fn().mockResolvedValue(null),
      createSession: vi.fn(),
      // Manager email matches but they belong to STORE_B, not STORE_A.
      getUserByEmail: vi.fn().mockResolvedValue({ id: 7, dealershipId: STORE_B }),
    };
    const summary = await ingestDeals([makeDeal()], STORE_A, deps);
    expect(summary.inserted).toBe(0);
    expect(summary.errors[0].reason).toContain("different dealership");
    expect(deps.createSession).not.toHaveBeenCalled();
  });

  it("dry-run counts what WOULD be inserted but does not call createSession", async () => {
    const deps = {
      findSessionByDealNumber: vi.fn().mockResolvedValue(null),
      createSession: vi.fn(),
      getUserByEmail: vi.fn().mockResolvedValue({ id: 5, dealershipId: STORE_A }),
    };
    const summary = await ingestDeals([makeDeal(), makeDeal({ dealId: "D-2" })], STORE_A, deps, { dryRun: true });
    expect(summary.inserted).toBe(2);
    expect(deps.createSession).not.toHaveBeenCalled();
  });

  it("continues past per-row exceptions and logs them in errors", async () => {
    const deps = {
      findSessionByDealNumber: vi.fn().mockResolvedValue(null),
      createSession: vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce({ id: 1 }),
      getUserByEmail: vi.fn().mockResolvedValue({ id: 5, dealershipId: STORE_A }),
    };
    const summary = await ingestDeals([makeDeal(), makeDeal({ dealId: "D-2" })], STORE_A, deps);
    expect(summary.inserted).toBe(1);
    expect(summary.errors).toHaveLength(1);
    expect(summary.errors[0].reason).toBe("boom");
  });
});
