"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  ShoppingBag,
  Clock,
  ChevronRight,
  Receipt,
  Activity,
  Search,
} from "lucide-react";


import { formatAED } from "@/lib/utils";
import { useNow } from "@/lib/hooks/useNow";
import {
  getOrderEtaInfo,
  getOrderStatusTimestamp,
  formatTrackingTime,
} from "@/lib/orders/tracking";

import { getOrderItemCount, getOrderRef } from "@/lib/orders/selectors";
import { PAYMENT_LABELS, STATUS_COLORS } from "@/lib/orders/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { HPCoin } from "@/components/hp-coin";
import { useAuth } from "@/lib/data/store";
import { getUserOrders } from "@/lib/data/storage";
import type { Order } from "@/lib/data/types";

const STORE_EVENT = "homely_store_changed";

function getOrderPreview(order: Order) {
  const rawItems = Array.isArray((order as { items?: unknown[] }).items)
    ? ((order as { items?: unknown[] }).items ?? [])
    : [];

  const itemLines: string[] = [];
  let firstImage: string | undefined;

  for (const rawItem of rawItems) {
    if (!rawItem || typeof rawItem !== "object") continue;

    const item = rawItem as Record<string, unknown>;
    const menuItem = item.menuItem as
      | { name?: string; images?: string[] }
      | undefined;

    const possibleName =
      menuItem?.name ||
      (typeof item.name === "string" ? item.name : undefined) ||
      (typeof item.menuItemName === "string" ? item.menuItemName : undefined);

    const possibleImage =
      menuItem?.images?.[0] ||
      (typeof item.image === "string" ? item.image : undefined);

    const possibleQty =
      typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1;

    if (possibleName) {
      itemLines.push(`${possibleName} × ${possibleQty}`);
    }

    if (!firstImage && possibleImage) firstImage = possibleImage;
  }

  const firstLine = itemLines[0] ?? "Your order";
  const remainingCount = Math.max(itemLines.length - 1, 0);

  return {
    firstImage,
    firstLine,
    remainingCount,
    allLines: itemLines,
  };
}


function formatOrderDate(date: string) {
  return new Date(date).toLocaleString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CustomerOrdersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const now = useNow(1000);

  const [orders, setOrders] = useState<Order[]>([]);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) {
      setOrders([]);
      return;
    }

    setOrders(getUserOrders(user.id));
  }, [mounted, user]);

  useEffect(() => {
    if (!mounted || !user) return;

    const handleStoreChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ scope?: string }>;
      if (customEvent.detail?.scope === "orders") {
        setOrders(getUserOrders(user.id));
      }
    };

    window.addEventListener(STORE_EVENT, handleStoreChange);
    return () => {
      window.removeEventListener(STORE_EVENT, handleStoreChange);
    };
  }, [mounted, user]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [orders]);
  
  const filteredOrders = useMemo(() => {
    return sortedOrders.filter((order) => {
      const preview = getOrderPreview(order);
      const searchHaystack = [
        getOrderRef(order),
        preview.firstLine,
        ...preview.allLines,
      ]
        .join(" ")
        .toLowerCase();
  
      const matchesSearch = searchTerm.trim()
        ? searchHaystack.includes(searchTerm.trim().toLowerCase())
        : true;
  
      const matchesStatus =
        statusFilter === "all" ? true : order.status === statusFilter;
  
      const orderDate = order.createdAt.slice(0, 10);
      const matchesDate = dateFilter ? orderDate === dateFilter : true;
  
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [sortedOrders, searchTerm, statusFilter, dateFilter]);
  

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
            <div className="h-5 w-20 animate-pulse rounded bg-muted" />
            <div className="mt-4 h-9 w-40 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted" />
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <div className="h-44 animate-pulse rounded-3xl bg-muted" />
            <div className="h-44 animate-pulse rounded-3xl bg-muted" />
            <div className="h-44 animate-pulse rounded-3xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>

        <h1 className="mb-2 font-serif text-2xl font-bold text-foreground">
          Sign in to view your orders
        </h1>

        <p className="mb-6 max-w-md text-muted-foreground">
          Please sign in to view your order history and track active orders.
        </p>

        <Link href="/login">
          <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">
                My Orders
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                View your order history and latest status updates.
              </p>
            </div>

            {sortedOrders.length > 0 ? (
  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground">
    <Receipt className="h-4 w-4" />
    {filteredOrders.length} order
    {filteredOrders.length !== 1 ? "s" : ""}
  </div>
) : null}

          </div>
          {sortedOrders.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by order ID or item"
                  className="h-11 rounded-xl border-border/70 pl-9"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground"
              >
                <option value="all">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Preparing">Preparing</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-11 rounded-xl border-border/70"
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-5 sm:px-6 lg:px-8">

        {sortedOrders.length === 0 ? (
          <Card className="rounded-3xl border border-border/70 bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Package className="h-7 w-7 text-muted-foreground" />
              </div>

              <h2 className="mb-2 font-serif text-2xl font-bold text-foreground">
                No orders yet
              </h2>

              <p className="mb-6 max-w-md text-muted-foreground">
                You haven’t placed any orders yet. Start exploring our menu and
                order your favorite dishes.
              </p>

              <Link href="/menu">
                <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
                  Browse Menu
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card className="rounded-3xl border border-border/70 bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <CardContent className="px-6 py-14 text-center">
                <h2 className="font-serif text-2xl font-bold text-foreground">
                  No matching orders
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Try adjusting your search, date, or status filters.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {filteredOrders.map((order) => {

              const itemCount = getOrderItemCount(order);
              const etaInfo = getOrderEtaInfo(order, now);
              const preview = getOrderPreview(order);
              const showStatusPage = true;


              return (
                <Card
                  key={order.id}
                  className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_12px_34px_rgba(0,0,0,0.06)]"
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-4 sm:p-5">
                        <div className="flex gap-3 sm:gap-4">
                        <div className="shrink-0">
  <div className="h-20 w-20 overflow-hidden rounded-2xl border border-border/70 bg-muted sm:h-24 sm:w-24">
    {preview.firstImage ? (
      <img
        src={preview.firstImage}
        alt={preview.firstLine}
        className="h-full w-full object-cover"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center">
        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
      </div>
    )}
  </div>

  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[11px] font-medium text-white">
    <HPCoin size="sm" />
    +{order.hpEarned ?? 0} HP
  </div>
  {(order.hpRedeemed ?? 0) > 0 ? (
    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-offer px-2.5 py-1 text-[11px] font-medium text-white">
      <HPCoin size="sm" />
      -{order.hpRedeemed} HP
    </div>
  ) : null}
</div>


                          <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
  <div className="inline-flex w-fit items-center rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-muted-foreground sm:text-xs">
    {getOrderRef(order)}
  </div>

  <div className="flex flex-wrap items-center gap-2">
    <Badge
      variant="outline"
      className={STATUS_COLORS[order.status] || ""}
    >
      {order.status}
    </Badge>

    {etaInfo ? (
      <Badge
        variant="outline"
        className={
          etaInfo.type === "delay"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-blue-200 bg-blue-50 text-blue-700"
        }
      >
        <Clock className="mr-1 h-3 w-3" />
        {etaInfo.text}
      </Badge>
    ) : null}
  </div>

  {formatTrackingTime(getOrderStatusTimestamp(order, order.status)) ? (
    <p className="text-xs text-muted-foreground">
      {formatTrackingTime(getOrderStatusTimestamp(order, order.status))}
    </p>
  ) : null}
</div>


<h2 className="mt-3 line-clamp-1 font-serif text-lg font-bold text-foreground sm:text-[1.35rem]">
  {preview.firstLine}
  {preview.remainingCount > 0 ? ` +${preview.remainingCount} more` : ""}
</h2>

{preview.allLines.length > 1 ? (
  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
    {preview.allLines.join(", ")}
  </p>
) : (
  <p className="mt-1 text-sm text-muted-foreground">
    {itemCount} item{itemCount !== 1 ? "s" : ""}
  </p>
)}


                            <Separator className="my-4" />

                            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                                  Ordered On
                                </p>
                                <p className="mt-1 font-medium text-foreground">
                                  {formatOrderDate(order.createdAt)}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                                  Payment
                                </p>
                                <p className="mt-1 font-medium text-foreground">
                                  {PAYMENT_LABELS[order.paymentMethod]}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-border bg-muted/20 p-4 sm:p-5 md:flex md:w-[260px] md:flex-col md:justify-between md:border-l md:border-t-0">
                        <div className="mb-4 md:mb-5 md:text-right">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
                            {formatAED(order.total)}
                          </p>
                        </div>

                        <div className="flex w-full flex-col gap-2.5">
                          {showStatusPage ? (
                            <Link
                              href={`/orders/success/${order.id}`}
                              className="w-full"
                            >
                              <Button
                                variant="outline"
                                className="h-10 w-full rounded-xl border-border/70 text-foreground"
                              >
                                <Activity className="mr-2 h-4 w-4" />
                                Status Page
                              </Button>
                            </Link>
                          ) : null}

                          <Link href={`/orders/${order.id}`} className="w-full">
                            <Button className="h-10 w-full rounded-xl bg-gold text-primary-foreground hover:bg-gold-dark">
                              View Details
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
