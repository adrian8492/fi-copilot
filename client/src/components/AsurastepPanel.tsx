/**
 * ASURA Step Panel
 * ─────────────────────────────────────────────────────────────────────────────
 * Displays the live ASURA process stage indicator, script suggestion,
 * execution score, and compliance alert banner during active recording sessions.
 */

import { cn } from "@/lib/utils";
import { AlertTriangle, BookOpen, CheckCircle2, TrendingUp, Zap } from "lucide-react";

// ─── ASURA 6-Step definitions ─────────────────────────────────────────────────

export const ASURA_STEPS = [
  {
    step: 1,
    label: "Connection",
    desc: "Warm greeting, trust transfer, set the agenda",
    keywords: ["greet", "welcome", "name", "agenda"],
  },
  {
    step: 2,
    label: "Situation Awareness",
    desc: "Client survey — understand needs & current situation",
    keywords: ["scale", "survey", "predictable", "important"],
  },
  {
    step: 3,
    label: "Problem Awareness",
    desc: "Warranty review — expose the gap in coverage",
    keywords: ["warranty", "factory", "coverage", "gap"],
  },
  {
    step: 4,
    label: "Solution",
    desc: "Menu presentation — consumer protection options",
    keywords: ["vsc", "vehicle service", "menu", "option 1", "platinum", "gap", "tire"],
  },
  {
    step: 5,
    label: "Consequence",
    desc: "Paint the picture of life without protection",
    keywords: ["out of pocket", "what if", "month 25", "without protection"],
  },
  {
    step: 6,
    label: "Pillars",
    desc: "Present 3-option tiers — Option 1 first, always",
    keywords: ["rank", "most important", "option 1", "option 2", "option 3", "choose"],
  },
] as const;

export type AsuraStepNum = 1 | 2 | 3 | 4 | 5 | 6;

// ─── Script suggestions per step ─────────────────────────────────────────────

const SCRIPT_SUGGESTIONS: Record<AsuraStepNum, string> = {
  1: `"Welcome! Before we get started, I want to walk you through a few things that are going to protect you today."`,
  2: `"On a scale of 1-10, how important is it that your vehicle expenses stay predictable month to month?"`,
  3: `"What is your understanding of the factory warranty? Most people think they're covered — let me show you where the gaps are."`,
  4: `"I've put together three packages for you today. Option 1 is our most comprehensive — this is what most of our customers choose."`,
  5: `"If [X] happened at month 25, that's $[Y] out of pocket. I want to make sure you're clear on that before we move forward."`,
  6: `"Let's start with Option 1 — the Platinum. Tell me, which of these is most important to you?"`,
};

const MENU_ORDER = "VSC → GAP → T&W → Appearance";

// ─── Detect step from transcript ─────────────────────────────────────────────

export function detectStepFromTranscript(transcript: string): AsuraStepNum {
  const t = transcript.toLowerCase().slice(-600);

  // Step 6 — ranking/options
  if (/option\s*(1|2|3|one|two|three)/i.test(t) && /rank|most\s+important|choose/i.test(t)) return 6;
  // Step 5 — consequence language
  if (/out\s+of\s+pocket|without\s+(this\s+)?protection|what\s+if|month\s+25/i.test(t)) return 5;
  // Step 4 — menu/products
  if (/\bvsc\b|vehicle\s+service\s+(contract|agreement)|menu|consumer\s+protection|option\s+1|platinum|tire\s+and\s+wheel|gap.*cover|ceramic|paintless\s+dent/i.test(t)) return 4;
  // Step 3 — warranty review
  if (/factory\s+warranty|manufacturer.{0,10}warranty|what.{0,20}warranty|warranty\s+(expires?|runs?\s+out)/i.test(t)) return 3;
  // Step 2 — survey
  if (/scale\s+of\s+1.{0,5}10|client\s+survey|how\s+important\s+is\s+it|retail\s+delivery/i.test(t)) return 2;
  // Step 1 — greeting/intro
  if (/good\s+(morning|afternoon)|welcome|my\s+name\s+is|before\s+we\s+get\s+started/i.test(t)) return 1;

  return 1;
}

// ─── Compute live execution score ─────────────────────────────────────────────

export function computeLiveScore(transcript: string, detectedStep: AsuraStepNum): number {
  const t = transcript.toLowerCase();
  let score = 30; // base

  // Survey done? (+20)
  if (/scale\s+of\s+1.{0,5}10|retail\s+delivery\s+worksheet|how\s+important\s+is\s+it/i.test(t)) score += 20;

  // Guide language (+15)
  if (/most\s+(customers|people)|I\s+recommend|typically|let\s+me\s+show\s+you/i.test(t)) score += 15;

  // Compliance language penalty (-10)
  if (/extended\s+warranty|you\s+have\s+to\s+(buy|take)|gap\s+insurance/i.test(t)) score -= 10;

  // Menu presented (+15)
  if (detectedStep >= 4) score += 15;

  // Consequence framing (+10)
  if (/out\s+of\s+pocket|without\s+protection/i.test(t)) score += 10;

  // Option 1 first (+10)
  if (/option\s+1|platinum/i.test(t)) score += 10;

  return Math.min(100, Math.max(0, score));
}

// ─── Detect compliance risks ──────────────────────────────────────────────────

interface ComplianceRisk {
  phrase: string;
  warning: string;
  severity: "critical" | "warning";
}

const RISKS: Array<{ pattern: RegExp; phrase: string; warning: string; severity: "critical" | "warning" }> = [
  {
    pattern: /extended\s+warranty/i,
    phrase: "extended warranty",
    warning: "Say 'Vehicle Service Agreement' — never 'extended warranty'",
    severity: "critical",
  },
  {
    pattern: /\bgap\s+insurance\b/i,
    phrase: "GAP insurance",
    warning: "GAP is not insurance. Say 'GAP coverage' or 'GAP program'",
    severity: "critical",
  },
  {
    pattern: /you\s+(have\s+to|must|need\s+to)\s+(buy|purchase|get|take)/i,
    phrase: "mandatory language",
    warning: "Use guide language: 'Most customers choose...' — not 'you have to'",
    severity: "warning",
  },
  {
    pattern: /\bI\s+promise\b|\bwe\s+promise\b/i,
    phrase: "personal promise",
    warning: "Avoid personal promises. Stick to documented product benefits.",
    severity: "warning",
  },
];

export function detectRisks(text: string): ComplianceRisk[] {
  return RISKS
    .filter((r) => r.pattern.test(text))
    .map(({ phrase, warning, severity }) => ({ phrase, warning, severity }));
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AsurastepPanelProps {
  transcript: string;
  currentStep?: AsuraStepNum;
  executionScore?: number;
  isRecording: boolean;
  lastAlertText?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AsurastepPanel({
  transcript,
  currentStep,
  executionScore,
  isRecording,
  lastAlertText,
}: AsurastepPanelProps) {
  const detectedStep = currentStep ?? (transcript ? detectStepFromTranscript(transcript) : 1);
  const score = executionScore ?? (transcript ? computeLiveScore(transcript, detectedStep) : 0);
  const risks = lastAlertText ? detectRisks(lastAlertText) : [];
  const stepDef = ASURA_STEPS[detectedStep - 1];
  const scriptSuggestion = SCRIPT_SUGGESTIONS[detectedStep];

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-3">
      {/* Alert Banner */}
      {risks.length > 0 && (
        <div className={cn(
          "rounded-xl border-2 px-3 py-2.5 animate-in slide-in-from-top-2 fade-in",
          risks[0].severity === "critical"
            ? "bg-red-950/80 border-red-500/60"
            : "bg-amber-950/80 border-amber-500/60"
        )}>
          <div className="flex items-start gap-2">
            <AlertTriangle className={cn(
              "w-4 h-4 shrink-0 mt-0.5",
              risks[0].severity === "critical" ? "text-red-400" : "text-amber-400"
            )} />
            <div>
              <p className={cn(
                "text-xs font-bold uppercase tracking-wide",
                risks[0].severity === "critical" ? "text-red-400" : "text-amber-400"
              )}>
                {risks[0].severity === "critical" ? "COMPLIANCE VIOLATION" : "COMPLIANCE WARNING"}
              </p>
              <p className="text-xs text-foreground mt-0.5">{risks[0].warning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Process Stage Indicator */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-3 py-2 bg-violet-500/10 border-b border-border flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">ASURA Process Stage</span>
        </div>
        <div className="p-3">
          {/* Steps row */}
          <div className="flex items-center gap-1 mb-3">
            {ASURA_STEPS.map(({ step }) => (
              <div
                key={step}
                className={cn(
                  "flex-1 h-1.5 rounded-full transition-all",
                  step < detectedStep ? "bg-violet-500" :
                  step === detectedStep ? "bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.6)]" :
                  "bg-muted-foreground/20"
                )}
              />
            ))}
          </div>

          {/* Current step */}
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shrink-0 font-bold text-violet-300 text-sm">
              {detectedStep}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">{stepDef.label}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{stepDef.desc}</p>
            </div>
          </div>

          {/* Step list */}
          <div className="mt-3 space-y-1">
            {ASURA_STEPS.map(({ step, label }) => (
              <div
                key={step}
                className={cn(
                  "flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition-colors",
                  step === detectedStep
                    ? "bg-violet-500/15 text-violet-300 font-semibold"
                    : step < detectedStep
                    ? "text-muted-foreground/60"
                    : "text-muted-foreground/40"
                )}
              >
                {step < detectedStep ? (
                  <CheckCircle2 className="w-3 h-3 text-violet-500/60 shrink-0" />
                ) : step === detectedStep ? (
                  <div className="w-3 h-3 rounded-full bg-violet-400 shrink-0 animate-pulse" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-muted-foreground/20 shrink-0" />
                )}
                Step {step} — {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Script Suggestion */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-3 py-2 bg-primary/10 border-b border-border flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Next Script — Step {detectedStep}</span>
        </div>
        <div className="p-3">
          <p className="text-[11px] text-foreground leading-relaxed italic font-medium">
            {scriptSuggestion}
          </p>
          {detectedStep === 4 && (
            <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-0.5">Menu Order</p>
              <p className="text-[11px] text-blue-300 font-semibold">{MENU_ORDER}</p>
            </div>
          )}
        </div>
      </div>

      {/* Execution Score */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-3 py-2 bg-emerald-500/10 border-b border-border flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Execution Score</span>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className={cn(
              "text-3xl font-black",
              score >= 80 ? "text-emerald-400" :
              score >= 65 ? "text-amber-400" :
              "text-red-400"
            )}>
              {isRecording ? score : "—"}
            </span>
            <span className="text-[10px] text-muted-foreground">/ 100</span>
          </div>
          {/* Score bar */}
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                score >= 80 ? "bg-emerald-500" :
                score >= 65 ? "bg-amber-500" :
                "bg-red-500"
              )}
              style={{ width: isRecording ? `${score}%` : "0%" }}
            />
          </div>
          {!isRecording && (
            <p className="text-[10px] text-muted-foreground mt-1.5">Start recording to see live score</p>
          )}
          {isRecording && (
            <div className="mt-2 space-y-1">
              {score < 60 && (
                <p className="text-[10px] text-red-400">Run the client survey to boost your score</p>
              )}
              {score >= 60 && score < 80 && (
                <p className="text-[10px] text-amber-400">Good — use guide language to push higher</p>
              )}
              {score >= 80 && (
                <p className="text-[10px] text-emerald-400">Strong execution — stay the course</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
