import { CloudAlert } from "lucide-react";

import { useIsOnline } from "#/hooks/use-is-online";
import { Badge } from "./Badge";

export function OfflineBadge() {
  const isOnline = useIsOnline();

  return isOnline ? null : (
    <Badge className="flex items-center gap-2 text-white" variant="destructive">
      <CloudAlert className="text-white size-3" />

      <span>You are offline</span>
    </Badge>
  );
}
