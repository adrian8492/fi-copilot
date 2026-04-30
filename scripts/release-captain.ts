#!/usr/bin/env tsx
/**
 * Release Captain — one-command deploy readiness check for F&I Co-Pilot.
 *
 * USAGE
 *   pnpm release:captain                          # quick check
 *   pnpm release:captain --skip-local-gates       # skip build/test/check
 *   pnpm release:captain --expected-sha abc123    # verify SHA match
 *   pnpm release:captain --json                   # machine-readable output
 *   pnpm release:captain --url https://example.com
 *
 * EXIT CODES
 *   0 — PASS   (all checks green)
 *   1 — FAIL   (at least one blocker)
 *   2 — WARN   (non-blocking issues detected)
 */

import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CheckStatus = "pass" | "fail" | "warn" | "skip";

export interface CheckResult {
  name: string;
  status: CheckStatus;
  detail: string;
}

export interface HealthResponse {
  status: string;
  timestamp?: string;
  uptime?: number;
  checks?: {
    database?: { status: string; latencyMs?: number };
    deepgram?: { status: string };
    llm?: { status: string };
    encryption?: { status: string };
  };
}

export interface CaptainReport {
  verdict: "PASS" | "FAIL" | "WARN";
  checks: CheckResult[];
  blockers: string[];
  nextAction: string;
  headSha: string;
  originSha: string | null;
  timestamp: string;
}

// ─── Pure logic (testable) ───────────────────────────────────────────────────

export function deriveVerdict(checks: CheckResult[]): "PASS" | "FAIL" | "WARN" {
  if (checks.some((c) => c.status === "fail")) return "FAIL";
  if (checks.some((c) => c.status === "warn")) return "WARN";
  return "PASS";
}

export function deriveNextAction(
  verdict: "PASS" | "FAIL" | "WARN",
  blockers: string[],
): string {
  if (verdict === "PASS") return "Ship it — all checks green.";
  if (verdict === "FAIL") return `Fix blocker: ${blockers[0]}`;
  return "Review warnings, then ship if acceptable.";
}

export function deriveBlockers(checks: CheckResult[]): string[] {
  return checks.filter((c) => c.status === "fail").map((c) => c.detail);
}

export function buildReport(
  checks: CheckResult[],
  headSha: string,
  originSha: string | null,
): CaptainReport {
  const blockers = deriveBlockers(checks);
  const verdict = deriveVerdict(checks);
  const nextAction = deriveNextAction(verdict, blockers);
  return {
    verdict,
    checks,
    blockers,
    nextAction,
    headSha,
    originSha,
    timestamp: new Date().toISOString(),
  };
}

export function formatReport(report: CaptainReport): string {
  const lines: string[] = [];
  lines.push("");
  lines.push(`  ╔══════════════════════════════════════╗`);
  lines.push(`  ║   Release Captain — ${report.verdict.padEnd(4)}             ║`);
  lines.push(`  ╚══════════════════════════════════════╝`);
  lines.push("");
  lines.push(`  HEAD   ${report.headSha}`);
  if (report.originSha) lines.push(`  ORIGIN ${report.originSha}`);
  lines.push("");

  for (const c of report.checks) {
    const icon =
      c.status === "pass"
        ? "OK"
        : c.status === "fail"
          ? "XX"
          : c.status === "warn"
            ? "!!"
            : "--";
    lines.push(`  [${icon}] ${c.name}: ${c.detail}`);
  }

  if (report.blockers.length > 0) {
    lines.push("");
    lines.push("  BLOCKERS:");
    for (const b of report.blockers) {
      lines.push(`    - ${b}`);
    }
  }

  lines.push("");
  lines.push(`  NEXT: ${report.nextAction}`);
  lines.push("");
  return lines.join("\n");
}

export function parseHealthResponse(body: unknown): CheckResult[] {
  const results: CheckResult[] = [];
  if (!body || typeof body !== "object") {
    results.push({
      name: "health-parse",
      status: "fail",
      detail: "Could not parse health response",
    });
    return results;
  }
  const h = body as HealthResponse;
  results.push({
    name: "health-status",
    status: h.status === "healthy" ? "pass" : "fail",
    detail: `status=${h.status ?? "unknown"}`,
  });
  if (h.checks) {
    for (const [key, val] of Object.entries(h.checks)) {
      const ok =
        val.status === "healthy" ||
        val.status === "configured";
      results.push({
        name: `health-${key}`,
        status: ok ? "pass" : "fail",
        detail: `${key}=${val.status}`,
      });
    }
  }
  return results;
}

export function checkShaMatch(
  expected: string,
  headSha: string,
  originSha: string | null,
): CheckResult {
  const short = expected.slice(0, 7);
  if (headSha.startsWith(expected) || expected.startsWith(headSha.slice(0, expected.length))) {
    return { name: "sha-match", status: "pass", detail: `HEAD matches expected ${short}` };
  }
  if (originSha && (originSha.startsWith(expected) || expected.startsWith(originSha.slice(0, expected.length)))) {
    return {
      name: "sha-match",
      status: "warn",
      detail: `origin/main matches expected ${short} but HEAD differs`,
    };
  }
  return {
    name: "sha-match",
    status: "fail",
    detail: `Neither HEAD nor origin/main match expected SHA ${short}`,
  };
}

// ─── Shell helpers ───────────────────────────────────────────────────────────

function run(cmd: string, cwd: string): string {
  try {
    return execSync(cmd, { cwd, encoding: "utf-8", timeout: 300_000 }).trim();
  } catch {
    return "";
  }
}

function runOrThrow(
  cmd: string,
  cwd: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  return execSync(cmd, { cwd, encoding: "utf-8", timeout: 300_000, env }).trim();
}

// ─── Check runners ───────────────────────────────────────────────────────────

function checkGit(repo: string): { checks: CheckResult[]; headSha: string; originSha: string | null } {
  const checks: CheckResult[] = [];
  const headSha = run("git rev-parse HEAD", repo) || "unknown";

  // Branch
  const branch = run("git rev-parse --abbrev-ref HEAD", repo);
  if (branch === "main" || branch === "master") {
    checks.push({ name: "git-branch", status: "pass", detail: `On ${branch}` });
  } else {
    checks.push({
      name: "git-branch",
      status: "warn",
      detail: `On ${branch} (expected main)`,
    });
  }

  // Clean working tree
  const status = run("git status --porcelain", repo);
  if (status === "") {
    checks.push({ name: "git-clean", status: "pass", detail: "Working tree clean" });
  } else {
    const count = status.split("\n").length;
    checks.push({
      name: "git-clean",
      status: "warn",
      detail: `${count} uncommitted change(s)`,
    });
  }

  // Upstream ahead/behind
  let originSha: string | null = null;
  const upstream = run("git rev-parse --abbrev-ref @{upstream} 2>/dev/null", repo);
  if (upstream) {
    originSha = run(`git rev-parse ${upstream}`, repo) || null;
    const aheadBehind = run(
      `git rev-list --left-right --count ${upstream}...HEAD`,
      repo,
    );
    if (aheadBehind) {
      const [behind, ahead] = aheadBehind.split(/\s+/).map(Number);
      if (ahead === 0 && behind === 0) {
        checks.push({
          name: "git-sync",
          status: "pass",
          detail: `In sync with ${upstream}`,
        });
      } else {
        checks.push({
          name: "git-sync",
          status: "warn",
          detail: `${ahead} ahead, ${behind} behind ${upstream}`,
        });
      }
    }
  } else {
    checks.push({
      name: "git-sync",
      status: "warn",
      detail: "No upstream tracking branch",
    });
  }

  return { checks, headSha, originSha };
}

function runLocalGates(repo: string, appBaseUrl: string): CheckResult[] {
  const results: CheckResult[] = [];
  const gates = [
    { name: "typecheck", cmd: "pnpm check" },
    { name: "tests", cmd: "pnpm test" },
    { name: "build", cmd: "pnpm build" },
  ];
  for (const gate of gates) {
    try {
      runOrThrow(gate.cmd, repo, {
        ...process.env,
        APP_BASE_URL: process.env.APP_BASE_URL || appBaseUrl,
      });
      results.push({ name: gate.name, status: "pass", detail: `${gate.cmd} succeeded` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message.split("\n").slice(0, 3).join(" ") : String(e);
      results.push({
        name: gate.name,
        status: "fail",
        detail: `${gate.cmd} failed: ${msg.slice(0, 200)}`,
      });
    }
  }
  return results;
}

async function checkLiveApp(url: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // GET /
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    results.push({
      name: "live-root",
      status: res.ok ? "pass" : "fail",
      detail: `GET / returned ${res.status}`,
    });
  } catch (e: unknown) {
    results.push({
      name: "live-root",
      status: "fail",
      detail: `GET / failed: ${e instanceof Error ? e.message : String(e)}`,
    });
  }

  // GET /api/health
  try {
    const healthUrl = url.replace(/\/$/, "") + "/api/health";
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(15_000) });
    if (res.ok) {
      const body = await res.json();
      results.push(...parseHealthResponse(body));
    } else {
      results.push({
        name: "health-status",
        status: "fail",
        detail: `/api/health returned ${res.status}`,
      });
    }
  } catch (e: unknown) {
    results.push({
      name: "health-status",
      status: "fail",
      detail: `/api/health failed: ${e instanceof Error ? e.message : String(e)}`,
    });
  }

  return results;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { values } = parseArgs({
    options: {
      repo: { type: "string", default: process.cwd() },
      url: {
        type: "string",
        default: "https://finico-pilot-mqskutaj.manus.space",
      },
      "expected-sha": { type: "string" },
      "skip-local-gates": { type: "boolean", default: false },
      json: { type: "boolean", default: false },
    },
    strict: true,
  });

  const repo = values.repo!;
  const url = values.url!;
  const allChecks: CheckResult[] = [];

  // 1. Git checks
  const { checks: gitChecks, headSha, originSha } = checkGit(repo);
  allChecks.push(...gitChecks);

  // 2. SHA match (if requested)
  if (values["expected-sha"]) {
    allChecks.push(checkShaMatch(values["expected-sha"], headSha, originSha));
  }

  // 3. Local gates
  if (values["skip-local-gates"]) {
    allChecks.push({
      name: "local-gates",
      status: "skip",
      detail: "Skipped (--skip-local-gates)",
    });
  } else {
    allChecks.push(...runLocalGates(repo, url));
  }

  // 4. Live app checks
  allChecks.push(...(await checkLiveApp(url)));

  // 5. Build report
  const report = buildReport(allChecks, headSha, originSha);

  if (values.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatReport(report));
  }

  if (report.verdict === "FAIL") process.exit(1);
  if (report.verdict === "WARN") process.exit(2);
  process.exit(0);
}

const isDirectRun = process.argv[1]
  ? fileURLToPath(import.meta.url) === resolve(process.argv[1])
  : false;

if (isDirectRun) {
  main().catch((e) => {
    console.error("Release Captain crashed:", e);
    process.exit(1);
  });
}
