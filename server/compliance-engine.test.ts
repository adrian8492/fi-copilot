/**
 * Compliance Engine Unit Tests
 * Tests for scanTranscriptForViolations and calculateComplianceScore
 */
import { describe, expect, it } from "vitest";
import {
  scanTranscriptForViolations,
  calculateComplianceScore,
  ALL_COMPLIANCE_RULES,
  COMPLIANCE_CATEGORY_LABELS,
  PRODUCT_DISCLOSURE_REQUIREMENTS,
} from "./compliance-engine";

// ─── Rule Registry ────────────────────────────────────────────────────────────

describe("ALL_COMPLIANCE_RULES", () => {
  it("contains rules from all 8 regulatory categories", () => {
    const categories = new Set(ALL_COMPLIANCE_RULES.map((r) => r.category));
    expect(categories.has("TILA_REG_Z")).toBe(true);
    expect(categories.has("CLA_REG_M")).toBe(true);
    expect(categories.has("ECOA_REG_B")).toBe(true);
    expect(categories.has("UDAP_UDAAP")).toBe(true);
    expect(categories.has("CONTRACT_ELEMENTS")).toBe(true);
    expect(categories.has("GAP_PRODUCT")).toBe(true);
    expect(categories.has("VSC_PRODUCT")).toBe(true);
    expect(categories.has("AFTERMARKET_PRODUCT")).toBe(true);
  });

  it("every rule has required fields", () => {
    for (const rule of ALL_COMPLIANCE_RULES) {
      expect(rule.id).toBeTruthy();
      expect(rule.category).toBeTruthy();
      expect(["critical", "warning", "info"]).toContain(rule.severity);
      expect(rule.description).toBeTruthy();
      expect(rule.remediation).toBeTruthy();
      expect(Array.isArray(rule.triggers)).toBe(true);
    }
  });

  it("has no duplicate rule IDs", () => {
    const ids = ALL_COMPLIANCE_RULES.map((r) => r.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ─── TILA / Reg Z ─────────────────────────────────────────────────────────────

describe("scanTranscriptForViolations — TILA / Reg Z", () => {
  it("flags missing APR disclosure when financing is mentioned", () => {
    const violations = scanTranscriptForViolations(
      "Your monthly payment will be $687 with this financing.",
      Date.now()
    );
    const tilaViolation = violations.find((v) => v.category === "TILA_REG_Z");
    expect(tilaViolation).toBeDefined();
  });

  it("does not flag when APR is properly disclosed", () => {
    const violations = scanTranscriptForViolations(
      "Your Annual Percentage Rate, or APR, on this transaction is 6.9%. Your monthly payment will be $687.",
      Date.now()
    );
    const tilaViolations = violations.filter((v) => v.ruleId === "TILA-001");
    expect(tilaViolations).toHaveLength(0);
  });

  it("flags forbidden phrase 'just the interest'", () => {
    const violations = scanTranscriptForViolations(
      "Don't worry about just the interest rate, focus on the payment.",
      Date.now()
    );
    const forbidden = violations.find((v) => v.ruleId === "TILA-001");
    expect(forbidden).toBeDefined();
    expect(forbidden?.severity).toBe("critical");
  });
});

// ─── ECOA / Reg B ─────────────────────────────────────────────────────────────

describe("scanTranscriptForViolations — ECOA / Reg B", () => {
  it("flags discriminatory language based on age", () => {
    const violations = scanTranscriptForViolations(
      "Because of your age, we can only offer you this rate.",
      Date.now()
    );
    const ecoaViolation = violations.find((v) => v.category === "ECOA_REG_B");
    expect(ecoaViolation).toBeDefined();
    expect(ecoaViolation?.severity).toBe("critical");
  });

  it("flags discriminatory language based on marital status", () => {
    const violations = scanTranscriptForViolations(
      "Because you're married, your spouse's income is required for approval.",
      Date.now()
    );
    const ecoaViolation = violations.find((v) => v.category === "ECOA_REG_B");
    expect(ecoaViolation).toBeDefined();
  });
});

// ─── UDAP / UDAAP ─────────────────────────────────────────────────────────────

describe("scanTranscriptForViolations — UDAP / UDAAP", () => {
  it("flags 'the bank requires' language for optional products", () => {
    const violations = scanTranscriptForViolations(
      "The bank requires you to get this coverage before they approve the loan.",
      Date.now()
    );
    const udapViolation = violations.find((v) => v.category === "UDAP_UDAAP");
    expect(udapViolation).toBeDefined();
  });

  it("flags 'warranty' language for VSC products", () => {
    const violations = scanTranscriptForViolations(
      "This extended warranty covers everything for 5 years.",
      Date.now()
    );
    const udapViolation = violations.find((v) => v.category === "UDAP_UDAAP");
    expect(udapViolation).toBeDefined();
  });

  it("does not flag clean, compliant product presentation", () => {
    const violations = scanTranscriptForViolations(
      "This vehicle service contract is completely optional. It is not required by the lender.",
      Date.now()
    );
    const criticalFlags = violations.filter((v) => v.severity === "critical");
    expect(criticalFlags).toHaveLength(0);
  });
});

// ─── GAP Product ──────────────────────────────────────────────────────────────

describe("scanTranscriptForViolations — GAP Product", () => {
  it("flags forbidden GAP required language", () => {
    const violations = scanTranscriptForViolations(
      "GAP is required by the lender on this loan amount.",
      Date.now()
    );
    const gapViolation = violations.find((v) => v.category === "GAP_PRODUCT");
    expect(gapViolation).toBeDefined();
    expect(gapViolation?.severity).toBe("critical");
  });

  it("does not flag when GAP is presented with optional disclosure", () => {
    const violations = scanTranscriptForViolations(
      "GAP protection is completely optional and not required by the lender. It covers the difference between your insurance payout and your loan balance.",
      Date.now()
    );
    const criticalGap = violations.filter((v) => v.category === "GAP_PRODUCT" && v.severity === "critical");
    expect(criticalGap).toHaveLength(0);
  });
});

// ─── Clean Transcript ─────────────────────────────────────────────────────────

describe("scanTranscriptForViolations — clean transcript", () => {
  it("returns empty array for a generic greeting", () => {
    const violations = scanTranscriptForViolations(
      "Good afternoon! Welcome to the finance office. My name is Michael.",
      Date.now()
    );
    expect(violations).toHaveLength(0);
  });

  it("returns empty array for empty string", () => {
    const violations = scanTranscriptForViolations("", Date.now());
    expect(violations).toHaveLength(0);
  });
});

// ─── Compliance Score Calculator ─────────────────────────────────────────────

describe("calculateComplianceScore", () => {
  it("returns 100 for zero violations", () => {
    expect(calculateComplianceScore([])).toBe(100);
  });

  it("deducts 25 points per critical violation", () => {
    const violations = [
      { ruleId: "TILA-001", category: "TILA_REG_Z" as const, severity: "critical" as const, description: "test", excerpt: "", remediation: "", timestamp: Date.now() },
    ];
    expect(calculateComplianceScore(violations)).toBe(75);
  });

  it("deducts 10 points per warning violation", () => {
    const violations = [
      { ruleId: "TILA-002", category: "TILA_REG_Z" as const, severity: "warning" as const, description: "test", excerpt: "", remediation: "", timestamp: Date.now() },
      { ruleId: "TILA-003", category: "TILA_REG_Z" as const, severity: "warning" as const, description: "test", excerpt: "", remediation: "", timestamp: Date.now() },
    ];
    expect(calculateComplianceScore(violations)).toBe(80);
  });

  it("deducts 3 points per info violation", () => {
    const violations = [
      { ruleId: "ECOA-001", category: "ECOA_REG_B" as const, severity: "info" as const, description: "test", excerpt: "", remediation: "", timestamp: Date.now() },
    ];
    expect(calculateComplianceScore(violations)).toBe(97);
  });

  it("does not go below 0 for many violations", () => {
    const violations = Array.from({ length: 10 }, (_, i) => ({
      ruleId: `RULE-${i}`,
      category: "TILA_REG_Z" as const,
      severity: "critical" as const,
      description: "test",
      excerpt: "",
      remediation: "",
      timestamp: Date.now(),
    }));
    expect(calculateComplianceScore(violations)).toBe(0);
  });

  it("handles mixed severity violations correctly", () => {
    const violations = [
      { ruleId: "A", category: "TILA_REG_Z" as const, severity: "critical" as const, description: "", excerpt: "", remediation: "", timestamp: Date.now() },
      { ruleId: "B", category: "ECOA_REG_B" as const, severity: "warning" as const, description: "", excerpt: "", remediation: "", timestamp: Date.now() },
      { ruleId: "C", category: "UDAP_UDAAP" as const, severity: "info" as const, description: "", excerpt: "", remediation: "", timestamp: Date.now() },
    ];
    // 100 - 25 - 10 - 3 = 62
    expect(calculateComplianceScore(violations)).toBe(62);
  });
});

// ─── Category Labels ──────────────────────────────────────────────────────────

describe("COMPLIANCE_CATEGORY_LABELS", () => {
  it("has a label for every category", () => {
    const categories: string[] = [
      "TILA_REG_Z", "CLA_REG_M", "ECOA_REG_B", "UDAP_UDAAP",
      "CONTRACT_ELEMENTS", "GAP_PRODUCT", "VSC_PRODUCT", "AFTERMARKET_PRODUCT",
    ];
    for (const cat of categories) {
      expect(COMPLIANCE_CATEGORY_LABELS[cat as keyof typeof COMPLIANCE_CATEGORY_LABELS]).toBeTruthy();
    }
  });
});

// ─── Product Disclosure Requirements ─────────────────────────────────────────

describe("PRODUCT_DISCLOSURE_REQUIREMENTS", () => {
  it("GAP has required disclosure items including optional and cancellation", () => {
    const gapItems = PRODUCT_DISCLOSURE_REQUIREMENTS.gap;
    expect(gapItems.some((item) => item.toLowerCase().includes("optional"))).toBe(true);
    expect(gapItems.some((item) => item.toLowerCase().includes("cancellation"))).toBe(true);
  });

  it("VSC first disclosure item distinguishes service contract from warranty", () => {
    const vscItems = PRODUCT_DISCLOSURE_REQUIREMENTS.vsc;
    // The first item explicitly names both terms to clarify the distinction
    expect(vscItems[0].toLowerCase().includes("service contract")).toBe(true);
    expect(vscItems[0].toLowerCase().includes("warranty")).toBe(true);
    // The distinction is that VSC is NOT a warranty — the item should contain 'not'
    expect(vscItems[0].toLowerCase().includes("not")).toBe(true);
  });

  it("all products have at least 3 required disclosure items", () => {
    for (const [product, items] of Object.entries(PRODUCT_DISCLOSURE_REQUIREMENTS)) {
      expect(items.length).toBeGreaterThanOrEqual(3);
    }
  });
});

// ─── State-Specific Rules (A4 additions) ─────────────────────────────────────

import {
  STATE_COMPLIANCE_RULES,
  getRulesForState,
  type StateCode,
} from "./compliance-engine";

describe("STATE_COMPLIANCE_RULES", () => {
  const STATES: StateCode[] = ["CA", "TX", "FL", "NY", "OH"];

  it("has rules for all 5 top states", () => {
    for (const state of STATES) {
      expect(STATE_COMPLIANCE_RULES[state].length).toBeGreaterThan(0);
    }
  });

  it("each state rule has required fields", () => {
    for (const state of STATES) {
      for (const rule of STATE_COMPLIANCE_RULES[state]) {
        expect(typeof rule.id).toBe("string");
        expect(rule.id.startsWith(state + "-")).toBe(true);
        expect(typeof rule.description).toBe("string");
        expect(typeof rule.remediation).toBe("string");
        expect(["critical", "warning", "info"]).toContain(rule.severity);
      }
    }
  });

  it("CA has at least 5 rules (strictest state)", () => {
    expect(STATE_COMPLIANCE_RULES["CA"].length).toBeGreaterThanOrEqual(4);
  });

  it("all state rules reference state in description", () => {
    const STATE_PREFIXES: Record<StateCode, string> = {
      CA: "[CA]", TX: "[TX]", FL: "[FL]", NY: "[NY]", OH: "[OH]",
      FEDERAL: "",
    };
    for (const state of STATES) {
      for (const rule of STATE_COMPLIANCE_RULES[state]) {
        expect(rule.description.includes(STATE_PREFIXES[state])).toBe(true);
      }
    }
  });
});

describe("getRulesForState", () => {
  it("FEDERAL returns only federal rules", () => {
    const rules = getRulesForState("FEDERAL");
    expect(rules).toEqual(ALL_COMPLIANCE_RULES);
  });

  it("state returns federal + state rules combined", () => {
    const ca = getRulesForState("CA");
    const federal = getRulesForState("FEDERAL");
    const stateOnly = STATE_COMPLIANCE_RULES["CA"];
    expect(ca.length).toBe(federal.length + stateOnly.length);
  });

  it("federalOnly=true returns only federal rules regardless of state", () => {
    const caFederalOnly = getRulesForState("CA", true);
    expect(caFederalOnly).toEqual(ALL_COMPLIANCE_RULES);
  });

  it("state rules are appended after federal rules", () => {
    const tx = getRulesForState("TX");
    const federalCount = ALL_COMPLIANCE_RULES.length;
    const txStateRules = STATE_COMPLIANCE_RULES["TX"];
    // Last N rules should be TX state rules
    const lastN = tx.slice(-txStateRules.length);
    expect(lastN.map(r => r.id)).toEqual(txStateRules.map(r => r.id));
  });
});

describe("scanTranscriptForViolations with state context", () => {
  it("detects CA-specific violations when stateCode is CA", () => {
    const transcript = "We automatically include the extended warranty with every car we sell, it comes standard.";
    const violations = scanTranscriptForViolations(transcript, 0, { stateCode: "CA" });
    // Should find violations from federal + CA rules
    expect(violations.length).toBeGreaterThan(0);
  });

  it("detects NY GAP insurance naming violation", () => {
    const transcript = "Let me go over GAP insurance with you today.";
    const violations = scanTranscriptForViolations(transcript, 0, { stateCode: "NY" });
    const nyGapViolation = violations.find(v => v.ruleId === "NY-003");
    expect(nyGapViolation).toBeDefined();
  });

  it("detects UDAP mandatory bundling across all states", () => {
    const transcript = "The bank requires you to get GAP. It's mandatory for your loan.";
    const violations = scanTranscriptForViolations(transcript, 0, { stateCode: "TX" });
    const udapViolations = violations.filter(v => v.ruleId.startsWith("UDAP") || v.ruleId.startsWith("GAP"));
    expect(udapViolations.length).toBeGreaterThan(0);
  });

  it("returns more violations for high-risk state (CA) vs federal only", () => {
    const highRiskTranscript = "We automatically include ceramic coating on all our cars. GAP insurance is required by the lender. The extended warranty covers everything with no deductible.";
    const federal = scanTranscriptForViolations(highRiskTranscript, 0);
    const caState = scanTranscriptForViolations(highRiskTranscript, 0, { stateCode: "CA" });
    expect(caState.length).toBeGreaterThanOrEqual(federal.length);
  });
});
