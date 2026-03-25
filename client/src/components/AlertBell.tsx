import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Bell, ShieldAlert, TrendingDown, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AlertBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: alerts = [], refetch } = trpc.alerts.list.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const markRead = trpc.alerts.markRead.useMutation({
    onSuccess: () => refetch(),
  });

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unreadCount = alerts.length;

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="relative w-8 h-8"
        onClick={() => setOpen(!open)}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-accent/30">
            <span className="text-xs font-semibold text-foreground">Alerts</span>
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setOpen(false)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No unread alerts
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-2.5 px-3 py-2.5 border-b border-border/50 hover:bg-accent/30 transition-colors"
                >
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    alert.type === "compliance" ? "bg-red-500/15" : "bg-amber-500/15"
                  )}>
                    {alert.type === "compliance" ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground leading-tight">{alert.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{alert.detail}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn(
                        "text-[9px] px-1 py-0 h-3.5",
                        alert.severity === "critical" ? "border-red-500/30 text-red-400" : "border-amber-500/30 text-amber-400"
                      )}>
                        {alert.severity}
                      </Badge>
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 shrink-0 text-muted-foreground hover:text-green-400"
                    onClick={() => markRead.mutate({ alertId: alert.id })}
                    title="Mark as read"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
