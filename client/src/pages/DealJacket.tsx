import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Printer,
  DollarSign,
  Shield,
  Star,
  Search,
  ChevronRight,
  AlertTriangle,
  User,
  Car,
  Calendar,
  CreditCard,
  Building2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

// ── Deal Data ───────────────────────────────────────────────────────
interface DealDocument {
  name: string;
  status: "complete" | "pending" | "missing";
}

interface DealProduct {
  name: string;
  price: number;
  cost: number;
  grossProfit: number;
  firstTimeBuyer: boolean;
}

interface ComplianceFlag {
  rule: string;
  severity: "warning" | "critical" | "info";
  message: string;
}

interface TimelineEvent {
  timestamp: string;
  label: string;
  status: "completed" | "current" | "pending";
}

interface Deal {
  id: string;
  customerName: string;
  vehicle: string;
  dealDate: string;
  fiManager: string;
  dealType: "Finance" | "Lease" | "Cash";
  salePrice: number;
  amountFinanced: number;
  rate: number;
  term: number;
  monthlyPayment: number;
  lender: string;
  frontGross: number;
  backGross: number;
  opsScore: number;
  documents: DealDocument[];
  products: DealProduct[];
  complianceFlags: ComplianceFlag[];
  timeline: TimelineEvent[];
}

const DEALS: Deal[] = [
  {
    id: "D-2026-001", customerName: "James Rodriguez", vehicle: "2026 Toyota Camry XSE", dealDate: "2026-04-05", fiManager: "Adrian Anania",
    dealType: "Finance", salePrice: 38500, amountFinanced: 34200, rate: 5.9, term: 72, monthlyPayment: 563, lender: "Ally Financial",
    frontGross: 2800, backGross: 3200, opsScore: 94,
    documents: [
      { name: "Credit Application", status: "complete" }, { name: "Menu Presentation", status: "complete" },
      { name: "Product Disclosure Forms", status: "complete" }, { name: "Rate Markup Disclosure", status: "complete" },
      { name: "Privacy Notice", status: "complete" }, { name: "Arbitration Agreement", status: "complete" },
      { name: "GAP Waiver", status: "complete" }, { name: "Warranty Contract", status: "complete" },
      { name: "Adverse Action Notice", status: "missing" },
    ],
    products: [
      { name: "Extended Warranty", price: 2200, cost: 800, grossProfit: 1400, firstTimeBuyer: false },
      { name: "GAP Insurance", price: 895, cost: 250, grossProfit: 645, firstTimeBuyer: false },
      { name: "Paint Protection", price: 599, cost: 120, grossProfit: 479, firstTimeBuyer: true },
    ],
    complianceFlags: [{ rule: "Rate Spread Warning", severity: "info", message: "Rate markup within 2% guideline" }],
    timeline: [
      { timestamp: "2026-04-05 09:15", label: "Deal Opened", status: "completed" },
      { timestamp: "2026-04-05 09:30", label: "Credit Pulled", status: "completed" },
      { timestamp: "2026-04-05 10:00", label: "Menu Presented", status: "completed" },
      { timestamp: "2026-04-05 10:25", label: "Products Selected", status: "completed" },
      { timestamp: "2026-04-05 11:00", label: "Contracts Signed", status: "completed" },
      { timestamp: "2026-04-05 11:30", label: "Funded", status: "completed" },
    ],
  },
  {
    id: "D-2026-002", customerName: "Sarah Chen", vehicle: "2025 Honda CR-V Hybrid", dealDate: "2026-04-04", fiManager: "Mike Torres",
    dealType: "Finance", salePrice: 42000, amountFinanced: 38500, rate: 4.9, term: 60, monthlyPayment: 723, lender: "Capital One",
    frontGross: 3100, backGross: 3800, opsScore: 97,
    documents: [
      { name: "Credit Application", status: "complete" }, { name: "Menu Presentation", status: "complete" },
      { name: "Product Disclosure Forms", status: "complete" }, { name: "Rate Markup Disclosure", status: "complete" },
      { name: "Privacy Notice", status: "complete" }, { name: "Arbitration Agreement", status: "complete" },
      { name: "GAP Waiver", status: "pending" }, { name: "Warranty Contract", status: "complete" },
      { name: "Adverse Action Notice", status: "missing" },
    ],
    products: [
      { name: "Extended Warranty", price: 2800, cost: 950, grossProfit: 1850, firstTimeBuyer: false },
      { name: "GAP Insurance", price: 995, cost: 280, grossProfit: 715, firstTimeBuyer: false },
      { name: "Tire & Wheel", price: 699, cost: 180, grossProfit: 519, firstTimeBuyer: true },
      { name: "Key Replacement", price: 399, cost: 80, grossProfit: 319, firstTimeBuyer: true },
    ],
    complianceFlags: [],
    timeline: [
      { timestamp: "2026-04-04 14:00", label: "Deal Opened", status: "completed" },
      { timestamp: "2026-04-04 14:20", label: "Credit Pulled", status: "completed" },
      { timestamp: "2026-04-04 14:45", label: "Menu Presented", status: "completed" },
      { timestamp: "2026-04-04 15:10", label: "Products Selected", status: "completed" },
      { timestamp: "2026-04-04 15:40", label: "Contracts Signed", status: "completed" },
      { timestamp: "2026-04-04 16:00", label: "Funded", status: "completed" },
    ],
  },
  {
    id: "D-2026-003", customerName: "Robert Williams", vehicle: "2026 Ford F-150 XLT", dealDate: "2026-04-04", fiManager: "Adrian Anania",
    dealType: "Finance", salePrice: 55000, amountFinanced: 48000, rate: 6.5, term: 84, monthlyPayment: 717, lender: "Wells Fargo",
    frontGross: 4200, backGross: 2100, opsScore: 78,
    documents: [
      { name: "Credit Application", status: "complete" }, { name: "Menu Presentation", status: "complete" },
      { name: "Product Disclosure Forms", status: "pending" }, { name: "Rate Markup Disclosure", status: "complete" },
      { name: "Privacy Notice", status: "complete" }, { name: "Arbitration Agreement", status: "pending" },
      { name: "Warranty Contract", status: "missing" }, { name: "Adverse Action Notice", status: "missing" },
    ],
    products: [
      { name: "Extended Warranty", price: 2500, cost: 900, grossProfit: 1600, firstTimeBuyer: false },
    ],
    complianceFlags: [
      { rule: "Incomplete Documents", severity: "warning", message: "Warranty contract not signed" },
      { rule: "Low Product Penetration", severity: "info", message: "Only 1 product sold — consider coaching review" },
    ],
    timeline: [
      { timestamp: "2026-04-04 10:00", label: "Deal Opened", status: "completed" },
      { timestamp: "2026-04-04 10:15", label: "Credit Pulled", status: "completed" },
      { timestamp: "2026-04-04 10:45", label: "Menu Presented", status: "completed" },
      { timestamp: "2026-04-04 11:00", label: "Products Selected", status: "completed" },
      { timestamp: "2026-04-04 11:30", label: "Contracts Signed", status: "current" },
      { timestamp: "", label: "Funded", status: "pending" },
    ],
  },
  {
    id: "D-2026-004", customerName: "Maria Gonzalez", vehicle: "2025 Hyundai Tucson SEL", dealDate: "2026-04-03", fiManager: "Lisa Park",
    dealType: "Lease", salePrice: 34000, amountFinanced: 28500, rate: 3.9, term: 36, monthlyPayment: 425, lender: "US Bank",
    frontGross: 1800, backGross: 2600, opsScore: 89,
    documents: [
      { name: "Credit Application", status: "complete" }, { name: "Menu Presentation", status: "complete" },
      { name: "Product Disclosure Forms", status: "complete" }, { name: "Rate Markup Disclosure", status: "complete" },
      { name: "Privacy Notice", status: "complete" }, { name: "Arbitration Agreement", status: "complete" },
      { name: "Warranty Contract", status: "complete" }, { name: "Adverse Action Notice", status: "missing" },
    ],
    products: [
      { name: "GAP Insurance", price: 795, cost: 220, grossProfit: 575, firstTimeBuyer: false },
      { name: "Tire & Wheel", price: 599, cost: 150, grossProfit: 449, firstTimeBuyer: false },
      { name: "Dent Protection", price: 499, cost: 100, grossProfit: 399, firstTimeBuyer: true },
    ],
    complianceFlags: [],
    timeline: [
      { timestamp: "2026-04-03 13:00", label: "Deal Opened", status: "completed" },
      { timestamp: "2026-04-03 13:20", label: "Credit Pulled", status: "completed" },
      { timestamp: "2026-04-03 13:50", label: "Menu Presented", status: "completed" },
      { timestamp: "2026-04-03 14:15", label: "Products Selected", status: "completed" },
      { timestamp: "2026-04-03 14:45", label: "Contracts Signed", status: "completed" },
      { timestamp: "2026-04-03 15:30", label: "Funded", status: "completed" },
    ],
  },
  {
    id: "D-2026-005", customerName: "David Kim", vehicle: "2026 BMW X3 M40i", dealDate: "2026-04-03", fiManager: "Adrian Anania",
    dealType: "Finance", salePrice: 62000, amountFinanced: 52000, rate: 5.4, term: 72, monthlyPayment: 853, lender: "Bank of America",
    frontGross: 5500, backGross: 4100, opsScore: 96,
    documents: [
      { name: "Credit Application", status: "complete" }, { name: "Menu Presentation", status: "complete" },
      { name: "Product Disclosure Forms", status: "complete" }, { name: "Rate Markup Disclosure", status: "complete" },
      { name: "Privacy Notice", status: "complete" }, { name: "Arbitration Agreement", status: "complete" },
      { name: "GAP Waiver", status: "complete" }, { name: "Warranty Contract", status: "complete" },
      { name: "Adverse Action Notice", status: "missing" },
    ],
    products: [
      { name: "Extended Warranty", price: 3500, cost: 1200, grossProfit: 2300, firstTimeBuyer: false },
      { name: "GAP Insurance", price: 995, cost: 280, grossProfit: 715, firstTimeBuyer: false },
      { name: "Paint Protection", price: 899, cost: 200, grossProfit: 699, firstTimeBuyer: false },
      { name: "Key Replacement", price: 499, cost: 90, grossProfit: 409, firstTimeBuyer: false },
    ],
    complianceFlags: [],
    timeline: [
      { timestamp: "2026-04-03 10:30", label: "Deal Opened", status: "completed" },
      { timestamp: "2026-04-03 10:45", label: "Credit Pulled", status: "completed" },
      { timestamp: "2026-04-03 11:15", label: "Menu Presented", status: "completed" },
      { timestamp: "2026-04-03 11:40", label: "Products Selected", status: "completed" },
      { timestamp: "2026-04-03 12:10", label: "Contracts Signed", status: "completed" },
      { timestamp: "2026-04-03 13:00", label: "Funded", status: "completed" },
    ],
  },
  {
    id: "D-2026-006", customerName: "Jennifer Taylor", vehicle: "2025 Kia Sportage SX", dealDate: "2026-04-02", fiManager: "Mike Torres",
    dealType: "Finance", salePrice: 39500, amountFinanced: 35000, rate: 7.2, term: 72, monthlyPayment: 604, lender: "TD Auto Finance",
    frontGross: 2400, backGross: 1500, opsScore: 72,
    documents: [
      { name: "Credit Application", status: "complete" }, { name: "Menu Presentation", status: "complete" },
      { name: "Product Disclosure Forms", status: "complete" }, { name: "Rate Markup Disclosure", status: "pending" },
      { name: "Privacy Notice", status: "complete" }, { name: "Arbitration Agreement", status: "complete" },
      { name: "Warranty Contract", status: "complete" }, { name: "Adverse Action Notice", status: "missing" },
    ],
    products: [
      { name: "Extended Warranty", price: 1800, cost: 700, grossProfit: 1100, firstTimeBuyer: false },
    ],
    complianceFlags: [
      { rule: "Rate Markup High", severity: "critical", message: "Rate markup exceeds 2.5% guideline — review required" },
    ],
    timeline: [
      { timestamp: "2026-04-02 15:00", label: "Deal Opened", status: "completed" },
      { timestamp: "2026-04-02 15:20", label: "Credit Pulled", status: "completed" },
      { timestamp: "2026-04-02 15:50", label: "Menu Presented", status: "completed" },
      { timestamp: "2026-04-02 16:05", label: "Products Selected", status: "completed" },
      { timestamp: "2026-04-02 16:30", label: "Contracts Signed", status: "completed" },
      { timestamp: "2026-04-02 17:00", label: "Funded", status: "completed" },
    ],
  },
  {
    id: "D-2026-007", customerName: "Marcus Johnson", vehicle: "2026 Chevy Silverado LT", dealDate: "2026-04-02", fiManager: "Adrian Anania",
    dealType: "Finance", salePrice: 52000, amountFinanced: 46000, rate: 6.1, term: 84, monthlyPayment: 680, lender: "Ally Financial",
    frontGross: 3800, backGross: 3500, opsScore: 91,
    documents: [
      { name: "Credit Application", status: "complete" }, { name: "Menu Presentation", status: "complete" },
      { name: "Product Disclosure Forms", status: "complete" }, { name: "Rate Markup Disclosure", status: "complete" },
      { name: "Privacy Notice", status: "complete" }, { name: "Arbitration Agreement", status: "complete" },
      { name: "GAP Waiver", status: "complete" }, { name: "Warranty Contract", status: "complete" },
      { name: "Adverse Action Notice", status: "missing" },
    ],
    products: [
      { name: "Extended Warranty", price: 2800, cost: 1000, grossProfit: 1800, firstTimeBuyer: false },
      { name: "GAP Insurance", price: 895, cost: 260, grossProfit: 635, firstTimeBuyer: false },
      { name: "Bed Liner", price: 599, cost: 180, grossProfit: 419, firstTimeBuyer: true },
    ],
    complianceFlags: [],
    timeline: [
      { timestamp: "2026-04-02 09:00", label: "Deal Opened", status: "completed" },
      { timestamp: "2026-04-02 09:20", label: "Credit Pulled", status: "completed" },
      { timestamp: "2026-04-02 09:50", label: "Menu Presented", status: "completed" },
      { timestamp: "2026-04-02 10:15", label: "Products Selected", status: "completed" },
      { timestamp: "2026-04-02 10:45", label: "Contracts Signed", status: "completed" },
      { timestamp: "2026-04-02 11:30", label: "Funded", status: "completed" },
    ],
  },
  {
    id: "D-2026-008", customerName: "Emily Watson", vehicle: "2025 Nissan Rogue SL", dealDate: "2026-04-01", fiManager: "Lisa Park",
    dealType: "Finance", salePrice: 37500, amountFinanced: 33000, rate: 5.5, term: 60, monthlyPayment: 631, lender: "Capital One",
    frontGross: 2200, backGross: 2900, opsScore: 88,
    documents: [
      { name: "Credit Application", status: "complete" }, { name: "Menu Presentation", status: "complete" },
      { name: "Product Disclosure Forms", status: "complete" }, { name: "Rate Markup Disclosure", status: "complete" },
      { name: "Privacy Notice", status: "complete" }, { name: "Arbitration Agreement", status: "complete" },
      { name: "Warranty Contract", status: "complete" }, { name: "Adverse Action Notice", status: "missing" },
    ],
    products: [
      { name: "Extended Warranty", price: 2100, cost: 780, grossProfit: 1320, firstTimeBuyer: false },
      { name: "Paint Protection", price: 599, cost: 130, grossProfit: 469, firstTimeBuyer: false },
    ],
    complianceFlags: [],
    timeline: [
      { timestamp: "2026-04-01 11:00", label: "Deal Opened", status: "completed" },
      { timestamp: "2026-04-01 11:15", label: "Credit Pulled", status: "completed" },
      { timestamp: "2026-04-01 11:40", label: "Menu Presented", status: "completed" },
      { timestamp: "2026-04-01 12:00", label: "Products Selected", status: "completed" },
      { timestamp: "2026-04-01 12:30", label: "Contracts Signed", status: "completed" },
      { timestamp: "2026-04-01 13:15", label: "Funded", status: "completed" },
    ],
  },
  {
    id: "D-2026-009", customerName: "Carlos Rivera", vehicle: "2026 Toyota Tacoma TRD", dealDate: "2026-04-01", fiManager: "Mike Torres",
    dealType: "Finance", salePrice: 45000, amountFinanced: 40000, rate: 5.8, term: 72, monthlyPayment: 661, lender: "Chase Auto",
    frontGross: 3000, backGross: 3400, opsScore: 92,
    documents: [
      { name: "Credit Application", status: "complete" }, { name: "Menu Presentation", status: "complete" },
      { name: "Product Disclosure Forms", status: "complete" }, { name: "Rate Markup Disclosure", status: "complete" },
      { name: "Privacy Notice", status: "complete" }, { name: "Arbitration Agreement", status: "complete" },
      { name: "GAP Waiver", status: "complete" }, { name: "Warranty Contract", status: "complete" },
      { name: "Adverse Action Notice", status: "missing" },
    ],
    products: [
      { name: "Extended Warranty", price: 2600, cost: 900, grossProfit: 1700, firstTimeBuyer: false },
      { name: "GAP Insurance", price: 895, cost: 250, grossProfit: 645, firstTimeBuyer: false },
      { name: "Tire & Wheel", price: 699, cost: 170, grossProfit: 529, firstTimeBuyer: false },
    ],
    complianceFlags: [],
    timeline: [
      { timestamp: "2026-04-01 14:00", label: "Deal Opened", status: "completed" },
      { timestamp: "2026-04-01 14:15", label: "Credit Pulled", status: "completed" },
      { timestamp: "2026-04-01 14:40", label: "Menu Presented", status: "completed" },
      { timestamp: "2026-04-01 15:05", label: "Products Selected", status: "completed" },
      { timestamp: "2026-04-01 15:35", label: "Contracts Signed", status: "completed" },
      { timestamp: "2026-04-01 16:15", label: "Funded", status: "completed" },
    ],
  },
  {
    id: "D-2026-010", customerName: "Ashley Morgan", vehicle: "2025 Mazda CX-50 Premium", dealDate: "2026-03-31", fiManager: "Adrian Anania",
    dealType: "Finance", salePrice: 41000, amountFinanced: 36500, rate: 5.2, term: 60, monthlyPayment: 693, lender: "US Bank",
    frontGross: 2900, backGross: 3700, opsScore: 95,
    documents: [
      { name: "Credit Application", status: "complete" }, { name: "Menu Presentation", status: "complete" },
      { name: "Product Disclosure Forms", status: "complete" }, { name: "Rate Markup Disclosure", status: "complete" },
      { name: "Privacy Notice", status: "complete" }, { name: "Arbitration Agreement", status: "complete" },
      { name: "GAP Waiver", status: "complete" }, { name: "Warranty Contract", status: "complete" },
      { name: "Adverse Action Notice", status: "missing" },
    ],
    products: [
      { name: "Extended Warranty", price: 2400, cost: 850, grossProfit: 1550, firstTimeBuyer: false },
      { name: "GAP Insurance", price: 895, cost: 260, grossProfit: 635, firstTimeBuyer: false },
      { name: "Paint Protection", price: 799, cost: 170, grossProfit: 629, firstTimeBuyer: false },
      { name: "Key Replacement", price: 399, cost: 80, grossProfit: 319, firstTimeBuyer: false },
    ],
    complianceFlags: [],
    timeline: [
      { timestamp: "2026-03-31 10:00", label: "Deal Opened", status: "completed" },
      { timestamp: "2026-03-31 10:15", label: "Credit Pulled", status: "completed" },
      { timestamp: "2026-03-31 10:45", label: "Menu Presented", status: "completed" },
      { timestamp: "2026-03-31 11:10", label: "Products Selected", status: "completed" },
      { timestamp: "2026-03-31 11:40", label: "Contracts Signed", status: "completed" },
      { timestamp: "2026-03-31 12:30", label: "Funded", status: "completed" },
    ],
  },
  {
    id: "D-2026-011", customerName: "Thomas Lee", vehicle: "2026 Subaru Outback Limited", dealDate: "2026-03-30", fiManager: "Lisa Park",
    dealType: "Finance", salePrice: 40000, amountFinanced: 35000, rate: 5.6, term: 72, monthlyPayment: 578, lender: "TD Auto Finance",
    frontGross: 2600, backGross: 2200, opsScore: 83,
    documents: [
      { name: "Credit Application", status: "complete" }, { name: "Menu Presentation", status: "complete" },
      { name: "Product Disclosure Forms", status: "complete" }, { name: "Rate Markup Disclosure", status: "complete" },
      { name: "Privacy Notice", status: "complete" }, { name: "Arbitration Agreement", status: "complete" },
      { name: "Warranty Contract", status: "complete" }, { name: "Adverse Action Notice", status: "missing" },
    ],
    products: [
      { name: "Extended Warranty", price: 2000, cost: 750, grossProfit: 1250, firstTimeBuyer: false },
      { name: "Paint Protection", price: 599, cost: 130, grossProfit: 469, firstTimeBuyer: false },
    ],
    complianceFlags: [],
    timeline: [
      { timestamp: "2026-03-30 09:30", label: "Deal Opened", status: "completed" },
      { timestamp: "2026-03-30 09:45", label: "Credit Pulled", status: "completed" },
      { timestamp: "2026-03-30 10:15", label: "Menu Presented", status: "completed" },
      { timestamp: "2026-03-30 10:40", label: "Products Selected", status: "completed" },
      { timestamp: "2026-03-30 11:10", label: "Contracts Signed", status: "completed" },
      { timestamp: "2026-03-30 12:00", label: "Funded", status: "completed" },
    ],
  },
  {
    id: "D-2026-012", customerName: "Nicole Adams", vehicle: "2025 Jeep Grand Cherokee", dealDate: "2026-03-29", fiManager: "Adrian Anania",
    dealType: "Finance", salePrice: 48000, amountFinanced: 42000, rate: 6.0, term: 72, monthlyPayment: 698, lender: "Ally Financial",
    frontGross: 3400, backGross: 3100, opsScore: 90,
    documents: [
      { name: "Credit Application", status: "complete" }, { name: "Menu Presentation", status: "complete" },
      { name: "Product Disclosure Forms", status: "complete" }, { name: "Rate Markup Disclosure", status: "complete" },
      { name: "Privacy Notice", status: "complete" }, { name: "Arbitration Agreement", status: "complete" },
      { name: "GAP Waiver", status: "complete" }, { name: "Warranty Contract", status: "complete" },
      { name: "Adverse Action Notice", status: "missing" },
    ],
    products: [
      { name: "Extended Warranty", price: 2700, cost: 950, grossProfit: 1750, firstTimeBuyer: false },
      { name: "GAP Insurance", price: 895, cost: 260, grossProfit: 635, firstTimeBuyer: false },
      { name: "Tire & Wheel", price: 699, cost: 170, grossProfit: 529, firstTimeBuyer: false },
    ],
    complianceFlags: [],
    timeline: [
      { timestamp: "2026-03-29 13:00", label: "Deal Opened", status: "completed" },
      { timestamp: "2026-03-29 13:15", label: "Credit Pulled", status: "completed" },
      { timestamp: "2026-03-29 13:45", label: "Menu Presented", status: "completed" },
      { timestamp: "2026-03-29 14:10", label: "Products Selected", status: "completed" },
      { timestamp: "2026-03-29 14:40", label: "Contracts Signed", status: "completed" },
      { timestamp: "2026-03-29 15:30", label: "Funded", status: "completed" },
    ],
  },
  {
    id: "D-2026-013", customerName: "Brandon Smith", vehicle: "2026 RAM 1500 Big Horn", dealDate: "2026-03-28", fiManager: "Mike Torres",
    dealType: "Finance", salePrice: 50000, amountFinanced: 44000, rate: 7.5, term: 84, monthlyPayment: 672, lender: "Westlake Financial",
    frontGross: 2800, backGross: 1800, opsScore: 68,
    documents: [
      { name: "Credit Application", status: "complete" }, { name: "Menu Presentation", status: "complete" },
      { name: "Product Disclosure Forms", status: "pending" }, { name: "Rate Markup Disclosure", status: "complete" },
      { name: "Privacy Notice", status: "complete" }, { name: "Arbitration Agreement", status: "pending" },
      { name: "Warranty Contract", status: "complete" }, { name: "Adverse Action Notice", status: "missing" },
    ],
    products: [
      { name: "Extended Warranty", price: 2000, cost: 800, grossProfit: 1200, firstTimeBuyer: false },
    ],
    complianceFlags: [
      { rule: "High Rate Alert", severity: "warning", message: "Near Prime borrower at 7.5% — verify markup justification" },
    ],
    timeline: [
      { timestamp: "2026-03-28 11:00", label: "Deal Opened", status: "completed" },
      { timestamp: "2026-03-28 11:20", label: "Credit Pulled", status: "completed" },
      { timestamp: "2026-03-28 11:50", label: "Menu Presented", status: "completed" },
      { timestamp: "2026-03-28 12:10", label: "Products Selected", status: "completed" },
      { timestamp: "2026-03-28 12:40", label: "Contracts Signed", status: "completed" },
      { timestamp: "2026-03-28 13:30", label: "Funded", status: "completed" },
    ],
  },
  {
    id: "D-2026-014", customerName: "Amanda Brown", vehicle: "2025 VW Tiguan SE", dealDate: "2026-03-27", fiManager: "Lisa Park",
    dealType: "Lease", salePrice: 35000, amountFinanced: 29000, rate: 4.2, term: 36, monthlyPayment: 399, lender: "Chase Auto",
    frontGross: 1600, backGross: 2400, opsScore: 86,
    documents: [
      { name: "Credit Application", status: "complete" }, { name: "Menu Presentation", status: "complete" },
      { name: "Product Disclosure Forms", status: "complete" }, { name: "Rate Markup Disclosure", status: "complete" },
      { name: "Privacy Notice", status: "complete" }, { name: "Arbitration Agreement", status: "complete" },
      { name: "Warranty Contract", status: "complete" }, { name: "Adverse Action Notice", status: "missing" },
    ],
    products: [
      { name: "GAP Insurance", price: 795, cost: 220, grossProfit: 575, firstTimeBuyer: false },
      { name: "Paint Protection", price: 499, cost: 110, grossProfit: 389, firstTimeBuyer: false },
      { name: "Dent Protection", price: 399, cost: 90, grossProfit: 309, firstTimeBuyer: true },
    ],
    complianceFlags: [],
    timeline: [
      { timestamp: "2026-03-27 14:30", label: "Deal Opened", status: "completed" },
      { timestamp: "2026-03-27 14:45", label: "Credit Pulled", status: "completed" },
      { timestamp: "2026-03-27 15:10", label: "Menu Presented", status: "completed" },
      { timestamp: "2026-03-27 15:30", label: "Products Selected", status: "completed" },
      { timestamp: "2026-03-27 16:00", label: "Contracts Signed", status: "completed" },
      { timestamp: "2026-03-27 16:45", label: "Funded", status: "completed" },
    ],
  },
  {
    id: "D-2026-015", customerName: "Kevin Patel", vehicle: "2026 Lexus RX 350h", dealDate: "2026-03-26", fiManager: "Adrian Anania",
    dealType: "Finance", salePrice: 58000, amountFinanced: 50000, rate: 4.8, term: 60, monthlyPayment: 940, lender: "Bank of America",
    frontGross: 5000, backGross: 4500, opsScore: 98,
    documents: [
      { name: "Credit Application", status: "complete" }, { name: "Menu Presentation", status: "complete" },
      { name: "Product Disclosure Forms", status: "complete" }, { name: "Rate Markup Disclosure", status: "complete" },
      { name: "Privacy Notice", status: "complete" }, { name: "Arbitration Agreement", status: "complete" },
      { name: "GAP Waiver", status: "complete" }, { name: "Warranty Contract", status: "complete" },
      { name: "Adverse Action Notice", status: "missing" },
    ],
    products: [
      { name: "Extended Warranty", price: 3800, cost: 1300, grossProfit: 2500, firstTimeBuyer: false },
      { name: "GAP Insurance", price: 995, cost: 280, grossProfit: 715, firstTimeBuyer: false },
      { name: "Paint Protection", price: 999, cost: 220, grossProfit: 779, firstTimeBuyer: false },
      { name: "Key Replacement", price: 599, cost: 100, grossProfit: 499, firstTimeBuyer: false },
      { name: "Tire & Wheel", price: 799, cost: 200, grossProfit: 599, firstTimeBuyer: false },
    ],
    complianceFlags: [],
    timeline: [
      { timestamp: "2026-03-26 10:00", label: "Deal Opened", status: "completed" },
      { timestamp: "2026-03-26 10:15", label: "Credit Pulled", status: "completed" },
      { timestamp: "2026-03-26 10:45", label: "Menu Presented", status: "completed" },
      { timestamp: "2026-03-26 11:15", label: "Products Selected", status: "completed" },
      { timestamp: "2026-03-26 11:45", label: "Contracts Signed", status: "completed" },
      { timestamp: "2026-03-26 12:30", label: "Funded", status: "completed" },
    ],
  },
];

const statusIcon = (s: string) => {
  if (s === "complete") return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (s === "pending") return <Clock className="w-4 h-4 text-yellow-500" />;
  return <XCircle className="w-4 h-4 text-red-500" />;
};

export default function DealJacket() {
  const [selectedDealId, setSelectedDealId] = useState(DEALS[0].id);
  const [searchQuery, setSearchQuery] = useState("");

  const deal = DEALS.find(d => d.id === selectedDealId) ?? DEALS[0];

  const filteredDeals = useMemo(() => {
    if (!searchQuery) return DEALS;
    const q = searchQuery.toLowerCase();
    return DEALS.filter(d =>
      d.customerName.toLowerCase().includes(q) || d.vehicle.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const totalGross = deal.frontGross + deal.backGross;
  const docCompletion = Math.round((deal.documents.filter(d => d.status === "complete").length / deal.documents.length) * 100);

  const grossChartData = [
    { name: "Front Gross", value: deal.frontGross },
    { name: "Back Gross", value: deal.backGross },
    { name: "Total Gross", value: totalGross },
  ];
  const grossColors = ["#3b82f6", "#22c55e", "#a855f7"];

  const handlePrint = () => window.print();

  return (
    <AppLayout title="Deal Jacket Viewer" subtitle="Complete deal documentation and data in one view">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Deal Selector */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by customer, vehicle, or deal ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              value={selectedDealId}
              onChange={(e) => setSelectedDealId(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground min-w-[300px]"
            >
              {filteredDeals.map(d => (
                <option key={d.id} value={d.id}>{d.customerName} — {d.vehicle} ({d.dealDate})</option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </Card>

        {/* Deal Summary Header */}
        <Card className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">{deal.customerName}</h2>
              <p className="text-sm text-muted-foreground">{deal.vehicle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={deal.opsScore >= 90 ? "bg-green-500/10 text-green-500 border-green-500/20" : deal.opsScore >= 80 ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}>
                <Star className="w-3 h-3 mr-1" /> OPS Score: {deal.opsScore}
              </Badge>
              <Badge variant="outline">{deal.dealType}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs">
            {[
              { icon: Calendar, label: "Deal Date", value: deal.dealDate },
              { icon: User, label: "F&I Manager", value: deal.fiManager },
              { icon: DollarSign, label: "Sale Price", value: `$${deal.salePrice.toLocaleString()}` },
              { icon: CreditCard, label: "Financed", value: `$${deal.amountFinanced.toLocaleString()}` },
              { icon: Building2, label: "Lender", value: deal.lender },
              { icon: Car, label: "Payment", value: `$${deal.monthlyPayment}/mo × ${deal.term}mo @ ${deal.rate}%` },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                  <item.icon className="w-3 h-3" />
                  <span>{item.label}</span>
                </div>
                <p className="font-medium text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Document Checklist */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Document Checklist
              </h3>
              <Badge variant="outline" className={docCompletion === 100 ? "text-green-500 border-green-500/20" : "text-yellow-500 border-yellow-500/20"}>
                {docCompletion}% Complete
              </Badge>
            </div>
            <div className="space-y-2">
              {deal.documents.map(doc => (
                <div key={doc.name} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                  {statusIcon(doc.status)}
                  <span className="text-xs text-foreground flex-1">{doc.name}</span>
                  <span className={`text-[10px] font-medium ${doc.status === "complete" ? "text-green-500" : doc.status === "pending" ? "text-yellow-500" : "text-red-500"}`}>
                    {doc.status === "complete" ? "Complete" : doc.status === "pending" ? "Pending" : "Missing"}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Product Summary */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-green-500" /> Products Sold
            </h3>
            {deal.products.length === 0 ? (
              <p className="text-xs text-muted-foreground">No products sold on this deal.</p>
            ) : (
              <div className="space-y-2">
                {deal.products.map(p => (
                  <div key={p.name} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{p.name}</span>
                        {p.firstTimeBuyer && <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 text-purple-500 border-purple-500/20">New</Badge>}
                      </div>
                      <span className="text-[10px] text-muted-foreground">Cost: ${p.cost.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-foreground">${p.price.toLocaleString()}</p>
                      <p className="text-[10px] text-green-500">+${p.grossProfit.toLocaleString()} profit</p>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 text-xs font-bold text-foreground">
                  <span>Total Back Gross</span>
                  <span className="text-green-500">${deal.products.reduce((s, p) => s + p.grossProfit, 0).toLocaleString()}</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compliance Check */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-blue-500" /> Compliance Check
            </h3>
            {deal.complianceFlags.length === 0 ? (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="w-5 h-5" />
                <span className="text-xs font-medium">All compliance checks passed</span>
              </div>
            ) : (
              <div className="space-y-2">
                {deal.complianceFlags.map((f, i) => (
                  <div key={i} className={`p-2.5 rounded-lg border text-xs ${f.severity === "critical" ? "bg-red-500/10 border-red-500/20 text-red-400" : f.severity === "warning" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" : "bg-blue-500/10 border-blue-500/20 text-blue-400"}`}>
                    <div className="flex items-center gap-1.5 font-medium mb-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      {f.rule}
                    </div>
                    <p className="text-muted-foreground">{f.message}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Deal Financials */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Deal Financials</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={grossChartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {grossChartData.map((_, i) => <Cell key={i} fill={grossColors[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
              <div><p className="text-muted-foreground">Front</p><p className="font-bold text-blue-500">${deal.frontGross.toLocaleString()}</p></div>
              <div><p className="text-muted-foreground">Back</p><p className="font-bold text-green-500">${deal.backGross.toLocaleString()}</p></div>
              <div><p className="text-muted-foreground">Total</p><p className="font-bold text-purple-500">${totalGross.toLocaleString()}</p></div>
            </div>
          </Card>

          {/* Deal Timeline */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-orange-500" /> Deal Timeline
            </h3>
            <div className="space-y-3">
              {deal.timeline.map((event, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full border-2 ${event.status === "completed" ? "bg-green-500 border-green-500" : event.status === "current" ? "bg-primary border-primary animate-pulse" : "bg-transparent border-muted-foreground"}`} />
                    {i < deal.timeline.length - 1 && <div className="w-0.5 h-6 bg-border" />}
                  </div>
                  <div className="flex-1 -mt-0.5">
                    <p className={`text-xs font-medium ${event.status === "pending" ? "text-muted-foreground" : "text-foreground"}`}>{event.label}</p>
                    {event.timestamp && <p className="text-[10px] text-muted-foreground">{event.timestamp}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
