/**
 * Full Session Export PDF
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates a comprehensive session export PDF containing:
 *   1. Session header (manager, date, deal number, vehicle)
 *   2. Full transcript with timestamps
 *   3. ASURA OPS Scorecard (4-pillar scores + Tier badge)
 *   4. Compliance Report (pass/fail by rule)
 *   5. Top 5 coaching priorities
 *   6. One-page coaching summary for 15-minute weekly meeting
 *
 * Uses PDFKit (already a dependency). No puppeteer needed.
 */

import PDFDocument from "pdfkit";
import type { AsuraScorecard } from "../drizzle/schema";

// ─── Input Types ──────────────────────────────────────────────────────────────

interface SessionInfo {
  id: number;
  customerName?: string | null;
  dealNumber?: string | null;
  dealType?: string | null;
  vehicleType?: string | null;
  startedAt?: Date | null;
  durationSeconds?: number | null;
  status?: string | null;
}

interface GradeInfo {
  overallScore?: number | null;
  rapportScore?: number | null;
  productPresentationScore?: number | null;
  objectionHandlingScore?: number | null;
  closingTechniqueScore?: number | null;
  complianceScore?: number | null;
  scriptFidelityScore?: number | null;
  processAdherenceScore?: number | null;
  strengths?: string | null;
  improvements?: string | null;
  coachingNotes?: string | null;
}

interface TranscriptEntry {
  id?: number;
  speaker?: string | null;
  text?: string | null;
  startTime?: number | null;
  endTime?: number | null;
  confidence?: number | null;
  isFinal?: boolean | null;
  createdAt?: Date | null;
}

interface ComplianceFlagEntry {
  id?: number;
  severity?: string | null;
  rule?: string | null;
  description?: string | null;
  excerpt?: string | null;
  timestamp?: number | null;
  category?: string | null;
}

interface ManagerInfo {
  name?: string | null;
  email?: string | null;
  dealership?: string | null;
}

interface ExportInput {
  session: SessionInfo;
  grade: GradeInfo | null;
  scorecard: AsuraScorecard | null;
  transcripts: TranscriptEntry[];
  complianceFlags: ComplianceFlagEntry[];
  manager: ManagerInfo;
}

// ─── Color Palette ────────────────────────────────────────────────────────────

const C = {
  navy: "#0a1628",
  navyMed: "#0f1f3d",
  blue: "#1e3a5f",
  accent: "#e94560",
  gold: "#f5a623",
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
  white: "#ffffff",
  lightGray: "#f8fafc",
  medGray: "#64748b",
  darkGray: "#334155",
  border: "#e2e8f0",
  bgLight: "#f1f5f9",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(s: number | null | undefined): string {
  if (s == null) return C.medGray;
  if (s >= 85) return C.green;
  if (s >= 70) return C.gold;
  if (s >= 55) return C.orange;
  return C.red;
}

function formatTime(seconds: number | null | undefined): string {
  if (seconds == null) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function dealTypeLabel(dt: string | null | undefined): string {
  const map: Record<string, string> = {
    retail_finance: "Retail Finance",
    lease: "Lease",
    cash: "Cash",
  };
  return dt ? (map[dt] ?? dt) : "—";
}

function vehicleTypeLabel(vt: string | null | undefined): string {
  const map: Record<string, string> = { new: "New", used: "Used", cpo: "CPO" };
  return vt ? (map[vt] ?? vt) : "—";
}

function formatDuration(s: number | null | undefined): string {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

function tierColor(tier: string | null | undefined): string {
  if (!tier) return C.medGray;
  if (tier === "Tier-1") return C.green;
  if (tier === "Tier-2") return C.gold;
  if (tier === "Tier-3") return C.orange;
  return C.red;
}

function checkPageBreak(doc: PDFKit.PDFDocument, y: number, needed: number): number {
  if (y + needed > doc.page.height - 80) {
    doc.addPage();
    return 70;
  }
  return y;
}

function sectionHeader(doc: PDFKit.PDFDocument, title: string, y: number, pageW: number): number {
  y = checkPageBreak(doc, y, 36);
  doc.rect(60, y, pageW, 26).fill(C.navy);
  doc.rect(60, y + 26, pageW, 2).fill(C.accent);
  doc.fillColor(C.white).fontSize(9).font("Helvetica-Bold")
    .text(title, 70, y + 9, { width: pageW - 20 });
  return y + 38;
}

function scoreBar(
  doc: PDFKit.PDFDocument,
  label: string,
  value: number | null | undefined,
  y: number,
  pageW: number
): number {
  y = checkPageBreak(doc, y, 26);
  const score = value != null ? Math.round(value) : null;
  const color = scoreColor(score);
  const barW = score != null ? Math.round((pageW - 180) * (score / 100)) : 0;

  doc.fillColor(C.darkGray).fontSize(9).font("Helvetica")
    .text(label, 60, y + 4, { width: 165 });
  doc.rect(235, y + 6, pageW - 180, 10).fill(C.border);
  if (barW > 0) doc.rect(235, y + 6, barW, 10).fill(color);
  doc.fillColor(color).fontSize(10).font("Helvetica-Bold")
    .text(score != null ? `${score}` : "—", 60 + pageW - 30, y + 3, { width: 30, align: "right" });
  return y + 24;
}

// ─── Main Generator ───────────────────────────────────────────────────────────

export async function generateSessionExportPDF(input: ExportInput): Promise<Buffer> {
  const { session, grade, scorecard, transcripts, complianceFlags, manager } = input;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 70, bottom: 60, left: 60, right: 60 },
      info: {
        Title: `Session Export — ${session.customerName ?? `Session #${session.id}`}`,
        Author: "ASURA Group F&I Co-Pilot",
        Subject: "F&I Session Export",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width - 120;
    let y = 70;

    // ══════════════════════════════════════════════════════════════════════════
    // PAGE 1 — Header + Session Info + Scorecard Overview
    // ══════════════════════════════════════════════════════════════════════════

    // ── Banner ───────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 130).fill(C.navy);
    doc.rect(0, 122, doc.page.width, 6).fill(C.accent);

    // ASURA branding
    doc.fillColor(C.white).fontSize(24).font("Helvetica-Bold")
      .text("ASURA GROUP", 60, 24);
    doc.fillColor(C.accent).fontSize(10).font("Helvetica")
      .text("F&I CO-PILOT  ·  SESSION EXPORT", 60, 52);

    // Generated timestamp
    doc.fillColor(C.medGray).fontSize(8).font("Helvetica")
      .text(`Generated: ${formatDate(new Date())}`, 60, 76, { width: pageW, align: "right" });

    // Manager info in banner
    doc.fillColor(C.lightGray).fontSize(9).font("Helvetica")
      .text(`${manager.name ?? "—"}  |  ${manager.dealership ?? "—"}`, 60, 98, { width: pageW });

    y = 150;

    // ── Session Header Card ───────────────────────────────────────────────────
    doc.rect(60, y, pageW, 90).fill(C.bgLight).stroke(C.border);

    const col1 = 75;
    const col2 = 60 + pageW * 0.35;
    const col3 = 60 + pageW * 0.65;
    const iy = y + 12;

    // Row 1 labels
    doc.fillColor(C.medGray).fontSize(7).font("Helvetica-Bold")
      .text("CUSTOMER", col1, iy)
      .text("DEAL #", col2, iy)
      .text("DATE", col3, iy);

    // Row 1 values
    doc.fillColor(C.navy).fontSize(13).font("Helvetica-Bold")
      .text(session.customerName ?? "Unknown Customer", col1, iy + 12, { width: pageW * 0.32 })
      .text(session.dealNumber ?? "—", col2, iy + 12, { width: pageW * 0.28 })
      .text(formatDateShort(session.startedAt), col3, iy + 12, { width: pageW * 0.32 });

    // Row 2 labels
    const r2y = iy + 42;
    doc.fillColor(C.medGray).fontSize(7).font("Helvetica-Bold")
      .text("VEHICLE", col1, r2y)
      .text("DEAL TYPE", col2, r2y)
      .text("DURATION", col3, r2y);

    // Row 2 values
    doc.fillColor(C.darkGray).fontSize(10).font("Helvetica")
      .text(vehicleTypeLabel(session.vehicleType), col1, r2y + 10, { width: pageW * 0.32 })
      .text(dealTypeLabel(session.dealType), col2, r2y + 10, { width: pageW * 0.28 })
      .text(formatDuration(session.durationSeconds), col3, r2y + 10, { width: pageW * 0.32 });

    y += 108;

    // ── ASURA OPS Scorecard ───────────────────────────────────────────────────
    if (scorecard) {
      y = sectionHeader(doc, "ASURA OPS SCORECARD — TIER-1 PERFORMANCE", y, pageW);

      // Tier badge + overall score
      const tierClr = tierColor(scorecard.tier);
      doc.rect(60, y, pageW, 56).fill(C.navyMed);

      // Overall tier-1 score
      doc.fillColor(tierClr).fontSize(40).font("Helvetica-Bold")
        .text(String(Math.round(scorecard.tier1Score)), 76, y + 8);
      doc.fillColor(C.white).fontSize(10).font("Helvetica")
        .text("TIER-1 SCORE", 76, y + 44);

      // Tier badge
      doc.fillColor(tierClr).fontSize(20).font("Helvetica-Bold")
        .text(scorecard.tier, 60 + pageW - 120, y + 16, { width: 110, align: "right" });

      y += 66;

      // 4-pillar bars
      const pillars = [
        { label: "Menu Order System", value: scorecard.menuOrderScore },
        { label: "Upgrade Architecture", value: scorecard.upgradeArchitectureScore },
        { label: "Objection Prevention Framework", value: scorecard.objectionPreventionScore },
        { label: "Coaching Cadence", value: scorecard.coachingCadenceScore },
      ];

      for (const p of pillars) {
        y = scoreBar(doc, p.label, p.value, y, pageW);
      }

      // Top coaching priorities
      if (scorecard.coachingPriorities && scorecard.coachingPriorities.length > 0) {
        y += 8;
        y = checkPageBreak(doc, y, 20 + scorecard.coachingPriorities.slice(0, 5).length * 16);
        doc.fillColor(C.navy).fontSize(9).font("Helvetica-Bold")
          .text("TOP COACHING PRIORITIES:", 60, y);
        y += 14;
        scorecard.coachingPriorities.slice(0, 5).forEach((p, i) => {
          y = checkPageBreak(doc, y, 16);
          doc.fillColor(C.accent).fontSize(9).font("Helvetica-Bold")
            .text(`${i + 1}.`, 68, y);
          doc.fillColor(C.darkGray).fontSize(9).font("Helvetica")
            .text(p, 82, y, { width: pageW - 25 });
          y += 14;
        });
        y += 6;
      }
    }

    // ── Grade Scores (from Performance Grade) ─────────────────────────────────
    if (grade && grade.overallScore != null) {
      y = checkPageBreak(doc, y, 40);
      y = sectionHeader(doc, "PERFORMANCE GRADE BREAKDOWN", y, pageW);

      const gradeScores = [
        { label: "Overall Score", value: grade.overallScore },
        { label: "Rapport Building", value: grade.rapportScore },
        { label: "Product Presentation", value: grade.productPresentationScore },
        { label: "Objection Handling", value: grade.objectionHandlingScore },
        { label: "Closing Technique", value: grade.closingTechniqueScore },
        { label: "Compliance", value: grade.complianceScore },
        { label: "Script Fidelity", value: grade.scriptFidelityScore },
        { label: "Process Adherence", value: grade.processAdherenceScore },
      ];

      for (const gs of gradeScores) {
        y = scoreBar(doc, gs.label, gs.value, y, pageW);
      }

      if (grade.strengths) {
        y = checkPageBreak(doc, y, 40);
        y += 8;
        doc.fillColor(C.green).fontSize(9).font("Helvetica-Bold").text("STRENGTHS:", 60, y);
        y += 13;
        doc.fillColor(C.darkGray).fontSize(9).font("Helvetica")
          .text(grade.strengths, 60, y, { width: pageW, lineGap: 2 });
        y = doc.y + 10;
      }

      if (grade.improvements) {
        y = checkPageBreak(doc, y, 40);
        doc.fillColor(C.gold).fontSize(9).font("Helvetica-Bold").text("AREAS TO IMPROVE:", 60, y);
        y += 13;
        doc.fillColor(C.darkGray).fontSize(9).font("Helvetica")
          .text(grade.improvements, 60, y, { width: pageW, lineGap: 2 });
        y = doc.y + 10;
      }

      if (grade.coachingNotes) {
        y = checkPageBreak(doc, y, 40);
        doc.fillColor(C.navy).fontSize(9).font("Helvetica-Bold").text("COACHING NOTES:", 60, y);
        y += 13;
        doc.fillColor(C.darkGray).fontSize(9).font("Helvetica")
          .text(grade.coachingNotes, 60, y, { width: pageW, lineGap: 2 });
        y = doc.y + 10;
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // COMPLIANCE REPORT
    // ══════════════════════════════════════════════════════════════════════════

    if (complianceFlags.length > 0) {
      y = checkPageBreak(doc, y, 60);
      y = sectionHeader(doc, `COMPLIANCE REPORT — ${complianceFlags.length} FLAG(S) DETECTED`, y, pageW);

      const critical = complianceFlags.filter((f) => f.severity === "critical");
      const warnings = complianceFlags.filter((f) => f.severity === "warning");
      const info = complianceFlags.filter((f) => f.severity === "info");

      // Summary row
      const summaryItems = [
        { label: "CRITICAL", count: critical.length, color: C.red },
        { label: "WARNING", count: warnings.length, color: C.gold },
        { label: "INFO", count: info.length, color: C.medGray },
      ];

      y = checkPageBreak(doc, y, 30);
      let sx = 60;
      for (const si of summaryItems) {
        doc.rect(sx, y, 80, 24).fill(si.color + "22");
        doc.fillColor(si.color).fontSize(14).font("Helvetica-Bold")
          .text(String(si.count), sx + 6, y + 4, { width: 30 });
        doc.fontSize(8).font("Helvetica")
          .text(si.label, sx + 32, y + 8, { width: 46 });
        sx += 90;
      }
      y += 32;

      // Individual flags
      for (const flag of complianceFlags) {
        y = checkPageBreak(doc, y, 42);
        const sev = (flag.severity ?? "info") as string;
        const flagColor = sev === "critical" ? C.red : sev === "warning" ? C.gold : C.medGray;
        const bgColor = sev === "critical" ? "#fef2f2" : sev === "warning" ? "#fffbeb" : "#f8fafc";

        doc.rect(60, y, pageW, 38).fill(bgColor).stroke(C.border);
        doc.rect(60, y, 4, 38).fill(flagColor);

        doc.fillColor(flagColor).fontSize(8).font("Helvetica-Bold")
          .text(sev.toUpperCase(), 72, y + 4, { width: 50 });
        doc.fillColor(C.navy).fontSize(9).font("Helvetica-Bold")
          .text(flag.rule ?? "Compliance Issue", 72, y + 15, { width: pageW - 20 });
        doc.fillColor(C.medGray).fontSize(8).font("Helvetica")
          .text(flag.description ?? "", 72, y + 26, { width: pageW - 20 });
        y += 44;
      }
    } else {
      y = checkPageBreak(doc, y, 40);
      y = sectionHeader(doc, "COMPLIANCE REPORT — NO FLAGS DETECTED", y, pageW);
      doc.rect(60, y, pageW, 28).fill("#f0fdf4").stroke("#bbf7d0");
      doc.fillColor(C.green).fontSize(10).font("Helvetica-Bold")
        .text("✓ PASS — No compliance issues detected in this session.", 72, y + 9, { width: pageW - 20 });
      y += 36;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TRANSCRIPT
    // ══════════════════════════════════════════════════════════════════════════

    if (transcripts.length > 0) {
      doc.addPage();
      y = 70;
      y = sectionHeader(doc, `FULL TRANSCRIPT — ${transcripts.length} ENTRIES`, y, pageW);

      for (const entry of transcripts) {
        const spk = (entry.speaker ?? "unknown").toLowerCase();
        const isManager = spk === "manager";
        const isCustomer = spk === "customer";
        const rowColor = isManager ? "#eff6ff" : isCustomer ? "#f0fdf4" : C.bgLight;
        const spkLabel = isManager ? "F&I MGR" : isCustomer ? "CUSTOMER" : "UNKNOWN";
        const spkColor = isManager ? "#1d4ed8" : isCustomer ? "#166534" : C.medGray;
        const text = String(entry.text ?? "").trim();
        if (!text) continue;

        // Estimate height needed
        const textLines = Math.ceil(text.length / 85) + 1;
        const rowH = Math.max(36, 20 + textLines * 12);

        y = checkPageBreak(doc, y, rowH + 4);
        doc.rect(60, y, pageW, rowH).fill(rowColor).stroke(C.border);

        // Timestamp
        doc.fillColor(C.medGray).fontSize(7).font("Helvetica")
          .text(formatTime(entry.startTime), 66, y + 5, { width: 30 });

        // Speaker badge
        doc.fillColor(spkColor).fontSize(7).font("Helvetica-Bold")
          .text(spkLabel, 100, y + 5, { width: 44 });

        // Text
        doc.fillColor(C.navy).fontSize(9).font("Helvetica")
          .text(text, 150, y + 5, { width: pageW - 98, lineGap: 1 });

        y += rowH + 3;
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // COACHING SUMMARY PAGE (15-minute meeting format)
    // ══════════════════════════════════════════════════════════════════════════

    doc.addPage();
    y = 70;

    // Banner
    doc.rect(0, 0, doc.page.width, 70).fill(C.navy);
    doc.rect(0, 62, doc.page.width, 4).fill(C.accent);
    doc.fillColor(C.white).fontSize(16).font("Helvetica-Bold")
      .text("15-MINUTE COACHING MEETING GUIDE", 60, 22);
    doc.fillColor(C.medGray).fontSize(9).font("Helvetica")
      .text(`${session.customerName ?? `Session #${session.id}`} — ${formatDateShort(session.startedAt)}`, 60, 44);

    y = 88;

    // Overall result
    const overallScore = scorecard?.tier1Score ?? grade?.overallScore;
    if (overallScore != null) {
      doc.rect(60, y, pageW, 44).fill(C.navyMed);
      const sc = Math.round(overallScore);
      const tierLabel = scorecard?.tier ?? (sc >= 85 ? "Tier-1" : sc >= 70 ? "Tier-2" : sc >= 55 ? "Tier-3" : "Below-Tier");
      const clr = tierColor(tierLabel);
      doc.fillColor(clr).fontSize(28).font("Helvetica-Bold").text(String(sc), 76, y + 8);
      doc.fillColor(C.white).fontSize(11).font("Helvetica-Bold").text(tierLabel, 76 + 60, y + 8);
      doc.fillColor(C.medGray).fontSize(9).font("Helvetica")
        .text(session.customerName ?? `Session #${session.id}`, 76 + 60, y + 24);
      y += 56;
    }

    // Meeting agenda
    y = sectionHeader(doc, "MEETING AGENDA (15 MINUTES)", y, pageW);

    const agenda = [
      { time: "0:00 – 2:00", item: "Review overall score and tier" },
      { time: "2:00 – 5:00", item: "Walk through top 3 coaching priorities" },
      { time: "5:00 – 8:00", item: "Review compliance flags (if any)" },
      { time: "8:00 – 11:00", item: "Role-play the weakest segment of the transcript" },
      { time: "11:00 – 13:00", item: "Set 1 specific action for next session" },
      { time: "13:00 – 15:00", item: "Commit to a date for the next review" },
    ];

    for (const ag of agenda) {
      y = checkPageBreak(doc, y, 20);
      doc.fillColor(C.accent).fontSize(8).font("Helvetica-Bold")
        .text(ag.time, 60, y, { width: 90 });
      doc.fillColor(C.darkGray).fontSize(9).font("Helvetica")
        .text(ag.item, 158, y, { width: pageW - 100 });
      y += 16;
    }

    y += 8;

    // Top priorities
    const priorities = scorecard?.coachingPriorities?.slice(0, 5) ??
      (grade?.improvements ? [grade.improvements] : []);

    if (priorities.length > 0) {
      y = sectionHeader(doc, "TOP COACHING PRIORITIES", y, pageW);
      priorities.forEach((p, i) => {
        y = checkPageBreak(doc, y, 26);
        doc.rect(60, y, pageW, 22).fill(i % 2 === 0 ? C.bgLight : C.white);
        doc.fillColor(C.accent).fontSize(10).font("Helvetica-Bold")
          .text(`${i + 1}`, 68, y + 6, { width: 16 });
        doc.fillColor(C.navy).fontSize(9).font("Helvetica")
          .text(p, 88, y + 6, { width: pageW - 36 });
        y += 24;
      });
      y += 8;
    }

    // Compliance summary
    const criticalCount = complianceFlags.filter((f) => f.severity === "critical").length;
    const warningCount = complianceFlags.filter((f) => f.severity === "warning").length;

    y = sectionHeader(doc, "COMPLIANCE SUMMARY", y, pageW);
    y = checkPageBreak(doc, y, 40);

    if (criticalCount === 0 && warningCount === 0) {
      doc.rect(60, y, pageW, 24).fill("#f0fdf4");
      doc.fillColor(C.green).fontSize(10).font("Helvetica-Bold")
        .text("✓ PASS — No compliance flags in this session.", 72, y + 7, { width: pageW - 20 });
      y += 32;
    } else {
      doc.rect(60, y, pageW, 24).fill(criticalCount > 0 ? "#fef2f2" : "#fffbeb");
      const msg = criticalCount > 0
        ? `⚠ ${criticalCount} CRITICAL + ${warningCount} WARNING flags detected. Review before next session.`
        : `! ${warningCount} WARNING flag(s) detected. Review best practices.`;
      doc.fillColor(criticalCount > 0 ? C.red : C.gold).fontSize(10).font("Helvetica-Bold")
        .text(msg, 72, y + 7, { width: pageW - 20 });
      y += 32;
    }

    // Action item box
    y = checkPageBreak(doc, y, 60);
    y = sectionHeader(doc, "ACTION ITEM FOR NEXT SESSION", y, pageW);
    doc.rect(60, y, pageW, 50).fill(C.bgLight).stroke(C.border);
    doc.fillColor(C.medGray).fontSize(8).font("Helvetica")
      .text("Manager commits to:", 72, y + 8);
    doc.rect(72, y + 20, pageW - 24, 1).fill(C.border);
    doc.rect(72, y + 32, pageW - 24, 1).fill(C.border);
    y += 58;

    // Footer
    const footerY = doc.page.height - 44;
    doc.rect(0, footerY - 8, doc.page.width, 52).fill(C.navy);
    doc.fillColor(C.medGray).fontSize(7).font("Helvetica")
      .text(
        `ASURA Group F&I Co-Pilot  |  Confidential Coaching Export  |  Session #${session.id}  |  ${formatDate(session.startedAt)}`,
        60,
        footerY + 6,
        { width: pageW, align: "center" }
      );

    doc.end();
  });
}
