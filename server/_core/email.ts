/**
 * Email notification module using Resend.
 * Gracefully no-ops when RESEND_API_KEY is not configured.
 */
import { Resend } from "resend";
import { ENV } from "./env";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!ENV.resendApiKey) return null;
  if (!resend) resend = new Resend(ENV.resendApiKey);
  return resend;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email via Resend. Returns true on success, false if unconfigured or on error.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn("[Email] RESEND_API_KEY not configured — email not sent:", opts.subject);
    return false;
  }
  try {
    const { error } = await client.emails.send({
      from: ENV.emailFrom,
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    if (error) {
      console.error("[Email] Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] Failed to send email:", err);
    return false;
  }
}

// ─── Email builders ────────────────────────────────────────────────────────────

export function buildCriticalComplianceAlertEmail(opts: {
  managerEmail: string;
  managerName: string;
  sessionId: number;
  customerName: string;
  rule: string;
  description: string;
  excerpt: string;
  remediation?: string;
}) {
  const subject = `🚨 CFPB Critical Alert — Session #${opts.sessionId}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">⚠️ Critical Compliance Alert</h1>
        <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">F&I Co-Pilot — Immediate Action Required</p>
      </div>
      <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p>Hi ${opts.managerName},</p>
        <p>A <strong>critical compliance violation</strong> was detected in your F&I session with <strong>${opts.customerName}</strong> (Session #${opts.sessionId}).</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; background: #f9fafb; font-weight: bold; width: 140px; border: 1px solid #e5e7eb;">Rule</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${opts.rule}</td></tr>
          <tr><td style="padding: 8px; background: #f9fafb; font-weight: bold; border: 1px solid #e5e7eb;">Issue</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${opts.description}</td></tr>
          <tr><td style="padding: 8px; background: #f9fafb; font-weight: bold; border: 1px solid #e5e7eb;">Excerpt</td><td style="padding: 8px; border: 1px solid #e5e7eb; font-style: italic;">"${opts.excerpt}"</td></tr>
          ${opts.remediation ? `<tr><td style="padding: 8px; background: #f9fafb; font-weight: bold; border: 1px solid #e5e7eb;">Remediation</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${opts.remediation}</td></tr>` : ""}
        </table>
        <p style="color: #6b7280; font-size: 13px;">This alert was generated automatically by F&I Co-Pilot. Please review the session and take corrective action.</p>
      </div>
    </div>
  `;
  const text = `Critical Compliance Alert — Session #${opts.sessionId}\n\nRule: ${opts.rule}\nIssue: ${opts.description}\nExcerpt: "${opts.excerpt}"${opts.remediation ? `\nRemediation: ${opts.remediation}` : ""}`;
  return { to: opts.managerEmail, subject, html, text };
}

export function buildSessionSummaryEmail(opts: {
  managerEmail: string;
  managerName: string;
  sessionId: number;
  customerName: string;
  overallScore: number;
  categoryScores: Record<string, number>;
  criticalFlags: number;
  warnings: number;
  sessionDurationMin: number;
}) {
  const scoreColor = opts.overallScore >= 80 ? "#16a34a" : opts.overallScore >= 65 ? "#d97706" : "#dc2626";
  const subject = `F&I Session Summary — ${opts.customerName} (Score: ${opts.overallScore}%)`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e293b; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">📊 Session Summary</h1>
        <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">F&I Co-Pilot — Session #${opts.sessionId}</p>
      </div>
      <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p>Hi ${opts.managerName},</p>
        <p>Here's your session summary for <strong>${opts.customerName}</strong>.</p>
        <div style="text-align: center; margin: 24px 0;">
          <div style="font-size: 48px; font-weight: bold; color: ${scoreColor};">${opts.overallScore}%</div>
          <div style="color: #6b7280; font-size: 14px;">Overall Performance Score</div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background: #f9fafb;"><th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Category</th><th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">Score</th></tr>
          ${Object.entries(opts.categoryScores).map(([cat, score]) => `<tr><td style="padding: 8px; border: 1px solid #e5e7eb;">${cat}</td><td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb; font-weight: bold; color: ${score >= 80 ? "#16a34a" : score >= 65 ? "#d97706" : "#dc2626"};">${score}%</td></tr>`).join("")}
        </table>
        <div style="display: flex; gap: 16px; margin: 16px 0;">
          <div style="flex: 1; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${opts.criticalFlags}</div>
            <div style="font-size: 12px; color: #6b7280;">Critical Flags</div>
          </div>
          <div style="flex: 1; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #d97706;">${opts.warnings}</div>
            <div style="font-size: 12px; color: #6b7280;">Warnings</div>
          </div>
          <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${opts.sessionDurationMin}m</div>
            <div style="font-size: 12px; color: #6b7280;">Duration</div>
          </div>
        </div>
        <p style="color: #6b7280; font-size: 13px;">This summary was generated automatically by F&I Co-Pilot.</p>
      </div>
    </div>
  `;
  const text = `Session Summary — ${opts.customerName} (Session #${opts.sessionId})\n\nOverall Score: ${opts.overallScore}%\nCritical Flags: ${opts.criticalFlags}\nWarnings: ${opts.warnings}\nDuration: ${opts.sessionDurationMin} minutes`;
  return { to: opts.managerEmail, subject, html, text };
}

export function buildWeeklyDigestEmail(opts: {
  managerEmail: string;
  managerName: string;
  totalSessions: number;
  averageScore: number;
  scoreTrend: number;
  topImprovements: string[];
  complianceFlags: number;
}) {
  const trendColor = opts.scoreTrend >= 0 ? "#16a34a" : "#dc2626";
  const trendArrow = opts.scoreTrend >= 0 ? "↑" : "↓";
  const scoreColor = opts.averageScore >= 80 ? "#16a34a" : opts.averageScore >= 65 ? "#d97706" : "#dc2626";
  const subject = `📈 Weekly F&I Performance Digest — ${opts.managerName}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e293b; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">📈 Weekly Performance Digest</h1>
        <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">F&I Co-Pilot — ASURA OPS</p>
      </div>
      <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p>Hi ${opts.managerName},</p>
        <p>Here's your weekly performance summary.</p>
        <div style="display: flex; gap: 12px; margin: 20px 0;">
          <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #1e293b;">${opts.totalSessions}</div>
            <div style="font-size: 12px; color: #64748b;">Sessions</div>
          </div>
          <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: ${scoreColor};">${opts.averageScore}%</div>
            <div style="font-size: 12px; color: #64748b;">Avg Score</div>
          </div>
          <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: ${trendColor};">${trendArrow} ${Math.abs(opts.scoreTrend)}%</div>
            <div style="font-size: 12px; color: #64748b;">vs Last Week</div>
          </div>
        </div>
        <h3 style="color: #1e293b; margin: 20px 0 8px;">🎯 Top Coaching Focus Areas</h3>
        <ol style="color: #374151; padding-left: 20px;">
          ${opts.topImprovements.map(imp => `<li style="margin-bottom: 4px;">${imp}</li>`).join("")}
        </ol>
        ${opts.complianceFlags > 0 ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin: 16px 0;">
          <strong style="color: #dc2626;">⚠️ ${opts.complianceFlags} Compliance Flag${opts.complianceFlags > 1 ? "s" : ""}</strong>
          <p style="color: #7f1d1d; margin: 4px 0 0; font-size: 13px;">Review flagged sessions in the Co-Pilot dashboard.</p>
        </div>` : `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin: 16px 0;">
          <strong style="color: #16a34a;">✅ Zero Compliance Flags</strong>
          <p style="color: #166534; margin: 4px 0 0; font-size: 13px;">Clean week. Keep it up.</p>
        </div>`}
        <p style="color: #6b7280; font-size: 13px; margin-top: 20px;">Generated by F&I Co-Pilot — Powered by ASURA OPS</p>
      </div>
    </div>
  `;
  const text = `Weekly Digest — ${opts.managerName}\n\nSessions: ${opts.totalSessions}\nAvg Score: ${opts.averageScore}%\nTrend: ${opts.scoreTrend >= 0 ? "+" : ""}${opts.scoreTrend}%\nCompliance Flags: ${opts.complianceFlags}`;
  return { to: opts.managerEmail, subject, html, text };
}
