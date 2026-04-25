import { and, avg, count, desc, eq, gte, inArray, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  InsertObjectionLog,
  InsertSessionChecklist,
  audioRecordings,
  auditLogs,
  coachingReports,
  complianceFlags,
  complianceRules,
  copilotSuggestions,
  dealerships,
  dealershipGroups,
  dealershipSettings,
  invitations,
  userRooftopAssignments,
  objectionLogs,
  performanceGrades,
  sessionChecklists,
  sessions,
  transcripts,
  users,
  customers,
  productMenu,
  productIntelligence,
  dealRecovery,
  asuraScorecards,
  type InsertAsuraScorecard,
  type AsuraScorecard,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { encrypt, decrypt, encryptFields, decryptFields, decryptRows } from "./_core/encryption";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (!_db) {
    console.error("[Database] getDb() called but DATABASE_URL is not set or connection is null");
  }
  return _db;
}

/**
 * Execute a DB operation with automatic retry on transient errors (ECONNRESET, ETIMEDOUT).
 * This prevents intermittent connection drops from crashing the OAuth flow or other critical paths.
 */
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      const cause = (err as { cause?: { code?: string } })?.cause?.code;
      const isTransient = errMsg.includes('ECONNRESET') || errMsg.includes('ETIMEDOUT') ||
        cause === 'ECONNRESET' || cause === 'ETIMEDOUT';
      if (isTransient && attempt < maxRetries) {
        console.warn(`[Database] Transient error (attempt ${attempt + 1}/${maxRetries + 1}): ${errMsg}. Retrying...`);
        // Reset the connection pool on transient errors
        _db = null;
        await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  await withRetry(async () => {
    const db = await getDb();
    if (!db) return;

    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    textFields.forEach((field) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    });
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] ?? null;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── Sessions ─────────────────────────────────────────────────────────────────
export async function createSession(data: {
  userId: number;
  dealershipId?: number | null;
  customerName?: string;
  dealNumber?: string;
  vehicleType?: "new" | "used" | "cpo";
  dealType?: "retail_finance" | "lease" | "cash";
  consentObtained?: boolean;
  consentMethod?: string;
  consentTimestamp?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const encData = { ...data, customerName: encrypt(data.customerName ?? null) ?? undefined, status: "active" as const };
  const result = await db.insert(sessions).values(encData);
  return result[0];
}

export async function getSessionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  const row = result[0] ?? null;
  return row ? decryptFields(row, ["customerName"]) : null;
}

export async function getSessionsByUserId(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(sessions).where(eq(sessions.userId, userId)).orderBy(desc(sessions.startedAt)).limit(limit).offset(offset);
  return decryptRows(rows, ["customerName"]);
}

export async function getAllSessions(limit = 100, offset = 0, dealershipId?: number | null) {
  const db = await getDb();
  if (!db) return [];
  const q = db.select().from(sessions);
  const filtered = dealershipId != null ? q.where(eq(sessions.dealershipId, dealershipId)) : q;
  const rows = await filtered.orderBy(desc(sessions.startedAt)).limit(limit).offset(offset);
  return decryptRows(rows, ["customerName"]);
}

export async function endSession(id: number, durationSeconds: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(sessions).set({ status: "completed", endedAt: new Date(), durationSeconds }).where(eq(sessions.id, id));
}

export async function updateSessionStatus(id: number, status: "active" | "completed" | "processing" | "archived") {
  const db = await getDb();
  if (!db) return;
  await db.update(sessions).set({ status }).where(eq(sessions.id, id));
}

// ─── Transcripts ──────────────────────────────────────────────────────────────
export async function insertTranscript(data: {
  sessionId: number;
  speaker: "manager" | "customer" | "unknown";
  text: string;
  startTime?: number;
  endTime?: number;
  confidence?: number;
  isFinal?: boolean;
}): Promise<boolean> {
  return withRetry(async () => {
    const db = await getDb();
    if (!db) {
      console.error("[Database] insertTranscript: DB unavailable");
      return false;
    }
    const encData = { ...data, text: encrypt(data.text) ?? data.text };
    await db.insert(transcripts).values(encData);
    return true;
  }).catch((err) => {
    console.error("[Database] insertTranscript failed after retries:", err);
    return false;
  });
}

export async function getTranscriptsBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(transcripts).where(eq(transcripts.sessionId, sessionId)).orderBy(transcripts.startTime);
  return decryptRows(rows, ["text"]);
}

export async function deleteTranscriptsBySession(sessionId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.delete(transcripts).where(eq(transcripts.sessionId, sessionId));
  return result[0]?.affectedRows ?? 0;
}

export async function searchTranscripts(query: string, userId?: number) {
  const db = await getDb();
  if (!db) return [];
  // text is encrypted — can't use SQL LIKE. Fetch, decrypt, filter client-side.
  let rows;
  if (userId) {
    const userSessions = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, userId));
    const sessionIds = userSessions.map((s) => s.id);
    if (sessionIds.length === 0) return [];
    rows = await db.select().from(transcripts).where(inArray(transcripts.sessionId, sessionIds)).limit(500);
  } else {
    rows = await db.select().from(transcripts).limit(500);
  }
  const decrypted = decryptRows(rows, ["text"]);
  const lowerQuery = query.toLowerCase();
  return decrypted
    .filter((t) => t.text && String(t.text).toLowerCase().includes(lowerQuery))
    .slice(0, 50);
}

// ─── Copilot Suggestions ──────────────────────────────────────────────────────
export async function insertCopilotSuggestion(data: {
  sessionId: number;
  type: "product_recommendation" | "objection_handling" | "compliance_reminder" | "rapport_building" | "closing_technique" | "general_tip" | "language_correction" | "process_alert" | "professional_hello" | "customer_connection" | "financial_snapshot" | "menu_transition" | "product_presentation" | "objection_prevention" | "objection_response" | "closing" | "compliance_disclosure" | "phone_script";
  title: string;
  content: string;
  triggeredBy?: string;
  script?: string;
  framework?: string;
  scriptId?: string;
  priority?: "high" | "medium" | "low";
}): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(copilotSuggestions).values(data);
  return result?.insertId ? Number(result.insertId) : null;
}

export async function getSuggestionsBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(copilotSuggestions).where(eq(copilotSuggestions.sessionId, sessionId)).orderBy(desc(copilotSuggestions.createdAt));
}

// ─── Compliance Flags ─────────────────────────────────────────────────────────
export async function insertComplianceFlag(data: {
  sessionId: number;
  severity: "critical" | "warning" | "info";
  rule: string;
  description: string;
  excerpt?: string;
  timestamp?: number;
}) {
  const db = await getDb();
  if (!db) return;
  const encData = { ...data, excerpt: encrypt(data.excerpt ?? null) ?? undefined };
  await db.insert(complianceFlags).values(encData);
}

export async function getFlagsBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(complianceFlags).where(eq(complianceFlags.sessionId, sessionId)).orderBy(complianceFlags.createdAt);
  return decryptRows(rows, ["excerpt"]);
}

export async function resolveFlag(flagId: number, resolvedBy: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(complianceFlags).set({ resolved: true, resolvedBy, resolvedAt: new Date() }).where(eq(complianceFlags.id, flagId));
}

export async function getComplianceFlagById(flagId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(complianceFlags).where(eq(complianceFlags.id, flagId)).limit(1);
  const row = result[0] ?? null;
  return row ? decryptFields(row, ["excerpt"]) : null;
}

// ─── Performance Grades ───────────────────────────────────────────────────────
export async function upsertGrade(data: {
  sessionId: number;
  userId: number;
  rapportScore?: number;
  productPresentationScore?: number;
  objectionHandlingScore?: number;
  closingTechniqueScore?: number;
  complianceScore?: number;
  overallScore?: number;
  pvr?: number;
  productsPerDeal?: number;
  utilizationRate?: number;
  strengths?: string;
  improvements?: string;
  coachingNotes?: string;
  scriptFidelityScore?: number;
  processAdherenceScore?: number;
  menuSequenceScore?: number;
  objectionResponseScore?: number;
  transitionAccuracyScore?: number;
  wordTrackUtilizationScore?: number;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(performanceGrades).values(data).onDuplicateKeyUpdate({ set: { ...data, gradedAt: new Date() } });
}

export async function getGradeBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(performanceGrades).where(eq(performanceGrades.sessionId, sessionId)).limit(1);
  return result[0] ?? null;
}

export async function getGradesByUser(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(performanceGrades).where(eq(performanceGrades.userId, userId)).orderBy(desc(performanceGrades.gradedAt)).limit(limit);
}

// ─── Audio Recordings ─────────────────────────────────────────────────────────
export async function insertRecording(data: {
  sessionId: number;
  userId: number;
  fileKey: string;
  fileUrl: string;
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  durationSeconds?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const encData = { ...data, fileUrl: encrypt(data.fileUrl) ?? data.fileUrl };
  const result = await db.insert(audioRecordings).values({ ...encData, status: "uploaded" });
  return result[0];
}

export async function getRecordingsBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(audioRecordings).where(eq(audioRecordings.sessionId, sessionId));
  return decryptRows(rows, ["fileUrl"]);
}

export async function getRecordingsByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(audioRecordings).where(eq(audioRecordings.userId, userId)).orderBy(desc(audioRecordings.createdAt)).limit(limit);
  return decryptRows(rows, ["fileUrl"]);
}

export async function updateRecordingStatus(id: number, status: "uploaded" | "processing" | "transcribed" | "failed") {
  const db = await getDb();
  if (!db) return;
  const update: Record<string, unknown> = { status };
  if (status === "transcribed" || status === "failed") update.processedAt = new Date();
  await db.update(audioRecordings).set(update).where(eq(audioRecordings.id, id));
}

// ─── Coaching Reports ─────────────────────────────────────────────────────────
export async function upsertCoachingReport(data: {
  sessionId: number;
  userId: number;
  executiveSummary?: string;
  sentimentOverall?: "positive" | "neutral" | "negative" | "mixed";
  sentimentManagerScore?: number;
  sentimentCustomerScore?: number;
  purchaseLikelihoodScore?: number;
  keyMoments?: unknown;
  productOpportunities?: unknown;
  objectionPatterns?: unknown;
  recommendations?: string;
  behaviorInsights?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(coachingReports).values(data).onDuplicateKeyUpdate({ set: { ...data, generatedAt: new Date() } });
}

export async function getReportBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(coachingReports).where(eq(coachingReports.sessionId, sessionId)).limit(1);
  return result[0] ?? null;
}

export async function getReportsByUser(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coachingReports).where(eq(coachingReports.userId, userId)).orderBy(desc(coachingReports.generatedAt)).limit(limit);
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export async function insertAuditLog(data: {
  userId?: number;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: unknown;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(data);
}

export async function getAuditLogs(limit = 100, offset = 0, userIds?: number[] | null) {
  const db = await getDb();
  if (!db) return [];
  if (userIds && userIds.length > 0) {
    return db.select().from(auditLogs)
      .where(inArray(auditLogs.userId, userIds))
      .orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset);
  }
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset);
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export async function getAnalyticsSummary(userId?: number, dealershipId?: number | null) {
  const db = await getDb();
  if (!db) return null;

  const dealershipFilter = dealershipId != null ? eq(sessions.dealershipId, dealershipId) : undefined;
  const userFilter = userId ? eq(sessions.userId, userId) : undefined;
  const whereClause = userFilter && dealershipFilter ? and(userFilter, dealershipFilter) : (userFilter ?? dealershipFilter);
  const sessionList = whereClause
    ? await db.select().from(sessions).where(whereClause)
    : await db.select().from(sessions);

  const totalSessions = sessionList.length;
  const completedSessions = sessionList.filter((s) => s.status === "completed").length;

  const gradeList = userId
    ? await db.select().from(performanceGrades).where(eq(performanceGrades.userId, userId))
    : await db.select().from(performanceGrades);

  const avgScore = gradeList.length > 0
    ? gradeList.reduce((sum, g) => sum + (g.overallScore ?? 0), 0) / gradeList.length
    : 0;

  const avgPvr = gradeList.length > 0
    ? gradeList.reduce((sum, g) => sum + (g.pvr ?? 0), 0) / gradeList.length
    : 0;

  const avgPpd = gradeList.length > 0
    ? gradeList.reduce((sum, g) => sum + (g.productsPerDeal ?? 0), 0) / gradeList.length
    : 0;

  const scriptFidelityAvg = gradeList.length > 0
    ? gradeList.reduce((sum, g) => sum + (g.scriptFidelityScore ?? 0), 0) / gradeList.length
    : 0;

  // Word track utilization rate
  const allSuggestions = userId
    ? await db.select({ wasActedOn: copilotSuggestions.wasActedOn }).from(copilotSuggestions)
        .innerJoin(sessions, eq(copilotSuggestions.sessionId, sessions.id))
        .where(eq(sessions.userId, userId))
    : await db.select({ wasActedOn: copilotSuggestions.wasActedOn }).from(copilotSuggestions);
  const totalSuggestions = allSuggestions.length;
  const usedSuggestions = allSuggestions.filter((s) => s.wasActedOn).length;
  const wordTrackUtilizationRate = totalSuggestions > 0
    ? Math.round((usedSuggestions / totalSuggestions) * 100)
    : 0;

  // Compliance flags — filter by dealership via session join when possible
  const flagList = dealershipId != null
    ? await db.select({ severity: complianceFlags.severity, resolved: complianceFlags.resolved })
        .from(complianceFlags)
        .innerJoin(sessions, eq(complianceFlags.sessionId, sessions.id))
        .where(eq(sessions.dealershipId, dealershipId))
    : await db.select({ severity: complianceFlags.severity, resolved: complianceFlags.resolved }).from(complianceFlags);
  const criticalFlags = flagList.filter((f) => f.severity === "critical" && !f.resolved).length;

  return {
    totalSessions, completedSessions, avgScore, avgPvr, avgPpd,
    scriptFidelityAvg, wordTrackUtilizationRate,
    criticalFlags, totalGrades: gradeList.length,
  };
}

// ─── Session Checklists ───────────────────────────────────────────────────────
export async function upsertSessionChecklist(data: InsertSessionChecklist) {
  const db = await getDb();
  if (!db) return null;
  const scores = computeChecklistScores(data);
  const values = { ...data, ...scores };
  await db.insert(sessionChecklists).values(values).onDuplicateKeyUpdate({ set: values });
  const result = await db.select().from(sessionChecklists).where(eq(sessionChecklists.sessionId, data.sessionId!)).limit(1);
  return result[0] ?? null;
}

export async function getChecklistBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(sessionChecklists).where(eq(sessionChecklists.sessionId, sessionId)).limit(1);
  return result[0] ?? null;
}

function computeChecklistScores(data: Partial<InsertSessionChecklist>) {
  // Introduction: 6 items, weight 20%
  const introItems = [
    data.fiManagerGreeting, data.statedTitleWork, data.statedFactoryWarranty,
    data.statedFinancialOptions, data.statedTimeFrame, data.introductionToFirstForms,
  ];
  const introScore = (introItems.filter(Boolean).length / 6) * 100;

  // General Compliance: 3 items, weight 30% (legally critical)
  const complianceItems = [data.privacyPolicyMentioned, data.riskBasedPricingMentioned, data.disclosedBasePayment];
  const complianceScore = (complianceItems.filter(Boolean).length / 3) * 100;

  // Menu Presentation: 8 items, weight 50%
  const menuItems = [
    data.presentedPrepaidMaintenance, data.presentedVehicleServiceContract, data.presentedGap,
    data.presentedInteriorExteriorProtection, data.presentedRoadHazard, data.presentedPaintlessDentRepair,
    data.customerQuestionsAddressed, data.whichClosingQuestionAsked,
  ];
  const menuPresentationScore = (menuItems.filter(Boolean).length / 8) * 100;

  const overallChecklistScore = introScore * 0.20 + complianceScore * 0.30 + menuPresentationScore * 0.50;

  return {
    introductionScore: Math.round(introScore * 10) / 10,
    complianceScore: Math.round(complianceScore * 10) / 10,
    menuPresentationScore: Math.round(menuPresentationScore * 10) / 10,
    overallChecklistScore: Math.round(overallChecklistScore * 10) / 10,
  };
}

// ─── Objection Logs ───────────────────────────────────────────────────────────
export async function insertObjectionLog(data: InsertObjectionLog) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(objectionLogs).values(data);
  const result = await db.select().from(objectionLogs)
    .where(eq(objectionLogs.sessionId, data.sessionId!))
    .orderBy(desc(objectionLogs.createdAt)).limit(1);
  return result[0] ?? null;
}

export async function getObjectionsBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(objectionLogs).where(eq(objectionLogs.sessionId, sessionId)).orderBy(desc(objectionLogs.createdAt));
}

// ─── Eagle Eye View Analytics ─────────────────────────────────────────────────
export async function getEagleEyeLeaderboard(fromDate?: Date, toDate?: Date, dealershipId?: number | null) {
  const db = await getDb();
  if (!db) return [];

  // Get all users with their sessions and grades
  const userConditions: ReturnType<typeof eq>[] = [eq(users.role, "user")];
  if (dealershipId != null) userConditions.push(eq(users.dealershipId, dealershipId));
  const allUsers = await db.select().from(users).where(and(...userConditions));
  const results = [];

  for (const user of allUsers) {
    const conditions = [eq(sessions.userId, user.id), eq(sessions.status, "completed")];
    if (fromDate) conditions.push(gte(sessions.startedAt, fromDate));
    if (toDate) conditions.push(lte(sessions.startedAt, toDate));

    const userSessions = await db.select().from(sessions).where(and(...conditions));
    if (userSessions.length === 0) continue;

    const sessionIds = userSessions.map((s) => s.id);
    const grades = await db.select().from(performanceGrades).where(eq(performanceGrades.userId, user.id));
    const relevantGrades = grades.filter((g) => sessionIds.includes(g.sessionId));

    const avgScore = relevantGrades.length > 0
      ? relevantGrades.reduce((s, g) => s + (g.overallScore ?? 0), 0) / relevantGrades.length : 0;
    const avgPvr = relevantGrades.length > 0
      ? relevantGrades.reduce((s, g) => s + (g.pvr ?? 0), 0) / relevantGrades.length : 0;
    const avgPpd = relevantGrades.length > 0
      ? relevantGrades.reduce((s, g) => s + (g.productsPerDeal ?? 0), 0) / relevantGrades.length : 0;
    const avgUtilization = relevantGrades.length > 0
      ? relevantGrades.reduce((s, g) => s + (g.utilizationRate ?? 0), 0) / relevantGrades.length : 0;

    // Average recording length from sessions
    const avgRecordingMinutes = userSessions.length > 0
      ? userSessions.reduce((s, sess) => s + (sess.durationSeconds ?? 0), 0) / userSessions.length / 60 : 0;

    const avgScriptFidelity = relevantGrades.length > 0
      ? relevantGrades.reduce((s, g) => s + (g.scriptFidelityScore ?? 0), 0) / relevantGrades.length : 0;
    const avgProcessAdherence = relevantGrades.length > 0
      ? relevantGrades.reduce((s, g) => s + (g.processAdherenceScore ?? 0), 0) / relevantGrades.length : 0;
    const avgMenuSequence = relevantGrades.length > 0
      ? relevantGrades.reduce((s, g) => s + (g.menuSequenceScore ?? 0), 0) / relevantGrades.length : 0;
    const avgObjectionResponse = relevantGrades.length > 0
      ? relevantGrades.reduce((s, g) => s + (g.objectionResponseScore ?? 0), 0) / relevantGrades.length : 0;
    const avgTransitionAccuracy = relevantGrades.length > 0
      ? relevantGrades.reduce((s, g) => s + (g.transitionAccuracyScore ?? 0), 0) / relevantGrades.length : 0;

    // ASURA OPS Tier-1 Score: pull from scorecard table
    const scorecardRows = await db.select({
      tier1Score: asuraScorecards.tier1Score,
      tier: asuraScorecards.tier,
    }).from(asuraScorecards)
      .where(inArray(asuraScorecards.sessionId, sessionIds));
    const avgTier1Score = scorecardRows.length > 0
      ? Math.round(scorecardRows.reduce((s, sc) => s + Number(sc.tier1Score ?? 0), 0) / scorecardRows.length * 10) / 10
      : null;
    const tier1Tier = scorecardRows.length > 0
      ? (avgTier1Score !== null && avgTier1Score >= 85 ? "Tier-1" : avgTier1Score !== null && avgTier1Score >= 70 ? "Tier-2" : avgTier1Score !== null && avgTier1Score >= 55 ? "Tier-3" : "Below-Tier")
      : null;

    results.push({
      userId: user.id,
      name: user.name ?? "Unknown",
      dealership: user.dealership ?? "—",
      score: Math.round(avgScore * 10) / 10,
      recordingLengthMinutes: Math.round(avgRecordingMinutes * 10) / 10,
      dealCount: userSessions.length,
      utilizationRate: Math.round(avgUtilization * 10) / 10,
      pvr: Math.round(avgPvr),
      ppd: Math.round(avgPpd * 10) / 10,
      scriptFidelityScore: Math.round(avgScriptFidelity * 10) / 10,
      processAdherenceScore: Math.round(avgProcessAdherence * 10) / 10,
      menuSequenceScore: Math.round(avgMenuSequence * 10) / 10,
      objectionResponseScore: Math.round(avgObjectionResponse * 10) / 10,
      transitionAccuracyScore: Math.round(avgTransitionAccuracy * 10) / 10,
      tier1Score: avgTier1Score,
      tier1Tier,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

export async function getEagleEyeTrends(fromDate?: Date, toDate?: Date, dealershipId?: number | null) {
  const db = await getDb();
  if (!db) return { groupTrend: [], managerTrends: {}, scriptFidelityTrend: [] };
  const trendUserConditions: ReturnType<typeof eq>[] = [eq(users.role, "user")];
  if (dealershipId != null) trendUserConditions.push(eq(users.dealershipId, dealershipId));
  const allUsers = await db.select().from(users).where(and(...trendUserConditions));
  const managerTrends: Record<string, Array<{ week: string; score: number }>> = {};
  const groupScoresByWeek: Record<string, number[]> = {};
  const groupFidelityByWeek: Record<string, number[]> = {};
  for (const user of allUsers) {
    const conditions = [eq(sessions.userId, user.id), eq(sessions.status, "completed")];
    if (fromDate) conditions.push(gte(sessions.startedAt, fromDate));
    if (toDate) conditions.push(lte(sessions.startedAt, toDate));
    const userSessions = await db.select().from(sessions).where(and(...conditions));
    const grades = await db.select().from(performanceGrades).where(eq(performanceGrades.userId, user.id));
    const weeklyData: Record<string, number[]> = {};
    for (const session of userSessions) {
      const grade = grades.find((g) => g.sessionId === session.id);
      if (!grade?.overallScore) continue;
      const weekKey = getWeekKey(session.startedAt);
      if (!weeklyData[weekKey]) weeklyData[weekKey] = [];
      weeklyData[weekKey].push(grade.overallScore);
      if (!groupScoresByWeek[weekKey]) groupScoresByWeek[weekKey] = [];
      groupScoresByWeek[weekKey].push(grade.overallScore);
      // Track script fidelity per week
      if (grade.scriptFidelityScore != null) {
        if (!groupFidelityByWeek[weekKey]) groupFidelityByWeek[weekKey] = [];
        groupFidelityByWeek[weekKey].push(grade.scriptFidelityScore);
      }
    }
    if (Object.keys(weeklyData).length > 0) {
      managerTrends[user.name ?? `User ${user.id}`] = Object.entries(weeklyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, scores]) => ({ week, score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 }));
    }
  }
  const groupTrend = Object.entries(groupScoresByWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, scores]) => ({ week, score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 }));
  const scriptFidelityTrend = Object.entries(groupFidelityByWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, scores]) => ({ week, fidelity: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 }));
  return { groupTrend, managerTrends, scriptFidelityTrend };
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return `${d.getFullYear()}-W${String(Math.ceil(d.getDate() / 7)).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function getObjectionAnalysisByProduct(fromDate?: Date, toDate?: Date) {
  const db = await getDb();
  if (!db) return { chartData: [], tableData: [] };

  const conditions: ReturnType<typeof eq>[] = [];
  if (fromDate) conditions.push(gte(objectionLogs.createdAt, fromDate) as ReturnType<typeof eq>);
  if (toDate) conditions.push(lte(objectionLogs.createdAt, toDate) as ReturnType<typeof eq>);

  const logs = conditions.length > 0
    ? await db.select().from(objectionLogs).where(and(...conditions))
    : await db.select().from(objectionLogs);

  const allUsers = await db.select().from(users);

  // Aggregate by product
  const productCounts: Record<string, number> = {};
  const userProductCounts: Record<number, Record<string, number>> = {};

  for (const log of logs) {
    productCounts[log.product] = (productCounts[log.product] ?? 0) + 1;
    if (!userProductCounts[log.userId]) userProductCounts[log.userId] = {};
    userProductCounts[log.userId][log.product] = (userProductCounts[log.userId][log.product] ?? 0) + 1;
  }

  const chartData = Object.entries(productCounts).map(([product, count]) => ({
    product: formatProductLabel(product), count,
  })).sort((a, b) => b.count - a.count);

  const tableData = allUsers
    .filter((u) => userProductCounts[u.id])
    .map((u) => ({
      userId: u.id,
      name: u.name ?? "Unknown",
      dealCount: Object.values(userProductCounts[u.id] ?? {}).reduce((a, b) => a + b, 0),
      ...userProductCounts[u.id],
    }));

  return { chartData, tableData };
}

export async function getObjectionAnalysisByConcern(fromDate?: Date, toDate?: Date) {
  const db = await getDb();
  if (!db) return { chartData: [], tableData: [] };

  const conditions: ReturnType<typeof eq>[] = [];
  if (fromDate) conditions.push(gte(objectionLogs.createdAt, fromDate) as ReturnType<typeof eq>);
  if (toDate) conditions.push(lte(objectionLogs.createdAt, toDate) as ReturnType<typeof eq>);

  const logs = conditions.length > 0
    ? await db.select().from(objectionLogs).where(and(...conditions))
    : await db.select().from(objectionLogs);

  const allUsers = await db.select().from(users);

  const concernCounts: Record<string, number> = {};
  const userConcernCounts: Record<number, Record<string, number>> = {};

  for (const log of logs) {
    concernCounts[log.concernType] = (concernCounts[log.concernType] ?? 0) + 1;
    if (!userConcernCounts[log.userId]) userConcernCounts[log.userId] = {};
    userConcernCounts[log.userId][log.concernType] = (userConcernCounts[log.userId][log.concernType] ?? 0) + 1;
  }

  const chartData = Object.entries(concernCounts).map(([concern, count]) => ({
    concern: formatConcernLabel(concern), count,
  })).sort((a, b) => b.count - a.count);

  const tableData = allUsers
    .filter((u) => userConcernCounts[u.id])
    .map((u) => ({
      userId: u.id,
      name: u.name ?? "Unknown",
      dealCount: Object.values(userConcernCounts[u.id] ?? {}).reduce((a, b) => a + b, 0),
      ...userConcernCounts[u.id],
    }));

  return { chartData, tableData };
}

function formatProductLabel(product: string): string {
  const map: Record<string, string> = {
    vehicle_service_contract: "Vehicle Service Contract",
    gap_insurance: "GAP Insurance",
    prepaid_maintenance: "Prepaid Maintenance",
    interior_exterior_protection: "Interior/Exterior Protection",
    road_hazard: "Road Hazard",
    paintless_dent_repair: "Paintless Dent Repair",
    key_replacement: "Key Replacement",
    windshield_protection: "Windshield Protection",
    lease_wear_tear: "Lease Wear & Tear",
    other: "Other",
  };
  return map[product] ?? product;
}

function formatConcernLabel(concern: string): string {
  const map: Record<string, string> = {
    cost: "Cost",
    confidence_in_coverage: "Confidence in Current Coverage",
    low_usage_expectation: "Low Usage Expectation",
    skepticism_dealer_motives: "Skepticism About Dealer Motives",
    misunderstanding: "Misunderstanding / Lack of Info",
    self_insurance_preference: "DIY / Self-Insurance Preference",
    perception_low_risk: "Perception of Low Risk",
    exclusions_concern: "Concerns About Exclusions",
    financial_constraints: "Financial Constraints",
    other: "Other",
  };
  return map[concern] ?? concern;
}

// ─── Compliance Rules ─────────────────────────────────────────────────────────
export async function getAllComplianceRules() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(complianceRules).orderBy(desc(complianceRules.createdAt));
}

export async function getActiveComplianceRules() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(complianceRules).where(eq(complianceRules.isActive, true)).orderBy(desc(complianceRules.createdAt));
}

export async function insertComplianceRule(data: {
  createdBy: number;
  title: string;
  description?: string;
  category: "federal_tila" | "federal_ecoa" | "federal_udap" | "federal_cla" | "contract_element" | "fi_product_disclosure" | "process_step" | "custom";
  triggerKeywords: string[];
  requiredPhrase?: string;
  severity: "critical" | "warning" | "info";
  weight?: number;
  isActive?: boolean;
  dealStage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(complianceRules).values({
    ...data,
    weight: data.weight ?? 1.0,
    isActive: data.isActive ?? true,
  });
}

export async function updateComplianceRule(id: number, data: Partial<{
  title: string;
  description: string;
  category: "federal_tila" | "federal_ecoa" | "federal_udap" | "federal_cla" | "contract_element" | "fi_product_disclosure" | "process_step" | "custom";
  triggerKeywords: string[];
  requiredPhrase: string;
  severity: "critical" | "warning" | "info";
  weight: number;
  isActive: boolean;
  dealStage: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(complianceRules).set(data).where(eq(complianceRules.id, id));
}

export async function deleteComplianceRule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(complianceRules).where(eq(complianceRules.id, id));
}

// ─── Suggestion Utilization ───────────────────────────────────────────────────
export async function markSuggestionUsed(suggestionId: number, wasActedOn: boolean, userName?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(copilotSuggestions)
    .set({
      wasActedOn,
      usedAt: wasActedOn ? new Date() : null,
      usedBy: wasActedOn ? (userName ?? "unknown") : null,
    })
    .where(eq(copilotSuggestions.id, suggestionId));
}

export async function getSuggestionUtilizationRate(sessionId: number): Promise<{
  total: number;
  used: number;
  utilizationRate: number;
}> {
  const db = await getDb();
  if (!db) return { total: 0, used: 0, utilizationRate: 0 };
  const rows = await db
    .select({ wasActedOn: copilotSuggestions.wasActedOn })
    .from(copilotSuggestions)
    .where(eq(copilotSuggestions.sessionId, sessionId));
  const total = rows.length;
  const used = rows.filter((r) => r.wasActedOn).length;
  const utilizationRate = total > 0 ? Math.round((used / total) * 100) : 0;
  return { total, used, utilizationRate };
}

// ─── Analytics: PVR Trend ────────────────────────────────────────────────────
export async function getPvrTrend(userId?: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  const rows = userId
    ? await db.select({
        sessionId: performanceGrades.sessionId,
        pvr: performanceGrades.pvr,
        ppd: performanceGrades.productsPerDeal,
        gradedAt: performanceGrades.gradedAt,
      }).from(performanceGrades)
        .innerJoin(sessions, eq(performanceGrades.sessionId, sessions.id))
        .where(eq(sessions.userId, userId))
        .orderBy(performanceGrades.gradedAt)
        .limit(limit)
    : await db.select({
        sessionId: performanceGrades.sessionId,
        pvr: performanceGrades.pvr,
        ppd: performanceGrades.productsPerDeal,
        gradedAt: performanceGrades.gradedAt,
      }).from(performanceGrades)
        .orderBy(performanceGrades.gradedAt)
        .limit(limit);
  return rows.map((r: { sessionId: number; pvr: number | null; ppd: number | null; gradedAt: Date | null }, i: number) => ({
    index: i + 1,
    pvr: r.pvr ?? 0,
    ppd: r.ppd ?? 0,
    date: r.gradedAt ? new Date(r.gradedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : `#${i + 1}`,
  }));
}

// ─── Analytics: Product Mix ──────────────────────────────────────────────────
export async function getProductMix(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = userId
    ? await db.select({ product: objectionLogs.product, wasResolved: objectionLogs.wasResolved })
        .from(objectionLogs)
        .innerJoin(sessions, eq(objectionLogs.sessionId, sessions.id))
        .where(eq(sessions.userId, userId))
    : await db.select({ product: objectionLogs.product, wasResolved: objectionLogs.wasResolved })
        .from(objectionLogs);

  const totals: Record<string, { total: number; resolved: number }> = {};
  for (const r of rows) {
    const key = r.product;
    if (!totals[key]) totals[key] = { total: 0, resolved: 0 };
    totals[key].total++;
    if (r.wasResolved) totals[key].resolved++;
  }

  const PRODUCT_LABELS: Record<string, string> = {
    vehicle_service_contract: "VSC",
    gap_insurance: "GAP",
    prepaid_maintenance: "PPM",
    interior_exterior_protection: "IEP",
    road_hazard: "Road Hazard",
    paintless_dent_repair: "PDR",
    key_replacement: "Key Replace",
    windshield_protection: "Windshield",
    lease_wear_tear: "Lease W&T",
    other: "Other",
  };

  return Object.entries(totals).map(([product, { total, resolved }]) => ({
    name: PRODUCT_LABELS[product] ?? product,
    total,
    resolved,
    winRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
  })).sort((a, b) => b.total - a.total);
}

// ─── Analytics: Session Volume by Week ──────────────────────────────────────
export async function getSessionVolume(userId?: number, weeks = 8) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const rows = userId
    ? await db.select({ startedAt: sessions.startedAt, status: sessions.status })
        .from(sessions)
        .where(and(eq(sessions.userId, userId), gte(sessions.startedAt, since)))
    : await db.select({ startedAt: sessions.startedAt, status: sessions.status })
        .from(sessions)
        .where(gte(sessions.startedAt, since));

  const buckets: Record<string, { label: string; total: number; completed: number }> = {};
  for (const r of rows) {
    const d = new Date(r.startedAt);
    // Week start (Monday)
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(d.setDate(diff));
    const key = weekStart.toISOString().slice(0, 10);
    const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!buckets[key]) buckets[key] = { label, total: 0, completed: 0 };
    buckets[key].total++;
    if (r.status === "completed") buckets[key].completed++;
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

// ─── Dealership Management ────────────────────────────────────────────────────
export async function getAllDealerships() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dealerships).orderBy(dealerships.name);
}

export async function createDealership(data: { name: string; slug: string; plan?: "trial" | "beta" | "pro" | "enterprise"; groupId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(dealerships).values({ ...data, isActive: true });
  const result = await db.select().from(dealerships).where(eq(dealerships.slug, data.slug)).limit(1);
  return result[0] ?? null;
}

export async function getDealershipById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(dealerships).where(eq(dealerships.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateDealershipOnboarding(
  id: number,
  data: Partial<{
    location: string | null;
    brandMix: string[] | null;
    unitVolumeMonthly: number | null;
    pruBaseline: number | null;
    pruTarget: number | null;
    onboardingStep: number;
    onboardingComplete: boolean;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(dealerships).set(data).where(eq(dealerships.id, id));
}

export async function updateDealership(id: number, data: Partial<{ name: string; plan: "trial" | "beta" | "pro" | "enterprise"; isActive: boolean; groupId: number | null }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(dealerships).set(data).where(eq(dealerships.id, id));
}

export async function assignUserToDealership(userId: number, dealershipId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ dealershipId }).where(eq(users.id, userId));
  // Also create/reactivate a rooftop assignment
  const existing = await db.select().from(userRooftopAssignments)
    .where(and(eq(userRooftopAssignments.userId, userId), eq(userRooftopAssignments.dealershipId, dealershipId)))
    .limit(1);
  if (existing.length > 0) {
    if (!existing[0].isActive) {
      await db.update(userRooftopAssignments).set({ isActive: true }).where(eq(userRooftopAssignments.id, existing[0].id));
    }
  } else {
    await db.insert(userRooftopAssignments).values({ userId, dealershipId, isActive: true });
  }
}

// ─── Invitations ──────────────────────────────────────────────────────────────
import crypto from "crypto";

export async function createInvitation(data: {
  email?: string | null;
  dealershipId: number;
  role: "user" | "admin";
  invitedBy: number;
  expiresInDays?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + (data.expiresInDays ?? 7) * 24 * 60 * 60 * 1000);
  await db.insert(invitations).values({ token, email: data.email ?? null, dealershipId: data.dealershipId, role: data.role, invitedBy: data.invitedBy, expiresAt });
  return { token, expiresAt };
}

export async function getInvitationByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(invitations).where(eq(invitations.token, token)).limit(1);
  return result[0] ?? null;
}

export async function redeemInvitation(token: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const inv = await getInvitationByToken(token);
  if (!inv) throw new Error("Invitation not found");
  if (inv.usedBy) throw new Error("Invitation already used");
  if (inv.expiresAt < new Date()) throw new Error("Invitation expired");
  await db.update(invitations).set({ usedBy: userId, usedAt: new Date() }).where(eq(invitations.token, token));
  // Assign user to dealership and set role
  await db.update(users).set({ dealershipId: inv.dealershipId, role: inv.role }).where(eq(users.id, userId));
  return inv;
}

export async function getInvitationsByDealership(dealershipId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invitations).where(eq(invitations.dealershipId, dealershipId)).orderBy(desc(invitations.createdAt));
}

export async function revokeInvitation(id: number) {
  const db = await getDb();
  if (!db) return;
  // Mark as used with a sentinel value to prevent redemption
  await db.update(invitations).set({ usedAt: new Date(), usedBy: -1 }).where(eq(invitations.id, id));
}

// ─── Manager Scorecard ──────────────────────────────────────────────────────
export async function getManagerScorecard(userId: number, weeks = 12) {
  const db = await getDb();
  if (!db) return null;

  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  // Get all sessions for this user in the time range
  const userSessions = await db.select().from(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.status, "completed"), gte(sessions.startedAt, since)))
    .orderBy(sessions.startedAt);

  // Get all grades for this user
  const grades = await db.select().from(performanceGrades)
    .where(eq(performanceGrades.userId, userId))
    .orderBy(performanceGrades.gradedAt);

  // Get all compliance flags for this user's sessions
  const sessionIds = userSessions.map((s) => s.id);
  const allFlags = sessionIds.length > 0
    ? await db.select().from(complianceFlags)
    : [];
  const userFlags = allFlags.filter((f) => sessionIds.includes(f.sessionId));

  // Get all suggestions for utilization
  const allSuggestions = sessionIds.length > 0
    ? await db.select({ sessionId: copilotSuggestions.sessionId, wasActedOn: copilotSuggestions.wasActedOn })
        .from(copilotSuggestions)
    : [];
  const userSuggestions = allSuggestions.filter((s) => sessionIds.includes(s.sessionId));

  // Build weekly buckets
  const weeklyData: Record<string, {
    label: string;
    sessions: number;
    avgScore: number;
    avgPvr: number;
    avgPpd: number;
    avgCompliance: number;
    avgScriptFidelity: number;
    criticalFlags: number;
    utilizationRate: number;
    scores: number[];
    pvrs: number[];
    ppds: number[];
    complianceScores: number[];
    scriptFidelityScores: number[];
    suggestions: { total: number; used: number };
  }> = {};

  for (const session of userSessions) {
    const d = new Date(session.startedAt);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(d);
    weekStart.setDate(diff);
    const key = weekStart.toISOString().slice(0, 10);
    const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    if (!weeklyData[key]) {
      weeklyData[key] = {
        label, sessions: 0, avgScore: 0, avgPvr: 0, avgPpd: 0,
        avgCompliance: 0, avgScriptFidelity: 0, criticalFlags: 0,
        utilizationRate: 0, scores: [], pvrs: [], ppds: [],
        complianceScores: [], scriptFidelityScores: [],
        suggestions: { total: 0, used: 0 },
      };
    }

    const week = weeklyData[key];
    week.sessions++;

    const grade = grades.find((g) => g.sessionId === session.id);
    if (grade) {
      if (grade.overallScore != null) week.scores.push(grade.overallScore);
      if (grade.pvr != null) week.pvrs.push(grade.pvr);
      if (grade.productsPerDeal != null) week.ppds.push(grade.productsPerDeal);
      if (grade.complianceScore != null) week.complianceScores.push(grade.complianceScore);
      if (grade.scriptFidelityScore != null) week.scriptFidelityScores.push(grade.scriptFidelityScore);
    }

    const sessionFlags = userFlags.filter((f) => f.sessionId === session.id);
    week.criticalFlags += sessionFlags.filter((f) => f.severity === "critical" && !f.resolved).length;

    const sessionSuggestions = userSuggestions.filter((s) => s.sessionId === session.id);
    week.suggestions.total += sessionSuggestions.length;
    week.suggestions.used += sessionSuggestions.filter((s) => s.wasActedOn).length;
  }

  // Calculate averages
  const weeklyTrend = Object.entries(weeklyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, w]) => ({
      label: w.label,
      sessions: w.sessions,
      avgScore: w.scores.length > 0 ? Math.round(w.scores.reduce((a, b) => a + b, 0) / w.scores.length * 10) / 10 : 0,
      avgPvr: w.pvrs.length > 0 ? Math.round(w.pvrs.reduce((a, b) => a + b, 0) / w.pvrs.length) : 0,
      avgPpd: w.ppds.length > 0 ? Math.round(w.ppds.reduce((a, b) => a + b, 0) / w.ppds.length * 10) / 10 : 0,
      avgCompliance: w.complianceScores.length > 0 ? Math.round(w.complianceScores.reduce((a, b) => a + b, 0) / w.complianceScores.length * 10) / 10 : 0,
      avgScriptFidelity: w.scriptFidelityScores.length > 0 ? Math.round(w.scriptFidelityScores.reduce((a, b) => a + b, 0) / w.scriptFidelityScores.length * 10) / 10 : 0,
      criticalFlags: w.criticalFlags,
      utilizationRate: w.suggestions.total > 0 ? Math.round((w.suggestions.used / w.suggestions.total) * 100) : 0,
    }));

  // Overall summary
  const allScores = grades.filter((g) => sessionIds.includes(g.sessionId) && g.overallScore != null);
  const totalSessions = userSessions.length;
  const overallAvgScore = allScores.length > 0 ? Math.round(allScores.reduce((s, g) => s + (g.overallScore ?? 0), 0) / allScores.length * 10) / 10 : 0;
  const overallAvgPvr = allScores.length > 0 ? Math.round(allScores.reduce((s, g) => s + (g.pvr ?? 0), 0) / allScores.length) : 0;
  const overallAvgPpd = allScores.length > 0 ? Math.round(allScores.reduce((s, g) => s + (g.productsPerDeal ?? 0), 0) / allScores.length * 10) / 10 : 0;
  const overallAvgCompliance = allScores.length > 0 ? Math.round(allScores.reduce((s, g) => s + (g.complianceScore ?? 0), 0) / allScores.length * 10) / 10 : 0;
  const overallAvgScriptFidelity = allScores.length > 0 ? Math.round(allScores.reduce((s, g) => s + (g.scriptFidelityScore ?? 0), 0) / allScores.length * 10) / 10 : 0;
  const totalCriticalFlags = userFlags.filter((f) => f.severity === "critical" && !f.resolved).length;
  const overallUtilization = userSuggestions.length > 0 ? Math.round((userSuggestions.filter((s) => s.wasActedOn).length / userSuggestions.length) * 100) : 0;

  // Trend direction (compare last 2 weeks)
  const lastTwo = weeklyTrend.slice(-2);
  const scoreTrend = lastTwo.length === 2 ? (lastTwo[1].avgScore - lastTwo[0].avgScore > 0 ? "up" : lastTwo[1].avgScore - lastTwo[0].avgScore < 0 ? "down" : "flat") : "flat";
  const pvrTrend = lastTwo.length === 2 ? (lastTwo[1].avgPvr - lastTwo[0].avgPvr > 0 ? "up" : lastTwo[1].avgPvr - lastTwo[0].avgPvr < 0 ? "down" : "flat") : "flat";

  return {
    summary: {
      totalSessions,
      overallAvgScore,
      overallAvgPvr,
      overallAvgPpd,
      overallAvgCompliance,
      overallAvgScriptFidelity,
      totalCriticalFlags,
      overallUtilization,
      scoreTrend,
      pvrTrend,
    },
    weeklyTrend,
  };
}


// ─── Overnight Sprint Additions ─────────────────────────────────────────────

// ─── Overnight Sprint Additions ─────────────────────────────────────────────

export async function updateSessionNotes(sessionId: number, notes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(sessions)
    .set({ notes })
    .where(eq(sessions.id, sessionId));
}

export async function searchSessions(query: string, userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  // customerName is encrypted — can't use SQL LIKE on it.
  // Fetch by user + dealNumber LIKE, then decrypt and filter client-side.
  const byDealNumber = await db.select()
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        like(sessions.dealNumber, `%${query}%`)
      )
    )
    .orderBy(desc(sessions.startedAt))
    .limit(limit);
  // Also fetch recent sessions and filter by decrypted customerName
  const recentSessions = await db.select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.startedAt))
    .limit(500);
  const decrypted = decryptRows(recentSessions, ["customerName"]);
  const lowerQuery = query.toLowerCase();
  const byName = decrypted.filter(
    (s) => s.customerName && String(s.customerName).toLowerCase().includes(lowerQuery)
  );
  // Merge results, deduplicate by id, limit
  const seen = new Set<number>();
  const merged = [];
  for (const row of [...byDealNumber, ...byName]) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      merged.push(row);
    }
  }
  return decryptRows(merged.slice(0, limit), ["customerName"]);
}

export async function getComplianceTrend(userId: number, days: number) {
  const db = await getDb();
  if (!db) return [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const results = await db.select({
    date: sql<string>`DATE(${complianceFlags.createdAt})`,
    severity: complianceFlags.severity,
    count: count()
  })
    .from(complianceFlags)
    .innerJoin(sessions, eq(complianceFlags.sessionId, sessions.id))
    .where(
      and(
        eq(sessions.userId, userId),
        gte(complianceFlags.createdAt, startDate)
      )
    )
    .groupBy(sql`DATE(${complianceFlags.createdAt})`, complianceFlags.severity);

  const trend: { date: string; critical: number; warning: number; info: number }[] = [];
  const grouped = results.reduce((acc, row) => {
    if (!acc[row.date]) {
      acc[row.date] = { date: row.date, critical: 0, warning: 0, info: 0 };
    }
    acc[row.date][row.severity as 'critical' | 'warning' | 'info'] = row.count;
    return acc;
  }, {} as Record<string, { date: string; critical: number; warning: number; info: number }>);

  return Object.values(grouped);
}

export async function getSystemUsageStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers] = await db.select({ count: count() }).from(users);
  
  const [activeUsersToday] = await db.select({ count: sql<number>`COUNT(DISTINCT ${sessions.userId})` })
    .from(sessions)
    .where(gte(sessions.startedAt, today));

  const [activeUsersWeek] = await db.select({ count: sql<number>`COUNT(DISTINCT ${sessions.userId})` })
    .from(sessions)
    .where(gte(sessions.startedAt, weekAgo));

  const [activeUsersMonth] = await db.select({ count: sql<number>`COUNT(DISTINCT ${sessions.userId})` })
    .from(sessions)
    .where(gte(sessions.startedAt, monthAgo));

  const [sessionsToday] = await db.select({ count: count() })
    .from(sessions)
    .where(gte(sessions.startedAt, today));

  const [sessionsWeek] = await db.select({ count: count() })
    .from(sessions)
    .where(gte(sessions.startedAt, weekAgo));

  const [sessionsMonth] = await db.select({ count: count() })
    .from(sessions)
    .where(gte(sessions.startedAt, monthAgo));

  const [avgDuration] = await db.select({ avg: avg(sessions.durationSeconds) })
    .from(sessions)
    .where(gte(sessions.startedAt, weekAgo));

  return {
    totalUsers: totalUsers.count,
    activeUsersToday: activeUsersToday.count,
    activeUsersWeek: activeUsersWeek.count,
    activeUsersMonth: activeUsersMonth.count,
    sessionsToday: sessionsToday.count,
    sessionsWeek: sessionsWeek.count,
    sessionsMonth: sessionsMonth.count,
    avgSessionDuration: avgDuration.avg || 0
  };
}

export async function getSessionComparison(sessionId1: number, sessionId2: number) {
  const db = await getDb();
  if (!db) return { session1: null, session2: null };
  
  const session1 = await db.select()
    .from(sessions)
    .leftJoin(performanceGrades, eq(performanceGrades.sessionId, sessions.id))
    .where(eq(sessions.id, sessionId1));

  const session2 = await db.select()
    .from(sessions)
    .leftJoin(performanceGrades, eq(performanceGrades.sessionId, sessions.id))
    .where(eq(sessions.id, sessionId2));

  const s1 = session1[0] || null;
  const s2 = session2[0] || null;
  if (s1?.sessions) s1.sessions = decryptFields(s1.sessions, ["customerName"]);
  if (s2?.sessions) s2.sessions = decryptFields(s2.sessions, ["customerName"]);
  return { session1: s1, session2: s2 };
}

export async function getSessionsByIds(ids: number[]) {
  if (ids.length === 0) return [];
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(sessions)
    .leftJoin(performanceGrades, eq(sessions.id, performanceGrades.sessionId))
    .where(inArray(sessions.id, ids));
  return rows.map((r) => ({ ...r, sessions: decryptFields(r.sessions, ["customerName"]) }));
}

export async function getComplianceFlags(fromDate?: string, toDate?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (fromDate) conditions.push(sql`${complianceFlags.createdAt} >= ${new Date(fromDate)}`);
  if (toDate) conditions.push(sql`${complianceFlags.createdAt} <= ${new Date(toDate)}`);
  const rows = await db
    .select()
    .from(complianceFlags)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(complianceFlags.createdAt));
  return decryptRows(rows, ["excerpt"]);
}

// ─── Dealership Groups (Multi-Tenant) ────────────────────────────────────────

export async function createDealershipGroup(data: { name: string; slug: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(dealershipGroups).values(data);
  const result = await db.select().from(dealershipGroups).where(eq(dealershipGroups.slug, data.slug)).limit(1);
  return result[0] ?? null;
}

export async function getAllDealershipGroups() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dealershipGroups).orderBy(dealershipGroups.name);
}

export async function getDealershipGroup(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(dealershipGroups).where(eq(dealershipGroups.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateDealershipGroup(id: number, data: Partial<{ name: string; isActive: boolean }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(dealershipGroups).set(data).where(eq(dealershipGroups.id, id));
}

export async function getDealershipsByGroup(groupId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dealerships).where(eq(dealerships.groupId, groupId)).orderBy(dealerships.name);
}

// ─── Rooftop Assignments (Multi-Tenant) ──────────────────────────────────────

export async function assignUserToRooftop(userId: number, dealershipId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(userRooftopAssignments)
    .where(and(eq(userRooftopAssignments.userId, userId), eq(userRooftopAssignments.dealershipId, dealershipId)))
    .limit(1);
  if (existing.length > 0) {
    if (!existing[0].isActive) {
      await db.update(userRooftopAssignments).set({ isActive: true }).where(eq(userRooftopAssignments.id, existing[0].id));
    }
    return existing[0];
  }
  await db.insert(userRooftopAssignments).values({ userId, dealershipId, isActive: true });
  const result = await db.select().from(userRooftopAssignments)
    .where(and(eq(userRooftopAssignments.userId, userId), eq(userRooftopAssignments.dealershipId, dealershipId)))
    .limit(1);
  return result[0] ?? null;
}

export async function removeUserFromRooftop(userId: number, dealershipId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(userRooftopAssignments)
    .set({ isActive: false })
    .where(and(eq(userRooftopAssignments.userId, userId), eq(userRooftopAssignments.dealershipId, dealershipId)));
}

export async function getUserRooftops(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select({
    dealershipId: userRooftopAssignments.dealershipId,
    dealershipName: dealerships.name,
    dealershipSlug: dealerships.slug,
    groupId: dealerships.groupId,
    isActive: userRooftopAssignments.isActive,
    assignmentId: userRooftopAssignments.id,
  })
    .from(userRooftopAssignments)
    .innerJoin(dealerships, eq(userRooftopAssignments.dealershipId, dealerships.id))
    .where(and(eq(userRooftopAssignments.userId, userId), eq(userRooftopAssignments.isActive, true)));
  return results;
}

export async function getRooftopUsers(dealershipId: number) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select({
    userId: userRooftopAssignments.userId,
    userName: users.name,
    userEmail: users.email,
    userRole: users.role,
    isActive: userRooftopAssignments.isActive,
    assignedAt: userRooftopAssignments.assignedAt,
  })
    .from(userRooftopAssignments)
    .innerJoin(users, eq(userRooftopAssignments.userId, users.id))
    .where(eq(userRooftopAssignments.dealershipId, dealershipId));
  return results;
}

export async function getUserAccessibleDealershipIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select({ dealershipId: userRooftopAssignments.dealershipId })
    .from(userRooftopAssignments)
    .where(and(eq(userRooftopAssignments.userId, userId), eq(userRooftopAssignments.isActive, true)));
  return results.map((r) => r.dealershipId);
}

export async function switchUserRooftop(userId: number, dealershipId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  // Verify the user has an active assignment to this dealership
  const assignment = await db.select().from(userRooftopAssignments)
    .where(and(
      eq(userRooftopAssignments.userId, userId),
      eq(userRooftopAssignments.dealershipId, dealershipId),
      eq(userRooftopAssignments.isActive, true),
    ))
    .limit(1);
  if (assignment.length === 0) return false;
  await db.update(users).set({ dealershipId }).where(eq(users.id, userId));
  return true;
}

// ─── Scoped Queries (Multi-Tenant) ───────────────────────────────────────────

export async function getAllUsersByDealershipIds(dealershipIds: number[]) {
  if (dealershipIds.length === 0) return [];
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(inArray(users.dealershipId, dealershipIds)).orderBy(users.name);
}

export async function getAllSessionsByDealershipIds(dealershipIds: number[], limit = 100, offset = 0) {
  if (dealershipIds.length === 0) return [];
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(sessions)
    .where(inArray(sessions.dealershipId, dealershipIds))
    .orderBy(desc(sessions.startedAt))
    .limit(limit)
    .offset(offset);
  return decryptRows(rows, ["customerName"]);
}

/**
 * CFPB-compliant cascade deletion: removes ALL data associated with a session.
 * Returns summary of deleted row counts and audio file keys for S3 cleanup.
 */
export async function deleteSessionData(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  // Fetch audio file keys before deleting rows (needed for S3 cleanup)
  const recordings = await db
    .select({ id: audioRecordings.id, fileKey: audioRecordings.fileKey })
    .from(audioRecordings)
    .where(eq(audioRecordings.sessionId, sessionId));
  const fileKeys = recordings.map((r) => r.fileKey);

  // Delete child records in dependency order
  const [txResult] = await db.delete(transcripts).where(eq(transcripts.sessionId, sessionId));
  const [sugResult] = await db.delete(copilotSuggestions).where(eq(copilotSuggestions.sessionId, sessionId));
  const [flagResult] = await db.delete(complianceFlags).where(eq(complianceFlags.sessionId, sessionId));
  const [gradeResult] = await db.delete(performanceGrades).where(eq(performanceGrades.sessionId, sessionId));
  const [reportResult] = await db.delete(coachingReports).where(eq(coachingReports.sessionId, sessionId));
  const [recResult] = await db.delete(audioRecordings).where(eq(audioRecordings.sessionId, sessionId));
  const [checkResult] = await db.delete(sessionChecklists).where(eq(sessionChecklists.sessionId, sessionId));
  const [objResult] = await db.delete(objectionLogs).where(eq(objectionLogs.sessionId, sessionId));

  // Delete the session itself
  const [sessResult] = await db.delete(sessions).where(eq(sessions.id, sessionId));

  return {
    transcripts: txResult?.affectedRows ?? 0,
    suggestions: sugResult?.affectedRows ?? 0,
    complianceFlags: flagResult?.affectedRows ?? 0,
    grades: gradeResult?.affectedRows ?? 0,
    reports: reportResult?.affectedRows ?? 0,
    recordings: { count: recResult?.affectedRows ?? 0, fileKeys },
    checklists: checkResult?.affectedRows ?? 0,
    objections: objResult?.affectedRows ?? 0,
    session: (sessResult?.affectedRows ?? 0) > 0,
  };
}

/**
 * Find audio recordings where retentionExpiresAt has passed.
 */
export async function getExpiredRecordings(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: audioRecordings.id,
      sessionId: audioRecordings.sessionId,
      fileKey: audioRecordings.fileKey,
    })
    .from(audioRecordings)
    .where(lte(audioRecordings.retentionExpiresAt, new Date()))
    .limit(limit);
}

/**
 * Set retention expiry on a recording.
 */
export async function setRecordingRetention(recordingId: number, retentionDays: number = 90) {
  const db = await getDb();
  if (!db) return;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + retentionDays);
  await db.update(audioRecordings).set({ retentionExpiresAt: expiresAt }).where(eq(audioRecordings.id, recordingId));
}

export async function getGroupIdForUser(userId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  // Get user's current dealershipId
  const user = await db.select({ dealershipId: users.dealershipId }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0]?.dealershipId) return null;
  // Get the dealership's groupId
  const dealership = await db.select({ groupId: dealerships.groupId }).from(dealerships).where(eq(dealerships.id, user[0].dealershipId)).limit(1);
  return dealership[0]?.groupId ?? null;
}

// ─── MFA ──────────────────────────────────────────────────────────────────────

export async function setUserMfaSecret(userId: number, encryptedSecret: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ totpSecret: encryptedSecret }).where(eq(users.id, userId));
}

export async function enableUserMfa(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ mfaEnabled: true }).where(eq(users.id, userId));
}

export async function disableUserMfa(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ mfaEnabled: false, totpSecret: null }).where(eq(users.id, userId));
}

export async function getUserMfaStatus(userId: number): Promise<{ mfaEnabled: boolean; totpSecret: string | null }> {
  const db = await getDb();
  if (!db) return { mfaEnabled: false, totpSecret: null };
  const result = await db.select({ mfaEnabled: users.mfaEnabled, totpSecret: users.totpSecret }).from(users).where(eq(users.id, userId)).limit(1);
  const row = result[0] ?? { mfaEnabled: false, totpSecret: null };
  return {
    mfaEnabled: row.mfaEnabled,
    totpSecret: row.totpSecret ? decrypt(row.totpSecret) : null,
  };
}

// ─── Dealership Settings ──────────────────────────────────────────────────────
export async function getDealershipSettings(dealershipId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(dealershipSettings)
    .where(eq(dealershipSettings.dealershipId, dealershipId))
    .limit(1);
  if (result[0]) return result[0];
  // Return defaults if no settings row yet
  return {
    id: null as number | null,
    dealershipId,
    maxSessionDuration: 120,
    autoGradeEnabled: true,
    requireCustomerName: true,
    requireDealNumber: false,
    consentMethod: "verbal" as "verbal" | "written" | "electronic",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function updateDealershipSettings(
  dealershipId: number,
  data: {
    maxSessionDuration?: number;
    autoGradeEnabled?: boolean;
    requireCustomerName?: boolean;
    requireDealNumber?: boolean;
    consentMethod?: "verbal" | "written" | "electronic";
  }
) {
  return upsertDealershipSettings(dealershipId, data);
}

// Spec-aligned upsert using onDuplicateKeyUpdate
export async function upsertDealershipSettings(
  dealershipId: number,
  data: {
    maxSessionDuration?: number;
    autoGradeEnabled?: boolean;
    requireCustomerName?: boolean;
    requireDealNumber?: boolean;
    consentMethod?: "verbal" | "written" | "electronic";
    // Onboarding step 4 — baseline metrics (Phase 2):
    vsaPenBaseline?: number;
    gapPenBaseline?: number;
    appearancePenBaseline?: number;
    chargebackRateBaseline?: number;
    citAgingBaseline?: number;
    // Onboarding step 5 — coaching cadence (Phase 2):
    coachingCadenceDay?: string;
    coachingCadenceTime?: string;
    coachingRunBy?: "fi_director" | "asura_coach" | "dp" | "other";
    pru90DayTarget?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .insert(dealershipSettings)
    .values({ dealershipId, ...data })
    .onDuplicateKeyUpdate({ set: { ...data } });
}

// ─── Session Deal Details Update ─────────────────────────────────────────────
export async function updateSessionDealDetails(
  sessionId: number,
  data: {
    vehicleYear?: string | null;
    vehicleMake?: string | null;
    vehicleModel?: string | null;
    vin?: string | null;
    salePrice?: number | null;
    tradeValue?: number | null;
    amountFinanced?: number | null;
    lenderName?: string | null;
    apr?: number | null;
    termMonths?: number | null;
    monthlyPayment?: number | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Remove undefined values so we only update provided fields
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  if (Object.keys(cleanData).length === 0) return;
  await db.update(sessions).set(cleanData).where(eq(sessions.id, sessionId));
}

// ─── Pagination Count Functions ───────────────────────────────────────────────
export async function getSessionCount(dealershipId?: number | null): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const q = db.select({ total: count() }).from(sessions);
  const filtered = dealershipId != null ? q.where(eq(sessions.dealershipId, dealershipId)) : q;
  const result = await filtered;
  return Number(result[0]?.total ?? 0);
}

export async function getSessionCountByUser(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ total: count() }).from(sessions).where(eq(sessions.userId, userId));
  return Number(result[0]?.total ?? 0);
}

export async function getSessionCountByDealershipIds(dealershipIds: number[]): Promise<number> {
  if (dealershipIds.length === 0) return 0;
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ total: count() }).from(sessions).where(inArray(sessions.dealershipId, dealershipIds));
  return Number(result[0]?.total ?? 0);
}

export async function getAuditLogCount(userIds?: number[] | null): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  if (userIds && userIds.length > 0) {
    const result = await db.select({ total: count() }).from(auditLogs).where(inArray(auditLogs.userId, userIds));
    return Number(result[0]?.total ?? 0);
  }
  const result = await db.select({ total: count() }).from(auditLogs);
  return Number(result[0]?.total ?? 0);
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function createCustomer(data: {
  dealershipId: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const encData = {
    ...data,
    firstName: encrypt(data.firstName) ?? data.firstName,
    lastName: encrypt(data.lastName) ?? data.lastName,
    email: data.email ? (encrypt(data.email) ?? data.email) : null,
    phone: data.phone ? (encrypt(data.phone) ?? data.phone) : null,
    address: data.address ? (encrypt(data.address) ?? data.address) : null,
  };
  await db.insert(customers).values(encData);
  const result = await db.select().from(customers).orderBy(desc(customers.id)).limit(1);
  return result[0] ? decryptFields(result[0], ["firstName", "lastName", "email", "phone", "address"]) : null;
}

export async function getCustomersByDealership(dealershipId: number, limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(customers)
    .where(eq(customers.dealershipId, dealershipId))
    .orderBy(desc(customers.updatedAt))
    .limit(limit).offset(offset);
  return decryptRows(rows, ["firstName", "lastName", "email", "phone", "address"]);
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result[0] ? decryptFields(result[0], ["firstName", "lastName", "email", "phone", "address"]) : null;
}

export async function updateCustomer(id: number, data: {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const encData: Record<string, unknown> = {};
  if (data.firstName !== undefined) encData.firstName = encrypt(data.firstName) ?? data.firstName;
  if (data.lastName !== undefined) encData.lastName = encrypt(data.lastName) ?? data.lastName;
  if (data.email !== undefined) encData.email = data.email ? (encrypt(data.email) ?? data.email) : null;
  if (data.phone !== undefined) encData.phone = data.phone ? (encrypt(data.phone) ?? data.phone) : null;
  if (data.address !== undefined) encData.address = data.address ? (encrypt(data.address) ?? data.address) : null;
  if (data.notes !== undefined) encData.notes = data.notes;
  if (Object.keys(encData).length === 0) return;
  await db.update(customers).set(encData).where(eq(customers.id, id));
}

export async function searchCustomers(dealershipId: number, query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  // Since names are encrypted, fetch all and filter client-side
  const allCustomers = await getCustomersByDealership(dealershipId, 500, 0);
  const q = query.toLowerCase();
  return allCustomers
    .filter((c) =>
      c.firstName?.toLowerCase().includes(q) ||
      c.lastName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    )
    .slice(0, limit);
}

export async function getCustomerCountByDealership(dealershipId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(customers)
    .where(eq(customers.dealershipId, dealershipId));
  return result[0]?.count ?? 0;
}

export async function getSessionsByCustomerId(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(sessions)
    .where(eq(sessions.customerId, customerId))
    .orderBy(desc(sessions.startedAt));
  return decryptRows(rows, ["customerName"]);
}

// ─── Product Menu ────────────────────────────────────────────────────────────

export async function getProductMenuByDealership(dealershipId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productMenu)
    .where(eq(productMenu.dealershipId, dealershipId))
    .orderBy(productMenu.sortOrder);
}

export async function upsertProductMenuItem(data: {
  id?: number;
  dealershipId: number;
  productType: string;
  displayName: string;
  providerName?: string | null;
  description?: string | null;
  costToDealer?: number | null;
  retailPrice?: number | null;
  termMonths?: number | null;
  maxMileage?: number | null;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (data.id) {
    const { id, ...updates } = data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.update(productMenu).set(updates as any).where(eq(productMenu.id, id));
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.insert(productMenu).values(data as any);
  }
}

export async function deleteProductMenuItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(productMenu).where(eq(productMenu.id, id));
}

export async function getProductMenuItemById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(productMenu).where(eq(productMenu.id, id)).limit(1);
  return result[0] ?? null;
}

// ─── Product Intelligence ─────────────────────────────────────────────────────

function parseJsonFields(row: any) {
  if (!row) return row;
  const jsonFields = ["commonObjections", "objectionResponses", "sellingPoints", "asuraCoachingTips"];
  const result = { ...row };
  for (const field of jsonFields) {
    if (typeof result[field] === "string") {
      try { result[field] = JSON.parse(result[field]); } catch { /* keep as string */ }
    }
  }
  return result;
}

export async function getProductIntelligenceByType(productType: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(productIntelligence)
    .where(eq(productIntelligence.productType, productType as any))
    .limit(1);
  return rows[0] ? parseJsonFields(rows[0]) : null;
}

export async function getAllProductIntelligence() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(productIntelligence)
    .where(eq(productIntelligence.isActive, true))
    .orderBy(productIntelligence.productType);
  return rows.map(parseJsonFields);
}

export async function upsertProductIntelligence(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const record = {
    ...data,
    commonObjections: typeof data.commonObjections === "string" ? data.commonObjections : JSON.stringify(data.commonObjections),
    objectionResponses: typeof data.objectionResponses === "string" ? data.objectionResponses : JSON.stringify(data.objectionResponses),
    sellingPoints: typeof data.sellingPoints === "string" ? data.sellingPoints : JSON.stringify(data.sellingPoints),
    asuraCoachingTips: typeof data.asuraCoachingTips === "string" ? data.asuraCoachingTips : JSON.stringify(data.asuraCoachingTips),
  };
  if (data.id) {
    const { id, ...updates } = record;
    await db.update(productIntelligence).set(updates as any).where(eq(productIntelligence.id, id));
  } else {
    await db.insert(productIntelligence).values(record as any);
  }
  return { success: true };
}

// ─── Deal Recovery ────────────────────────────────────────────────────────────

export async function getDealRecoveriesBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dealRecovery)
    .where(eq(dealRecovery.sessionId, sessionId))
    .orderBy(desc(dealRecovery.createdAt));
}

export async function getDealRecoveriesByUser(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const userSessions = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, userId));
  const sessionIds = userSessions.map(s => s.id);
  if (sessionIds.length === 0) return [];
  return db.select().from(dealRecovery)
    .where(inArray(dealRecovery.sessionId, sessionIds))
    .orderBy(desc(dealRecovery.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function createDealRecovery(data: {
  sessionId: number;
  productType: string;
  declineReason: string;
  recoveryScript: string;
  potentialRevenue: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(dealRecovery).values({
    ...data,
    productType: data.productType as any,
    recoveryStatus: "pending",
  } as any);
  return { success: true };
}

export async function updateDealRecoveryStatus(id: number, status: string, actualRevenue?: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const updates: any = { recoveryStatus: status };
  if (actualRevenue !== undefined) updates.actualRevenue = actualRevenue;
  await db.update(dealRecovery).set(updates).where(eq(dealRecovery.id, id));
  return { success: true };
}

export async function getDealRecoveryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(dealRecovery).where(eq(dealRecovery.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getDealRecoveryStats(userId: number) {
  const recoveries = await getDealRecoveriesByUser(userId, 10000, 0);
  const stats = { pendingCount: 0, attemptedCount: 0, recoveredCount: 0, lostCount: 0, totalPotentialRevenue: 0, totalActualRevenue: 0 };
  for (const r of recoveries) {
    if (r.recoveryStatus === "pending") stats.pendingCount++;
    else if (r.recoveryStatus === "attempted") stats.attemptedCount++;
    else if (r.recoveryStatus === "recovered") stats.recoveredCount++;
    else if (r.recoveryStatus === "lost") stats.lostCount++;
    stats.totalPotentialRevenue += r.potentialRevenue ?? 0;
    stats.totalActualRevenue += r.actualRevenue ?? 0;
  }
  return stats;
}

// ─── ASURA OPS Scorecards ──────────────────────────────────────────────────────

export async function createScorecard(data: InsertAsuraScorecard): Promise<AsuraScorecard> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(asuraScorecards).values(data as any);
  // Fetch and return the created row
  const rows = await db.select().from(asuraScorecards)
    .where(eq(asuraScorecards.sessionId, data.sessionId))
    .limit(1);
  return rows[0] as AsuraScorecard;
}

export async function upsertScorecard(data: InsertAsuraScorecard): Promise<AsuraScorecard> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select({ id: asuraScorecards.id })
    .from(asuraScorecards)
    .where(eq(asuraScorecards.sessionId, data.sessionId))
    .limit(1);

  if (existing.length > 0) {
    const { sessionId, ...updates } = data as any;
    await db.update(asuraScorecards).set({ ...updates, updatedAt: new Date() }).where(eq(asuraScorecards.sessionId, data.sessionId));
  } else {
    await db.insert(asuraScorecards).values(data as any);
  }

  const rows = await db.select().from(asuraScorecards)
    .where(eq(asuraScorecards.sessionId, data.sessionId))
    .limit(1);
  return rows[0] as AsuraScorecard;
}

export async function getScorecardBySession(sessionId: number): Promise<AsuraScorecard | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(asuraScorecards)
    .where(eq(asuraScorecards.sessionId, sessionId))
    .limit(1);
  return (rows[0] as AsuraScorecard) ?? null;
}

export async function getScorecardsByUser(userId: number, limit = 20, offset = 0): Promise<AsuraScorecard[]> {
  const db = await getDb();
  if (!db) return [];
  const userSessions = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, userId));
  const sessionIds = userSessions.map(s => s.id);
  if (sessionIds.length === 0) return [];
  return db.select().from(asuraScorecards)
    .where(inArray(asuraScorecards.sessionId, sessionIds))
    .orderBy(desc(asuraScorecards.gradedAt))
    .limit(limit)
    .offset(offset) as Promise<AsuraScorecard[]>;
}

export async function getScorecardsByDealership(dealershipId: number, limit = 100, offset = 0): Promise<AsuraScorecard[]> {
  const db = await getDb();
  if (!db) return [];
  const dealershipSessions = await db.select({ id: sessions.id }).from(sessions)
    .where(eq(sessions.dealershipId, dealershipId));
  const sessionIds = dealershipSessions.map(s => s.id);
  if (sessionIds.length === 0) return [];
  return db.select().from(asuraScorecards)
    .where(inArray(asuraScorecards.sessionId, sessionIds))
    .orderBy(desc(asuraScorecards.gradedAt))
    .limit(limit)
    .offset(offset) as Promise<AsuraScorecard[]>;
}

export async function getAverageScorecardByUser(userId: number): Promise<{
  avgTier1Score: number;
  avgMenuOrder: number;
  avgUpgradeArchitecture: number;
  avgObjectionPrevention: number;
  avgCoachingCadence: number;
  sessionCount: number;
} | null> {
  const db = await getDb();
  if (!db) return null;
  const userSessions = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, userId));
  const sessionIds = userSessions.map(s => s.id);
  if (sessionIds.length === 0) return null;
  const result = await db.select({
    avgTier1Score: avg(asuraScorecards.tier1Score),
    avgMenuOrder: avg(asuraScorecards.menuOrderScore),
    avgUpgradeArchitecture: avg(asuraScorecards.upgradeArchitectureScore),
    avgObjectionPrevention: avg(asuraScorecards.objectionPreventionScore),
    avgCoachingCadence: avg(asuraScorecards.coachingCadenceScore),
    sessionCount: count(),
  }).from(asuraScorecards)
    .where(inArray(asuraScorecards.sessionId, sessionIds));
  if (!result[0] || result[0].sessionCount === 0) return null;
  return {
    avgTier1Score: Number(result[0].avgTier1Score ?? 0),
    avgMenuOrder: Number(result[0].avgMenuOrder ?? 0),
    avgUpgradeArchitecture: Number(result[0].avgUpgradeArchitecture ?? 0),
    avgObjectionPrevention: Number(result[0].avgObjectionPrevention ?? 0),
    avgCoachingCadence: Number(result[0].avgCoachingCadence ?? 0),
    sessionCount: Number(result[0].sessionCount),
  };
}

export async function getRecentScorecardScores(userId: number, limit = 10): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const userSessions = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, userId));
  const sessionIds = userSessions.map(s => s.id);
  if (sessionIds.length === 0) return [];
  const rows = await db.select({ tier1Score: asuraScorecards.tier1Score })
    .from(asuraScorecards)
    .where(inArray(asuraScorecards.sessionId, sessionIds))
    .orderBy(asuraScorecards.gradedAt)
    .limit(limit);
  return rows.map(r => Number(r.tier1Score));
}

// ─── Alerts ──────────────────────────────────────────────────────────────────
export async function getUnreadAlerts(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  // Get user's accessible sessions
  const userSessions = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, userId));
  const sessionIds = userSessions.map(s => s.id);

  const alerts: Array<{
    id: string;
    type: "compliance" | "performance";
    severity: "critical" | "warning" | "info";
    message: string;
    detail: string;
    sessionId: number | null;
    createdAt: Date;
  }> = [];

  // Source 1: Unresolved critical/warning compliance flags from user's sessions
  if (sessionIds.length > 0) {
    const flags = await db.select().from(complianceFlags)
      .where(and(
        inArray(complianceFlags.sessionId, sessionIds),
        eq(complianceFlags.resolved, false),
        or(
          eq(complianceFlags.severity, "critical"),
          eq(complianceFlags.severity, "warning"),
        ),
      ))
      .orderBy(desc(complianceFlags.createdAt))
      .limit(limit);

    for (const flag of flags) {
      alerts.push({
        id: `flag-${flag.id}`,
        type: "compliance",
        severity: flag.severity as "critical" | "warning",
        message: `Compliance ${flag.severity}: ${flag.rule}`,
        detail: flag.description ?? "",
        sessionId: flag.sessionId,
        createdAt: flag.createdAt,
      });
    }
  }

  // Source 2: Low performance grades from user's sessions (overall < 60)
  const lowGrades = await db.select().from(performanceGrades)
    .where(and(
      eq(performanceGrades.userId, userId),
      lte(performanceGrades.overallScore, 60),
    ))
    .orderBy(desc(performanceGrades.gradedAt))
    .limit(10);

  for (const grade of lowGrades) {
    alerts.push({
      id: `grade-${grade.id}`,
      type: "performance",
      severity: "warning",
      message: `Low session score: ${grade.overallScore}%`,
      detail: `Session ${grade.sessionId} scored below 60%. Review coaching report for improvement areas.`,
      sessionId: grade.sessionId,
      createdAt: grade.gradedAt,
    });
  }

  // Sort by date and limit
  return alerts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export async function markAlertRead(alertId: string) {
  const db = await getDb();
  if (!db) return { success: false };

  // Parse alert ID to determine source
  if (alertId.startsWith("flag-")) {
    const flagId = parseInt(alertId.replace("flag-", ""), 10);
    if (!isNaN(flagId)) {
      await db.update(complianceFlags).set({ resolved: true, resolvedAt: new Date() }).where(eq(complianceFlags.id, flagId));
      return { success: true };
    }
  }
  // For grade alerts, we just acknowledge (no DB change needed)
  if (alertId.startsWith("grade-")) {
    return { success: true };
  }
  return { success: false };
}

// ─── Local Auth Helpers ───────────────────────────────────────────────────────
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function setUserPasswordHash(userId: number, hash: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ passwordHash: hash } as any).where(eq(users.id, userId));
  return { success: true };
}
