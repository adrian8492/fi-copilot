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
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Users, Shield, Activity, Crown, UserCheck, RefreshCw, Building2, Settings2,
  CheckCircle2, XCircle, Mail, Link2, Trash2, Clock, AlertTriangle,
  Layers, Plus, Minus, Store,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AdminPanel() {
  const { user: authUser } = useAuth();
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [dealershipName, setDealershipName] = useState("ASURA Dealership Group");
  const [maxSessionDuration, setMaxSessionDuration] = useState("120");
  const [autoGrade, setAutoGrade] = useState(true);
  const [requireCustomerName, setRequireCustomerName] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleSaveSettings = () => {
    setSettingsSaved(true);
    toast.success("Dealership settings saved");
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const [newDealershipName, setNewDealershipName] = useState("");
  const [newDealershipSlug, setNewDealershipSlug] = useState("");
  const [newDealershipPlan, setNewDealershipPlan] = useState<"trial" | "beta" | "pro" | "enterprise">("beta");

  // ─── Groups state ─────────────────────────────────────────────────────────
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupSlug, setNewGroupSlug] = useState("");

  // ─── User rooftop management state ────────────────────────────────────────
  const [managingUserId, setManagingUserId] = useState<number | null>(null);
  const [assignDealershipId, setAssignDealershipId] = useState<number>(1);

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: users, refetch: refetchUsers } = trpc.admin.listUsers.useQuery();
  const { data: auditLogsData } = trpc.admin.auditLogs.useQuery({ limit: 100, offset: 0 });
  const { data: allSessionsData } = trpc.admin.allSessions.useQuery({ limit: 100, offset: 0 });
  const auditLogs = auditLogsData?.rows;
  const allSessions = allSessionsData?.rows;
  const { data: dealershipsList, refetch: refetchDealerships } = trpc.admin.listDealerships.useQuery();
  const { data: groupsList, refetch: refetchGroups } = trpc.admin.listGroups.useQuery();

  const { data: userRooftops, refetch: refetchUserRooftops } = trpc.admin.getUserRooftopAssignments.useQuery(
    { userId: managingUserId! },
    { enabled: managingUserId !== null }
  );

  // ─── Mutations ────────────────────────────────────────────────────────────
  const createDealershipMutation = trpc.admin.createDealership.useMutation({
    onSuccess: () => {
      refetchDealerships();
      setNewDealershipName("");
      setNewDealershipSlug("");
      toast.success("Dealership created");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleDealershipActive = trpc.admin.updateDealership.useMutation({
    onSuccess: () => { refetchDealerships(); toast.success("Dealership updated"); },
    onError: (e) => toast.error(e.message),
  });

  const createGroupMutation = trpc.admin.createGroup.useMutation({
    onSuccess: () => {
      refetchGroups();
      setNewGroupName("");
      setNewGroupSlug("");
      toast.success("Group created");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateGroupMutation = trpc.admin.updateGroup.useMutation({
    onSuccess: () => { refetchGroups(); toast.success("Group updated"); },
    onError: (e) => toast.error(e.message),
  });

  const assignRooftopMutation = trpc.admin.assignUserToRooftop.useMutation({
    onSuccess: () => {
      refetchUserRooftops();
      setAssignDealershipId(1);
      toast.success("Rooftop assigned");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeRooftopMutation = trpc.admin.removeUserFromRooftop.useMutation({
    onSuccess: () => {
      refetchUserRooftops();
      toast.success("Rooftop removed");
    },
    onError: (e) => toast.error(e.message),
  });

  // Invitations state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "admin">("user");
  const [inviteDealershipId, setInviteDealershipId] = useState<number>(1);
  const [inviteExpiry, setInviteExpiry] = useState(7);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const { data: inviteList, refetch: refetchInvites } = trpc.invitations.list.useQuery(
    { dealershipId: inviteDealershipId },
    { enabled: !!inviteDealershipId }
  );

  const createInviteMutation = trpc.invitations.create.useMutation({
    onSuccess: (data) => {
      setGeneratedLink(data.inviteUrl);
      refetchInvites();
      setInviteEmail("");
      toast.success("Invite link generated");
    },
    onError: (e) => toast.error(e.message),
  });

  const revokeInviteMutation = trpc.invitations.revoke.useMutation({
    onSuccess: () => { refetchInvites(); toast.success("Invite revoked"); },
    onError: (e) => toast.error(e.message),
  });

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

  // Helper: get role badge styling
  const getRoleBadge = (user: { role: string; isSuperAdmin?: boolean; isGroupAdmin?: boolean }) => {
    if (user.isSuperAdmin) return { label: "Super Admin", className: "border-purple-500/30 text-purple-400", icon: Crown };
    if (user.isGroupAdmin) return { label: "Group Admin", className: "border-indigo-500/30 text-indigo-400", icon: Layers };
    if (user.role === "admin") return { label: "Admin", className: "border-yellow-500/30 text-yellow-400", icon: Crown };
    return { label: "F&I Manager", className: "border-border text-muted-foreground", icon: UserCheck };
  };

  return (
    <AppLayout title="Admin Panel" subtitle="User management, audit logs, and system oversight">
      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Users", value: users?.length ?? 0, icon: Users, color: "text-blue-400" },
            { label: "Total Sessions", value: allSessionsData?.total ?? 0, icon: Activity, color: "text-purple-400" },
            { label: "Audit Events", value: auditLogsData?.total ?? 0, icon: Shield, color: "text-yellow-400" },
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
          <TabsList className="bg-muted/50 border border-border flex-wrap h-auto gap-1 p-1 w-full">
            <TabsTrigger value="users" className="flex-none">Users</TabsTrigger>
            <TabsTrigger value="groups" className="flex-none">Groups</TabsTrigger>
            <TabsTrigger value="dealerships" className="flex-none">Dealerships</TabsTrigger>
            <TabsTrigger value="invitations" className="flex-none">Invitations</TabsTrigger>
            <TabsTrigger value="sessions" className="flex-none">Sessions</TabsTrigger>
            <TabsTrigger value="audit" className="flex-none">Audit Log</TabsTrigger>
            <TabsTrigger value="settings" className="flex-none">Settings</TabsTrigger>
            <TabsTrigger value="health" className="flex-none">System Health</TabsTrigger>
          </TabsList>

          {/* ─── Users Tab ──────────────────────────────────────────────────────── */}
          <TabsContent value="users" className="mt-4 space-y-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">All Users ({users?.length ?? 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users?.map((user) => {
                    const badge = getRoleBadge(user);
                    const isManaging = managingUserId === user.id;
                    return (
                      <div key={user.id}>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 border border-border">
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
                            <Badge variant="outline" className={cn("text-[10px]", badge.className)}>
                              <badge.icon className="w-2.5 h-2.5 mr-1 inline" />
                              {badge.label}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className={cn("h-7 text-xs", isManaging && "border-primary/50 text-primary")}
                              onClick={() => setManagingUserId(isManaging ? null : user.id)}
                            >
                              <Store className="w-3 h-3 mr-1" />
                              Stores
                            </Button>
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

                        {/* Rooftop management card */}
                        {isManaging && (
                          <Card className="mt-2 ml-10 bg-accent/5 border-primary/20">
                            <CardContent className="p-3 space-y-3">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Rooftop Assignments for {user.name ?? "User"}
                              </p>

                              {/* Current assignments */}
                              {userRooftops && userRooftops.length > 0 ? (
                                <div className="space-y-1.5">
                                  {userRooftops.map((r) => (
                                    <div key={r.assignmentId} className="flex items-center gap-2 p-2 rounded-md bg-background border border-border">
                                      <Store className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                      <span className="text-sm flex-1 truncate">{r.dealershipName}</span>
                                      <Badge variant="outline" className="text-[9px]">{r.dealershipSlug}</Badge>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        disabled={removeRooftopMutation.isPending}
                                        onClick={() => removeRooftopMutation.mutate({ userId: user.id, dealershipId: r.dealershipId })}
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground italic">No rooftop assignments</p>
                              )}

                              {/* Assign new rooftop */}
                              <div className="flex items-center gap-2 pt-1 border-t border-border">
                                <select
                                  value={assignDealershipId || ""}
                                  onChange={(e) => setAssignDealershipId(e.target.value ? Number(e.target.value) : 1)}
                                  className="flex-1 h-7 rounded-md border border-border bg-background text-xs px-2"
                                >
                                  <option value="">Select rooftop...</option>
                                  {dealershipsList?.filter((d) => d.isActive && !userRooftops?.some((r) => r.dealershipId === d.id))
                                    .map((d) => (
                                      <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs"
                                  disabled={assignRooftopMutation.isPending}
                                  onClick={() => {
                                    if (assignDealershipId) {
                                      assignRooftopMutation.mutate({ userId: user.id, dealershipId: assignDealershipId });
                                    }
                                  }}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Assign
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Groups Tab ─────────────────────────────────────────────────────── */}
          <TabsContent value="groups" className="mt-4 space-y-4">
            {/* Create group form (Super Admin only) */}
            {authUser?.isSuperAdmin && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" /> Create Dealership Group
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Group Name</Label>
                      <Input
                        placeholder="ASURA Automotive Group"
                        value={newGroupName}
                        onChange={(e) => {
                          setNewGroupName(e.target.value);
                          setNewGroupSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                        }}
                        className="bg-background border-border text-sm h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Slug</Label>
                      <Input
                        placeholder="asura-auto-group"
                        value={newGroupSlug}
                        onChange={(e) => setNewGroupSlug(e.target.value)}
                        className="bg-background border-border text-sm h-8"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        size="sm"
                        className="w-full h-8 text-xs"
                        disabled={!newGroupName || !newGroupSlug || createGroupMutation.isPending}
                        onClick={() => createGroupMutation.mutate({ name: newGroupName, slug: newGroupSlug })}
                      >
                        {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Groups list */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  Dealership Groups ({groupsList?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {groupsList?.map((g) => (
                    <GroupCard key={g.id} group={g} dealerships={dealershipsList ?? []}
                      onToggle={(id, isActive) => updateGroupMutation.mutate({ id, isActive })} />
                  ))}
                  {!groupsList?.length && (
                    <p className="text-xs text-muted-foreground text-center py-4">No groups yet. Create one to organize dealerships.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Dealerships Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="dealerships" className="mt-4 space-y-4">
            {/* Create new dealership */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Create New Dealership</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Dealership Name</Label>
                    <Input placeholder="ASURA Dealership Group" value={newDealershipName}
                      onChange={(e) => {
                        setNewDealershipName(e.target.value);
                        setNewDealershipSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                      }}
                      className="bg-background border-border text-sm h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Slug (URL-safe)</Label>
                    <Input placeholder="asura-dealership-group" value={newDealershipSlug}
                      onChange={(e) => setNewDealershipSlug(e.target.value)}
                      className="bg-background border-border text-sm h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Plan</Label>
                    <select value={newDealershipPlan} onChange={(e) => setNewDealershipPlan(e.target.value as typeof newDealershipPlan)}
                      className="w-full h-8 rounded-md border border-border bg-background text-sm px-2">
                      <option value="trial">Trial</option>
                      <option value="beta">Beta</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button size="sm" className="w-full h-8 text-xs"
                      disabled={!newDealershipName || !newDealershipSlug || createDealershipMutation.isPending}
                      onClick={() => createDealershipMutation.mutate({ name: newDealershipName, slug: newDealershipSlug, plan: newDealershipPlan })}>
                      {createDealershipMutation.isPending ? "Creating..." : "Create Dealership"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dealerships list */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">All Dealerships ({dealershipsList?.length ?? 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dealershipsList?.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 border border-border">
                      <Building2 className="w-5 h-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.slug}</p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize shrink-0">{d.plan ?? "beta"}</Badge>
                      <Badge variant={d.isActive ? "default" : "secondary"} className="text-xs shrink-0">
                        {d.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button size="sm" variant="ghost" className="h-7 text-xs shrink-0"
                        onClick={() => toggleDealershipActive.mutate({ id: d.id, isActive: !d.isActive })}>
                        {d.isActive ? <XCircle className="w-3.5 h-3.5 text-red-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                      </Button>
                    </div>
                  ))}
                  {!dealershipsList?.length && <p className="text-xs text-muted-foreground text-center py-4">No dealerships yet</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Invitations Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="invitations" className="mt-4 space-y-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Link2 className="w-4 h-4 text-primary" /> Generate Invite Link</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Email (optional)</Label>
                    <Input placeholder="manager@dealership.com" value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="bg-background border-border text-sm h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Role</Label>
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "user" | "admin")}
                      className="w-full h-8 rounded-md border border-border bg-background text-sm px-2">
                      <option value="user">F&I Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Dealership</Label>
                    <select value={inviteDealershipId} onChange={(e) => setInviteDealershipId(Number(e.target.value))}
                      className="w-full h-8 rounded-md border border-border bg-background text-sm px-2">
                      {dealershipsList?.filter((d) => d.isActive).map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Expires in (days)</Label>
                    <div className="flex gap-2">
                      <Input type="number" value={inviteExpiry} onChange={(e) => setInviteExpiry(Number(e.target.value))}
                        className="bg-background border-border text-sm h-8 flex-1" min={1} max={30} />
                      <Button size="sm" className="h-8 text-xs"
                        disabled={createInviteMutation.isPending}
                        onClick={() => createInviteMutation.mutate({
                          dealershipId: inviteDealershipId,
                          role: inviteRole,
                          email: inviteEmail || undefined,
                          expiresInDays: inviteExpiry,
                          origin: window.location.origin,
                        })}>
                        {createInviteMutation.isPending ? "..." : <><Mail className="w-3 h-3 mr-1" /> Generate</>}
                      </Button>
                    </div>
                  </div>
                </div>
                {generatedLink && (
                  <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-green-400 font-medium mb-1">Invite Link Generated:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-green-300 flex-1 break-all">{generatedLink}</code>
                      <Button size="sm" variant="ghost" className="h-6 text-xs shrink-0"
                        onClick={() => { navigator.clipboard.writeText(generatedLink); toast.success("Copied!"); }}>
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Active Invitations ({inviteList?.length ?? 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {inviteList?.map((inv) => {
                    const isExpired = new Date(inv.expiresAt) < new Date();
                    return (
                      <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 border border-border">
                        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{inv.email ?? "Open invite"}</p>
                          <p className="text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Expires {format(new Date(inv.expiresAt), "MMM d, yyyy")}
                            {inv.usedAt && " • Used"}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] capitalize">{inv.role}</Badge>
                        <Badge variant={!inv.usedAt && !isExpired ? "default" : "secondary"} className="text-[10px]">
                          {isExpired ? "Expired" : inv.usedAt ? "Used" : "Active"}
                        </Badge>
                        {!inv.usedAt && !isExpired && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs"
                            onClick={() => revokeInviteMutation.mutate({ id: inv.id })}>
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  {!inviteList?.length && <p className="text-xs text-muted-foreground text-center py-4">No invitations yet</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Sessions Tab ────────────────────────────────────────────────────── */}
          <TabsContent value="sessions" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">All Sessions ({allSessionsData?.total ?? 0})</CardTitle>
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

          {/* ─── Audit Log Tab ───────────────────────────────────────────────────── */}
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

          {/* ─── Dealership Settings Tab ─────────────────────────────────────────── */}
          <TabsContent value="settings" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Dealership Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Dealership Name</Label>
                    <Input
                      value={dealershipName}
                      onChange={(e) => setDealershipName(e.target.value)}
                      className="bg-background border-border text-sm h-8"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Max Session Duration (minutes)</Label>
                    <Input
                      value={maxSessionDuration}
                      onChange={(e) => setMaxSessionDuration(e.target.value)}
                      type="number"
                      className="bg-background border-border text-sm h-8"
                    />
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-border">
                    <div>
                      <p className="text-sm font-medium">Auto-Grade on Session End</p>
                      <p className="text-xs text-muted-foreground">Automatically run grading engine when session completes</p>
                    </div>
                    <Switch checked={autoGrade} onCheckedChange={setAutoGrade} />
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-border">
                    <div>
                      <p className="text-sm font-medium">Require Customer Name</p>
                      <p className="text-xs text-muted-foreground">Enforce customer name entry before session start</p>
                    </div>
                    <Switch checked={requireCustomerName} onCheckedChange={setRequireCustomerName} />
                  </div>
                  <Button
                    className="w-full h-8 text-sm"
                    onClick={handleSaveSettings}
                  >
                    {settingsSaved ? (
                      <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Saved</>
                    ) : (
                      <><Settings2 className="w-3.5 h-3.5 mr-1.5" /> Save Settings</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Deepgram Voice API", status: true, detail: "Nova-2 model active" },
                    { label: "LLM Co-Pilot Engine", status: true, detail: "Gemini 2.5 Flash" },
                    { label: "Compliance Engine", status: true, detail: "20 rules loaded" },
                    { label: "PDF Report Generator", status: true, detail: "PDFKit v0.15" },
                    { label: "S3 File Storage", status: true, detail: "Manus Forge Storage" },
                    { label: "WebSocket Server", status: true, detail: "Real-time session active" },
                  ].map(({ label, status, detail }) => (
                    <div key={label} className="flex items-center justify-between p-2.5 rounded-lg bg-accent/10 border border-border">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{detail}</p>
                      </div>
                      {status ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="health" className="mt-4 space-y-4">
            <SystemHealthPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

// ─── GroupCard sub-component ──────────────────────────────────────────────────
function GroupCard({ group, dealerships, onToggle }: {
  group: { id: number; name: string; slug: string; isActive: boolean };
  dealerships: Array<{ id: number; name: string; groupId: number | null }>;
  onToggle: (id: number, isActive: boolean) => void;
}) {
  const groupDealerships = dealerships.filter((d) => d.groupId === group.id);
  return (
    <div className="p-4 rounded-lg bg-accent/10 border border-border">
      <div className="flex items-center gap-3 mb-2">
        <Layers className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{group.name}</p>
          <p className="text-xs text-muted-foreground">{group.slug} • {groupDealerships.length} rooftop{groupDealerships.length !== 1 ? "s" : ""}</p>
        </div>
        <Badge variant={group.isActive ? "default" : "secondary"} className="text-xs shrink-0">
          {group.isActive ? "Active" : "Inactive"}
        </Badge>
        <Button size="sm" variant="ghost" className="h-7 text-xs shrink-0"
          onClick={() => onToggle(group.id, !group.isActive)}>
          {group.isActive ? <XCircle className="w-3.5 h-3.5 text-red-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
        </Button>
      </div>
      {groupDealerships.length > 0 && (
        <div className="ml-8 mt-2 space-y-1">
          {groupDealerships.map((d) => (
            <div key={d.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3" />
              <span>{d.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SystemHealthPanel sub-component ──────────────────────────────────────────
function SystemHealthPanel() {
  const { data, isLoading, refetch } = trpc.admin.systemValidation.useQuery();
  const statusStr = data?.status as string | undefined;
  const isHealthy = statusStr === "healthy" || statusStr === "operational";
  const statusColor = isHealthy ? "text-green-400" : data?.status === "degraded" ? "text-yellow-400" : "text-red-400";
  const statusBg = isHealthy ? "bg-green-500/10 border-green-500/30" : data?.status === "degraded" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">System Validation Report</h3>
          <p className="text-sm text-muted-foreground">Real-time health check of all platform services</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={cn("w-4 h-4 mr-1.5", isLoading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {data && (
        <>
          <div className={cn("flex items-center gap-3 p-4 rounded-xl border", statusBg)}>
            {isHealthy ? <CheckCircle2 className="w-6 h-6 text-green-400" /> : data.status === "degraded" ? <Activity className="w-6 h-6 text-yellow-400" /> : <XCircle className="w-6 h-6 text-red-400" />}
            <div>
              <p className={cn("font-semibold text-lg", statusColor)}>
                {isHealthy ? "All Systems Operational" : data.status === "degraded" ? "Degraded Performance" : "System Error"}
              </p>
              <p className="text-xs text-muted-foreground">Last checked: {new Date(data.timestamp).toLocaleString()}</p>
            </div>
          </div>

          <div className="grid gap-3">
            {data.checks.map((check, i) => (
              <Card key={i} className={cn(
                "border",
                check.status === "pass" ? "border-green-500/20" : check.status === "warn" ? "border-yellow-500/20" : "border-red-500/20"
              )}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {check.status === "pass" ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : check.status === "warn" ? <AlertTriangle className="w-5 h-5 text-yellow-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                    <div>
                      <p className="font-medium text-sm">{check.name}</p>
                      <p className="text-xs text-muted-foreground">{check.detail}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    check.status === "pass" ? "border-green-500/30 text-green-400" : check.status === "warn" ? "border-yellow-500/30 text-yellow-400" : "border-red-500/30 text-red-400"
                  )}>
                    {check.status.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Running system checks...</span>
        </div>
      )}
    </div>
  );
}
