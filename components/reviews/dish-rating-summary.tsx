"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getReviews } from "@/lib/data/storage";

function Stars({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-4 w-4",
            n <= rounded ? "fill-gold text-gold" : "text-muted-foreground"
          )}
        />
      ))}
    </div>
  );
}

export function DishRatingSummary({ menuItemId }: { menuItemId: string }) {
  const reviews = getReviews({ type: "dish", menuItemId });
  const count = reviews.length;
  const avg =
    count === 0 ? 0 : Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Stars value={avg || 0} />
          <div className="text-sm">
            <span className="font-semibold text-foreground">{avg || "—"}</span>
            <span className="text-muted-foreground"> / 5</span>
            <span className="ml-2 text-muted-foreground">({count} review{count === 1 ? "" : "s"})</span>
          </div>
        </div>

        <Link
           href={`/reviews?type=dish&menuItemId=${encodeURIComponent(menuItemId)}&open=1`}
          className="text-sm font-semibold text-gold hover:text-gold-dark"
        >
          Write a review →
        </Link>
      </div>
    </div>
  );
}