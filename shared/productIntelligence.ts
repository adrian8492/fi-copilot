/**
 * F&I Product Intelligence Database
 * Static reference data for all 9 core F&I products with ASURA coaching intelligence.
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ProductCategory = "Protection" | "Appearance" | "Security";

export interface CostRange {
  min: number;
  max: number;
}

export interface CommissionStructure {
  flatFee: number | null;
  percentOfProfit: number | null;
  description: string;
}

export interface StateRestriction {
  state: string;
  restriction: string;
}

export interface ProductIntelligenceEntry {
  /** Machine key matching the DB enum */
  productType: string;
  /** Display name */
  displayName: string;
  /** Product category */
  category: ProductCategory;
  /** Retail cost range customers typically see */
  costRange: CostRange;
  /** Average dealer cost */
  dealerCost: number;
  /** Commission structure for F&I managers */
  commission: CommissionStructure;
  /** Common customer objections */
  commonObjections: string[];
  /** ASURA recommended talk tracks */
  asuraTalkTracks: string[];
  /** State-specific restrictions */
  stateRestrictions: StateRestriction[];
  /** Product types that upsell well together */
  upsellRelationships: string[];
  /** Keywords in transcripts that indicate this product was discussed */
  transcriptKeywords: string[];
  /** Average close rate */
  avgCloseRate: number;
  /** Average profit per sale */
  avgProfit: number;
}

export interface ProductRecommendation {
  productType: string;
  displayName: string;
  category: ProductCategory;
  /** "missed" = never mentioned, "improve" = mentioned but could be presented better */
  status: "missed" | "improve";
  reason: string;
  suggestedTalkTrack: string;
  potentialProfit: number;
  priority: number;
}

// ─── Product Database ──────────────────────────────────────────────────────────

export const PRODUCT_DATABASE: ProductIntelligenceEntry[] = [
  {
    productType: "vehicle_service_contract",
    displayName: "Vehicle Service Agreement (VSA)",
    category: "Protection",
    costRange: { min: 1200, max: 3500 },
    dealerCost: 400,
    commission: { flatFee: null, percentOfProfit: 25, description: "25% of gross profit" },
    commonObjections: [
      "I never use warranties",
      "The car is brand new, I don't need it",
      "I'll just pay out of pocket if something breaks",
      "It costs too much",
      "I can buy it later",
    ],
    asuraTalkTracks: [
      "NEVER say 'extended warranty' — say Vehicle Service Agreement or VSA.",
      "Present as PROTECTION, not a product: 'This is your mechanical breakdown protection.'",
      "Use opt-out framing: 'Most customers choose to include this — would you like to opt out?'",
      "Lead with the average repair cost: '$1,200-$3,500 average repair — let the math do the selling.'",
      "Tie to ownership timeline: 'You mentioned keeping this 5+ years — this is designed exactly for that.'",
    ],
    stateRestrictions: [
      { state: "CA", restriction: "Must provide 60-day cancellation window with full refund" },
      { state: "FL", restriction: "Service agreements must be backed by an insurance company" },
      { state: "NY", restriction: "Cannot represent as manufacturer warranty; clear exclusion disclosure required" },
    ],
    upsellRelationships: ["gap_insurance", "prepaid_maintenance"],
    transcriptKeywords: ["service contract", "vsa", "extended warranty", "warranty", "mechanical breakdown", "powertrain", "coverage", "service agreement", "protection plan"],
    avgCloseRate: 0.55,
    avgProfit: 800,
  },
  {
    productType: "gap_insurance",
    displayName: "GAP Insurance",
    category: "Protection",
    costRange: { min: 500, max: 1200 },
    dealerCost: 150,
    commission: { flatFee: null, percentOfProfit: 20, description: "20% of gross profit" },
    commonObjections: [
      "My insurance covers everything",
      "I put a big down payment so I don't need it",
      "I've never totaled a car",
      "It's too expensive",
    ],
    asuraTalkTracks: [
      "Use the depreciation curve: 'Your car loses 20% value the moment you leave the lot.'",
      "Present as Guaranteed Asset Protection — the full name sells itself.",
      "Scale rule: every $5K of customer investment → increase the ask range by $1K.",
      "For low down payments, position as nearly mandatory from a financial responsibility standpoint.",
      "Show the math: 'If totaled in year one, insurance pays market value minus your $1,000 deductible. You'd still owe $5,000-$15,000.'",
    ],
    stateRestrictions: [
      { state: "CA", restriction: "Regulated as insurance — requires insurance license to sell" },
      { state: "NY", restriction: "GAP cap: cannot charge more than the amount financed" },
      { state: "TX", restriction: "Must offer waiver addendum option, not just insurance product" },
    ],
    upsellRelationships: ["vehicle_service_contract", "theft_protection"],
    transcriptKeywords: ["gap", "gap insurance", "guaranteed asset", "totaled", "total loss", "depreciation", "upside down", "negative equity", "owe more"],
    avgCloseRate: 0.42,
    avgProfit: 450,
  },
  {
    productType: "tire_wheel",
    displayName: "Tire & Wheel Protection",
    category: "Protection",
    costRange: { min: 400, max: 1000 },
    dealerCost: 120,
    commission: { flatFee: null, percentOfProfit: 20, description: "20% of gross profit" },
    commonObjections: [
      "My tires have a warranty already",
      "I'm a careful driver",
      "I don't drive on bad roads",
      "It's not that expensive to replace a tire",
    ],
    asuraTalkTracks: [
      "Lead with the road hazard definition: 'Anything in the road that's not supposed to be there.'",
      "Personalize with local roads: 'Where do you drive most? I-5 alone has thousands of tire claims.'",
      "Curb scrape angle: 'One curb scrape on these alloys — $800.'",
      "Use opt-out frame: 'This comes standard with the protection package — would you like to remove it?'",
      "Price the alternative: 'A single tire on this vehicle runs $180-$350. A wheel? $400-$1,200.'",
    ],
    stateRestrictions: [
      { state: "CA", restriction: "Must distinguish from tire manufacturer warranty in writing" },
      { state: "FL", restriction: "Bundling restrictions apply — must itemize separately" },
    ],
    upsellRelationships: ["windshield_protection", "interior_exterior_protection", "key_replacement"],
    transcriptKeywords: ["tire", "wheel", "road hazard", "pothole", "nail", "flat", "curb", "alloy", "rim"],
    avgCloseRate: 0.48,
    avgProfit: 300,
  },
  {
    productType: "key_replacement",
    displayName: "Key Replacement",
    category: "Protection",
    costRange: { min: 200, max: 600 },
    dealerCost: 50,
    commission: { flatFee: 50, percentOfProfit: null, description: "$50 flat per sale" },
    commonObjections: [
      "I never lose my keys",
      "I can get a copy made cheap",
      "I have a spare at home",
    ],
    asuraTalkTracks: [
      "Lead with price shock: 'Do you know what it costs to replace that key fob? $300-$800 at the dealer.'",
      "Low-cost, high-value add — easy to close because the math is obvious.",
      "Great as a 'throw-in' to close a package deal.",
      "Ask: 'Have you ever lost your keys?' — most people have a story.",
    ],
    stateRestrictions: [
      { state: "NY", restriction: "Must disclose per-incident maximums and waiting periods" },
    ],
    upsellRelationships: ["tire_wheel", "vehicle_service_contract"],
    transcriptKeywords: ["key", "key fob", "keys", "fob", "smart key", "transponder", "lost key", "key replacement"],
    avgCloseRate: 0.52,
    avgProfit: 200,
  },
  {
    productType: "prepaid_maintenance",
    displayName: "Prepaid Maintenance",
    category: "Protection",
    costRange: { min: 500, max: 1500 },
    dealerCost: 200,
    commission: { flatFee: null, percentOfProfit: 15, description: "15% of gross profit" },
    commonObjections: [
      "I can get oil changes cheaper elsewhere",
      "I do my own maintenance",
      "The dealership is too far away",
      "I don't drive that much",
    ],
    asuraTalkTracks: [
      "Position as 'locking in maintenance costs at today's prices.' Inflation framing works.",
      "Tie to resale: 'Documented dealer maintenance history adds $1,500-$2,500 to resale value.'",
      "Easy add when the customer is already saying yes to other protections.",
      "Per-visit math: 'Each service visit is $89-$150. Over 3 years that's $800-$1,500. This locks it all in for less.'",
    ],
    stateRestrictions: [
      { state: "CA", restriction: "Must clearly distinguish from warranty coverage" },
      { state: "TX", restriction: "Cannot imply warranty is void without prepaid maintenance" },
    ],
    upsellRelationships: ["vehicle_service_contract", "tire_wheel"],
    transcriptKeywords: ["maintenance", "oil change", "service plan", "prepaid", "scheduled maintenance", "tire rotation", "multi-point", "maintenance plan"],
    avgCloseRate: 0.38,
    avgProfit: 350,
  },
  {
    productType: "interior_exterior_protection",
    displayName: "Interior/Exterior Sealant",
    category: "Appearance",
    costRange: { min: 400, max: 1200 },
    dealerCost: 75,
    commission: { flatFee: null, percentOfProfit: 30, description: "30% of gross profit" },
    commonObjections: [
      "I can wax it myself",
      "I'll just be careful with it",
      "It's just a coating",
    ],
    asuraTalkTracks: [
      "Position as 'appearance protection' — ties directly to resale value.",
      "Pairs naturally with tire & wheel as a full vehicle protection package.",
      "Present as already applied: 'The sealant has already been applied to protect your investment.'",
      "Resale angle: 'Vehicles with documented appearance protection sell for $1,000-$2,000 more.'",
    ],
    stateRestrictions: [
      { state: "CA", restriction: "Cannot guarantee specific resale value increases" },
      { state: "OH", restriction: "Application must be documented and verifiable" },
    ],
    upsellRelationships: ["tire_wheel", "windshield_protection"],
    transcriptKeywords: ["sealant", "paint protection", "interior protection", "exterior protection", "coating", "fabric protection", "leather", "appearance", "uv protection"],
    avgCloseRate: 0.35,
    avgProfit: 500,
  },
  {
    productType: "windshield_protection",
    displayName: "Windshield Protection",
    category: "Protection",
    costRange: { min: 300, max: 800 },
    dealerCost: 80,
    commission: { flatFee: 40, percentOfProfit: null, description: "$40 flat per sale" },
    commonObjections: [
      "My insurance covers windshields",
      "Chips are cheap to fix",
    ],
    asuraTalkTracks: [
      "Lead with ADAS: 'Your windshield has cameras that need recalibration after replacement — that alone is $500-$1,500.'",
      "Insurance comparison: 'This keeps your insurance record clean — no claim, no premium increase.'",
      "Bundle with road hazard for complete front-of-vehicle protection.",
      "Price the alternative: 'A windshield with ADAS recalibration runs $800-$2,500.'",
    ],
    stateRestrictions: [
      { state: "FL", restriction: "Florida law requires $0 deductible windshield replacement with comprehensive coverage — position product differently" },
      { state: "AZ", restriction: "Similar to FL — windshield replacement covered under comprehensive with no deductible" },
    ],
    upsellRelationships: ["tire_wheel", "interior_exterior_protection"],
    transcriptKeywords: ["windshield", "glass", "chip", "crack", "adas", "recalibration", "rock chip", "windshield replacement"],
    avgCloseRate: 0.37,
    avgProfit: 220,
  },
  {
    productType: "window_tint",
    displayName: "Window Tint",
    category: "Appearance",
    costRange: { min: 200, max: 600 },
    dealerCost: 80,
    commission: { flatFee: 30, percentOfProfit: null, description: "$30 flat per sale" },
    commonObjections: [
      "I can get it done cheaper aftermarket",
      "I don't need tint",
      "Is it even legal?",
    ],
    asuraTalkTracks: [
      "Position as UV/heat protection, not just cosmetic: 'Blocks 99% of UV rays — protects your interior and your skin.'",
      "Tie to comfort: 'Reduces interior temperature by 15-20 degrees in summer.'",
      "Warranty angle: 'Our tint comes with a lifetime warranty against bubbling and peeling.'",
      "Bundle with appearance package: sealant + tint = complete appearance protection.",
    ],
    stateRestrictions: [
      { state: "CA", restriction: "Front side windows must allow 70%+ light transmittance; no tint on windshield below AS-1 line" },
      { state: "NY", restriction: "Front side windows must allow 70%+ light; no tint on windshield" },
      { state: "TX", restriction: "Front side windows must allow 25%+ light transmittance" },
      { state: "FL", restriction: "Front side windows must allow 28%+ light; rear can be any darkness" },
    ],
    upsellRelationships: ["interior_exterior_protection"],
    transcriptKeywords: ["tint", "window tint", "tinting", "uv", "heat rejection", "ceramic tint", "film"],
    avgCloseRate: 0.40,
    avgProfit: 180,
  },
  {
    productType: "theft_protection",
    displayName: "Active Theft Protection",
    category: "Security",
    costRange: { min: 300, max: 900 },
    dealerCost: 100,
    commission: { flatFee: null, percentOfProfit: 20, description: "20% of gross profit" },
    commonObjections: [
      "I have insurance for theft",
      "I live in a safe area",
      "Cars have factory anti-theft",
    ],
    asuraTalkTracks: [
      "Position as an active theft device — not just passive protection.",
      "Insurance premium reduction can offset the cost.",
      "Bundle with GAP: 'GAP protects if it's totaled, this protects if it's stolen.'",
      "Lead with local theft statistics if available.",
      "VIN etching angle: 'Makes your car harder to resell on the black market.'",
    ],
    stateRestrictions: [
      { state: "CA", restriction: "Must disclose tracking device capabilities and privacy implications" },
      { state: "NY", restriction: "Cannot imply insurance premium reduction without insurer confirmation" },
    ],
    upsellRelationships: ["gap_insurance", "vehicle_service_contract"],
    transcriptKeywords: ["theft", "stolen", "anti-theft", "vin etch", "vin etching", "lojack", "gps tracking", "recovery", "theft protection", "security"],
    avgCloseRate: 0.30,
    avgProfit: 350,
  },
];

/** Look up a product by its productType key */
export function getProductByType(productType: string): ProductIntelligenceEntry | undefined {
  return PRODUCT_DATABASE.find((p) => p.productType === productType);
}

/** Get all products in a specific category */
export function getProductsByCategory(category: ProductCategory): ProductIntelligenceEntry[] {
  return PRODUCT_DATABASE.filter((p) => p.category === category);
}

/** Get the display name for a product type */
export function getProductDisplayName(productType: string): string {
  return getProductByType(productType)?.displayName ?? productType;
}
