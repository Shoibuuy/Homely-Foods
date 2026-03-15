"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  RefreshCw,
  ChevronRight,
  Truck,
  Circle,
  Receipt,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/data/store";
import { getUserOrders } from "@/lib/data/storage";
import type { Order, OrderStatus } from "@/lib/data/types";
import { STATUS_COLORS } from "@/lib/orders/constants";
import {
  getOrderEtaInfo,
  getOrderStatusTimestamp,
  formatTrackingTime,
} from "@/lib/orders/tracking";
import { getOrderRef } from "@/lib/orders/selectors";
import { useNow } from "@/lib/hooks/useNow";
import { HPCoin } from "@/components/hp-coin";

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

function getStepDescription(step: OrderStatus) {
  if (step === "Pending") {
    return "Your order has been received and is awaiting confirmation.";
  }

  if (step === "Confirmed") {
    return "The restaurant has confirmed your order.";
  }

  if (step === "Preparing") {
    return "Your food is being freshly prepared.";
  }

  if (step === "Out for Delivery") {
    return "Your order is on the way to your location.";
  }

  return "Your order has been successfully delivered.";
}

function getStatusTheme(status: OrderStatus) {
  switch (status) {
    case "Pending":
      return {
        wrap: "border-red-200 bg-red-50",
        iconWrap: "bg-red-100 text-red-600",
        title: "Order Pending",
        description:
          "Your order has been received and is awaiting restaurant confirmation.",
      };
    case "Confirmed":
      return {
        wrap: "border-green-200 bg-green-50",
        iconWrap: "bg-green-100 text-green-600",
        title: "Order Confirmed",
        description:
          "The restaurant has confirmed your order and started the process.",
      };
    case "Preparing":
      return {
        wrap: "border-blue-200 bg-blue-50",
        iconWrap: "bg-blue-100 text-blue-600",
        title: "Preparing Your Order",
        description:
          "Your dishes are being freshly prepared in the kitchen.",
      };
    case "Out for Delivery":
      return {
        wrap: "border-sky-200 bg-sky-50",
        iconWrap: "bg-sky-100 text-sky-600",
        title: "Out for Delivery",
        description: "Your order is on the way and will arrive soon.",
      };
    case "Delivered":
      return {
        wrap: "border-green-200 bg-green-50",
        iconWrap: "bg-green-100 text-green-600",
        title: "Delivered Successfully",
        description: "Your order has been delivered successfully.",
      };
    case "Cancelled":
      return {
        wrap: "border-destructive/20 bg-destructive/5",
        iconWrap: "bg-destructive/10 text-destructive",
        title: "Order Cancelled",
        description:
          "This order has been cancelled. Contact the restaurant if you need help.",
      };
    default:
      return {
        wrap: "border-border bg-background",
        iconWrap: "bg-muted text-foreground",
        title: "Order Status",
        description: "Track your order progress here.",
      };
  }
}

export default function OrderSuccessPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const now = useNow(1000);

  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadOrder = () => {
    if (!user || !params?.id) {
      setOrder(null);
      return;
    }
    setOrder(getOrderByIdForUser(user.id, params.id));
  };

  useEffect(() => {
    if (!mounted || !user || !params?.id) return;
    loadOrder();
  }, [mounted, user, params?.id]);

  useEffect(() => {
    if (!mounted || !user || !params?.id) return;

    const handleStoreChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ scope?: string }>;
      if (customEvent.detail?.scope === "orders") {
        loadOrder();
      }
    };

    window.addEventListener(STORE_EVENT, handleStoreChange);
    return () => window.removeEventListener(STORE_EVENT, handleStoreChange);
  }, [mounted, user, params?.id]);

  const etaInfo = useMemo(() => {
    if (!order) return null;
    return getOrderEtaInfo(order, now);
  }, [order, now]);

  const currentStatusTime = order
    ? formatTrackingTime(getOrderStatusTimestamp(order, order.status))
    : null;

  const statusTheme = order ? getStatusTheme(order.status) : null;

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrder();
    window.setTimeout(() => setRefreshing(false), 500);
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <div className="h-10 w-40 animate-pulse rounded bg-muted" />
            <div className="h-56 animate-pulse rounded-3xl bg-muted" />
            <div className="h-80 animate-pulse rounded-3xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!user || !order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            className="mb-4 px-0 text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Card className="rounded-3xl border border-border/70 bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <CardContent className="px-6 py-16 text-center">
              <h2 className="font-serif text-2xl font-bold text-foreground">
                Order status page not available
              </h2>
              <p className="mt-2 text-muted-foreground">
                This order may not exist or may not belong to your account.
              </p>
              <Link href="/orders">
                <Button className="mt-6 bg-gold text-primary-foreground hover:bg-gold-dark">
                  Go to My Orders
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentOrder = order;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <Button
            variant="ghost"
            className="mb-4 px-0 text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">
                Order Status
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Track your latest order progress and view quick actions.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground">
              <Receipt className="h-4 w-4" />
              {getOrderRef(currentOrder)}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-5 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="rounded-3xl border border-border/70 bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <CardContent className="p-6 sm:p-8">
              <div
                className={[
                  "rounded-3xl border p-5 sm:p-6",
                  statusTheme?.wrap ?? "border-border bg-background",
                ].join(" ")}
              >
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={[
                          "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl",
                          statusTheme?.iconWrap ?? "bg-muted text-foreground",
                        ].join(" ")}
                      >
                        {currentOrder.status === "Out for Delivery" ? (
                          <Truck className="h-8 w-8" />
                        ) : currentOrder.status === "Preparing" ? (
                          <Activity className="h-8 w-8" />
                        ) : currentOrder.status === "Cancelled" ? (
                          <Circle className="h-8 w-8 fill-current" />
                        ) : (
                          <CheckCircle2 className="h-8 w-8" />
                        )}
                      </div>

                      <div>
                        <h2 className="font-serif text-3xl font-bold text-foreground">
                          {statusTheme?.title ?? "Order Status"}
                        </h2>

                        <p className="mt-2 max-w-xl text-muted-foreground">
                          {statusTheme?.description ??
                            "Track your order progress here."}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={STATUS_COLORS[currentOrder.status] || ""}
                          >
                            {currentOrder.status}
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
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 sm:min-w-[220px]">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Current Status Time
                      </p>
                      <p className="mt-1 font-medium text-foreground">
                        {currentOrder.status}
                      </p>
                      {currentStatusTime ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {currentStatusTime}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-background p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Order Reference
                      </p>
                      <p className="mt-2 font-mono text-sm font-semibold text-foreground">
                        {getOrderRef(currentOrder)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
                      <div className="flex items-center gap-3">
                        <HPCoin size="lg" animated />
                        <div>
                          <p className="font-serif text-xl font-bold text-foreground">
                            +{currentOrder.hpEarned ?? 0} HP
                          </p>
                          <p className="text-xs text-muted-foreground">
                            HomelyPoints earned
                          </p>
                        </div>
                      </div>
                    </div>

                    {(currentOrder.hpRedeemed ?? 0) > 0 ? (
                      <div className="rounded-2xl border border-blue-offer/20 bg-blue-offer/10 p-4">
                        <div className="flex items-center gap-3">
                          <HPCoin size="lg" />
                          <div>
                            <p className="font-serif text-xl font-bold text-foreground">
                              -{currentOrder.hpRedeemed} HP
                            </p>
                            <p className="text-xs text-muted-foreground">
                              HomelyPoints redeemed
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Button
                      variant="outline"
                      className="h-11 rounded-xl border-border/70 bg-background text-foreground"
                      onClick={handleRefresh}
                    >
                      <RefreshCw
                        className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                      />
                      Refresh Status
                    </Button>

                    <Link href={`/orders/${currentOrder.id}`}>
                      <Button className="h-11 rounded-xl bg-gold text-primary-foreground hover:bg-gold-dark">
                        View Details
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>

                    <Link href="/orders">
                      <Button
                        variant="outline"
                        className="h-11 rounded-xl border-border/70 bg-background text-foreground"
                      >
                        Your Orders
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border/70 bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold/10">
                    <Activity className="h-5 w-5 text-gold-dark" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-card-foreground">
                      Current Status
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Live preview of your order progress
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 text-muted-foreground"
                  onClick={() => setTrackingOpen((prev) => !prev)}
                >
                  {trackingOpen ? "Hide" : "View"}
                </Button>
              </div>

              {trackingOpen ? (
                <div className="space-y-5">
                  {TRACKING_FLOW.map((step, index) => {
                    const state = getStepState(currentOrder.status, step);
                    const stepTime = formatTrackingTime(
                      getOrderStatusTimestamp(currentOrder, step),
                    );

                    return (
                      <div key={step} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={[
                              "flex h-9 w-9 items-center justify-center rounded-full border",
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
                            <div
                              className={[
                                "my-1 w-px flex-1 min-h-[34px]",
                                state === "done" ? "bg-green/30" : "bg-border",
                              ].join(" ")}
                            />
                          ) : null}
                        </div>

                        <div className="min-w-0 pb-1 pt-0.5">
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

                          {stepTime ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {stepTime}
                            </p>
                          ) : null}

                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {getStepDescription(step)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-border/70 bg-background p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Current Stage
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={STATUS_COLORS[currentOrder.status] || ""}
                    >
                      {currentOrder.status}
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

                  {currentStatusTime ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {currentStatusTime}
                    </p>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
