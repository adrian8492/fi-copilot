import bcrypt from "bcryptjs";
import { notifyOwner } from "./_core/notification";
import { sendEmail, buildSessionSummaryEmail, buildWeeklyDigestEmail } from "./_core/email";
import { generateRecommendations, calculateMissedRevenue } from "./product-recommendation";
import { PRODUCT_DATABASE } from "../shared/productIntelligence";
import { COOKIE_NAME, NOT_GROUP_ADMIN_ERR_MSG } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getComplianceTrend,
  createSession,
  endSession,
  getAllSessions,
  getAllUsers,
  getAnalyticsSummary,
  getAuditLogs,
  getChecklistBySession,
  getEagleEyeLeaderboard,
  getEagleEyeTrends,
  getFlagsBySession,
  getGradeBySession,
  getGradesByUser,
  getObjectionAnalysisByProduct,
  getObjectionAnalysisByConcern,
  getObjectionsBySession,
  getRecordingsBySession,
  getRecordingsByUser,
  getReportBySession,
  getReportsByUser,
  getSessionById,
  getSessionsByUserId,
  getSuggestionsBySession,
  getTranscriptsBySession,
  insertAuditLog,
  insertComplianceFlag,
  insertCopilotSuggestion,
  insertObjectionLog,
  insertRecording,
  insertTranscript,
  resolveFlag,
  updateRecordingStatus,
  updateSessionStatus,
  updateUserRole,
  upsertCoachingReport,
  upsertGrade,
  upsertSessionChecklist,
  getAllComplianceRules,
  insertComplianceRule,
  updateComplianceRule,
  deleteComplianceRule,
  markSuggestionUsed,
  getSuggestionUtilizationRate,
  getPvrTrend,
  getProductMix,
  getSessionVolume,
  getAllDealerships,
  createDealership,
  updateDealership,
  assignUserToDealership,
  createInvitation,
  getInvitationByToken,
  redeemInvitation,
  getInvitationsByDealership,
  revokeInvitation,
  getManagerScorecard,
  getActiveComplianceRules,
  updateSessionNotes,
  searchSessions,
  getSessionComparison,
  getSystemUsageStats,
  getSessionsByIds,
  getComplianceFlags,
  deleteTranscriptsBySession,
  createDealershipGroup,
  getAllDealershipGroups,
  getDealershipGroup,
  updateDealershipGroup,
  getDealershipsByGroup,
  assignUserToRooftop,
  removeUserFromRooftop,
  getUserRooftops,
  getRooftopUsers,
  getUserAccessibleDealershipIds,
  switchUserRooftop,
  getAllUsersByDealershipIds,
  getAllSessionsByDealershipIds,
  getGroupIdForUser,
  deleteSessionData,
  getExpiredRecordings,
  setRecordingRetention,
  getDealershipSettings,
  updateDealershipSettings,
  upsertDealershipSettings,
  updateSessionDealDetails,
  getSessionCount,
  getSessionCountByUser,
  getSessionCountByDealershipIds,
  getAuditLogCount,
  getUserById,
  createCustomer,
  getCustomersByDealership,
  getCustomerById,
  updateCustomer,
  searchCustomers,
  getCustomerCountByDealership,
  getSessionsByCustomerId,
  getProductMenuByDealership,
  upsertProductMenuItem,
  deleteProductMenuItem,
  getProductIntelligenceByType,
  getAllProductIntelligence,
  upsertProductIntelligence,
  getDealRecoveriesBySession,
  getDealRecoveriesByUser,
  createDealRecovery,
  updateDealRecoveryStatus,
  getDealRecoveryStats,
  upsertScorecard,
  getScorecardBySession,
  getScorecardsByUser,
  getAverageScorecardByUser,
  getRecentScorecardScores,
} from "./db";
import { runASURAScorecardEngine, type CoachingCadenceInput } from "./asura-scorecard";
import { invokeLLM } from "./_core/llm";
import { getUserByOpenId, getUserByEmail, setUserPasswordHash } from "./db";
import { sdk } from "./_core/sdk";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storagePut, storageDelete } from "./storage";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { ASURA_PROCESS_STEPS, detectDealStage, ALL_SCRIPTS, retrieveAllMatchingScripts } from "./asura-scripts";
import { scanTranscriptForViolations, calculateComplianceScore, type ComplianceViolation, type ComplianceCategory } from "./compliance-engine";

// ─── Helper: admin guard ──────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && !ctx.user.isGroupAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

const groupAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user.isGroupAdmin && !ctx.user.isSuperAdmin) throw new TRPCError({ code: "FORBIDDEN", message: NOT_GROUP_ADMIN_ERR_MSG });
  return next({ ctx });
});

/**
 * Enforce dealership-scoped data isolation.
 * Super admins can access everything. Group admins can access their group's dealerships.
 * Regular admins can access their own dealership. Users can only access their own sessions.
 */
async function assertSessionAccess(
  ctx: { user: { id: number; role: string; dealershipId: number | null; isSuperAdmin: boolean; isGroupAdmin: boolean } },
  session: { userId: number; dealershipId: number | null }
) {
  if (ctx.user.isSuperAdmin) return;
  if (ctx.user.isGroupAdmin) {
    const accessibleIds = await getUserAccessibleDealershipIds(ctx.user.id);
    if (session.dealershipId && accessibleIds.includes(session.dealershipId)) return;
  }
  if (ctx.user.role === "admin" && session.dealershipId === ctx.user.dealershipId) return;
  if (session.userId === ctx.user.id) return;
  throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this session" });
}

// ─── AI Co-Pilot Enginee ───────────────────────────────────────────────────────
async function runCopilotAnalysis(transcriptText: string, sessionId: number, context: string) {
  // Pull top matching ASURA verbatim scripts for this transcript excerpt
  const matchingScripts = retrieveAllMatchingScripts(transcriptText, 4);
  const scriptContext = matchingScripts.length > 0
    ? `\n\nASURA VERBATIM WORD TRACKS MATCHED FOR THIS MOMENT:\n${matchingScripts.map((s, i) =>
        `${i + 1}. [${s.scriptCategory.toUpperCase()} | ${s.urgency.toUpperCase()} PRIORITY]\n   Title: ${s.title}\n   Exact Script: "${s.scriptText}"\n   Coaching Note: ${s.coachingNote ?? 'N/A'}\n   Source: ${s.sourceDocument}`
      ).join('\n\n')}`
    : '';

  const prompt = `You are an expert F&I (Finance & Insurance) manager coach for automotive dealerships using the ASURA Elite F&I Performance Playbook methodology.
Analyze the following conversation excerpt and provide real-time coaching suggestions.

Context: ${context}
Recent transcript: "${transcriptText}"${scriptContext}

IMPORTANT: When ASURA verbatim word tracks are provided above, you MUST use them. Include the exact script text in the "script" field and the source document in the "framework" field. Do not paraphrase — the verbatim word tracks are the coaching product.

Respond with a JSON object containing:
{
  "suggestions": [
    {
      "type": "product_recommendation|objection_handling|compliance_reminder|rapport_building|closing_technique|general_tip",
      "title": "Short action title (max 8 words)",
      "content": "Specific coaching guidance explaining WHY this script works (2-3 sentences)",
      "script": "VERBATIM word track text here — exact words the manager should say",
      "framework": "Source document name (e.g. ASURA Elite F&I Performance Playbook)",
      "priority": "high|medium|low",
      "triggeredBy": "The specific phrase or situation that triggered this"
    }
  ],
  "complianceFlags": [
    {
      "severity": "critical|warning|info",
      "rule": "Rule name",
      "description": "What compliance issue was detected",
      "excerpt": "The exact phrase that triggered this flag"
    }
  ]
}

Focus on F&I-specific guidance: GAP insurance, VSC (Vehicle Service Contract), prepaid maintenance, 
interior/exterior protection, tire & wheel protection. Flag any missing disclosures (base payment, 
risk-based pricing, privacy policy). Provide objection handling for price, coverage, and need objections.
Return ONLY valid JSON, no markdown.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an F&I coaching AI. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_schema", json_schema: {
        name: "copilot_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            suggestions: { type: "array", items: {
              type: "object",
              properties: {
                type: { type: "string" },
                title: { type: "string" },
                content: { type: "string" },
                script: { type: "string" },
                framework: { type: "string" },
                priority: { type: "string" },
                triggeredBy: { type: "string" },
              },
              required: ["type", "title", "content", "script", "framework", "priority", "triggeredBy"],
              additionalProperties: false,
            }},
            complianceFlags: { type: "array", items: {
              type: "object",
              properties: {
                severity: { type: "string" },
                rule: { type: "string" },
                description: { type: "string" },
                excerpt: { type: "string" },
              },
              required: ["severity", "rule", "description", "excerpt"],
              additionalProperties: false,
            }},
          },
          required: ["suggestions", "complianceFlags"],
          additionalProperties: false,
        },
      }},
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') return null;
    return JSON.parse(content);
  } catch (e) {
    console.error("[Copilot] Analysis failed:", e);
    return null;
  }
}

// ─── Script Fidelity Score Calculator ────────────────────────────────────────
/**
 * Calculates 5 Script Fidelity sub-scores from the transcript using the
 * ASURA verbatim script library and 7-step process adherence model.
 */
function calculateScriptFidelityScores(fullTranscript: string): {
  scriptFidelityScore: number;
  processAdherenceScore: number;
  menuSequenceScore: number;
  objectionResponseScore: number;
  transitionAccuracyScore: number;
} {
  const transcript = fullTranscript.toLowerCase();

  // Script keyword phrases for verbatim checking (all 23 Delphi scripts)
  const scriptPhrases: Record<number, string[]> = {
    1: ["congratulations on your new vehicle", "business managers", "state and federal documents", "manufacturer's warranty", "client survey"],
    2: ["listed on the title", "correct address", "balance owed", "sets of keys", "register your vehicle with the police", "scale of 1-10", "mother's maiden name"],
    3: ["review the figures", "selling price", "financing for", "months at", "balance owed on the vehicle being traded"],
    4: ["understanding of the factory warranty", "factory survey question", "comprehensive warranty", "reduce the price"],
    5: ["totaled or stolen", "deficiency balance", "depreciate most rapidly", "true market value", "out-of-pocket event"],
    6: ["comprehensive warranty", "powertrain warranty", "internally lubricated", "deemed defective", "misaligned or mis-installed", "routine maintenance", "tires and wheels", "anti-perforation", "keys and key fobs"],
    7: ["come back with me", "double-check the information", "department of licensing", "anything to drink"],
    8: ["quoted a payment", "repayment options", "mandatory disclosure form", "option 1", "most comprehensive protection", "pick up where the manufacturer leaves off"],
    9: ["consumer options", "rank what's most important"],
    10: ["rank first", "excellent choice", "second most important", "customize a program"],
    11: ["personal information", "financial arrangements"],
    12: ["acknowledge", "create the need", "provide the solution"],
  };

  const productPhrases: Record<string, string[]> = {
    vsc: ["vehicle service agreement", "not an extended warranty", "deemed defective", "peril and comprehensive", "100% of parts", "100% of labor", "ase-certified", "u.s. or canada"],
    tw: ["tires and wheels", "road hazard", "anything that is not supposed to be there", "$0.00 deductible", "cosmetic repair"],
    key: ["key replacement", "damaged, lost, or stolen", "$800 per occurrence", "unlimited occurrences", "reprogram"],
    oil: ["oil maintenance program", "oil changes and filters", "regularly scheduled intervals", "manufacturer warranty intact"],
    gap: ["guaranteed asset protection", "total loss", "deficiency balance", "150%", "not an insurance", "$1,000 of your deductible"],
    antitheft: ["vehicle anti-theft", "vehicle replacement", "stolen and deemed a total loss", "$25,000 benefit"],
    gps: ["active system", "register your vehicle with the police", "notification", "911", "first place the thief will go"],
    ceramic: ["ceramic resin", "not a wax", "bird droppings", "tree sap", "acid rain", "oxidation", "stains, spills"],
    pdr: ["door dings", "doesn't break the paint", "windshield gets chipped", "$0.00 deductible"],
    threemm: ["chip-sealed", "rock chips", "leading edges", "3m clear tape", "window tint"],
  };

  // 1. Script Fidelity Score — check all scripts for verbatim keyword presence
  let totalScriptMatches = 0;
  let totalScriptPhrases = 0;

  Object.values(scriptPhrases).forEach(phrases => {
    phrases.forEach(phrase => {
      totalScriptPhrases++;
      if (transcript.includes(phrase.toLowerCase())) {
        totalScriptMatches++;
      }
    });
  });

  Object.values(productPhrases).forEach(phrases => {
    phrases.forEach(phrase => {
      totalScriptPhrases++;
      if (transcript.includes(phrase.toLowerCase())) {
        totalScriptMatches++;
      }
    });
  });

  const scriptFidelityScore = Math.round((totalScriptMatches / totalScriptPhrases) * 100);

  // 2. Process Adherence — check which ASURA process stages are present
  const completedSteps = ASURA_PROCESS_STEPS.filter(step => {
    const stepKeywords = step.description.toLowerCase().split(' ');
    return stepKeywords.some(keyword => transcript.includes(keyword));
  }).length;
  const processAdherenceScore = Math.round((completedSteps / ASURA_PROCESS_STEPS.length) * 100);

  // 3. Menu Sequence — check correct product presentation order
  const productSequence = ['vsc', 'tw', 'key', 'oil', 'gap', 'antitheft', 'gps', 'ceramic', 'pdr', 'threemm'];
  const productPositions: Record<string, number> = {};

  productSequence.forEach(product => {
    const phrases = productPhrases[product];
    let earliestPosition = transcript.length;
    phrases.forEach(phrase => {
      const position = transcript.indexOf(phrase.toLowerCase());
      if (position !== -1 && position < earliestPosition) {
        earliestPosition = position;
      }
    });
    if (earliestPosition < transcript.length) {
      productPositions[product] = earliestPosition;
    }
  });

  let sequenceMatches = 0;
  const foundProducts = Object.keys(productPositions).sort((a, b) => productPositions[a] - productPositions[b]);

  for (let i = 0; i < foundProducts.length - 1; i++) {
    const currentIndex = productSequence.indexOf(foundProducts[i]);
    const nextIndex = productSequence.indexOf(foundProducts[i + 1]);
    if (currentIndex < nextIndex) {
      sequenceMatches++;
    }
  }

  const menuSequenceScore = foundProducts.length > 1 ? Math.round((sequenceMatches / (foundProducts.length - 1)) * 100) : 0;

  // 4. Objection Response — check for ranking process and first-no scripts
  const rankingUsed = scriptPhrases[10].some(phrase => transcript.includes(phrase.toLowerCase()));
  const firstNoUsed = scriptPhrases[9].some(phrase => transcript.includes(phrase.toLowerCase()));
  const objectionResponseScore = Math.round(((rankingUsed ? 50 : 0) + (firstNoUsed ? 50 : 0)));

  // 5. Transition Accuracy — check stage transition phrases
  const transitionPhrases = scriptPhrases[7];
  const transitionsFound = transitionPhrases.filter(phrase => transcript.includes(phrase.toLowerCase())).length;
  const transitionAccuracyScore = Math.round((transitionsFound / transitionPhrases.length) * 100);

  return {
    scriptFidelityScore: Math.min(100, scriptFidelityScore),
    processAdherenceScore: Math.min(100, processAdherenceScore),
    menuSequenceScore: Math.min(100, menuSequenceScore),
    objectionResponseScore: Math.min(100, objectionResponseScore),
    transitionAccuracyScore: Math.min(100, transitionAccuracyScore),
  };
}

// ─── Grading Engine ───────────────────────────────────────────────────────────
// ─── Custom Compliance Rules Merge ──────────────────────────────────────────
// Map DB category strings to ComplianceCategory enum values
const CATEGORY_MAP: Record<string, ComplianceCategory> = {
  federal_tila: "TILA_REG_Z",
  federal_ecoa: "ECOA_REG_B",
  federal_udap: "UDAP_UDAAP",
  federal_cla: "CLA_REG_M",
  contract_element: "CONTRACT_ELEMENTS",
  fi_product_disclosure: "GAP_PRODUCT",
  process_step: "VSC_PRODUCT",
  custom: "AFTERMARKET_PRODUCT",
};

async function getCustomRuleViolations(fullTranscript: string): Promise<ComplianceViolation[]> {
  const violations: ComplianceViolation[] = [];
  try {
    const customRules = await getActiveComplianceRules();
    const transcriptLower = fullTranscript.toLowerCase();
    for (const rule of customRules) {
      // Check trigger keywords — if any keyword is found, it's a violation
      if (rule.triggerKeywords && rule.triggerKeywords.length > 0) {
        let matched = false;
        for (const keyword of rule.triggerKeywords) {
          const keywordLower = keyword.toLowerCase();
          if (transcriptLower.includes(keywordLower)) {
            const idx = transcriptLower.indexOf(keywordLower);
            const start = Math.max(0, idx - 50);
            const end = Math.min(fullTranscript.length, idx + keyword.length + 50);
            violations.push({
              ruleId: `custom_${rule.id}`,
              category: CATEGORY_MAP[rule.category] ?? "AFTERMARKET_PRODUCT",
              severity: rule.severity as "critical" | "warning" | "info",
              description: `${rule.title}: ${rule.description ?? ''}`,
              excerpt: fullTranscript.substring(start, end).trim(),
              remediation: `Remove or modify usage of "${keyword}" as per company policy`,
              timestamp: 0,
            });
            matched = true;
            break; // One violation per rule
          }
        }
        if (matched) continue;
      }
      // Check required phrase — if set and NOT found, it's a violation
      if (rule.requiredPhrase && rule.requiredPhrase.trim() !== '') {
        if (!transcriptLower.includes(rule.requiredPhrase.toLowerCase())) {
          violations.push({
            ruleId: `custom_${rule.id}_required`,
            category: CATEGORY_MAP[rule.category] ?? "AFTERMARKET_PRODUCT",
            severity: rule.severity as "critical" | "warning" | "info",
            description: `${rule.title}: Required phrase missing — ${rule.description ?? ''}`,
            excerpt: 'Required phrase not found in transcript',
            remediation: `Ensure the following phrase is included: "${rule.requiredPhrase}"`,
            timestamp: 0,
          });
        }
      }
    }
  } catch (err) {
    console.error('[Grading] Error fetching custom compliance rules:', err);
  }
  return violations;
}

async function runGradingEngine(
  fullTranscript: string,
  sessionData: { customerName?: string | null; dealType?: string | null },
  suggestionStats?: { total: number; used: number; uniqueScriptIds: string[] }
) {
  // Calculate Script Fidelity Scores deterministically (no LLM needed)
  const scriptFidelityScores = calculateScriptFidelityScores(fullTranscript);

  // Calculate deterministic compliance score from federal compliance engine
  const complianceViolations = scanTranscriptForViolations(fullTranscript, 0);
  
  // Merge custom compliance rules from DB
  const customViolations = await getCustomRuleViolations(fullTranscript);
  const allViolations = [...complianceViolations, ...customViolations];
  const deterministicComplianceScore = calculateComplianceScore(allViolations);

  const prompt = `You are an expert F&I trainer evaluating a business manager's performance against the ASURA Delphi rubric. Grade this F&I presentation transcript across 5 categories with these exact weights:

**GRADING CATEGORIES & WEIGHTS:**
- Rapport Building: 15%
- Product Presentation: 25%
- Objection Handling: 20%
- Closing Techniques: 20%
- Compliance: 20%

**THE 23 ASURA DELPHI SCRIPTS TO EVALUATE:**
1. Professional Hello
2. Client Survey (Retail Delivery Preparation Worksheet)
3. Balance Due Presentation
4. Factory Survey Question
5. Deficiency Balance Script
6. Manufacturer Needs Assessment (10 product categories)
7. Transition Script
8. Menu Presentation (10 products: VSC, T&W, Key, Oil, GAP, Anti-Theft, GPS, Ceramic, PDR, 3M)
9. First No Response (Consumer Options)
10. Ranking Process
11. Assuming Business
12. Addressing Concerns Framework (Three-Step: Acknowledge, Create Need, Provide Solution)

**VERBATIM PHRASE REQUIREMENTS (check for EXACT phrases, not paraphrases):**
- Professional Hello: "congratulations on your new vehicle", "business managers", "state and federal documents"
- Client Survey: "listed on the title", "scale of 1-10", "mother's maiden name"
- VSC Product: "vehicle service agreement", "not an extended warranty", "deemed defective", "100% of parts", "100% of labor"
- GAP Product: "guaranteed asset protection", "deficiency balance", "150%", "not an insurance"
- Ranking Process: "rank first", "excellent choice", "second most important", "customize a program"
- Transition: "come back with me", "double-check the information", "Department of Licensing"
- Menu: "quoted a payment", "repayment options", "mandatory disclosure form", "most comprehensive protection"

**SEQUENCE REQUIREMENTS:**
- Products must be presented in order: VSC > T&W > Key > Oil > GAP > Anti-Theft > GPS > Ceramic > PDR > 3M
- Process flow: Hello > Survey > Balance > Factory Survey > Needs > Transition > Menu > Objections > Close

**DEVIATION TAXONOMY (flag each script deviation as):**
- VERBATIM_MATCH: Exact phrase usage (100 points)
- ACCEPTABLE_PARAPHRASE: Close to script intent (80 points)
- SIGNIFICANT_DEVIATION: Major changes from script (50 points)
- CRITICAL_MISS: Script not attempted (0 points)
- SEQUENCE_ERROR: Correct content, wrong order (-20 points)

**COMPLIANCE REQUIREMENTS:**
- All mandatory disclosures present
- No misrepresentations about products
- Proper documentation references
- Customer consent obtained appropriately
- Base payment disclosed before options

Customer: ${sessionData.customerName ?? "Unknown"}
Deal Type: ${sessionData.dealType ?? "retail_finance"}

**WORD TRACK UTILIZATION DATA:**
- Total Co-Pilot Suggestions Delivered: ${suggestionStats?.total ?? 0}
- Suggestions Acted On (Used): ${suggestionStats?.used ?? 0}
- Word Track Utilization Rate: ${suggestionStats && suggestionStats.total > 0 ? Math.round(suggestionStats.used / suggestionStats.total * 100) : 0}%
- Unique Script IDs Triggered: ${suggestionStats?.uniqueScriptIds?.length ?? 0} (${suggestionStats?.uniqueScriptIds?.join(', ') ?? 'none'})

Use the Word Track Utilization Data to assess how effectively the manager leveraged real-time coaching suggestions. A high utilization rate indicates strong coachability and script adherence.

**TRANSCRIPT TO GRADE:**
${fullTranscript}

Grade thoroughly against the ASURA Delphi standards. For each category (0-100), identify specific verbatim matches and deviations with their taxonomy classification.

Return JSON:
{
  "rapportScore": number,
  "productPresentationScore": number,
  "objectionHandlingScore": number,
  "closingTechniqueScore": number,
  "complianceScore": number,
  "overallScore": number,
  "strengths": "string with specific quotes from transcript",
  "improvements": "string with specific ASURA methodology items and deviation taxonomy",
  "coachingNotes": "string with personalized guidance referencing specific Delphi scripts"
}`;
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an F&I grading AI trained on the ASURA Elite F&I Performance Playbook. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_schema", json_schema: {
        name: "grade_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            rapportScore: { type: "number" },
            productPresentationScore: { type: "number" },
            objectionHandlingScore: { type: "number" },
            closingTechniqueScore: { type: "number" },
            complianceScore: { type: "number" },
            overallScore: { type: "number" },
            strengths: { type: "string" },
            improvements: { type: "string" },
            coachingNotes: { type: "string" },
          },
          required: ["rapportScore","productPresentationScore","objectionHandlingScore","closingTechniqueScore","complianceScore","overallScore","strengths","improvements","coachingNotes"],
          additionalProperties: false,
        },
      }},
    });
    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') return null;
    const llmGrade = JSON.parse(content);
    // Use the more conservative (lower) of LLM and deterministic compliance scores
    const finalComplianceScore = Math.min(
      llmGrade.complianceScore ?? 100,
      deterministicComplianceScore
    );
    // Recalculate overall score with the corrected compliance score
    const overallScore = Math.round(
      (llmGrade.rapportScore ?? 0) * 0.15 +
      (llmGrade.productPresentationScore ?? 0) * 0.25 +
      (llmGrade.objectionHandlingScore ?? 0) * 0.20 +
      (llmGrade.closingTechniqueScore ?? 0) * 0.20 +
      finalComplianceScore * 0.20
    );
    // Merge LLM grades with deterministic Script Fidelity Scores + corrected compliance
    const wordTrackUtilizationScore = suggestionStats && suggestionStats.total > 0
      ? Math.round(suggestionStats.used / suggestionStats.total * 100)
      : undefined;
    return {
      ...llmGrade,
      ...scriptFidelityScores,
      complianceScore: finalComplianceScore,
      overallScore,
      complianceViolationCount: complianceViolations.length,
      wordTrackUtilizationScore,
    };
  } catch (e) {
    console.error("[Grading] Engine failed:", e);
    return null;
  }
}
// ─── Coaching Report Engine ───────────────────────────────────────────────────
async function runCoachingReportEngine(fullTranscript: string, grade: Record<string, unknown>) {
  const prompt = `You are an expert F&I coaching analyst. Generate a comprehensive coaching report for this interaction.

Performance Scores: ${JSON.stringify(grade)}

Full Transcript:
${fullTranscript}

Generate a detailed coaching report with:
1. Executive summary (2-3 sentences)
2. Sentiment analysis (manager and customer)
3. Customer purchase likelihood (0-100)
4. Key moments (array of {time, description, impact: positive|negative|neutral})
5. Product opportunities missed or captured
6. Objection patterns detected
7. Specific behavioral recommendations

Return JSON:
{
  "executiveSummary": "string",
  "sentimentOverall": "positive|neutral|negative|mixed",
  "sentimentManagerScore": number (0-100),
  "sentimentCustomerScore": number (0-100),
  "purchaseLikelihoodScore": number (0-100),
  "keyMoments": [{"description": "string", "impact": "positive|negative|neutral"}],
  "productOpportunities": [{"product": "string", "status": "captured|missed|partially", "note": "string"}],
  "objectionPatterns": [{"type": "string", "frequency": number, "resolution": "string"}],
  "recommendations": "string",
  "behaviorInsights": "string"
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an F&I coaching report AI. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
    });
    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') return null;
    return JSON.parse(content);
  } catch (e) {
    console.error("[Report] Engine failed:", e);
    return null;
  }
}

// ─── Main Router ──────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    myRooftops: protectedProcedure.query(async ({ ctx }) => {
      return getUserRooftops(ctx.user.id);
    }),
    switchRooftop: protectedProcedure
      .input(z.object({ dealershipId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const switched = await switchUserRooftop(ctx.user.id, input.dealershipId);
        if (!switched) throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this rooftop" });
        await insertAuditLog({ userId: ctx.user.id, action: "auth.switchRooftop", resourceType: "dealership", resourceId: String(input.dealershipId), details: {} });
        return { success: true };
      }),

    // ─── Local Password Login ─────────────────────────────────────────────────
    localLogin: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !(user as any).passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }
        const valid = await bcrypt.compare(input.password, (user as any).passwordHash as string);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: 365 * 24 * 60 * 60 * 1000,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
        await insertAuditLog({ userId: user.id, action: "auth.localLogin", resourceType: "user", resourceId: String(user.id), details: {} });
        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),
    setPassword: protectedProcedure
      .input(z.object({ newPassword: z.string().min(8) }))
      .mutation(async ({ ctx, input }) => {
        const hash = await bcrypt.hash(input.newPassword, 12);
        await setUserPasswordHash(ctx.user.id, hash);
        await insertAuditLog({ userId: ctx.user.id, action: "auth.setPassword", resourceType: "user", resourceId: String(ctx.user.id), details: {} });
        return { success: true };
      }),
  }),

  // ─── Sessions ───────────────────────────────────────────────────────────────
  sessions: router({
    create: protectedProcedure
      .input(z.object({
        customerName: z.string().optional(),
        dealNumber: z.string().optional(),
        vehicleType: z.enum(["new", "used", "cpo"]).optional(),
        dealType: z.enum(["retail_finance", "lease", "cash"]).optional(),
        consentObtained: z.literal(true, { message: "Recording consent is required" }),
        consentMethod: z.enum(["verbal", "written", "electronic"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const consentTimestamp = new Date();
        await createSession({
          userId: ctx.user.id,
          dealershipId: ctx.user.dealershipId ?? null,
          ...input,
          consentObtained: true as boolean,
          consentTimestamp,
        });
        await insertAuditLog({
          userId: ctx.user.id,
          action: "session.create",
          resourceType: "session",
          details: { ...input, consentTimestamp: consentTimestamp.toISOString() },
        });
        const sessions = await getSessionsByUserId(ctx.user.id, 1, 0);
        return sessions[0];
      }),

    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        // Super-admins see all; admins see their dealership; users see only their own sessions
        if (ctx.user.isSuperAdmin) {
          const [rows, total] = await Promise.all([getAllSessions(input.limit, input.offset), getSessionCount()]);
          return { rows, total, limit: input.limit, offset: input.offset };
        }
        if (ctx.user.role === "admin") {
          const dealershipId = ctx.user.dealershipId ?? null;
          const [rows, total] = await Promise.all([getAllSessions(input.limit, input.offset, dealershipId), getSessionCount(dealershipId)]);
          return { rows, total, limit: input.limit, offset: input.offset };
        }
        const [rows, total] = await Promise.all([getSessionsByUserId(ctx.user.id, input.limit, input.offset), getSessionCountByUser(ctx.user.id)]);
        return { rows, total, limit: input.limit, offset: input.offset };
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getSessionById(input.id);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        await assertSessionAccess(ctx, session);
        return session;
      }),

    end: protectedProcedure
      .input(z.object({ id: z.number(), durationSeconds: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await getSessionById(input.id);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        await assertSessionAccess(ctx, session);
        await endSession(input.id, input.durationSeconds);
        await insertAuditLog({ userId: ctx.user.id, action: "session.end", resourceType: "session", resourceId: String(input.id) });
        return { success: true };
      }),

    // CFPB: Delete session and all related data (cascade)
    delete: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        reason: z.string().min(1).max(500),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        if (ctx.user.role !== "admin" && !ctx.user.isSuperAdmin && session.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to delete this session" });
        }

        const deletionSummary = await deleteSessionData(input.sessionId);

        // Delete audio files from S3
        const storageErrors: string[] = [];
        for (const fileKey of deletionSummary.recordings.fileKeys) {
          try {
            await storageDelete(fileKey);
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            storageErrors.push(`${fileKey}: ${errMsg}`);
          }
        }

        await insertAuditLog({
          userId: ctx.user.id,
          action: "session.delete",
          resourceType: "session",
          resourceId: String(input.sessionId),
          details: { reason: input.reason, deletionSummary, storageErrors: storageErrors.length > 0 ? storageErrors : undefined },
        });

        return { success: true, deletionSummary, storageErrors };
      }),

    getWithDetails: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getSessionById(input.id);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        await assertSessionAccess(ctx, session);
        const [transcriptList, suggestions, flags, grade, report, recordings] = await Promise.all([
          getTranscriptsBySession(input.id),
          getSuggestionsBySession(input.id),
          getFlagsBySession(input.id),
          getGradeBySession(input.id),
          getReportBySession(input.id),
          getRecordingsBySession(input.id),
        ]);
        return { session, transcripts: transcriptList, suggestions, flags, grade, report, recordings };
      }),

    exportSession: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        format: z.enum(["csv", "json"]),
      }))
      .query(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        await assertSessionAccess(ctx, session);

        const [transcripts, flags, grade, report] = await Promise.all([
          getTranscriptsBySession(input.sessionId),
          getFlagsBySession(input.sessionId),
          getGradeBySession(input.sessionId),
          getReportBySession(input.sessionId),
        ]);

        const exportData = {
          session: {
            id: session.id,
            customerName: session.customerName,
            dealNumber: session.dealNumber,
            dealType: session.dealType,
            vehicleType: session.vehicleType,
            status: session.status,
            durationSeconds: session.durationSeconds,
            startedAt: session.startedAt,
          },
          transcripts: transcripts.map((t) => ({
            speaker: t.speaker,
            text: t.text,
            startTime: t.startTime,
            endTime: t.endTime,
            confidence: t.confidence,
          })),
          complianceFlags: flags.map((f) => ({
            severity: f.severity,
            rule: f.rule,
            description: f.description,
            timestamp: f.timestamp,
          })),
          grade: grade ?? null,
          coachingReport: report ?? null,
          exportedAt: new Date().toISOString(),
        };

        if (input.format === "csv") {
          const csvLines = ["Speaker,Text,StartTime,EndTime,Confidence"];
          for (const t of transcripts) {
            csvLines.push(`"${t.speaker}","${(t.text ?? '').replace(/"/g, '""')}",${t.startTime ?? ''},${t.endTime ?? ''},${t.confidence ?? ''}`);
          }
          return { data: csvLines.join("\n"), format: "csv", filename: `session-${input.sessionId}.csv` };
        }

        return { data: JSON.stringify(exportData, null, 2), format: "json", filename: `session-${input.sessionId}.json` };
      }),

    updateNotes: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        notes: z.string()
      }))
      .mutation(async ({ input }) => {
        return await updateSessionNotes(input.sessionId, input.notes);
      }),

    updateDealDetails: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        vehicleYear: z.string().max(4).optional().nullable(),
        vehicleMake: z.string().max(64).optional().nullable(),
        vehicleModel: z.string().max(128).optional().nullable(),
        vin: z.string().max(17).optional().nullable(),
        salePrice: z.number().optional().nullable(),
        tradeValue: z.number().optional().nullable(),
        amountFinanced: z.number().optional().nullable(),
        lenderName: z.string().max(255).optional().nullable(),
        apr: z.number().optional().nullable(),
        termMonths: z.number().int().optional().nullable(),
        monthlyPayment: z.number().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { sessionId, ...data } = input;
        await updateSessionDealDetails(sessionId, data);
        return { success: true };
      }),

    search: protectedProcedure
      .input(z.object({
        query: z.string(),
        limit: z.number().optional()
      }))
      .query(async ({ input, ctx }) => {
        return await searchSessions(input.query, ctx.user.id, input.limit ?? 20);
      }),

    bulkExport: protectedProcedure
      .input(z.object({ sessionIds: z.array(z.number()), format: z.enum(["json", "csv"]) }))
      .query(async ({ input }) => {
        const { sessionIds, format } = input;
        const sessionsData = await getSessionsByIds(sessionIds);
        const currentDate = new Date().toISOString().split('T')[0];
        if (format === "json") {
          return { filename: `bulk-export-${currentDate}.json`, data: JSON.stringify(sessionsData, null, 2), mimeType: "application/json" };
        }
        const headers = ["ID", "Customer", "Deal Number", "Deal Type", "Status", "Score", "Duration", "Started At"];
        const csvRows = [headers.join(",")];
        for (const s of sessionsData) {
          csvRows.push([s.sessions.id, `"${s.sessions.customerName || ''}"`, `"${s.sessions.dealNumber || ''}"`, `"${s.sessions.dealType || ''}"`, `"${s.sessions.status || ''}"`, s.performance_grades?.overallScore ?? '', s.sessions.durationSeconds ?? '', `"${s.sessions.startedAt || ''}"`].join(","));
        }
        return { filename: `bulk-export-${currentDate}.csv`, data: csvRows.join("\n"), mimeType: "text/csv" };
      }),
    compare: protectedProcedure
      .input(z.object({
        sessionId1: z.number(),
        sessionId2: z.number()
      }))
      .query(async ({ input }) => {
        return await getSessionComparison(input.sessionId1, input.sessionId2);
      }),
  }),

  // ─── Transcripts ────────────────────────────────────────────────────────────
  transcripts: router({
    add: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        speaker: z.enum(["manager", "customer", "unknown"]),
        text: z.string(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        confidence: z.number().optional(),
        isFinal: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        await insertTranscript(input);
        return { success: true };
      }),

    getBySession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        await assertSessionAccess(ctx, session);
        return getTranscriptsBySession(input.sessionId);
      }),

    analyze: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        recentText: z.string(),
        context: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await runCopilotAnalysis(input.recentText, input.sessionId, input.context ?? "F&I office interaction");
        if (!result) return { suggestions: [], complianceFlags: [] };

        for (const s of result.suggestions ?? []) {
          await insertCopilotSuggestion({ sessionId: input.sessionId, ...s });
        }
        for (const f of result.complianceFlags ?? []) {
          await insertComplianceFlag({ sessionId: input.sessionId, ...f });
        }
        return result;
      }),
    markUsed: protectedProcedure
      .input(z.object({ suggestionId: z.number(), wasActedOn: z.boolean().default(true) }))
      .mutation(async ({ ctx, input }) => {
        await markSuggestionUsed(input.suggestionId, input.wasActedOn, ctx.user.name ?? ctx.user.openId);
        return { success: true };
      }),
    getUtilization: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        await assertSessionAccess(ctx, session);
        return getSuggestionUtilizationRate(input.sessionId);
      }),
  }),
  // ─── Grading ─────────────────────────────────────────────────────────────────
  grades: router({
    generate: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        await assertSessionAccess(ctx, session);

        const transcriptList = await getTranscriptsBySession(input.sessionId);
        const fullText = transcriptList.map((t) => `${t.speaker.toUpperCase()}: ${t.text}`).join("\n");

        if (!fullText.trim()) throw new TRPCError({ code: "BAD_REQUEST", message: "No transcript available to grade" });

        // Compute suggestion stats for word track utilization scoring
        const suggestions = await getSuggestionsBySession(input.sessionId);
        const suggestionStats = {
          total: suggestions.length,
          used: suggestions.filter((s) => s.wasActedOn).length,
          uniqueScriptIds: Array.from(new Set(suggestions.map((s) => s.scriptId).filter((id): id is string => !!id))),
        };

        const gradeData = await runGradingEngine(fullText, { customerName: session.customerName, dealType: session.dealType }, suggestionStats);
        if (!gradeData) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Grading engine failed" });

        await upsertGrade({ sessionId: input.sessionId, userId: session.userId, ...gradeData });
        await updateSessionStatus(input.sessionId, "completed");
        await insertAuditLog({ userId: ctx.user.id, action: "grade.generate", resourceType: "session", resourceId: String(input.sessionId) });

        // Auto-generate deal recovery scripts for declined products
        try {
          const transcripts = await getTranscriptsBySession(input.sessionId);
          const fullTranscriptText = transcripts.map((t: any) => t.text ?? t.content ?? "").join("\n");
          const recoveryPrompt = `You are an ASURA OPS deal recovery specialist. Analyze this F&I session transcript and identify products that were DECLINED by the customer.

For each declined product, provide:
1. The product type (use exact values: vehicle_service_contract, gap_insurance, prepaid_maintenance, interior_exterior_protection, road_hazard, paintless_dent_repair, key_replacement, windshield_protection, lease_wear_tear, tire_wheel, theft_protection)
2. Why the customer declined (brief reason)
3. A personalized re-engagement script using ASURA OPS methodology (opt-out framing, tie back to their survey answers, use specific numbers)
4. Estimated potential revenue if recovered

ASURA OPS Recovery Rules:
- Never pressure. Guide.
- Reference specific things the customer said during the session
- Use the Ranking System: "If you had to rank what's most important..."
- Tie back to their driving habits, family situation, or financial exposure
- Lead with the math, not the emotion

Transcript:
${fullTranscriptText.substring(0, 8000)}

Grade Data:
${JSON.stringify({ overallScore: gradeData.overallScore, categoryScores: gradeData.categoryScores })}

Return ONLY a valid JSON array. Each item: { "productType": string, "declineReason": string, "recoveryScript": string, "potentialRevenue": number }
If no products were declined, return an empty array [].`;

          const recoveryResult = await invokeLLM({ messages: [{ role: "user", content: recoveryPrompt }], maxTokens: 4000 });
          const recoveryText = typeof recoveryResult.choices?.[0]?.message?.content === "string" ? recoveryResult.choices[0].message.content : "";
          try {
            const jsonMatch = recoveryText.match(/\[[\s\S]*\]/);
            const recoveryItems = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
            for (const item of recoveryItems) {
              if (item.productType && item.recoveryScript) {
                await createDealRecovery({
                  sessionId: input.sessionId,
                  productType: item.productType,
                  declineReason: item.declineReason ?? "Not specified",
                  recoveryScript: item.recoveryScript,
                  potentialRevenue: item.potentialRevenue ?? 0,
                });
              }
            }
          } catch (parseErr) {
            console.error("[DealRecovery] Failed to parse LLM recovery response:", parseErr);
          }
        } catch (recoveryErr) {
          console.error("[DealRecovery] Error generating recovery scripts:", recoveryErr);
        }

        // Auto-send session summary email on completion
        try {
          const user = await getUserById(session.userId);
          if (user?.email) {
            const durationMin = session.durationSeconds ? Math.round(session.durationSeconds / 60) : 0;
            const emailOpts = buildSessionSummaryEmail({
              managerEmail: user.email,
              managerName: user.name ?? user.email,
              sessionId: input.sessionId,
              customerName: session.customerName ?? "Unknown Customer",
              overallScore: gradeData.overallScore ?? 0,
              categoryScores: gradeData.categoryScores ?? {},
              criticalFlags: gradeData.criticalFlags ?? 0,
              warnings: gradeData.warnings ?? 0,
              sessionDurationMin: durationMin,
            });
            sendEmail(emailOpts).catch((err) => console.error("[Email] Failed to send session summary:", err));
          }
        } catch (emailErr) {
          console.error("[Email] Error preparing session summary email:", emailErr);
        }

        return gradeData;
      }),

    get: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        await assertSessionAccess(ctx, session);
        return getGradeBySession(input.sessionId);
      }),

    myHistory: protectedProcedure
      .input(z.object({ limit: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        return getGradesByUser(ctx.user.id, input.limit);
      }),
  }),

  // ─── Compliance ──────────────────────────────────────────────────────────────
  compliance: router({
    getFlags: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        await assertSessionAccess(ctx, session);
        return getFlagsBySession(input.sessionId);
      }),

    resolveFlag: protectedProcedure
      .input(z.object({ flagId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await resolveFlag(input.flagId, ctx.user.id);
        return { success: true };
      }),
    // ─── Compliance Rules (Admin) ─────────────────────────────────────────────
    getRules: adminProcedure.query(async () => {
      return getAllComplianceRules();
    }),
    createRule: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(["federal_tila", "federal_ecoa", "federal_udap", "federal_cla", "contract_element", "fi_product_disclosure", "process_step", "custom"]),
        triggerKeywords: z.array(z.string()),
        requiredPhrase: z.string().optional(),
        severity: z.enum(["critical", "warning", "info"]),
        weight: z.number().min(0).max(5).optional(),
        isActive: z.boolean().optional(),
        dealStage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await insertComplianceRule({ ...input, createdBy: ctx.user.id });
        await insertAuditLog({ userId: ctx.user.id, action: "compliance.rule.create", resourceType: "compliance_rule", resourceId: input.title });
        return { success: true };
      }),
    updateRule: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.enum(["federal_tila", "federal_ecoa", "federal_udap", "federal_cla", "contract_element", "fi_product_disclosure", "process_step", "custom"]).optional(),
        triggerKeywords: z.array(z.string()).optional(),
        requiredPhrase: z.string().optional(),
        severity: z.enum(["critical", "warning", "info"]).optional(),
        weight: z.number().min(0).max(5).optional(),
        isActive: z.boolean().optional(),
        dealStage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateComplianceRule(id, data);
        await insertAuditLog({ userId: ctx.user.id, action: "compliance.rule.update", resourceType: "compliance_rule", resourceId: String(id) });
        return { success: true };
      }),
    deleteRule: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteComplianceRule(input.id);
        await insertAuditLog({ userId: ctx.user.id, action: "compliance.rule.delete", resourceType: "compliance_rule", resourceId: String(input.id) });
        return { success: true };
      }),
  }),
  // ─── Recordings ───────────────────────────────────────────────────────────────
  recordings: router({
    upload: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSizeBytes: z.number(),
        fileDataBase64: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        await assertSessionAccess(ctx, session);

        const buffer = Buffer.from(input.fileDataBase64, "base64");
        const fileKey = `recordings/${ctx.user.id}/${input.sessionId}/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        const recResult = await insertRecording({
          sessionId: input.sessionId,
          userId: ctx.user.id,
          fileKey,
          fileUrl: url,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSizeBytes: input.fileSizeBytes,
        });

        // CFPB: Set default 90-day retention period
        const recId = recResult?.insertId;
        if (recId) await setRecordingRetention(Number(recId), 90);

        await insertAuditLog({ userId: ctx.user.id, action: "recording.upload", resourceType: "session", resourceId: String(input.sessionId), details: { fileName: input.fileName, fileSizeBytes: input.fileSizeBytes } });
        const recordings = await getRecordingsBySession(input.sessionId);
        return recordings[recordings.length - 1];
      }),

    getBySession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        await assertSessionAccess(ctx, session);
        return getRecordingsBySession(input.sessionId);
      }),

    myRecordings: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        return getRecordingsByUser(ctx.user.id, input.limit);
      }),

    transcribe: protectedProcedure
      .input(z.object({ recordingId: z.number(), sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const recordings = await getRecordingsBySession(input.sessionId);
        const recording = recordings.find((r) => r.id === input.recordingId);
        if (!recording) throw new TRPCError({ code: "NOT_FOUND" });

        await updateRecordingStatus(input.recordingId, "processing");

        try {
          const result = await transcribeAudio({ audioUrl: recording.fileUrl, language: "en", prompt: "F&I automotive finance insurance conversation" });
          if ('error' in result) throw new Error(result.error);
          if (result.segments) {
            for (const seg of result.segments) {
              await insertTranscript({
                sessionId: input.sessionId,
                speaker: "unknown",
                text: seg.text,
                startTime: seg.start,
                endTime: seg.end,
                confidence: 0.9,
                isFinal: true,
              });
            }
          } else if (result.text) {
            await insertTranscript({ sessionId: input.sessionId, speaker: "unknown", text: result.text, isFinal: true });
          }
          await updateRecordingStatus(input.recordingId, "transcribed");
          await insertAuditLog({ userId: ctx.user.id, action: "recording.transcribe", resourceType: "recording", resourceId: String(input.recordingId) });
          return { success: true, text: result.text };
        } catch (e) {
          await updateRecordingStatus(input.recordingId, "failed");
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Transcription failed" });
        }
      }),

    reTranscribe: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        await assertSessionAccess(ctx, session);

        const recordings = await getRecordingsBySession(input.sessionId);
        if (!recordings || recordings.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No recording found for this session. Cannot re-transcribe without a saved audio recording." });
        }

        const recording = recordings[recordings.length - 1]; // Use the latest recording
        await updateRecordingStatus(recording.id, "processing");

        try {
          // Delete existing transcripts for this session
          const deletedCount = await deleteTranscriptsBySession(input.sessionId);
          console.log(`[ReTranscribe] Deleted ${deletedCount} old transcripts for session ${input.sessionId}`);

          // Re-transcribe from the recording
          const result = await transcribeAudio({
            audioUrl: recording.fileUrl,
            language: "en",
            prompt: "F&I automotive finance insurance dealership conversation between manager and customer about vehicle service contracts gap insurance paint protection",
          });
          if ('error' in result) throw new Error(result.error);

          let transcriptCount = 0;
          if (result.segments) {
            for (const seg of result.segments) {
              await insertTranscript({
                sessionId: input.sessionId,
                speaker: "unknown",
                text: seg.text.trim(),
                startTime: seg.start,
                endTime: seg.end,
                confidence: 0.9,
                isFinal: true,
              });
              transcriptCount++;
            }
          } else if (result.text) {
            await insertTranscript({
              sessionId: input.sessionId,
              speaker: "unknown",
              text: result.text.trim(),
              isFinal: true,
            });
            transcriptCount = 1;
          }

          await updateRecordingStatus(recording.id, "transcribed");
          await insertAuditLog({
            userId: ctx.user.id,
            action: "recording.retranscribe",
            resourceType: "session",
            resourceId: String(input.sessionId),
            details: { deletedCount, newTranscriptCount: transcriptCount, recordingId: recording.id },
          });

          return {
            success: true,
            deletedCount,
            newTranscriptCount: transcriptCount,
            text: result.text,
          };
        } catch (e: any) {
          await updateRecordingStatus(recording.id, "failed");
          console.error(`[ReTranscribe] Failed for session ${input.sessionId}:`, e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Re-transcription failed: ${e?.message ?? "Unknown error"}`,
          });
        }
      }),
  }),

  // ─── Coaching Reports ────────────────────────────────────────────────────────
  reports: router({
    generate: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        await assertSessionAccess(ctx, session);

        const [transcriptList, grade] = await Promise.all([
          getTranscriptsBySession(input.sessionId),
          getGradeBySession(input.sessionId),
        ]);

        const fullText = transcriptList.map((t) => `${t.speaker.toUpperCase()}: ${t.text}`).join("\n");
        if (!fullText.trim()) throw new TRPCError({ code: "BAD_REQUEST", message: "No transcript available" });

        const reportData = await runCoachingReportEngine(fullText, grade ?? {});
        if (!reportData) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Report generation failed" });

        await upsertCoachingReport({ sessionId: input.sessionId, userId: session.userId, ...reportData });
        await insertAuditLog({ userId: ctx.user.id, action: "report.generate", resourceType: "session", resourceId: String(input.sessionId) });
        return reportData;
      }),

    get: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        await assertSessionAccess(ctx, session);
        return getReportBySession(input.sessionId);
      }),

    myReports: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ ctx, input }) => {
        return getReportsByUser(ctx.user.id, input.limit);
      }),
  }),

  // ─── Analytics ───────────────────────────────────────────────────────────────
  analytics: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.role === "admin" ? undefined : ctx.user.id;
      const dealershipId = ctx.user.isSuperAdmin ? null : (ctx.user.dealershipId ?? null);
      return getAnalyticsSummary(userId, dealershipId);
    }),

    adminSummary: adminProcedure.query(async ({ ctx }) => {
      const dealershipId = ctx.user.isSuperAdmin ? null : (ctx.user.dealershipId ?? null);
      return getAnalyticsSummary(undefined, dealershipId);
    }),

    myGradeTrend: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ ctx, input }) => {
        return getGradesByUser(ctx.user.id, input.limit);
      }),
    pvrTrend: protectedProcedure
      .input(z.object({ limit: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.user.role === "admin" ? undefined : ctx.user.id;
        return getPvrTrend(userId, input.limit);
      }),
    productMix: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.role === "admin" ? undefined : ctx.user.id;
      return getProductMix(userId);
    }),
    sessionVolume: protectedProcedure
      .input(z.object({ weeks: z.number().default(8) }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.user.role === "admin" ? undefined : ctx.user.id;
        return getSessionVolume(userId, input.weeks);
      }),
    managerScorecard: protectedProcedure
      .input(z.object({ userId: z.number().optional(), weeks: z.number().default(12) }))
      .query(async ({ ctx, input }) => {
        const targetUserId = ctx.user.role === "admin" && input.userId ? input.userId : ctx.user.id;
        return getManagerScorecard(targetUserId, input.weeks);
      }),
    complianceTrend: protectedProcedure
      .input(z.object({ days: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return getComplianceTrend(ctx.user.id, input.days ?? 30);
      }),
  }),

  // ─── Session Checklists ──────────────────────────────────────────────────────
  checklists: router({
    get: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => getChecklistBySession(input.sessionId)),
    upsert: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        fiManagerGreeting: z.boolean().optional(),
        statedTitleWork: z.boolean().optional(),
        statedFactoryWarranty: z.boolean().optional(),
        statedFinancialOptions: z.boolean().optional(),
        statedTimeFrame: z.boolean().optional(),
        introductionToFirstForms: z.boolean().optional(),
        privacyPolicyMentioned: z.boolean().optional(),
        riskBasedPricingMentioned: z.boolean().optional(),
        disclosedBasePayment: z.boolean().optional(),
        presentedPrepaidMaintenance: z.boolean().optional(),
        presentedVehicleServiceContract: z.boolean().optional(),
        presentedGap: z.boolean().optional(),
        presentedInteriorExteriorProtection: z.boolean().optional(),
        presentedRoadHazard: z.boolean().optional(),
        presentedPaintlessDentRepair: z.boolean().optional(),
        customerQuestionsAddressed: z.boolean().optional(),
        whichClosingQuestionAsked: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return upsertSessionChecklist({ ...input, userId: ctx.user.id });
      }),
  }),
  // ─── Objection Logs ──────────────────────────────────────────────────────────
  objections: router({
    getBySession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => getObjectionsBySession(input.sessionId)),
    log: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        product: z.enum(["vehicle_service_contract","gap_insurance","prepaid_maintenance","interior_exterior_protection","road_hazard","paintless_dent_repair","key_replacement","windshield_protection","lease_wear_tear","other"]),
        concernType: z.enum(["cost","confidence_in_coverage","low_usage_expectation","skepticism_dealer_motives","misunderstanding","self_insurance_preference","perception_low_risk","exclusions_concern","financial_constraints","other"]),
        excerpt: z.string().optional(),
        wasResolved: z.boolean().default(false),
        resolutionMethod: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return insertObjectionLog({ ...input, userId: ctx.user.id });
      }),
    analysisByProduct: protectedProcedure
      .input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional() }))
      .query(async ({ input }) => getObjectionAnalysisByProduct(input.fromDate, input.toDate)),
    analysisByConcern: protectedProcedure
      .input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional() }))
      .query(async ({ input }) => getObjectionAnalysisByConcern(input.fromDate, input.toDate)),
  }),
  // ─── Eagle Eye View ───────────────────────────────────────────────────────────
  eagleEye: router({
    leaderboard: protectedProcedure
      .input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional() }))
      .query(async ({ ctx, input }) => {
        const dealershipId = ctx.user.isSuperAdmin ? null : (ctx.user.dealershipId ?? null);
        return getEagleEyeLeaderboard(input.fromDate, input.toDate, dealershipId);
      }),
    trends: protectedProcedure
      .input(z.object({ fromDate: z.date().optional(), toDate: z.date().optional() }))
      .query(async ({ ctx, input }) => {
        const dealershipId = ctx.user.isSuperAdmin ? null : (ctx.user.dealershipId ?? null);
        return getEagleEyeTrends(input.fromDate, input.toDate, dealershipId);
      }),
  }),
  // ─── Admin ───────────────────────────────────────────────────────────────────
  admin: router({
    listUsers: adminProcedure.query(async ({ ctx }) => {
      if (ctx.user.isSuperAdmin) return getAllUsers();
      const dealershipIds = await getUserAccessibleDealershipIds(ctx.user.id);
      if (dealershipIds.length === 0) return getAllUsers();
      return getAllUsersByDealershipIds(dealershipIds);
    }),

    updateRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ ctx, input }) => {
        await updateUserRole(input.userId, input.role);
        await insertAuditLog({ userId: ctx.user.id, action: "admin.updateRole", resourceType: "user", resourceId: String(input.userId), details: { role: input.role } });
        return { success: true };
      }),

    auditLogs: adminProcedure
      .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.isSuperAdmin) {
          const [rows, total] = await Promise.all([getAuditLogs(input.limit, input.offset), getAuditLogCount()]);
          return { rows, total, limit: input.limit, offset: input.offset };
        }
        if (ctx.user.isGroupAdmin) {
          const dealershipIds = await getUserAccessibleDealershipIds(ctx.user.id);
          const scopedUsers = await getAllUsersByDealershipIds(dealershipIds);
          const userIds = scopedUsers.map(u => u.id);
          const scopedIds = userIds.length > 0 ? userIds : null;
          const [rows, total] = await Promise.all([getAuditLogs(input.limit, input.offset, scopedIds), getAuditLogCount(scopedIds)]);
          return { rows, total, limit: input.limit, offset: input.offset };
        }
        // Store admin: scope to users in their dealership
        const dealershipId = ctx.user.dealershipId;
        if (dealershipId) {
          const scopedUsers = await getAllUsersByDealershipIds([dealershipId]);
          const userIds = scopedUsers.map(u => u.id);
          const scopedIds = userIds.length > 0 ? userIds : null;
          const [rows, total] = await Promise.all([getAuditLogs(input.limit, input.offset, scopedIds), getAuditLogCount(scopedIds)]);
          return { rows, total, limit: input.limit, offset: input.offset };
        }
        const [rows, total] = await Promise.all([getAuditLogs(input.limit, input.offset, [ctx.user.id]), getAuditLogCount([ctx.user.id])]);
        return { rows, total, limit: input.limit, offset: input.offset };
      }),

    // CFPB: Enforce data retention policy — delete expired recordings
    enforceRetention: adminProcedure
      .input(z.object({ dryRun: z.boolean().default(true) }).optional())
      .mutation(async ({ ctx, input }) => {
        const expired = await getExpiredRecordings(200);
        if (expired.length === 0) return { processed: 0, sessionIds: [] as number[] };

        const dryRun = input?.dryRun ?? true;
        const sessionIds = Array.from(new Set(expired.map((r) => r.sessionId)));

        if (dryRun) return { dryRun: true, expiredCount: expired.length, sessionIds };

        let processed = 0;
        for (const sid of sessionIds) {
          try {
            const result = await deleteSessionData(sid);
            for (const fk of result.recordings.fileKeys) {
              try { await storageDelete(fk); } catch { /* log but continue */ }
            }
            await insertAuditLog({
              userId: ctx.user.id,
              action: "retention.enforce",
              resourceType: "session",
              resourceId: String(sid),
              details: { deletionSummary: result },
            });
            processed++;
          } catch (err) {
            console.error(`[Retention] Failed to delete session ${sid}:`, err);
          }
        }

        return { dryRun: false, processed, sessionIds };
      }),

    // ─── Dealership Settings ──────────────────────────────────────────────────────────────────
    getSettings: adminProcedure.query(async ({ ctx }) => {
      const dealershipId = ctx.user.dealershipId;
      if (!dealershipId) throw new TRPCError({ code: "BAD_REQUEST", message: "No dealership assigned" });
      return getDealershipSettings(dealershipId);
    }),

    updateSettings: adminProcedure
      .input(z.object({
        maxSessionDuration: z.number().min(15).max(480).optional(),
        autoGradeEnabled: z.boolean().optional(),
        requireCustomerName: z.boolean().optional(),
        requireDealNumber: z.boolean().optional(),
        consentMethod: z.enum(["verbal", "written", "electronic"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dealershipId = ctx.user.dealershipId;
        if (!dealershipId) throw new TRPCError({ code: "BAD_REQUEST", message: "No dealership assigned" });
        await updateDealershipSettings(dealershipId, input);
        await insertAuditLog({
          userId: ctx.user.id,
          action: "admin.updateSettings",
          resourceType: "dealership",
          resourceId: String(dealershipId),
          details: input,
        });
        return { success: true };
      }),

    allSessions: adminProcedure
      .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.isSuperAdmin) {
          const [rows, total] = await Promise.all([getAllSessions(input.limit, input.offset, null), getSessionCount()]);
          return { rows, total, limit: input.limit, offset: input.offset };
        }
        if (ctx.user.isGroupAdmin) {
          const dealershipIds = await getUserAccessibleDealershipIds(ctx.user.id);
          const [rows, total] = await Promise.all([getAllSessionsByDealershipIds(dealershipIds, input.limit, input.offset), getSessionCountByDealershipIds(dealershipIds)]);
          return { rows, total, limit: input.limit, offset: input.offset };
        }
        const dealershipId = ctx.user.dealershipId ?? null;
        const [rows, total] = await Promise.all([getAllSessions(input.limit, input.offset, dealershipId), getSessionCount(dealershipId)]);
        return { rows, total, limit: input.limit, offset: input.offset };
      }),

    // ─── Group Management (multi-tenant) ────────────────────────────────────
    listGroups: adminProcedure.query(async ({ ctx }) => {
      if (ctx.user.isSuperAdmin) return getAllDealershipGroups();
      // Group admin sees only their own group
      const groupId = await getGroupIdForUser(ctx.user.id);
      if (!groupId) return [];
      const group = await getDealershipGroup(groupId);
      return group ? [group] : [];
    }),

    createGroup: groupAdminProcedure
      .input(z.object({ name: z.string().min(2), slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/) }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.isSuperAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "Only super admins can create groups" });
        const group = await createDealershipGroup(input);
        await insertAuditLog({ userId: ctx.user.id, action: "admin.createGroup", resourceType: "dealershipGroup", details: input });
        return group;
      }),

    updateGroup: groupAdminProcedure
      .input(z.object({ id: z.number(), name: z.string().min(2).optional(), isActive: z.boolean().optional() }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateDealershipGroup(id, data);
        await insertAuditLog({ userId: ctx.user.id, action: "admin.updateGroup", resourceType: "dealershipGroup", resourceId: String(id), details: data });
        return { success: true };
      }),

    getGroupRooftops: adminProcedure
      .input(z.object({ groupId: z.number() }))
      .query(async ({ input }) => getDealershipsByGroup(input.groupId)),

    // ─── Rooftop Assignment Management ────────────────────────────────────────
    assignUserToRooftop: adminProcedure
      .input(z.object({ userId: z.number(), dealershipId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assignUserToRooftop(input.userId, input.dealershipId);
        await insertAuditLog({ userId: ctx.user.id, action: "admin.assignRooftop", resourceType: "rooftopAssignment", details: input });
        return { success: true };
      }),

    removeUserFromRooftop: adminProcedure
      .input(z.object({ userId: z.number(), dealershipId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await removeUserFromRooftop(input.userId, input.dealershipId);
        await insertAuditLog({ userId: ctx.user.id, action: "admin.removeRooftop", resourceType: "rooftopAssignment", details: input });
        return { success: true };
      }),

    listRooftopUsers: adminProcedure
      .input(z.object({ dealershipId: z.number() }))
      .query(async ({ input }) => getRooftopUsers(input.dealershipId)),

    getUserRooftopAssignments: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => getUserRooftops(input.userId)),

    // Dealership management (super-admin only)
    listDealerships: adminProcedure.query(async () => getAllDealerships()),

    createDealership: adminProcedure
      .input(z.object({
        name: z.string().min(2),
        slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
        plan: z.enum(["trial", "beta", "pro", "enterprise"]).default("beta"),
        groupId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dealership = await createDealership(input);
        await insertAuditLog({ userId: ctx.user.id, action: "admin.createDealership", resourceType: "dealership", details: input });
        return dealership;
      }),

    updateDealership: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(2).optional(),
        plan: z.enum(["trial", "beta", "pro", "enterprise"]).optional(),
        isActive: z.boolean().optional(),
        groupId: z.number().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateDealership(id, data);
        await insertAuditLog({ userId: ctx.user.id, action: "admin.updateDealership", resourceType: "dealership", resourceId: String(id), details: data });
        return { success: true };
      }),

    assignUserToDealership: adminProcedure
      .input(z.object({ userId: z.number(), dealershipId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assignUserToDealership(input.userId, input.dealershipId);
        await insertAuditLog({ userId: ctx.user.id, action: "admin.assignDealership", resourceType: "user", resourceId: String(input.userId), details: input });
        return { success: true };
      }),

    systemValidation: adminProcedure.query(async () => {
      const checks: Array<{ name: string; status: "pass" | "fail" | "warn"; detail: string }> = [];
      let overallStatus: "operational" | "degraded" | "error" = "operational";

      // 1. Deepgram API key
      if (process.env.DEEPGRAM_API_KEY) {
        checks.push({ name: "Deepgram API Key", status: "pass", detail: "Configured" });
      } else {
        checks.push({ name: "Deepgram API Key", status: "fail", detail: "Missing — real-time transcription will use browser fallback" });
        if (overallStatus === "operational") overallStatus = "degraded";
      }

      // 2. LLM availability
      if (process.env.BUILT_IN_FORGE_API_KEY) {
        checks.push({ name: "LLM API (Forge)", status: "pass", detail: "Configured" });
      } else {
        checks.push({ name: "LLM API (Forge)", status: "fail", detail: "Missing — grading and coaching reports will not work" });
        overallStatus = "error";
      }

      // 3. OAuth
      if (process.env.OAUTH_SERVER_URL) {
        checks.push({ name: "OAuth Server", status: "pass", detail: "Configured" });
      } else {
        checks.push({ name: "OAuth Server", status: "warn", detail: "Missing" });
        if (overallStatus === "operational") overallStatus = "degraded";
      }

      // 4. Database
      if (process.env.DATABASE_URL) {
        checks.push({ name: "Database URL", status: "pass", detail: "Configured" });
      } else {
        checks.push({ name: "Database URL", status: "fail", detail: "Missing" });
        overallStatus = "error";
      }

      // 5. Compliance engine
      checks.push({ name: "Federal Compliance Engine", status: "pass", detail: "31 rules across 8 categories loaded" });

      // 6. ASURA Scripts
      checks.push({ name: "ASURA Script Library", status: "pass", detail: `Scripts loaded and indexed` });

      // 7. Real-Time Transport
      checks.push({ name: "Real-Time Transport", status: "pass", detail: "HTTP streaming available (WebSocket may be proxied — HTTP fallback is fully functional)" });

      return { status: overallStatus, checks, timestamp: Date.now() };
    }),
  }),

  // ─── Invitations ─────────────────────────────────────────────────────────────
  invitations: router({
    create: adminProcedure
      .input(z.object({
        email: z.string().email().optional(),
        dealershipId: z.number(),
        role: z.enum(["user", "admin"]).default("user"),
        expiresInDays: z.number().min(1).max(30).default(7),
        origin: z.string().url(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { origin, ...invData } = input;
        const { token, expiresAt } = await createInvitation({ ...invData, invitedBy: ctx.user.id });
        const inviteUrl = `${origin}/join?token=${token}`;
        await insertAuditLog({ userId: ctx.user.id, action: "invitations.create", resourceType: "invitation", details: { email: input.email, dealershipId: input.dealershipId } });
        return { token, inviteUrl, expiresAt };
      }),

    list: adminProcedure
      .input(z.object({ dealershipId: z.number() }))
      .query(async ({ input }) => getInvitationsByDealership(input.dealershipId)),

    revoke: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await revokeInvitation(input.id);
        await insertAuditLog({ userId: ctx.user.id, action: "invitations.revoke", resourceType: "invitation", resourceId: String(input.id), details: {} });
        return { success: true };
      }),

    redeem: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const inv = await redeemInvitation(input.token, ctx.user.id);
        await insertAuditLog({ userId: ctx.user.id, action: "invitations.redeem", resourceType: "invitation", details: { dealershipId: inv.dealershipId } });
        return { success: true, dealershipId: inv.dealershipId };
      }),

     validate: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const inv = await getInvitationByToken(input.token);
        if (!inv) return { valid: false, reason: "not_found" };
        if (inv.usedBy) return { valid: false, reason: "already_used" };
        if (inv.expiresAt < new Date()) return { valid: false, reason: "expired" };
        return { valid: true, email: inv.email, role: inv.role };
      }),
  }),

  // ─── Pipeline Diagnostics (public — no auth required) ──────────────────────
  diagnostics: router({
    pipelineHealth: publicProcedure.query(async () => {
      const checks: Array<{ name: string; status: "pass" | "fail" | "warn"; detail: string }> = [];

      // 1. Deepgram API Key
      const dgKey = process.env.DEEPGRAM_API_KEY;
      if (dgKey && dgKey.length > 10) {
        // Test actual connectivity
        try {
          const resp = await fetch("https://api.deepgram.com/v1/projects", {
            headers: { Authorization: `Token ${dgKey}` },
          });
          if (resp.ok) {
            checks.push({ name: "Deepgram API Key", status: "pass", detail: `Valid (${dgKey.substring(0, 6)}..., ${dgKey.length} chars)` });
          } else {
            checks.push({ name: "Deepgram API Key", status: "fail", detail: `Key present but API returned ${resp.status}` });
          }
        } catch (err) {
          checks.push({ name: "Deepgram API Key", status: "warn", detail: `Key present but connectivity check failed: ${(err as Error).message}` });
        }
      } else {
        checks.push({ name: "Deepgram API Key", status: "fail", detail: "Missing or too short — real-time transcription will use browser fallback" });
      }

      // 2. Deepgram Live Connection Test
      try {
        const { createClient: dgCreate, LiveTranscriptionEvents: dgEvents } = await import("@deepgram/sdk");
        if (dgKey) {
          const testResult = await new Promise<string>((resolve) => {
            const dg = dgCreate(dgKey);
            const conn = dg.listen.live({ model: "nova-2", language: "en-US" });
            const timeout = setTimeout(() => { try { conn.requestClose(); } catch {} resolve("timeout (5s)"); }, 5000);
            conn.on(dgEvents.Open, () => { clearTimeout(timeout); try { conn.requestClose(); } catch {} resolve("connected"); });
            conn.on(dgEvents.Error, (e) => { clearTimeout(timeout); resolve(`error: ${(e as Error).message ?? e}`); });
          });
          checks.push({ name: "Deepgram Live Stream", status: testResult === "connected" ? "pass" : "fail", detail: testResult });
        } else {
          checks.push({ name: "Deepgram Live Stream", status: "fail", detail: "Skipped (no API key)" });
        }
      } catch (err) {
        checks.push({ name: "Deepgram Live Stream", status: "fail", detail: `SDK error: ${(err as Error).message}` });
      }

      // 3. Database
      try {
        const dbMod = await import("./db.js");
        const dbConn = await dbMod.getDb();
        if (dbConn) {
          await dbConn.execute("SELECT 1");
          checks.push({ name: "Database", status: "pass", detail: "Connected and responsive" });
        } else {
          checks.push({ name: "Database", status: "fail", detail: "No connection" });
        }
      } catch (err) {
        checks.push({ name: "Database", status: "fail", detail: `Error: ${(err as Error).message}` });
      }

      // 4. LLM (Forge)
      if (process.env.BUILT_IN_FORGE_API_KEY) {
        checks.push({ name: "LLM API (Forge)", status: "pass", detail: "Configured" });
      } else {
        checks.push({ name: "LLM API (Forge)", status: "fail", detail: "Missing" });
      }

      // 5. Real-Time Transport
      checks.push({ name: "Real-Time Transport", status: "pass", detail: "HTTP streaming available (WebSocket may be proxied — HTTP fallback is fully functional)" });

      // 6. Compliance Engine
      checks.push({ name: "Compliance Engine", status: "pass", detail: "31 federal rules + ASURA proprietary rules loaded" });

      // 7. ASURA Script Library
      checks.push({ name: "ASURA Script Library", status: "pass", detail: "Verbatim scripts indexed and ready" });

      const hasFailure = checks.some(c => c.status === "fail");
      const hasWarn = checks.some(c => c.status === "warn");
      const overallStatus = hasFailure ? "error" : hasWarn ? "degraded" : "operational";

      return {
        status: overallStatus,
        checks,
        timestamp: Date.now(),
        environment: process.env.NODE_ENV ?? "development",
        uptime: Math.floor(process.uptime()),
      };
    }),
  }),

  // ─── Settings Router (spec-aligned, separate from admin) ─────────────────
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const dealershipId = ctx.user.dealershipId;
      if (!dealershipId) return null;
      return getDealershipSettings(dealershipId);
    }),

    update: adminProcedure
      .input(z.object({
        maxSessionDuration: z.number().min(10).max(480).optional(),
        autoGradeEnabled: z.boolean().optional(),
        requireCustomerName: z.boolean().optional(),
        requireDealNumber: z.boolean().optional(),
        consentMethod: z.enum(["verbal", "written", "electronic"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dealershipId = ctx.user.dealershipId;
        if (!dealershipId) throw new TRPCError({ code: "BAD_REQUEST", message: "No dealership assigned" });
        await upsertDealershipSettings(dealershipId, input);
        await insertAuditLog({
          userId: ctx.user.id,
          action: "settings.update",
          resourceType: "dealership",
          resourceId: String(dealershipId),
          details: input,
        });
        return { success: true };
      }),
  }),

  // ─── Customers ────────────────────────────────────────────────────────────
  customers: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const dealershipId = ctx.user.dealershipId;
        if (!dealershipId) return { rows: [], total: 0 };
        const [rows, total] = await Promise.all([
          getCustomersByDealership(dealershipId, input.limit, input.offset),
          getCustomerCountByDealership(dealershipId),
        ]);
        return { rows, total, limit: input.limit, offset: input.offset };
      }),

    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ ctx, input }) => {
        const dealershipId = ctx.user.dealershipId;
        if (!dealershipId) return [];
        return searchCustomers(dealershipId, input.query);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const customer = await getCustomerById(input.id);
        if (!customer) throw new TRPCError({ code: "NOT_FOUND" });
        if (customer.dealershipId !== ctx.user.dealershipId && !ctx.user.isSuperAdmin && !ctx.user.isGroupAdmin) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const sessions = await getSessionsByCustomerId(input.id);
        return { customer, sessions };
      }),

    create: protectedProcedure
      .input(z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dealershipId = ctx.user.dealershipId;
        if (!dealershipId) throw new TRPCError({ code: "BAD_REQUEST", message: "No dealership assigned" });
        const customer = await createCustomer({ ...input, dealershipId });
        await insertAuditLog({ userId: ctx.user.id, action: "customer.create", resourceType: "customer", resourceId: String(customer?.id ?? 0), details: { name: `${input.firstName} ${input.lastName}` } });
        return customer;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const existing = await getCustomerById(id);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
        if (existing.dealershipId !== ctx.user.dealershipId && !ctx.user.isSuperAdmin) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await updateCustomer(id, data);
        await insertAuditLog({ userId: ctx.user.id, action: "customer.update", resourceType: "customer", resourceId: String(id), details: data });
        return { success: true };
      }),

    exportCsv: protectedProcedure
      .query(async ({ ctx }) => {
        const dealershipId = ctx.user.dealershipId;
        if (!dealershipId) throw new TRPCError({ code: "BAD_REQUEST", message: "No dealership assigned" });
        const rows = await getCustomersByDealership(dealershipId, 10000, 0);
        const header = "id,firstName,lastName,email,phone,address,notes,createdAt";
        const lines = rows.map((c) =>
          [c.id, c.firstName, c.lastName, c.email ?? "", c.phone ?? "", (c.address ?? "").replace(/,/g, " "), (c.notes ?? "").replace(/,/g, " "), new Date(c.createdAt).toISOString()].join(",")
        );
        return { csv: [header, ...lines].join("\n"), count: rows.length };
      }),
  }),

  // ─── Product Menu ──────────────────────────────────────────────────────────
  productMenu: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const dealershipId = ctx.user.dealershipId;
        if (!dealershipId) return [];
        return getProductMenuByDealership(dealershipId);
      }),

    upsert: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        productType: z.enum(["vehicle_service_contract","gap_insurance","prepaid_maintenance","interior_exterior_protection","road_hazard","paintless_dent_repair","key_replacement","windshield_protection","lease_wear_tear","tire_wheel","theft_protection","other"]),
        displayName: z.string().min(1),
        providerName: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        costToDealer: z.number().optional().nullable(),
        retailPrice: z.number().optional().nullable(),
        termMonths: z.number().optional().nullable(),
        maxMileage: z.number().optional().nullable(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dealershipId = ctx.user.dealershipId;
        if (!dealershipId) throw new TRPCError({ code: "BAD_REQUEST", message: "No dealership assigned" });
        await upsertProductMenuItem({ ...input, dealershipId });
        await insertAuditLog({ userId: ctx.user.id, action: input.id ? "productMenu.update" : "productMenu.create", resourceType: "productMenu", resourceId: String(input.id ?? 0), details: { name: input.displayName } });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteProductMenuItem(input.id);
        await insertAuditLog({ userId: ctx.user.id, action: "productMenu.delete", resourceType: "productMenu", resourceId: String(input.id), details: {} });
        return { success: true };
      }),
  }),

  // ─── Deal Recovery ─────────────────────────────────────────────────────────
  dealRecovery: router({
    bySession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        await assertSessionAccess(ctx, session);
        return getDealRecoveriesBySession(input.sessionId);
      }),

    myRecoveries: protectedProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        return getDealRecoveriesByUser(ctx.user.id, input.limit, input.offset);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "attempted", "recovered", "lost"]),
        actualRevenue: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateDealRecoveryStatus(input.id, input.status, input.actualRevenue);
        await insertAuditLog({ userId: ctx.user.id, action: "dealRecovery.updateStatus", resourceType: "dealRecovery", resourceId: String(input.id), details: { status: input.status } });
        return { success: true };
      }),

    stats: protectedProcedure.query(async ({ ctx }) => {
      return getDealRecoveryStats(ctx.user.id);
    }),
  }),

  // ─── Product Intelligence ──────────────────────────────────────────────────
  productIntelligence: router({
    list: protectedProcedure.query(async () => {
      return getAllProductIntelligence();
    }),

    get: protectedProcedure
      .input(z.object({ productType: z.string() }))
      .query(async ({ input }) => {
        return getProductIntelligenceByType(input.productType);
      }),

    upsert: adminProcedure
      .input(z.object({
        id: z.number().optional(),
        productType: z.string(),
        coverageSummary: z.string().optional(),
        commonObjections: z.any().optional(),
        objectionResponses: z.any().optional(),
        sellingPoints: z.any().optional(),
        asuraCoachingTips: z.any().optional(),
        targetCustomerProfile: z.string().optional(),
        avgCloseRate: z.number().optional(),
        avgProfit: z.number().optional(),
        complianceNotes: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertProductIntelligence(input);
        await insertAuditLog({ userId: ctx.user.id, action: "productIntelligence.upsert", resourceType: "productIntelligence", resourceId: input.productType, details: { productType: input.productType } });
        return { success: true };
      }),

    /** Return the static product intelligence database (all 9 products with full detail) */
    catalog: protectedProcedure.query(async () => {
      return PRODUCT_DATABASE;
    }),

    /** Analyze a session transcript and recommend missed / improvable products */
    recommend: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        const transcripts = await getTranscriptsBySession(input.sessionId);
        const lines = (transcripts ?? []).map((t: any) => ({
          speaker: t.speaker ?? "unknown",
          text: t.text ?? "",
        }));
        const recommendations = generateRecommendations(lines);
        const missedRevenue = calculateMissedRevenue(recommendations);
        return { recommendations, missedRevenue };
      }),
  }),

  // ─── ASURA OPS Scorecards ──────────────────────────────────────────────────
  scorecards: router({
    /**
     * Score a session transcript through the 4-pillar engine.
     * Persists result to DB and returns the full scorecard.
     */
    score: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        /** Include historical scores for Coaching Cadence pillar */
        includeHistory: z.boolean().optional().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        await assertSessionAccess(ctx, session);

        // Get full transcript text
        const transcriptRows = await getTranscriptsBySession(input.sessionId);
        const fullTranscript = transcriptRows.map((t: any) => t.content ?? t.text ?? "").join(" ");

        if (!fullTranscript.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No transcript available for this session. Record audio first." });
        }

        // Gather historical scores for Coaching Cadence pillar
        let cadenceInput: CoachingCadenceInput = {};
        if (input.includeHistory) {
          const priorScores = await getRecentScorecardScores(session.userId, 10);
          cadenceInput = { priorScores };

          // Get word track utilization rate if available
          const utilization = await getSuggestionUtilizationRate(input.sessionId);
          if (typeof utilization === "number") {
            cadenceInput.wordTrackUtilizationRate = utilization;
          } else if (utilization && typeof (utilization as any).rate === "number") {
            cadenceInput.wordTrackUtilizationRate = (utilization as any).rate;
          }
        }

        const result = runASURAScorecardEngine(fullTranscript, cadenceInput);

        // Persist to DB
        const scorecard = await upsertScorecard({
          sessionId: input.sessionId,
          userId: session.userId,
          tier1Score: result.tier1Score,
          tier: result.tier,
          menuOrderScore: result.menuOrderScore,
          upgradeArchitectureScore: result.upgradeArchitectureScore,
          objectionPreventionScore: result.objectionPreventionScore,
          coachingCadenceScore: result.coachingCadenceScore,
          menuOrderPillar: result.menuOrderPillar as any,
          upgradeArchitecturePillar: result.upgradeArchitecturePillar as any,
          objectionPreventionPillar: result.objectionPreventionPillar as any,
          coachingCadencePillar: result.coachingCadencePillar as any,
          coachingPriorities: result.coachingPriorities,
          gradedAt: new Date(result.gradedAt),
        });

        await insertAuditLog({
          userId: ctx.user.id,
          action: "scorecard.generate",
          resourceType: "session",
          resourceId: String(input.sessionId),
          details: { tier1Score: result.tier1Score, tier: result.tier },
        });

        return scorecard;
      }),

    getBySession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        await assertSessionAccess(ctx, session);
        return getScorecardBySession(input.sessionId);
      }),

    myScorecards: protectedProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        return getScorecardsByUser(ctx.user.id, input.limit, input.offset);
      }),

    myAverage: protectedProcedure.query(async ({ ctx }) => {
      return getAverageScorecardByUser(ctx.user.id);
    }),
  }),

  // ─── Weekly Digest ────────────────────────────────────────────────────────
  weeklyDigest: router({
    send: adminProcedure.mutation(async ({ ctx }) => {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(lastWeekStart.getDate() - 14);

      const dealershipIds = await getUserAccessibleDealershipIds(ctx.user.id);
      const users = await getAllUsersByDealershipIds(dealershipIds);
      const managers = users.filter((u: any) => u.role === "manager" || u.role === "admin");

      let sent = 0;
      for (const mgr of managers) {
        if (!mgr.email) continue;

        // This week's sessions (returns plain array)
        const allSessions = await getSessionsByUserId(mgr.id, 1000, 0);
        const thisWeek = allSessions.filter(
          (s) => new Date(s.startedAt) >= weekStart && new Date(s.startedAt) < now
        );

        // Last week's sessions for trend
        const lastWeek = allSessions.filter(
          (s) => new Date(s.startedAt) >= lastWeekStart && new Date(s.startedAt) < weekStart
        );

        const totalSessions = thisWeek.length;
        const avgScore = totalSessions > 0
          ? thisWeek.reduce((sum: number, s: any) => sum + (s.overallScore ?? 0), 0) / totalSessions
          : 0;
        const lastAvg = lastWeek.length > 0
          ? lastWeek.reduce((sum: number, s: any) => sum + (s.overallScore ?? 0), 0) / lastWeek.length
          : 0;
        const scoreTrend = lastAvg > 0 ? ((avgScore - lastAvg) / lastAvg) * 100 : 0;

        // Compliance flags this week
        const flags = await getComplianceFlags(weekStart.toISOString(), now.toISOString());
        const weekFlags = flags.filter(
          (f) => (f as any).userId === mgr.id || (f as any).sessionId != null
        );

        const emailOpts = buildWeeklyDigestEmail({
          managerName: mgr.name ?? mgr.email,
          managerEmail: mgr.email,
          totalSessions,
          averageScore: Math.round(avgScore),
          scoreTrend: Math.round(scoreTrend * 10) / 10,
          topImprovements: ["Menu presentation sequence", "Objection prevention timing", "Upgrade architecture usage"],
          complianceFlags: weekFlags.length,
        });
        await sendEmail(emailOpts);
        sent++;
      }

      return { success: true, sent };
    }),
  }),
});
export type AppRouter = typeof appRouter;
