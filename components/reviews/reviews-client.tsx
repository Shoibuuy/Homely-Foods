  "use client";

  import { useEffect, useMemo, useState } from "react";
  import { useSearchParams } from "next/navigation";
  import { Button } from "@/components/ui/button";
  import { getMenuItems, getReviews } from "@/lib/data/storage";
  import type { ReviewType, Review } from "@/lib/data/types";
  import { ReviewForm } from "@/components/reviews/review-form";
  import { ReviewList } from "@/components/reviews/review-list";

  type SortMode = "newest" | "top";

  export function ReviewsClient() {
    const searchParams = useSearchParams();
    const menuItemIdFromUrl = searchParams.get("menuItemId") ?? "";
    const openFromUrl = searchParams.get("open") === "1";

    const [mounted, setMounted] = useState(false);
    const [type, setType] = useState<ReviewType>("experience");
    const [sort, setSort] = useState<SortMode>("newest");
    const [open, setOpen] = useState(false);
    const [tick, setTick] = useState(0);

    useEffect(() => setMounted(true), []);

    // Apply URL params after mount (SSR-safe)
    useEffect(() => {
      if (!mounted) return;

      const t = searchParams.get("type");
      if (t === "experience" || t === "dish") setType(t);

      // auto open form if open=1 OR menuItemId is present for dish
      if (openFromUrl) setOpen(true);
      
    }, [mounted, searchParams, openFromUrl, menuItemIdFromUrl]);

    const items = useMemo(() => (mounted ? getMenuItems() : []), [mounted]);

    const reviews = useMemo(() => {
      if (!mounted) return [];
  
  
    let base = getReviews({ type });
    if (type === "dish" && menuItemIdFromUrl) {
      base = base.filter((r: any) => r.menuItemId === menuItemIdFromUrl);
    }

  
      const sorted = [...base];

      if (sort === "top") {
        sorted.sort(
          (a, b) => b.rating - a.rating || (a.createdAt < b.createdAt ? 1 : -1)
        );
      } else {
        sorted.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      }

      return sorted;
    }, [mounted, type, sort, tick, menuItemIdFromUrl]);

    const onChanged = () => setTick((n) => n + 1);

    if (!mounted) {
      return (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Loading reviews…</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={type === "experience" ? "default" : "outline"}
              className={
                type === "experience"
                  ? "bg-gold text-primary-foreground hover:bg-gold-dark"
                  : ""
              }
              onClick={() => setType("experience")}
            >
              Experience
            </Button>

            <Button
              variant={type === "dish" ? "default" : "outline"}
              className={
                type === "dish"
                  ? "bg-gold text-primary-foreground hover:bg-gold-dark"
                  : ""
              }
              onClick={() => setType("dish")}
            >
              Dishes
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="newest">Newest</option>
              <option value="top">Highest rating</option>
            </select>

            <Button
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
              onClick={() => setOpen(true)}
            >
              Write a review
            </Button>
          </div>
        </div>

        {/* Form */}
        {open && (
          <div className="rounded-xl border border-border bg-card p-4">
           
            <ReviewForm
              type={type}
              menuItems={items}
              defaultMenuItemId={type === "dish" ? menuItemIdFromUrl : ""}
              onCancel={() => setOpen(false)}
              onSaved={() => {
                setOpen(false);
                onChanged();
              }}
            />
          </div>
        )}

        {/* List */}
        <ReviewList type={type} reviews={reviews as Review[]} onChanged={onChanged} />
      </div>
    );
  }