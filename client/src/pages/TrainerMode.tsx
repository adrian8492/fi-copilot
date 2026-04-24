import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Play,
  CheckCircle2,
  XCircle,
  Star,
  Trophy,
  Target,
  MessageSquare,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  Zap,
  Shield,
  Heart,
  Eye,
  X,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────
interface Choice {
  text: string;
  pillarScores: Record<string, number>;
  feedback: string;
  isOptimal: boolean;
}

interface Stage {
  name: string;
  prompt: string;
  choices: Choice[];
  wordTrack: string;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  customerProfile: {
    creditScore: number;
    tradeIn: string;
    downPayment: string;
    monthlyBudget: string;
    attitude: string;
    dealType: string;
  };
  stages: Stage[];
}

interface Progress {
  scenarioId: string;
  highScore: number;
  completed: boolean;
}

const PILLARS = ["Menu Order", "Upgrade Architecture", "Objection Prevention", "Coaching Cadence"];
const PILLAR_ICONS: Record<string, typeof Target> = {
  "Menu Order": Target,
  "Upgrade Architecture": Zap,
  "Objection Prevention": Shield,
  "Coaching Cadence": Heart,
};
const PILLAR_COLORS: Record<string, string> = {
  "Menu Order": "text-blue-500",
  "Upgrade Architecture": "text-purple-500",
  "Objection Prevention": "text-emerald-500",
  "Coaching Cadence": "text-orange-500",
};

// ── Demo Scenarios ─────────────────────────────────────────────────
const SCENARIOS: Scenario[] = [
  {
    id: "credit-challenged",
    title: "Credit-Challenged Buyer",
    description: "A customer with a 580 credit score needs financing and is sensitive about their credit situation.",
    customerProfile: { creditScore: 580, tradeIn: "2018 Honda Civic — $8,500 ACV", downPayment: "$2,000", monthlyBudget: "$450/mo", attitude: "Defensive, embarrassed about credit", dealType: "Finance" },
    stages: [
      {
        name: "Greeting",
        prompt: "The customer walks in visibly nervous. How do you open?",
        choices: [
          { text: "Congratulations on your approval! Let's get you taken care of today.", pillarScores: { "Objection Prevention": 5, "Coaching Cadence": 3 }, feedback: "Great! Starting positive removes credit anxiety immediately.", isOptimal: true },
          { text: "I see your credit score is 580 — let me explain what that means for rates.", pillarScores: { "Objection Prevention": -2 }, feedback: "Mentioning the exact score can make the customer feel judged.", isOptimal: false },
          { text: "Let's jump right into the paperwork so we can get this done.", pillarScores: { "Menu Order": 1 }, feedback: "Rushing creates pressure. Build rapport first.", isOptimal: false },
          { text: "I know your situation is tough, but we'll figure something out.", pillarScores: { "Coaching Cadence": 2 }, feedback: "Empathetic but patronizing. Better to focus on the positive.", isOptimal: false },
        ],
        wordTrack: "Congratulations on your approval! My job today is to make sure you're protected and comfortable with everything before you drive off the lot.",
      },
      {
        name: "Needs Discovery",
        prompt: "The customer asks, 'Why do I need all this extra stuff?' How do you respond?",
        choices: [
          { text: "These products are completely optional. Let me show you what each one does so you can decide what's right for you.", pillarScores: { "Menu Order": 5, "Objection Prevention": 4 }, feedback: "Transparency + education = trust. ASURA OPS best practice.", isOptimal: true },
          { text: "You really need these — especially with your credit situation, breakdowns could be devastating.", pillarScores: { "Objection Prevention": -3 }, feedback: "Fear-based selling damages trust and may trigger compliance issues.", isOptimal: false },
          { text: "Most people get the full package. Want me to add everything?", pillarScores: { "Menu Order": -1 }, feedback: "Skipping the menu presentation violates ASURA OPS order.", isOptimal: false },
        ],
        wordTrack: "These are all optional protections. Let me walk you through each one so you can make the best decision for your family and budget.",
      },
      {
        name: "Menu Presentation",
        prompt: "Time to present the menu. Which approach do you take?",
        choices: [
          { text: "Present the full menu top-down, starting with the most comprehensive package, explaining each product.", pillarScores: { "Menu Order": 5, "Upgrade Architecture": 5, "Coaching Cadence": 3 }, feedback: "Perfect ASURA OPS execution: full menu, top-down, complete transparency.", isOptimal: true },
          { text: "Show only the cheapest options since they have a tight budget.", pillarScores: { "Menu Order": -2, "Upgrade Architecture": -3 }, feedback: "Pre-selecting limits the customer's choice and leaves money on the table.", isOptimal: false },
          { text: "Skip the menu and just add VSC since that's the most important one.", pillarScores: { "Menu Order": -4 }, feedback: "Skipping the menu is a compliance risk and ASURA OPS violation.", isOptimal: false },
        ],
        wordTrack: "I'm going to show you three packages — the first gives you the most protection, and we'll work down from there. You tell me which feels right.",
      },
      {
        name: "Objection Handling",
        prompt: "Customer says: 'I can't afford any of this. My payment is already too high.'",
        choices: [
          { text: "I understand. Let me show you how just the VSC breaks down to about $1 a day — less than your morning coffee.", pillarScores: { "Objection Prevention": 5, "Upgrade Architecture": 4 }, feedback: "Daily cost comparison + focus on most valuable product = strong close.", isOptimal: true },
          { text: "That's fair. Let me remove everything and we'll just do the base deal.", pillarScores: { "Objection Prevention": -2, "Upgrade Architecture": -3 }, feedback: "Giving up at the first objection leaves the customer unprotected.", isOptimal: false },
          { text: "The monthly payment only goes up $35. That's nothing compared to a $5,000 repair bill.", pillarScores: { "Objection Prevention": 3, "Upgrade Architecture": 2 }, feedback: "Good reframe but could sound dismissive of their budget concern.", isOptimal: false },
        ],
        wordTrack: "I totally get it — budget matters. Here's the thing: this VSC works out to about $1.10 a day. If your transmission goes out — and on this model it's known to happen around 80K miles — you're looking at $4,500 out of pocket. This $1 a day prevents that.",
      },
      {
        name: "Close",
        prompt: "The customer is warming up but still hesitant. How do you close?",
        choices: [
          { text: "Based on what you've told me, Package 2 gives you the best balance of protection and budget. Shall I include that?", pillarScores: { "Menu Order": 4, "Upgrade Architecture": 5, "Coaching Cadence": 4, "Objection Prevention": 3 }, feedback: "Assumptive close with personalized recommendation — excellent ASURA close.", isOptimal: true },
          { text: "So what do you want to do? It's up to you.", pillarScores: { "Coaching Cadence": -2 }, feedback: "Weak close. The customer needs your guidance.", isOptimal: false },
          { text: "If you don't get this and something breaks, you'll regret it.", pillarScores: { "Objection Prevention": -4 }, feedback: "Scare tactics are a compliance risk and damage trust.", isOptimal: false },
        ],
        wordTrack: "Based on everything we've discussed, Package 2 is your sweet spot — you get the VSC and GAP which are the two most critical coverages, and it only adds $28 to your payment. I'd recommend we go with that. Sound good?",
      },
    ],
  },
  {
    id: "lease-return",
    title: "Lease Return Customer",
    description: "Customer returning a lease and looking at a new purchase. They think F&I products are unnecessary on new cars.",
    customerProfile: { creditScore: 740, tradeIn: "Lease return — no equity", downPayment: "$3,000", monthlyBudget: "$550/mo", attitude: "Confident, thinks they know everything", dealType: "Finance" },
    stages: [
      {
        name: "Greeting",
        prompt: "The customer says: 'I've leased 4 cars, I know how this works. Let's make it quick.'",
        choices: [
          { text: "I appreciate that experience! Since you're purchasing this time instead of leasing, there are a few key differences I'd love to walk you through.", pillarScores: { "Objection Prevention": 5, "Coaching Cadence": 4 }, feedback: "Acknowledge their experience while positioning the purchase difference.", isOptimal: true },
          { text: "Sure, we'll be done in 10 minutes.", pillarScores: { "Menu Order": -3 }, feedback: "Rushing through means you'll skip the menu presentation.", isOptimal: false },
          { text: "Actually, buying is very different from leasing. You have a lot to learn.", pillarScores: { "Coaching Cadence": -3 }, feedback: "Condescending tone will shut down the customer.", isOptimal: false },
        ],
        wordTrack: "That's great — you've been through this process before! Since you're making the switch from leasing to owning, I want to make sure you understand the protections that are different when you own the vehicle outright.",
      },
      {
        name: "Needs Discovery",
        prompt: "Customer: 'With leasing, everything was covered. Why would I need extra coverage on a new car?'",
        choices: [
          { text: "Great question. With your lease, the manufacturer covered most repairs. Now that you're buying, after the factory warranty expires, those costs are yours. Let me show you how to lock in that same coverage.", pillarScores: { "Objection Prevention": 5, "Menu Order": 4 }, feedback: "Perfect bridge from lease experience to ownership protection need.", isOptimal: true },
          { text: "You don't need coverage on a new car. The factory warranty covers everything.", pillarScores: { "Menu Order": -4 }, feedback: "Factory warranty is limited in time and scope. This is wrong and leaves the customer unprotected.", isOptimal: false },
          { text: "Trust me, you need everything on the menu.", pillarScores: { "Coaching Cadence": -2 }, feedback: "No explanation = no trust. Educate, don't dictate.", isOptimal: false },
        ],
        wordTrack: "With your lease, Lexus covered basically everything. Now that you'll own this outright, once the factory warranty expires at 4 years or 50K miles, every repair comes out of your pocket. The average engine repair on this model is $3,800. Let me show you how we can prevent that.",
      },
      {
        name: "Menu Presentation",
        prompt: "Time to present the menu to this knowledgeable customer.",
        choices: [
          { text: "Present the full menu top-down, highlighting how each product differs from their lease coverage experience.", pillarScores: { "Menu Order": 5, "Upgrade Architecture": 5, "Objection Prevention": 3 }, feedback: "Full menu with lease-to-own comparison — tailored and compliant.", isOptimal: true },
          { text: "Only show VSC since that's the main gap from their lease.", pillarScores: { "Menu Order": -2, "Upgrade Architecture": -2 }, feedback: "Cherry-picking products means they miss GAP and other key protections.", isOptimal: false },
          { text: "Ask them what they want instead of presenting the menu.", pillarScores: { "Menu Order": -3 }, feedback: "Customers can't choose what they don't know about. Present the full menu.", isOptimal: false },
        ],
        wordTrack: "Here are three protection packages. The first one mirrors the bumper-to-bumper coverage you had on your lease, plus GAP — which is actually more important now since you're financing instead of leasing.",
      },
      {
        name: "Objection Handling",
        prompt: "Customer: 'I never bought any of this stuff on my leases and was fine.'",
        choices: [
          { text: "That's because the lease structure already included those protections. Buying is different — let me show you the math on what an uncovered repair costs vs. this daily cost.", pillarScores: { "Objection Prevention": 5, "Upgrade Architecture": 4, "Coaching Cadence": 3 }, feedback: "Logical comparison + cost breakdown = strong reframe.", isOptimal: true },
          { text: "You're right, you were fine on leases. But this is different.", pillarScores: { "Objection Prevention": 1 }, feedback: "Vague. Need to explain specifically why ownership is different.", isOptimal: false },
          { text: "Okay, if you don't want it, we'll skip it.", pillarScores: { "Objection Prevention": -3, "Upgrade Architecture": -2 }, feedback: "One objection shouldn't end the conversation.", isOptimal: false },
        ],
        wordTrack: "Exactly — and that's the key difference. On your lease, Toyota was responsible for major repairs. Now, you are. The average out-of-pocket repair at year 5 on this model is $2,200. Your VSC costs about 90 cents a day and covers all of that.",
      },
      {
        name: "Close",
        prompt: "Customer is interested but wants to think about it.",
        choices: [
          { text: "I understand wanting to think it over. Keep in mind, these rates are locked in today — if you come back later, the cost goes up because the vehicle has more miles. Package 2 gives you the best value. Want me to include it?", pillarScores: { "Menu Order": 4, "Upgrade Architecture": 5, "Objection Prevention": 4, "Coaching Cadence": 4 }, feedback: "Urgency without pressure + specific recommendation = strong close.", isOptimal: true },
          { text: "No problem, think about it and call me if you want to add anything.", pillarScores: { "Coaching Cadence": -3 }, feedback: "They'll never call back. Close now or lose it.", isOptimal: false },
          { text: "If you leave without it, you can't add it later.", pillarScores: { "Objection Prevention": -2 }, feedback: "False urgency is a compliance risk.", isOptimal: false },
        ],
        wordTrack: "I totally respect wanting to think about it. Just so you know, these coverage rates are based on today's mileage — the price increases once you drive off. Package 2 at $28/month gives you the VSC and GAP, which are the two most impactful coverages. Shall I include those?",
      },
    ],
  },
  {
    id: "first-time-buyer",
    title: "First-Time Buyer",
    description: "Young customer buying their first car. Excited but nervous about the financial commitment.",
    customerProfile: { creditScore: 670, tradeIn: "None", downPayment: "$1,500", monthlyBudget: "$400/mo", attitude: "Excited but overwhelmed", dealType: "Finance" },
    stages: [
      { name: "Greeting", prompt: "A 22-year-old walks in beaming about their first car purchase. How do you greet them?",
        choices: [
          { text: "Congratulations! Buying your first car is a big milestone. My job is to make sure you're protected and feel great about this decision.", pillarScores: { "Coaching Cadence": 5, "Objection Prevention": 4 }, feedback: "Celebratory + protective framing = perfect opening for first-time buyers.", isOptimal: true },
          { text: "Alright, let's get through this paperwork.", pillarScores: { "Coaching Cadence": -2 }, feedback: "This is a milestone moment for them. Match their energy.", isOptimal: false },
          { text: "Since this is your first car, you'll definitely need all the protection packages.", pillarScores: { "Menu Order": -2, "Objection Prevention": -1 }, feedback: "Presumptive and pushy. Educate first.", isOptimal: false },
        ],
        wordTrack: "Congratulations! Your first car — that's exciting! I'm here to walk you through everything and make sure you're fully protected. No pressure, just information so you can make the best choice.",
      },
      { name: "Needs Discovery", prompt: "They ask: 'My dad said not to buy any of the extra stuff. Is he right?'",
        choices: [
          { text: "Your dad is looking out for you! These are all optional. Let me explain what each one does and you can decide together. Knowledge is power.", pillarScores: { "Objection Prevention": 5, "Menu Order": 4, "Coaching Cadence": 3 }, feedback: "Respect the influencer, provide education, empower the decision. Perfect.", isOptimal: true },
          { text: "Your dad doesn't understand modern vehicle costs. Trust me on this.", pillarScores: { "Coaching Cadence": -4 }, feedback: "Never dismiss a customer's trusted advisor. Huge trust killer.", isOptimal: false },
          { text: "He's right — you probably don't need any of it.", pillarScores: { "Menu Order": -3 }, feedback: "Leaving a first-time buyer unprotected is a disservice.", isOptimal: false },
        ],
        wordTrack: "I love that your dad is looking out for you! He's absolutely right that these are optional. Let me show you what each product covers so you have all the facts — then you and your dad can decide together what makes sense.",
      },
      { name: "Menu Presentation", prompt: "Time to present products to someone who's never seen an F&I menu before.",
        choices: [
          { text: "Walk through the full menu slowly, using simple language and real-world examples for each product.", pillarScores: { "Menu Order": 5, "Upgrade Architecture": 4, "Coaching Cadence": 5 }, feedback: "Adjusting pace and language for the audience — excellent coaching cadence.", isOptimal: true },
          { text: "Quickly run through all products since they probably won't understand anyway.", pillarScores: { "Menu Order": -2, "Coaching Cadence": -3 }, feedback: "Rushing a first-timer creates confusion and lost opportunities.", isOptimal: false },
          { text: "Just recommend VSC and move on — keep it simple.", pillarScores: { "Menu Order": -2, "Upgrade Architecture": -2 }, feedback: "Simple doesn't mean skipping the full menu. It means explaining it clearly.", isOptimal: false },
        ],
        wordTrack: "I'm going to show you three options. Think of it like phone plans — the first one covers everything, the second covers the essentials, and the third is the basics. You pick what feels right for your budget.",
      },
      { name: "Objection Handling", prompt: "Customer: 'This is already more than I planned to spend. I can't add anything.'",
        choices: [
          { text: "I hear you — your first car is a big commitment. Let me show you: the VSC is just $0.93 a day. That's less than a vending machine snack, and it could save you thousands.", pillarScores: { "Objection Prevention": 5, "Upgrade Architecture": 4, "Coaching Cadence": 3 }, feedback: "Relatable daily cost comparison for a young buyer — excellent.", isOptimal: true },
          { text: "You can always add it later.", pillarScores: { "Objection Prevention": -2 }, feedback: "They likely can't add it later at the same price, and they won't call back.", isOptimal: false },
          { text: "If something breaks, you'll be stuck with the bill. Can you afford that?", pillarScores: { "Objection Prevention": -1 }, feedback: "Scare tactics don't work well with young buyers. They feel invincible.", isOptimal: false },
        ],
        wordTrack: "I completely understand — this is a big step! Here's the thing: the VSC works out to 93 cents a day. Think of it as the cost of a pack of gum. But if your AC compressor goes out next summer — and on this model, it's common — that's $1,800. The VSC covers it completely.",
      },
      { name: "Close", prompt: "They're interested in VSC but want to check with dad first.",
        choices: [
          { text: "That's smart! Would you like to FaceTime him now so I can answer any questions he has? I want you both to feel great about this.", pillarScores: { "Menu Order": 3, "Coaching Cadence": 5, "Objection Prevention": 5, "Upgrade Architecture": 3 }, feedback: "Including the influencer in real-time — brilliant move for first-time buyers.", isOptimal: true },
          { text: "Sure, take my card and call me after you talk to him.", pillarScores: { "Coaching Cadence": -2 }, feedback: "They won't call back. Seize the moment.", isOptimal: false },
          { text: "Your dad won't know as much about this as I do. Just trust me.", pillarScores: { "Coaching Cadence": -4, "Objection Prevention": -2 }, feedback: "Dismissing their support system is a trust destroyer.", isOptimal: false },
        ],
        wordTrack: "Great idea! Would you like to call or FaceTime him right now? I'd love to answer any questions he has directly. That way you both feel confident about this decision.",
      },
    ],
  },
  {
    id: "cash-deal",
    title: "Cash Deal Conversion",
    description: "Wealthy customer paying cash. Thinks F&I has nothing to offer them.",
    customerProfile: { creditScore: 810, tradeIn: "2023 BMW X5 — $42,000", downPayment: "Paying cash", monthlyBudget: "N/A — cash buyer", attitude: "Dismissive, in a hurry", dealType: "Cash" },
    stages: [
      { name: "Greeting", prompt: "Customer: 'I'm paying cash. I don't need financing or any extras. Where do I sign?'",
        choices: [
          { text: "That's great — paying cash puts you in a strong position. There are a few protection options that actually make even more sense for cash buyers. Can I take 5 minutes to show you?", pillarScores: { "Objection Prevention": 5, "Menu Order": 4 }, feedback: "Positioning products as cash-buyer-relevant is the key unlock.", isOptimal: true },
          { text: "Okay, let me just get the paperwork ready.", pillarScores: { "Menu Order": -4 }, feedback: "Skipping the menu on a cash deal means zero F&I income.", isOptimal: false },
          { text: "Are you sure you don't want to finance? Rates are really low right now.", pillarScores: { "Upgrade Architecture": 1 }, feedback: "They've already decided to pay cash. Respect that decision.", isOptimal: false },
        ],
        wordTrack: "Paying cash — that's fantastic. You know what that means? You're investing a significant amount of your own money in this vehicle with no lender safety net. Let me take 5 minutes to show you how to protect that investment. Fair enough?",
      },
      { name: "Menu Presentation", prompt: "You've earned 5 minutes. Present the value proposition.",
        choices: [
          { text: "Focus on VSC as investment protection: 'You're putting $65K of your own cash into this. The VSC protects that investment for pennies on the dollar.'", pillarScores: { "Menu Order": 5, "Upgrade Architecture": 5, "Objection Prevention": 4 }, feedback: "Reframing products as asset protection for a cash buyer — expert level.", isOptimal: true },
          { text: "Run through the standard menu presentation.", pillarScores: { "Menu Order": 2 }, feedback: "Standard presentation doesn't resonate with cash buyers. Customize.", isOptimal: false },
          { text: "Just mention VSC quickly and move on.", pillarScores: { "Menu Order": -1, "Upgrade Architecture": -1 }, feedback: "Cash buyers have the most to lose. Give it a proper presentation.", isOptimal: false },
        ],
        wordTrack: "You're investing $65,000 of your own money — no bank sharing the risk. If the transmission goes out at 45K miles, that's $6,800 from your pocket. The VSC locks in repair costs at today's prices. Think of it as insurance on your investment.",
      },
      { name: "Close", prompt: "Customer: 'Interesting. How much are we talking?'",
        choices: [
          { text: "The comprehensive VSC is $2,495 — less than 4% of your vehicle investment — and covers you bumper-to-bumper for 7 years. For someone paying cash, this is the smartest add.", pillarScores: { "Menu Order": 4, "Upgrade Architecture": 5, "Objection Prevention": 4, "Coaching Cadence": 4 }, feedback: "Investment percentage framing + long coverage period = compelling for cash buyers.", isOptimal: true },
          { text: "It's $2,495 plus tax.", pillarScores: { "Upgrade Architecture": 0 }, feedback: "Just stating the price without context doesn't sell the value.", isOptimal: false },
          { text: "It varies. Let me look up the exact price.", pillarScores: { "Coaching Cadence": -2 }, feedback: "Know your products and prices cold. Hesitation loses cash buyers.", isOptimal: false },
        ],
        wordTrack: "The comprehensive coverage is $2,495 — that's less than 4% of your total investment, and it covers you for 7 years or 100K miles. For someone putting in their own cash with no lender backstop, this is the smartest protection you can buy. Shall I include it?",
      },
    ],
  },
  {
    id: "high-pvr-target",
    title: "High PVR Target Deal",
    description: "A straightforward deal with a cooperative customer. Your goal: maximize PVR to $2,500+.",
    customerProfile: { creditScore: 720, tradeIn: "2020 Toyota Camry — $16,000", downPayment: "$5,000", monthlyBudget: "$600/mo", attitude: "Friendly, open-minded", dealType: "Finance" },
    stages: [
      { name: "Greeting", prompt: "A friendly customer with good credit and plenty of payment room. How do you start?",
        choices: [
          { text: "Congratulations! You picked a great vehicle. Let me show you how we can give you maximum protection and peace of mind. This should only take about 15 minutes.", pillarScores: { "Coaching Cadence": 5, "Menu Order": 4 }, feedback: "Setting expectations + positive framing = great start for a high-PVR approach.", isOptimal: true },
          { text: "Let's get through this quickly.", pillarScores: { "Menu Order": -2 }, feedback: "Rushing limits PVR. Take your time with cooperative customers.", isOptimal: false },
          { text: "I have some great products for you today.", pillarScores: { "Coaching Cadence": 1 }, feedback: "Vague. Be specific about the value you'll deliver.", isOptimal: false },
        ],
        wordTrack: "Congratulations on the new Highlander! Great choice. I'm going to take about 15 minutes to walk you through some protection options. Everything is optional, but I want you to have all the information so you can make the best decision.",
      },
      { name: "Menu Presentation", prompt: "This is your chance for a full menu presentation to a receptive customer.",
        choices: [
          { text: "Present the platinum package first ($3,200 PVR), explaining each product's value. Then work down to gold and silver.", pillarScores: { "Menu Order": 5, "Upgrade Architecture": 5, "Coaching Cadence": 4 }, feedback: "Top-down with full explanation — textbook ASURA OPS. Maximum PVR opportunity.", isOptimal: true },
          { text: "Start with the cheapest package and let them upgrade if interested.", pillarScores: { "Menu Order": -2, "Upgrade Architecture": -4 }, feedback: "Bottom-up presentation anchors low. Always start high.", isOptimal: false },
          { text: "Ask them what they want before showing the menu.", pillarScores: { "Menu Order": -3 }, feedback: "They don't know what they want until you educate them.", isOptimal: false },
        ],
        wordTrack: "Here's what I recommend for maximum protection — our Platinum package includes the VSC, GAP, tire & wheel, paint protection, and key replacement. This gives you bumper-to-bumper peace of mind. Let me explain what each one covers.",
      },
      { name: "Upgrade Architecture", prompt: "Customer is interested in the mid-tier package. How do you upgrade?",
        choices: [
          { text: "Great choice on the Gold package! For just $18 more per month, you get the paint protection and key replacement. On a $45K vehicle, the paint alone is worth it. Want me to add those?", pillarScores: { "Upgrade Architecture": 5, "Menu Order": 4, "Coaching Cadence": 4 }, feedback: "Incremental upgrade with specific dollar amount — ASURA Upgrade Architecture at its best.", isOptimal: true },
          { text: "Okay, the Gold package it is.", pillarScores: { "Upgrade Architecture": -3 }, feedback: "You left $500+ on the table. Always attempt the upgrade.", isOptimal: false },
          { text: "Are you sure you don't want Platinum? It's the best value.", pillarScores: { "Upgrade Architecture": 1 }, feedback: "Generic. Show the specific cost difference.", isOptimal: false },
        ],
        wordTrack: "The Gold package is solid. Here's what I'd suggest: for just $18 more per month, you can add paint protection. On a $45K vehicle, one door ding or shopping cart scratch can cost $800 to fix. The paint protection covers unlimited repairs for 5 years. Worth it?",
      },
      { name: "Objection Handling", prompt: "Customer: 'My wife will kill me if I add too much.'",
        choices: [
          { text: "I totally get it! Here's what I tell my customers: you're actually saving money. Without the VSC, one major repair could cost $3,000-5,000. This coverage costs $1.50 a day. Your wife will thank you when it saves you thousands.", pillarScores: { "Objection Prevention": 5, "Coaching Cadence": 4 }, feedback: "Reframing the spend as savings — addresses the spouse objection perfectly.", isOptimal: true },
          { text: "Maybe we should call your wife?", pillarScores: { "Coaching Cadence": 1 }, feedback: "Can work sometimes, but might seem like you're not addressing their concern.", isOptimal: false },
          { text: "Okay, let me reduce the package then.", pillarScores: { "Objection Prevention": -2, "Upgrade Architecture": -2 }, feedback: "Don't fold at the first mention of a spouse objection.", isOptimal: false },
        ],
        wordTrack: "I hear that all the time! Here's what usually happens: the husband comes back and thanks me because when that $4,000 repair bill came, the coverage paid for everything. You're not spending more — you're protecting your family from a surprise $5,000 bill.",
      },
      { name: "Close", prompt: "Customer is nodding along. Time to close for maximum PVR.",
        choices: [
          { text: "So here's where we are: the Platinum package puts you at $587/month — well within your budget. You get everything covered and total peace of mind. Let me finalize this for you.", pillarScores: { "Menu Order": 5, "Upgrade Architecture": 5, "Objection Prevention": 5, "Coaching Cadence": 5 }, feedback: "Assumptive close with budget fit confirmation — $2,800 PVR achieved!", isOptimal: true },
          { text: "So which package do you want?", pillarScores: { "Coaching Cadence": -1 }, feedback: "Open-ended question invites 'none.' Be assumptive.", isOptimal: false },
          { text: "I'll put you in the Silver package to keep it affordable.", pillarScores: { "Upgrade Architecture": -3, "Menu Order": -1 }, feedback: "You had Platinum buy-in and downsold yourself. Never do that.", isOptimal: false },
        ],
        wordTrack: "Perfect! Your Platinum package puts you at $587 a month — that's within your $600 budget and you get maximum coverage. I'm going to finalize this for you right now.",
      },
    ],
  },
  {
    id: "objection-gauntlet",
    title: "Objection Gauntlet",
    description: "A customer who objects to everything. Practice handling the toughest objections back-to-back.",
    customerProfile: { creditScore: 700, tradeIn: "2019 Ford F-150 — $22,000", downPayment: "$3,000", monthlyBudget: "$500/mo", attitude: "Skeptical, argumentative", dealType: "Finance" },
    stages: [
      { name: "Objection 1", prompt: "'I don't need any of this. My buddy is a mechanic.'",
        choices: [
          { text: "That's great to have a mechanic friend! Does he cover the cost of parts too? A transmission for this truck is $4,200 in parts alone. The VSC covers parts and labor at any certified shop.", pillarScores: { "Objection Prevention": 5, "Coaching Cadence": 3 }, feedback: "Acknowledge + redirect with facts. The parts cost argument wins this one.", isOptimal: true },
          { text: "Professional shops do better work than backyard mechanics.", pillarScores: { "Coaching Cadence": -3 }, feedback: "Insulting their friend's skills kills rapport.", isOptimal: false },
          { text: "Fair enough, we can skip the VSC.", pillarScores: { "Objection Prevention": -3 }, feedback: "This objection is very beatable. Don't give up.", isOptimal: false },
        ],
        wordTrack: "That's awesome to have a mechanic friend! Quick question — does he cover the cost of parts? Because a transmission for the F-150 is $4,200 just in parts. This VSC covers parts AND labor at any certified shop nationwide. Your buddy can still do the oil changes!",
      },
      { name: "Objection 2", prompt: "'I looked it up online — these products are a rip-off.'",
        choices: [
          { text: "I appreciate you doing research! Let me show you the actual claims data: our customers file an average of $3,200 in claims on a $2,495 VSC. That's a positive return. Not many investments guarantee that.", pillarScores: { "Objection Prevention": 5, "Upgrade Architecture": 4 }, feedback: "Data beats opinions. Claims data is your strongest tool.", isOptimal: true },
          { text: "You can't believe everything you read online.", pillarScores: { "Coaching Cadence": -2 }, feedback: "Dismissing their research makes you seem defensive.", isOptimal: false },
          { text: "Those articles are about aftermarket warranties. Ours is a manufacturer-backed program.", pillarScores: { "Objection Prevention": 3 }, feedback: "Good distinction but needs more data to be convincing.", isOptimal: false },
        ],
        wordTrack: "I'm glad you researched it — that tells me you're serious about making smart decisions. Here's what the data shows: our customers file an average of $3,200 in claims against a $2,495 VSC. That's a 28% return. The online articles are usually about aftermarket warranties — this is manufacturer-backed.",
      },
      { name: "Objection 3", prompt: "'I'll just use my credit card's extended warranty.'",
        choices: [
          { text: "Smart thinking! Credit card warranties are great for electronics. For vehicles, they typically cap at $500-$1,000 and don't cover wear items or electrical. Our VSC covers up to $7,500 per claim with no component exclusions.", pillarScores: { "Objection Prevention": 5, "Upgrade Architecture": 4, "Coaching Cadence": 3 }, feedback: "Comparing coverage limits shows the gap without dismissing their idea.", isOptimal: true },
          { text: "Credit card warranties don't cover cars.", pillarScores: { "Objection Prevention": 1 }, feedback: "Some do, partially. Be accurate and specific.", isOptimal: false },
          { text: "That's a great option. You probably don't need the VSC then.", pillarScores: { "Objection Prevention": -4 }, feedback: "Credit card coverage is minimal for vehicles. Don't concede this.", isOptimal: false },
        ],
        wordTrack: "That's actually a smart strategy for electronics! For vehicles, credit card extended warranties typically cap at $500-$1,000 and exclude wear items, electrical, and transmission. Our VSC covers up to $7,500 per claim with zero exclusions on covered components. Big difference when your AC compressor fails at $2,400.",
      },
      { name: "Objection 4", prompt: "'Fine, but I want to negotiate the price.'",
        choices: [
          { text: "I respect that. Here's the thing — these are set prices from the administrator, not markup. But what I can do is show you how choosing Package 2 saves you 15% vs. buying each product individually. That's the best deal I can offer.", pillarScores: { "Objection Prevention": 4, "Upgrade Architecture": 5, "Menu Order": 3 }, feedback: "Redirect from price negotiation to package value — smart pivot.", isOptimal: true },
          { text: "These prices are non-negotiable.", pillarScores: { "Coaching Cadence": -2 }, feedback: "Blunt and creates an adversarial dynamic.", isOptimal: false },
          { text: "Sure, I can take 20% off.", pillarScores: { "Upgrade Architecture": -3 }, feedback: "Discounting destroys margins and sets bad precedents.", isOptimal: false },
        ],
        wordTrack: "I appreciate you asking. These are administrator-set rates, so I can't discount the individual products. What I CAN do is show you how the package saves you 15% vs. buying each one separately. Package 2 gives you VSC, GAP, and tire & wheel — and saves you $380 compared to a la carte pricing.",
      },
      { name: "Objection 5 (Final)", prompt: "'I'm going to think about it and maybe come back.'",
        choices: [
          { text: "Absolutely, take your time. Just so you know — these rates are based on today's mileage. Once you drive off, if you decide to add coverage later, the price increases because the vehicle has more miles. I'd hate for you to pay more. What if we add just the VSC today?", pillarScores: { "Objection Prevention": 5, "Upgrade Architecture": 4, "Menu Order": 4, "Coaching Cadence": 4 }, feedback: "Legitimate urgency + compromise close (just VSC) = strong finish.", isOptimal: true },
          { text: "No problem, here's my card.", pillarScores: { "Coaching Cadence": -3 }, feedback: "They will never call back. This is your last chance.", isOptimal: false },
          { text: "You need to decide now or the offer expires.", pillarScores: { "Objection Prevention": -3 }, feedback: "False urgency is a compliance risk.", isOptimal: false },
        ],
        wordTrack: "I respect that. Here's the one thing I want you to know: this pricing is locked to today's mileage. If you come back in 2 months with 3,000 more miles, the same VSC costs about $300 more. If nothing else, let me lock in just the VSC today at this rate. Deal?",
      },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────
function loadProgress(): Progress[] {
  try {
    const raw = localStorage.getItem("trainer-mode-progress");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProgress(progress: Progress[]) {
  localStorage.setItem("trainer-mode-progress", JSON.stringify(progress));
}

// ── Component ─────────────────────────────────────────────────────
export default function TrainerMode() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [chosenIndexes, setChosenIndexes] = useState<number[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showWordTrack, setShowWordTrack] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [progress, setProgress] = useState<Progress[]>(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const totalPossible = useMemo(() => {
    if (!selectedScenario) return 0;
    return selectedScenario.stages.reduce((sum, stage) => {
      const best = stage.choices.find((c) => c.isOptimal);
      if (!best) return sum;
      return sum + Object.values(best.pillarScores).reduce((a, b) => a + b, 0);
    }, 0);
  }, [selectedScenario]);

  const currentTotal = Object.values(scores).reduce((a, b) => a + b, 0);
  const pct = totalPossible > 0 ? Math.round((currentTotal / totalPossible) * 100) : 0;
  const isTop1 = pct >= 85;

  const handleChoose = (choiceIdx: number) => {
    if (!selectedScenario) return;
    const choice = selectedScenario.stages[currentStage].choices[choiceIdx];
    const newScores = { ...scores };
    for (const [pillar, pts] of Object.entries(choice.pillarScores)) {
      newScores[pillar] = (newScores[pillar] || 0) + pts;
    }
    setScores(newScores);
    setChosenIndexes([...chosenIndexes, choiceIdx]);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (!selectedScenario) return;
    setShowFeedback(false);
    setShowWordTrack(false);
    if (currentStage + 1 >= selectedScenario.stages.length) {
      // Scenario complete
      setShowSummary(true);
      const total = Object.values(scores).reduce((a, b) => a + b, 0);
      const pctScore = totalPossible > 0 ? Math.round((total / totalPossible) * 100) : 0;
      setProgress((prev) => {
        const existing = prev.find((p) => p.scenarioId === selectedScenario.id);
        if (existing) {
          return prev.map((p) =>
            p.scenarioId === selectedScenario.id
              ? { ...p, completed: true, highScore: Math.max(p.highScore, pctScore) }
              : p
          );
        }
        return [...prev, { scenarioId: selectedScenario.id, completed: true, highScore: pctScore }];
      });
    } else {
      setCurrentStage(currentStage + 1);
    }
  };

  const handleReset = () => {
    setSelectedScenario(null);
    setCurrentStage(0);
    setScores({});
    setChosenIndexes([]);
    setShowFeedback(false);
    setShowWordTrack(false);
    setShowSummary(false);
  };

  // ── Scenario Selector ─────────────────────────────────────────
  if (!selectedScenario) {
    return (
      <AppLayout title="F&I Trainer Mode" subtitle="Practice F&I scenarios with ASURA OPS-aligned coaching">
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  Completed: {progress.filter((p) => p.completed).length}/{SCENARIOS.length}
                </span>
                {progress.length > 0 && (
                  <span className="text-muted-foreground">
                    Best Score: {Math.max(...progress.map((p) => p.highScore), 0)}%
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scenario Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SCENARIOS.map((scenario) => {
              const prog = progress.find((p) => p.scenarioId === scenario.id);
              return (
                <Card
                  key={scenario.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => {
                    setSelectedScenario(scenario);
                    setCurrentStage(0);
                    setScores({});
                    setChosenIndexes([]);
                    setShowFeedback(false);
                    setShowWordTrack(false);
                    setShowSummary(false);
                  }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <GraduationCap className="h-6 w-6 text-primary" />
                      {prog?.completed && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {prog.highScore}%
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{scenario.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{scenario.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{scenario.stages.length} stages</span>
                      <span className="text-muted-foreground/50">|</span>
                      <span>{scenario.customerProfile.dealType}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Trainer Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5 text-blue-500" />
                Trainer Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Each scenario tests alignment with the 4 ASURA OPS pillars:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                {PILLARS.map((p) => {
                  const Icon = PILLAR_ICONS[p];
                  return (
                    <div key={p} className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${PILLAR_COLORS[p]}`} />
                      <span className="text-xs font-medium">{p}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3">Score 85%+ to reach the Top 1% benchmark. Use "Show Word Track" at any stage to see the recommended script.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // ── Summary Screen ────────────────────────────────────────────
  if (showSummary) {
    const pillarBreakdown = PILLARS.map((p) => ({
      pillar: p,
      score: scores[p] || 0,
    }));
    const sortedPillars = [...pillarBreakdown].sort((a, b) => b.score - a.score);

    return (
      <AppLayout title="Scenario Complete" subtitle={selectedScenario.title}>
        <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
          {/* Score Header */}
          <Card>
            <CardContent className="p-8 text-center">
              <div className={`text-6xl font-bold mb-2 ${isTop1 ? "text-emerald-500" : pct >= 60 ? "text-yellow-500" : "text-red-500"}`}>
                {pct}%
              </div>
              <p className="text-lg font-medium mb-1">
                {isTop1 ? "Top 1% Performance!" : pct >= 60 ? "Good Effort" : "Needs Improvement"}
              </p>
              {isTop1 && (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Award className="h-3 w-3 mr-1" />
                  Top 1% Benchmark Achieved
                </Badge>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Total Score: {currentTotal} / {totalPossible} points
              </p>
            </CardContent>
          </Card>

          {/* Pillar Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pillar Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedPillars.map((p) => {
                  const Icon = PILLAR_ICONS[p.pillar];
                  return (
                    <div key={p.pillar} className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${PILLAR_COLORS[p.pillar]}`} />
                      <span className="text-sm font-medium w-44">{p.pillar}</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${p.score > 0 ? "bg-primary" : "bg-red-500"}`}
                          style={{ width: `${Math.max(0, Math.min(100, (p.score / (totalPossible / 4)) * 100))}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono w-12 text-right">{p.score}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Top 3 Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm list-decimal list-inside">
                {sortedPillars.length > 0 && sortedPillars[sortedPillars.length - 1].score < (totalPossible / 4) * 0.6 && (
                  <li>Focus on <strong>{sortedPillars[sortedPillars.length - 1].pillar}</strong> — your weakest area. Review the word tracks for this pillar.</li>
                )}
                {!isTop1 && <li>Aim for 85%+ to hit the Top 1% benchmark. Review optimal choices and practice the word tracks.</li>}
                <li>Practice this scenario again to improve muscle memory. Repetition builds confidence.</li>
                {sortedPillars.length > 1 && sortedPillars[0].score > 0 && (
                  <li>Your strongest pillar is <strong>{sortedPillars[0].pillar}</strong> — keep leveraging this strength across all scenarios.</li>
                )}
              </ol>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setCurrentStage(0);
                setScores({});
                setChosenIndexes([]);
                setShowFeedback(false);
                setShowWordTrack(false);
                setShowSummary(false);
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Retry Scenario
            </button>
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-muted text-foreground px-4 py-3 text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              All Scenarios
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Active Scenario Stage ─────────────────────────────────────
  const stage = selectedScenario.stages[currentStage];
  const chosenIdx = chosenIndexes[currentStage];

  return (
    <AppLayout title={selectedScenario.title} subtitle={`Stage ${currentStage + 1} of ${selectedScenario.stages.length}: ${stage.name}`}>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-muted rounded-full h-2">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${((currentStage + (showFeedback ? 1 : 0)) / selectedScenario.stages.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {currentStage + 1}/{selectedScenario.stages.length}
          </span>
          <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Running Score */}
        <div className="flex items-center gap-4">
          {PILLARS.map((p) => {
            const Icon = PILLAR_ICONS[p];
            const val = scores[p] || 0;
            return (
              <div key={p} className="flex items-center gap-1">
                <Icon className={`h-3.5 w-3.5 ${PILLAR_COLORS[p]}`} />
                <span className="text-xs font-mono">{val}</span>
              </div>
            );
          })}
          <div className="ml-auto text-xs text-muted-foreground">
            Total: <span className="font-bold text-foreground">{currentTotal}</span>
          </div>
        </div>

        {/* Customer Profile */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div><span className="text-muted-foreground">Credit Score:</span> <span className="font-medium">{selectedScenario.customerProfile.creditScore}</span></div>
              <div><span className="text-muted-foreground">Trade-In:</span> <span className="font-medium">{selectedScenario.customerProfile.tradeIn}</span></div>
              <div><span className="text-muted-foreground">Down Payment:</span> <span className="font-medium">{selectedScenario.customerProfile.downPayment}</span></div>
              <div><span className="text-muted-foreground">Monthly Budget:</span> <span className="font-medium">{selectedScenario.customerProfile.monthlyBudget}</span></div>
              <div><span className="text-muted-foreground">Attitude:</span> <span className="font-medium">{selectedScenario.customerProfile.attitude}</span></div>
              <div><span className="text-muted-foreground">Deal Type:</span> <span className="font-medium">{selectedScenario.customerProfile.dealType}</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Stage Prompt */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              {stage.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium mb-4">{stage.prompt}</p>

            <div className="space-y-2">
              {stage.choices.map((choice, idx) => {
                const isChosen = chosenIdx === idx;
                const revealed = showFeedback;
                return (
                  <button
                    key={idx}
                    onClick={() => !showFeedback && handleChoose(idx)}
                    disabled={showFeedback}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
                      revealed && isChosen && choice.isOptimal
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : revealed && isChosen && !choice.isOptimal
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                        : revealed && choice.isOptimal
                        ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-900/10"
                        : !revealed
                        ? "border-border hover:border-primary/50 hover:bg-accent cursor-pointer"
                        : "border-border opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {revealed && choice.isOptimal && <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />}
                      {revealed && isChosen && !choice.isOptimal && <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
                      <span>{choice.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Feedback Panel */}
        {showFeedback && (
          <Card className="border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-2 mb-3">
                <Eye className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">Feedback</p>
                  <p className="text-sm text-muted-foreground">{stage.choices[chosenIdx].feedback}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.entries(stage.choices[chosenIdx].pillarScores).map(([pillar, pts]) => (
                  <Badge key={pillar} variant="secondary" className={pts > 0 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}>
                    {pillar}: {pts > 0 ? "+" : ""}{pts}
                  </Badge>
                ))}
              </div>

              {/* Word Track Toggle */}
              <button
                onClick={() => setShowWordTrack(!showWordTrack)}
                className="text-xs text-primary hover:underline flex items-center gap-1 mb-3"
              >
                <BookOpen className="h-3 w-3" />
                {showWordTrack ? "Hide" : "Show"} Word Track
              </button>
              {showWordTrack && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm italic text-blue-800 dark:text-blue-300">
                  "{stage.wordTrack}"
                </div>
              )}

              <button
                onClick={handleNext}
                className="mt-4 flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {currentStage + 1 >= selectedScenario.stages.length ? "View Results" : "Next Stage"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
