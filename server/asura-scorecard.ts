/**
 * ASURA OPS Scorecard Engine
 *
 * Evaluates each F&I session transcript against ASURA's 4 pillars:
 * 1. Menu Order System       — VSA first, correct sequence (weight: 25%)
 * 2. Upgrade Architecture    — 3 tiers presented, upgrade moment deployed (weight: 25%)
 * 3. Objection Prevention    — guide opening used, handoff language correct (weight: 25%)
 * 4. Coaching Cadence        — week-over-week improvement, deal autopsy integration (weight: 25%)
 *
 * Produces a "Tier-1 Score" (0–100) with per-pillar breakdown.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PillarScore {
  score: number; // 0–100
  criteria: CriterionResult[];
  insights: string[];
}

export interface CriterionResult {
  id: string;
  label: string;
  passed: boolean;
  points: number;
  maxPoints: number;
  evidence?: string;
}

export interface ASURAScorecardResult {
  /** Weighted overall Tier-1 Score (0–100) */
  tier1Score: number;
  /** Per-pillar breakdowns */
  menuOrderScore: number;
  upgradeArchitectureScore: number;
  objectionPreventionScore: number;
  coachingCadenceScore: number;
  /** Detailed pillar data */
  menuOrderPillar: PillarScore;
  upgradeArchitecturePillar: PillarScore;
  objectionPreventionPillar: PillarScore;
  coachingCadencePillar: PillarScore;
  /** Top coaching action items */
  coachingPriorities: string[];
  /** Tier label based on score */
  tier: "Tier-1" | "Tier-2" | "Tier-3" | "Below-Tier";
  gradedAt: string;
}

export interface CoachingCadenceInput {
  /** Previous session scores for this manager (chronological, oldest first) */
  priorScores?: number[];
  /** Prior deal autopsy data */
  priorDealAutopsy?: {
    totalSessions: number;
    averageScore: number;
    consistencyScore: number;
  };
  /** Word track utilization rate (0–100) */
  wordTrackUtilizationRate?: number;
}

// ─── Pillar 1: Menu Order System ─────────────────────────────────────────────

/**
 * Checks that products were presented in ASURA's prescribed sequence:
 * VSC → T&W → Key → Oil → GAP → Anti-Theft → GPS → Ceramic → PDR → 3M
 * Scores VSA-first presentation, correct sequencing, and all 10 products covered.
 */
export function scoreMenuOrder(transcript: string): PillarScore {
  const t = transcript.toLowerCase();

  // Required product sequence (ASURA OPS order)
  const PRODUCT_SEQUENCE = [
    {
      id: "vsc",
      label: "Vehicle Service Agreement (VSC)",
      keywords: ["vehicle service agreement", "vehicle service contract", "vsa", "not an extended warranty", "deemed defective", "100% of parts", "100% of labor"],
    },
    {
      id: "tw",
      label: "Tire & Wheel Protection",
      keywords: ["tires and wheels", "tire and wheel", "road hazard", "anything that is not supposed to be there", "cosmetic repair", "$0.00 deductible"],
    },
    {
      id: "key",
      label: "Key Replacement",
      keywords: ["key replacement", "damaged, lost, or stolen", "reprogram", "$800 per occurrence"],
    },
    {
      id: "oil",
      label: "Prepaid Maintenance / Oil Program",
      keywords: ["oil maintenance", "prepaid maintenance", "oil changes and filters", "regularly scheduled intervals"],
    },
    {
      id: "gap",
      label: "GAP Insurance",
      keywords: ["guaranteed asset protection", "gap", "deficiency balance", "total loss", "150%", "not an insurance"],
    },
    {
      id: "antitheft",
      label: "Anti-Theft",
      keywords: ["anti-theft", "vehicle anti-theft", "vehicle replacement", "stolen and deemed a total loss"],
    },
    {
      id: "gps",
      label: "GPS / Active System",
      keywords: ["gps", "active system", "register your vehicle with the police", "notification"],
    },
    {
      id: "ceramic",
      label: "Ceramic / Appearance Protection",
      keywords: ["ceramic", "not a wax", "bird droppings", "tree sap", "acid rain", "oxidation", "stains, spills"],
    },
    {
      id: "pdr",
      label: "Paintless Dent Repair",
      keywords: ["door dings", "paintless dent", "doesn't break the paint", "windshield gets chipped"],
    },
    {
      id: "threemm",
      label: "3M / Paint Protection Film",
      keywords: ["3m", "chip-sealed", "rock chips", "leading edges", "clear tape"],
    },
  ];

  // Find first occurrence position of each product in transcript
  const productPositions: Record<string, number> = {};
  PRODUCT_SEQUENCE.forEach((product) => {
    let earliest = -1;
    for (const kw of product.keywords) {
      const idx = t.indexOf(kw.toLowerCase());
      if (idx !== -1 && (earliest === -1 || idx < earliest)) {
        earliest = idx;
      }
    }
    if (earliest !== -1) {
      productPositions[product.id] = earliest;
    }
  });

  const foundProducts = Object.keys(productPositions);
  const foundProductsOrdered = foundProducts.sort((a, b) => productPositions[a] - productPositions[b]);

  // Criterion 1: VSC presented first (40 pts)
  const vsaFirst: CriterionResult = {
    id: "menu-vsa-first",
    label: "VSA/VSC presented first in menu",
    passed: foundProductsOrdered[0] === "vsc",
    points: foundProductsOrdered[0] === "vsc" ? 40 : 0,
    maxPoints: 40,
    evidence: foundProductsOrdered[0] === "vsc"
      ? "VSA detected as first product presented"
      : foundProductsOrdered.length > 0
        ? `First product detected was "${foundProductsOrdered[0]}" instead of VSC`
        : "No product presentation detected",
  };

  // Criterion 2: Correct overall sequence (30 pts)
  let sequenceMatches = 0;
  for (let i = 0; i < foundProductsOrdered.length - 1; i++) {
    const aIdx = PRODUCT_SEQUENCE.findIndex((p) => p.id === foundProductsOrdered[i]);
    const bIdx = PRODUCT_SEQUENCE.findIndex((p) => p.id === foundProductsOrdered[i + 1]);
    if (aIdx < bIdx) sequenceMatches++;
  }
  const seqPct = foundProductsOrdered.length > 1 ? sequenceMatches / (foundProductsOrdered.length - 1) : 0;
  const sequenceCorrect: CriterionResult = {
    id: "menu-sequence",
    label: "Products presented in correct ASURA sequence",
    passed: seqPct >= 0.8,
    points: Math.round(seqPct * 30),
    maxPoints: 30,
    evidence: foundProductsOrdered.length > 1
      ? `${sequenceMatches}/${foundProductsOrdered.length - 1} consecutive pairs in correct order`
      : "Insufficient products detected for sequence check",
  };

  // Criterion 3: Coverage breadth — all 10 products presented (30 pts)
  const coveragePct = foundProducts.length / PRODUCT_SEQUENCE.length;
  const coverageFull: CriterionResult = {
    id: "menu-coverage",
    label: "All 10 ASURA products presented",
    passed: coveragePct >= 0.8,
    points: Math.round(coveragePct * 30),
    maxPoints: 30,
    evidence: `${foundProducts.length}/10 products detected in transcript`,
  };

  const criteria = [vsaFirst, sequenceCorrect, coverageFull];
  const score = Math.min(100, criteria.reduce((sum, c) => sum + c.points, 0));

  const insights: string[] = [];
  if (!vsaFirst.passed) {
    insights.push("Critical: Start the menu with VSA — it anchors the highest perceived value and sets the tone for the entire presentation.");
  }
  if (seqPct < 0.8) {
    insights.push("Menu sequence out of order. Follow: VSC → T&W → Key → Oil → GAP → Anti-Theft → GPS → Ceramic → PDR → 3M.");
  }
  if (coveragePct < 0.7) {
    insights.push(`Only ${foundProducts.length} of 10 products presented. Every product has a buyer — don't leave money on the table.`);
  }
  if (score >= 90) {
    insights.push("Excellent menu discipline. Consistent sequencing builds the customer's frame for the upgrade conversation.");
  }

  return { score, criteria, insights };
}

// ─── Pillar 2: Upgrade Architecture ──────────────────────────────────────────

/**
 * Checks for 3-tier menu presentation and the "upgrade moment" deployment.
 * ASURA OPS: Present platinum/gold/silver tiers, deploy the upgrade move
 * when the customer selects a lower tier.
 */
export function scoreUpgradeArchitecture(transcript: string): PillarScore {
  const t = transcript.toLowerCase();

  // Criterion 1: 3-tier menu presentation (35 pts)
  const tierKeywords = {
    platinum: ["platinum", "most comprehensive", "full protection", "option 1", "top package", "level 1"],
    gold: ["gold", "middle option", "option 2", "second option", "level 2", "mid-level", "balanced"],
    silver: ["silver", "basic", "option 3", "third option", "level 3", "entry level", "essential"],
  };
  const tierPresence = {
    platinum: tierKeywords.platinum.some((k) => t.includes(k)),
    gold: tierKeywords.gold.some((k) => t.includes(k)),
    silver: tierKeywords.silver.some((k) => t.includes(k)),
  };
  const tiersPresented = Object.values(tierPresence).filter(Boolean).length;
  const threeTiers: CriterionResult = {
    id: "upgrade-3tiers",
    label: "3-tier menu structure presented (Platinum/Gold/Silver)",
    passed: tiersPresented === 3,
    points: tiersPresented === 3 ? 35 : tiersPresented === 2 ? 20 : tiersPresented === 1 ? 10 : 0,
    maxPoints: 35,
    evidence: `Detected ${tiersPresented}/3 tiers: ${Object.entries(tierPresence).filter(([, v]) => v).map(([k]) => k).join(", ") || "none"}`,
  };

  // Criterion 2: Upgrade moment deployed (35 pts)
  const upgradeKeywords = [
    "upgrade", "move up", "step up", "for just", "the difference is only",
    "only a few dollars more", "add", "what if we", "what would it take",
    "customize a program", "rank first", "rank second", "excellent choice",
    "which one would you rank", "most important to you",
  ];
  const upgradeDetected = upgradeKeywords.some((k) => t.includes(k));
  const upgradeMoment: CriterionResult = {
    id: "upgrade-moment",
    label: "Upgrade moment deployed (ranking/upgrade language used)",
    passed: upgradeDetected,
    points: upgradeDetected ? 35 : 0,
    maxPoints: 35,
    evidence: upgradeDetected
      ? "Upgrade language detected: " + upgradeKeywords.filter((k) => t.includes(k)).slice(0, 3).join(", ")
      : "No upgrade deployment language detected",
  };

  // Criterion 3: Assuming-business close (30 pts)
  const assumingBusinessKeywords = [
    "assuming business", "which would you prefer", "i'll put you down for",
    "would you like to include", "let's go ahead", "we'll add that to",
    "option 1 includes", "that package includes",
  ];
  const assumingClose: CriterionResult = {
    id: "upgrade-assuming-close",
    label: "Assuming-business close technique used",
    passed: assumingBusinessKeywords.some((k) => t.includes(k)),
    points: assumingBusinessKeywords.some((k) => t.includes(k)) ? 30 : 0,
    maxPoints: 30,
    evidence: assumingBusinessKeywords.some((k) => t.includes(k))
      ? "Assuming-business language detected"
      : "No assuming-business close detected — manager waited for customer to decide instead of assuming the sale",
  };

  const criteria = [threeTiers, upgradeMoment, assumingClose];
  const score = Math.min(100, criteria.reduce((sum, c) => sum + c.points, 0));

  const insights: string[] = [];
  if (tiersPresented < 3) {
    insights.push("Present all 3 tiers every time. Customers buy based on contrast — remove a tier and you collapse perceived value.");
  }
  if (!upgradeDetected) {
    insights.push("No upgrade moment found. When the customer reaches for the lower option, that's your window — deploy the ranking question immediately.");
  }
  if (!assumingClose.passed) {
    insights.push("Use assuming-business language: 'Let me get Option 1 started for you' instead of 'Which one do you want?'");
  }
  if (score >= 90) {
    insights.push("Strong upgrade architecture. Consistent 3-tier delivery with active upgrade deployment is what separates $700 PRU from $1,200 PRU.");
  }

  return { score, criteria, insights };
}

// ─── Pillar 3: Objection Prevention Framework ────────────────────────────────

/**
 * Checks for guide opening (framing objections before they arise),
 * correct handoff language, and the 3-step objection response framework.
 */
export function scoreObjectionPrevention(transcript: string): PillarScore {
  const t = transcript.toLowerCase();

  // Criterion 1: Guide opening / framing (35 pts)
  // ASURA OPS: The guide opening addresses "the price" objection before it surfaces
  const guideOpeningKeywords = [
    "before we go through the options",
    "before we look at",
    "a few things to keep in mind",
    "some of our customers ask about",
    "you might be wondering",
    "the most common question",
    "most of our clients",
    "the good news is",
    "repayment options",
    "mandatory disclosure form",
    "quoted a payment",
    "consumer options",
  ];
  const guideOpeningUsed = guideOpeningKeywords.some((k) => t.includes(k));
  const guideOpening: CriterionResult = {
    id: "prevention-guide-opening",
    label: "Guide opening / pre-frame used before menu presentation",
    passed: guideOpeningUsed,
    points: guideOpeningUsed ? 35 : 0,
    maxPoints: 35,
    evidence: guideOpeningUsed
      ? "Guide opening language detected"
      : "No guide opening detected. Pre-framing objections before the menu presentation is ASURA's core prevention strategy.",
  };

  // Criterion 2: Correct handoff language from sales (30 pts)
  const handoffKeywords = [
    "come back with me",
    "i'll get you taken care of",
    "my colleague",
    "we'll take care of you",
    "we're going to go over",
    "i've been waiting for you",
    "my finance manager",
    "title work",
    "state and federal documents",
    "factory warranty",
  ];
  const handoffUsed = handoffKeywords.some((k) => t.includes(k));
  const handoffLanguage: CriterionResult = {
    id: "prevention-handoff",
    label: "Correct ASURA handoff language from sales floor",
    passed: handoffUsed,
    points: handoffUsed ? 30 : 0,
    maxPoints: 30,
    evidence: handoffUsed
      ? "Handoff language detected: " + handoffKeywords.filter((k) => t.includes(k)).slice(0, 2).join(", ")
      : "No handoff transition language detected",
  };

  // Criterion 3: 3-step objection response (Acknowledge → Need → Solution) (35 pts)
  const acknowledgeKeywords = [
    "i understand", "i hear you", "i appreciate that", "that's a valid concern",
    "i get it", "totally understand", "makes sense",
  ];
  const needKeywords = [
    "the reason i ask", "here's what i've seen", "what happens is",
    "the reality is", "what most people don't realize",
    "the risk is", "the exposure is",
  ];
  const solutionKeywords = [
    "what this does", "what it covers", "this protects you",
    "that's exactly why", "this is why", "here's what i can do",
    "what we can do", "let me show you",
  ];

  const hasAck = acknowledgeKeywords.some((k) => t.includes(k));
  const hasNeed = needKeywords.some((k) => t.includes(k));
  const hasSolution = solutionKeywords.some((k) => t.includes(k));
  const threeStepCount = [hasAck, hasNeed, hasSolution].filter(Boolean).length;

  const threeStep: CriterionResult = {
    id: "prevention-3step",
    label: "3-step objection framework: Acknowledge → Create Need → Provide Solution",
    passed: threeStepCount === 3,
    points: threeStepCount === 3 ? 35 : threeStepCount === 2 ? 20 : threeStepCount === 1 ? 10 : 0,
    maxPoints: 35,
    evidence: `Detected ${threeStepCount}/3 steps: ${[hasAck && "Acknowledge", hasNeed && "Create Need", hasSolution && "Provide Solution"].filter(Boolean).join(" → ") || "none"}`,
  };

  const criteria = [guideOpening, handoffLanguage, threeStep];
  const score = Math.min(100, criteria.reduce((sum, c) => sum + c.points, 0));

  const insights: string[] = [];
  if (!guideOpeningUsed) {
    insights.push("Use the guide opening BEFORE presenting the menu: 'Before we go through your options, I want to share something most people don't know...' — this pre-frames the price objection.");
  }
  if (!handoffUsed) {
    insights.push("Verify sales floor is using the ASURA handoff script. A warm, confident handoff sets the tone before the customer even sits down.");
  }
  if (threeStepCount < 3) {
    const missing = [!hasAck && "Acknowledge", !hasNeed && "Create Need", !hasSolution && "Provide Solution"].filter(Boolean);
    insights.push(`Incomplete objection response. Missing steps: ${missing.join(", ")}. All 3 must land in sequence for the framework to close.`);
  }
  if (score >= 90) {
    insights.push("Elite prevention execution. When objections are prevented, they don't have to be handled — that's the ASURA advantage.");
  }

  return { score, criteria, insights };
}

// ─── Pillar 4: Coaching Cadence ───────────────────────────────────────────────

/**
 * Evaluates week-over-week improvement trajectory and deal autopsy integration.
 * Uses prior session score history to determine if the manager is improving.
 */
export function scoreCoachingCadence(cadenceInput: CoachingCadenceInput): PillarScore {
  const { priorScores = [], priorDealAutopsy, wordTrackUtilizationRate } = cadenceInput;

  // Criterion 1: Week-over-week improvement trend (40 pts)
  let improvementScore = 0;
  let improvementEvidence = "Insufficient session history (need 3+ sessions to calculate trend)";

  if (priorScores.length >= 3) {
    const recent = priorScores.slice(-3);
    const oldest = recent[0];
    const newest = recent[recent.length - 1];
    const trend = newest - oldest;

    if (trend >= 10) {
      improvementScore = 40;
      improvementEvidence = `Strong improvement: +${trend.toFixed(1)} pts over last ${priorScores.length} sessions`;
    } else if (trend >= 5) {
      improvementScore = 30;
      improvementEvidence = `Moderate improvement: +${trend.toFixed(1)} pts over last ${priorScores.length} sessions`;
    } else if (trend >= 0) {
      improvementScore = 20;
      improvementEvidence = `Flat trajectory: +${trend.toFixed(1)} pts — needs acceleration`;
    } else {
      improvementScore = 5;
      improvementEvidence = `Declining performance: ${trend.toFixed(1)} pts — immediate coaching intervention needed`;
    }
  } else if (priorScores.length === 1 || priorScores.length === 2) {
    // Some history — reward having any history
    improvementScore = 15;
    improvementEvidence = `${priorScores.length} prior session(s) on record — trend developing`;
  }

  const weekOverWeek: CriterionResult = {
    id: "cadence-wow",
    label: "Week-over-week performance improvement trajectory",
    passed: improvementScore >= 30,
    points: improvementScore,
    maxPoints: 40,
    evidence: improvementEvidence,
  };

  // Criterion 2: Consistency score (30 pts)
  let consistencyScore = 0;
  let consistencyEvidence = "No consistency data";

  if (priorScores.length >= 3) {
    // Standard deviation-based consistency: lower std dev = higher score
    const mean = priorScores.reduce((a, b) => a + b, 0) / priorScores.length;
    const stdDev = Math.sqrt(priorScores.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / priorScores.length);

    if (stdDev <= 5) {
      consistencyScore = 30;
      consistencyEvidence = `Excellent consistency: σ=${stdDev.toFixed(1)} — predictable performance`;
    } else if (stdDev <= 10) {
      consistencyScore = 20;
      consistencyEvidence = `Good consistency: σ=${stdDev.toFixed(1)}`;
    } else if (stdDev <= 15) {
      consistencyScore = 10;
      consistencyEvidence = `Inconsistent performance: σ=${stdDev.toFixed(1)} — hot/cold swings detected`;
    } else {
      consistencyScore = 0;
      consistencyEvidence = `High variance: σ=${stdDev.toFixed(1)} — fundamental process gaps causing unpredictable results`;
    }
  } else if (priorDealAutopsy) {
    consistencyScore = Math.round(priorDealAutopsy.consistencyScore * 0.3);
    consistencyEvidence = `Consistency from deal autopsy: ${priorDealAutopsy.consistencyScore}%`;
  }

  const consistency: CriterionResult = {
    id: "cadence-consistency",
    label: "Performance consistency (low variance over sessions)",
    passed: consistencyScore >= 20,
    points: consistencyScore,
    maxPoints: 30,
    evidence: consistencyEvidence,
  };

  // Criterion 3: Word track utilization / coachability (30 pts)
  let utilizationPoints = 0;
  let utilizationEvidence = "No word track utilization data";

  if (wordTrackUtilizationRate !== undefined) {
    utilizationPoints = Math.round((wordTrackUtilizationRate / 100) * 30);
    utilizationEvidence = `Word track utilization: ${wordTrackUtilizationRate.toFixed(0)}% — ${
      wordTrackUtilizationRate >= 70
        ? "high coachability, acting on real-time guidance"
        : wordTrackUtilizationRate >= 40
          ? "moderate coachability"
          : "low coachability — not deploying real-time suggestions"
    }`;
  } else if (priorDealAutopsy) {
    // If no current session utilization, use deal autopsy average
    utilizationPoints = 15; // Partial credit for having deal autopsy data
    utilizationEvidence = `Deal autopsy available: avg score ${priorDealAutopsy.averageScore.toFixed(1)} over ${priorDealAutopsy.totalSessions} sessions`;
  }

  const coachability: CriterionResult = {
    id: "cadence-coachability",
    label: "Word track utilization / coachability score",
    passed: utilizationPoints >= 20,
    points: utilizationPoints,
    maxPoints: 30,
    evidence: utilizationEvidence,
  };

  const criteria = [weekOverWeek, consistency, coachability];
  const score = Math.min(100, criteria.reduce((sum, c) => sum + c.points, 0));

  const insights: string[] = [];
  if (improvementScore < 30) {
    if (priorScores.length < 3) {
      insights.push("Build session history — 3+ sessions needed to establish a coaching baseline and track improvement.");
    } else {
      insights.push("Score is flat or declining. Schedule a deal autopsy: review the last 3 sessions and identify the one process step causing the most leakage.");
    }
  }
  if (consistencyScore < 20 && priorScores.length >= 3) {
    insights.push("High score variance indicates inconsistent process execution. Pick ONE script element to lock down this week — consistency beats occasional excellence.");
  }
  if ((wordTrackUtilizationRate ?? 0) < 50) {
    insights.push("Word track utilization below 50%. The Co-Pilot is giving real-time guidance — deploy those scripts. Each unused suggestion is a missed close.");
  }
  if (score >= 85) {
    insights.push("Strong coaching cadence. This manager is actively improving and applying feedback — that's the Tier-1 behavior pattern.");
  }

  return { score, criteria, insights };
}

// ─── Main Scorecard Engine ────────────────────────────────────────────────────

/**
 * Runs the full ASURA OPS 4-pillar scorecard against a session transcript.
 *
 * @param transcript - Full session transcript text
 * @param cadenceInput - Historical performance data for Coaching Cadence pillar
 * @returns Full scorecard result with Tier-1 Score and per-pillar breakdown
 */
export function runASURAScorecardEngine(
  transcript: string,
  cadenceInput: CoachingCadenceInput = {}
): ASURAScorecardResult {
  const menuOrderPillar = scoreMenuOrder(transcript);
  const upgradeArchitecturePillar = scoreUpgradeArchitecture(transcript);
  const objectionPreventionPillar = scoreObjectionPrevention(transcript);
  const coachingCadencePillar = scoreCoachingCadence(cadenceInput);

  // Equal 25% weighting for each pillar
  const tier1Score = Math.round(
    menuOrderPillar.score * 0.25 +
    upgradeArchitecturePillar.score * 0.25 +
    objectionPreventionPillar.score * 0.25 +
    coachingCadencePillar.score * 0.25
  );

  // Determine tier label
  const tier: ASURAScorecardResult["tier"] =
    tier1Score >= 85 ? "Tier-1" :
    tier1Score >= 70 ? "Tier-2" :
    tier1Score >= 55 ? "Tier-3" :
    "Below-Tier";

  // Aggregate top coaching priorities (lowest-scoring pillars first)
  const pillarInsights = [
    { pillar: "Menu Order", insights: menuOrderPillar.insights, score: menuOrderPillar.score },
    { pillar: "Upgrade Architecture", insights: upgradeArchitecturePillar.insights, score: upgradeArchitecturePillar.score },
    { pillar: "Objection Prevention", insights: objectionPreventionPillar.insights, score: objectionPreventionPillar.score },
    { pillar: "Coaching Cadence", insights: coachingCadencePillar.insights, score: coachingCadencePillar.score },
  ].sort((a, b) => a.score - b.score);

  const coachingPriorities: string[] = [];
  for (const { pillar, insights } of pillarInsights) {
    for (const insight of insights) {
      if (!insight.includes("Excellent") && !insight.includes("Strong") && !insight.includes("Elite")) {
        coachingPriorities.push(`[${pillar}] ${insight}`);
      }
    }
    if (coachingPriorities.length >= 5) break;
  }

  return {
    tier1Score,
    menuOrderScore: menuOrderPillar.score,
    upgradeArchitectureScore: upgradeArchitecturePillar.score,
    objectionPreventionScore: objectionPreventionPillar.score,
    coachingCadenceScore: coachingCadencePillar.score,
    menuOrderPillar,
    upgradeArchitecturePillar,
    objectionPreventionPillar,
    coachingCadencePillar,
    coachingPriorities: coachingPriorities.slice(0, 5),
    tier,
    gradedAt: new Date().toISOString(),
  };
}
