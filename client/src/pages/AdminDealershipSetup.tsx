import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Building2, Package, Users, TrendingUp, CalendarClock,
  CheckCircle2, Loader2, Plus, Trash2, ArrowLeft, ArrowRight,
  ShieldAlert, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

const CURRENT_DPA_VERSION = "v1";

const STEPS = [
  { num: 1, title: "Dealership Profile", icon: Building2 },
  { num: 2, title: "Product Menu", icon: Package },
  { num: 3, title: "F&I Team", icon: Users },
  { num: 4, title: "Baseline Metrics", icon: TrendingUp },
  { num: 5, title: "Coaching Cadence", icon: CalendarClock },
] as const;

const PRODUCT_TYPES = [
  "vehicle_service_contract", "gap_insurance", "prepaid_maintenance",
  "interior_exterior_protection", "road_hazard", "paintless_dent_repair",
  "key_replacement", "windshield_protection", "lease_wear_tear",
  "tire_wheel", "theft_protection", "other",
] as const;

type ProductType = (typeof PRODUCT_TYPES)[number];

/**
 * /admin/dealerships/:id/setup — Phase 6 issue 2.
 *
 * Mirrors /onboarding but:
 *   - dealershipId comes from URL, not ctx.user
 *   - tRPC calls go to adminOnboarding.* (super-admin gated)
 *   - DPA accepted "on behalf of" attestation in step 1
 *
 * The dealership user no longer needs to walk the wizard; once super
 * admin saves step 5 here, `onboardingComplete` flips to true and the
 * dealership's own admins land on Dashboard normally.
 */
export default function AdminDealershipSetup() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute<{ id: string }>("/admin/dealerships/:id/setup");
  const dealershipId = match && params?.id ? parseInt(params.id, 10) : null;

  const { user, loading: authLoading } = useAuth();
  const u = user as ({ isSuperAdmin?: boolean } | null);
  const isSuperAdmin = !!u?.isSuperAdmin;

  const status = trpc.adminOnboarding.getStatus.useQuery(
    { dealershipId: dealershipId ?? 0 },
    { enabled: dealershipId != null && isSuperAdmin },
  );

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

  const saveProfile = trpc.adminOnboarding.saveProfile.useMutation({
    onSuccess: () => { toast.success("Profile saved"); setStep(2); status.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const saveProducts = trpc.adminOnboarding.saveProducts.useMutation({
    onSuccess: () => { toast.success("Product menu saved"); setStep(3); status.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const saveTeam = trpc.adminOnboarding.saveTeam.useMutation({
    onSuccess: (res) => { toast.success(`${res.invites.length} invite${res.invites.length === 1 ? "" : "s"} created`); setStep(4); status.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const saveBaseline = trpc.adminOnboarding.saveBaseline.useMutation({
    onSuccess: () => { toast.success("Baseline metrics saved"); setStep(5); status.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const saveCadence = trpc.adminOnboarding.saveCadence.useMutation({
    onSuccess: () => { toast.success("Setup complete — dealership users can now sign in."); navigate("/admin/dealerships"); },
    onError: (e) => toast.error(e.message),
  });

  // Resume the wizard at the dealership's last completed step + 1.
  useEffect(() => {
    if (status.data?.hasDealership) {
      const next = Math.min(5, (status.data.dealership.onboardingStep ?? 0) + 1);
      setStep(next);
    }
  }, [status.data]);

  // ─── Guards ───────────────────────────────────────────────────────────────

  if (authLoading) {
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

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2">Super admin only</h2>
            <p className="text-sm text-muted-foreground">
              Admin-driven dealership setup is restricted to platform super
              admins. If you're a dealership admin, use{" "}
              <a href="/onboarding" className="text-primary underline">/onboarding</a>{" "}
              for your own store.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (dealershipId == null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-sm text-muted-foreground">Invalid dealership ID. <a href="/admin/dealerships" className="text-primary underline">Back to list</a>.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!status.data?.hasDealership) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <h2 className="text-lg font-semibold mb-2">Dealership not found</h2>
            <p className="text-sm text-muted-foreground">No dealership with ID {dealershipId}. <a href="/admin/dealerships" className="text-primary underline">Back to list</a>.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Submit handlers ─────────────────────────────────────────────────────

  const submitProfile = () => {
    if (!dpaAccepted) {
      toast.error("Confirm the DPA acceptance attestation to proceed.");
      return;
    }
    saveProfile.mutate({
      dealershipId,
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
      dealershipId,
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
      dealershipId,
      managers: managers
        .filter((m) => m.email.trim() && m.name.trim())
        .map((m) => ({ name: m.name.trim(), email: m.email.trim(), role: m.role })),
    });
  };

  const submitBaseline = () => {
    saveBaseline.mutate({
      dealershipId,
      vsaPenBaseline: vsaPen ? parseFloat(vsaPen) : undefined,
      gapPenBaseline: gapPen ? parseFloat(gapPen) : undefined,
      appearancePenBaseline: appPen ? parseFloat(appPen) : undefined,
      chargebackRateBaseline: chargeback ? parseFloat(chargeback) : undefined,
      citAgingBaseline: citAging ? parseFloat(citAging) : undefined,
    });
  };

  const submitCadence = () => {
    saveCadence.mutate({
      dealershipId,
      coachingCadenceDay: cadenceDay as "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
      coachingCadenceTime: cadenceTime,
      coachingRunBy: runBy as "fi_director" | "asura_coach" | "dp" | "other",
      pru90DayTarget: pru90 ? parseInt(pru90, 10) : undefined,
    });
  };

  const progressPct = useMemo(() => Math.round(((step - 1) / 5) * 100), [step]);
  const dealership = status.data.dealership;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Admin banner — make it visually clear this is super-admin work */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-amber-500 uppercase tracking-wide">
              Admin pre-configuration on behalf of {dealership.name}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dealerships")}>
            <ArrowLeft className="w-3 h-3 mr-1" /> Back to list
          </Button>
        </div>

        {/* Header + progress */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{dealership.name} setup</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Step {step} of 5 — {STEPS[step - 1].title}
            </p>
          </div>
          <Badge variant="outline">{progressPct}% complete</Badge>
        </div>

        <div className="flex gap-2">
          {STEPS.map((s) => (
            <div
              key={s.num}
              className={`flex-1 h-1.5 rounded-full ${s.num <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        {/* Step 1 */}
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
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Puyallup, WA" />
              </div>
              <div className="space-y-2">
                <Label>Brand mix (comma separated)</Label>
                <Input value={brandMix} onChange={(e) => setBrandMix(e.target.value)} placeholder="Toyota, Honda, Subaru" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unit volume / month</Label>
                  <Input type="number" value={unitVolume} onChange={(e) => setUnitVolume(e.target.value)} placeholder="200" />
                </div>
                <div className="space-y-2">
                  <Label>Current F&I PRU ($)</Label>
                  <Input type="number" value={pruBaseline} onChange={(e) => setPruBaseline(e.target.value)} placeholder="1700" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>90-day PRU target ($) <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input type="number" value={pruTarget} onChange={(e) => setPruTarget(e.target.value)} placeholder="2200" />
                </div>
              </div>
              {/* DPA acceptance */}
              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dpaAccepted}
                    onChange={(e) => setDpaAccepted(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-xs text-foreground leading-relaxed">
                    I attest the dealership has signed the ASURA Data Processing Addendum
                    ({CURRENT_DPA_VERSION}) offline and authorize me to confirm acceptance on
                    their behalf. The signature is recorded with my user ID for audit.
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2 — products */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-primary" /> Product menu</CardTitle>
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
                        {PRODUCT_TYPES.map((pt) => <SelectItem key={pt} value={pt}>{pt.replace(/_/g, " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4 space-y-1">
                    {idx === 0 && <Label>Display name</Label>}
                    <Input
                      value={p.displayName}
                      onChange={(e) => setProducts(products.map((x, i) => (i === idx ? { ...x, displayName: e.target.value } : x)))}
                      placeholder={p.productType === "other" ? "Required — name this product" : ""}
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
                    <Button variant="ghost" size="icon" onClick={() => setProducts(products.filter((_, i) => i !== idx))} disabled={products.length <= 1}>
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

        {/* Step 3 — team */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> F&I team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {managers.map((m, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4 space-y-1">
                    {idx === 0 && <Label>Name</Label>}
                    <Input value={m.name} onChange={(e) => setManagers(managers.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))} />
                  </div>
                  <div className="col-span-5 space-y-1">
                    {idx === 0 && <Label>Email</Label>}
                    <Input type="email" value={m.email} onChange={(e) => setManagers(managers.map((x, i) => (i === idx ? { ...x, email: e.target.value } : x)))} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {idx === 0 && <Label>Role</Label>}
                    <Select
                      value={m.role}
                      onValueChange={(v) => setManagers(managers.map((x, i) => (i === idx ? { ...x, role: v as "user" | "admin" } : x)))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Manager</SelectItem>
                        <SelectItem value="admin">Director</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="icon" onClick={() => setManagers(managers.filter((_, i) => i !== idx))} disabled={managers.length <= 1}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setManagers([...managers, { name: "", email: "", role: "user" }])}>
                <Plus className="w-4 h-4 mr-1" /> Add manager
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4 — baseline */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Baseline metrics (last 90 days)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>VSA penetration %</Label><Input type="number" value={vsaPen} onChange={(e) => setVsaPen(e.target.value)} placeholder="45" /></div>
              <div className="space-y-2"><Label>GAP penetration %</Label><Input type="number" value={gapPen} onChange={(e) => setGapPen(e.target.value)} placeholder="60" /></div>
              <div className="space-y-2"><Label>Appearance penetration %</Label><Input type="number" value={appPen} onChange={(e) => setAppPen(e.target.value)} placeholder="30" /></div>
              <div className="space-y-2"><Label>Chargeback rate %</Label><Input type="number" value={chargeback} onChange={(e) => setChargeback(e.target.value)} placeholder="1.5" /></div>
              <div className="space-y-2 sm:col-span-2"><Label>CIT aging (avg days to fund)</Label><Input type="number" value={citAging} onChange={(e) => setCitAging(e.target.value)} placeholder="4.2" /></div>
            </CardContent>
          </Card>
        )}

        {/* Step 5 — cadence */}
        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarClock className="w-5 h-5 text-primary" /> Coaching cadence (the 15-min weekly)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Day of week</Label>
                <Select value={cadenceDay} onValueChange={setCadenceDay}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map((d) =>
                      <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time (HH:MM)</Label>
                <Input type="time" value={cadenceTime} onChange={(e) => setCadenceTime(e.target.value)} />
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
              <div className="space-y-2"><Label>90-day PRU target ($)</Label><Input type="number" value={pru90} onChange={(e) => setPru90(e.target.value)} placeholder="2200" /></div>
            </CardContent>
          </Card>
        )}

        {/* Nav */}
        <div className="flex justify-between gap-3">
          <Button variant="outline" disabled={step === 1} onClick={() => setStep(Math.max(1, step - 1))}>
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
              disabled={saveProfile.isPending || saveProducts.isPending || saveTeam.isPending || saveBaseline.isPending}
            >
              Save & continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={submitCadence} disabled={saveCadence.isPending}>
              {saveCadence.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finishing…</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Complete setup</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
