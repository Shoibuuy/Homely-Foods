// lib/orders/actions.ts
import type { Order, OrderStatus } from "@/lib/data/types";
import {
  updateOrderStatus,
  confirmOrder,
  markOrderContacted,
  getAllOrders,
} from "@/lib/data/storage";

export function applyOrderStatusUpdate(params: {
  orderId: string;
  currentStatus: OrderStatus;
  nextStatus: OrderStatus;
  confirmMeta?: { etaMinutes: number; remark?: string };
  markContacted?: boolean;
}): Order | null {
  const { orderId, currentStatus, nextStatus, confirmMeta, markContacted } =
    params;

  // No-op if status is unchanged
  if (currentStatus === nextStatus) {
    return getAllOrders().find((o) => o.id === orderId) ?? null;
  }

  let updatedOrder: Order | null = null;

  // Special case: Pending -> Confirmed
  if (currentStatus === "Pending" && nextStatus === "Confirmed") {
    updatedOrder = confirmOrder(orderId, {
      etaMinutes: confirmMeta?.etaMinutes ?? 30,
      remark: confirmMeta?.remark?.trim() || "",
    });
  } else {
    updatedOrder = updateOrderStatus(orderId, nextStatus);
  }

  if (!updatedOrder) {
    return null;
  }

  if (markContacted) {
    markOrderContacted(orderId, nextStatus);

    // return the freshest version after contact flag update
    return getAllOrders().find((o) => o.id === orderId) ?? updatedOrder;
  }

  return updatedOrder;
}