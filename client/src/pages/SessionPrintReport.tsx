import { useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function ScoreBar({ label, score, max = 100 }: { label: string; score: number | null; max?: number }) {
  const pct = score !== null ? Math.round((score / max) * 100) : 0;
  const color = pct >= 85 ? "bg-green-500" : pct >= 70 ? "bg-yellow-500" : pct >= 55 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground print-text">{label}</span>
        <span className={cn("text-sm font-bold", pct >= 85 ? "text-green-500" : pct >= 70 ? "text-yellow-500" : pct >= 55 ? "text-orange-500" : "text-red-500")}>
          {score !== null ? `${score}/${max}` : "—"}
        </span>
      </div>
      <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden print-bar-bg">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls =
    severity === "high" || severity === "critical"
      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      : severity === "medium"
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  return (
    <span className={cn("inline-block px-2 py-0.5 rounded text-xs font-medium uppercase", cls)}>
      {severity}
    </span>
  );
}

export default function SessionPrintReport() {
  const { id } = useParams<{ id: string }>();
  const sessionId = parseInt(id ?? "0");

  const { data: session, isLoading } = trpc.sessions.get.useQuery({ id: sessionId });
  const { data: grade } = trpc.grades.get.useQuery({ sessionId });
  const { data: transcripts } = trpc.transcripts.getBySession.useQuery({ sessionId });
  const { data: complianceFlags } = trpc.compliance.getFlags.useQuery({ sessionId });
  const { data: coachingReport } = trpc.reports.get.useQuery({ sessionId });
  const { data: sessionFull } = trpc.sessions.getWithDetails.useQuery({ id: sessionId });
  const { data: checklist } = trpc.checklists.get.useQuery({ sessionId });

  useEffect(() => {
    document.title = session
      ? `Session Report — ${session.customerName || "Session #" + session.id} | ASURA Group`
      : "Session Report | ASURA Group";
  }, [session]);

  const suggestions = sessionFull?.suggestions ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-lg">Loading report...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-lg">Session not found.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, html { background: white !important; color: black !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-page { background: white !important; color: black !important; padding: 0 !important; }
          .print-card { break-inside: avoid; border: 1px solid #e5e7eb !important; background: white !important; color: black !important; }
          .print-text { color: #374151 !important; }
          .print-bar-bg { background: #e5e7eb !important; }
          .print-section { page-break-inside: avoid; }
          @page { margin: 0.75in; }
          .transcript-row:nth-child(even) { background: #f9fafb !important; }
        }
      `}</style>

      <div className="min-h-screen bg-background text-foreground print-page">
        {/* Print button */}
        <div className="no-print sticky top-0 z-50 bg-background/95 backdrop-blur border-b px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => window.print()}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
          >
            Print Report
          </button>
          <span className="text-xs text-muted-foreground">Print-optimized session report</span>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
          {/* Header */}
          <header className="text-center border-b pb-6 print-section">
            <h1 className="text-2xl font-bold tracking-tight">F&I Co-Pilot Session Report</h1>
            <p className="text-sm text-muted-foreground print-text mt-1">ASURA Group</p>
            <p className="text-xs text-muted-foreground print-text mt-0.5">
              Generated {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </header>

          {/* Session Metadata */}
          <section className="print-card rounded-lg border p-5 space-y-3 print-section">
            <h2 className="text-lg font-semibold">Session Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground print-text">Customer</span>
                <p className="font-medium">{session.customerName || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground print-text">Date</span>
                <p className="font-medium">
                  {session.startedAt ? format(new Date(session.startedAt), "MMM d, yyyy h:mm a") : "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground print-text">Deal Type</span>
                <p className="font-medium capitalize">{session.dealType || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground print-text">Vehicle</span>
                <p className="font-medium">
                  {[session.vehicleYear, session.vehicleMake, session.vehicleModel].filter(Boolean).join(" ") || "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground print-text">Deal Number</span>
                <p className="font-medium">{session.dealNumber || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground print-text">Duration</span>
                <p className="font-medium">
                  {session.durationSeconds
                    ? `${Math.floor(session.durationSeconds / 60)}m ${session.durationSeconds % 60}s`
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground print-text">Status</span>
                <p className="font-medium capitalize">{session.status || "—"}</p>
              </div>
            </div>
          </section>

          {/* Grade Breakdown */}
          {grade && (
            <section className="print-card rounded-lg border p-5 space-y-4 print-section">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Grade Breakdown</h2>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground print-text">Overall Score</span>
                  <p className={cn(
                    "text-2xl font-bold",
                    (grade.overallScore ?? 0) >= 85
                      ? "text-green-500"
                      : (grade.overallScore ?? 0) >= 70
                        ? "text-yellow-500"
                        : (grade.overallScore ?? 0) >= 55
                          ? "text-orange-500"
                          : "text-red-500"
                  )}>
                    {grade.overallScore ?? "—"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <ScoreBar label="Rapport" score={grade.rapportScore} />
                <ScoreBar label="Product Presentation" score={grade.productPresentationScore} />
                <ScoreBar label="Objection Handling" score={grade.objectionHandlingScore} />
                <ScoreBar label="Compliance" score={grade.complianceScore} />
                <ScoreBar label="Closing Technique" score={grade.closingTechniqueScore} />
                <ScoreBar label="Script Fidelity" score={grade.scriptFidelityScore} />
              </div>
            </section>
          )}

          {/* Compliance Flags */}
          {complianceFlags && complianceFlags.length > 0 && (
            <section className="print-card rounded-lg border p-5 space-y-3 print-section">
              <h2 className="text-lg font-semibold">Compliance Flags</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-3 font-medium text-muted-foreground print-text">Rule</th>
                      <th className="py-2 pr-3 font-medium text-muted-foreground print-text">Severity</th>
                      <th className="py-2 pr-3 font-medium text-muted-foreground print-text">Speaker Text</th>
                      <th className="py-2 font-medium text-muted-foreground print-text">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceFlags.map((flag: any, i: number) => (
                      <tr key={flag.id ?? i} className="border-b last:border-b-0">
                        <td className="py-2 pr-3 font-medium">{flag.ruleName || flag.rule || "—"}</td>
                        <td className="py-2 pr-3">
                          <SeverityBadge severity={flag.severity || "low"} />
                        </td>
                        <td className="py-2 pr-3 text-xs max-w-xs truncate">{flag.speakerText || flag.text || "—"}</td>
                        <td className="py-2">
                          {flag.resolvedAt || flag.resolved ? (
                            <span className="text-green-600 font-medium text-xs">Resolved</span>
                          ) : (
                            <span className="text-red-600 font-medium text-xs">Unresolved</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ASURA Co-Pilot Suggestions */}
          {suggestions.length > 0 && (
            <section className="print-card rounded-lg border p-5 space-y-3 print-section">
              <h2 className="text-lg font-semibold">ASURA Co-Pilot Suggestions Used</h2>
              <div className="space-y-3">
                {suggestions.map((s: any, i: number) => (
                  <div key={s.id ?? i} className="border rounded-md p-3 print-card space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {s.type && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium uppercase">
                          {s.type}
                        </span>
                      )}
                      <span className="font-medium text-sm">{s.title || s.label || "Suggestion"}</span>
                      {s.wasActedOn ? (
                        <span className="ml-auto text-xs text-green-600 font-medium">Acted On</span>
                      ) : (
                        <span className="ml-auto text-xs text-muted-foreground print-text">Not Used</span>
                      )}
                    </div>
                    {(s.scriptText || s.text) && (
                      <p className="text-xs text-muted-foreground print-text italic leading-relaxed">
                        "{s.scriptText || s.text}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Checklist Results */}
          {checklist && Array.isArray(checklist) && checklist.length > 0 && (
            <section className="print-card rounded-lg border p-5 space-y-3 print-section">
              <h2 className="text-lg font-semibold">Checklist Results</h2>
              <div className="space-y-1.5">
                {checklist.map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className={cn("mt-0.5 text-base", item.completed || item.checked ? "text-green-500" : "text-muted-foreground")}>
                      {item.completed || item.checked ? "✓" : "○"}
                    </span>
                    <span className={cn(item.completed || item.checked ? "" : "text-muted-foreground print-text")}>
                      {item.label || item.name || item.text || `Item ${i + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Coaching Report */}
          {coachingReport && (
            <section className="print-card rounded-lg border p-5 space-y-3 print-section">
              <h2 className="text-lg font-semibold">Coaching Report</h2>
              {coachingReport.executiveSummary && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground print-text mb-1">Executive Summary</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{coachingReport.executiveSummary}</p>
                </div>
              )}
              {coachingReport.recommendations && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground print-text mb-1">Recommendations</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{coachingReport.recommendations}</p>
                </div>
              )}
            </section>
          )}

          {/* Full Transcript */}
          {transcripts && transcripts.length > 0 && (
            <section className="print-card rounded-lg border p-5 space-y-3 print-section">
              <h2 className="text-lg font-semibold">Full Transcript</h2>
              <div className="space-y-0 divide-y">
                {transcripts.map((t: any, i: number) => (
                  <div key={t.id ?? i} className="transcript-row py-2 flex gap-3 text-sm">
                    <div className="flex-shrink-0 w-16 text-xs text-muted-foreground print-text pt-0.5">
                      {t.startTime != null
                        ? `${Math.floor(t.startTime / 60)}:${String(Math.floor(t.startTime % 60)).padStart(2, "0")}`
                        : t.timestamp
                          ? format(new Date(t.timestamp), "h:mm:ss a")
                          : ""}
                    </div>
                    <div className="flex-shrink-0 w-20">
                      <span
                        className={cn(
                          "text-xs font-semibold uppercase",
                          t.speaker === "agent" || t.speaker === "fi_manager"
                            ? "text-blue-500"
                            : "text-emerald-500"
                        )}
                      >
                        {t.speaker === "fi_manager" ? "F&I Mgr" : t.speaker || "Unknown"}
                      </span>
                    </div>
                    <p className="flex-1 leading-relaxed">{t.text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Footer */}
          <footer className="text-center text-xs text-muted-foreground print-text pt-4 border-t">
            <p>F&I Co-Pilot by ASURA Group — Confidential</p>
            <p>Session #{session.id} — Generated {format(new Date(), "MMMM d, yyyy")}</p>
          </footer>
        </div>
      </div>
    </>
  );
}
