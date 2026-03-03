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
  getSuggestionsBySession: vi.fn().mockResolvedValue([]),
  insertComplianceFlag: vi.fn().mockResolvedValue(undefined),
  getFlagsBySession: vi.fn().mockResolvedValue([]),
  resolveFlag: vi.fn().mockResolvedValue(undefined),
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
  }),
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

// ─── Compliance ──────────────────────────────────────────────────────────────
describe("compliance.getFlags", () => {
  it("returns compliance flags array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const flags = await caller.compliance.getFlags({ sessionId: 1 });
    expect(Array.isArray(flags)).toBe(true);
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
});

describe("analytics.myGradeTrend", () => {
  it("returns an array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const trend = await caller.analytics.myGradeTrend({ limit: 10 });
    expect(Array.isArray(trend)).toBe(true);
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
