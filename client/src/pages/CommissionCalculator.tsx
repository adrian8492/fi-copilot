import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  Calculator,
  Zap,
  Trophy,
  Target,
  Printer,
  Copy,
  RotateCcw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

// ── Constants ───────────────────────────────────────────────────────
const ASURA_PVR_LIFT = 759;
const ASURA_PRODUCT_INCREASE = 0.12;
const TOP_1_PVR = 2500;
const TOP_1_PENETRATION = 0.65;

// ── Pay Plan Presets ────────────────────────────────────────────────
interface PayPlan {
  name: string;
  basePay: number;
  commissionRate: number;
  flatPerProduct: number;
  dealCount: number;
  avgBackGross: number;
  bonusThreshold: number;
  bonusAmount: number;
}

const PAY_PLANS: PayPlan[] = [
  { name: "Standard F&I Plan", basePay: 4000, commissionRate: 15, flatPerProduct: 25, dealCount: 150, avgBackGross: 1800, bonusThreshold: 120, bonusAmount: 2000 },
  { name: "Flat Rate Plan", basePay: 6000, commissionRate: 8, flatPerProduct: 50, dealCount: 150, avgBackGross: 1800, bonusThreshold: 140, bonusAmount: 1500 },
  { name: "Tiered Bonus Plan", basePay: 3000, commissionRate: 20, flatPerProduct: 15, dealCount: 150, avgBackGross: 1800, bonusThreshold: 100, bonusAmount: 3500 },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ── Commission Calculation ──────────────────────────────────────────
function calculateCommission(
  basePay: number,
  commissionRate: number,
  flatPerProduct: number,
  dealCount: number,
  avgBackGross: number,
  bonusThreshold: number,
  bonusAmount: number,
  productsPerDeal: number,
) {
  const totalBackGross = dealCount * avgBackGross;
  const backGrossCommission = totalBackGross * (commissionRate / 100);
  const totalProducts = Math.round(dealCount * productsPerDeal);
  const productCommission = totalProducts * flatPerProduct;
  const bonus = dealCount >= bonusThreshold ? bonusAmount : 0;
  const monthly = basePay + backGrossCommission + productCommission + bonus;
  return {
    basePay,
    backGrossCommission: Math.round(backGrossCommission),
    productCommission: Math.round(productCommission),
    bonus,
    monthly: Math.round(monthly),
    annual: Math.round(monthly * 12),
  };
}

// ── YTD Storage ─────────────────────────────────────────────────────
const YTD_KEY = "fi-copilot-commission-ytd";

function loadYTD(): number[] {
  try {
    const saved = localStorage.getItem(YTD_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 12) return parsed;
    }
  } catch {}
  return Array(12).fill(0);
}

function saveYTD(data: number[]) {
  localStorage.setItem(YTD_KEY, JSON.stringify(data));
}

export default function CommissionCalculator() {
  // Inputs
  const [basePay, setBasePay] = useState(4000);
  const [commissionRate, setCommissionRate] = useState(15);
  const [flatPerProduct, setFlatPerProduct] = useState(25);
  const [dealCount, setDealCount] = useState(150);
  const [avgBackGross, setAvgBackGross] = useState(1800);
  const [bonusThreshold, setBonusThreshold] = useState(120);
  const [bonusAmount, setBonusAmount] = useState(2000);
  const [productsPerDeal, setProductsPerDeal] = useState(2.2);
  const [pvrSlider, setPvrSlider] = useState(1800);
  const [selectedPreset, setSelectedPreset] = useState("Standard F&I Plan");

  // YTD Tracker
  const [ytdEarnings, setYtdEarnings] = useState<number[]>(loadYTD);
  const [annualTarget, setAnnualTarget] = useState(180000);

  useEffect(() => { saveYTD(ytdEarnings); }, [ytdEarnings]);

  // Current scenario
  const current = useMemo(() =>
    calculateCommission(basePay, commissionRate, flatPerProduct, dealCount, avgBackGross, bonusThreshold, bonusAmount, productsPerDeal)
  , [basePay, commissionRate, flatPerProduct, dealCount, avgBackGross, bonusThreshold, bonusAmount, productsPerDeal]);

  // ASURA scenario: +$759 PVR lift + 12% more products
  const asura = useMemo(() =>
    calculateCommission(basePay, commissionRate, flatPerProduct, dealCount, avgBackGross + ASURA_PVR_LIFT, bonusThreshold, bonusAmount, productsPerDeal * (1 + ASURA_PRODUCT_INCREASE))
  , [basePay, commissionRate, flatPerProduct, dealCount, avgBackGross, bonusThreshold, bonusAmount, productsPerDeal]);

  // Top 1% scenario
  const top1 = useMemo(() =>
    calculateCommission(basePay, commissionRate, flatPerProduct, dealCount, TOP_1_PVR, bonusThreshold, bonusAmount, productsPerDeal * (TOP_1_PENETRATION / (productsPerDeal / 4)))
  , [basePay, commissionRate, flatPerProduct, dealCount, bonusThreshold, bonusAmount, productsPerDeal]);

  // 12-month projection chart
  const projectionData = useMemo(() => {
    let cumCurrent = 0, cumAsura = 0, cumTop1 = 0;
    return MONTHS.map((month) => {
      cumCurrent += current.monthly;
      cumAsura += asura.monthly;
      cumTop1 += top1.monthly;
      return { month, "Current Pace": cumCurrent, "With ASURA": cumAsura, "Top 1%": cumTop1 };
    });
  }, [current.monthly, asura.monthly, top1.monthly]);

  // PVR slider impact
  const sliderComp = useMemo(() =>
    calculateCommission(basePay, commissionRate, flatPerProduct, dealCount, pvrSlider, bonusThreshold, bonusAmount, productsPerDeal)
  , [basePay, commissionRate, flatPerProduct, dealCount, pvrSlider, bonusThreshold, bonusAmount, productsPerDeal]);

  // YTD progress
  const ytdTotal = ytdEarnings.reduce((s, v) => s + v, 0);
  const ytdProgress = annualTarget > 0 ? Math.round((ytdTotal / annualTarget) * 100) : 0;

  const ytdChartData = MONTHS.map((month, i) => ({
    month,
    actual: ytdEarnings[i],
    target: Math.round(annualTarget / 12),
  }));

  // Load preset
  const applyPreset = (name: string) => {
    const preset = PAY_PLANS.find(p => p.name === name);
    if (!preset) return;
    setSelectedPreset(name);
    setBasePay(preset.basePay);
    setCommissionRate(preset.commissionRate);
    setFlatPerProduct(preset.flatPerProduct);
    setDealCount(preset.dealCount);
    setAvgBackGross(preset.avgBackGross);
    setBonusThreshold(preset.bonusThreshold);
    setBonusAmount(preset.bonusAmount);
  };

  const handlePrint = () => window.print();
  const handleShare = () => {
    const report = [
      "F&I Commission Calculator Report",
      "=================================",
      "",
      `Current Monthly: $${current.monthly.toLocaleString()} | Annual: $${current.annual.toLocaleString()}`,
      `With ASURA: $${asura.monthly.toLocaleString()}/mo | $${asura.annual.toLocaleString()}/yr`,
      `Top 1%: $${top1.monthly.toLocaleString()}/mo | $${top1.annual.toLocaleString()}/yr`,
      "",
      `ASURA Uplift: +$${(asura.monthly - current.monthly).toLocaleString()}/mo`,
      "",
      "Powered by ASURA F&I Co-Pilot",
    ].join("\n");
    navigator.clipboard.writeText(report);
  };

  const inputClass = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <AppLayout title="Commission Calculator" subtitle="Estimate monthly compensation and model ASURA impact on earnings">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Actions Row */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Pay Plan:</label>
            <select
              value={selectedPreset}
              onChange={(e) => applyPreset(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
            >
              {PAY_PLANS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
              <Copy className="w-4 h-4" /> Share
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>

        {/* Input Panel */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Pay Plan Inputs</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Base Pay ($)", value: basePay, setter: setBasePay },
              { label: "Commission Rate (%)", value: commissionRate, setter: setCommissionRate },
              { label: "Flat per Product ($)", value: flatPerProduct, setter: setFlatPerProduct },
              { label: "Monthly Deal Count", value: dealCount, setter: setDealCount },
              { label: "Avg Back Gross ($)", value: avgBackGross, setter: setAvgBackGross },
              { label: "Products per Deal", value: productsPerDeal, setter: setProductsPerDeal, step: 0.1 },
              { label: "Bonus Threshold (deals)", value: bonusThreshold, setter: setBonusThreshold },
              { label: "Bonus Amount ($)", value: bonusAmount, setter: setBonusAmount },
            ].map(inp => (
              <div key={inp.label}>
                <label className="text-xs text-muted-foreground mb-1 block">{inp.label}</label>
                <input
                  type="number"
                  value={inp.value}
                  onChange={(e) => inp.setter(+e.target.value)}
                  step={(inp as { step?: number }).step}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* 3 Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Current Pace", icon: Calculator, color: "blue", data: current, tag: "" },
            { label: "With ASURA Coaching", icon: Zap, color: "green", data: asura, tag: `+$${ASURA_PVR_LIFT} PVR lift, +12% products` },
            { label: "Top 1% Benchmark", icon: Trophy, color: "purple", data: top1, tag: `$${TOP_1_PVR} PVR, ${(TOP_1_PENETRATION * 100).toFixed(0)}% penetration` },
          ].map(scenario => (
            <Card key={scenario.label} className={`p-4 border-${scenario.color}-500/20`}>
              <div className="flex items-center gap-2 mb-3">
                <scenario.icon className={`w-4 h-4 text-${scenario.color}-500`} />
                <h3 className="text-sm font-semibold text-foreground">{scenario.label}</h3>
              </div>
              {scenario.tag && <p className="text-[10px] text-muted-foreground mb-2">{scenario.tag}</p>}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Base Pay</span><span className="text-foreground">${scenario.data.basePay.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Back Gross Commission</span><span className="text-foreground">${scenario.data.backGrossCommission.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Per-Product Commission</span><span className="text-foreground">${scenario.data.productCommission.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Bonus</span><span className={scenario.data.bonus > 0 ? "text-green-500" : "text-muted-foreground"}>{scenario.data.bonus > 0 ? `$${scenario.data.bonus.toLocaleString()}` : "—"}</span></div>
                <div className="border-t border-border pt-2 flex justify-between font-bold">
                  <span className="text-foreground">Monthly Total</span>
                  <span className={`text-${scenario.color}-500`}>${scenario.data.monthly.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-foreground">Annualized</span>
                  <span className={`text-${scenario.color}-500`}>${scenario.data.annual.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 12-Month Projection */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">12-Month Cumulative Earnings Projection</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAsura" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradTop1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="Current Pace" stroke="#3b82f6" fill="url(#gradCurrent)" strokeWidth={2} />
              <Area type="monotone" dataKey="With ASURA" stroke="#22c55e" fill="url(#gradAsura)" strokeWidth={2} />
              <Area type="monotone" dataKey="Top 1%" stroke="#a855f7" fill="url(#gradTop1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Income vs PVR Slider + YTD Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PVR Slider */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Income vs PVR Slider</h3>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Avg Back Gross (PVR)</span>
                <Badge variant="outline">${pvrSlider.toLocaleString()}</Badge>
              </div>
              <input
                type="range"
                min={800}
                max={3000}
                step={50}
                value={pvrSlider}
                onChange={(e) => setPvrSlider(+e.target.value)}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>$800</span><span>$1,500</span><span>$2,000</span><span>$2,500</span><span>$3,000</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Monthly Comp</p>
                <p className="text-xl font-bold text-primary">${sliderComp.monthly.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Annual Comp</p>
                <p className="text-xl font-bold text-green-500">${sliderComp.annual.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          {/* YTD Tracker */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500" /> YTD Earnings Tracker
              </h3>
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-muted-foreground">Target:</label>
                <input
                  type="number"
                  value={annualTarget}
                  onChange={(e) => setAnnualTarget(+e.target.value)}
                  className="w-24 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                />
                <button
                  onClick={() => { setYtdEarnings(Array(12).fill(0)); }}
                  className="text-muted-foreground hover:text-foreground"
                  title="Reset YTD"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">${ytdTotal.toLocaleString()} / ${annualTarget.toLocaleString()} ({ytdProgress}%)</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(ytdProgress, 100)}%` }} />
              </div>
            </div>
            {/* Monthly input grid */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {MONTHS.map((month, i) => (
                <div key={month}>
                  <label className="text-[9px] text-muted-foreground block">{month}</label>
                  <input
                    type="number"
                    value={ytdEarnings[i] || ""}
                    onChange={(e) => {
                      const next = [...ytdEarnings];
                      next[i] = +e.target.value || 0;
                      setYtdEarnings(next);
                    }}
                    placeholder="0"
                    className="w-full rounded border border-border bg-background px-1.5 py-1 text-[11px] text-foreground"
                  />
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={ytdChartData}>
                <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 11 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="actual" name="Actual" fill="#22c55e" radius={[2, 2, 0, 0]} />
                <Bar dataKey="target" name="Target" fill="#94a3b8" radius={[2, 2, 0, 0]} opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
