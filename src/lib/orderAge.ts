import type { Order } from "@/lib/types";

export type AgeLevel = "fresh" | "ok" | "warn" | "late";

/**
 * Timestamp when the order entered its CURRENT status. Returns null for
 * terminal statuses (delivered/cancelled/declined), which don't have a live
 * age. Falls back to placedAt if an intermediate timestamp is somehow missing.
 */
export function statusEnteredAt(order: Order): string | null {
  switch (order.status) {
    case "PENDING":
      return order.placedAt;
    case "ACCEPTED":
      return order.acceptedAt ?? order.placedAt;
    case "IN_PROGRESS":
      return order.startedAt ?? order.placedAt;
    case "READY":
      return order.readyAt ?? order.placedAt;
    case "OUT_FOR_DELIVERY":
      return order.outForDeliveryAt ?? order.placedAt;
    default:
      return null;
  }
}

/** Green < 5m, yellow 5–15m, orange 15–30m, red ≥ 30m. */
export function ageLevelFor(minutes: number): AgeLevel {
  if (minutes < 5) return "fresh";
  if (minutes < 15) return "ok";
  if (minutes < 30) return "warn";
  return "late";
}

/** Whole minutes spent in the current status, or null for terminal orders. */
export function minutesInStatus(order: Order, nowMs: number = Date.now()): number | null {
  const since = statusEnteredAt(order);
  if (!since) return null;
  return Math.max(0, Math.floor((nowMs - new Date(since).getTime()) / 60_000));
}

// Literal class strings — Tailwind can't see interpolated class names.
export const AGE_BORDER: Record<AgeLevel, string> = {
  fresh: "border-l-green-500",
  ok: "border-l-yellow-500",
  warn: "border-l-orange-500",
  late: "border-l-red-500",
};

export const AGE_BADGE: Record<AgeLevel, string> = {
  fresh: "bg-green-500/15 text-green-700 dark:text-green-400",
  ok: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-500",
  warn: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  late: "bg-red-500/15 text-red-700 dark:text-red-400 animate-pulse",
};
