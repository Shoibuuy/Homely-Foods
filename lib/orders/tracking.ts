import type { Order, OrderStatus } from "@/lib/data/types";

export function getOrderStatusTimestamp(
  order: Order,
  status: OrderStatus,
): string | undefined {
  switch (status) {
    case "Pending":
      return order.createdAt;
    case "Confirmed":
      return order.confirmedAt ?? order.statusUpdatedAt;
    case "Preparing":
      return order.preparingAt;
    case "Out for Delivery":
      return order.outForDeliveryAt;
    case "Delivered":
      return order.deliveredAt;
    case "Cancelled":
      return order.cancelledAt;
    default:
      return undefined;
  }
}

export function formatTrackingTime(value?: string): string | null {
  if (!value) return null;

  return new Date(value).toLocaleString("en-AE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getOrderEtaInfo(order: Order, now: number) {
  if (!order.confirmedAt || typeof order.confirmedEtaMinutes !== "number") {
    return null;
  }

  const start = new Date(order.confirmedAt).getTime();
  const end = start + order.confirmedEtaMinutes * 60 * 1000;
  const diff = end - now;

  if (order.status === "Delivered" && order.deliveredAt) {
    const deliveredAt = new Date(order.deliveredAt).getTime();
    const deliveryDiff = end - deliveredAt;
    const diffMinutes = Math.floor(Math.abs(deliveryDiff) / 60000);

    if (deliveryDiff >= 10 * 60 * 1000) {
      return {
        type: "delivered-early" as const,
        text: `Fast delivery • ${diffMinutes} min early`,
      };
    }

    if (deliveryDiff >= 0) {
      return {
        type: "delivered-on-time" as const,
        text: deliveryDiff <= 60 * 1000
          ? "Punctual delivery"
          : `On-time delivery • ${diffMinutes} min early`,
      };
    }

    if (diffMinutes <= 10) {
      return {
        type: "delivered-delay" as const,
        text: `Slight delay • ${diffMinutes} min`,
      };
    }

    return {
      type: "delivered-delay" as const,
      text: `Delayed delivery • ${diffMinutes} min`,
    };
  }

  if (order.status !== "Confirmed") return null;

  if (diff > 0) {
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return {
      type: "countdown" as const,
      text: `ETA in ${minutes}:${String(seconds).padStart(2, "0")}`,
    };
  }

  const delayMinutes = Math.floor(Math.abs(diff) / 60000);

  return {
    type: "delay" as const,
    text: `Delay ${delayMinutes} min`,
  };
}