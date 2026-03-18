/**
 * PDF Download Routes
 * REST endpoints for downloading coaching reports as PDFs.
 * These are separate from tRPC because they stream binary content.
 */
import { type Express, type Request, type Response } from "express";
import { sdk } from "./_core/sdk";
import {
  getSessionById, getGradeBySession, getReportBySession, getDb,
  getTranscriptsBySession, getFlagsBySession, getScorecardBySession,
} from "./db";
import { generateCoachingReportPDF } from "./pdf-report";
import { generateSessionExportPDF } from "./session-export-pdf";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export function registerPdfRoutes(app: Express) {
  /**
   * GET /api/pdf/coaching-report/:sessionId
   * Downloads a PDF coaching report for the given session.
   * Requires a valid session cookie.
   */
  app.get("/api/pdf/coaching-report/:sessionId", async (req: Request, res: Response) => {
    try {
      // Auth: verify session cookie via SDK
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const sessionId = parseInt(req.params.sessionId, 10);
      if (isNaN(sessionId)) {
        res.status(400).json({ error: "Invalid session ID" });
        return;
      }

      // Fetch session, grade, report in parallel
      const [session, grade, report] = await Promise.all([
        getSessionById(sessionId),
        getGradeBySession(sessionId),
        getReportBySession(sessionId),
      ]);

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      // Access control: only owner or admin
      if (user.role !== "admin" && session.userId !== user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      // Fetch manager info
      let manager = { name: user.name, email: user.email, dealership: user.dealership };
      if (session.userId !== user.id) {
        const db = await getDb();
        if (db) {
          const rows = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
          if (rows[0]) {
            manager = { name: rows[0].name, email: rows[0].email, dealership: rows[0].dealership };
          }
        }
      }

      // Generate PDF
      const pdfBuffer = await generateCoachingReportPDF(
        session,
        grade ?? null,
        // Cast json fields — they are stored as unknown in Drizzle but conform to ReportInfo
        report as Parameters<typeof generateCoachingReportPDF>[2],
        manager
      );

      const customerSlug = (session.customerName ?? `session-${sessionId}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const filename = `coaching-report-${customerSlug}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (err) {
      console.error("[PDF] Generation error:", err);
      res.status(500).json({ error: "PDF generation failed" });
    }
  });

  /**
   * GET /api/sessions/:id/export/pdf
   * Full session export PDF: header + transcript + ASURA scorecard + compliance report + coaching priorities.
   * Requires a valid session cookie.
   */
  app.get("/api/sessions/:id/export/pdf", async (req: Request, res: Response) => {
    try {
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const sessionId = parseInt(req.params.id, 10);
      if (isNaN(sessionId)) {
        res.status(400).json({ error: "Invalid session ID" });
        return;
      }

      // Fetch all data in parallel
      const [session, grade, scorecard, transcripts, complianceFlags] = await Promise.all([
        getSessionById(sessionId),
        getGradeBySession(sessionId),
        getScorecardBySession(sessionId),
        getTranscriptsBySession(sessionId),
        getFlagsBySession(sessionId),
      ]);

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      // Access control: owner or admin
      if (user.role !== "admin" && session.userId !== user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      // Fetch manager info
      let manager = { name: user.name, email: user.email, dealership: user.dealership };
      if (session.userId !== user.id) {
        const db = await getDb();
        if (db) {
          const rows = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
          if (rows[0]) {
            manager = { name: rows[0].name, email: rows[0].email, dealership: rows[0].dealership };
          }
        }
      }

      const pdfBuffer = await generateSessionExportPDF({
        session,
        grade: grade ?? null,
        scorecard: scorecard ?? null,
        transcripts: transcripts ?? [],
        complianceFlags: complianceFlags ?? [],
        manager,
      });

      const customerSlug = (session.customerName ?? `session-${sessionId}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const filename = `session-export-${customerSlug}-${sessionId}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (err) {
      console.error("[PDF] Session export error:", err);
      res.status(500).json({ error: "Session export failed" });
    }
  });
}
