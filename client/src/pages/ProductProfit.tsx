import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState, useMemo } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Package, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, ZAxis, PieChart, Pie, Legend,
} from "recharts";

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#84cc16"];

const PRODUCTS = ["GAP", "VSC", "Tire & Wheel", "PDR", "Key Replacement", "Theft Deterrent", "Prepaid Maintenance", "Credit Life & Disability", "Appearance Protection", "Lease Wear Protection"];

const MANAGERS = ["Marcus Rivera", "Jessica Chen", "David Washington", "Sarah Kim", "James Patterson", "Maria Lopez", "Robert Taylor", "Amanda Foster"];

const PERIODS = ["MTD", "Last 30", "Last 90", "YTD"] as const;

function genProductData(periodIdx: number) {
  const seed = (i: number) => ((i + 1) * 17 + periodIdx * 7) % 100;
  return PRODUCTS.map((name, i) => {
    const s = seed(i);
    const units = 15 + (s % 40);
    const avgCost = [280, 650, 180, 120, 95, 70, 200, 350, 160, 140][i];
    const avgRetail = [895, 2100, 699, 499, 399, 299, 549, 795, 599, 449][i];
    const margin = Math.round(((avgRetail - avgCost) / avgRetail) * 100);
    const totalGross = units * (avgRetail - avgCost);
    const priorUnits = units + Math.round((Math.random() - 0.5) * 10);
    return { name, units, avgCost, avgRetail, avgGross: avgRetail - avgCost, margin, totalGross, priorUnits, trend: units > priorUnits ? "up" : units < priorUnits ? "down" : "flat" };
  });
}

function genManagerBreakdown() {
  return MANAGERS.map((mgr) => {
    const obj: Record<string, number | string> = { manager: mgr.split(" ")[0] };
    PRODUCTS.forEach((p, i) => { obj[p] = 3 + (((MANAGERS.indexOf(mgr) + i) * 13) % 15); });
    return obj;
  });
}

export default function ProductProfit() {
  useEffect(() => { document.title = "Product Profitability | F&I Co-Pilot by ASURA Group"; }, []);

  const [period, setPeriod] = useState<string>("MTD");
  const [showPrior, setShowPrior] = useState(false);

  const periodIdx = PERIODS.indexOf(period as typeof PERIODS[number]);
  const products = useMemo(() => genProductData(periodIdx), [periodIdx]);
  const managerData = useMemo(() => genManagerBreakdown(), []);

  const totalSold = products.reduce((s, p) => s + p.units, 0);
  const totalBackGross = products.reduce((s, p) => s + p.totalGross, 0);
  const avgGrossPerProduct = Math.round(totalBackGross / totalSold);
  const best = products.reduce((a, b) => a.margin > b.margin ? a : b);
  const worst = products.reduce((a, b) => a.margin < b.margin ? a : b);
  const underperforming = products.filter((p) => p.margin < 25);

  const waterfall = [...products].sort((a, b) => b.totalGross - a.totalGross);
  const scatterData = products.map((p) => ({ name: p.name, x: p.avgCost, y: p.avgRetail, z: p.units }));
  const pieData = products.map((p, i) => ({ name: p.name, value: p.units, fill: PIE_COLORS[i] }));

  return (
    <AppLayout title="Product Profitability Center" subtitle="Margin analysis and product performance">
      <div className="p-6 space-y-6">
        {/* Period + Toggle */}
        <div className="flex flex-wrap items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{PERIODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
          <button className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setShowPrior(!showPrior)}>
            {showPrior ? "Hide" : "Show"} Prior Month Comparison
          </button>
        </div>

        {/* Top KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Products Sold", value: totalSold.toLocaleString(), icon: Package },
            { label: "Total Back Gross", value: `$${totalBackGross.toLocaleString()}`, icon: DollarSign },
            { label: "Avg Gross/Product", value: `$${avgGrossPerProduct.toLocaleString()}`, icon: BarChart3 },
            { label: "Best Margin", value: `${best.name} (${best.margin}%)`, icon: TrendingUp },
            { label: "Worst Margin", value: `${worst.name} (${worst.margin}%)`, icon: TrendingDown },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
                <p className="text-sm font-bold">{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Underperforming Alert */}
        {underperforming.length > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-500">Underperforming Products (margin &lt; 25%)</p>
              <p className="text-xs text-muted-foreground mt-1">
                {underperforming.map((p) => `${p.name} (${p.margin}%)`).join(", ")} — Review cost structure and negotiate better dealer cost.
              </p>
            </div>
          </div>
        )}

        {/* Product P&L Table */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Product P&L</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2">Product</th><th className="pb-2 text-right">Units</th>{showPrior && <th className="pb-2 text-right">Prior</th>}
                    <th className="pb-2 text-right">Avg Retail</th><th className="pb-2 text-right">Avg Cost</th>
                    <th className="pb-2 text-right">Avg Gross</th><th className="pb-2 text-right">Margin %</th>
                    <th className="pb-2 text-right">Total Gross</th><th className="pb-2 text-center">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.name} className={`border-b border-border/50 ${p.margin < 25 ? "bg-red-500/5" : ""}`}>
                      <td className="py-2 font-medium">{p.name}</td>
                      <td className="py-2 text-right">{p.units}</td>
                      {showPrior && <td className="py-2 text-right text-muted-foreground">{p.priorUnits}</td>}
                      <td className="py-2 text-right">${p.avgRetail.toLocaleString()}</td>
                      <td className="py-2 text-right">${p.avgCost.toLocaleString()}</td>
                      <td className="py-2 text-right">${p.avgGross.toLocaleString()}</td>
                      <td className="py-2 text-right">
                        <Badge variant="outline" className={p.margin < 25 ? "text-red-500 border-red-500/30" : "text-green-500 border-green-500/30"}>{p.margin}%</Badge>
                      </td>
                      <td className="py-2 text-right">${p.totalGross.toLocaleString()}</td>
                      <td className="py-2 text-center">
                        {p.trend === "up" ? <TrendingUp className="w-4 h-4 text-green-500 inline" /> : p.trend === "down" ? <TrendingDown className="w-4 h-4 text-red-500 inline" /> : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Waterfall + Scatter */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Margin Waterfall (by Total Gross)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={waterfall} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Total Gross"]} />
                  <Bar dataKey="totalGross" radius={[0, 4, 4, 0]}>
                    {waterfall.map((p, i) => <Cell key={i} fill={p.margin < 25 ? "#ef4444" : PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Cost vs Revenue (bubble = units)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="x" type="number" name="Avg Cost" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="y" type="number" name="Avg Retail" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <ZAxis dataKey="z" type="number" range={[40, 400]} name="Units" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number, name: string) => [name === "Avg Cost" || name === "Avg Retail" ? `$${v}` : v, name]} />
                  <Scatter data={scatterData} fill="#6366f1" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Manager Breakdown + Pie */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Per-Manager Product Breakdown</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={managerData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="manager" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {PRODUCTS.slice(0, 5).map((p, i) => (
                    <Bar key={p} dataKey={p} stackId="a" fill={PIE_COLORS[i]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><PieChartIcon className="w-4 h-4" />Product Mix</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
