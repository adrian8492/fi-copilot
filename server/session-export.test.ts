/**
 * Session Export Tests
 * Tests for the PDF generation and export logic.
 */

import { describe, expect, it } from "vitest";
import { generateSessionExportPDF } from "./session-export-pdf";

// ─── generateSessionExportPDF ─────────────────────────────────────────────────

describe("generateSessionExportPDF", () => {
  const baseSession = {
    id: 42,
    customerName: "John Smith",
    dealNumber: "D-12345",
    dealType: "retail_finance",
    vehicleType: "new",
    startedAt: new Date("2026-03-17T10:00:00Z"),
    durationSeconds: 1800,
    status: "completed",
  };

  const baseManager = {
    name: "Mike Johnson",
    email: "mike@dealer.com",
    dealership: "Premier Auto Group",
  };

  it("generates a non-empty Buffer for minimal session", async () => {
    const buf = await generateSessionExportPDF({
      session: baseSession,
      grade: null,
      scorecard: null,
      transcripts: [],
      complianceFlags: [],
      manager: baseManager,
    });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(1000);
  });

  it("generates a larger PDF when transcript entries are included", async () => {
    const transcripts = [
      { id: 1, speaker: "manager", text: "Good afternoon, welcome to the finance office!", startTime: 0, isFinal: true },
      { id: 2, speaker: "customer", text: "Thank you, good afternoon.", startTime: 5, isFinal: true },
      { id: 3, speaker: "manager", text: "On a scale of 1-10, how important is it that your vehicle expenses stay predictable?", startTime: 15, isFinal: true },
    ];

    const bufNoTx = await generateSessionExportPDF({
      session: baseSession, grade: null, scorecard: null, transcripts: [], complianceFlags: [], manager: baseManager,
    });
    const bufWithTx = await generateSessionExportPDF({
      session: baseSession, grade: null, scorecard: null, transcripts, complianceFlags: [], manager: baseManager,
    });

    expect(bufWithTx.length).toBeGreaterThan(bufNoTx.length);
  });

  it("generates a valid PDF (starts with PDF magic bytes)", async () => {
    const buf = await generateSessionExportPDF({
      session: baseSession, grade: null, scorecard: null, transcripts: [], complianceFlags: [], manager: baseManager,
    });
    // PDF files start with %PDF
    const header = buf.slice(0, 4).toString("ascii");
    expect(header).toBe("%PDF");
  });

  it("includes compliance flags section when flags present", async () => {
    const flags = [
      { id: 1, severity: "critical", rule: "TILA: APR Disclosure", description: "APR was not disclosed verbally." },
      { id: 2, severity: "warning", rule: "UDAP: Misleading Claim", description: "Misleading product claim detected." },
    ];

    const buf = await generateSessionExportPDF({
      session: baseSession, grade: null, scorecard: null, transcripts: [], complianceFlags: flags, manager: baseManager,
    });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(2000);
  });

  it("handles sessions with no customer name gracefully", async () => {
    const session = { ...baseSession, customerName: null, dealNumber: null };
    const buf = await generateSessionExportPDF({
      session, grade: null, scorecard: null, transcripts: [], complianceFlags: [], manager: baseManager,
    });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(1000);
  });

  it("includes grade information when grade is provided", async () => {
    const grade = {
      overallScore: 78,
      rapportScore: 82,
      productPresentationScore: 75,
      objectionHandlingScore: 70,
      closingTechniqueScore: 85,
      complianceScore: 90,
      scriptFidelityScore: 68,
      processAdherenceScore: 72,
      strengths: "Excellent product knowledge and rapport",
      improvements: "Work on consequence framing and closing language",
      coachingNotes: "Focus on the scale of 1-10 survey question",
    };

    const bufNoGrade = await generateSessionExportPDF({
      session: baseSession, grade: null, scorecard: null, transcripts: [], complianceFlags: [], manager: baseManager,
    });
    const bufWithGrade = await generateSessionExportPDF({
      session: baseSession, grade, scorecard: null, transcripts: [], complianceFlags: [], manager: baseManager,
    });

    expect(bufWithGrade.length).toBeGreaterThan(bufNoGrade.length);
  });

  it("handles ASURA scorecard data correctly", async () => {
    const scorecard = {
      id: 1,
      sessionId: 42,
      userId: 1,
      tier1Score: 82.5,
      tier: "Tier-1",
      menuOrderScore: 85,
      upgradeArchitectureScore: 80,
      objectionPreventionScore: 78,
      coachingCadenceScore: 86,
      menuOrderPillar: null,
      upgradeArchitecturePillar: null,
      objectionPreventionPillar: null,
      coachingCadencePillar: null,
      coachingPriorities: ["Strengthen consequence framing", "Run client survey every time", "Present Option 1 first"],
      gradedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const buf = await generateSessionExportPDF({
      session: baseSession, grade: null, scorecard, transcripts: [], complianceFlags: [], manager: baseManager,
    });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(2000);
  });

  it("generates coaching summary page for 15-minute meeting", async () => {
    const grade = { overallScore: 65, improvements: "Work on consequence framing", strengths: "Good rapport", coachingNotes: "Run the survey" };
    const scorecard = {
      id: 1, sessionId: 42, userId: 1,
      tier1Score: 65, tier: "Tier-2",
      menuOrderScore: 70, upgradeArchitectureScore: 60, objectionPreventionScore: 65, coachingCadenceScore: 65,
      menuOrderPillar: null, upgradeArchitecturePillar: null, objectionPreventionPillar: null, coachingCadencePillar: null,
      coachingPriorities: ["Priority 1", "Priority 2", "Priority 3", "Priority 4", "Priority 5"],
      gradedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
    };
    const buf = await generateSessionExportPDF({
      session: baseSession, grade, scorecard, transcripts: [], complianceFlags: [], manager: baseManager,
    });
    // Should be larger due to coaching summary page
    const bufMinimal = await generateSessionExportPDF({
      session: baseSession, grade: null, scorecard: null, transcripts: [], complianceFlags: [], manager: baseManager,
    });
    expect(buf.length).toBeGreaterThan(bufMinimal.length);
  });

  it("handles long transcript without throwing", async () => {
    const transcripts = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      speaker: i % 2 === 0 ? "manager" : "customer",
      text: `Transcript line ${i}: This is a typical F&I conversation line with some length to it for testing purposes.`,
      startTime: i * 30,
      isFinal: true,
    }));
    const buf = await generateSessionExportPDF({
      session: baseSession, grade: null, scorecard: null, transcripts, complianceFlags: [], manager: baseManager,
    });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(5000);
  });

  it("handles manager with no name gracefully", async () => {
    const manager = { name: null, email: null, dealership: null };
    const buf = await generateSessionExportPDF({
      session: baseSession, grade: null, scorecard: null, transcripts: [], complianceFlags: [], manager,
    });
    expect(Buffer.isBuffer(buf)).toBe(true);
  });
});
