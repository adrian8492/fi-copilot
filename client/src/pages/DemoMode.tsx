import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Play, Pause, RotateCcw, Mic, MicOff, AlertTriangle,
  CheckCircle2, XCircle, Circle, Zap, Shield, TrendingUp,
  ChevronRight, Star, Award, Clock
} from "lucide-react";
import { toast } from "sonner";

// ─── Demo Transcript ──────────────────────────────────────────────────────────
// Based on ASURA Elite F&I Methodology — Financial Snapshot + Menu Mastery + Objection Prevention
const DEMO_TRANSCRIPT: Array<{
  delay: number; // ms from start
  speaker: "manager" | "customer";
  text: string;
  isFinal: boolean;
}> = [
  { delay: 1000,  speaker: "manager",  text: "Hey Marcus, come on in — I'm Adrian. Congratulations on the new Tahoe, that's a great choice.", isFinal: true },
  { delay: 5000,  speaker: "customer", text: "Thanks! Yeah, we're really excited. It's for the family.", isFinal: true },
  { delay: 8000,  speaker: "manager",  text: "Perfect. So before we get into the paperwork, I just want to ask you a couple quick questions so I can make sure I'm putting together the right package for you. Is that okay?", isFinal: true },
  { delay: 14000, speaker: "customer", text: "Sure, go ahead.", isFinal: true },
  { delay: 17000, speaker: "manager",  text: "Great. First — how long do you typically keep your vehicles? Are you a two-to-three year person or do you tend to hold onto them longer?", isFinal: true },
  { delay: 24000, speaker: "customer", text: "We usually keep them about five, maybe six years.", isFinal: true },
  { delay: 28000, speaker: "manager",  text: "Okay, good to know. And do you drive mostly local, or do you put a lot of highway miles on?", isFinal: true },
  { delay: 34000, speaker: "customer", text: "Mostly local, some highway. Probably around 15,000 miles a year.", isFinal: true },
  { delay: 38000, speaker: "manager",  text: "Perfect. And last one — if something unexpected came up with the vehicle, like a major repair, would you prefer to handle that out of pocket or would you rather have something in place to protect against that?", isFinal: true },
  { delay: 47000, speaker: "customer", text: "I'd rather have something in place. We don't really have a big emergency fund right now.", isFinal: true },
  { delay: 52000, speaker: "manager",  text: "That's exactly what I needed to hear. So here's what I put together for you. I'm going to show you four options today — each one is designed to protect a different part of your investment.", isFinal: true },
  { delay: 60000, speaker: "manager",  text: "The first thing I want to cover is your base payment. Without any of the protection products, you're looking at $687 a month. That's your starting point.", isFinal: true },
  { delay: 68000, speaker: "manager",  text: "Now, the first product I want to talk about is GAP protection. On a vehicle like this, in the first 12 months you could be $6,000 to $8,000 upside down if something happened. GAP covers that entire difference — the gap between what you owe and what insurance pays.", isFinal: true },
  { delay: 80000, speaker: "customer", text: "How much does that add to the payment?", isFinal: true },
  { delay: 84000, speaker: "manager",  text: "It's about $12 a month. That's less than a Netflix subscription to protect an $8,000 exposure.", isFinal: true },
  { delay: 90000, speaker: "customer", text: "Okay, that makes sense.", isFinal: true },
  { delay: 94000, speaker: "manager",  text: "Good. The second thing is the Vehicle Service Agreement — the extended warranty. The factory warranty on this Tahoe covers you for 3 years or 36,000 miles. You said you keep your vehicles 5 to 6 years. That means years 4, 5, and 6 you're completely exposed.", isFinal: true },
  { delay: 106000, speaker: "customer", text: "What does that cover?", isFinal: true },
  { delay: 109000, speaker: "manager",  text: "Everything mechanical and electrical — engine, transmission, drive axle, electronics, air conditioning. A single transmission repair on this vehicle is $4,500 to $6,000. The VSA covers that completely, parts and labor.", isFinal: true },
  { delay: 118000, speaker: "customer", text: "I don't know, that seems like a lot. I need to think about it.", isFinal: true },
  { delay: 123000, speaker: "manager",  text: "I completely understand. Can I ask — what specifically would you like to think about? Is it the investment, the coverage itself, or is there something I haven't explained clearly?", isFinal: true },
  { delay: 132000, speaker: "customer", text: "I guess it's just the cost. It's adding up.", isFinal: true },
  { delay: 136000, speaker: "manager",  text: "That's fair. Let me put it in perspective. We're talking about $47 a month to protect a $58,000 vehicle over 6 years. That's $0.78 a day. One repair pays for the entire contract.", isFinal: true },
  { delay: 146000, speaker: "customer", text: "When you put it that way, it does make sense.", isFinal: true },
  { delay: 150000, speaker: "manager",  text: "Good. Now the last two are the Tire and Wheel protection and the Theft Deterrent. Given that you're driving 15,000 miles a year locally, tire and wheel is actually one of the highest-utilized products we offer.", isFinal: true },
  { delay: 161000, speaker: "customer", text: "We actually had a blowout last year on our old car. That was expensive.", isFinal: true },
  { delay: 165000, speaker: "manager",  text: "Then this is exactly for you. One tire on this Tahoe is $350 to $400. The Tire and Wheel covers unlimited tires and wheels for the life of the contract. You already know what that feels like without it.", isFinal: true },
  { delay: 175000, speaker: "customer", text: "Yeah, okay. I think we want that one.", isFinal: true },
  { delay: 179000, speaker: "manager",  text: "Great. So let me show you the full package — GAP, VSA, and Tire and Wheel together. The total comes to $742 a month. That's $55 more than your base payment to protect every major exposure on this vehicle.", isFinal: true },
  { delay: 190000, speaker: "customer", text: "Sounds good. Let's do it.", isFinal: true },
  { delay: 194000, speaker: "manager",  text: "Perfect. I'll get the paperwork started. You made a great decision.", isFinal: true },
];

// ─── Demo Co-Pilot Suggestions ────────────────────────────────────────────────
const DEMO_SUGGESTIONS: Array<{
  triggerAt: number; // ms from start
  type: string;
  title: string;
  content: string;
  script: string;
  framework: string;
  urgency: "high" | "medium" | "low";
}> = [
  {
    triggerAt: 17000,
    type: "rapport_building",
    title: "Financial Snapshot — 3 Core Questions",
    content: "You're executing the Financial Snapshot perfectly. These 3 questions (time frame, usage, risk tolerance) will personalize your entire menu presentation. Listen carefully to the answers.",
    script: "Continue with the 3 questions. Their answers will determine which products to lead with and how to frame the investment.",
    framework: "Financial Snapshot Script — 3 Core Questions",
    urgency: "low",
  },
  {
    triggerAt: 52000,
    type: "product_recommendation",
    title: "Transition to Menu — Lead with GAP",
    content: "Customer confirmed 5-6 year ownership and no emergency fund. This is a high-exposure profile. Lead with GAP to establish the protection mindset before presenting VSA.",
    script: "\"So based on what you told me, I put together a package that addresses all three of those areas. Let me walk you through it.\"",
    framework: "Menu Mastery — 4-Pillar Framework",
    urgency: "medium",
  },
  {
    triggerAt: 80000,
    type: "product_recommendation",
    title: "GAP — Price Anchoring Working",
    content: "Customer asked about payment impact — this is a buying signal, not an objection. Use the daily cost reframe immediately to make the number feel small.",
    script: "\"It's about $12 a month — less than a streaming service to protect an $8,000 exposure.\"",
    framework: "Objection Prevention Matrix — Responsibility Transfer",
    urgency: "medium",
  },
  {
    triggerAt: 118000,
    type: "objection_handling",
    title: "Think It Over — Isolate NOW",
    content: "Customer said 'I need to think about it.' Do NOT let this slide. Use the ASURA isolation technique immediately to surface the real objection before it becomes a wall.",
    script: "\"I completely understand. Can I ask — what specifically would you like to think about? Is it the investment, the coverage itself, or is there something I haven't explained clearly?\"",
    framework: "Objection Prevention Matrix — 3x3 Matrix",
    urgency: "high",
  },
  {
    triggerAt: 136000,
    type: "closing_technique",
    title: "Price Objection — Daily Cost Reframe",
    content: "Real objection is cost, not coverage. Break it down to daily cost immediately. $47/month = $0.78/day. One repair pays for the entire 6-year contract.",
    script: "\"Let me put it in perspective — $47 a month is $0.78 a day to protect a $58,000 vehicle. One transmission repair pays for the entire contract.\"",
    framework: "Objection Prevention Matrix — Responsibility Transfer",
    urgency: "high",
  },
  {
    triggerAt: 161000,
    type: "product_recommendation",
    title: "Tire & Wheel — Personal Experience Close",
    content: "Customer just disclosed a personal tire blowout experience. This is a GIFT. Use their own experience as the close — they already know the pain. Don't oversell, just confirm.",
    script: "\"You already know exactly what that feels like without it. This covers unlimited tires and wheels for the life of the contract.\"",
    framework: "VSA Presentation Framework — Frame → Comprehensive → Value → Opt-Out",
    urgency: "high",
  },
  {
    triggerAt: 190000,
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
    triggerAt: 60000,
    severity: "info",
    rule: "Base Payment Disclosure",
    description: "Base payment of $687 disclosed before F&I product presentation. TILA compliant.",
  },
  {
    triggerAt: 68000,
    severity: "info",
    rule: "GAP Disclosure — Accurate",
    description: "GAP exposure amount stated as a range ($6,000–$8,000), not a guarantee. Compliant.",
  },
];

// ─── Demo Checklist ───────────────────────────────────────────────────────────
const DEMO_CHECKLIST_EVENTS: Array<{
  triggerAt: number;
  item: string;
  completed: boolean;
}> = [
  { triggerAt: 1000,   item: "greeting",          completed: true },
  { triggerAt: 8000,   item: "timeFrame",          completed: true },
  { triggerAt: 28000,  item: "financialOptions",   completed: true },
  { triggerAt: 60000,  item: "basePayment",        completed: true },
  { triggerAt: 68000,  item: "gapProtection",      completed: true },
  { triggerAt: 94000,  item: "vehicleServiceAgreement", completed: true },
  { triggerAt: 150000, item: "tireWheel",          completed: true },
  { triggerAt: 179000, item: "assumptiveClose",    completed: true },
];

// ─── Checklist Labels ─────────────────────────────────────────────────────────
const CHECKLIST_LABELS: Record<string, { label: string; category: string }> = {
  greeting:              { label: "Professional Greeting", category: "Introduction" },
  titleWork:             { label: "Title Work Reviewed", category: "Introduction" },
  factoryWarranty:       { label: "Factory Warranty Explained", category: "Introduction" },
  financialOptions:      { label: "Financial Options Presented", category: "Introduction" },
  timeFrame:             { label: "Time Frame Established", category: "Introduction" },
  firstForms:            { label: "First Forms Signed", category: "Introduction" },
  privacyPolicy:         { label: "Privacy Policy Disclosed", category: "Compliance" },
  riskBasedPricing:      { label: "Risk-Based Pricing Notice", category: "Compliance" },
  basePayment:           { label: "Base Payment Disclosed", category: "Compliance" },
  gapProtection:         { label: "GAP Protection Presented", category: "Menu Presentation" },
  vehicleServiceAgreement: { label: "VSA / Extended Warranty", category: "Menu Presentation" },
  tireWheel:             { label: "Tire & Wheel Protection", category: "Menu Presentation" },
  paintProtection:       { label: "Paint & Fabric Protection", category: "Menu Presentation" },
  theftDeterrent:        { label: "Theft Deterrent", category: "Menu Presentation" },
  lifeInsurance:         { label: "Credit Life Insurance", category: "Menu Presentation" },
  disabilityInsurance:   { label: "Disability Insurance", category: "Menu Presentation" },
  assumptiveClose:       { label: "Assumptive Close Used", category: "Menu Presentation" },
  objectionHandled:      { label: "Objection Handled Correctly", category: "Menu Presentation" },
};

type TranscriptLine = { speaker: "manager" | "customer"; text: string; timestamp: number };
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
  const [, navigate] = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [compliance, setCompliance] = useState<ComplianceEvent[]>([]);
  const [checklist, setChecklist] = useState<ChecklistState>({});
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const suggestionsEndRef = useRef<HTMLDivElement>(null);

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
    const now = Date.now();
    startTimeRef.current = now - offsetMs;

    // Schedule transcript lines
    DEMO_TRANSCRIPT.forEach(line => {
      const remaining = line.delay - offsetMs;
      if (remaining > 0) {
        const t = setTimeout(() => {
          setTranscript(prev => [...prev, { speaker: line.speaker, text: line.text, timestamp: line.delay }]);
          setTimeout(() => transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }, remaining);
        timersRef.current.push(t);
      }
    });

    // Schedule suggestions
    DEMO_SUGGESTIONS.forEach(sugg => {
      const remaining = sugg.triggerAt - offsetMs;
      if (remaining > 0) {
        const t = setTimeout(() => {
          setSuggestions(prev => [sugg, ...prev.slice(0, 4)]);
          setTimeout(() => suggestionsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
          if (sugg.urgency === "high") toast.warning(sugg.title, { description: "New high-priority co-pilot suggestion" });
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
          setScore(prev => Math.min(100, prev + 6));
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
        setScore(84);
        toast.success("Demo session complete — Score: 84/100 (Elite)", { description: "3 products sold. PVR: $1,847" });
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
    pausedAtRef.current = elapsed;
    clearAllTimers();
  }, [elapsed, clearAllTimers]);

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
    pausedAtRef.current = 0;
  }, [clearAllTimers]);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const progressPct = Math.min(100, (elapsed / TOTAL_DURATION) * 100);
  const elapsedSec = Math.floor(elapsed / 1000);
  const elapsedMin = Math.floor(elapsedSec / 60);
  const elapsedSecDisplay = elapsedSec % 60;

  const checklistCategories = ["Introduction", "Compliance", "Menu Presentation"];
  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalItems = Object.keys(CHECKLIST_LABELS).length;

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
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                ASURA Methodology Active
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Live Deal Simulation</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Marcus Rivera — 2024 Chevrolet Tahoe LT — Retail Finance — $58,000
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isComplete && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <Award className="h-5 w-5 text-emerald-400" />
                <span className="text-emerald-400 font-bold text-lg">84 / 100</span>
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
                  <CheckCircle2 className="h-3.5 w-3.5" /> Session Complete
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
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-4 min-h-[600px]">

          {/* Checklist Panel — Left */}
          <div className="col-span-3 space-y-3">
            <Card className="bg-card/50 border-border/60">
              <CardHeader className="pb-3 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-foreground">17-Point Checklist</CardTitle>
                  <span className="text-xs text-muted-foreground">{completedCount}/{totalItems}</span>
                </div>
                <Progress value={(completedCount / totalItems) * 100} className="h-1 mt-1" />
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                {checklistCategories.map(category => (
                  <div key={category}>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{category}</p>
                    <div className="space-y-1.5">
                      {Object.entries(CHECKLIST_LABELS)
                        .filter(([, v]) => v.category === category)
                        .map(([key, { label }]) => (
                          <div key={key} className="flex items-center gap-2">
                            {checklist[key] ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                            )}
                            <span className={`text-xs ${checklist[key] ? "text-foreground" : "text-muted-foreground/60"}`}>
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
                <div className="text-center">
                  <div className="text-4xl font-bold text-foreground mb-1">{score}</div>
                  <div className="text-xs text-muted-foreground mb-3">Live Score</div>
                  <Progress value={score} className="h-2 mb-3" />
                  <div className={`text-xs font-semibold ${score >= 80 ? "text-emerald-400" : score >= 65 ? "text-amber-400" : "text-red-400"}`}>
                    {score >= 80 ? "ELITE" : score >= 65 ? "DEVELOPING" : "NEEDS COACHING"}
                  </div>
                </div>
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
                <ScrollArea className="h-[520px] pr-2">
                  {transcript.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <Play className="h-8 w-8 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">Press Start Demo to begin the simulation</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Powered by Deepgram Nova-2 + ASURA Engine</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transcript.map((line, i) => (
                        <div key={i} className={`flex gap-3 ${line.speaker === "manager" ? "" : "flex-row-reverse"}`}>
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
                      ))}
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
                <ScrollArea className="h-[280px] pr-1">
                  {suggestions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-20 text-center">
                      <p className="text-xs text-muted-foreground/60">Co-pilot suggestions will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {suggestions.map((sugg, i) => (
                        <div key={i} className={`rounded-lg border p-3 ${URGENCY_COLORS[sugg.urgency]} ${i === 0 ? "ring-1 ring-current" : "opacity-70"}`}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-xs font-semibold text-foreground leading-tight">{sugg.title}</span>
                            <Badge className={`text-[9px] shrink-0 ${URGENCY_BADGE[sugg.urgency]}`}>
                              {sugg.urgency.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">{sugg.content}</p>
                          {i === 0 && (
                            <div className="bg-background/40 rounded-md p-2 border border-border/40">
                              <p className="text-[10px] font-semibold text-muted-foreground mb-1">SCRIPT</p>
                              <p className="text-[11px] text-foreground italic leading-relaxed">{sugg.script}</p>
                            </div>
                          )}
                          <p className="text-[9px] text-muted-foreground/50 mt-2 flex items-center gap-1">
                            <Star className="h-2.5 w-2.5" /> {sugg.framework}
                          </p>
                        </div>
                      ))}
                      <div ref={suggestionsEndRef} />
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
                  <p className="text-sm text-muted-foreground">Marcus Rivera demonstrated ASURA Elite F&I methodology across all 3 phases</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Overall Score", value: "84/100", sub: "Elite", color: "text-emerald-400" },
                  { label: "Products Sold", value: "3 of 4", sub: "GAP + VSA + T&W", color: "text-violet-400" },
                  { label: "PVR", value: "$1,847", sub: "Above target", color: "text-amber-400" },
                  { label: "Compliance", value: "100%", sub: "All disclosures made", color: "text-blue-400" },
                ].map(stat => (
                  <div key={stat.label} className="text-center p-3 rounded-lg bg-background/40 border border-border/40">
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                    <div className="text-[10px] text-muted-foreground/60 mt-0.5">{stat.sub}</div>
                  </div>
                ))}
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
