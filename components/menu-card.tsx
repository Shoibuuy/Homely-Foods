"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HPBadge } from "@/components/hp-coin";
import { useCart } from "@/lib/data/store";
import { openCartDrawer } from "@/lib/cart-drawer-state";
import { toast } from "sonner";
import type { MenuItem } from "@/lib/data/types";

interface MenuCardProps {
  item: MenuItem;
  className?: string;
}

export function MenuCard({ item, className }: MenuCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.available) return;
    addItem(item, 1, []);
    toast.success(`${item.name} added to cart`, {
      description: `+${item.hpReward} HP will be earned`,
      action: {
        label: "View Cart",
        onClick: () => openCartDrawer(),
      },
    });
  };

  return (
    <Link
      href={`/menu/${item.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md",
        !item.available && "opacity-60",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        <Image
          src={item.images[0]}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Badges overlay */}
        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          {item.isDailySpecial && (
            <Badge className="bg-gold text-primary-foreground shadow-sm hover:bg-gold-dark">
              Daily Special
            </Badge>
          )}
          {item.isLimitedOffer && (
            <Badge className="bg-blue-offer text-accent-foreground shadow-sm hover:bg-blue-offer/90">
              Limited Offer
            </Badge>
          )}
          {item.isMostOrdered && (
            <Badge
              variant="secondary"
              className="bg-card/90 text-card-foreground shadow-sm backdrop-blur"
            >
              Most Ordered
            </Badge>
          )}
        </div>

        {/* HP reward badge */}
        {item.hpReward > 0 && (
          <div className="absolute right-2 top-2">
            <HPBadge amount={item.hpReward} className="bg-card/90 backdrop-blur" />
          </div>
        )}

        {!item.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
            <span className="rounded-full bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
              Currently Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-gold">
            {item.category}
          </span>
          <span className="text-muted-foreground/30">|</span>
          <div className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-gold text-gold" />
            <span className="text-xs text-muted-foreground">
              {item.rating}
            </span>
          </div>
        </div>

        <h3 className="mb-1.5 font-serif text-base font-semibold leading-tight text-card-foreground transition-colors group-hover:text-gold-dark">
          {item.name}
        </h3>

        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {item.description}
        </p>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-muted-foreground">AED</span>
            <span className="font-serif text-lg font-bold text-card-foreground">
              {item.price}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="text-[10px]">{item.preparationTime}</span>
            </div>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 border-gold/30 text-gold hover:bg-gold hover:text-primary-foreground"
              onClick={handleAddToCart}
              disabled={!item.available}
              aria-label={`Add ${item.name} to cart`}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
