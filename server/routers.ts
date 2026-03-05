import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
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
} from "./db";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storagePut } from "./storage";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { ASURA_PROCESS_STEPS, detectDealStage, ALL_SCRIPTS, retrieveAllMatchingScripts } from "./asura-scripts";
import { scanTranscriptForViolations, calculateComplianceScore } from "./compliance-engine";

// ─── Helper: admin guard ──────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

// ─── AI Co-Pilot Engine ───────────────────────────────────────────────────────
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
  const text = fullTranscript.toLowerCase();

  // 1. Process Adherence — check which of the 7 ASURA steps are present
  const stepsCompleted = ASURA_PROCESS_STEPS.filter(step => {
    const scripts = ALL_SCRIPTS.filter(s => s.scriptCategory === step.category);
    return scripts.some(s =>
      s.triggerKeywords.some(kw => text.includes(kw.toLowerCase()))
    );
  });
  const processAdherenceScore = Math.round((stepsCompleted.length / ASURA_PROCESS_STEPS.length) * 100);

  // 2. Script Fidelity — keyword overlap with verbatim scripts
  const totalScripts = ALL_SCRIPTS.length;
  const matchedScripts = ALL_SCRIPTS.filter(s =>
    s.triggerKeywords.some(kw => text.includes(kw.toLowerCase()))
  ).length;
  const scriptFidelityScore = Math.round((matchedScripts / Math.max(totalScripts, 1)) * 100);

  // 3. Menu Sequence — check for correct menu presentation order
  const menuKeywords = ["base payment", "options", "levels", "package", "menu"];
  const productKeywords = ["gap", "service contract", "warranty", "maintenance", "tire"];
  const menuPresent = menuKeywords.some(kw => text.includes(kw));
  const productsPresent = productKeywords.filter(kw => text.includes(kw)).length;
  const menuSequenceScore = menuPresent
    ? Math.min(100, 50 + (productsPresent * 10))
    : Math.min(100, productsPresent * 15);

  // 4. Objection Response — check for objection handling scripts
  const objectionTriggers = ["think about it", "too expensive", "don't need", "already have", "credit union", "spouse", "never use"];
  const objectionResponses = ["let me ask", "what specifically", "put it in perspective", "dollar a day", "responsibility", "per month"];
  const objectionDetected = objectionTriggers.some(kw => text.includes(kw));
  const objectionHandled = objectionResponses.some(kw => text.includes(kw));
  const objectionResponseScore = objectionDetected
    ? (objectionHandled ? 85 : 30)
    : 100; // No objections = full score

  // 5. Transition Accuracy — stage transitions (intro → snapshot → menu → products → close)
  const stages = [
    ["congratulations", "welcome in", "finance director"],
    ["three quick questions", "how long do you keep", "miles per year"],
    ["menu", "options", "packages", "levels"],
    ["gap", "service contract", "warranty"],
    ["sign", "move forward", "does that work", "let's get you"],
  ];
  const stagesPresent = stages.filter(stageKws =>
    stageKws.some(kw => text.includes(kw))
  ).length;
  const transitionAccuracyScore = Math.round((stagesPresent / stages.length) * 100);

  return {
    scriptFidelityScore: Math.min(100, scriptFidelityScore),
    processAdherenceScore: Math.min(100, processAdherenceScore),
    menuSequenceScore: Math.min(100, menuSequenceScore),
    objectionResponseScore: Math.min(100, objectionResponseScore),
    transitionAccuracyScore: Math.min(100, transitionAccuracyScore),
  };
}

// ─── Grading Engine ───────────────────────────────────────────────────────────
async function runGradingEngine(fullTranscript: string, sessionData: { customerName?: string | null; dealType?: string | null }) {
  // Calculate Script Fidelity Scores deterministically (no LLM needed)
  const scriptFidelityScores = calculateScriptFidelityScores(fullTranscript);

  // Calculate deterministic compliance score from federal compliance engine
  const complianceViolations = scanTranscriptForViolations(fullTranscript, 0);
  const deterministicComplianceScore = calculateComplianceScore(complianceViolations);

  const prompt = `You are an expert F&I performance evaluator using the ASURA Group methodology. Grade the following complete F&I interaction transcript.
Customer: ${sessionData.customerName ?? "Unknown"}
Deal Type: ${sessionData.dealType ?? "retail_finance"}

Full Transcript:
${fullTranscript}

Grade on the ASURA F&I Performance Rubric (0-100 each):
1. Rapport Building: Did the manager build genuine connection, use the Professional Hello, ask discovery questions, establish trust?
2. Product Presentation: Were all products presented clearly with value-based selling (not just price)? Were GAP, VSC, PPM, Tire/Wheel covered?
3. Objection Handling: Were objections addressed with ASURA objection response scripts? Was empathy + reframe used?
4. Closing Technique: Were ASURA closing techniques used (assumptive, either/or, takeaway)? Was commitment obtained?
5. Compliance: Were all required disclosures made (base payment, TILA, risk-based pricing, privacy policy, product optional-nature)?

Also provide:
- Overall score (weighted average: Rapport 15%, Product 25%, Objection 20%, Closing 20%, Compliance 20%)
- Key strengths (2-3 specific examples from transcript with quotes)
- Areas for improvement (2-3 specific, actionable ASURA methodology items)
- Coaching notes (personalized guidance paragraph referencing ASURA frameworks)

Return JSON:
{
  "rapportScore": number,
  "productPresentationScore": number,
  "objectionHandlingScore": number,
  "closingTechniqueScore": number,
  "complianceScore": number,
  "overallScore": number,
  "strengths": "string",
  "improvements": "string",
  "coachingNotes": "string"
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
    return {
      ...llmGrade,
      ...scriptFidelityScores,
      complianceScore: finalComplianceScore,
      overallScore,
      complianceViolationCount: complianceViolations.length,
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
  }),

  // ─── Sessions ───────────────────────────────────────────────────────────────
  sessions: router({
    create: protectedProcedure
      .input(z.object({
        customerName: z.string().optional(),
        dealNumber: z.string().optional(),
        vehicleType: z.enum(["new", "used", "cpo"]).optional(),
        dealType: z.enum(["retail_finance", "lease", "cash"]).optional(),
        consentObtained: z.boolean().default(false),
        consentMethod: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createSession({ userId: ctx.user.id, dealershipId: ctx.user.dealershipId ?? null, ...input });
        await insertAuditLog({ userId: ctx.user.id, action: "session.create", resourceType: "session", details: input });
        const sessions = await getSessionsByUserId(ctx.user.id, 1, 0);
        return sessions[0];
      }),

    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        // Super-admins see all; admins see their dealership; users see only their own sessions
        if (ctx.user.isSuperAdmin) return getAllSessions(input.limit, input.offset);
        if (ctx.user.role === "admin") return getAllSessions(input.limit, input.offset, ctx.user.dealershipId ?? null);
        return getSessionsByUserId(ctx.user.id, input.limit, input.offset);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getSessionById(input.id);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        return session;
      }),

    end: protectedProcedure
      .input(z.object({ id: z.number(), durationSeconds: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await getSessionById(input.id);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await endSession(input.id, input.durationSeconds);
        await insertAuditLog({ userId: ctx.user.id, action: "session.end", resourceType: "session", resourceId: String(input.id) });
        return { success: true };
      }),

    getWithDetails: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getSessionById(input.id);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
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
        if (ctx.user.role !== "admin" && session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
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
        if (ctx.user.role !== "admin" && session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
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
        if (ctx.user.role !== "admin" && session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

        const transcriptList = await getTranscriptsBySession(input.sessionId);
        const fullText = transcriptList.map((t) => `${t.speaker.toUpperCase()}: ${t.text}`).join("\n");

        if (!fullText.trim()) throw new TRPCError({ code: "BAD_REQUEST", message: "No transcript available to grade" });

        const gradeData = await runGradingEngine(fullText, { customerName: session.customerName, dealType: session.dealType });
        if (!gradeData) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Grading engine failed" });

        await upsertGrade({ sessionId: input.sessionId, userId: session.userId, ...gradeData });
        await updateSessionStatus(input.sessionId, "completed");
        await insertAuditLog({ userId: ctx.user.id, action: "grade.generate", resourceType: "session", resourceId: String(input.sessionId) });
        return gradeData;
      }),

    get: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
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
        if (ctx.user.role !== "admin" && session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
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
        if (ctx.user.role !== "admin" && session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

        const buffer = Buffer.from(input.fileDataBase64, "base64");
        const fileKey = `recordings/${ctx.user.id}/${input.sessionId}/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        await insertRecording({
          sessionId: input.sessionId,
          userId: ctx.user.id,
          fileKey,
          fileUrl: url,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSizeBytes: input.fileSizeBytes,
        });

        await insertAuditLog({ userId: ctx.user.id, action: "recording.upload", resourceType: "session", resourceId: String(input.sessionId), details: { fileName: input.fileName, fileSizeBytes: input.fileSizeBytes } });
        const recordings = await getRecordingsBySession(input.sessionId);
        return recordings[recordings.length - 1];
      }),

    getBySession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
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
  }),

  // ─── Coaching Reports ────────────────────────────────────────────────────────
  reports: router({
    generate: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

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
        if (ctx.user.role !== "admin" && session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
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
    listUsers: adminProcedure.query(async () => getAllUsers()),

    updateRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ ctx, input }) => {
        await updateUserRole(input.userId, input.role);
        await insertAuditLog({ userId: ctx.user.id, action: "admin.updateRole", resourceType: "user", resourceId: String(input.userId), details: { role: input.role } });
        return { success: true };
      }),

    auditLogs: adminProcedure
      .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }))
      .query(async ({ input }) => getAuditLogs(input.limit, input.offset)),

    allSessions: adminProcedure
      .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const dealershipId = ctx.user.isSuperAdmin ? null : (ctx.user.dealershipId ?? null);
        return getAllSessions(input.limit, input.offset, dealershipId);
      }),

    // Dealership management (super-admin only)
    listDealerships: adminProcedure.query(async () => getAllDealerships()),

    createDealership: adminProcedure
      .input(z.object({
        name: z.string().min(2),
        slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
        plan: z.enum(["trial", "beta", "pro", "enterprise"]).default("beta"),
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
});

export type AppRouter = typeof appRouter;
