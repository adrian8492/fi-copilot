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

// ─── Dealerships ─────────────────────────────────────────────────────────────
export const dealerships = mysqlTable("dealerships", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  plan: mysqlEnum("plan", ["trial", "beta", "pro", "enterprise"]).default("beta").notNull(),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  dealership: varchar("dealership", { length: 255 }),
  dealershipId: int("dealershipId"),
  isSuperAdmin: boolean("isSuperAdmin").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dealershipId: int("dealershipId"),
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
    "language_correction",
    "process_alert",
    "professional_hello",
    "customer_connection",
    "financial_snapshot",
    "menu_transition",
    "product_presentation",
    "objection_prevention",
    "objection_response",
    "closing",
    "compliance_disclosure",
    "phone_script",
    "admin_function",
    "assuming_business",
    "client_survey",
    "needs_awareness",
    "product_knowledge",
    "ranking_process",
    "transition",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  triggeredBy: text("triggeredBy"),
  script: text("script"),
  framework: varchar("framework", { length: 255 }),
  priority: mysqlEnum("priority", ["high", "medium", "low"]).default("medium").notNull(),
  wasActedOn: boolean("wasActedOn").default(false),
  usedAt: timestamp("usedAt"),
  usedBy: varchar("usedBy", { length: 255 }),
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
  // Script Fidelity Scoring (Sprint 4)
  scriptFidelityScore: float("scriptFidelityScore"),
  processAdherenceScore: float("processAdherenceScore"),
  menuSequenceScore: float("menuSequenceScore"),
  objectionResponseScore: float("objectionResponseScore"),
  transitionAccuracyScore: float("transitionAccuracyScore"),
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

// ─── Compliance Rules (Custom Rules Builder) ────────────────────────────────
export const complianceRules = mysqlTable("compliance_rules", {
  id: int("id").autoincrement().primaryKey(),
  createdBy: int("createdBy").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "federal_tila",
    "federal_ecoa",
    "federal_udap",
    "federal_cla",
    "contract_element",
    "fi_product_disclosure",
    "process_step",
    "custom",
  ]).notNull().default("custom"),
  triggerKeywords: json("triggerKeywords").$type<string[]>().notNull(),
  requiredPhrase: text("requiredPhrase"),
  severity: mysqlEnum("severity", ["critical", "warning", "info"]).notNull().default("warning"),
  weight: float("weight").notNull().default(1.0),
  isActive: boolean("isActive").notNull().default(true),
  dealStage: varchar("dealStage", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Script Library (Verbatim Script Index) ───────────────────────────────────
export const scriptLibrary = mysqlTable("script_library", {
  id: int("id").autoincrement().primaryKey(),
  scriptText: text("scriptText").notNull(),
  scriptCategory: mysqlEnum("scriptCategory", [
    "professional_hello",
    "customer_connection",
    "financial_snapshot",
    "menu_transition",
    "product_presentation",
    "objection_prevention",
    "objection_response",
    "closing",
    "phone_script",
    "compliance_disclosure",
  ]).notNull(),
  dealStage: varchar("dealStage", { length: 64 }).notNull(),
  intentTrigger: varchar("intentTrigger", { length: 255 }).notNull(),
  triggerKeywords: json("triggerKeywords").$type<string[]>().notNull(),
  sourceDocument: varchar("sourceDocument", { length: 255 }).notNull(),
  productContext: varchar("productContext", { length: 128 }),
  isActive: boolean("isActive").notNull().default(true),
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
export type ComplianceRule = typeof complianceRules.$inferSelect;
export type InsertComplianceRule = typeof complianceRules.$inferInsert;
export type ScriptLibraryEntry = typeof scriptLibrary.$inferSelect;
export type InsertScriptLibraryEntry = typeof scriptLibrary.$inferInsert;
export type SessionChecklist = typeof sessionChecklists.$inferSelect;
export type InsertSessionChecklist = typeof sessionChecklists.$inferInsert;
export type ObjectionLog = typeof objectionLogs.$inferSelect;
export type InsertObjectionLog = typeof objectionLogs.$inferInsert;

// ─── Invitations ──────────────────────────────────────────────────────────────
export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  dealershipId: int("dealershipId").notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  invitedBy: int("invitedBy").notNull(),
  usedBy: int("usedBy"),
  usedAt: timestamp("usedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Invitation = typeof invitations.$inferSelect;
