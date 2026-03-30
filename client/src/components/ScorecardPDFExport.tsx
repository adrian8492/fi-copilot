import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScorecardData {
  managerName: string;
  dealership: string;
  dateRange: string;
  overallScore: number;
  subscores: { label: string; value: number }[];
  strengths: { label: string; value: number }[];
  improvements: { label: string; value: number }[];
  gradeTrend: number[];
  sessionsCount: number;
  avgPvr: number;
  penetrationPct: number;
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          strokeLinecap="round" transform="rotate(-90 60 60)"
        />
        <text x="60" y="55" textAnchor="middle" fontSize="28" fontWeight="bold" fill={color}>{score}</text>
        <text x="60" y="72" textAnchor="middle" fontSize="10" fill="#6b7280">/ 100</text>
      </svg>
    </div>
  );
}

function SubscoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "bg-green-500" : value >= 60 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function MiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return <span className="text-xs text-gray-400">—</span>;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 200;
  const h = 40;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4)}`).join(" ");
  return (
    <svg width={w} height={h} className="mx-auto">
      <polyline points={points} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export default function ScorecardPDFExport({ data }: { data: ScorecardData }) {
  const [showPreview, setShowPreview] = useState(false);

  const handlePrint = () => {
    setShowPreview(true);
    setTimeout(() => window.print(), 300);
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
        <FileDown className="w-4 h-4" /> Export Scorecard PDF
      </Button>

      {/* Print-only overlay */}
      <div
        id="scorecard-pdf-export"
        className={cn(
          "fixed inset-0 z-[9999] bg-white text-black overflow-auto",
          showPreview ? "block" : "hidden",
          "print:block"
        )}
      >
        <div className="max-w-[800px] mx-auto p-8 space-y-6">
          {/* Close button (hidden in print) */}
          <button
            onClick={() => setShowPreview(false)}
            className="absolute top-4 right-4 print:hidden p-2 rounded-full bg-gray-200 hover:bg-gray-300"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center border-b border-gray-300 pb-4">
            <h1 className="text-2xl font-bold">F&I Manager Scorecard</h1>
            <p className="text-gray-600 mt-1">{data.managerName} — {data.dealership}</p>
            <p className="text-gray-500 text-sm">{data.dateRange}</p>
          </div>

          {/* Overall Score Gauge */}
          <div className="flex justify-center">
            <ScoreGauge score={data.overallScore} />
          </div>

          {/* Subscore Bars */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold border-b border-gray-200 pb-1">Performance Subscores</h2>
            {data.subscores.map((s) => (
              <SubscoreBar key={s.label} label={s.label} value={s.value} />
            ))}
          </div>

          {/* Strengths & Improvements — two-column */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold border-b border-gray-200 pb-1 mb-3 text-green-700">Top 3 Strengths</h2>
              {data.strengths.map((s, i) => (
                <div key={i} className="flex justify-between py-1.5 px-2 rounded bg-green-50 border border-green-200 mb-2">
                  <span className="text-sm">{s.label}</span>
                  <span className="text-sm font-bold text-green-700">{s.value}%</span>
                </div>
              ))}
            </div>
            <div>
              <h2 className="text-lg font-semibold border-b border-gray-200 pb-1 mb-3 text-amber-700">Top 3 Improvement Areas</h2>
              {data.improvements.map((s, i) => (
                <div key={i} className="flex justify-between py-1.5 px-2 rounded bg-amber-50 border border-amber-200 mb-2">
                  <span className="text-sm">{s.label}</span>
                  <span className="text-sm font-bold text-amber-700">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grade Trend Sparkline */}
          <div>
            <h2 className="text-lg font-semibold border-b border-gray-200 pb-1 mb-3">Grade Trend (Last 30 Days)</h2>
            <MiniSparkline data={data.gradeTrend} />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg border">
              <p className="text-2xl font-bold text-indigo-600">{data.sessionsCount}</p>
              <p className="text-xs text-gray-500 mt-1">Sessions</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border">
              <p className="text-2xl font-bold text-emerald-600">${data.avgPvr.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Avg PVR</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border">
              <p className="text-2xl font-bold text-violet-600">{data.penetrationPct}%</p>
              <p className="text-xs text-gray-500 mt-1">Penetration</p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-300 pt-4 text-center text-xs text-gray-400">
            <p className="font-semibold">ASURA OPS — F&I Co-Pilot</p>
            <p>Generated on {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
          </div>

          {/* Print Again button (hidden in print) */}
          <div className="text-center print:hidden pt-2">
            <Button onClick={() => window.print()} className="gap-2">
              <FileDown className="w-4 h-4" /> Print / Save as PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body > *:not(#scorecard-pdf-export) { display: none !important; }
          #scorecard-pdf-export { display: block !important; position: static !important; }
          .print\\:hidden { display: none !important; }
          @page { margin: 0.5in; size: letter portrait; }
        }
      `}</style>
    </>
  );
}
