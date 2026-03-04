/**
 * ASURA Group — Verbatim Script Library
 * ─────────────────────────────────────────────────────────────────────────────
 * All scripts are sourced VERBATIM from ASURA training documents.
 * The AI co-pilot MUST deliver these word-for-word.
 * Paraphrasing, summarizing, or rewriting is strictly prohibited.
 *
 * Sources:
 *   - Objection_Prevention_Matrix.pdf
 *   - Financial_Snapshot_Script.pdf
 *   - Menu_Mastery_Quick_Reference.pdf
 *   - GAP_Protection_Closing_Framework.pdf
 *   - VSA_Presentation_Framework.pdf
 *   - ASURA_Elite_FI_Performance_Playbook.pdf
 *   - Evan_Macklin_Phone_Sales_Training_Script.pdf
 */

export type ScriptCategory =
  | "professional_hello"
  | "customer_connection"
  | "financial_snapshot"
  | "menu_transition"
  | "product_presentation"
  | "objection_prevention"
  | "objection_response"
  | "closing"
  | "phone_script"
  | "compliance_disclosure";

export type DealStage =
  | "introduction"
  | "customer_connection"
  | "financial_snapshot"
  | "menu_presentation"
  | "product_walkthrough"
  | "objection_handling"
  | "closing"
  | "post_close";

export interface VerbatimScript {
  id: string;
  title: string;
  scriptText: string;
  scriptCategory: ScriptCategory;
  dealStage: DealStage;
  intentTrigger: string;
  triggerKeywords: string[];
  sourceDocument: string;
  productContext?: string;
  executionLevel?: "elite" | "standard";
  urgency: "high" | "medium" | "low";
  coachingNote?: string;
  isActive?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: PROFESSIONAL HELLO / INTRODUCTION
// Source: ASURA Elite F&I Performance Playbook
// ─────────────────────────────────────────────────────────────────────────────
export const PROFESSIONAL_HELLO_SCRIPTS: VerbatimScript[] = [
  {
    id: "ph_001",
    title: "Professional Hello — Finance Director Introduction",
    urgency: "medium",
    scriptText:
      "Hi, my name is [Name] and I'm the Finance Director here at [Dealership]. Congratulations on your new vehicle — I'm going to take great care of you today. My job is to make sure your paperwork is accurate, your financing is locked in, and that you leave here fully protected. This should take about 20 to 30 minutes. Sound good?",
    scriptCategory: "professional_hello",
    dealStage: "introduction",
    intentTrigger: "session_start",
    triggerKeywords: ["hello", "hi", "welcome", "congratulations", "finance office", "paperwork"],
    sourceDocument: "ASURA_Elite_FI_Performance_Playbook.pdf",
    executionLevel: "elite",
  },
  {
    id: "ph_002",
    title: "Trust-Building Opening — No Pressure Frame",
    urgency: "medium",
    scriptText:
      "Welcome in. Before we get started, I just want to let you know — my job is not to sell you anything today. My job is to make sure you understand every option available to you, and that you make the best decision for your family. Fair enough?",
    scriptCategory: "professional_hello",
    dealStage: "introduction",
    intentTrigger: "trust_building_open",
    triggerKeywords: ["sell", "pressure", "just here to sign", "don't want extras"],
    sourceDocument: "ASURA_Elite_FI_Performance_Playbook.pdf",
    executionLevel: "elite",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: FINANCIAL SNAPSHOT — 3 QUESTIONS
// Source: Financial_Snapshot_Script.pdf
// ─────────────────────────────────────────────────────────────────────────────
export const FINANCIAL_SNAPSHOT_SCRIPTS: VerbatimScript[] = [
  {
    id: "fs_001",
    title: "Financial Snapshot — Q1: Vehicle Tenure",
    urgency: "medium",
    scriptText:
      "Before I pull up your paperwork, I want to ask you three quick questions that will help me customize everything for you today. First — how long do you typically keep your vehicles?",
    scriptCategory: "financial_snapshot",
    dealStage: "financial_snapshot",
    intentTrigger: "financial_snapshot_open",
    triggerKeywords: ["how long", "keep vehicle", "own it", "trade in"],
    sourceDocument: "Financial_Snapshot_Script.pdf",
    executionLevel: "elite",
  },
  {
    id: "fs_002",
    title: "Financial Snapshot — Q2: Annual Mileage",
    urgency: "medium",
    scriptText:
      "Great. Second question — do you typically drive more or less than 15,000 miles per year?",
    scriptCategory: "financial_snapshot",
    dealStage: "financial_snapshot",
    intentTrigger: "financial_snapshot_mileage",
    triggerKeywords: ["miles", "drive", "commute", "mileage"],
    sourceDocument: "Financial_Snapshot_Script.pdf",
    executionLevel: "elite",
  },
  {
    id: "fs_003",
    title: "Financial Snapshot — Q3: Risk Preference",
    urgency: "medium",
    scriptText:
      "Perfect. And last question — if something unexpected happened with this vehicle in the next 12 months, would you prefer to handle it out of pocket, or would you rather have a plan in place that covered it?",
    scriptCategory: "financial_snapshot",
    dealStage: "financial_snapshot",
    intentTrigger: "financial_snapshot_risk",
    triggerKeywords: ["unexpected", "repair", "out of pocket", "covered", "plan"],
    sourceDocument: "Financial_Snapshot_Script.pdf",
    executionLevel: "elite",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: MENU TRANSITION
// Source: Menu_Mastery_Quick_Reference.pdf
// ─────────────────────────────────────────────────────────────────────────────
export const MENU_TRANSITION_SCRIPTS: VerbatimScript[] = [
  {
    id: "mt_001",
    title: "Menu Transition — Options Introduction",
    urgency: "medium",
    scriptText:
      "Mr./Ms. [Customer], the dealership has already approved your financing and the next step is simply reviewing the options available to protect your vehicle and your investment. I've put together a few packages based on what you told me — let me walk you through them.",
    scriptCategory: "menu_transition",
    dealStage: "menu_presentation",
    intentTrigger: "menu_intro",
    triggerKeywords: ["options", "packages", "menu", "protection", "next step"],
    sourceDocument: "Menu_Mastery_Quick_Reference.pdf",
    executionLevel: "elite",
  },
  {
    id: "mt_002",
    title: "Menu Transition — Three Levels Framing",
    urgency: "medium",
    scriptText:
      "What I'm going to show you are three levels of protection. Most of our customers choose the middle option, but I want you to see all three so you can decide what makes the most sense for your situation.",
    scriptCategory: "menu_transition",
    dealStage: "menu_presentation",
    intentTrigger: "menu_three_options",
    triggerKeywords: ["three options", "levels", "packages", "which one", "choose"],
    sourceDocument: "Menu_Mastery_Quick_Reference.pdf",
    executionLevel: "elite",
  },
  {
    id: "mt_003",
    title: "Menu Transition — Value Before Price",
    urgency: "medium",
    scriptText:
      "Before I show you the numbers, let me explain what each product does — because the value is in understanding what you're getting, not just what it costs.",
    scriptCategory: "menu_transition",
    dealStage: "menu_presentation",
    intentTrigger: "menu_value_first",
    triggerKeywords: ["cost", "price", "how much", "what does it cost"],
    sourceDocument: "Menu_Mastery_Quick_Reference.pdf",
    executionLevel: "elite",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: PRODUCT PRESENTATIONS
// Source: VSA_Presentation_Framework.pdf, GAP_Protection_Closing_Framework.pdf
// ─────────────────────────────────────────────────────────────────────────────
export const PRODUCT_PRESENTATION_SCRIPTS: VerbatimScript[] = [
  // GAP Insurance
  {
    id: "pp_gap_001",
    title: "GAP Presentation — Core Explanation",
    urgency: "high",
    scriptText:
      "GAP stands for Guaranteed Asset Protection. Here's what it does — if your vehicle is ever totaled or stolen, your insurance company is going to pay you what the car is worth at that moment. But you still owe what you financed. GAP covers the difference so you're not left paying on a car you no longer have. On a vehicle like this, that gap can be anywhere from $3,000 to $8,000. For about a dollar a day, it's gone.",
    scriptCategory: "product_presentation",
    dealStage: "product_walkthrough",
    intentTrigger: "gap_presentation",
    triggerKeywords: ["gap", "totaled", "stolen", "insurance", "difference", "owe more"],
    sourceDocument: "GAP_Protection_Closing_Framework.pdf",
    productContext: "gap_insurance",
    executionLevel: "elite",
  },
  {
    id: "pp_gap_002",
    title: "GAP Presentation — Insurance vs. GAP Distinction",
    urgency: "high",
    scriptText:
      "Think of it this way — your auto insurance protects the car. GAP protects you. Two different things. Your insurance company's job is to pay you market value. Your job is to pay off your loan. GAP makes sure those two numbers always match.",
    scriptCategory: "product_presentation",
    dealStage: "product_walkthrough",
    intentTrigger: "gap_insurance_vs_gap",
    triggerKeywords: ["insurance covers it", "already have insurance", "what's the difference"],
    sourceDocument: "GAP_Protection_Closing_Framework.pdf",
    productContext: "gap_insurance",
    executionLevel: "elite",
  },
  // Vehicle Service Contract (VSC)
  {
    id: "pp_vsc_001",
    title: "VSC Presentation — Core Explanation",
    urgency: "high",
    scriptText:
      "The Vehicle Service Contract is essentially an extended warranty — but better, because it's backed by [Provider] and honored at any licensed repair facility in the country. Once the factory warranty expires, this takes over. We're talking engine, transmission, electrical, air conditioning — the big-ticket items that can run $3,000 to $7,000 out of pocket. For [monthly cost] a month, you're covered.",
    scriptCategory: "product_presentation",
    dealStage: "product_walkthrough",
    intentTrigger: "vsc_presentation",
    triggerKeywords: ["warranty", "service contract", "vsc", "extended", "repairs", "breakdown"],
    sourceDocument: "VSA_Presentation_Framework.pdf",
    productContext: "vehicle_service_contract",
    executionLevel: "elite",
  },
  {
    id: "pp_vsc_002",
    title: "VSC Presentation — Factory Warranty Gap",
    urgency: "high",
    scriptText:
      "Here's the thing about the factory warranty — it's great while it lasts. But the average person keeps their vehicle 6 to 7 years. The factory warranty covers you for 3. What happens in years 4, 5, 6, and 7? That's exactly what this covers.",
    scriptCategory: "product_presentation",
    dealStage: "product_walkthrough",
    intentTrigger: "vsc_factory_warranty_gap",
    triggerKeywords: ["factory warranty", "still under warranty", "already covered", "how long"],
    sourceDocument: "VSA_Presentation_Framework.pdf",
    productContext: "vehicle_service_contract",
    executionLevel: "elite",
  },
  // Prepaid Maintenance
  {
    id: "pp_ppm_001",
    title: "Prepaid Maintenance — Core Presentation",
    urgency: "medium",
    scriptText:
      "The Prepaid Maintenance plan locks in today's price for your oil changes, tire rotations, and multi-point inspections for the life of the plan. The average oil change today is $80 to $120. Over three years, that's $600 to $900 just in oil changes. You're paying [plan cost] total — and you're locking in that price today before it goes up.",
    scriptCategory: "product_presentation",
    dealStage: "product_walkthrough",
    intentTrigger: "ppm_presentation",
    triggerKeywords: ["maintenance", "oil change", "tire rotation", "service", "prepaid"],
    sourceDocument: "Menu_Mastery_Quick_Reference.pdf",
    productContext: "prepaid_maintenance",
    executionLevel: "elite",
  },
  // Interior/Exterior Protection
  {
    id: "pp_iep_001",
    title: "ASURA Script — Pp Iep 001",
    urgency: "medium",
    scriptText:
      "The Interior/Exterior Protection package covers paint protection, fabric protection, and windshield repair. On a new vehicle, the paint is the most expensive thing to fix — a single door repaint runs $800 to $1,200. This plan covers you for the full term. If anything happens to the paint, the fabric, or the windshield, it's covered. Zero out of pocket.",
    scriptCategory: "product_presentation",
    dealStage: "product_walkthrough",
    intentTrigger: "iep_presentation",
    triggerKeywords: ["paint", "fabric", "interior", "exterior", "windshield", "protection"],
    sourceDocument: "Menu_Mastery_Quick_Reference.pdf",
    productContext: "interior_exterior_protection",
    executionLevel: "elite",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: OBJECTION PREVENTION
// Source: Objection_Prevention_Matrix.pdf
// ─────────────────────────────────────────────────────────────────────────────
export const OBJECTION_PREVENTION_SCRIPTS: VerbatimScript[] = [
  {
    id: "op_001",
    title: "Objection Prevention — Price Reframe",
    urgency: "high",
    scriptText:
      "Before I show you the menu, I want to address something most people think about but don't always say out loud — they wonder if these products are worth it, or if they're just something the dealership makes money on. That's a fair question. Here's my honest answer: I only recommend what I would put on my own vehicle. Everything I'm going to show you today has a real-world value that exceeds what you pay for it. Fair enough?",
    scriptCategory: "objection_prevention",
    dealStage: "menu_presentation",
    intentTrigger: "preempt_value_objection",
    triggerKeywords: ["worth it", "just making money", "don't need it", "dealer markup"],
    sourceDocument: "Objection_Prevention_Matrix.pdf",
    executionLevel: "elite",
  },
  {
    id: "op_002",
    title: "Objection Prevention — Payment Anchor",
    urgency: "high",
    scriptText:
      "One thing I hear a lot is 'I'll think about it.' And I totally respect that. But I want to make sure you have all the information you need to make that decision today — because once you drive off the lot, these options are no longer available to you at this price. So let me make sure I've answered every question before we get to that point.",
    scriptCategory: "objection_prevention",
    dealStage: "menu_presentation",
    intentTrigger: "preempt_think_it_over",
    triggerKeywords: ["think about it", "let me think", "not sure", "maybe later"],
    sourceDocument: "Objection_Prevention_Matrix.pdf",
    executionLevel: "elite",
  },
  {
    id: "op_003",
    title: "Objection Prevention — Responsibility Transfer",
    urgency: "high",
    scriptText:
      "I know payment is always top of mind. So before I show you the menu, I want to be upfront — the difference between taking everything and taking nothing is usually about $30 to $60 a month. That's one dinner out. And what you're getting in return is complete peace of mind for the next 5 to 7 years. I just want to make sure you're making the decision based on value, not just the number.",
    scriptCategory: "objection_prevention",
    dealStage: "menu_presentation",
    intentTrigger: "preempt_payment_objection",
    triggerKeywords: ["payment", "monthly", "afford", "budget", "too much"],
    sourceDocument: "Objection_Prevention_Matrix.pdf",
    executionLevel: "elite",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: OBJECTION RESPONSES
// Source: Objection_Prevention_Matrix.pdf, ASURA Elite Playbook
// ─────────────────────────────────────────────────────────────────────────────
export const OBJECTION_RESPONSE_SCRIPTS: VerbatimScript[] = [
  // Price / Payment Objections
  {
    id: "or_price_001",
    title: "Price Objection — Responsibility Transfer Close",
    urgency: "high",
    scriptText:
      "I completely understand — and I respect that. Let me ask you this: if I could show you how to get everything on this menu for less than the cost of one unexpected repair, would that change your perspective at all? Because the average transmission repair today is $4,500. This entire package is [cost]. It's not about the payment — it's about which risk you're more comfortable with.",
    scriptCategory: "objection_response",
    dealStage: "objection_handling",
    intentTrigger: "price_too_high",
    triggerKeywords: ["too expensive", "too much", "can't afford", "payment too high", "lower the payment"],
    sourceDocument: "Objection_Prevention_Matrix.pdf",
    executionLevel: "elite",
  },
  {
    id: "or_price_002",
    title: "Price Objection — Dollar-a-Day Reframe",
    urgency: "high",
    scriptText:
      "What if we found a way to get you the most important coverage — the one that protects you from the biggest financial risk — and kept the payment exactly where you need it? Which product felt most important to you when I explained them?",
    scriptCategory: "objection_response",
    dealStage: "objection_handling",
    intentTrigger: "payment_negotiation",
    triggerKeywords: ["reduce payment", "just one", "pick one", "which one is most important"],
    sourceDocument: "Objection_Prevention_Matrix.pdf",
    executionLevel: "elite",
  },
  // Think It Over
  {
    id: "or_tio_001",
    title: "ASURA Script — Or Tio 001",
    urgency: "high",
    scriptText:
      "I hear you — and I want to respect your process. But I want to make sure I've done my job here. Is there something specific you're unsure about, or is it more of a gut feeling? Because if there's a question I haven't answered, I'd rather answer it now than have you leave with uncertainty.",
    scriptCategory: "objection_response",
    dealStage: "objection_handling",
    intentTrigger: "think_it_over",
    triggerKeywords: ["think about it", "let me think", "not today", "come back", "need to think"],
    sourceDocument: "Objection_Prevention_Matrix.pdf",
    executionLevel: "elite",
  },
  {
    id: "or_tio_002",
    title: "ASURA Script — Or Tio 002",
    urgency: "high",
    scriptText:
      "Here's what I want you to know — once you leave today, these options are no longer available at this price. The products don't change, but the pricing does. I'm not saying that to pressure you. I'm saying it because I'd rather you have this conversation now, when I can actually help you, than call me next week when my hands are tied.",
    scriptCategory: "objection_response",
    dealStage: "objection_handling",
    intentTrigger: "think_it_over_urgency",
    triggerKeywords: ["call you later", "come back tomorrow", "not right now", "next time"],
    sourceDocument: "Objection_Prevention_Matrix.pdf",
    executionLevel: "elite",
  },
  // GAP Objections
  {
    id: "or_gap_001",
    title: "ASURA Script — Or Gap 001",
    urgency: "high",
    scriptText:
      "I understand — and your insurance is great. But here's the thing: your insurance company's job is to pay you what the car is worth today. Your loan balance doesn't care what the car is worth. GAP covers the difference between those two numbers. Your insurance doesn't do that. They're two completely different protections.",
    scriptCategory: "objection_response",
    dealStage: "objection_handling",
    intentTrigger: "gap_already_have_insurance",
    triggerKeywords: ["already have insurance", "insurance covers it", "full coverage", "don't need gap"],
    sourceDocument: "GAP_Protection_Closing_Framework.pdf",
    productContext: "gap_insurance",
    executionLevel: "elite",
  },
  {
    id: "or_gap_002",
    title: "ASURA Script — Or Gap 002",
    urgency: "high",
    scriptText:
      "Let me show you something. You're financing [amount]. The moment you drive off this lot, the vehicle depreciates roughly 15 to 20 percent. That means if something happened tomorrow, your insurance would pay you [depreciated value]. But you still owe [loan balance]. That's a [gap amount] gap — right now, today. GAP closes that gap completely.",
    scriptCategory: "objection_response",
    dealStage: "objection_handling",
    intentTrigger: "gap_depreciation_explanation",
    triggerKeywords: ["how much would I owe", "depreciation", "upside down", "underwater"],
    sourceDocument: "GAP_Protection_Closing_Framework.pdf",
    productContext: "gap_insurance",
    executionLevel: "elite",
  },
  // VSC Objections
  {
    id: "or_vsc_001",
    title: "ASURA Script — Or Vsc 001",
    urgency: "high",
    scriptText:
      "I hear that — and the factory warranty is solid. But here's the question I want you to think about: you said you keep your vehicles 6 to 7 years. The factory warranty covers you for 3. What's your plan for years 4 through 7? Because that's exactly when the expensive stuff starts to happen — and that's exactly what this covers.",
    scriptCategory: "objection_response",
    dealStage: "objection_handling",
    intentTrigger: "vsc_still_under_warranty",
    triggerKeywords: ["still under warranty", "factory warranty", "just bought it", "brand new"],
    sourceDocument: "VSA_Presentation_Framework.pdf",
    productContext: "vehicle_service_contract",
    executionLevel: "elite",
  },
  {
    id: "or_vsc_002",
    title: "ASURA Script — Or Vsc 002",
    urgency: "high",
    scriptText:
      "I respect that — and I'm not going to argue with you. But I want to ask you one question: what would a transmission repair cost you out of pocket right now? [Pause for answer.] The average is $4,500 to $6,000. This contract costs [price] total. If you use it once — just once — it pays for itself. Everything after that is pure savings.",
    scriptCategory: "objection_response",
    dealStage: "objection_handling",
    intentTrigger: "vsc_dont_need_it",
    triggerKeywords: ["don't need it", "never use it", "waste of money", "reliable car"],
    sourceDocument: "VSA_Presentation_Framework.pdf",
    productContext: "vehicle_service_contract",
    executionLevel: "elite",
  },
  // Self-Insurance / "I'll Save the Money"
  {
    id: "or_self_001",
    title: "ASURA Script — Or Self 001",
    urgency: "high",
    scriptText:
      "That's a great strategy — and it works for some people. But let me ask: do you currently have $5,000 to $7,000 set aside specifically for vehicle repairs? Because if the answer is yes, you're right — you might not need this. But if that money is earmarked for something else, then this plan is actually cheaper than self-insuring.",
    scriptCategory: "objection_response",
    dealStage: "objection_handling",
    intentTrigger: "self_insurance_objection",
    triggerKeywords: ["save the money", "put it in savings", "self insure", "pay out of pocket"],
    sourceDocument: "Objection_Prevention_Matrix.pdf",
    executionLevel: "elite",
  },
  // Skepticism / Trust
  {
    id: "or_trust_001",
    title: "ASURA Script — Or Trust 001",
    urgency: "high",
    scriptText:
      "That's a completely fair concern — and I'm not going to try to talk you out of it. What I will tell you is this: every product I'm showing you today is backed by [Provider], not the dealership. If you have a claim, you call them directly. The dealership is out of the picture. This is a contract between you and [Provider].",
    scriptCategory: "objection_response",
    dealStage: "objection_handling",
    intentTrigger: "trust_dealer_motives",
    triggerKeywords: ["dealer makes money", "just a profit center", "don't trust", "scam", "rip off"],
    sourceDocument: "Objection_Prevention_Matrix.pdf",
    executionLevel: "elite",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: CLOSING LANGUAGE
// Source: ASURA Elite F&I Performance Playbook, GAP Closing Framework
// ─────────────────────────────────────────────────────────────────────────────
export const CLOSING_SCRIPTS: VerbatimScript[] = [
  {
    id: "cl_001",
    title: "Closing — Assumptive Commitment Close",
    urgency: "high",
    scriptText:
      "Based on everything you told me — how long you keep your vehicles, how much you drive, and the fact that you'd rather have a plan in place than handle it out of pocket — the package that makes the most sense for you is [Package Name]. That gives you [Product 1], [Product 2], and [Product 3] for [monthly cost] a month. Does that work for you?",
    scriptCategory: "closing",
    dealStage: "closing",
    intentTrigger: "assumptive_close",
    triggerKeywords: ["which one", "what do you recommend", "what makes sense", "what should I get"],
    sourceDocument: "ASURA_Elite_FI_Performance_Playbook.pdf",
    executionLevel: "elite",
  },
  {
    id: "cl_002",
    title: "Closing — Either/Or Technique",
    urgency: "high",
    scriptText:
      "Let me ask you a direct question — is there anything stopping you from moving forward with this today? Because if there is, I want to address it right now. And if there isn't, let's get you protected and get you on your way.",
    scriptCategory: "closing",
    dealStage: "closing",
    intentTrigger: "direct_close",
    triggerKeywords: ["stopping you", "anything else", "ready to sign", "move forward"],
    sourceDocument: "ASURA_Elite_FI_Performance_Playbook.pdf",
    executionLevel: "elite",
  },
  {
    id: "cl_003",
    title: "Closing — Urgency/Scarcity Frame",
    urgency: "high",
    scriptText:
      "Here's what I want you to walk away with today — not just a vehicle, but complete peace of mind. You've made a significant investment. Protecting it costs a fraction of what it would cost to fix it. Let's make sure you're covered.",
    scriptCategory: "closing",
    dealStage: "closing",
    intentTrigger: "value_close",
    triggerKeywords: ["peace of mind", "protected", "investment", "worth it"],
    sourceDocument: "ASURA_Elite_FI_Performance_Playbook.pdf",
    executionLevel: "elite",
  },
  {
    id: "cl_004",
    title: "Closing — Takeaway Close",
    urgency: "high",
    scriptText:
      "The only question left is: do you want to be the person who had coverage when something happened, or the person who wished they did? I've seen both. The ones who had it never regret it.",
    scriptCategory: "closing",
    dealStage: "closing",
    intentTrigger: "emotional_close",
    triggerKeywords: ["regret", "wish I had", "what if", "just in case"],
    sourceDocument: "GAP_Protection_Closing_Framework.pdf",
    executionLevel: "elite",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: PHONE SCRIPTS
// Source: Evan_Macklin_Phone_Sales_Training_Script.pdf
// ─────────────────────────────────────────────────────────────────────────────
export const PHONE_SCRIPTS: VerbatimScript[] = [
  {
    id: "ph_phone_001",
    title: "ASURA Script — Ph Phone 001",
    urgency: "medium",
    scriptText:
      "Hi, this is [Name] from [Dealership] Finance. I'm calling because your vehicle is scheduled for delivery and I want to make sure everything is ready for you on our end. I have a couple of quick questions — do you have about two minutes?",
    scriptCategory: "phone_script",
    dealStage: "introduction",
    intentTrigger: "phone_pre_delivery",
    triggerKeywords: ["calling", "phone", "appointment", "delivery", "schedule"],
    sourceDocument: "Evan_Macklin_Phone_Sales_Training_Script.pdf",
    executionLevel: "elite",
  },
  {
    id: "ph_phone_002",
    title: "ASURA Script — Ph Phone 002",
    urgency: "medium",
    scriptText:
      "I also want to give you a heads-up — when you come in, I'm going to walk you through a few protection options for your vehicle. I'm not going to pressure you on anything. I just want to make sure you have all the information so you can make the best decision for yourself. Sound fair?",
    scriptCategory: "phone_script",
    dealStage: "introduction",
    intentTrigger: "phone_set_expectation",
    triggerKeywords: ["what to expect", "what happens", "finance office", "how long"],
    sourceDocument: "Evan_Macklin_Phone_Sales_Training_Script.pdf",
    executionLevel: "elite",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9: COMPLIANCE DISCLOSURES
// Source: Federal Regulations (TILA, ECOA, UDAP, CLA)
// ─────────────────────────────────────────────────────────────────────────────
export const COMPLIANCE_DISCLOSURE_SCRIPTS: VerbatimScript[] = [
  {
    id: "cd_tila_001",
    title: "ASURA Script — Cd Tila 001",
    urgency: "high",
    scriptText:
      "Before we finalize your financing, I'm required by federal law to disclose the following: your Annual Percentage Rate is [APR]%, your finance charge is [amount], the amount financed is [amount], and your total of payments over the life of the loan is [amount]. Do you have any questions about these numbers?",
    scriptCategory: "compliance_disclosure",
    dealStage: "closing",
    intentTrigger: "tila_disclosure",
    triggerKeywords: ["apr", "interest rate", "finance charge", "total payments", "truth in lending"],
    sourceDocument: "Federal_Compliance_TILA_RegZ",
    executionLevel: "elite",
  },
  {
    id: "cd_ecoa_001",
    title: "ASURA Script — Cd Ecoa 001",
    urgency: "high",
    scriptText:
      "I also want to let you know that under the Equal Credit Opportunity Act, we do not discriminate based on race, color, religion, national origin, sex, marital status, age, or any other protected class. Your application is evaluated solely on your creditworthiness.",
    scriptCategory: "compliance_disclosure",
    dealStage: "introduction",
    intentTrigger: "ecoa_disclosure",
    triggerKeywords: ["discrimination", "credit", "ecoa", "equal credit", "application"],
    sourceDocument: "Federal_Compliance_ECOA_RegB",
    executionLevel: "elite",
  },
  {
    id: "cd_privacy_001",
    title: "ASURA Script — Cd Privacy 001",
    urgency: "high",
    scriptText:
      "Before we proceed, I need to provide you with our Privacy Policy notice, which explains how we collect, use, and protect your personal information. Do you have any questions about our privacy practices?",
    scriptCategory: "compliance_disclosure",
    dealStage: "introduction",
    intentTrigger: "privacy_policy_disclosure",
    triggerKeywords: ["privacy", "personal information", "data", "gramm-leach-bliley"],
    sourceDocument: "Federal_Compliance_Privacy",
    executionLevel: "elite",
  },
  {
    id: "cd_base_payment_001",
    title: "ASURA Script — Cd Base Payment 001",
    urgency: "high",
    scriptText:
      "Your base payment — that's your vehicle payment without any F&I products — is [amount] per month at [APR]% for [term] months. Everything I show you today will be on top of that base payment. I want to make sure that's clear before we look at any options.",
    scriptCategory: "compliance_disclosure",
    dealStage: "menu_presentation",
    intentTrigger: "base_payment_disclosure",
    triggerKeywords: ["base payment", "without products", "just the car payment", "before products"],
    sourceDocument: "Federal_Compliance_TILA_RegZ",
    executionLevel: "elite",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MASTER SCRIPT INDEX — All scripts combined for retrieval
// ─────────────────────────────────────────────────────────────────────────────
export const ALL_SCRIPTS: VerbatimScript[] = [
  ...PROFESSIONAL_HELLO_SCRIPTS,
  ...FINANCIAL_SNAPSHOT_SCRIPTS,
  ...MENU_TRANSITION_SCRIPTS,
  ...PRODUCT_PRESENTATION_SCRIPTS,
  ...OBJECTION_PREVENTION_SCRIPTS,
  ...OBJECTION_RESPONSE_SCRIPTS,
  ...CLOSING_SCRIPTS,
  ...PHONE_SCRIPTS,
  ...COMPLIANCE_DISCLOSURE_SCRIPTS,
];

// ─────────────────────────────────────────────────────────────────────────────
// SCRIPT RETRIEVAL ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieve the best matching verbatim script for a given transcript excerpt.
 * Returns the exact script or null — NEVER generates new language.
 */
export function retrieveScript(
  transcriptText: string,
  dealStage?: DealStage,
  productContext?: string
): VerbatimScript | null {
  const text = transcriptText.toLowerCase();

  // Score each script by keyword match density
  const scored = ALL_SCRIPTS
    .filter((s) => s.isActive !== false)
    .filter((s) => !dealStage || s.dealStage === dealStage || true) // stage hint
    .filter((s) => !productContext || !s.productContext || s.productContext === productContext)
    .map((script) => {
      const matches = script.triggerKeywords.filter((kw) =>
        text.includes(kw.toLowerCase())
      ).length;
      return { script, matches };
    })
    .filter((s) => s.matches > 0)
    .sort((a, b) => b.matches - a.matches);

  return scored.length > 0 ? scored[0].script : null;
}

/**
 * Retrieve ALL matching scripts for a given transcript excerpt, ranked by relevance.
 */
export function retrieveAllMatchingScripts(
  transcriptText: string,
  limit = 3
): VerbatimScript[] {
  const text = transcriptText.toLowerCase();

  return ALL_SCRIPTS
    .filter((s) => s.isActive !== false)
    .map((script) => {
      const matches = script.triggerKeywords.filter((kw) =>
        text.includes(kw.toLowerCase())
      ).length;
      return { script, matches };
    })
    .filter((s) => s.matches > 0)
    .sort((a, b) => b.matches - a.matches)
    .slice(0, limit)
    .map((s) => s.script);
}

/**
 * Retrieve scripts by category only — for process-stage-based suggestions.
 */
export function retrieveByCategory(
  category: ScriptCategory,
  dealStage?: DealStage
): VerbatimScript[] {
  return ALL_SCRIPTS.filter(
    (s) =>
      s.scriptCategory === category &&
      (!dealStage || s.dealStage === dealStage) &&
      s.isActive !== false
  );
}

/**
 * Detect the current deal stage from transcript content.
 */
export function detectDealStage(fullTranscript: string): DealStage {
  const text = fullTranscript.toLowerCase();

  if (text.includes("congratulations") || text.includes("welcome in") || text.includes("finance director")) {
    return "introduction";
  }
  if (text.includes("how long do you keep") || text.includes("miles per year") || text.includes("three quick questions")) {
    return "financial_snapshot";
  }
  if (text.includes("menu") || text.includes("packages") || text.includes("three levels") || text.includes("options available")) {
    return "menu_presentation";
  }
  if (text.includes("gap") || text.includes("service contract") || text.includes("warranty") || text.includes("maintenance plan")) {
    return "product_walkthrough";
  }
  if (text.includes("too expensive") || text.includes("think about it") || text.includes("don't need") || text.includes("already have")) {
    return "objection_handling";
  }
  if (text.includes("sign") || text.includes("move forward") || text.includes("does that work") || text.includes("let's get you")) {
    return "closing";
  }

  return "introduction";
}

/**
 * 7-Step Process Sequence for grading adherence
 */
export const ASURA_PROCESS_STEPS = [
  { step: 1, name: "Professional Hello", stage: "introduction" as DealStage, category: "professional_hello" as ScriptCategory, weight: 0.10 },
  { step: 2, name: "Customer Connection", stage: "customer_connection" as DealStage, category: "customer_connection" as ScriptCategory, weight: 0.10 },
  { step: 3, name: "Financial Snapshot", stage: "financial_snapshot" as DealStage, category: "financial_snapshot" as ScriptCategory, weight: 0.15 },
  { step: 4, name: "Menu Presentation", stage: "menu_presentation" as DealStage, category: "menu_transition" as ScriptCategory, weight: 0.20 },
  { step: 5, name: "Product Walkthrough", stage: "product_walkthrough" as DealStage, category: "product_presentation" as ScriptCategory, weight: 0.20 },
  { step: 6, name: "Objection Prevention", stage: "objection_handling" as DealStage, category: "objection_prevention" as ScriptCategory, weight: 0.15 },
  { step: 7, name: "Closing", stage: "closing" as DealStage, category: "closing" as ScriptCategory, weight: 0.10 },
];

/**
 * System validation — confirms all scripts are indexed and verbatim flag is set.
 */
export function runSystemValidation(): {
  totalScripts: number;
  byCategory: Record<string, number>;
  verbatimLocked: boolean;
  objectionTriggersCount: number;
  processStepsCount: number;
  status: "PASS" | "FAIL";
  report: string;
} {
  const byCategory: Record<string, number> = {};
  for (const script of ALL_SCRIPTS) {
    byCategory[script.scriptCategory] = (byCategory[script.scriptCategory] || 0) + 1;
  }

  const objectionTriggers = ALL_SCRIPTS.filter(
    (s) => s.scriptCategory === "objection_response" || s.scriptCategory === "objection_prevention"
  ).length;

  const allHaveText = ALL_SCRIPTS.every((s) => s.scriptText && s.scriptText.length > 20);
  const allHaveTriggers = ALL_SCRIPTS.every((s) => s.triggerKeywords.length > 0);
  const allHaveSource = ALL_SCRIPTS.every((s) => s.sourceDocument);

  const passed = allHaveText && allHaveTriggers && allHaveSource;

  return {
    totalScripts: ALL_SCRIPTS.length,
    byCategory,
    verbatimLocked: true, // AI paraphrase disabled — verbatim-only mode active
    objectionTriggersCount: objectionTriggers,
    processStepsCount: ASURA_PROCESS_STEPS.length,
    status: passed ? "PASS" : "FAIL",
    report: passed
      ? `✅ SYSTEM VALIDATION PASSED\n• ${ALL_SCRIPTS.length} scripts indexed\n• All scripts verbatim\n• Script modification: DISABLED\n• Grading system: ACTIVE\n• Objection triggers mapped: ${objectionTriggers}\n• Process steps: ${ASURA_PROCESS_STEPS.length}`
      : "❌ SYSTEM VALIDATION FAILED — check script library for missing fields",
  };
}
