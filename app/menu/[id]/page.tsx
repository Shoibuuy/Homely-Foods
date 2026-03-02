"use client";

import { use, useState, useMemo } from "react";
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
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { MenuCard } from "@/components/menu-card";
import { HPBadge, HPCoin } from "@/components/hp-coin";
import { useCart } from "@/lib/data/store";
import { openCartDrawer } from "@/lib/cart-drawer-state";
import { toast } from "sonner";
import { menuItems } from "@/lib/data/mock-data";
import { DishRatingSummary } from "@/components/reviews/dish-rating-summary";
import { DishReviewsSection } from "@/components/reviews/dish-reviews-section";
import type { AddOn } from "@/lib/data/types";

export default function MenuDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { addItem } = useCart();

  const item = menuItems.find((m) => m.id === id);

  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);

  const relatedItems = useMemo(() => {
    if (!item) return [];
    return menuItems
      .filter((m) => m.categorySlug === item.categorySlug && m.id !== item.id)
      .slice(0, 3);
  }, [item]);

  if (!item) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <h2 className="mb-2 font-serif text-2xl font-bold text-foreground">
          Dish Not Found
        </h2>
        <p className="mb-4 text-muted-foreground">
          The dish you{"'"}re looking for doesn{"'"}t exist or has been removed.
        </p>
        <Link href="/menu">
          <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
            Back to Menu
          </Button>
        </Link>
      </div>
    );
  }

  const toggleAddOn = (addOn: AddOn) => {
    setSelectedAddOns((prev) =>
      prev.some((a) => a.id === addOn.id)
        ? prev.filter((a) => a.id !== addOn.id)
        : [...prev, addOn]
    );
  };

  const addOnTotal = selectedAddOns.reduce((s, a) => s + a.price, 0);
  const lineTotal = (item.price + addOnTotal) * quantity;
  const hpEarned = item.hpReward * quantity;

  const handleAddToCart = () => {
    addItem(item, quantity, selectedAddOns);
    toast.success(`${item.name} added to cart`, {
      description: `Qty: ${quantity} | +${hpEarned} HP will be earned`,
      action: {
        label: "View Cart",
        onClick: () => openCartDrawer(),
      },
    });
  };

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
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
          {/* Image Section */}
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
                {item.isDailySpecial && (
                  <Badge className="bg-gold text-primary-foreground hover:bg-gold-dark">
                    Daily Special
                  </Badge>
                )}
                {item.isLimitedOffer && (
                  <Badge className="bg-blue-offer text-accent-foreground hover:bg-blue-offer/90">
                    Limited Offer
                  </Badge>
                )}
                {item.isMostOrdered && (
                  <Badge
                    variant="secondary"
                    className="bg-card/90 text-card-foreground backdrop-blur"
                  >
                    Most Ordered
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
            {/* Category & Rating */}
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

            <h1 className="mb-3 font-serif text-3xl font-bold text-foreground lg:text-4xl text-balance">
              {item.name}
            </h1>
            <div className="mb-4">
  <DishRatingSummary menuItemId={item.id} />
</div>

            <p className="mb-4 leading-relaxed text-muted-foreground">
              {item.description}
            </p>

            {/* Price & HP */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-muted-foreground">AED</span>
                <span className="font-serif text-3xl font-bold text-foreground">
                  {item.price}
                </span>
              </div>
              <HPBadge amount={item.hpReward} size="md" label="per item" />
            </div>

            {/* Prep Time */}
            <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Preparation time: {item.preparationTime}</span>
            </div>

            <Separator className="mb-6" />

            {/* Add-ons */}
            {item.addOns.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  Customize Your Order
                </h3>
                <div className="space-y-2.5">
                  {item.addOns.map((addOn) => {
                    const isSelected = selectedAddOns.some(
                      (a) => a.id === addOn.id
                    );
                    return (
                      <label
                        key={addOn.id}
                        className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleAddOn(addOn)}
                          />
                          <span className="text-sm text-foreground">
                            {addOn.name}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          +AED {addOn.price}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
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

            <Separator className="mb-6" />

            {/* Order Summary */}
            <div className="mb-6 rounded-lg bg-muted/50 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.name} x {quantity}
                </span>
                <span className="text-foreground">
                  AED {item.price * quantity}
                </span>
              </div>
              {selectedAddOns.map((ao) => (
                <div
                  key={ao.id}
                  className="mb-1 flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    + {ao.name} x {quantity}
                  </span>
                  <span className="text-foreground">
                    AED {ao.price * quantity}
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

            {/* Add to Cart Button */}
            <Button
              size="lg"
              className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
              onClick={handleAddToCart}
              disabled={!item.available}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart - AED {lineTotal}
            </Button>

            {/* Tags */}
            {item.tags.length > 0 && (
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
            )}
          </div>
        </div>
        <DishReviewsSection menuItemId={item.id} menuItemName={item.name} />

        {/* Related Items */}
        {relatedItems.length > 0 && (
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
        )}
      </div>
    </div>
  );
}
