"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Mail,
  Phone,
  Edit2,
  Check,
  X,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CalendarDays,
  Star,
  Coins,
  MessageSquareText,
  CreditCard,
  Banknote,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/data/store";
import { HPCoin } from "@/components/hp-coin";
import {
  getUserOrders,
  getNotifications,
  getUserReservations,
  getReviews,
  addDishReview,
  addExperienceReview,
  markReservationCompleted,
  markReservationNotVisited,
} from "@/lib/data/storage";
import { toast } from "sonner";
import { formatAED } from "@/lib/utils";
import { getOrderRef } from "@/lib/orders/selectors";
import type { Order, OrderStatus, Review, Reservation } from "@/lib/data/types";

type ProfileSection = "orders" | "reservations" | "reviews" | "points";
type ReviewSectionFilter = "all" | "dish" | "experience";
type ReviewSource = "order" | "reservation" | null;
type ReviewMode = "dish" | "experience" | null;

const statusConfig: Record<
  OrderStatus,
  {
    icon: React.ElementType;
    color: string;
    bg: string;
    label: string;
  }
> = {
  Pending: {
    icon: AlertTriangle,
    color: "text-amber-800",
    bg: "bg-amber-100/60",
    label: "Pending confirmation",
  },
  Confirmed: {
    icon: Package,
    color: "text-gold-dark",
    bg: "bg-gold/10",
    label: "Confirmed",
  },
  Preparing: {
    icon: Package,
    color: "text-gold-dark",
    bg: "bg-gold/10",
    label: "Preparing",
  },
  "Out for Delivery": {
    icon: Package,
    color: "text-blue-offer",
    bg: "bg-blue-offer/10",
    label: "Out for delivery",
  },
  Delivered: {
    icon: CheckCircle2,
    color: "text-green",
    bg: "bg-green/10",
    label: "Delivered",
  },
  Cancelled: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    label: "Cancelled",
  },
};

function getReservationBadgeClasses(status: string) {
  if (status === "confirmed") {
    return "border-green/20 bg-green/10 text-green";
  }
  if (status === "cancelled") {
    return "border-destructive/20 bg-destructive/10 text-destructive";
  }
  if (status === "completed") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  if (status === "not-visited") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }
  return "border-amber-300/40 bg-amber-100/50 text-amber-800";
}

function getReservationStatusLabel(status: Reservation["status"]) {
  if (status === "not-visited") return "Not Visited";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getReservationDateTimeValue(reservation: Reservation): number | null {
  if (!reservation.date || !reservation.time) return null;

  const value = new Date(`${reservation.date}T${reservation.time}`);
  const time = value.getTime();

  return Number.isNaN(time) ? null : time;
}

function getCanMarkReservationVisit(reservation: Reservation): boolean {
  if (reservation.status !== "confirmed") return false;

  const reservationTime = getReservationDateTimeValue(reservation);
  if (reservationTime === null) return false;

  return Date.now() >= reservationTime;
}

function getOrderPreviewItems(order: Order) {
  const uniqueItems = order.items.reduce<
    Array<{ id: string; name: string; image: string; quantity: number }>
  >((acc, item) => {
    const existing = acc.find((entry) => entry.id === item.menuItem.id);

    if (existing) {
      existing.quantity += item.quantity;
      return acc;
    }

    acc.push({
      id: item.menuItem.id,
      name: item.menuItem.name,
      image: item.menuItem.images[0] ?? "",
      quantity: item.quantity,
    });

    return acc;
  }, []);

  return {
    visible: uniqueItems.slice(0, 2),
    extraCount: Math.max(uniqueItems.length - 2, 0),
  };
}

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [activeSection, setActiveSection] = useState<ProfileSection>("orders");
  const [reviewFilter, setReviewFilter] =
    useState<ReviewSectionFilter>("all");
  const [reviewsVersion, setReviewsVersion] = useState(0);

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewSource, setReviewSource] = useState<ReviewSource>(null);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewReservation, setReviewReservation] =
    useState<Reservation | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewMode, setReviewMode] = useState<ReviewMode>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [selectedDishIds, setSelectedDishIds] = useState<string[]>([]);

  const [notVisitedDialogOpen, setNotVisitedDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [notVisitedReason, setNotVisitedReason] = useState("");

  const userId = user?.id ?? null;

  const orders = useMemo(() => {
    if (!userId) return [];
    return [...getUserOrders(userId)].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    );
  }, [userId]);

  const reservations = useMemo(() => {
    if (!userId) return [];
    return [...getUserReservations(userId)].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    );
  }, [userId, reviewsVersion]);

  const reviews = useMemo(() => {
    if (!userId) return [];
    return getReviews()
      .filter((review) => review.userId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [userId, reviewsVersion]);

  const hpNotifications = useMemo(() => {
    if (!userId) return [];
    return getNotifications(userId)
      .filter((n) => n.type === "points")
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [userId]);

  const filteredReviews = useMemo(() => {
    if (reviewFilter === "all") return reviews;
    return reviews.filter((review) => review.type === reviewFilter);
  }, [reviews, reviewFilter]);

  const orderPointHistory = useMemo(() => {
    return orders
      .filter((order) => order.hpEarned > 0)
      .map((order) => ({
        id: order.id,
        orderRef: getOrderRef(order),
        hp: order.hpEarned,
        createdAt: order.createdAt,
        status: order.status,
      }));
  }, [orders]);

  const reviewableItems = useMemo(() => {
    if (!reviewOrder) return [];
    const seen = new Set<string>();

    return reviewOrder.items
      .filter((item) => {
        if (seen.has(item.menuItem.id)) return false;
        seen.add(item.menuItem.id);
        return true;
      })
      .map((item) => ({
        id: item.menuItem.id,
        name: item.menuItem.name,
      }));
  }, [reviewOrder]);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-1 font-serif text-2xl font-bold text-foreground">
          Sign in to view profile
        </h2>
        <p className="mb-6 text-muted-foreground">
          Access your orders, reservations, reviews, points, and account
          details.
        </p>
        <Link href="/login">
          <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    updateProfile({
      name: editName.trim(),
      phone: editPhone.trim(),
    });

    setEditing(false);
    toast.success("Profile updated.");
  };

  const handleCancelEdit = () => {
    setEditName(user.name);
    setEditPhone(user.phone);
    setEditing(false);
  };

  const openOrderReviewDialog = (order: Order) => {
    setReviewSource("order");
    setReviewOrder(order);
    setReviewReservation(null);
    setReviewRating(0);
    setReviewMode(null);
    setReviewComment("");
    setSelectedDishIds([]);
    setReviewDialogOpen(true);
  };

  const openReservationReviewDialog = (reservation: Reservation) => {
    setReviewSource("reservation");
    setReviewReservation(reservation);
    setReviewOrder(null);
    setReviewRating(0);
    setReviewMode("experience");
    setReviewComment("");
    setSelectedDishIds([]);
    setReviewDialogOpen(true);
  };

  const toggleDishSelection = (menuItemId: string) => {
    setSelectedDishIds((prev) =>
      prev.includes(menuItemId)
        ? prev.filter((id) => id !== menuItemId)
        : [...prev, menuItemId]
    );
  };

  const handleSubmitReview = () => {
    if (!user) return;

    if (reviewRating < 1) {
      toast.error("Please select a star rating.");
      return;
    }

    if (!reviewMode) {
      toast.error("Please choose what you want to review.");
      return;
    }

    if (!reviewComment.trim()) {
      toast.error("Please add your review comment.");
      return;
    }

    if (reviewSource === "reservation") {
      addExperienceReview({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        rating: reviewRating,
        comment: reviewComment.trim(),
        visitDate: reviewReservation?.date,
      });

      toast.success("Reservation experience review added.");
    }

    if (reviewSource === "order" && reviewMode === "experience") {
      addExperienceReview({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      toast.success("Experience review added.");
    }

    if (reviewSource === "order" && reviewMode === "dish") {
      if (selectedDishIds.length === 0) {
        toast.error("Please choose at least one dish to review.");
        return;
      }

      selectedDishIds.forEach((menuItemId) => {
        addDishReview({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          rating: reviewRating,
          comment: reviewComment.trim(),
          menuItemId,
        });
      });

      toast.success("Dish review added.");
    }

    setReviewsVersion((prev) => prev + 1);
    setReviewDialogOpen(false);
    setReviewSource(null);
    setReviewOrder(null);
    setReviewReservation(null);
    setReviewRating(0);
    setReviewMode(null);
    setReviewComment("");
    setSelectedDishIds([]);
    setActiveSection("reviews");
  };

  const handleReservationCompleted = (reservation: Reservation) => {
    markReservationCompleted(reservation.id);
    toast.success("Reservation marked as completed.");
    setReviewsVersion((prev) => prev + 1);
    openReservationReviewDialog({
      ...reservation,
      status: "completed",
    });
  };

  const openNotVisitedDialog = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setNotVisitedReason("");
    setNotVisitedDialogOpen(true);
  };

  const handleSubmitNotVisited = () => {
    if (!selectedReservation) return;

    if (!notVisitedReason.trim()) {
      toast.error("Please enter a reason.");
      return;
    }

    markReservationNotVisited(selectedReservation.id, notVisitedReason.trim());
    toast.success("Reservation marked as not visited.");
    setReviewsVersion((prev) => prev + 1);
    setNotVisitedDialogOpen(false);
    setSelectedReservation(null);
    setNotVisitedReason("");
  };

  const sectionTabs: {
    key: ProfileSection;
    label: string;
    icon: React.ElementType;
    count: number;
  }[] = [
    {
      key: "orders",
      label: "Orders",
      icon: Package,
      count: orders.length,
    },
    {
      key: "reservations",
      label: "Reservations",
      icon: CalendarDays,
      count: reservations.length,
    },
    {
      key: "reviews",
      label: "Reviews",
      icon: Star,
      count: reviews.length,
    },
    {
      key: "points",
      label: "HomelyPoints",
      icon: Coins,
      count: orderPointHistory.length,
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">
            My Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your account, orders, reservations, reviews, and
            HomelyPoints.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6">
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-serif text-lg font-semibold text-card-foreground">
                    Account
                  </h2>
                  {!editing ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setEditing(true)}
                    >
                      <Edit2 className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green"
                        onClick={handleSaveProfile}
                        aria-label="Save"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={handleCancelEdit}
                        aria-label="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-xl font-bold text-gold-dark">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    {editing ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="mb-1 h-8 bg-background text-sm"
                      />
                    ) : (
                      <p className="truncate font-serif text-lg font-semibold text-card-foreground">
                        {user.name}
                      </p>
                    )}
                    <Badge
                      variant="outline"
                      className="text-xs capitalize text-muted-foreground"
                    >
                      {user.role}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gold" />
                    <span className="truncate text-muted-foreground">
                      {user.email}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gold" />
                    {editing ? (
                      <Input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="h-8 bg-background text-sm"
                      />
                    ) : (
                      <span className="text-muted-foreground">
                        {user.phone || "Not set"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gold" />
                    <span className="text-muted-foreground">
                      Member since{" "}
                      {new Date(user.createdAt).toLocaleDateString("en-AE", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <Separator className="my-5" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">Orders</p>
                    <p className="mt-1 font-serif text-xl font-bold text-foreground">
                      {orders.length}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">
                      Reservations
                    </p>
                    <p className="mt-1 font-serif text-xl font-bold text-foreground">
                      {reservations.length}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">Reviews</p>
                    <p className="mt-1 font-serif text-xl font-bold text-foreground">
                      {reviews.length}
                    </p>
                  </div>

                  <Link href="/points" className="block">
                    <div className="rounded-lg border border-gold/20 bg-gold/5 p-3 hover:bg-gold/10 transition-colors cursor-pointer">
                      <p className="text-xs text-muted-foreground">HP Balance</p>
                      <p className="mt-1 font-serif text-xl font-bold text-foreground">
                        {user.hpBalance}
                      </p>
                    </div>
                  </Link>
                </div>

                <Separator className="my-5" />

                {/* Quick Links */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  <Link href="/points">
                    <Button variant="outline" size="sm" className="w-full justify-start text-foreground">
                      <Coins className="mr-2 h-4 w-4 text-gold" />
                      Points
                    </Button>
                  </Link>
                  <Link href="/addresses">
                    <Button variant="outline" size="sm" className="w-full justify-start text-foreground">
                      <MapPin className="mr-2 h-4 w-4 text-gold" />
                      Addresses
                    </Button>
                  </Link>
                  <Link href="/referrals">
                    <Button variant="outline" size="sm" className="w-full justify-start text-foreground">
                      <User className="mr-2 h-4 w-4 text-gold" />
                      Referrals
                    </Button>
                  </Link>
                  <Link href="/notifications">
                    <Button variant="outline" size="sm" className="w-full justify-start text-foreground">
                      <CalendarDays className="mr-2 h-4 w-4 text-gold" />
                      Alerts
                    </Button>
                  </Link>
                </div>

                <Button
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive/5 hover:text-destructive"
                  onClick={logout}
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {sectionTabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeSection === tab.key;

                    return (
                      <Button
                        key={tab.key}
                        variant={active ? "default" : "outline"}
                        className={
                          active
                            ? "bg-gold text-primary-foreground hover:bg-gold-dark"
                            : ""
                        }
                        onClick={() => setActiveSection(tab.key)}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {tab.label}
                        <span className="ml-2 rounded-full bg-background/20 px-1.5 py-0.5 text-[10px]">
                          {tab.count}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {activeSection === "orders" && (
              <div>
                <div className="mb-4">
                  <h2 className="font-serif text-xl font-bold text-foreground">
                    Order History
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    View your recent orders, status, and full order details.
                  </p>
                </div>

                {orders.length === 0 ? (
                  <Card className="border-border bg-card shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Package className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <h3 className="mb-1 font-serif text-lg font-semibold text-card-foreground">
                        No orders yet
                      </h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        Place your first order to see it here.
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
                    {orders.map((order) => {
                      const config = statusConfig[order.status];
                      const StatusIcon = config.icon;
                      const itemCount = order.items.reduce(
                        (sum, item) => sum + item.quantity,
                        0
                      );
                      const preview = getOrderPreviewItems(order);

                      return (
                        <Card
                          key={order.id}
                          className="border-border bg-card shadow-sm"
                        >
                          <CardContent className="p-5">
                            <div className="flex flex-col gap-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-mono text-xs text-muted-foreground">
                                      {getOrderRef(order)}
                                    </p>
                                    <Badge
                                      className={`${config.bg} ${config.color} border-none`}
                                    >
                                      <StatusIcon className="mr-1 h-3 w-3" />
                                      {config.label}
                                    </Badge>
                                  </div>

                                  <p className="mt-2 text-sm text-muted-foreground">
                                    {new Date(order.createdAt).toLocaleDateString(
                                      "en-AE",
                                      {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )}
                                  </p>
                                </div>

                                <div className="flex flex-col gap-2 sm:w-[180px]">
                                  <Link href={`/orders/${order.id}`}>
                                    <Button className="w-full bg-gold text-primary-foreground hover:bg-gold-dark">
                                      View Details
                                    </Button>
                                  </Link>

                                  {order.status === "Delivered" ? (
                                    <Button
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => openOrderReviewDialog(order)}
                                    >
                                      <MessageSquareText className="mr-2 h-4 w-4" />
                                      Add Review
                                    </Button>
                                  ) : null}
                                </div>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-border bg-muted/20 p-4">
                                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Ordered Items
                                  </p>

                                  <div className="space-y-3">
                                    {preview.visible.map((item) => (
                                      <div
                                        key={`${order.id}-${item.id}`}
                                        className="flex items-center gap-3"
                                      >
                                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                                          {item.image ? (
                                            <Image
                                              src={item.image}
                                              alt={item.name}
                                              fill
                                              sizes="48px"
                                              className="object-cover"
                                            />
                                          ) : null}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                          <p className="truncate text-sm font-medium text-foreground">
                                            {item.name}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            Qty: {item.quantity}
                                          </p>
                                        </div>
                                      </div>
                                    ))}

                                    {preview.extraCount > 0 ? (
                                      <p className="text-xs text-muted-foreground">
                                        +{preview.extraCount} more item
                                        {preview.extraCount > 1 ? "s" : ""}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="rounded-xl border border-border bg-muted/20 p-4">
                                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Quick Summary
                                  </p>

                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">
                                        Items
                                      </span>
                                      <span className="font-medium text-foreground">
                                        {itemCount}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">
                                        Total
                                      </span>
                                      <span className="font-medium text-foreground">
                                        {formatAED(order.total)}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">
                                        Earned
                                      </span>
                                      <span className="font-medium text-foreground">
                                        +{order.hpEarned} HP
                                      </span>
                                    </div>

                                    <Separator className="my-2" />

                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      {order.paymentMethod === "cash" ? (
                                        <Banknote className="h-4 w-4 text-gold" />
                                      ) : (
                                        <CreditCard className="h-4 w-4 text-gold" />
                                      )}
                                      <span>
                                        {order.paymentMethod === "cash"
                                          ? "Cash on Delivery"
                                          : "Card on Delivery"}
                                      </span>
                                    </div>
                                  </div>
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
            )}

            {activeSection === "reservations" && (
              <div>
                <div className="mb-4">
                  <h2 className="font-serif text-xl font-bold text-foreground">
                    Reservations
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    View your table reservation requests and visit updates.
                  </p>
                </div>

                {reservations.length === 0 ? (
                  <Card className="border-border bg-card shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <CalendarDays className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <h3 className="mb-1 font-serif text-lg font-semibold text-card-foreground">
                        No reservations yet
                      </h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        Your table booking requests will appear here.
                      </p>
                      <Link href="/reservations">
                        <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
                          Book a Table
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {reservations.map((reservation) => {
                      const canMarkVisit =
                        getCanMarkReservationVisit(reservation);

                      return (
                        <Card
                          key={reservation.id}
                          className="border-border bg-card shadow-sm"
                        >
                          <CardContent className="p-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-serif text-lg font-semibold text-card-foreground">
                                    {reservation.guests} guest
                                    {reservation.guests !== 1 ? "s" : ""}
                                  </p>

                                  <Badge
                                    variant="outline"
                                    className={getReservationBadgeClasses(
                                      reservation.status
                                    )}
                                  >
                                    {getReservationStatusLabel(
                                      reservation.status
                                    )}
                                  </Badge>
                                </div>

                                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                  <p>
                                    {reservation.date} at {reservation.time}
                                  </p>
                                  <p>{reservation.phone}</p>
                                  {reservation.notes?.trim() ? (
                                    <p>Note: {reservation.notes.trim()}</p>
                                  ) : null}
                                  {reservation.notVisitedReason?.trim() ? (
                                    <div className="mt-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2">
                                      <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                                        Not visited reason
                                      </p>
                                      <p className="mt-1 text-sm text-orange-900">
                                        {reservation.notVisitedReason.trim()}
                                      </p>
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              <div className="flex w-full flex-col gap-2 sm:w-[210px]">
                                {reservation.status === "completed" ? (
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      openReservationReviewDialog(reservation)
                                    }
                                  >
                                    <MessageSquareText className="mr-2 h-4 w-4" />
                                    Add Review
                                  </Button>
                                ) : null}

                                {canMarkVisit ? (
                                  <>
                                    <Button
                                      className="bg-gold text-primary-foreground hover:bg-gold-dark"
                                      onClick={() =>
                                        handleReservationCompleted(reservation)
                                      }
                                    >
                                      Completed
                                    </Button>

                                    <Button
                                      variant="outline"
                                      onClick={() =>
                                        openNotVisitedDialog(reservation)
                                      }
                                    >
                                      Not Visited
                                    </Button>
                                  </>
                                ) : null}

                                <Link href="/reservations">
                                  <Button variant="outline" className="w-full">
                                    Manage Booking
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeSection === "reviews" && (
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-foreground">
                      Your Reviews
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      See your dish reviews and overall experience reviews
                      separately.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={reviewFilter === "all" ? "default" : "outline"}
                      className={
                        reviewFilter === "all"
                          ? "bg-gold text-primary-foreground hover:bg-gold-dark"
                          : ""
                      }
                      onClick={() => setReviewFilter("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={reviewFilter === "dish" ? "default" : "outline"}
                      className={
                        reviewFilter === "dish"
                          ? "bg-gold text-primary-foreground hover:bg-gold-dark"
                          : ""
                      }
                      onClick={() => setReviewFilter("dish")}
                    >
                      Dish
                    </Button>
                    <Button
                      variant={
                        reviewFilter === "experience" ? "default" : "outline"
                      }
                      className={
                        reviewFilter === "experience"
                          ? "bg-gold text-primary-foreground hover:bg-gold-dark"
                          : ""
                      }
                      onClick={() => setReviewFilter("experience")}
                    >
                      Experience
                    </Button>
                  </div>
                </div>

                {filteredReviews.length === 0 ? (
                  <Card className="border-border bg-card shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Star className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <h3 className="mb-1 font-serif text-lg font-semibold text-card-foreground">
                        No reviews in this section
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Delivered orders and completed reservations will show a
                        review option.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredReviews.map((review: Review) => (
                      <Card
                        key={review.id}
                        className="border-border bg-card shadow-sm"
                      >
                        <CardContent className="p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-serif text-lg font-semibold text-card-foreground">
                                {review.type === "dish"
                                  ? review.menuItemName
                                  : "Overall Experience"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString(
                                  "en-AE",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {review.type === "dish"
                                  ? "Dish Review"
                                  : "Experience Review"}
                              </Badge>
                              <div className="flex items-center gap-1 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-sm text-gold-dark">
                                <Star className="h-4 w-4 fill-current" />
                                {review.rating}/5
                              </div>
                            </div>
                          </div>

                          <Separator className="my-4" />

                          <p className="text-sm text-muted-foreground">
                            {review.comment}
                          </p>

                          {review.type === "experience" &&
                          review.tags?.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {review.tags.map((tag, index) => (
                                <Badge
                                  key={`${review.id}-tag-${index}`}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === "points" && (
              <div>
                <div className="mb-4">
                  <h2 className="font-serif text-xl font-bold text-foreground">
                    HomelyPoints
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    See your balance and how many points you earned from each
                    order.
                  </p>
                </div>

                <Card className="border-gold/20 bg-gold/5 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <HPCoin size="lg" />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-gold">
                          Current Balance
                        </p>
                        <p className="font-serif text-3xl font-bold text-foreground">
                          {user.hpBalance}
                          <span className="ml-1 text-base font-normal text-muted-foreground">
                            HP
                          </span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {orderPointHistory.length === 0 ? (
                  <Card className="border-border bg-card shadow-sm">
                    <CardContent className="py-12 text-center text-sm text-muted-foreground">
                      No points earned from orders yet.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {orderPointHistory.map((entry) => (
                      <Card
                        key={entry.id}
                        className="border-border bg-card shadow-sm"
                      >
                        <CardContent className="p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-card-foreground">
                                Order {entry.orderRef}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {new Date(entry.createdAt).toLocaleDateString(
                                  "en-AE",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="font-serif text-lg font-bold text-gold-dark">
                                +{entry.hp} HP
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Status: {entry.status}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {hpNotifications.length > 0 ? (
                      <Card className="border-border bg-card shadow-sm">
                        <CardContent className="p-5">
                          <h3 className="mb-4 font-serif text-lg font-semibold text-card-foreground">
                            Activity Notes
                          </h3>
                          <div className="space-y-3">
                            {hpNotifications.map((n) => (
                              <div
                                key={n.id}
                                className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground">
                                    {n.title}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {n.message}
                                  </p>
                                </div>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                  {new Date(n.createdAt).toLocaleDateString(
                                    "en-AE",
                                    {
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-xl bg-card text-card-foreground">
          <DialogHeader>
<DialogTitle className="font-serif text-foreground">
                  Add Review
                </DialogTitle>
                <DialogDescription>
                  Share your feedback about your experience or the dishes you ordered.
                </DialogDescription>
              </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">
                {reviewSource === "reservation" ? "Reservation" : "Order"}
              </p>
              <p className="font-medium text-foreground">
                {reviewSource === "reservation" && reviewReservation
                  ? `${reviewReservation.date} at ${reviewReservation.time}`
                  : reviewOrder
                  ? getOrderRef(reviewOrder)
                  : "—"}
              </p>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-foreground">
                Your Rating
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className={`rounded-full border p-2 transition-colors ${
                      reviewRating >= star
                        ? "border-gold bg-gold/10 text-gold-dark"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    <Star
                      className={`h-5 w-5 ${
                        reviewRating >= star ? "fill-current" : ""
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {reviewSource === "order" ? (
              <div>
                <p className="mb-3 text-sm font-medium text-foreground">
                  What do you want to review?
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={reviewMode === "dish" ? "default" : "outline"}
                    className={
                      reviewMode === "dish"
                        ? "bg-gold text-primary-foreground hover:bg-gold-dark"
                        : ""
                    }
                    onClick={() => setReviewMode("dish")}
                  >
                    Dish Review
                  </Button>
                  <Button
                    type="button"
                    variant={
                      reviewMode === "experience" ? "default" : "outline"
                    }
                    className={
                      reviewMode === "experience"
                        ? "bg-gold text-primary-foreground hover:bg-gold-dark"
                        : ""
                    }
                    onClick={() => setReviewMode("experience")}
                  >
                    Overall Experience
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Review Type
                </p>
                <Badge variant="outline">Overall Experience</Badge>
              </div>
            )}

            {reviewSource === "order" && reviewMode === "dish" ? (
              <div>
                <p className="mb-3 text-sm font-medium text-foreground">
                  Select ordered dishes
                </p>
                <div className="grid gap-2">
                  {reviewableItems.map((item) => {
                    const selected = selectedDishIds.includes(item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleDishSelection(item.id)}
                        className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                          selected
                            ? "border-gold bg-gold/10 text-foreground"
                            : "border-border bg-background text-foreground hover:bg-muted/30"
                        }`}
                      >
                        <span>{item.name}</span>
                        {selected ? (
                          <CheckCircle2 className="h-4 w-4 text-gold-dark" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  The same review will be added to each selected dish.
                </p>
              </div>
            ) : null}

            <div>
              <p className="mb-3 text-sm font-medium text-foreground">
                Your Review
              </p>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={
                  reviewSource === "reservation"
                    ? "Tell us about your reservation and dining experience..."
                    : reviewMode === "dish"
                    ? "Tell us what you liked or didn’t like about the dish..."
                    : "Tell us about your overall order experience..."
                }
                className="min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
              onClick={handleSubmitReview}
            >
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={notVisitedDialogOpen}
        onOpenChange={setNotVisitedDialogOpen}
      >
        <DialogContent className="sm:max-w-lg bg-card text-card-foreground">
          <DialogHeader>
<DialogTitle className="font-serif text-foreground">
                  Mark as Not Visited
                </DialogTitle>
                <DialogDescription>
                  Please provide a reason why the guest did not visit.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
            {selectedReservation ? (
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
                <p className="font-medium text-foreground">
                  {selectedReservation.date} at {selectedReservation.time}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {selectedReservation.guests} guest
                  {selectedReservation.guests !== 1 ? "s" : ""}
                </p>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                Reason
              </p>
              <Textarea
                value={notVisitedReason}
                onChange={(e) => setNotVisitedReason(e.target.value)}
                placeholder="Why was the reservation not visited?"
                className="min-h-[110px]"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                This reason will be visible in admin reservations.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNotVisitedDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
              onClick={handleSubmitNotVisited}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
