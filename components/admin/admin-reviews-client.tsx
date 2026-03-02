"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteReview, getReviews } from "@/lib/data/storage";
import type { Review, ReviewType } from "@/lib/data/types";
import { useAuth } from "@/lib/data/store";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SortMode = "newest" | "top";

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-4 w-4",
            n <= value ? "fill-gold text-gold" : "text-muted-foreground"
          )}
        />
      ))}
    </div>
  );
}

function avgRating(reviews: Review[]) {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((a, r) => a + (r.rating || 0), 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export function AdminReviewsClient() {
  const router = useRouter();
  const { user } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);

  const [type, setType] = useState<ReviewType | "all">("all");
  const [minRating, setMinRating] = useState<number | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");

  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  // Guard: admin only
  useEffect(() => {
    if (!mounted) return;
    if (!user) router.replace("/login");
    else if (user.role !== "admin") router.replace("/");
  }, [mounted, user, router]);

  const allReviews = useMemo(() => {
    if (!mounted) return [];
    // getReviews supports params; but for admin we want all
    return getReviews();
  }, [mounted, tick]);

  const filtered = useMemo(() => {
    let list = [...allReviews];

    if (type !== "all") list = list.filter((r) => r.type === type);
    if (minRating !== "all") list = list.filter((r) => r.rating >= minRating);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const hay = [
          r.userName,
          r.comment,
          r.type,
          r.type === "dish" ? r.menuItemName : "",
          r.userEmail ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (sort === "top") {
      list.sort((a, b) => b.rating - a.rating || (a.createdAt < b.createdAt ? 1 : -1));
    } else {
      list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }

    return list;
  }, [allReviews, type, minRating, query, sort]);

  const stats = useMemo(() => {
    const total = allReviews.length;
    const avg = avgRating(allReviews);
    const experienceCount = allReviews.filter((r) => r.type === "experience").length;
    const dishCount = allReviews.filter((r) => r.type === "dish").length;
    return { total, avg, experienceCount, dishCount };
  }, [allReviews]);

  const confirmReview = confirmId ? allReviews.find((r) => r.id === confirmId) ?? null : null;

  const doDelete = () => {
    if (!confirmReview) return;
    deleteReview(confirmReview.id);
    toast.success("Review deleted");
    setConfirmId(null);
    setTick((n) => n + 1);
  };

  if (!mounted) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  // While redirecting non-admins
  if (!user || user.role !== "admin") {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Checking access…</p>
      </div>
    );
  }

  return (
    <>
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total reviews</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Average rating</p>
          <div className="mt-2 flex items-center gap-2">
            <Stars value={Math.round(stats.avg)} />
            <span className="text-sm font-semibold text-foreground">{stats.avg}</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Experience</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.experienceCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Dish</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.dishCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All</option>
              <option value="experience">Experience</option>
              <option value="dish">Dish</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Min rating</span>
            <select
              value={minRating}
              onChange={(e) =>
                setMinRating(e.target.value === "all" ? "all" : Number(e.target.value))
              }
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All</option>
              <option value="5">5</option>
              <option value="4">4+</option>
              <option value="3">3+</option>
              <option value="2">2+</option>
              <option value="1">1+</option>
            </select>
          </div>

          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, dish, comment…"
            className="h-9 bg-background text-sm sm:w-72"
          />
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

          <Button variant="outline" onClick={() => { setType("all"); setMinRating("all"); setQuery(""); setSort("newest"); }}>
            Reset
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="mt-4 grid gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No reviews match your filters.</p>
          </div>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{r.userName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                    <Stars value={r.rating} />
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                      {r.type === "dish" ? `Dish: ${r.menuItemName}` : "Experience"}
                    </span>
                    {r.userEmail ? (
                      <span className="text-xs text-muted-foreground">• {r.userEmail}</span>
                    ) : null}
                  </div>

                  <p className="mt-2 wrap-break-word text-sm text-foreground">{r.comment}</p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmId(r.id)}
                  aria-label="Delete review"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirm delete */}
      <AlertDialog open={!!confirmId} onOpenChange={(open) => !open && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>
              This action can’t be undone. The review will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}