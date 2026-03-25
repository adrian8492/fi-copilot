import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft, Phone, Mail, MapPin, FileText, Mic, Edit2, Save, X, Loader2,
} from "lucide-react";

export default function CustomerDetail() {
  useEffect(() => { document.title = "Customer Detail | F&I Co-Pilot by ASURA Group"; }, []);
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const customerId = parseInt(id ?? "0");

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", address: "", notes: "",
  });

  const { data, isLoading, refetch } = trpc.customers.get.useQuery(
    { id: customerId },
    { enabled: !!customerId }
  );

  // Sync form when data first loads
  useEffect(() => {
    if (data?.customer) {
      const c = data.customer;
      setForm({
        firstName: c.firstName ?? "",
        lastName: c.lastName ?? "",
        email: c.email ?? "",
        phone: c.phone ?? "",
        address: c.address ?? "",
        notes: c.notes ?? "",
      });
    }
  }, [data?.customer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateMutation = trpc.customers.update.useMutation({
    onSuccess: () => {
      toast.success("Customer updated");
      setEditing(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("First and last name are required");
      return;
    }
    updateMutation.mutate({
      id: customerId,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    });
  };

  const handleCancelEdit = () => {
    if (data?.customer) {
      const c = data.customer;
      setForm({
        firstName: c.firstName ?? "",
        lastName: c.lastName ?? "",
        email: c.email ?? "",
        phone: c.phone ?? "",
        address: c.address ?? "",
        notes: c.notes ?? "",
      });
    }
    setEditing(false);
  };

  if (isLoading) {
    return (
      <AppLayout title="Customer" subtitle="">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!data?.customer) {
    return (
      <AppLayout title="Customer Not Found" subtitle="">
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Customer not found.</p>
          <Button className="mt-4" onClick={() => navigate("/customers")}>Back to Customers</Button>
        </div>
      </AppLayout>
    );
  }

  const cust = data.customer;
  const sessions = data.sessions;
  const fullName = `${cust.firstName} ${cust.lastName}`;

  return (
    <AppLayout title={fullName} subtitle={`Customer since ${format(new Date(cust.createdAt), "MMMM d, yyyy")}`}>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Back + Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => navigate("/customers")}>
            <ArrowLeft className="w-4 h-4" />
            Customers
          </Button>
          {!editing ? (
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setEditing(true)}>
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-2" onClick={handleCancelEdit}>
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button size="sm" className="gap-2" onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </Button>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Customer Info Card */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {(cust.firstName ?? "?").charAt(0).toUpperCase()}
                      {(cust.lastName ?? "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-base">{fullName}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">First Name *</Label>
                        <Input
                          value={form.firstName}
                          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                          className="bg-background border-border h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Last Name *</Label>
                        <Input
                          value={form.lastName}
                          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                          className="bg-background border-border h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        className="bg-background border-border h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Phone</Label>
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        className="bg-background border-border h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Address</Label>
                      <Input
                        value={form.address}
                        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                        className="bg-background border-border h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Notes</Label>
                      <Textarea
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        className="bg-background border-border resize-none text-sm"
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cust.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-foreground truncate">{cust.email}</span>
                      </div>
                    )}
                    {cust.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-foreground">{cust.phone}</span>
                      </div>
                    )}
                    {cust.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-foreground">{cust.address}</span>
                      </div>
                    )}
                    {cust.notes && (
                      <div className="flex items-start gap-2 text-sm">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{cust.notes}</span>
                      </div>
                    )}
                    {!cust.email && !cust.phone && !cust.address && !cust.notes && (
                      <p className="text-xs text-muted-foreground italic">No contact details on file.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sessions History */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    Session History ({sessions.length})
                  </CardTitle>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => navigate("/session/new")}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    New Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {sessions.length === 0 ? (
                  <div className="text-center py-10">
                    <Mic className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                    <p className="text-sm text-muted-foreground">No sessions with this customer yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 cursor-pointer transition-colors"
                        onClick={() => navigate(`/session/${session.id}`)}
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          session.status === "active" ? "bg-green-400 animate-pulse" :
                          session.status === "completed" ? "bg-blue-400" : "bg-muted-foreground"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {session.dealType?.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Session"} #{session.id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(session.startedAt), "MMM d, yyyy h:mm a")} •{" "}
                            {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
                          </p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${
                          session.status === "active" ? "border-green-500/30 text-green-400" :
                          session.status === "completed" ? "border-blue-500/30 text-blue-400" :
                          "border-border text-muted-foreground"
                        }`}>
                          {session.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
