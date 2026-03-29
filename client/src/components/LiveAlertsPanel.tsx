import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Bell, X, Shield, AlertTriangle, TrendingDown, Package, ChevronRight, ChevronLeft, XCircle,
} from "lucide-react";

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertType = "compliance" | "score" | "objection" | "missed_product";

export interface LiveAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: number;
  dismissed: boolean;
}

export function classifyAlertSeverity(type: AlertType): AlertSeverity {
  switch (type) {
    case "compliance": return "critical";
    case "score": return "warning";
    case "objection": return "warning";
    case "missed_product": return "info";
  }
}

const ALERT_CONFIG: Record<AlertType, { icon: typeof Shield; color: string; bgColor: string }> = {
  compliance: { icon: Shield, color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/20" },
  score: { icon: TrendingDown, color: "text-yellow-400", bgColor: "bg-yellow-500/10 border-yellow-500/20" },
  objection: { icon: AlertTriangle, color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/20" },
  missed_product: { icon: Package, color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/20" },
};

const SEVERITY_BADGE: Record<AlertSeverity, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/30",
  warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
};

// Demo alerts for non-live mode
const DEMO_ALERTS: Omit<LiveAlert, "id" | "timestamp" | "dismissed">[] = [
  { type: "compliance", severity: "critical", title: "TILA Disclosure Missing", description: "Required Truth in Lending disclosure not detected in transcript" },
  { type: "score", severity: "warning", title: "Low Closing Score", description: "Closing technique below threshold — score dropped to 52/100" },
  { type: "objection", severity: "warning", title: "Price Objection Detected", description: "Customer pushed back on price: \"That seems too expensive\"" },
  { type: "missed_product", severity: "info", title: "VSC Not Offered", description: "Vehicle Service Contract has not been mentioned yet" },
  { type: "compliance", severity: "critical", title: "ECOA Warning", description: "Potential Equal Credit Opportunity Act concern flagged" },
  { type: "missed_product", severity: "info", title: "GAP Not Presented", description: "GAP Insurance has not been discussed" },
  { type: "score", severity: "warning", title: "Rapport Score Dropping", description: "Customer engagement metrics declining in last 2 minutes" },
];

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  isLive?: boolean;
  complianceFlags?: any[];
  elapsed?: number; // seconds elapsed
}

export default function LiveAlertsPanel({ isOpen, onToggle, isLive = false, complianceFlags = [], elapsed = 0 }: Props) {
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);

  // Accumulate demo alerts over time (one every ~30 seconds)
  useEffect(() => {
    if (isLive) return;
    const alertIndex = Math.min(Math.floor(elapsed / 30), DEMO_ALERTS.length - 1);
    const newAlerts: LiveAlert[] = [];
    for (let i = 0; i <= alertIndex; i++) {
      const existing = alerts.find((a) => a.id === `demo-${i}`);
      if (existing) {
        newAlerts.push(existing);
      } else {
        const demo = DEMO_ALERTS[i];
        newAlerts.push({
          ...demo,
          id: `demo-${i}`,
          timestamp: Date.now() - (alertIndex - i) * 30000,
          dismissed: false,
        });
      }
    }
    if (newAlerts.length !== alerts.length) {
      setAlerts(newAlerts);
    }
  }, [elapsed, isLive]);

  // Add real compliance alerts when live
  useEffect(() => {
    if (!isLive || !complianceFlags?.length) return;
    const newAlerts = complianceFlags.map((flag, i) => ({
      id: `live-${i}`,
      type: "compliance" as AlertType,
      severity: classifyAlertSeverity("compliance"),
      title: flag.rule ?? "Compliance Alert",
      description: flag.description ?? "",
      timestamp: flag.timestamp ? new Date(flag.timestamp).getTime() : Date.now(),
      dismissed: false,
    }));
    setAlerts((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const merged = [...prev];
      for (const a of newAlerts) {
        if (!existingIds.has(a.id)) merged.push(a);
      }
      return merged;
    });
  }, [complianceFlags, isLive]);

  function dismissAlert(id: string) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a)));
  }

  function dismissAll() {
    setAlerts((prev) => prev.map((a) => ({ ...a, dismissed: true })));
  }

  const activeAlerts = alerts.filter((a) => !a.dismissed);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-card border border-border border-r-0 rounded-l-lg px-1.5 py-4 hover:bg-muted/50 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        {activeAlerts.length > 0 && (
          <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-red-500 text-[9px] text-white font-bold flex items-center justify-center">
            {activeAlerts.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="w-72 shrink-0 border-l border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-foreground">Live Alerts</span>
          {activeAlerts.length > 0 && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-red-500/30 text-red-400">
              {activeAlerts.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {activeAlerts.length > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={dismissAll}>
              Dismiss All
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggle}>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {activeAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">No active alerts</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Alerts will appear as the session progresses</p>
          </div>
        ) : (
          activeAlerts.map((alert) => {
            const cfg = ALERT_CONFIG[alert.type];
            const Icon = cfg.icon;
            return (
              <div
                key={alert.id}
                className={cn("p-2.5 rounded-lg border transition-colors", cfg.bgColor)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4 shrink-0", cfg.color)} />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{alert.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{alert.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="shrink-0 p-0.5 rounded hover:bg-background/50 transition-colors"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline" className={cn("text-[9px] h-3.5 px-1", SEVERITY_BADGE[alert.severity])}>
                    {alert.severity}
                  </Badge>
                  <span className="text-[9px] text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
