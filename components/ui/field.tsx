"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Star, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import {
  addExperienceReview,
  getExperienceReviews,
  getMenuItems,
  generateId,
} from "@/lib/data/storage";

import type { ExperienceReview, MenuItem } from "@/lib/data/types";

function StarsPreview({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < value ? "fill-gold text-gold" : "text-border"
          }`}
        />
      ))}
    </div>
  );
}

function StarsPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const v = i + 1;
        return (
          <button
            type="button"
            key={v}
            onClick={() => onChange(v)}
            className="rounded-md p-1 transition hover:bg-muted"
            aria-label={`Rate ${v} stars`}
          >
            <Star
              className={`h-5 w-5 ${
                v <= value ? "fill-gold text-gold" : "text-border"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function ReviewsPage() {
  const [all, setAll] = useState<ExperienceReview[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    setAll(getExperienceReviews());
    setMenuItems(getMenuItems());
  }, []);

  const stats = useMemo(() => {
    const count = all.length;
    const avg =
      count === 0 ? 0 : all.reduce((s, r) => s + (r.rating || 0), 0) / count;

    const rounded = Math.round(avg * 10) / 10;
    return { count, avg: rounded };
  }, [all]);

  function refresh() {
    setAll(getExperienceReviews());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanComment = comment.trim();

    if (!cleanName) {
      toast.error("Please enter your name");
      return;
    }
    if (cleanComment.length < 10) {
      toast.error("Please write at least 10 characters");
      return;
    }

    const review: ExperienceReview = {
      id: generateId("exp"),
      name: cleanName,
      rating,
      comment: cleanComment,
      createdAt: new Date().toISOString(),
    };

    addExperienceReview(review);
    toast.success("Thanks! Your review is posted.");

    setName("");
    setComment("");
    setRating(5);
    refresh();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Reviews
        </h1>
        <p className="text-muted-foreground">
          See what guests say about Homely Foods — and share your experience.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Badge className="bg-gold/15 text-gold-dark hover:bg-gold/20">
            {stats.count} Experience Reviews
          </Badge>
          <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
            <StarsPreview value={Math.round(stats.avg)} />
            <span className="text-sm font-semibold text-foreground">
              {stats.avg || 0}
            </span>
            <span className="text-xs text-muted-foreground">/ 5</span>
          </div>
        </div>
      </div>

      {/* Two cards: Experience Reviews + Dish Reviews CTA */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Experience Review Form */}
        <Card className="border-border/60 bg-card">
          <CardContent className="p-6">
            <div className="mb-4">
              <h2 className="font-serif text-xl font-bold text-foreground">
                Share your experience
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tell us about your visit, the ambience, and how we can improve.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Your feedback helps us craft better dining experiences for you
                and your loved ones.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-foreground">Rating</p>
                <StarsPicker value={rating} onChange={setRating} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-foreground">Name</p>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-foreground">
                    Quick vibe (optional)
                  </p>
                  <Input
                    value={""}
                    onChange={() => {}}
                    placeholder="e.g., Cozy, Fast service..."
                    disabled
                  />
                  <p className="text-[11px] text-muted-foreground">
                    We’ll add this optional field later.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-foreground">Message</p>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience in a few lines..."
                  rows={5}
                />
              </div>

              <Button
                type="submit"
                className="bg-gold text-primary-foreground hover:bg-gold-dark"
              >
                Post Review
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Dish Reviews CTA */}
        <Card className="border-border/60 bg-card">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                <UtensilsCrossed className="h-5 w-5 text-gold-dark" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">
                  Dish reviews
                </h2>
                <p className="text-sm text-muted-foreground">
                  Loved a dish? Review it directly from the menu item page.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <p className="text-sm text-foreground">
                Best experience: open any dish and add a quick review — it helps
                others choose better.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {menuItems.slice(0, 6).map((item) => (
                  <Link key={item.id} href={`/menu/${item.id}`}>
                    <Button variant="outline" size="sm">
                      {item.name}
                    </Button>
                  </Link>
                ))}
              </div>

              <div className="mt-4">
                <Link href="/menu">
                  <Button variant="outline" className="w-full">
                    Browse Menu & Review Dishes
                  </Button>
                </Link>
              </div>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Dish reviews are tied to a specific menu item and show on that
              item’s detail page.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Experience Reviews List */}
      <div className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Latest experience reviews
            </h2>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {all.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card p-8 text-center text-muted-foreground">
              No reviews yet. Be the first to share your experience.
            </div>
          ) : (
            all.map((r) => (
              <Card key={r.id} className="border-border/60 bg-card shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {r.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("en-AE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <StarsPreview value={r.rating} />
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {r.comment}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}