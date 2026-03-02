"use client";

import { useState } from "react";
import { Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Review, ReviewType } from "@/lib/data/types";
import { deleteReview } from "@/lib/data/storage";
import { useAuth } from "@/lib/data/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

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

  export function ReviewList(props: {
    type: ReviewType;
    reviews: Review[];
    onChanged: () => void;
  }) {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
  
    const [confirmId, setConfirmId] = useState<string | null>(null);
  
    const confirmReview = confirmId
      ? props.reviews.find((r) => r.id === confirmId) ?? null
      : null;
  
    const canDelete = (r: Review) => {
      if (isAdmin) return true;
      // allow users to delete ONLY their own reviews (requires logged-in userId)
      return !!user && !!r.userId && r.userId === user.id;
    };
  
    const doDelete = () => {
      if (!confirmReview) return;
      deleteReview(confirmReview.id);
      toast.success("Review deleted");
      setConfirmId(null);
      props.onChanged();
    };
  
    if (props.reviews.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No {props.type === "experience" ? "experience" : "dish"} reviews yet.
          </p>
        </div>
      );
    }
  
    return (
      <>
        <div className="grid gap-3">
          {props.reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{r.userName}</p>
  
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
  
                    
  
                    {r.type === "dish" && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                        {r.menuItemName}
                      </span>
                    )}
  
                    {r.type === "experience" && r.tags?.length ? (
                      <span className="text-xs text-muted-foreground">• {r.tags.join(", ")}</span>
                    ) : null}
                  </div>

                  {/* rating stars */}
                  <div className="mt-2 text-sm text-foreground">
                    <Stars  value={r.rating} />
                  </div>
                  
  
                  <p className="mt-2 text-sm text-foreground">{r.comment}</p>
                </div>
  
                {canDelete(r) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmId(r.id)}
                    aria-label="Delete review"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
  
        {/* Confirmation popup */}
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