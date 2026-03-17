/**
 * Direct DB seeder — runs SEED_DATA through the upsertProductIntelligence DB function.
 * Usage: node --loader tsx/esm scripts/run-seed.mjs
 * OR:    npx tsx scripts/run-seed.mjs
 */
import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const SEED_DATA = [
  {
    productType: "vehicle_service_contract",
    coverageSummary: "Covers mechanical breakdown and electrical failure after the manufacturer warranty expires. Includes powertrain, drivetrain, AC, electrical systems.",
    commonObjections: JSON.stringify(["I never use warranties","The car is brand new, I don't need it","I'll just pay out of pocket if something breaks","It costs too much","I can buy it later"]),
    objectionResponses: JSON.stringify(["That's exactly the point — you haven't needed one yet. But the average repair on a modern vehicle is $1,200-$3,500.","The manufacturer warranty covers you for 3 years or 36,000 miles — most people keep their vehicle 5-7 years.","Most customers who say that haven't priced a timing chain replacement. We're talking $2,800-$4,500 at the dealer.","Break it down per month — it's typically $35-60/month folded into the payment. That's less than one oil change.","You actually can't. Once you drive off the lot, the cost goes up significantly because underwriting changes."]),
    sellingPoints: JSON.stringify(["Transferable to the next owner — increases resale value","Zero or low deductible options","Covers rental car while yours is in the shop","Nationwide coverage at any licensed repair facility","Locks in today's repair costs against future inflation"]),
    asuraCoachingTips: JSON.stringify(["NEVER say 'extended warranty' — say Vehicle Service Agreement or VSA.","Present as a PROTECTION, not a product. 'This is your mechanical breakdown protection.'","Use opt-out framing: 'Most customers choose to include this — would you like to opt out?'","Tie back to client survey: 'You mentioned you plan to keep this vehicle 5+ years — this is designed exactly for that.'","Lead with the average repair cost stat: '$1,200-$3,500 average repair' — let the math do the selling."]),
    targetCustomerProfile: "Customers financing 60+ months, keeping vehicle beyond factory warranty, families with high mileage, anyone buying used/CPO.",
    avgCloseRate: 0.55,
    avgProfit: 800.00,
    complianceNotes: "Cannot represent as manufacturer warranty. Must disclose all exclusions. Cannot say 'best rate' — say 'best terms and conditions'. State-specific cancellation rights apply.",
    isActive: true,
  },
  {
    productType: "gap_insurance",
    coverageSummary: "Covers the difference between what insurance pays (actual cash value) and what the customer still owes on the loan if the vehicle is totaled or stolen.",
    commonObjections: JSON.stringify(["My insurance covers everything","I put a big down payment so I don't need it","I have full coverage"]),
    objectionResponses: JSON.stringify(["Insurance pays actual cash value — not what you owe. If you're upside down even $1,000, you're writing a check out of pocket.","Down payments help, but depreciation is steep in the first 12-18 months. Even with 20% down, you can be underwater.","Full coverage pays ACV. GAP covers the gap between ACV and your payoff. They work together — they don't replace each other."]),
    sellingPoints: JSON.stringify(["Eliminates out-of-pocket balance after total loss","Covers deductible (up to plan limits)","Inexpensive — typically $3-8/month in the payment","Peace of mind from day one","Especially critical in first 24 months when depreciation is steepest"]),
    asuraCoachingTips: JSON.stringify(["Always present GAP on every deal — even with large down payments.","Use the 'depreciation cliff' visual: 'The moment you drive off the lot, the car loses 10-15% of value.'","Frame as: 'This is the one product your insurance company wishes you didn't have.'","Pair with VSA: 'The VSA protects you while you're driving it. GAP protects you if you lose it.'"]),
    targetCustomerProfile: "Customers financing 84+ months, rolling negative equity, low down payment, leasing, first-time buyers.",
    avgCloseRate: 0.60,
    avgProfit: 600.00,
    complianceNotes: "Must disclose coverage limits and exclusions. Cannot guarantee full payoff in all scenarios. State insurance licensing may be required. Disclose deductible coverage limits.",
    isActive: true,
  },
  {
    productType: "prepaid_maintenance",
    coverageSummary: "Pre-purchased oil changes, tire rotations, multi-point inspections, and other routine maintenance at a fixed price, locked in at today's rates.",
    commonObjections: JSON.stringify(["I do my own oil changes","I use a quick lube place","I might not keep the car that long"]),
    objectionResponses: JSON.stringify(["This program is designed for customers who want the convenience of coming back to the dealer — where your car was built and your technicians are trained on it.","Quick lube places use generic oil. Your vehicle requires specific oil specs. Dealer maintenance keeps your warranty intact and your records in one place.","It's transferable. If you sell the vehicle, unused services transfer to the new owner — it actually increases resale value."]),
    sellingPoints: JSON.stringify(["Locks in today's maintenance prices","Transferable — increases trade-in/resale value","Keeps maintenance records at the dealership","Ensures manufacturer-spec fluids and parts","Convenient scheduling with service reminders"]),
    asuraCoachingTips: JSON.stringify(["Lead with the price lock: 'Oil change prices have gone up 40% in 3 years. This locks in today's price.'","Tie to trade-in value: 'Documented dealer maintenance history adds $500-$1,500 at trade-in.'","Present as a savings: 'You're going to do these services anyway — why not pay less for them today?'"]),
    targetCustomerProfile: "Customers who service at the dealer, busy professionals who value convenience, customers planning to trade in within 3-5 years.",
    avgCloseRate: 0.40,
    avgProfit: 400.00,
    complianceNotes: "Must disclose what services are included and excluded. Cancellation and refund policy must be disclosed. Cannot guarantee future pricing.",
    isActive: true,
  },
  {
    productType: "interior_exterior_protection",
    coverageSummary: "Protects vehicle interior (fabric, leather, carpet) and exterior (paint, clear coat) from stains, fading, UV damage, and environmental hazards.",
    commonObjections: JSON.stringify(["I'll just be careful","I can buy this at the store","It's not worth it"]),
    objectionResponses: JSON.stringify(["Accidents happen — kids, pets, coffee, food. This covers what 'being careful' can't prevent.","Store products are topical treatments. This is a professional application with a warranty behind it.","One interior detail at a dealer runs $200-$400. One exterior paint correction runs $500-$1,500. This pays for itself on the first incident."]),
    sellingPoints: JSON.stringify(["Professional-grade application","Backed by a warranty","Covers stains, fading, and environmental damage","Interior: fabric, leather, carpet protection","Exterior: paint sealant, UV protection"]),
    asuraCoachingTips: JSON.stringify(["Show the cost of one detailing service vs the program cost.","For families with kids or pets: 'This is the one product parents always wish they had added.'","For new car buyers: 'You just spent $40,000 on this vehicle — $X protects that investment.'"]),
    targetCustomerProfile: "Families with children or pets, customers in harsh climates, new car buyers, customers who plan to trade in.",
    avgCloseRate: 0.45,
    avgProfit: 500.00,
    complianceNotes: "Must disclose what is and isn't covered. Warranty terms must be provided in writing. Application method and warranty provider must be disclosed.",
    isActive: true,
  },
  {
    productType: "road_hazard",
    coverageSummary: "Covers tire and wheel damage from road hazards including potholes, nails, glass, and debris. Includes repair or replacement of tires and wheels.",
    commonObjections: JSON.stringify(["My insurance covers this","I've never had a flat","Tires aren't that expensive"]),
    objectionResponses: JSON.stringify(["Insurance covers collision — not road hazard tire damage. This is a completely different coverage.","Most customers haven't had a flat in years — until they do. And the first one is always at the worst time.","A single tire on this vehicle runs $200-$400. A wheel replacement is $500-$800. This covers both."]),
    sellingPoints: JSON.stringify(["Covers tire and wheel repair/replacement","No deductible on most plans","Includes roadside assistance on many plans","Covers all four tires and wheels","Especially valuable on low-profile tire vehicles"]),
    asuraCoachingTips: JSON.stringify(["Always mention the wheel cost — that's the number that gets attention.","For vehicles with low-profile tires: 'These tires are especially vulnerable to pothole damage — and they're expensive to replace.'","Bundle with interior/exterior: 'This rounds out your complete vehicle protection package.'"]),
    targetCustomerProfile: "Customers in areas with poor road conditions, vehicles with low-profile or performance tires, high-mileage commuters.",
    avgCloseRate: 0.35,
    avgProfit: 350.00,
    complianceNotes: "Must disclose coverage limits per incident and per term. Roadside assistance terms must be disclosed separately. Cannot guarantee same-day service.",
    isActive: true,
  },
  {
    productType: "paintless_dent_repair",
    coverageSummary: "Covers removal of minor dents and dings (door dings, hail damage, parking lot damage) without repainting, preserving the original factory finish.",
    commonObjections: JSON.stringify(["I park carefully","It's just a small dent, I don't care","I can get it fixed cheaply elsewhere"]),
    objectionResponses: JSON.stringify(["Parking lots are the #1 source of door dings — other people don't park as carefully as you do.","Small dents affect trade-in value more than you'd think. Dealers deduct $200-$500 per dent at appraisal.","Body shop repair requires repainting — which can affect your vehicle's value and warranty. PDR preserves the factory finish."]),
    sellingPoints: JSON.stringify(["Preserves factory paint finish","No repainting required","Maintains vehicle value","Unlimited repairs on qualifying dents","Fast turnaround — often same day"]),
    asuraCoachingTips: JSON.stringify(["Lead with the trade-in deduction: 'Dealers deduct $200-$500 per dent at trade-in. This pays for itself on the first ding.'","For new car buyers: 'You're going to get a door ding in the first 30 days — it's almost guaranteed in a parking lot.'","Pair with interior/exterior protection for a complete appearance package."]),
    targetCustomerProfile: "New car buyers, customers who trade frequently, anyone who parks in public lots or tight spaces.",
    avgCloseRate: 0.38,
    avgProfit: 300.00,
    complianceNotes: "Must disclose size limitations for qualifying dents. Cannot guarantee all dents are repairable via PDR. Must disclose if repainting becomes necessary.",
    isActive: true,
  },
  {
    productType: "key_replacement",
    coverageSummary: "Covers the cost of replacing lost, stolen, or damaged vehicle keys and key fobs, including programming and locksmith services.",
    commonObjections: JSON.stringify(["I have a spare","I'll just be careful with my keys","Keys aren't that expensive"]),
    objectionResponses: JSON.stringify(["Spare keys are for when you lose the first one — not the second. And most customers don't have a spare for their fob.","Lost keys happen to everyone — it's not about being careful, it's about what happens when it does.","A replacement key fob for this vehicle is $300-$600 programmed. A smart key or proximity key is $400-$800. This covers that."]),
    sellingPoints: JSON.stringify(["Covers key fob replacement and programming","Includes locksmith services if locked out","Covers all keys/fobs for the vehicle","No deductible on most plans","Especially valuable for smart keys and proximity fobs"]),
    asuraCoachingTips: JSON.stringify(["Always quote the actual replacement cost for the specific vehicle — look it up if needed.","For luxury or tech-heavy vehicles: 'This key fob alone is $500 to replace at the dealer.'","Present as a no-brainer: 'For $X/month, you never have to worry about a $500 key replacement.'"]),
    targetCustomerProfile: "Customers with smart keys or proximity fobs, families with multiple drivers, customers with children.",
    avgCloseRate: 0.42,
    avgProfit: 250.00,
    complianceNotes: "Must disclose number of replacements covered per term. Locksmith service limits must be disclosed. Coverage for valet keys and additional fobs must be specified.",
    isActive: true,
  },
  {
    productType: "windshield_protection",
    coverageSummary: "Covers repair or replacement of windshield and other auto glass damaged by road debris, rocks, or other hazards.",
    commonObjections: JSON.stringify(["My insurance covers glass","I've never had a cracked windshield","It's not that expensive"]),
    objectionResponses: JSON.stringify(["Insurance glass coverage often comes with a deductible and can affect your rates. This is a no-deductible, no-claim alternative.","Rock chips happen — especially on highways. And a chip that's not repaired quickly becomes a crack that requires full replacement.","Windshield replacement on this vehicle is $400-$1,200 depending on sensors and ADAS calibration. This covers that."]),
    sellingPoints: JSON.stringify(["No deductible","Won't affect insurance rates","Covers ADAS recalibration after replacement","Includes chip repair to prevent cracks","Especially valuable for vehicles with camera/sensor-equipped windshields"]),
    asuraCoachingTips: JSON.stringify(["Lead with ADAS calibration cost: 'This vehicle has cameras in the windshield — replacement requires a $300-$500 recalibration on top of the glass cost.'","Position as insurance alternative: 'This way you never have to file a claim for glass.'","For highway commuters: 'Rock chips are almost inevitable on the highway — this covers the repair before it becomes a replacement.'"]),
    targetCustomerProfile: "Highway commuters, customers in construction-heavy areas, vehicles with ADAS/camera systems in windshield.",
    avgCloseRate: 0.38,
    avgProfit: 280.00,
    complianceNotes: "Must disclose coverage limits and number of replacements. ADAS recalibration coverage must be specified. Cannot guarantee OEM glass in all cases.",
    isActive: true,
  },
  {
    productType: "lease_wear_tear",
    coverageSummary: "Covers excess wear and tear charges at lease-end, including interior stains, exterior scratches, tire wear, and minor damage beyond normal use standards.",
    commonObjections: JSON.stringify(["I'll be careful","I've returned leases before without charges","I'm not sure I'll lease again"]),
    objectionResponses: JSON.stringify(["Even careful drivers get charged. A small stain, a door ding, a curb scrape on a wheel — lease companies charge retail rates. Average lease-end charges are $1,500-$3,000.","Standards change. What was acceptable on your last lease may not be on this one. Lease companies have tightened their standards.","Plans change. If rates drop or you want something different, you want the flexibility to turn it in clean."]),
    sellingPoints: JSON.stringify(["Covers interior and exterior wear beyond normal","Covers excess mileage charges (up to plan limits)","Eliminates lease-end surprises","Average customer saves $1,500-$3,000","Peace of mind throughout the lease"]),
    asuraCoachingTips: JSON.stringify(["Every lease customer needs this conversation. Period.","Ask: 'Do you plan to turn this in or buy it at the end?' — either way, position the protection.","Show the typical lease-end charge sheet — the numbers do the selling.","Frame as 'insurance against surprises at turn-in.'"]),
    targetCustomerProfile: "All lease customers — especially those with families, pets, or long commutes.",
    avgCloseRate: 0.45,
    avgProfit: 400.00,
    complianceNotes: "Must align with specific leasing company definitions of excess wear. Cannot guarantee elimination of all charges. Coverage limits must be disclosed.",
    isActive: true,
  },
  {
    productType: "tire_wheel",
    coverageSummary: "Comprehensive tire and wheel protection covering damage from road hazards, including repair, replacement, and mounting/balancing costs.",
    commonObjections: JSON.stringify(["I have roadside assistance","My insurance covers this","Tires are cheap"]),
    objectionResponses: JSON.stringify(["Roadside assistance gets you off the road — it doesn't pay for the tire or wheel. This covers the cost of repair or replacement.","Insurance doesn't cover road hazard tire damage. This fills that gap completely.","A single tire on this vehicle is $200-$400. A wheel is $400-$800. Plus mounting and balancing. This covers all of it."]),
    sellingPoints: JSON.stringify(["Covers tire and wheel repair and replacement","Includes mounting and balancing","No deductible on most plans","Covers all four tires and wheels","Includes cosmetic wheel repair on some plans"]),
    asuraCoachingTips: JSON.stringify(["Always quote the specific tire cost for the vehicle — look it up.","For performance or luxury vehicles: 'These run-flat tires are $400 each — this covers all four.'","Bundle with road hazard for complete rolling protection."]),
    targetCustomerProfile: "Vehicles with premium or performance tires, customers in pothole-heavy areas, high-mileage drivers.",
    avgCloseRate: 0.40,
    avgProfit: 380.00,
    complianceNotes: "Must disclose coverage limits per incident and per term. Cosmetic damage coverage must be specified. Cannot guarantee same-day service or specific brands.",
    isActive: true,
  },
  {
    productType: "theft_protection",
    coverageSummary: "Anti-theft system including VIN etching, GPS tracking device, and/or recovery services. Provides a benefit if the vehicle is stolen and not recovered.",
    commonObjections: JSON.stringify(["I have insurance for theft","I live in a safe area","Cars have factory anti-theft"]),
    objectionResponses: JSON.stringify(["Insurance covers the value — minus your deductible, minus depreciation. This fills the gaps and helps recovery. Plus, many plans offer a benefit on top of insurance.","Vehicle theft happens everywhere — parking lots, driveways, shopping centers. It's a crime of opportunity, not just location.","Factory systems deter. Active tracking recovers. VIN etching makes it harder to resell parts. These layers work together."]),
    sellingPoints: JSON.stringify(["VIN etching deters theft (parts can be traced)","GPS tracking improves recovery rates","Benefit payment if vehicle is not recovered","May reduce insurance premiums","Active deterrent + passive protection"]),
    asuraCoachingTips: JSON.stringify(["Position as an active theft device — not just passive protection.","The insurance premium reduction angle can offset the cost.","Bundle as part of the GAP conversation: 'GAP protects if it's totaled, this protects if it's stolen.'","Lead with local theft statistics if available."]),
    targetCustomerProfile: "Owners of high-theft vehicles (trucks, SUVs), customers without garages, urban areas with higher theft rates.",
    avgCloseRate: 0.30,
    avgProfit: 350.00,
    complianceNotes: "Must disclose what the 'benefit' entails vs insurance payout. Cannot guarantee recovery. State regulations on tracking devices may apply.",
    isActive: true,
  },
  {
    productType: "other",
    coverageSummary: "Additional F&I products and protections not covered by standard categories. May include LoJack, credit life/disability insurance, identity theft protection, or dealer-specific programs.",
    commonObjections: JSON.stringify(["I don't need anything else","I've already added enough"]),
    objectionResponses: JSON.stringify(["This is about completing your protection package. Let's make sure there are no gaps.","Think of it as rounding out your investment. You're protecting $40,000+ — a small addition here closes any remaining exposure."]),
    sellingPoints: JSON.stringify(["Customizable to customer needs","Fills gaps in standard protection packages","Can be tailored per dealership"]),
    asuraCoachingTips: JSON.stringify(["Use this category for dealership-specific programs or emerging products.","Always present as part of the complete package — never as a standalone add-on.","Know your dealership's specific offerings and margins for this category."]),
    targetCustomerProfile: "Varies by product. Assess during client survey.",
    avgCloseRate: 0.25,
    avgProfit: 200.00,
    complianceNotes: "Compliance requirements vary by specific product. Ensure proper licensing for insurance products. State-specific regulations apply.",
    isActive: true,
  },
];

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  // Parse mysql2 connection from DATABASE_URL
  const conn = await createConnection(url);
  console.log("Connected to database.");

  let inserted = 0;
  let updated = 0;

  for (const item of SEED_DATA) {
    const [rows] = await conn.execute(
      "SELECT id FROM product_intelligence WHERE productType = ?",
      [item.productType]
    );
    const existing = rows[0];

    if (existing) {
      await conn.execute(
        `UPDATE product_intelligence SET
          coverageSummary=?, commonObjections=?, objectionResponses=?,
          sellingPoints=?, asuraCoachingTips=?, targetCustomerProfile=?,
          avgCloseRate=?, avgProfit=?, complianceNotes=?, isActive=?
        WHERE productType=?`,
        [
          item.coverageSummary, item.commonObjections, item.objectionResponses,
          item.sellingPoints, item.asuraCoachingTips, item.targetCustomerProfile,
          item.avgCloseRate, item.avgProfit, item.complianceNotes, item.isActive ? 1 : 0,
          item.productType
        ]
      );
      updated++;
    } else {
      await conn.execute(
        `INSERT INTO product_intelligence
          (productType, coverageSummary, commonObjections, objectionResponses,
           sellingPoints, asuraCoachingTips, targetCustomerProfile,
           avgCloseRate, avgProfit, complianceNotes, isActive)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          item.productType, item.coverageSummary, item.commonObjections, item.objectionResponses,
          item.sellingPoints, item.asuraCoachingTips, item.targetCustomerProfile,
          item.avgCloseRate, item.avgProfit, item.complianceNotes, item.isActive ? 1 : 0
        ]
      );
      inserted++;
    }
    console.log(`  ✓ ${item.productType}`);
  }

  await conn.end();
  console.log(`\nSeed complete: ${inserted} inserted, ${updated} updated.`);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
