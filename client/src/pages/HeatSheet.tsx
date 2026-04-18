import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Flame,
  ArrowUpDown,
  Filter,
  RefreshCw,
  Users,
  TrendingUp,
  Target,
  Percent,
  X,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────

type HeatTier = "Hot" | "Warm" | "Cool" | "Cold";
type SortField = "heatScore" | "name" | "timeInStore" | "vehiclePrice";

interface HeatFactor {
  label: string;
  weight: number;
}

interface HeatCustomer {
  id: number;
  name: string;
  vehicle: string;
  vehiclePrice: number;
  timeInStore: number; // minutes
  factors: string[];
  heatScore: number;
  notes: string;
}

// ─── Constants ─────────────────────────────────────────────────────

const ALL_FACTORS: HeatFactor[] = [
  { label: "returning customer", weight: 12 },
  { label: "pre-approved", weight: 15 },
  { label: "trade-in present", weight: 10 },
  { label: "cash buyer", weight: 8 },
  { label: "repeated visit", weight: 11 },
  { label: "spouse present", weight: 9 },
  { label: "decision maker confirmed", weight: 14 },
  { label: "credit pulled", weight: 13 },
];

function getHeatTier(score: number): HeatTier {
  if (score >= 80) return "Hot";
  if (score >= 60) return "Warm";
  if (score >= 40) return "Cool";
  return "Cold";
}

const TIER_COLORS: Record<HeatTier, string> = {
  Hot: "bg-red-500/15 text-red-600 border-red-300",
  Warm: "bg-yellow-500/15 text-yellow-600 border-yellow-300",
  Cool: "bg-blue-500/15 text-blue-600 border-blue-300",
  Cold: "bg-gray-500/15 text-gray-500 border-gray-300",
};

const TIER_DOTS: Record<HeatTier, string> = {
  Hot: "bg-red-500",
  Warm: "bg-yellow-500",
  Cool: "bg-blue-500",
  Cold: "bg-gray-400",
};

const ROW_TINTS: Record<HeatTier, string> = {
  Hot: "bg-red-500/5",
  Warm: "bg-yellow-500/5",
  Cool: "bg-blue-500/5",
  Cold: "",
};

const FACTOR_COLORS: Record<string, string> = {
  "returning customer": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "pre-approved": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "trade-in present": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "cash buyer": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "repeated visit": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "spouse present": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  "decision maker confirmed": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  "credit pulled": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
};

// ─── Demo Data ─────────────────────────────────────────────────────

const DEMO_CUSTOMERS: HeatCustomer[] = [
  { id: 1, name: "Marcus Johnson", vehicle: "2026 BMW X5", vehiclePrice: 67400, timeInStore: 95, factors: ["pre-approved", "decision maker confirmed", "credit pulled", "trade-in present", "returning customer", "spouse present"], heatScore: 92, notes: "" },
  { id: 2, name: "Sarah Chen", vehicle: "2026 Lexus RX 350", vehiclePrice: 52800, timeInStore: 72, factors: ["pre-approved", "credit pulled", "decision maker confirmed", "returning customer"], heatScore: 88, notes: "" },
  { id: 3, name: "David Williams", vehicle: "2025 Ford F-150", vehiclePrice: 58200, timeInStore: 110, factors: ["trade-in present", "cash buyer", "decision maker confirmed", "credit pulled", "repeated visit"], heatScore: 85, notes: "" },
  { id: 4, name: "Jennifer Lopez", vehicle: "2026 Tesla Model Y", vehiclePrice: 48900, timeInStore: 60, factors: ["pre-approved", "credit pulled", "spouse present", "decision maker confirmed"], heatScore: 83, notes: "" },
  { id: 5, name: "Robert Kim", vehicle: "2026 Mercedes GLE", vehiclePrice: 72100, timeInStore: 88, factors: ["returning customer", "pre-approved", "credit pulled", "trade-in present"], heatScore: 81, notes: "" },
  { id: 6, name: "Amanda Foster", vehicle: "2025 Toyota Camry", vehiclePrice: 32400, timeInStore: 45, factors: ["pre-approved", "decision maker confirmed", "credit pulled"], heatScore: 76, notes: "" },
  { id: 7, name: "Carlos Rivera", vehicle: "2026 Audi Q7", vehiclePrice: 63800, timeInStore: 65, factors: ["trade-in present", "spouse present", "credit pulled", "returning customer"], heatScore: 73, notes: "" },
  { id: 8, name: "Lisa Thompson", vehicle: "2025 Honda CR-V", vehiclePrice: 38500, timeInStore: 50, factors: ["repeated visit", "decision maker confirmed", "pre-approved"], heatScore: 70, notes: "" },
  { id: 9, name: "Michael Brown", vehicle: "2026 Chevy Tahoe", vehiclePrice: 61200, timeInStore: 78, factors: ["trade-in present", "credit pulled", "spouse present"], heatScore: 67, notes: "" },
  { id: 10, name: "Emily Davis", vehicle: "2025 Nissan Rogue", vehiclePrice: 34600, timeInStore: 42, factors: ["pre-approved", "decision maker confirmed", "returning customer"], heatScore: 65, notes: "" },
  { id: 11, name: "James Wilson", vehicle: "2025 Hyundai Tucson", vehiclePrice: 33900, timeInStore: 55, factors: ["credit pulled", "repeated visit"], heatScore: 55, notes: "" },
  { id: 12, name: "Patricia Moore", vehicle: "2026 Kia Telluride", vehiclePrice: 44200, timeInStore: 38, factors: ["trade-in present", "decision maker confirmed"], heatScore: 52, notes: "" },
  { id: 13, name: "Daniel Taylor", vehicle: "2025 Subaru Outback", vehiclePrice: 39700, timeInStore: 67, factors: ["spouse present", "returning customer"], heatScore: 48, notes: "" },
  { id: 14, name: "Jessica Anderson", vehicle: "2025 Mazda CX-5", vehiclePrice: 36800, timeInStore: 30, factors: ["pre-approved", "credit pulled"], heatScore: 46, notes: "" },
  { id: 15, name: "Christopher Lee", vehicle: "2026 Jeep Wrangler", vehiclePrice: 49500, timeInStore: 82, factors: ["trade-in present", "repeated visit"], heatScore: 44, notes: "" },
  { id: 16, name: "Michelle Clark", vehicle: "2025 VW Tiguan", vehiclePrice: 35200, timeInStore: 25, factors: ["decision maker confirmed"], heatScore: 35, notes: "" },
  { id: 17, name: "Kevin Martinez", vehicle: "2025 Dodge Charger", vehiclePrice: 42600, timeInStore: 20, factors: ["cash buyer"], heatScore: 30, notes: "" },
  { id: 18, name: "Nancy White", vehicle: "2025 Buick Envision", vehiclePrice: 37400, timeInStore: 15, factors: ["returning customer"], heatScore: 25, notes: "" },
  { id: 19, name: "Steven Harris", vehicle: "2025 GMC Terrain", vehiclePrice: 36100, timeInStore: 18, factors: ["repeated visit"], heatScore: 22, notes: "" },
  { id: 20, name: "Laura Jackson", vehicle: "2025 Chevy Equinox", vehiclePrice: 31800, timeInStore: 10, factors: [], heatScore: 15, notes: "" },
];

// ─── Component ─────────────────────────────────────────────────────

export default function HeatSheet() {
  useEffect(() => {
    document.title = "Heat Sheet | F&I Co-Pilot by ASURA Group";
  }, []);

  const [customers, setCustomers] = useState<HeatCustomer[]>(DEMO_CUSTOMERS);
  const [sortField, setSortField] = useState<SortField>("heatScore");
  const [tierFilter, setTierFilter] = useState<HeatTier | "All">("All");
  const [selectedCustomer, setSelectedCustomer] = useState<HeatCustomer | null>(null);
  const [actionCustomer, setActionCustomer] = useState<HeatCustomer | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [refreshCountdown, setRefreshCountdown] = useState(30);

  // Auto-refresh countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    let result = [...customers];
    if (tierFilter !== "All") {
      result = result.filter((c) => getHeatTier(c.heatScore) === tierFilter);
    }
    result.sort((a, b) => {
      switch (sortField) {
        case "heatScore":
          return b.heatScore - a.heatScore;
        case "name":
          return a.name.localeCompare(b.name);
        case "timeInStore":
          return a.timeInStore - b.timeInStore;
        case "vehiclePrice":
          return b.vehiclePrice - a.vehiclePrice;
      }
    });
    return result;
  }, [customers, sortField, tierFilter]);

  // KPIs
  const totalPipeline = customers.length;
  const hotLeads = customers.filter((c) => getHeatTier(c.heatScore) === "Hot").length;
  const avgHeatScore = Math.round(customers.reduce((s, c) => s + c.heatScore, 0) / customers.length);
  const estCloseRate = Math.round(avgHeatScore * 0.65);

  function handleSaveAction() {
    if (!actionCustomer) return;
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === actionCustomer.id ? { ...c, notes: actionNote } : c
      )
    );
    setActionCustomer(null);
    setActionNote("");
  }

  return (
    <AppLayout title="Heat Sheet" subtitle="Real-time customer heat tracker">
      {/* KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total in Pipeline</p>
              <p className="text-2xl font-bold">{totalPipeline}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10"><Flame className="w-5 h-5 text-red-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Hot Leads</p>
              <p className="text-2xl font-bold">{hotLeads}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10"><TrendingUp className="w-5 h-5 text-orange-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Heat Score</p>
              <p className="text-2xl font-bold">{avgHeatScore}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><Percent className="w-5 h-5 text-green-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Est. Close Rate</p>
              <p className="text-2xl font-bold">{estCloseRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <select
            className="text-sm border rounded-md px-2 py-1.5 bg-background"
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
          >
            <option value="heatScore">Heat Score</option>
            <option value="name">Customer Name</option>
            <option value="timeInStore">Time in Store</option>
            <option value="vehiclePrice">Vehicle Price</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {(["All", "Hot", "Warm", "Cool", "Cold"] as const).map((tier) => (
            <Button
              key={tier}
              variant={tierFilter === tier ? "default" : "outline"}
              size="sm"
              onClick={() => setTierFilter(tier)}
            >
              {tier}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "30s" }} />
          Refresh in {refreshCountdown}s
        </div>
      </div>

      {/* Customer Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium text-center">Time</th>
                <th className="px-4 py-3 font-medium text-center">Score</th>
                <th className="px-4 py-3 font-medium">Heat Factors</th>
                <th className="px-4 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => {
                const tier = getHeatTier(customer.heatScore);
                return (
                  <tr key={customer.id} className={`border-b hover:bg-muted/50 ${ROW_TINTS[tier]}`}>
                    <td className="px-4 py-3 font-medium">{customer.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.vehicle}</td>
                    <td className="px-4 py-3 text-right">${customer.vehiclePrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">{customer.timeInStore}m</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        className="inline-flex items-center gap-1.5 cursor-pointer"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${TIER_DOTS[tier]}`} />
                        <span className="font-semibold">{customer.heatScore}</span>
                        <Badge variant="outline" className={`text-xs ${TIER_COLORS[tier]}`}>{tier}</Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {customer.factors.map((f) => (
                          <span key={f} className={`text-xs px-1.5 py-0.5 rounded ${FACTOR_COLORS[f] ?? "bg-gray-100 text-gray-700"}`}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button size="sm" variant="outline" onClick={() => { setActionCustomer(customer); setActionNote(customer.notes); }}>
                        <Target className="w-3.5 h-3.5 mr-1" /> Take Action
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Heat Score Breakdown Modal */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Heat Score Breakdown — {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{selectedCustomer.heatScore}/100</span>
                <Badge className={TIER_COLORS[getHeatTier(selectedCustomer.heatScore)]}>{getHeatTier(selectedCustomer.heatScore)}</Badge>
              </div>
              <div className="space-y-2">
                {ALL_FACTORS.map((factor) => {
                  const active = selectedCustomer.factors.includes(factor.label);
                  return (
                    <div key={factor.label} className={`flex items-center justify-between px-3 py-2 rounded-md text-sm ${active ? "bg-primary/10" : "bg-muted/50 opacity-50"}`}>
                      <span>{factor.label}</span>
                      <span className="font-mono font-medium">{active ? `+${factor.weight}` : "—"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Take Action Modal */}
      <Dialog open={!!actionCustomer} onOpenChange={() => setActionCustomer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Take Action — {actionCustomer?.name}</DialogTitle>
          </DialogHeader>
          {actionCustomer && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Follow-up Notes</label>
                <textarea
                  className="mt-1 w-full border rounded-md p-2 text-sm bg-background min-h-[80px]"
                  placeholder="Reason for follow-up..."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Quick tags:</span>
                {["Needs callback", "Ready to close", "Waiting on trade appraisal", "Second pencil needed"].map((tag) => (
                  <Badge key={tag} variant="outline" className="cursor-pointer text-xs" onClick={() => setActionNote((prev) => (prev ? `${prev}, ${tag}` : tag))}>
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActionCustomer(null)}>Cancel</Button>
                <Button onClick={handleSaveAction}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
