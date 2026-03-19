/**
 * Product Recommendation Engine
 * Analyzes session transcripts and recommends missed or improvable F&I products.
 */

import {
  PRODUCT_DATABASE,
  type ProductIntelligenceEntry,
  type ProductRecommendation,
} from "../shared/productIntelligence";

interface TranscriptLine {
  speaker: string;
  text: string;
}

/**
 * Detect which products were mentioned in a transcript.
 * Returns a Map of productType → { mentioned: boolean, mentionCount: number, excerpts: string[] }
 */
export function detectMentionedProducts(
  transcriptLines: TranscriptLine[]
): Map<string, { mentioned: boolean; mentionCount: number; excerpts: string[] }> {
  const results = new Map<string, { mentioned: boolean; mentionCount: number; excerpts: string[] }>();

  // Initialize all products as not mentioned
  for (const product of PRODUCT_DATABASE) {
    results.set(product.productType, { mentioned: false, mentionCount: 0, excerpts: [] });
  }

  const fullText = transcriptLines.map((l) => l.text).join(" ");
  const lowerText = fullText.toLowerCase();

  for (const product of PRODUCT_DATABASE) {
    const entry = results.get(product.productType)!;
    for (const keyword of product.transcriptKeywords) {
      const kw = keyword.toLowerCase();
      // Use word-boundary matching for short keywords to avoid false positives
      const pattern = kw.length <= 4
        ? new RegExp(`\\b${escapeRegex(kw)}\\b`, "gi")
        : new RegExp(escapeRegex(kw), "gi");

      const matches = lowerText.match(pattern);
      if (matches && matches.length > 0) {
        entry.mentioned = true;
        entry.mentionCount += matches.length;

        // Find excerpt lines containing this keyword
        for (const line of transcriptLines) {
          if (pattern.test(line.text.toLowerCase())) {
            if (entry.excerpts.length < 3) {
              entry.excerpts.push(line.text.slice(0, 120));
            }
          }
          // Reset lastIndex for global regex
          pattern.lastIndex = 0;
        }
      }
    }
  }

  return results;
}

/**
 * Analyze quality of product presentation based on transcript patterns.
 * Returns a score 0-100 for how well the product was presented.
 */
export function assessPresentationQuality(
  product: ProductIntelligenceEntry,
  transcriptLines: TranscriptLine[]
): number {
  const managerLines = transcriptLines
    .filter((l) => l.speaker === "manager")
    .map((l) => l.text.toLowerCase());
  const fullManagerText = managerLines.join(" ");

  let score = 0;
  const maxScore = 100;

  // 1. Was the product mentioned by the manager (not just customer)? (30 pts)
  const managerMentioned = product.transcriptKeywords.some((kw) =>
    fullManagerText.includes(kw.toLowerCase())
  );
  if (managerMentioned) score += 30;

  // 2. Were benefits/selling points discussed? (25 pts)
  const benefitKeywords = [
    "protect", "coverage", "covers", "save", "value", "peace of mind",
    "investment", "resale", "included", "standard",
  ];
  const benefitMentions = benefitKeywords.filter((kw) => fullManagerText.includes(kw)).length;
  score += Math.min(25, benefitMentions * 5);

  // 3. Was pricing discussed? (15 pts)
  const pricingKeywords = ["per month", "monthly", "cost", "price", "only", "just", "dollar"];
  if (pricingKeywords.some((kw) => fullManagerText.includes(kw))) score += 15;

  // 4. Were objections handled? (20 pts)
  const customerLines = transcriptLines
    .filter((l) => l.speaker === "customer")
    .map((l) => l.text.toLowerCase());
  const customerText = customerLines.join(" ");
  const objectionIndicators = ["don't need", "too expensive", "not interested", "no thanks", "i'll pass", "already have"];
  const hadObjection = objectionIndicators.some((kw) => customerText.includes(kw));
  if (hadObjection) {
    // Check if manager responded with handling
    const handlingIndicators = ["understand", "great point", "let me show", "here's why", "consider", "actually", "most customers"];
    const handledObjection = handlingIndicators.some((kw) => fullManagerText.includes(kw));
    score += handledObjection ? 20 : 5;
  } else {
    score += 10; // No objection = neutral
  }

  // 5. ASURA process compliance — opt-out framing (10 pts)
  const optOutPhrases = ["would you like to remove", "opt out", "choose to include", "comes standard", "already included"];
  if (optOutPhrases.some((kw) => fullManagerText.includes(kw))) score += 10;

  return Math.min(maxScore, score);
}

/**
 * Generate product recommendations for a session based on its transcript.
 */
export function generateRecommendations(
  transcriptLines: TranscriptLine[]
): ProductRecommendation[] {
  if (!transcriptLines || transcriptLines.length === 0) {
    return PRODUCT_DATABASE.map((product, i) => ({
      productType: product.productType,
      displayName: product.displayName,
      category: product.category,
      status: "missed" as const,
      reason: "No transcript available — unable to analyze product presentation.",
      suggestedTalkTrack: product.asuraTalkTracks[0] ?? "",
      potentialProfit: product.avgProfit,
      priority: i + 1,
    }));
  }

  const mentions = detectMentionedProducts(transcriptLines);
  const recommendations: ProductRecommendation[] = [];

  for (const product of PRODUCT_DATABASE) {
    const mention = mentions.get(product.productType)!;

    if (!mention.mentioned) {
      // Product was completely missed
      recommendations.push({
        productType: product.productType,
        displayName: product.displayName,
        category: product.category,
        status: "missed",
        reason: `${product.displayName} was never mentioned during the session. This product has a ${Math.round(product.avgCloseRate * 100)}% average close rate.`,
        suggestedTalkTrack: product.asuraTalkTracks[0] ?? "",
        potentialProfit: product.avgProfit,
        priority: 0, // Will be assigned after sorting
      });
    } else {
      // Product was mentioned — assess quality
      const quality = assessPresentationQuality(product, transcriptLines);
      if (quality < 60) {
        recommendations.push({
          productType: product.productType,
          displayName: product.displayName,
          category: product.category,
          status: "improve",
          reason: `${product.displayName} was mentioned but presentation scored ${quality}/100. Consider using ASURA talk tracks for stronger positioning.`,
          suggestedTalkTrack: product.asuraTalkTracks[0] ?? "",
          potentialProfit: Math.round(product.avgProfit * 0.3), // Partial uplift
          priority: 0,
        });
      }
    }
  }

  // Sort: missed products first (by profit potential desc), then improve (by profit desc)
  recommendations.sort((a, b) => {
    if (a.status !== b.status) return a.status === "missed" ? -1 : 1;
    return b.potentialProfit - a.potentialProfit;
  });

  // Assign priority numbers
  recommendations.forEach((r, i) => {
    r.priority = i + 1;
  });

  return recommendations;
}

/**
 * Calculate total missed revenue opportunity from recommendations.
 */
export function calculateMissedRevenue(recommendations: ProductRecommendation[]): number {
  return recommendations.reduce((sum, r) => sum + r.potentialProfit, 0);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
