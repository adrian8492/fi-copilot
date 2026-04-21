import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  Send,
  ClipboardCheck,
  ShieldCheck,
  ListChecks,
  Timer,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────
interface ChecklistItem {
  id: string;
  section: string;
  name: string;
  required: boolean;
  status: "complete" | "pending" | "missing";
  notes: string;
}

interface Deal {
  id: number;
  customer: string;
  date: string;
  lender: string;
  vehicle: string;
  items: ChecklistItem[];
}

// ── Sections ─────────────────────────────────────────────────────────
const SECTIONS = [
  "Identification Docs",
  "Credit Documents",
  "F&I Product Contracts",
  "Rate/Markup Disclosures",
  "Signature Completeness",
  "Lender Stipulations",
];

// ── Checklist templates per section ──────────────────────────────────
const SECTION_ITEMS: Record<string, { name: string; required: boolean }[]> = {
  "Identification Docs": [
    { name: "Driver's License (front & back)", required: true },
    { name: "Proof of Residence", required: true },
    { name: "Proof of Insurance", required: true },
    { name: "Social Security Verification", required: false },
  ],
  "Credit Documents": [
    { name: "Signed Credit Application", required: true },
    { name: "Credit Bureau Report", required: true },
    { name: "OFAC Check", required: true },
    { name: "Red Flags / ID Theft Check", required: false },
  ],
  "F&I Product Contracts": [
    { name: "VSC / Extended Warranty Contract", required: false },
    { name: "GAP Waiver Agreement", required: false },
    { name: "Tire & Wheel Contract", required: false },
    { name: "Paint Protection Contract", required: false },
  ],
  "Rate/Markup Disclosures": [
    { name: "Buy Rate Documentation", required: true },
    { name: "APR Disclosure to Customer", required: true },
    { name: "Truth-in-Lending (TILA) Disclosure", required: true },
  ],
  "Signature Completeness": [
    { name: "Retail Installment Contract Signatures", required: true },
    { name: "Buyer's Order Signatures", required: true },
    { name: "Co-Buyer Signatures (if applicable)", required: false },
    { name: "Power of Attorney (if applicable)", required: false },
  ],
  "Lender Stipulations": [
    { name: "Proof of Income / Paystubs", required: true },
    { name: "Bank Statements (2 months)", required: false },
    { name: "Trade Title / Lien Release", required: true },
    { name: "Down Payment Receipt", required: true },
  ],
};

// ── Helper: build checklist for a deal ───────────────────────────────
function buildChecklist(seed: number): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  let idx = 0;
  for (const section of SECTIONS) {
    for (const tmpl of SECTION_ITEMS[section]) {
      const hash = (seed * 31 + idx * 17) % 100;
      let status: "complete" | "pending" | "missing";
      if (hash < 55) status = "complete";
      else if (hash < 80) status = "pending";
      else status = "missing";
      items.push({
        id: `${seed}-${idx}`,
        section,
        name: tmpl.name,
        required: tmpl.required,
        status,
        notes: status === "pending" ? "Awaiting customer" : status === "missing" ? "Not received" : "",
      });
      idx++;
    }
  }
  return items;
}

// ── Demo deals ───────────────────────────────────────────────────────
const DEALS: Deal[] = [
  { id: 1, customer: "Carlos Mendez", date: "2026-03-02", lender: "Ally", vehicle: "2026 Toyota Camry SE" },
  { id: 2, customer: "Angela Brooks", date: "2026-03-05", lender: "Chase", vehicle: "2025 Honda CR-V EX" },
  { id: 3, customer: "Tyler Morrison", date: "2026-03-10", lender: "Capital One", vehicle: "2026 Ford F-150 XLT" },
  { id: 4, customer: "Priya Sharma", date: "2026-03-14", lender: "Wells Fargo", vehicle: "2026 Hyundai Tucson SEL" },
  { id: 5, customer: "Robert Franklin", date: "2026-03-18", lender: "US Bank", vehicle: "2025 Chevrolet Equinox LT" },
  { id: 6, customer: "Mei-Ling Wu", date: "2026-03-22", lender: "Toyota Financial", vehicle: "2026 Toyota RAV4 XLE" },
  { id: 7, customer: "Derek Howard", date: "2026-03-25", lender: "GM Financial", vehicle: "2026 GMC Sierra 1500" },
  { id: 8, customer: "Natasha Volkov", date: "2026-03-28", lender: "Ally", vehicle: "2026 Nissan Rogue SV" },
  { id: 9, customer: "James O'Brien", date: "2026-04-01", lender: "Chase", vehicle: "2025 Jeep Grand Cherokee" },
  { id: 10, customer: "Destiny Clark", date: "2026-04-04", lender: "Capital One", vehicle: "2026 Kia Telluride SX" },
  { id: 11, customer: "Ahmad Hassan", date: "2026-04-07", lender: "Wells Fargo", vehicle: "2026 Subaru Outback Premium" },
  { id: 12, customer: "Brenda Jacobs", date: "2026-04-10", lender: "US Bank", vehicle: "2025 Mazda CX-5 Turbo" },
  { id: 13, customer: "Victor Reyes", date: "2026-04-13", lender: "Toyota Financial", vehicle: "2026 Toyota Tacoma TRD" },
  { id: 14, customer: "Lauren Mitchell", date: "2026-04-16", lender: "GM Financial", vehicle: "2026 Chevrolet Traverse RS" },
  { id: 15, customer: "Chris Nakamura", date: "2026-04-19", lender: "Ally", vehicle: "2026 Honda Accord Sport" },
].map((d) => ({ ...d, items: buildChecklist(d.id) }));

// ── Component ────────────────────────────────────────────────────────
export default function ContractChecklist() {
  useEffect(() => {
    document.title = "Contract Checklist | F&I Co-Pilot by ASURA Group";
  }, []);

  const [selectedDealId, setSelectedDealId] = useState<string>(String(DEALS[0].id));
  const [itemOverrides, setItemOverrides] = useState<Record<string, ChecklistItem[]>>({});
  const [noteEdits, setNoteEdits] = useState<Record<string, string>>({});

  // Current deal with overrides applied
  const deal = useMemo(() => {
    const base = DEALS.find((d) => String(d.id) === selectedDealId)!;
    const overridden = itemOverrides[selectedDealId];
    return { ...base, items: overridden ?? base.items };
  }, [selectedDealId, itemOverrides]);

  // Computed stats
  const stats = useMemo(() => {
    const total = deal.items.length;
    const complete = deal.items.filter((i) => i.status === "complete").length;
    const pending = deal.items.filter((i) => i.status === "pending").length;
    const missing = deal.items.filter((i) => i.status === "missing").length;
    const pct = Math.round((complete / total) * 100);
    const estMinutes = (pending * 10) + (missing * 20);
    return { total, complete, pending, missing, pct, estMinutes };
  }, [deal]);

  const criticalItems = useMemo(
    () => deal.items.filter((i) => i.required && i.status !== "complete"),
    [deal],
  );

  const sectionStats = useMemo(() => {
    const map: Record<string, { total: number; complete: number }> = {};
    for (const section of SECTIONS) {
      const sectionItems = deal.items.filter((i) => i.section === section);
      map[section] = {
        total: sectionItems.length,
        complete: sectionItems.filter((i) => i.status === "complete").length,
      };
    }
    return map;
  }, [deal]);

  // Toggle item to complete
  function toggleItem(itemId: string) {
    const current = itemOverrides[selectedDealId] ?? [...deal.items];
    const updated = current.map((item) => {
      if (item.id === itemId) {
        const newStatus = item.status === "complete" ? "pending" : "complete";
        return { ...item, status: newStatus as ChecklistItem["status"] };
      }
      return item;
    });
    setItemOverrides((prev) => ({ ...prev, [selectedDealId]: updated }));
  }

  // Update note
  function updateNote(itemId: string, note: string) {
    setNoteEdits((prev) => ({ ...prev, [itemId]: note }));
    const current = itemOverrides[selectedDealId] ?? [...deal.items];
    const updated = current.map((item) =>
      item.id === itemId ? { ...item, notes: note } : item,
    );
    setItemOverrides((prev) => ({ ...prev, [selectedDealId]: updated }));
  }

  const progressColor =
    stats.pct >= 90 ? "bg-green-500" : stats.pct >= 70 ? "bg-amber-500" : "bg-red-500";
  const progressTextColor =
    stats.pct >= 90 ? "text-green-500" : stats.pct >= 70 ? "text-amber-500" : "text-red-500";

  return (
    <AppLayout title="Contract Checklist" subtitle="Pre-funding contract audit — ensure every deal is fundable">
      <div className="p-4 lg:p-6 space-y-6">
        {/* ── Deal Selector & Actions ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0 w-full sm:max-w-md">
            <Select value={selectedDealId} onValueChange={setSelectedDealId}>
              <SelectTrigger className="w-full bg-card border">
                <SelectValue placeholder="Select a deal..." />
              </SelectTrigger>
              <SelectContent>
                {DEALS.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.customer} — {d.date} — {d.lender}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {stats.pct === 100 && (
              <Badge className="bg-green-500/10 text-green-500 border-green-500/30 text-sm px-3 py-1">
                <ShieldCheck className="w-4 h-4 mr-1" />
                Ready to Fund
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4 mr-1" />
              Print
            </Button>
            <Button
              size="sm"
              disabled={stats.pct < 100}
              className={stats.pct === 100 ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Send className="w-4 h-4 mr-1" />
              Submit to Lender
            </Button>
          </div>
        </div>

        {/* ── Deal Info Bar ──────────────────────────────────────────── */}
        <Card className="bg-card border">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span className="text-muted-foreground">
                Customer: <span className="text-foreground font-medium">{deal.customer}</span>
              </span>
              <span className="text-muted-foreground">
                Vehicle: <span className="text-foreground font-medium">{deal.vehicle}</span>
              </span>
              <span className="text-muted-foreground">
                Date: <span className="text-foreground font-medium">{deal.date}</span>
              </span>
              <span className="text-muted-foreground">
                Lender: <span className="text-foreground font-medium">{deal.lender}</span>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── Progress Bar ───────────────────────────────────────────── */}
        <Card className="bg-card border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Overall Completion
              </span>
              <span className={`text-sm font-bold ${progressTextColor}`}>
                {stats.pct}%
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${stats.pct}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── KPI Bar ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-card border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <ListChecks className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Items</p>
                <p className="text-xl font-bold text-foreground">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Complete</p>
                <p className="text-xl font-bold text-green-500">{stats.complete}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-amber-500">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Missing</p>
                <p className="text-xl font-bold text-red-500">{stats.missing}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Timer className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Est. Time to Clear</p>
                <p className="text-xl font-bold text-foreground">
                  {stats.estMinutes > 0 ? `${stats.estMinutes}m` : "0m"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Critical Items Panel ───────────────────────────────────── */}
        {criticalItems.length > 0 && (
          <Card className="bg-card border border-red-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-5 h-5" />
                Critical Items — Required items still incomplete ({criticalItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-2">
                {criticalItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-red-500/5 border border-red-500/20"
                  >
                    <span className="text-red-500 text-sm">
                      {item.status === "missing" ? "❌" : "⏳"}
                    </span>
                    <span className="text-sm text-foreground font-medium flex-1">
                      {item.name}
                    </span>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {item.section}
                    </Badge>
                    {item.notes && (
                      <span className="text-xs text-muted-foreground italic max-w-[200px] truncate">
                        {item.notes}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Checklist by Section ───────────────────────────────────── */}
        <div className="space-y-4">
          {SECTIONS.map((section) => {
            const sectionItems = deal.items.filter((i) => i.section === section);
            const ss = sectionStats[section];
            return (
              <Card key={section} className="bg-card border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2 text-foreground">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      {section}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={
                        ss.complete === ss.total
                          ? "bg-green-500/10 text-green-500 border-green-500/30"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                      }
                    >
                      {ss.complete}/{ss.total}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2">
                    {sectionItems.map((item) => {
                      const noteKey = item.id;
                      const currentNote =
                        noteEdits[noteKey] !== undefined ? noteEdits[noteKey] : item.notes;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={item.status === "complete"}
                            onChange={() => toggleItem(item.id)}
                            className="w-4 h-4 rounded border-2 border-muted-foreground accent-green-500 cursor-pointer flex-shrink-0"
                          />
                          <span
                            className={`text-sm flex-1 ${
                              item.status === "complete"
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }`}
                          >
                            {item.name}
                          </span>
                          {item.required && (
                            <span className="text-amber-500 text-sm flex-shrink-0" title="Required">
                              ⚠️
                            </span>
                          )}
                          <span className="flex-shrink-0 text-sm">
                            {item.status === "complete"
                              ? "✅"
                              : item.status === "pending"
                                ? "⏳"
                                : "❌"}
                          </span>
                          <input
                            type="text"
                            value={currentNote}
                            onChange={(e) => updateNote(item.id, e.target.value)}
                            placeholder="Notes..."
                            className="w-36 lg:w-48 text-xs px-2 py-1 rounded border bg-background text-foreground placeholder:text-muted-foreground flex-shrink-0"
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
