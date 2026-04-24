import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  AlertTriangle,
  TrendingDown,
  BarChart3,
  ShieldAlert,
  Users,
  Calculator,
  Clock,
  CircleDollarSign,
  Percent,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────
type ChargebackStatus = "Received" | "Pending" | "Disputed";
type DateRange = "last30" | "last90" | "ytd";
type Reason = "Voluntary Cancellation" | "Lender Repossession" | "Customer Complaint" | "Early Payoff";

interface Chargeback {
  id: number;
  dealNumber: string;
  customer: string;
  productCancelled: string;
  originalPrice: number;
  chargebackAmount: number;
  dateCancelled: string;
  daysSinceClose: number;
  manager: string;
  status: ChargebackStatus;
  reason: Reason;
}

interface MonthlyTrend {
  month: string;
  chargebacks: number;
  grossEarned: number;
}

interface ManagerImpact {
  name: string;
  dealsSold: number;
  chargebacksReceived: number;
  netRetentionRate: number;
  netIncomeAfterChargebacks: number;
}

interface AtRiskDeal {
  dealNumber: string;
  customer: string;
  product: string;
  daysSinceClose: number;
  riskScore: number;
  reason: string;
}

// ── Constants ─────────────────────────────────────────────────────
const MANAGERS = [
  "Sarah Mitchell",
  "James Rodriguez",
  "Ashley Chen",
  "Marcus Thompson",
  "Rachel Kim",
  "David Patel",
];

const PRODUCTS = [
  "VSC Extended",
  "GAP Insurance",
  "Paint Protection",
  "Tire & Wheel",
  "Theft Deterrent",
  "Key Replacement",
  "Windshield Protection",
  "Dent Protection",
  "Maintenance Plan",
  "Interior Protection",
];

const REASONS: Reason[] = [
  "Voluntary Cancellation",
  "Lender Repossession",
  "Customer Complaint",
  "Early Payoff",
];

const PIE_COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981"];

const STATUS_COLORS: Record<ChargebackStatus, string> = {
  Received: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Disputed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

// ── Demo Data ─────────────────────────────────────────────────────
const CHARGEBACKS: Chargeback[] = [
  { id: 1, dealNumber: "D-10241", customer: "Robert Hanson", productCancelled: "VSC Extended", originalPrice: 2495, chargebackAmount: 1870, dateCancelled: "2026-04-18", daysSinceClose: 22, manager: "Sarah Mitchell", status: "Received", reason: "Voluntary Cancellation" },
  { id: 2, dealNumber: "D-10198", customer: "Maria Gonzalez", productCancelled: "GAP Insurance", originalPrice: 895, chargebackAmount: 715, dateCancelled: "2026-04-15", daysSinceClose: 35, manager: "James Rodriguez", status: "Pending", reason: "Early Payoff" },
  { id: 3, dealNumber: "D-10155", customer: "Kevin Zhao", productCancelled: "Paint Protection", originalPrice: 699, chargebackAmount: 559, dateCancelled: "2026-04-12", daysSinceClose: 48, manager: "Ashley Chen", status: "Received", reason: "Customer Complaint" },
  { id: 4, dealNumber: "D-10089", customer: "Jennifer Adams", productCancelled: "Tire & Wheel", originalPrice: 799, chargebackAmount: 599, dateCancelled: "2026-04-10", daysSinceClose: 65, manager: "Marcus Thompson", status: "Disputed", reason: "Voluntary Cancellation" },
  { id: 5, dealNumber: "D-10067", customer: "Samuel Patel", productCancelled: "VSC Extended", originalPrice: 2795, chargebackAmount: 2095, dateCancelled: "2026-04-08", daysSinceClose: 72, manager: "Rachel Kim", status: "Received", reason: "Lender Repossession" },
  { id: 6, dealNumber: "D-10034", customer: "Diana Brooks", productCancelled: "Theft Deterrent", originalPrice: 399, chargebackAmount: 319, dateCancelled: "2026-04-05", daysSinceClose: 58, manager: "David Patel", status: "Pending", reason: "Voluntary Cancellation" },
  { id: 7, dealNumber: "D-09988", customer: "Tyler Morrison", productCancelled: "GAP Insurance", originalPrice: 995, chargebackAmount: 796, dateCancelled: "2026-04-02", daysSinceClose: 41, manager: "Sarah Mitchell", status: "Received", reason: "Early Payoff" },
  { id: 8, dealNumber: "D-09945", customer: "Angela White", productCancelled: "Key Replacement", originalPrice: 499, chargebackAmount: 374, dateCancelled: "2026-03-28", daysSinceClose: 90, manager: "James Rodriguez", status: "Received", reason: "Customer Complaint" },
  { id: 9, dealNumber: "D-09901", customer: "Nathan Rivera", productCancelled: "Maintenance Plan", originalPrice: 1295, chargebackAmount: 971, dateCancelled: "2026-03-25", daysSinceClose: 55, manager: "Ashley Chen", status: "Disputed", reason: "Voluntary Cancellation" },
  { id: 10, dealNumber: "D-09877", customer: "Lisa Chang", productCancelled: "Windshield Protection", originalPrice: 349, chargebackAmount: 262, dateCancelled: "2026-03-20", daysSinceClose: 78, manager: "Marcus Thompson", status: "Pending", reason: "Lender Repossession" },
  { id: 11, dealNumber: "D-09834", customer: "Brian Nguyen", productCancelled: "VSC Extended", originalPrice: 2295, chargebackAmount: 1721, dateCancelled: "2026-03-15", daysSinceClose: 44, manager: "Rachel Kim", status: "Received", reason: "Voluntary Cancellation" },
  { id: 12, dealNumber: "D-09790", customer: "Stephanie Bell", productCancelled: "Interior Protection", originalPrice: 599, chargebackAmount: 449, dateCancelled: "2026-03-12", daysSinceClose: 62, manager: "David Patel", status: "Received", reason: "Customer Complaint" },
  { id: 13, dealNumber: "D-09745", customer: "Carlos Mendez", productCancelled: "Dent Protection", originalPrice: 549, chargebackAmount: 412, dateCancelled: "2026-03-08", daysSinceClose: 38, manager: "Sarah Mitchell", status: "Pending", reason: "Early Payoff" },
  { id: 14, dealNumber: "D-09700", customer: "Megan Taylor", productCancelled: "Paint Protection", originalPrice: 749, chargebackAmount: 562, dateCancelled: "2026-03-05", daysSinceClose: 85, manager: "James Rodriguez", status: "Received", reason: "Voluntary Cancellation" },
  { id: 15, dealNumber: "D-09661", customer: "Derek Simmons", productCancelled: "Tire & Wheel", originalPrice: 849, chargebackAmount: 637, dateCancelled: "2026-02-28", daysSinceClose: 71, manager: "Ashley Chen", status: "Disputed", reason: "Lender Repossession" },
  { id: 16, dealNumber: "D-09620", customer: "Amanda Foster", productCancelled: "GAP Insurance", originalPrice: 895, chargebackAmount: 671, dateCancelled: "2026-02-22", daysSinceClose: 53, manager: "Marcus Thompson", status: "Received", reason: "Voluntary Cancellation" },
  { id: 17, dealNumber: "D-09578", customer: "Jason Kim", productCancelled: "VSC Extended", originalPrice: 2595, chargebackAmount: 1946, dateCancelled: "2026-02-18", daysSinceClose: 46, manager: "Rachel Kim", status: "Pending", reason: "Customer Complaint" },
  { id: 18, dealNumber: "D-09535", customer: "Patricia Lane", productCancelled: "Theft Deterrent", originalPrice: 449, chargebackAmount: 337, dateCancelled: "2026-02-12", daysSinceClose: 68, manager: "David Patel", status: "Received", reason: "Early Payoff" },
  { id: 19, dealNumber: "D-09490", customer: "Ryan Cooper", productCancelled: "Maintenance Plan", originalPrice: 1195, chargebackAmount: 896, dateCancelled: "2026-02-08", daysSinceClose: 82, manager: "Sarah Mitchell", status: "Received", reason: "Voluntary Cancellation" },
  { id: 20, dealNumber: "D-09445", customer: "Vanessa Ruiz", productCancelled: "Key Replacement", originalPrice: 549, chargebackAmount: 412, dateCancelled: "2026-02-02", daysSinceClose: 59, manager: "James Rodriguez", status: "Disputed", reason: "Lender Repossession" },
  { id: 21, dealNumber: "D-09400", customer: "Mitchell Grant", productCancelled: "Windshield Protection", originalPrice: 399, chargebackAmount: 299, dateCancelled: "2026-01-28", daysSinceClose: 92, manager: "Ashley Chen", status: "Received", reason: "Customer Complaint" },
  { id: 22, dealNumber: "D-09355", customer: "Christina Park", productCancelled: "Interior Protection", originalPrice: 649, chargebackAmount: 487, dateCancelled: "2026-01-22", daysSinceClose: 75, manager: "Marcus Thompson", status: "Pending", reason: "Voluntary Cancellation" },
  { id: 23, dealNumber: "D-09310", customer: "Anthony Davis", productCancelled: "VSC Extended", originalPrice: 2395, chargebackAmount: 1796, dateCancelled: "2026-01-15", daysSinceClose: 88, manager: "Rachel Kim", status: "Received", reason: "Early Payoff" },
  { id: 24, dealNumber: "D-09265", customer: "Heather Scott", productCancelled: "Dent Protection", originalPrice: 599, chargebackAmount: 449, dateCancelled: "2026-01-10", daysSinceClose: 64, manager: "David Patel", status: "Received", reason: "Voluntary Cancellation" },
  { id: 25, dealNumber: "D-09220", customer: "William Torres", productCancelled: "Paint Protection", originalPrice: 799, chargebackAmount: 599, dateCancelled: "2026-01-05", daysSinceClose: 95, manager: "Sarah Mitchell", status: "Disputed", reason: "Customer Complaint" },
];

const MONTHLY_TREND: MonthlyTrend[] = [
  { month: "May 25", chargebacks: 3200, grossEarned: 48500 },
  { month: "Jun 25", chargebacks: 2800, grossEarned: 51200 },
  { month: "Jul 25", chargebacks: 4100, grossEarned: 49800 },
  { month: "Aug 25", chargebacks: 3600, grossEarned: 52100 },
  { month: "Sep 25", chargebacks: 2950, grossEarned: 47600 },
  { month: "Oct 25", chargebacks: 3800, grossEarned: 53200 },
  { month: "Nov 25", chargebacks: 4500, grossEarned: 55800 },
  { month: "Dec 25", chargebacks: 3100, grossEarned: 58400 },
  { month: "Jan 26", chargebacks: 5200, grossEarned: 50100 },
  { month: "Feb 26", chargebacks: 4800, grossEarned: 51900 },
  { month: "Mar 26", chargebacks: 4100, grossEarned: 54300 },
  { month: "Apr 26", chargebacks: 3900, grossEarned: 52800 },
];

const MANAGER_IMPACT: ManagerImpact[] = [
  { name: "Sarah Mitchell", dealsSold: 142, chargebacksReceived: 5, netRetentionRate: 96.5, netIncomeAfterChargebacks: 118400 },
  { name: "James Rodriguez", dealsSold: 128, chargebacksReceived: 4, netRetentionRate: 96.9, netIncomeAfterChargebacks: 105200 },
  { name: "Ashley Chen", dealsSold: 135, chargebacksReceived: 4, netRetentionRate: 97.0, netIncomeAfterChargebacks: 112800 },
  { name: "Marcus Thompson", dealsSold: 119, chargebacksReceived: 4, netRetentionRate: 96.6, netIncomeAfterChargebacks: 97600 },
  { name: "Rachel Kim", dealsSold: 131, chargebacksReceived: 4, netRetentionRate: 96.9, netIncomeAfterChargebacks: 108500 },
  { name: "David Patel", dealsSold: 124, chargebacksReceived: 4, netRetentionRate: 96.8, netIncomeAfterChargebacks: 101900 },
];

const AT_RISK_DEALS: AtRiskDeal[] = [
  { dealNumber: "D-10312", customer: "Frank Warren", product: "VSC Extended", daysSinceClose: 15, riskScore: 87, reason: "High cancellation rate product, short term loan" },
  { dealNumber: "D-10298", customer: "Tina Marshall", product: "GAP Insurance", daysSinceClose: 19, riskScore: 82, reason: "Subprime lender, early payoff pattern" },
  { dealNumber: "D-10285", customer: "George Ellis", product: "Tire & Wheel", daysSinceClose: 24, riskScore: 78, reason: "Customer complaint history" },
  { dealNumber: "D-10270", customer: "Laura Bennett", product: "Paint Protection", daysSinceClose: 31, riskScore: 74, reason: "Low credit score, high LTV ratio" },
  { dealNumber: "D-10258", customer: "Oscar Diaz", product: "Maintenance Plan", daysSinceClose: 38, riskScore: 71, reason: "Lender repossession risk" },
  { dealNumber: "D-10245", customer: "Cathy Price", product: "VSC Extended", daysSinceClose: 42, riskScore: 68, reason: "Short term, high monthly payment" },
  { dealNumber: "D-10230", customer: "Darren Woods", product: "GAP Insurance", daysSinceClose: 55, riskScore: 65, reason: "Refinance likely, negative equity" },
  { dealNumber: "D-10218", customer: "Irene Flores", product: "Theft Deterrent", daysSinceClose: 61, riskScore: 62, reason: "Product low satisfaction score" },
];

// ── Helpers ────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

const riskColor = (score: number) => {
  if (score >= 80) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  if (score >= 70) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
  return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
};

// ── Component ─────────────────────────────────────────────────────
export default function ChargebackTracker() {
  const [dateRange, setDateRange] = useState<DateRange>("ytd");
  const [managerFilter, setManagerFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Reserve calculator state
  const [monthlyGross, setMonthlyGross] = useState(52000);
  const [estChargebackRate, setEstChargebackRate] = useState(7.5);

  // Filter chargebacks
  const filtered = useMemo(() => {
    return CHARGEBACKS.filter((cb) => {
      if (managerFilter !== "all" && cb.manager !== managerFilter) return false;
      if (productFilter !== "all" && cb.productCancelled !== productFilter) return false;
      if (statusFilter !== "all" && cb.status !== statusFilter) return false;

      const cancelDate = new Date(cb.dateCancelled);
      const now = new Date("2026-04-22");
      if (dateRange === "last30") {
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 30);
        if (cancelDate < cutoff) return false;
      } else if (dateRange === "last90") {
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 90);
        if (cancelDate < cutoff) return false;
      }
      // ytd = all of 2026
      if (dateRange === "ytd" && cancelDate.getFullYear() < 2026) return false;

      return true;
    });
  }, [dateRange, managerFilter, productFilter, statusFilter]);

  // KPIs
  const totalChargebacks = filtered.length;
  const totalChargebackAmount = filtered.reduce((s, cb) => s + cb.chargebackAmount, 0);
  const totalOriginalPrice = filtered.reduce((s, cb) => s + cb.originalPrice, 0);
  const netFiAfterChargebacks = totalOriginalPrice - totalChargebackAmount;
  const totalDeals = 779; // demo total deals in period
  const chargebackRate = totalDeals > 0 ? (totalChargebacks / totalDeals) * 100 : 0;
  const avgChargebackAmount = totalChargebacks > 0 ? totalChargebackAmount / totalChargebacks : 0;

  // Reason breakdown
  const reasonData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((cb) => {
      counts[cb.reason] = (counts[cb.reason] || 0) + 1;
    });
    return REASONS.map((r) => ({ name: r, value: counts[r] || 0 }));
  }, [filtered]);

  // Reserve calculator
  const recommendedReserve = (monthlyGross * estChargebackRate) / 100;

  return (
    <AppLayout title="Chargeback Tracker" subtitle="Monitor F&I product chargebacks, analyze trends, and protect gross profit">
      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last30">Last 30 Days</SelectItem>
            <SelectItem value="last90">Last 90 Days</SelectItem>
            <SelectItem value="ytd">YTD</SelectItem>
          </SelectContent>
        </Select>

        <Select value={managerFilter} onValueChange={setManagerFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Managers</SelectItem>
            {MANAGERS.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {PRODUCTS.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Received">Received</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── KPI Bar ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Total Chargebacks", value: totalChargebacks.toString(), icon: AlertTriangle, color: "text-red-500" },
          { label: "Total Chargeback Amt", value: fmt(totalChargebackAmount), icon: DollarSign, color: "text-red-500" },
          { label: "Net F&I After CB", value: fmt(netFiAfterChargebacks), icon: CircleDollarSign, color: "text-green-500" },
          { label: "Chargeback Rate", value: fmtPct(chargebackRate), icon: Percent, color: "text-yellow-500" },
          { label: "Avg Chargeback Amt", value: fmt(avgChargebackAmount), icon: TrendingDown, color: "text-orange-500" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Chargeback Table ────────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            Chargeback Detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Deal #</th>
                  <th className="pb-2 pr-4">Customer</th>
                  <th className="pb-2 pr-4">Product Cancelled</th>
                  <th className="pb-2 pr-4 text-right">Original Price</th>
                  <th className="pb-2 pr-4 text-right">Chargeback Amt</th>
                  <th className="pb-2 pr-4">Date Cancelled</th>
                  <th className="pb-2 pr-4 text-right">Days Since Close</th>
                  <th className="pb-2 pr-4">Manager</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cb) => (
                  <tr key={cb.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 pr-4 font-mono text-xs">{cb.dealNumber}</td>
                    <td className="py-2 pr-4">{cb.customer}</td>
                    <td className="py-2 pr-4">{cb.productCancelled}</td>
                    <td className="py-2 pr-4 text-right">{fmt(cb.originalPrice)}</td>
                    <td className="py-2 pr-4 text-right font-medium text-red-600 dark:text-red-400">{fmt(cb.chargebackAmount)}</td>
                    <td className="py-2 pr-4">{cb.dateCancelled}</td>
                    <td className="py-2 pr-4 text-right">{cb.daysSinceClose}</td>
                    <td className="py-2 pr-4">{cb.manager}</td>
                    <td className="py-2">
                      <Badge variant="secondary" className={STATUS_COLORS[cb.status]}>
                        {cb.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      No chargebacks match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Charts Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Reason Breakdown Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Chargeback Reason Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reasonData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {reasonData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, "Count"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend Line */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              Monthly Trend: Chargebacks vs Gross Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={MONTHLY_TREND}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [fmt(value)]} />
                <Legend />
                <Line type="monotone" dataKey="grossEarned" stroke="#10b981" strokeWidth={2} name="Gross Earned" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="chargebacks" stroke="#ef4444" strokeWidth={2} name="Chargebacks" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Manager Impact Table ────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-indigo-500" />
            Manager Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Manager</th>
                  <th className="pb-2 pr-4 text-right">Deals Sold</th>
                  <th className="pb-2 pr-4 text-right">Chargebacks</th>
                  <th className="pb-2 pr-4 text-right">Net Retention Rate</th>
                  <th className="pb-2 text-right">Net Income After CB</th>
                </tr>
              </thead>
              <tbody>
                {MANAGER_IMPACT.map((m) => (
                  <tr key={m.name} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 pr-4 font-medium">{m.name}</td>
                    <td className="py-2 pr-4 text-right">{m.dealsSold}</td>
                    <td className="py-2 pr-4 text-right font-medium text-red-600 dark:text-red-400">{m.chargebacksReceived}</td>
                    <td className="py-2 pr-4 text-right">
                      <Badge variant="secondary" className={m.netRetentionRate >= 97 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"}>
                        {fmtPct(m.netRetentionRate)}
                      </Badge>
                    </td>
                    <td className="py-2 text-right font-medium">{fmt(m.netIncomeAfterChargebacks)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── At-Risk Deals Panel ─────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5 text-amber-500" />
            At-Risk Deals (Last 90 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Deal #</th>
                  <th className="pb-2 pr-4">Customer</th>
                  <th className="pb-2 pr-4">Product</th>
                  <th className="pb-2 pr-4 text-right">Days Since Close</th>
                  <th className="pb-2 pr-4 text-right">Risk Score</th>
                  <th className="pb-2">Risk Reason</th>
                </tr>
              </thead>
              <tbody>
                {AT_RISK_DEALS.map((d) => (
                  <tr key={d.dealNumber} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 pr-4 font-mono text-xs">{d.dealNumber}</td>
                    <td className="py-2 pr-4">{d.customer}</td>
                    <td className="py-2 pr-4">{d.product}</td>
                    <td className="py-2 pr-4 text-right">{d.daysSinceClose}</td>
                    <td className="py-2 pr-4 text-right">
                      <Badge variant="secondary" className={riskColor(d.riskScore)}>
                        {d.riskScore}
                      </Badge>
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">{d.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Chargeback Reserve Calculator ───────────────────────── */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-5 w-5 text-purple-500" />
            Chargeback Reserve Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">Monthly F&I Gross ($)</label>
              <input
                type="number"
                value={monthlyGross}
                onChange={(e) => setMonthlyGross(Number(e.target.value))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estimated Chargeback Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={estChargebackRate}
                onChange={(e) => setEstChargebackRate(Number(e.target.value))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Recommended Monthly Reserve</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{fmt(recommendedReserve)}</p>
                <p className="text-xs text-muted-foreground mt-1">Annual: {fmt(recommendedReserve * 12)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
