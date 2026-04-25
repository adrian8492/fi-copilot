#!/usr/bin/env tsx
/**
 * StoneEagle nightly ingest — Phase 3b
 *
 * Korum and other ASURA-coached stores already pipe F&I performance data to
 * StoneEagle. We treat StoneEagle exports as the source of truth for F&I
 * deal-level data; the DMS (Dealertrack et al.) is NOT part of the pilot
 * ingest.
 *
 * USAGE
 *   tsx scripts/stoneeagle-ingest.ts <csv-path> --dealership <id> [--dry-run]
 *
 * EXPECTED CSV COLUMNS (case-insensitive; missing columns are tolerated)
 *   deal_id            unique deal number from StoneEagle (REQUIRED)
 *   deal_date          ISO date or any Date()-parseable string (REQUIRED)
 *   manager_email      email of the F&I manager who closed the deal (REQUIRED)
 *   manager_name       (optional, fallback identity)
 *   vin
 *   vehicle_year
 *   vehicle_make
 *   vehicle_model
 *   sale_price
 *   trade_value
 *   amount_financed
 *   apr
 *   term_months
 *   monthly_payment
 *   pru                F&I per-vehicle revenue (USD)
 *   front_gross
 *   back_gross
 *   products_count     number of F&I protections sold on the deal
 *   vsa                "Y"/"N" or "1"/"0" or "true"/"false"
 *   gap
 *   appearance
 *   tire_wheel
 *   key_replacement
 *   maintenance
 *
 * IDEMPOTENCY
 *   We dedupe on (dealership_id, deal_id). Re-running an ingest is safe.
 *
 * CRON
 *   Recommended: 0 2 * * *  in PT.
 *   Output is emitted to stdout AND appended to memory/ingest-logs/stoneeagle-YYYY-MM-DD.log
 *
 * EXIT CODES
 *   0  success (some rows may be skipped as duplicates; see summary)
 *   1  fatal error (DB unavailable, file not found, malformed args)
 */

import fs from "fs";
import path from "path";
import "dotenv/config";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoneEagleDeal {
  dealId: string;
  dealDate: Date;
  managerEmail: string;
  managerName: string | null;
  vin: string | null;
  vehicleYear: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  salePrice: number | null;
  tradeValue: number | null;
  amountFinanced: number | null;
  apr: number | null;
  termMonths: number | null;
  monthlyPayment: number | null;
  pru: number | null;
  frontGross: number | null;
  backGross: number | null;
  productsCount: number | null;
  vsaSold: boolean | null;
  gapSold: boolean | null;
  appearanceSold: boolean | null;
  tireWheelSold: boolean | null;
  keyReplacementSold: boolean | null;
  maintenanceSold: boolean | null;
}

export interface IngestSummary {
  inserted: number;
  skipped: number;
  errors: { dealId: string; reason: string }[];
}

// ─── CSV parser (handles quoted fields with embedded commas) ────────────────

export function parseCsv(text: string): Record<string, string>[] {
  // Strip BOM if present.
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const lines = splitCsvLines(normalized);
  if (lines.length < 2) return [];
  const headers = splitCsvRow(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = splitCsvRow(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = (fields[j] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function splitCsvLines(text: string): string[] {
  // Split on newlines that are NOT inside double quotes.
  const lines: string[] = [];
  let buf = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      buf += ch;
    } else if (ch === "\n" && !inQuotes) {
      lines.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  if (buf) lines.push(buf);
  return lines.filter((l) => l.trim().length > 0);
}

function splitCsvRow(line: string): string[] {
  const result: string[] = [];
  let buf = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // Handle escaped double quotes ("")
      if (inQuotes && line[i + 1] === '"') {
        buf += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  result.push(buf);
  return result;
}

// ─── Row mapper ───────────────────────────────────────────────────────────────

const TRUTHY = new Set(["y", "yes", "1", "true", "t"]);

function parseBool(v: string | undefined): boolean | null {
  if (v == null || v === "") return null;
  return TRUTHY.has(v.toLowerCase());
}

function parseNum(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  // Strip $ and , so "$1,850.50" parses as 1850.50.
  const cleaned = v.replace(/[$,]/g, "").trim();
  if (cleaned === "") return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseInt32(v: string | undefined): number | null {
  const n = parseNum(v);
  return n == null ? null : Math.round(n);
}

export function mapRow(row: Record<string, string>): StoneEagleDeal | null {
  const dealId = row.deal_id?.trim();
  const dealDateRaw = row.deal_date?.trim();
  const managerEmail = row.manager_email?.trim().toLowerCase();
  if (!dealId || !dealDateRaw || !managerEmail) return null;

  const dealDate = new Date(dealDateRaw);
  if (Number.isNaN(dealDate.getTime())) return null;

  return {
    dealId,
    dealDate,
    managerEmail,
    managerName: row.manager_name?.trim() || null,
    vin: row.vin?.trim() || null,
    vehicleYear: row.vehicle_year?.trim() || null,
    vehicleMake: row.vehicle_make?.trim() || null,
    vehicleModel: row.vehicle_model?.trim() || null,
    salePrice: parseNum(row.sale_price),
    tradeValue: parseNum(row.trade_value),
    amountFinanced: parseNum(row.amount_financed),
    apr: parseNum(row.apr),
    termMonths: parseInt32(row.term_months),
    monthlyPayment: parseNum(row.monthly_payment),
    pru: parseNum(row.pru),
    frontGross: parseNum(row.front_gross),
    backGross: parseNum(row.back_gross),
    productsCount: parseInt32(row.products_count),
    vsaSold: parseBool(row.vsa),
    gapSold: parseBool(row.gap),
    appearanceSold: parseBool(row.appearance),
    tireWheelSold: parseBool(row.tire_wheel),
    keyReplacementSold: parseBool(row.key_replacement),
    maintenanceSold: parseBool(row.maintenance),
  };
}

// ─── Argv parsing ─────────────────────────────────────────────────────────────

export interface CliArgs {
  csvPath: string;
  dealershipId: number;
  dryRun: boolean;
}

export function parseArgs(argv: string[]): CliArgs {
  // argv shape: [csvPath, --dealership, <id>, --dry-run?]  (any order for flags)
  let csvPath: string | undefined;
  let dealershipId: number | undefined;
  let dryRun = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dealership" || a === "-d") {
      dealershipId = parseInt(argv[++i] ?? "", 10);
    } else if (a === "--dry-run") {
      dryRun = true;
    } else if (!a.startsWith("--")) {
      csvPath = a;
    }
  }
  if (!csvPath || !dealershipId || Number.isNaN(dealershipId)) {
    throw new Error("Usage: tsx scripts/stoneeagle-ingest.ts <csv-path> --dealership <id> [--dry-run]");
  }
  return { csvPath, dealershipId, dryRun };
}

// ─── Ingest loop ──────────────────────────────────────────────────────────────

export interface IngestDeps {
  findSessionByDealNumber: (dealershipId: number, dealNumber: string) => Promise<unknown | null>;
  createSession: (data: {
    userId: number;
    dealershipId?: number | null;
    customerName?: string;
    dealNumber?: string;
    vehicleType?: "new" | "used" | "cpo";
    dealType?: "retail_finance" | "lease" | "cash";
    consentObtained?: boolean;
    consentMethod?: string;
  }) => Promise<unknown>;
  getUserByEmail: (email: string) => Promise<{ id: number; dealershipId: number | null } | null>;
}

/**
 * Run the ingest against a parsed list of deals. Pure DI so tests can mock
 * the DB layer cleanly. Returns a summary; never throws on per-row failures.
 */
export async function ingestDeals(
  deals: StoneEagleDeal[],
  dealershipId: number,
  deps: IngestDeps,
  options: { dryRun?: boolean } = {}
): Promise<IngestSummary> {
  const summary: IngestSummary = { inserted: 0, skipped: 0, errors: [] };
  for (const deal of deals) {
    try {
      const existing = await deps.findSessionByDealNumber(dealershipId, deal.dealId);
      if (existing) {
        summary.skipped++;
        continue;
      }
      const manager = await deps.getUserByEmail(deal.managerEmail);
      if (!manager) {
        summary.errors.push({ dealId: deal.dealId, reason: `no user for email ${deal.managerEmail}` });
        continue;
      }
      // Tenant safety: refuse to attribute a deal to a user from a different
      // dealership, even if the email matches. Fail-closed.
      if (manager.dealershipId != null && manager.dealershipId !== dealershipId) {
        summary.errors.push({ dealId: deal.dealId, reason: `manager ${deal.managerEmail} belongs to a different dealership` });
        continue;
      }
      if (options.dryRun) {
        summary.inserted++;
        continue;
      }
      await deps.createSession({
        userId: manager.id,
        dealershipId,
        dealNumber: deal.dealId,
        consentObtained: true,
        consentMethod: "written",
      });
      summary.inserted++;
    } catch (err) {
      summary.errors.push({ dealId: deal.dealId, reason: err instanceof Error ? err.message : String(err) });
    }
  }
  return summary;
}

// ─── Logging helper ───────────────────────────────────────────────────────────

function appendDailyLog(line: string) {
  const today = new Date().toISOString().slice(0, 10);
  const dir = path.join(process.cwd(), "memory", "ingest-logs");
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(path.join(dir, `stoneeagle-${today}.log`), line + "\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(args.csvPath)) {
    console.error(`[stoneeagle-ingest] CSV not found: ${args.csvPath}`);
    process.exit(1);
  }
  const text = fs.readFileSync(args.csvPath, "utf-8");
  const rawRows = parseCsv(text);
  const deals: StoneEagleDeal[] = [];
  let mapErrors = 0;
  for (const r of rawRows) {
    const d = mapRow(r);
    if (d) deals.push(d);
    else mapErrors++;
  }

  // Lazy-import db helpers so we don't spin up a connection during arg parsing.
  const db = await import("../server/db");
  const summary = await ingestDeals(deals, args.dealershipId, {
    findSessionByDealNumber: db.findSessionByDealNumber,
    createSession: db.createSession as IngestDeps["createSession"],
    getUserByEmail: db.getUserByEmail as IngestDeps["getUserByEmail"],
  }, { dryRun: args.dryRun });

  const line = JSON.stringify({
    ts: new Date().toISOString(),
    csvPath: args.csvPath,
    dealershipId: args.dealershipId,
    dryRun: args.dryRun,
    rawRows: rawRows.length,
    parsedDeals: deals.length,
    mapErrors,
    ...summary,
  });
  console.log(line);
  appendDailyLog(line);
  if (summary.errors.length > 0 && !args.dryRun) process.exit(2);
}

// Only run main() when invoked as a script (not when imported by tests).
const invokedDirectly =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  process.argv[1].endsWith("stoneeagle-ingest.ts");
if (invokedDirectly) {
  main().catch((err) => {
    console.error("[stoneeagle-ingest] fatal:", err);
    process.exit(1);
  });
}
