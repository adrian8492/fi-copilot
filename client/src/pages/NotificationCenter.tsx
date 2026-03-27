import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import {
  Bell, CheckCircle2, ShieldAlert, TrendingDown, AlertTriangle,
  Info, ChevronRight, CheckCheck,
} from "lucide-react";

type FilterTab = "all" | "unread" | "critical" | "warning";

export default function NotificationCenter() {
  useEffect(() => { document.title = "Notifications | F&I Co-Pilot by ASURA Group"; }, []);
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<FilterTab>("all");

  const { data: alerts = [], refetch } = trpc.alerts.list.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const markRead = trpc.alerts.markRead.useMutation({
    onSuccess: () => refetch(),
  });

  const filtered = alerts.filter((alert) => {
    if (filter === "unread") return true; // all from alerts.list are unread
    if (filter === "critical") return alert.severity === "critical";
    if (filter === "warning") return alert.severity === "warning";
    return true;
  });

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;

  const handleMarkAllRead = () => {
    for (const alert of alerts) {
      markRead.mutate({ alertId: alert.id });
    }
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === "critical") return <ShieldAlert className="w-4 h-4 text-red-400" />;
    if (severity === "warning") return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    return <Info className="w-4 h-4 text-blue-400" />;
  };

  const getSeverityDot = (severity: string) => {
    if (severity === "critical") return "🔴";
    if (severity === "warning") return "🟡";
    return "🔵";
  };

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "All", count: alerts.length },
    { key: "unread", label: "Unread", count: alerts.length },
    { key: "critical", label: "Critical", count: criticalCount },
    { key: "warning", label: "Warnings", count: warningCount },
  ];

  return (
    <AppLayout title="Notification Center" subtitle="All alerts and notifications">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Notification Center</h1>
              <p className="text-muted-foreground text-sm">
                {alerts.length > 0 ? `${alerts.length} unread alert${alerts.length !== 1 ? "s" : ""}` : "All clear"}
              </p>
            </div>
          </div>
          {alerts.length > 0 && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleMarkAllRead}
              disabled={markRead.isPending}
            >
              <CheckCheck className="w-4 h-4" />
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                filter === tab.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}
            >
              {tab.label} ({tab.count ?? 0})
            </button>
          ))}
        </div>

        {/* Alert List */}
        {filtered.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-16 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4 opacity-60" />
              <p className="text-lg font-semibold text-foreground mb-1">All clear — no alerts</p>
              <p className="text-sm text-muted-foreground">
                {filter !== "all" ? "No alerts match this filter." : "You're all caught up. Great work!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((alert) => (
              <Card
                key={alert.id}
                className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Severity Icon */}
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      alert.severity === "critical" ? "bg-red-500/15" :
                      alert.severity === "warning" ? "bg-amber-500/15" : "bg-blue-500/15"
                    )}>
                      {getSeverityIcon(alert.severity)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs">{getSeverityDot(alert.severity)}</span>
                        <p className="text-sm font-semibold text-foreground">{alert.message}</p>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{alert.detail}</p>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={cn(
                          "text-[10px] px-1.5 py-0 h-4",
                          alert.severity === "critical" ? "border-red-500/30 text-red-400" :
                          alert.severity === "warning" ? "border-amber-500/30 text-amber-400" :
                          "border-blue-500/30 text-blue-400"
                        )}>
                          {alert.severity}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                        </span>
                        {alert.sessionId && (
                          <button
                            className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                            onClick={(e) => { e.stopPropagation(); navigate(`/session/${alert.sessionId}`); }}
                          >
                            View Session <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mark Read */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 shrink-0 text-muted-foreground hover:text-green-400"
                      onClick={(e) => { e.stopPropagation(); markRead.mutate({ alertId: alert.id }); }}
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
