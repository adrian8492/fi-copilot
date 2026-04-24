import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  Calculator,
  Share2,
  Printer,
  Target,
  Users,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const PVR_LIFT_BASELINE = 759;

export default function ROICalculator() {
  const [currentPVR, setCurrentPVR] = useState(1800);
  const [dealVolume, setDealVolume] = useState(200);
  const [fiManagers, setFiManagers] = useState(4);
  const [currentPenetration, setCurrentPenetration] = useState(48);
  const [coachingCost, setCoachingCost] = useState(15000);
  const [pvrLift, setPvrLift] = useState(PVR_LIFT_BASELINE);

  // ── Calculations ──────────────────────────────────────────────────
  const projectedPVR = currentPVR + pvrLift;
  const monthlyRevenueIncrease = pvrLift * dealVolume;
  const annualRevenueIncrease = monthlyRevenueIncrease * 12;
  const annualCoachingCost = coachingCost * 12;
  const roiMultiplier =
    annualCoachingCost > 0 ? annualRevenueIncrease / annualCoachingCost : 0;
  // Payback: how many months of coaching investment does the monthly revenue lift cover?
  const paybackPeriod =
    monthlyRevenueIncrease > 0 ? coachingCost / monthlyRevenueIncrease : 0;

  // Realistic penetration lift scales with your starting point
  // (lower baselines get bigger lifts, higher baselines are harder to move)
  const penetrationLift =
    currentPenetration < 40
      ? 20
      : currentPenetration < 60
        ? 15
        : currentPenetration < 75
          ? 10
          : 6;
  const projectedPenetration = Math.min(currentPenetration + penetrationLift, 100);

  // Products per deal = penetration % × 3 core protections on the menu
  const currentProductsPerDeal = +((currentPenetration / 100) * 3).toFixed(1);
  const projectedProductsPerDeal = +((projectedPenetration / 100) * 3).toFixed(1);

  const currentMonthlyRevenue = currentPVR * dealVolume;
  const projectedMonthlyRevenue = projectedPVR * dealVolume;

  // ── 12-month projection chart data ────────────────────────────────
  const chartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((month, i) => {
      const withoutASURA = currentPVR * dealVolume;
      // Gradual ramp: reaches full lift by month 4
      const rampFactor = Math.min((i + 1) / 4, 1);
      const withASURA = (currentPVR + pvrLift * rampFactor) * dealVolume;
      return {
        month,
        "Without ASURA": Math.round(withoutASURA),
        "With ASURA": Math.round(withASURA),
      };
    });
  }, [currentPVR, dealVolume, pvrLift]);

  // ── Share Report ──────────────────────────────────────────────────
  const handleShareReport = () => {
    const report = [
      "ASURA F&I ROI Calculator Report",
      "================================",
      "",
      `Current Avg PVR: $${currentPVR.toLocaleString()}`,
      `Projected PVR After ASURA: $${projectedPVR.toLocaleString()}`,
      `PVR Lift: $${pvrLift.toLocaleString()}`,
      `Monthly Deal Volume: ${dealVolume}`,
      `F&I Managers: ${fiManagers}`,
      "",
      "Results:",
      `  Monthly F&I Revenue Increase: $${monthlyRevenueIncrease.toLocaleString()}`,
      `  Annual Revenue Increase: $${annualRevenueIncrease.toLocaleString()}`,
      `  ROI Multiplier: ${roiMultiplier.toFixed(1)}x`,
      `  Payback Period: ${paybackPeriod.toFixed(1)} months`,
      `  Monthly Coaching Investment: $${coachingCost.toLocaleString()}`,
      "",
      "Powered by ASURA F&I Co-Pilot",
    ].join("\n");
    navigator.clipboard.writeText(report);
  };

  const handlePrint = () => {
    window.print();
  };

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <AppLayout title="ROI Calculator" subtitle="See the financial impact of ASURA coaching on your F&I department">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Hero */}
        <Card className="p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20">
          <div className="flex items-start gap-3">
            <Zap className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-foreground">$200M+ in F&I Revenue Generated for Clients</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Adrian's proven coaching methodology delivers an average PVR lift of ${PVR_LIFT_BASELINE} per deal.
                Enter your dealership's numbers below to see the projected financial impact of ASURA coaching.
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={handleShareReport}>
            <Share2 className="w-4 h-4 mr-1" /> Share Report
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4" /> Your Dealership Inputs
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Current Avg PVR ($)</label>
                <input
                  type="number"
                  value={currentPVR}
                  onChange={(e) => setCurrentPVR(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Monthly Deal Volume</label>
                <input
                  type="number"
                  value={dealVolume}
                  onChange={(e) => setDealVolume(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Number of F&I Managers</label>
                <input
                  type="number"
                  value={fiManagers}
                  onChange={(e) => setFiManagers(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Current Product Penetration (%)</label>
                <input
                  type="number"
                  value={currentPenetration}
                  onChange={(e) => setCurrentPenetration(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Monthly Coaching Investment ($)</label>
                <input
                  type="number"
                  value={coachingCost}
                  onChange={(e) => setCoachingCost(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Expected PVR Lift ($) — ASURA baseline $759
                </label>
                <input
                  type="number"
                  value={pvrLift}
                  onChange={(e) => setPvrLift(Number(e.target.value))}
                  className={inputClass}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Conservative: $500 · Baseline: $759 · Top-tier coached: $1,200+
                </p>
              </div>
            </div>
          </Card>

          {/* Output Panel */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Projected Results
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <DollarSign className="w-4 h-4" /> Projected PVR After ASURA
                </div>
                <p className="text-xl font-bold text-foreground">${projectedPVR.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <TrendingUp className="w-4 h-4" /> Monthly F&I Revenue Increase
                </div>
                <p className="text-xl font-bold text-green-400">${monthlyRevenueIncrease.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <DollarSign className="w-4 h-4" /> Annual Revenue Increase
                </div>
                <p className="text-xl font-bold text-green-400">${annualRevenueIncrease.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Target className="w-4 h-4" /> ROI Multiplier
                </div>
                <p className="text-xl font-bold text-foreground">{roiMultiplier.toFixed(1)}x</p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Zap className="w-4 h-4" /> Payback Period
                </div>
                <p className="text-xl font-bold text-foreground">
                  {paybackPeriod < 1
                    ? `${Math.max(1, Math.round(paybackPeriod * 30))} days`
                    : paybackPeriod < 2
                      ? `${paybackPeriod.toFixed(1)} month`
                      : `${paybackPeriod.toFixed(1)} months`}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Before vs After Comparison Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Avg PVR</p>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-sm text-muted-foreground line-through">${currentPVR.toLocaleString()}</p>
                <p className="text-xl font-bold text-green-400">${projectedPVR.toLocaleString()}</p>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400/30 text-xs">
                +${pvrLift}
              </Badge>
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Monthly Revenue</p>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-sm text-muted-foreground line-through">${currentMonthlyRevenue.toLocaleString()}</p>
                <p className="text-xl font-bold text-green-400">${projectedMonthlyRevenue.toLocaleString()}</p>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400/30 text-xs">
                +${monthlyRevenueIncrease.toLocaleString()}
              </Badge>
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Product Penetration</p>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-sm text-muted-foreground line-through">{currentPenetration}%</p>
                <p className="text-xl font-bold text-green-400">{projectedPenetration}%</p>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400/30 text-xs">
                +15%
              </Badge>
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Products per Deal</p>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-sm text-muted-foreground line-through">{currentProductsPerDeal}</p>
                <p className="text-xl font-bold text-green-400">{projectedProductsPerDeal}</p>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400/30 text-xs">
                +{(projectedProductsPerDeal - currentProductsPerDeal).toFixed(1)}
              </Badge>
            </div>
          </Card>
        </div>

        {/* Revenue Projection Chart */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">12-Month Revenue Projection</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                stroke="hsl(var(--border))"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                stroke="hsl(var(--border))"
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, undefined]} />
              <Legend />
              <Area
                type="monotone"
                dataKey="Without ASURA"
                stroke="#6b7280"
                fill="#6b7280"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="With ASURA"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Sensitivity Slider */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" /> Sensitivity Analysis
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Adjust the projected PVR lift to see how different coaching outcomes affect your ROI.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">PVR Lift: <span className="font-bold text-foreground">${pvrLift}</span></span>
              <span className="text-xs text-muted-foreground">Range: $559 - $959</span>
            </div>
            <input
              type="range"
              min={559}
              max={959}
              value={pvrLift}
              onChange={(e) => setPvrLift(Number(e.target.value))}
              className="w-full accent-green-500"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Conservative ($559)</span>
              <span className="text-green-400 font-medium">Baseline (${PVR_LIFT_BASELINE})</span>
              <span>Aggressive ($959)</span>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
