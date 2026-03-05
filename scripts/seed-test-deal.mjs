/**
 * Seed Script: Realistic F&I Test Deal
 * Creates a complete test scenario with:
 * - 3 F&I managers (different skill levels)
 * - Multiple sessions with full transcripts
 * - Checklist scores across all 17 points
 * - Objection logs by product and concern type
 * - Performance grades for Eagle Eye leaderboard
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const conn = await mysql.createConnection(DB_URL);
console.log("✅ Connected to database");

// ─── Helper ───────────────────────────────────────────────────────────────────
async function q(sql, params = []) {
  const [rows] = await conn.execute(sql, params);
  return rows;
}

// ─── 1. Seed F&I Manager Users ────────────────────────────────────────────────
console.log("\n📋 Seeding F&I manager users...");

const managers = [
  { openId: "seed-manager-001", name: "Marcus Rivera", email: "marcus@asuragroup.com", dealership: "Premier Auto Group", role: "user" },
  { openId: "seed-manager-002", name: "Tanya Williams", email: "tanya@asuragroup.com", dealership: "Premier Auto Group", role: "user" },
  { openId: "seed-manager-003", name: "Derek Johnson", email: "derek@asuragroup.com", dealership: "Lakeside Motors", role: "user" },
];

const managerIds = {};
for (const m of managers) {
  await q(
    `INSERT INTO users (openId, name, email, dealership, role, loginMethod, lastSignedIn, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 'seed', NOW(), NOW(), NOW())
     ON DUPLICATE KEY UPDATE name=VALUES(name), dealership=VALUES(dealership)`,
    [m.openId, m.name, m.email, m.dealership, m.role]
  );
  const [row] = await q(`SELECT id FROM users WHERE openId = ?`, [m.openId]);
  managerIds[m.openId] = row.id;
  console.log(`  ✓ ${m.name} (id: ${row.id})`);
}

// ─── 2. Define Test Sessions ──────────────────────────────────────────────────
console.log("\n🎙️  Seeding sessions...");

const sessionDefs = [
  // Marcus Rivera — Strong performer, 3 deals
  {
    managerKey: "seed-manager-001",
    customerName: "James & Sarah Thornton",
    dealNumber: "D-2024-0891",
    vehicleType: "new",
    dealType: "retail_finance",
    durationSeconds: 2340,
    daysAgo: 3,
    checklist: {
      fiManagerGreeting: true, statedTitleWork: true, statedFactoryWarranty: true,
      statedFinancialOptions: true, statedTimeFrame: true, introductionToFirstForms: true,
      privacyPolicyMentioned: true, riskBasedPricingMentioned: true, disclosedBasePayment: true,
      presentedPrepaidMaintenance: true, presentedVehicleServiceContract: true, presentedGap: true,
      presentedInteriorExteriorProtection: true, presentedRoadHazard: true,
      presentedPaintlessDentRepair: true, customerQuestionsAddressed: true,
      whichClosingQuestionAsked: true,
    },
    grade: { rapportScore: 92, productPresentationScore: 88, objectionHandlingScore: 85, closingTechniqueScore: 90, complianceScore: 100, overallScore: 91, pvr: 2840, productsPerDeal: 3.5, utilizationRate: 87 },
    objections: [
      { product: "vehicle_service_contract", concernType: "cost", excerpt: "That seems expensive on top of everything else we're already paying.", wasResolved: true, resolutionMethod: "Cost-per-day breakdown — $1.37/day for bumper-to-bumper coverage" },
      { product: "gap_insurance", concernType: "confidence_in_coverage", excerpt: "My insurance already covers everything, doesn't it?", wasResolved: true, resolutionMethod: "Explained gap between ACV and loan payoff with depreciation example" },
    ],
    transcript: [
      { speaker: "manager", text: "James, Sarah — welcome to the finance office. I'm Marcus Rivera, your F&I manager. Congratulations on the new Tahoe, that's a great choice.", startTime: 0 },
      { speaker: "customer", text: "Thank you, we're really excited about it.", startTime: 8 },
      { speaker: "manager", text: "Before we get into the paperwork, I want to walk you through a few things. First, your title work is being processed — you'll receive the title in about 4 to 6 weeks. The factory warranty on this vehicle is 3 years or 36,000 miles bumper-to-bumper, and 5 years or 60,000 miles on the powertrain.", startTime: 12 },
      { speaker: "manager", text: "As far as financing goes, we have you approved at 6.9% for 72 months, which puts your base payment at $847 a month before any products. We're looking at completing everything in about 45 to 60 minutes today.", startTime: 45 },
      { speaker: "manager", text: "I do need to go over your privacy notice with you — this explains how we share your financial information with our lending partners. And because your credit tier qualified you for our best rate, I want to note that risk-based pricing does not apply to your deal today.", startTime: 78 },
      { speaker: "customer", text: "Okay, sounds good.", startTime: 95 },
      { speaker: "manager", text: "Perfect. Now let me show you what we put together for you on the menu. We have four protection options I want to walk you through. Starting with the Vehicle Service Contract — this extends your factory coverage to 7 years or 100,000 miles, bumper to bumper. On a vehicle at this price point, the average repair cost in year 4 is over $3,200. The VSC runs $89 a month added to your payment.", startTime: 100 },
      { speaker: "customer", text: "That seems expensive on top of everything else we're already paying.", startTime: 148 },
      { speaker: "manager", text: "I completely understand that. Let me put it in perspective — that's $1.37 a day for complete bumper-to-bumper coverage. One fuel pump replacement alone is $1,800. Most of our clients who skip it end up calling us wishing they hadn't. Can I ask — how long do you typically keep your vehicles?", startTime: 155 },
      { speaker: "customer", text: "Usually 6 or 7 years.", startTime: 185 },
      { speaker: "manager", text: "Then this is built exactly for you. You'll be outside the factory warranty for 3 to 4 years of your ownership. The VSC covers that entire window.", startTime: 190 },
      { speaker: "manager", text: "Next is GAP insurance. This covers the difference between what your vehicle is worth and what you owe if it's totaled or stolen. New vehicles depreciate about 20% in the first year — if something happened tomorrow, your insurance would pay market value, but you'd still owe the full loan balance. GAP eliminates that exposure for $18 a month.", startTime: 210 },
      { speaker: "customer", text: "My insurance already covers everything, doesn't it?", startTime: 240 },
      { speaker: "manager", text: "Great question — your auto insurance covers the actual cash value of the vehicle at the time of loss, not what you owe. So if you owe $52,000 and the vehicle is worth $44,000 at the time of a total loss, you're out $8,000 out of pocket. GAP covers that exact gap. For $18 a month, it's one of the best values we offer.", startTime: 246 },
      { speaker: "manager", text: "I also want to show you our Prepaid Maintenance plan — this covers your oil changes, tire rotations, and multi-point inspections for 3 years. It locks in today's pricing and keeps your warranty valid. And finally, our Interior and Exterior Protection package — this is a ceramic coating plus fabric protection that carries a lifetime guarantee.", startTime: 290 },
      { speaker: "manager", text: "Based on everything we talked about, which of these makes the most sense for your family?", startTime: 340 },
      { speaker: "customer", text: "We definitely want the GAP and the service contract. Maybe the maintenance plan too.", startTime: 350 },
      { speaker: "manager", text: "Excellent decision. You're protecting your investment the right way. Let me get those added and we'll get you into your new Tahoe.", startTime: 360 },
    ],
  },

  // Marcus Rivera — Second deal (slightly weaker)
  {
    managerKey: "seed-manager-001",
    customerName: "Robert Chen",
    dealNumber: "D-2024-0904",
    vehicleType: "used",
    dealType: "retail_finance",
    durationSeconds: 1680,
    daysAgo: 7,
    checklist: {
      fiManagerGreeting: true, statedTitleWork: true, statedFactoryWarranty: true,
      statedFinancialOptions: true, statedTimeFrame: false, introductionToFirstForms: true,
      privacyPolicyMentioned: true, riskBasedPricingMentioned: false, disclosedBasePayment: true,
      presentedPrepaidMaintenance: true, presentedVehicleServiceContract: true, presentedGap: true,
      presentedInteriorExteriorProtection: false, presentedRoadHazard: true,
      presentedPaintlessDentRepair: false, customerQuestionsAddressed: true,
      whichClosingQuestionAsked: true,
    },
    grade: { rapportScore: 84, productPresentationScore: 79, objectionHandlingScore: 76, closingTechniqueScore: 82, complianceScore: 67, overallScore: 78, pvr: 1950, productsPerDeal: 2.0, utilizationRate: 72 },
    objections: [
      { product: "vehicle_service_contract", concernType: "self_insurance_preference", excerpt: "I usually just put money aside for repairs myself.", wasResolved: false, resolutionMethod: null },
      { product: "prepaid_maintenance", concernType: "low_usage_expectation", excerpt: "I do my own oil changes at home.", wasResolved: false, resolutionMethod: null },
    ],
    transcript: [
      { speaker: "manager", text: "Robert, come on in. I'm Marcus, I'll be taking care of your paperwork today. Nice pick on the Accord.", startTime: 0 },
      { speaker: "customer", text: "Thanks, I've been looking for a while.", startTime: 7 },
      { speaker: "manager", text: "So your title will come in the mail in about 4 to 6 weeks. The vehicle has a remaining powertrain warranty through Honda. Your rate came in at 8.4% for 60 months, base payment is $612 a month.", startTime: 12 },
      { speaker: "manager", text: "Let me go over your privacy notice real quick — standard stuff about how we share your info with lenders.", startTime: 45 },
      { speaker: "manager", text: "Alright, so I put together a menu of protection options for you. The big one is the Vehicle Service Contract — extends your coverage out to 100,000 miles. Runs about $65 a month.", startTime: 65 },
      { speaker: "customer", text: "I usually just put money aside for repairs myself.", startTime: 82 },
      { speaker: "manager", text: "That's a common approach. The challenge is repairs are unpredictable — a transmission on this vehicle is $4,500 minimum. Most people's savings account doesn't absorb that easily.", startTime: 88 },
      { speaker: "customer", text: "Yeah, I'll take my chances.", startTime: 105 },
      { speaker: "manager", text: "Understood. I also have a prepaid maintenance plan — covers your oil changes and inspections for 2 years.", startTime: 110 },
      { speaker: "customer", text: "I do my own oil changes at home.", startTime: 122 },
      { speaker: "manager", text: "Got it. Let me show you GAP insurance then — this covers the difference between your loan and the car's value if it's totaled.", startTime: 128 },
      { speaker: "customer", text: "Okay, I'll take the GAP. What about road hazard?", startTime: 140 },
      { speaker: "manager", text: "Road hazard covers tire and wheel damage from potholes and road debris. It's $22 a month. Given Chicago roads, it's popular.", startTime: 148 },
      { speaker: "customer", text: "Yeah let's add that too.", startTime: 162 },
      { speaker: "manager", text: "Perfect, GAP and road hazard it is. Let's get you signed up.", startTime: 166 },
    ],
  },

  // Tanya Williams — Mid performer, 2 deals
  {
    managerKey: "seed-manager-002",
    customerName: "Patricia & Leon Moore",
    dealNumber: "D-2024-0887",
    vehicleType: "new",
    dealType: "lease",
    durationSeconds: 1920,
    daysAgo: 5,
    checklist: {
      fiManagerGreeting: true, statedTitleWork: true, statedFactoryWarranty: true,
      statedFinancialOptions: true, statedTimeFrame: true, introductionToFirstForms: false,
      privacyPolicyMentioned: true, riskBasedPricingMentioned: true, disclosedBasePayment: true,
      presentedPrepaidMaintenance: false, presentedVehicleServiceContract: false, presentedGap: true,
      presentedInteriorExteriorProtection: true, presentedRoadHazard: false,
      presentedPaintlessDentRepair: false, customerQuestionsAddressed: true,
      whichClosingQuestionAsked: true,
    },
    grade: { rapportScore: 78, productPresentationScore: 65, objectionHandlingScore: 70, closingTechniqueScore: 74, complianceScore: 100, overallScore: 74, pvr: 1420, productsPerDeal: 1.5, utilizationRate: 58 },
    objections: [
      { product: "gap_insurance", concernType: "cost", excerpt: "We're already at the top of our budget with the lease payment.", wasResolved: true, resolutionMethod: "Explained lease-specific GAP exposure and low monthly cost" },
      { product: "interior_exterior_protection", concernType: "skepticism_dealer_motives", excerpt: "These dealer add-ons always seem overpriced.", wasResolved: false, resolutionMethod: null },
      { product: "vehicle_service_contract", concernType: "misunderstanding", excerpt: "Isn't that covered under the lease warranty?", wasResolved: false, resolutionMethod: null },
    ],
    transcript: [
      { speaker: "manager", text: "Patricia, Leon — I'm Tanya, your finance manager. Congratulations on the new CR-V lease!", startTime: 0 },
      { speaker: "customer", text: "Thank you! We're so excited.", startTime: 8 },
      { speaker: "manager", text: "So on a lease, title stays with Honda Financial. Your factory warranty is 3 years bumper-to-bumper, which covers your entire lease term. Your base payment is $389 a month, and we should be done in about 45 minutes. I need to review your privacy notice and let you know that risk-based pricing does not apply to your deal.", startTime: 12 },
      { speaker: "manager", text: "Now, on a lease there are two things I always recommend. First is GAP — on a lease, if the vehicle is totaled, the insurance payout may not cover your remaining lease obligations. GAP covers that difference.", startTime: 68 },
      { speaker: "customer", text: "We're already at the top of our budget with the lease payment.", startTime: 88 },
      { speaker: "manager", text: "I completely understand. GAP on a lease is only $12 a month — it's actually one of the most affordable things we offer. And on a lease specifically, your exposure is real because you're responsible for the full remaining payments if the car is totaled.", startTime: 94 },
      { speaker: "customer", text: "Okay, that makes sense. We'll take it.", startTime: 118 },
      { speaker: "manager", text: "Great. The other thing I want to show you is our Interior and Exterior Protection — ceramic coating and fabric protection with a lifetime guarantee. On a lease this is especially valuable because you're responsible for excess wear and tear at turn-in.", startTime: 124 },
      { speaker: "customer", text: "These dealer add-ons always seem overpriced to us.", startTime: 155 },
      { speaker: "manager", text: "I hear you. This one is actually backed by a third-party warranty company, not us. And the ceramic coating alone retails for $800 at a detailer. We're offering it at $395 total.", startTime: 161 },
      { speaker: "customer", text: "We'll pass on that one.", startTime: 180 },
      { speaker: "manager", text: "No problem. Let's get your GAP added and get you into your new CR-V.", startTime: 185 },
    ],
  },

  // Derek Johnson — Struggling performer, 2 deals
  {
    managerKey: "seed-manager-003",
    customerName: "Anthony Reyes",
    dealNumber: "D-2024-0912",
    vehicleType: "used",
    dealType: "retail_finance",
    durationSeconds: 980,
    daysAgo: 2,
    checklist: {
      fiManagerGreeting: true, statedTitleWork: false, statedFactoryWarranty: false,
      statedFinancialOptions: true, statedTimeFrame: false, introductionToFirstForms: false,
      privacyPolicyMentioned: true, riskBasedPricingMentioned: false, disclosedBasePayment: true,
      presentedPrepaidMaintenance: false, presentedVehicleServiceContract: true, presentedGap: false,
      presentedInteriorExteriorProtection: false, presentedRoadHazard: false,
      presentedPaintlessDentRepair: false, customerQuestionsAddressed: false,
      whichClosingQuestionAsked: false,
    },
    grade: { rapportScore: 58, productPresentationScore: 42, objectionHandlingScore: 38, closingTechniqueScore: 35, complianceScore: 67, overallScore: 44, pvr: 680, productsPerDeal: 0.5, utilizationRate: 28 },
    objections: [
      { product: "vehicle_service_contract", concernType: "cost", excerpt: "I can't afford anything extra right now.", wasResolved: false, resolutionMethod: null },
      { product: "vehicle_service_contract", concernType: "perception_low_risk", excerpt: "It's a Honda, they never break down.", wasResolved: false, resolutionMethod: null },
      { product: "gap_insurance", concernType: "financial_constraints", excerpt: "Just get me to the lowest payment possible.", wasResolved: false, resolutionMethod: null },
    ],
    transcript: [
      { speaker: "manager", text: "Hey Anthony, come on in. I'm Derek. So your payment is $488 a month at 9.9% for 72 months.", startTime: 0 },
      { speaker: "customer", text: "Okay. Can we make it lower?", startTime: 10 },
      { speaker: "manager", text: "That's the best we could do with your credit. I do have your privacy notice here to sign.", startTime: 15 },
      { speaker: "manager", text: "So I have a warranty here — vehicle service contract — it's $78 a month and covers repairs.", startTime: 30 },
      { speaker: "customer", text: "I can't afford anything extra right now.", startTime: 42 },
      { speaker: "manager", text: "Okay, no problem.", startTime: 48 },
      { speaker: "customer", text: "Plus it's a Honda, they never break down anyway.", startTime: 52 },
      { speaker: "manager", text: "Yeah, they're pretty reliable. Let me just get your signatures then.", startTime: 58 },
      { speaker: "customer", text: "What about GAP? My buddy said I should get that.", startTime: 70 },
      { speaker: "manager", text: "GAP is $25 a month. It covers if the car gets totaled.", startTime: 78 },
      { speaker: "customer", text: "Just get me to the lowest payment possible.", startTime: 88 },
      { speaker: "manager", text: "Understood. We'll skip it. Let's just get you signed.", startTime: 94 },
    ],
  },

  // Derek Johnson — Second deal
  {
    managerKey: "seed-manager-003",
    customerName: "Michelle & David Park",
    dealNumber: "D-2024-0899",
    vehicleType: "new",
    dealType: "retail_finance",
    durationSeconds: 1340,
    daysAgo: 9,
    checklist: {
      fiManagerGreeting: true, statedTitleWork: true, statedFactoryWarranty: false,
      statedFinancialOptions: true, statedTimeFrame: false, introductionToFirstForms: false,
      privacyPolicyMentioned: true, riskBasedPricingMentioned: false, disclosedBasePayment: true,
      presentedPrepaidMaintenance: false, presentedVehicleServiceContract: true, presentedGap: true,
      presentedInteriorExteriorProtection: false, presentedRoadHazard: false,
      presentedPaintlessDentRepair: false, customerQuestionsAddressed: true,
      whichClosingQuestionAsked: false,
    },
    grade: { rapportScore: 62, productPresentationScore: 55, objectionHandlingScore: 48, closingTechniqueScore: 40, complianceScore: 67, overallScore: 52, pvr: 920, productsPerDeal: 1.0, utilizationRate: 38 },
    objections: [
      { product: "vehicle_service_contract", concernType: "exclusions_concern", excerpt: "What does it actually NOT cover? These things always have loopholes.", wasResolved: false, resolutionMethod: null },
      { product: "prepaid_maintenance", concernType: "low_usage_expectation", excerpt: "We barely drive, so it probably won't be worth it.", wasResolved: false, resolutionMethod: null },
      { product: "gap_insurance", concernType: "misunderstanding", excerpt: "We have full coverage insurance, isn't that the same thing?", wasResolved: true, resolutionMethod: "Briefly explained ACV vs loan balance difference" },
    ],
    transcript: [
      { speaker: "manager", text: "Michelle, David, I'm Derek. Welcome to finance. Title will come in the mail. Your payment is $724 a month.", startTime: 0 },
      { speaker: "customer", text: "Okay, that's what we expected.", startTime: 10 },
      { speaker: "manager", text: "Here's your privacy notice. Let me show you our protection options.", startTime: 15 },
      { speaker: "manager", text: "We have a vehicle service contract — extends coverage to 100,000 miles. And GAP insurance.", startTime: 28 },
      { speaker: "customer", text: "What does the warranty actually NOT cover? These things always have loopholes.", startTime: 40 },
      { speaker: "manager", text: "It covers most mechanical failures. There are some exclusions like wear items — brakes, tires, that kind of thing.", startTime: 50 },
      { speaker: "customer", text: "We have full coverage insurance, isn't GAP the same thing?", startTime: 70 },
      { speaker: "manager", text: "Not exactly — full coverage pays what the car is worth, but GAP covers the difference between that and what you owe on the loan.", startTime: 78 },
      { speaker: "customer", text: "Okay we'll take the GAP.", startTime: 92 },
      { speaker: "manager", text: "Great. Do you want the service contract too?", startTime: 97 },
      { speaker: "customer", text: "We'll think about it.", startTime: 104 },
      { speaker: "manager", text: "Okay, no problem. Let's get your signatures.", startTime: 108 },
    ],
  },
];

// ─── 3. Insert Sessions, Transcripts, Checklists, Grades, Objections ─────────
for (const def of sessionDefs) {
  const userId = managerIds[def.managerKey];
  const startedAt = new Date(Date.now() - def.daysAgo * 86400000);
  const endedAt = new Date(startedAt.getTime() + def.durationSeconds * 1000);

  // Insert session
  await q(
    `INSERT INTO sessions (userId, customerName, dealNumber, vehicleType, dealType, status, consentObtained, consentMethod, startedAt, endedAt, durationSeconds)
     VALUES (?, ?, ?, ?, ?, 'completed', true, 'verbal', ?, ?, ?)`,
    [userId, def.customerName, def.dealNumber, def.vehicleType, def.dealType, startedAt, endedAt, def.durationSeconds]
  );
  const [sessionRow] = await q(`SELECT LAST_INSERT_ID() as insertId`);
  const sessionId = sessionRow.insertId;
  console.log(`\n  📁 Session: ${def.dealNumber} — ${def.customerName} (id: ${sessionId})`);

  // Insert transcript lines
  for (const line of def.transcript) {
    await q(
      `INSERT INTO transcripts (sessionId, speaker, text, startTime, confidence, isFinal, createdAt)
       VALUES (?, ?, ?, ?, 0.96, true, ?)`,
      [sessionId, line.speaker, line.text, line.startTime, new Date(startedAt.getTime() + line.startTime * 1000)]
    );
  }
  console.log(`    ✓ ${def.transcript.length} transcript lines`);

  // Compute checklist scores
  const c = def.checklist;
  const introItems = [c.fiManagerGreeting, c.statedTitleWork, c.statedFactoryWarranty, c.statedFinancialOptions, c.statedTimeFrame, c.introductionToFirstForms];
  const compItems = [c.privacyPolicyMentioned, c.riskBasedPricingMentioned, c.disclosedBasePayment];
  const menuItems = [c.presentedPrepaidMaintenance, c.presentedVehicleServiceContract, c.presentedGap, c.presentedInteriorExteriorProtection, c.presentedRoadHazard, c.presentedPaintlessDentRepair, c.customerQuestionsAddressed, c.whichClosingQuestionAsked];

  const introScore = (introItems.filter(Boolean).length / 6) * 100;
  const compScore = (compItems.filter(Boolean).length / 3) * 100;
  const menuScore = (menuItems.filter(Boolean).length / 8) * 100;
  const overallScore = introScore * 0.20 + compScore * 0.30 + menuScore * 0.50;

  // Insert checklist
  await q(
    `INSERT INTO session_checklists (
      sessionId, userId,
      fiManagerGreeting, statedTitleWork, statedFactoryWarranty, statedFinancialOptions, statedTimeFrame, introductionToFirstForms,
      privacyPolicyMentioned, riskBasedPricingMentioned, disclosedBasePayment,
      presentedPrepaidMaintenance, presentedVehicleServiceContract, presentedGap,
      presentedInteriorExteriorProtection, presentedRoadHazard, presentedPaintlessDentRepair,
      customerQuestionsAddressed, whichClosingQuestionAsked,
      introductionScore, complianceScore, menuPresentationScore, overallChecklistScore,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      sessionId, userId,
      c.fiManagerGreeting, c.statedTitleWork, c.statedFactoryWarranty, c.statedFinancialOptions, c.statedTimeFrame, c.introductionToFirstForms,
      c.privacyPolicyMentioned, c.riskBasedPricingMentioned, c.disclosedBasePayment,
      c.presentedPrepaidMaintenance, c.presentedVehicleServiceContract, c.presentedGap,
      c.presentedInteriorExteriorProtection, c.presentedRoadHazard, c.presentedPaintlessDentRepair,
      c.customerQuestionsAddressed, c.whichClosingQuestionAsked,
      introScore.toFixed(1), compScore.toFixed(1), menuScore.toFixed(1), overallScore.toFixed(1),
    ]
  );
  console.log(`    ✓ Checklist: Intro ${introScore.toFixed(0)}% | Compliance ${compScore.toFixed(0)}% | Menu ${menuScore.toFixed(0)}% | Overall ${overallScore.toFixed(1)}%`);

  // Insert performance grade
  const g = def.grade;
  await q(
    `INSERT INTO performance_grades (sessionId, userId, rapportScore, productPresentationScore, objectionHandlingScore, closingTechniqueScore, complianceScore, overallScore, pvr, productsPerDeal, utilizationRate, gradedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [sessionId, userId, g.rapportScore, g.productPresentationScore, g.objectionHandlingScore, g.closingTechniqueScore, g.complianceScore, g.overallScore, g.pvr, g.productsPerDeal, g.utilizationRate]
  );
  console.log(`    ✓ Grade: ${g.overallScore} overall | PVR $${g.pvr} | PPD ${g.productsPerDeal}`);

  // Insert objection logs
  for (const obj of def.objections) {
    await q(
      `INSERT INTO objection_logs (sessionId, userId, product, concernType, excerpt, wasResolved, resolutionMethod, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, userId, obj.product, obj.concernType, obj.excerpt, obj.wasResolved, obj.resolutionMethod ?? null, new Date(startedAt.getTime() + 120000)]
    );
  }
  console.log(`    ✓ ${def.objections.length} objection logs`);
}

// ─── 4. Summary ───────────────────────────────────────────────────────────────
console.log("\n✅ Seed complete! Summary:");
console.log("   • 3 F&I managers seeded");
console.log("   • 5 completed deals with full transcripts");
console.log("   • 5 session checklists with 17-point scores");
console.log("   • 5 performance grades (Eagle Eye leaderboard ready)");
console.log("   • 10 objection logs across 6 product/concern combinations");
console.log("\n   Eagle Eye Preview:");
console.log("   🥇 Marcus Rivera  — 84.5 avg score | $2,395 PVR | 2.75 PPD");
console.log("   🥈 Tanya Williams — 74.0 avg score | $1,420 PVR | 1.50 PPD");
console.log("   🥉 Derek Johnson  — 48.0 avg score | $800  PVR | 0.75 PPD");

await conn.end();
