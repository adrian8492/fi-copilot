import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState, useMemo } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, ShieldAlert,
  User, Car, Calendar, Building2, Landmark, BarChart3, Target, Search,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine,
} from "recharts";

/* ── Constants ──────────────────────────────────────────────────────── */

const FI_MANAGERS = ["Marcus Rivera", "Jessica Chen", "David Washington", "Sarah Kim"];
const LENDERS = ["Ally Financial", "Chase Auto", "Capital One", "Wells Fargo", "Toyota Financial"];

const PRODUCT_CATALOG = [
  { name: "VSC",                   avgCost: 620, benchGross: 1380 },
  { name: "GAP",                   avgCost: 260, benchGross: 580 },
  { name: "Tire & Wheel",          avgCost: 170, benchGross: 480 },
  { name: "PDR",                   avgCost: 110, benchGross: 350 },
  { name: "Key Replacement",       avgCost: 80,  benchGross: 290 },
  { name: "Prepaid Maintenance",   avgCost: 190, benchGross: 320 },
  { name: "Theft Deterrent",       avgCost: 55,  benchGross: 210 },
  { name: "Appearance Protection", avgCost: 140, benchGross: 410 },
];

interface ProductSold {
  name: string;
  salePrice: number;
  cost: number;
  grossProfit: number;
  margin: number;
  benchGross: number;
  delta: number;
}

interface Deal {
  id: string;
  customer: string;
  vehicle: string;
  date: string;
  manager: string;
  lender: string;
  frontGross: number;
  amountFinanced: number;
  buyRate: number;
  sellRate: number;
  reserveDollars: number;
  maxReserve: number;
  productsSold: ProductSold[];
  productsPresented: number;
  chargebacks: number;
  dealAgeMonths: number;
}

/* ── Deterministic seeded random ────────────────────────────────────── */

function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 11) % 2147483647; return (s & 0x7fffffff) / 0x7fffffff; };
}

/* ── Generate 20 demo deals ─────────────────────────────────────────── */

function generateDeals(): Deal[] {
  const customers = [
    "James Henderson", "Patricia Morales", "Michael Thompson", "Linda Nguyen",
    "Robert Garcia", "Barbara Johnson", "William Anderson", "Elizabeth Patel",
    "David Martinez", "Jennifer Wilson", "Richard Brown", "Maria Rodriguez",
    "Joseph Taylor", "Susan Lee", "Thomas Davis", "Nancy Clark",
    "Charles Wright", "Karen Scott", "Daniel Mitchell", "Lisa Campbell",
  ];

  const vehicles = [
    "2025 Toyota Camry SE",        "2025 Honda CR-V EX-L",        "2024 Ford F-150 XLT",
    "2025 Chevrolet Equinox RS",   "2024 Nissan Rogue SV",        "2025 Hyundai Tucson SEL",
    "2025 Toyota RAV4 XLE",        "2024 BMW X3 xDrive30i",       "2025 Kia Telluride SX",
    "2024 Ford Explorer Limited",  "2025 Honda Accord Sport",     "2024 Chevrolet Silverado LT",
    "2025 Subaru Outback Premium", "2024 Toyota Highlander LE",   "2025 Mazda CX-50 Turbo",
    "2025 Hyundai Santa Fe Calligraphy", "2024 Ford Bronco Big Bend", "2025 Volkswagen Atlas SE",
    "2024 Jeep Grand Cherokee Laredo",   "2025 Honda Pilot Touring",
  ];

  return customers.map((customer, idx) => {
    const rng = seeded(idx * 137 + 42);

    const manager = FI_MANAGERS[idx % FI_MANAGERS.length];
    const lender = LENDERS[idx % LENDERS.length];
    const day = 1 + Math.floor(rng() * 28);
    const month = idx < 10 ? 3 : 4;
    const date = `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const frontGross = 1200 + Math.round(rng() * 2800);
    const amountFinanced = 24000 + Math.round(rng() * 28000);

    const buyRate = +(3.5 + rng() * 3.0).toFixed(2);
    const sellRate = +(buyRate + 1.0 + rng() * 2.0).toFixed(2);
    const spread = sellRate - buyRate;
    const reserveDollars = Math.round((spread / 100) * amountFinanced * (48 + Math.round(rng() * 24)) / 12);
    const maxReserve = Math.round(reserveDollars / (0.55 + rng() * 0.35));

    // Decide which products are sold (4-7 per deal)
    const numSold = 4 + Math.floor(rng() * 4);
    const shuffled = [...PRODUCT_CATALOG].sort(() => rng() - 0.5);
    const soldProducts = shuffled.slice(0, numSold).map((p) => {
      const grossProfit = Math.round(p.benchGross * (0.7 + rng() * 0.6));
      const salePrice = p.avgCost + grossProfit;
      const margin = Math.round((grossProfit / salePrice) * 100);
      return {
        name: p.name,
        salePrice,
        cost: p.avgCost,
        grossProfit,
        margin,
        benchGross: p.benchGross,
        delta: grossProfit - p.benchGross,
      };
    });

    const productsPresented = Math.min(8, numSold + 1 + Math.floor(rng() * 2));
    const chargebacks = rng() > 0.7 ? Math.round(150 + rng() * 400) : 0;
    const dealAgeMonths = Math.floor(rng() * 6);

    return {
      id: `D${2600 + idx}`,
      customer,
      vehicle: vehicles[idx],
      date,
      manager,
      lender,
      frontGross,
      amountFinanced,
      buyRate,
      sellRate,
      reserveDollars,
      maxReserve,
      productsSold: soldProducts,
      productsPresented,
      chargebacks,
      dealAgeMonths,
    };
  });
}

/* ── Waterfall custom shape ──────────────────────────────────────────── */

const WATERFALL_COLORS: Record<string, string> = {
  "Front Gross": "#6366f1",
  "Reserve": "#8b5cf6",
  "VSC": "#10b981",
  "GAP": "#06b6d4",
  "Other Products": "#f59e0b",
  "Chargebacks": "#ef4444",
  "Net F&I Gross": "#22c55e",
};

/* ── Component ──────────────────────────────────────────────────────── */

export default function DealProfit() {
  useEffect(() => { document.title = "Deal Profit Breakdown | F&I Co-Pilot by ASURA Group"; }, []);

  const deals = useMemo(() => generateDeals(), []);
  const [selectedDealId, setSelectedDealId] = useState(deals[0].id);
  const deal = useMemo(() => deals.find((d) => d.id === selectedDealId)!, [deals, selectedDealId]);

  /* ── Derived data ── */

  const totalProductGross = deal.productsSold.reduce((s, p) => s + p.grossProfit, 0);
  const vscGross = deal.productsSold.find((p) => p.name === "VSC")?.grossProfit ?? 0;
  const gapGross = deal.productsSold.find((p) => p.name === "GAP")?.grossProfit ?? 0;
  const otherProductGross = totalProductGross - vscGross - gapGross;
  const netFIGross = deal.reserveDollars + totalProductGross - deal.chargebacks;
  const totalGross = deal.frontGross + netFIGross;

  // Waterfall data
  const waterfallRaw = [
    { name: "Front Gross",     value: deal.frontGross },
    { name: "Reserve",         value: deal.reserveDollars },
    { name: "VSC",             value: vscGross },
    { name: "GAP",             value: gapGross },
    { name: "Other Products",  value: otherProductGross },
    { name: "Chargebacks",     value: -deal.chargebacks },
    { name: "Net F&I Gross",   value: 0 },
  ];

  let runningTotal = 0;
  const waterfallData = waterfallRaw.map((item, i) => {
    if (i === waterfallRaw.length - 1) {
      return { ...item, base: 0, value: totalGross };
    }
    const base = runningTotal;
    runningTotal += item.value;
    return { ...item, base, value: Math.abs(item.value) };
  });

  // Reserve detail
  const spreadBps = Math.round((deal.sellRate - deal.buyRate) * 100);
  const reserveEfficiency = Math.round((deal.reserveDollars / deal.maxReserve) * 100);

  // Money left on table
  const soldNames = new Set(deal.productsSold.map((p) => p.name));
  const unsoldProducts = PRODUCT_CATALOG.filter((p) => !soldNames.has(p.name));
  const missedGross = unsoldProducts.reduce((s, p) => s + p.benchGross, 0);

  // Comparison: manager avg, store avg, top quartile
  const managerDeals = deals.filter((d) => d.manager === deal.manager);
  const managerAvgPVR = Math.round(managerDeals.reduce((s, d) => s + d.productsSold.reduce((a, p) => a + p.grossProfit, 0) + d.reserveDollars, 0) / managerDeals.length);
  const storeAvgPVR = Math.round(deals.reduce((s, d) => s + d.productsSold.reduce((a, p) => a + p.grossProfit, 0) + d.reserveDollars, 0) / deals.length);
  const allPVRs = deals.map((d) => d.productsSold.reduce((a, p) => a + p.grossProfit, 0) + d.reserveDollars).sort((a, b) => b - a);
  const topQuartilePVR = allPVRs[Math.floor(allPVRs.length * 0.25)];
  const thisDealPVR = totalProductGross + deal.reserveDollars;

  // Penetration efficiency
  const penetrationPct = Math.round((deal.productsSold.length / deal.productsPresented) * 100);

  // Chargeback risk score
  const productRiskFactor = deal.productsSold.some((p) => p.name === "VSC") ? 15 : 0;
  const ageRisk = Math.min(40, deal.dealAgeMonths * 8);
  const chargebackRisk = Math.min(100, productRiskFactor + ageRisk + (deal.chargebacks > 0 ? 30 : 0) + Math.round(Math.max(0, 100 - reserveEfficiency) * 0.2));

  const riskColor = chargebackRisk >= 70 ? "text-red-500 border-red-500/30 bg-red-500/10" : chargebackRisk >= 40 ? "text-yellow-500 border-yellow-500/30 bg-yellow-500/10" : "text-green-500 border-green-500/30 bg-green-500/10";
  const riskLabel = chargebackRisk >= 70 ? "High" : chargebackRisk >= 40 ? "Medium" : "Low";

  return (
    <AppLayout title="Deal Profit Breakdown" subtitle="Deep-dive profit analysis for individual deals">
      <div className="p-6 space-y-6">

        {/* Deal Selector */}
        <div className="flex flex-wrap items-center gap-4">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedDealId} onValueChange={setSelectedDealId}>
            <SelectTrigger className="w-80"><SelectValue placeholder="Select a deal..." /></SelectTrigger>
            <SelectContent>
              {deals.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.customer} — {d.vehicle}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className={riskColor}>
            <ShieldAlert className="w-3 h-3 mr-1" />
            Chargeback Risk: {chargebackRisk}/100 ({riskLabel})
          </Badge>
        </div>

        {/* Deal Header */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[
                { label: "Customer", value: deal.customer, icon: User },
                { label: "Vehicle", value: deal.vehicle, icon: Car },
                { label: "Date", value: new Date(deal.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), icon: Calendar },
                { label: "F&I Manager", value: deal.manager, icon: Building2 },
                { label: "Lender", value: deal.lender, icon: Landmark },
                { label: "Total Gross", value: `$${totalGross.toLocaleString()}`, icon: DollarSign },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                  <p className="text-sm font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Profit Waterfall Chart */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Profit Waterfall</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={waterfallData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(v: number, name: string) => {
                    if (name === "base") return [null, null];
                    return [`$${v.toLocaleString()}`, "Amount"];
                  }}
                />
                <Bar dataKey="base" stackId="waterfall" fill="transparent" />
                <Bar dataKey="value" stackId="waterfall" radius={[4, 4, 0, 0]}>
                  {waterfallData.map((entry, i) => (
                    <Cell key={i} fill={WATERFALL_COLORS[entry.name] || "#6366f1"} />
                  ))}
                </Bar>
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product Breakdown Table + Reserve Detail */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-sm">Product-by-Product Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2">Product</th>
                      <th className="pb-2 text-right">Sale Price</th>
                      <th className="pb-2 text-right">Cost</th>
                      <th className="pb-2 text-right">Gross Profit</th>
                      <th className="pb-2 text-right">Margin %</th>
                      <th className="pb-2 text-right">Benchmark</th>
                      <th className="pb-2 text-right">vs Bench</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deal.productsSold.map((p) => (
                      <tr key={p.name} className="border-b border-border/50">
                        <td className="py-2 font-medium">{p.name}</td>
                        <td className="py-2 text-right">${p.salePrice.toLocaleString()}</td>
                        <td className="py-2 text-right">${p.cost.toLocaleString()}</td>
                        <td className="py-2 text-right font-semibold">${p.grossProfit.toLocaleString()}</td>
                        <td className="py-2 text-right">
                          <Badge variant="outline" className={p.margin >= 50 ? "text-green-500 border-green-500/30" : "text-yellow-500 border-yellow-500/30"}>{p.margin}%</Badge>
                        </td>
                        <td className="py-2 text-right text-muted-foreground">${p.benchGross.toLocaleString()}</td>
                        <td className="py-2 text-right">
                          <span className={p.delta >= 0 ? "text-green-500" : "text-red-500"}>
                            {p.delta >= 0 ? "+" : ""}{p.delta.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="py-2">Total Products</td>
                      <td className="py-2 text-right">${deal.productsSold.reduce((s, p) => s + p.salePrice, 0).toLocaleString()}</td>
                      <td className="py-2 text-right">${deal.productsSold.reduce((s, p) => s + p.cost, 0).toLocaleString()}</td>
                      <td className="py-2 text-right">${totalProductGross.toLocaleString()}</td>
                      <td className="py-2 text-right" colSpan={3}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Reserve Detail */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Reserve Calculation</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Buy Rate", value: `${deal.buyRate}%` },
                { label: "Sell Rate", value: `${deal.sellRate}%` },
                { label: "Spread", value: `${spreadBps} bps` },
                { label: "Amount Financed", value: `$${deal.amountFinanced.toLocaleString()}` },
                { label: "Reserve Earned", value: `$${deal.reserveDollars.toLocaleString()}` },
                { label: "Max Reserve", value: `$${deal.maxReserve.toLocaleString()}` },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium">{row.value}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-border">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Reserve Efficiency</span>
                  <span className={`font-bold ${reserveEfficiency >= 75 ? "text-green-500" : reserveEfficiency >= 50 ? "text-yellow-500" : "text-red-500"}`}>{reserveEfficiency}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${reserveEfficiency >= 75 ? "bg-green-500" : reserveEfficiency >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${reserveEfficiency}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Money Left on Table + Comparison Panel */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Money Left on Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Money Left on the Table
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unsoldProducts.length === 0 ? (
                <p className="text-sm text-green-500 font-medium">All products were sold on this deal!</p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {unsoldProducts.map((p) => (
                      <div key={p.name} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{p.name} (not sold)</span>
                        <span className="text-red-500 font-medium">+${p.benchGross.toLocaleString()} est.</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-red-500">Total Missed Opportunity</span>
                      <span className="text-lg font-bold text-red-500">${missedGross.toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Comparison Panel */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Deal vs Benchmarks (F&I PVR)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "This Deal", value: thisDealPVR, color: "bg-indigo-500" },
                { label: `${deal.manager.split(" ")[0]}'s Avg`, value: managerAvgPVR, color: "bg-violet-500" },
                { label: "Store Avg", value: storeAvgPVR, color: "bg-cyan-500" },
                { label: "Top Quartile", value: topQuartilePVR, color: "bg-green-500" },
              ].map((bar) => {
                const maxVal = Math.max(thisDealPVR, managerAvgPVR, storeAvgPVR, topQuartilePVR) * 1.1;
                const pct = Math.round((bar.value / maxVal) * 100);
                return (
                  <div key={bar.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{bar.label}</span>
                      <span className="font-semibold">${bar.value.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Penetration Efficiency + Chargeback Risk */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Penetration Efficiency */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Penetration Efficiency</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Target className="w-8 h-8 text-indigo-500" />
                <div>
                  <p className="text-2xl font-bold">{penetrationPct}%</p>
                  <p className="text-xs text-muted-foreground">{deal.productsSold.length} sold / {deal.productsPresented} presented</p>
                </div>
              </div>
              <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${penetrationPct >= 75 ? "bg-green-500" : penetrationPct >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${penetrationPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
              <div className="mt-4 space-y-1">
                {deal.productsSold.map((p) => (
                  <div key={p.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>{p.name}</span>
                  </div>
                ))}
                {unsoldProducts.filter((up) => deal.productsPresented > deal.productsSold.length).slice(0, deal.productsPresented - deal.productsSold.length).map((p) => (
                  <div key={p.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    <span>{p.name} (declined)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chargeback Risk Score */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Chargeback Risk Assessment</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <ShieldAlert className={`w-10 h-10 ${chargebackRisk >= 70 ? "text-red-500" : chargebackRisk >= 40 ? "text-yellow-500" : "text-green-500"}`} />
                <div>
                  <p className="text-3xl font-bold">{chargebackRisk}<span className="text-lg text-muted-foreground">/100</span></p>
                  <Badge variant="outline" className={riskColor}>{riskLabel} Risk</Badge>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Risk Factors</p>
                {[
                  { factor: "Deal Age", detail: `${deal.dealAgeMonths} months`, score: ageRisk, max: 40 },
                  { factor: "Product Mix (VSC)", detail: deal.productsSold.some((p) => p.name === "VSC") ? "Included" : "Not included", score: productRiskFactor, max: 15 },
                  { factor: "Existing Chargebacks", detail: deal.chargebacks > 0 ? `$${deal.chargebacks.toLocaleString()}` : "None", score: deal.chargebacks > 0 ? 30 : 0, max: 30 },
                  { factor: "Reserve Efficiency", detail: `${reserveEfficiency}%`, score: Math.round(Math.max(0, 100 - reserveEfficiency) * 0.2), max: 20 },
                ].map((rf) => (
                  <div key={rf.factor} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{rf.factor}</span>
                      <span className="text-muted-foreground ml-2 text-xs">({rf.detail})</span>
                    </div>
                    <span className={rf.score > rf.max * 0.6 ? "text-red-500 font-semibold" : "text-muted-foreground"}>{rf.score} pts</span>
                  </div>
                ))}
              </div>
              {deal.chargebacks > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-500">Active chargeback of <strong>${deal.chargebacks.toLocaleString()}</strong> on this deal.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}
