// lib/orders/pricing.ts
import type { AddOn, CartItem } from "@/lib/data/types";

export type OrderPricing = {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
};

export type PricingRules = {
  freeDeliveryThreshold: number;
  deliveryFee: number;
};

export const DEFAULT_PRICING_RULES: PricingRules = {
  freeDeliveryThreshold: 50,
  deliveryFee: 10,
};

export function calcAddOnTotal(addOns: Array<{ price: number; qty?: number }>): number {
  return (addOns || []).reduce((sum, addOn) => {
    const qty = typeof addOn.qty === "number" ? addOn.qty : 1;
    return sum + (addOn.price || 0) * qty;
  }, 0);
}

export function calcCartItemUnitPrice(ci: CartItem): number {
  const base = ci.menuItem.price;
  const addOns = calcAddOnTotal(ci.selectedAddOns || []);
  return base + addOns;
}

export function calcCartItemLineTotal(item: CartItem): number {
  return calcCartItemUnitPrice(item) * item.quantity;
}

export function calcSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + calcCartItemLineTotal(item), 0);
}

export function calcDeliveryFee(
  subtotal: number,
  rules: PricingRules = DEFAULT_PRICING_RULES
): number {
  return subtotal >= rules.freeDeliveryThreshold ? 0 : rules.deliveryFee;
}

export function calcOrderPricing(params: {
  items: CartItem[];
  discount?: number;
  rules?: PricingRules;
}): OrderPricing {
  const subtotal = calcSubtotal(params.items);
  const deliveryFee = calcDeliveryFee(subtotal, params.rules);
  const discount = Math.max(0, params.discount ?? 0);
  const total = Math.max(0, subtotal + deliveryFee - discount);

  return {
    subtotal,
    deliveryFee,
    discount,
    total,
  };
}