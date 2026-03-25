import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Shield, AlertTriangle, Info, CheckCircle2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Category = "federal_tila" | "federal_ecoa" | "federal_udap" | "federal_cla" | "contract_element" | "fi_product_disclosure" | "process_step" | "custom";
type Severity = "critical" | "warning" | "info";

const CATEGORY_LABELS: Record<Category, string> = {
  federal_tila: "Federal — TILA",
  federal_ecoa: "Federal — ECOA",
  federal_udap: "Federal — UDAP",
  federal_cla: "Federal — CLA",
  contract_element: "Contract Element",
  fi_product_disclosure: "F&I Product Disclosure",
  process_step: "Process Step",
  custom: "Custom",
};

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; icon: React.ElementType }> = {
  critical: { label: "Critical", color: "text-red-400 border-red-400/30 bg-red-400/10", icon: AlertTriangle },
  warning: { label: "Warning", color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10", icon: Shield },
  info: { label: "Info", color: "text-blue-400 border-blue-400/30 bg-blue-400/10", icon: Info },
};

interface RuleFormData {
  title: string;
  description: string;
  category: Category;
  triggerKeywords: string;
  requiredPhrase: string;
  severity: Severity;
  weight: string;
  isActive: boolean;
  dealStage: string;
}

const DEFAULT_FORM: RuleFormData = {
  title: "",
  description: "",
  category: "custom",
  triggerKeywords: "",
  requiredPhrase: "",
  severity: "warning",
  weight: "1.0",
  isActive: true,
  dealStage: "",
};

export default function ComplianceRules() {
  useEffect(() => { document.title = "Compliance Rules | F&I Co-Pilot by ASURA Group"; }, []);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<Severity | "all">("all");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RuleFormData>(DEFAULT_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data: rules = [], refetch } = trpc.compliance.getRules.useQuery();

  const createRule = trpc.compliance.createRule.useMutation({
    onSuccess: () => { toast.success("Rule created"); refetch(); setDialogOpen(false); setForm(DEFAULT_FORM); },
    onError: (e) => toast.error(e.message),
  });

  const updateRule = trpc.compliance.updateRule.useMutation({
    onSuccess: () => { toast.success("Rule updated"); refetch(); setDialogOpen(false); setEditingId(null); setForm(DEFAULT_FORM); },
    onError: (e) => toast.error(e.message),
  });

  const deleteRule = trpc.compliance.deleteRule.useMutation({
    onSuccess: () => { toast.success("Rule deleted"); refetch(); setDeleteConfirm(null); },
    onError: (e) => toast.error(e.message),
  });

  const toggleActive = trpc.compliance.updateRule.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setDialogOpen(true);
  };

  const openEdit = (rule: typeof rules[0]) => {
    setEditingId(rule.id);
    setForm({
      title: rule.title,
      description: rule.description ?? "",
      category: rule.category,
      triggerKeywords: (rule.triggerKeywords as string[] ?? []).join(", "),
      requiredPhrase: rule.requiredPhrase ?? "",
      severity: rule.severity,
      weight: String(rule.weight ?? 1.0),
      isActive: rule.isActive,
      dealStage: rule.dealStage ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const keywords = form.triggerKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      triggerKeywords: keywords,
      requiredPhrase: form.requiredPhrase.trim() || undefined,
      severity: form.severity,
      weight: parseFloat(form.weight) || 1.0,
      isActive: form.isActive,
      dealStage: form.dealStage.trim() || undefined,
    };

    if (!payload.title) { toast.error("Title is required"); return; }

    if (editingId !== null) {
      updateRule.mutate({ id: editingId, ...payload });
    } else {
      createRule.mutate(payload);
    }
  };

  const filtered = rules.filter((r) => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = filterSeverity === "all" || r.severity === filterSeverity;
    const matchCategory = filterCategory === "all" || r.category === filterCategory;
    return matchSearch && matchSeverity && matchCategory;
  });

  const criticalCount = rules.filter((r) => r.severity === "critical" && r.isActive).length;
  const warningCount = rules.filter((r) => r.severity === "warning" && r.isActive).length;
  const activeCount = rules.filter((r) => r.isActive).length;

  return (
    <AppLayout title="Compliance Rules Builder" subtitle="Define and manage compliance detection rules for live sessions">
      <div className="p-6 space-y-6">

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Rules", value: rules.length, color: "text-foreground" },
            { label: "Active Rules", value: activeCount, color: "text-green-400" },
            { label: "Critical Rules", value: criticalCount, color: "text-red-400" },
            { label: "Warning Rules", value: warningCount, color: "text-yellow-400" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={cn("text-2xl font-bold mt-1", stat.color)}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search rules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <Select value={filterSeverity} onValueChange={(v) => setFilterSeverity(v as Severity | "all")}>
            <SelectTrigger className="w-40 bg-card border-border"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as Category | "all")}>
            <SelectTrigger className="w-48 bg-card border-border"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openCreate} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> New Rule
          </Button>
        </div>

        {/* Rules Table */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {filtered.length} rule{filtered.length !== 1 ? "s" : ""}
              {(search || filterSeverity !== "all" || filterCategory !== "all") ? " (filtered)" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground text-sm">No rules found.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>Create your first rule</Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((rule) => {
                  const sev = SEVERITY_CONFIG[rule.severity];
                  const SevIcon = sev.icon;
                  const keywords = rule.triggerKeywords as string[] ?? [];
                  return (
                    <div key={rule.id} className={cn("p-4 flex items-start gap-4 transition-colors hover:bg-accent/20", !rule.isActive && "opacity-50")}>
                      <div className="mt-0.5">
                        <SevIcon className={cn("w-4 h-4", sev.color.split(" ")[0])} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{rule.title}</span>
                          <Badge variant="outline" className={cn("text-xs", sev.color)}>{sev.label}</Badge>
                          <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                            {CATEGORY_LABELS[rule.category]}
                          </Badge>
                          {!rule.isActive && (
                            <Badge variant="outline" className="text-xs text-muted-foreground border-border">Inactive</Badge>
                          )}
                        </div>
                        {rule.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rule.description}</p>
                        )}
                        {keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {keywords.slice(0, 6).map((kw) => (
                              <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-accent/40 text-muted-foreground font-mono">{kw}</span>
                            ))}
                            {keywords.length > 6 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/40 text-muted-foreground">+{keywords.length - 6} more</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={(checked) => toggleActive.mutate({ id: rule.id, isActive: checked })}
                          className="scale-90"
                        />
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(rule)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-red-400" onClick={() => setDeleteConfirm(rule.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditingId(null); setForm(DEFAULT_FORM); } }}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId !== null ? "Edit Compliance Rule" : "Create Compliance Rule"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title <span className="text-red-400">*</span></Label>
              <Input
                placeholder="e.g. TILA Base Payment Disclosure"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe what this rule checks for..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-background border-border resize-none"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v as Severity })}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Trigger Keywords <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
              <Input
                placeholder="e.g. monthly payment, base payment, how much per month"
                value={form.triggerKeywords}
                onChange={(e) => setForm({ ...form, triggerKeywords: e.target.value })}
                className="bg-background border-border"
              />
              <p className="text-xs text-muted-foreground">These keywords trigger the rule when detected in the transcript.</p>
            </div>
            <div className="space-y-2">
              <Label>Required Phrase <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                placeholder="e.g. Your base payment without any products is..."
                value={form.requiredPhrase}
                onChange={(e) => setForm({ ...form, requiredPhrase: e.target.value })}
                className="bg-background border-border"
              />
              <p className="text-xs text-muted-foreground">The phrase that must be said when the trigger is detected.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Weight <span className="text-muted-foreground text-xs">(0.1 – 5.0)</span></Label>
                <Input
                  type="number"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Deal Stage <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  placeholder="e.g. menu_presentation"
                  value={form.dealStage}
                  onChange={(e) => setForm({ ...form, dealStage: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border border-border">
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <div>
                <p className="text-sm font-medium text-foreground">Active</p>
                <p className="text-xs text-muted-foreground">Inactive rules are not evaluated during live sessions.</p>
              </div>
              {form.isActive && <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingId(null); setForm(DEFAULT_FORM); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createRule.isPending || updateRule.isPending}
            >
              {createRule.isPending || updateRule.isPending ? "Saving..." : editingId !== null ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle>Delete Rule</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete the compliance rule. This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm !== null && deleteRule.mutate({ id: deleteConfirm })}
              disabled={deleteRule.isPending}
            >
              {deleteRule.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
