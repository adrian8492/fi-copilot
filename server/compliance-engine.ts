/**
 * ASURA Group — Federal F&I Compliance Engine
 *
 * Covers:
 *   • Truth in Lending Act (TILA) / Regulation Z
 *   • Consumer Leasing Act (CLA) / Regulation M
 *   • Equal Credit Opportunity Act (ECOA) / Regulation B
 *   • UDAP / UDAAP (Unfair, Deceptive, Abusive Acts or Practices)
 *   • Elements of a Contract / Installment Sale Agreement Disclosures
 *   • F&I Product Compliance: GAP, VSC/VSA, Aftermarket Products
 *
 * Each rule has:
 *   - id: unique identifier
 *   - category: regulatory grouping
 *   - severity: "critical" | "warning" | "info"
 *   - description: plain-English rule summary
 *   - triggers: regex patterns that detect potential violations in transcript text
 *   - requiredPhrases: phrases that SHOULD appear (absence = flag)
 *   - forbiddenPhrases: phrases that MUST NOT appear
 *   - checklistItem: maps to the 17-point checklist where applicable
 *   - remediation: exact script the F&I manager should use to correct
 */

export type ComplianceSeverity = "critical" | "warning" | "info";
export type ComplianceCategory =
  | "TILA_REG_Z"
  | "CLA_REG_M"
  | "ECOA_REG_B"
  | "UDAP_UDAAP"
  | "CONTRACT_ELEMENTS"
  | "GAP_PRODUCT"
  | "VSC_PRODUCT"
  | "AFTERMARKET_PRODUCT";

export interface ComplianceRule {
  id: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  description: string;
  triggers: RegExp[];
  requiredPhrases?: string[];
  forbiddenPhrases?: RegExp[];
  checklistItem?: string;
  remediation: string;
}

export interface ComplianceViolation {
  ruleId: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  description: string;
  excerpt: string;
  remediation: string;
  timestamp: number;
}

// ─── TILA / Regulation Z Rules ────────────────────────────────────────────────
const TILA_RULES: ComplianceRule[] = [
  {
    id: "TILA-001",
    category: "TILA_REG_Z",
    severity: "critical",
    description: "APR must be disclosed before consummation of a credit transaction",
    triggers: [
      /\binterest rate\b/i,
      /\bfinance charge\b/i,
      /\bmonthly payment\b/i,
      /\bfinancing\b/i,
    ],
    requiredPhrases: ["annual percentage rate", "APR"],
    forbiddenPhrases: [/\bjust the interest\b/i, /\bdon't worry about the rate\b/i],
    checklistItem: "disclosedBasePayment",
    remediation:
      "Disclose the Annual Percentage Rate (APR) clearly: 'Your Annual Percentage Rate, or APR, on this transaction is [X]%. This is the cost of your credit expressed as a yearly rate.'",
  },
  {
    id: "TILA-002",
    category: "TILA_REG_Z",
    severity: "critical",
    description: "Total finance charge must be disclosed — the dollar cost of credit",
    triggers: [/\bhow much (will|does) (this|it) cost\b/i, /\btotal (amount|cost)\b/i],
    requiredPhrases: ["finance charge", "total cost of credit"],
    forbiddenPhrases: [],
    remediation:
      "State the total finance charge: 'The total finance charge — the dollar amount this credit will cost you — is $[X].'",
  },
  {
    id: "TILA-003",
    category: "TILA_REG_Z",
    severity: "critical",
    description: "Base payment must be disclosed separately from F&I product payments",
    triggers: [/\bpayment\b/i, /\bmonthly\b/i],
    requiredPhrases: ["base payment", "without any products"],
    checklistItem: "disclosedBasePayment",
    remediation:
      "Always disclose the base payment first: 'Your base payment — without any additional protection products — is $[X] per month. Everything I show you today is optional and will be added on top of that.'",
  },
  {
    id: "TILA-004",
    category: "TILA_REG_Z",
    severity: "warning",
    description: "Payment packing — bundling product costs without separate disclosure — is prohibited",
    triggers: [/\bjust \$\d+\b/i, /\bonly adds \$\d+\b/i, /\bit's only \$\d+\s*more\b/i],
    forbiddenPhrases: [
      /\bit's all included\b/i,
      /\bwe just rolled it in\b/i,
      /\byou won't even notice\b/i,
    ],
    remediation:
      "Never bundle product costs without disclosure. State each product cost separately: 'The GAP protection adds $[X] per month to your payment, bringing your total to $[Y].'",
  },
  {
    id: "TILA-005",
    category: "TILA_REG_Z",
    severity: "info",
    description: "Right of rescission must be mentioned for applicable transactions (refinances, HELOCs)",
    triggers: [/\brefinanc\b/i, /\bhome equity\b/i, /\brescind\b/i],
    requiredPhrases: ["right to cancel", "three business days"],
    remediation:
      "For applicable transactions, state: 'You have the right to cancel this transaction within three business days without penalty.'",
  },
];

// ─── Consumer Leasing Act / Regulation M Rules ────────────────────────────────
const CLA_RULES: ComplianceRule[] = [
  {
    id: "CLA-001",
    category: "CLA_REG_M",
    severity: "critical",
    description: "Lease transactions require disclosure of total amount due at signing",
    triggers: [/\blease\b/i, /\bleasing\b/i, /\bmonthly lease\b/i],
    requiredPhrases: ["amount due at signing", "capitalized cost"],
    remediation:
      "For lease transactions, disclose: 'The total amount due at signing is $[X], which includes your first payment, acquisition fee, and any down payment.'",
  },
  {
    id: "CLA-002",
    category: "CLA_REG_M",
    severity: "critical",
    description: "Money factor must be disclosed and not misrepresented as an interest rate",
    triggers: [/\bmoney factor\b/i, /\blease rate\b/i, /\brent charge\b/i],
    forbiddenPhrases: [/\bthe interest rate on your lease is\b/i],
    remediation:
      "Disclose the money factor accurately: 'The money factor on this lease is [X], which is equivalent to an APR of approximately [Y]%.'",
  },
  {
    id: "CLA-003",
    category: "CLA_REG_M",
    severity: "critical",
    description: "Residual value and mileage allowance must be clearly disclosed on leases",
    triggers: [/\blease\b/i, /\bmiles\b/i, /\bover mileage\b/i],
    requiredPhrases: ["residual value", "mileage allowance", "excess mileage charge"],
    remediation:
      "Disclose lease terms: 'Your residual value is $[X]. Your mileage allowance is [Y] miles per year. Excess mileage is charged at $[Z] per mile.'",
  },
  {
    id: "CLA-004",
    category: "CLA_REG_M",
    severity: "warning",
    description: "Early termination liability must be disclosed for lease transactions",
    triggers: [/\bearly termination\b/i, /\bturn in early\b/i, /\bget out of the lease\b/i],
    requiredPhrases: ["early termination fee", "early termination liability"],
    remediation:
      "Disclose early termination: 'If you need to exit the lease early, there is an early termination fee. The exact amount depends on when you terminate and the remaining payments.'",
  },
];

// ─── ECOA / Regulation B Rules ────────────────────────────────────────────────
const ECOA_RULES: ComplianceRule[] = [
  {
    id: "ECOA-001",
    category: "ECOA_REG_B",
    severity: "critical",
    description: "Adverse action notice required when credit is denied or terms are less favorable",
    triggers: [/\bdenied\b/i, /\bdeclined\b/i, /\bcouldn't get approved\b/i, /\bcredit was rejected\b/i],
    requiredPhrases: ["adverse action notice", "reason for denial"],
    remediation:
      "Provide an adverse action notice: 'Because your application was declined, you are entitled to an adverse action notice stating the specific reasons. We will provide that to you in writing within 30 days.'",
  },
  {
    id: "ECOA-002",
    category: "ECOA_REG_B",
    severity: "critical",
    description: "Credit decisions must not be based on race, color, religion, national origin, sex, marital status, or age",
    triggers: [],
    forbiddenPhrases: [
      /\bbecause (you're|you are) (a woman|female|married|single|divorced)\b/i,
      /\byour age\b/i,
      /\bwhere you're from\b/i,
      /\byour nationality\b/i,
    ],
    remediation:
      "Credit decisions must be based solely on creditworthiness factors. Never reference protected characteristics. If a customer raises a concern, state: 'Our credit decisions are based entirely on your credit profile, income, and debt-to-income ratio.'",
  },
  {
    id: "ECOA-003",
    category: "ECOA_REG_B",
    severity: "warning",
    description: "Risk-based pricing notice required when customer receives less favorable terms than others",
    triggers: [/\bhigher rate\b/i, /\bbetter rate\b/i, /\bcredit tier\b/i, /\btier \d\b/i],
    requiredPhrases: ["risk-based pricing", "credit score"],
    checklistItem: "riskBasedPricingMentioned",
    remediation:
      "Provide the risk-based pricing disclosure: 'Based on your credit profile, you received a rate that is higher than the rate offered to consumers with the best credit. You have the right to obtain a free copy of your credit report.'",
  },
  {
    id: "ECOA-004",
    category: "ECOA_REG_B",
    severity: "info",
    description: "Privacy Policy notice must be provided at origination of credit relationship",
    triggers: [/\bprivacy\b/i, /\bshare your information\b/i, /\bdata\b/i],
    requiredPhrases: ["privacy policy", "privacy notice"],
    checklistItem: "privacyPolicyMentioned",
    remediation:
      "Provide the privacy notice: 'Federal law requires us to provide you with a copy of our privacy policy, which explains how we collect, use, and share your personal information.'",
  },
];

// ─── UDAP / UDAAP Rules ───────────────────────────────────────────────────────
const UDAP_RULES: ComplianceRule[] = [
  {
    id: "UDAP-001",
    category: "UDAP_UDAAP",
    severity: "critical",
    description: "Deceptive acts — misrepresenting the cost, coverage, or terms of any product",
    triggers: [],
    forbiddenPhrases: [
      /\bcovers everything\b/i,
      /\bno deductible\b/i,
      /\bfully covered\b/i,
      /\bguaranteed approval\b/i,
      /\bno questions asked\b/i,
      /\bpays off your loan\b/i,
    ],
    remediation:
      "Never make absolute coverage claims. Use accurate language: 'This product covers [specific items] as outlined in the contract. There is a $[X] deductible per claim. I encourage you to review the terms.'",
  },
  {
    id: "UDAP-002",
    category: "UDAP_UDAAP",
    severity: "critical",
    description: "Unfair acts — packing products without customer knowledge or consent",
    triggers: [/\bI already added\b/i, /\bit's already in there\b/i, /\bwe include it\b/i],
    forbiddenPhrases: [
      /\bI went ahead and added\b/i,
      /\bwe automatically include\b/i,
      /\bit comes with the deal\b/i,
    ],
    remediation:
      "All F&I products are optional and must be presented as such: 'Everything I'm showing you today is completely optional. You are under no obligation to purchase any of these products.'",
  },
  {
    id: "UDAP-003",
    category: "UDAP_UDAAP",
    severity: "critical",
    description: "Abusive acts — exploiting lack of understanding or using high-pressure tactics",
    triggers: [],
    forbiddenPhrases: [
      /\byou have to decide right now\b/i,
      /\bthis offer expires today\b/i,
      /\bif you don't take it now\b/i,
      /\byou'll regret it\b/i,
      /\beveryone buys this\b/i,
    ],
    remediation:
      "Use consultative, non-pressured language: 'Take your time reviewing these options. My job is to make sure you understand what's available so you can make the best decision for your situation.'",
  },
  {
    id: "UDAP-004",
    category: "UDAP_UDAAP",
    severity: "warning",
    description: "All products must be presented as optional — no mandatory bundling",
    triggers: [/\byou (need|must|have to) (take|get|buy)\b/i, /\brequired\b/i],
    forbiddenPhrases: [
      /\bthe bank requires\b/i,
      /\byou have to get GAP\b/i,
      /\bit's mandatory\b/i,
    ],
    remediation:
      "Clarify optionality: 'Just to be clear — none of these products are required by the lender. They are all optional protections that I want to make sure you're aware of.'",
  },
];

// ─── Contract Elements / Installment Sale Agreement Rules ─────────────────────
const CONTRACT_RULES: ComplianceRule[] = [
  {
    id: "CONTRACT-001",
    category: "CONTRACT_ELEMENTS",
    severity: "critical",
    description: "Offer and acceptance — customer must affirmatively agree to all contract terms",
    triggers: [/\bsign here\b/i, /\bjust sign\b/i, /\binitial here\b/i],
    requiredPhrases: ["do you agree", "do you understand", "any questions before you sign"],
    remediation:
      "Before any signature, confirm understanding: 'Before you sign, do you have any questions about the terms we've discussed? I want to make sure you're completely comfortable with everything.'",
  },
  {
    id: "CONTRACT-002",
    category: "CONTRACT_ELEMENTS",
    severity: "critical",
    description: "Consideration — the exchange of value must be clearly stated in the contract",
    triggers: [/\bpurchase price\b/i, /\bselling price\b/i, /\bvehicle price\b/i],
    requiredPhrases: ["selling price", "total amount financed"],
    remediation:
      "Confirm the consideration: 'The selling price of the vehicle is $[X]. The total amount you are financing, including any products you've selected, is $[Y].'",
  },
  {
    id: "CONTRACT-003",
    category: "CONTRACT_ELEMENTS",
    severity: "warning",
    description: "Installment sale agreement must disclose all payment terms including number of payments",
    triggers: [/\bpayment\b/i, /\bmonths\b/i, /\bterm\b/i],
    requiredPhrases: ["number of payments", "payment schedule", "term"],
    remediation:
      "Disclose full payment schedule: 'You will make [X] monthly payments of $[Y] over [Z] months. Your first payment is due on [date].'",
  },
  {
    id: "CONTRACT-004",
    category: "CONTRACT_ELEMENTS",
    severity: "warning",
    description: "Prepayment penalty disclosure required if applicable",
    triggers: [/\bpay (it|this) off early\b/i, /\bprepay\b/i, /\bpay off\b/i],
    requiredPhrases: ["prepayment penalty", "no prepayment penalty"],
    remediation:
      "Disclose prepayment terms: 'There is [no prepayment penalty / a prepayment penalty of $X] if you pay off this loan early.'",
  },
];

// ─── GAP Product Compliance Rules ────────────────────────────────────────────
const GAP_RULES: ComplianceRule[] = [
  {
    id: "GAP-001",
    category: "GAP_PRODUCT",
    severity: "critical",
    description: "GAP must be disclosed as optional — never represented as lender-required",
    triggers: [/\bGAP\b/i, /\bguaranteed asset protection\b/i],
    forbiddenPhrases: [
      /\bthe bank requires GAP\b/i,
      /\bGAP is required\b/i,
      /\byou have to get GAP\b/i,
    ],
    checklistItem: "presentedGap",
    remediation:
      "Use the ASURA GAP Framework: 'GAP protection is completely optional. What it does is cover the difference between what you owe on your loan and what your insurance pays if the vehicle is totaled or stolen. On a vehicle like this, that gap can be $[X] to $[Y].'",
  },
  {
    id: "GAP-002",
    category: "GAP_PRODUCT",
    severity: "critical",
    description: "GAP coverage limitations must be disclosed — it does not cover all situations",
    triggers: [/\bGAP (covers|pays|protects)\b/i],
    forbiddenPhrases: [
      /\bGAP covers everything\b/i,
      /\bGAP pays off your loan\b/i,
      /\bGAP covers all the difference\b/i,
    ],
    remediation:
      "Accurately describe GAP: 'GAP covers the difference between your insurance settlement and your loan balance, up to the limits in your contract. It does not cover missed payments, late fees, or amounts beyond the vehicle's actual cash value.'",
  },
  {
    id: "GAP-003",
    category: "GAP_PRODUCT",
    severity: "warning",
    description: "GAP cancellation and refund terms must be disclosed",
    triggers: [/\bcancel GAP\b/i, /\bGAP refund\b/i, /\bGAP cancellation\b/i],
    requiredPhrases: ["cancel", "pro-rated refund"],
    remediation:
      "Disclose GAP cancellation terms: 'If you pay off your loan early or sell the vehicle, you can cancel the GAP coverage and receive a pro-rated refund for the unused portion.'",
  },
];

// ─── VSC / Vehicle Service Contract Rules ────────────────────────────────────
const VSC_RULES: ComplianceRule[] = [
  {
    id: "VSC-001",
    category: "VSC_PRODUCT",
    severity: "critical",
    description: "VSC must be clearly distinguished from the factory warranty — it is not a warranty",
    triggers: [/\bservice contract\b/i, /\bextended warranty\b/i, /\bVSC\b/i, /\bVSA\b/i],
    forbiddenPhrases: [
      /\bextended warranty\b/i,
      /\bwarranty extension\b/i,
    ],
    checklistItem: "presentedVehicleServiceContract",
    remediation:
      "Use the correct terminology: 'This is a Vehicle Service Contract — not a warranty. A warranty is provided by the manufacturer. This is a separate service contract that provides protection after your factory coverage expires.'",
  },
  {
    id: "VSC-002",
    category: "VSC_PRODUCT",
    severity: "critical",
    description: "VSC exclusions and deductibles must be disclosed — it does not cover everything",
    triggers: [/\bservice contract covers\b/i, /\bVSC covers\b/i, /\bprotects everything\b/i],
    forbiddenPhrases: [
      /\bcovers everything\b/i,
      /\bno deductible\b/i,
      /\bfully covered\b/i,
    ],
    remediation:
      "Accurately describe VSC coverage: 'This service contract covers [listed components] as specified in the contract. There is a $[X] deductible per repair visit. Wear items, maintenance, and pre-existing conditions are excluded.'",
  },
  {
    id: "VSC-003",
    category: "VSC_PRODUCT",
    severity: "warning",
    description: "VSC cancellation rights and refund policy must be disclosed",
    triggers: [/\bcancel (the|my|your) (service contract|VSC|VSA)\b/i],
    requiredPhrases: ["cancel", "refund", "30 days"],
    remediation:
      "Disclose VSC cancellation: 'You can cancel this service contract at any time. If you cancel within 30 days and have no claims, you receive a full refund. After 30 days, you receive a pro-rated refund.'",
  },
  {
    id: "VSC-004",
    category: "VSC_PRODUCT",
    severity: "info",
    description: "VSC must be presented using the ASURA 4-Pillar Menu Mastery framework",
    triggers: [/\bservice contract\b/i, /\bVSC\b/i],
    requiredPhrases: ["what it covers", "how it works", "what it costs"],
    checklistItem: "presentedVehicleServiceContract",
    remediation:
      "Use the ASURA 4-Pillar approach: (1) 'Here's what it covers — [components].' (2) 'Here's how it works — you bring it to any licensed repair facility.' (3) 'Here's what it costs — $[X] per month.' (4) 'Here's why it makes sense for you — [personalized reason].'",
  },
];

// ─── Aftermarket Product Rules ────────────────────────────────────────────────
const AFTERMARKET_RULES: ComplianceRule[] = [
  {
    id: "AFT-001",
    category: "AFTERMARKET_PRODUCT",
    severity: "critical",
    description: "All aftermarket products must be presented as optional — no mandatory bundling",
    triggers: [/\btire (and|&) wheel\b/i, /\bpaint protection\b/i, /\binterior protection\b/i, /\bkey replacement\b/i],
    forbiddenPhrases: [
      /\bit comes with the car\b/i,
      /\bwe already applied it\b/i,
      /\bit's already on the vehicle\b/i,
    ],
    remediation:
      "Present all products as optional: 'This is an optional protection product. You are under no obligation to purchase it, and it will not affect your financing approval.'",
  },
  {
    id: "AFT-002",
    category: "AFTERMARKET_PRODUCT",
    severity: "warning",
    description: "Product cost must be disclosed separately — not buried in the payment",
    triggers: [/\btire (and|&) wheel\b/i, /\bpaint\b/i, /\bprotection\b/i],
    requiredPhrases: ["adds", "per month", "total cost"],
    remediation:
      "Disclose each product cost separately: 'The [product name] adds $[X] per month to your payment, for a total cost of $[Y] over your loan term.'",
  },
  {
    id: "AFT-003",
    category: "AFTERMARKET_PRODUCT",
    severity: "info",
    description: "Prepaid maintenance must be presented using the ASURA Financial Snapshot framework",
    triggers: [/\bprepaid maintenance\b/i, /\bmaintenance plan\b/i, /\boil changes\b/i],
    checklistItem: "presentedPrepaidMaintenance",
    remediation:
      "Use the Financial Snapshot 3 Questions: (1) 'How long do you plan to keep the vehicle?' (2) 'Do you typically keep up with manufacturer-recommended maintenance?' (3) 'Would it help to lock in today's pricing on maintenance for the life of your loan?'",
  },
];

// ─── Master Rule Set ──────────────────────────────────────────────────────────
export const ALL_COMPLIANCE_RULES: ComplianceRule[] = [
  ...TILA_RULES,
  ...CLA_RULES,
  ...ECOA_RULES,
  ...UDAP_RULES,
  ...CONTRACT_RULES,
  ...GAP_RULES,
  ...VSC_RULES,
  ...AFTERMARKET_RULES,
];

// ─── Compliance Grading Weights ───────────────────────────────────────────────
export const COMPLIANCE_WEIGHTS = {
  critical: 25,  // Each critical violation deducts 25 points from compliance score
  warning: 10,   // Each warning deducts 10 points
  info: 3,       // Each info flag deducts 3 points
  maxScore: 100,
};

// ─── Real-Time Transcript Scanner ────────────────────────────────────────────
/**
 * Scans a single transcript utterance for compliance violations.
 * Returns an array of violations found (empty array = clean).
 */
export function scanTranscriptForViolations(
  text: string,
  timestamp: number,
  sessionContext?: {
    isLease?: boolean;
    hasDisclosedBasePayment?: boolean;
    hasDisclosedAPR?: boolean;
    hasProvidedPrivacyNotice?: boolean;
    hasProvidedRiskBasedPricing?: boolean;
  }
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];
  const lowerText = text.toLowerCase();

  for (const rule of ALL_COMPLIANCE_RULES) {
    // Check forbidden phrases first (highest priority)
    if (rule.forbiddenPhrases) {
      for (const forbidden of rule.forbiddenPhrases) {
        if (forbidden.test(text)) {
          violations.push({
            ruleId: rule.id,
            category: rule.category,
            severity: rule.severity,
            description: rule.description,
            excerpt: text.substring(0, 200),
            remediation: rule.remediation,
            timestamp,
          });
          break; // One violation per rule per utterance
        }
      }
    }

    // Check triggers — if triggered, verify required phrases are present
    if (rule.triggers.length > 0 && rule.requiredPhrases && rule.requiredPhrases.length > 0) {
      const triggered = rule.triggers.some((t) => t.test(text));
      if (triggered) {
        const hasRequired = rule.requiredPhrases.some((phrase) =>
          lowerText.includes(phrase.toLowerCase())
        );
        if (!triggered || !hasRequired) {
          // Only flag if the topic is raised but required disclosure is missing
          if (triggered && !hasRequired) {
            violations.push({
              ruleId: rule.id,
              category: rule.category,
              severity: "warning", // Downgrade to warning for missing-phrase violations
              description: `${rule.description} — required disclosure missing`,
              excerpt: text.substring(0, 200),
              remediation: rule.remediation,
              timestamp,
            });
          }
        }
      }
    }
  }

  return violations;
}

// ─── Compliance Score Calculator ─────────────────────────────────────────────
/**
 * Calculates a compliance score (0–100) based on violations found in a session.
 */
export function calculateComplianceScore(violations: ComplianceViolation[]): number {
  let score = COMPLIANCE_WEIGHTS.maxScore;

  for (const v of violations) {
    if (v.severity === "critical") score -= COMPLIANCE_WEIGHTS.critical;
    else if (v.severity === "warning") score -= COMPLIANCE_WEIGHTS.warning;
    else if (v.severity === "info") score -= COMPLIANCE_WEIGHTS.info;
  }

  return Math.max(0, score);
}

// ─── Compliance Category Labels ───────────────────────────────────────────────
export const COMPLIANCE_CATEGORY_LABELS: Record<ComplianceCategory, string> = {
  TILA_REG_Z: "TILA / Reg Z",
  CLA_REG_M: "Consumer Leasing Act / Reg M",
  ECOA_REG_B: "ECOA / Reg B",
  UDAP_UDAAP: "UDAP / UDAAP",
  CONTRACT_ELEMENTS: "Contract Elements",
  GAP_PRODUCT: "GAP Protection",
  VSC_PRODUCT: "Vehicle Service Contract",
  AFTERMARKET_PRODUCT: "Aftermarket Products",
};

// ─── Checklist Compliance Requirements ───────────────────────────────────────
/**
 * Maps the 17-point checklist items to their compliance rule requirements.
 * Used to auto-flag checklist items that have compliance implications.
 */
export const CHECKLIST_COMPLIANCE_MAP: Record<string, string[]> = {
  privacyPolicyMentioned: ["ECOA-004"],
  riskBasedPricingMentioned: ["ECOA-003"],
  disclosedBasePayment: ["TILA-001", "TILA-003"],
  presentedGap: ["GAP-001", "GAP-002"],
  presentedVehicleServiceContract: ["VSC-001", "VSC-002"],
  presentedPrepaidMaintenance: ["AFT-003"],
};

// ─── F&I Product Disclosure Checklist ────────────────────────────────────────
/**
 * Required disclosures for each F&I product before customer signature.
 * Used to generate the pre-signing compliance checklist.
 */
export const PRODUCT_DISCLOSURE_REQUIREMENTS = {
  gap: [
    "Product is optional and not required by lender",
    "Covers difference between insurance payout and loan balance",
    "Does not cover missed payments, late fees, or deductibles",
    "Cancellation and pro-rated refund policy disclosed",
    "Cost disclosed separately from base payment",
  ],
  vsc: [
    "Described as 'service contract' not 'warranty'",
    "Coverage components listed (what is covered)",
    "Exclusions disclosed (wear items, maintenance, pre-existing)",
    "Deductible amount disclosed",
    "Cancellation and refund policy disclosed",
    "Cost disclosed separately from base payment",
  ],
  prepaidMaintenance: [
    "Product is optional",
    "Services included are listed",
    "Term and mileage limits disclosed",
    "Cost disclosed separately from base payment",
  ],
  tireWheel: [
    "Product is optional",
    "Coverage description provided (road hazard, cosmetic damage)",
    "Exclusions disclosed",
    "Cost disclosed separately from base payment",
  ],
  paintProtection: [
    "Product is optional",
    "Coverage description provided",
    "Application method disclosed if dealer-applied",
    "Cost disclosed separately from base payment",
  ],
};
