/**
 * Phase 6 issue 3b — pricing-model math.
 *
 * computeRetailPrice() is the canonical price-derivation function used by
 * upsertProductMenuItem. fixed_retail just round-trips the user-entered
 * retailPrice; cost_plus computes retailPrice from cost + markup so reads
 * everywhere see a consistent final number.
 */

import { describe, it, expect } from "vitest";
import { computeRetailPrice } from "./db";

describe("computeRetailPrice — fixed_retail", () => {
  it("returns the entered retailPrice when pricingModel is fixed_retail", () => {
    expect(computeRetailPrice({ pricingModel: "fixed_retail", retailPrice: 2400 })).toBe(2400);
  });

  it("defaults to fixed_retail when pricingModel is undefined (back-compat)", () => {
    expect(computeRetailPrice({ retailPrice: 1800 })).toBe(1800);
  });

  it("returns null when fixed_retail and no retailPrice supplied", () => {
    expect(computeRetailPrice({ pricingModel: "fixed_retail" })).toBeNull();
  });
});

describe("computeRetailPrice — cost_plus, dollar markup", () => {
  it("returns cost + markup", () => {
    expect(computeRetailPrice({
      pricingModel: "cost_plus",
      costToDealer: 350,
      markupAmount: 450,
      markupType: "dollar",
    })).toBe(800);
  });

  it("defaults markupType to dollar when omitted (more conservative interpretation)", () => {
    expect(computeRetailPrice({
      pricingModel: "cost_plus",
      costToDealer: 100,
      markupAmount: 25,
    })).toBe(125);
  });

  it("treats null cost or markup as zero (won't crash on bad input)", () => {
    expect(computeRetailPrice({
      pricingModel: "cost_plus",
      costToDealer: null,
      markupAmount: 100,
      markupType: "dollar",
    })).toBe(100);
    expect(computeRetailPrice({
      pricingModel: "cost_plus",
      costToDealer: 200,
      markupAmount: null,
      markupType: "dollar",
    })).toBe(200);
  });
});

describe("computeRetailPrice — cost_plus, percent markup", () => {
  it("100% markup doubles the cost", () => {
    expect(computeRetailPrice({
      pricingModel: "cost_plus",
      costToDealer: 250,
      markupAmount: 100,
      markupType: "percent",
    })).toBe(500);
  });

  it("50% markup adds half", () => {
    expect(computeRetailPrice({
      pricingModel: "cost_plus",
      costToDealer: 400,
      markupAmount: 50,
      markupType: "percent",
    })).toBe(600);
  });

  it("rounds to two decimals", () => {
    // 333.33 * 1.155 = 384.99... should land on 384.99 or 385 (rounded to 2dp)
    expect(computeRetailPrice({
      pricingModel: "cost_plus",
      costToDealer: 333.33,
      markupAmount: 15.5,
      markupType: "percent",
    })).toBeCloseTo(384.99, 1);
  });

  it("zero markup percent returns the cost itself", () => {
    expect(computeRetailPrice({
      pricingModel: "cost_plus",
      costToDealer: 800,
      markupAmount: 0,
      markupType: "percent",
    })).toBe(800);
  });
});
