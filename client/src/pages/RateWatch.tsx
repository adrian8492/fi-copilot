import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowDown, ArrowUp, Minus, Plus, Trash2 } from "lucide-react";

interface RateHistoryPoint {
  month: string;
  newRate: number;
  usedRate: number;
}

interface LenderRate {
  lender: string;
  currentNew: number;
  currentUsed: number;
  lastChangeDate: string;
  lastChangeBps: number;
  janRate: number;
}

interface RateAlert {
  id: number;
  lender: string;
  rateType: "new" | "used";
  threshold: number;
  active: boolean;
}

const STORAGE_KEY = "fi-rate-watch-alerts";

const RATE_HISTORY: RateHistoryPoint[] = [
  { month: "May", newRate: 5.9, usedRate: 6.6 },
  { month: "Jun", newRate: 6.0, usedRate: 6.7 },
  { month: "Jul", newRate: 6.1, usedRate: 6.8 },
  { month: "Aug", newRate: 6.2, usedRate: 6.9 },
  { month: "Sep", newRate: 6.35, usedRate: 7.05 },
  { month: "Oct", newRate: 6.4, usedRate: 7.1 },
  { month: "Nov", newRate: 6.5, usedRate: 7.2 },
  { month: "Dec", newRate: 6.55, usedRate: 7.25 },
  { month: "Jan", newRate: 6.45, usedRate: 7.15 },
  { month: "Feb", newRate: 6.35, usedRate: 7.0 },
  { month: "Mar", newRate: 6.48, usedRate: 7.12 },
  { month: "Apr", newRate: 6.62, usedRate: 7.28 },
];

const LENDER_RATES: LenderRate[] = [
  { lender: "Ally Financial", currentNew: 6.55, currentUsed: 7.15, lastChangeDate: "2026-04-08", lastChangeBps: 15, janRate: 6.35 },
  { lender: "Capital One", currentNew: 6.49, currentUsed: 7.05, lastChangeDate: "2026-04-12", lastChangeBps: 10, janRate: 6.22 },
  { lender: "Chase Auto", currentNew: 6.32, currentUsed: 6.94, lastChangeDate: "2026-04-10", lastChangeBps: 0, janRate: 6.18 },
  { lender: "Wells Fargo", currentNew: 6.58, currentUsed: 7.21, lastChangeDate: "2026-04-09", lastChangeBps: 12, janRate: 6.27 },
  { lender: "US Bank", currentNew: 6.41, currentUsed: 6.98, lastChangeDate: "2026-04-11", lastChangeBps: -5, janRate: 6.30 },
  { lender: "Westlake Financial", currentNew: 7.24, currentUsed: 7.82, lastChangeDate: "2026-04-05", lastChangeBps: 20, janRate: 6.95 },
  { lender: "Credit Acceptance", currentNew: 7.68, currentUsed: 8.1, lastChangeDate: "2026-04-03", lastChangeBps: 18, janRate: 7.2 },
  { lender: "TD Auto Finance", currentNew: 6.37, currentUsed: 6.92, lastChangeDate: "2026-04-13", lastChangeBps: -8, janRate: 6.21 },
  { lender: "Bank of America", currentNew: 6.29, currentUsed: 6.88, lastChangeDate: "2026-04-07", lastChangeBps: 0, janRate: 6.16 },
  { lender: "Regional Credit Union", currentNew: 6.05, currentUsed: 6.54, lastChangeDate: "2026-04-06", lastChangeBps: -10, janRate: 5.98 },
];

const DEFAULT_ALERTS: RateAlert[] = [
  { id: 1, lender: "Ally Financial", rateType: "new", threshold: 7.5, active: true },
  { id: 2, lender: "Westlake Financial", rateType: "used", threshold: 8.0, active: true },
  { id: 3, lender: "Regional Credit Union", rateType: "new", threshold: 6.2, active: false },
];

function getDirection(series: RateHistoryPoint[]) {
  const current = series.at(-1)?.newRate ?? 0;
  const prior = series.at(-2)?.newRate ?? 0;
  if (current > prior) return "Rising";
  if (current < prior) return "Falling";
  return "Stable";
}

function payment(amount: number, annualRate: number, term: number) {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return amount / term;
  return (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
}

export default function RateWatch() {
  useEffect(() => {
    document.title = "Rate Watch | F&I Co-Pilot by ASURA Group";
  }, []);

  const [alerts, setAlerts] = useState<RateAlert[]>(() => {
    if (typeof window === "undefined") return DEFAULT_ALERTS;
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(DEFAULT_ALERTS));
    } catch {
      return DEFAULT_ALERTS;
    }
  });
  const [calcAmount, setCalcAmount] = useState(35000);
  const [calcTerm, setCalcTerm] = useState(72);
  const [newAlert, setNewAlert] = useState<RateAlert>({ id: 0, lender: "Ally Financial", rateType: "new", threshold: 7.5, active: true });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  }, [alerts]);

  const direction = getDirection(RATE_HISTORY);
  const latest = RATE_HISTORY.at(-1)!;
  const activeAlerts = alerts.filter((alert) => alert.active);
  const paymentBase = payment(calcAmount, latest.newRate, calcTerm);
  const paymentQuarter = payment(calcAmount, latest.newRate + 0.25, calcTerm);
  const paymentImpact = paymentQuarter - paymentBase;

  const sortedRates = useMemo(() => [...LENDER_RATES].sort((a, b) => a.currentNew - b.currentNew), []);

  function addAlert() {
    setAlerts((prev) => [...prev, { ...newAlert, id: Date.now() }]);
  }

  function toggleAlert(id: number) {
    setAlerts((prev) => prev.map((alert) => alert.id === id ? { ...alert, active: !alert.active } : alert));
  }

  function removeAlert(id: number) {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }

  return (
    <AppLayout title="Rate Watch" subtitle="Track lender rate movement and payment impact fast">
      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Prime Rate</div><div className="text-2xl font-bold">8.50%</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Fed Funds</div><div className="text-2xl font-bold">5.25%</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Avg Buy Rate</div><div className="text-2xl font-bold">{latest.newRate.toFixed(2)}%</div><div className="text-xs text-muted-foreground">New, {latest.usedRate.toFixed(2)}% used</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Direction</div><div className="text-2xl font-bold flex items-center gap-2">{direction === "Rising" ? <ArrowUp className="w-5 h-5 text-red-500" /> : direction === "Falling" ? <ArrowDown className="w-5 h-5 text-green-500" /> : <Minus className="w-5 h-5 text-muted-foreground" />} {direction}</div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
          <Card>
            <CardHeader><CardTitle>12-Month Buy Rate Trend</CardTitle></CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={RATE_HISTORY}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" />
                  <YAxis domain={[5.5, 7.6]} />
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                  <Line type="monotone" dataKey="newRate" stroke="#2563eb" strokeWidth={3} name="New" />
                  <Line type="monotone" dataKey="usedRate" stroke="#16a34a" strokeWidth={3} name="Used" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Rate Impact Calculator</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">Deal Amount</div>
                <Input type="number" value={calcAmount} onChange={(e) => setCalcAmount(Number(e.target.value))} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Term</div>
                <Input type="number" value={calcTerm} onChange={(e) => setCalcTerm(Number(e.target.value))} />
              </div>
              <div className="rounded-lg border p-4 bg-muted/40 space-y-2">
                <div className="flex justify-between text-sm"><span>Payment at {latest.newRate.toFixed(2)}%</span><span>${paymentBase.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span>Payment at {(latest.newRate + 0.25).toFixed(2)}%</span><span>${paymentQuarter.toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold"><span>0.25% impact</span><span>${paymentImpact.toFixed(2)}/mo</span></div>
              </div>
              <div className="text-xs text-muted-foreground">Use this to reset customers when rate creep changes payment more than expected.</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
          <Card>
            <CardHeader><CardTitle>Lender Rate Table</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="border-b text-left">
                      {['Lender','New Buy Rate','Used Buy Rate','Last Change','YTD Change','Trend'].map((header) => <th key={header} className="px-3 py-3 font-medium">{header}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRates.map((rate) => {
                      const ytd = Math.round((rate.currentNew - rate.janRate) * 100);
                      return (
                        <tr key={rate.lender} className="border-b">
                          <td className="px-3 py-3 font-medium">{rate.lender}</td>
                          <td className="px-3 py-3">{rate.currentNew.toFixed(2)}%</td>
                          <td className="px-3 py-3">{rate.currentUsed.toFixed(2)}%</td>
                          <td className="px-3 py-3">{rate.lastChangeDate} ({rate.lastChangeBps > 0 ? "+" : ""}{rate.lastChangeBps} bps)</td>
                          <td className="px-3 py-3">{ytd > 0 ? "+" : ""}{ytd} bps</td>
                          <td className="px-3 py-3">{rate.lastChangeBps > 0 ? <ArrowUp className="w-4 h-4 text-red-500" /> : rate.lastChangeBps < 0 ? <ArrowDown className="w-4 h-4 text-green-500" /> : <Minus className="w-4 h-4 text-muted-foreground" />}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Rate Alerts</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {alerts.map((alert) => {
                  const lender = LENDER_RATES.find((item) => item.lender === alert.lender);
                  const current = alert.rateType === "new" ? lender?.currentNew ?? 0 : lender?.currentUsed ?? 0;
                  const triggered = current >= alert.threshold;
                  return (
                    <div key={alert.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{alert.lender}</div>
                          <div className="text-xs text-muted-foreground">{alert.rateType} rate threshold {alert.threshold.toFixed(2)}%</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={triggered ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}>{triggered ? "Triggered" : "Clear"}</Badge>
                          <Button variant="outline" size="sm" onClick={() => toggleAlert(alert.id)}>{alert.active ? "Active" : "Inactive"}</Button>
                          <Button variant="ghost" size="icon" onClick={() => removeAlert(alert.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">Current: {current.toFixed(2)}%</div>
                    </div>
                  );
                })}
                <div className="rounded-lg border border-dashed p-3 space-y-2">
                  <div className="grid grid-cols-1 gap-2">
                    <select className="border rounded-md px-3 py-2 bg-background" value={newAlert.lender} onChange={(e) => setNewAlert((prev) => ({ ...prev, lender: e.target.value }))}>
                      {LENDER_RATES.map((rate) => <option key={rate.lender} value={rate.lender}>{rate.lender}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="border rounded-md px-3 py-2 bg-background" value={newAlert.rateType} onChange={(e) => setNewAlert((prev) => ({ ...prev, rateType: e.target.value as "new" | "used" }))}>
                        <option value="new">New</option>
                        <option value="used">Used</option>
                      </select>
                      <Input type="number" step="0.01" value={newAlert.threshold} onChange={(e) => setNewAlert((prev) => ({ ...prev, threshold: Number(e.target.value) }))} />
                    </div>
                    <Button onClick={addAlert}><Plus className="w-4 h-4 mr-2" /> Add Alert</Button>
                  </div>
                  <div className="text-xs text-muted-foreground">Active alerts: {activeAlerts.length}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Market Context</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="font-medium">Fed meetings:</span> May 1, June 12, July 31</div>
                <div><span className="font-medium">Analyst outlook:</span> Expect choppy but slightly firmer auto paper through early summer, especially subprime channels.</div>
                <div><span className="font-medium">What this means for F&I:</span> Protect payment-sensitive customers early, pencil lender options faster, and use reserve discipline where caps are tightening.</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
