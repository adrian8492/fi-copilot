/**
 * Seed script: F&I Product Intelligence Database
 * Run: npx tsx scripts/seed-product-intelligence.ts
 *
 * Populates all 12 F&I product types with ASURA OPS coaching data.
 */

const SEED_DATA = [
  {
    productType: "vehicle_service_contract",
    coverageSummary: "Covers mechanical breakdown and electrical failure after the manufacturer warranty expires. Includes powertrain, drivetrain, AC, electrical systems. NOT an extended warranty — it's a Vehicle Service Agreement (VSA).",
    commonObjections: JSON.stringify([
      "I never use warranties",
      "The car is brand new, I don't need it",
      "I'll just pay out of pocket if something breaks",
      "It costs too much",
      "I can buy it later"
    ]),
    objectionResponses: JSON.stringify([
      "That's exactly the point — you haven't needed one yet. But the average repair on a modern vehicle is $1,200-$3,500. One transmission issue and you've paid for the agreement three times over.",
      "The manufacturer warranty covers you for 3 years or 36,000 miles — most people keep their vehicle 5-7 years. This picks up right where the factory leaves off.",
      "Most customers who say that haven't priced a timing chain replacement. We're talking $2,800-$4,500 at the dealer. This locks in your cost today.",
      "Break it down per month — it's typically $35-60/month folded into the payment. That's less than one oil change.",
      "You actually can't. Once you drive off the lot, the cost goes up significantly because underwriting changes. Today's price is the best you'll see."
    ]),
    sellingPoints: JSON.stringify([
      "Transferable to the next owner — increases resale value",
      "Zero or low deductible options",
      "Covers rental car while yours is in the shop",
      "Nationwide coverage at any licensed repair facility",
      "Locks in today's repair costs against future inflation"
    ]),
    asuraCoachingTips: JSON.stringify([
      "NEVER say 'extended warranty' — say Vehicle Service Agreement or VSA. Customers associate 'warranty' with gotchas and robocalls.",
      "Present as a PROTECTION, not a product. 'This is your mechanical breakdown protection.'",
      "Use opt-out framing: 'Most customers choose to include this — would you like to opt out of the mechanical protection?'",
      "Tie back to client survey: 'You mentioned you plan to keep this vehicle 5+ years — this is designed exactly for that.'",
      "Lead with the average repair cost stat: '$1,200-$3,500 average repair' — let the math do the selling."
    ]),
    targetCustomerProfile: "Customers financing 60+ months, keeping vehicle beyond factory warranty, families with high mileage, anyone buying used/CPO.",
    avgCloseRate: 0.55,
    avgProfit: 800.00,
    complianceNotes: "Cannot represent as manufacturer warranty. Must disclose all exclusions. Cannot say 'best rate' — say 'best terms and conditions'. State-specific cancellation rights apply.",
  },
  {
    productType: "gap_insurance",
    coverageSummary: "Covers the difference between what insurance pays (actual cash value) and what the customer still owes on the loan if the vehicle is totaled or stolen. Eliminates the customer's out-of-pocket gap.",
    commonObjections: JSON.stringify([
      "My insurance covers everything",
      "I put a big down payment so I don't need it",
      "I've never totaled a car",
      "It's too expensive"
    ]),
    objectionResponses: JSON.stringify([
      "Your insurance covers the current market value of the vehicle — not what you owe. The moment you drive off the lot, the car depreciates 20-30%. If it's totaled in the first 2 years, you could owe $5,000-$15,000 more than insurance pays.",
      "That's great — and GAP protects that investment. Even with a down payment, depreciation in the first 18 months can still leave a gap.",
      "Nobody plans to total a car. But 6 million accidents happen every year. This is about protecting your financial position if it happens.",
      "It's typically $20-35/month in the payment. Compare that to writing a $10,000 check to a lender for a car you don't even have anymore."
    ]),
    sellingPoints: JSON.stringify([
      "Covers up to $50,000+ gap depending on the plan",
      "Includes your insurance deductible (up to $1,000 in most plans)",
      "One-time cost built into the payment — no monthly insurance premium",
      "Peace of mind from day one"
    ]),
    asuraCoachingTips: JSON.stringify([
      "Use the client survey cash investment question to gauge exposure: 'If the lender required an additional $1,000-$2,000 cash investment...'",
      "Scale rule: every $5K of customer investment → increase the ask range by $1K",
      "Show the depreciation curve — visual is powerful. 'Your car loses 20% value the moment you leave.'",
      "Present as Guaranteed Asset Protection — the full name sells itself.",
      "For customers with small down payments, this is nearly mandatory from a financial responsibility standpoint."
    ]),
    targetCustomerProfile: "Financed customers with low down payments, long loan terms (72-84 months), negative equity trades, high LTV ratios.",
    avgCloseRate: 0.42,
    avgProfit: 450.00,
    complianceNotes: "Some states regulate GAP as insurance (requires insurance license). Must disclose it's not required for financing. Cannot bundle without disclosure. State-specific pricing caps may apply.",
  },
  {
    productType: "prepaid_maintenance",
    coverageSummary: "Covers scheduled manufacturer-recommended maintenance visits: oil changes, tire rotations, multi-point inspections, fluid top-offs, filter replacements. Locks in today's service prices.",
    commonObjections: JSON.stringify([
      "I can get oil changes cheaper elsewhere",
      "I do my own maintenance",
      "The dealership is too far away",
      "I don't drive that much"
    ]),
    objectionResponses: JSON.stringify([
      "This covers more than oil changes — tire rotations, filters, fluids, multi-point inspections. And it locks in today's prices. Service costs go up 3-5% every year.",
      "That's great for basic stuff. But modern vehicles have specific service requirements that affect your warranty. This ensures it's done right and documented.",
      "Most plans are accepted at any participating dealer nationwide, not just the selling dealer.",
      "Even low-mileage vehicles need time-based maintenance. Oil breaks down over time, not just miles."
    ]),
    sellingPoints: JSON.stringify([
      "Locks in today's service prices against inflation",
      "Maintains factory warranty compliance",
      "Documented service history increases resale value",
      "Convenient — just show up, no out-of-pocket cost",
      "Covers 2-5 years of scheduled maintenance"
    ]),
    asuraCoachingTips: JSON.stringify([
      "Position as 'locking in your maintenance costs at today's prices.' Inflation framing works.",
      "Tie to resale: 'Documented dealer maintenance history adds $1,500-$2,500 to resale value.'",
      "This is an easy add when the customer is already saying yes to other protections.",
      "Present the per-visit math: 'Each service visit runs $89-$150. Over 3 years that's $800-$1,500. This locks it all in for less.'"
    ]),
    targetCustomerProfile: "New car buyers, lease customers, anyone who values convenience and documented service history.",
    avgCloseRate: 0.38,
    avgProfit: 350.00,
    complianceNotes: "Must clearly distinguish from warranty coverage. Cannot imply warranty is void without it. Cancellation terms must be disclosed.",
  },
  {
    productType: "tire_wheel",
    coverageSummary: "Covers tire and wheel damage from road hazards — anything in the road that's not supposed to be there. Potholes, nails, glass, debris, curb damage. Includes repair or replacement.",
    commonObjections: JSON.stringify([
      "My tires have a warranty already",
      "I'm a careful driver",
      "I don't drive on bad roads",
      "It's not that expensive to replace a tire"
    ]),
    objectionResponses: JSON.stringify([
      "Tire manufacturer warranties cover defects — not road hazard damage. A nail in your tire isn't a defect. This covers what the manufacturer won't.",
      "It's not about how you drive — it's about what's in the road. You can't avoid a nail you don't see.",
      "Where do you do most of your driving? [Personalize with local roads.] I-5 alone accounts for thousands of tire claims a year in this area.",
      "A single tire on this vehicle runs $180-$350. A wheel? $400-$1,200 for an alloy. One curb scrape and you've paid for the coverage."
    ]),
    sellingPoints: JSON.stringify([
      "Covers all 4 tires and wheels",
      "Road hazard = anything in the road that's not supposed to be there",
      "Includes curb scrape damage — protects appearance and resale",
      "No deductible on most plans",
      "Covers mounting, balancing, and valve stems"
    ]),
    asuraCoachingTips: JSON.stringify([
      "Lead with the road hazard definition: 'Anything in the road that's not supposed to be there.'",
      "Ask where they drive most — personalize with local road references.",
      "Curb scrape tie-in: appearance + resale value. 'One curb scrape on these alloys and you're looking at $800.'",
      "This is one of the easiest products to close because the value is tangible and immediate.",
      "Use the opt-out frame: 'This comes standard with the protection package — would you like to remove it?'"
    ]),
    targetCustomerProfile: "Everyone — especially customers with alloy wheels, low-profile tires, SUVs, trucks. Urban drivers with pothole exposure.",
    avgCloseRate: 0.48,
    avgProfit: 300.00,
    complianceNotes: "Must distinguish from tire manufacturer warranty. Cannot guarantee specific tire brands for replacement. State regulations vary on bundling.",
  },
  {
    productType: "key_replacement",
    coverageSummary: "Covers the cost of replacing modern key fobs, smart keys, and transponder keys if lost, stolen, or damaged. Includes programming and cutting.",
    commonObjections: JSON.stringify([
      "I never lose my keys",
      "I can get a copy made cheap",
      "I have a spare at home"
    ]),
    objectionResponses: JSON.stringify([
      "Nobody plans to lose their keys. But modern key fobs cost $300-$800 to replace — and that's before programming. It's one of the most common claims we see.",
      "Not with modern keys. These aren't $5 copies at the hardware store. They have to be programmed to the vehicle's computer. Dealer cost is $300-$800.",
      "That spare is great — until you lose both. Then you're towing the car to the dealer and paying $800+ because they have to reprogram from scratch."
    ]),
    sellingPoints: JSON.stringify([
      "Modern key fobs cost $300-$800 to replace at the dealer",
      "Covers lost, stolen, and damaged keys",
      "Includes programming and cutting costs",
      "Covers lockout assistance",
      "One of the most commonly used protections"
    ]),
    asuraCoachingTips: JSON.stringify([
      "Lead with the price shock: 'Do you know what it costs to replace that key fob? $300-$800 at the dealer.'",
      "This is a low-cost, high-value add. Easy to close because the math is obvious.",
      "Great as a 'throw-in' to close a package deal.",
      "Ask: 'Have you ever lost your keys?' — most people have a story."
    ]),
    targetCustomerProfile: "All customers — especially those with luxury vehicles where key fobs cost $500+. Families with teenagers.",
    avgCloseRate: 0.52,
    avgProfit: 200.00,
    complianceNotes: "Must disclose coverage limits and any per-incident maximums. Some plans have waiting periods.",
  },
  {
    productType: "interior_exterior_protection",
    coverageSummary: "Environmental protection sealant for paint, fabric, leather, and carpet. Guards against UV damage, bird droppings, tree sap, acid rain, stains, and fading.",
    commonObjections: JSON.stringify([
      "I can wax it myself",
      "I'll just be careful with it",
      "It's just a coating"
    ]),
    objectionResponses: JSON.stringify([
      "This isn't wax — it's a molecular sealant that bonds to the paint and interior surfaces. It protects against UV, acid rain, bird droppings, and environmental damage that wax can't handle.",
      "Life happens. Coffee spills, kids, pets, parking lot door dings, tree sap. This covers the repair or replacement of affected surfaces.",
      "It's a protection system with a warranty behind it. If the paint fades, if the leather cracks, if the carpet stains — it gets fixed or replaced."
    ]),
    sellingPoints: JSON.stringify([
      "Protects paint finish and interior surfaces",
      "Backed by a repair/replacement warranty",
      "Maintains showroom appearance and resale value",
      "Applied by trained technicians",
      "Covers UV damage, stains, fading, environmental damage"
    ]),
    asuraCoachingTips: JSON.stringify([
      "Position as 'appearance protection' — ties directly to resale value.",
      "This pairs naturally with tire & wheel as a full vehicle protection package.",
      "Present as already included: 'The sealant has already been applied to protect your investment.'",
      "Use the resale angle: 'Vehicles with documented appearance protection sell for $1,000-$2,000 more.'"
    ]),
    targetCustomerProfile: "New car buyers, lease customers (protects against lease-end charges), anyone who cares about vehicle appearance.",
    avgCloseRate: 0.35,
    avgProfit: 500.00,
    complianceNotes: "Must disclose what is and isn't covered. Cannot guarantee specific resale value increases. Application must be documented.",
  },
  {
    productType: "road_hazard",
    coverageSummary: "Comprehensive road hazard protection covering damage from debris, potholes, and objects in the roadway. May include dent repair, windshield chips, and cosmetic damage beyond tire/wheel.",
    commonObjections: JSON.stringify([
      "My insurance covers that",
      "I don't drive on rough roads"
    ]),
    objectionResponses: JSON.stringify([
      "Insurance covers collision and comprehensive — but your deductible is typically $500-$1,000. This covers road hazard damage with zero deductible and no claim on your insurance record.",
      "Road hazards are everywhere — highways, parking lots, construction zones. One rock chip or pothole hit and the coverage pays for itself."
    ]),
    sellingPoints: JSON.stringify([
      "Zero deductible coverage",
      "No insurance claim required",
      "Covers dents, dings, chips from road debris",
      "Keeps insurance premiums clean"
    ]),
    asuraCoachingTips: JSON.stringify([
      "Bundle with tire & wheel for a complete road protection package.",
      "Emphasize the insurance deductible comparison: '$0 deductible vs $500-$1,000 on your insurance.'",
      "Present as the road protection layer of the overall package."
    ]),
    targetCustomerProfile: "Highway commuters, truck owners, anyone in construction or rural areas.",
    avgCloseRate: 0.40,
    avgProfit: 280.00,
    complianceNotes: "Must clearly define what constitutes a covered road hazard. Cannot overlap with existing insurance claims process without disclosure.",
  },
  {
    productType: "paintless_dent_repair",
    coverageSummary: "Covers repair of minor dents and dings using paintless dent repair (PDR) techniques. No repainting needed — preserves factory finish and vehicle value.",
    commonObjections: JSON.stringify([
      "I'll just live with small dents",
      "I can get that done cheap"
    ]),
    objectionResponses: JSON.stringify([
      "Small dents cost you at trade-in. Dealers deduct $200-$500 per panel for cosmetic damage. This keeps your vehicle looking new.",
      "Quality PDR runs $150-$300 per dent. Two parking lot dings and the coverage has paid for itself."
    ]),
    sellingPoints: JSON.stringify([
      "Preserves factory paint finish",
      "Maintains vehicle value for trade-in or resale",
      "Convenient mobile or in-shop service",
      "Unlimited repairs during coverage period (most plans)"
    ]),
    asuraCoachingTips: JSON.stringify([
      "Pair with appearance protection as part of a 'keep it looking new' package.",
      "Ask about parking: 'Where do you park at work? Parking lots are the #1 source of door dings.'",
      "Position as a resale value protector."
    ]),
    targetCustomerProfile: "New car buyers, anyone who parks in public lots, lease customers avoiding end-of-lease charges.",
    avgCloseRate: 0.33,
    avgProfit: 250.00,
    complianceNotes: "Must disclose size limitations on covered dents. Typically excludes hail damage and creased dents.",
  },
  {
    productType: "windshield_protection",
    coverageSummary: "Covers repair or replacement of windshield damage from chips, cracks, and impacts. Includes ADAS recalibration for vehicles with advanced driver-assistance systems.",
    commonObjections: JSON.stringify([
      "My insurance covers windshields",
      "Chips are cheap to fix"
    ]),
    objectionResponses: JSON.stringify([
      "Insurance may cover it — but it goes on your record and could affect premiums. Plus, modern vehicles require ADAS camera recalibration after replacement — that's $500-$1,500 on top of the glass.",
      "Chips are cheap. Replacement is not. A windshield with ADAS recalibration runs $800-$2,500. One rock on the highway and you're there."
    ]),
    sellingPoints: JSON.stringify([
      "Covers ADAS recalibration (modern vehicles require this)",
      "No insurance claim — keeps your record clean",
      "Covers chips, cracks, and full replacement",
      "OEM or equivalent glass"
    ]),
    asuraCoachingTips: JSON.stringify([
      "Lead with ADAS: 'Did you know your windshield has cameras that need recalibration after replacement? That alone is $500-$1,500.'",
      "This is becoming more important every year as more vehicles have ADAS systems.",
      "Bundle with road hazard for complete front-of-vehicle protection."
    ]),
    targetCustomerProfile: "Any vehicle with ADAS (most 2020+), highway commuters, customers in areas with construction or gravel roads.",
    avgCloseRate: 0.37,
    avgProfit: 220.00,
    complianceNotes: "Must disclose ADAS recalibration coverage specifics. Some plans exclude certain damage types. State glass coverage laws vary.",
  },
  {
    productType: "lease_wear_tear",
    coverageSummary: "Covers excess wear and tear charges at lease end — interior damage, exterior damage, excess mileage penalties, and disposition fees that the lessee would otherwise pay out of pocket.",
    commonObjections: JSON.stringify([
      "I take good care of my cars",
      "I'll buy it at lease end anyway",
      "The charges can't be that bad"
    ]),
    objectionResponses: JSON.stringify([
      "Even careful drivers get charged. A small stain, a door ding, a curb scrape on a wheel — lease companies charge retail rates. Average lease-end charges are $1,500-$3,000.",
      "Plans change. If rates drop or you want something different, you want the flexibility to turn it in clean.",
      "Lease companies charge $300-$500 per wheel for curb damage, $200-$400 per interior stain, $500+ per body panel. It adds up fast."
    ]),
    sellingPoints: JSON.stringify([
      "Covers interior and exterior wear beyond normal",
      "Covers excess mileage charges (up to plan limits)",
      "Eliminates lease-end surprises",
      "Average customer saves $1,500-$3,000"
    ]),
    asuraCoachingTips: JSON.stringify([
      "Every lease customer needs this conversation. Period.",
      "Ask: 'Do you plan to turn this in or buy it at the end?' — either way, position the protection.",
      "Show the typical lease-end charge sheet — the numbers do the selling.",
      "Frame as 'insurance against surprises at turn-in.'"
    ]),
    targetCustomerProfile: "All lease customers — especially those with families, pets, or long commutes.",
    avgCloseRate: 0.45,
    avgProfit: 400.00,
    complianceNotes: "Must align with specific leasing company definitions of excess wear. Cannot guarantee elimination of all charges. Coverage limits must be disclosed.",
  },
  {
    productType: "theft_protection",
    coverageSummary: "Anti-theft system including VIN etching, GPS tracking device, and/or recovery services. Provides a benefit if the vehicle is stolen and not recovered.",
    commonObjections: JSON.stringify([
      "I have insurance for theft",
      "I live in a safe area",
      "Cars have factory anti-theft"
    ]),
    objectionResponses: JSON.stringify([
      "Insurance covers the value — minus your deductible, minus depreciation. This fills the gaps and helps recovery. Plus, many plans offer a benefit on top of insurance.",
      "Vehicle theft happens everywhere — parking lots, driveways, shopping centers. It's a crime of opportunity, not just location.",
      "Factory systems deter. Active tracking recovers. VIN etching makes it harder to resell parts. These layers work together."
    ]),
    sellingPoints: JSON.stringify([
      "VIN etching deters theft (parts can be traced)",
      "GPS tracking improves recovery rates",
      "Benefit payment if vehicle is not recovered",
      "May reduce insurance premiums"
    ]),
    asuraCoachingTips: JSON.stringify([
      "Position as an active theft device — not just passive protection.",
      "The insurance premium reduction angle can offset the cost.",
      "Bundle as part of the GAP conversation: 'GAP protects if it's totaled, this protects if it's stolen.'",
      "Lead with local theft statistics if available."
    ]),
    targetCustomerProfile: "Owners of high-theft vehicles (trucks, SUVs), customers without garages, urban areas with higher theft rates.",
    avgCloseRate: 0.30,
    avgProfit: 350.00,
    complianceNotes: "Must disclose what the 'benefit' entails vs insurance payout. Cannot guarantee recovery. State regulations on tracking devices may apply.",
  },
  {
    productType: "other",
    coverageSummary: "Additional F&I products and protections not covered by standard categories. May include LoJack, credit life/disability insurance, identity theft protection, or dealer-specific programs.",
    commonObjections: JSON.stringify([
      "I don't need anything else",
      "I've already added enough"
    ]),
    objectionResponses: JSON.stringify([
      "This is about completing your protection package. Let's make sure there are no gaps.",
      "Think of it as rounding out your investment. You're protecting $40,000+ — a small addition here closes any remaining exposure."
    ]),
    sellingPoints: JSON.stringify([
      "Customizable to customer needs",
      "Fills gaps in standard protection packages",
      "Can be tailored per dealership"
    ]),
    asuraCoachingTips: JSON.stringify([
      "Use this category for dealership-specific programs or emerging products.",
      "Always present as part of the complete package — never as a standalone add-on.",
      "Know your dealership's specific offerings and margins for this category."
    ]),
    targetCustomerProfile: "Varies by product. Assess during client survey.",
    avgCloseRate: 0.25,
    avgProfit: 200.00,
    complianceNotes: "Compliance requirements vary by specific product. Ensure proper licensing for insurance products. State-specific regulations apply.",
  }
];

// This data is designed to be inserted via the productIntelligence.upsert tRPC procedure
// or directly via the upsertProductIntelligence DB function.
console.log("F&I Product Intelligence seed data ready.");
console.log(`${SEED_DATA.length} product types defined.`);
console.log("Import this data and call upsertProductIntelligence() for each record.");

export { SEED_DATA };
