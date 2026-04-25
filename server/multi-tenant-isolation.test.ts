/**
 * Multi-tenant isolation tests — security-critical.
 *
 * These tests prove that a user from one dealership ("store A") cannot read
 * or be returned data from another dealership ("store B"), even if the
 * underlying SQL query is permissive.
 *
 * Pilot context: Korum and Paragon will share a single MySQL instance.
 * A single forgotten tenant filter would end the Brian Benstock pilot.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";

// ─── Mock db before importing tenancy / routers ─────────────────────────────
// The tenancy helper imports getUserAccessibleDealershipIds from ./db.
// The router integration tests import appRouter which transitively pulls
// dozens of db functions — every one must be a vi.fn() or vitest will hit
// the real implementation (which would throw without DATABASE_URL).
vi.mock("./db", () => ({
  // Used directly by tenancy.resolveTenantScope:
  getUserAccessibleDealershipIds: vi.fn(),

  // Used by sessions router:
  createSession: vi.fn(),
  getSessionById: vi.fn(),
  getSessionsByUserId: vi.fn().mockResolvedValue([]),
  getAllSessions: vi.fn().mockResolvedValue([]),
  endSession: vi.fn().mockResolvedValue(undefined),
  updateSessionStatus: vi.fn().mockResolvedValue(undefined),
  updateSessionNotes: vi.fn().mockResolvedValue(undefined),
  updateSessionDealDetails: vi.fn().mockResolvedValue(undefined),
  searchSessions: vi.fn().mockResolvedValue([]),
  getSessionComparison: vi.fn().mockResolvedValue({ session1: null, session2: null }),
  getSessionsByIds: vi.fn().mockResolvedValue([]),
  getSessionCount: vi.fn().mockResolvedValue(0),
  getSessionCountByUser: vi.fn().mockResolvedValue(0),
  getSessionCountByDealershipIds: vi.fn().mockResolvedValue(0),
  getAllSessionsByDealershipIds: vi.fn().mockResolvedValue([]),
  deleteSessionData: vi.fn().mockResolvedValue({ recordings: { fileKeys: [] } }),

  // Children of sessions:
  getTranscriptsBySession: vi.fn().mockResolvedValue([]),
  deleteTranscriptsBySession: vi.fn().mockResolvedValue(0),
  searchTranscripts: vi.fn().mockResolvedValue([]),
  getSuggestionsBySession: vi.fn().mockResolvedValue([]),
  getFlagsBySession: vi.fn().mockResolvedValue([]),
  getGradeBySession: vi.fn().mockResolvedValue(null),
  getReportBySession: vi.fn().mockResolvedValue(null),
  getRecordingsBySession: vi.fn().mockResolvedValue([]),
  getChecklistBySession: vi.fn().mockResolvedValue(null),
  getObjectionsBySession: vi.fn().mockResolvedValue([]),
  getDealRecoveriesBySession: vi.fn().mockResolvedValue([]),
  getScorecardBySession: vi.fn().mockResolvedValue(null),

  // *ById helpers added for Phase 1.5 cross-tenant write hardening:
  getProductMenuItemById: vi.fn(),
  getDealRecoveryById: vi.fn(),
  getComplianceFlagById: vi.fn(),

  // Mutations + writes that may be called transitively:
  insertTranscript: vi.fn().mockResolvedValue(true),
  insertCopilotSuggestion: vi.fn().mockResolvedValue(undefined),
  insertComplianceFlag: vi.fn().mockResolvedValue(undefined),
  insertObjectionLog: vi.fn().mockResolvedValue({}),
  insertRecording: vi.fn().mockResolvedValue(undefined),
  insertAuditLog: vi.fn().mockResolvedValue(undefined),
  resolveFlag: vi.fn().mockResolvedValue(undefined),
  upsertGrade: vi.fn().mockResolvedValue(undefined),
  upsertCoachingReport: vi.fn().mockResolvedValue(undefined),
  upsertSessionChecklist: vi.fn().mockResolvedValue(undefined),
  markSuggestionUsed: vi.fn().mockResolvedValue(undefined),
  upsertScorecard: vi.fn().mockResolvedValue({}),
  createScorecard: vi.fn().mockResolvedValue({}),
  createDealRecovery: vi.fn().mockResolvedValue(undefined),
  updateDealRecoveryStatus: vi.fn().mockResolvedValue(undefined),
  updateRecordingStatus: vi.fn().mockResolvedValue(undefined),
  setRecordingRetention: vi.fn().mockResolvedValue(undefined),

  // Reads that may be called by other routes during integration paths:
  getGradesByUser: vi.fn().mockResolvedValue([]),
  getReportsByUser: vi.fn().mockResolvedValue([]),
  getRecordingsByUser: vi.fn().mockResolvedValue([]),
  getDealRecoveriesByUser: vi.fn().mockResolvedValue([]),
  getDealRecoveryStats: vi.fn().mockResolvedValue({}),
  getScorecardsByUser: vi.fn().mockResolvedValue([]),
  getScorecardsByDealership: vi.fn().mockResolvedValue([]),
  getAverageScorecardByUser: vi.fn().mockResolvedValue({}),
  getRecentScorecardScores: vi.fn().mockResolvedValue([]),
  getSuggestionUtilizationRate: vi.fn().mockResolvedValue({ total: 0, used: 0, rate: 0 }),
  getAnalyticsSummary: vi.fn().mockResolvedValue({}),
  getEagleEyeLeaderboard: vi.fn().mockResolvedValue([]),
  getEagleEyeTrends: vi.fn().mockResolvedValue({ groupTrend: [], managerTrends: {}, scriptFidelityTrend: [] }),
  getObjectionAnalysisByProduct: vi.fn().mockResolvedValue([]),
  getObjectionAnalysisByConcern: vi.fn().mockResolvedValue([]),
  getPvrTrend: vi.fn().mockResolvedValue([]),
  getProductMix: vi.fn().mockResolvedValue([]),
  getSessionVolume: vi.fn().mockResolvedValue([]),
  getManagerScorecard: vi.fn().mockResolvedValue({}),
  getComplianceTrend: vi.fn().mockResolvedValue([]),
  getComplianceFlags: vi.fn().mockResolvedValue([]),
  getSystemUsageStats: vi.fn().mockResolvedValue({}),

  // Compliance rules (may be loaded by analytics/reporting):
  getAllComplianceRules: vi.fn().mockResolvedValue([]),
  getActiveComplianceRules: vi.fn().mockResolvedValue([]),
  insertComplianceRule: vi.fn().mockResolvedValue(undefined),
  updateComplianceRule: vi.fn().mockResolvedValue(undefined),
  deleteComplianceRule: vi.fn().mockResolvedValue(undefined),

  // Audit logs:
  getAuditLogs: vi.fn().mockResolvedValue([]),
  getAuditLogCount: vi.fn().mockResolvedValue(0),

  // User / dealership helpers:
  getAllUsers: vi.fn().mockResolvedValue([]),
  getUserById: vi.fn().mockResolvedValue(null),
  getUserByOpenId: vi.fn().mockResolvedValue(null),
  getUserByEmail: vi.fn().mockResolvedValue(null),
  setUserPasswordHash: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  setUserMfaSecret: vi.fn().mockResolvedValue(undefined),
  enableUserMfa: vi.fn().mockResolvedValue(undefined),
  disableUserMfa: vi.fn().mockResolvedValue(undefined),
  getUserMfaStatus: vi.fn().mockResolvedValue({ mfaEnabled: false, totpSecret: null }),

  getAllDealerships: vi.fn().mockResolvedValue([]),
  getDealershipById: vi.fn().mockResolvedValue(null),
  updateDealershipOnboarding: vi.fn().mockResolvedValue(undefined),
  getDealershipDigest: vi.fn().mockResolvedValue({ sessions: [], grades: [], flags: [], managers: [] }),
  createDealership: vi.fn().mockResolvedValue(undefined),
  updateDealership: vi.fn().mockResolvedValue(undefined),
  assignUserToDealership: vi.fn().mockResolvedValue(undefined),
  getDealershipSettings: vi.fn().mockResolvedValue(null),
  updateDealershipSettings: vi.fn().mockResolvedValue(undefined),
  upsertDealershipSettings: vi.fn().mockResolvedValue(undefined),

  createDealershipGroup: vi.fn().mockResolvedValue({}),
  getAllDealershipGroups: vi.fn().mockResolvedValue([]),
  getDealershipGroup: vi.fn().mockResolvedValue(null),
  updateDealershipGroup: vi.fn().mockResolvedValue(undefined),
  getDealershipsByGroup: vi.fn().mockResolvedValue([]),
  assignUserToRooftop: vi.fn().mockResolvedValue(undefined),
  removeUserFromRooftop: vi.fn().mockResolvedValue(undefined),
  getUserRooftops: vi.fn().mockResolvedValue([]),
  getRooftopUsers: vi.fn().mockResolvedValue([]),
  switchUserRooftop: vi.fn().mockResolvedValue(true),
  getAllUsersByDealershipIds: vi.fn().mockResolvedValue([]),
  getGroupIdForUser: vi.fn().mockResolvedValue(null),

  // Invitations:
  createInvitation: vi.fn().mockResolvedValue({ token: "tok", expiresAt: new Date() }),
  getInvitationByToken: vi.fn().mockResolvedValue(null),
  redeemInvitation: vi.fn().mockResolvedValue(null),
  getInvitationsByDealership: vi.fn().mockResolvedValue([]),
  revokeInvitation: vi.fn().mockResolvedValue(undefined),

  // Customers + product menu + product intelligence:
  createCustomer: vi.fn().mockResolvedValue({}),
  getCustomersByDealership: vi.fn().mockResolvedValue([]),
  getCustomerById: vi.fn().mockResolvedValue(null),
  updateCustomer: vi.fn().mockResolvedValue(undefined),
  searchCustomers: vi.fn().mockResolvedValue([]),
  getCustomerCountByDealership: vi.fn().mockResolvedValue(0),
  getSessionsByCustomerId: vi.fn().mockResolvedValue([]),
  getProductMenuByDealership: vi.fn().mockResolvedValue([]),
  upsertProductMenuItem: vi.fn().mockResolvedValue(undefined),
  deleteProductMenuItem: vi.fn().mockResolvedValue(undefined),
  getProductIntelligenceByType: vi.fn().mockResolvedValue([]),
  getAllProductIntelligence: vi.fn().mockResolvedValue([]),
  upsertProductIntelligence: vi.fn().mockResolvedValue(undefined),

  // Retention:
  getExpiredRecordings: vi.fn().mockResolvedValue([]),

  // Alerts:
  getUnreadAlerts: vi.fn().mockResolvedValue([]),
  markAlertRead: vi.fn().mockResolvedValue(undefined),

  // Drizzle helpers used by health checks etc:
  getDb: vi.fn().mockResolvedValue(null),
  withRetry: vi.fn(async (fn: () => Promise<unknown>) => fn()),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "k", url: "u" }),
  storageGet: vi.fn().mockResolvedValue({ key: "k", url: "u" }),
  storageDelete: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({ choices: [{ message: { content: "{}" } }] }),
}));

vi.mock("./_core/voiceTranscription", () => ({
  transcribeAudio: vi.fn().mockResolvedValue({ text: "", language: "en", segments: [] }),
}));

// Imports must come after vi.mock so they pick up the mocked modules.
import {
  resolveTenantScope,
  assertTenantAccess,
  tenantFilter,
  canAccessDealership,
  type TenantScope,
} from "./tenancy";
import { transcripts, sessions } from "../drizzle/schema";
import * as db from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import type { SQL } from "drizzle-orm";

const mysqlDialect = new MySqlDialect();
function compileSql(sql: SQL): { sql: string; params: unknown[] } {
  return mysqlDialect.sqlToQuery(sql);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    openId: "open-1",
    name: "Test User",
    email: "test@store-a.com",
    loginMethod: "manus",
    role: "user",
    dealership: null,
    dealershipId: 100, // store-A
    isSuperAdmin: false,
    isGroupAdmin: false,
    mfaEnabled: false,
    totpSecret: null,
    passwordHash: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function makeCtx(user: User | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const STORE_A = 100;
const STORE_B = 200;
const STORE_C = 300;

beforeEach(() => {
  vi.clearAllMocks();
});

// ────────────────────────────────────────────────────────────────────────────
// A. resolveTenantScope — derive scope from user
// ────────────────────────────────────────────────────────────────────────────

describe("resolveTenantScope", () => {
  it("throws UNAUTHORIZED when user is null", async () => {
    await expect(resolveTenantScope(null)).rejects.toBeInstanceOf(TRPCError);
    await expect(resolveTenantScope(null)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns null dealershipIds for super admin (sentinel for unrestricted)", async () => {
    const scope = await resolveTenantScope(makeUser({ isSuperAdmin: true, dealershipId: null }));
    expect(scope.dealershipIds).toBeNull();
    expect(scope.isSuperAdmin).toBe(true);
  });

  it("returns single-element dealershipIds for regular user with assignment", async () => {
    const scope = await resolveTenantScope(makeUser({ dealershipId: STORE_A }));
    expect(scope.dealershipIds).toEqual([STORE_A]);
    expect(scope.isSuperAdmin).toBe(false);
    expect(scope.primaryDealershipId).toBe(STORE_A);
  });

  it("returns empty dealershipIds for regular user without dealership assignment", async () => {
    const scope = await resolveTenantScope(makeUser({ dealershipId: null }));
    expect(scope.dealershipIds).toEqual([]);
    expect(scope.isSuperAdmin).toBe(false);
  });

  it("returns accessible dealership IDs for group admin", async () => {
    vi.mocked(db.getUserAccessibleDealershipIds).mockResolvedValueOnce([STORE_A, STORE_B]);
    const scope = await resolveTenantScope(
      makeUser({ isGroupAdmin: true, dealershipId: STORE_A })
    );
    expect(scope.dealershipIds).toEqual([STORE_A, STORE_B]);
    expect(scope.isSuperAdmin).toBe(false);
    expect(db.getUserAccessibleDealershipIds).toHaveBeenCalledWith(1);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// B. assertTenantAccess — throw on cross-tenant row access
// ────────────────────────────────────────────────────────────────────────────

describe("assertTenantAccess", () => {
  const userScope = (ids: number[]): TenantScope => ({
    dealershipIds: ids,
    isSuperAdmin: false,
    primaryDealershipId: ids[0] ?? null,
    userId: 1,
  });
  const superScope: TenantScope = {
    dealershipIds: null,
    isSuperAdmin: true,
    primaryDealershipId: null,
    userId: 99,
  };

  it("allows super admin to access any dealership row", () => {
    expect(() => assertTenantAccess(superScope, { dealershipId: STORE_A })).not.toThrow();
    expect(() => assertTenantAccess(superScope, { dealershipId: STORE_B })).not.toThrow();
    expect(() => assertTenantAccess(superScope, { dealershipId: null })).not.toThrow();
  });

  it("allows user to access row from their own dealership", () => {
    expect(() => assertTenantAccess(userScope([STORE_A]), { dealershipId: STORE_A })).not.toThrow();
  });

  it("throws FORBIDDEN when user reads row from a different dealership", () => {
    expect(() => assertTenantAccess(userScope([STORE_A]), { dealershipId: STORE_B })).toThrow(TRPCError);
    try {
      assertTenantAccess(userScope([STORE_A]), { dealershipId: STORE_B });
    } catch (e) {
      expect((e as TRPCError).code).toBe("FORBIDDEN");
    }
  });

  it("throws FORBIDDEN when row.dealershipId is null and user is not super admin", () => {
    expect(() => assertTenantAccess(userScope([STORE_A]), { dealershipId: null })).toThrow(TRPCError);
  });

  it("allows group admin to access row from any of their accessible dealerships", () => {
    const groupScope = userScope([STORE_A, STORE_B, STORE_C]);
    expect(() => assertTenantAccess(groupScope, { dealershipId: STORE_A })).not.toThrow();
    expect(() => assertTenantAccess(groupScope, { dealershipId: STORE_B })).not.toThrow();
    expect(() => assertTenantAccess(groupScope, { dealershipId: STORE_C })).not.toThrow();
  });

  it("throws FORBIDDEN when group admin reads row from non-accessible dealership", () => {
    const groupScope = userScope([STORE_A, STORE_B]);
    expect(() => assertTenantAccess(groupScope, { dealershipId: STORE_C })).toThrow(TRPCError);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// C. tenantFilter — Drizzle WHERE clause builder
// ────────────────────────────────────────────────────────────────────────────

describe("tenantFilter", () => {
  const superScope: TenantScope = {
    dealershipIds: null,
    isSuperAdmin: true,
    primaryDealershipId: null,
    userId: 99,
  };

  it("returns undefined for super admin (no SQL restriction)", () => {
    const sql = tenantFilter(superScope, transcripts.dealershipId);
    expect(sql).toBeUndefined();
  });

  it("returns equality clause for single-dealership scope", () => {
    const scope: TenantScope = {
      dealershipIds: [STORE_A],
      isSuperAdmin: false,
      primaryDealershipId: STORE_A,
      userId: 1,
    };
    const sql = tenantFilter(scope, transcripts.dealershipId);
    expect(sql).toBeDefined();
    const compiled = compileSql(sql!);
    expect(compiled.sql).toBe("`transcripts`.`dealershipId` = ?");
    expect(compiled.params).toEqual([STORE_A]);
  });

  it("returns inArray clause for multi-dealership scope (group admin)", () => {
    const scope: TenantScope = {
      dealershipIds: [STORE_A, STORE_B, STORE_C],
      isSuperAdmin: false,
      primaryDealershipId: STORE_A,
      userId: 1,
    };
    const sql = tenantFilter(scope, sessions.dealershipId);
    expect(sql).toBeDefined();
    const compiled = compileSql(sql!);
    expect(compiled.sql).toBe("`sessions`.`dealershipId` in (?, ?, ?)");
    expect(compiled.params).toEqual([STORE_A, STORE_B, STORE_C]);
  });

  it("returns never-true sentinel (eq col -1) for empty dealership scope", () => {
    const scope: TenantScope = {
      dealershipIds: [],
      isSuperAdmin: false,
      primaryDealershipId: null,
      userId: 1,
    };
    const sql = tenantFilter(scope, transcripts.dealershipId);
    expect(sql).toBeDefined();
    const compiled = compileSql(sql!);
    expect(compiled.sql).toBe("`transcripts`.`dealershipId` = ?");
    expect(compiled.params).toEqual([-1]);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// D. canAccessDealership — non-throwing variant
// ────────────────────────────────────────────────────────────────────────────

describe("canAccessDealership", () => {
  it("returns true for super admin regardless of target dealership", () => {
    const superScope: TenantScope = {
      dealershipIds: null,
      isSuperAdmin: true,
      primaryDealershipId: null,
      userId: 99,
    };
    expect(canAccessDealership(superScope, STORE_A)).toBe(true);
    expect(canAccessDealership(superScope, STORE_B)).toBe(true);
    expect(canAccessDealership(superScope, null)).toBe(true);
  });

  it("returns true for user accessing their own dealership", () => {
    const scope: TenantScope = {
      dealershipIds: [STORE_A],
      isSuperAdmin: false,
      primaryDealershipId: STORE_A,
      userId: 1,
    };
    expect(canAccessDealership(scope, STORE_A)).toBe(true);
  });

  it("returns false for user accessing different / null dealership", () => {
    const scope: TenantScope = {
      dealershipIds: [STORE_A],
      isSuperAdmin: false,
      primaryDealershipId: STORE_A,
      userId: 1,
    };
    expect(canAccessDealership(scope, STORE_B)).toBe(false);
    expect(canAccessDealership(scope, null)).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// E. End-to-end isolation via tRPC routes
//    These exercise the assertSessionAccess path that already exists in
//    routers.ts and prove that even if a malicious caller passes an ID
//    belonging to another tenant, the response is FORBIDDEN, not data.
// ────────────────────────────────────────────────────────────────────────────

describe("tRPC isolation: sessions.get cross-tenant", () => {
  it("Korum (store-A) user cannot read Paragon (store-B) session by ID", async () => {
    vi.mocked(db.getSessionById).mockResolvedValueOnce({
      id: 42,
      userId: 999, // belongs to a Paragon manager
      dealershipId: STORE_B,
      customerName: null,
      dealNumber: null,
      vehicleType: "new",
      dealType: "retail_finance",
      status: "completed",
      consentObtained: true,
      consentMethod: "verbal",
      consentTimestamp: new Date(),
      startedAt: new Date(),
      endedAt: null,
      durationSeconds: null,
      notes: null,
      vehicleYear: null, vehicleMake: null, vehicleModel: null, vin: null,
      salePrice: null, tradeValue: null, amountFinanced: null,
      lenderName: null, apr: null, termMonths: null, monthlyPayment: null,
    } as never);

    const korumUser = makeUser({ id: 1, dealershipId: STORE_A, role: "user" });
    const caller = appRouter.createCaller(makeCtx(korumUser));

    await expect(caller.sessions.get({ id: 42 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("super admin can read any session regardless of dealership", async () => {
    vi.mocked(db.getSessionById).mockResolvedValueOnce({
      id: 42,
      userId: 999,
      dealershipId: STORE_B,
      customerName: null, dealNumber: null,
      vehicleType: "new", dealType: "retail_finance",
      status: "completed", consentObtained: true,
      consentMethod: "verbal", consentTimestamp: new Date(),
      startedAt: new Date(), endedAt: null, durationSeconds: null,
      notes: null,
      vehicleYear: null, vehicleMake: null, vehicleModel: null, vin: null,
      salePrice: null, tradeValue: null, amountFinanced: null,
      lenderName: null, apr: null, termMonths: null, monthlyPayment: null,
    } as never);

    const adrian = makeUser({ id: 99, isSuperAdmin: true, dealershipId: null });
    const caller = appRouter.createCaller(makeCtx(adrian));
    const result = await caller.sessions.get({ id: 42 });
    expect(result.id).toBe(42);
  });

  it("Korum user CAN read their own Korum session", async () => {
    vi.mocked(db.getSessionById).mockResolvedValueOnce({
      id: 42,
      userId: 1,
      dealershipId: STORE_A,
      customerName: null, dealNumber: null,
      vehicleType: "new", dealType: "retail_finance",
      status: "completed", consentObtained: true,
      consentMethod: "verbal", consentTimestamp: new Date(),
      startedAt: new Date(), endedAt: null, durationSeconds: null,
      notes: null,
      vehicleYear: null, vehicleMake: null, vehicleModel: null, vin: null,
      salePrice: null, tradeValue: null, amountFinanced: null,
      lenderName: null, apr: null, termMonths: null, monthlyPayment: null,
    } as never);

    const korumUser = makeUser({ id: 1, dealershipId: STORE_A, role: "user" });
    const caller = appRouter.createCaller(makeCtx(korumUser));
    const result = await caller.sessions.get({ id: 42 });
    expect(result.dealershipId).toBe(STORE_A);
  });
});

describe("tRPC isolation: sessions.getWithDetails cross-tenant", () => {
  it("Korum user cannot fetch session-details bundle for Paragon session (children must not leak)", async () => {
    // The route loads the parent session first, then calls assertSessionAccess
    // BEFORE fanning out to transcripts/suggestions/flags/etc.
    vi.mocked(db.getSessionById).mockResolvedValueOnce({
      id: 77,
      userId: 999,
      dealershipId: STORE_B,
      customerName: null, dealNumber: null,
      vehicleType: "new", dealType: "retail_finance",
      status: "completed", consentObtained: true,
      consentMethod: "verbal", consentTimestamp: new Date(),
      startedAt: new Date(), endedAt: null, durationSeconds: null,
      notes: null,
      vehicleYear: null, vehicleMake: null, vehicleModel: null, vin: null,
      salePrice: null, tradeValue: null, amountFinanced: null,
      lenderName: null, apr: null, termMonths: null, monthlyPayment: null,
    } as never);

    const korumUser = makeUser({ id: 1, dealershipId: STORE_A, role: "user" });
    const caller = appRouter.createCaller(makeCtx(korumUser));

    await expect(caller.sessions.getWithDetails({ id: 77 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    // The child queries must NOT have been called when access was denied.
    expect(db.getTranscriptsBySession).not.toHaveBeenCalled();
    expect(db.getSuggestionsBySession).not.toHaveBeenCalled();
    expect(db.getFlagsBySession).not.toHaveBeenCalled();
    expect(db.getGradeBySession).not.toHaveBeenCalled();
    expect(db.getReportBySession).not.toHaveBeenCalled();
    expect(db.getRecordingsBySession).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// F. Phase 1.5 — cross-tenant write hardening
//    These prove that mutation routes that previously had no tenant check
//    (or a permissive role-only check) now reject cross-tenant attempts.
// ────────────────────────────────────────────────────────────────────────────

describe("Phase 1.5: sessions.delete cross-tenant admin", () => {
  it("Korum admin cannot delete a Paragon session even though they have admin role", async () => {
    vi.mocked(db.getSessionById).mockResolvedValueOnce({
      id: 50,
      userId: 999,
      dealershipId: STORE_B,
      customerName: null, dealNumber: null,
      vehicleType: "new", dealType: "retail_finance",
      status: "completed", consentObtained: true,
      consentMethod: "verbal", consentTimestamp: new Date(),
      startedAt: new Date(), endedAt: null, durationSeconds: null,
      notes: null,
      vehicleYear: null, vehicleMake: null, vehicleModel: null, vin: null,
      salePrice: null, tradeValue: null, amountFinanced: null,
      lenderName: null, apr: null, termMonths: null, monthlyPayment: null,
    } as never);

    const korumAdmin = makeUser({ id: 1, dealershipId: STORE_A, role: "admin" });
    const caller = appRouter.createCaller(makeCtx(korumAdmin));

    await expect(
      caller.sessions.delete({ sessionId: 50, reason: "test" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.deleteSessionData).not.toHaveBeenCalled();
  });
});

describe("Phase 1.5: productMenu.delete cross-tenant", () => {
  it("Korum user cannot delete a Paragon product menu item by ID", async () => {
    vi.mocked(db.getProductMenuItemById).mockResolvedValueOnce({
      id: 7,
      dealershipId: STORE_B,
      productType: "gap_insurance",
      displayName: "GAP",
      providerName: null, description: null,
      costToDealer: null, retailPrice: null,
      termMonths: null, maxMileage: null,
      isActive: true, sortOrder: 0,
      createdAt: new Date(), updatedAt: new Date(),
    } as never);

    const korumUser = makeUser({ id: 1, dealershipId: STORE_A, role: "user" });
    const caller = appRouter.createCaller(makeCtx(korumUser));

    await expect(
      caller.productMenu.delete({ id: 7 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.deleteProductMenuItem).not.toHaveBeenCalled();
  });

  it("404 (not FORBIDDEN) when the product menu item does not exist", async () => {
    vi.mocked(db.getProductMenuItemById).mockResolvedValueOnce(null);
    const korumUser = makeUser({ id: 1, dealershipId: STORE_A, role: "user" });
    const caller = appRouter.createCaller(makeCtx(korumUser));
    await expect(
      caller.productMenu.delete({ id: 99 })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("Phase 1.5: productMenu.upsert cross-tenant id smuggling", () => {
  it("Korum user cannot rewrite a Paragon item by passing its ID with their dealershipId", async () => {
    vi.mocked(db.getProductMenuItemById).mockResolvedValueOnce({
      id: 12,
      dealershipId: STORE_B,
      productType: "gap_insurance",
      displayName: "GAP",
      providerName: null, description: null,
      costToDealer: null, retailPrice: null,
      termMonths: null, maxMileage: null,
      isActive: true, sortOrder: 0,
      createdAt: new Date(), updatedAt: new Date(),
    } as never);

    const korumUser = makeUser({ id: 1, dealershipId: STORE_A, role: "user" });
    const caller = appRouter.createCaller(makeCtx(korumUser));

    await expect(
      caller.productMenu.upsert({
        id: 12,
        productType: "gap_insurance",
        displayName: "Pwned",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.upsertProductMenuItem).not.toHaveBeenCalled();
  });
});

describe("Phase 1.5: dealRecovery.updateStatus cross-tenant", () => {
  it("Korum user cannot update a Paragon recovery row's status", async () => {
    vi.mocked(db.getDealRecoveryById).mockResolvedValueOnce({
      id: 33,
      sessionId: 999,
      dealershipId: STORE_B,
      productType: "gap_insurance",
      declineReason: null,
      recoveryScript: null,
      recoveryStatus: "pending",
      potentialRevenue: null,
      actualRevenue: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    vi.mocked(db.getSessionById).mockResolvedValueOnce({
      id: 999,
      userId: 999,
      dealershipId: STORE_B,
      customerName: null, dealNumber: null,
      vehicleType: "new", dealType: "retail_finance",
      status: "completed", consentObtained: true,
      consentMethod: "verbal", consentTimestamp: new Date(),
      startedAt: new Date(), endedAt: null, durationSeconds: null,
      notes: null,
      vehicleYear: null, vehicleMake: null, vehicleModel: null, vin: null,
      salePrice: null, tradeValue: null, amountFinanced: null,
      lenderName: null, apr: null, termMonths: null, monthlyPayment: null,
    } as never);

    const korumUser = makeUser({ id: 1, dealershipId: STORE_A, role: "user" });
    const caller = appRouter.createCaller(makeCtx(korumUser));

    await expect(
      caller.dealRecovery.updateStatus({ id: 33, status: "recovered" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.updateDealRecoveryStatus).not.toHaveBeenCalled();
  });
});

describe("Phase 1.5: customers.update cross-tenant", () => {
  it("Korum user cannot update a Paragon customer record", async () => {
    vi.mocked(db.getCustomerById).mockResolvedValueOnce({
      id: 88,
      dealershipId: STORE_B,
      firstName: "Jane",
      lastName: "Doe",
      email: null, phone: null, address: null, notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const korumUser = makeUser({ id: 1, dealershipId: STORE_A, role: "user" });
    const caller = appRouter.createCaller(makeCtx(korumUser));

    await expect(
      caller.customers.update({ id: 88, firstName: "Pwned" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.updateCustomer).not.toHaveBeenCalled();
  });

  it("group admin (sister-store access) CAN update customer in their group", async () => {
    vi.mocked(db.getCustomerById).mockResolvedValueOnce({
      id: 88,
      dealershipId: STORE_B,
      firstName: "Jane",
      lastName: "Doe",
      email: null, phone: null, address: null, notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const groupAdmin = makeUser({
      id: 5,
      dealershipId: STORE_A,
      isGroupAdmin: true,
    });
    const caller = appRouter.createCaller(makeCtx(groupAdmin));

    const result = await caller.customers.update({ id: 88, firstName: "Updated" });
    expect(result.success).toBe(true);
    expect(db.updateCustomer).toHaveBeenCalledWith(88, { firstName: "Updated" });
  });
});

describe("Phase 1.5: compliance.resolveFlag cross-tenant", () => {
  it("Korum user cannot resolve a Paragon compliance flag", async () => {
    vi.mocked(db.getComplianceFlagById).mockResolvedValueOnce({
      id: 100,
      sessionId: 999,
      dealershipId: STORE_B,
      severity: "warning",
      rule: "test",
      description: "test",
      excerpt: null,
      timestamp: null,
      resolved: false,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: new Date(),
    } as never);
    vi.mocked(db.getSessionById).mockResolvedValueOnce({
      id: 999,
      userId: 999,
      dealershipId: STORE_B,
      customerName: null, dealNumber: null,
      vehicleType: "new", dealType: "retail_finance",
      status: "completed", consentObtained: true,
      consentMethod: "verbal", consentTimestamp: new Date(),
      startedAt: new Date(), endedAt: null, durationSeconds: null,
      notes: null,
      vehicleYear: null, vehicleMake: null, vehicleModel: null, vin: null,
      salePrice: null, tradeValue: null, amountFinanced: null,
      lenderName: null, apr: null, termMonths: null, monthlyPayment: null,
    } as never);

    const korumUser = makeUser({ id: 1, dealershipId: STORE_A, role: "user" });
    const caller = appRouter.createCaller(makeCtx(korumUser));

    await expect(
      caller.compliance.resolveFlag({ flagId: 100 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.resolveFlag).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// G. Phase 2 — onboarding wizard (5-step DP/F&I-Director flow)
//    Tenant safety here is structural: every onboarding mutation reads
//    ctx.user.dealershipId rather than accepting a dealership ID from input.
//    A Korum admin physically cannot mutate Paragon's dealership row.
// ────────────────────────────────────────────────────────────────────────────

describe("Phase 2: onboarding.getStatus", () => {
  it("returns hasDealership=false when user has no dealership", async () => {
    const user = makeUser({ dealershipId: null });
    const caller = appRouter.createCaller(makeCtx(user));
    const status = await caller.onboarding.getStatus();
    expect(status.hasDealership).toBe(false);
  });

  it("returns dealership + settings when user has a dealership", async () => {
    vi.mocked(db.getDealershipById).mockResolvedValueOnce({
      id: STORE_A,
      name: "Korum",
      slug: "korum",
      plan: "beta",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      groupId: null,
      location: "Puyallup, WA",
      brandMix: ["Toyota", "Honda"],
      unitVolumeMonthly: 200,
      pruBaseline: 1700,
      pruTarget: 2200,
      onboardingStep: 1,
      onboardingComplete: false,
    } as never);
    vi.mocked(db.getDealershipSettings).mockResolvedValueOnce(null);

    const user = makeUser({ dealershipId: STORE_A, role: "admin" });
    const caller = appRouter.createCaller(makeCtx(user));
    const status = await caller.onboarding.getStatus();
    expect(status.hasDealership).toBe(true);
    if (status.hasDealership) {
      expect(status.dealership.name).toBe("Korum");
      expect(status.dealership.onboardingStep).toBe(1);
    }
  });
});

describe("Phase 2: onboarding.saveProfile", () => {
  it("admin updates own dealership profile and advances step to 1", async () => {
    const admin = makeUser({ dealershipId: STORE_A, role: "admin" });
    const caller = appRouter.createCaller(makeCtx(admin));
    const result = await caller.onboarding.saveProfile({
      location: "Puyallup, WA",
      brandMix: ["Toyota", "Honda", "Subaru"],
      unitVolumeMonthly: 200,
      pruBaseline: 1700,
      pruTarget: 2200,
    });
    expect(result).toEqual({ success: true, step: 1 });
    expect(db.updateDealershipOnboarding).toHaveBeenCalledWith(STORE_A, expect.objectContaining({
      location: "Puyallup, WA",
      brandMix: ["Toyota", "Honda", "Subaru"],
      onboardingStep: 1,
    }));
  });

  it("rejects regular F&I manager (only admin/group/super can onboard)", async () => {
    const manager = makeUser({ dealershipId: STORE_A, role: "user" });
    const caller = appRouter.createCaller(makeCtx(manager));
    await expect(
      caller.onboarding.saveProfile({
        location: "Puyallup, WA",
        brandMix: ["Toyota"],
        unitVolumeMonthly: 200,
        pruBaseline: 1700,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.updateDealershipOnboarding).not.toHaveBeenCalled();
  });

  it("rejects user with no dealership assignment", async () => {
    const orphan = makeUser({ dealershipId: null, role: "admin" });
    const caller = appRouter.createCaller(makeCtx(orphan));
    await expect(
      caller.onboarding.saveProfile({
        location: "Nowhere",
        brandMix: ["Toyota"],
        unitVolumeMonthly: 100,
        pruBaseline: 1500,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("Phase 2: onboarding.saveProducts", () => {
  it("admin bulk-upserts product menu items scoped to their dealership", async () => {
    const admin = makeUser({ dealershipId: STORE_A, role: "admin" });
    const caller = appRouter.createCaller(makeCtx(admin));
    const result = await caller.onboarding.saveProducts({
      items: [
        { productType: "vehicle_service_contract", displayName: "VSA", retailPrice: 2400 },
        { productType: "gap_insurance", displayName: "GAP", retailPrice: 800 },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.itemCount).toBe(2);
    expect(db.upsertProductMenuItem).toHaveBeenCalledTimes(2);
    expect(db.upsertProductMenuItem).toHaveBeenCalledWith(expect.objectContaining({
      dealershipId: STORE_A,
      productType: "vehicle_service_contract",
    }));
  });

  it("rejects id-smuggling: passing another tenant's product item id", async () => {
    vi.mocked(db.getProductMenuItemById).mockResolvedValueOnce({
      id: 99,
      dealershipId: STORE_B, // belongs to Paragon
      productType: "gap_insurance",
      displayName: "Original GAP",
      providerName: null, description: null,
      costToDealer: null, retailPrice: null,
      termMonths: null, maxMileage: null,
      isActive: true, sortOrder: 0,
      createdAt: new Date(), updatedAt: new Date(),
    } as never);
    const korumAdmin = makeUser({ dealershipId: STORE_A, role: "admin" });
    const caller = appRouter.createCaller(makeCtx(korumAdmin));
    await expect(
      caller.onboarding.saveProducts({
        items: [
          { id: 99, productType: "gap_insurance", displayName: "Pwned" },
        ],
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.upsertProductMenuItem).not.toHaveBeenCalled();
  });
});

describe("Phase 2: onboarding.saveTeam", () => {
  it("admin generates invitations for F&I managers and returns codes", async () => {
    vi.mocked(db.createInvitation)
      .mockResolvedValueOnce({ token: "tok-a", expiresAt: new Date() } as never)
      .mockResolvedValueOnce({ token: "tok-b", expiresAt: new Date() } as never);

    const admin = makeUser({ id: 7, dealershipId: STORE_A, role: "admin" });
    const caller = appRouter.createCaller(makeCtx(admin));
    const result = await caller.onboarding.saveTeam({
      managers: [
        { name: "Sarah", email: "sarah@korum.com", role: "user" },
        { name: "Mike", email: "mike@korum.com", role: "user" },
      ],
    });
    expect(result.invites).toHaveLength(2);
    expect(result.invites[0].token).toBe("tok-a");
    expect(db.createInvitation).toHaveBeenCalledWith(expect.objectContaining({
      email: "sarah@korum.com",
      dealershipId: STORE_A,
      invitedBy: 7,
    }));
  });
});

describe("Phase 2: onboarding.saveBaseline + saveCadence", () => {
  it("saveBaseline upserts settings and advances step to 4", async () => {
    const admin = makeUser({ dealershipId: STORE_A, role: "admin" });
    const caller = appRouter.createCaller(makeCtx(admin));
    const result = await caller.onboarding.saveBaseline({
      vsaPenBaseline: 45,
      gapPenBaseline: 60,
      appearancePenBaseline: 30,
      chargebackRateBaseline: 1.5,
      citAgingBaseline: 4.2,
    });
    expect(result).toEqual({ success: true, step: 4 });
    expect(db.upsertDealershipSettings).toHaveBeenCalledWith(STORE_A, expect.objectContaining({
      vsaPenBaseline: 45,
      citAgingBaseline: 4.2,
    }));
    expect(db.updateDealershipOnboarding).toHaveBeenCalledWith(STORE_A, { onboardingStep: 4 });
  });

  it("saveCadence finalizes onboarding (step 5 + complete=true)", async () => {
    const admin = makeUser({ dealershipId: STORE_A, role: "admin" });
    const caller = appRouter.createCaller(makeCtx(admin));
    const result = await caller.onboarding.saveCadence({
      coachingCadenceDay: "monday",
      coachingCadenceTime: "09:00",
      coachingRunBy: "fi_director",
      pru90DayTarget: 2200,
    });
    expect(result).toEqual({ success: true, step: 5, complete: true });
    expect(db.upsertDealershipSettings).toHaveBeenCalledWith(STORE_A, expect.objectContaining({
      coachingCadenceDay: "monday",
      coachingRunBy: "fi_director",
    }));
    expect(db.updateDealershipOnboarding).toHaveBeenCalledWith(STORE_A, {
      onboardingStep: 5,
      onboardingComplete: true,
    });
  });

  it("rejects invalid time format", async () => {
    const admin = makeUser({ dealershipId: STORE_A, role: "admin" });
    const caller = appRouter.createCaller(makeCtx(admin));
    await expect(
      caller.onboarding.saveCadence({
        coachingCadenceDay: "monday",
        coachingCadenceTime: "9am", // invalid
        coachingRunBy: "fi_director",
      })
    ).rejects.toThrow();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// H. Phase 3 — recaps.yesterday tenant scope + shape
// ────────────────────────────────────────────────────────────────────────────

describe("Phase 3: recaps.yesterday", () => {
  it("Korum user gets digest for own dealership", async () => {
    vi.mocked(db.getDealershipDigest).mockResolvedValueOnce({
      sessions: [
        { id: 1, userId: 1, dealershipId: STORE_A, status: "completed" } as never,
        { id: 2, userId: 1, dealershipId: STORE_A, status: "active" } as never,
      ],
      grades: [
        { sessionId: 1, pvr: 1850, overallScore: 82, complianceScore: 90, menuSequenceScore: 85, objectionResponseScore: 75 } as never,
      ],
      flags: [
        { id: 10, sessionId: 1, severity: "critical", resolved: false } as never,
      ],
      managers: [
        { userId: 1, name: "Sarah", email: "sarah@korum.com", sessionCount: 2, avgPru: 1850, avgScore: 82 },
      ],
    });

    const user = makeUser({ dealershipId: STORE_A });
    const caller = appRouter.createCaller(makeCtx(user));
    const recap = await caller.recaps.yesterday();

    expect(recap.dealershipId).toBe(STORE_A);
    expect(recap.numbers.unitsDelivered).toBe(1);
    expect(recap.numbers.avgPru).toBe(1850);
    expect(recap.numbers.criticalUnresolvedFlags).toBe(1);
    expect(recap.numbers.pendingSessions).toBe(1);
    expect(recap.managers).toHaveLength(1);
    expect(db.getDealershipDigest).toHaveBeenCalledWith(STORE_A, expect.any(Date), expect.any(Date));
  });

  it("user with no dealership assignment gets BAD_REQUEST", async () => {
    const orphan = makeUser({ dealershipId: null });
    const caller = appRouter.createCaller(makeCtx(orphan));
    await expect(caller.recaps.yesterday()).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("non-super-admin cannot pass dealershipId override (always uses their own)", async () => {
    const korumUser = makeUser({ dealershipId: STORE_A });
    const caller = appRouter.createCaller(makeCtx(korumUser));
    // Pass STORE_B explicitly — must be ignored, scope must remain STORE_A.
    await caller.recaps.yesterday({ dealershipId: STORE_B });
    expect(db.getDealershipDigest).toHaveBeenCalledWith(STORE_A, expect.any(Date), expect.any(Date));
    expect(db.getDealershipDigest).not.toHaveBeenCalledWith(STORE_B, expect.any(Date), expect.any(Date));
  });

  it("super admin can target any dealership via input.dealershipId", async () => {
    const adrian = makeUser({ id: 99, isSuperAdmin: true, dealershipId: null });
    const caller = appRouter.createCaller(makeCtx(adrian));
    await caller.recaps.yesterday({ dealershipId: STORE_B });
    expect(db.getDealershipDigest).toHaveBeenCalledWith(STORE_B, expect.any(Date), expect.any(Date));
  });

  it("surfaces coaching moments from low-scoring grade sub-areas", async () => {
    vi.mocked(db.getDealershipDigest).mockResolvedValueOnce({
      sessions: [
        { id: 5, userId: 1, dealershipId: STORE_A, status: "completed" } as never,
      ],
      grades: [
        { sessionId: 5, pvr: 800, overallScore: 60, complianceScore: 65, menuSequenceScore: 50, objectionResponseScore: 50 } as never,
      ],
      flags: [],
      managers: [
        { userId: 1, name: "Sarah", email: "sarah@korum.com", sessionCount: 1, avgPru: 800, avgScore: 60 },
      ],
    });
    const user = makeUser({ dealershipId: STORE_A });
    const caller = appRouter.createCaller(makeCtx(user));
    const recap = await caller.recaps.yesterday();
    // 3 distinct coaching moments (compliance, menu, objection) for 1 grade.
    expect(recap.coachingMoments).toHaveLength(3);
    // Thin deal flagged (PRU < $1,200).
    expect(recap.numbers.thinDeals).toBe(1);
  });
});

describe("tRPC isolation: sessions.list scope routing", () => {
  it("regular Korum user only sees their own sessions (getSessionsByUserId, NOT getAllSessions)", async () => {
    vi.mocked(db.getSessionsByUserId).mockResolvedValueOnce([]);
    vi.mocked(db.getSessionCountByUser).mockResolvedValueOnce(0);

    const korumUser = makeUser({ id: 1, dealershipId: STORE_A, role: "user" });
    const caller = appRouter.createCaller(makeCtx(korumUser));
    await caller.sessions.list({ limit: 50, offset: 0 });

    expect(db.getSessionsByUserId).toHaveBeenCalledWith(1, 50, 0);
    expect(db.getAllSessions).not.toHaveBeenCalled();
  });

  it("Korum admin only sees Korum sessions (getAllSessions called with their dealershipId, never undefined)", async () => {
    vi.mocked(db.getAllSessions).mockResolvedValueOnce([]);
    vi.mocked(db.getSessionCount).mockResolvedValueOnce(0);

    const korumAdmin = makeUser({ id: 2, dealershipId: STORE_A, role: "admin" });
    const caller = appRouter.createCaller(makeCtx(korumAdmin));
    await caller.sessions.list({ limit: 50, offset: 0 });

    // The dealershipId arg MUST be STORE_A — never undefined (which would return
    // every tenant's sessions because the loose param defaults to no filter).
    expect(db.getAllSessions).toHaveBeenCalledWith(50, 0, STORE_A);
    expect(db.getSessionCount).toHaveBeenCalledWith(STORE_A);
  });

  it("super admin sees ALL sessions across tenants", async () => {
    vi.mocked(db.getAllSessions).mockResolvedValueOnce([]);
    vi.mocked(db.getSessionCount).mockResolvedValueOnce(0);

    const adrian = makeUser({ id: 99, isSuperAdmin: true, dealershipId: null });
    const caller = appRouter.createCaller(makeCtx(adrian));
    await caller.sessions.list({ limit: 50, offset: 0 });

    // For super admin, no dealershipId filter is passed (intentional cross-tenant view).
    expect(db.getAllSessions).toHaveBeenCalledWith(50, 0);
    expect(db.getSessionCount).toHaveBeenCalledWith();
  });
});
