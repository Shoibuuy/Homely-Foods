import type { Metadata } from "next";
import { ReviewsClient } from "@/components/reviews/reviews-client";

export const metadata: Metadata = {
  title: "Reviews | HOMELY FOODS",
  description: "Read and write reviews about your HOMELY FOODS experience and dishes.",
};

export default function ReviewsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-foreground">Reviews</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Share your experience or review a dish you tried.
        </p>
      </div>

      <ReviewsClient />
    </div>
  );
}