"use client";

import { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Clock,
  Minus,
  Plus,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { MenuCard } from "@/components/menu-card";
import { HPBadge } from "@/components/hp-coin";
import { useCart } from "@/lib/data/store";
import { openCartDrawer } from "@/lib/cart-drawer-state";
import { toast } from "sonner";
import { getMenuItems } from "@/lib/data/storage";
import { DishRatingSummary } from "@/components/reviews/dish-rating-summary";
import { DishReviewsSection } from "@/components/reviews/dish-reviews-section";
import type { AddOn, MenuItem } from "@/lib/data/types";

type SelectedAddOn = AddOn & {
  quantity: number;
};

export default function MenuDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { addItem } = useCart();

  const [mounted, setMounted] = useState(false);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOn[]>([]);
  const [note, setNote] = useState("");
  const [customizeOpen, setCustomizeOpen] = useState(true);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAllItems(getMenuItems());
  }, []);

  const item = useMemo(() => {
    if (!mounted) return undefined;
    return allItems.find((m) => m.id === id);
  }, [mounted, allItems, id]);

  const relatedItems = useMemo(() => {
    if (!item) return [];
    return allItems
      .filter((m) => m.categorySlug === item.categorySlug && m.id !== item.id)
      .slice(0, 3);
  }, [item, allItems]);

  const getAddOnQuantity = (addOnId: string) =>
    selectedAddOns.find((a) => a.id === addOnId)?.quantity ?? 0;

  const increaseAddOnQuantity = (addOn: AddOn) => {
    setSelectedAddOns((prev) => {
      const existing = prev.find((a) => a.id === addOn.id);
      if (existing) {
        return prev.map((a) =>
          a.id === addOn.id ? { ...a, quantity: a.quantity + 1 } : a,
        );
      }
      return [...prev, { ...addOn, quantity: 1 }];
    });
  };

  const decreaseAddOnQuantity = (addOnId: string) => {
    setSelectedAddOns((prev) => {
      const existing = prev.find((a) => a.id === addOnId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((a) => a.id !== addOnId);
      }
      return prev.map((a) =>
        a.id === addOnId ? { ...a, quantity: a.quantity - 1 } : a,
      );
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="aspect-4/3 animate-pulse rounded-xl bg-muted" />
            <div className="space-y-4">
              <div className="h-6 w-24 animate-pulse rounded bg-muted" />
              <div className="h-10 w-64 animate-pulse rounded bg-muted" />
              <div className="h-20 w-full animate-pulse rounded bg-muted" />
              <div className="h-12 w-40 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <h2 className="mb-2 font-serif text-2xl font-bold text-foreground">
          Dish Not Found
        </h2>
        <p className="mb-4 text-muted-foreground">
          The dish you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link href="/menu">
          <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
            Back to Menu
          </Button>
        </Link>
      </div>
    );
  }

  const addOnTotal = selectedAddOns.reduce(
    (sum, addOn) => sum + addOn.price * addOn.quantity,
    0,
  );
  const lineTotal = item.price * quantity + addOnTotal * quantity;
  const hpEarned = item.hpReward * quantity;

  const expandedAddOnsForCart = selectedAddOns.flatMap((addOn) =>
    Array.from({ length: addOn.quantity }, () => ({
      id: addOn.id,
      name: addOn.name,
      price: addOn.price,
    })),
  );

  const handleAddToCart = () => {
    addItem(item, quantity, expandedAddOnsForCart, note.trim() || undefined);

    toast.success(`${item.name} added to cart`, {
      description: `${
        note.trim() ? "With special instructions • " : ""
      }Qty: ${quantity} | +${hpEarned} HP will be earned`,
      action: {
        label: "View Cart",
        onClick: () => openCartDrawer(),
      },
    });
  };

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-3 lg:px-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-muted">
              <Image
                src={item.images[0]}
                alt={item.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />

              <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                {item.isDailySpecial ? (
                  <Badge className="bg-gold text-primary-foreground hover:bg-gold-dark">
                    Daily Special
                  </Badge>
                ) : null}
                {item.isLimitedOffer ? (
                  <Badge className="bg-blue-offer text-accent-foreground hover:bg-blue-offer/90">
                    Limited Offer
                  </Badge>
                ) : null}
                {item.isMostOrdered ? (
                  <Badge
                    variant="secondary"
                    className="bg-card/90 text-card-foreground backdrop-blur"
                  >
                    Most Ordered
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-wider text-gold">
                {item.category}
              </span>
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                <span className="text-sm font-medium text-foreground">
                  {item.rating}
                </span>
              </div>
            </div>

            <h1 className="mb-3 text-balance font-serif text-3xl font-bold text-foreground lg:text-4xl">
              {item.name}
            </h1>

            <div className="mb-4">
              <DishRatingSummary menuItemId={item.id} />
            </div>

            <p className="mb-4 leading-relaxed text-muted-foreground">
              {item.description}
            </p>

            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-muted-foreground">AED</span>
                <span className="font-serif text-3xl font-bold text-foreground">
                  {item.price}
                </span>
              </div>
              <HPBadge amount={item.hpReward} size="md" label="per item" />
            </div>

            <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Preparation time: {item.preparationTime}</span>
            </div>

            <Separator className="mb-6" />

            {item.addOns.length > 0 ? (
              <div className="mb-4 rounded-xl border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setCustomizeOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between px-4 py-4 text-left"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Customize Your Order
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Choose add-ons for this dish
                    </p>
                  </div>
                  {customizeOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {customizeOpen ? (
                  <div className="border-t border-border px-4 py-4">
                    <div className="space-y-2.5">
                      {item.addOns.map((addOn) => {
                        const addOnQty = getAddOnQuantity(addOn.id);

                        return (
                          <div
                            key={addOn.id}
                            className="flex items-center justify-between rounded-lg border border-border p-3"
                          >
                            <div className="min-w-0 pr-3">
                              <p className="text-sm font-medium text-foreground">
                                {addOn.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                +AED {addOn.price} each
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 rounded-lg border border-border">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground"
                                  onClick={() => decreaseAddOnQuantity(addOn.id)}
                                  disabled={addOnQty === 0}
                                  aria-label={`Decrease ${addOn.name}`}
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>

                                <span className="min-w-[24px] text-center text-sm font-medium text-foreground">
                                  {addOnQty}
                                </span>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground"
                                  onClick={() => increaseAddOnQuantity(addOn)}
                                  aria-label={`Increase ${addOn.name}`}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mb-6 flex items-center gap-4">
              <span className="text-sm font-semibold text-foreground">
                Quantity
              </span>

              <div className="flex items-center gap-1 rounded-lg border border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <span className="min-w-[32px] text-center font-medium text-foreground">
                  {quantity}
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground"
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-border bg-card">
              <button
                type="button"
                onClick={() => setInstructionsOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-4 py-4 text-left"
              >
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Special Instructions
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Add notes for preparation or delivery
                  </p>
                </div>
                {instructionsOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {instructionsOpen ? (
                <div className="border-t border-border px-4 py-4">
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Less spicy, no onions, sauce on the side"
                    className="min-h-[96px] resize-none bg-background"
                    maxLength={180}
                  />

                  <div className="mt-1 text-right text-xs text-muted-foreground">
                    {note.length}/180
                  </div>
                </div>
              ) : null}
            </div>

            <Separator className="mb-6" />

            <div className="mb-6 rounded-lg bg-muted/50 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.name} x {quantity}
                </span>
                <span className="text-foreground">AED {item.price * quantity}</span>
              </div>

              {selectedAddOns.map((ao) => (
                <div
                  key={ao.id}
                  className="mb-1 flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    + {ao.name} x {ao.quantity} × {quantity}
                  </span>
                  <span className="text-foreground">
                    AED {ao.price * ao.quantity * quantity}
                  </span>
                </div>
              ))}

              <Separator className="my-2" />

              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-serif text-xl font-bold text-foreground">
                  AED {lineTotal}
                </span>
              </div>

              <div className="mt-1.5 flex items-center justify-end">
                <HPBadge amount={hpEarned} label="HP earned" />
              </div>
            </div>

            <Button
              size="lg"
              className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
              onClick={handleAddToCart}
              disabled={!item.available}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart - AED {lineTotal}
            </Button>

            {item.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs text-muted-foreground"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <DishReviewsSection menuItemId={item.id} menuItemName={item.name} />

        {relatedItems.length > 0 ? (
          <div className="mt-16">
            <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">
              You Might Also Like
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedItems.map((rel) => (
                <MenuCard key={rel.id} item={rel} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}