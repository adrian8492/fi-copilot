import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Package,
  Users,
  TrendingUp,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

// Phase 5c: in-app DPA version. Bump when the legal text in
// content/legal/dpa-template-v1.md changes; older signatures roll forward
// only after re-acceptance.
const CURRENT_DPA_VERSION = "v1";

const STEPS = [
  { num: 1, title: "Dealership Profile", icon: Building2 },
  { num: 2, title: "Product Menu", icon: Package },
  { num: 3, title: "F&I Team", icon: Users },
  { num: 4, title: "Baseline Metrics", icon: TrendingUp },
  { num: 5, title: "Coaching Cadence", icon: CalendarClock },
] as const;

const PRODUCT_TYPES = [
  "vehicle_service_contract",
  "gap_insurance",
  "prepaid_maintenance",
  "interior_exterior_protection",
  "road_hazard",
  "paintless_dent_repair",
  "key_replacement",
  "windshield_protection",
  "lease_wear_tear",
  "tire_wheel",
  "theft_protection",
  "other",
] as const;

type ProductType = (typeof PRODUCT_TYPES)[number];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const status = trpc.onboarding.getStatus.useQuery();

  const [step, setStep] = useState(1);

  // Step 1 state
  const [location, setLocation] = useState("");
  const [brandMix, setBrandMix] = useState("");
  const [unitVolume, setUnitVolume] = useState("");
  const [pruBaseline, setPruBaseline] = useState("");
  const [pruTarget, setPruTarget] = useState("");
  const [dpaAccepted, setDpaAccepted] = useState(false);

  // Step 2 state
  const [products, setProducts] = useState<
    { productType: ProductType; displayName: string; retailPrice: string }[]
  >([
    { productType: "vehicle_service_contract", displayName: "VSA", retailPrice: "" },
    { productType: "gap_insurance", displayName: "GAP", retailPrice: "" },
  ]);

  // Step 3 state
  const [managers, setManagers] = useState<
    { name: string; email: string; role: "user" | "admin" }[]
  >([{ name: "", email: "", role: "user" }]);

  // Step 4 state
  const [vsaPen, setVsaPen] = useState("");
  const [gapPen, setGapPen] = useState("");
  const [appPen, setAppPen] = useState("");
  const [chargeback, setChargeback] = useState("");
  const [citAging, setCitAging] = useState("");

  // Step 5 state
  const [cadenceDay, setCadenceDay] = useState<string>("monday");
  const [cadenceTime, setCadenceTime] = useState("09:00");
  const [runBy, setRunBy] = useState<string>("fi_director");
  const [pru90, setPru90] = useState("");

  const saveProfile = trpc.onboarding.saveProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile saved");
      setStep(2);
    },
    onError: (e) => toast.error(e.message),
  });
  const saveProducts = trpc.onboarding.saveProducts.useMutation({
    onSuccess: () => {
      toast.success("Product menu saved");
      setStep(3);
    },
    onError: (e) => toast.error(e.message),
  });
  const saveTeam = trpc.onboarding.saveTeam.useMutation({
    onSuccess: (res) => {
      toast.success(`${res.invites.length} invite${res.invites.length === 1 ? "" : "s"} created`);
      setStep(4);
    },
    onError: (e) => toast.error(e.message),
  });
  const saveBaseline = trpc.onboarding.saveBaseline.useMutation({
    onSuccess: () => {
      toast.success("Baseline metrics saved");
      setStep(5);
    },
    onError: (e) => toast.error(e.message),
  });
  const saveCadence = trpc.onboarding.saveCadence.useMutation({
    onSuccess: () => {
      toast.success("Onboarding complete!");
      navigate("/");
    },
    onError: (e) => toast.error(e.message),
  });

  // Resume the wizard at the user's last completed step + 1.
  useEffect(() => {
    if (status.data?.hasDealership) {
      const next = Math.min(5, (status.data.dealership.onboardingStep ?? 0) + 1);
      setStep(next);
    }
  }, [status.data]);

  // Redirect already-onboarded users away from this page.
  useEffect(() => {
    if (status.data?.hasDealership && status.data.dealership.onboardingComplete) {
      navigate("/");
    }
  }, [status.data, navigate]);

  const progressPct = useMemo(() => Math.round(((step - 1) / 5) * 100), [step]);

  if (authLoading || status.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  if (!status.data?.hasDealership) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <h2 className="text-lg font-semibold mb-2">No dealership assigned</h2>
            <p className="text-sm text-muted-foreground">
              Your account is not yet attached to a dealership. Contact your
              ASURA coach or admin to get set up.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const submitProfile = () => {
    if (!dpaAccepted) {
      toast.error("You must confirm the Data Processing Addendum to proceed.");
      return;
    }
    saveProfile.mutate({
      location: location.trim(),
      brandMix: brandMix.split(",").map((s) => s.trim()).filter(Boolean),
      unitVolumeMonthly: parseInt(unitVolume, 10) || 0,
      pruBaseline: parseInt(pruBaseline, 10) || 0,
      pruTarget: pruTarget ? parseInt(pruTarget, 10) : undefined,
      dpaAccepted: true as const,
      dpaVersion: CURRENT_DPA_VERSION,
    });
  };

  const submitProducts = () => {
    saveProducts.mutate({
      items: products
        .filter((p) => p.displayName.trim())
        .map((p) => ({
          productType: p.productType,
          displayName: p.displayName.trim(),
          retailPrice: p.retailPrice ? parseFloat(p.retailPrice) : null,
        })),
    });
  };

  const submitTeam = () => {
    saveTeam.mutate({
      managers: managers
        .filter((m) => m.email.trim() && m.name.trim())
        .map((m) => ({ name: m.name.trim(), email: m.email.trim(), role: m.role })),
    });
  };

  const submitBaseline = () => {
    saveBaseline.mutate({
      vsaPenBaseline: vsaPen ? parseFloat(vsaPen) : undefined,
      gapPenBaseline: gapPen ? parseFloat(gapPen) : undefined,
      appearancePenBaseline: appPen ? parseFloat(appPen) : undefined,
      chargebackRateBaseline: chargeback ? parseFloat(chargeback) : undefined,
      citAgingBaseline: citAging ? parseFloat(citAging) : undefined,
    });
  };

  const submitCadence = () => {
    saveCadence.mutate({
      coachingCadenceDay: cadenceDay as "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
      coachingCadenceTime: cadenceTime,
      coachingRunBy: runBy as "fi_director" | "asura_coach" | "dp" | "other",
      pru90DayTarget: pru90 ? parseInt(pru90, 10) : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header + progress */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {status.data.dealership.name} setup
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Step {step} of 5 — {STEPS[step - 1].title}
            </p>
          </div>
          <Badge variant="outline">{progressPct}% complete</Badge>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2">
          {STEPS.map((s) => (
            <div
              key={s.num}
              className={`flex-1 h-1.5 rounded-full ${
                s.num <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: profile */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Dealership profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Location (city, state)</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Puyallup, WA"
                />
              </div>
              <div className="space-y-2">
                <Label>Brand mix (comma separated)</Label>
                <Input
                  value={brandMix}
                  onChange={(e) => setBrandMix(e.target.value)}
                  placeholder="Toyota, Honda, Subaru"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unit volume / month</Label>
                  <Input
                    type="number"
                    value={unitVolume}
                    onChange={(e) => setUnitVolume(e.target.value)}
                    placeholder="200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current F&I PRU ($)</Label>
                  <Input
                    type="number"
                    value={pruBaseline}
                    onChange={(e) => setPruBaseline(e.target.value)}
                    placeholder="1700"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>90-day PRU target ($) <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input
                    type="number"
                    value={pruTarget}
                    onChange={(e) => setPruTarget(e.target.value)}
                    placeholder="2200"
                  />
                </div>
              </div>

              {/* Phase 5c — Data Processing Addendum acceptance gate. */}
              <div className="border-t border-border pt-4 mt-4 space-y-3">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm font-medium text-foreground">Data Processing Addendum</div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Before we activate live customer data, your dealership must accept ASURA's Data
                  Processing Addendum (DPA). It covers FTC Safeguards Rule compliance, customer data
                  rights, sub-processor disclosures, and breach notification timelines.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="/compliance"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View ASURA Compliance Posture <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">DPA version: {CURRENT_DPA_VERSION}</span>
                </div>
                <div
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    dpaAccepted ? "border-green-500/40 bg-green-500/5" : "border-border bg-accent/30"
                  }`}
                  onClick={() => setDpaAccepted(!dpaAccepted)}
                  data-testid="onboarding-dpa-checkbox"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        dpaAccepted ? "bg-green-500 border-green-500" : "border-border"
                      }`}
                    >
                      {dpaAccepted && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div className="text-xs leading-relaxed text-foreground">
                      My dealership has signed the ASURA Data Processing Addendum (
                      <span className="font-semibold">{CURRENT_DPA_VERSION}</span>) and agrees to its
                      terms regarding customer data handling, sub-processors, retention, and breach
                      notification.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: products */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Product menu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {products.map((p, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5 space-y-1">
                    {idx === 0 && <Label>Type</Label>}
                    <Select
                      value={p.productType}
                      onValueChange={(v) =>
                        setProducts(products.map((x, i) => (i === idx ? { ...x, productType: v as ProductType } : x)))
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRODUCT_TYPES.map((pt) => (
                          <SelectItem key={pt} value={pt}>
                            {pt.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4 space-y-1">
                    {idx === 0 && <Label>Display name</Label>}
                    <Input
                      value={p.displayName}
                      onChange={(e) => setProducts(products.map((x, i) => (i === idx ? { ...x, displayName: e.target.value } : x)))}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {idx === 0 && <Label>Retail $</Label>}
                    <Input
                      type="number"
                      value={p.retailPrice}
                      onChange={(e) => setProducts(products.map((x, i) => (i === idx ? { ...x, retailPrice: e.target.value } : x)))}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setProducts(products.filter((_, i) => i !== idx))}
                      disabled={products.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProducts([...products, { productType: "other", displayName: "", retailPrice: "" }])}
              >
                <Plus className="w-4 h-4 mr-1" /> Add product
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: team */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                F&I team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {managers.map((m, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4 space-y-1">
                    {idx === 0 && <Label>Name</Label>}
                    <Input
                      value={m.name}
                      onChange={(e) => setManagers(managers.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))}
                    />
                  </div>
                  <div className="col-span-5 space-y-1">
                    {idx === 0 && <Label>Email</Label>}
                    <Input
                      type="email"
                      value={m.email}
                      onChange={(e) => setManagers(managers.map((x, i) => (i === idx ? { ...x, email: e.target.value } : x)))}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {idx === 0 && <Label>Role</Label>}
                    <Select
                      value={m.role}
                      onValueChange={(v) =>
                        setManagers(managers.map((x, i) => (i === idx ? { ...x, role: v as "user" | "admin" } : x)))
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Manager</SelectItem>
                        <SelectItem value="admin">Director</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setManagers(managers.filter((_, i) => i !== idx))}
                      disabled={managers.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setManagers([...managers, { name: "", email: "", role: "user" }])}
              >
                <Plus className="w-4 h-4 mr-1" /> Add manager
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: baseline */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Baseline metrics (last 90 days)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>VSA penetration %</Label>
                <Input type="number" value={vsaPen} onChange={(e) => setVsaPen(e.target.value)} placeholder="45" />
              </div>
              <div className="space-y-2">
                <Label>GAP penetration %</Label>
                <Input type="number" value={gapPen} onChange={(e) => setGapPen(e.target.value)} placeholder="60" />
              </div>
              <div className="space-y-2">
                <Label>Appearance penetration %</Label>
                <Input type="number" value={appPen} onChange={(e) => setAppPen(e.target.value)} placeholder="30" />
              </div>
              <div className="space-y-2">
                <Label>Chargeback rate %</Label>
                <Input type="number" value={chargeback} onChange={(e) => setChargeback(e.target.value)} placeholder="1.5" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>CIT aging (avg days to fund)</Label>
                <Input type="number" value={citAging} onChange={(e) => setCitAging(e.target.value)} placeholder="4.2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: cadence */}
        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-primary" />
                Coaching cadence (the 15-min weekly)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Day of week</Label>
                <Select value={cadenceDay} onValueChange={setCadenceDay}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map((d) => (
                      <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time (HH:MM)</Label>
                <Input
                  type="time"
                  value={cadenceTime}
                  onChange={(e) => setCadenceTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Run by</Label>
                <Select value={runBy} onValueChange={setRunBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fi_director">F&I Director</SelectItem>
                    <SelectItem value="asura_coach">ASURA Coach</SelectItem>
                    <SelectItem value="dp">Dealer Principal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>90-day PRU target ($)</Label>
                <Input type="number" value={pru90} onChange={(e) => setPru90(e.target.value)} placeholder="2200" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nav buttons */}
        <div className="flex justify-between gap-3">
          <Button
            variant="outline"
            disabled={step === 1}
            onClick={() => setStep(Math.max(1, step - 1))}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {step < 5 ? (
            <Button
              onClick={() => {
                if (step === 1) submitProfile();
                else if (step === 2) submitProducts();
                else if (step === 3) submitTeam();
                else if (step === 4) submitBaseline();
              }}
              disabled={
                saveProfile.isPending ||
                saveProducts.isPending ||
                saveTeam.isPending ||
                saveBaseline.isPending ||
                (step === 1 && !dpaAccepted)
              }
            >
              Save & continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={submitCadence} disabled={saveCadence.isPending}>
              {saveCadence.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finishing…</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Complete onboarding</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
