import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";

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

export default function DealRecovery() {
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const [revenueInputs, setRevenueInputs] = useState<Record<number, string>>({});

  const { data: stats, isLoading: statsLoading } = trpc.dealRecovery.stats.useQuery();
  const {
    data: recoveries,
    isLoading: recoveriesLoading,
    refetch,
  } = trpc.dealRecovery.myRecoveries.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
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

  const items = Array.isArray(recoveries) ? recoveries : [];

  return (
    <AppLayout title="Deal Recovery" subtitle="Re-engage declined products with AI-generated scripts">
      <div className="p-4 md:p-6 space-y-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
        </div>

        {/* Recovery Cards */}
        {recoveriesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading recoveries...</span>
          </div>
        ) : items.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No deal recoveries yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Declined products will appear here after sessions are graded.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((rec: any) => (
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
                      ✅ Recovered ${rec.actualRevenue.toLocaleString()}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {items.length > 0 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              Previous
            </Button>
            <span className="flex items-center text-sm text-muted-foreground px-3">Page {page + 1}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={items.length < PAGE_SIZE}>
              Next
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
