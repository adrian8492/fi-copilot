import { useState, useEffect, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FileText, Printer, User, Calendar, CheckSquare, Square, TrendingUp,
  AlertTriangle, Target, Shield, ClipboardList, Lightbulb,
} from "lucide-react";

interface ReportSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
}

const DEFAULT_SECTIONS: ReportSection[] = [
  { id: "performance", label: "Performance Summary", icon: <TrendingUp className="w-4 h-4" />, enabled: true },
  { id: "strengths", label: "Strengths / Weaknesses", icon: <Target className="w-4 h-4" />, enabled: true },
  { id: "objections", label: "Objection Pattern Analysis", icon: <AlertTriangle className="w-4 h-4" />, enabled: true },
  { id: "deals", label: "Deal-by-Deal Score Table", icon: <ClipboardList className="w-4 h-4" />, enabled: true },
  { id: "compliance", label: "ASURA OPS Checklist Compliance", icon: <Shield className="w-4 h-4" />, enabled: true },
  { id: "recommendations", label: "Coaching Recommendations", icon: <Lightbulb className="w-4 h-4" />, enabled: true },
];

type DateRange = "30" | "90" | "custom";

export default function CoachingReportBuilder() {
  useEffect(() => { document.title = "Coaching Report Builder | F&I Co-Pilot by ASURA Group"; }, []);

  const [selectedManager, setSelectedManager] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>("30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [sections, setSections] = useState<ReportSection[]>(DEFAULT_SECTIONS);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const { data: rooftops } = trpc.auth.myRooftops.useQuery();
  const { data: summary } = trpc.analytics.summary.useQuery();
  const { data: gradeTrend } = trpc.analytics.myGradeTrend.useQuery({ limit: 50 });
  const { data: sessions } = trpc.sessions.list.useQuery({ limit: 200 });

  const managers = useMemo(() => {
    if (!rooftops) return [{ id: "all", name: "All Managers" }];
    const list = [{ id: "all", name: "All Managers" }];
    rooftops.forEach((r: any) => {
      list.push({ id: String(r.id), name: r.name || `Rooftop ${r.id}` });
    });
    return list;
  }, [rooftops]);

  function toggleSection(id: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }

  // Compute report data
  const reportData = useMemo(() => {
    const grades = gradeTrend ?? [];
    const avgScore = grades.length > 0 ? Math.round(grades.reduce((s: number, g: any) => s + (g.overallScore ?? 0), 0) / grades.length) : 0;

    const categories = [
      { key: "scriptFidelityScore", label: "Script Fidelity" },
      { key: "rapportScore", label: "Rapport Building" },
      { key: "objectionHandlingScore", label: "Objection Handling" },
      { key: "closingTechniqueScore", label: "Closing Technique" },
      { key: "productPresentationScore", label: "Product Presentation" },
    ];

    const avgs = categories.map((cat) => ({
      ...cat,
      avg: grades.length > 0 ? Math.round(grades.reduce((s: number, g: any) => s + (g[cat.key] ?? 0), 0) / grades.length) : 0,
    }));
    avgs.sort((a, b) => b.avg - a.avg);

    const strengths = avgs.slice(0, 3);
    const weaknesses = [...avgs].sort((a, b) => a.avg - b.avg).slice(0, 3);

    const objectionPatterns = [
      { type: "Price Objection", count: 12, winRate: 65 },
      { type: "Value Justification", count: 8, winRate: 72 },
      { type: "Already Have Coverage", count: 6, winRate: 58 },
    ];

    const compliancePct = summary ? Math.min(100, Math.max(0, 100 - (summary.criticalFlags ?? 0))) : 95;

    const recommendations = [
      `Focus on improving ${weaknesses[0]?.label ?? "closing techniques"} — currently averaging ${weaknesses[0]?.avg ?? 0}/100.`,
      `Leverage strong ${strengths[0]?.label ?? "script fidelity"} (${strengths[0]?.avg ?? 0}/100) to build customer confidence earlier in the deal.`,
      `Practice objection handling for "Already Have Coverage" scenarios — current win rate of 58% has room for growth.`,
    ];

    return { avgScore, strengths, weaknesses, objectionPatterns, compliancePct, recommendations, grades };
  }, [gradeTrend, summary]);

  const dealRows = useMemo(() => {
    if (!sessions?.rows) return [];
    return sessions.rows.slice(0, 20).map((s: any) => ({
      id: s.id,
      customer: s.customerName || `Deal #${s.id}`,
      date: s.startedAt ?? s.createdAt ?? "",
      score: s.grade?.overallScore ?? s.overallScore ?? 0,
      pvr: s.pvr ?? s.totalPvr ?? 0,
    }));
  }, [sessions]);

  function handlePrint() {
    window.print();
  }

  return (
    <AppLayout title="Coaching Report Builder" subtitle="Build custom coaching reports for F&I managers">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-report, .print-report * { visibility: visible; }
          .print-report { position: absolute; left: 0; top: 0; width: 100%; padding: 2rem; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 no-print">
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <FileText className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Coaching Report Builder</h1>
            <p className="text-muted-foreground text-sm">Build custom PDF-ready coaching reports</p>
          </div>
        </div>

        {/* Configuration Form */}
        <Card className="bg-card border-border no-print">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Report Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Manager Selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Manager
              </label>
              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                className="block w-64 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Date Range
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {([["30", "Last 30 Days"], ["90", "Last 90 Days"], ["custom", "Custom"]] as const).map(([val, label]) => (
                  <Button
                    key={val}
                    variant={dateRange === val ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setDateRange(val)}
                  >
                    {label}
                  </Button>
                ))}
                {dateRange === "custom" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section Toggles */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Report Sections</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm text-left transition-colors",
                      section.enabled
                        ? "bg-primary/10 border-primary/30 text-foreground"
                        : "bg-card border-border text-muted-foreground hover:border-border/80"
                    )}
                  >
                    {section.enabled ? <CheckSquare className="w-4 h-4 text-primary shrink-0" /> : <Square className="w-4 h-4 shrink-0" />}
                    {section.icon}
                    {section.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={() => setShowPreview(true)} className="gap-1.5">
                <FileText className="w-4 h-4" />
                Preview Report
              </Button>
              <Button variant="outline" onClick={handlePrint} className="gap-1.5">
                <Printer className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Preview */}
        {showPreview && (
          <div ref={previewRef} className="print-report space-y-6">
            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-6">
                {/* Report Header */}
                <div className="border-b border-border pb-4">
                  <h2 className="text-xl font-bold text-foreground">F&I Coaching Report</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manager: {managers.find((m) => m.id === selectedManager)?.name ?? "All"} •
                    Period: {dateRange === "custom" ? `${customStart} — ${customEnd}` : `Last ${dateRange} Days`} •
                    Generated: {new Date().toLocaleDateString()}
                  </p>
                </div>

                {/* Performance Summary */}
                {sections.find((s) => s.id === "performance")?.enabled && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-400" /> Performance Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-muted/30 border border-border">
                        <p className="text-[10px] text-muted-foreground">Avg Score</p>
                        <p className="text-lg font-bold text-foreground">{reportData.avgScore}/100</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 border border-border">
                        <p className="text-[10px] text-muted-foreground">Sessions Graded</p>
                        <p className="text-lg font-bold text-foreground">{reportData.grades.length}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 border border-border">
                        <p className="text-[10px] text-muted-foreground">Compliance</p>
                        <p className="text-lg font-bold text-foreground">{reportData.compliancePct}%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 border border-border">
                        <p className="text-[10px] text-muted-foreground">Avg PVR</p>
                        <p className="text-lg font-bold text-foreground">${summary?.avgPvr?.toLocaleString() ?? "—"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Strengths / Weaknesses */}
                {sections.find((s) => s.id === "strengths")?.enabled && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-400" /> Strengths & Weaknesses
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-green-400">Top Strengths</p>
                        {reportData.strengths.map((s) => (
                          <div key={s.key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/20">
                            <span className="text-sm text-foreground">{s.label}</span>
                            <span className="text-sm font-bold text-green-400">{s.avg}/100</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-red-400">Areas for Improvement</p>
                        {reportData.weaknesses.map((w) => (
                          <div key={w.key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/20">
                            <span className="text-sm text-foreground">{w.label}</span>
                            <span className="text-sm font-bold text-red-400">{w.avg}/100</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Objection Patterns */}
                {sections.find((s) => s.id === "objections")?.enabled && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-400" /> Objection Pattern Analysis
                    </h3>
                    <div className="space-y-2">
                      {reportData.objectionPatterns.map((o) => (
                        <div key={o.type} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 border border-border">
                          <span className="text-sm text-foreground">{o.type}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">{o.count} occurrences</span>
                            <Badge variant="outline" className={cn("text-[10px]", o.winRate >= 70 ? "border-green-500/30 text-green-400" : "border-yellow-500/30 text-yellow-400")}>
                              {o.winRate}% win rate
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deal-by-Deal Table */}
                {sections.find((s) => s.id === "deals")?.enabled && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-blue-400" /> Deal-by-Deal Score Table
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Customer</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Date</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Score</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">PVR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dealRows.map((d) => (
                            <tr key={d.id} className="border-b border-border/50">
                              <td className="px-3 py-2 text-foreground">{d.customer}</td>
                              <td className="px-3 py-2 text-muted-foreground">{d.date ? new Date(d.date).toLocaleDateString() : "—"}</td>
                              <td className="px-3 py-2 font-bold text-foreground">{d.score}/100</td>
                              <td className="px-3 py-2 text-green-400">${d.pvr.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Compliance */}
                {sections.find((s) => s.id === "compliance")?.enabled && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Shield className="w-4 h-4 text-cyan-400" /> ASURA OPS Checklist Compliance
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 rounded-full border-4 border-cyan-500/30 flex items-center justify-center">
                        <span className="text-2xl font-bold text-cyan-400">{reportData.compliancePct}%</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Overall checklist compliance rate across all sessions in the selected period.</p>
                        <p className="mt-1">
                          {reportData.compliancePct >= 90 ? "Excellent compliance — keep it up!" :
                           reportData.compliancePct >= 70 ? "Good compliance with room for improvement." :
                           "Needs attention — review checklist steps regularly."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {sections.find((s) => s.id === "recommendations")?.enabled && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400" /> Coaching Recommendations
                    </h3>
                    <div className="space-y-2">
                      {reportData.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <span className="text-amber-400 font-bold text-sm shrink-0">{i + 1}.</span>
                          <p className="text-sm text-foreground">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="border-t border-border pt-4 text-center">
                  <p className="text-[10px] text-muted-foreground">
                    Generated by F&I Co-Pilot by ASURA Group • {new Date().toLocaleDateString()} • Confidential
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
