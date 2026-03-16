import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { format } from "date-fns";
import {
  Users, Plus, Search, Download, Phone, Mail, MapPin, ChevronRight,
  UserCircle2, Loader2,
} from "lucide-react";

export default function Customers() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", address: "", notes: "",
  });

  const PAGE_SIZE = 50;

  const { data: customersData, isLoading, refetch } = trpc.customers.list.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });
  const customers = customersData?.rows ?? [];
  const total = customersData?.total ?? 0;

  const { data: searchResults, isLoading: isSearching } = trpc.customers.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );

  const displayList = searchQuery.length >= 2 ? (searchResults ?? []) : customers;

  const createMutation = trpc.customers.create.useMutation({
    onSuccess: () => {
      toast.success("Customer created");
      setCreateOpen(false);
      setForm({ firstName: "", lastName: "", email: "", phone: "", address: "", notes: "" });
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const { refetch: fetchCsv } = trpc.customers.exportCsv.useQuery(undefined, {
    enabled: false,
  });

  const handleExportCsv = async () => {
    const result = await fetchCsv();
    if (!result.data) return;
    const blob = new Blob([result.data.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${result.data.count} customers`);
  };

  const handleCreate = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("First and last name are required");
      return;
    }
    createMutation.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    });
  };

  return (
    <AppLayout title="Customers" subtitle="Manage your customer database">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>First Name *</Label>
                      <Input
                        placeholder="John"
                        value={form.firstName}
                        onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Last Name *</Label>
                      <Input
                        placeholder="Smith"
                        value={form.lastName}
                        onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input
                      placeholder="(555) 000-0000"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Address</Label>
                    <Input
                      placeholder="123 Main St, City, State"
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Any notes about this customer..."
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      className="bg-background border-border resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleCreate}
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Create Customer
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{total}</p>
                  <p className="text-xs text-muted-foreground">Total Customers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <UserCircle2 className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{displayList.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {searchQuery.length >= 2 ? "Search Results" : "This Page"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer List */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              {searchQuery.length >= 2 ? `Search results for "${searchQuery}"` : "All Customers"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : displayList.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery.length >= 2 ? "No customers match your search" : "No customers yet"}
                </p>
                {searchQuery.length < 2 && (
                  <Button size="sm" className="mt-3" onClick={() => setCreateOpen(true)}>
                    Add your first customer
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {displayList.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {(customer.firstName ?? "?").charAt(0).toUpperCase()}
                        {(customer.lastName ?? "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {customer.firstName} {customer.lastName}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {customer.email && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[140px]">{customer.email}</span>
                          </span>
                        )}
                        {customer.phone && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {customer.address && (
                        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground hidden sm:flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          Has address
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {format(new Date(customer.createdAt), "MMM d, yyyy")}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {searchQuery.length < 2 && total > PAGE_SIZE && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(page + 1) * PAGE_SIZE >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
