import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function JoinPage() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
  }, []);

  const { data: validation, isLoading: validating } = trpc.invitations.validate.useQuery(
    { token: token! },
    { enabled: !!token }
  );

  const redeemMutation = trpc.invitations.redeem.useMutation({
    onSuccess: () => {
      toast.success("Welcome to F&I Co-Pilot! Your account is set up.");
      navigate("/dashboard");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardContent className="pt-8 pb-8 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Invalid Invite Link</h2>
            <p className="text-sm text-muted-foreground">This invite link is missing a token. Please request a new invite from your administrator.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (validating || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!validation?.valid) {
    const reasons: Record<string, string> = {
      not_found: "This invite link does not exist or has been revoked.",
      already_used: "This invite link has already been used.",
      expired: "This invite link has expired. Please request a new one.",
    };
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardContent className="pt-8 pb-8 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Invite Link Invalid</h2>
            <p className="text-sm text-muted-foreground">{reasons[validation?.reason ?? "not_found"] ?? "This invite link is no longer valid."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid invite — if not logged in, redirect to login with return path
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="pb-2 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-lg">You've Been Invited</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {validation.email
                ? <>You've been invited as <span className="font-medium text-foreground">{validation.email}</span>.</>
                : "You've been invited to join F&I Co-Pilot."}
            </p>
            <Badge variant="outline" className="capitalize">{validation.role} access</Badge>
            <p className="text-xs text-muted-foreground">Sign in with your account to accept this invitation and activate your access.</p>
            <Button className="w-full" onClick={() => {
              // Store return path in sessionStorage so OAuth callback can redirect back
              sessionStorage.setItem("invite_token", token ?? "");
              window.location.href = getLoginUrl();
            }}>
              Sign In to Accept Invite
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Logged in — show accept button
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="pb-2 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-lg">Accept Your Invitation</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Welcome, <span className="font-medium text-foreground">{user.name}</span>. Click below to activate your F&I Co-Pilot access.
          </p>
          <Badge variant="outline" className="capitalize">{validation.role} access</Badge>
          <Button
            className="w-full"
            disabled={redeemMutation.isPending}
            onClick={() => redeemMutation.mutate({ token: token! })}
          >
            {redeemMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Activating...</>
            ) : (
              "Accept & Activate Access"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
