import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  count: number;
  pulseWhenActive?: boolean;
  children: ReactNode;
};

export function KanbanColumn({ title, count, pulseWhenActive, children }: Props) {
  const shouldPulse = pulseWhenActive && count > 0;
  return (
    <div className="flex min-h-0 flex-col rounded-lg border border-border bg-muted/30">
      <div
        className={cn(
          "sticky top-0 z-10 flex items-center justify-between rounded-t-lg border-b border-border bg-background/95 px-4 py-3 backdrop-blur",
        )}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          <span
            className={cn(
              "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium tabular-nums text-muted-foreground",
              shouldPulse && "bg-primary text-primary-foreground animate-pulse",
            )}
          >
            {count}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {count === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
            No orders
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
