import { and, desc, eq, gte, like, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  InsertObjectionLog,
  InsertSessionChecklist,
  audioRecordings,
  auditLogs,
  coachingReports,
  complianceFlags,
  copilotSuggestions,
  objectionLogs,
  performanceGrades,
  sessionChecklists,
  sessions,
  transcripts,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
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
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
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
  customerName?: string;
  dealNumber?: string;
  vehicleType?: "new" | "used" | "cpo";
  dealType?: "retail_finance" | "lease" | "cash";
  consentObtained?: boolean;
  consentMethod?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(sessions).values({ ...data, status: "active" });
  return result[0];
}

export async function getSessionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getSessionsByUserId(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sessions).where(eq(sessions.userId, userId)).orderBy(desc(sessions.startedAt)).limit(limit).offset(offset);
}

export async function getAllSessions(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sessions).orderBy(desc(sessions.startedAt)).limit(limit).offset(offset);
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
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(transcripts).values(data);
}

export async function getTranscriptsBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transcripts).where(eq(transcripts.sessionId, sessionId)).orderBy(transcripts.startTime);
}

export async function searchTranscripts(query: string, userId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (userId) {
    const userSessions = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, userId));
    const sessionIds = userSessions.map((s) => s.id);
    if (sessionIds.length === 0) return [];
  }
  return db.select().from(transcripts).where(like(transcripts.text, `%${query}%`)).limit(50);
}

// ─── Copilot Suggestions ──────────────────────────────────────────────────────
export async function insertCopilotSuggestion(data: {
  sessionId: number;
  type: "product_recommendation" | "objection_handling" | "compliance_reminder" | "rapport_building" | "closing_technique" | "general_tip";
  title: string;
  content: string;
  triggeredBy?: string;
  priority?: "high" | "medium" | "low";
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(copilotSuggestions).values(data);
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
  await db.insert(complianceFlags).values(data);
}

export async function getFlagsBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(complianceFlags).where(eq(complianceFlags.sessionId, sessionId)).orderBy(complianceFlags.createdAt);
}

export async function resolveFlag(flagId: number, resolvedBy: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(complianceFlags).set({ resolved: true, resolvedBy, resolvedAt: new Date() }).where(eq(complianceFlags.id, flagId));
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
  const result = await db.insert(audioRecordings).values({ ...data, status: "uploaded" });
  return result[0];
}

export async function getRecordingsBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(audioRecordings).where(eq(audioRecordings.sessionId, sessionId));
}

export async function getRecordingsByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(audioRecordings).where(eq(audioRecordings.userId, userId)).orderBy(desc(audioRecordings.createdAt)).limit(limit);
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

export async function getAuditLogs(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset);
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export async function getAnalyticsSummary(userId?: number) {
  const db = await getDb();
  if (!db) return null;

  const whereClause = userId ? eq(sessions.userId, userId) : undefined;
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

  const flagList = await db.select().from(complianceFlags);
  const criticalFlags = flagList.filter((f) => f.severity === "critical" && !f.resolved).length;

  return { totalSessions, completedSessions, avgScore, avgPvr, criticalFlags, totalGrades: gradeList.length };
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
export async function getEagleEyeLeaderboard(fromDate?: Date, toDate?: Date) {
  const db = await getDb();
  if (!db) return [];

  // Get all users with their sessions and grades
  const allUsers = await db.select().from(users).where(eq(users.role, "user"));
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
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

export async function getEagleEyeTrends(fromDate?: Date, toDate?: Date) {
  const db = await getDb();
  if (!db) return { groupTrend: [], managerTrends: {} };

  const allUsers = await db.select().from(users).where(eq(users.role, "user"));
  const managerTrends: Record<string, Array<{ week: string; score: number }>> = {};
  const groupScoresByWeek: Record<string, number[]> = {};

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

  return { groupTrend, managerTrends };
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
