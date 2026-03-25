import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { ShieldAlert, AlertTriangle, TrendingDown, CheckCircle2, XCircle } from "lucide-react";

const PRODUCT_COLORS: Record<string, string> = {
  "Vehicle Service Contract": "#3b82f6",
  "GAP Insurance": "#10b981",
  "Prepaid Maintenance": "#f59e0b",
  "Interior/Exterior Protection": "#8b5cf6",
  "Road Hazard": "#06b6d4",
  "Paintless Dent Repair": "#ec4899",
  "Key Replacement": "#f97316",
  "Windshield Protection": "#84cc16",
  "Lease Wear & Tear": "#a78bfa",
  "Other": "#64748b",
};

const CONCERN_COLORS: Record<string, string> = {
  "Cost": "#ef4444",
  "Confidence in Current Coverage": "#f59e0b",
  "Low Usage Expectation": "#8b5cf6",
  "Skepticism About Dealer Motives": "#ec4899",
  "Misunderstanding / Lack of Info": "#06b6d4",
  "DIY / Self-Insurance Preference": "#10b981",
  "Perception of Low Risk": "#3b82f6",
  "Concerns About Exclusions": "#f97316",
  "Financial Constraints": "#ef4444",
  "Other": "#64748b",
};

type ViewMode = "product" | "concern";

export default function ObjectionAnalysis() {
  useEffect(() => { document.title = "Objection Analysis | F&I Co-Pilot by ASURA Group"; }, []);
  const [viewMode, setViewMode] = useState<ViewMode>("product");

  const { data: byProduct, isLoading: loadingProduct } = trpc.objections.analysisByProduct.useQuery({});
  const { data: byConcern, isLoading: loadingConcern } = trpc.objections.analysisByConcern.useQuery({});

  const loading = viewMode === "product" ? loadingProduct : loadingConcern;
  const chartData = viewMode === "product" ? (byProduct?.chartData ?? []) : (byConcern?.chartData ?? []);
  const tableData = viewMode === "product" ? (byProduct?.tableData ?? []) : (byConcern?.tableData ?? []);

  const totalObjections = chartData.reduce((s, d) => s + d.count, 0);
  const topItem = chartData[0];
  const resolvedCount = viewMode === "product"
    ? (byProduct?.tableData?.reduce((s: number, row: Record<string, unknown>) => s + (typeof row.dealCount === 'number' ? row.dealCount : 0), 0) ?? 0)
    : 0;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Objection Analysis</h1>
              <p className="text-slate-400 text-sm">Understand what customers are pushing back on and why</p>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("product")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === "product"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
            }`}
          >
            By Product
          </button>
          <button
            onClick={() => setViewMode("concern")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === "concern"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
            }`}
          >
            By Concern Type
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/10"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Total Objections</p>
                <p className="text-2xl font-bold text-white">{totalObjections}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10"><TrendingDown className="w-5 h-5 text-amber-400" /></div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Top {viewMode === "product" ? "Product" : "Concern"}</p>
                <p className="text-base font-bold text-white truncate max-w-[160px]">
                  {topItem ? (viewMode === "product" ? (topItem as {product: string}).product : (topItem as {concern: string}).concern) : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10"><CheckCircle2 className="w-5 h-5 text-emerald-400" /></div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Unique {viewMode === "product" ? "Products" : "Concerns"}</p>
                <p className="text-2xl font-bold text-white">{chartData.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Chart */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Objections {viewMode === "product" ? "by Product" : "by Concern Type"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 bg-slate-700/30 rounded animate-pulse" />
            ) : chartData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                <ShieldAlert className="w-12 h-12 mb-3 opacity-30" />
                <p>No objection data yet. Log objections during live sessions.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey={viewMode === "product" ? "product" : "concern"}
                    tick={{ fill: "#e2e8f0", fontSize: 11 }}
                    width={200}
                  />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    formatter={(value: number) => [`${value} objections`, "Count"]}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {chartData.map((entry, index) => {
                      const key = viewMode === "product"
                        ? (entry as {product: string}).product
                        : (entry as {concern: string}).concern;
                      const colorMap = viewMode === "product" ? PRODUCT_COLORS : CONCERN_COLORS;
                      return <Cell key={index} fill={colorMap[key] ?? "#3b82f6"} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Per-Manager Breakdown Table */}
        {tableData.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">
                Per-Manager Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-3 text-slate-400 font-medium">Manager</th>
                      <th className="text-right py-3 px-3 text-slate-400 font-medium">Total Objections</th>
                      {chartData.slice(0, 5).map((d) => (
                        <th key={viewMode === "product" ? (d as {product:string}).product : (d as {concern:string}).concern}
                          className="text-right py-3 px-3 text-slate-400 font-medium text-xs">
                          {viewMode === "product"
                            ? (d as {product:string}).product.split(" ").slice(0, 2).join(" ")
                            : (d as {concern:string}).concern.split(" ").slice(0, 2).join(" ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row: Record<string, unknown>) => (
                      <tr key={String(row.userId)} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                              {String(row.name ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                            </div>
                            <span className="text-white font-medium">{String(row.name)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-red-400">{String(row.dealCount)}</td>
                        {chartData.slice(0, 5).map((d) => {
                          const key = viewMode === "product" ? (d as {product:string}).product : (d as {concern:string}).concern;
                          // Find the raw key from the data
                          const rawKeys = Object.keys(row).filter(k => !["userId","name","dealCount"].includes(k));
                          const matchKey = rawKeys.find(k => k.replace(/_/g, " ").toLowerCase() === key.toLowerCase());
                          const val = matchKey ? row[matchKey] : 0;
                          return (
                            <td key={key} className="py-3 px-3 text-right">
                              {val ? (
                                <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                                  <XCircle className="w-3 h-3" /> {String(val)}
                                </span>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Coaching Insight */}
        {chartData.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/20">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 mt-0.5">
                  <ShieldAlert className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-semibold mb-1">Coaching Insight</p>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {viewMode === "product" && topItem
                      ? `"${(topItem as {product:string}).product}" is your team's most objected product with ${topItem.count} objections. Focus your next training session on presenting this product earlier in the menu with stronger value anchoring before the price reveal.`
                      : viewMode === "concern" && topItem
                      ? `"${(topItem as {concern:string}).concern}" is the dominant objection driver with ${topItem.count} instances. Build a targeted objection-handling script for this concern and role-play it in your next team meeting.`
                      : "Log more objections during live sessions to unlock coaching insights."
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
