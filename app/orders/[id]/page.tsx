"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Package,
  ShoppingBag,
  CheckCircle2,
  Circle,
  Truck,
  CreditCard,
  Banknote,
  AlertTriangle,
  ChevronRight,
  Star,
  ChevronDown,
  ChevronUp,
  Phone,
  User,
  FileText,
  Eye,
} from "lucide-react";

import { formatAED } from "@/lib/utils";
import { useNow } from "@/lib/hooks/useNow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/data/store";
import { getUserOrders } from "@/lib/data/storage";
import type { Order, OrderStatus } from "@/lib/data/types";
import { STATUS_COLORS, PAYMENT_LABELS } from "@/lib/orders/constants";
import {
  getOrderEtaInfo,
  getOrderStatusTimestamp,
  formatTrackingTime,
} from "@/lib/orders/tracking";

import {
  getOrderItemCount,
  getOrderRef,
  getCartItemLineTotal,
} from "@/lib/orders/selectors";
import { PriceBreakdown } from "@/components/orders/price-breakdown";
import { OrderItemEditorDialog } from "@/components/orders/order-item-editor-dialog";

const STORE_EVENT = "homely_store_changed";

const TRACKING_FLOW: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
];

function getOrderByIdForUser(userId: string, orderId: string): Order | null {
  return getUserOrders(userId).find((order) => order.id === orderId) ?? null;
}

function getStepState(orderStatus: OrderStatus, step: OrderStatus) {
  if (orderStatus === "Cancelled") return "upcoming";

  const currentIndex = TRACKING_FLOW.indexOf(orderStatus);
  const stepIndex = TRACKING_FLOW.indexOf(step);

  if (stepIndex < currentIndex) return "done";
  if (stepIndex === currentIndex) return "current";
  return "upcoming";
}

function formatOrderDate(value: string) {
  return new Date(value).toLocaleString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getGroupedAddOns(
  addOns: { id: string; name: string; price: number }[],
) {
  const grouped = new Map<string, { name: string; quantity: number }>();

  for (const addOn of addOns) {
    const existing = grouped.get(addOn.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      grouped.set(addOn.id, {
        name: addOn.name,
        quantity: 1,
      });
    }
  }

  return Array.from(grouped.values());
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const now = useNow(1000);

  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [deliveryDetailsOpen, setDeliveryDetailsOpen] = useState(false);
  const [viewingItemId, setViewingItemId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user || !params?.id) {
      setOrder(null);
      return;
    }

    setOrder(getOrderByIdForUser(user.id, params.id));
  }, [mounted, user, params?.id]);

  useEffect(() => {
    if (!mounted || !user || !params?.id) return;

    const handleStoreChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ scope?: string }>;
      if (customEvent.detail?.scope === "orders") {
        setOrder(getOrderByIdForUser(user.id, params.id));
      }
    };

    window.addEventListener(STORE_EVENT, handleStoreChange);
    return () => window.removeEventListener(STORE_EVENT, handleStoreChange);
  }, [mounted, user, params?.id]);

  const etaInfo = useMemo(() => {
    if (!order) return null;
    return getOrderEtaInfo(order, now);
  }, [order, now]);

  const viewingItem = useMemo(() => {
    if (!order || !viewingItemId) return null;
    return order.items.find((item) => item.id === viewingItemId) ?? null;
  }, [order, viewingItemId]);

  const currentStatusTime = order
    ? formatTrackingTime(getOrderStatusTimestamp(order, order.status))
    : null;

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
            <div className="h-5 w-20 animate-pulse rounded bg-muted" />
            <div className="mt-4 h-9 w-48 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="h-64 animate-pulse rounded-2xl bg-muted" />
              <div className="h-72 animate-pulse rounded-2xl bg-muted" />
            </div>
            <div className="space-y-6">
              <div className="h-64 animate-pulse rounded-2xl bg-muted" />
              <div className="h-64 animate-pulse rounded-2xl bg-muted" />
            </div>
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
          Sign in to view your order
        </h1>

        <p className="mb-6 max-w-md text-muted-foreground">
          Please sign in to access your order details and tracking updates.
        </p>

        <Link href="/login">
          <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
          <Button
            variant="ghost"
            className="mb-4 px-0 text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Package className="h-7 w-7 text-muted-foreground" />
              </div>

              <h2 className="mb-2 font-serif text-2xl font-bold text-foreground">
                Order not found
              </h2>

              <p className="mb-6 max-w-md text-muted-foreground">
                This order may not exist or may not belong to your account.
              </p>

              <Link href="/orders">
                <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
                  Back to My Orders
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const itemCount = getOrderItemCount(order);
  const mapsHref =
    order.deliveryAddress.lat && order.deliveryAddress.lng
      ? `https://www.google.com/maps?q=${order.deliveryAddress.lat},${order.deliveryAddress.lng}`
      : null;

  const isDelivered = order.status === "Delivered";
  const canReview = isDelivered;
  const showAdminRemark =
    !isDelivered &&
    typeof order.adminRemark === "string" &&
    order.adminRemark.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
          <button
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center rounded-full bg-muted px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wide text-muted-foreground sm:text-xs">
                {getOrderRef(order)}
              </div>

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

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:flex-1">
                <div>
                  <h1 className="font-serif text-3xl font-bold text-foreground">
                    Order Details
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Placed on {formatOrderDate(order.createdAt)}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 sm:min-w-[220px]">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Current Status
                  </p>
                  <p className="mt-1 font-medium text-foreground">
                    {order.status}
                  </p>
                  {currentStatusTime ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {currentStatusTime}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Link href="/orders">
                  <Button
                    variant="outline"
                    className="w-full border-border text-foreground sm:w-auto"
                  >
                    My Orders
                  </Button>
                </Link>

                <Link href={`/orders/success/${order.id}`}>
                  <Button
                    variant="outline"
                    className="w-full border-border text-foreground sm:w-auto"
                  >
                    Status Page
                  </Button>
                </Link>

                {canReview ? (
                  <Link
                    href={`/reviews?type=experience&orderId=${order.id}&open=1`}
                  >
                    <Button className="w-full bg-gold text-primary-foreground hover:bg-gold-dark sm:w-auto">
                      Add Review
                      <Star className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-3 lg:px-8">
        <div className="space-y-6 lg:col-span-2">
          {order.status === "Cancelled" ? (
            <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-destructive/10 p-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>

                  <div>
                    <p className="font-serif text-lg font-bold text-foreground">
                      Order cancelled
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This order has been cancelled. Contact the restaurant if
                      you need more help.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-card-foreground">
                      Order Tracking
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Current status:{" "}
                      <span className="font-medium text-foreground">
                        {order.status}
                      </span>
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 text-muted-foreground"
                    onClick={() => setTrackingOpen((prev) => !prev)}
                  >
                    {trackingOpen ? (
                      <>
                        Hide
                        <ChevronUp className="ml-1 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        View
                        <ChevronDown className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>

                {trackingOpen ? (
                  <div className="space-y-4">
                    {TRACKING_FLOW.map((step, index) => {
                      const state = getStepState(order.status, step);

                      return (
                        <div key={step} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={[
                                "flex h-8 w-8 items-center justify-center rounded-full border",
                                state === "done"
                                  ? "border-green bg-green/10 text-green"
                                  : state === "current"
                                    ? "border-gold bg-gold/10 text-gold-dark"
                                    : "border-border bg-background text-muted-foreground",
                              ].join(" ")}
                            >
                              {state === "done" ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : state === "current" ? (
                                step === "Out for Delivery" ? (
                                  <Truck className="h-4 w-4" />
                                ) : (
                                  <Circle className="h-3 w-3 fill-current" />
                                )
                              ) : (
                                <Circle className="h-3 w-3" />
                              )}
                            </div>

                            {index !== TRACKING_FLOW.length - 1 ? (
                              <div className="my-1 h-10 w-px bg-border" />
                            ) : null}
                          </div>

                          <div className="min-w-0 pb-2">
                            <p
                              className={[
                                "font-medium",
                                state === "current" || state === "done"
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                              ].join(" ")}
                            >
                              {step}
                            </p>

                            {formatTrackingTime(
                              getOrderStatusTimestamp(order, step),
                            ) ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatTrackingTime(
                                  getOrderStatusTimestamp(order, step),
                                )}
                              </p>
                            ) : null}

                            {step === "Pending" ? (
                              <p className="text-sm text-muted-foreground">
                                Your order has been received and is awaiting
                                confirmation.
                              </p>
                            ) : null}

                            {step === "Confirmed" ? (
                              <p className="text-sm text-muted-foreground">
                                The restaurant has confirmed your order.
                                {typeof order.confirmedEtaMinutes === "number"
                                  ? ` Estimated time: ${order.confirmedEtaMinutes} min.`
                                  : ""}
                              </p>
                            ) : null}

                            {step === "Preparing" ? (
                              <p className="text-sm text-muted-foreground">
                                Your food is being freshly prepared.
                              </p>
                            ) : null}

                            {step === "Out for Delivery" ? (
                              <p className="text-sm text-muted-foreground">
                                Your order is on the way to your location.
                              </p>
                            ) : null}

                            {step === "Delivered" ? (
                              <p className="text-sm text-muted-foreground">
                                Your order has been successfully delivered.
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/70 bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Current Stage
                        </p>
                        <p className="mt-1 font-medium text-foreground">
                          {order.status}
                        </p>
                        {currentStatusTime ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {currentStatusTime}
                          </p>
                        ) : null}
                      </div>

                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[order.status] || ""}
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                )}

                {showAdminRemark ? (
                  <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Restaurant Note
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      {order.adminRemark?.trim()}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {canReview ? (
            <Card className="border-gold/30 bg-gold/5 shadow-sm">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-foreground">
                    Enjoyed your order?
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Share your experience and help others discover your favorite
                    dishes.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    href={`/reviews?type=experience&orderId=${order.id}&open=1`}
                  >
                    <Button className="w-full bg-gold text-primary-foreground hover:bg-gold-dark sm:w-auto">
                      Review Experience
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-card-foreground">
                    Items Ordered
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {itemCount} item{itemCount !== 1 ? "s" : ""} in this order
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {order.items.map((item, index) => {
                  const itemImage = item.menuItem.images?.[0];
                  const groupedAddOns = getGroupedAddOns(item.selectedAddOns);

                  return (
                    <div
                      key={`${item.id}-${index}`}
                      className="rounded-2xl border border-border/60 bg-background px-4 py-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                          {itemImage ? (
                            <img
                              src={itemImage}
                              alt={item.menuItem.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="line-clamp-1 font-medium text-foreground">
                                {item.menuItem.name}
                              </p>

                              <div className="mt-1 space-y-1">
                                <p className="text-sm text-muted-foreground">
                                  {item.menuItem.name} × {item.quantity}
                                </p>

                                {groupedAddOns.map((addOn) => (
                                  <p
                                    key={`${item.id}-${addOn.name}`}
                                    className="text-xs text-muted-foreground"
                                  >
                                    {addOn.name} × {addOn.quantity}
                                  </p>
                                ))}
                              </div>

                              {item.note?.trim() ? (
                                <div className="mt-2 rounded-xl border border-amber-200/70 bg-amber-50 px-2.5 py-2">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                                    Dish Note
                                  </p>
                                  <p className="mt-1 text-[11px] leading-5 text-amber-900">
                                    {item.note.trim()}
                                  </p>
                                </div>
                              ) : null}

                              {item.redemption ? (
                                <div className="mt-2 rounded-xl border border-blue-offer/20 bg-blue-offer/10 px-2.5 py-2">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-offer">
                                    Redeemed with HomelyPoints
                                  </p>
                                  <p className="mt-1 text-[11px] leading-5 text-blue-offer">
                                    {item.redemption.hpCostPerUnit * item.quantity} HP
                                  </p>
                                </div>
                              ) : null}
                            </div>

                            <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                              <p className="font-medium text-foreground">
                                {formatAED(getCartItemLineTotal(item))}
                              </p>

                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 h-9 rounded-full px-4 text-xs font-semibold"
                                onClick={() => setViewingItemId(item.id)}
                              >
                                <Eye className="mr-1.5 h-4 w-4" />
                                {canReview ? "View Item" : "View"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <h2 className="font-serif text-xl font-semibold text-card-foreground">
                  Order Summary
                </h2>

                {currentStatusTime ? (
                  <div className="rounded-xl border border-border/70 bg-background px-3 py-2 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {order.status}
                    </p>
                    <p className="mt-1 text-[11px] text-foreground">
                      {currentStatusTime}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium text-foreground">{itemCount}</span>
              </div>

              <PriceBreakdown
                subtotal={order.subtotal ?? 0}
                deliveryFee={order.deliveryFee ?? 0}
                discount={order.discount ?? 0}
                total={order.total}
              />

              <Separator className="my-4" />

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  {order.paymentMethod === "cash" ? (
                    <Banknote className="h-4 w-4 text-gold" />
                  ) : (
                    <CreditCard className="h-4 w-4 text-gold" />
                  )}

                  <span className="text-muted-foreground">
                    Payment:{" "}
                    <span className="font-medium text-foreground">
                      {PAYMENT_LABELS[order.paymentMethod]}
                    </span>
                  </span>
                </div>

                <div className="flex items-start gap-2">
  <Package className="mt-0.5 h-4 w-4 text-gold" />
  <span className="text-muted-foreground">
    Status: <span className="font-medium text-foreground">{order.status}</span>
    {currentStatusTime ? (
      <span className="block text-xs text-muted-foreground">
        {currentStatusTime}
      </span>
    ) : null}
  </span>
</div>


                <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                  <span className="text-muted-foreground">HP Earned</span>
                  <span className="font-semibold text-gold-dark">
                    +{order.hpEarned ?? 0} HP
                  </span>
                </div>

                {(order.hpRedeemed ?? 0) > 0 ? (
                  <div className="flex items-center justify-between rounded-lg bg-blue-offer/10 px-3 py-2">
                    <span className="text-muted-foreground">HP Redeemed</span>
                    <span className="font-semibold text-blue-offer">
                      -{order.hpRedeemed} HP
                    </span>
                  </div>
                ) : null}

                {isDelivered ? (
                  <div className="rounded-lg border border-green/20 bg-green/5 p-3">
                    <p className="text-sm font-medium text-foreground">
                      Delivered successfully
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      You can now review your dishes and overall experience.
                    </p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-serif text-xl font-semibold text-card-foreground">
                  Delivery Address
                </h2>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 text-muted-foreground"
                  onClick={() => setDeliveryDetailsOpen((prev) => !prev)}
                >
                  {deliveryDetailsOpen ? (
                    <>
                      Hide
                      <ChevronUp className="ml-1 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      View
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {deliveryDetailsOpen ? (
                <div className="rounded-2xl border border-border/70 bg-background p-4">
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <User className="mt-0.5 h-4 w-4 text-gold-dark" />
                      <span>{order.deliveryAddress.fullName}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone className="mt-0.5 h-4 w-4 text-gold-dark" />
                      <span>{order.deliveryAddress.phone}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 text-gold-dark" />
                      <div>
                        <p>{order.deliveryAddress.street}</p>
                        <p>{order.deliveryAddress.area}</p>
                        {order.deliveryAddress.apartment ? (
                          <p>Apartment: {order.deliveryAddress.apartment}</p>
                        ) : null}
                        {order.deliveryAddress.floor ? (
                          <p>Floor: {order.deliveryAddress.floor}</p>
                        ) : null}
                        {order.deliveryAddress.room ? (
                          <p>Room: {order.deliveryAddress.room}</p>
                        ) : null}
                      </div>
                    </div>

                    {order.deliveryAddress.notes?.trim() ? (
                      <div className="flex items-start gap-2 rounded-xl bg-muted/40 p-3">
                        <FileText className="mt-0.5 h-4 w-4 text-gold-dark" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            Delivery Notes
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            {order.deliveryAddress.notes}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {mapsHref ? (
                      <a
                        href={mapsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 pt-1 text-sm font-medium text-blue-600 hover:underline"
                      >
                        <MapPin className="h-4 w-4" />
                        View on Google Maps
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-border/70 bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Current Stage
                      </p>
                      <p className="mt-1 font-medium text-foreground">
                        {order.status}
                      </p>
                      {currentStatusTime ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {currentStatusTime}
                        </p>
                      ) : null}
                    </div>

                    <Badge
                      variant="outline"
                      className={STATUS_COLORS[order.status] || ""}
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Link href="/orders">
            <Button
              variant="outline"
              className="w-full border-border bg-card text-foreground hover:bg-muted"
            >
              Back to My Orders
            </Button>
          </Link>
        </div>

        <OrderItemEditorDialog
          open={!!viewingItem}
          onOpenChange={(open) => {
            if (!open) setViewingItemId(null);
          }}
          item={viewingItem}
          mode="view"
        />
      </div>
    </div>
  );
}

