import { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2, XCircle, Clock, Loader2, BarChart3, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { startOfWeek, format, subWeeks, isAfter } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  attempted: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  recovered: "bg-green-500/10 text-green-400 border-green-500/30",
  lost: "bg-red-500/10 text-red-400 border-red-500/30",
};

const PRODUCT_LABELS: Record<string, string> = {
  vehicle_service_contract: "Vehicle Service Agreement",
  gap_insurance: "GAP Protection",
  prepaid_maintenance: "Prepaid Maintenance",
  interior_exterior_protection: "Appearance Protection",
  road_hazard: "Road Hazard",
  paintless_dent_repair: "Paintless Dent Repair",
  key_replacement: "Key Replacement",
  windshield_protection: "Windshield Protection",
  lease_wear_tear: "Lease Wear & Tear",
  tire_wheel: "Tire & Wheel",
  theft_protection: "Theft Protection",
  other: "Other",
};

type StatusFilter = "all" | "pending" | "attempted" | "recovered" | "lost";
type SortOption = "date" | "revenue" | "status";

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Attempted", value: "attempted" },
  { label: "Recovered", value: "recovered" },
  { label: "Lost", value: "lost" },
];

export default function DealRecovery() {
  useEffect(() => { document.title = "Deal Recovery | F&I Co-Pilot by ASURA Group"; }, []);
  const [revenueInputs, setRevenueInputs] = useState<Record<number, string>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date");

  const { data: stats, isLoading: statsLoading } = trpc.dealRecovery.stats.useQuery();
  const {
    data: allRecoveries,
    isLoading: recoveriesLoading,
    refetch,
  } = trpc.dealRecovery.myRecoveries.useQuery({
    limit: 1000,
    offset: 0,
  });

  const updateMutation = trpc.dealRecovery.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Recovery status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const handleStatus = (id: number, status: "attempted" | "recovered" | "lost") => {
    const actualRevenue = status === "recovered" ? parseFloat(revenueInputs[id] || "0") : undefined;
    updateMutation.mutate({ id, status, actualRevenue });
  };

  const allItems = useMemo(() => (Array.isArray(allRecoveries) ? allRecoveries : []), [allRecoveries]);

  // Win rate calculation
  const winRate = useMemo(() => {
    const recovered = stats?.recoveredCount ?? 0;
    const lost = stats?.lostCount ?? 0;
    const total = recovered + lost;
    return total > 0 ? Math.round((recovered / total) * 100) : 0;
  }, [stats]);

  // Weekly chart data — last 8 weeks
  const chartData = useMemo(() => {
    const now = new Date();
    const eightWeeksAgo = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 7);

    const weekBuckets: Record<string, { week: string; recovered: number; attempted: number; lost: number; pending: number }> = {};

    // Initialize 8 week buckets
    for (let i = 7; i >= 0; i--) {
      const weekStart = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), i);
      const key = format(weekStart, "yyyy-MM-dd");
      const label = format(weekStart, "MMM d");
      weekBuckets[key] = { week: label, recovered: 0, attempted: 0, lost: 0, pending: 0 };
    }

    for (const rec of allItems) {
      const date = new Date(rec.createdAt ?? rec.updatedAt ?? Date.now());
      if (!isAfter(date, eightWeeksAgo)) continue;
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const key = format(weekStart, "yyyy-MM-dd");
      if (weekBuckets[key]) {
        const status = rec.recoveryStatus as string;
        if (status === "recovered") weekBuckets[key].recovered++;
        else if (status === "attempted") weekBuckets[key].attempted++;
        else if (status === "lost") weekBuckets[key].lost++;
        else weekBuckets[key].pending++;
      }
    }

    return Object.values(weekBuckets);
  }, [allItems]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let filtered = statusFilter === "all" ? allItems : allItems.filter((r: any) => r.recoveryStatus === statusFilter);

    const sorted = [...filtered];
    switch (sortBy) {
      case "date":
        sorted.sort((a: any, b: any) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
        break;
      case "revenue":
        sorted.sort((a: any, b: any) => (b.potentialRevenue ?? 0) - (a.potentialRevenue ?? 0));
        break;
      case "status": {
        const statusOrder: Record<string, number> = { pending: 0, attempted: 1, recovered: 2, lost: 3 };
        sorted.sort((a: any, b: any) => (statusOrder[a.recoveryStatus] ?? 4) - (statusOrder[b.recoveryStatus] ?? 4));
        break;
      }
    }

    return sorted;
  }, [allItems, statusFilter, sortBy]);

  return (
    <AppLayout title="Deal Recovery" subtitle="Re-engage declined products with AI-generated scripts">
      <div className="p-4 md:p-6 space-y-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pending</span>
              </div>
              <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.pendingCount ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Attempted</span>
              </div>
              <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.attemptedCount ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Recovered</span>
              </div>
              <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.recoveredCount ?? 0}</div>
              <div className="text-xs text-green-400 mt-1">${statsLoading ? "..." : (stats?.totalActualRevenue ?? 0).toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Lost</span>
              </div>
              <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.lostCount ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Potential Revenue</span>
              </div>
              <div className="text-2xl font-bold text-primary">${statsLoading ? "..." : (stats?.totalPotentialRevenue ?? 0).toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Win Rate</span>
              </div>
              <div className="text-2xl font-bold text-emerald-400">{statsLoading ? "..." : `${winRate}%`}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recovery Trends Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Recovery Trends (Last 8 Weeks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recoveriesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading chart data...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="recovered" name="Recovered" fill="#4ade80" stackId="stack" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="attempted" name="Attempted" fill="#60a5fa" stackId="stack" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#fbbf24" stackId="stack" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="lost" name="Lost" fill="#f87171" stackId="stack" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Filter and Sort Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-1 flex-wrap">
              {STATUS_FILTERS.map((f) => (
                <Button
                  key={f.value}
                  size="sm"
                  variant={statusFilter === f.value ? "default" : "outline"}
                  className={statusFilter === f.value ? "" : "text-muted-foreground"}
                  onClick={() => setStatusFilter(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-xs text-muted-foreground">Sort:</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[180px] h-8 text-xs bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (newest first)</SelectItem>
                <SelectItem value="revenue">Revenue at Risk (highest)</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Recovery Cards */}
        {recoveriesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading recoveries...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {statusFilter === "all" ? "No deal recoveries yet." : `No ${statusFilter} recoveries found.`}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {statusFilter === "all"
                  ? "Declined products will appear here after sessions are graded."
                  : "Try changing the filter to see other recoveries."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((rec: any) => (
              <Card key={rec.id} className="bg-card border-border hover:border-primary/20 transition-colors">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {PRODUCT_LABELS[rec.productType] ?? rec.productType}
                        </span>
                        <Badge className={STATUS_STYLES[rec.recoveryStatus] ?? STATUS_STYLES.pending}>
                          {rec.recoveryStatus}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rec.declineReason}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-primary font-semibold">
                        <DollarSign className="w-4 h-4" />
                        {(rec.potentialRevenue ?? 0).toLocaleString()}
                      </div>
                      <span className="text-xs text-muted-foreground">potential</span>
                    </div>
                  </div>

                  {/* AI Recovery Script */}
                  <div className="bg-background/50 border border-border rounded-lg p-3">
                    <div className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">AI Recovery Script</div>
                    <p className="text-sm text-foreground leading-relaxed">{rec.recoveryScript}</p>
                  </div>

                  {/* Actions */}
                  {rec.recoveryStatus === "pending" || rec.recoveryStatus === "attempted" ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                        onClick={() => handleStatus(rec.id, "attempted")}
                        disabled={updateMutation.isPending}
                      >
                        Mark Attempted
                      </Button>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">$</span>
                        <Input
                          type="number"
                          placeholder="Revenue"
                          className="w-24 h-8 text-xs bg-background border-border"
                          value={revenueInputs[rec.id] ?? ""}
                          onChange={(e) => setRevenueInputs({ ...revenueInputs, [rec.id]: e.target.value })}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                        onClick={() => handleStatus(rec.id, "recovered")}
                        disabled={updateMutation.isPending}
                      >
                        Mark Recovered
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                        onClick={() => handleStatus(rec.id, "lost")}
                        disabled={updateMutation.isPending}
                      >
                        Mark Lost
                      </Button>
                    </div>
                  ) : rec.recoveryStatus === "recovered" && rec.actualRevenue ? (
                    <div className="text-sm text-green-400">
                      Recovered ${rec.actualRevenue.toLocaleString()}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
