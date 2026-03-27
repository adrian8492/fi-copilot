import { Card, CardContent } from "@/components/ui/card";
import { ShieldX } from "lucide-react";
import type { AppRole } from "@/hooks/useRole";

export default function AccessDenied({ requiredRole, currentRole }: { requiredRole: string; currentRole: AppRole }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="bg-card border-border max-w-md w-full">
        <CardContent className="py-12 text-center">
          <ShieldX className="w-12 h-12 text-red-400 mx-auto mb-4 opacity-70" />
          <h2 className="text-lg font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This page requires <span className="font-semibold text-foreground">{requiredRole}</span> access.
            Your current role is <span className="font-semibold text-foreground">{currentRole}</span>.
          </p>
          <p className="text-xs text-muted-foreground">
            Contact your administrator to request elevated permissions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
