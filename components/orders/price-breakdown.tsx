"use client";

import { Separator } from "@/components/ui/separator";

export function PriceBreakdown(props: {
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  total: number;
  currency?: string;
  className?: string;
}) {
  const currency = props.currency ?? "AED";
  const discount = props.discount ?? 0;

  return (
    <div className={props.className ?? ""}>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground">
            {currency} {props.subtotal.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Delivery</span>
          <span className={props.deliveryFee === 0 ? "text-green font-medium" : "text-foreground"}>
            {props.deliveryFee === 0 ? "Free" : `${currency} ${props.deliveryFee.toFixed(2)}`}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-green font-medium">Discount</span>
            <span className="text-green font-medium">
              - {currency} {discount.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <Separator className="my-4" />

      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">Total</span>
        <span className="font-serif text-2xl font-bold text-foreground">
          {currency} {props.total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}