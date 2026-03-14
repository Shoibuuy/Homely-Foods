import type { CartItem, Order } from "@/lib/data/types";
import { calcAddOnTotal, calcCartItemLineTotal } from "@/lib/orders/pricing";

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getOrderItemCount(order: Pick<Order, "items">): number {
  return getCartItemCount(order.items);
}

export function getCartItemAddOnTotal(item: CartItem): number {
  return calcAddOnTotal(item.selectedAddOns);
}

export function getCartItemLineTotal(item: CartItem): number {
  return calcCartItemLineTotal(item);
}

export function getOrderRef(order: Pick<Order, "id" | "orderNo">): string {
  return order.orderNo ?? `#${order.id.slice(-6)}`;
}