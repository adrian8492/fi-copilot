import { and, desc, eq, gte, like, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  audioRecordings,
  auditLogs,
  coachingReports,
  complianceFlags,
  copilotSuggestions,
  performanceGrades,
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
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
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
  if (!db) return undefined;
  const result = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  return result[0];
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
  if (!db) return undefined;
  const result = await db.select().from(performanceGrades).where(eq(performanceGrades.sessionId, sessionId)).limit(1);
  return result[0];
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
  if (!db) return undefined;
  const result = await db.select().from(coachingReports).where(eq(coachingReports.sessionId, sessionId)).limit(1);
  return result[0];
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
