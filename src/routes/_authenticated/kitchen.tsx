import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/useOrders";
import type { Order } from "@/lib/types";
import { KitchenCard } from "@/components/kitchen/KitchenCard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/kitchen")({
  component: KitchenDashboard,
});

type ColumnKey = "todo" | "progress" | "done";

const COLUMNS: { key: ColumnKey; title: string; accent: string }[] = [
  { key: "todo", title: "To Do", accent: "" },
  { key: "progress", title: "In Progress", accent: "text-amber-600" },
  { key: "done", title: "Done", accent: "text-emerald-600" },
];

function KitchenDashboard() {
  const {
    orders,
    kitchenTodoOrders,
    kitchenInProgressOrders,
    kitchenDoneOrders,
    startOrder,
    markKitchenOrderReady,
    moveKitchenOrderBackward,
  } = useOrders();
  const [pendingDoneId, setPendingDoneId] = useState<string | null>(null);

  const buckets: Record<ColumnKey, Order[]> = {
    todo: kitchenTodoOrders,
    progress: kitchenInProgressOrders,
    done: kitchenDoneOrders,
  };

  const handleSingleTap = (id: string) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    if (order.status === "ACCEPTED") startOrder(id);
    else if (order.status === "IN_PROGRESS") setPendingDoneId(id);
  };

  const handleDoubleTap = (id: string) => {
    moveKitchenOrderBackward(id);
  };

  const confirmDone = () => {
    if (pendingDoneId) markKitchenOrderReady(pendingDoneId);
    setPendingDoneId(null);
  };

  const pendingOrder = pendingDoneId ? orders.find((o) => o.id === pendingDoneId) : null;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Kitchen</h1>
        <p className="text-sm text-muted-foreground">
          Tap a card to advance. Double-tap to send back. Long orders glow.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = buckets[col.key];
          return (
            <div
              key={col.key}
              className="flex min-h-0 flex-col rounded-lg border border-border bg-muted/30"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-lg border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-2">
                  <h2 className={cn("text-base font-semibold tracking-tight", col.accent)}>
                    {col.title}
                  </h2>
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-sm font-semibold tabular-nums text-muted-foreground">
                    {items.length}
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {items.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                    No orders
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {items.map((order) => (
                      <KitchenCard
                        key={order.id}
                        order={order}
                        onSingleTap={handleSingleTap}
                        onDoubleTap={handleDoubleTap}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={pendingDoneId !== null} onOpenChange={(v) => !v && setPendingDoneId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Is order {pendingOrder ? `#${pendingOrder.orderNumber}` : ""} done?
            </DialogTitle>
            <DialogDescription>
              Mark this order as ready for pickup or delivery.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDoneId(null)}>
              Cancel
            </Button>
            <Button onClick={confirmDone}>Yes, it's done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
