import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState, useMemo } from "react";
import { Camera, Printer, Share2, TrendingUp, TrendingDown } from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from "recharts";

const MANAGERS = [
  { id: "m1", name: "Marcus Rivera", tenure: "4 years", store: "Downtown Honda" },
  { id: "m2", name: "Jessica Chen", tenure: "6 years", store: "Eastside Toyota" },
  { id: "m3", name: "David Washington", tenure: "2 years", store: "Metro Ford" },
  { id: "m4", name: "Sarah Kim", tenure: "5 years", store: "Lakeside Chevrolet" },
  { id: "m5", name: "James Patterson", tenure: "3 years", store: "Central Nissan" },
  { id: "m6", name: "Maria Lopez", tenure: "7 years", store: "Westfield BMW" },
  { id: "m7", name: "Robert Taylor", tenure: "1 year", store: "Northgate Hyundai" },
  { id: "m8", name: "Amanda Foster", tenure: "4 years", store: "Parkway Kia" },
];

const PERIODS = ["This Month", "Last Month", "Last 90 Days", "YTD"] as const;

function genSparkline(base: number, variance: number) {
  return Array.from({ length: 12 }, (_, i) => ({
    week: `W${i + 1}`,
    value: Math.round(base + (Math.random() - 0.5) * variance),
  }));
}

function genManagerData(seed: number) {
  const s = (n: number) => Math.round(n + (((seed * 7 + 13) % 100) - 50) * (n / 200));
  const deals = s(42);
  const pvr = s(1850);
  const revenue = deals * pvr;
  const penetration = Math.min(98, Math.max(35, s(68)));
  const compliance = Math.min(100, Math.max(70, s(92)));
  const coaching = Math.min(100, Math.max(55, s(78)));

  return {
    kpis: [
      { label: "Total Deals", value: deals, fmt: String(deals), spark: genSparkline(deals, 10) },
      { label: "Avg PVR", value: pvr, fmt: `$${pvr.toLocaleString()}`, spark: genSparkline(pvr, 300) },
      { label: "Total F&I Revenue", value: revenue, fmt: `$${revenue.toLocaleString()}`, spark: genSparkline(revenue, 5000) },
      { label: "Product Penetration %", value: penetration, fmt: `${penetration}%`, spark: genSparkline(penetration, 8) },
      { label: "Compliance Score", value: compliance, fmt: `${compliance}%`, spark: genSparkline(compliance, 5) },
      { label: "Coaching Score", value: coaching, fmt: `${coaching}%`, spark: genSparkline(coaching, 10) },
    ],
    products: [
      { name: "VSC", units: s(28), penetration: s(62), avgPrice: s(2100), totalRevenue: s(58800) },
      { name: "GAP", units: s(22), penetration: s(48), avgPrice: s(895), totalRevenue: s(19690) },
      { name: "Tire & Wheel", units: s(18), penetration: s(40), avgPrice: s(699), totalRevenue: s(12582) },
      { name: "PDR", units: s(15), penetration: s(33), avgPrice: s(499), totalRevenue: s(7485) },
      { name: "Key Replacement", units: s(12), penetration: s(26), avgPrice: s(399), totalRevenue: s(4788) },
      { name: "Prepaid Maintenance", units: s(20), penetration: s(44), avgPrice: s(549), totalRevenue: s(10980) },
      { name: "Theft Deterrent", units: s(10), penetration: s(22), avgPrice: s(299), totalRevenue: s(2990) },
      { name: "Appearance Protection", units: s(14), penetration: s(31), avgPrice: s(599), totalRevenue: s(8386) },
    ],
    radar: [
      { axis: "Opening", value: Math.min(100, Math.max(40, s(75))) },
      { axis: "Needs Discovery", value: Math.min(100, Math.max(40, s(82))) },
      { axis: "Menu Presentation", value: Math.min(100, Math.max(40, s(70))) },
      { axis: "Product Knowledge", value: Math.min(100, Math.max(40, s(88))) },
      { axis: "Objection Handling", value: Math.min(100, Math.max(40, s(65))) },
      { axis: "Closing", value: Math.min(100, Math.max(40, s(72))) },
    ],
    wins: [
      { deal: `Deal #${1000 + seed}`, pvr: s(3200), products: "VSC + GAP + Tire & Wheel" },
      { deal: `Deal #${1020 + seed}`, pvr: s(2800), products: "VSC + Prepaid Maintenance" },
      { deal: `Deal #${1035 + seed}`, pvr: s(2500), products: "GAP + PDR + Key Replacement" },
    ],
    focusAreas: [
      { metric: "Objection Handling", score: Math.min(100, Math.max(30, s(55))), tip: "Practice rebuttal scripts for payment objection" },
      { metric: "Menu Presentation", score: Math.min(100, Math.max(30, s(60))), tip: "Use full menu presentation on every deal" },
      { metric: "Closing Rate", score: Math.min(100, Math.max(30, s(58))), tip: "Implement assumptive close technique" },
    ],
    weeklyPVR: Array.from({ length: 12 }, (_, i) => ({
      week: `W${i + 1}`,
      pvr: Math.round(pvr + (Math.random() - 0.5) * 400),
    })),
  };
}

export default function FISnapshot() {
  useEffect(() => { document.title = "F&I Snapshot | F&I Co-Pilot by ASURA Group"; }, []);

  const [managerId, setManagerId] = useState(MANAGERS[0].id);
  const [period, setPeriod] = useState<string>("This Month");

  const manager = MANAGERS.find((m) => m.id === managerId)!;
  const data = useMemo(() => genManagerData(MANAGERS.indexOf(manager) + (PERIODS.indexOf(period as typeof PERIODS[number]) * 3)), [managerId, period]);

  const handleShare = () => {
    const lines = [
      `F&I Snapshot: ${manager.name} — ${period}`,
      `Store: ${manager.store}`,
      "",
      ...data.kpis.map((k) => `${k.label}: ${k.fmt}`),
      "",
      "Top Wins:",
      ...data.wins.map((w) => `  ${w.deal}: $${w.pvr.toLocaleString()} PVR (${w.products})`),
      "",
      "Focus Areas:",
      ...data.focusAreas.map((f) => `  ${f.metric}: ${f.score}% — ${f.tip}`),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
  };

  return (
    <AppLayout title="F&I Snapshot Report" subtitle="One-page printable performance snapshot">
      <div className="p-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <Select value={managerId} onValueChange={setManagerId}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MANAGERS.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}><Share2 className="w-4 h-4 mr-1" />Share</Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" />Print</Button>
          </div>
        </div>

        {/* Snapshot Header */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-lg font-bold text-primary">
                {manager.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <h2 className="text-lg font-bold">{manager.name}</h2>
                <p className="text-sm text-muted-foreground">{manager.store} &middot; {manager.tenure} &middot; {period}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {data.kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="pt-4 pb-2 text-center">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-xl font-bold mt-1">{kpi.fmt}</p>
                <div className="h-10 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpi.spark}>
                      <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Product Leaderboard + Radar */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-sm">Product Leaderboard</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2">Product</th><th className="pb-2 text-right">Units</th><th className="pb-2 text-right">Pen %</th><th className="pb-2 text-right">Avg Price</th><th className="pb-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.products.map((p) => (
                      <tr key={p.name} className="border-b border-border/50">
                        <td className="py-2 font-medium">{p.name}</td>
                        <td className="py-2 text-right">{p.units}</td>
                        <td className="py-2 text-right">{p.penetration}%</td>
                        <td className="py-2 text-right">${p.avgPrice.toLocaleString()}</td>
                        <td className="py-2 text-right">${p.totalRevenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Objection Handling Score</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={data.radar}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Wins + Focus Areas */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" />Top 3 Wins</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.wins.map((w, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <div>
                    <p className="font-medium text-sm">{w.deal}</p>
                    <p className="text-xs text-muted-foreground">{w.products}</p>
                  </div>
                  <Badge variant="outline" className="text-green-500 border-green-500/30">${w.pvr.toLocaleString()} PVR</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="w-4 h-4 text-amber-500" />Coaching Focus Areas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.focusAreas.map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-accent/50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{f.metric}</p>
                    <Badge variant="outline" className="text-amber-500 border-amber-500/30">{f.score}%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{f.tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Month-over-Month PVR Trend */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Weekly PVR Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.weeklyPVR}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => [`$${v.toLocaleString()}`, "PVR"]} />
                <Area type="monotone" dataKey="pvr" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
