import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Building2, ArrowRight, Loader2, ShieldAlert, CheckCircle2, Clock, CircleDashed } from "lucide-react";

/**
 * /admin/dealerships — super-admin-only list of all dealerships with their
 * setup status. Phase 6 issue 2: Adrian pre-configures each dealership
 * BEFORE its admins/managers get access.
 *
 * Click a row → /admin/dealerships/:id/setup (the admin-driven wizard).
 */
export default function AdminDealerships() {
  const [, navigate] = useLocation();
  const list = trpc.adminOnboarding.listDealershipsWithStatus.useQuery();

  if (list.isLoading) {
    return (
      <AppLayout title="Dealership setup">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (list.isError) {
    return (
      <AppLayout title="Dealership setup">
        <div className="max-w-md mx-auto p-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {list.error.message ?? "Unable to load dealerships."}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                This page is super-admin only.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const data = list.data ?? [];
  const counts = {
    pending: data.filter((d) => d.setupStatus === "pending").length,
    in_progress: data.filter((d) => d.setupStatus === "in_progress").length,
    complete: data.filter((d) => d.setupStatus === "complete").length,
  };

  return (
    <AppLayout title="Dealership setup" subtitle="Super-admin pre-configuration">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Counts */}
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Pending" count={counts.pending} icon={CircleDashed} color="text-muted-foreground" />
          <StatTile label="In progress" count={counts.in_progress} icon={Clock} color="text-amber-500" />
          <StatTile label="Complete" count={counts.complete} icon={CheckCircle2} color="text-green-500" />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Dealership</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Plan</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Setup status</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">DPA</th>
                  <th className="text-right px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No dealerships yet. Create one via <code className="text-xs">admin.createDealership</code>.
                    </td>
                  </tr>
                ) : (
                  data.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer"
                      onClick={() => navigate(`/admin/dealerships/${d.id}/setup`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-foreground">{d.name}</p>
                            <p className="text-xs text-muted-foreground">{d.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{d.plan}</td>
                      <td className="px-4 py-3">
                        <SetupStatusBadge status={d.setupStatus} step={d.onboardingStep} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {d.dpaSignedAt ? (
                          <span className="text-green-600">{d.dpaVersion ?? "signed"}</span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm">
                          Configure <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function StatTile({ label, count, icon: Icon, color }: { label: string; count: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="mt-1 text-2xl font-bold text-foreground">{count}</p>
    </div>
  );
}

function SetupStatusBadge({ status, step }: { status: string; step: number }) {
  if (status === "complete") {
    return <Badge className="bg-green-500/15 text-green-500 border-green-500/30 hover:bg-green-500/15">Complete</Badge>;
  }
  if (status === "in_progress") {
    return <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 hover:bg-amber-500/15">Step {step} of 5</Badge>;
  }
  return <Badge variant="outline">Pending</Badge>;
}
