import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Package, Plus, Edit2, Trash2, DollarSign, Clock, Gauge, Loader2, ChevronUp, ChevronDown,
} from "lucide-react";

const PRODUCT_TYPES = [
  { value: "vehicle_service_contract", label: "Vehicle Service Contract (VSC)" },
  { value: "gap_insurance", label: "GAP Insurance" },
  { value: "prepaid_maintenance", label: "Prepaid Maintenance" },
  { value: "interior_exterior_protection", label: "Interior/Exterior Protection" },
  { value: "road_hazard", label: "Road Hazard" },
  { value: "paintless_dent_repair", label: "Paintless Dent Repair (PDR)" },
  { value: "key_replacement", label: "Key Replacement" },
  { value: "windshield_protection", label: "Windshield Protection" },
  { value: "lease_wear_tear", label: "Lease Wear & Tear" },
  { value: "tire_wheel", label: "Tire & Wheel Protection" },
  { value: "theft_protection", label: "Theft Protection" },
  { value: "other", label: "Other" },
] as const;

type ProductType = (typeof PRODUCT_TYPES)[number]["value"];

const PRODUCT_TYPE_COLORS: Record<string, string> = {
  vehicle_service_contract: "border-blue-500/30 text-blue-400",
  gap_insurance: "border-purple-500/30 text-purple-400",
  prepaid_maintenance: "border-green-500/30 text-green-400",
  interior_exterior_protection: "border-orange-500/30 text-orange-400",
  road_hazard: "border-yellow-500/30 text-yellow-400",
  paintless_dent_repair: "border-pink-500/30 text-pink-400",
  key_replacement: "border-cyan-500/30 text-cyan-400",
  windshield_protection: "border-teal-500/30 text-teal-400",
  lease_wear_tear: "border-indigo-500/30 text-indigo-400",
  tire_wheel: "border-red-500/30 text-red-400",
  theft_protection: "border-rose-500/30 text-rose-400",
  other: "border-border text-muted-foreground",
};

const emptyForm = {
  id: undefined as number | undefined,
  productType: "vehicle_service_contract" as ProductType,
  displayName: "",
  providerName: "",
  description: "",
  costToDealer: "",
  retailPrice: "",
  termMonths: "",
  maxMileage: "",
  isActive: true,
  sortOrder: "0",
};

export default function ProductMenu() {
  useEffect(() => { document.title = "Product Menu | F&I Co-Pilot by ASURA Group"; }, []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: products, isLoading, refetch } = trpc.productMenu.list.useQuery();

  const upsertMutation = trpc.productMenu.upsert.useMutation({
    onSuccess: () => {
      toast.success(form.id ? "Product updated" : "Product added");
      setDialogOpen(false);
      setForm({ ...emptyForm });
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.productMenu.delete.useMutation({
    onSuccess: () => {
      toast.success("Product removed");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleActiveMutation = trpc.productMenu.upsert.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (product: NonNullable<typeof products>[number]) => {
    setForm({
      id: product.id,
      productType: product.productType as ProductType,
      displayName: product.displayName,
      providerName: product.providerName ?? "",
      description: product.description ?? "",
      costToDealer: product.costToDealer != null ? String(product.costToDealer) : "",
      retailPrice: product.retailPrice != null ? String(product.retailPrice) : "",
      termMonths: product.termMonths != null ? String(product.termMonths) : "",
      maxMileage: product.maxMileage != null ? String(product.maxMileage) : "",
      isActive: product.isActive,
      sortOrder: String(product.sortOrder),
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.displayName.trim()) {
      toast.error("Display name is required");
      return;
    }
    upsertMutation.mutate({
      id: form.id,
      productType: form.productType,
      displayName: form.displayName.trim(),
      providerName: form.providerName.trim() || null,
      description: form.description.trim() || null,
      costToDealer: form.costToDealer ? parseFloat(form.costToDealer) : null,
      retailPrice: form.retailPrice ? parseFloat(form.retailPrice) : null,
      termMonths: form.termMonths ? parseInt(form.termMonths) : null,
      maxMileage: form.maxMileage ? parseInt(form.maxMileage) : null,
      isActive: form.isActive,
      sortOrder: parseInt(form.sortOrder) || 0,
    });
  };

  const handleToggleActive = (product: NonNullable<typeof products>[number]) => {
    toggleActiveMutation.mutate({
      id: product.id,
      productType: product.productType as ProductType,
      displayName: product.displayName,
      isActive: !product.isActive,
      sortOrder: product.sortOrder,
    });
  };

  const activeCount = products?.filter((p) => p.isActive).length ?? 0;
  const totalCount = products?.length ?? 0;

  return (
    <AppLayout title="Product Menu" subtitle="Manage your F&I product offerings">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{activeCount} active products</p>
              <p className="text-xs text-muted-foreground">{totalCount} total in menu</p>
            </div>
          </div>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>

        {/* Product List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !products || products.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-16 text-center">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground mb-4">No products in your menu yet</p>
              <Button size="sm" onClick={openCreate}>Add your first product</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {products.map((product) => {
              const typeLabel = PRODUCT_TYPES.find((t) => t.value === product.productType)?.label ?? product.productType;
              const colorClass = PRODUCT_TYPE_COLORS[product.productType] ?? "border-border text-muted-foreground";
              const margin = product.costToDealer != null && product.retailPrice != null
                ? product.retailPrice - product.costToDealer
                : null;

              return (
                <Card
                  key={product.id}
                  className={cn("bg-card border-border transition-opacity", !product.isActive && "opacity-50")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-foreground">{product.displayName}</h3>
                          <Badge variant="outline" className={cn("text-[10px]", colorClass)}>
                            {typeLabel}
                          </Badge>
                          {!product.isActive && (
                            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        {product.providerName && (
                          <p className="text-xs text-muted-foreground mt-0.5">{product.providerName}</p>
                        )}
                        {product.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          {product.retailPrice != null && (
                            <span className="flex items-center gap-1 text-xs text-foreground">
                              <DollarSign className="w-3 h-3 text-green-400" />
                              <span className="font-medium text-green-400">${product.retailPrice.toLocaleString()}</span>
                              {margin != null && (
                                <span className="text-muted-foreground ml-1">(${margin.toLocaleString()} margin)</span>
                              )}
                            </span>
                          )}
                          {product.termMonths != null && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {product.termMonths} mo
                            </span>
                          )}
                          {product.maxMileage != null && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Gauge className="w-3 h-3" />
                              {product.maxMileage.toLocaleString()} mi
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={product.isActive}
                          onCheckedChange={() => handleToggleActive(product)}
                          className="scale-75"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => openEdit(product)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Remove "${product.displayName}" from the menu?`)) {
                              deleteMutation.mutate({ id: product.id });
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Product Type *</Label>
              <Select
                value={form.productType}
                onValueChange={(v) => setForm((f) => ({ ...f, productType: v as ProductType }))}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Display Name *</Label>
              <Input
                placeholder="e.g. Platinum VSC — 48 mo / 60k"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Provider / Underwriter</Label>
              <Input
                placeholder="e.g. Protective Asset Protection"
                value={form.providerName}
                onChange={(e) => setForm((f) => ({ ...f, providerName: e.target.value }))}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of coverage..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="bg-background border-border resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cost to Dealer ($)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.costToDealer}
                  onChange={(e) => setForm((f) => ({ ...f, costToDealer: e.target.value }))}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Retail Price ($)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.retailPrice}
                  onChange={(e) => setForm((f) => ({ ...f, retailPrice: e.target.value }))}
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Term (months)</Label>
                <Input
                  type="number"
                  placeholder="48"
                  value={form.termMonths}
                  onChange={(e) => setForm((f) => ({ ...f, termMonths: e.target.value }))}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max Mileage</Label>
                <Input
                  type="number"
                  placeholder="60000"
                  value={form.maxMileage}
                  onChange={(e) => setForm((f) => ({ ...f, maxMileage: e.target.value }))}
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Active</Label>
                <div className="flex items-center h-10">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                  />
                  <span className="ml-2 text-sm text-muted-foreground">{form.isActive ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {form.id ? "Save Changes" : "Add Product"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
