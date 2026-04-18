import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Printer } from "lucide-react";

type DealStatus = "Pending" | "Funded" | "Unwound" | "Declined";

interface DealEntry {
  id: number;
  date: string;
  dealNumber: string;
  customerName: string;
  vehicle: string;
  salePrice: number;
  amountFinanced: number;
  rate: number;
  term: number;
  monthlyPayment: number;
  lender: string;
  manager: string;
  productsSold: string[];
  backGross: number;
  frontGross: number;
  status: DealStatus;
}

const TODAY = "2026-04-17";

const DEMO_DEALS: DealEntry[] = [
  { id: 1, date: TODAY, dealNumber: "D-2401", customerName: "Marcus Johnson", vehicle: "2026 BMW X5", salePrice: 67400, amountFinanced: 61200, rate: 6.49, term: 72, monthlyPayment: 1018, lender: "Chase Auto", manager: "Adrian", productsSold: ["GAP", "VSC", "Tire & Wheel"], backGross: 3890, frontGross: 2200, status: "Funded" },
  { id: 2, date: TODAY, dealNumber: "D-2402", customerName: "Sarah Chen", vehicle: "2026 Lexus RX 350", salePrice: 52800, amountFinanced: 48100, rate: 5.99, term: 72, monthlyPayment: 796, lender: "Capital One", manager: "Jeremy", productsSold: ["GAP", "Maintenance"], backGross: 2480, frontGross: 1800, status: "Pending" },
  { id: 3, date: TODAY, dealNumber: "D-2403", customerName: "David Williams", vehicle: "2025 Ford F-150", salePrice: 58200, amountFinanced: 54000, rate: 7.24, term: 84, monthlyPayment: 821, lender: "Westlake Financial", manager: "Adrian", productsSold: ["VSC", "Key Replacement"], backGross: 2140, frontGross: 2900, status: "Funded" },
  { id: 4, date: TODAY, dealNumber: "D-2404", customerName: "Jennifer Lopez", vehicle: "2026 Tesla Model Y", salePrice: 48900, amountFinanced: 44750, rate: 5.74, term: 72, monthlyPayment: 734, lender: "US Bank", manager: "Ryan", productsSold: ["GAP"], backGross: 1350, frontGross: 1400, status: "Pending" },
  { id: 5, date: TODAY, dealNumber: "D-2405", customerName: "Robert Kim", vehicle: "2026 Mercedes GLE", salePrice: 72100, amountFinanced: 66500, rate: 6.89, term: 84, monthlyPayment: 998, lender: "Ally Financial", manager: "Adrian", productsSold: ["GAP", "VSC", "Dent", "Wheel"], backGross: 4525, frontGross: 3100, status: "Funded" },
  { id: 6, date: TODAY, dealNumber: "D-2406", customerName: "Amanda Foster", vehicle: "2025 Toyota Camry", salePrice: 32400, amountFinanced: 30100, rate: 6.29, term: 72, monthlyPayment: 503, lender: "TD Auto Finance", manager: "Jeremy", productsSold: ["Maintenance"], backGross: 920, frontGross: 900, status: "Declined" },
  { id: 7, date: TODAY, dealNumber: "D-2407", customerName: "Carlos Rivera", vehicle: "2026 Audi Q7", salePrice: 63800, amountFinanced: 59000, rate: 6.94, term: 84, monthlyPayment: 884, lender: "Chase Auto", manager: "Ryan", productsSold: ["GAP", "VSC"], backGross: 2710, frontGross: 2500, status: "Pending" },
  { id: 8, date: TODAY, dealNumber: "D-2408", customerName: "Lisa Thompson", vehicle: "2025 Honda CR-V", salePrice: 38500, amountFinanced: 34800, rate: 5.84, term: 72, monthlyPayment: 575, lender: "Wells Fargo", manager: "Adrian", productsSold: ["GAP", "Tire & Wheel"], backGross: 1815, frontGross: 1200, status: "Funded" },
  { id: 9, date: TODAY, dealNumber: "D-2409", customerName: "Michael Brown", vehicle: "2026 Chevy Tahoe", salePrice: 61200, amountFinanced: 56900, rate: 7.39, term: 84, monthlyPayment: 877, lender: "Credit Acceptance", manager: "Jeremy", productsSold: ["GAP"], backGross: 1125, frontGross: 2600, status: "Unwound" },
  { id: 10, date: TODAY, dealNumber: "D-2410", customerName: "Emily Davis", vehicle: "2025 Nissan Rogue", salePrice: 34600, amountFinanced: 31500, rate: 6.1, term: 72, monthlyPayment: 525, lender: "Bank of America", manager: "Ryan", productsSold: ["Maintenance", "Wheel"], backGross: 1570, frontGross: 980, status: "Funded" },
  { id: 11, date: TODAY, dealNumber: "D-2411", customerName: "James Wilson", vehicle: "2025 Hyundai Tucson", salePrice: 33900, amountFinanced: 30900, rate: 6.52, term: 72, monthlyPayment: 519, lender: "Capital One", manager: "Adrian", productsSold: ["GAP"], backGross: 990, frontGross: 870, status: "Pending" },
  { id: 12, date: TODAY, dealNumber: "D-2412", customerName: "Patricia Moore", vehicle: "2026 Kia Telluride", salePrice: 44200, amountFinanced: 40100, rate: 6.34, term: 72, monthlyPayment: 667, lender: "Regional Credit Union", manager: "Jeremy", productsSold: ["VSC", "Maintenance"], backGross: 2245, frontGross: 1500, status: "Funded" },
];

const STATUS_TINT: Record<DealStatus, string> = {
  Funded: "bg-green-500/8",
  Pending: "bg-yellow-500/8",
  Unwound: "bg-red-500/8",
  Declined: "bg-slate-500/8",
};

const EMPTY_DEAL: Omit<DealEntry, "id"> = {
  date: TODAY,
  dealNumber: "",
  customerName: "",
  vehicle: "",
  salePrice: 0,
  amountFinanced: 0,
  rate: 0,
  term: 72,
  monthlyPayment: 0,
  lender: "",
  manager: "",
  productsSold: [],
  backGross: 0,
  frontGross: 0,
  status: "Pending",
};

export default function DeskLog() {
  useEffect(() => {
    document.title = "Desk Log | F&I Co-Pilot by ASURA Group";
  }, []);

  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [deals, setDeals] = useState<DealEntry[]>(DEMO_DEALS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newDeal, setNewDeal] = useState(EMPTY_DEAL);

  const filteredDeals = useMemo(() => deals.filter((deal) => deal.date === selectedDate), [deals, selectedDate]);

  const summary = useMemo(() => {
    const totalBackGross = filteredDeals.reduce((sum, deal) => sum + deal.backGross, 0);
    const totalFrontGross = filteredDeals.reduce((sum, deal) => sum + deal.frontGross, 0);
    const totalGross = totalBackGross + totalFrontGross;
    return {
      totalDeals: filteredDeals.length,
      totalBackGross,
      totalFrontGross,
      totalGross,
      avgPVR: filteredDeals.length ? Math.round(totalBackGross / filteredDeals.length) : 0,
      fundedCount: filteredDeals.filter((deal) => deal.status === "Funded").length,
      pendingCount: filteredDeals.filter((deal) => deal.status === "Pending").length,
    };
  }, [filteredDeals]);

  function updateDeal(id: number, field: keyof DealEntry, value: string) {
    setDeals((prev) => prev.map((deal) => {
      if (deal.id !== id) return deal;
      if (["salePrice", "amountFinanced", "rate", "term", "monthlyPayment", "backGross", "frontGross"].includes(field)) {
        return { ...deal, [field]: Number(value) } as DealEntry;
      }
      if (field === "productsSold") {
        return { ...deal, productsSold: value.split(",").map((item) => item.trim()).filter(Boolean) } as DealEntry;
      }
      return { ...deal, [field]: value } as DealEntry;
    }));
  }

  function exportCsv() {
    const headers = ["Deal #","Customer Name","Vehicle","Sale Price","Amount Financed","Rate","Term","Monthly Payment","Lender","F&I Manager","Products Sold","Back Gross","Front Gross","Total Gross","Status"];
    const rows = filteredDeals.map((deal) => [
      deal.dealNumber,
      deal.customerName,
      deal.vehicle,
      deal.salePrice,
      deal.amountFinanced,
      deal.rate,
      deal.term,
      deal.monthlyPayment,
      deal.lender,
      deal.manager,
      deal.productsSold.join(", "),
      deal.backGross,
      deal.frontGross,
      deal.backGross + deal.frontGross,
      deal.status,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `desk-log-${selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function addDeal() {
    setDeals((prev) => [...prev, { ...newDeal, id: Date.now() }]);
    setSheetOpen(false);
    setNewDeal(EMPTY_DEAL);
  }

  return (
    <AppLayout title="Desk Log" subtitle="Every deal worked today, tracked cleanly">
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-[180px]" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
            <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" /> Print</Button>
            <Button onClick={() => setSheetOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Deal</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
          <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Total Deals</div><div className="text-2xl font-bold">{summary.totalDeals}</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Back Gross</div><div className="text-2xl font-bold">${summary.totalBackGross.toLocaleString()}</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Front Gross</div><div className="text-2xl font-bold">${summary.totalFrontGross.toLocaleString()}</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Total Gross</div><div className="text-2xl font-bold">${summary.totalGross.toLocaleString()}</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Avg PVR</div><div className="text-2xl font-bold">${summary.avgPVR.toLocaleString()}</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Funded</div><div className="text-2xl font-bold">{summary.fundedCount}</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Pending</div><div className="text-2xl font-bold">{summary.pendingCount}</div></CardContent></Card>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1600px]">
              <thead>
                <tr className="border-b text-left">
                  {["Deal #","Customer Name","Vehicle","Sale Price","Amount Financed","Rate","Term","Monthly Payment","Lender","F&I Manager","Products Sold","Back Gross","Front Gross","Total Gross","Status"].map((header) => (
                    <th key={header} className="px-3 py-3 font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((deal) => (
                  <tr key={deal.id} className={`border-b hover:bg-muted/40 ${STATUS_TINT[deal.status]}`}>
                    <td className="px-3 py-2"><Input value={deal.dealNumber} onChange={(e) => updateDeal(deal.id, "dealNumber", e.target.value)} /></td>
                    <td className="px-3 py-2"><Input value={deal.customerName} onChange={(e) => updateDeal(deal.id, "customerName", e.target.value)} /></td>
                    <td className="px-3 py-2"><Input value={deal.vehicle} onChange={(e) => updateDeal(deal.id, "vehicle", e.target.value)} /></td>
                    <td className="px-3 py-2"><Input type="number" value={deal.salePrice} onChange={(e) => updateDeal(deal.id, "salePrice", e.target.value)} /></td>
                    <td className="px-3 py-2"><Input type="number" value={deal.amountFinanced} onChange={(e) => updateDeal(deal.id, "amountFinanced", e.target.value)} /></td>
                    <td className="px-3 py-2"><Input type="number" step="0.01" value={deal.rate} onChange={(e) => updateDeal(deal.id, "rate", e.target.value)} /></td>
                    <td className="px-3 py-2"><Input type="number" value={deal.term} onChange={(e) => updateDeal(deal.id, "term", e.target.value)} /></td>
                    <td className="px-3 py-2"><Input type="number" value={deal.monthlyPayment} onChange={(e) => updateDeal(deal.id, "monthlyPayment", e.target.value)} /></td>
                    <td className="px-3 py-2"><Input value={deal.lender} onChange={(e) => updateDeal(deal.id, "lender", e.target.value)} /></td>
                    <td className="px-3 py-2"><Input value={deal.manager} onChange={(e) => updateDeal(deal.id, "manager", e.target.value)} /></td>
                    <td className="px-3 py-2"><Input value={deal.productsSold.join(", ")} onChange={(e) => updateDeal(deal.id, "productsSold", e.target.value)} /></td>
                    <td className="px-3 py-2"><Input type="number" value={deal.backGross} onChange={(e) => updateDeal(deal.id, "backGross", e.target.value)} /></td>
                    <td className="px-3 py-2"><Input type="number" value={deal.frontGross} onChange={(e) => updateDeal(deal.id, "frontGross", e.target.value)} /></td>
                    <td className="px-3 py-2 font-semibold">${(deal.backGross + deal.frontGross).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <select className="border rounded-md px-2 py-2 bg-background" value={deal.status} onChange={(e) => updateDeal(deal.id, "status", e.target.value)}>
                        {(["Pending", "Funded", "Unwound", "Declined"] as DealStatus[]).map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Deal</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
            {[
              ["dealNumber", "Deal #"],
              ["customerName", "Customer Name"],
              ["vehicle", "Vehicle"],
              ["salePrice", "Sale Price"],
              ["amountFinanced", "Amount Financed"],
              ["rate", "Rate"],
              ["term", "Term"],
              ["monthlyPayment", "Monthly Payment"],
              ["lender", "Lender"],
              ["manager", "F&I Manager"],
              ["backGross", "Back Gross"],
              ["frontGross", "Front Gross"],
            ].map(([field, label]) => (
              <div key={field}>
                <div className="text-sm font-medium mb-1">{label}</div>
                <Input value={String((newDeal as unknown as Record<string, string | number>)[field])} onChange={(e) => setNewDeal((prev) => ({ ...prev, [field]: ["salePrice","amountFinanced","rate","term","monthlyPayment","backGross","frontGross"].includes(field) ? Number(e.target.value) : e.target.value }))} />
              </div>
            ))}
            <div className="md:col-span-2">
              <div className="text-sm font-medium mb-1">Products Sold</div>
              <Input value={newDeal.productsSold.join(", ")} onChange={(e) => setNewDeal((prev) => ({ ...prev, productsSold: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Status</div>
              <select className="w-full border rounded-md px-3 py-2 bg-background" value={newDeal.status} onChange={(e) => setNewDeal((prev) => ({ ...prev, status: e.target.value as DealStatus }))}>
                {(["Pending", "Funded", "Unwound", "Declined"] as DealStatus[]).map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Date</div>
              <Input type="date" value={newDeal.date} onChange={(e) => setNewDeal((prev) => ({ ...prev, date: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            <Button onClick={addDeal}>Save Deal</Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
