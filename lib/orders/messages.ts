// lib/orders/messages.ts

import type { OrderStatus } from "@/lib/data/types";

export function buildOrderWhatsAppMessage(params: {
  name: string;
  orderShortId: string;
  status: OrderStatus;
  total: number;
  etaMinutes?: number;
  remark?: string;
}) {
  const { name, orderShortId, status, total, etaMinutes, remark } = params;

  const totalLine = `Total: AED ${total.toFixed(2)}`;
  const trimmedRemark = remark?.trim();

  if (status === "Pending") {
    return [
      `Hi ${name},`,
      ``,
      `Greetings from Homely Foods! ✅`,
      `We received your order (${orderShortId}).`,
      totalLine,
      `Current status: *Pending confirmation*.`,
      `Our team will review and confirm it shortly.`,
      ``,
      `Thank you!`,
    ].join("\n");
  }

  if (status === "Confirmed") {
    const extraLines = [
      typeof etaMinutes === "number"
        ? `Estimated delivery time: ${etaMinutes} minutes.`
        : null,
      trimmedRemark ? `Note: ${trimmedRemark}` : null,
    ].filter(Boolean);

    return [
      `Hi ${name},`,
      ``,
      `Your order (${orderShortId}) is *Confirmed*. ✅`,
      totalLine,
      ...extraLines,
      ``,
      `Thank you for ordering from Homely Foods!`,
    ].join("\n");
  }

  if (status === "Preparing") {
    return [
      `Hi ${name},`,
      ``,
      `Your order (${orderShortId}) is now *Preparing* 🍳.`,
      `Our kitchen team is working on it now.`,
      ``,
      `We’ll update you again once it is out for delivery.`,
    ].join("\n");
  }

  if (status === "Out for Delivery") {
    return [
      `Hi ${name},`,
      ``,
      `Your order (${orderShortId}) is *Out for Delivery* 🚗.`,
      `It will reach you soon.`,
      ``,
      `Thank you for choosing Homely Foods!`,
    ].join("\n");
  }

  if (status === "Delivered") {
    return [
      `Hi ${name},`,
      ``,
      `Your order (${orderShortId}) has been *Delivered* ✅.`,
      `We hope you enjoyed your meal.`,
      ``,
      `Thank you for choosing Homely Foods!`,
      `If you liked it, please leave us a review ⭐`,
    ].join("\n");
  }

  if (status === "Cancelled") {
    return [
      `Hi ${name},`,
      ``,
      `We’re sorry to inform you that your order (${orderShortId}) has been *Cancelled*.`,
      trimmedRemark ? `Reason / Note: ${trimmedRemark}` : null,
      ``,
      `If you need any help, please reply here.`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `Hi ${name},`,
    ``,
    `Update on your order (${orderShortId}):`,
    `Status is now "${status}".`,
    ``,
    `Thank you!`,
  ].join("\n");
}