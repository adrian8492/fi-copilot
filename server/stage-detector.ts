/**
 * ASURA Stage Detector
 * ─────────────────────────────────────────────────────────────────────────────
 * Detects which of the 6 ASURA process steps is currently active based on
 * keyword analysis of the live transcript.
 *
 * The 6 ASURA Steps:
 *   Step 1 — Connection (greeting, rapport, trust transfer)
 *   Step 2 — Situation Awareness (client survey / retail delivery worksheet)
 *   Step 3 — Problem Awareness (warranty review / deficiency balance education)
 *   Step 4 — Solution (menu presentation / consumer protection options)
 *   Step 5 — Consequence (what happens if they DON'T protect themselves)
 *   Step 6 — Pillars (presenting the three options / ranking process)
 */

export type AsuraStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface StageDetectionResult {
  step: AsuraStep;
  label: string;
  description: string;
  confidence: "high" | "medium" | "low";
  triggeredBy: string[];
  scriptSuggestion: string;
  menuOrderReminder?: string;
}

// ─── Step Definitions ─────────────────────────────────────────────────────────

export const ASURA_STEPS: Record<AsuraStep, { label: string; description: string }> = {
  1: { label: "Connection", description: "Trust transfer, warm greeting, set the agenda" },
  2: { label: "Situation Awareness", description: "Client survey — understand needs & current situation" },
  3: { label: "Problem Awareness", description: "Warranty review — expose the gap in coverage" },
  4: { label: "Solution", description: "Menu presentation — consumer protection options" },
  5: { label: "Consequence", description: "Paint the picture of what happens without protection" },
  6: { label: "Pillars", description: "Present the three option tiers — Option 1 first, always" },
};

// ─── Script Suggestions by Step ───────────────────────────────────────────────

export const SCRIPT_SUGGESTIONS: Record<AsuraStep, string> = {
  1: "Welcome them by name. Set expectations: 'I want to walk you through a few things that are going to protect you before we get started.'",
  2: "On a scale of 1-10, how important is it that your vehicle expenses stay predictable month to month?",
  3: "What is your understanding of the factory warranty? Most people think they're covered — let me show you where the gaps are.",
  4: "I've put together three packages for you today. Option 1 is our most comprehensive — this is what most of our customers choose. Let me walk you through it.",
  5: "If [X] happened at month 25, that's $[Y] out of pocket. I want to make sure you're clear on that before we move forward.",
  6: "Let's start with Option 1 — the Platinum. This gives you complete protection. Tell me, which of these is most important to you?",
};

// ─── Menu Order Reminder (Step 4 specific) ────────────────────────────────────

export const MENU_ORDER_REMINDER =
  "VSC (Vehicle Service Contract) → GAP (Guaranteed Asset Protection) → T&W (Tire & Wheel) → Appearance Protection";

// ─── Compliance Risk Phrases ──────────────────────────────────────────────────

export interface ComplianceRisk {
  phrase: string;
  pattern: RegExp;
  warning: string;
  severity: "critical" | "warning";
}

export const COMPLIANCE_RISK_PHRASES: ComplianceRisk[] = [
  {
    phrase: "extended warranty",
    pattern: /extended\s+warranty/i,
    warning: "Say 'Vehicle Service Agreement' — never 'extended warranty'. Regulatory risk.",
    severity: "critical",
  },
  {
    phrase: "insurance",
    pattern: /\bgap\s+insurance\b/i,
    warning: "GAP is not insurance — it is Guaranteed Asset Protection. Say 'GAP coverage' or 'GAP program'.",
    severity: "critical",
  },
  {
    phrase: "you have to",
    pattern: /you\s+(have\s+to|must|need\s+to)\s+(buy|purchase|get|take)/i,
    warning: "Never use mandatory language. Use guide language: 'Most customers choose...' or 'I recommend...'",
    severity: "warning",
  },
  {
    phrase: "free",
    pattern: /\bfree\b.*\b(protection|coverage|warranty|service)\b|\b(protection|coverage|warranty|service)\b.*\bfree\b/i,
    warning: "Don't imply coverage is free. Be clear about costs and terms.",
    severity: "warning",
  },
  {
    phrase: "guarantee",
    pattern: /\bguarantee\b(?!d\s+asset)/i,
    warning: "Avoid absolute guarantees. Use qualified language: 'typically covers', 'designed to protect'.",
    severity: "warning",
  },
  {
    phrase: "promise",
    pattern: /\bI\s+promise\b|\bwe\s+promise\b/i,
    warning: "Avoid personal promises. Stick to documented product benefits.",
    severity: "warning",
  },
  {
    phrase: "include this",
    pattern: /\b(already\s+included|bundled\s+in|comes\s+with)\b/i,
    warning: "Do not imply products are already included in the deal. Each product must be disclosed separately with its cost.",
    severity: "critical",
  },
];

// ─── Step Detection Keyword Sets ──────────────────────────────────────────────

interface StepKeywords {
  high: RegExp[];   // strong signals
  medium: RegExp[]; // medium signals
}

const STEP_KEYWORDS: Record<AsuraStep, StepKeywords> = {
  1: {
    high: [
      /good\s+(morning|afternoon|evening)/i,
      /welcome\s+to/i,
      /my\s+name\s+is/i,
      /trust\s+transfer/i,
      /before\s+we\s+get\s+started/i,
      /set\s+the\s+agenda/i,
    ],
    medium: [
      /how\s+are\s+you/i,
      /nice\s+to\s+meet/i,
      /have\s+a\s+seat/i,
      /thank\s+you\s+for\s+(coming|being)/i,
    ],
  },
  2: {
    high: [
      /scale\s+of\s+1.{0,5}10/i,
      /retail\s+delivery\s+(preparation|worksheet)/i,
      /client\s+survey/i,
      /vehicle\s+expenses\s+stay\s+predictable/i,
      /how\s+important\s+is\s+it/i,
    ],
    medium: [
      /how\s+do\s+you\s+(use\s+your\s+vehicle|drive)/i,
      /primary\s+driver/i,
      /how\s+many\s+miles/i,
      /do\s+you\s+have\s+a\s+preferred\s+(mechanic|shop)/i,
      /survey/i,
    ],
  },
  3: {
    high: [
      /factory\s+warranty/i,
      /manufacturer.{0,10}warranty/i,
      /understanding\s+of\s+the\s+(factory|manufacturer)/i,
      /warranty\s+(expires?|runs?\s+out|coverage)/i,
      /deficiency\s+balance/i,
      /gap\s+in\s+coverage/i,
    ],
    medium: [
      /warranty\s+review/i,
      /bumper.{0,10}bumper/i,
      /powertrain/i,
      /what\s+does\s+(your\s+)?warranty\s+cover/i,
      /after\s+the\s+warranty/i,
    ],
  },
  4: {
    high: [
      /vehicle\s+service\s+(contract|agreement)/i,
      /\bvsc\b/i,
      /consumer\s+protection\s+options/i,
      /menu/i,
      /three\s+(packages|options|tiers)/i,
      /option\s+1/i,
      /platinum/i,
      /guaranteed\s+asset\s+protection/i,
      /\bgap\b.*cover/i,
      /tire\s+and\s+wheel/i,
      /appearance\s+protection/i,
      /ceramic\s+coat/i,
      /prepaid\s+maintenance/i,
      /paintless\s+dent/i,
      /paint\s+protection\s+film/i,
    ],
    medium: [
      /protect(ion|ed)/i,
      /coverage/i,
      /package/i,
      /product/i,
      /deductible/i,
      /\$0\.00\s+deductible\b/i,
    ],
  },
  5: {
    high: [
      /out\s+of\s+pocket/i,
      /what\s+happens\s+if/i,
      /if\s+(that|something)\s+happens\s+at\s+month/i,
      /imagine\s+if/i,
      /without\s+(this\s+)?protection/i,
      /repair\s+(bill|cost)/i,
      /I\s+want\s+to\s+make\s+sure\s+you.{0,10}(clear|aware)/i,
    ],
    medium: [
      /risk/i,
      /expense/i,
      /cost\s+you/i,
      /liability/i,
      /total\s+loss/i,
      /upside\s+down/i,
    ],
  },
  6: {
    high: [
      /option\s+(1|2|3|one|two|three)/i,
      /present\s+option\s+1\s+first/i,
      /most\s+important\s+to\s+you/i,
      /rank(ing|ed?)/i,
      /which\s+(one\s+)?is\s+most\s+important/i,
      /let.{0,5}start\s+with\s+option\s+1/i,
      /customize\s+your\s+(package|protection)/i,
    ],
    medium: [
      /which\s+would\s+you\s+(prefer|like)/i,
      /priority/i,
      /most\s+value/i,
      /choose/i,
    ],
  },
};

// ─── Core Detection Function ──────────────────────────────────────────────────

/**
 * Detect the current ASURA process step from a transcript string.
 * Scores each step based on keyword matches and returns the highest-scoring step.
 */
export function detectAsuraStep(transcript: string): StageDetectionResult {
  const lower = transcript.toLowerCase();
  const last500 = lower.slice(-500); // Focus on recent speech

  const scores: Record<AsuraStep, { score: number; triggers: string[] }> = {
    1: { score: 0, triggers: [] },
    2: { score: 0, triggers: [] },
    3: { score: 0, triggers: [] },
    4: { score: 0, triggers: [] },
    5: { score: 0, triggers: [] },
    6: { score: 0, triggers: [] },
  };

  const steps: AsuraStep[] = [1, 2, 3, 4, 5, 6];

  for (const step of steps) {
    const keywords = STEP_KEYWORDS[step];

    // High-confidence matches: 3 points each
    for (const pattern of keywords.high) {
      const match = last500.match(pattern);
      if (match) {
        scores[step].score += 3;
        scores[step].triggers.push(match[0]);
      }
    }

    // Medium-confidence matches: 1 point each
    for (const pattern of keywords.medium) {
      const match = last500.match(pattern);
      if (match) {
        scores[step].score += 1;
        scores[step].triggers.push(match[0]);
      }
    }
  }

  // Find the highest-scoring step
  let bestStep: AsuraStep = 1;
  let bestScore = 0;

  for (const step of steps) {
    if (scores[step].score > bestScore) {
      bestScore = scores[step].score;
      bestStep = step;
    }
  }

  // Determine confidence
  let confidence: "high" | "medium" | "low";
  if (bestScore >= 6) confidence = "high";
  else if (bestScore >= 3) confidence = "medium";
  else confidence = "low";

  const result: StageDetectionResult = {
    step: bestStep,
    label: ASURA_STEPS[bestStep].label,
    description: ASURA_STEPS[bestStep].description,
    confidence,
    triggeredBy: scores[bestStep].triggers.slice(0, 5),
    scriptSuggestion: SCRIPT_SUGGESTIONS[bestStep],
  };

  if (bestStep === 4) {
    result.menuOrderReminder = MENU_ORDER_REMINDER;
  }

  return result;
}

/**
 * Compute a live execution score (0–100) based on:
 * - Process sequence adherence (did they follow Steps 1→2→3→4→5→6 in order?)
 * - Survey completion (did they run the client survey at Step 2?)
 * - Guide language vs. closer language ratio
 */
export interface ExecutionScoreResult {
  score: number;
  breakdown: {
    sequenceAdherence: number; // 0-40 points
    surveyCompleted: number;   // 0-30 points
    guideLanguage: number;     // 0-30 points
  };
  feedback: string[];
}

export function computeExecutionScore(
  transcript: string,
  detectedSteps: AsuraStep[]
): ExecutionScoreResult {
  const lower = transcript.toLowerCase();
  const feedback: string[] = [];

  // ─── Sequence Adherence (0–40 points) ──────────────────────────────────────
  // Check that steps appear in the right order
  let sequenceScore = 40;
  if (detectedSteps.length < 2) {
    sequenceScore = 10; // Not enough data
  } else {
    let outOfOrder = 0;
    for (let i = 1; i < detectedSteps.length; i++) {
      if (detectedSteps[i] < detectedSteps[i - 1] - 1) {
        outOfOrder++;
      }
    }
    sequenceScore = Math.max(0, 40 - outOfOrder * 10);
    if (outOfOrder > 0) {
      feedback.push(`Step sequence appears out of order ${outOfOrder} time(s). Follow Steps 1→2→3→4→5→6.`);
    }
  }

  // ─── Survey Completion (0–30 points) ──────────────────────────────────────
  // Did they use the "scale of 1-10" survey question?
  const surveyPatterns = [
    /scale\s+of\s+1.{0,5}10/i,
    /retail\s+delivery\s+(preparation|worksheet)/i,
    /client\s+survey/i,
    /how\s+important\s+is\s+it.*predictable/i,
  ];
  const surveyHits = surveyPatterns.filter((p) => p.test(lower)).length;
  const surveyScore = surveyHits >= 2 ? 30 : surveyHits === 1 ? 15 : 0;
  if (surveyScore === 0) {
    feedback.push("Client survey not detected. Run the 'scale of 1-10' question before presenting the menu.");
  } else if (surveyScore === 15) {
    feedback.push("Partial survey detected. Strengthen with the full retail delivery preparation worksheet.");
  }

  // ─── Guide Language (0–30 points) ─────────────────────────────────────────
  // Guide language: "most customers...", "I recommend...", "typically..."
  // Closer language: "you need to", "you must", "you have to"
  const guidePatterns = [
    /most\s+(customers|people|clients)/i,
    /I\s+recommend/i,
    /typically/i,
    /most\s+of\s+our\s+customers/i,
    /what\s+I\s+suggest/i,
    /let\s+me\s+show\s+you/i,
  ];
  const closerPatterns = [
    /you\s+(have\s+to|must|need\s+to)\s+(buy|purchase|get|take)/i,
    /you\s+should\s+definitely/i,
    /I\s+strongly\s+urge/i,
  ];

  const guideHits = guidePatterns.filter((p) => p.test(lower)).length;
  const closerHits = closerPatterns.filter((p) => p.test(lower)).length;
  const guideRatio = guideHits / Math.max(1, guideHits + closerHits);
  const guideScore = Math.round(guideRatio * 30);

  if (closerHits > 0) {
    feedback.push(`${closerHits} instance(s) of closer language detected. Replace with guide language: "most customers choose..."`);
  }

  const totalScore = Math.min(100, sequenceScore + surveyScore + guideScore);

  return {
    score: totalScore,
    breakdown: {
      sequenceAdherence: sequenceScore,
      surveyCompleted: surveyScore,
      guideLanguage: guideScore,
    },
    feedback,
  };
}

/**
 * Scan a transcript chunk for compliance risk phrases.
 * Returns any triggered warnings.
 */
export function detectComplianceRisks(text: string): ComplianceRisk[] {
  return COMPLIANCE_RISK_PHRASES.filter((risk) => risk.pattern.test(text));
}
