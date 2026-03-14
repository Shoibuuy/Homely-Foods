import type { Order } from "@/lib/data/types";

export function isOrderOverdue(order: Order, nowMs: number) {
  if (order.status !== "Confirmed") return false;
  if (!order.confirmedAt) return false;
  if (typeof order.confirmedEtaMinutes !== "number") return false;

  const start = new Date(order.confirmedAt).getTime();
  const end = start + order.confirmedEtaMinutes * 60 * 1000;

  return nowMs > end;
}

export function getOrderDelayMinutes(order: Order, nowMs: number) {
  if (!isOrderOverdue(order, nowMs)) return 0;

  const start = new Date(order.confirmedAt!).getTime();
  const end = start + order.confirmedEtaMinutes! * 60 * 1000;

  return Math.floor((nowMs - end) / 60000);
}