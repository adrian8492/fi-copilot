import { trpc } from "@/lib/trpc";
import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";

export default function DealershipSwitcher() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: rooftops } = trpc.auth.myRooftops.useQuery(undefined, {
    enabled: !!user,
  });

  const switchMutation = trpc.auth.switchRooftop.useMutation({
    onSuccess: () => {
      utils.invalidate();
    },
  });

  if (!rooftops || rooftops.length <= 1) return null;

  const currentId = user?.dealershipId;
  const currentRooftop = rooftops.find((r) => r.dealershipId === currentId);

  return (
    <div className="px-3 py-2 border-b border-border">
      <div className="flex items-center gap-1.5 mb-1">
        <Building2 className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Rooftop
        </span>
      </div>
      <Select
        value={currentId?.toString() ?? ""}
        onValueChange={(val) => {
          const dealershipId = parseInt(val, 10);
          if (!isNaN(dealershipId) && dealershipId !== currentId) {
            switchMutation.mutate({ dealershipId });
          }
        }}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Select store">
            {currentRooftop?.dealershipName ?? "Select store"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {rooftops.map((r) => (
            <SelectItem key={r.dealershipId} value={r.dealershipId.toString()}>
              {r.dealershipName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
