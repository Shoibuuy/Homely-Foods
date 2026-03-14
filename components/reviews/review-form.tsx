"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { MenuItem, ReviewType } from "@/lib/data/types";
import { addDishReview, addExperienceReview } from "@/lib/data/storage";
import { useAuth } from "@/lib/data/store";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

function clampRating(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(1, Math.min(5, n));
}


export function ReviewForm(props: {
  type: ReviewType;
  menuItems: MenuItem[];
  defaultMenuItemId?: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [visitDate, setVisitDate] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [menuItemId, setMenuItemId] = useState(props.defaultMenuItemId ?? "");

  useEffect(() => {
    if (props.type === "dish" && props.defaultMenuItemId) {
      setMenuItemId(props.defaultMenuItemId);
    }
  }, [props.type, props.defaultMenuItemId]);

  const canSubmit = useMemo(() => {
    return (
      clampRating(rating) >= 1 &&
      comment.trim().length >= 5 &&
      (props.type !== "dish" || !!menuItemId)
    );
  }, [rating, comment, props.type, menuItemId]);

  const submit = () => {
    if (!canSubmit) return;

    const userId = user?.id ?? null;
    const userName = user?.name ?? "Guest";
    const userEmail = user?.email;

    if (props.type === "experience") {
      addExperienceReview({
        userId,
        userName,
        userEmail,
        rating: clampRating(rating),
        comment: comment.trim(),
        visitDate: visitDate || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      toast.success("Thanks! Your experience review is posted.");
    } else {
      addDishReview({
          userId,
          userName,
          userEmail,
          rating: clampRating(rating),
          comment: comment.trim(),
          menuItemId
      });
      toast.success("Thanks! Your dish review is posted.");
    }

    props.onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Write a {props.type === "experience" ? "experience" : "dish"} review
          </h2>
          <p className="text-sm text-muted-foreground">
            Posted instantly — no approval system.
          </p>
        </div>
        <Button variant="ghost" onClick={props.onCancel}>
          Cancel
        </Button>
      </div>

      {props.type === "dish" && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Dish</label>
          <select
            value={menuItemId} onChange={(e) => setMenuItemId(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
          >
            <option value="">Select a dish</option>
            {props.menuItems.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Rating</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="rounded-md p-1"
                aria-label={`Rate ${n} stars`}
              >
                <Star
                  className={cn(
                    "h-5 w-5",
                    n <= rating
                      ? "fill-gold text-gold"
                      : "text-muted-foreground",
                  )}
                />
              </button>
            ))}
            <span className="ml-2 text-xs text-muted-foreground">
              {rating}/5
            </span>
          </div>
        </div>

        {props.type === "experience" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Visit date (optional)
            </label>
            <Input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {props.type === "experience" && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Tags (optional)
          </label>
          <Input
            placeholder="e.g. service, ambience, delivery"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Comma-separated</p>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Comment</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a few words..."
          className="min-h-28"
        />
        <p className="text-xs text-muted-foreground">Minimum 5 characters.</p>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={props.onCancel}>
          Cancel
        </Button>
        <Button
          className="bg-gold text-primary-foreground hover:bg-gold-dark"
          disabled={!canSubmit}
          onClick={submit}
        >
          Post review
        </Button>
      </div>
    </div>
  );
}
