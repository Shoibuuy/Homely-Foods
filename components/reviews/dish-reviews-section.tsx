"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReviewList } from "@/components/reviews/review-list";
import { getReviews } from "@/lib/data/storage";
import type { Review } from "@/lib/data/types";

export function DishReviewsSection({
  menuItemId,
  menuItemName,
}: {
  menuItemId: string;
  menuItemName: string;
}) {
  const [tick, setTick] = useState(0);
  const reviews = getReviews({ type: "dish", menuItemId }) as Review[];
  void tick;

  // newest first (string ISO sort)
  const sorted = [...reviews].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const top = sorted.slice(0, 3);

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-foreground">Reviews</h2>
          <p className="text-sm text-muted-foreground">
            What people say about <span className="font-medium text-foreground">{menuItemName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/reviews?type=dish&menuItemId=${encodeURIComponent(menuItemId)}&open=1`}>
            <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
              Write a review
            </Button>
          </Link>

          <Link href={`/reviews?type=dish&menuItemId=${encodeURIComponent(menuItemId)}`}>
            <Button variant="outline">View all</Button>
          </Link>
        </div>
      </div>

      {top.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No reviews yet. Be the first to review this dish.
          </p>
        </div>
      ) : (
        <ReviewList type="dish" reviews={top} onChanged={() => setTick((n) => n + 1)} />
      )}
    </div>
  );
}