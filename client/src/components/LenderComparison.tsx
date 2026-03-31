import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DollarSign, Calculator, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ─── Types & Data ─────────────────────────────────────────────────────────────
export type CreditTier = "tier1" | "tier2" | "tier3" | "tier4";

export interface LenderRate {
  lender: string;
  tiers: Record<CreditTier, { baseRate: number; buydownRate: number; reserveSpread: number; maxTerm: number; minCreditScore: number }>;
}

export const CREDIT_TIERS: { value: CreditTier; label: string; range: string }[] = [
  { value: "tier1", label: "Tier 1", range: "720+" },
  { value: "tier2", label: "Tier 2", range: "680-719" },
  { value: "tier3", label: "Tier 3", range: "620-679" },
  { value: "tier4", label: "Tier 4", range: "<620" },
];

export const LENDER_DATA: LenderRate[] = [
  {
    lender: "Capital One Auto",
    tiers: {
      tier1: { baseRate: 4.49, buydownRate: 2.99, reserveSpread: 1.50, maxTerm: 72, minCreditScore: 720 },
      tier2: { baseRate: 5.99, buydownRate: 4.49, reserveSpread: 1.50, maxTerm: 72, minCreditScore: 680 },
      tier3: { baseRate: 8.49, buydownRate: 6.99, reserveSpread: 1.50, maxTerm: 60, minCreditScore: 620 },
      tier4: { baseRate: 12.99, buydownRate: 10.99, reserveSpread: 2.00, maxTerm: 48, minCreditScore: 500 },
    },
  },
  {
    lender: "Ally Financial",
    tiers: {
      tier1: { baseRate: 4.29, buydownRate: 2.79, reserveSpread: 1.50, maxTerm: 84, minCreditScore: 720 },
      tier2: { baseRate: 5.79, buydownRate: 4.29, reserveSpread: 1.50, maxTerm: 72, minCreditScore: 680 },
      tier3: { baseRate: 7.99, buydownRate: 6.49, reserveSpread: 1.50, maxTerm: 60, minCreditScore: 620 },
      tier4: { baseRate: 11.99, buydownRate: 9.99, reserveSpread: 2.00, maxTerm: 48, minCreditScore: 500 },
    },
  },
  {
    lender: "Chase Auto",
    tiers: {
      tier1: { baseRate: 4.69, buydownRate: 3.19, reserveSpread: 1.50, maxTerm: 72, minCreditScore: 720 },
      tier2: { baseRate: 6.19, buydownRate: 4.69, reserveSpread: 1.50, maxTerm: 72, minCreditScore: 680 },
      tier3: { baseRate: 8.99, buydownRate: 7.49, reserveSpread: 1.50, maxTerm: 60, minCreditScore: 620 },
      tier4: { baseRate: 13.49, buydownRate: 11.49, reserveSpread: 2.00, maxTerm: 48, minCreditScore: 500 },
    },
  },
  {
    lender: "Wells Fargo Dealer",
    tiers: {
      tier1: { baseRate: 4.39, buydownRate: 2.89, reserveSpread: 1.50, maxTerm: 75, minCreditScore: 720 },
      tier2: { baseRate: 5.89, buydownRate: 4.39, reserveSpread: 1.50, maxTerm: 72, minCreditScore: 680 },
      tier3: { baseRate: 8.29, buydownRate: 6.79, reserveSpread: 1.50, maxTerm: 60, minCreditScore: 620 },
      tier4: { baseRate: 12.49, buydownRate: 10.49, reserveSpread: 2.00, maxTerm: 48, minCreditScore: 500 },
    },
  },
  {
    lender: "US Bank DFS",
    tiers: {
      tier1: { baseRate: 4.59, buydownRate: 3.09, reserveSpread: 1.50, maxTerm: 72, minCreditScore: 720 },
      tier2: { baseRate: 6.09, buydownRate: 4.59, reserveSpread: 1.50, maxTerm: 72, minCreditScore: 680 },
      tier3: { baseRate: 8.69, buydownRate: 7.19, reserveSpread: 1.50, maxTerm: 60, minCreditScore: 620 },
      tier4: { baseRate: 13.19, buydownRate: 11.19, reserveSpread: 2.00, maxTerm: 48, minCreditScore: 500 },
    },
  },
];

export function calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualRate <= 0) return principal / termMonths;
  const r = annualRate / 100 / 12;
  const n = termMonths;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function findBestMatch(lenders: LenderRate[], tier: CreditTier): string {
  let best = "";
  let bestSpread = -1;
  for (const l of lenders) {
    const spread = l.tiers[tier].reserveSpread;
    if (spread > bestSpread) {
      bestSpread = spread;
      best = l.lender;
    }
  }
  return best;
}

export function getCreditTierFromScore(score: number): CreditTier {
  if (score >= 720) return "tier1";
  if (score >= 680) return "tier2";
  if (score >= 620) return "tier3";
  return "tier4";
}

const BAR_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#06b6d4", "#ec4899"];

export default function LenderComparison() {
  const [tier, setTier] = useState<CreditTier>("tier1");
  const [amount, setAmount] = useState("30000");
  const [term, setTerm] = useState("60");

  const bestMatch = useMemo(() => findBestMatch(LENDER_DATA, tier), [tier]);

  const tableData = useMemo(() => {
    return LENDER_DATA.map((l) => {
      const t = l.tiers[tier];
      const payment = calculateMonthlyPayment(parseFloat(amount) || 0, t.baseRate, parseInt(term) || 60);
      return { ...t, lender: l.lender, payment };
    });
  }, [tier, amount, term]);

  const bestRate = Math.min(...tableData.map((d) => d.baseRate));
  const worstRate = Math.max(...tableData.map((d) => d.baseRate));

  const chartData = useMemo(() => {
    return LENDER_DATA.map((l) => ({
      lender: l.lender.split(" ")[0],
      spread: l.tiers[tier].reserveSpread,
    }));
  }, [tier]);

  return (
    <div className="space-y-6">
      {/* Credit Tier Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">Credit Tier:</p>
        {CREDIT_TIERS.map((ct) => (
          <Button
            key={ct.value}
            size="sm"
            variant={tier === ct.value ? "default" : "outline"}
            className="text-xs h-7"
            onClick={() => setTier(ct.value)}
          >
            {ct.label} ({ct.range})
          </Button>
        ))}
      </div>

      {/* Rate Table */}
      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Lender Rate Comparison</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Lender</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Base Rate</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Buydown</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Reserve Spread</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Max Term</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Min Score</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Est. Payment</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row) => (
                  <tr
                    key={row.lender}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors",
                      row.lender === bestMatch && "bg-primary/5"
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {row.lender}
                        {row.lender === bestMatch && (
                          <Badge className="text-[9px] bg-primary/20 text-primary border-primary/30 gap-0.5">
                            <Star className="w-2.5 h-2.5" /> Best Match
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className={cn("px-4 py-3 text-right font-mono text-xs", row.baseRate === bestRate ? "text-green-400 font-bold" : row.baseRate === worstRate ? "text-red-400" : "text-foreground")}>
                      {row.baseRate.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-foreground">{row.buydownRate.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-foreground">{row.reserveSpread.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-right text-xs text-foreground">{row.maxTerm} mo</td>
                    <td className="px-4 py-3 text-right text-xs text-foreground">{row.minCreditScore}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-foreground">
                      ${row.payment.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Rate Calculator */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Rate Calculator</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Amount Financed ($)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Term (months)</Label>
              <Input
                type="number"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="bg-background border-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {tableData.map((row) => (
              <div
                key={row.lender}
                className={cn(
                  "p-3 rounded-lg border text-center",
                  row.lender === bestMatch ? "border-primary/30 bg-primary/5" : "border-border"
                )}
              >
                <p className="text-[10px] text-muted-foreground truncate">{row.lender}</p>
                <p className="text-lg font-bold text-foreground">${row.payment.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground">/month</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reserve Spread Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Reserve Spread Comparison — {CREDIT_TIERS.find((c) => c.value === tier)?.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="lender" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="spread" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
