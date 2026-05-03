export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "DECLINED"
  | "CANCELLED";

export type OrderItem = {
  id: string;
  menuItemId: string;
  nameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  notes: string | null;
};

export type Order = {
  id: string;
  orderNumber: string;
  trackingToken: string;
  cancelToken: string | null;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNotes: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  declineReason: string | null;
  customerNotified: boolean;
  placedAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  readyAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  declinedAt: string | null;
  items: OrderItem[];
};
