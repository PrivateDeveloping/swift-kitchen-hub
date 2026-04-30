import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Phone, MapPin, StickyNote, ChevronDown, ChevronUp, PackageCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { initialMockOrders } from "@/lib/mockOrders";
import type { Order } from "@/lib/types";
import { formatCurrency, formatRelative } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/driver")({
  component: DriverDashboard,
});

function DriverDashboard() {
  const [orders, setOrders] = useState<Order[]>(initialMockOrders);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, force] = useState(0);

  // re-render every 30s to keep relative times fresh
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const deliveries = useMemo(
    () =>
      orders
        .filter((o) => o.status === "OUT_FOR_DELIVERY")
        .sort((a, b) => {
          const at = a.outForDeliveryAt ? new Date(a.outForDeliveryAt).getTime() : 0;
          const bt = b.outForDeliveryAt ? new Date(b.outForDeliveryAt).getTime() : 0;
          return at - bt;
        }),
    [orders],
  );

  const pendingOrder = pendingId ? orders.find((o) => o.id === pendingId) ?? null : null;

  const confirmDeliver = () => {
    if (!pendingId) return;
    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === pendingId
          ? { ...o, status: "DELIVERED", deliveredAt: nowIso, customerNotified: true }
          : o,
      ),
    );
    setPendingId(null);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Deliveries</h1>
        <p className="text-sm text-muted-foreground">
          {deliveries.length} active {deliveries.length === 1 ? "delivery" : "deliveries"}.
        </p>
      </div>

      {deliveries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <PackageCheck className="mb-3 h-12 w-12 text-muted-foreground" aria-hidden />
          <div className="text-base font-medium">No active deliveries</div>
          <p className="mt-1 text-sm text-muted-foreground">
            You're all caught up. New orders will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence mode="popLayout">
            {deliveries.map((order) => {
              const expanded = expandedId === order.id;
              const itemCount = order.items.reduce((s, it) => s + it.quantity, 0);
              const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(order.customerAddress)}`;
              const telHref = `tel:${order.customerPhone.replace(/[^+\d]/g, "")}`;
              const dispatched = order.outForDeliveryAt
                ? formatRelative(order.outForDeliveryAt)
                : "—";

              return (
                <motion.li
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                >
                  <Card className="overflow-hidden p-0 gap-0">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : order.id)}
                      className="w-full px-4 py-4 text-left transition-colors hover:bg-muted/40"
                      aria-expanded={expanded}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold tracking-tight">
                              #{order.orderNumber}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {dispatched}
                            </span>
                          </div>
                          <div className="mt-1 truncate text-sm font-medium">
                            {order.customerName}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {itemCount} item{itemCount === 1 ? "" : "s"} ·{" "}
                            {formatCurrency(order.total)}
                          </div>
                        </div>
                        {expanded ? (
                          <ChevronUp className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {expanded && (
                      <div className="space-y-3 border-t border-border bg-muted/20 px-4 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <a
                            href={telHref}
                            className="flex flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 py-2.5 text-sm font-medium hover:bg-accent"
                          >
                            <Phone className="h-4 w-4 shrink-0" aria-hidden />
                            <span className="truncate">{order.customerPhone}</span>
                          </a>
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-1 items-start gap-2 rounded-md border border-border bg-background px-3 py-2.5 text-sm font-medium hover:bg-accent"
                          >
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                            <span className="line-clamp-2 text-left">
                              {order.customerAddress}
                            </span>
                          </a>
                        </div>

                        {order.customerNotes && (
                          <div className="flex items-start gap-2 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700/40 dark:bg-amber-950/40 dark:text-amber-100">
                            <StickyNote className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                            <span>{order.customerNotes}</span>
                          </div>
                        )}

                        <ul className="space-y-1 rounded-md bg-background/60 p-3 text-sm">
                          {order.items.map((it) => (
                            <li key={it.id} className="flex items-start justify-between gap-3">
                              <span>
                                <span className="font-medium tabular-nums">
                                  {it.quantity}
                                </span>{" "}
                                × {it.nameSnapshot}
                              </span>
                              <span className="tabular-nums text-muted-foreground">
                                {formatCurrency(it.priceSnapshot * it.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="border-t border-border bg-background p-3">
                      <Button
                        size="lg"
                        className="h-12 w-full text-base"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingId(order.id);
                        }}
                      >
                        Mark Delivered
                      </Button>
                    </div>
                  </Card>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <Dialog open={pendingId !== null} onOpenChange={(v) => !v && setPendingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm order {pendingOrder ? `#${pendingOrder.orderNumber}` : ""} delivered?
            </DialogTitle>
            <DialogDescription>
              This will mark the order as delivered and notify the customer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingId(null)}>
              Cancel
            </Button>
            <Button onClick={confirmDeliver}>Yes, delivered</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
