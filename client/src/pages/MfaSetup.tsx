import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, ShieldCheck, ShieldOff, AlertCircle, Loader2, CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";

export default function MfaSetup() {
  const { user } = useAuth();

  const [step, setStep] = useState<"idle" | "setup" | "confirm" | "disable">("idle");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const mfaStatus = trpc.auth.mfaStatus.useQuery(undefined, { enabled: !!user });

  const setupMutation = trpc.auth.mfaSetup.useMutation({
    onSuccess: (data) => {
      setQrCode(data.qrCodeDataUri);
      setSecret(data.secret);
      setStep("confirm");
    },
    onError: (err: { message: string }) => {
      setError(err.message);
    },
  });

  const confirmMutation = trpc.auth.mfaConfirm.useMutation({
    onSuccess: () => {
      toast.success("MFA Enabled", { description: "Two-factor authentication is now active on your account." });
      mfaStatus.refetch();
      resetState();
    },
    onError: (err: { message: string }) => {
      setError(err.message);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    },
  });

  const disableMutation = trpc.auth.mfaDisable.useMutation({
    onSuccess: () => {
      toast.success("MFA Disabled", { description: "Two-factor authentication has been removed from your account." });
      mfaStatus.refetch();
      resetState();
    },
    onError: (err: { message: string }) => {
      setError(err.message);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    },
  });

  const resetState = () => {
    setStep("idle");
    setQrCode(null);
    setSecret(null);
    setCode(["", "", "", "", "", ""]);
    setError(null);
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError(null);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }
    if (step === "confirm") {
      confirmMutation.mutate({ code: fullCode });
    } else if (step === "disable") {
      disableMutation.mutate({ code: fullCode });
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      toast.success("Secret key copied to clipboard.");
    }
  };

  useEffect(() => {
    if (step === "confirm" || step === "disable") {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const isEnabled = mfaStatus.data?.mfaEnabled ?? false;
  const isPending = setupMutation.isPending || confirmMutation.isPending || disableMutation.isPending;

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Two-Factor Authentication
        </h1>
        <p className="text-muted-foreground mt-1">
          Add an extra layer of security to your F&I Co-Pilot account.
        </p>
      </div>

      {/* Status Card */}
      <Card className="mb-6 border-border/50">
        <CardContent className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            ) : (
              <ShieldOff className="w-8 h-8 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">{isEnabled ? "MFA is enabled" : "MFA is not enabled"}</p>
              <p className="text-sm text-muted-foreground">
                {isEnabled
                  ? "Your account is protected with two-factor authentication."
                  : "Enable MFA to secure your account with a second verification step."}
              </p>
            </div>
          </div>
          {step === "idle" && (
            <Button
              variant={isEnabled ? "destructive" : "default"}
              onClick={() => {
                setError(null);
                if (isEnabled) {
                  setStep("disable");
                } else {
                  setupMutation.mutate();
                }
              }}
              disabled={isPending || mfaStatus.isLoading}
            >
              {setupMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {isEnabled ? "Disable MFA" : "Enable MFA"}
            </Button>
          )}
          {step !== "idle" && (
            <Button variant="outline" onClick={resetState} disabled={isPending}>
              Cancel
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Setup / QR Code Step */}
      {step === "confirm" && qrCode && (
        <Card className="mb-6 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Scan QR Code</CardTitle>
            <CardDescription>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
              </div>
            </div>

            {secret && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Can't scan? Enter this key manually:
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono flex-1 break-all">{secret}</code>
                  <Button variant="ghost" size="sm" onClick={copySecret}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium mb-3">Enter the 6-digit code to verify:</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                  {code.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-mono bg-background border-border focus:border-primary"
                      disabled={isPending}
                    />
                  ))}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm justify-center">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isPending || code.join("").length !== 6}>
                  {confirmMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Verify & Enable MFA
                    </>
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disable Step */}
      {step === "disable" && (
        <Card className="mb-6 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Disable MFA</CardTitle>
            <CardDescription>
              Enter your current authenticator code to disable two-factor authentication.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-mono bg-background border-border focus:border-primary"
                    disabled={isPending}
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm justify-center">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" variant="destructive" className="w-full" disabled={isPending || code.join("").length !== 6}>
                {disableMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Disabling...
                  </>
                ) : (
                  "Confirm & Disable MFA"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="border-border/30 bg-muted/20">
        <CardContent className="py-4">
          <h3 className="text-sm font-medium mb-2">About Two-Factor Authentication</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• MFA adds a second verification step when you sign in.</li>
            <li>• You'll need your authenticator app each time you log in.</li>
            <li>• Compatible with Google Authenticator, Authy, 1Password, and similar apps.</li>
            <li>• CFPB-recommended security measure for financial data access.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
