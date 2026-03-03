import { useState } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Search, Clock, Star, Shield, ChevronRight, Mic, Plus } from "lucide-react";

export default function SessionHistory() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");

  const { data: sessions, isLoading } = trpc.sessions.list.useQuery({ limit: 100, offset: 0 });

  const filtered = sessions?.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.customerName?.toLowerCase().includes(q) ||
      s.dealNumber?.toLowerCase().includes(q) ||
      s.dealType?.toLowerCase().includes(q)
    );
  });

  const statusColor = (status: string) => {
    if (status === "completed") return "border-green-500/30 text-green-400";
    if (status === "active") return "border-blue-500/30 text-blue-400";
    return "border-border text-muted-foreground";
  };

  return (
    <AppLayout title="Session History" subtitle="All recorded F&I interactions">
      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer, deal #, type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <Button onClick={() => navigate("/session/new")} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> New Session
          </Button>
        </div>

        {/* Sessions List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((session) => (
              <Card
                key={session.id}
                className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer group"
                onClick={() => navigate(`/session/${session.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Mic className="w-5 h-5 text-primary" />
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {session.customerName ?? `Session #${session.id}`}
                        </p>
                        <Badge variant="outline" className={cn("text-[10px] shrink-0", statusColor(session.status))}>
                          {session.status}
                        </Badge>
                        {session.consentObtained && (
                          <Shield className="w-3 h-3 text-green-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{session.dealType?.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "—"}</span>
                        {session.dealNumber && <span>Deal #{session.dealNumber}</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(session.startedAt), "MMM d, yyyy h:mm a")}
                        </span>
                        {session.durationSeconds && (
                          <span>{Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s</span>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0">
                      {session.vehicleType && (
                        <p className="text-xs text-muted-foreground capitalize mb-1">{session.vehicleType}</p>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="py-16 text-center">
              <Mic className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {search ? "No sessions match your search" : "No sessions recorded yet"}
              </p>
              {!search && (
                <Button className="mt-4 gap-2" onClick={() => navigate("/session/new")}>
                  <Plus className="w-4 h-4" /> Start Your First Session
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
