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
  decimal,
  index,
} from "drizzle-orm/mysql-core";

// ─── Dealership Groups ───────────────────────────────────────────────────────
export const dealershipGroups = mysqlTable("dealership_groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Dealerships ─────────────────────────────────────────────────────────────
export const dealerships = mysqlTable("dealerships", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  plan: mysqlEnum("plan", ["trial", "beta", "pro", "enterprise"]).default("beta").notNull(),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  groupId: int("groupId"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  // Onboarding profile (Phase 2):
  location: varchar("location", { length: 255 }),
  brandMix: json("brandMix").$type<string[]>(),
  unitVolumeMonthly: int("unitVolumeMonthly"),
  pruBaseline: int("pruBaseline"),
  pruTarget: int("pruTarget"),
  // Onboarding state machine: 0 = profile pending, 5 = all complete.
  onboardingStep: int("onboardingStep").notNull().default(0),
  onboardingComplete: boolean("onboardingComplete").notNull().default(false),
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
  isGroupAdmin: boolean("isGroupAdmin").notNull().default(false),
  mfaEnabled: boolean("mfaEnabled").notNull().default(false),
  totpSecret: varchar("totpSecret", { length: 512 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dealershipId: int("dealershipId"),
  customerId: int("customerId"),
  customerName: varchar("customerName", { length: 512 }),
  dealNumber: varchar("dealNumber", { length: 64 }),
  vehicleType: mysqlEnum("vehicleType", ["new", "used", "cpo"]).default("new"),
  dealType: mysqlEnum("dealType", ["retail_finance", "lease", "cash"]).default("retail_finance"),
  status: mysqlEnum("status", ["active", "completed", "processing", "archived"]).default("active").notNull(),
  consentObtained: boolean("consentObtained").default(false).notNull(),
  consentMethod: varchar("consentMethod", { length: 64 }),
  consentTimestamp: timestamp("consentTimestamp"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
  durationSeconds: int("durationSeconds"),
  notes: text("notes"),
  // Deal detail fields (Phase 1.3)
  vehicleYear: varchar("vehicleYear", { length: 4 }),
  vehicleMake: varchar("vehicleMake", { length: 64 }),
  vehicleModel: varchar("vehicleModel", { length: 128 }),
  vin: varchar("vin", { length: 17 }),
  salePrice: float("salePrice"),
  tradeValue: float("tradeValue"),
  amountFinanced: float("amountFinanced"),
  lenderName: varchar("lenderName", { length: 255 }),
  apr: float("apr"),
  termMonths: int("termMonths"),
  monthlyPayment: float("monthlyPayment"),
});

// ─── Transcripts ──────────────────────────────────────────────────────────────
export const transcripts = mysqlTable("transcripts", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  dealershipId: int("dealershipId"),
  speaker: mysqlEnum("speaker", ["manager", "customer", "unknown"]).default("unknown").notNull(),
  text: text("text").notNull(),
  startTime: float("startTime"),
  endTime: float("endTime"),
  confidence: float("confidence"),
  isFinal: boolean("isFinal").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  dealershipIdIdx: index("ix_transcripts_dealership_id").on(table.dealershipId),
}));

// ─── Copilot Suggestions ──────────────────────────────────────────────────────
export const copilotSuggestions = mysqlTable("copilot_suggestions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  dealershipId: int("dealershipId"),
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
  scriptId: varchar("scriptId", { length: 64 }),
  priority: mysqlEnum("priority", ["high", "medium", "low"]).default("medium").notNull(),
  wasActedOn: boolean("wasActedOn").default(false),
  usedAt: timestamp("usedAt"),
  usedBy: varchar("usedBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  dealershipIdIdx: index("ix_copilot_suggestions_dealership_id").on(table.dealershipId),
}));

// ─── Compliance Flags ─────────────────────────────────────────────────────────
export const complianceFlags = mysqlTable("compliance_flags", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  dealershipId: int("dealershipId"),
  severity: mysqlEnum("severity", ["critical", "warning", "info"]).default("warning").notNull(),
  rule: varchar("rule", { length: 255 }).notNull(),
  description: text("description").notNull(),
  excerpt: text("excerpt"),
  timestamp: float("timestamp"),
  resolved: boolean("resolved").default(false).notNull(),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  dealershipIdIdx: index("ix_compliance_flags_dealership_id").on(table.dealershipId),
}));

// ─── Performance Grades ───────────────────────────────────────────────────────
export const performanceGrades = mysqlTable("performance_grades", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().unique(),
  userId: int("userId").notNull(),
  dealershipId: int("dealershipId"),
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
  wordTrackUtilizationScore: float("wordTrackUtilizationScore"),
  gradedAt: timestamp("gradedAt").defaultNow().notNull(),
}, (table) => ({
  dealershipIdIdx: index("ix_performance_grades_dealership_id").on(table.dealershipId),
}));

// ─── Audio Recordings ─────────────────────────────────────────────────────────
export const audioRecordings = mysqlTable("audio_recordings", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  dealershipId: int("dealershipId"),
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
}, (table) => ({
  dealershipIdIdx: index("ix_audio_recordings_dealership_id").on(table.dealershipId),
}));

// ─── Coaching Reports ─────────────────────────────────────────────────────────
export const coachingReports = mysqlTable("coaching_reports", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().unique(),
  userId: int("userId").notNull(),
  dealershipId: int("dealershipId"),
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
}, (table) => ({
  dealershipIdIdx: index("ix_coaching_reports_dealership_id").on(table.dealershipId),
}));

// ─── Session Checklists ──────────────────────────────────────────────────────
// Tracks the 17-point F&I process checklist per session (Introduction / Compliance / Menu)
export const sessionChecklists = mysqlTable("session_checklists", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().unique(),
  userId: int("userId").notNull(),
  dealershipId: int("dealershipId"),
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
}, (table) => ({
  dealershipIdIdx: index("ix_session_checklists_dealership_id").on(table.dealershipId),
}));

// ─── Objection Logs ───────────────────────────────────────────────────────────
// Tracks individual objections raised during sessions for Eagle Eye analytics
export const objectionLogs = mysqlTable("objection_logs", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  dealershipId: int("dealershipId"),
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
}, (table) => ({
  dealershipIdIdx: index("ix_objection_logs_dealership_id").on(table.dealershipId),
}));

// ─── Compliance Rules (Custom Rules Builder) ────────────────────────────────
export const complianceRules = mysqlTable("compliance_rules", {
  id: int("id").autoincrement().primaryKey(),
  createdBy: int("createdBy").notNull(),
  dealershipId: int("dealershipId"),
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
}, (table) => ({
  dealershipIdIdx: index("ix_compliance_rules_dealership_id").on(table.dealershipId),
}));

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
  dealershipId: int("dealershipId"),
  action: varchar("action", { length: 128 }).notNull(),
  resourceType: varchar("resourceType", { length: 64 }),
  resourceId: varchar("resourceId", { length: 64 }),
  details: json("details"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  dealershipIdIdx: index("ix_audit_logs_dealership_id").on(table.dealershipId),
}));

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

// ─── User Rooftop Assignments ────────────────────────────────────────────────
export const userRooftopAssignments = mysqlTable("user_rooftop_assignments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dealershipId: int("dealershipId").notNull(),
  isActive: boolean("isActive").notNull().default(true),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
});

// ─── Invitations ──────────────────────────────────────────────────────────────
export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  dealershipId: int("dealershipId").notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  invitedBy: int("invitedBy").notNull(),
  groupId: int("groupId"),
  usedBy: int("usedBy"),
  usedAt: timestamp("usedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DealershipGroup = typeof dealershipGroups.$inferSelect;
export type InsertDealershipGroup = typeof dealershipGroups.$inferInsert;
export type UserRooftopAssignment = typeof userRooftopAssignments.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;

// ─── Dealership Settings ──────────────────────────────────────────────────────
export const dealershipSettings = mysqlTable("dealership_settings", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull().unique(),
  maxSessionDuration: int("maxSessionDuration").notNull().default(120),
  autoGradeEnabled: boolean("autoGradeEnabled").notNull().default(true),
  requireCustomerName: boolean("requireCustomerName").notNull().default(true),
  requireDealNumber: boolean("requireDealNumber").notNull().default(false),
  consentMethod: mysqlEnum("consentMethod", ["verbal", "written", "electronic"]).notNull().default("verbal"),
  // Onboarding step 4 — baseline metrics (the install benchmark for tracking lift):
  vsaPenBaseline: float("vsaPenBaseline"),
  gapPenBaseline: float("gapPenBaseline"),
  appearancePenBaseline: float("appearancePenBaseline"),
  chargebackRateBaseline: float("chargebackRateBaseline"),
  citAgingBaseline: float("citAgingBaseline"),
  // Onboarding step 5 — coaching cadence (the 15-min weekly):
  coachingCadenceDay: varchar("coachingCadenceDay", { length: 10 }),
  coachingCadenceTime: varchar("coachingCadenceTime", { length: 8 }),
  coachingRunBy: mysqlEnum("coachingRunBy", ["fi_director", "asura_coach", "dp", "other"]),
  pru90DayTarget: int("pru90DayTarget"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DealershipSettings = typeof dealershipSettings.$inferSelect;
export type InsertDealershipSettings = typeof dealershipSettings.$inferInsert;

// ─── Customers ────────────────────────────────────────────────────────────────
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  firstName: varchar("firstName", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ─── Product Menu ─────────────────────────────────────────────────────────────
export const productMenu = mysqlTable("product_menu", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  productType: mysqlEnum("productType", [
    "vehicle_service_contract",
    "gap_insurance",
    "prepaid_maintenance",
    "interior_exterior_protection",
    "road_hazard",
    "paintless_dent_repair",
    "key_replacement",
    "windshield_protection",
    "lease_wear_tear",
    "tire_wheel",
    "theft_protection",
    "other",
  ]).notNull(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  providerName: varchar("providerName", { length: 255 }),
  description: text("description"),
  costToDealer: float("costToDealer"),
  retailPrice: float("retailPrice"),
  termMonths: int("termMonths"),
  maxMileage: int("maxMileage"),
  isActive: boolean("isActive").notNull().default(true),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductMenuItem = typeof productMenu.$inferSelect;
export type InsertProductMenuItem = typeof productMenu.$inferInsert;

// ─── Product Intelligence (AI coaching layer) ─────────────────────────────────
export const productIntelligence = mysqlTable("product_intelligence", {
  id: int("id").autoincrement().primaryKey(),
  productType: mysqlEnum("productType", [
    "vehicle_service_contract",
    "gap_insurance",
    "prepaid_maintenance",
    "interior_exterior_protection",
    "road_hazard",
    "paintless_dent_repair",
    "key_replacement",
    "windshield_protection",
    "lease_wear_tear",
    "tire_wheel",
    "theft_protection",
    "other",
  ]).notNull(),
  category: mysqlEnum("category", ["Protection", "Appearance", "Security"]),
  displayName: varchar("displayName", { length: 255 }),
  coverageSummary: text("coverageSummary"),
  commonObjections: text("commonObjections"),
  objectionResponses: text("objectionResponses"),
  sellingPoints: text("sellingPoints"),
  asuraCoachingTips: text("asuraCoachingTips"),
  targetCustomerProfile: text("targetCustomerProfile"),
  avgCloseRate: float("avgCloseRate"),
  avgProfit: float("avgProfit"),
  complianceNotes: text("complianceNotes"),
  costRangeMin: int("costRangeMin"),
  costRangeMax: int("costRangeMax"),
  dealerCost: int("dealerCost"),
  commissionStructure: text("commissionStructure"),
  stateRestrictions: text("stateRestrictions"),
  upsellRelationships: text("upsellRelationships"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductIntelligenceItem = typeof productIntelligence.$inferSelect;
export type InsertProductIntelligenceItem = typeof productIntelligence.$inferInsert;

// ─── Deal Recovery ────────────────────────────────────────────────────────────
export const dealRecovery = mysqlTable("deal_recovery", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  dealershipId: int("dealershipId"),
  productType: mysqlEnum("productType", [
    "vehicle_service_contract",
    "gap_insurance",
    "prepaid_maintenance",
    "interior_exterior_protection",
    "road_hazard",
    "paintless_dent_repair",
    "key_replacement",
    "windshield_protection",
    "lease_wear_tear",
    "tire_wheel",
    "theft_protection",
    "other",
  ]).notNull(),
  declineReason: text("declineReason"),
  recoveryScript: text("recoveryScript"),
  recoveryStatus: mysqlEnum("recoveryStatus", ["pending", "attempted", "recovered", "lost"]).notNull().default("pending"),
  potentialRevenue: float("potentialRevenue"),
  actualRevenue: float("actualRevenue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  dealershipIdIdx: index("ix_deal_recovery_dealership_id").on(table.dealershipId),
}));

export type DealRecoveryItem = typeof dealRecovery.$inferSelect;
export type InsertDealRecoveryItem = typeof dealRecovery.$inferInsert;

// ─── ASURA OPS Scorecards ─────────────────────────────────────────────────────
export const asuraScorecards = mysqlTable("asura_scorecards", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().unique(),
  userId: int("userId").notNull(),
  dealershipId: int("dealershipId"),
  // Tier-1 Score (weighted overall)
  tier1Score: float("tier1Score").notNull(),
  tier: varchar("tier", { length: 32 }).notNull(), // "Tier-1" | "Tier-2" | "Tier-3" | "Below-Tier"
  // Per-pillar scores (0-100)
  menuOrderScore: float("menuOrderScore").notNull(),
  upgradeArchitectureScore: float("upgradeArchitectureScore").notNull(),
  objectionPreventionScore: float("objectionPreventionScore").notNull(),
  coachingCadenceScore: float("coachingCadenceScore").notNull(),
  // Full pillar detail (JSON)
  menuOrderPillar: json("menuOrderPillar"),
  upgradeArchitecturePillar: json("upgradeArchitecturePillar"),
  objectionPreventionPillar: json("objectionPreventionPillar"),
  coachingCadencePillar: json("coachingCadencePillar"),
  // Top coaching priorities
  coachingPriorities: json("coachingPriorities").$type<string[]>(),
  gradedAt: timestamp("gradedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  dealershipIdIdx: index("ix_asura_scorecards_dealership_id").on(table.dealershipId),
}));

export type AsuraScorecard = typeof asuraScorecards.$inferSelect;
export type InsertAsuraScorecard = typeof asuraScorecards.$inferInsert;

// ─── Consent Logs (Phase 5a — two-party recording consent audit trail) ────────
// One row per session. Both customerConsentAt and managerConsentAt must be
// non-null AND revokedAt must be null for Deepgram transcription to start.
// recordingMode reflects the resolved state — "pending" until both consent,
// "recording" when both have, "manager_only" when customer declines or revokes.
export const consentLogs = mysqlTable("consent_logs", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  sessionId: int("sessionId").notNull().unique(),
  customerConsentAt: timestamp("customerConsentAt"),
  managerConsentAt: timestamp("managerConsentAt"),
  consentTextVersion: varchar("consentTextVersion", { length: 32 }).notNull().default("v1"),
  recordingMode: mysqlEnum("recordingMode", ["pending", "recording", "manager_only"]).notNull().default("pending"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  deviceFingerprint: varchar("deviceFingerprint", { length: 256 }),
  revokedAt: timestamp("revokedAt"),
  revocationReason: varchar("revocationReason", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  dealershipIdIdx: index("ix_consent_logs_dealership_id").on(table.dealershipId),
}));

export type ConsentLog = typeof consentLogs.$inferSelect;
export type InsertConsentLog = typeof consentLogs.$inferInsert;

// ─── Data Deletion Requests (Phase 5b — FTC Safeguards Rule + GDPR-style) ─────
// Customer or DP-on-behalf-of-customer can request data deletion. Soft-delete
// window is 30 days (status="pending"); cron flips to status="completed" on
// day 31 and hard-deletes the rows. Cancellation during the window is allowed.
// Scope is either a single sessionId, a customerId (all sessions/transcripts/
// recordings for that customer), or null (whole-customer + email-matched
// records when no internal customerId exists).
export const dataDeletionRequests = mysqlTable("data_deletion_requests", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  customerId: int("customerId"),
  sessionId: int("sessionId"),
  requestedBy: int("requestedBy").notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerName: varchar("customerName", { length: 255 }),
  reason: varchar("reason", { length: 500 }),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).notNull().default("pending"),
  scheduledDeletionAt: timestamp("scheduledDeletionAt").notNull(),
  completedAt: timestamp("completedAt"),
  cancelledAt: timestamp("cancelledAt"),
  cancelledBy: int("cancelledBy"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  dealershipIdIdx: index("ix_ddr_dealership_id").on(table.dealershipId),
  scheduledIdx: index("ix_ddr_scheduled_deletion_at").on(table.scheduledDeletionAt),
}));

export type DataDeletionRequest = typeof dataDeletionRequests.$inferSelect;
export type InsertDataDeletionRequest = typeof dataDeletionRequests.$inferInsert;
