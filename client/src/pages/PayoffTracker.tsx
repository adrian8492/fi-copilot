import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  TrendingDown,
  FileText,
  DollarSign,
  Download,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ── Hard-coded demo data ──────────────────────────────────────────
const TIME_PERIODS = ["MTD", "Last 30", "Last 90", "YTD"] as const;

interface ProductData {
  name: string;
  unitsSold: number;
  unitsCancelled: number;
  cancelRate: number;
  claimsFiled: number;
  claimsPaid: number;
  avgClaimCost: number;
  netRevenue: number;
}

const PRODUCT_PRICES: Record<string, number> = {
  VSC: 1895,
  GAP: 795,
  "Tire & Wheel": 699,
  "Paint Protection": 599,
  "Maintenance Plan": 495,
  "Theft Deterrent": 399,
  Windshield: 299,
  "Key Replacement": 249,
};

const PRODUCTS: ProductData[] = [
  { name: "VSC", unitsSold: 248, unitsCancelled: 18, cancelRate: 7.3, claimsFiled: 20, claimsPaid: 15, avgClaimCost: 1180, netRevenue: 435710 },
  { name: "GAP", unitsSold: 210, unitsCancelled: 12, cancelRate: 5.7, claimsFiled: 8, claimsPaid: 6, avgClaimCost: 780, netRevenue: 157290 },
  { name: "Tire & Wheel", unitsSold: 185, unitsCancelled: 28, cancelRate: 15.1, claimsFiled: 16, claimsPaid: 12, avgClaimCost: 420, netRevenue: 109827 },
  { name: "Paint Protection", unitsSold: 160, unitsCancelled: 8, cancelRate: 5.0, claimsFiled: 5, claimsPaid: 3, avgClaimCost: 350, netRevenue: 91048 },
  { name: "Maintenance Plan", unitsSold: 142, unitsCancelled: 22, cancelRate: 15.5, claimsFiled: 18, claimsPaid: 14, avgClaimCost: 280, netRevenue: 59400 },
  { name: "Theft Deterrent", unitsSold: 120, unitsCancelled: 5, cancelRate: 4.2, claimsFiled: 3, claimsPaid: 1, avgClaimCost: 620, netRevenue: 45281 },
  { name: "Windshield", unitsSold: 95, unitsCancelled: 6, cancelRate: 6.3, claimsFiled: 12, claimsPaid: 10, avgClaimCost: 210, netRevenue: 26611 },
  { name: "Key Replacement", unitsSold: 82, unitsCancelled: 10, cancelRate: 12.2, claimsFiled: 7, claimsPaid: 5, avgClaimCost: 295, netRevenue: 17918 },
];

const PRODUCT_COLORS: Record<string, string> = {
  VSC: "#22c55e",
  GAP: "#3b82f6",
  "Tire & Wheel": "#f59e0b",
  "Paint Protection": "#ef4444",
  "Maintenance Plan": "#8b5cf6",
  "Theft Deterrent": "#ec4899",
  Windshield: "#06b6d4",
  "Key Replacement": "#f97316",
};

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const CANCELLATION_TREND = MONTHS.map((month) => ({
  month,
  VSC: Math.round(4 + Math.random() * 6),
  GAP: Math.round(2 + Math.random() * 5),
  "Tire & Wheel": Math.round(5 + Math.random() * 8),
  "Paint Protection": Math.round(1 + Math.random() * 4),
  "Maintenance Plan": Math.round(4 + Math.random() * 7),
  "Theft Deterrent": Math.round(1 + Math.random() * 3),
  Windshield: Math.round(1 + Math.random() * 3),
  "Key Replacement": Math.round(2 + Math.random() * 5),
}));

// Seed stable data instead of random
const CANCELLATION_TREND_STABLE = [
  { month: "Apr", VSC: 5, GAP: 3, "Tire & Wheel": 7, "Paint Protection": 2, "Maintenance Plan": 6, "Theft Deterrent": 1, Windshield: 1, "Key Replacement": 3 },
  { month: "May", VSC: 6, GAP: 4, "Tire & Wheel": 8, "Paint Protection": 2, "Maintenance Plan": 5, "Theft Deterrent": 2, Windshield: 2, "Key Replacement": 2 },
  { month: "Jun", VSC: 4, GAP: 3, "Tire & Wheel": 9, "Paint Protection": 3, "Maintenance Plan": 7, "Theft Deterrent": 1, Windshield: 1, "Key Replacement": 4 },
  { month: "Jul", VSC: 7, GAP: 2, "Tire & Wheel": 6, "Paint Protection": 1, "Maintenance Plan": 8, "Theft Deterrent": 2, Windshield: 2, "Key Replacement": 3 },
  { month: "Aug", VSC: 5, GAP: 4, "Tire & Wheel": 10, "Paint Protection": 2, "Maintenance Plan": 6, "Theft Deterrent": 1, Windshield: 1, "Key Replacement": 5 },
  { month: "Sep", VSC: 8, GAP: 3, "Tire & Wheel": 7, "Paint Protection": 3, "Maintenance Plan": 5, "Theft Deterrent": 2, Windshield: 3, "Key Replacement": 2 },
  { month: "Oct", VSC: 6, GAP: 5, "Tire & Wheel": 11, "Paint Protection": 2, "Maintenance Plan": 9, "Theft Deterrent": 1, Windshield: 1, "Key Replacement": 4 },
  { month: "Nov", VSC: 4, GAP: 3, "Tire & Wheel": 8, "Paint Protection": 1, "Maintenance Plan": 7, "Theft Deterrent": 2, Windshield: 2, "Key Replacement": 3 },
  { month: "Dec", VSC: 7, GAP: 4, "Tire & Wheel": 12, "Paint Protection": 3, "Maintenance Plan": 10, "Theft Deterrent": 1, Windshield: 1, "Key Replacement": 5 },
  { month: "Jan", VSC: 5, GAP: 2, "Tire & Wheel": 9, "Paint Protection": 2, "Maintenance Plan": 8, "Theft Deterrent": 2, Windshield: 2, "Key Replacement": 4 },
  { month: "Feb", VSC: 6, GAP: 3, "Tire & Wheel": 10, "Paint Protection": 2, "Maintenance Plan": 6, "Theft Deterrent": 1, Windshield: 1, "Key Replacement": 3 },
  { month: "Mar", VSC: 8, GAP: 5, "Tire & Wheel": 13, "Paint Protection": 3, "Maintenance Plan": 11, "Theft Deterrent": 2, Windshield: 2, "Key Replacement": 6 },
];

const CANCELLATION_WINDOW = [
  { bucket: "0-30 days", cancellations: 32 },
  { bucket: "31-60 days", cancellations: 28 },
  { bucket: "61-90 days", cancellations: 18 },
  { bucket: "91-180 days", cancellations: 22 },
  { bucket: "180+ days", cancellations: 9 },
];

interface ManagerCancel {
  name: string;
  totalSold: number;
  totalCancelled: number;
  cancelRate: number;
}

const MANAGER_CANCELLATIONS: ManagerCancel[] = [
  { name: "Marcus Rivera", totalSold: 198, totalCancelled: 12, cancelRate: 6.1 },
  { name: "Jessica Chen", totalSold: 215, totalCancelled: 9, cancelRate: 4.2 },
  { name: "David Park", totalSold: 162, totalCancelled: 18, cancelRate: 11.1 },
  { name: "Sarah Kim", totalSold: 188, totalCancelled: 14, cancelRate: 7.4 },
  { name: "Tony Morales", totalSold: 230, totalCancelled: 25, cancelRate: 10.9 },
  { name: "Linda Tran", totalSold: 175, totalCancelled: 7, cancelRate: 4.0 },
];

// At-risk products: MoM increase >5% in cancellation count
const AT_RISK_PRODUCTS = [
  { name: "Tire & Wheel", prevMonth: 10, currMonth: 13, change: 30.0 },
  { name: "Maintenance Plan", prevMonth: 6, currMonth: 11, change: 83.3 },
  { name: "Key Replacement", prevMonth: 3, currMonth: 6, change: 100.0 },
];

export default function PayoffTracker() {
  const [period, setPeriod] = useState<string>("Last 30");
  const [visibleProducts, setVisibleProducts] = useState<Set<string>>(
    new Set(PRODUCTS.map((p) => p.name))
  );

  const totalSold = useMemo(() => PRODUCTS.reduce((s, p) => s + p.unitsSold, 0), []);
  const totalCancelled = useMemo(() => PRODUCTS.reduce((s, p) => s + p.unitsCancelled, 0), []);
  const cancelRate = useMemo(() => ((totalCancelled / totalSold) * 100).toFixed(1), [totalSold, totalCancelled]);
  const totalClaims = useMemo(() => PRODUCTS.reduce((s, p) => s + p.claimsFiled, 0), []);
  const claimsRate = useMemo(() => ((totalClaims / totalSold) * 100).toFixed(1), [totalClaims, totalSold]);
  const netRetention = useMemo(() => PRODUCTS.reduce((s, p) => s + p.netRevenue, 0), []);

  const toggleProduct = (name: string) => {
    setVisibleProducts((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const cancelRateColor = (rate: number) => {
    if (rate < 5) return "text-green-500";
    if (rate <= 10) return "text-yellow-500";
    return "text-red-500";
  };

  const cancelRateBg = (rate: number) => {
    if (rate < 5) return "bg-green-500/10 text-green-500";
    if (rate <= 10) return "bg-yellow-500/10 text-yellow-500";
    return "bg-red-500/10 text-red-500";
  };

  const exportCSV = () => {
    const headers = [
      "Product Name",
      "Units Sold",
      "Units Cancelled",
      "Cancel Rate %",
      "Claims Filed",
      "Claims Paid",
      "Avg Claim Cost",
      "Net Revenue After Cancellations",
    ];
    const rows = PRODUCTS.map((p) =>
      [
        p.name,
        p.unitsSold,
        p.unitsCancelled,
        p.cancelRate,
        p.claimsFiled,
        p.claimsPaid,
        p.avgClaimCost,
        p.netRevenue,
      ].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payoff-tracker.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout title="Product Payoff Tracker" subtitle="Track product cancellations, claims, and retention revenue">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Time Period Selector */}
        <div className="flex flex-wrap gap-2">
          {TIME_PERIODS.map((tp) => (
            <Button
              key={tp}
              variant={period === tp ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(tp)}
            >
              {tp}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={exportCSV} className="ml-auto">
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>

        {/* KPI Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <ShieldCheck className="w-4 h-4" /> Total Products Sold ({period})
            </div>
            <p className="text-2xl font-bold text-foreground">{totalSold.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingDown className="w-4 h-4" /> Cancellation Rate
            </div>
            <p className="text-2xl font-bold text-foreground">{cancelRate}%</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <FileText className="w-4 h-4" /> Claims Rate
            </div>
            <p className="text-2xl font-bold text-foreground">{claimsRate}%</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="w-4 h-4" /> Net Retention Revenue
            </div>
            <p className="text-2xl font-bold text-foreground">${netRetention.toLocaleString()}</p>
          </Card>
        </div>

        {/* Product Retention Table */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Product Retention Overview</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Product Name</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Units Sold</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Units Cancelled</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Cancel Rate %</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Claims Filed</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Claims Paid</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Avg Claim Cost</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Net Revenue</th>
                </tr>
              </thead>
              <tbody>
                {PRODUCTS.map((p) => (
                  <tr key={p.name} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="py-2 px-3 font-medium text-foreground">{p.name}</td>
                    <td className="py-2 px-3 text-right text-foreground">{p.unitsSold}</td>
                    <td className="py-2 px-3 text-right text-foreground">{p.unitsCancelled}</td>
                    <td className="py-2 px-3 text-right">
                      <Badge variant="outline" className={cancelRateBg(p.cancelRate)}>
                        {p.cancelRate}%
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-right text-foreground">{p.claimsFiled}</td>
                    <td className="py-2 px-3 text-right text-foreground">{p.claimsPaid}</td>
                    <td className="py-2 px-3 text-right text-foreground">${p.avgClaimCost.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-medium text-foreground">${p.netRevenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Cancellation Trend Chart */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Cancellation Trend (12 Months)</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {PRODUCTS.map((p) => (
              <Button
                key={p.name}
                variant={visibleProducts.has(p.name) ? "default" : "outline"}
                size="sm"
                className="text-xs h-7"
                onClick={() => toggleProduct(p.name)}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: PRODUCT_COLORS[p.name] }}
                />
                {p.name}
              </Button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={CANCELLATION_TREND_STABLE}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
              <Tooltip />
              <Legend />
              {PRODUCTS.map((p) =>
                visibleProducts.has(p.name) ? (
                  <Line
                    key={p.name}
                    type="monotone"
                    dataKey={p.name}
                    stroke={PRODUCT_COLORS[p.name]}
                    strokeWidth={2}
                    dot={false}
                  />
                ) : null
              )}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cancellation Window Analysis */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Cancellation Window Analysis</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={CANCELLATION_WINDOW}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
                <Tooltip formatter={(v: number) => [v, "Cancellations"]} />
                <Bar dataKey="cancellations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Manager Cancellation Comparison */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Manager Cancellation Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Manager</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Total Sold</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Cancelled</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Cancel Rate %</th>
                  </tr>
                </thead>
                <tbody>
                  {MANAGER_CANCELLATIONS.map((m) => (
                    <tr key={m.name} className="border-b border-border/50 hover:bg-accent/30">
                      <td className="py-2 px-3 font-medium text-foreground">{m.name}</td>
                      <td className="py-2 px-3 text-right text-foreground">{m.totalSold}</td>
                      <td className="py-2 px-3 text-right text-foreground">{m.totalCancelled}</td>
                      <td className="py-2 px-3 text-right">
                        <Badge variant="outline" className={cancelRateBg(m.cancelRate)}>
                          {m.cancelRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* At Risk Alert Cards */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">At-Risk Products</h3>
          {AT_RISK_PRODUCTS.map((product) => (
            <Card key={product.name} className="p-4 border-orange-500/20 bg-orange-500/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">{product.name}</h4>
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-500 text-xs">
                      +{product.change.toFixed(0)}% MoM
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cancellations increased from {product.prevMonth} to {product.currMonth} units month-over-month.
                    Investigate root cause and consider retention strategies.
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
