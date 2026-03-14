"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/lib/data/store";
import { HPBadge } from "@/components/hp-coin";
import { formatAED } from "@/lib/utils";
import {
  subscribeCartDrawer,
  closeCartDrawer,
  getCartDrawerState,
} from "@/lib/cart-drawer-state";
import {
  calcCartItemLineTotal,
  calcOrderPricing,
  DEFAULT_PRICING_RULES,
} from "@/lib/orders/pricing";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, updateQuantity, removeItem, clearCart, estimatedHP, itemCount } =
    useCart();

  const pricing = calcOrderPricing({ items });

  useEffect(() => {
    setOpen(getCartDrawerState());
    const unsub = subscribeCartDrawer((state) => setOpen(state));
    return unsub;
  }, []);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) closeCartDrawer();
  };

  const amountNeededForFreeDelivery = Math.max(
    0,
    DEFAULT_PRICING_RULES.freeDeliveryThreshold - pricing.subtotal,
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col bg-card p-0 text-card-foreground sm:max-w-md">
        <SheetHeader className="border-b border-border px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => handleOpenChange(false)}
                aria-label="Close cart and go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <SheetTitle className="flex items-center gap-2 font-serif text-foreground">
                <ShoppingBag className="h-5 w-5 text-gold" />
                Your Cart
                {itemCount > 0 ? (
                  <span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-semibold text-gold-dark">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </span>
                ) : null}
              </SheetTitle>
            </div>

            {items.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={clearCart}
              >
                Clear All
              </Button>
            ) : null}
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-1 font-serif text-lg font-semibold text-foreground">
              Your cart is empty
            </h3>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Browse our menu and add delicious items to get started.
            </p>
            <Link href="/menu" onClick={() => handleOpenChange(false)}>
              <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
                Explore Menu
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-4 sm:px-6">
              <div className="py-4">
                {items.map((cartItem) => {
                  const lineTotal = calcCartItemLineTotal(cartItem);
                  const imageSrc = cartItem.menuItem.images?.[0];

                  return (
                    <div
                      key={cartItem.id}
                      className="mb-4 rounded-xl border border-border/50 bg-background/50 p-3"
                    >
                      <div className="flex gap-3">
                        <Link
                          href={`/menu/${cartItem.menuItem.id}`}
                          onClick={() => handleOpenChange(false)}
                          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"
                        >
                          {imageSrc ? (
                            <Image
                              src={imageSrc}
                              alt={cartItem.menuItem.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </Link>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/menu/${cartItem.menuItem.id}`}
                              onClick={() => handleOpenChange(false)}
                              className="min-w-0"
                            >
                              <h4 className="line-clamp-2 text-sm font-medium leading-tight text-foreground hover:text-gold-dark">
                                {cartItem.menuItem.name}
                              </h4>
                            </Link>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeItem(cartItem.id)}
                              aria-label={`Remove ${cartItem.menuItem.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          {cartItem.selectedAddOns.length > 0 ? (
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              + {cartItem.selectedAddOns.map((a) => a.name).join(", ")}
                            </p>
                          ) : null}

                          {cartItem.note?.trim() ? (
                            <p className="mt-1 text-[10px] text-amber-800">
                              Note: {cartItem.note.trim()}
                            </p>
                          ) : null}

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1 rounded-lg border border-border">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground"
                                onClick={() =>
                                  updateQuantity(cartItem.id, cartItem.quantity - 1)
                                }
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>

                              <span className="min-w-[20px] text-center text-xs font-medium text-foreground">
                                {cartItem.quantity}
                              </span>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground"
                                onClick={() =>
                                  updateQuantity(cartItem.id, cartItem.quantity + 1)
                                }
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            <span className="text-sm font-semibold text-foreground">
                              {formatAED(lineTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="border-t border-border px-4 py-4 sm:px-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">
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

              {pricing.deliveryFee > 0 && amountNeededForFreeDelivery > 0 ? (
                <p className="mb-4 mt-3 rounded-lg bg-gold/5 p-3 text-xs text-muted-foreground">
                  Add {formatAED(amountNeededForFreeDelivery)} more for free
                  delivery!
                </p>
              ) : null}

              <div className="mb-6 flex items-center justify-between">
                <span className="font-semibold text-card-foreground">Total</span>
                <span className="font-serif text-2xl font-bold text-card-foreground">
                  {formatAED(pricing.total)}
                </span>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Points to earn
                </span>
                <HPBadge amount={estimatedHP} />
              </div>

              <Separator className="mb-4" />

              <div className="space-y-2">
                <Link href="/checkout" onClick={() => handleOpenChange(false)}>
                  <Button className="w-full bg-gold text-primary-foreground hover:bg-gold-dark">
                    Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                <Link href="/cart" onClick={() => handleOpenChange(false)}>
                  <Button variant="outline" className="w-full text-foreground">
                    View Full Cart
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                  onClick={() => handleOpenChange(false)}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}