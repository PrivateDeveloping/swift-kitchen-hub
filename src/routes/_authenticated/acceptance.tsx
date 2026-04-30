import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Archive } from "lucide-react";
import { initialMockOrders } from "@/lib/mockOrders";
import type { Order } from "@/lib/types";
import { KanbanColumn } from "@/components/acceptance/KanbanColumn";
import { OrderCard } from "@/components/acceptance/OrderCard";
import { DeclineDialog } from "@/components/acceptance/DeclineDialog";
import { ConfirmDialog } from "@/components/acceptance/ConfirmDialog";

export const Route = createFileRoute("/_authenticated/acceptance")({
  component: AcceptanceDashboard,
});

type DialogState =
  | { kind: "none" }
  | { kind: "decline"; orderId: string }
  | { kind: "dispatch"; orderId: string }
  | { kind: "pickup"; orderId: string };

function AcceptanceDashboard() {
  const [orders, setOrders] = useState<Order[]>(initialMockOrders);
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });

  const buckets = useMemo(() => {
    const sortByPlaced = (a: Order, b: Order) =>
      new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();
    return {
      pending: orders.filter((o) => o.status === "PENDING").sort(sortByPlaced),
      accepted: orders
        .filter((o) => o.status === "ACCEPTED" || o.status === "IN_PROGRESS")
        .sort(sortByPlaced),
      ready: orders.filter((o) => o.status === "READY").sort(sortByPlaced),
      out: orders.filter((o) => o.status === "OUT_FOR_DELIVERY").sort(sortByPlaced),
    };
  }, [orders]);

  const activeOrder =
    dialog.kind !== "none" ? orders.find((o) => o.id === dialog.orderId) ?? null : null;

  const handleAccept = (id: string) => {
    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "ACCEPTED", acceptedAt: nowIso } : o)),
    );
  };

  const handleDecline = (id: string) => setDialog({ kind: "decline", orderId: id });
  const handleDispatchOpen = (id: string) => setDialog({ kind: "dispatch", orderId: id });
  const handlePickupOpen = (id: string) => setDialog({ kind: "pickup", orderId: id });

  const confirmDecline = (reason: string) => {
    if (dialog.kind !== "decline") return;
    const id = dialog.orderId;
    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: "DECLINED",
              declinedAt: nowIso,
              declineReason: reason || null,
              customerNotified: true,
            }
          : o,
      ),
    );
  };

  const confirmDispatch = (notify: boolean) => {
    if (dialog.kind !== "dispatch") return;
    const id = dialog.orderId;
    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: "OUT_FOR_DELIVERY",
              outForDeliveryAt: nowIso,
              customerNotified: notify,
            }
          : o,
      ),
    );
  };

  const confirmPickup = (notify: boolean) => {
    if (dialog.kind !== "pickup") return;
    const id = dialog.orderId;
    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: "DELIVERED",
              deliveredAt: nowIso,
              customerNotified: notify,
            }
          : o,
      ),
    );
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Acceptance</h1>
          <p className="text-sm text-muted-foreground">
            Review incoming orders, dispatch deliveries, and complete pickups.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Archive className="h-4 w-4" aria-hidden />
          View archive
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KanbanColumn title="Pending" count={buckets.pending.length} pulseWhenActive>
          {buckets.pending.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          ))}
        </KanbanColumn>
        <KanbanColumn title="Accepted" count={buckets.accepted.length}>
          {buckets.accepted.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </KanbanColumn>
        <KanbanColumn title="Ready" count={buckets.ready.length}>
          {buckets.ready.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onDispatch={handleDispatchOpen}
              onPickup={handlePickupOpen}
            />
          ))}
        </KanbanColumn>
        <KanbanColumn title="Out for Delivery" count={buckets.out.length}>
          {buckets.out.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </KanbanColumn>
      </div>

      <DeclineDialog
        orderNumber={dialog.kind === "decline" ? activeOrder?.orderNumber ?? null : null}
        open={dialog.kind === "decline"}
        onOpenChange={(v) => !v && setDialog({ kind: "none" })}
        onConfirm={confirmDecline}
      />
      <ConfirmDialog
        mode="dispatch"
        orderNumber={dialog.kind === "dispatch" ? activeOrder?.orderNumber ?? null : null}
        open={dialog.kind === "dispatch"}
        onOpenChange={(v) => !v && setDialog({ kind: "none" })}
        onConfirm={confirmDispatch}
      />
      <ConfirmDialog
        mode="pickup"
        orderNumber={dialog.kind === "pickup" ? activeOrder?.orderNumber ?? null : null}
        open={dialog.kind === "pickup"}
        onOpenChange={(v) => !v && setDialog({ kind: "none" })}
        onConfirm={confirmPickup}
      />
    </div>
  );
}
