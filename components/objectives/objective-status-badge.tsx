import { Badge } from "@/components/ui/badge";
import { OBJECTIVE_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ObjectiveStatusBadgeProps {
  status: string;
}

export function ObjectiveStatusBadge({ status }: ObjectiveStatusBadgeProps) {
  const variant =
    status === "ACTIVE" ? "success" :
    status === "FIXED" ? "default" :
    status === "PAUSED" ? "warning" :
    status === "COMPLETED" ? "legacy" :
    "muted";

  return (
    <Badge variant={variant as any} className="text-[10px]">
      {OBJECTIVE_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
