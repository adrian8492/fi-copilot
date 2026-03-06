import { Building2, ChevronsUpDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function DealershipSwitcher() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: rooftops, isLoading } = trpc.auth.myRooftops.useQuery(undefined, {
    enabled: !!user,
  });

  const switchMutation = trpc.auth.switchRooftop.useMutation({
    onSuccess: () => {
      // Invalidate ALL queries so every page re-fetches with new dealership context
      utils.invalidate();
      toast.success("Rooftop switched — all data refreshed for the selected location.");
    },
    onError: (err) => {
      toast.error("Switch failed: " + err.message);
    },
  });

  // Only render if user has 2+ rooftops
  if (isLoading || !rooftops || rooftops.length < 2) return null;

  const currentDealershipId = user?.dealershipId;
  const currentRooftop = rooftops.find((r) => r.dealershipId === currentDealershipId);

  return (
    <div className="px-3 py-2">
      <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
        <Building2 className="h-3 w-3" />
        Rooftop
      </label>
      <Select
        value={currentDealershipId ? String(currentDealershipId) : undefined}
        onValueChange={(val) => {
          const dealershipId = Number(val);
          if (dealershipId !== currentDealershipId) {
            switchMutation.mutate({ dealershipId });
          }
        }}
        disabled={switchMutation.isPending}
      >
        <SelectTrigger className="w-full h-9 text-sm bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent transition-colors">
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <SelectValue placeholder="Select rooftop">
              {currentRooftop?.dealershipName ?? "Select rooftop"}
            </SelectValue>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground ml-auto" />
        </SelectTrigger>
        <SelectContent>
          {rooftops.map((r) => (
            <SelectItem key={r.dealershipId} value={String(r.dealershipId)}>
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{r.dealershipName}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
