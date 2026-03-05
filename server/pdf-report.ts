/**
 * PDF Coaching Report Generator
 * Generates a formatted PDF coaching report for an F&I session using PDFKit.
 */
import PDFDocument from "pdfkit";
import { Readable } from "stream";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SessionInfo {
  id: number;
  customerName?: string | null;
  dealNumber?: string | null;
  dealType?: string | null;
  vehicleType?: string | null;
  startedAt?: Date | null;
  durationSeconds?: number | null;
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
  menuSequenceScore?: number | null;
  objectionResponseScore?: number | null;
  transitionAccuracyScore?: number | null;
  strengths?: string | null;
  improvements?: string | null;
  coachingNotes?: string | null;
}

interface ReportInfo {
  executiveSummary?: string | null;
  sentimentOverall?: string | null;
  sentimentManagerScore?: number | null;
  sentimentCustomerScore?: number | null;
  purchaseLikelihoodScore?: number | null;
  recommendations?: string | null;
  behaviorInsights?: string | null;
  keyMoments?: Array<{ description: string; impact: string }> | null;
  productOpportunities?: Array<{ product: string; status: string; note: string }> | null;
  objectionPatterns?: Array<{ type: string; frequency: number; resolution: string }> | null;
}

interface ManagerInfo {
  name?: string | null;
  email?: string | null;
  dealership?: string | null;
}

// ─── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
  primary: "#1a1a2e",       // Deep navy
  accent: "#e94560",        // ASURA red
  accentBlue: "#0f3460",    // Dark blue
  gold: "#f5a623",          // Gold for scores
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
  white: "#ffffff",
  lightGray: "#f8f9fa",
  medGray: "#6b7280",
  darkGray: "#374151",
  border: "#e5e7eb",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scoreColor(score: number | null | undefined): string {
  if (score == null) return COLORS.medGray;
  if (score >= 85) return COLORS.green;
  if (score >= 70) return COLORS.gold;
  if (score >= 55) return "#f97316"; // orange
  return COLORS.red;
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
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

function dealTypeLabel(dt: string | null | undefined): string {
  const map: Record<string, string> = {
    retail_finance: "Retail Finance",
    lease: "Lease",
    cash: "Cash",
  };
  return dt ? (map[dt] ?? dt) : "—";
}

// ─── PDF Builder ──────────────────────────────────────────────────────────────
export async function generateCoachingReportPDF(
  session: SessionInfo,
  grade: GradeInfo | null,
  report: ReportInfo | null,
  manager: ManagerInfo
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 60, bottom: 60, left: 60, right: 60 },
      info: {
        Title: `F&I Coaching Report — ${session.customerName ?? "Session " + session.id}`,
        Author: "ASURA Group F&I Co-Pilot",
        Subject: "F&I Performance Coaching Report",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 120; // 60px margins each side
    let y = 60;

    // ── Header Banner ──────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 110).fill(COLORS.primary);
    doc.rect(0, 100, doc.page.width, 6).fill(COLORS.accent);

    // Logo / Brand
    doc.fillColor(COLORS.white)
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("ASURA GROUP", 60, 28, { continued: false });

    doc.fillColor(COLORS.accent)
      .fontSize(10)
      .font("Helvetica")
      .text("F&I CO-PILOT — COACHING REPORT", 60, 54);

    // Report date top-right
    doc.fillColor(COLORS.medGray)
      .fontSize(9)
      .text(`Generated: ${formatDate(new Date())}`, 60, 80, {
        width: pageWidth,
        align: "right",
      });

    y = 130;

    // ── Session Info Block ─────────────────────────────────────────────────────
    doc.rect(60, y, pageWidth, 80).fill(COLORS.lightGray).stroke(COLORS.border);

    const col1 = 75;
    const col2 = 60 + pageWidth / 2 + 10;
    const infoY = y + 12;

    doc.fillColor(COLORS.darkGray).fontSize(9).font("Helvetica-Bold");
    doc.text("CUSTOMER", col1, infoY);
    doc.text("DEAL NUMBER", col2, infoY);

    doc.fillColor(COLORS.primary).fontSize(13).font("Helvetica-Bold");
    doc.text(session.customerName ?? "Unknown Customer", col1, infoY + 13, { width: pageWidth / 2 - 20 });
    doc.text(session.dealNumber ?? "—", col2, infoY + 13, { width: pageWidth / 2 - 20 });

    doc.fillColor(COLORS.darkGray).fontSize(9).font("Helvetica-Bold");
    doc.text("DEAL TYPE", col1, infoY + 36);
    doc.text("DURATION", col2, infoY + 36);

    doc.fillColor(COLORS.medGray).fontSize(10).font("Helvetica");
    doc.text(dealTypeLabel(session.dealType), col1, infoY + 48, { width: pageWidth / 2 - 20 });
    doc.text(formatDuration(session.durationSeconds), col2, infoY + 48, { width: pageWidth / 2 - 20 });

    y += 100;

    // ── Overall Score ──────────────────────────────────────────────────────────
    if (grade?.overallScore != null) {
      const score = Math.round(grade.overallScore);
      const color = scoreColor(score);

      doc.rect(60, y, pageWidth, 70).fill(COLORS.accentBlue);

      doc.fillColor(COLORS.white).fontSize(11).font("Helvetica-Bold")
        .text("OVERALL PERFORMANCE SCORE", 80, y + 14);

      doc.fillColor(color).fontSize(38).font("Helvetica-Bold")
        .text(`${score}%`, 80, y + 28, { continued: false });

      const grade_label = score >= 85 ? "ELITE" : score >= 70 ? "PROFICIENT" : score >= 55 ? "DEVELOPING" : "NEEDS COACHING";
      doc.fillColor(COLORS.white).fontSize(10).font("Helvetica")
        .text(grade_label, 80 + 80, y + 42);

      // Manager info
      doc.fillColor(COLORS.lightGray).fontSize(9).font("Helvetica")
        .text(`Manager: ${manager.name ?? "—"}  |  ${manager.dealership ?? ""}`, 60 + pageWidth - 200, y + 14, { width: 180, align: "right" });

      y += 90;
    }

    // ── Performance Score Breakdown ────────────────────────────────────────────
    if (grade) {
      y = sectionHeader(doc, "PERFORMANCE SCORE BREAKDOWN", y, pageWidth);

      const scores = [
        { label: "Rapport Building", value: grade.rapportScore },
        { label: "Product Presentation", value: grade.productPresentationScore },
        { label: "Objection Handling", value: grade.objectionHandlingScore },
        { label: "Closing Technique", value: grade.closingTechniqueScore },
        { label: "Compliance", value: grade.complianceScore },
      ];

      for (const item of scores) {
        y = scoreRow(doc, item.label, item.value, y, pageWidth);
      }

      y += 10;
    }

    // ── Script Fidelity Scores ─────────────────────────────────────────────────
    if (grade?.scriptFidelityScore != null) {
      y = sectionHeader(doc, "SCRIPT FIDELITY SCORE (ASURA METHODOLOGY)", y, pageWidth);

      const fidelityScores = [
        { label: "Script Fidelity (Verbatim Adherence)", value: grade.scriptFidelityScore },
        { label: "Process Adherence (7-Step Sequence)", value: grade.processAdherenceScore },
        { label: "Menu Sequence", value: grade.menuSequenceScore },
        { label: "Objection Response Scripts", value: grade.objectionResponseScore },
        { label: "Stage Transition Accuracy", value: grade.transitionAccuracyScore },
      ];

      for (const item of fidelityScores) {
        y = scoreRow(doc, item.label, item.value, y, pageWidth);
      }

      y += 10;
    }

    // ── Executive Summary ──────────────────────────────────────────────────────
    if (report?.executiveSummary) {
      y = checkPageBreak(doc, y, 120);
      y = sectionHeader(doc, "EXECUTIVE SUMMARY", y, pageWidth);
      doc.fillColor(COLORS.darkGray).fontSize(10).font("Helvetica")
        .text(report.executiveSummary, 60, y, { width: pageWidth, lineGap: 3 });
      y = doc.y + 16;
    }

    // ── Sentiment Analysis ─────────────────────────────────────────────────────
    if (report?.sentimentManagerScore != null || report?.purchaseLikelihoodScore != null) {
      y = checkPageBreak(doc, y, 100);
      y = sectionHeader(doc, "SENTIMENT & PURCHASE LIKELIHOOD", y, pageWidth);

      const sentimentItems = [
        { label: "Manager Sentiment", value: report.sentimentManagerScore },
        { label: "Customer Sentiment", value: report.sentimentCustomerScore },
        { label: "Purchase Likelihood", value: report.purchaseLikelihoodScore },
      ];

      for (const item of sentimentItems) {
        y = scoreRow(doc, item.label, item.value, y, pageWidth);
      }

      if (report.sentimentOverall) {
        doc.fillColor(COLORS.medGray).fontSize(9).font("Helvetica")
          .text(`Overall Sentiment: ${report.sentimentOverall.toUpperCase()}`, 60, y, { width: pageWidth });
        y = doc.y + 10;
      }

      y += 6;
    }

    // ── Strengths & Improvements ───────────────────────────────────────────────
    if (grade?.strengths || grade?.improvements) {
      y = checkPageBreak(doc, y, 140);
      y = sectionHeader(doc, "STRENGTHS & AREAS FOR IMPROVEMENT", y, pageWidth);

      if (grade.strengths) {
        doc.fillColor(COLORS.green).fontSize(10).font("Helvetica-Bold").text("Strengths", 60, y);
        y = doc.y + 4;
        doc.fillColor(COLORS.darkGray).fontSize(10).font("Helvetica")
          .text(grade.strengths, 60, y, { width: pageWidth, lineGap: 3 });
        y = doc.y + 12;
      }

      if (grade.improvements) {
        doc.fillColor(COLORS.gold).fontSize(10).font("Helvetica-Bold").text("Areas to Improve", 60, y);
        y = doc.y + 4;
        doc.fillColor(COLORS.darkGray).fontSize(10).font("Helvetica")
          .text(grade.improvements, 60, y, { width: pageWidth, lineGap: 3 });
        y = doc.y + 12;
      }
    }

    // ── Coaching Notes ─────────────────────────────────────────────────────────
    if (grade?.coachingNotes) {
      y = checkPageBreak(doc, y, 120);
      y = sectionHeader(doc, "PERSONALIZED COACHING NOTES", y, pageWidth);
      doc.rect(60, y, pageWidth, 1).fill(COLORS.accent);
      y += 8;
      doc.fillColor(COLORS.darkGray).fontSize(10).font("Helvetica")
        .text(grade.coachingNotes, 60, y, { width: pageWidth, lineGap: 3 });
      y = doc.y + 16;
    }

    // ── Recommendations ────────────────────────────────────────────────────────
    if (report?.recommendations) {
      y = checkPageBreak(doc, y, 120);
      y = sectionHeader(doc, "RECOMMENDATIONS", y, pageWidth);
      doc.fillColor(COLORS.darkGray).fontSize(10).font("Helvetica")
        .text(report.recommendations, 60, y, { width: pageWidth, lineGap: 3 });
      y = doc.y + 16;
    }

    // ── Product Opportunities ──────────────────────────────────────────────────
    if (report?.productOpportunities && report.productOpportunities.length > 0) {
      y = checkPageBreak(doc, y, 160);
      y = sectionHeader(doc, "PRODUCT OPPORTUNITIES", y, pageWidth);

      const colW = pageWidth / 3;
      // Header row
      doc.rect(60, y, pageWidth, 20).fill(COLORS.accentBlue);
      doc.fillColor(COLORS.white).fontSize(9).font("Helvetica-Bold");
      doc.text("PRODUCT", 68, y + 6, { width: colW - 10 });
      doc.text("STATUS", 68 + colW, y + 6, { width: colW - 10 });
      doc.text("NOTE", 68 + colW * 2, y + 6, { width: colW - 10 });
      y += 20;

      for (let i = 0; i < report.productOpportunities.length; i++) {
        const opp = report.productOpportunities[i];
        const rowH = 22;
        doc.rect(60, y, pageWidth, rowH).fill(i % 2 === 0 ? COLORS.lightGray : COLORS.white);
        const statusColor = opp.status === "captured" ? COLORS.green : opp.status === "missed" ? COLORS.red : COLORS.gold;
        doc.fillColor(COLORS.darkGray).fontSize(9).font("Helvetica");
        doc.text(opp.product ?? "—", 68, y + 7, { width: colW - 10 });
        doc.fillColor(statusColor).text((opp.status ?? "—").toUpperCase(), 68 + colW, y + 7, { width: colW - 10 });
        doc.fillColor(COLORS.medGray).text(opp.note ?? "—", 68 + colW * 2, y + 7, { width: colW - 10 });
        y += rowH;
      }
      y += 12;
    }

    // ── Footer ─────────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 50;
    doc.rect(0, footerY - 10, doc.page.width, 60).fill(COLORS.primary);
    doc.fillColor(COLORS.medGray).fontSize(8).font("Helvetica")
      .text(
        `ASURA Group F&I Co-Pilot  |  Confidential Coaching Report  |  Session #${session.id}  |  ${formatDate(session.startedAt)}`,
        60,
        footerY + 4,
        { width: pageWidth, align: "center" }
      );

    doc.end();
  });
}

// ─── Layout Helpers ────────────────────────────────────────────────────────────
function sectionHeader(doc: PDFKit.PDFDocument, title: string, y: number, pageWidth: number): number {
  y = checkPageBreak(doc, y, 40);
  doc.rect(60, y, pageWidth, 24).fill(COLORS.primary);
  doc.fillColor(COLORS.white).fontSize(9).font("Helvetica-Bold")
    .text(title, 70, y + 8, { width: pageWidth - 20 });
  return y + 34;
}

function scoreRow(
  doc: PDFKit.PDFDocument,
  label: string,
  value: number | null | undefined,
  y: number,
  pageWidth: number
): number {
  y = checkPageBreak(doc, y, 28);
  const score = value != null ? Math.round(value) : null;
  const color = scoreColor(score);
  const barWidth = score != null ? Math.round((pageWidth - 160) * (score / 100)) : 0;

  doc.fillColor(COLORS.darkGray).fontSize(9).font("Helvetica")
    .text(label, 60, y + 4, { width: 160 });

  // Bar background
  doc.rect(230, y + 6, pageWidth - 170, 10).fill(COLORS.border);
  // Bar fill
  if (barWidth > 0) {
    doc.rect(230, y + 6, barWidth, 10).fill(color);
  }

  // Score label
  doc.fillColor(color).fontSize(10).font("Helvetica-Bold")
    .text(score != null ? `${score}%` : "—", 60 + pageWidth - 40, y + 3, { width: 40, align: "right" });

  return y + 22;
}

function checkPageBreak(doc: PDFKit.PDFDocument, y: number, needed: number): number {
  if (y + needed > doc.page.height - 80) {
    doc.addPage();
    return 60;
  }
  return y;
}
