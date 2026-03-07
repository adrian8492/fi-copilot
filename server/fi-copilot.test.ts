import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// vi.mock is hoisted to the top of the file by vitest, so NO top-level variables
// can be referenced inside the factory. All mock values must be inline literals.
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  createSession: vi.fn().mockResolvedValue({
    id: 1, userId: 1, status: "active", dealType: "retail_finance",
    startedAt: new Date(), consentObtained: false, customerName: null,
    dealNumber: null, vehicleType: null, vehicleYear: null, vehicleMake: null,
    vehicleModel: null, salePrice: null, financeAmount: null, endedAt: null,
    durationSeconds: null, notes: null, updatedAt: new Date(),
  }),
  getSessionById: vi.fn().mockResolvedValue({
    id: 1, userId: 1, status: "active", dealType: "retail_finance",
    startedAt: new Date(), consentObtained: false, customerName: null,
    dealNumber: null, vehicleType: null, vehicleYear: null, vehicleMake: null,
    vehicleModel: null, salePrice: null, financeAmount: null, endedAt: null,
    durationSeconds: null, notes: null, updatedAt: new Date(),
  }),
  getSessionsByUserId: vi.fn().mockResolvedValue([]),
  getAllSessions: vi.fn().mockResolvedValue([]),
  endSession: vi.fn().mockResolvedValue(undefined),
  updateSessionStatus: vi.fn().mockResolvedValue(undefined),
  insertTranscript: vi.fn().mockResolvedValue(undefined),
  getTranscriptsBySession: vi.fn().mockResolvedValue([
    { id: 1, sessionId: 1, speaker: "manager", text: "Hello, welcome to our finance office.", startTime: 0, endTime: 3.5, confidence: 0.95, createdAt: new Date() },
  ]),
  searchTranscripts: vi.fn().mockResolvedValue([]),
  insertCopilotSuggestion: vi.fn().mockResolvedValue(undefined),
  getSuggestionsBySession: vi.fn().mockResolvedValue([
    { id: 1, sessionId: 1, type: "objection_handling", title: "GAP Objection", content: "Use the cost-per-day approach", script: "For just $X per day...", framework: "ASURA GAP Script", priority: "high", wasActedOn: false, createdAt: new Date() },
  ]),
  markSuggestionUsed: vi.fn().mockResolvedValue(undefined),
  getSuggestionUtilizationRate: vi.fn().mockResolvedValue({ total: 5, used: 3, rate: 60 }),
  insertComplianceFlag: vi.fn().mockResolvedValue(undefined),
  getFlagsBySession: vi.fn().mockResolvedValue([]),
  resolveFlag: vi.fn().mockResolvedValue(undefined),
  getAllComplianceRules: vi.fn().mockResolvedValue([
    { id: 1, category: "federal_tila", title: "APR Disclosure", description: "Must disclose APR", triggerKeywords: ["APR", "annual percentage rate"], severity: "critical", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]),
  insertComplianceRule: vi.fn().mockResolvedValue(undefined),
  updateComplianceRule: vi.fn().mockResolvedValue(undefined),
  deleteComplianceRule: vi.fn().mockResolvedValue(undefined),
  upsertGrade: vi.fn().mockResolvedValue(undefined),
  getGradeBySession: vi.fn().mockResolvedValue(null),
  getGradesByUser: vi.fn().mockResolvedValue([]),
  insertRecording: vi.fn().mockResolvedValue(undefined),
  getRecordingsBySession: vi.fn().mockResolvedValue([
    { id: 1, sessionId: 1, userId: 1, fileKey: "test.mp3", fileUrl: "https://cdn.example.com/test.mp3", fileName: "test.mp3", mimeType: "audio/mpeg", fileSizeBytes: 1024, durationSeconds: 60, status: "uploaded", transcriptionJobId: null, createdAt: new Date() },
  ]),
  getRecordingsByUser: vi.fn().mockResolvedValue([]),
  updateRecordingStatus: vi.fn().mockResolvedValue(undefined),
  upsertCoachingReport: vi.fn().mockResolvedValue(undefined),
  getReportBySession: vi.fn().mockResolvedValue(null),
  getReportsByUser: vi.fn().mockResolvedValue([]),
  insertAuditLog: vi.fn().mockResolvedValue(undefined),
  getAuditLogs: vi.fn().mockResolvedValue([]),
  getAllUsers: vi.fn().mockResolvedValue([]),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  getAnalyticsSummary: vi.fn().mockResolvedValue({
    totalSessions: 5, completedSessions: 3, avgScore: 78,
    avgPvr: 1200, criticalFlags: 1, totalGrades: 3,
    avgPpd: 2.4, scriptFidelityAvg: 72, wordTrackUtilizationRate: 60,
  }),
  getGradeTrend: vi.fn().mockResolvedValue([
    { week: "2026-W01", avgScore: 75 },
    { week: "2026-W02", avgScore: 80 },
  ]),
  getEagleEyeLeaderboard: vi.fn().mockResolvedValue([
    { userId: 1, name: "Test Manager", score: 82, pvr: 1400, ppd: 2.5, dealCount: 10, recordingLengthMinutes: 45, utilizationRate: 70, scriptFidelityScore: 78 },
  ]),
  getEagleEyeTrends: vi.fn().mockResolvedValue({
    groupTrend: [{ week: "2026-W01", avgScore: 80 }],
    managerTrends: { "Test Manager": [{ week: "2026-W01", score: 82 }] },
    scriptFidelityTrend: [{ week: "2026-W01", fidelity: 78 }],
  }),
  getObjectionsBySession: vi.fn().mockResolvedValue([]),
  insertObjectionLog: vi.fn().mockResolvedValue({ id: 1, sessionId: 1, userId: 1, product: "gap_insurance", concernType: "cost", excerpt: null, wasResolved: false, resolutionMethod: null, createdAt: new Date() }),
  upsertSessionChecklist: vi.fn().mockResolvedValue(undefined),
  getChecklistBySession: vi.fn().mockResolvedValue(null),
  getPvrTrend: vi.fn().mockResolvedValue([{ week: "2026-W01", avgPvr: 1200, avgPpd: 2.4 }]),
  getProductMix: vi.fn().mockResolvedValue([{ product: "GAP", count: 5 }]),
  getSessionVolume: vi.fn().mockResolvedValue([{ week: "2026-W01", count: 3 }]),
  createInvitation: vi.fn().mockResolvedValue({ token: "abc123token", expiresAt: new Date(Date.now() + 7 * 86400000) }),
  getInvitationByToken: vi.fn().mockResolvedValue({ id: 1, token: "abc123token", email: "test@dealership.com", dealershipId: 1, role: "user", invitedBy: 1, usedBy: null, usedAt: null, expiresAt: new Date(Date.now() + 7 * 86400000), createdAt: new Date() }),
  redeemInvitation: vi.fn().mockResolvedValue({ id: 1, token: "abc123token", dealershipId: 1, role: "user" }),
  getInvitationsByDealership: vi.fn().mockResolvedValue([{ id: 1, token: "abc123token", email: "test@dealership.com", dealershipId: 1, role: "user", invitedBy: 1, usedBy: null, usedAt: null, expiresAt: new Date(Date.now() + 7 * 86400000), createdAt: new Date() }]),
  revokeInvitation: vi.fn().mockResolvedValue(undefined),
  getObjectionAnalysisByProduct: vi.fn().mockResolvedValue([{ product: "gap_insurance", total: 10, resolved: 7, resolutionRate: 70 }]),
  getObjectionAnalysisByConcern: vi.fn().mockResolvedValue([{ concernType: "cost", total: 8, resolved: 5, resolutionRate: 62.5 }]),
  getAllDealerships: vi.fn().mockResolvedValue([{ id: 1, name: "Test Dealership", slug: "test-dealership", plan: "beta", isActive: true, createdAt: new Date() }]),
  createDealership: vi.fn().mockResolvedValue(undefined),
  updateDealership: vi.fn().mockResolvedValue(undefined),
  assignUserToDealership: vi.fn().mockResolvedValue(undefined),
  getManagerScorecard: vi.fn().mockResolvedValue({ avgOverall: 82, avgPvr: 1400, avgCompliance: 88, avgWordTrack: 65, sessionCount: 12, avgScriptFidelity: 72, weeklyData: [{ week: "2026-W01", overall: 80, pvr: 1300, compliance: 85, wordTrack: 60, sessions: 3, scriptFidelity: 70 }] }),
  getActiveComplianceRules: vi.fn().mockResolvedValue([{ id: 1, category: "custom", title: "No Pressure Language", description: "Avoid pressure tactics", triggerKeywords: ["you must buy", "required purchase"], requiredPhrase: null, severity: "critical", weight: 1.0, isActive: true, dealStage: null, createdBy: 1, createdAt: new Date(), updatedAt: new Date() }]),
  updateSessionNotes: vi.fn().mockResolvedValue(undefined),
  searchSessions: vi.fn().mockResolvedValue([]),
  getSessionComparison: vi.fn().mockResolvedValue({ session1: null, session2: null }),
  getComplianceTrend: vi.fn().mockResolvedValue([]),
  getSystemUsageStats: vi.fn().mockResolvedValue({ totalUsers: 5, activeSessions: 2, totalSessions: 50 }),
  getSessionsByIds: vi.fn().mockResolvedValue([]),
  getComplianceFlags: vi.fn().mockResolvedValue([]),
  deleteTranscriptsBySession: vi.fn().mockResolvedValue(0),
  // ─── Multi-tenant DB functions ───────────────────────────────────────────
  createDealershipGroup: vi.fn().mockResolvedValue({ id: 1, name: "Test Group", slug: "test-group", isActive: true }),
  getAllDealershipGroups: vi.fn().mockResolvedValue([]),
  getDealershipGroup: vi.fn().mockResolvedValue(null),
  updateDealershipGroup: vi.fn().mockResolvedValue(undefined),
  getDealershipsByGroup: vi.fn().mockResolvedValue([]),
  assignUserToRooftop: vi.fn().mockResolvedValue(undefined),
  removeUserFromRooftop: vi.fn().mockResolvedValue(undefined),
  getUserRooftops: vi.fn().mockResolvedValue([]),
  getRooftopUsers: vi.fn().mockResolvedValue([]),
  getUserAccessibleDealershipIds: vi.fn().mockResolvedValue([]),
  switchUserRooftop: vi.fn().mockResolvedValue(true),
  getAllUsersByDealershipIds: vi.fn().mockResolvedValue([]),
  getAllSessionsByDealershipIds: vi.fn().mockResolvedValue([]),
  getGroupIdForUser: vi.fn().mockResolvedValue(null),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "https://cdn.example.com/test.mp3" }),
  storageGet: vi.fn().mockResolvedValue({ key: "test-key", url: "https://cdn.example.com/test.mp3" }),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          overallScore: 82, rapportScore: 85, complianceScore: 90,
          productPresentationScore: 78, objectionHandlingScore: 80,
          closingTechniqueScore: 77, utilizationRate: 0.75,
          scriptFidelityScore: 72, processAdherenceScore: 75,
          menuSequenceScore: 70, objectionResponseScore: 68,
          transitionAccuracyScore: 74,
          strengths: "Strong rapport building",
          improvements: "Work on closing technique",
          keyMoments: [], recommendations: ["Practice closing scripts"],
        }),
      },
    }],
  }),
}));

vi.mock("./_core/voiceTranscription", () => ({
  transcribeAudio: vi.fn().mockResolvedValue({
    text: "Hello, welcome to our finance office.",
    language: "en",
    segments: [{ id: 0, start: 0, end: 3.5, text: "Hello, welcome to our finance office.", avg_logprob: -0.2, no_speech_prob: 0.01 }],
  }),
}));

// ─── Context helpers ─────────────────────────────────────────────────────────
function makeCtx(overrides: Partial<TrpcContext> = {}): TrpcContext {
  return {
    user: {
      id: 1, openId: "test-open-id", name: "Test F&I Manager",
      email: "test@dealership.com", loginMethod: "manus", role: "user",
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    ...overrides,
  };
}

function makeAdminCtx(): TrpcContext {
  return makeCtx({ user: { ...makeCtx().user!, role: "admin" } });
}

// ─── Auth ────────────────────────────────────────────────────────────────────
describe("auth.me", () => {
  it("returns the current user when authenticated", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const user = await caller.auth.me();
    expect(user?.name).toBe("Test F&I Manager");
    expect(user?.role).toBe("user");
  });

  it("returns null when not authenticated", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: null }));
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});

// ─── Sessions ────────────────────────────────────────────────────────────────
describe("sessions.create", () => {
  it("creates a session with required fields", async () => {
    const { getSessionsByUserId } = await import("./db");
    vi.mocked(getSessionsByUserId).mockResolvedValueOnce([{
      id: 1, userId: 1, status: "active", dealType: "retail_finance",
      startedAt: new Date(), consentObtained: false, customerName: "John Smith",
      dealNumber: null, vehicleType: null, vehicleYear: null, vehicleMake: null,
      vehicleModel: null, salePrice: null, financeAmount: null, endedAt: null,
      durationSeconds: null, notes: null, updatedAt: new Date(),
    }]);
    const caller = appRouter.createCaller(makeCtx());
    const session = await caller.sessions.create({ customerName: "John Smith", dealType: "retail_finance", consentObtained: true, consentMethod: "verbal" });
    expect(session?.id).toBe(1);
    expect(session?.status).toBe("active");
  });

  it("throws UNAUTHORIZED when not logged in", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: null }));
    await expect(caller.sessions.create({ dealType: "retail_finance", consentObtained: true, consentMethod: "verbal" })).rejects.toThrow();
  });

  it("creates a session with customer name and deal number", async () => {
    const { getSessionsByUserId } = await import("./db");
    vi.mocked(getSessionsByUserId).mockResolvedValueOnce([{
      id: 2, userId: 1, status: "active", dealType: "lease",
      startedAt: new Date(), consentObtained: true, customerName: "Jane Doe",
      dealNumber: "D-2024-001", vehicleType: "new", vehicleYear: null, vehicleMake: null,
      vehicleModel: null, salePrice: null, financeAmount: null, endedAt: null,
      durationSeconds: null, notes: null, updatedAt: new Date(),
    }]);
    const caller = appRouter.createCaller(makeCtx());
    const session = await caller.sessions.create({
      customerName: "Jane Doe",
      dealNumber: "D-2024-001",
      vehicleType: "new",
      dealType: "lease",
      consentObtained: true,
      consentMethod: "verbal",
    });
    expect(session?.id).toBe(2);
  });
});

describe("sessions.list", () => {
  it("returns an array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const sessions = await caller.sessions.list({ limit: 10, offset: 0 });
    expect(Array.isArray(sessions)).toBe(true);
  });
});

describe("sessions.get", () => {
  it("returns a session by ID", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const session = await caller.sessions.get({ id: 1 });
    expect(session?.id).toBe(1);
  });

  it("throws NOT_FOUND for non-existent session", async () => {
    const { getSessionById } = await import("./db");
    vi.mocked(getSessionById).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.sessions.get({ id: 9999 })).rejects.toThrow();
  });
});

// ─── Transcripts ─────────────────────────────────────────────────────────────
describe("transcripts.getBySession", () => {
  it("returns transcripts for a valid session", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const transcripts = await caller.transcripts.getBySession({ sessionId: 1 });
    expect(Array.isArray(transcripts)).toBe(true);
  });
});

describe("transcripts.markUsed", () => {
  it("marks a suggestion as used", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.transcripts.markUsed({ suggestionId: 1, wasActedOn: true });
    expect(result.success).toBe(true);
  });

  it("throws UNAUTHORIZED when not logged in", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: null }));
    await expect(caller.transcripts.markUsed({ suggestionId: 1, wasActedOn: true })).rejects.toThrow();
  });
});

describe("transcripts.getUtilization", () => {
  it("returns utilization stats for a session", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const stats = await caller.transcripts.getUtilization({ sessionId: 1 });
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("used");
    expect(stats).toHaveProperty("rate");
  });
});

// ─── Compliance ──────────────────────────────────────────────────────────────
describe("compliance.getFlags", () => {
  it("returns compliance flags array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const flags = await caller.compliance.getFlags({ sessionId: 1 });
    expect(Array.isArray(flags)).toBe(true);
  });
});

describe("compliance.getRules", () => {
  it("returns compliance rules array for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const rules = await caller.compliance.getRules();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
  });

  it("returns rules with required fields", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const rules = await caller.compliance.getRules();
    const rule = rules[0];
    expect(rule).toHaveProperty("id");
    expect(rule).toHaveProperty("category");
    expect(rule).toHaveProperty("title");
    expect(rule).toHaveProperty("severity");
    expect(rule).toHaveProperty("isActive");
  });

  it("throws FORBIDDEN for non-admin", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.compliance.getRules()).rejects.toThrow();
  });
});

describe("compliance.createRule", () => {
  it("allows admin to create a compliance rule", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.compliance.createRule({
      category: "federal_ecoa",
      title: "Credit Score Disclosure",
      description: "Must disclose credit score used",
      triggerKeywords: ["credit score", "FICO"],
      severity: "warning",
    });
    expect(result.success).toBe(true);
  });

  it("throws FORBIDDEN for non-admin", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.compliance.createRule({
      category: "federal_ecoa",
      title: "Test",
      description: "Test",
      triggerKeywords: [],
      severity: "warning",
    })).rejects.toThrow();
  });
});

describe("compliance.deleteRule", () => {
  it("allows admin to delete a compliance rule", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.compliance.deleteRule({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("throws FORBIDDEN for non-admin", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.compliance.deleteRule({ id: 1 })).rejects.toThrow();
  });
});

// ─── Grades ──────────────────────────────────────────────────────────────────
describe("grades.get", () => {
  it("returns null when no grade exists", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const grade = await caller.grades.get({ sessionId: 1 });
    expect(grade).toBeNull();
  });
});

describe("grades.generate", () => {
  it("generates a grade using LLM for a session with transcripts", async () => {
    const { getSessionById, getTranscriptsBySession } = await import("./db");
    vi.mocked(getSessionById).mockResolvedValueOnce({
      id: 1, userId: 1, status: "completed", dealType: "retail_finance",
      startedAt: new Date(), consentObtained: true, customerName: "John Smith",
      dealNumber: null, vehicleType: null, vehicleYear: null, vehicleMake: null,
      vehicleModel: null, salePrice: null, financeAmount: null, endedAt: null,
      durationSeconds: null, notes: null, updatedAt: new Date(),
    });
    vi.mocked(getTranscriptsBySession).mockResolvedValueOnce([
      { id: 1, sessionId: 1, speaker: "manager", text: "Hello, welcome to our finance office. Let me review your options today.", startTime: 0, endTime: 5, confidence: 0.95, createdAt: new Date() },
      { id: 2, sessionId: 1, speaker: "customer", text: "Okay, sounds good.", startTime: 5, endTime: 7, confidence: 0.92, createdAt: new Date() },
    ]);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.grades.generate({ sessionId: 1 });
    expect(result.overallScore).toBe(82);
    expect(result.rapportScore).toBe(85);
    expect(result.complianceScore).toBe(90);
  });

  it("includes Script Fidelity Score in generated grade", async () => {
    const { getSessionById, getTranscriptsBySession } = await import("./db");
    vi.mocked(getSessionById).mockResolvedValueOnce({
      id: 1, userId: 1, status: "completed", dealType: "retail_finance",
      startedAt: new Date(), consentObtained: true, customerName: "Test Customer",
      dealNumber: "D-001", vehicleType: "new", vehicleYear: null, vehicleMake: null,
      vehicleModel: null, salePrice: null, financeAmount: null, endedAt: null,
      durationSeconds: null, notes: null, updatedAt: new Date(),
    });
    vi.mocked(getTranscriptsBySession).mockResolvedValueOnce([
      { id: 1, sessionId: 1, speaker: "manager", text: "Let me present your menu options. The VSC will cover your engine and transmission.", startTime: 0, endTime: 8, confidence: 0.95, createdAt: new Date() },
    ]);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.grades.generate({ sessionId: 1 });
    expect(result).toHaveProperty("scriptFidelityScore");
    expect(typeof result.scriptFidelityScore).toBe("number");
  });
});

// ─── Objections ──────────────────────────────────────────────────────────────
describe("objections.log", () => {
  it("logs an objection for a session", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.objections.log({
      sessionId: 1,
      product: "gap_insurance",
      concernType: "cost",
      excerpt: "I don't need GAP insurance",
      wasResolved: false,
    });
    expect(result).toHaveProperty("id");
    expect(result.product).toBe("gap_insurance");
  });

  it("throws UNAUTHORIZED when not logged in", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: null }));
    await expect(caller.objections.log({
      sessionId: 1,
      product: "gap_insurance",
      concernType: "cost",
    })).rejects.toThrow();
  });
});

describe("objections.getBySession", () => {
  it("returns objection logs array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const logs = await caller.objections.getBySession({ sessionId: 1 });
    expect(Array.isArray(logs)).toBe(true);
  });
});

// ─── Checklists ──────────────────────────────────────────────────────────────
describe("checklists.upsert", () => {
  it("saves checklist state for a session and returns the record", async () => {
    const { upsertSessionChecklist } = await import("./db");
    vi.mocked(upsertSessionChecklist).mockResolvedValueOnce({
      id: 1, sessionId: 1, userId: 1,
      fiManagerGreeting: true, statedTitleWork: true, statedFactoryWarranty: false,
      statedFinancialOptions: true, statedTimeFrame: false, introductionToFirstForms: true,
      privacyPolicyMentioned: true, riskBasedPricingMentioned: false, disclosedBasePayment: true,
      presentedPrepaidMaintenance: true, presentedVehicleServiceContract: true, presentedGap: true,
      presentedInteriorExteriorProtection: false, presentedRoadHazard: false,
      presentedPaintlessDentRepair: false, customerQuestionsAddressed: true,
      whichClosingQuestionAsked: true, introductionScore: 83, disclosureScore: 50,
      productPresentationScore: 57, closingScore: 100, overallChecklistScore: 73,
      updatedAt: new Date(),
    } as any);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.checklists.upsert({
      sessionId: 1,
      fiManagerGreeting: true,
      statedTitleWork: true,
      statedFactoryWarranty: false,
      statedFinancialOptions: true,
      statedTimeFrame: false,
      introductionToFirstForms: true,
      privacyPolicyMentioned: true,
      riskBasedPricingMentioned: false,
      disclosedBasePayment: true,
      presentedPrepaidMaintenance: true,
      presentedVehicleServiceContract: true,
      presentedGap: true,
      presentedInteriorExteriorProtection: false,
      presentedRoadHazard: false,
      presentedPaintlessDentRepair: false,
      customerQuestionsAddressed: true,
      whichClosingQuestionAsked: true,
    });
    expect(result).toHaveProperty("sessionId");
    expect(result?.sessionId).toBe(1);
  });
});

// ─── Recordings ──────────────────────────────────────────────────────────────
describe("recordings.upload", () => {
  it("uploads a recording and returns the stored record", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const recording = await caller.recordings.upload({
      sessionId: 1, fileName: "test-recording.mp3", mimeType: "audio/mpeg",
      fileSizeBytes: 524288, fileDataBase64: btoa("fake-audio-data"),
    });
    expect(recording.id).toBe(1);
    expect(recording.fileUrl).toContain("https://");
  });
});

describe("recordings.getBySession", () => {
  it("returns recordings array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const recordings = await caller.recordings.getBySession({ sessionId: 1 });
    expect(Array.isArray(recordings)).toBe(true);
    expect(recordings.length).toBeGreaterThan(0);
  });
});

// ─── Analytics ───────────────────────────────────────────────────────────────
describe("analytics.summary", () => {
  it("returns summary statistics", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const summary = await caller.analytics.summary();
    expect(summary.totalSessions).toBe(5);
    expect(summary.avgScore).toBe(78);
    expect(summary.criticalFlags).toBe(1);
  });

  it("returns extended KPI fields including PPD and Script Fidelity", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const summary = await caller.analytics.summary();
    expect(summary).toHaveProperty("avgPpd");
    expect(summary).toHaveProperty("scriptFidelityAvg");
    expect(summary).toHaveProperty("wordTrackUtilizationRate");
  });
});

describe("analytics.myGradeTrend", () => {
  it("returns an array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const trend = await caller.analytics.myGradeTrend({ limit: 10 });
    expect(Array.isArray(trend)).toBe(true);
  });
});

describe("analytics.pvrTrend", () => {
  it("returns PVR trend data", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const trend = await caller.analytics.pvrTrend({ weeks: 8 });
    expect(Array.isArray(trend)).toBe(true);
  });
});

describe("analytics.productMix", () => {
  it("returns product mix data", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const mix = await caller.analytics.productMix({ weeks: 8 });
    expect(Array.isArray(mix)).toBe(true);
  });
});

describe("analytics.sessionVolume", () => {
  it("returns session volume data", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const volume = await caller.analytics.sessionVolume({ weeks: 8 });
    expect(Array.isArray(volume)).toBe(true);
  });
});

// ─── Eagle Eye ───────────────────────────────────────────────────────────────
describe("eagleEye.leaderboard", () => {
  it("returns leaderboard data for authenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const board = await caller.eagleEye.leaderboard({});
    expect(Array.isArray(board)).toBe(true);
  });

  it("returns leaderboard entries with Script Fidelity Score", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const board = await caller.eagleEye.leaderboard({});
    if (board.length > 0) {
      expect(board[0]).toHaveProperty("scriptFidelityScore");
    }
  });

  it("throws UNAUTHORIZED when not logged in", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: null }));
    await expect(caller.eagleEye.leaderboard({})).rejects.toThrow();
  });
});

describe("eagleEye.trends", () => {
  it("returns trend data including Script Fidelity trend", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const trends = await caller.eagleEye.trends({});
    expect(trends).toHaveProperty("groupTrend");
    expect(trends).toHaveProperty("managerTrends");
    expect(trends).toHaveProperty("scriptFidelityTrend");
  });
});

// ─── Admin ───────────────────────────────────────────────────────────────────
describe("admin.listUsers", () => {
  it("allows admin to list users", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const users = await caller.admin.listUsers();
    expect(Array.isArray(users)).toBe(true);
  });

  it("throws FORBIDDEN for non-admin", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.admin.listUsers()).rejects.toThrow();
  });
});

describe("admin.auditLogs", () => {
  it("allows admin to view audit logs", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const logs = await caller.admin.auditLogs({ limit: 10, offset: 0 });
    expect(Array.isArray(logs)).toBe(true);
  });

  it("throws FORBIDDEN for non-admin", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.admin.auditLogs({ limit: 10, offset: 0 })).rejects.toThrow();
  });
});

describe("admin.updateRole", () => {
  it("allows admin to update a user role", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.updateRole({ userId: 2, role: "admin" });
    expect(result.success).toBe(true);
  });

  it("throws FORBIDDEN for non-admin", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.admin.updateRole({ userId: 2, role: "admin" })).rejects.toThrow();
  });
});

// ─── Reports ─────────────────────────────────────────────────────────────────
describe("reports.get", () => {
  it("returns null when no coaching report exists", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const report = await caller.reports.get({ sessionId: 1 });
    expect(report).toBeNull();
  });
});
// ─── Invitations ─────────────────────────────────────────────────────────────
describe("invitations.create", () => {
  it("allows admin to create an invitation", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.invitations.create({
      email: "newmanager@dealership.com",
      dealershipId: 1,
      role: "user",
      expiresInDays: 7,
      origin: "https://app.example.com",
    });
    expect(result).toHaveProperty("token");
    expect(result).toHaveProperty("inviteUrl");
    expect(result.inviteUrl).toContain("/join?token=");
  });
  it("throws FORBIDDEN for non-admin", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.invitations.create({
      dealershipId: 1,
      role: "user",
      expiresInDays: 7,
      origin: "https://app.example.com",
    })).rejects.toThrow();
  });
});
describe("invitations.list", () => {
  it("allows admin to list invitations for a dealership", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const list = await caller.invitations.list({ dealershipId: 1 });
    expect(Array.isArray(list)).toBe(true);
  });
  it("throws FORBIDDEN for non-admin", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.invitations.list({ dealershipId: 1 })).rejects.toThrow();
  });
});
describe("invitations.validate", () => {
  it("returns valid=true for a valid token", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: null }));
    const result = await caller.invitations.validate({ token: "abc123token" });
    expect(result.valid).toBe(true);
    expect(result.email).toBe("test@dealership.com");
  });
  it("returns valid=false for a non-existent token", async () => {
    const { getInvitationByToken } = await import("./db");
    vi.mocked(getInvitationByToken).mockResolvedValueOnce(null);
    const caller = appRouter.createCaller(makeCtx({ user: null }));
    const result = await caller.invitations.validate({ token: "badtoken" });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("not_found");
  });
  it("returns valid=false for an already-used token", async () => {
    const { getInvitationByToken } = await import("./db");
    vi.mocked(getInvitationByToken).mockResolvedValueOnce({
      id: 1, token: "usedtoken", email: "used@dealership.com", dealershipId: 1,
      role: "user", invitedBy: 1, usedBy: 2, usedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 86400000), createdAt: new Date(),
    });
    const caller = appRouter.createCaller(makeCtx({ user: null }));
    const result = await caller.invitations.validate({ token: "usedtoken" });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("already_used");
  });
  it("returns valid=false for an expired token", async () => {
    const { getInvitationByToken } = await import("./db");
    vi.mocked(getInvitationByToken).mockResolvedValueOnce({
      id: 1, token: "expiredtoken", email: "expired@dealership.com", dealershipId: 1,
      role: "user", invitedBy: 1, usedBy: null, usedAt: null,
      expiresAt: new Date(Date.now() - 86400000), createdAt: new Date(),
    });
    const caller = appRouter.createCaller(makeCtx({ user: null }));
    const result = await caller.invitations.validate({ token: "expiredtoken" });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("expired");
  });
});
describe("invitations.redeem", () => {
  it("allows authenticated user to redeem a valid token", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.invitations.redeem({ token: "abc123token" });
    expect(result.success).toBe(true);
    expect(result.dealershipId).toBe(1);
  });
  it("throws UNAUTHORIZED when not logged in", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: null }));
    await expect(caller.invitations.redeem({ token: "abc123token" })).rejects.toThrow();
  });
});
describe("invitations.revoke", () => {
  it("allows admin to revoke an invitation", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.invitations.revoke({ id: 1 });
    expect(result.success).toBe(true);
  });
  it("throws FORBIDDEN for non-admin", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.invitations.revoke({ id: 1 })).rejects.toThrow();
  });
});


// ─── Session Export ──────────────────────────────────────────────────────────
describe("sessions.exportSession", () => {
  it("exports session data as JSON", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.sessions.exportSession({ sessionId: 1, format: "json" });
    expect(result.format).toBe("json");
    expect(result.filename).toContain("session-1");
    expect(result.filename).toContain(".json");
    expect(typeof result.data).toBe("string");
    const parsed = JSON.parse(result.data);
    expect(parsed.session.id).toBe(1);
    expect(parsed.exportedAt).toBeDefined();
  });

  it("exports session data as CSV", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.sessions.exportSession({ sessionId: 1, format: "csv" });
    expect(result.format).toBe("csv");
    expect(result.filename).toContain(".csv");
    expect(result.data).toContain("Speaker,Text,StartTime,EndTime,Confidence");
  });

  it("throws NOT_FOUND for non-existent session", async () => {
    const { getSessionById } = await import("./db");
    vi.mocked(getSessionById).mockResolvedValueOnce(undefined as any);
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.sessions.exportSession({ sessionId: 999, format: "json" })).rejects.toThrow();
  });

  it("throws UNAUTHORIZED when not logged in", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: null }));
    await expect(caller.sessions.exportSession({ sessionId: 1, format: "json" })).rejects.toThrow();
  });
});

// ─── System Validation ───────────────────────────────────────────────────────
describe("admin.systemValidation", () => {
  it("returns system health checks for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.systemValidation();
    expect(result.status).toBeDefined();
    expect(result.checks).toBeInstanceOf(Array);
    expect(result.checks.length).toBeGreaterThan(0);
    expect(result.timestamp).toBeGreaterThan(0);
    // Every check should have name, status, detail
    for (const check of result.checks) {
      expect(check.name).toBeDefined();
      expect(["pass", "fail", "warn"]).toContain(check.status);
      expect(check.detail).toBeDefined();
    }
  });

  it("checks Deepgram API key presence", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.systemValidation();
    const deepgramCheck = result.checks.find(c => c.name.includes("Deepgram"));
    expect(deepgramCheck).toBeDefined();
  });

  it("checks LLM API key presence", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.systemValidation();
    const llmCheck = result.checks.find(c => c.name.includes("LLM"));
    expect(llmCheck).toBeDefined();
  });

  it("checks compliance engine status", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.systemValidation();
    const complianceCheck = result.checks.find(c => c.name.includes("Compliance"));
    expect(complianceCheck).toBeDefined();
    expect(complianceCheck!.status).toBe("pass");
  });

  it("checks ASURA script library status", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.systemValidation();
    const asuraCheck = result.checks.find(c => c.name.includes("ASURA"));
    expect(asuraCheck).toBeDefined();
    expect(asuraCheck!.status).toBe("pass");
  });

  it("throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.admin.systemValidation()).rejects.toThrow();
  });
});

// ─── Objection Analysis ──────────────────────────────────────────────────────
describe("objections.analysisByProduct", () => {
  it("returns product-level objection analysis", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.objections.analysisByProduct({});
    expect(result).toBeInstanceOf(Array);
    expect(result[0].product).toBe("gap_insurance");
    expect(result[0].total).toBe(10);
  });
});

describe("objections.analysisByConcern", () => {
  it("returns concern-type objection analysis", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.objections.analysisByConcern({});
    expect(result).toBeInstanceOf(Array);
    expect(result[0].concernType).toBe("cost");
  });
});

// ─── Dealerships ─────────────────────────────────────────────────────────────
describe("admin.listDealerships", () => {
  it("returns dealership list for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.listDealerships();
    expect(result).toBeInstanceOf(Array);
    expect(result[0].name).toBe("Test Dealership");
  });

  it("throws FORBIDDEN for non-admin", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.admin.listDealerships()).rejects.toThrow();
  });
});

describe("admin.createDealership", () => {
  it("creates a dealership for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    // createDealership returns the dealership object from db, not { success: true }
    await expect(caller.admin.createDealership({ name: "New Dealership", slug: "new-dealership" })).resolves.not.toThrow();
  });

  it("throws FORBIDDEN for non-admin", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.admin.createDealership({ name: "New", slug: "new" })).rejects.toThrow();
  });
});

describe("admin.assignUserToDealership", () => {
  it("assigns user to dealership for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.assignUserToDealership({ userId: 1, dealershipId: 1 });
    expect(result.success).toBe(true);
  });

  it("throws FORBIDDEN for non-admin", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.admin.assignUserToDealership({ userId: 1, dealershipId: 1 })).rejects.toThrow();
  });
});

// ─── Session End ─────────────────────────────────────────────────────────────
describe("sessions.end", () => {
  it("ends a session with duration", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.sessions.end({ id: 1, durationSeconds: 120 });
    expect(result.success).toBe(true);
  });

  it("throws UNAUTHORIZED when not logged in", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: null }));
    await expect(caller.sessions.end({ id: 1, durationSeconds: 120 })).rejects.toThrow();
  });

  it("throws NOT_FOUND for non-existent session", async () => {
    const { getSessionById } = await import("./db");
    vi.mocked(getSessionById).mockResolvedValueOnce(undefined as any);
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.sessions.end({ id: 999, durationSeconds: 120 })).rejects.toThrow();
  });
});

// ─── Checklist Get ───────────────────────────────────────────────────────────
describe("checklists.get", () => {
  it("returns checklist for a session", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.checklists.get({ sessionId: 1 });
    expect(result).toBeNull(); // mock returns null
  });
});

// ─── Compliance Resolve ──────────────────────────────────────────────────────
describe("compliance.resolveFlag", () => {
  it("resolves a compliance flag", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.compliance.resolveFlag({ flagId: 1 });
    expect(result.success).toBe(true);
  });

  it("throws UNAUTHORIZED when not logged in", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: null }));
    await expect(caller.compliance.resolveFlag({ flagId: 1 })).rejects.toThrow();
  });
});


// ─── Overnight Sprint: New Feature Tests ────────────────────────────────────

describe("sessions.updateNotes", () => {
  it("should update session notes successfully", async () => {
    const { updateSessionNotes } = await import("./db");
    (updateSessionNotes as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.sessions.updateNotes({
      sessionId: 1,
      notes: "Customer was very interested in GAP insurance"
    });
    expect(updateSessionNotes).toHaveBeenCalledWith(1, "Customer was very interested in GAP insurance");
    expect(result).toBeUndefined();
  });

  it("should handle empty notes", async () => {
    const { updateSessionNotes } = await import("./db");
    (updateSessionNotes as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.sessions.updateNotes({
      sessionId: 1,
      notes: ""
    });
    expect(updateSessionNotes).toHaveBeenCalledWith(1, "");
    expect(result).toBeUndefined();
  });
});

describe("sessions.search", () => {
  it("should return search results", async () => {
    const { searchSessions } = await import("./db");
    const mockResults = [
      { id: 1, userId: 1, status: "completed", customerName: "John Doe", dealNumber: "D12345", startedAt: new Date() }
    ];
    (searchSessions as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResults);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.sessions.search({
      query: "Toyota",
      limit: 10
    });
    expect(searchSessions).toHaveBeenCalledWith("Toyota", 1, 10);
    expect(result).toEqual(mockResults);
  });

  it("should use default limit when not specified", async () => {
    const { searchSessions } = await import("./db");
    (searchSessions as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.sessions.search({ query: "test" });
    expect(searchSessions).toHaveBeenCalledWith("test", 1, 20);
    expect(result).toEqual([]);
  });
});

describe("sessions.compare", () => {
  it("should return comparison of both sessions", async () => {
    const { getSessionComparison } = await import("./db");
    const mockComparison = {
      session1: { sessions: { id: 1, customerName: "John" }, performance_grades: { overallScore: 85 } },
      session2: { sessions: { id: 2, customerName: "Jane" }, performance_grades: { overallScore: 78 } }
    };
    (getSessionComparison as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockComparison);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.sessions.compare({ sessionId1: 1, sessionId2: 2 });
    expect(getSessionComparison).toHaveBeenCalledWith(1, 2);
    expect(result).toEqual(mockComparison);
  });

  it("should handle missing session", async () => {
    const { getSessionComparison } = await import("./db");
    const mockComparison = { session1: null, session2: null };
    (getSessionComparison as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockComparison);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.sessions.compare({ sessionId1: 999, sessionId2: 998 });
    expect(result.session1).toBeNull();
    expect(result.session2).toBeNull();
  });
});

describe("analytics.complianceTrend", () => {
  it("should return compliance trend data", async () => {
    const { getComplianceTrend } = await import("./db");
    const mockTrend = [
      { date: "2026-01-01", flagCount: 2, severity: "critical" },
      { date: "2026-01-02", flagCount: 1, severity: "warning" }
    ];
    (getComplianceTrend as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTrend);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.analytics.complianceTrend({ days: 7 });
    expect(getComplianceTrend).toHaveBeenCalledWith(1, 7);
    expect(result).toEqual(mockTrend);
  });

  it("should use default 30 days when not specified", async () => {
    const { getComplianceTrend } = await import("./db");
    (getComplianceTrend as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.analytics.complianceTrend({});
    expect(getComplianceTrend).toHaveBeenCalledWith(1, 30);
    expect(result).toEqual([]);
  });
});

// ─── Bulk Export ─────────────────────────────────────────────────────────────
describe("sessions.bulkExport", () => {
  it("exports sessions in JSON format", async () => {
    const { getSessionsByIds } = await import("./db");
    vi.mocked(getSessionsByIds).mockResolvedValueOnce([
      { sessions: { id: 1, customerName: "John Smith", dealType: "retail_finance", status: "completed", startedAt: new Date(), dealNumber: "D001", durationSeconds: 600 }, performance_grades: { overallScore: 85 } },
      { sessions: { id: 2, customerName: "Jane Doe", dealType: "lease", status: "active", startedAt: new Date(), dealNumber: "D002", durationSeconds: 300 }, performance_grades: null }
    ] as any);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.sessions.bulkExport({ sessionIds: [1, 2], format: "json" });
    expect(result.filename).toContain("bulk-export");
    expect(result.data).toContain("John Smith");
  });

  it("exports sessions in CSV format", async () => {
    const { getSessionsByIds } = await import("./db");
    vi.mocked(getSessionsByIds).mockResolvedValueOnce([
      { sessions: { id: 1, customerName: "John Smith", dealType: "retail_finance", status: "completed", startedAt: new Date(), dealNumber: "D001", durationSeconds: 600 }, performance_grades: { overallScore: 85 } }
    ] as any);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.sessions.bulkExport({ sessionIds: [1], format: "csv" });
    expect(typeof result.data).toBe("string");
    expect(result.data).toContain("ID");
    expect(result.data).toContain("John Smith");
  });

  it("handles empty session array", async () => {
    const { getSessionsByIds } = await import("./db");
    vi.mocked(getSessionsByIds).mockResolvedValueOnce([]);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.sessions.bulkExport({ sessionIds: [], format: "json" });
    expect(result.data).toBeDefined();
  });

  it("throws unauthorized when not logged in", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: undefined as any }));
    await expect(caller.sessions.bulkExport({ sessionIds: [1], format: "json" })).rejects.toThrow();
  });
});

// ─── Audit Log Tests ────────────────────────────────────────────────────────
describe("admin.auditLogs", () => {
  it("returns audit logs for admin", async () => {
    const { getAuditLogs } = await import("./db");
    vi.mocked(getAuditLogs).mockResolvedValueOnce([
      { id: 1, action: "session_created", userId: 1, details: "Session started", timestamp: new Date() },
      { id: 2, action: "session_ended", userId: 1, details: "Session completed", timestamp: new Date() }
    ] as any);
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.auditLogs({ limit: 100, offset: 0 });
    expect(result).toHaveLength(2);
  });

  it("returns empty when no logs", async () => {
    const { getAuditLogs } = await import("./db");
    vi.mocked(getAuditLogs).mockResolvedValueOnce([] as any);
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.auditLogs({ limit: 100, offset: 0 });
    expect(result).toEqual([]);
  });

  it("forbids access for non-admin users", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.admin.auditLogs({ limit: 100, offset: 0 })).rejects.toThrow();
  });
});

// ─── Session Notes ───────────────────────────────────────────────────────────
describe("sessions.updateNotes", () => {
  it("updates session notes successfully", async () => {
    const { updateSessionNotes } = await import("./db");
    vi.mocked(updateSessionNotes).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeCtx());
    await caller.sessions.updateNotes({ sessionId: 1, notes: "Updated notes" });
    expect(updateSessionNotes).toHaveBeenCalledWith(1, "Updated notes");
  });

  it("handles empty notes", async () => {
    const { updateSessionNotes } = await import("./db");
    vi.mocked(updateSessionNotes).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeCtx());
    await caller.sessions.updateNotes({ sessionId: 1, notes: "" });
    expect(updateSessionNotes).toHaveBeenCalledWith(1, "");
  });

  it("throws unauthorized when not logged in", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: undefined as any }));
    await expect(caller.sessions.updateNotes({ sessionId: 1, notes: "test" })).rejects.toThrow();
  });
});

// ─── Session Search ──────────────────────────────────────────────────────────
describe("sessions.search", () => {
  it("searches sessions with query", async () => {
    const { searchSessions } = await import("./db");
    vi.mocked(searchSessions).mockResolvedValueOnce([
      { id: 1, customerName: "John Smith", dealType: "retail_finance", status: "completed", startedAt: new Date() },
      { id: 2, customerName: "John Doe", dealType: "lease", status: "active", startedAt: new Date() }
    ]);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.sessions.search({ query: "John", limit: 10 });
    expect(searchSessions).toHaveBeenCalledWith("John", 1, 10);
    expect(result).toHaveLength(2);
    expect(result[0].customerName).toBe("John Smith");
  });

  it("returns empty results when no matches", async () => {
    const { searchSessions } = await import("./db");
    vi.mocked(searchSessions).mockResolvedValueOnce([]);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.sessions.search({ query: "NonExistent", limit: 10 });
    expect(result).toEqual([]);
  });

  it("uses default limit when not specified", async () => {
    const { searchSessions } = await import("./db");
    vi.mocked(searchSessions).mockResolvedValueOnce([]);
    const caller = appRouter.createCaller(makeCtx());
    await caller.sessions.search({ query: "test" });
    expect(searchSessions).toHaveBeenCalledWith("test", 1, 20);
  });
});

// ─── Admin All Sessions ──────────────────────────────────────────────────────
describe("admin.allSessions", () => {
  it("returns all sessions for admin", async () => {
    const { getAllSessions } = await import("./db");
    vi.mocked(getAllSessions).mockResolvedValueOnce([
      { id: 1, customerName: "John", status: "completed" },
      { id: 2, customerName: "Jane", status: "active" }
    ] as any);
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.allSessions({ limit: 100, offset: 0 });
    expect(result).toHaveLength(2);
  });

  it("forbids access for non-admin users", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.admin.allSessions({ limit: 100, offset: 0 })).rejects.toThrow();
  });
});

// ─── Manager Scorecard ───────────────────────────────────────────────────────
describe("analytics.managerScorecard", () => {
  it("returns manager scorecard with specified period", async () => {
    const { getManagerScorecard } = await import("./db");
    vi.mocked(getManagerScorecard).mockResolvedValueOnce({
      avgOverall: 85, avgPvr: 1500, avgCompliance: 92, avgWordTrack: 70,
      sessionCount: 20, avgScriptFidelity: 78,
      weeklyData: [
        { week: "2026-W01", overall: 82, pvr: 1400, compliance: 90, wordTrack: 68, sessions: 5, scriptFidelity: 75 },
        { week: "2026-W02", overall: 88, pvr: 1600, compliance: 94, wordTrack: 72, sessions: 7, scriptFidelity: 81 }
      ]
    });
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.analytics.managerScorecard({ weeks: 8 });
    expect(getManagerScorecard).toHaveBeenCalledWith(1, 8);
    expect(result.avgOverall).toBe(85);
    expect(result.weeklyData).toHaveLength(2);
  });

  it("uses default period when not specified", async () => {
    const { getManagerScorecard } = await import("./db");
    vi.mocked(getManagerScorecard).mockResolvedValueOnce({
      avgOverall: 80, avgPvr: 1200, avgCompliance: 85, avgWordTrack: 65,
      sessionCount: 10, avgScriptFidelity: 70, weeklyData: []
    });
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.analytics.managerScorecard({});
    expect(getManagerScorecard).toHaveBeenCalledWith(1, 12);
    expect(result.avgOverall).toBe(80);
  });

  it("returns empty weekly data when no sessions", async () => {
    const { getManagerScorecard } = await import("./db");
    vi.mocked(getManagerScorecard).mockResolvedValueOnce({
      avgOverall: 0, avgPvr: 0, avgCompliance: 0, avgWordTrack: 0,
      sessionCount: 0, avgScriptFidelity: 0, weeklyData: []
    });
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.analytics.managerScorecard({ weeks: 4 });
    expect(result.sessionCount).toBe(0);
    expect(result.weeklyData).toEqual([]);
  });
});

// ─── Objection Analysis Tests ──────────────────────────────────────────────
describe("objections.analysisByProduct", () => {
  it("returns objection analysis by product", async () => {
    const { getObjectionAnalysisByProduct } = await import("./db");
    vi.mocked(getObjectionAnalysisByProduct).mockResolvedValueOnce([
      { product: "gap_insurance", total: 15, resolved: 10, resolutionRate: 66.7 },
      { product: "extended_warranty", total: 12, resolved: 9, resolutionRate: 75.0 }
    ] as any);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.objections.analysisByProduct({});
    expect(result).toHaveLength(2);
  });
});

describe("objections.analysisByConcern", () => {
  it("returns objection analysis by concern type", async () => {
    const { getObjectionAnalysisByConcern } = await import("./db");
    vi.mocked(getObjectionAnalysisByConcern).mockResolvedValueOnce([
      { concernType: "cost", total: 20, resolved: 12, resolutionRate: 60.0 },
      { concernType: "value", total: 8, resolved: 6, resolutionRate: 75.0 }
    ] as any);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.objections.analysisByConcern({});
    expect(result).toHaveLength(2);
  });
});

describe("analytics.productMix", () => {
  it("returns product mix data", async () => {
    const { getProductMix } = await import("./db");
    vi.mocked(getProductMix).mockResolvedValueOnce([
      { product: "GAP", count: 25 },
      { product: "Extended Warranty", count: 18 },
      { product: "Paint Protection", count: 12 }
    ] as any);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.analytics.productMix();
    expect(result).toHaveLength(3);
  });
});

describe("analytics.sessionVolume", () => {
  it("returns session volume trends", async () => {
    const { getSessionVolume } = await import("./db");
    vi.mocked(getSessionVolume).mockResolvedValueOnce([
      { week: "2026-W01", count: 5 },
      { week: "2026-W02", count: 8 },
      { week: "2026-W03", count: 6 }
    ]);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.analytics.sessionVolume({ weeks: 12 });
    expect(getSessionVolume).toHaveBeenCalledWith(1, 12);
    expect(result).toHaveLength(3);
    expect(result[1].count).toBe(8);
  });

  it("handles empty volume data", async () => {
    const { getSessionVolume } = await import("./db");
    vi.mocked(getSessionVolume).mockResolvedValueOnce([]);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.analytics.sessionVolume({ weeks: 4 });
    expect(result).toEqual([]);
  });
});

describe("analytics.pvrTrend", () => {
  it("returns PVR trend data with custom limit", async () => {
    const { getPvrTrend } = await import("./db");
    vi.mocked(getPvrTrend).mockResolvedValueOnce([
      { week: "2026-W01", avgPvr: 1200, avgPpd: 2.4 },
      { week: "2026-W02", avgPvr: 1350, avgPpd: 2.7 },
      { week: "2026-W03", avgPvr: 1180, avgPpd: 2.2 }
    ] as any);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.analytics.pvrTrend({ limit: 8 });
    expect(result).toHaveLength(3);
  });

  it("uses default limit when not specified", async () => {
    const { getPvrTrend } = await import("./db");
    vi.mocked(getPvrTrend).mockResolvedValueOnce([] as any);
    const caller = appRouter.createCaller(makeCtx());
    await caller.analytics.pvrTrend({});
    expect(getPvrTrend).toHaveBeenCalled();
  });
});

// ─── Multi-Tenant: Groups & Rooftop Management ─────────────────────────────

function makeSuperAdminCtx(): TrpcContext {
  return makeCtx({
    user: {
      ...makeCtx().user!,
      role: "admin",
      isSuperAdmin: true,
      isGroupAdmin: false,
      dealershipId: 1,
    },
  });
}

function makeGroupAdminCtx(): TrpcContext {
  return makeCtx({
    user: {
      ...makeCtx().user!,
      role: "admin",
      isSuperAdmin: false,
      isGroupAdmin: true,
      dealershipId: 1,
    },
  });
}

function makeRegularUserCtx(): TrpcContext {
  return makeCtx({
    user: {
      ...makeCtx().user!,
      role: "user",
      isSuperAdmin: false,
      isGroupAdmin: false,
      dealershipId: 1,
    },
  });
}

describe("admin.listGroups", () => {
  it("returns all groups for super admin", async () => {
    const { getAllDealershipGroups } = await import("./db");
    vi.mocked(getAllDealershipGroups).mockResolvedValueOnce([
      { id: 1, name: "Asura Group", slug: "asura-group", isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ]);
    const caller = appRouter.createCaller(makeSuperAdminCtx());
    const groups = await caller.admin.listGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe("Asura Group");
  });

  it("returns only own group for group admin", async () => {
    const { getGroupIdForUser, getDealershipGroup } = await import("./db");
    vi.mocked(getGroupIdForUser).mockResolvedValueOnce(5);
    vi.mocked(getDealershipGroup).mockResolvedValueOnce({ id: 5, name: "My Group", slug: "my-group", isActive: true, createdAt: new Date(), updatedAt: new Date() });
    const caller = appRouter.createCaller(makeGroupAdminCtx());
    const groups = await caller.admin.listGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe("My Group");
  });

  it("returns empty array for admin with no group", async () => {
    const { getGroupIdForUser } = await import("./db");
    vi.mocked(getGroupIdForUser).mockResolvedValueOnce(null);
    const caller = appRouter.createCaller(makeAdminCtx());
    const groups = await caller.admin.listGroups();
    expect(groups).toHaveLength(0);
  });

  it("forbids access for non-admin users", async () => {
    const caller = appRouter.createCaller(makeRegularUserCtx());
    await expect(caller.admin.listGroups()).rejects.toThrow();
  });
});

describe("admin.createGroup", () => {
  it("allows super admin to create a group", async () => {
    const { createDealershipGroup } = await import("./db");
    vi.mocked(createDealershipGroup).mockResolvedValueOnce({ id: 2, name: "New Group", slug: "new-group", isActive: true, createdAt: new Date(), updatedAt: new Date() } as any);
    const caller = appRouter.createCaller(makeSuperAdminCtx());
    const group = await caller.admin.createGroup({ name: "New Group", slug: "new-group" });
    expect(createDealershipGroup).toHaveBeenCalledWith({ name: "New Group", slug: "new-group" });
  });

  it("forbids group admin from creating groups", async () => {
    const caller = appRouter.createCaller(makeGroupAdminCtx());
    await expect(caller.admin.createGroup({ name: "Test", slug: "test" })).rejects.toThrow("Only super admins can create groups");
  });

  it("forbids regular users from creating groups", async () => {
    const caller = appRouter.createCaller(makeRegularUserCtx());
    await expect(caller.admin.createGroup({ name: "Test", slug: "test" })).rejects.toThrow();
  });
});

describe("admin.updateGroup", () => {
  it("allows group admin to update a group", async () => {
    const { updateDealershipGroup } = await import("./db");
    vi.mocked(updateDealershipGroup).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeGroupAdminCtx());
    const result = await caller.admin.updateGroup({ id: 1, isActive: false });
    expect(result).toEqual({ success: true });
    expect(updateDealershipGroup).toHaveBeenCalledWith(1, { isActive: false });
  });

  it("forbids regular users from updating groups", async () => {
    const caller = appRouter.createCaller(makeRegularUserCtx());
    await expect(caller.admin.updateGroup({ id: 1, isActive: false })).rejects.toThrow();
  });
});

describe("admin.assignUserToRooftop", () => {
  it("allows admin to assign a user to a rooftop", async () => {
    const { assignUserToRooftop } = await import("./db");
    vi.mocked(assignUserToRooftop).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.assignUserToRooftop({ userId: 2, dealershipId: 3 });
    expect(result).toEqual({ success: true });
    expect(assignUserToRooftop).toHaveBeenCalledWith(2, 3);
  });

  it("forbids regular users from assigning rooftops", async () => {
    const caller = appRouter.createCaller(makeRegularUserCtx());
    await expect(caller.admin.assignUserToRooftop({ userId: 2, dealershipId: 3 })).rejects.toThrow();
  });
});

describe("admin.removeUserFromRooftop", () => {
  it("allows admin to remove a user from a rooftop", async () => {
    const { removeUserFromRooftop } = await import("./db");
    vi.mocked(removeUserFromRooftop).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.removeUserFromRooftop({ userId: 2, dealershipId: 3 });
    expect(result).toEqual({ success: true });
    expect(removeUserFromRooftop).toHaveBeenCalledWith(2, 3);
  });
});

describe("admin.getUserRooftopAssignments", () => {
  it("returns rooftop assignments for a user", async () => {
    const { getUserRooftops } = await import("./db");
    vi.mocked(getUserRooftops).mockResolvedValueOnce([
      { id: 1, userId: 2, dealershipId: 1, isActive: true, assignedAt: new Date() },
      { id: 2, userId: 2, dealershipId: 3, isActive: true, assignedAt: new Date() },
    ]);
    const caller = appRouter.createCaller(makeAdminCtx());
    const assignments = await caller.admin.getUserRooftopAssignments({ userId: 2 });
    expect(assignments).toHaveLength(2);
  });
});

describe("admin.listRooftopUsers", () => {
  it("returns users at a rooftop", async () => {
    const { getRooftopUsers } = await import("./db");
    vi.mocked(getRooftopUsers).mockResolvedValueOnce([
      { id: 1, userId: 1, dealershipId: 1, isActive: true, assignedAt: new Date() },
    ]);
    const caller = appRouter.createCaller(makeAdminCtx());
    const users = await caller.admin.listRooftopUsers({ dealershipId: 1 });
    expect(users).toHaveLength(1);
  });
});

describe("auth.myRooftops", () => {
  it("returns current user rooftops", async () => {
    const { getUserRooftops } = await import("./db");
    vi.mocked(getUserRooftops).mockResolvedValueOnce([
      { id: 1, userId: 1, dealershipId: 1, isActive: true, assignedAt: new Date() },
      { id: 2, userId: 1, dealershipId: 2, isActive: true, assignedAt: new Date() },
    ]);
    const caller = appRouter.createCaller(makeCtx());
    const rooftops = await caller.auth.myRooftops();
    expect(rooftops).toHaveLength(2);
  });

  it("throws when not authenticated", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: null }));
    await expect(caller.auth.myRooftops()).rejects.toThrow();
  });
});

describe("auth.switchRooftop", () => {
  it("switches rooftop successfully", async () => {
    const { switchUserRooftop } = await import("./db");
    vi.mocked(switchUserRooftop).mockResolvedValueOnce(true);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.auth.switchRooftop({ dealershipId: 2 });
    expect(result).toEqual({ success: true });
    expect(switchUserRooftop).toHaveBeenCalledWith(1, 2);
  });

  it("throws FORBIDDEN when user has no access to rooftop", async () => {
    const { switchUserRooftop } = await import("./db");
    vi.mocked(switchUserRooftop).mockResolvedValueOnce(false);
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.auth.switchRooftop({ dealershipId: 99 })).rejects.toThrow("You do not have access to this rooftop");
  });

  it("throws when not authenticated", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: null }));
    await expect(caller.auth.switchRooftop({ dealershipId: 2 })).rejects.toThrow();
  });
});

describe("admin.getGroupRooftops", () => {
  it("returns rooftops for a group", async () => {
    const { getDealershipsByGroup } = await import("./db");
    vi.mocked(getDealershipsByGroup).mockResolvedValueOnce([
      { id: 1, name: "Store A", slug: "store-a", plan: "beta", isActive: true, groupId: 1, createdAt: new Date(), updatedAt: new Date() },
    ] as any);
    const caller = appRouter.createCaller(makeAdminCtx());
    const rooftops = await caller.admin.getGroupRooftops({ groupId: 1 });
    expect(rooftops).toHaveLength(1);
    expect(rooftops[0].name).toBe("Store A");
  });
});

describe("multi-tenant data scoping", () => {
  it("super admin sees all users via listUsers", async () => {
    const { getAllUsers } = await import("./db");
    vi.mocked(getAllUsers).mockResolvedValueOnce([
      { id: 1, name: "User 1" },
      { id: 2, name: "User 2" },
    ] as any);
    const caller = appRouter.createCaller(makeSuperAdminCtx());
    const users = await caller.admin.listUsers();
    expect(getAllUsers).toHaveBeenCalled();
    expect(users).toHaveLength(2);
  });

  it("group admin sees scoped users via listUsers", async () => {
    const { getUserAccessibleDealershipIds, getAllUsersByDealershipIds } = await import("./db");
    vi.mocked(getUserAccessibleDealershipIds).mockResolvedValueOnce([1, 2]);
    vi.mocked(getAllUsersByDealershipIds).mockResolvedValueOnce([{ id: 1, name: "Scoped User" }] as any);
    const caller = appRouter.createCaller(makeGroupAdminCtx());
    const users = await caller.admin.listUsers();
    expect(getUserAccessibleDealershipIds).toHaveBeenCalledWith(1);
    expect(getAllUsersByDealershipIds).toHaveBeenCalledWith([1, 2]);
    expect(users).toHaveLength(1);
  });

  it("group admin sees scoped sessions via allSessions", async () => {
    const { getUserAccessibleDealershipIds, getAllSessionsByDealershipIds } = await import("./db");
    vi.mocked(getUserAccessibleDealershipIds).mockResolvedValueOnce([1, 2]);
    vi.mocked(getAllSessionsByDealershipIds).mockResolvedValueOnce([{ id: 1, status: "completed" }] as any);
    const caller = appRouter.createCaller(makeGroupAdminCtx());
    const sessions = await caller.admin.allSessions({ limit: 50, offset: 0 });
    expect(getUserAccessibleDealershipIds).toHaveBeenCalledWith(1);
    expect(getAllSessionsByDealershipIds).toHaveBeenCalledWith([1, 2], 50, 0);
  });
});
