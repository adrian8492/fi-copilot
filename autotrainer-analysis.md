# Auto Trainer AI — Grading System Deconstruction

## 1. Eagle Eye View (Manager Leaderboard)
**URL pattern:** /eagleEye?dateRangeFilter=...
**View selector dropdown options:**
- PVR and Recording (default)
- Score
- Recording Length
- Deal Count
- Utilization
- Customer Survey Score Count

**Leaderboard table columns:**
- Names (grouped by dealership/demo group)
- Score (color-coded badge: green ~86%, yellow ~74%, red ~58%)
- Recording Length (avg minutes per session)
- Deal Count (number of deals)
- Utilization % (product utilization rate)
- PVR $ (Per Vehicle Retailed dollar amount)
- Product Sales % 
- Open button (drill into individual manager)

**Score color coding:**
- Green: 80%+ 
- Yellow: 65-79%
- Red: below 65%

**Dual chart view:**
- Left chart: "Average Score vs Time (Month) for Autotrainer Data Demo" — group aggregate line chart
- Right chart: "Average Score vs Time (Week) for Each Manager" — individual lines per manager, color-coded

## 2. Objection Analysis — by Product
**View:** Objection Analysis - Product
**Bar chart:** Horizontal bars showing objection frequency by product type
**Products tracked:**
- Vehicle Service Contract (VSC)
- GAP Insurance
- Prepaid Maintenance
- Interior & Exterior Protection
- Road Hazard Protection
- Key Replacement
- Windshield Protection
- Lease Wear & Tear Protection

**Table columns:**
- Names
- Deals with Scores Count
- Vehicle Service Contract (count)
- GAP Insurance (count)
- Road Hazard Protection (count)
- [other product columns]

## 3. Objection Analysis — by Product Concern
**View:** Objection Analysis - Product Concern
**Bar chart:** Frequency of specific objection types
**Objection categories tracked:**
- Cost
- Confidence in Current Coverage
- Low Usage Expectation
- Skepticism About Dealer Motives
- Misunderstanding or Lack of Information
- DIY or Self-Insurance Preference
- Perception of Low Risk
- Combine About Exclusions or Limited Coverage
- Financial Constraints

**Table columns:**
- Names
- Deals with Scores Count
- Cost (count)
- Confidence in Current Coverage (count)
- Low Usage Expectation (count)
- [other objection columns]

## 4. Live Deal Assistant (Per-Deal View)
**URL pattern:** /deal/{dealId}?dealershipId=...
**Header info:**
- Customer name (e.g., "bob jones")
- Deal No. (e.g., 123456)
- Vehicle (N/A for demo)
- Car Type (New)
- Deal Type (Retail Finance)
- Buttons: Reprocess Deal, Edit Deal

**Left panel — Live Deal Assistant checklist (3 sections):**

### Section 1: Introduction
- F&I Manager Greeting
- Stated Responsibility to Complete Title Work
- Stated Responsibility to Review Factory Warranty
- Stated Responsibility to Review Financial Options
- Stated Time Frame
- Introduction to First Forms

### Section 2: General Compliance
- Privacy Policy Mentioned
- Risk Based Pricing Mentioned
- Disclosed Base Payment

### Section 3: Menu Presentation
- Prepaid Maintenance
- Vehicle Service Contract
- GAP
- Interior/Exterior Protection
- Road Hazard
- Paintless Dent Repair
- Customer Questions Addressed
- 'Which' Closing Question Asked

**Right panel — Customer Insights:**
- Consumer Connect button
- Customer Summary button
- "No insights available" placeholder

**Bottom:** Sales Transcript section

**Start Recording button** (blue, microphone icon)

## 5. Individual Coaching Report (Google Slides format)
**Title:** "Individual Overview: F&I Manager 2"
**Header stats:** 
- Analyzed Data: 48 Deals
- Median Product PVR: $574
- Median PPD: 1.5
- 53% Utilization (highlighted in orange/warning color)

**Coaching Summary:** One-sentence behavioral insight
(e.g., "Slow down after the first 'no' and build one more option.")

**Performance Insights section:**
- Very large swing on objection outcomes
- When worked: $3,400+ PVR
- When not: $0

**What to do more often:**
- Ask two questions before explaining
- Always show a second option
- Clearly explain how our coverage is different

**Key Insight:**
- Second options turn dead deals into real deals

**Opportunity Deal panel (right side):**
- Specific opportunity identified
- Sample phrasing (exact script suggestion)
- Why this fits the data (data-backed rationale)

## 6. Navigation Structure
Left sidebar:
- Overview
- Deals
- Analytics
- Eagle Eye View
- Training
- Reports

## 7. Key Metrics Tracked
- Score (0-100%, color-coded)
- PVR (Per Vehicle Retailed $)
- PPD (Products Per Deal)
- Utilization % (% of deals where products were presented)
- Recording Length (minutes)
- Deal Count
- Product Sales %
- Customer Survey Score
- Objection frequency by product
- Objection frequency by concern type

## 8. Grading Architecture (Deconstructed)
The score appears to be a weighted composite of:
1. **Process Compliance** (checklist completion): Introduction steps + General Compliance items
2. **Menu Presentation** (product coverage): How many F&I products were presented
3. **Objection Handling**: Whether objections were addressed and how
4. **Closing Technique**: Whether the 'Which' closing question was used
5. **Recording Length**: Correlated with thoroughness

Score formula hypothesis:
- Introduction checklist: ~20% weight (6 items)
- General Compliance: ~15% weight (3 items — legally critical)
- Menu Presentation: ~40% weight (8 product items)
- Closing technique: ~15% weight
- Customer engagement: ~10% weight

Color thresholds: Green ≥80%, Yellow 65-79%, Red <65%
