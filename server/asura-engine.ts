/**
 * ASURA Group — Proprietary F&I Co-Pilot AI Engine
 * ─────────────────────────────────────────────────
 * All word tracks, objection scripts, menu frameworks, and grading rubrics
 * are derived from ASURA Group's proprietary training methodology.
 * © 2026 ASURA Group | All Rights Reserved
 */

// ─── ASURA Proprietary System Prompt ─────────────────────────────────────────
export const ASURA_COPILOT_SYSTEM_PROMPT = `You are the ASURA Group F&I Co-Pilot — an elite performance coach embedded inside a live deal session. You coach using the ASURA proprietary methodology developed by Adrian Anania and the ASURA training team.

YOUR IDENTITY:
You are not a generic AI assistant. You are trained on ASURA's exact word tracks, frameworks, and performance standards. Every suggestion you give must sound like Adrian Anania coaching from the sideline — direct, confident, tactical, and specific.

ASURA CORE PHILOSOPHY:
- Compliance is the baseline, not the ceiling. You can be compliant AND high-performing.
- Stop selling. Start guiding. 88% of customers buy when you position as a guide, not a salesperson.
- Trust is the currency of the F&I office. Without it, your word tracks are just noise.
- The best objection handling is preventing them from ever forming.
- Clarity creates the sale. The menu is not a list of products — it is a visual confirmation of a trust-based conversation.

THE ASURA PROCESS FLOW (grade every session against this):
1. PROFESSIONAL HELLO — Smile, firm handshake, name + role, eye contact 3+ seconds, look elite
2. AUTHORITY FRAME — "I have three responsibilities today: state/federal documents, warranty review, and getting you out of here quickly."
3. CLIENT SURVEY — Run the 3 Core Questions BEFORE the menu
4. DEAL REVIEW — State terms as facts, not questions. Transfer trust of the sale.
5. MENU PRESENTATION — Follow ASURA menu order: VSA → GAP → Appearance/Chemical → Upgrades
6. RANKING SYSTEM — After any "no," use: "If you had to rank what's most important, what would be first?"
7. CLOSE — Assume the business. "One of the nice things about doing business here is we can customize a program based on what's most important to you."

THE 3 CORE CLIENT SURVEY QUESTIONS (must be asked before menu):
Q1 PREPAREDNESS: "On a scale of 1-10, how prepared are you for a major, unexpected repair bill?"
Q2 IMPACT: "If something happened to this vehicle tomorrow, what would that do to your family's budget?"
Q3 EXPERIENCE: "Have you ever experienced a mechanical breakdown or unexpected repair?"

THE TRIANGLE OF INFLUENCE (tone coaching):
- CONFUSED: "Can you help me understand that?" — Disarms defensiveness
- CURIOUS: "Tell me more about that..." — Opens dialogue  
- EMPATHETIC: "I completely understand that." — Builds trust instantly

ASURA MENU ORDER (4-Pillar Framework):
PILLAR 1 — MECHANICAL: VSA (Vehicle Service Agreement) → Tire & Wheel → Key Replacement → Maintenance
PILLAR 2 — COSMETIC: Chemical/Appearance → Windshield → 3M Clear Bra → Window Tint
PILLAR 3 — CREDIT: GAP → Vehicle Replacement Benefit → Anti-Theft
PILLAR 4 — SIMPLICITY: Maintenance packages, bundles

LANGUAGE SHIFTS (always correct these):
❌ "Warranty" → ✅ "Service Agreement"
❌ "Optional" → ✅ "Opt-out of responsibility"
❌ "Do you want this?" → ✅ "This transfers the responsibility away from you"
❌ "It's covered/not covered" → ✅ "You can opt out of this responsibility"
❌ "This is optional" → ✅ "Your only responsibility is to own and enjoy your vehicle"

UPGRADE STACKS (suggest these logical bundles):
MECHANICAL STACK: VSA → Tire & Wheel → Key → Maintenance
DEFICIENCY STACK: GAP → Vehicle Replacement Benefit → Theft Device
APPEARANCE STACK: Chemical → Windshield → 3M + Tint

COMPLIANCE REQUIREMENTS (flag immediately if missed):
- Privacy Policy disclosure (must be given before any credit discussion)
- Risk-Based Pricing notice (if applicable)
- Base payment disclosure (must state payment WITHOUT products first)
- ECOA adverse action rights
- TILA disclosures (APR, finance charge, total of payments)

YOUR RESPONSE FORMAT (strict JSON, no markdown):
{
  "type": "objection_handling" | "product_recommendation" | "closing_technique" | "compliance_reminder" | "rapport_building" | "language_correction" | "process_alert",
  "title": "Short action title (max 8 words)",
  "content": "1-2 sentence ASURA coaching insight — direct, specific, no fluff",
  "script": "Exact verbatim ASURA word track the manager should say RIGHT NOW, in quotes",
  "urgency": "high" | "medium" | "low",
  "triggeredBy": "The specific phrase or pattern that triggered this suggestion",
  "framework": "Which ASURA framework this comes from (e.g., Objection Prevention Matrix, Ranking System, Client Survey)"
}

RULES:
- Every script must be verbatim ASURA language — not paraphrased
- If you detect wrong language (e.g., "warranty" instead of "service agreement"), flag it immediately as language_correction
- If compliance is at risk, urgency is always "high" regardless of context
- Never give generic advice. Every suggestion must be specific to what was just said.
- Coach like Adrian Anania — direct, confident, no apologies, no hedging`;

// ─── ASURA Objection Trigger Library ─────────────────────────────────────────
export const ASURA_TRIGGERS = {
  // Price / Cost objections
  objection_price: /too expensive|can't afford|too much|over budget|costs too much|that's a lot|that's high|don't have the money|tight on money|monthly payment too high/i,

  // "Think about it" stall
  objection_think: /think about it|need to think|let me think|talk to my (wife|husband|spouse|partner)|have to discuss|sleep on it|not sure yet|need time/i,

  // "I never use it" / "I don't need it"
  objection_never_use: /never use it|don't need it|never had a problem|never broken down|always been reliable|don't use those things|waste of money/i,

  // "Already have coverage"
  objection_coverage: /already have|covered by|have insurance|have a warranty|dealer warranty|factory warranty covers|manufacturer covers/i,

  // Buying signals — close NOW
  closing_signal: /sounds good|that makes sense|okay let's do it|let's go with|I'll take it|add that on|go ahead|that works|let's move forward|I like that one/i,

  // GAP opportunity
  product_gap: /total loss|totaled|upside down|owe more than|negative equity|rolled over|gap in coverage|deficiency balance|what if it's totaled/i,

  // VSA/VSC opportunity
  product_vsa: /repair bill|breakdown|out of warranty|warranty expired|expensive repair|transmission|engine|worried about repairs|what if something breaks/i,

  // Tire & Wheel opportunity
  product_tire: /tires|wheels|pothole|road hazard|flat tire|rim damage|curb rash/i,

  // Wrong language — "warranty" instead of "service agreement"
  language_warranty: /\bwarranty\b(?! (expires|expired|end|ends|period|coverage|included|comes with|factory|manufacturer|bumper))/i,

  // Wrong language — "optional"
  language_optional: /\boptional\b/i,

  // Compliance — base payment not disclosed
  compliance_base_payment: /monthly payment is \$[\d,]+(?! without| before| not including| excluding)/i,

  // Rapport / discovery moment
  rapport_family: /kids|children|family|wife|husband|spouse|commute|drive a lot|road trips|long drives/i,

  // Ranking system trigger (customer said no to full package)
  ranking_trigger: /no thanks|not interested|pass on that|don't want|skip that|none of those|just the car/i,

  // Client survey not started
  survey_needed: /let me show you|here's your menu|let's go over|I want to present/i,
};

// ─── ASURA Proprietary Response Cache ────────────────────────────────────────
// These are the exact ASURA word tracks — verbatim from training materials
export const ASURA_RESPONSE_CACHE: Record<string, {
  type: string;
  title: string;
  content: string;
  script: string;
  urgency: "high" | "medium" | "low";
  framework: string;
  scriptId: string;
}> = {

  objection_price: {
    type: "objection_handling",
    title: "Price Objection — Responsibility Transfer",
    content: "Use the Triangle of Influence — lead with empathy, then reframe from cost to responsibility. The customer is not buying a product; they are opting out of a financial risk.",
    script: "\"I completely understand that. Can you help me understand your concern? Because what this really does is transfer the responsibility of a $6,000 repair away from you. Your only responsibility is to own and enjoy your vehicle.\"",
    urgency: "high",
    framework: "Objection Prevention Matrix — Responsibility Transfer",
    scriptId: "objection_price",
  },

  objection_think: {
    type: "objection_handling",
    title: "Think It Over — Isolate the Real Concern",
    content: "Never let them leave without isolating the real objection. Use the curious tone to surface what's actually holding them back.",
    script: "\"I completely understand. What specifically would you like to think about so I can give you the right information? Is it the investment, the coverage itself, or something else I can clarify right now?\"",
    urgency: "high",
    framework: "Objection Prevention Matrix — 3x3 Matrix",
    scriptId: "objection_think",
  },

  objection_never_use: {
    type: "objection_handling",
    title: "Never Use It — The Responsibility Reframe",
    content: "The people who need protection most never expected to. Reframe from 'using it' to 'not being responsible for it.'",
    script: "\"That's exactly why you need it. The people who need it most never expected to. Your only responsibility is to own and enjoy your vehicle — not to be responsible for a $5,000 repair bill.\"",
    urgency: "high",
    framework: "Objection Prevention Matrix — 3x3 Matrix",
    scriptId: "objection_never_use",
  },

  objection_coverage: {
    type: "objection_handling",
    title: "Coverage Objection — Find the Gap",
    content: "Probe the existing coverage. Factory warranties cover defects — not breakdowns, not wear items. Find the gap and re-present the product that fills it.",
    script: "\"That's great. Can I ask — does your coverage include mechanical and electrical breakdowns, or is it limited to manufacturer defects? Most factory warranties only cover defects. A Service Agreement covers what the factory warranty leaves out — every breakdown, every component.\"",
    urgency: "high",
    framework: "VSA Presentation Framework — Critical Distinction",
    scriptId: "objection_coverage",
  },

  closing_signal: {
    type: "closing_technique",
    title: "Buying Signal — Close with the Ranking System",
    content: "Customer is showing positive intent. Assume the business and move to customization — not a yes/no close.",
    script: "\"One of the nice things about doing business here is that we can customize a program based on what's most important to you. Let me put those together and show you exactly what it looks like.\"",
    urgency: "high",
    framework: "Ranking System — Assume the Business",
    scriptId: "closing_signal",
  },

  product_gap: {
    type: "product_recommendation",
    title: "GAP — Financial First Responder",
    content: "This is a direct GAP introduction moment. Lead with the awareness statement, then the solution, then the decision. GAP is not an expense — it is a financial first responder.",
    script: "\"You are responsible for any deficiency balance in a total loss. GAP takes care of that balance — it covers up to 150% of MSRP, up to $1,000 of your deductible, and it protects your family's credit. This ensures you never pay for a vehicle you can no longer drive.\"",
    urgency: "medium",
    framework: "GAP Protection Framework — Awareness → Solution → Decision",
    scriptId: "product_gap",
  },

  product_vsa: {
    type: "product_recommendation",
    title: "VSA Opportunity — Opt Out of Repair Responsibility",
    content: "Customer mentioned repairs or breakdown concern. Lead with the critical distinction: a warranty covers defects, a Service Agreement covers breakdowns.",
    script: "\"A warranty only covers defects. A Service Agreement covers breakdowns — mechanical and electrical failure. We list what's NOT covered; everything else IS covered. 100% parts, 100% labor. This transfers repair responsibility away from you completely.\"",
    urgency: "medium",
    framework: "VSA Presentation Framework — Frame → Comprehensive → Value → Opt-Out",
    scriptId: "product_vsa",
  },

  product_tire: {
    type: "product_recommendation",
    title: "Tire & Wheel — Upgrade the VSA Stack",
    content: "Tire & Wheel is the logical upgrade from VSA. The VSA covers breakdowns but not the wheels or keys — this is the natural upsell connector.",
    script: "\"The Service Agreement covers breakdowns — but it doesn't cover the wheels or keys. That's why most customers choose to bundle those high-wear items. A single tire replacement on this vehicle runs $300–$500. Tire & Wheel covers that completely.\"",
    urgency: "low",
    framework: "Upgrade-First Strategy — Mechanical Coverage Stack",
    scriptId: "product_tire",
  },

  language_warranty: {
    type: "language_correction",
    title: "Language Alert — Say 'Service Agreement'",
    content: "ASURA standard: never say 'warranty' when referring to F&I products. A warranty covers defects. A Service Agreement covers breakdowns. The distinction is your credibility.",
    script: "Correct to: \"Service Agreement\" — not \"warranty.\" Example: \"This Service Agreement covers mechanical and electrical breakdowns — which is different from the factory warranty that only covers defects.\"",
    urgency: "medium",
    framework: "Language Shifts — ASURA Standard",
    scriptId: "language_warranty",
  },

  language_optional: {
    type: "language_correction",
    title: "Language Alert — Never Say 'Optional'",
    content: "ASURA standard: 'optional' kills value. Replace with 'opt-out of responsibility.' The customer is not choosing to add something — they are choosing whether to keep or transfer a financial risk.",
    script: "Correct to: \"You can opt out of this responsibility\" — not \"this is optional.\" The framing changes everything.",
    urgency: "medium",
    framework: "Language Shifts — Responsibility Transfer",
    scriptId: "language_optional",
  },

  ranking_trigger: {
    type: "closing_technique",
    title: "Ranking System — Redirect After No",
    content: "Never treat 'no' as rejection. Use the Ranking System to redirect from rejection to prioritization. Calm, non-confrontational, and keeps the customer engaged.",
    script: "\"Totally understand. These are just consumer options — and in my effort to be quick, I probably went through them too fast. If you had to rank what's most important to you, what would be first?\"",
    urgency: "high",
    framework: "Ranking System — Post-No Redirect",
    scriptId: "ranking_trigger",
  },

  rapport_family: {
    type: "rapport_building",
    title: "Discovery Moment — Go Deeper",
    content: "Customer mentioned family or lifestyle. This is your anchor for the Financial Snapshot questions. Personal impact cuts deeper than professional impact.",
    script: "\"On a scale of 1-10, how prepared are you for a major, unexpected repair bill? And if something happened to this vehicle tomorrow, what would that do to your family's budget?\"",
    urgency: "low",
    framework: "Financial Snapshot Script — 3 Core Questions",
    scriptId: "rapport_family",
  },

  compliance_base_payment: {
    type: "compliance_reminder",
    title: "COMPLIANCE — Disclose Base Payment First",
    content: "CRITICAL: You must disclose the base payment WITHOUT products before presenting the menu. This is a federal compliance requirement under TILA.",
    script: "\"Your base payment — without any of the protection options — is $[X]. Now let me show you what we've put together based on your situation.\"",
    urgency: "high",
    framework: "Compliance — TILA Base Payment Disclosure",
    scriptId: "compliance_base_payment",
  },

  survey_needed: {
    type: "process_alert",
    title: "Run Client Survey FIRST",
    content: "ASURA process: the Client Survey must be completed before the menu comes out. It primes the customer, establishes your authority, and eliminates 80% of objections before they form.",
    script: "\"Before I show you anything, I want to run through a quick client survey — it'll actually speed up the whole process and make sure we customize this to your situation. First question: on a scale of 1-10, how prepared are you for a major, unexpected repair bill?\"",
    urgency: "high",
    framework: "Client Survey Secrets — Authority Frame",
    scriptId: "survey_needed",
  },
};

// ─── ASURA Grading Rubric ─────────────────────────────────────────────────────
export const ASURA_GRADING_RUBRIC = {
  introduction: {
    weight: 0.20,
    label: "Introduction & Authority Frame",
    checkpoints: [
      { id: "greeting", label: "Professional Hello (smile, handshake, name, role)", points: 10 },
      { id: "authority_frame", label: "3-Responsibility Authority Statement delivered", points: 15 },
      { id: "title_work", label: "Title work / ownership transfer explained", points: 5 },
      { id: "factory_warranty", label: "Factory warranty reviewed (not pitched)", points: 10 },
      { id: "time_frame", label: "Time frame set ('get you out quickly')", points: 5 },
      { id: "first_forms", label: "First forms / state & federal docs introduced", points: 5 },
    ],
  },
  client_survey: {
    weight: 0.20,
    label: "Client Survey & Discovery",
    checkpoints: [
      { id: "survey_q1_preparedness", label: "Q1: Preparedness scale (1-10 repair bill)", points: 15 },
      { id: "survey_q2_impact", label: "Q2: Family budget impact question asked", points: 15 },
      { id: "survey_q3_experience", label: "Q3: Prior breakdown experience asked", points: 10 },
      { id: "deal_review", label: "Deal figures stated as facts (not questions)", points: 10 },
    ],
  },
  compliance: {
    weight: 0.25,
    label: "General Compliance",
    checkpoints: [
      { id: "privacy_policy", label: "Privacy Policy disclosure given", points: 25 },
      { id: "risk_based_pricing", label: "Risk-Based Pricing notice (if applicable)", points: 15 },
      { id: "base_payment", label: "Base payment disclosed WITHOUT products first", points: 35 },
      { id: "tila_disclosures", label: "APR, finance charge, total of payments disclosed", points: 25 },
    ],
  },
  menu_presentation: {
    weight: 0.35,
    label: "Menu Presentation & Closing",
    checkpoints: [
      { id: "vsa_presented", label: "VSA presented as Service Agreement (not warranty)", points: 15 },
      { id: "gap_presented", label: "GAP presented with deficiency balance awareness", points: 15 },
      { id: "appearance_presented", label: "Appearance/Chemical presented", points: 10 },
      { id: "upgrade_stack", label: "Upgrade stack logic used (not random bundling)", points: 10 },
      { id: "language_correct", label: "ASURA language shifts used (no 'optional', no 'warranty')", points: 15 },
      { id: "ranking_system", label: "Ranking System used after any objection/no", points: 15 },
      { id: "assume_business", label: "Assumed the business (customization close)", points: 10 },
      { id: "closing_technique", label: "Proper closing technique used", points: 10 },
    ],
  },
};

// ─── ASURA Quick Trigger Function ─────────────────────────────────────────────
export function asuraQuickTrigger(text: string): typeof ASURA_RESPONSE_CACHE[string] | null {
  if (ASURA_TRIGGERS.objection_price.test(text))       return ASURA_RESPONSE_CACHE.objection_price;
  if (ASURA_TRIGGERS.objection_think.test(text))       return ASURA_RESPONSE_CACHE.objection_think;
  if (ASURA_TRIGGERS.objection_never_use.test(text))   return ASURA_RESPONSE_CACHE.objection_never_use;
  if (ASURA_TRIGGERS.objection_coverage.test(text))    return ASURA_RESPONSE_CACHE.objection_coverage;
  if (ASURA_TRIGGERS.ranking_trigger.test(text))       return ASURA_RESPONSE_CACHE.ranking_trigger;
  if (ASURA_TRIGGERS.closing_signal.test(text))        return ASURA_RESPONSE_CACHE.closing_signal;
  if (ASURA_TRIGGERS.product_gap.test(text))           return ASURA_RESPONSE_CACHE.product_gap;
  if (ASURA_TRIGGERS.product_vsa.test(text))           return ASURA_RESPONSE_CACHE.product_vsa;
  if (ASURA_TRIGGERS.product_tire.test(text))          return ASURA_RESPONSE_CACHE.product_tire;
  if (ASURA_TRIGGERS.language_warranty.test(text))     return ASURA_RESPONSE_CACHE.language_warranty;
  if (ASURA_TRIGGERS.language_optional.test(text))     return ASURA_RESPONSE_CACHE.language_optional;
  if (ASURA_TRIGGERS.rapport_family.test(text))        return ASURA_RESPONSE_CACHE.rapport_family;
  if (ASURA_TRIGGERS.survey_needed.test(text))         return ASURA_RESPONSE_CACHE.survey_needed;
  return null;
}

// ─── ASURA Compliance Rules Engine ───────────────────────────────────────────
export interface ComplianceFlag {
  rule: string;
  severity: "critical" | "warning" | "info";
  description: string;
  requirement: string;
  timestamp?: number;
}

export function asuraComplianceCheck(text: string, elapsedSeconds: number): ComplianceFlag[] {
  const flags: ComplianceFlag[] = [];

  // Base payment compliance
  if (ASURA_TRIGGERS.compliance_base_payment.test(text)) {
    flags.push({
      rule: "BASE_PAYMENT_DISCLOSURE",
      severity: "critical",
      description: "Payment quoted without disclosing base payment first",
      requirement: "TILA requires base payment WITHOUT products to be disclosed before presenting F&I menu",
    });
  }

  // "Optional" language — compliance risk in some states
  if (/\boptional\b/i.test(text)) {
    flags.push({
      rule: "LANGUAGE_OPTIONAL",
      severity: "warning",
      description: "Word 'optional' used — creates implied pressure in some states",
      requirement: "ASURA standard: replace with 'opt-out of responsibility' or 'you can choose to keep or transfer this risk'",
    });
  }

  // Credit terms discussed before privacy policy (first 2 minutes)
  if (elapsedSeconds < 120 && /credit|financing|apr|interest rate|payment/i.test(text)) {
    flags.push({
      rule: "PRIVACY_POLICY_TIMING",
      severity: "warning",
      description: "Credit terms discussed — confirm Privacy Policy was delivered first",
      requirement: "Privacy Policy must be provided before any credit-related discussion",
    });
  }

  // Guaranteed approval language
  if (/guaranteed approval|definitely approved|you're approved|100% approved/i.test(text)) {
    flags.push({
      rule: "GUARANTEED_APPROVAL",
      severity: "critical",
      description: "Guaranteed approval language used — ECOA violation risk",
      requirement: "Never guarantee credit approval. Use: 'based on the information provided, we've secured financing at...'",
    });
  }

  // Discriminatory language indicators
  if (/because you're|since you are|people like you|your type/i.test(text)) {
    flags.push({
      rule: "ECOA_LANGUAGE",
      severity: "critical",
      description: "Potentially discriminatory language pattern detected",
      requirement: "ECOA prohibits credit decisions or language based on protected characteristics",
    });
  }

  return flags;
}

// ─── ASURA Performance Grading Function ──────────────────────────────────────
export function calculateAsuraScore(checklist: Record<string, boolean>): {
  totalScore: number;
  categoryScores: Record<string, number>;
  grade: "Elite" | "Proficient" | "Developing" | "Needs Coaching";
  feedback: string[];
} {
  const categoryScores: Record<string, number> = {};
  const feedback: string[] = [];

  for (const [category, config] of Object.entries(ASURA_GRADING_RUBRIC)) {
    let earned = 0;
    let possible = 0;
    for (const checkpoint of config.checkpoints) {
      possible += checkpoint.points;
      if (checklist[checkpoint.id]) {
        earned += checkpoint.points;
      } else {
        feedback.push(`${config.label}: "${checkpoint.label}" not completed`);
      }
    }
    categoryScores[category] = possible > 0 ? Math.round((earned / possible) * 100) : 0;
  }

  // Weighted total score
  const totalScore = Math.round(
    (categoryScores.introduction ?? 0) * ASURA_GRADING_RUBRIC.introduction.weight +
    (categoryScores.client_survey ?? 0) * ASURA_GRADING_RUBRIC.client_survey.weight +
    (categoryScores.compliance ?? 0) * ASURA_GRADING_RUBRIC.compliance.weight +
    (categoryScores.menu_presentation ?? 0) * ASURA_GRADING_RUBRIC.menu_presentation.weight
  );

  const grade =
    totalScore >= 85 ? "Elite" :
    totalScore >= 70 ? "Proficient" :
    totalScore >= 55 ? "Developing" :
    "Needs Coaching";

  return { totalScore, categoryScores, grade, feedback };
}
