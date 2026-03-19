import { describe, it, expect } from "vitest";
import {
  PRODUCT_DATABASE,
  getProductByType,
  getProductsByCategory,
  getProductDisplayName,
} from "../shared/productIntelligence";
import {
  detectMentionedProducts,
  assessPresentationQuality,
  generateRecommendations,
  calculateMissedRevenue,
} from "./product-recommendation";

// ─── Product Database Tests ───────────────────────────────────────────────────

describe("Product Intelligence Database", () => {
  it("contains exactly 9 F&I products", () => {
    expect(PRODUCT_DATABASE).toHaveLength(9);
  });

  it("has all required product types", () => {
    const types = PRODUCT_DATABASE.map((p) => p.productType);
    expect(types).toContain("vehicle_service_contract");
    expect(types).toContain("gap_insurance");
    expect(types).toContain("tire_wheel");
    expect(types).toContain("key_replacement");
    expect(types).toContain("prepaid_maintenance");
    expect(types).toContain("interior_exterior_protection");
    expect(types).toContain("windshield_protection");
    expect(types).toContain("window_tint");
    expect(types).toContain("theft_protection");
  });

  it("every product has all required fields populated", () => {
    for (const product of PRODUCT_DATABASE) {
      expect(product.displayName).toBeTruthy();
      expect(["Protection", "Appearance", "Security"]).toContain(product.category);
      expect(product.costRange.min).toBeGreaterThan(0);
      expect(product.costRange.max).toBeGreaterThan(product.costRange.min);
      expect(product.dealerCost).toBeGreaterThan(0);
      expect(product.commission.description).toBeTruthy();
      expect(product.commonObjections.length).toBeGreaterThan(0);
      expect(product.asuraTalkTracks.length).toBeGreaterThan(0);
      expect(product.stateRestrictions.length).toBeGreaterThan(0);
      expect(product.upsellRelationships.length).toBeGreaterThan(0);
      expect(product.transcriptKeywords.length).toBeGreaterThan(0);
      expect(product.avgCloseRate).toBeGreaterThan(0);
      expect(product.avgCloseRate).toBeLessThanOrEqual(1);
      expect(product.avgProfit).toBeGreaterThan(0);
    }
  });

  it("getProductByType returns correct product", () => {
    const vsa = getProductByType("vehicle_service_contract");
    expect(vsa).toBeDefined();
    expect(vsa!.displayName).toBe("Vehicle Service Agreement (VSA)");
    expect(vsa!.category).toBe("Protection");
  });

  it("getProductByType returns undefined for unknown type", () => {
    expect(getProductByType("nonexistent")).toBeUndefined();
  });

  it("getProductsByCategory filters correctly", () => {
    const protection = getProductsByCategory("Protection");
    expect(protection.length).toBeGreaterThan(0);
    expect(protection.every((p) => p.category === "Protection")).toBe(true);

    const appearance = getProductsByCategory("Appearance");
    expect(appearance.length).toBeGreaterThan(0);
    expect(appearance.every((p) => p.category === "Appearance")).toBe(true);

    const security = getProductsByCategory("Security");
    expect(security.length).toBeGreaterThan(0);
    expect(security.every((p) => p.category === "Security")).toBe(true);
  });

  it("getProductDisplayName returns display name or falls back to type", () => {
    expect(getProductDisplayName("gap_insurance")).toBe("GAP Insurance");
    expect(getProductDisplayName("unknown_type")).toBe("unknown_type");
  });

  it("upsell relationships reference valid product types", () => {
    const allTypes = PRODUCT_DATABASE.map((p) => p.productType);
    for (const product of PRODUCT_DATABASE) {
      for (const upsell of product.upsellRelationships) {
        expect(allTypes).toContain(upsell);
      }
    }
  });

  it("dealer cost is less than cost range min for all products", () => {
    for (const product of PRODUCT_DATABASE) {
      expect(product.dealerCost).toBeLessThan(product.costRange.min);
    }
  });
});

// ─── Recommendation Engine Tests ──────────────────────────────────────────────

describe("detectMentionedProducts", () => {
  it("detects VSA when transcript mentions service contract", () => {
    const lines = [
      { speaker: "manager", text: "Let me tell you about our Vehicle Service Agreement." },
      { speaker: "customer", text: "What does that cover?" },
    ];
    const results = detectMentionedProducts(lines);
    const vsa = results.get("vehicle_service_contract")!;
    expect(vsa.mentioned).toBe(true);
    expect(vsa.mentionCount).toBeGreaterThan(0);
  });

  it("detects GAP insurance when mentioned", () => {
    const lines = [
      { speaker: "manager", text: "GAP insurance covers the difference between what you owe and what insurance pays." },
    ];
    const results = detectMentionedProducts(lines);
    expect(results.get("gap_insurance")!.mentioned).toBe(true);
  });

  it("does not detect products when not mentioned", () => {
    const lines = [
      { speaker: "manager", text: "Welcome, let me walk you through the paperwork." },
      { speaker: "customer", text: "Sounds good." },
    ];
    const results = detectMentionedProducts(lines);
    expect(results.get("vehicle_service_contract")!.mentioned).toBe(false);
    expect(results.get("gap_insurance")!.mentioned).toBe(false);
  });

  it("detects multiple products in same transcript", () => {
    const lines = [
      { speaker: "manager", text: "Let's talk about your GAP protection and tire and wheel coverage." },
      { speaker: "manager", text: "We also have a windshield protection plan." },
    ];
    const results = detectMentionedProducts(lines);
    expect(results.get("gap_insurance")!.mentioned).toBe(true);
    expect(results.get("tire_wheel")!.mentioned).toBe(true);
    expect(results.get("windshield_protection")!.mentioned).toBe(true);
  });
});

describe("assessPresentationQuality", () => {
  const vsa = getProductByType("vehicle_service_contract")!;

  it("gives higher score when manager presents benefits", () => {
    const weakPresentation = [
      { speaker: "manager", text: "We have a service contract available." },
    ];
    const strongPresentation = [
      { speaker: "manager", text: "This service contract protects your investment and covers mechanical breakdown. The coverage saves you money — it's only $45 per month and most customers choose to include it." },
    ];
    const weakScore = assessPresentationQuality(vsa, weakPresentation);
    const strongScore = assessPresentationQuality(vsa, strongPresentation);
    expect(strongScore).toBeGreaterThan(weakScore);
  });

  it("awards points for objection handling", () => {
    const withHandling = [
      { speaker: "manager", text: "Let me tell you about our service contract coverage." },
      { speaker: "customer", text: "I don't need that, it's too expensive." },
      { speaker: "manager", text: "I understand. Let me show you — most customers find the value here." },
    ];
    const withoutHandling = [
      { speaker: "manager", text: "Let me tell you about our service contract coverage." },
      { speaker: "customer", text: "I don't need that, it's too expensive." },
      { speaker: "manager", text: "Okay, no problem." },
    ];
    const handledScore = assessPresentationQuality(vsa, withHandling);
    const unhandledScore = assessPresentationQuality(vsa, withoutHandling);
    expect(handledScore).toBeGreaterThan(unhandledScore);
  });
});

describe("generateRecommendations", () => {
  it("returns recommendations for all products when transcript is empty", () => {
    const recs = generateRecommendations([]);
    expect(recs).toHaveLength(9);
    expect(recs.every((r) => r.status === "missed")).toBe(true);
  });

  it("returns fewer recommendations when products are well-presented", () => {
    const lines = [
      { speaker: "manager", text: "Let me walk you through the Vehicle Service Agreement. This coverage protects your investment against mechanical breakdown. It saves you $1,200 per repair on average and it's only $45 per month. Most customers choose to include this standard protection." },
      { speaker: "customer", text: "That sounds good." },
      { speaker: "manager", text: "Great. Now let's talk about GAP insurance — Guaranteed Asset Protection. This covers the gap between what insurance pays and what you owe. It protects your investment and saves you thousands if the vehicle is totaled. Only $25 per month." },
      { speaker: "customer", text: "OK." },
    ];
    const recs = generateRecommendations(lines);
    // VSA and GAP should NOT appear as missed
    const missed = recs.filter((r) => r.status === "missed");
    const vsaMissed = missed.find((r) => r.productType === "vehicle_service_contract");
    const gapMissed = missed.find((r) => r.productType === "gap_insurance");
    expect(vsaMissed).toBeUndefined();
    expect(gapMissed).toBeUndefined();
    // Some products should still be missed
    expect(missed.length).toBeGreaterThan(0);
  });

  it("assigns priority numbers sequentially", () => {
    const recs = generateRecommendations([]);
    const priorities = recs.map((r) => r.priority);
    expect(priorities).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("sorts missed products before improve products", () => {
    const lines = [
      { speaker: "manager", text: "We have a service contract." }, // weak presentation → improve
    ];
    const recs = generateRecommendations(lines);
    const firstImproveIdx = recs.findIndex((r) => r.status === "improve");
    const lastMissedIdx = recs.reduce(
      (last, r, i) => (r.status === "missed" ? i : last),
      -1,
    );
    if (firstImproveIdx >= 0 && lastMissedIdx >= 0) {
      expect(lastMissedIdx).toBeLessThan(firstImproveIdx);
    }
  });
});

describe("calculateMissedRevenue", () => {
  it("sums potential profit from all recommendations", () => {
    const recs = generateRecommendations([]);
    const total = calculateMissedRevenue(recs);
    const expected = PRODUCT_DATABASE.reduce((sum, p) => sum + p.avgProfit, 0);
    expect(total).toBe(expected);
  });

  it("returns 0 for empty recommendations", () => {
    expect(calculateMissedRevenue([])).toBe(0);
  });
});
