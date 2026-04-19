import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState, useMemo } from "react";
import { Car, DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const YEARS = Array.from({ length: 11 }, (_, i) => String(2025 - i));
const MAKES = ["Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "Hyundai", "Kia", "BMW", "Mercedes", "Tesla", "Jeep", "Ram"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor"] as const;

const ACV_BASE: Record<string, number> = {
  Toyota: 22000, Honda: 20000, Ford: 18000, Chevrolet: 17000, Nissan: 16000,
  Hyundai: 15000, Kia: 14500, BMW: 28000, Mercedes: 30000, Tesla: 32000, Jeep: 19000, Ram: 21000,
};

const CONDITION_MULT: Record<string, number> = { Excellent: 1.1, Good: 1.0, Fair: 0.85, Poor: 0.65 };

function lookupACV(year: string, make: string, condition: string): number {
  const base = ACV_BASE[make] ?? 18000;
  const age = 2025 - Number(year);
  const depreciation = Math.pow(0.85, age);
  return Math.round(base * depreciation * (CONDITION_MULT[condition] ?? 1));
}

function monthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / termMonths;
  return (principal * r) / (1 - Math.pow(1 + r, -termMonths));
}

const PRODUCTS = [
  { name: "VSC", monthlyAdd: 35 },
  { name: "GAP", monthlyAdd: 15 },
  { name: "Tire & Wheel", monthlyAdd: 12 },
  { name: "PDR", monthlyAdd: 8 },
  { name: "Key Replacement", monthlyAdd: 7 },
  { name: "Prepaid Maintenance", monthlyAdd: 10 },
  { name: "Theft Deterrent", monthlyAdd: 5 },
  { name: "Appearance Protection", monthlyAdd: 9 },
];

export default function TradeIn() {
  useEffect(() => { document.title = "Trade-In Analyzer | F&I Co-Pilot by ASURA Group"; }, []);

  const [year, setYear] = useState("2022");
  const [make, setMake] = useState("Toyota");
  const [model, setModel] = useState("");
  const [mileage, setMileage] = useState("45000");
  const [condition, setCondition] = useState("Good");
  const [payoff, setPayoff] = useState("12000");
  const [salePrice, setSalePrice] = useState("35000");
  const [rate, setRate] = useState("6.9");
  const [term, setTerm] = useState("72");
  const [budget, setBudget] = useState("650");

  const acv = useMemo(() => {
    let v = lookupACV(year, make, condition);
    const mi = Number(mileage);
    if (mi > 60000) v = Math.round(v * 0.92);
    else if (mi > 100000) v = Math.round(v * 0.82);
    return v;
  }, [year, make, condition, mileage]);

  const equity = acv - Number(payoff);
  const negEquity = equity < 0 ? Math.abs(equity) : 0;
  const posEquity = equity > 0 ? equity : 0;
  const financedAmount = Number(salePrice) + negEquity - posEquity;
  const payment = monthlyPayment(Math.max(0, financedAmount), Number(rate), Number(term));
  const budgetRemaining = Number(budget) - payment;
  const affordableProducts = PRODUCTS.filter((p) => p.monthlyAdd <= budgetRemaining);

  const equityData = [
    { label: "ACV", value: acv, fill: "#10b981" },
    { label: "Payoff", value: Number(payoff), fill: "#ef4444" },
    { label: "Equity", value: equity, fill: equity >= 0 ? "#10b981" : "#ef4444" },
  ];

  const tips: string[] = [];
  if (negEquity > 5000) tips.push("High negative equity — consider shorter term to minimize risk and present value-protection products like GAP.");
  if (negEquity > 0 && negEquity <= 5000) tips.push("Moderate negative equity — GAP coverage is essential. Present it as payment protection.");
  if (posEquity > 3000) tips.push("Strong positive equity — customer has room for premium warranty and protection packages. Present top-tier VSC.");
  if (posEquity > 0 && posEquity <= 3000) tips.push("Modest positive equity — good down payment potential. Structure deal to maximize F&I product penetration.");
  if (tips.length === 0) tips.push("Near-even trade — focus on value proposition and monthly payment impact of each product.");

  return (
    <AppLayout title="Trade-In Analyzer" subtitle="Evaluate trade equity and F&I product impact">
      <div className="p-6 space-y-6">
        {/* Vehicle Input */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Car className="w-4 h-4" />Trade-In Vehicle</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <Label>Year</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Make</Label>
                <Select value={make} onValueChange={setMake}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MAKES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Model</Label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. Camry" />
              </div>
              <div>
                <Label>Mileage</Label>
                <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} />
              </div>
              <div>
                <Label>Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trade Value + Equity */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Trade Value Estimate</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-accent/50">
                <span className="text-sm">Estimated ACV</span>
                <span className="font-bold text-lg">${acv.toLocaleString()}</span>
              </div>
              <div>
                <Label>Payoff Amount</Label>
                <Input type="number" value={payoff} onChange={(e) => setPayoff(e.target.value)} />
              </div>
              <div className={`flex justify-between items-center p-3 rounded-lg ${equity >= 0 ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                <span className="text-sm font-medium">Equity</span>
                <span className={`font-bold text-lg ${equity >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {equity >= 0 ? "+" : ""}{`$${equity.toLocaleString()}`}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Equity Visualization</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={equityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {equityData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Impact + Deal Structuring */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2">
              {equity >= 0 ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
              Impact on F&I
            </CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {equity >= 0 ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /><span>Positive equity = more cash down</span></div>
                  <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /><span>Lower monthly payment</span></div>
                  <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /><span>More room for F&I products</span></div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /><span>Negative equity rolled into loan</span></div>
                  <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /><span>Higher payment risk</span></div>
                  <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /><span>GAP coverage strongly recommended</span></div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Deal Structuring Tips</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {tips.map((tip, i) => (
                <div key={i} className="p-3 rounded-lg bg-accent/50 text-sm">{tip}</div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Payment Estimator */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4" />Monthly Payment Estimator</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label>Sale Price</Label>
                <Input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
              </div>
              <div>
                <Label>APR %</Label>
                <Input type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} />
              </div>
              <div>
                <Label>Term (months)</Label>
                <Input type="number" value={term} onChange={(e) => setTerm(e.target.value)} />
              </div>
              <div>
                <Label>Monthly Budget</Label>
                <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-accent/50 text-center">
                <p className="text-xs text-muted-foreground">Financed Amount</p>
                <p className="text-lg font-bold">${Math.max(0, financedAmount).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/50 text-center">
                <p className="text-xs text-muted-foreground">Monthly Payment</p>
                <p className="text-lg font-bold">${Math.round(payment).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/50 text-center">
                <p className="text-xs text-muted-foreground">Budget Remaining</p>
                <p className={`text-lg font-bold ${budgetRemaining >= 0 ? "text-green-500" : "text-red-500"}`}>${Math.round(budgetRemaining).toLocaleString()}/mo</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/50 text-center">
                <p className="text-xs text-muted-foreground">Products That Fit</p>
                <p className="text-lg font-bold">{affordableProducts.length} of {PRODUCTS.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Affordability */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Product Affordability</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PRODUCTS.map((p) => {
                const fits = p.monthlyAdd <= budgetRemaining;
                return (
                  <div key={p.name} className={`p-3 rounded-lg border ${fits ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">+${p.monthlyAdd}/mo</p>
                    <Badge variant="outline" className={`mt-1 text-[10px] ${fits ? "text-green-500 border-green-500/30" : "text-red-500 border-red-500/30"}`}>
                      {fits ? "Fits Budget" : "Over Budget"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
