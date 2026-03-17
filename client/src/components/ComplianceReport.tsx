/**
 * ComplianceReport.tsx
 *
 * Per-session compliance report with red/yellow/green indicators.
 * Shows:
 *  - Overall compliance score (0–100) with color-coded status
 *  - Violation breakdown by severity: critical (red), warning (yellow), info (blue)
 *  - Grouped by category (TILA, ECOA, UDAP, State rules, etc.)
 *  - Remediation guidance for each violation
 *  - Auto-flag non-compliant sessions (critical violations = auto-flagged)
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp,
  ShieldCheck, Shield, Info, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ComplianceFlag {
  id: number;
  sessionId: number;
  rule: string;
  severity: string;
  description?: string | null;
  excerpt?: string | null;
  remediation?: string | null;
  resolved: boolean;
  resolvedAt?: Date | string | null;
  resolvedBy?: number | null;
  timestamp?: number | null;
  createdAt?: Date | string;
}

interface ComplianceReportProps {
  flags: ComplianceFlag[];
  sessionId: number;
  onResolve?: (flagId: number) => void;
  isResolvePending?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function calcComplianceScore(flags: ComplianceFlag[]): number {
  let score = 100;
  for (const f of flags) {
    if (f.resolved) continue;
    if (f.severity === "critical") score -= 25;
    else if (f.severity === "warning") score -= 10;
    else if (f.severity === "info") score -= 3;
  }
  return Math.max(0, score);
}

function getScoreStatus(score: number): { label: string; color: string; bg: string; icon: React.ElementType } {
  if (score >= 90) return { label: "Compliant", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle2 };
  if (score >= 70) return { label: "Minor Issues", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: AlertTriangle };
  if (score >= 50) return { label: "Needs Review", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", icon: AlertTriangle };
  return { label: "Non-Compliant", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: XCircle };
}

function getSeverityConfig(severity: string) {
  if (severity === "critical") return {
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/8 border-red-500/25",
    badge: "bg-red-500/15 text-red-400 border-red-500/40",
    label: "Critical",
  };
  if (severity === "warning") return {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/8 border-amber-500/25",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/40",
    label: "Warning",
  };
  return {
    icon: Info,
    color: "text-blue-400",
    bg: "bg-blue-500/8 border-blue-500/25",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/40",
    label: "Info",
  };
}

function groupByCategory(flags: ComplianceFlag[]): Record<string, ComplianceFlag[]> {
  return flags.reduce((acc, flag) => {
    // Extract category from rule id (e.g., "TILA-001" → "TILA", "CA-001" → "CA (State)")
    let cat = "Other";
    if (flag.rule.startsWith("TILA")) cat = "TILA / Reg Z";
    else if (flag.rule.startsWith("CLA")) cat = "Consumer Leasing Act";
    else if (flag.rule.startsWith("ECOA")) cat = "ECOA / Reg B";
    else if (flag.rule.startsWith("UDAP")) cat = "UDAP / UDAAP";
    else if (flag.rule.startsWith("CONTRACT")) cat = "Contract Elements";
    else if (flag.rule.startsWith("GAP")) cat = "GAP Protection";
    else if (flag.rule.startsWith("VSC")) cat = "Vehicle Service Contract";
    else if (flag.rule.startsWith("AFT")) cat = "Aftermarket Products";
    else if (flag.rule.startsWith("CA-")) cat = "California (State)";
    else if (flag.rule.startsWith("TX-")) cat = "Texas (State)";
    else if (flag.rule.startsWith("FL-")) cat = "Florida (State)";
    else if (flag.rule.startsWith("NY-")) cat = "New York (State)";
    else if (flag.rule.startsWith("OH-")) cat = "Ohio (State)";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(flag);
    return acc;
  }, {} as Record<string, ComplianceFlag[]>);
}

// ─── Flag Item Component ─────────────────────────────────────────────────────

function FlagItem({ flag, onResolve, isPending }: {
  flag: ComplianceFlag;
  onResolve?: (id: number) => void;
  isPending?: boolean;
}) {
  const [showRemediation, setShowRemediation] = useState(false);
  const cfg = getSeverityConfig(flag.severity);
  const SeverityIcon = cfg.icon;

  return (
    <div className={cn(
      "rounded-lg border p-3 transition-opacity",
      cfg.bg,
      flag.resolved && "opacity-50"
    )}>
      <div className="flex items-start gap-3">
        <SeverityIcon className={cn("w-4 h-4 mt-0.5 shrink-0", cfg.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground">{flag.rule}</span>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", cfg.badge)}>
                {cfg.label}
              </Badge>
              {flag.resolved && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted/30 text-muted-foreground border-border">
                  Resolved
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {flag.remediation && (
                <button
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowRemediation(!showRemediation)}
                >
                  Remediation
                  {showRemediation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
              {onResolve && !flag.resolved && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px] text-emerald-400 hover:bg-emerald-400/10"
                  onClick={() => onResolve(flag.id)}
                  disabled={isPending}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Resolve
                </Button>
              )}
            </div>
          </div>

          {flag.description && (
            <p className="text-xs text-muted-foreground mt-1">{flag.description}</p>
          )}

          {flag.excerpt && (
            <div className="mt-2 px-2 py-1.5 rounded bg-black/20 border border-border/50">
              <p className="text-[10px] font-medium text-muted-foreground mb-0.5 uppercase tracking-wider">Transcript excerpt</p>
              <p className="text-xs text-foreground/80 italic line-clamp-2">&ldquo;{flag.excerpt}&rdquo;</p>
            </div>
          )}

          {showRemediation && flag.remediation && (
            <div className="mt-2 px-3 py-2 rounded-md bg-primary/5 border border-primary/20">
              <p className="text-[10px] font-semibold text-primary mb-1 uppercase tracking-wider">Corrective Script</p>
              <p className="text-xs text-foreground leading-relaxed">{flag.remediation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ComplianceReport({ flags, sessionId: _sessionId, onResolve, isResolvePending }: ComplianceReportProps) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [showResolved, setShowResolved] = useState(false);

  const activeFlags = flags.filter(f => !f.resolved);
  const resolvedFlags = flags.filter(f => f.resolved);
  const score = calcComplianceScore(flags);
  const status = getScoreStatus(score);
  const StatusIcon = status.icon;

  const criticalCount = activeFlags.filter(f => f.severity === "critical").length;
  const warningCount = activeFlags.filter(f => f.severity === "warning").length;
  const infoCount = activeFlags.filter(f => f.severity === "info").length;

  const displayedFlags = showResolved ? flags : activeFlags;
  const grouped = groupByCategory(displayedFlags);
  const categories = Object.keys(grouped).sort();

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Auto-flag if any critical violations
  const isAutoFlagged = criticalCount > 0;

  if (flags.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
          <p className="text-sm font-semibold text-foreground mb-1">No Compliance Issues Found</p>
          <p className="text-xs text-muted-foreground">This session passed all compliance checks.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score Summary Card */}
      <Card className={cn("border", status.bg)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Score */}
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center border-2 shrink-0",
                score >= 90 ? "border-emerald-500 bg-emerald-500/10" :
                score >= 70 ? "border-amber-500 bg-amber-500/10" :
                score >= 50 ? "border-orange-500 bg-orange-500/10" :
                "border-red-500 bg-red-500/10"
              )}>
                <span className={cn("text-xl font-bold", status.color)}>{score}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Compliance Score</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <StatusIcon className={cn("w-3.5 h-3.5", status.color)} />
                  <span className={cn("text-xs font-semibold", status.color)}>{status.label}</span>
                </div>
              </div>
            </div>

            {/* Violation counts */}
            <div className="flex items-center gap-3 ml-auto flex-wrap">
              {criticalCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-red-500/10 border border-red-500/25">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-bold text-red-400">{criticalCount} Critical</span>
                </div>
              )}
              {warningCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/25">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400">{warningCount} Warning{warningCount > 1 ? "s" : ""}</span>
                </div>
              )}
              {infoCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-500/10 border border-blue-500/25">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-bold text-blue-400">{infoCount} Info</span>
                </div>
              )}
            </div>
          </div>

          {/* Auto-flag banner */}
          {isAutoFlagged && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/30">
              <Shield className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300 font-medium">
                ⚠️ Auto-flagged: This session has {criticalCount} critical violation{criticalCount > 1 ? "s" : ""} requiring immediate review.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flags by category */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const catFlags = grouped[cat];
          const isExpanded = expandedCats.has(cat);
          const catCritical = catFlags.filter(f => f.severity === "critical" && !f.resolved).length;
          const catWarning = catFlags.filter(f => f.severity === "warning" && !f.resolved).length;

          return (
            <Card key={cat} className="bg-card border-border overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
                onClick={() => toggleCat(cat)}
              >
                {catCritical > 0
                  ? <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  : catWarning > 0
                    ? <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    : <Info className="w-4 h-4 text-blue-400 shrink-0" />
                }
                <span className="text-sm font-semibold text-foreground flex-1">{cat}</span>
                <span className="text-xs text-muted-foreground">{catFlags.length} flag{catFlags.length !== 1 ? "s" : ""}</span>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              {isExpanded && (
                <CardContent className="px-4 pb-4 pt-0 space-y-2">
                  {catFlags.map(flag => (
                    <FlagItem
                      key={flag.id}
                      flag={flag}
                      onResolve={onResolve}
                      isPending={isResolvePending}
                    />
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Show resolved toggle */}
      {resolvedFlags.length > 0 && (
        <button
          className="w-full flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowResolved(!showResolved)}
        >
          <ExternalLink className="w-3 h-3" />
          {showResolved ? "Hide" : "Show"} {resolvedFlags.length} resolved flag{resolvedFlags.length !== 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}

export default ComplianceReport;
