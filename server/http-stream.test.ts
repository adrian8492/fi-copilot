import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { createHttpStreamRouter } from "./http-stream";

// Database mock moved below SDK mock to include getSessionById

// Mock the SDK for auth
vi.mock("./_core/sdk", () => ({
  sdk: {
    authenticateRequest: vi.fn().mockResolvedValue({
      id: 42,
      openId: "test-open-id",
      name: "Test User",
      email: "test@example.com",
      role: "admin",
      dealershipId: 1,
      isSuperAdmin: false,
      isGroupAdmin: false,
    }),
  },
}));

// Mock getSessionById to return a session owned by userId 42
vi.mock("./db", () => ({
  insertTranscript: vi.fn().mockResolvedValue(undefined),
  insertComplianceFlag: vi.fn().mockResolvedValue(undefined),
  insertCopilotSuggestion: vi.fn().mockResolvedValue(undefined),
  getSessionById: vi.fn().mockResolvedValue({ id: 1, userId: 42, dealershipId: 1, consentObtained: true }),
  getConsentLogBySession: vi.fn().mockResolvedValue(null),
}));

// Mock the ASURA engine
vi.mock("./asura-engine", () => ({
  asuraQuickTrigger: vi.fn().mockReturnValue(null),
  asuraComplianceCheck: vi.fn().mockReturnValue([]),
}));

// Mock the compliance engine
vi.mock("./compliance-engine", () => ({
  scanTranscriptForViolations: vi.fn().mockReturnValue([]),
  COMPLIANCE_CATEGORY_LABELS: {},
}));

// Mock the ASURA scripts
vi.mock("./asura-scripts", () => ({
  retrieveScript: vi.fn().mockReturnValue(null),
  detectDealStage: vi.fn().mockReturnValue("introduction"),
}));

// Mock the LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({ choices: [{ message: { content: "{}" } }] }),
}));

// Mock Deepgram SDK
vi.mock("@deepgram/sdk", () => ({
  createClient: vi.fn().mockReturnValue({
    listen: {
      live: vi.fn().mockReturnValue({
        on: vi.fn(),
        send: vi.fn(),
        requestClose: vi.fn(),
        getReadyState: vi.fn().mockReturnValue(1),
        keepAlive: vi.fn(),
      }),
    },
  }),
  LiveTranscriptionEvents: {
    Open: "open",
    Transcript: "Results",
    Error: "error",
    Close: "close",
  },
}));

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.raw({ type: "application/octet-stream", limit: "5mb" }));
  app.use("/api/session", createHttpStreamRouter());
  return app;
}

describe("HTTP Stream Endpoints", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  describe("POST /api/session/start", () => {
    it("should return a token when given valid sessionId and userId", async () => {
      const res = await request(app)
        .post("/api/session/start")
        .send({ sessionId: 1, userId: 42 });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.token).toMatch(/^hs_/);
      expect(res.body.transcriptionMode).toBeDefined();
    });

    it("should return 400 when sessionId is missing", async () => {
      const res = await request(app)
        .post("/api/session/start")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("sessionId required");
    });
  });

  describe("POST /api/session/ping", () => {
    it("should return ok with elapsed time for a valid token", async () => {
      // Start a session first
      const startRes = await request(app)
        .post("/api/session/start")
        .send({ sessionId: 2, userId: 42 });
      const token = startRes.body.token;

      const res = await request(app)
        .post("/api/session/ping")
        .set("X-Stream-Token", token);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(typeof res.body.elapsed).toBe("number");
    });

    it("should return 404 for an invalid token", async () => {
      const res = await request(app)
        .post("/api/session/ping")
        .set("X-Stream-Token", "invalid_token");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/session/text", () => {
    it("should accept transcript text and return ok", async () => {
      const startRes = await request(app)
        .post("/api/session/start")
        .send({ sessionId: 3, userId: 42 });
      const token = startRes.body.token;

      const res = await request(app)
        .post("/api/session/text")
        .set("X-Stream-Token", token)
        .send({
          text: "Hello, welcome to the F&I office.",
          speaker: "manager",
          isFinal: true,
          confidence: 0.95,
          startTime: 5,
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("should return 400 when text is missing", async () => {
      const startRes = await request(app)
        .post("/api/session/start")
        .send({ sessionId: 4, userId: 42 });
      const token = startRes.body.token;

      const res = await request(app)
        .post("/api/session/text")
        .set("X-Stream-Token", token)
        .send({ speaker: "manager" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("text required");
    });

    it("should return 404 for invalid token", async () => {
      const res = await request(app)
        .post("/api/session/text")
        .set("X-Stream-Token", "bad_token")
        .send({ text: "test" });

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/session/audio", () => {
    it("should accept binary audio data", async () => {
      const startRes = await request(app)
        .post("/api/session/start")
        .send({ sessionId: 5, userId: 42 });
      const token = startRes.body.token;

      const audioBuffer = Buffer.alloc(1024, 0); // Dummy audio data
      const res = await request(app)
        .post("/api/session/audio")
        .set("X-Stream-Token", token)
        .set("Content-Type", "application/octet-stream")
        .send(audioBuffer);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("should return 404 for invalid token", async () => {
      const res = await request(app)
        .post("/api/session/audio")
        .set("X-Stream-Token", "bad_token")
        .set("Content-Type", "application/octet-stream")
        .send(Buffer.alloc(100));

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/session/end", () => {
    it("should end a session and return duration", async () => {
      const startRes = await request(app)
        .post("/api/session/start")
        .send({ sessionId: 6, userId: 42 });
      const token = startRes.body.token;

      const res = await request(app)
        .post("/api/session/end")
        .set("X-Stream-Token", token);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(typeof res.body.durationSeconds).toBe("number");
    });

    it("should return 404 when ending a non-existent session", async () => {
      const res = await request(app)
        .post("/api/session/end")
        .set("X-Stream-Token", "nonexistent");

      expect(res.status).toBe(404);
    });

    it("should return 404 when ending an already-ended session", async () => {
      const startRes = await request(app)
        .post("/api/session/start")
        .send({ sessionId: 7, userId: 42 });
      const token = startRes.body.token;

      // End once
      await request(app)
        .post("/api/session/end")
        .set("X-Stream-Token", token);

      // Try to end again
      const res = await request(app)
        .post("/api/session/end")
        .set("X-Stream-Token", token);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/session/events", () => {
    it("should return 404 for invalid token", async () => {
      const res = await request(app)
        .get("/api/session/events?token=invalid");

      expect(res.status).toBe(404);
    });
  });

  describe("Full session lifecycle", () => {
    it("should handle start → text → end flow", async () => {
      // Start
      const startRes = await request(app)
        .post("/api/session/start")
        .send({ sessionId: 8, userId: 42 });
      expect(startRes.status).toBe(200);
      const token = startRes.body.token;

      // Send text
      const textRes = await request(app)
        .post("/api/session/text")
        .set("X-Stream-Token", token)
        .send({
          text: "Let me review your deal structure.",
          speaker: "manager",
          isFinal: true,
          startTime: 10,
        });
      expect(textRes.status).toBe(200);

      // Ping
      const pingRes = await request(app)
        .post("/api/session/ping")
        .set("X-Stream-Token", token);
      expect(pingRes.status).toBe(200);
      expect(pingRes.body.elapsed).toBeGreaterThanOrEqual(0);

      // End
      const endRes = await request(app)
        .post("/api/session/end")
        .set("X-Stream-Token", token);
      expect(endRes.status).toBe(200);
      expect(endRes.body.ok).toBe(true);
    });
  });
});
