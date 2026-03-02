"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
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
import {
  subscribeCartDrawer,
  closeCartDrawer,
  getCartDrawerState,
} from "@/lib/cart-drawer-state";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, updateQuantity, removeItem, clearCart, subtotal, estimatedHP, itemCount } =
    useCart();

  useEffect(() => {
    setOpen(getCartDrawerState());
    const unsub = subscribeCartDrawer((state) => setOpen(state));
    return unsub;
  }, []);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) closeCartDrawer();
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col bg-card p-0 text-card-foreground sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 font-serif text-foreground">
              <ShoppingBag className="h-5 w-5 text-gold" />
              Your Cart
              {itemCount > 0 && (
                <span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-semibold text-gold-dark">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              )}
            </SheetTitle>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={clearCart}
              >
                Clear All
              </Button>
            )}
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
            <ScrollArea className="flex-1 px-6">
              <div className="py-4">
                {items.map((cartItem) => {
                  const addOnTotal = cartItem.selectedAddOns.reduce(
                    (s, a) => s + a.price,
                    0
                  );
                  const lineTotal =
                    (cartItem.menuItem.price + addOnTotal) * cartItem.quantity;

                  return (
                    <div
                      key={cartItem.menuItem.id}
                      className="mb-4 flex gap-3 rounded-lg border border-border/50 bg-background/50 p-3"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={cartItem.menuItem.images[0]}
                          alt={cartItem.menuItem.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>

                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium leading-tight text-foreground">
                            {cartItem.menuItem.name}
                          </h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(cartItem.menuItem.id)}
                            aria-label={`Remove ${cartItem.menuItem.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {cartItem.selectedAddOns.length > 0 && (
                          <p className="text-[10px] text-muted-foreground">
                            +{" "}
                            {cartItem.selectedAddOns
                              .map((a) => a.name)
                              .join(", ")}
                          </p>
                        )}

                        <div className="mt-auto flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1 rounded-lg border border-border">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground"
                              onClick={() =>
                                updateQuantity(
                                  cartItem.menuItem.id,
                                  cartItem.quantity - 1
                                )
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
                                updateQuantity(
                                  cartItem.menuItem.id,
                                  cartItem.quantity + 1
                                )
                              }
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="text-sm font-semibold text-foreground">
                            AED {lineTotal}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Summary */}
            <div className="border-t border-border px-6 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">AED {subtotal.toFixed(0)}</span>
              </div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Points to earn
                </span>
                <HPBadge amount={estimatedHP} />
              </div>
              <Separator className="mb-4" />
              <Link href="/checkout" onClick={() => handleOpenChange(false)}>
                <Button className="w-full bg-gold text-primary-foreground hover:bg-gold-dark">
                  Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link
                href="/cart"
                onClick={() => handleOpenChange(false)}
                className="mt-2 block text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                View full cart
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
