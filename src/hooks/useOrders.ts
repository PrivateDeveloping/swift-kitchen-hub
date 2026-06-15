import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Order, OrderStatus } from "@/lib/types";
import { apiFetch, ApiError, NetworkError } from "@/lib/api";

const sortByPlaced = (a: Order, b: Order) =>
  new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();

const sortByDispatched = (a: Order, b: Order) => {
  const at = a.outForDeliveryAt ? new Date(a.outForDeliveryAt).getTime() : 0;
  const bt = b.outForDeliveryAt ? new Date(b.outForDeliveryAt).getTime() : 0;
  return at - bt;
};

type OrdersListResponse = { orders: Order[] };
type OrderResponse = { order: Order };

function describeError(err: unknown, fallback: string): string {
  if (err instanceof NetworkError) return err.message;
  if (err instanceof ApiError) return err.message;
  return fallback;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();

    setLoading(true);
    setError(null);

    apiFetch<OrdersListResponse>("/api/orders", { auth: true, signal: ac.signal })
      .then((data) => {
        if (cancelled) return;
        setOrders(data.orders);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled || ac.signal.aborted) return;
        setError(describeError(err, "Failed to load orders."));
        setLoading(false);
      });

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  // ---------------------------------------------------------------------
  // Local state helpers
  // ---------------------------------------------------------------------

  const replaceOrder = useCallback((next: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === next.id ? next : o)));
  }, []);

  const setStatusLocal = useCallback(
    (id: string, status: OrderStatus, extra: Partial<Order> = {}) => {
      const nowIso = new Date().toISOString();
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== id) return o;
          const next: Order = { ...o, status, ...extra };
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
          if (status === "ACCEPTED" && o.status === "IN_PROGRESS") {
            next.startedAt = null;
            next.readyAt = null;
          }
          return next;
        }),
      );
    },
    [],
  );

  /**
   * Optimistic mutation pattern:
   * 1. Snapshot the current order (for rollback)
   * 2. Apply optimistic local update so UI feels instant
   * 3. Call the backend
   * 4. On success, replace with server's authoritative version (timestamps etc.)
   * 5. On failure, roll back to the snapshot and toast an error
   */
  const optimisticMutation = useCallback(
    async (
      id: string,
      optimisticStatus: OrderStatus,
      optimisticExtra: Partial<Order>,
      requestPath: string,
      body: Record<string, unknown> | undefined,
      errorFallback: string,
    ): Promise<void> => {
      const original = orders.find((o) => o.id === id);
      if (!original) return;

      setStatusLocal(id, optimisticStatus, optimisticExtra);

      try {
        const data = await apiFetch<OrderResponse>(requestPath, {
          method: "POST",
          auth: true,
          body,
        });
        replaceOrder(data.order);
      } catch (err) {
        // Roll back ONLY this order, not the whole list
        replaceOrder(original);
        toast.error(describeError(err, errorFallback));
      }
    },
    [orders, replaceOrder, setStatusLocal],
  );

  // ---------------------------------------------------------------------
  // Mutations (real API calls with optimistic UI)
  // ---------------------------------------------------------------------

  const acceptOrder = useCallback(
    (id: string) =>
      optimisticMutation(
        id,
        "ACCEPTED",
        {},
        `/api/orders/${id}/accept`,
        undefined,
        "Failed to accept order",
      ),
    [optimisticMutation],
  );

  const declineOrder = useCallback(
    (id: string, reason: string | null) =>
      optimisticMutation(
        id,
        "DECLINED",
        { declineReason: reason },
        `/api/orders/${id}/decline`,
        reason ? { reason } : {},
        "Failed to decline order",
      ),
    [optimisticMutation],
  );

  const startOrder = useCallback(
    (id: string) =>
      optimisticMutation(
        id,
        "IN_PROGRESS",
        {},
        `/api/orders/${id}/start`,
        undefined,
        "Failed to start order",
      ),
    [optimisticMutation],
  );

  const markKitchenOrderReady = useCallback(
    (id: string) =>
      optimisticMutation(
        id,
        "READY",
        {},
        `/api/orders/${id}/ready`,
        undefined,
        "Failed to mark order ready",
      ),
    [optimisticMutation],
  );

  const moveKitchenOrderForward = useCallback(
    async (id: string) => {
      const o = orders.find((x) => x.id === id);
      if (!o) return;
      if (o.status === "ACCEPTED") {
        await startOrder(id);
      } else if (o.status === "IN_PROGRESS") {
        await markKitchenOrderReady(id);
      }
    },
    [orders, startOrder, markKitchenOrderReady],
  );

  const moveKitchenOrderBackward = useCallback(
    async (id: string) => {
      const o = orders.find((x) => x.id === id);
      if (!o) return;
      const targetStatus: OrderStatus | null =
        o.status === "READY" ? "IN_PROGRESS" : o.status === "IN_PROGRESS" ? "ACCEPTED" : null;
      if (!targetStatus) return;

      await optimisticMutation(
        id,
        targetStatus,
        {},
        `/api/orders/${id}/revert`,
        undefined,
        "Failed to move order back",
      );
    },
    [orders, optimisticMutation],
  );

  const dispatchOrder = useCallback(
    (id: string, notify = true) =>
      optimisticMutation(
        id,
        "OUT_FOR_DELIVERY",
        { customerNotified: notify },
        `/api/orders/${id}/dispatch`,
        { notifyCustomer: notify },
        "Failed to dispatch order",
      ),
    [optimisticMutation],
  );

  // markDelivered hits different endpoints depending on the order's current status:
  //  - From READY (pickup / direct handoff): POST /complete
  //  - From OUT_FOR_DELIVERY (driver finished): POST /deliver
  const markDelivered = useCallback(
    async (id: string, notify = true) => {
      const o = orders.find((x) => x.id === id);
      if (!o) return;

      if (o.status === "READY") {
        await optimisticMutation(
          id,
          "DELIVERED",
          { customerNotified: notify },
          `/api/orders/${id}/complete`,
          { notifyCustomer: notify },
          "Failed to complete order",
        );
      } else if (o.status === "OUT_FOR_DELIVERY") {
        await optimisticMutation(
          id,
          "DELIVERED",
          {},
          `/api/orders/${id}/deliver`,
          undefined,
          "Failed to mark order delivered",
        );
      }
    },
    [orders, optimisticMutation],
  );

  // ---------------------------------------------------------------------
  // Filtered lists (unchanged)
  // ---------------------------------------------------------------------

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

  return {
    orders,
    loading,
    error,
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
