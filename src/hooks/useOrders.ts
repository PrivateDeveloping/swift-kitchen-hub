import { useCallback, useMemo, useState } from "react";
import { initialMockOrders } from "@/lib/mockOrders";
import type { Order, OrderStatus } from "@/lib/types";

const sortByPlaced = (a: Order, b: Order) =>
  new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();

const sortByDispatched = (a: Order, b: Order) => {
  const at = a.outForDeliveryAt ? new Date(a.outForDeliveryAt).getTime() : 0;
  const bt = b.outForDeliveryAt ? new Date(b.outForDeliveryAt).getTime() : 0;
  return at - bt;
};

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>(initialMockOrders);

  const updateOrder = useCallback(
    (id: string, patch: Partial<Order> | ((o: Order) => Partial<Order>)) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== id) return o;
          const p = typeof patch === "function" ? patch(o) : patch;
          return { ...o, ...p };
        }),
      );
    },
    [],
  );

  const setStatus = useCallback(
    (id: string, status: OrderStatus, extra: Partial<Order> = {}) => {
      const nowIso = new Date().toISOString();
      updateOrder(id, (o) => {
        const next: Partial<Order> = { status, ...extra };
        if (status === "ACCEPTED" && !o.acceptedAt) next.acceptedAt = nowIso;
        if (status === "IN_PROGRESS") {
          if (!o.startedAt) next.startedAt = nowIso;
          next.readyAt = null;
        }
        if (status === "READY" && !o.readyAt) next.readyAt = nowIso;
        if (status === "OUT_FOR_DELIVERY") next.outForDeliveryAt = nowIso;
        if (status === "DELIVERED") next.deliveredAt = nowIso;
        if (status === "DECLINED") next.declinedAt = nowIso;
        if (status === "CANCELLED") next.cancelledAt = nowIso;
        // Moving back from IN_PROGRESS to ACCEPTED: reset cooking timing
        if (status === "ACCEPTED" && o.status === "IN_PROGRESS") {
          next.startedAt = null;
          next.readyAt = null;
        }
        return next;
      });
    },
    [updateOrder],
  );

  // Filtered lists
  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === "PENDING").sort(sortByPlaced),
    [orders],
  );
  const acceptanceAcceptedOrders = useMemo(
    () =>
      orders
        .filter((o) => o.status === "ACCEPTED" || o.status === "IN_PROGRESS")
        .sort(sortByPlaced),
    [orders],
  );
  const readyOrders = useMemo(
    () => orders.filter((o) => o.status === "READY").sort(sortByPlaced),
    [orders],
  );
  const outForDeliveryOrders = useMemo(
    () => orders.filter((o) => o.status === "OUT_FOR_DELIVERY").sort(sortByPlaced),
    [orders],
  );

  const kitchenTodoOrders = useMemo(
    () => orders.filter((o) => o.status === "ACCEPTED").sort(sortByPlaced),
    [orders],
  );
  const kitchenInProgressOrders = useMemo(
    () => orders.filter((o) => o.status === "IN_PROGRESS").sort(sortByPlaced),
    [orders],
  );
  const kitchenDoneOrders = useMemo(
    () => orders.filter((o) => o.status === "READY").sort(sortByPlaced),
    [orders],
  );

  const driverOrders = useMemo(
    () => orders.filter((o) => o.status === "OUT_FOR_DELIVERY").sort(sortByDispatched),
    [orders],
  );

  // Mutations
  const acceptOrder = useCallback(
    (id: string) => setStatus(id, "ACCEPTED", { customerNotified: true }),
    [setStatus],
  );
  const declineOrder = useCallback(
    (id: string, reason: string | null) =>
      setStatus(id, "DECLINED", { declineReason: reason, customerNotified: true }),
    [setStatus],
  );
  const startOrder = useCallback((id: string) => setStatus(id, "IN_PROGRESS"), [setStatus]);
  const markKitchenOrderReady = useCallback(
    (id: string) => setStatus(id, "READY"),
    [setStatus],
  );
  const moveKitchenOrderForward = useCallback(
    (id: string) => {
      const o = orders.find((x) => x.id === id);
      if (!o) return;
      if (o.status === "ACCEPTED") setStatus(id, "IN_PROGRESS");
      else if (o.status === "IN_PROGRESS") setStatus(id, "READY");
    },
    [orders, setStatus],
  );
  const moveKitchenOrderBackward = useCallback(
    (id: string) => {
      const o = orders.find((x) => x.id === id);
      if (!o) return;
      if (o.status === "READY") setStatus(id, "IN_PROGRESS");
      else if (o.status === "IN_PROGRESS") setStatus(id, "ACCEPTED");
    },
    [orders, setStatus],
  );
  const dispatchOrder = useCallback(
    (id: string, notify = true) =>
      setStatus(id, "OUT_FOR_DELIVERY", { customerNotified: notify }),
    [setStatus],
  );
  const markDelivered = useCallback(
    (id: string, notify = true) =>
      setStatus(id, "DELIVERED", { customerNotified: notify }),
    [setStatus],
  );

  return {
    orders,
    pendingOrders,
    acceptanceAcceptedOrders,
    readyOrders,
    outForDeliveryOrders,
    kitchenTodoOrders,
    kitchenInProgressOrders,
    kitchenDoneOrders,
    driverOrders,
    acceptOrder,
    declineOrder,
    startOrder,
    moveKitchenOrderForward,
    moveKitchenOrderBackward,
    markKitchenOrderReady,
    dispatchOrder,
    markDelivered,
  };
}
