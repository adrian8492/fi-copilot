# Henry — Nightly Build Task

## A3 — F&I Product Intelligence Database — COMPLETE

### What Was Built
Comprehensive F&I product intelligence database with recommendation engine and session detail UI tab.

### Deliverables
1. **shared/productIntelligence.ts** — Typed product database with all 9 F&I products (VSA, GAP, Tire & Wheel, Key Replacement, Maintenance, Sealant, Windshield, Window Tint, Active Theft). Each product includes: category, cost ranges, dealer cost, commission structure, common objections, ASURA talk tracks, state restrictions, upsell relationships, transcript keywords.

2. **Schema + Migration** — Added 8 new columns to `product_intelligence` table (category, displayName, costRangeMin, costRangeMax, dealerCost, commissionStructure, stateRestrictions, upsellRelationships). Migration: `drizzle/0019_product_intelligence_fields.sql`.

3. **Product Recommendation Engine** — `server/product-recommendation.ts` analyzes session transcripts to detect mentioned products, assess presentation quality (scoring: product mention, benefits, pricing, objection handling, ASURA opt-out framing), and generate prioritized recommendations for missed or improvable products with potential revenue calculations.

4. **tRPC Endpoints** — Two new endpoints on `productIntelligence` router:
   - `catalog` — Returns full static product database
   - `recommend` — Takes sessionId, analyzes transcript, returns recommendations + missed revenue

5. **Product Intelligence Tab** — `client/src/components/ProductIntelligenceTab.tsx` added to session detail page alongside ASURA Scorecard and Compliance tabs. Shows: missed products count, improvement opportunities, potential revenue, expandable product cards with talk tracks/objections/state restrictions, full catalog browser.

6. **Tests** — 21 new tests in `server/product-recommendation.test.ts` covering product database integrity, recommendation engine detection, presentation quality scoring, and revenue calculations. All passing.

### Test Results
- 188 tests passing (21 new + 167 existing)
- 2 pre-existing failures (DEEPGRAM_API_KEY env, stage-detector edge case) — not caused by this build
- TypeScript: only pre-existing bcryptjs type error — no new TS errors
