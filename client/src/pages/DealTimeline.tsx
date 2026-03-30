import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Calendar, ChevronDown, ChevronRight, Download, DollarSign,
  TrendingUp, Award, Filter, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "wouter";

interface DealEntry {
  id: number; date: string; customerName: string; manager: string; dealership: string;
  score: number; grade: string; pvr: number; products: string[];
}

// Demo deal data
const DEMO_DEALS: DealEntry[] = (() => {
  const managers = ["Marcus Rivera", "Jasmine Nguyen", "David Park", "Sarah Mitchell", "Carlos Mendez"];
  const dealerships = ["Sunrise Honda", "Sunset Toyota", "Valley BMW", "Eastside Ford"];
  const customers = [
    "John Smith", "Maria Garcia", "James Wilson", "Linda Chen", "Robert Taylor",
    "Patricia Brown", "Michael Davis", "Jennifer Lee", "William Anderson", "Elizabeth Martinez",
    "David Thomas", "Susan Jackson", "Richard White", "Barbara Harris", "Joseph Clark",
    "Margaret Lewis", "Charles Walker", "Dorothy Hall", "Christopher Young", "Nancy King",
  ];
  const products = ["VSC", "GAP", "Prepaid Maint", "Paint Protection", "Key Replace", "Road Hazard"];
  const deals: DealEntry[] = [];

  const now = new Date(2026, 2, 29);
  for (let i = 0; i < 40; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - Math.floor(Math.random() * 28));
    const score = 40 + Math.floor(Math.random() * 55);
    const numProducts = 1 + Math.floor(Math.random() * 4);
    const selectedProducts = [...products].sort(() => Math.random() - 0.5).slice(0, numProducts);
    deals.push({
      id: 1000 + i,
      date: d.toISOString(),
      customerName: customers[i % customers.length],
      manager: managers[i % managers.length],
      dealership: dealerships[i % dealerships.length],
      score,
      grade: score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : "D",
      pvr: 1500 + Math.floor(Math.random() * 2500),
      products: selectedProducts,
    });
  }
  return deals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
})();

function getISOWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const dayOfWeek = d.getDay();
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - dayOfWeek);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const dayOfWeek = d.getDay();
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - dayOfWeek);
  return startOfWeek.toISOString().slice(0, 10);
}

function getScoreTier(score: number): "green" | "yellow" | "red" {
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  return "red";
}

export default function DealTimeline() {
  useEffect(() => { document.title = "Deal Timeline | F&I Co-Pilot by ASURA Group"; }, []);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set(["all"]));
  const [scoreTierFilter, setScoreTierFilter] = useState<"all" | "green" | "yellow" | "red">("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [dealershipFilter, setDealershipFilter] = useState("all");

  const deals = DEMO_DEALS;
  const managers = Array.from(new Set(deals.map((d) => d.manager)));
  const dealerships = Array.from(new Set(deals.map((d) => d.dealership)));

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      if (scoreTierFilter !== "all" && getScoreTier(d.score) !== scoreTierFilter) return false;
      if (managerFilter !== "all" && d.manager !== managerFilter) return false;
      if (dealershipFilter !== "all" && d.dealership !== dealershipFilter) return false;
      return true;
    });
  }, [deals, scoreTierFilter, managerFilter, dealershipFilter]);

  // Group by week
  const weekGroups = useMemo(() => {
    const groups = new Map<string, DealEntry[]>();
    for (const deal of filtered) {
      const key = getWeekKey(deal.date);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(deal);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  // Summary strip
  const totalDealsThisWeek = weekGroups.length > 0 ? (weekGroups[0][1]?.length ?? 0) : 0;
  const avgDealScore = filtered.length > 0 ? Math.round(filtered.reduce((s, d) => s + d.score, 0) / filtered.length) : 0;
  const bestPvr = filtered.length > 0 ? Math.max(...filtered.map((d) => d.pvr)) : 0;
  const totalRevenue = filtered.reduce((s, d) => s + d.pvr, 0);

  const toggleWeek = (key: string) => {
    const next = new Set(expandedWeeks);
    if (next.has(key)) next.delete(key); else next.add(key);
    setExpandedWeeks(next);
  };

  const handleExport = () => {
    const json = JSON.stringify(filtered, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deal-timeline-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} deals as JSON`);
  };

  const tierBadgeClass = {
    green: "border-green-500/30 text-green-400",
    yellow: "border-yellow-500/30 text-yellow-400",
    red: "border-red-500/30 text-red-400",
  };

  return (
    <AppLayout title="Deal Timeline" subtitle="Chronological view of all deals">
      <div className="p-6 space-y-6">
        {/* Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Deals This Week</p>
              <p className="text-2xl font-bold text-foreground">{totalDealsThisWeek}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Avg Deal Score</p>
              <p className="text-2xl font-bold text-indigo-400">{avgDealScore}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Best PVR</p>
              <p className="text-2xl font-bold text-emerald-400">${bestPvr.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total F&I Revenue</p>
              <p className="text-2xl font-bold text-amber-400">${totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Score:</span>
            {(["all", "green", "yellow", "red"] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setScoreTierFilter(tier)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                  scoreTierFilter === tier
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                {tier === "all" ? "All" : tier.charAt(0).toUpperCase() + tier.slice(1)}
              </button>
            ))}
          </div>
          <select
            value={managerFilter}
            onChange={(e) => setManagerFilter(e.target.value)}
            className="text-xs bg-card border border-border rounded-lg px-3 py-1.5 text-foreground"
          >
            <option value="all">All Managers</option>
            {managers.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={dealershipFilter}
            onChange={(e) => setDealershipFilter(e.target.value)}
            className="text-xs bg-card border border-border rounded-lg px-3 py-1.5 text-foreground"
          >
            <option value="all">All Dealerships</option>
            {dealerships.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <Button variant="outline" size="sm" className="gap-2 ml-auto" onClick={handleExport}>
            <Download className="w-4 h-4" /> Export Timeline
          </Button>
        </div>

        {/* Week Groups */}
        {weekGroups.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-sm text-muted-foreground">No deals match your filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {weekGroups.map(([weekKey, weekDeals]) => {
              const isExpanded = expandedWeeks.has(weekKey) || expandedWeeks.has("all");
              const weekLabel = getISOWeekLabel(weekDeals[0].date);
              return (
                <Card key={weekKey}>
                  <button
                    onClick={() => toggleWeek(weekKey)}
                    className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">{weekLabel}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{weekDeals.length} deal{weekDeals.length !== 1 ? "s" : ""}</Badge>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border">
                      {weekDeals.map((deal) => {
                        const tier = getScoreTier(deal.score);
                        return (
                          <Link key={deal.id} href={`/session/${deal.id}`}>
                            <div className="flex items-center gap-4 px-4 py-3 hover:bg-accent/20 transition-colors border-b border-border/50 last:border-b-0 cursor-pointer">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground w-32 shrink-0">
                                <Clock className="w-3 h-3" />
                                {new Date(deal.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{deal.customerName}</p>
                                <p className="text-xs text-muted-foreground">{deal.manager} — {deal.dealership}</p>
                              </div>
                              <Badge variant="outline" className={cn("text-xs shrink-0", tierBadgeClass[tier])}>
                                {deal.score} ({deal.grade})
                              </Badge>
                              <div className="flex gap-1 flex-wrap max-w-[200px]">
                                {deal.products.map((p) => (
                                  <Badge key={p} variant="secondary" className="text-[10px] px-1.5 py-0">{p}</Badge>
                                ))}
                              </div>
                              <span className="text-sm font-semibold text-emerald-400 shrink-0">${deal.pvr.toLocaleString()}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
