import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AGE_BADGE, ageLevelFor } from "@/lib/orderAge";

/**
 * Small "12m" pill colored by how long the order has sat in its current
 * status (green → red). The caller passes the minutes (computed from a board
 * that re-renders on a timer) so the level stays in sync.
 */
export function AgeBadge({ minutes, className }: { minutes: number; className?: string }) {
  const level = ageLevelFor(minutes);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        AGE_BADGE[level],
        className,
      )}
      title={`${minutes} min in current status`}
    >
      <Clock className="h-3 w-3" aria-hidden />
      {minutes}m
    </span>
  );
}
