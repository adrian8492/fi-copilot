import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  dealership: varchar("dealership", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  customerName: varchar("customerName", { length: 255 }),
  dealNumber: varchar("dealNumber", { length: 64 }),
  vehicleType: mysqlEnum("vehicleType", ["new", "used", "cpo"]).default("new"),
  dealType: mysqlEnum("dealType", ["retail_finance", "lease", "cash"]).default("retail_finance"),
  status: mysqlEnum("status", ["active", "completed", "processing", "archived"]).default("active").notNull(),
  consentObtained: boolean("consentObtained").default(false).notNull(),
  consentMethod: varchar("consentMethod", { length: 64 }),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
  durationSeconds: int("durationSeconds"),
  notes: text("notes"),
});

// ─── Transcripts ──────────────────────────────────────────────────────────────
export const transcripts = mysqlTable("transcripts", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  speaker: mysqlEnum("speaker", ["manager", "customer", "unknown"]).default("unknown").notNull(),
  text: text("text").notNull(),
  startTime: float("startTime"),
  endTime: float("endTime"),
  confidence: float("confidence"),
  isFinal: boolean("isFinal").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Copilot Suggestions ──────────────────────────────────────────────────────
export const copilotSuggestions = mysqlTable("copilot_suggestions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  type: mysqlEnum("type", [
    "product_recommendation",
    "objection_handling",
    "compliance_reminder",
    "rapport_building",
    "closing_technique",
    "general_tip",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  triggeredBy: text("triggeredBy"),
  priority: mysqlEnum("priority", ["high", "medium", "low"]).default("medium").notNull(),
  wasActedOn: boolean("wasActedOn").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Compliance Flags ─────────────────────────────────────────────────────────
export const complianceFlags = mysqlTable("compliance_flags", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  severity: mysqlEnum("severity", ["critical", "warning", "info"]).default("warning").notNull(),
  rule: varchar("rule", { length: 255 }).notNull(),
  description: text("description").notNull(),
  excerpt: text("excerpt"),
  timestamp: float("timestamp"),
  resolved: boolean("resolved").default(false).notNull(),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Performance Grades ───────────────────────────────────────────────────────
export const performanceGrades = mysqlTable("performance_grades", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().unique(),
  userId: int("userId").notNull(),
  // Rubric scores (0-100)
  rapportScore: float("rapportScore"),
  productPresentationScore: float("productPresentationScore"),
  objectionHandlingScore: float("objectionHandlingScore"),
  closingTechniqueScore: float("closingTechniqueScore"),
  complianceScore: float("complianceScore"),
  overallScore: float("overallScore"),
  // Financial outcomes
  pvr: float("pvr"),
  productsPerDeal: float("productsPerDeal"),
  utilizationRate: float("utilizationRate"),
  // Feedback
  strengths: text("strengths"),
  improvements: text("improvements"),
  coachingNotes: text("coachingNotes"),
  gradedAt: timestamp("gradedAt").defaultNow().notNull(),
});

// ─── Audio Recordings ─────────────────────────────────────────────────────────
export const audioRecordings = mysqlTable("audio_recordings", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileName: varchar("fileName", { length: 255 }),
  mimeType: varchar("mimeType", { length: 64 }),
  fileSizeBytes: int("fileSizeBytes"),
  durationSeconds: int("durationSeconds"),
  status: mysqlEnum("status", ["uploaded", "processing", "transcribed", "failed"]).default("uploaded").notNull(),
  transcriptionProvider: varchar("transcriptionProvider", { length: 64 }),
  processedAt: timestamp("processedAt"),
  retentionExpiresAt: timestamp("retentionExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Coaching Reports ─────────────────────────────────────────────────────────
export const coachingReports = mysqlTable("coaching_reports", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().unique(),
  userId: int("userId").notNull(),
  executiveSummary: text("executiveSummary"),
  sentimentOverall: mysqlEnum("sentimentOverall", ["positive", "neutral", "negative", "mixed"]),
  sentimentManagerScore: float("sentimentManagerScore"),
  sentimentCustomerScore: float("sentimentCustomerScore"),
  purchaseLikelihoodScore: float("purchaseLikelihoodScore"),
  keyMoments: json("keyMoments"),
  productOpportunities: json("productOpportunities"),
  objectionPatterns: json("objectionPatterns"),
  recommendations: text("recommendations"),
  behaviorInsights: text("behaviorInsights"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

// ─── Session Checklists ──────────────────────────────────────────────────────
// Tracks the 17-point F&I process checklist per session (Introduction / Compliance / Menu)
export const sessionChecklists = mysqlTable("session_checklists", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().unique(),
  userId: int("userId").notNull(),
  // Introduction section (6 items)
  fiManagerGreeting: boolean("fiManagerGreeting").default(false).notNull(),
  statedTitleWork: boolean("statedTitleWork").default(false).notNull(),
  statedFactoryWarranty: boolean("statedFactoryWarranty").default(false).notNull(),
  statedFinancialOptions: boolean("statedFinancialOptions").default(false).notNull(),
  statedTimeFrame: boolean("statedTimeFrame").default(false).notNull(),
  introductionToFirstForms: boolean("introductionToFirstForms").default(false).notNull(),
  // General Compliance section (3 items)
  privacyPolicyMentioned: boolean("privacyPolicyMentioned").default(false).notNull(),
  riskBasedPricingMentioned: boolean("riskBasedPricingMentioned").default(false).notNull(),
  disclosedBasePayment: boolean("disclosedBasePayment").default(false).notNull(),
  // Menu Presentation section (8 items)
  presentedPrepaidMaintenance: boolean("presentedPrepaidMaintenance").default(false).notNull(),
  presentedVehicleServiceContract: boolean("presentedVehicleServiceContract").default(false).notNull(),
  presentedGap: boolean("presentedGap").default(false).notNull(),
  presentedInteriorExteriorProtection: boolean("presentedInteriorExteriorProtection").default(false).notNull(),
  presentedRoadHazard: boolean("presentedRoadHazard").default(false).notNull(),
  presentedPaintlessDentRepair: boolean("presentedPaintlessDentRepair").default(false).notNull(),
  customerQuestionsAddressed: boolean("customerQuestionsAddressed").default(false).notNull(),
  whichClosingQuestionAsked: boolean("whichClosingQuestionAsked").default(false).notNull(),
  // Computed scores
  introductionScore: float("introductionScore"),
  complianceScore: float("complianceScore"),
  menuPresentationScore: float("menuPresentationScore"),
  overallChecklistScore: float("overallChecklistScore"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Objection Logs ───────────────────────────────────────────────────────────
// Tracks individual objections raised during sessions for Eagle Eye analytics
export const objectionLogs = mysqlTable("objection_logs", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  // Which F&I product was objected to
  product: mysqlEnum("product", [
    "vehicle_service_contract",
    "gap_insurance",
    "prepaid_maintenance",
    "interior_exterior_protection",
    "road_hazard",
    "paintless_dent_repair",
    "key_replacement",
    "windshield_protection",
    "lease_wear_tear",
    "other",
  ]).notNull(),
  // The type of concern driving the objection
  concernType: mysqlEnum("concernType", [
    "cost",
    "confidence_in_coverage",
    "low_usage_expectation",
    "skepticism_dealer_motives",
    "misunderstanding",
    "self_insurance_preference",
    "perception_low_risk",
    "exclusions_concern",
    "financial_constraints",
    "other",
  ]).notNull(),
  excerpt: text("excerpt"),
  wasResolved: boolean("wasResolved").default(false).notNull(),
  resolutionMethod: varchar("resolutionMethod", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 128 }).notNull(),
  resourceType: varchar("resourceType", { length: 64 }),
  resourceId: varchar("resourceId", { length: 64 }),
  details: json("details"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
export type Transcript = typeof transcripts.$inferSelect;
export type InsertTranscript = typeof transcripts.$inferInsert;
export type CopilotSuggestion = typeof copilotSuggestions.$inferSelect;
export type ComplianceFlag = typeof complianceFlags.$inferSelect;
export type PerformanceGrade = typeof performanceGrades.$inferSelect;
export type AudioRecording = typeof audioRecordings.$inferSelect;
export type CoachingReport = typeof coachingReports.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type SessionChecklist = typeof sessionChecklists.$inferSelect;
export type InsertSessionChecklist = typeof sessionChecklists.$inferInsert;
export type ObjectionLog = typeof objectionLogs.$inferSelect;
export type InsertObjectionLog = typeof objectionLogs.$inferInsert;
