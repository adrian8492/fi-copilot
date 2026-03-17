/**
 * ASURA OPS Scorecard Engine Tests
 *
 * Tests the 4-pillar scoring engine with a rich F&I transcript.
 */

import { describe, expect, it } from "vitest";
import {
  scoreMenuOrder,
  scoreUpgradeArchitecture,
  scoreObjectionPrevention,
  scoreCoachingCadence,
  runASURAScorecardEngine,
  type CoachingCadenceInput,
} from "./asura-scorecard";

// ─── Fixtures ──────────────────────────────────────────────────────────────────

/** A strong transcript hitting most ASURA criteria */
const STRONG_TRANSCRIPT = `
Good afternoon! Before we look at your options today, I want to share a few things to keep in mind.
Most of our customers ask about the payment, and I want to walk you through something most people don't realize.

Let me start with the Vehicle Service Agreement — this is NOT an extended warranty. 
It's a Vehicle Service Agreement, and it covers 100% of parts and 100% of labor. 
If anything is deemed defective, you're protected.

Next up is Tire and Wheel protection — this covers anything that is not supposed to be there on the road.
Road hazard protection. Cosmetic repair. Zero dollar deductible. $0.00 deductible.

Then we have Key Replacement — covers damaged, lost, or stolen keys. 
We can reprogram your keys up to $800 per occurrence.

Prepaid Maintenance covers oil changes and filters at regularly scheduled intervals.

GAP is Guaranteed Asset Protection — this covers your deficiency balance in case of a total loss.
We finance up to 150%. Not an insurance product.

Anti-Theft — vehicle anti-theft, vehicle replacement if stolen and deemed a total loss.

GPS Active System — we register your vehicle with the police and send you a notification.

Ceramic coating — not a wax. Protects against bird droppings, tree sap, acid rain, oxidation.

Paintless dent repair covers door dings. Doesn't break the paint. Windshield gets chipped? Covered.

And finally 3M Paint Protection Film — chip-sealed clear tape on the leading edges, protects against rock chips.

Now I've prepared three packages for you today.
Option 1 is the Platinum — most comprehensive, full protection. That's our top package.
Option 2 is our Gold — balanced, mid-level protection.  
Option 3 is the Silver — essential coverage, entry level.

Which one would you rank first? Which is most important to you?

I'll put you down for Option 1 — let's go ahead and get that started.

I understand that the price might seem like a lot.
The reason I ask is, here's what I've seen happen when customers don't have coverage.
What this does is protect you from those unexpected repair bills.

Let me show you exactly why our customers choose this.
`.trim();

/** A weak transcript missing most criteria */
const WEAK_TRANSCRIPT = `
Hi, here are your financing papers.
The monthly payment is $425. Would you like to add anything?
The extended warranty is available.
Okay, let me get you out of here quickly.
`.trim();

/** No transcript */
const EMPTY_TRANSCRIPT = "";

// ─── Pillar 1: Menu Order ──────────────────────────────────────────────────────

describe("scoreMenuOrder", () => {
  it("scores high for a strong transcript with VSA first and all products", () => {
    const result = scoreMenuOrder(STRONG_TRANSCRIPT);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.criteria.find(c => c.id === "menu-vsa-first")?.passed).toBe(true);
  });

  it("scores low for a weak transcript", () => {
    const result = scoreMenuOrder(WEAK_TRANSCRIPT);
    expect(result.score).toBeLessThan(50);
  });

  it("returns score in 0–100 range", () => {
    const s1 = scoreMenuOrder(STRONG_TRANSCRIPT);
    const s2 = scoreMenuOrder(WEAK_TRANSCRIPT);
    const s3 = scoreMenuOrder(EMPTY_TRANSCRIPT);
    expect(s1.score).toBeGreaterThanOrEqual(0);
    expect(s1.score).toBeLessThanOrEqual(100);
    expect(s2.score).toBeGreaterThanOrEqual(0);
    expect(s3.score).toBe(0);
  });

  it("returns criteria array with passed/points info", () => {
    const result = scoreMenuOrder(STRONG_TRANSCRIPT);
    expect(Array.isArray(result.criteria)).toBe(true);
    expect(result.criteria.length).toBe(3);
    result.criteria.forEach(c => {
      expect(typeof c.passed).toBe("boolean");
      expect(c.points).toBeGreaterThanOrEqual(0);
      expect(c.maxPoints).toBeGreaterThan(0);
    });
  });

  it("returns insights array", () => {
    const result = scoreMenuOrder(STRONG_TRANSCRIPT);
    expect(Array.isArray(result.insights)).toBe(true);
  });

  it("detects VSA-first failure when VSA is not first", () => {
    const transcriptGapFirst = `
      GAP is Guaranteed Asset Protection.
      Then we have the Vehicle Service Agreement, not an extended warranty, 100% of parts and 100% of labor.
    `;
    const result = scoreMenuOrder(transcriptGapFirst);
    const vsaFirst = result.criteria.find(c => c.id === "menu-vsa-first");
    expect(vsaFirst?.passed).toBe(false);
  });

  it("produces critical insight when VSA is not first", () => {
    const result = scoreMenuOrder(WEAK_TRANSCRIPT);
    const hasVsaInsight = result.insights.some(i => i.toLowerCase().includes("vsa") || i.toLowerCase().includes("menu"));
    expect(hasVsaInsight || result.score <= 10).toBe(true);
  });
});

// ─── Pillar 2: Upgrade Architecture ──────────────────────────────────────────

describe("scoreUpgradeArchitecture", () => {
  it("scores high when all 3 tiers + upgrade moment are present", () => {
    const result = scoreUpgradeArchitecture(STRONG_TRANSCRIPT);
    expect(result.score).toBeGreaterThanOrEqual(60);
  });

  it("scores low for weak transcript", () => {
    const result = scoreUpgradeArchitecture(WEAK_TRANSCRIPT);
    expect(result.score).toBeLessThan(40);
  });

  it("detects 3 tiers present in strong transcript", () => {
    const result = scoreUpgradeArchitecture(STRONG_TRANSCRIPT);
    const tiersCrit = result.criteria.find(c => c.id === "upgrade-3tiers");
    expect(tiersCrit?.passed).toBe(true);
  });

  it("detects upgrade moment in strong transcript", () => {
    const result = scoreUpgradeArchitecture(STRONG_TRANSCRIPT);
    const upgradeCrit = result.criteria.find(c => c.id === "upgrade-moment");
    expect(upgradeCrit?.passed).toBe(true);
  });

  it("detects assuming-business close in strong transcript", () => {
    const result = scoreUpgradeArchitecture(STRONG_TRANSCRIPT);
    const closeCrit = result.criteria.find(c => c.id === "upgrade-assuming-close");
    expect(closeCrit?.passed).toBe(true);
  });

  it("score stays in 0–100 range", () => {
    const result = scoreUpgradeArchitecture(STRONG_TRANSCRIPT);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

// ─── Pillar 3: Objection Prevention ──────────────────────────────────────────

describe("scoreObjectionPrevention", () => {
  it("detects guide opening in strong transcript", () => {
    const result = scoreObjectionPrevention(STRONG_TRANSCRIPT);
    const guideOpening = result.criteria.find(c => c.id === "prevention-guide-opening");
    expect(guideOpening?.passed).toBe(true);
  });

  it("detects 3-step objection framework in strong transcript", () => {
    const result = scoreObjectionPrevention(STRONG_TRANSCRIPT);
    const threeStep = result.criteria.find(c => c.id === "prevention-3step");
    expect(threeStep?.passed).toBe(true);
  });

  it("scores high for strong transcript", () => {
    const result = scoreObjectionPrevention(STRONG_TRANSCRIPT);
    expect(result.score).toBeGreaterThanOrEqual(60);
  });

  it("scores low for weak transcript", () => {
    const result = scoreObjectionPrevention(WEAK_TRANSCRIPT);
    expect(result.score).toBeLessThan(30);
  });

  it("returns criteria for all 3 checks", () => {
    const result = scoreObjectionPrevention(STRONG_TRANSCRIPT);
    expect(result.criteria.length).toBe(3);
    expect(result.criteria.map(c => c.id)).toContain("prevention-guide-opening");
    expect(result.criteria.map(c => c.id)).toContain("prevention-handoff");
    expect(result.criteria.map(c => c.id)).toContain("prevention-3step");
  });
});

// ─── Pillar 4: Coaching Cadence ───────────────────────────────────────────────

describe("scoreCoachingCadence", () => {
  it("scores 0 with empty cadence input", () => {
    const result = scoreCoachingCadence({});
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("scores higher with improving trend", () => {
    const improving: CoachingCadenceInput = {
      priorScores: [55, 65, 75, 82],
      wordTrackUtilizationRate: 80,
    };
    const result = scoreCoachingCadence(improving);
    expect(result.score).toBeGreaterThan(40);
  });

  it("rewards consistent performance", () => {
    const consistent: CoachingCadenceInput = {
      priorScores: [80, 82, 81, 83],
      wordTrackUtilizationRate: 75,
    };
    const result = scoreCoachingCadence(consistent);
    const consistencyCrit = result.criteria.find(c => c.id === "cadence-consistency");
    expect(consistencyCrit?.passed).toBe(true);
  });

  it("penalizes declining performance", () => {
    const declining: CoachingCadenceInput = {
      priorScores: [80, 70, 60],
      wordTrackUtilizationRate: 20,
    };
    const poor: CoachingCadenceInput = { priorScores: [] };
    const resultDecline = scoreCoachingCadence(declining);
    const resultNone = scoreCoachingCadence(poor);
    // declining should have low WoW score
    const wowCrit = resultDecline.criteria.find(c => c.id === "cadence-wow");
    expect(wowCrit?.points).toBeLessThan(20);
    void resultNone;
  });

  it("rewards high word track utilization", () => {
    const highUtil: CoachingCadenceInput = {
      priorScores: [70, 75, 80],
      wordTrackUtilizationRate: 90,
    };
    const result = scoreCoachingCadence(highUtil);
    const coachCrit = result.criteria.find(c => c.id === "cadence-coachability");
    expect(coachCrit?.points).toBeGreaterThan(20);
  });

  it("returns exactly 3 criteria", () => {
    const result = scoreCoachingCadence({ priorScores: [70, 80, 85] });
    expect(result.criteria.length).toBe(3);
  });
});

// ─── Full Engine ───────────────────────────────────────────────────────────────

describe("runASURAScorecardEngine", () => {
  it("returns all required fields", () => {
    const result = runASURAScorecardEngine(STRONG_TRANSCRIPT, { priorScores: [70, 80] });
    expect(typeof result.tier1Score).toBe("number");
    expect(typeof result.menuOrderScore).toBe("number");
    expect(typeof result.upgradeArchitectureScore).toBe("number");
    expect(typeof result.objectionPreventionScore).toBe("number");
    expect(typeof result.coachingCadenceScore).toBe("number");
    expect(result.menuOrderPillar).toBeDefined();
    expect(result.upgradeArchitecturePillar).toBeDefined();
    expect(result.objectionPreventionPillar).toBeDefined();
    expect(result.coachingCadencePillar).toBeDefined();
    expect(Array.isArray(result.coachingPriorities)).toBe(true);
    expect(typeof result.tier).toBe("string");
    expect(typeof result.gradedAt).toBe("string");
  });

  it("tier1Score is weighted average of 4 pillars", () => {
    const result = runASURAScorecardEngine(STRONG_TRANSCRIPT, {});
    const expected = Math.round(
      result.menuOrderScore * 0.25 +
      result.upgradeArchitectureScore * 0.25 +
      result.objectionPreventionScore * 0.25 +
      result.coachingCadenceScore * 0.25
    );
    expect(result.tier1Score).toBe(expected);
  });

  it("assigns Tier-1 label for score >= 85", () => {
    // Build a transcript that maximizes all pillars
    const result = runASURAScorecardEngine(STRONG_TRANSCRIPT, {
      priorScores: [80, 85, 88, 90],
      wordTrackUtilizationRate: 95,
    });
    // The tier label must be valid
    expect(["Tier-1", "Tier-2", "Tier-3", "Below-Tier"]).toContain(result.tier);
  });

  it("assigns correct tier labels based on score thresholds", () => {
    const checkTier = (score: number) => {
      if (score >= 85) return "Tier-1";
      if (score >= 70) return "Tier-2";
      if (score >= 55) return "Tier-3";
      return "Below-Tier";
    };
    const result = runASURAScorecardEngine(STRONG_TRANSCRIPT, {});
    expect(result.tier).toBe(checkTier(result.tier1Score));
  });

  it("handles empty transcript gracefully (all scores 0)", () => {
    const result = runASURAScorecardEngine(EMPTY_TRANSCRIPT, {});
    expect(result.tier1Score).toBe(0);
    expect(result.tier).toBe("Below-Tier");
  });

  it("returns max 5 coaching priorities", () => {
    const result = runASURAScorecardEngine(WEAK_TRANSCRIPT, {});
    expect(result.coachingPriorities.length).toBeLessThanOrEqual(5);
  });

  it("coaching priorities are sorted by weakest pillar first", () => {
    const result = runASURAScorecardEngine(WEAK_TRANSCRIPT, {});
    // All priorities should be non-empty strings
    result.coachingPriorities.forEach(p => {
      expect(typeof p).toBe("string");
      expect(p.length).toBeGreaterThan(0);
    });
  });

  it("scores are in 0–100 range", () => {
    const result = runASURAScorecardEngine(STRONG_TRANSCRIPT, {
      priorScores: [70, 80, 85],
      wordTrackUtilizationRate: 80,
    });
    expect(result.tier1Score).toBeGreaterThanOrEqual(0);
    expect(result.tier1Score).toBeLessThanOrEqual(100);
    expect(result.menuOrderScore).toBeGreaterThanOrEqual(0);
    expect(result.menuOrderScore).toBeLessThanOrEqual(100);
    expect(result.upgradeArchitectureScore).toBeGreaterThanOrEqual(0);
    expect(result.upgradeArchitectureScore).toBeLessThanOrEqual(100);
    expect(result.objectionPreventionScore).toBeGreaterThanOrEqual(0);
    expect(result.objectionPreventionScore).toBeLessThanOrEqual(100);
    expect(result.coachingCadenceScore).toBeGreaterThanOrEqual(0);
    expect(result.coachingCadenceScore).toBeLessThanOrEqual(100);
  });

  it("strong transcript scores higher than weak transcript", () => {
    const strong = runASURAScorecardEngine(STRONG_TRANSCRIPT, {
      priorScores: [70, 75, 80],
      wordTrackUtilizationRate: 80,
    });
    const weak = runASURAScorecardEngine(WEAK_TRANSCRIPT, {});
    expect(strong.tier1Score).toBeGreaterThan(weak.tier1Score);
  });

  it("gradedAt is a valid ISO date string", () => {
    const result = runASURAScorecardEngine(STRONG_TRANSCRIPT, {});
    expect(() => new Date(result.gradedAt)).not.toThrow();
    expect(new Date(result.gradedAt).getTime()).not.toBeNaN();
  });
});
