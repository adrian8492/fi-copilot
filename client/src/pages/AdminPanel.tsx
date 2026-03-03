import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Users, Shield, Activity, Crown, UserCheck, RefreshCw } from "lucide-react";

export default function AdminPanel() {
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const { data: users, refetch: refetchUsers } = trpc.admin.listUsers.useQuery();
  const { data: auditLogs } = trpc.admin.auditLogs.useQuery({ limit: 100, offset: 0 });
  const { data: allSessions } = trpc.admin.allSessions.useQuery({ limit: 100, offset: 0 });

  const updateRole = trpc.admin.updateRole.useMutation({
    onSuccess: () => {
      refetchUsers();
      toast.success("Role updated successfully");
      setUpdatingUserId(null);
    },
    onError: () => {
      toast.error("Failed to update role");
      setUpdatingUserId(null);
    },
  });

  const handleRoleToggle = (userId: number, currentRole: string) => {
    setUpdatingUserId(userId);
    const newRole = currentRole === "admin" ? "user" : "admin";
    updateRole.mutate({ userId, role: newRole });
  };

  return (
    <AppLayout title="Admin Panel" subtitle="User management, audit logs, and system oversight">
      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Users", value: users?.length ?? 0, icon: Users, color: "text-blue-400" },
            { label: "Total Sessions", value: allSessions?.length ?? 0, icon: Activity, color: "text-purple-400" },
            { label: "Audit Events", value: auditLogs?.length ?? 0, icon: Shield, color: "text-yellow-400" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className={cn("text-2xl font-bold mt-1", stat.color)}>{stat.value}</p>
                  </div>
                  <stat.icon className={cn("w-5 h-5 mt-0.5", stat.color)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="users">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">All Users ({users?.length ?? 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users?.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 border border-border">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user.name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email ?? user.openId}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={cn(
                          "text-[10px]",
                          user.role === "admin" ? "border-yellow-500/30 text-yellow-400" : "border-border text-muted-foreground"
                        )}>
                          {user.role === "admin" ? <Crown className="w-2.5 h-2.5 mr-1 inline" /> : <UserCheck className="w-2.5 h-2.5 mr-1 inline" />}
                          {user.role}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={updatingUserId === user.id}
                          onClick={() => handleRoleToggle(user.id, user.role)}
                        >
                          {updatingUserId === user.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : user.role === "admin" ? "Demote" : "Promote"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">All Sessions ({allSessions?.length ?? 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {allSessions?.map((session) => (
                    <div key={session.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 border border-border">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-foreground truncate">
                            {session.customerName ?? `Session #${session.id}`}
                          </p>
                          <Badge variant="outline" className={cn(
                            "text-[10px] shrink-0",
                            session.status === "completed" ? "border-green-500/30 text-green-400" :
                            session.status === "active" ? "border-blue-500/30 text-blue-400" :
                            "border-border text-muted-foreground"
                          )}>
                            {session.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          User #{session.userId} • {format(new Date(session.startedAt), "MMM d, yyyy h:mm a")}
                          {session.dealType && ` • ${session.dealType.replace("_", " ")}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Audit Log (Last 100 Events)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {auditLogs?.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-accent/10 border border-border">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-mono text-foreground">{log.action}</p>
                          {log.resourceType && (
                            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                              {log.resourceType}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          User #{log.userId} • {format(new Date(log.createdAt), "MMM d, yyyy h:mm:ss a")}
                          {log.resourceId && ` • ID: ${log.resourceId}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
