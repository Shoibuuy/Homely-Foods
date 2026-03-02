"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/data/store";
import { HPBadge } from "@/components/hp-coin";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal, estimatedHP } =
    useCart();

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-1 font-serif text-2xl font-bold text-foreground">
          Your cart is empty
        </h2>
        <p className="mb-6 text-muted-foreground">
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

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">
            Your Cart
          </h1>
          <p className="text-muted-foreground">
            Review your items before checkout
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "items"} in cart
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={clearCart}
              >
                Clear All
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((cartItem) => {
                const addOnTotal = cartItem.selectedAddOns.reduce(
                  (s, a) => s + a.price,
                  0
                );
                const lineTotal =
                  (cartItem.menuItem.price + addOnTotal) * cartItem.quantity;

                return (
                  <Card key={cartItem.menuItem.id} className="border-border bg-card shadow-sm">
                    <CardContent className="flex gap-4 p-4">
                      <Link
                        href={`/menu/${cartItem.menuItem.id}`}
                        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted"
                      >
                        <Image
                          src={cartItem.menuItem.images[0]}
                          alt={cartItem.menuItem.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </Link>

                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link
                              href={`/menu/${cartItem.menuItem.id}`}
                              className="font-serif text-base font-semibold text-card-foreground hover:text-gold-dark"
                            >
                              {cartItem.menuItem.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {cartItem.menuItem.category}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(cartItem.menuItem.id)}
                            aria-label={`Remove ${cartItem.menuItem.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {cartItem.selectedAddOns.length > 0 && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Add-ons:{" "}
                            {cartItem.selectedAddOns
                              .map((a) => `${a.name} (+AED ${a.price})`)
                              .join(", ")}
                          </p>
                        )}

                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex items-center gap-1 rounded-lg border border-border">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground"
                              onClick={() =>
                                updateQuantity(
                                  cartItem.menuItem.id,
                                  cartItem.quantity - 1
                                )
                              }
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <span className="min-w-[28px] text-center text-sm font-medium text-foreground">
                              {cartItem.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground"
                              onClick={() =>
                                updateQuantity(
                                  cartItem.menuItem.id,
                                  cartItem.quantity + 1
                                )
                              }
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          <div className="text-right">
                            <p className="font-serif text-lg font-bold text-card-foreground">
                              AED {lineTotal}
                            </p>
                            <HPBadge amount={cartItem.menuItem.hpReward * cartItem.quantity} />
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

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24 border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <h2 className="mb-4 font-serif text-xl font-bold text-card-foreground">
                  Order Summary
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-card-foreground">
                      AED {subtotal.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-medium text-green">
                      {subtotal >= 100 ? "Free" : "AED 10"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Points to earn</span>
                    <HPBadge amount={estimatedHP} />
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="mb-6 flex items-center justify-between">
                  <span className="font-semibold text-card-foreground">Total</span>
                  <span className="font-serif text-2xl font-bold text-card-foreground">
                    AED{" "}
                    {(subtotal + (subtotal >= 100 ? 0 : 10)).toFixed(0)}
                  </span>
                </div>

                {subtotal < 100 && (
                  <p className="mb-4 rounded-lg bg-gold/5 p-3 text-xs text-muted-foreground">
                    Add AED {(100 - subtotal).toFixed(0)} more for free delivery!
                  </p>
                )}

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
      </div>
    </div>
  );
}
