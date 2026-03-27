import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { ShieldAlert, AlertTriangle, TrendingDown, CheckCircle2, XCircle, BookOpen, Search, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

const ASURA_PLAYBOOK = [
  { id: 1, objection: "I don't want any add-ons", response: "I completely understand. The only reason I bring this up is..." },
  { id: 2, objection: "I need to think about it", response: "Of course. What specifically were you still on the fence about?" },
  { id: 3, objection: "It costs too much", response: "Compared to what? Let me show you what the actual monthly impact is..." },
  { id: 4, objection: "I already have coverage", response: "That's great. What type of coverage do you have? Let me make sure there's no overlap..." },
  { id: 5, objection: "My dealer back home does this cheaper", response: "I believe you. The difference is what's inside the contract..." },
  { id: 6, objection: "I just want the car payment", response: "I hear you. Everything I'm going to show you fits into one monthly number..." },
  { id: 7, objection: "I don't believe in extended warranties", response: "Most people feel that way until they see how manufacturers design vehicles today..." },
  { id: 8, objection: "My mechanic handles everything", response: "Great. This actually works alongside that relationship, not instead of it..." },
  { id: 9, objection: "I'll add it later", response: "I wish I could offer this later — these programs are only available at time of purchase..." },
  { id: 10, objection: "I never use these things", response: "You're probably right. Most people don't. But the ones who need it once..." },
];

function ObjectionPlaybook() {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!search) return ASURA_PLAYBOOK;
    const q = search.toLowerCase();
    return ASURA_PLAYBOOK.filter(
      (item) => item.objection.toLowerCase().includes(q) || item.response.toLowerCase().includes(q)
    );
  }, [search]);

  const handleCopy = (item: typeof ASURA_PLAYBOOK[0]) => {
    navigator.clipboard.writeText(`Customer: "${item.objection}"\n\nASURA Response: "${item.response}"`);
    setCopiedId(item.id);
    toast.success("Script copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card className="bg-gradient-to-b from-blue-900/20 to-card border-blue-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          <CardTitle className="text-white text-base">ASURA Objection Playbook</CardTitle>
        </div>
        <p className="text-xs text-slate-400 mt-1">Top 10 F&I objections with proven word tracks</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search objections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-slate-800/50 border-slate-700"
          />
        </div>

        {/* Playbook Items */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 rounded px-1.5 py-0.5 shrink-0">
                    #{item.id}
                  </span>
                  <p className="text-xs font-semibold text-red-300 leading-relaxed">
                    "{item.objection}"
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("w-7 h-7 shrink-0", copiedId === item.id ? "text-green-400" : "text-muted-foreground hover:text-blue-400")}
                  onClick={() => handleCopy(item)}
                  title="Copy Script"
                >
                  {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
              <div className="pl-6">
                <p className="text-xs text-emerald-300/90 leading-relaxed italic">
                  → "{item.response}"
                </p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No objections match your search.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

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
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column — Analysis */}
        <div className="xl:col-span-2 space-y-6">
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

      {/* Right Column — ASURA Objection Playbook */}
      <div className="xl:col-span-1">
        <ObjectionPlaybook />
      </div>
      </div>
      </div>
    </AppLayout>
  );
}
