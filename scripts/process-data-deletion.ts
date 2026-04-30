#!/usr/bin/env tsx
/**
 * Hard-delete cron for FTC Safeguards Rule data-deletion requests — Phase 6.
 *
 * Phase 5b shipped the request flow + 30-day soft-delete state. This script
 * is the sweep that flips a request from `pending` to `completed` and
 * physically removes the underlying rows. Designed to run as a daily Manus
 * cron starting ~30 days after Korum install (first hard-delete due ≈ May 31).
 *
 * USAGE
 *   tsx scripts/process-data-deletion.ts                   # dry-run — prints what would be deleted
 *   tsx scripts/process-data-deletion.ts --asof 2026-05-31 # dry-run as of a specific date
 *   tsx scripts/process-data-deletion.ts --commit          # actually delete (refused in prod without override)
 *   tsx scripts/process-data-deletion.ts --commit --limit 50
 *
 * SAFETY
 *   --commit is required for actual deletion. Default is dry-run.
 *
 *   When NODE_ENV=production AND --commit is set, the script refuses unless
 *   `ALLOW_PRODUCTION_DELETE=1` is also set in the environment. The Manus
 *   cron sets this env var; humans poking from a dev box will not, so an
 *   accidental `--commit` against prod can never silently wipe customer data.
 *
 *   Each run appends a JSONL audit line to `memory/deletion-logs/YYYY-MM-DD.md`
 *   with the requestId, dealershipId, classification, and counts. The log
 *   file is the canonical record of what was actually removed.
 *
 * CLASSIFICATION
 *   Each pending request resolves to one of three buckets:
 *     "session" — request.sessionId is set; delete that session + child rows
 *                 + the consent_logs row for that session
 *     "customer" — request.customerId is set (and no sessionId); delete
 *                  every session belonging to the customer, then the
 *                  customer row itself
 *     "manual_review" — neither sessionId nor customerId set; the request
 *                       carries only customerEmail/customerName text. Cannot
 *                       resolve safely without human review. Stays "pending"
 *                       and is logged for Adrian to handle.
 */

import "dotenv/config";

export type DeletionClassification = "session" | "customer" | "manual_review";

export interface DataDeletionRequestLike {
  id: number;
  dealershipId: number;
  customerId?: number | null;
  sessionId?: number | null;
  customerEmail?: string | null;
  customerName?: string | null;
  status: string;
  scheduledDeletionAt: Date;
}

export interface DeletionPlan {
  requestId: number;
  dealershipId: number;
  classification: DeletionClassification;
  sessionIds: number[];
  customerId: number | null;
  reasonIfManual?: string;
}

/**
 * Pure: classify a request by which FK it carries. No DB calls.
 */
export function classifyRequest(req: DataDeletionRequestLike): DeletionClassification {
  if (req.sessionId != null) return "session";
  if (req.customerId != null) return "customer";
  return "manual_review";
}

export interface ProcessArgs {
  commit: boolean;
  asof: Date;
  limit: number;
}

export function parseArgs(argv: string[]): ProcessArgs {
  let commit = false;
  let asof: Date = new Date();
  let limit = 1000;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--commit") commit = true;
    else if (a === "--asof") {
      const v = argv[++i] ?? "";
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) {
        throw new Error(`--asof requires a parseable ISO date, got "${v}"`);
      }
      asof = d;
    } else if (a === "--limit") {
      const n = parseInt(argv[++i] ?? "0", 10);
      if (n <= 0) throw new Error("--limit must be a positive integer");
      limit = n;
    }
  }
  return { commit, asof, limit };
}

/**
 * Pure: build the human-readable summary line for a planned deletion.
 * Used by the dry-run output and the audit log.
 */
export function formatPlanLine(plan: DeletionPlan): string {
  const base = `request=${plan.requestId} dealership=${plan.dealershipId} class=${plan.classification}`;
  if (plan.classification === "manual_review") {
    return `${base} reason="${plan.reasonIfManual ?? "no FK on request"}"`;
  }
  const sessions = plan.sessionIds.length === 0
    ? "0"
    : `${plan.sessionIds.length} (${plan.sessionIds.slice(0, 5).join(",")}${plan.sessionIds.length > 5 ? ",…" : ""})`;
  const customer = plan.customerId != null ? ` customerId=${plan.customerId}` : "";
  return `${base} sessions=${sessions}${customer}`;
}

interface RunSummary {
  ts: string;
  asof: string;
  commit: boolean;
  nodeEnv: string;
  pendingFound: number;
  classified: { session: number; customer: number; manual_review: number };
  executed: { sessions: number; customers: number; consentLogs: number; requestsCompleted: number };
  errors: string[];
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.commit && process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_DELETE !== "1") {
    console.error(
      "[process-data-deletion] refusing --commit in production. " +
      "Set ALLOW_PRODUCTION_DELETE=1 in the environment if this is the cron " +
      "(humans should never set this — call Adrian first).",
    );
    process.exit(1);
  }

  const summary: RunSummary = {
    ts: new Date().toISOString(),
    asof: args.asof.toISOString(),
    commit: args.commit,
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    pendingFound: 0,
    classified: { session: 0, customer: 0, manual_review: 0 },
    executed: { sessions: 0, customers: 0, consentLogs: 0, requestsCompleted: 0 },
    errors: [],
  };

  // Lazy-imported so plain `--help` style invocations never connect to the DB.
  const db = await import("../server/db");

  const pending = (await db.getPendingDeletionRequestsDue(args.asof)).slice(0, args.limit);
  summary.pendingFound = pending.length;

  const plans: DeletionPlan[] = [];
  for (const req of pending) {
    const cls = classifyRequest(req);
    summary.classified[cls]++;

    let sessionIds: number[] = [];
    if (cls === "session" && req.sessionId != null) {
      sessionIds = [req.sessionId];
    } else if (cls === "customer" && req.customerId != null) {
      const sessions = await db.getSessionsByCustomerId(req.customerId);
      sessionIds = sessions.map((s) => s.id);
    }

    plans.push({
      requestId: req.id,
      dealershipId: req.dealershipId,
      classification: cls,
      sessionIds,
      customerId: req.customerId ?? null,
      reasonIfManual: cls === "manual_review" ? "request has no sessionId or customerId" : undefined,
    });
  }

  for (const p of plans) console.log(formatPlanLine(p));

  if (!args.commit) {
    console.log(JSON.stringify(summary, null, 2));
    console.log("[process-data-deletion] dry-run — nothing deleted. Re-run with --commit to execute.");
    await appendAuditLog(summary, plans);
    return;
  }

  for (const p of plans) {
    if (p.classification === "manual_review") continue;
    try {
      for (const sid of p.sessionIds) {
        const consentDeleted = await db.deleteConsentLogBySessionId(sid);
        summary.executed.consentLogs += consentDeleted;
        await db.deleteSessionData(sid);
        summary.executed.sessions++;
      }
      if (p.customerId != null) {
        const customerDeleted = await db.deleteCustomerByIdForDealership(p.customerId, p.dealershipId);
        summary.executed.customers += customerDeleted;
      }
      await db.completeDataDeletionRequest(p.requestId);
      summary.executed.requestsCompleted++;
    } catch (err) {
      summary.errors.push(`request ${p.requestId}: ${(err as Error).message}`);
    }
  }

  await safeNotifyOwner(summary);
  await appendAuditLog(summary, plans);
  console.log(JSON.stringify(summary, null, 2));
}

async function safeNotifyOwner(summary: RunSummary): Promise<void> {
  if (summary.executed.requestsCompleted === 0) return;
  try {
    const { notifyOwner } = await import("../server/_core/notification");
    await notifyOwner({
      title: `Data deletion sweep completed (${summary.executed.requestsCompleted} requests)`,
      content: JSON.stringify(summary, null, 2),
    });
  } catch (err) {
    // notifyOwner throws when forge creds are unset (dev box, etc.). Don't
    // let the audit-trail log fail to write because the notify did.
    summary.errors.push(`notifyOwner: ${(err as Error).message}`);
  }
}

async function appendAuditLog(summary: RunSummary, plans: DeletionPlan[]): Promise<void> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const date = summary.ts.slice(0, 10); // YYYY-MM-DD
  const dir = path.resolve(process.cwd(), "memory/deletion-logs");
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${date}.md`);
  const lines: string[] = [];
  lines.push(`## Deletion sweep ${summary.ts}`);
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(summary, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("### Plans");
  for (const p of plans) lines.push(`- ${formatPlanLine(p)}`);
  lines.push("");
  await fs.appendFile(file, lines.join("\n") + "\n");
}

const invokedDirectly =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  process.argv[1].endsWith("process-data-deletion.ts");
if (invokedDirectly) {
  main().catch((err) => {
    console.error("[process-data-deletion] fatal:", err);
    process.exit(1);
  });
}
