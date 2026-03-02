import type { Metadata } from "next";
import { AdminReviewsClient } from "@/components/admin/admin-reviews-client";

export const metadata: Metadata = {
  title: "Admin Reviews | HOMELY FOODS",
};

export default function AdminReviewsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-foreground">Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage experience and dish reviews (no approval system — delete if needed).
        </p>
      </div>

      <AdminReviewsClient />
    </div>
  );
}