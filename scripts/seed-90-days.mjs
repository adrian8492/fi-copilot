import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const conn = await mysql.createConnection(DB_URL);

// ─── Manager Profiles ─────────────────────────────────────────────────────────
const MANAGERS = [
  { userId: 1, name: "Marcus Rivera",   baseScore: 84, basePvr: 1847, trend: "up"   },
  { userId: 1, name: "Tanya Williams",  baseScore: 74, basePvr: 1420, trend: "up"   },
  { userId: 1, name: "Derek Johnson",   baseScore: 48, basePvr:  820, trend: "down" },
  { userId: 1, name: "Priya Patel",     baseScore: 91, basePvr: 2210, trend: "up"   },
  { userId: 1, name: "Carlos Mendez",   baseScore: 67, basePvr: 1180, trend: "flat" },
];

const PRODUCTS = ["vehicle_service_contract", "gap_insurance", "prepaid_maintenance", "interior_exterior_protection", "road_hazard"];
const CONCERN_TYPES = ["cost", "confidence_in_coverage", "low_usage_expectation", "skepticism_dealer_motives", "misunderstanding"];
const VEHICLE_TYPES = ["2024 Chevrolet Tahoe LT", "2024 Ford F-150 XLT", "2024 Toyota Camry SE", "2024 Honda CR-V EX", "2024 Jeep Grand Cherokee Limited", "2024 BMW X5 xDrive40i", "2024 Chevrolet Silverado 1500", "2024 Toyota RAV4 XLE"];

function jitter(base, pct) {
  const variance = base * pct;
  return Math.round(base + (Math.random() * variance * 2) - variance);
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function buildChecklist(score) {
  // Higher score = more items checked
  const threshold = score / 100;
  return {
    greeting: true,
    titleWork: Math.random() < threshold + 0.1,
    factoryWarranty: Math.random() < threshold,
    financialOptions: Math.random() < threshold + 0.05,
    timeFrame: Math.random() < threshold + 0.1,
    firstForms: Math.random() < threshold,
    privacyPolicy: Math.random() < threshold + 0.15,
    riskBasedPricing: Math.random() < threshold + 0.1,
    basePayment: Math.random() < threshold + 0.2,
    gapProtection: Math.random() < threshold,
    vehicleServiceAgreement: Math.random() < threshold - 0.05,
    tireWheel: Math.random() < threshold - 0.1,
    paintProtection: Math.random() < threshold - 0.15,
    theftDeterrent: Math.random() < threshold - 0.2,
    lifeInsurance: Math.random() < threshold - 0.25,
    disabilityInsurance: Math.random() < threshold - 0.3,
    assumptiveClose: Math.random() < threshold,
    objectionHandled: Math.random() < threshold - 0.05,
  };
}

let sessionCount = 0;
let objectionCount = 0;
let gradeCount = 0;
let checklistCount = 0;

for (const mgr of MANAGERS) {
  // 3–5 sessions per week for 13 weeks = ~50–65 sessions per manager
  for (let week = 12; week >= 0; week--) {
    const sessionsThisWeek = 3 + Math.floor(Math.random() * 3); // 3–5
    for (let s = 0; s < sessionsThisWeek; s++) {
      const dayOffset = week * 7 + Math.floor(Math.random() * 7);
      const sessionDate = daysAgo(dayOffset);

      // Score trends
      let score = jitter(mgr.baseScore, 0.12);
      if (mgr.trend === "up")   score = Math.min(100, score + (12 - week) * 0.4);
      if (mgr.trend === "down") score = Math.max(20,  score - (12 - week) * 0.3);
      score = Math.round(Math.min(100, Math.max(20, score)));

      const pvr = jitter(mgr.basePvr, 0.2);
      const duration = 900 + Math.floor(Math.random() * 1800); // 15–45 min in seconds
      const vehicle = randomFrom(VEHICLE_TYPES);
      const customerName = `Customer ${Math.floor(Math.random() * 9000) + 1000}`;

      // Insert session
      const [sessionResult] = await conn.execute(
        `INSERT INTO sessions (userId, customerName, dealType, vehicleType, status, startedAt, endedAt, durationSeconds, consentObtained)
         VALUES (?, ?, 'retail_finance', 'new', 'completed', ?, ?, ?, 1)`,
        [mgr.userId, `${customerName} — ${vehicle}`, sessionDate, sessionDate, duration]
      );
      const sessionId = sessionResult.insertId;
      sessionCount++;

      // Insert grade
      const checklist = buildChecklist(score);
      const introScore = Math.min(100, Math.round(score * 0.85 + jitter(10, 0.3)));
      const complianceScore = Math.min(100, Math.round(score * 0.9 + jitter(8, 0.2)));
      const menuScore = Math.min(100, Math.round(score * 0.8 + jitter(12, 0.3)));
      const closingScore = Math.min(100, Math.round(score * 0.75 + jitter(15, 0.3)));
      const objectionScore = Math.min(100, Math.round(score * 0.7 + jitter(15, 0.4)));
      const ppd = parseFloat((Math.round(score / 35) + Math.random() * 0.5).toFixed(2));
      const utilization = parseFloat((score / 100 * 0.85 + Math.random() * 0.1).toFixed(2));

      await conn.execute(
        `INSERT INTO performance_grades (sessionId, userId, overallScore, rapportScore, complianceScore, productPresentationScore, objectionHandlingScore, closingTechniqueScore, pvr, productsPerDeal, utilizationRate, gradedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId, mgr.userId,
          score, introScore, complianceScore, menuScore, objectionScore, closingScore,
          pvr, ppd, utilization,
          sessionDate
        ]
      );
      gradeCount++;

      // Insert checklist
      await conn.execute(
        `INSERT INTO session_checklists (sessionId, userId,
          fiManagerGreeting, statedTitleWork, statedFactoryWarranty, statedFinancialOptions, statedTimeFrame, introductionToFirstForms,
          privacyPolicyMentioned, riskBasedPricingMentioned, disclosedBasePayment,
          presentedPrepaidMaintenance, presentedVehicleServiceContract, presentedGap,
          presentedInteriorExteriorProtection, presentedRoadHazard, presentedPaintlessDentRepair,
          customerQuestionsAddressed, whichClosingQuestionAsked,
          introductionScore, complianceScore, menuPresentationScore, overallChecklistScore)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId, mgr.userId,
          checklist.greeting, checklist.titleWork, checklist.factoryWarranty,
          checklist.financialOptions, checklist.timeFrame, checklist.firstForms,
          checklist.privacyPolicy, checklist.riskBasedPricing, checklist.basePayment,
          checklist.paintProtection, checklist.vehicleServiceAgreement, checklist.gapProtection,
          checklist.paintProtection, checklist.tireWheel, checklist.paintProtection,
          checklist.objectionHandled, checklist.assumptiveClose,
          introScore, complianceScore, menuScore, score
        ]
      );
      checklistCount++;

      // Insert 0–3 objections per session
      const numObjections = Math.floor(Math.random() * 4);
      for (let o = 0; o < numObjections; o++) {
        const product = randomFrom(PRODUCTS);
        const concern = randomFrom(CONCERN_TYPES);
        const resolved = Math.random() < (score / 100) ? 1 : 0;

        await conn.execute(
          `INSERT INTO objection_logs (sessionId, userId, product, concernType, wasResolved)
           VALUES (?, ?, ?, ?, ?)`,
          [sessionId, mgr.userId, product, concern, resolved]
        );
        objectionCount++;
      }
    }
  }
}

await conn.end();

console.log(`✅ Seed complete:`);
console.log(`   Sessions:   ${sessionCount}`);
console.log(`   Grades:     ${gradeCount}`);
console.log(`   Checklists: ${checklistCount}`);
console.log(`   Objections: ${objectionCount}`);
