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
    const session = await caller.sessions.create({ customerName: "John Smith", dealType: "retail_finance" });
    expect(session?.id).toBe(1);
    expect(session?.status).toBe("active");
  });

  it("throws UNAUTHORIZED when not logged in", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: null }));
    await expect(caller.sessions.create({ dealType: "retail_finance" })).rejects.toThrow();
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
