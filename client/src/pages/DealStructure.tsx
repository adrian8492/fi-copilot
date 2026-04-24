import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import {
  Calculator,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Save,
  Trash2,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Percent,
  CreditCard,
  Car,
  Sparkles,
  Building2,
  Clock,
  Target,
  Zap,
} from "lucide-react";

// ── Lender Data ─────────────────────────────────────────────────────
interface Lender {
  name: string;
  buyRates: Record<string, number>; // keyed by tier
  sellRateCap: number;
  minScore: number;
  maxScore: number;
  maxTerm: number;
  maxLTV: number;
  approvalSpeed: string;
}

const LENDERS: Lender[] = [
  { name: "Capital One Auto", buyRates: { superPrime: 4.49, prime: 5.99, nearPrime: 8.49, subPrime: 12.99, deepSub: 18.99 }, sellRateCap: 2.5, minScore: 500, maxScore: 850, maxTerm: 84, maxLTV: 130, approvalSpeed: "< 1 hr" },
  { name: "Ally Financial", buyRates: { superPrime: 4.29, prime: 5.79, nearPrime: 8.29, subPrime: 13.49, deepSub: 19.49 }, sellRateCap: 2.5, minScore: 520, maxScore: 850, maxTerm: 84, maxLTV: 125, approvalSpeed: "< 2 hrs" },
  { name: "Chase Auto", buyRates: { superPrime: 3.99, prime: 5.49, nearPrime: 7.99, subPrime: 12.49, deepSub: 0 }, sellRateCap: 2.0, minScore: 600, maxScore: 850, maxTerm: 72, maxLTV: 120, approvalSpeed: "< 1 hr" },
  { name: "Wells Fargo Dealer", buyRates: { superPrime: 4.19, prime: 5.69, nearPrime: 8.19, subPrime: 13.29, deepSub: 0 }, sellRateCap: 2.5, minScore: 580, maxScore: 850, maxTerm: 84, maxLTV: 125, approvalSpeed: "< 2 hrs" },
  { name: "TD Auto Finance", buyRates: { superPrime: 4.39, prime: 5.89, nearPrime: 8.39, subPrime: 13.89, deepSub: 19.99 }, sellRateCap: 2.0, minScore: 500, maxScore: 850, maxTerm: 72, maxLTV: 130, approvalSpeed: "< 3 hrs" },
  { name: "US Bank Dealer", buyRates: { superPrime: 4.09, prime: 5.59, nearPrime: 8.09, subPrime: 0, deepSub: 0 }, sellRateCap: 2.5, minScore: 640, maxScore: 850, maxTerm: 84, maxLTV: 120, approvalSpeed: "< 1 hr" },
  { name: "Westlake Financial", buyRates: { superPrime: 0, prime: 0, nearPrime: 9.99, subPrime: 14.99, deepSub: 21.99 }, sellRateCap: 3.0, minScore: 450, maxScore: 680, maxTerm: 72, maxLTV: 140, approvalSpeed: "< 4 hrs" },
  { name: "Regional Acceptance", buyRates: { superPrime: 0, prime: 0, nearPrime: 10.49, subPrime: 15.49, deepSub: 22.49 }, sellRateCap: 3.0, minScore: 450, maxScore: 680, maxTerm: 72, maxLTV: 145, approvalSpeed: "Same day" },
  { name: "Bank of America", buyRates: { superPrime: 3.89, prime: 5.39, nearPrime: 7.89, subPrime: 0, deepSub: 0 }, sellRateCap: 2.0, minScore: 620, maxScore: 850, maxTerm: 75, maxLTV: 115, approvalSpeed: "< 1 hr" },
  { name: "Credit Union Direct", buyRates: { superPrime: 3.49, prime: 4.99, nearPrime: 7.49, subPrime: 11.99, deepSub: 0 }, sellRateCap: 1.5, minScore: 560, maxScore: 850, maxTerm: 84, maxLTV: 110, approvalSpeed: "< 2 hrs" },
];

// ── Products ────────────────────────────────────────────────────────
interface Product {
  name: string;
  price: number;
  abbrev: string;
}

const PRODUCTS: Product[] = [
  { name: "Vehicle Service Contract", price: 2495, abbrev: "VSC" },
  { name: "GAP Insurance", price: 995, abbrev: "GAP" },
  { name: "Paint Protection", price: 695, abbrev: "PPF" },
  { name: "Tire & Wheel", price: 795, abbrev: "T&W" },
  { name: "Theft Deterrent", price: 395, abbrev: "THF" },
  { name: "Windshield Protection", price: 295, abbrev: "WND" },
  { name: "Key Replacement", price: 495, abbrev: "KEY" },
  { name: "Maintenance Plan", price: 595, abbrev: "MNT" },
  { name: "Ding Shield", price: 395, abbrev: "DNG" },
  { name: "Interior Protection", price: 295, abbrev: "INT" },
];

// ── Saved Structure ─────────────────────────────────────────────────
interface SavedStructure {
  id: string;
  timestamp: number;
  salePrice: number;
  downPayment: number;
  tradeEquity: number;
  creditScore: number;
  term: number;
  targetPayment: number;
  targetPvr: number;
  selectedProducts: string[];
  amountFinanced: number;
  sellRate: number;
}

const STORAGE_KEY = "fi-copilot-deal-structures";

function loadStructures(): SavedStructure[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStructures(structures: SavedStructure[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(structures.slice(0, 10)));
}

// ── Helpers ─────────────────────────────────────────────────────────
type CreditTier = "superPrime" | "prime" | "nearPrime" | "subPrime" | "deepSub";

function getTier(score: number): CreditTier {
  if (score >= 780) return "superPrime";
  if (score >= 720) return "prime";
  if (score >= 660) return "nearPrime";
  if (score >= 580) return "subPrime";
  return "deepSub";
}

function tierLabel(tier: CreditTier): string {
  const labels: Record<CreditTier, string> = {
    superPrime: "Super Prime",
    prime: "Prime",
    nearPrime: "Near Prime",
    subPrime: "Sub Prime",
    deepSub: "Deep Sub",
  };
  return labels[tier];
}

function calcPayment(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) return principal / months;
  const r = annualRate / 100 / 12;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function calcReserve(sellRate: number, buyRate: number, amountFinanced: number): number {
  return ((sellRate - buyRate) * amountFinanced) / 2400;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDec(n: number, d = 2): string {
  return n.toFixed(d);
}

// ── Component ───────────────────────────────────────────────────────
export default function DealStructure() {
  // Inputs
  const [salePrice, setSalePrice] = useState(35000);
  const [downPayment, setDownPayment] = useState(3000);
  const [tradeEquity, setTradeEquity] = useState(2000);
  const [creditScore, setCreditScore] = useState(720);
  const [term, setTerm] = useState(60);
  const [targetPayment, setTargetPayment] = useState(550);
  const [targetPvr, setTargetPvr] = useState(1800);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(["VSC", "GAP"]);
  const [savedStructures, setSavedStructures] = useState<SavedStructure[]>([]);

  useEffect(() => {
    setSavedStructures(loadStructures());
  }, []);

  const tier = useMemo(() => getTier(creditScore), [creditScore]);

  // Find best lender for this tier
  const eligibleLenders = useMemo(() => {
    return LENDERS.filter(
      (l) => l.buyRates[tier] > 0 && creditScore >= l.minScore && creditScore <= l.maxScore
    ).sort((a, b) => a.buyRates[tier] - b.buyRates[tier]);
  }, [tier, creditScore]);

  const bestLender = eligibleLenders[0] ?? null;
  const buyRate = bestLender ? bestLender.buyRates[tier] : 6.99;
  const maxMarkup = bestLender ? bestLender.sellRateCap : 2.0;
  const sellRate = buyRate + maxMarkup;
  const midRate = buyRate + maxMarkup / 2;

  const productTotal = useMemo(() => {
    return PRODUCTS.filter((p) => selectedProducts.includes(p.abbrev)).reduce(
      (sum, p) => sum + p.price,
      0
    );
  }, [selectedProducts]);

  const amountFinanced = salePrice - downPayment - tradeEquity + productTotal;

  const reserveAmount = useMemo(
    () => calcReserve(sellRate, buyRate, amountFinanced),
    [sellRate, buyRate, amountFinanced]
  );

  const currentBackGross = reserveAmount + productTotal;
  const pvrGap = Math.max(0, targetPvr - currentBackGross);

  // Payment grid: 3 rates x 3 terms
  const rates = useMemo(() => [buyRate, midRate, sellRate], [buyRate, midRate, sellRate]);
  const terms = [48, 60, 72];
  const paymentGrid = useMemo(() => {
    return rates.map((rate) => ({
      rate,
      payments: terms.map((t) => ({
        term: t,
        payment: calcPayment(amountFinanced, rate, t),
      })),
    }));
  }, [rates, amountFinanced]);

  // Product affordability
  const basePayment = calcPayment(amountFinanced - productTotal, sellRate, term);
  const paymentBudgetRemaining = targetPayment - basePayment;
  const paymentPerDollar = basePayment / (amountFinanced - productTotal || 1);

  const affordableProducts = useMemo(() => {
    return PRODUCTS.filter((p) => !selectedProducts.includes(p.abbrev))
      .map((p) => ({
        ...p,
        monthlyImpact: calcPayment(amountFinanced - productTotal + p.price, sellRate, term) - basePayment,
        fits: calcPayment(amountFinanced - productTotal + p.price, sellRate, term) <= targetPayment,
      }))
      .sort((a, b) => a.monthlyImpact - b.monthlyImpact);
  }, [selectedProducts, amountFinanced, productTotal, sellRate, term, basePayment, targetPayment]);

  // Structure optimizer
  const optimizedStructure = useMemo(() => {
    // Try to find best rate/term/product combo that hits both targets
    const combos: {
      rate: number;
      rateName: string;
      term: number;
      products: string[];
      payment: number;
      pvr: number;
      score: number;
    }[] = [];

    const rateOptions = [
      { rate: sellRate, name: "Max Markup" },
      { rate: midRate, name: "Mid Markup" },
      { rate: buyRate, name: "Buy Rate" },
    ];

    const termOptions = [48, 60, 72, 84];

    for (const ro of rateOptions) {
      for (const t of termOptions) {
        // Try adding products greedily by price desc
        const sortedProducts = [...PRODUCTS].sort((a, b) => b.price - a.price);
        const chosen: string[] = [];
        let pTotal = 0;

        for (const prod of sortedProducts) {
          const testAf = salePrice - downPayment - tradeEquity + pTotal + prod.price;
          const testPayment = calcPayment(testAf, ro.rate, t);
          if (testPayment <= targetPayment) {
            chosen.push(prod.abbrev);
            pTotal += prod.price;
          }
        }

        const af = salePrice - downPayment - tradeEquity + pTotal;
        const payment = calcPayment(af, ro.rate, t);
        const reserve = calcReserve(ro.rate, buyRate, af);
        const pvr = reserve + pTotal;

        const paymentOk = payment <= targetPayment ? 1 : 0;
        const pvrOk = pvr >= targetPvr ? 1 : 0;
        const score = paymentOk * 50 + pvrOk * 50 + pvr / 100 - Math.abs(payment - targetPayment) / 10;

        combos.push({ rate: ro.rate, rateName: ro.name, term: t, products: chosen, payment, pvr, score });
      }
    }

    combos.sort((a, b) => b.score - a.score);
    return combos[0] ?? null;
  }, [salePrice, downPayment, tradeEquity, sellRate, midRate, buyRate, targetPayment, targetPvr]);

  // Deal health
  const dealHealth = useMemo(() => {
    const actualPayment = calcPayment(amountFinanced, sellRate, term);
    const rateHeadroom = maxMarkup;
    const paymentBuffer = targetPayment - actualPayment;
    const productCount = selectedProducts.length;

    let score = 0;
    // Rate headroom (0-35 pts)
    if (rateHeadroom >= 2.0) score += 35;
    else if (rateHeadroom >= 1.5) score += 25;
    else if (rateHeadroom >= 1.0) score += 15;
    else score += 5;
    // Payment buffer (0-35 pts)
    if (paymentBuffer >= 50) score += 35;
    else if (paymentBuffer >= 0) score += 25;
    else if (paymentBuffer >= -25) score += 15;
    else score += 0;
    // Product count (0-30 pts)
    if (productCount >= 4) score += 30;
    else if (productCount >= 3) score += 25;
    else if (productCount >= 2) score += 20;
    else if (productCount >= 1) score += 10;
    else score += 0;

    const level: "green" | "yellow" | "red" = score >= 70 ? "green" : score >= 45 ? "yellow" : "red";
    return { score, level, rateHeadroom, paymentBuffer, productCount, actualPayment };
  }, [amountFinanced, sellRate, term, maxMarkup, targetPayment, selectedProducts]);

  const healthColors = {
    green: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", label: "Strong Deal" },
    yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", label: "Marginal Deal" },
    red: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", label: "At-Risk Deal" },
  };

  const healthStyle = healthColors[dealHealth.level];

  function toggleProduct(abbrev: string) {
    setSelectedProducts((prev) =>
      prev.includes(abbrev) ? prev.filter((a) => a !== abbrev) : [...prev, abbrev]
    );
  }

  function handleSave() {
    const entry: SavedStructure = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      salePrice,
      downPayment,
      tradeEquity,
      creditScore,
      term,
      targetPayment,
      targetPvr,
      selectedProducts,
      amountFinanced,
      sellRate,
    };
    const updated = [entry, ...savedStructures].slice(0, 10);
    setSavedStructures(updated);
    saveStructures(updated);
  }

  function handleLoad(s: SavedStructure) {
    setSalePrice(s.salePrice);
    setDownPayment(s.downPayment);
    setTradeEquity(s.tradeEquity);
    setCreditScore(s.creditScore);
    setTerm(s.term);
    setTargetPayment(s.targetPayment);
    setTargetPvr(s.targetPvr);
    setSelectedProducts(s.selectedProducts);
  }

  function handleDelete(id: string) {
    const updated = savedStructures.filter((s) => s.id !== id);
    setSavedStructures(updated);
    saveStructures(updated);
  }

  // ── Input field helper ────────────────────────────────────────────
  function InputField({
    label,
    value,
    onChange,
    prefix,
    suffix,
    min,
    max,
    step,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    prefix?: string;
    suffix?: string;
    min?: number;
    max?: number;
    step?: number;
  }) {
    return (
      <div>
        <label className="block text-xs text-slate-400 mb-1">{label}</label>
        <div className="flex items-center gap-1 rounded-lg bg-slate-800/60 border border-slate-700/50 px-3 py-2">
          {prefix && <span className="text-slate-500 text-sm">{prefix}</span>}
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step ?? 1}
            className="w-full bg-transparent text-white text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {suffix && <span className="text-slate-500 text-sm">{suffix}</span>}
        </div>
      </div>
    );
  }

  return (
    <AppLayout title="Deal Structuring Calculator" subtitle="Optimize deal structure for maximum PVR within payment targets">
      <div className="space-y-6">
        {/* ── Deal Health Indicator ──────────────────────────────────── */}
        <Card className={`p-4 ${healthStyle.bg} border ${healthStyle.border}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {dealHealth.level === "green" && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
              {dealHealth.level === "yellow" && <AlertTriangle className="w-6 h-6 text-yellow-400" />}
              {dealHealth.level === "red" && <XCircle className="w-6 h-6 text-red-400" />}
              <div>
                <p className={`font-semibold ${healthStyle.text}`}>{healthStyle.label}</p>
                <p className="text-xs text-slate-400">Score: {dealHealth.score}/100</p>
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <p className="text-slate-400 text-xs">Rate Headroom</p>
                <p className="text-white font-medium">{fmtDec(dealHealth.rateHeadroom)}%</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-xs">Payment Buffer</p>
                <p className={`font-medium ${dealHealth.paymentBuffer >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  ${fmtDec(dealHealth.paymentBuffer, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-xs">Products</p>
                <p className="text-white font-medium">{dealHealth.productCount}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-xs">Monthly Payment</p>
                <p className="text-white font-medium">${fmtDec(dealHealth.actualPayment, 0)}</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Structure
            </button>
          </div>
        </Card>

        {/* ── Main Grid: Inputs + Outputs ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <Card className="p-5 bg-slate-900/50 border-slate-700/50">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-blue-400" />
              <h2 className="text-white font-semibold">Deal Inputs</h2>
            </div>
            <div className="space-y-3">
              <InputField label="Vehicle Sale Price" value={salePrice} onChange={setSalePrice} prefix="$" min={0} step={500} />
              <InputField label="Down Payment" value={downPayment} onChange={setDownPayment} prefix="$" min={0} step={250} />
              <InputField label="Trade-In Equity" value={tradeEquity} onChange={setTradeEquity} prefix="$" min={0} step={250} />
              <InputField label="Credit Score" value={creditScore} onChange={setCreditScore} min={300} max={850} />
              <div>
                <label className="block text-xs text-slate-400 mb-1">Desired Term (months)</label>
                <div className="flex gap-2">
                  {[48, 60, 72, 84].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTerm(t)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        term === t
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <InputField label="Target Monthly Payment" value={targetPayment} onChange={setTargetPayment} prefix="$" min={0} step={25} />
              <InputField label="Target PVR" value={targetPvr} onChange={setTargetPvr} prefix="$" min={0} step={100} />
            </div>

            {/* Credit Tier Badge */}
            <div className="mt-4 p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Credit Tier</span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    tier === "superPrime"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : tier === "prime"
                      ? "bg-blue-500/20 text-blue-400"
                      : tier === "nearPrime"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : tier === "subPrime"
                      ? "bg-orange-500/20 text-orange-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {tierLabel(tier)}
                </span>
              </div>
            </div>
          </Card>

          {/* Output Panel */}
          <Card className="p-5 bg-slate-900/50 border-slate-700/50">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className="text-white font-semibold">Deal Output</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                <span className="text-sm text-slate-400">Amount Financed</span>
                <span className="text-white font-semibold">${fmt(amountFinanced)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                <span className="text-sm text-slate-400">Buy Rate ({bestLender?.name ?? "N/A"})</span>
                <span className="text-white font-semibold">{fmtDec(buyRate)}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                <span className="text-sm text-slate-400">Sell Rate (max markup)</span>
                <span className="text-blue-400 font-semibold">{fmtDec(sellRate)}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                <span className="text-sm text-slate-400">Reserve Amount</span>
                <span className="text-emerald-400 font-semibold">${fmt(Math.round(reserveAmount))}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                <span className="text-sm text-slate-400">Product Revenue</span>
                <span className="text-emerald-400 font-semibold">${fmt(productTotal)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                <span className="text-sm text-slate-400">Current Back Gross</span>
                <span className="text-white font-bold">${fmt(Math.round(currentBackGross))}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                <span className="text-sm text-slate-400">PVR Gap to Target</span>
                <span className={`font-semibold ${pvrGap > 0 ? "text-yellow-400" : "text-emerald-400"}`}>
                  {pvrGap > 0 ? `-$${fmt(Math.round(pvrGap))}` : "Target Met"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-400">Monthly Payment</span>
                <span className={`text-lg font-bold ${dealHealth.actualPayment <= targetPayment ? "text-emerald-400" : "text-red-400"}`}>
                  ${fmtDec(dealHealth.actualPayment, 0)}/mo
                </span>
              </div>
            </div>

            {/* Products needed hint */}
            {pvrGap > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-400 font-medium mb-1">Products needed to hit PVR target:</p>
                <p className="text-xs text-slate-400">
                  Add ~${fmt(Math.round(pvrGap))} in product revenue. Consider:{" "}
                  {PRODUCTS.filter((p) => !selectedProducts.includes(p.abbrev))
                    .sort((a, b) => b.price - a.price)
                    .slice(0, 3)
                    .map((p) => `${p.abbrev} ($${fmt(p.price)})`)
                    .join(", ")}
                </p>
              </div>
            )}
          </Card>

          {/* Lender Recommendations */}
          <Card className="p-5 bg-slate-900/50 border-slate-700/50">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-purple-400" />
              <h2 className="text-white font-semibold">Top 3 Lenders</h2>
            </div>
            {eligibleLenders.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No lenders available for this credit profile.</p>
            ) : (
              <div className="space-y-3">
                {eligibleLenders.slice(0, 3).map((lender, i) => {
                  const lBuyRate = lender.buyRates[tier];
                  const lSellRate = lBuyRate + lender.sellRateCap;
                  const lReserve = calcReserve(lSellRate, lBuyRate, amountFinanced);
                  const lPayment = calcPayment(amountFinanced, lSellRate, term);

                  return (
                    <div
                      key={lender.name}
                      className={`p-3 rounded-lg border ${
                        i === 0
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-slate-800/30 border-slate-700/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {i === 0 && <Sparkles className="w-4 h-4 text-emerald-400" />}
                          <span className="text-sm text-white font-medium">{lender.name}</span>
                        </div>
                        <span className="text-xs text-slate-500">#{i + 1}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Buy</span>
                          <span className="text-slate-300">{fmtDec(lBuyRate)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Sell Cap</span>
                          <span className="text-slate-300">{fmtDec(lSellRate)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Reserve</span>
                          <span className="text-emerald-400">${fmt(Math.round(lReserve))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Payment</span>
                          <span className="text-slate-300">${fmtDec(lPayment, 0)}/mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Max Term</span>
                          <span className="text-slate-300">{lender.maxTerm}mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Speed</span>
                          <span className="text-slate-300">{lender.approvalSpeed}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ── Payment Breakdown Grid ────────────────────────────────── */}
        <Card className="p-5 bg-slate-900/50 border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            <h2 className="text-white font-semibold">Payment Breakdown</h2>
            <span className="text-xs text-slate-500 ml-2">3 rates x 3 terms</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-slate-400 font-medium py-2 pr-4">Rate</th>
                  {terms.map((t) => (
                    <th key={t} className="text-center text-slate-400 font-medium py-2 px-3">
                      {t} months
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paymentGrid.map((row, ri) => (
                  <tr key={ri} className="border-b border-slate-700/20">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Percent className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-white font-medium">{fmtDec(row.rate)}%</span>
                        <span className="text-xs text-slate-500">
                          {ri === 0 ? "(buy)" : ri === 1 ? "(mid)" : "(cap)"}
                        </span>
                      </div>
                    </td>
                    {row.payments.map((cell) => {
                      const withinTarget = cell.payment <= targetPayment;
                      return (
                        <td key={cell.term} className="text-center py-3 px-3">
                          <span
                            className={`inline-block px-3 py-1.5 rounded-lg text-sm font-semibold ${
                              withinTarget
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            ${fmtDec(cell.payment, 0)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Green = within ${fmt(targetPayment)}/mo target &middot; Amount financed: ${fmt(amountFinanced)}
          </p>
        </Card>

        {/* ── Product Selection + Affordability ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Selection */}
          <Card className="p-5 bg-slate-900/50 border-slate-700/50">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h2 className="text-white font-semibold">F&I Products</h2>
              <span className="ml-auto text-xs text-slate-500">
                {selectedProducts.length} selected &middot; ${fmt(productTotal)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRODUCTS.map((p) => {
                const isSelected = selectedProducts.includes(p.abbrev);
                return (
                  <button
                    key={p.abbrev}
                    onClick={() => toggleProduct(p.abbrev)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "bg-blue-600/10 border-blue-500/30 ring-1 ring-blue-500/20"
                        : "bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${isSelected ? "text-blue-400" : "text-slate-400"}`}>
                        {p.abbrev}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{p.name}</p>
                    <p className={`text-sm font-semibold mt-1 ${isSelected ? "text-white" : "text-slate-300"}`}>
                      ${fmt(p.price)}
                    </p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Product Affordability */}
          <Card className="p-5 bg-slate-900/50 border-slate-700/50">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-amber-400" />
              <h2 className="text-white font-semibold">Product Affordability</h2>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Payment budget remaining: <span className={paymentBudgetRemaining >= 0 ? "text-emerald-400" : "text-red-400"}>
                ${fmtDec(paymentBudgetRemaining, 0)}/mo
              </span>{" "}
              (at {fmtDec(sellRate)}% / {term}mo)
            </p>
            <div className="space-y-2">
              {affordableProducts.map((p) => (
                <div
                  key={p.abbrev}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    p.fits
                      ? "bg-emerald-500/5 border-emerald-500/20"
                      : "bg-slate-800/20 border-slate-700/20 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {p.fits ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm text-white font-medium">{p.name}</p>
                      <p className="text-xs text-slate-500">${fmt(p.price)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${p.fits ? "text-emerald-400" : "text-red-400"}`}>
                      +${fmtDec(p.monthlyImpact, 0)}/mo
                    </p>
                    {p.fits && (
                      <button
                        onClick={() => toggleProduct(p.abbrev)}
                        className="text-xs text-blue-400 hover:text-blue-300 mt-0.5"
                      >
                        Add to deal
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {affordableProducts.length === 0 && (
                <p className="text-sm text-slate-500 italic text-center py-4">All products already selected.</p>
              )}
            </div>
          </Card>
        </div>

        {/* ── Structure Optimizer ────────────────────────────────────── */}
        {optimizedStructure && (
          <Card className="p-5 bg-slate-900/50 border-slate-700/50">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-white font-semibold">Optimized Structure Suggestion</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="text-center p-3 rounded-lg bg-slate-800/30">
                <p className="text-xs text-slate-500 mb-1">Rate Strategy</p>
                <p className="text-sm text-white font-semibold">{optimizedStructure.rateName}</p>
                <p className="text-xs text-blue-400">{fmtDec(optimizedStructure.rate)}%</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-800/30">
                <p className="text-xs text-slate-500 mb-1">Term</p>
                <p className="text-sm text-white font-semibold">{optimizedStructure.term} months</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-800/30">
                <p className="text-xs text-slate-500 mb-1">Payment</p>
                <p className={`text-sm font-semibold ${optimizedStructure.payment <= targetPayment ? "text-emerald-400" : "text-red-400"}`}>
                  ${fmtDec(optimizedStructure.payment, 0)}/mo
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-800/30">
                <p className="text-xs text-slate-500 mb-1">PVR</p>
                <p className={`text-sm font-semibold ${optimizedStructure.pvr >= targetPvr ? "text-emerald-400" : "text-yellow-400"}`}>
                  ${fmt(Math.round(optimizedStructure.pvr))}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-800/30 col-span-2 md:col-span-3 lg:col-span-3">
                <p className="text-xs text-slate-500 mb-1">Recommended Products ({optimizedStructure.products.length})</p>
                <div className="flex flex-wrap gap-1 justify-center mt-1">
                  {optimizedStructure.products.length > 0 ? (
                    optimizedStructure.products.map((abbrev) => (
                      <span
                        key={abbrev}
                        className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20"
                      >
                        {abbrev}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">None fit within budget</span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  setTerm(optimizedStructure.term);
                  setSelectedProducts(optimizedStructure.products);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
                Apply This Structure
              </button>
              <span className="text-xs text-slate-500">Applies recommended term and product selection</span>
            </div>
          </Card>
        )}

        {/* ── Reserve Calculator Detail ─────────────────────────────── */}
        <Card className="p-5 bg-slate-900/50 border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h2 className="text-white font-semibold">Reserve Calculator</h2>
            <span className="text-xs text-slate-500 ml-2">
              (Sell Rate - Buy Rate) x Amount Financed / 2,400
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-slate-400 font-medium py-2">Markup</th>
                  <th className="text-center text-slate-400 font-medium py-2">Sell Rate</th>
                  <th className="text-center text-slate-400 font-medium py-2">Spread</th>
                  <th className="text-right text-slate-400 font-medium py-2">Reserve</th>
                </tr>
              </thead>
              <tbody>
                {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0].filter((m) => m <= maxMarkup + 0.5).map((markup) => {
                  const sr = buyRate + markup;
                  const res = calcReserve(sr, buyRate, amountFinanced);
                  const isMax = markup === maxMarkup;
                  return (
                    <tr
                      key={markup}
                      className={`border-b border-slate-700/20 ${isMax ? "bg-emerald-500/5" : ""}`}
                    >
                      <td className="py-2">
                        <span className="text-white">+{fmtDec(markup, 1)}%</span>
                        {isMax && (
                          <span className="ml-2 text-xs text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            Max
                          </span>
                        )}
                      </td>
                      <td className="text-center text-slate-300">{fmtDec(sr)}%</td>
                      <td className="text-center text-slate-300">{fmtDec(markup, 1)}%</td>
                      <td className="text-right text-emerald-400 font-semibold">${fmt(Math.round(res))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ── Saved Structures ──────────────────────────────────────── */}
        {savedStructures.length > 0 && (
          <Card className="p-5 bg-slate-900/50 border-slate-700/50">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-slate-400" />
              <h2 className="text-white font-semibold">Saved Structures</h2>
              <span className="text-xs text-slate-500 ml-2">Last {savedStructures.length} of 10</span>
            </div>
            <div className="space-y-2">
              {savedStructures.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/20"
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <p className="text-xs text-slate-500">
                        {new Date(s.timestamp).toLocaleDateString()} {new Date(s.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <span className="text-slate-400">
                        Sale: <span className="text-white">${fmt(s.salePrice)}</span>
                      </span>
                      <span className="text-slate-400">
                        Score: <span className="text-white">{s.creditScore}</span>
                      </span>
                      <span className="text-slate-400">
                        AF: <span className="text-white">${fmt(s.amountFinanced)}</span>
                      </span>
                      <span className="text-slate-400">
                        Products: <span className="text-white">{s.selectedProducts.join(", ")}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleLoad(s)}
                      className="px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-600/30 transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
