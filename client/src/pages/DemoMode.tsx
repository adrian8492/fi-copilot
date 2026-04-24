import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play, Pause, RotateCcw, Mic, MicOff, AlertTriangle,
  CheckCircle2, Circle, Zap, Shield, TrendingUp,
  ChevronRight, Star, Award, Copy, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";

// ─── Deal Stage Labels ────────────────────────────────────────────────────────
const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  introduction:       { label: "Professional Hello",      color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  client_survey:      { label: "Client Survey",           color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  review_figures:     { label: "Review Figures",          color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  menu_intro:         { label: "Menu Introduction",       color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  financial_snapshot: { label: "Financial Snapshot",      color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  menu_presentation:  { label: "Menu Presentation",       color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  product_walkthrough:{ label: "Product Walkthrough",     color: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
  objection_handling: { label: "Objection Handling",      color: "bg-red-500/20 text-red-400 border-red-500/30" },
  closing:            { label: "Closing",                 color: "bg-emerald-600/20 text-emerald-300 border-emerald-600/30" },
};

// ─── Demo Transcript ──────────────────────────────────────────────────────────
// Full ASURA 7-Step Process:
//   Step 1: Professional Hello / Introduction (0–25s)
//   Step 2: Client Survey (25–75s)
//   Step 3: Review Figures / Balance Due (75–130s)
//   Step 4: Introduction / Transition to Menu (130–175s)
//   Step 5: Financial Snapshot — 3 Questions (175–235s)
//   Step 6: Product Walkthrough + Objection Handling (235–390s)
//   Step 7: Closing (390–420s)
const DEMO_TRANSCRIPT: Array<{
  delay: number;
  speaker: "manager" | "customer";
  text: string;
  isFinal: boolean;
  stage?: string;
}> = [
  // ── STEP 1: PROFESSIONAL HELLO ─────────────────────────────────────────────
  { delay: 1000,  stage: "introduction",   speaker: "manager",  text: "Marcus, come on in — I'm Adrian, I'm the Finance Director here at Premier Chevrolet. Congratulations on the new Tahoe, that is a great choice for your family.", isFinal: true },
  { delay: 8000,  stage: "introduction",   speaker: "customer", text: "Thank you! Yeah, we're really excited. It's been a long time coming.", isFinal: true },
  { delay: 12000, stage: "introduction",   speaker: "manager",  text: "I love hearing that. So my job today is to make sure your paperwork is accurate, your financing is locked in at the rate you were approved for, and that you leave here fully protected. This should take about 20 to 25 minutes. Sound good?", isFinal: true },
  { delay: 20000, stage: "introduction",   speaker: "customer", text: "Sounds good, yeah.", isFinal: true },

  // ── STEP 2: CLIENT SURVEY ──────────────────────────────────────────────────
  { delay: 25000, stage: "client_survey",  speaker: "manager",  text: "Perfect. Before I pull up your paperwork, I want to take about two minutes to ask you a few questions — it's what we call the Client Survey. These answers help me customize everything for you today rather than just going through a generic presentation. Fair enough?", isFinal: true },
  { delay: 34000, stage: "client_survey",  speaker: "customer", text: "Sure, absolutely.", isFinal: true },
  { delay: 37000, stage: "client_survey",  speaker: "manager",  text: "Great. First question — what's the primary use for this vehicle? Is this a family vehicle, a work truck, or a mix of both?", isFinal: true },
  { delay: 44000, stage: "client_survey",  speaker: "customer", text: "Mostly family — school runs, weekend trips, that kind of thing. My wife drives it most of the time.", isFinal: true },
  { delay: 50000, stage: "client_survey",  speaker: "manager",  text: "Perfect. And do you have a trade-in on this deal, or are you coming in clean?", isFinal: true },
  { delay: 55000, stage: "client_survey",  speaker: "customer", text: "We traded in our old Traverse. They gave us $4,200 for it.", isFinal: true },
  { delay: 60000, stage: "client_survey",  speaker: "manager",  text: "Good. And do you currently have any protection products on your existing vehicles — like an extended warranty or GAP coverage — or is this your first time going through this process?", isFinal: true },
  { delay: 70000, stage: "client_survey",  speaker: "customer", text: "We've never really done any of that before. This is kind of new territory for us.", isFinal: true },

  // ── STEP 3: REVIEW FIGURES / BALANCE DUE ──────────────────────────────────
  { delay: 78000, stage: "review_figures", speaker: "manager",  text: "Okay, that's really helpful — thank you. Now let me pull up your deal and walk you through the numbers so we're all on the same page before we get into anything else.", isFinal: true },
  { delay: 87000, stage: "review_figures", speaker: "manager",  text: "So your vehicle purchase price is $58,000. You put $3,000 down, and your trade came in at $4,200 — so that's $7,200 working in your favor right out of the gate.", isFinal: true },
  { delay: 97000, stage: "review_figures", speaker: "customer", text: "Okay, that makes sense.", isFinal: true },
  { delay: 100000, stage: "review_figures", speaker: "manager", text: "After your down payment and trade equity, your balance due — the amount we're financing — is $50,800. That's what we're working with. Your base monthly payment on that, before any protection products, is $687 a month at 6.9% for 72 months.", isFinal: true },
  { delay: 112000, stage: "review_figures", speaker: "customer", text: "Okay. And that's just for the vehicle itself?", isFinal: true },
  { delay: 116000, stage: "review_figures", speaker: "manager", text: "Exactly — that's the vehicle only, no add-ons. I want you to see that number clearly before we talk about anything else. Does $687 match what you were expecting?", isFinal: true },
  { delay: 124000, stage: "review_figures", speaker: "customer", text: "Yeah, that's pretty close to what the sales guy told us.", isFinal: true },
  { delay: 128000, stage: "review_figures", speaker: "manager", text: "Perfect. So we're aligned on the base. Now — and this is the part that matters most — I want to show you what's available to protect that $50,800 investment, because that's a significant commitment.", isFinal: true },

  // ── STEP 4: INTRODUCTION / TRANSITION TO MENU ─────────────────────────────
  { delay: 138000, stage: "menu_intro",    speaker: "manager",  text: "Before I show you any numbers, I want to take 60 seconds to explain what each product actually does — because the value is in understanding what you're getting, not just what it costs. Is that fair?", isFinal: true },
  { delay: 146000, stage: "menu_intro",    speaker: "customer", text: "Yeah, of course.", isFinal: true },
  { delay: 149000, stage: "menu_intro",    speaker: "manager",  text: "What I'm going to show you are three levels of protection. Most of our customers choose the middle option — but I want you to see all three so you can decide what makes the most sense for your family. The dealership has already approved your financing — the next step is simply reviewing the options available to protect your vehicle and your investment.", isFinal: true },
  { delay: 161000, stage: "menu_intro",    speaker: "customer", text: "Okay, that sounds reasonable.", isFinal: true },
  { delay: 164000, stage: "menu_intro",    speaker: "manager",  text: "Good. Now, you mentioned this is your first time going through this process — so I'm going to walk you through each product one at a time, explain exactly what it covers, and then we'll look at the numbers together. Sound good?", isFinal: true },
  { delay: 173000, stage: "menu_intro",    speaker: "customer", text: "Sounds good.", isFinal: true },

  // ── STEP 5: FINANCIAL SNAPSHOT — 3 QUESTIONS ──────────────────────────────
  { delay: 178000, stage: "financial_snapshot", speaker: "manager",  text: "Great. So I have three quick questions that will help me customize exactly which products to prioritize for you. First — how long do you typically keep your vehicles? Are you a two-to-three year person, or do you tend to hold onto them longer?", isFinal: true },
  { delay: 188000, stage: "financial_snapshot", speaker: "customer", text: "We usually keep them about five, maybe six years.", isFinal: true },
  { delay: 192000, stage: "financial_snapshot", speaker: "manager",  text: "Okay, good to know. And do you drive mostly local, or do you put a lot of highway miles on?", isFinal: true },
  { delay: 198000, stage: "financial_snapshot", speaker: "customer", text: "Mostly local, some highway. Probably around 15,000 miles a year.", isFinal: true },
  { delay: 202000, stage: "financial_snapshot", speaker: "manager",  text: "Perfect. And last one — if something unexpected came up with the vehicle, like a major repair, would you prefer to handle that out of pocket or would you rather have something in place to protect against that?", isFinal: true },
  { delay: 211000, stage: "financial_snapshot", speaker: "customer", text: "I'd rather have something in place. We don't really have a big emergency fund right now.", isFinal: true },
  { delay: 215000, stage: "financial_snapshot", speaker: "manager",  text: "That's exactly what I needed to hear. So based on what you just told me — 5 to 6 years, 15,000 miles a year, family vehicle, no emergency fund — here's what I put together for you.", isFinal: true },

  // ── STEP 6: PRODUCT WALKTHROUGH ───────────────────────────────────────────
  { delay: 226000, stage: "product_walkthrough", speaker: "manager",  text: "The first product is GAP protection. On a vehicle like this, in the first 12 to 18 months you could be $6,000 to $8,000 upside down if something happened. GAP covers that entire difference — the gap between what you owe and what insurance pays.", isFinal: true },
  { delay: 238000, stage: "product_walkthrough", speaker: "customer", text: "How much does that add to the payment?", isFinal: true },
  { delay: 242000, stage: "product_walkthrough", speaker: "manager",  text: "It's about $12 a month. That's less than a streaming subscription to protect an $8,000 exposure.", isFinal: true },
  { delay: 248000, stage: "product_walkthrough", speaker: "customer", text: "Okay, that makes sense.", isFinal: true },
  { delay: 252000, stage: "product_walkthrough", speaker: "manager",  text: "Good. The second product is the Vehicle Service Agreement — the extended warranty. The factory warranty on this Tahoe covers you for 3 years or 36,000 miles. You said you keep your vehicles 5 to 6 years. That means years 4, 5, and 6 you're completely exposed.", isFinal: true },
  { delay: 264000, stage: "product_walkthrough", speaker: "customer", text: "What does that cover?", isFinal: true },
  { delay: 267000, stage: "product_walkthrough", speaker: "manager",  text: "Everything mechanical and electrical — engine, transmission, drive axle, electronics, air conditioning. A single transmission repair on this vehicle is $4,500 to $6,000. The VSA covers that completely, parts and labor.", isFinal: true },

  // ── STEP 6b: OBJECTION HANDLING ───────────────────────────────────────────
  { delay: 278000, stage: "objection_handling",  speaker: "customer", text: "I don't know, that seems like a lot. I need to think about it.", isFinal: true },
  { delay: 283000, stage: "objection_handling",  speaker: "manager",  text: "I completely understand. Can I ask — what specifically would you like to think about? Is it the investment, the coverage itself, or is there something I haven't explained clearly?", isFinal: true },
  { delay: 292000, stage: "objection_handling",  speaker: "customer", text: "I guess it's just the cost. It's adding up.", isFinal: true },
  { delay: 296000, stage: "objection_handling",  speaker: "manager",  text: "That's fair. Let me put it in perspective. We're talking about $47 a month to protect a $58,000 vehicle over 6 years. That's $0.78 a day. One repair pays for the entire contract.", isFinal: true },
  { delay: 306000, stage: "objection_handling",  speaker: "customer", text: "When you put it that way, it does make sense.", isFinal: true },

  // ── STEP 6c: TIRE & WHEEL ─────────────────────────────────────────────────
  { delay: 310000, stage: "product_walkthrough", speaker: "manager",  text: "Good. Now the last two are Tire and Wheel protection and the Theft Deterrent. Given that you're driving 15,000 miles a year locally, tire and wheel is actually one of the highest-utilized products we offer.", isFinal: true },
  { delay: 321000, stage: "product_walkthrough", speaker: "customer", text: "We actually had a blowout last year on our old car. That was expensive.", isFinal: true },
  { delay: 325000, stage: "product_walkthrough", speaker: "manager",  text: "Then this is exactly for you. One tire on this Tahoe is $350 to $400. The Tire and Wheel covers unlimited tires and wheels for the life of the contract. You already know what that feels like without it.", isFinal: true },
  { delay: 335000, stage: "product_walkthrough", speaker: "customer", text: "Yeah, okay. I think we want that one.", isFinal: true },

  // ── STEP 7: CLOSING ───────────────────────────────────────────────────────
  { delay: 340000, stage: "closing",             speaker: "manager",  text: "Great. So let me show you the full package — GAP, VSA, and Tire and Wheel together. The total comes to $742 a month. That's $55 more than your base payment to protect every major exposure on this vehicle.", isFinal: true },
  { delay: 352000, stage: "closing",             speaker: "customer", text: "Sounds good. Let's do it.", isFinal: true },
  { delay: 356000, stage: "closing",             speaker: "manager",  text: "Perfect. I'll get the paperwork started. You made a great decision protecting your family.", isFinal: true },
];

// ─── Demo Co-Pilot Suggestions ────────────────────────────────────────────────
const DEMO_SUGGESTIONS: Array<{
  triggerAt: number;
  type: string;
  title: string;
  content: string;
  script: string;
  framework: string;
  urgency: "high" | "medium" | "low";
  stage: string;
}> = [
  // Step 1 — Professional Hello
  {
    triggerAt: 1000,
    stage: "introduction",
    type: "rapport_building",
    title: "Professional Hello — Finance Director Introduction",
    content: "Strong open. You established your role, set a professional tone, and gave the customer a time expectation. This reduces anxiety and builds trust before the paperwork begins.",
    script: "\"Hi, I'm [Name], the Finance Director here at [Dealership]. Congratulations on your new vehicle — I'm going to take great care of you today. My job is to make sure your paperwork is accurate, your financing is locked in, and that you leave here fully protected. This should take about 20 to 30 minutes. Sound good?\"",
    framework: "ASURA Elite F&I Performance Playbook — Professional Hello",
    urgency: "low",
  },
  // Step 2 — Client Survey
  {
    triggerAt: 25000,
    stage: "client_survey",
    type: "rapport_building",
    title: "Client Survey — Customize Before You Present",
    content: "Excellent transition into the Client Survey. These questions (purpose, trade, existing coverage) give you the intelligence to personalize your entire presentation. First-time buyers need extra education — lean into that.",
    script: "\"Before I pull up your paperwork, I want to ask you a few questions — it's what we call the Client Survey. These answers help me customize everything for you today rather than going through a generic presentation.\"",
    framework: "Financial Snapshot Script — Client Survey Protocol",
    urgency: "low",
  },
  {
    triggerAt: 70000,
    stage: "client_survey",
    type: "product_recommendation",
    title: "First-Time Buyer Detected — Education Mode",
    content: "Customer confirmed they have never purchased F&I products before. This is your highest-opportunity profile. Slow down, explain each product from scratch, and use the 'value before price' framework. Do NOT rush to the menu.",
    script: "\"Since this is your first time going through this process, I'm going to walk you through each product one at a time and explain exactly what it does before we look at any numbers.\"",
    framework: "Menu Mastery Quick Reference — Value Before Price",
    urgency: "medium",
  },
  // Step 3 — Review Figures
  {
    triggerAt: 78000,
    stage: "review_figures",
    type: "compliance_reminder",
    title: "Review Figures — TILA Compliance Step",
    content: "Reviewing the deal figures before presenting F&I products is required under TILA/Reg Z. State the purchase price, down payment, trade equity, balance financed, APR, and term clearly. This protects you and the customer.",
    script: "\"Your purchase price is $58,000. Down payment $3,000. Trade equity $4,200. Balance financed: $50,800. Base payment: $687/month at 6.9% for 72 months.\"",
    framework: "Federal Compliance Engine — TILA/Reg Z Disclosure",
    urgency: "high",
  },
  {
    triggerAt: 128000,
    stage: "review_figures",
    type: "product_recommendation",
    title: "Bridge to Menu — Protect the Investment",
    content: "Perfect bridge line. You've established the $50,800 balance due and now you're pivoting to protection. Use this moment to frame the menu as a natural extension of the deal, not an add-on.",
    script: "\"Now — and this is the part that matters most — I want to show you what's available to protect that $50,800 investment, because that's a significant commitment.\"",
    framework: "Menu Mastery Quick Reference — Investment Framing",
    urgency: "medium",
  },
  // Step 4 — Menu Introduction
  {
    triggerAt: 138000,
    stage: "menu_intro",
    type: "product_recommendation",
    title: "Menu Introduction — Value Before Price",
    content: "Excellent execution. Leading with 'understand what you're getting, not just what it costs' removes the price-first objection before it forms. The three-levels framing anchors the middle option as the default choice.",
    script: "\"Before I show you any numbers, let me explain what each product does — because the value is in understanding what you're getting, not just what it costs. I'm going to show you three levels of protection. Most of our customers choose the middle option.\"",
    framework: "Menu Mastery Quick Reference — Three Levels Framing",
    urgency: "medium",
  },
  // Step 5 — Financial Snapshot
  {
    triggerAt: 178000,
    stage: "financial_snapshot",
    type: "rapport_building",
    title: "Financial Snapshot — 3 Core Questions",
    content: "You're executing the Financial Snapshot perfectly. These 3 questions (time frame, usage, risk tolerance) will personalize your entire menu presentation. Their answers determine which products to lead with.",
    script: "\"How long do you typically keep your vehicles? Do you drive more or less than 15,000 miles per year? If something unexpected happened, would you prefer to handle it out of pocket or have a plan in place?\"",
    framework: "Financial Snapshot Script — 3 Core Questions",
    urgency: "low",
  },
  {
    triggerAt: 215000,
    stage: "financial_snapshot",
    type: "product_recommendation",
    title: "High-Exposure Profile Confirmed — Lead with GAP",
    content: "5–6 year ownership + no emergency fund + family vehicle = maximum protection profile. Lead with GAP to establish the protection mindset, then VSA, then Tire & Wheel. Do not skip the sequence.",
    script: "\"Based on what you just told me — 5 to 6 years, 15,000 miles, family vehicle, no emergency fund — here's what I put together for you.\"",
    framework: "Menu Mastery — 4-Pillar Framework",
    urgency: "medium",
  },
  // Step 6 — Product Walkthrough
  {
    triggerAt: 238000,
    stage: "product_walkthrough",
    type: "product_recommendation",
    title: "GAP — Payment Question is a Buying Signal",
    content: "Customer asked about payment impact — this is a buying signal, not an objection. Use the daily cost reframe immediately to make the number feel small relative to the exposure.",
    script: "\"It's about $12 a month — less than a streaming service to protect an $8,000 exposure.\"",
    framework: "Objection Prevention Matrix — Responsibility Transfer",
    urgency: "medium",
  },
  {
    triggerAt: 278000,
    stage: "objection_handling",
    type: "objection_handling",
    title: "Think It Over — Isolate NOW",
    content: "Customer said 'I need to think about it.' Do NOT let this slide. Use the ASURA isolation technique immediately to surface the real objection before it becomes a wall.",
    script: "\"I completely understand. Can I ask — what specifically would you like to think about? Is it the investment, the coverage itself, or is there something I haven't explained clearly?\"",
    framework: "Objection Prevention Matrix — 3x3 Isolation Matrix",
    urgency: "high",
  },
  {
    triggerAt: 296000,
    stage: "objection_handling",
    type: "closing_technique",
    title: "Price Objection — Daily Cost Reframe",
    content: "Real objection is cost, not coverage. Break it down to daily cost immediately. $47/month = $0.78/day. One repair pays for the entire 6-year contract.",
    script: "\"Let me put it in perspective — $47 a month is $0.78 a day to protect a $58,000 vehicle. One transmission repair pays for the entire contract.\"",
    framework: "Objection Prevention Matrix — Responsibility Transfer",
    urgency: "high",
  },
  {
    triggerAt: 321000,
    stage: "product_walkthrough",
    type: "product_recommendation",
    title: "Tire & Wheel — Personal Experience Close",
    content: "Customer just disclosed a personal tire blowout experience. This is a GIFT. Use their own experience as the close — they already know the pain. Don't oversell, just confirm.",
    script: "\"You already know exactly what that feels like without it. This covers unlimited tires and wheels for the life of the contract.\"",
    framework: "VSA Presentation Framework — Frame → Comprehensive → Value → Opt-Out",
    urgency: "high",
  },
  {
    triggerAt: 352000,
    stage: "closing",
    type: "closing_technique",
    title: "Buying Signal — Close Confirmed",
    content: "Customer said 'Sounds good, let's do it.' Close is complete. Confirm the decision positively and move to paperwork immediately. Do not re-open any product conversation.",
    script: "\"Perfect. I'll get the paperwork started. You made a great decision protecting your family.\"",
    framework: "Ranking System — Assume the Business",
    urgency: "high",
  },
];

// ─── Demo Compliance Events ───────────────────────────────────────────────────
const DEMO_COMPLIANCE: Array<{
  triggerAt: number;
  severity: "critical" | "warning" | "info";
  rule: string;
  description: string;
}> = [
  {
    triggerAt: 12000,
    severity: "info",
    rule: "Professional Introduction — Compliant",
    description: "Finance Director identified themselves by name and role. No pressure language used. UDAP compliant.",
  },
  {
    triggerAt: 100000,
    severity: "info",
    rule: "TILA — Base Payment Disclosed",
    description: "Purchase price $58,000, balance financed $50,800, APR 6.9%, term 72 months, base payment $687 disclosed before F&I product presentation. Reg Z compliant.",
  },
  {
    triggerAt: 116000,
    severity: "info",
    rule: "TILA — Customer Confirmation Obtained",
    description: "Manager confirmed customer agreement with base payment before proceeding to F&I menu. Best practice for TILA compliance.",
  },
  {
    triggerAt: 226000,
    severity: "info",
    rule: "GAP Disclosure — Accurate Range",
    description: "GAP exposure stated as a range ($6,000–$8,000), not a guarantee. No misrepresentation. Compliant.",
  },
  {
    triggerAt: 252000,
    severity: "info",
    rule: "VSA — Factory Warranty Disclosed First",
    description: "Factory warranty coverage (3yr/36k) disclosed before presenting VSA. Customer can make an informed decision. Compliant.",
  },
];

// ─── Demo Checklist ───────────────────────────────────────────────────────────
const DEMO_CHECKLIST_EVENTS: Array<{
  triggerAt: number;
  item: string;
  completed: boolean;
}> = [
  { triggerAt: 1000,   item: "greeting",              completed: true },
  { triggerAt: 12000,  item: "titleWork",             completed: true },
  { triggerAt: 25000,  item: "clientSurvey",          completed: true },
  { triggerAt: 70000,  item: "firstTimeBuyer",        completed: true },
  { triggerAt: 100000, item: "reviewFigures",         completed: true },
  { triggerAt: 116000, item: "basePayment",           completed: true },
  { triggerAt: 138000, item: "menuIntroduction",      completed: true },
  { triggerAt: 149000, item: "threeLevelsFraming",    completed: true },
  { triggerAt: 178000, item: "timeFrame",             completed: true },
  { triggerAt: 211000, item: "financialOptions",      completed: true },
  { triggerAt: 226000, item: "gapProtection",         completed: true },
  { triggerAt: 252000, item: "vehicleServiceAgreement", completed: true },
  { triggerAt: 283000, item: "objectionHandled",      completed: true },
  { triggerAt: 310000, item: "tireWheel",             completed: true },
  { triggerAt: 340000, item: "assumptiveClose",       completed: true },
];

// ─── Checklist Labels ─────────────────────────────────────────────────────────
const CHECKLIST_LABELS: Record<string, { label: string; category: string }> = {
  greeting:               { label: "Professional Greeting",        category: "Step 1 — Introduction" },
  titleWork:              { label: "Role & Time Expectation Set",   category: "Step 1 — Introduction" },
  clientSurvey:           { label: "Client Survey Initiated",       category: "Step 2 — Client Survey" },
  firstTimeBuyer:         { label: "First-Time Buyer Identified",   category: "Step 2 — Client Survey" },
  reviewFigures:          { label: "Deal Figures Reviewed",         category: "Step 3 — Review Figures" },
  basePayment:            { label: "Base Payment Disclosed",        category: "Step 3 — Review Figures" },
  menuIntroduction:       { label: "Menu Introduction Delivered",   category: "Step 4 — Menu Intro" },
  threeLevelsFraming:     { label: "Three Levels Framing Used",     category: "Step 4 — Menu Intro" },
  timeFrame:              { label: "Time Frame Established",        category: "Step 5 — Financial Snapshot" },
  financialOptions:       { label: "Risk Preference Confirmed",     category: "Step 5 — Financial Snapshot" },
  gapProtection:          { label: "GAP Protection Presented",      category: "Step 6 — Product Walkthrough" },
  vehicleServiceAgreement:{ label: "VSA / Extended Warranty",       category: "Step 6 — Product Walkthrough" },
  objectionHandled:       { label: "Objection Handled Correctly",   category: "Step 6 — Product Walkthrough" },
  tireWheel:              { label: "Tire & Wheel Protection",        category: "Step 6 — Product Walkthrough" },
  assumptiveClose:        { label: "Assumptive Close Used",         category: "Step 7 — Closing" },
};

type TranscriptLine = { speaker: "manager" | "customer"; text: string; timestamp: number; stage?: string };
type Suggestion = typeof DEMO_SUGGESTIONS[0];
type ComplianceEvent = typeof DEMO_COMPLIANCE[0];
type ChecklistState = Record<string, boolean>;

const URGENCY_COLORS = {
  high:   "border-red-500/60 bg-red-500/10",
  medium: "border-amber-500/60 bg-amber-500/10",
  low:    "border-emerald-500/60 bg-emerald-500/10",
};

const URGENCY_BADGE = {
  high:   "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low:    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export default function DemoMode() {
  useEffect(() => { document.title = "Demo Mode | F&I Co-Pilot by ASURA Group"; }, []);
  const [, navigate] = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [compliance, setCompliance] = useState<ComplianceEvent[]>([]);
  const [checklist, setChecklist] = useState<ChecklistState>({});
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>("introduction");
  const [expandedScript, setExpandedScript] = useState<number | null>(0);
  const [scriptFidelity, setScriptFidelity] = useState({ process: 0, menu: 0, objection: 0, transition: 0, overall: 0 });

  const startTimeRef = useRef<number>(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  // Sticky-scroll: only auto-scroll if user is already near the bottom. If they
  // scrolled up to read, respect their position.
  const isAtBottomRef = useRef<boolean>(true);

  // Attach scroll listener to the ScrollArea viewport once it mounts
  useEffect(() => {
    const viewport = transcriptScrollRef.current?.querySelector<HTMLDivElement>(
      "[data-radix-scroll-area-viewport]",
    );
    if (!viewport) return;
    const handleScroll = () => {
      const threshold = 80; // px from bottom counts as "at bottom"
      const distanceFromBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      isAtBottomRef.current = distanceFromBottom < threshold;
    };
    viewport.addEventListener("scroll", handleScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, []);

  // Replace the direct scrollIntoView calls below with this helper
  const scrollTranscriptToBottomIfAtBottom = () => {
    if (isAtBottomRef.current) {
      transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const TOTAL_DURATION = DEMO_TRANSCRIPT[DEMO_TRANSCRIPT.length - 1].delay + 3000;

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const scheduleEvents = useCallback((offsetMs: number) => {
    clearAllTimers();
    startTimeRef.current = Date.now() - offsetMs;

    // Schedule transcript lines
    DEMO_TRANSCRIPT.forEach(line => {
      const remaining = line.delay - offsetMs;
      if (remaining > 0) {
        const t = setTimeout(() => {
          setTranscript(prev => [...prev, { speaker: line.speaker, text: line.text, timestamp: line.delay, stage: line.stage }]);
          if (line.stage) setCurrentStage(line.stage);
          setTimeout(scrollTranscriptToBottomIfAtBottom, 50);
        }, remaining);
        timersRef.current.push(t);
      }
    });

    // Schedule suggestions
    DEMO_SUGGESTIONS.forEach((sugg, idx) => {
      const remaining = sugg.triggerAt - offsetMs;
      if (remaining > 0) {
        const t = setTimeout(() => {
          setSuggestions(prev => [sugg, ...prev.slice(0, 4)]);
          setExpandedScript(0);
          if (sugg.urgency === "high") toast.warning(sugg.title, { description: `${STAGE_LABELS[sugg.stage]?.label ?? sugg.stage} — High Priority` });
        }, remaining);
        timersRef.current.push(t);
      }
    });

    // Schedule compliance events
    DEMO_COMPLIANCE.forEach(evt => {
      const remaining = evt.triggerAt - offsetMs;
      if (remaining > 0) {
        const t = setTimeout(() => {
          setCompliance(prev => [evt, ...prev]);
        }, remaining);
        timersRef.current.push(t);
      }
    });

    // Schedule checklist events
    DEMO_CHECKLIST_EVENTS.forEach(evt => {
      const remaining = evt.triggerAt - offsetMs;
      if (remaining > 0) {
        const t = setTimeout(() => {
          setChecklist(prev => ({ ...prev, [evt.item]: evt.completed }));
          setScore(prev => Math.min(100, prev + Math.ceil(84 / DEMO_CHECKLIST_EVENTS.length)));
        }, remaining);
        timersRef.current.push(t);
      }
    });

    // Completion
    const completionRemaining = TOTAL_DURATION - offsetMs;
    if (completionRemaining > 0) {
      const t = setTimeout(() => {
        setIsPlaying(false);
        setIsComplete(true);
        setScore(87);
        setScriptFidelity({ process: 94, menu: 91, objection: 88, transition: 93, overall: 92 });
        toast.success("Demo session complete — Score: 87/100 (Elite)", { description: "3 products sold. PVR: $2,847. All 7 steps executed." });
      }, completionRemaining);
      timersRef.current.push(t);
    }

    // Elapsed timer
    intervalRef.current = setInterval(() => {
      const newElapsed = Date.now() - startTimeRef.current;
      setElapsed(newElapsed);
      if (newElapsed >= TOTAL_DURATION) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
      }
    }, 250);
  }, [clearAllTimers, TOTAL_DURATION]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    scheduleEvents(elapsed);
  }, [elapsed, scheduleEvents]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    clearAllTimers();
  }, [clearAllTimers]);

  const handleReset = useCallback(() => {
    clearAllTimers();
    setIsPlaying(false);
    setElapsed(0);
    setTranscript([]);
    setSuggestions([]);
    setCompliance([]);
    setChecklist({});
    setScore(0);
    setIsComplete(false);
    setCurrentStage("introduction");
    setExpandedScript(0);
    setScriptFidelity({ process: 0, menu: 0, objection: 0, transition: 0, overall: 0 });
  }, [clearAllTimers]);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const progressPct = Math.min(100, (elapsed / TOTAL_DURATION) * 100);
  const elapsedSec = Math.floor(elapsed / 1000);
  const elapsedMin = Math.floor(elapsedSec / 60);
  const elapsedSecDisplay = elapsedSec % 60;

  const checklistCategories = [
    "Step 1 — Introduction",
    "Step 2 — Client Survey",
    "Step 3 — Review Figures",
    "Step 4 — Menu Intro",
    "Step 5 — Financial Snapshot",
    "Step 6 — Product Walkthrough",
    "Step 7 — Closing",
  ];
  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalItems = Object.keys(CHECKLIST_LABELS).length;
  const stageInfo = STAGE_LABELS[currentStage] ?? { label: "Introduction", color: "bg-violet-500/20 text-violet-400 border-violet-500/30" };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-xs font-semibold tracking-wider">
                DEMO MODE
              </Badge>
              <Badge className={`text-xs font-semibold border ${stageInfo.color}`}>
                {stageInfo.label}
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                ASURA 7-Step Process
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Live Deal Simulation</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Marcus Rivera — 2024 Chevrolet Tahoe LT — Retail Finance — $58,000 — Balance Due: $50,800
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isComplete && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <Award className="h-5 w-5 text-emerald-400" />
                <span className="text-emerald-400 font-bold text-lg">87 / 100</span>
                <span className="text-emerald-400/70 text-sm">Elite</span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            {isPlaying ? (
              <Button onClick={handlePause} className="gap-2 bg-amber-600 hover:bg-amber-700">
                <Pause className="h-4 w-4" /> Pause
              </Button>
            ) : (
              <Button onClick={handlePlay} className="gap-2 bg-emerald-600 hover:bg-emerald-700" disabled={isComplete}>
                <Play className="h-4 w-4" /> {elapsed === 0 ? "Start Demo" : "Resume"}
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {isPlaying ? (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Recording Active — Deepgram Nova-2
                </span>
              ) : isComplete ? (
                <span className="flex items-center gap-1.5 text-violet-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Session Complete — All 7 Steps Executed
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MicOff className="h-3.5 w-3.5" /> Paused
                </span>
              )}
            </div>
            <span>{elapsedMin}:{String(elapsedSecDisplay).padStart(2, "0")} / {Math.floor(TOTAL_DURATION / 60000)}:{String(Math.floor((TOTAL_DURATION % 60000) / 1000)).padStart(2, "0")}</span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
          {/* Stage Progress Indicators */}
          <div className="flex gap-1 mt-1">
            {[
              { key: "introduction", label: "1" },
              { key: "client_survey", label: "2" },
              { key: "review_figures", label: "3" },
              { key: "menu_intro", label: "4" },
              { key: "financial_snapshot", label: "5" },
              { key: "product_walkthrough", label: "6" },
              { key: "closing", label: "7" },
            ].map(s => {
              const stageOrder = ["introduction","client_survey","review_figures","menu_intro","financial_snapshot","product_walkthrough","objection_handling","closing"];
              const currentIdx = stageOrder.indexOf(currentStage);
              const thisIdx = stageOrder.indexOf(s.key);
              const isPast = elapsed > 0 && thisIdx < currentIdx;
              const isCurrent = currentStage === s.key || (s.key === "product_walkthrough" && currentStage === "objection_handling");
              return (
                <div key={s.key} className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                  isPast ? "bg-emerald-500" : isCurrent ? "bg-violet-500 animate-pulse" : "bg-border/40"
                }`} title={STAGE_LABELS[s.key]?.label} />
              );
            })}
          </div>
          <div className="flex gap-1">
            {["1","2","3","4","5","6","7"].map((n, i) => (
              <div key={n} className="flex-1 text-center text-[9px] text-muted-foreground/40">{n}</div>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-4 min-h-[600px]">

          {/* Checklist Panel — Left */}
          <div className="col-span-3 space-y-3">
            <Card className="bg-card/50 border-border/60">
              <CardHeader className="pb-3 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-foreground">7-Step Checklist</CardTitle>
                  <span className="text-xs text-muted-foreground">{completedCount}/{totalItems}</span>
                </div>
                <Progress value={(completedCount / totalItems) * 100} className="h-1 mt-1" />
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                {checklistCategories.map(category => (
                  <div key={category}>
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{category}</p>
                    <div className="space-y-1">
                      {Object.entries(CHECKLIST_LABELS)
                        .filter(([, v]) => v.category === category)
                        .map(([key, { label }]) => (
                          <div key={key} className="flex items-center gap-2">
                            {checklist[key] ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                            )}
                            <span className={`text-[10px] leading-tight ${checklist[key] ? "text-foreground" : "text-muted-foreground/50"}`}>
                              {label}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Score Card */}
            <Card className="bg-card/50 border-border/60">
              <CardContent className="p-4">
                <div className="text-center mb-3">
                  <div className="text-4xl font-bold text-foreground mb-1">{score}</div>
                  <div className="text-xs text-muted-foreground mb-2">Live Score</div>
                  <Progress value={score} className="h-2 mb-2" />
                  <div className={`text-xs font-semibold ${score >= 80 ? "text-emerald-400" : score >= 65 ? "text-amber-400" : "text-red-400"}`}>
                    {score >= 80 ? "ELITE" : score >= 65 ? "DEVELOPING" : "NEEDS COACHING"}
                  </div>
                </div>
                {isComplete && (
                  <div className="space-y-1.5 pt-3 border-t border-border/40">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Script Fidelity</p>
                    {[
                      { label: "Process", value: scriptFidelity.process },
                      { label: "Menu Seq.", value: scriptFidelity.menu },
                      { label: "Objection", value: scriptFidelity.objection },
                      { label: "Transition", value: scriptFidelity.transition },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className={item.value >= 85 ? "text-emerald-400" : item.value >= 70 ? "text-amber-400" : "text-red-400"}>{item.value}</span>
                        </div>
                        <Progress value={item.value} className="h-1" />
                      </div>
                    ))}
                    <div className="flex justify-between text-[10px] pt-1 border-t border-border/40">
                      <span className="font-semibold text-foreground">Overall</span>
                      <span className="font-bold text-emerald-400">{scriptFidelity.overall}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transcript — Center */}
          <div className="col-span-5">
            <Card className="bg-card/50 border-border/60 h-full flex flex-col">
              <CardHeader className="pb-3 pt-4 px-4 shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Mic className="h-4 w-4 text-emerald-400" />
                    Live Transcript
                  </CardTitle>
                  <Badge className="text-[10px] bg-violet-500/20 text-violet-400 border-violet-500/30">
                    Speaker Diarized
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 px-4 pb-4 overflow-hidden">
                <ScrollArea className="h-[520px] pr-2" ref={transcriptScrollRef}>
                  {transcript.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <Play className="h-8 w-8 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">Press Start Demo to begin the simulation</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Full ASURA 7-Step Process — Client Survey → Review Figures → Menu Intro → Products → Close</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transcript.map((line, i) => {
                        const prevStage = i > 0 ? transcript[i - 1].stage : null;
                        const showStageDivider = line.stage && line.stage !== prevStage;
                        return (
                          <div key={i}>
                            {showStageDivider && line.stage && (
                              <div className="flex items-center gap-2 my-3">
                                <div className="flex-1 h-px bg-border/30" />
                                <Badge className={`text-[9px] border ${STAGE_LABELS[line.stage]?.color ?? ""}`}>
                                  {STAGE_LABELS[line.stage]?.label ?? line.stage}
                                </Badge>
                                <div className="flex-1 h-px bg-border/30" />
                              </div>
                            )}
                            <div className={`flex gap-3 ${line.speaker === "manager" ? "" : "flex-row-reverse"}`}>
                              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                line.speaker === "manager"
                                  ? "bg-violet-500/20 text-violet-400"
                                  : "bg-blue-500/20 text-blue-400"
                              }`}>
                                {line.speaker === "manager" ? "FM" : "C"}
                              </div>
                              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                line.speaker === "manager"
                                  ? "bg-violet-500/10 border border-violet-500/20 text-foreground"
                                  : "bg-blue-500/10 border border-blue-500/20 text-foreground"
                              }`}>
                                <div className="text-[10px] font-semibold mb-1 opacity-60">
                                  {line.speaker === "manager" ? "F&I MANAGER" : "CUSTOMER"}
                                </div>
                                {line.text}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={transcriptEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Co-Pilot + Compliance — Right */}
          <div className="col-span-4 space-y-3">
            {/* Co-Pilot Suggestions */}
            <Card className="bg-card/50 border-border/60">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  AI Co-Pilot
                  <Badge className="ml-auto text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                    ASURA Engine
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ScrollArea className="h-[300px] pr-1">
                  {suggestions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-20 text-center">
                      <p className="text-xs text-muted-foreground/60">Co-pilot suggestions will appear here as the deal progresses</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {suggestions.map((sugg, i) => (
                        <div key={i} className={`rounded-lg border p-3 ${URGENCY_COLORS[sugg.urgency]} ${i === 0 ? "ring-1 ring-current" : "opacity-70"}`}>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-semibold text-foreground leading-tight block">{sugg.title}</span>
                              <Badge className={`text-[9px] mt-1 border ${STAGE_LABELS[sugg.stage]?.color ?? ""}`}>
                                {STAGE_LABELS[sugg.stage]?.label ?? sugg.stage}
                              </Badge>
                            </div>
                            <Badge className={`text-[9px] shrink-0 ${URGENCY_BADGE[sugg.urgency]}`}>
                              {sugg.urgency.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">{sugg.content}</p>
                          {/* Expand/Collapse Script */}
                          <button
                            className="w-full text-left"
                            onClick={() => setExpandedScript(expandedScript === i ? null : i)}
                          >
                            <div className="flex items-center justify-between bg-background/40 rounded-md px-2 py-1.5 border border-border/40 hover:border-border/70 transition-colors">
                              <p className="text-[10px] font-semibold text-muted-foreground">VERBATIM SCRIPT</p>
                              <div className="flex items-center gap-1">
                                {expandedScript === i ? (
                                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </button>
                          {expandedScript === i && (
                            <div className="bg-background/40 rounded-b-md px-2 pb-2 border border-t-0 border-border/40">
                              <p className="text-[11px] text-foreground italic leading-relaxed pt-2">{sugg.script}</p>
                              <button
                                className="flex items-center gap-1 mt-2 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => {
                                  navigator.clipboard.writeText(sugg.script);
                                  toast.success("Script copied to clipboard");
                                }}
                              >
                                <Copy className="h-2.5 w-2.5" /> Copy word track
                              </button>
                            </div>
                          )}
                          <p className="text-[9px] text-muted-foreground/50 mt-2 flex items-center gap-1">
                            <Star className="h-2.5 w-2.5" /> {sugg.framework}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Compliance Monitor */}
            <Card className="bg-card/50 border-border/60">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  Compliance Monitor
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ScrollArea className="h-[160px] pr-1">
                  {compliance.length === 0 ? (
                    <div className="flex items-center justify-center h-12">
                      <p className="text-xs text-muted-foreground/60">No compliance events yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {compliance.map((evt, i) => (
                        <div key={i} className={`flex items-start gap-2 p-2 rounded-md border text-xs ${
                          evt.severity === "critical"
                            ? "bg-red-500/10 border-red-500/30"
                            : evt.severity === "warning"
                            ? "bg-amber-500/10 border-amber-500/30"
                            : "bg-emerald-500/10 border-emerald-500/30"
                        }`}>
                          {evt.severity === "critical" ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                          ) : evt.severity === "warning" ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="font-semibold text-foreground">{evt.rule}</p>
                            <p className="text-muted-foreground text-[10px] mt-0.5">{evt.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Completion Summary */}
        {isComplete && (
          <Card className="bg-emerald-500/5 border-emerald-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Award className="h-8 w-8 text-emerald-400" />
                <div>
                  <h3 className="text-lg font-bold text-foreground">Session Complete — Elite Performance</h3>
                  <p className="text-sm text-muted-foreground">Marcus Rivera executed all 7 ASURA steps — Client Survey → Review Figures → Menu Intro → Financial Snapshot → Products → Objections → Close</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-4">
                {[
                  { label: "Overall Score", value: "87/100", sub: "Elite", color: "text-emerald-400" },
                  { label: "Products Sold", value: "3 of 4", sub: "GAP + VSA + T&W", color: "text-violet-400" },
                  { label: "PVR", value: "$2,847", sub: "Above target", color: "text-amber-400" },
                  { label: "Compliance", value: "100%", sub: "All disclosures made", color: "text-blue-400" },
                ].map(stat => (
                  <div key={stat.label} className="text-center p-3 rounded-lg bg-background/40 border border-border/40">
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                    <div className="text-[10px] text-muted-foreground/60 mt-0.5">{stat.sub}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-lg bg-background/30 border border-border/40 mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Script Fidelity Score — {scriptFidelity.overall}/100</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {[
                    { label: "Process Adherence", value: scriptFidelity.process },
                    { label: "Menu Sequence", value: scriptFidelity.menu },
                    { label: "Objection Response", value: scriptFidelity.objection },
                    { label: "Transition Accuracy", value: scriptFidelity.transition },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className={`font-semibold ${item.value >= 85 ? "text-emerald-400" : item.value >= 70 ? "text-amber-400" : "text-red-400"}`}>{item.value}</span>
                      </div>
                      <Progress value={item.value} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button onClick={handleReset} variant="outline" className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Run Again
                </Button>
                <Button onClick={() => navigate("/sessions/1")} className="gap-2 bg-violet-600 hover:bg-violet-700">
                  <TrendingUp className="h-4 w-4" /> View Full Report
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
