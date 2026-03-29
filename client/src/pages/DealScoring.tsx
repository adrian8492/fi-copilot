import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BarChart3, TrendingUp, DollarSign, Shield, Target, ArrowUpDown, Filter,
  Award, Percent, Users, ChevronUp, ChevronDown,
} from "lucide-react";

// --- Deal Score Calculation ---
// PVR contribution (40%), Product penetration (30%), Compliance (20%), Sentiment (10%)
export function calculateDealScore(
  pvr: number,
  avgPvr: number,
  productsAccepted: number,
  productsPresented: number,
  complianceScore: number,
  objectionCount: number,
): number {
  const pvrComponent = avgPvr > 0 ? Math.min(100, (pvr / avgPvr) * 100) : 50;
  const penetrationComponent = productsPresented > 0 ? (productsAccepted / productsPresented) * 100 : 0;
  const complianceComponent = Math.min(100, Math.max(0, complianceScore));
  // Fewer objections = better sentiment: 0 objections = 100, 5+ = 0
  const sentimentComponent = Math.max(0, Math.min(100, 100 - objectionCount * 20));

  const score = Math.round(
    pvrComponent * 0.4 +
    penetrationComponent * 0.3 +
    complianceComponent * 0.2 +
    sentimentComponent * 0.1
  );
  return Math.min(100, Math.max(0, score));
}

export function getDealScoreColor(score: number): "red" | "yellow" | "green" {
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  return "red";
}

const COLOR_STYLES = {
  green: { badge: "bg-green-500/10 text-green-400 border-green-500/30", bar: "bg-green-500" },
  yellow: { badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", bar: "bg-yellow-500" },
  red: { badge: "bg-red-500/10 text-red-400 border-red-500/30", bar: "bg-red-500" },
};

type SortKey = "customer" | "date" | "pvr" | "productsSold" | "compliance" | "dealScore";
type TierFilter = "all" | "green" | "yellow" | "red";

interface Deal {
  id: number;
  customer: string;
  date: string;
  pvr: number;
  productsPresented: number;
  productsSold: number;
  compliance: number;
  objectionCount: number;
  dealScore: number;
  tier: "red" | "yellow" | "green";
}

export default function DealScoring() {
  useEffect(() => { document.title = "Deal Scoring | F&I Co-Pilot by ASURA Group"; }, []);

  const [sortKey, setSortKey] = useState<SortKey>("dealScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");

  const { data: summary } = trpc.analytics.summary.useQuery();
  const { data: sessions } = trpc.sessions.list.useQuery({ limit: 200 });

  const avgPvr = summary?.avgPvr ?? 2800;

  const deals = useMemo<Deal[]>(() => {
    if (!sessions?.rows) return [];
    return sessions.rows.map((s: any) => {
      const pvr = s.pvr ?? s.totalPvr ?? 0;
      const productsPresented = s.productsPresented ?? 5;
      const productsSold = s.productsSold ?? s.productsAccepted ?? 0;
      const compliance = s.complianceScore ?? s.grade?.complianceScore ?? 85;
      const objectionCount = s.objectionCount ?? 2;
      const dealScore = calculateDealScore(pvr, avgPvr, productsSold, productsPresented, compliance, objectionCount);
      const tier = getDealScoreColor(dealScore);
      return {
        id: s.id,
        customer: s.customerName || s.customer?.name || `Deal #${s.id}`,
        date: s.startedAt ?? s.createdAt ?? new Date().toISOString(),
        pvr,
        productsPresented,
        productsSold,
        compliance,
        objectionCount,
        dealScore,
        tier,
      };
    });
  }, [sessions, avgPvr]);

  const filtered = useMemo(() => {
    let result = [...deals];
    if (tierFilter !== "all") result = result.filter((d) => d.tier === tierFilter);
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "customer": cmp = a.customer.localeCompare(b.customer); break;
        case "date": cmp = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
        case "pvr": cmp = a.pvr - b.pvr; break;
        case "productsSold": cmp = a.productsSold - b.productsSold; break;
        case "compliance": cmp = a.compliance - b.compliance; break;
        case "dealScore": cmp = a.dealScore - b.dealScore; break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return result;
  }, [deals, tierFilter, sortKey, sortDir]);

  // KPI calculations
  const avgDealScore = deals.length > 0 ? Math.round(deals.reduce((s, d) => s + d.dealScore, 0) / deals.length) : 0;
  const greenPct = deals.length > 0 ? Math.round((deals.filter((d) => d.tier === "green").length / deals.length) * 100) : 0;
  const totalPvr = deals.reduce((s, d) => s + d.pvr, 0);
  const bestDealScore = deals.length > 0 ? Math.max(...deals.map((d) => d.dealScore)) : 0;

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />;
  };

  return (
    <AppLayout title="Deal Scoring" subtitle="Composite deal performance scores across all sessions">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Award className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Deal Scoring Dashboard</h1>
            <p className="text-muted-foreground text-sm">PVR (40%) + Penetration (30%) + Compliance (20%) + Sentiment (10%)</p>
          </div>
        </div>

        {/* KPI Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Avg Deal Score", value: `${avgDealScore}`, icon: Target, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
            { label: "% Green Deals", value: `${greenPct}%`, icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
            { label: "Total PVR", value: `$${totalPvr.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
            { label: "Best Deal Score", value: `${bestDealScore}`, icon: Award, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg border", kpi.bg)}>
                  <kpi.icon className={cn("w-5 h-5", kpi.color)} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                  <p className={cn("text-xl font-bold", kpi.color)}>{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mr-1">Tier:</span>
          {(["all", "green", "yellow", "red"] as TierFilter[]).map((t) => (
            <Button
              key={t}
              variant={tierFilter === t ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs capitalize"
              onClick={() => setTierFilter(t)}
            >
              {t === "all" ? `All (${deals.length})` : `${t} (${deals.filter((d) => d.tier === t).length})`}
            </Button>
          ))}
        </div>

        {/* Deal Table */}
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    { key: "customer" as SortKey, label: "Customer" },
                    { key: "date" as SortKey, label: "Date" },
                    { key: "pvr" as SortKey, label: "PVR" },
                    { key: "productsSold" as SortKey, label: "Products Sold" },
                    { key: "compliance" as SortKey, label: "Compliance %" },
                    { key: "dealScore" as SortKey, label: "Deal Score" },
                  ].map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        <SortIcon col={col.key} />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Tier</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      No deals match the current filter
                    </td>
                  </tr>
                ) : (
                  filtered.map((deal) => {
                    const color = getDealScoreColor(deal.dealScore);
                    const styles = COLOR_STYLES[color];
                    return (
                      <tr key={deal.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{deal.customer}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(deal.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-green-400 font-medium">${deal.pvr.toLocaleString()}</td>
                        <td className="px-4 py-3 text-foreground">{deal.productsSold}/{deal.productsPresented}</td>
                        <td className="px-4 py-3 text-foreground">{deal.compliance}%</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-muted/50 overflow-hidden">
                              <div className={cn("h-full rounded-full", styles.bar)} style={{ width: `${deal.dealScore}%` }} />
                            </div>
                            <span className="font-bold text-foreground">{deal.dealScore}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-[10px] capitalize", styles.badge)}>
                            {color}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
