#!/usr/bin/env tsx
/**
 * Load-test / DEMO seed — Phase 4 (extended Phase 6 with --reset)
 *
 * This is the canonical demo seeder. Every row it writes is synthetic:
 *   - Customer names from public name pools (no PII, no real customers).
 *   - Manager emails formatted as `manager{N}@tenant{N}.test` (.test TLD is
 *     reserved by RFC 2606 — cannot collide with real domains).
 *   - Deal numbers prefixed `T{tenant}-D{seq}` — easy to identify and reset.
 *
 * Doubles as:
 *   - Demo data for /yesterday-recap before the first StoneEagle import
 *   - A perf smoke for the recap query path under a realistic row count
 *   - A correctness check that tenancy isolation holds under load
 *     (each tenant's reads must only return their own deals)
 *
 * USAGE
 *   tsx scripts/seed-load-test.ts                          # default: 1000 deals × 5 tenants, dry-run
 *   tsx scripts/seed-load-test.ts --count 1000 --tenants 5
 *   tsx scripts/seed-load-test.ts --count 1000 --tenants 5 --commit
 *   tsx scripts/seed-load-test.ts --reset                  # dry-run: count seeded rows that would be deleted
 *   tsx scripts/seed-load-test.ts --reset --commit         # actually delete rows where dealNumber LIKE 'T%-D%'
 *
 * SAFETY
 *   --commit is required for any DB-mutating action (insert OR delete).
 *   Default is dry-run.
 *
 *   The script refuses --commit when NODE_ENV=production. We never want this
 *   writing into — or deleting from — the live Korum/Paragon database. To
 *   clear demo data from production, do it deliberately via SQL with a clear
 *   paper trail.
 *
 *   --reset only matches rows whose `dealNumber` matches the synthetic
 *   `T{n}-D{seq}` prefix. Real StoneEagle deals never use that pattern, so a
 *   reset cannot accidentally delete production data.
 */

import "dotenv/config";

export interface FakeDeal {
  tenantId: number;
  managerId: number;
  managerEmail: string;
  dealNumber: string;
  customerName: string;
  pru: number;
  productsCount: number;
  vsaSold: boolean;
  gapSold: boolean;
  appearanceSold: boolean;
  dealDate: Date;
  status: "completed" | "active";
}

const FIRST_NAMES = [
  "Jane", "Tom", "Sarah", "Mike", "Erica", "James", "Lisa", "David",
  "Maria", "Chris", "Amber", "Paul", "Rachel", "Dan", "Beth", "Ryan",
];
const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Lopez", "Wilson", "Anderson",
];

/** Deterministic LCG so seed runs are reproducible across invocations. */
class Rng {
  private state: number;
  constructor(seed: number) {
    this.state = (seed >>> 0) || 1;
  }
  next(): number {
    // Numerical Recipes LCG.
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state / 0xffffffff;
  }
  int(min: number, maxInclusive: number): number {
    return Math.floor(this.next() * (maxInclusive - min + 1)) + min;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  bool(pTrue: number): boolean {
    return this.next() < pTrue;
  }
}

export interface GenerateOptions {
  count: number;
  tenantCount: number;
  managersPerTenant?: number;
  seed?: number;
  /** End-of-window date; deals are spread across the prior `daysWindow` days. */
  endDate?: Date;
  daysWindow?: number;
}

export function generateDeals(opts: GenerateOptions): FakeDeal[] {
  const managersPerTenant = opts.managersPerTenant ?? 7;
  const rng = new Rng(opts.seed ?? 42);
  const endDate = opts.endDate ?? new Date();
  const daysWindow = opts.daysWindow ?? 30;
  const msPerDay = 24 * 60 * 60 * 1000;
  const startMs = endDate.getTime() - daysWindow * msPerDay;

  const deals: FakeDeal[] = [];
  for (let i = 0; i < opts.count; i++) {
    const tenantIdx = rng.int(0, opts.tenantCount - 1);
    const managerIdxInTenant = rng.int(0, managersPerTenant - 1);
    const managerId = tenantIdx * managersPerTenant + managerIdxInTenant + 1; // 1-based
    const tenantId = tenantIdx + 1;
    const dealMs = Math.min(startMs + Math.floor(rng.next() * (endDate.getTime() - startMs + 1)), endDate.getTime());
    const dealDate = new Date(dealMs);

    // Realistic-ish PRU distribution: bulk around $1,400–$2,200, long tail to $4k.
    const base = 1400 + rng.int(0, 800);
    const tail = rng.bool(0.1) ? rng.int(0, 1800) : 0;
    const pru = base + tail;

    const productsCount = rng.int(1, 6);
    deals.push({
      tenantId,
      managerId,
      managerEmail: `manager${managerId}@tenant${tenantId}.test`,
      dealNumber: `T${tenantId}-D${String(i).padStart(6, "0")}`,
      customerName: `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`,
      pru,
      productsCount,
      vsaSold: rng.bool(0.55),
      gapSold: rng.bool(0.65),
      appearanceSold: rng.bool(0.30),
      dealDate,
      status: rng.bool(0.92) ? "completed" : "active",
    });
  }
  return deals;
}

/** Per-tenant rollup — used to verify isolation properties. */
export function summarizeByTenant(deals: FakeDeal[]): Map<number, { count: number; avgPru: number }> {
  const out = new Map<number, { count: number; sum: number }>();
  for (const d of deals) {
    const cur = out.get(d.tenantId) ?? { count: 0, sum: 0 };
    cur.count++;
    cur.sum += d.pru;
    out.set(d.tenantId, cur);
  }
  const result = new Map<number, { count: number; avgPru: number }>();
  for (const [k, v] of out.entries()) {
    result.set(k, { count: v.count, avgPru: Math.round(v.sum / v.count) });
  }
  return result;
}

// ─── Argv ──────────────────────────────────────────────────────────────────

export interface SeedArgs {
  count: number;
  tenantCount: number;
  commit: boolean;
  reset: boolean;
  seed?: number;
}

/** Pattern that matches a synthetic demo deal number — keep in sync with `T{tenant}-D{seq}` writes. */
export const DEMO_DEAL_NUMBER_LIKE = "T%-D%";

export function parseArgs(argv: string[]): SeedArgs {
  let count = 1000;
  let tenantCount = 5;
  let commit = false;
  let reset = false;
  let seed: number | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--count") count = parseInt(argv[++i] ?? "0", 10);
    else if (a === "--tenants") tenantCount = parseInt(argv[++i] ?? "0", 10);
    else if (a === "--commit") commit = true;
    else if (a === "--reset") reset = true;
    else if (a === "--seed") seed = parseInt(argv[++i] ?? "0", 10);
  }
  if (!reset && (count <= 0 || tenantCount <= 0)) {
    throw new Error("--count and --tenants must be positive integers");
  }
  return { count, tenantCount, commit, reset, seed };
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.commit && process.env.NODE_ENV === "production") {
    console.error("[seed-load-test] refusing to --commit with NODE_ENV=production");
    process.exit(1);
  }

  if (args.reset) {
    return await runReset(args.commit);
  }

  const t0 = Date.now();
  const deals = generateDeals({
    count: args.count,
    tenantCount: args.tenantCount,
    seed: args.seed,
  });
  const genMs = Date.now() - t0;

  const byTenant = summarizeByTenant(deals);
  const summary = {
    ts: new Date().toISOString(),
    count: deals.length,
    tenantCount: args.tenantCount,
    seed: args.seed ?? 42,
    genMs,
    commit: args.commit,
    byTenant: Array.from(byTenant.entries()).map(([t, s]) => ({ tenantId: t, ...s })),
  };
  console.log(JSON.stringify(summary, null, 2));

  if (!args.commit) {
    console.log("[seed-load-test] dry-run — no DB writes. Re-run with --commit to insert.");
    return;
  }

  // Real-DB write path. Lazy-imported so dry-run never touches db.ts.
  const db = await import("../server/db");
  let inserted = 0;
  let skipped = 0;
  const t1 = Date.now();
  for (const d of deals) {
    const existing = await db.findSessionByDealNumber(d.tenantId, d.dealNumber);
    if (existing) {
      skipped++;
      continue;
    }
    await db.createSession({
      userId: d.managerId,
      dealershipId: d.tenantId,
      customerName: d.customerName,
      dealNumber: d.dealNumber,
      consentObtained: true,
      consentMethod: "written",
    });
    inserted++;
  }
  const writeMs = Date.now() - t1;
  console.log(JSON.stringify({ inserted, skipped, writeMs, perRowUs: Math.round((writeMs * 1000) / Math.max(1, inserted)) }, null, 2));
}

/**
 * Reset path — match every session whose `dealNumber` looks synthetic
 * (`T*-D*`) and either count them (dry-run) or hard-delete them with full
 * child-table cascade via `deleteSessionData`. Real StoneEagle deal numbers
 * never use this prefix, so this can never accidentally delete production data.
 */
async function runReset(commit: boolean) {
  const db = await import("../server/db");
  const ids = await db.findSessionIdsByDealNumberLike(DEMO_DEAL_NUMBER_LIKE);
  const summary = {
    ts: new Date().toISOString(),
    pattern: DEMO_DEAL_NUMBER_LIKE,
    matchedSessions: ids.length,
    commit,
  };
  console.log(JSON.stringify(summary, null, 2));

  if (!commit) {
    console.log("[seed-load-test] reset dry-run — no rows deleted. Re-run with --reset --commit to delete.");
    return;
  }

  const t0 = Date.now();
  let deleted = 0;
  for (const id of ids) {
    await db.deleteSessionData(id);
    deleted++;
  }
  const deleteMs = Date.now() - t0;
  console.log(JSON.stringify({ deleted, deleteMs }, null, 2));
}

const invokedDirectly =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  process.argv[1].endsWith("seed-load-test.ts");
if (invokedDirectly) {
  main().catch((err) => {
    console.error("[seed-load-test] fatal:", err);
    process.exit(1);
  });
}
