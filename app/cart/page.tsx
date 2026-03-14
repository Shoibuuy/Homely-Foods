"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/data/store";
import { HPBadge } from "@/components/hp-coin";
import { OrderItemEditorDialog } from "@/components/orders/order-item-editor-dialog";
import { formatAED } from "@/lib/utils";
import { getCartItemCount } from "@/lib/orders/selectors";
import {
  calcCartItemLineTotal,
  calcOrderPricing,
  DEFAULT_PRICING_RULES,
} from "@/lib/orders/pricing";

export default function CartPage() {
  const {
    items,
    updateQuantity,
    updateItemDetails,
    removeItem,
    clearCart,
    estimatedHP,
  } = useCart();

  const itemCount = getCartItemCount(items);
  const pricing = calcOrderPricing({ items });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingItemId) ?? null,
    [items, editingItemId],
  );

  const getGroupedAddOns = (
    selectedAddOns: { id: string; name: string; price: number }[],
  ) => {
    const grouped = new Map<
      string,
      { id: string; name: string; price: number; quantity: number }
    >();

    for (const addOn of selectedAddOns) {
      const existing = grouped.get(addOn.id);

      if (existing) {
        existing.quantity += 1;
      } else {
        grouped.set(addOn.id, {
          id: addOn.id,
          name: addOn.name,
          price: addOn.price,
          quantity: 1,
        });
      }
    }

    return Array.from(grouped.values());
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>

        <h2 className="mb-2 font-serif text-2xl font-bold text-foreground">
          Your cart is empty
        </h2>

        <p className="mb-6 max-w-md text-muted-foreground">
          Add some delicious dishes from our menu to get started.
        </p>

        <Link href="/menu">
          <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
            Browse Menu
          </Button>
        </Link>
      </div>
    );
  }

  const amountNeededForFreeDelivery = Math.max(
    0,
    DEFAULT_PRICING_RULES.freeDeliveryThreshold - pricing.subtotal,
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="mb-4">
            <Link
              href="/menu"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Menu
            </Link>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">
                Your Cart
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Review your selected dishes before checkout
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground">
              <ShoppingBag className="h-4 w-4" />
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr] lg:gap-6">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {itemCount} {itemCount === 1 ? "item" : "items"} in cart
              </span>

              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-0 text-xs text-muted-foreground hover:text-destructive"
                onClick={clearCart}
              >
                Clear All
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((cartItem) => {
                const lineTotal = calcCartItemLineTotal(cartItem);
                const groupedAddOns = getGroupedAddOns(cartItem.selectedAddOns);
                const imageSrc = cartItem.menuItem.images?.[0];

                return (
                  <Card
                    key={cartItem.id}
                    className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_12px_34px_rgba(0,0,0,0.06)]"
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <Link
                            href={`/menu/${cartItem.menuItem.id}`}
                            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted sm:h-24 sm:w-24"
                          >
                            {imageSrc ? (
                              <Image
                                src={imageSrc}
                                alt={cartItem.menuItem.name}
                                fill
                                className="object-cover"
                                sizes="96px"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </Link>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/menu/${cartItem.menuItem.id}`}
                                  className="line-clamp-2 text-sm font-semibold leading-5 text-foreground transition-colors hover:text-gold-dark sm:text-base"
                                >
                                  {cartItem.menuItem.name}
                                </Link>

                                <p className="mt-1 text-xs font-medium text-muted-foreground">
                                  {cartItem.menuItem.category}
                                </p>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => removeItem(cartItem.id)}
                                aria-label={`Remove ${cartItem.menuItem.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {groupedAddOns.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {groupedAddOns.map((addOn) => (
                                  <span
                                    key={`${addOn.id}-${addOn.price}`}
                                    className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                                  >
                                    {addOn.name}
                                    {addOn.quantity > 1
                                      ? ` × ${addOn.quantity}`
                                      : ""}
                                    {addOn.price > 0
                                      ? ` • ${formatAED(addOn.price)}`
                                      : ""}
                                  </span>
                                ))}
                              </div>
                            ) : null}

                            {cartItem.note?.trim() ? (
                              <div className="mt-2 rounded-xl border border-amber-200/70 bg-amber-50 px-2.5 py-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                                  Special Instructions
                                </p>
                                <p className="mt-1 text-xs leading-5 text-amber-900">
                                  {cartItem.note.trim()}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-end justify-between gap-3 border-t border-border/60 pt-3">
                          <div className="inline-flex h-10 items-center rounded-full border border-border bg-background px-1 shadow-sm">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-muted-foreground"
                              onClick={() =>
                                updateQuantity(cartItem.id, cartItem.quantity - 1)
                              }
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>

                            <span className="min-w-8 text-center text-sm font-semibold text-foreground">
                              {cartItem.quantity}
                            </span>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-muted-foreground"
                              onClick={() =>
                                updateQuantity(cartItem.id, cartItem.quantity + 1)
                              }
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex flex-col items-end gap-1 text-right">
                            <p className="text-base font-bold leading-none text-foreground sm:text-lg">
                              {formatAED(lineTotal)}
                            </p>

                            <div>
                              <HPBadge
                                amount={
                                  cartItem.menuItem.hpReward * cartItem.quantity
                                }
                              />
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto px-0 py-0 text-xs font-semibold text-gold hover:bg-transparent hover:text-gold-dark"
                              onClick={() => {
                                setEditingItemId(cartItem.id);
                                setEditorOpen(true);
                              }}
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              View & Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-6">
              <Link href="/menu">
                <Button variant="outline" className="text-foreground">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>

          <div>
            <Card className="rounded-2xl border border-border/70 bg-card shadow-sm lg:sticky lg:top-24">
              <CardContent className="p-4 sm:p-5">
                <h2 className="mb-3 font-serif text-xl font-bold text-card-foreground sm:text-2xl">
                  Order Summary
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-card-foreground">
                      {formatAED(pricing.subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-medium text-green">
                      {pricing.deliveryFee === 0
                        ? "Free"
                        : formatAED(pricing.deliveryFee)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Points to earn</span>
                    <HPBadge amount={estimatedHP} />
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="mb-5 flex items-center justify-between">
                  <span className="font-semibold text-card-foreground">
                    Total
                  </span>
                  <span className="font-serif text-2xl font-bold text-card-foreground sm:text-3xl">
                    {formatAED(pricing.total)}
                  </span>
                </div>

                {pricing.deliveryFee > 0 && amountNeededForFreeDelivery > 0 ? (
                  <div className="mb-4 rounded-xl bg-gold/5 p-2.5 text-[11px] text-muted-foreground">
                    Add {formatAED(amountNeededForFreeDelivery)} more for free
                    delivery.
                  </div>
                ) : null}

                <Link href="/checkout">
                  <Button className="w-full bg-gold text-primary-foreground hover:bg-gold-dark">
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <OrderItemEditorDialog
          open={editorOpen}
          onOpenChange={(open) => {
            setEditorOpen(open);
            if (!open) {
              setEditingItemId(null);
            }
          }}
          item={editingItem}
          mode="edit"
          onSave={(payload) => {
            if (!editingItem) return;

            updateItemDetails(editingItem.id, {
              quantity: payload.quantity,
              selectedAddOns: payload.selectedAddOns,
              note: payload.note,
            });
          }}
        />
      </div>
    </div>
  );
}
