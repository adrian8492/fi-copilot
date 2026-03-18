/**
 * Stage Detector Tests
 * Tests for the ASURA 6-step stage detection engine.
 */

import { describe, expect, it } from "vitest";
import {
  detectAsuraStep,
  computeExecutionScore,
  detectComplianceRisks,
  ASURA_STEPS,
  SCRIPT_SUGGESTIONS,
  COMPLIANCE_RISK_PHRASES,
  MENU_ORDER_REMINDER,
  type AsuraStep,
} from "./stage-detector";

// ─── ASURA_STEPS ──────────────────────────────────────────────────────────────

describe("ASURA_STEPS", () => {
  it("has exactly 6 steps", () => {
    expect(Object.keys(ASURA_STEPS).length).toBe(6);
  });

  it("each step has a label and description", () => {
    ([1, 2, 3, 4, 5, 6] as AsuraStep[]).forEach((step) => {
      expect(ASURA_STEPS[step].label).toBeTruthy();
      expect(ASURA_STEPS[step].description).toBeTruthy();
    });
  });

  it("step 1 is Connection", () => {
    expect(ASURA_STEPS[1].label).toBe("Connection");
  });

  it("step 2 is Situation Awareness", () => {
    expect(ASURA_STEPS[2].label).toBe("Situation Awareness");
  });

  it("step 4 is Solution", () => {
    expect(ASURA_STEPS[4].label).toBe("Solution");
  });

  it("step 6 is Pillars", () => {
    expect(ASURA_STEPS[6].label).toBe("Pillars");
  });
});

// ─── SCRIPT_SUGGESTIONS ───────────────────────────────────────────────────────

describe("SCRIPT_SUGGESTIONS", () => {
  it("has a suggestion for each of the 6 steps", () => {
    ([1, 2, 3, 4, 5, 6] as AsuraStep[]).forEach((step) => {
      expect(SCRIPT_SUGGESTIONS[step]).toBeTruthy();
      expect(SCRIPT_SUGGESTIONS[step].length).toBeGreaterThan(20);
    });
  });

  it("step 2 suggestion mentions scale of 1-10", () => {
    expect(SCRIPT_SUGGESTIONS[2]).toMatch(/scale/i);
  });

  it("step 3 suggestion mentions factory warranty", () => {
    expect(SCRIPT_SUGGESTIONS[3]).toMatch(/warranty/i);
  });

  it("step 5 suggestion mentions out of pocket", () => {
    expect(SCRIPT_SUGGESTIONS[5]).toMatch(/out of pocket/i);
  });
});

// ─── MENU_ORDER_REMINDER ──────────────────────────────────────────────────────

describe("MENU_ORDER_REMINDER", () => {
  it("is defined and non-empty", () => {
    expect(MENU_ORDER_REMINDER).toBeTruthy();
    expect(MENU_ORDER_REMINDER.length).toBeGreaterThan(10);
  });

  it("mentions VSC first", () => {
    expect(MENU_ORDER_REMINDER.indexOf("VSC")).toBeLessThan(MENU_ORDER_REMINDER.indexOf("GAP"));
  });
});

// ─── detectAsuraStep ──────────────────────────────────────────────────────────

describe("detectAsuraStep", () => {
  it("detects Step 1 from greeting language", () => {
    const result = detectAsuraStep("Good afternoon! Welcome to the finance office. My name is John.");
    expect(result.step).toBe(1);
    expect(result.label).toBe("Connection");
    expect(result.confidence).toMatch(/high|medium/);
  });

  it("detects Step 2 from scale of 1-10 survey", () => {
    const result = detectAsuraStep("On a scale of 1-10, how important is it that your vehicle expenses stay predictable?");
    expect(result.step).toBe(2);
    expect(result.label).toBe("Situation Awareness");
  });

  it("detects Step 2 from retail delivery worksheet language", () => {
    const result = detectAsuraStep("Let me pull up the retail delivery preparation worksheet for you.");
    expect(result.step).toBe(2);
  });

  it("detects Step 3 from factory warranty discussion", () => {
    const result = detectAsuraStep("What is your understanding of the factory warranty? Most people think they're fully covered.");
    expect(result.step).toBe(3);
    expect(result.label).toBe("Problem Awareness");
  });

  it("detects Step 3 from warranty expiry language", () => {
    const result = detectAsuraStep("Your manufacturer warranty expires at 36,000 miles or 3 years. After that, you have no coverage.");
    expect(result.step).toBe(3);
  });

  it("detects Step 4 from VSC mention", () => {
    const result = detectAsuraStep("Let me walk you through the Vehicle Service Contract. This is NOT an extended warranty.");
    expect(result.step).toBe(4);
    expect(result.label).toBe("Solution");
  });

  it("detects Step 4 from menu presentation", () => {
    const result = detectAsuraStep("I've prepared three consumer protection options for you. Option 1 is our platinum package.");
    expect(result.step).toBe(4);
  });

  it("detects Step 4 and includes menu order reminder", () => {
    const result = detectAsuraStep("Let me walk you through the Vehicle Service Contract and GAP coverage options.");
    expect(result.step).toBe(4);
    expect(result.menuOrderReminder).toBeTruthy();
    expect(result.menuOrderReminder).toMatch(/VSC/);
  });

  it("detects Step 5 from consequence language", () => {
    const result = detectAsuraStep("If that engine failure happened at month 25, you're looking at $4,000 out of pocket. I want to make sure you're clear on that.");
    expect(result.step).toBe(5);
    expect(result.label).toBe("Consequence");
  });

  it("detects Step 5 from 'without protection' language", () => {
    const result = detectAsuraStep("Without this protection, you're completely exposed to repair costs.");
    expect(result.step).toBe(5);
  });

  it("detects Step 6 from ranking language", () => {
    const result = detectAsuraStep("Let's rank these options. Which one is most important to you?");
    expect(result.step).toBe(6);
    expect(result.label).toBe("Pillars");
  });

  it("detects Step 6 from option presentation", () => {
    const result = detectAsuraStep("Let's start with Option 1 — the Platinum. Tell me, which of these is most important to you?");
    expect(result.step).toBe(6);
  });

  it("returns scriptSuggestion for every detected step", () => {
    const transcripts = [
      "Good afternoon, welcome!",
      "Scale of 1-10 how important is predictable expenses?",
      "What is your understanding of the factory warranty?",
      "Vehicle Service Contract option 1 platinum",
      "Out of pocket month 25 without protection",
      "Rank options most important option 1 option 2 option 3",
    ];
    for (const tx of transcripts) {
      const result = detectAsuraStep(tx);
      expect(result.scriptSuggestion).toBeTruthy();
      expect(result.label).toBeTruthy();
    }
  });

  it("returns confidence level for each detection", () => {
    const result = detectAsuraStep("On a scale of 1-10, how important is it that your vehicle expenses stay predictable?");
    expect(["high", "medium", "low"]).toContain(result.confidence);
  });

  it("returns triggeredBy phrases", () => {
    const result = detectAsuraStep("Good afternoon, my name is Mike. Welcome to our finance office!");
    expect(Array.isArray(result.triggeredBy)).toBe(true);
  });

  it("falls back to step 1 on empty transcript", () => {
    const result = detectAsuraStep("");
    expect(result.step).toBe(1);
  });

  it("uses recent speech (last 500 chars) for detection", () => {
    const oldText = "welcome good morning my name ".repeat(10); // old greeting repeated
    // Use exact phrases matching step 2 high-confidence patterns (scale 1-10 + vehicle expenses stay predictable)
    const recentText = " on a scale of 1-10 how important is it that vehicle expenses stay predictable client survey";
    const result = detectAsuraStep(oldText + recentText);
    // Should detect step 2 from recent text (3 high-confidence step-2 matches vs 1 for step 1)
    expect(result.step).toBe(2);
  });
});

// ─── computeExecutionScore ────────────────────────────────────────────────────

describe("computeExecutionScore", () => {
  it("returns score between 0 and 100", () => {
    const result = computeExecutionScore("Good afternoon. How are you today?", [1]);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("gives full sequence adherence for in-order steps", () => {
    const result = computeExecutionScore("full transcript", [1, 2, 3, 4, 5, 6]);
    expect(result.breakdown.sequenceAdherence).toBe(40);
  });

  it("penalizes out-of-order steps", () => {
    const result = computeExecutionScore("transcript", [1, 4, 2, 3]); // jumped then went back
    expect(result.breakdown.sequenceAdherence).toBeLessThan(40);
  });

  it("awards full survey score when scale of 1-10 and other survey phrases present", () => {
    const tx = "On a scale of 1-10, how important is it? Retail delivery preparation worksheet filled out.";
    const result = computeExecutionScore(tx, [1, 2]);
    expect(result.breakdown.surveyCompleted).toBe(30);
  });

  it("awards partial survey score for one survey phrase", () => {
    const tx = "On a scale of 1-10, how important is predictable expenses?";
    const result = computeExecutionScore(tx, [1, 2]);
    expect(result.breakdown.surveyCompleted).toBeGreaterThan(0);
  });

  it("gives 0 survey score when no survey language", () => {
    const tx = "Good afternoon, how are you?";
    const result = computeExecutionScore(tx, [1]);
    expect(result.breakdown.surveyCompleted).toBe(0);
    expect(result.feedback.some((f) => /survey/i.test(f))).toBe(true);
  });

  it("detects guide language and awards points", () => {
    const tx = "Most customers choose the platinum package. I recommend starting with option 1.";
    const result = computeExecutionScore(tx, [1, 4]);
    expect(result.breakdown.guideLanguage).toBeGreaterThan(0);
  });

  it("flags closer language in feedback", () => {
    const tx = "You need to buy the VSC. You have to take the GAP.";
    const result = computeExecutionScore(tx, [1, 4]);
    expect(result.feedback.some((f) => /closer language/i.test(f))).toBe(true);
  });

  it("returns feedback array", () => {
    const result = computeExecutionScore("Hello", [1]);
    expect(Array.isArray(result.feedback)).toBe(true);
  });

  it("has breakdown with all three categories", () => {
    const result = computeExecutionScore("Hello", [1]);
    expect(typeof result.breakdown.sequenceAdherence).toBe("number");
    expect(typeof result.breakdown.surveyCompleted).toBe("number");
    expect(typeof result.breakdown.guideLanguage).toBe("number");
  });

  it("total score equals sum of breakdown components (max 100)", () => {
    const result = computeExecutionScore(
      "Most customers choose option 1. On a scale of 1-10 predictable expenses.",
      [1, 2, 3]
    );
    const sumOfParts = result.breakdown.sequenceAdherence + result.breakdown.surveyCompleted + result.breakdown.guideLanguage;
    expect(result.score).toBe(Math.min(100, sumOfParts));
  });
});

// ─── detectComplianceRisks ────────────────────────────────────────────────────

describe("detectComplianceRisks", () => {
  it("detects 'extended warranty' as critical violation", () => {
    const risks = detectComplianceRisks("Let me show you our extended warranty options.");
    expect(risks.length).toBeGreaterThan(0);
    const risk = risks.find((r) => /extended warranty/i.test(r.phrase));
    expect(risk).toBeTruthy();
    expect(risk!.severity).toBe("critical");
  });

  it("detects 'GAP insurance' as critical violation", () => {
    const risks = detectComplianceRisks("We also offer GAP insurance to protect your investment.");
    const risk = risks.find((r) => r.severity === "critical");
    expect(risk).toBeTruthy();
  });

  it("detects mandatory closer language as warning", () => {
    const risks = detectComplianceRisks("You need to buy the VSC today.");
    expect(risks.some((r) => r.severity === "warning")).toBe(true);
  });

  it("detects personal promise as warning", () => {
    const risks = detectComplianceRisks("I promise this coverage will protect you.");
    expect(risks.some((r) => /promise/i.test(r.phrase))).toBe(true);
  });

  it("returns empty array for clean transcript", () => {
    const risks = detectComplianceRisks("Most customers choose the Vehicle Service Agreement for complete peace of mind.");
    expect(risks).toHaveLength(0);
  });

  it("provides a warning message for each risk", () => {
    const risks = detectComplianceRisks("Let me show you our extended warranty and GAP insurance.");
    risks.forEach((r) => {
      expect(r.warning).toBeTruthy();
      expect(r.warning.length).toBeGreaterThan(10);
    });
  });

  it("handles multiple violations in same text", () => {
    const risks = detectComplianceRisks("Our extended warranty and GAP insurance — you have to buy both.");
    expect(risks.length).toBeGreaterThanOrEqual(2);
  });

  it("has expected number of risk patterns defined", () => {
    expect(COMPLIANCE_RISK_PHRASES.length).toBeGreaterThanOrEqual(5);
  });

  it("all risk phrases have severity field", () => {
    COMPLIANCE_RISK_PHRASES.forEach((r) => {
      expect(["critical", "warning"]).toContain(r.severity);
    });
  });
});
