// lib/orders/constants.ts

import type { OrderStatus } from "@/lib/data/types"

export const ORDER_STATUSES: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
]

export const STATUS_COLORS: Record<OrderStatus, string> = {
  Pending: "border-muted-foreground text-muted-foreground bg-muted/40",
  Confirmed: "border-gold text-gold-dark bg-gold/10",
  Preparing: "border-orange-400 text-orange-600 bg-orange-50",
  "Out for Delivery": "border-accent text-accent bg-accent/10",
  Delivered: "border-green text-green bg-green/10",
  Cancelled: "border-destructive text-destructive bg-destructive/10",
}

export const PAYMENT_LABELS = {
  cash: "Cash on Delivery",
  card: "Card on Delivery",
}