"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Package,
  Gift,
  CalendarDays,
  MessageCircle,
  CheckCheck,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, useNotifications } from "@/lib/data/store";
import { markAllNotificationsRead } from "@/lib/data/storage";
import { cn } from "@/lib/utils";
import type { NotificationType, AppNotification } from "@/lib/data/types";
import { toast } from "sonner";

const typeIcons: Record<NotificationType, React.ElementType> = {
  order: Package,
  points: Gift,
  reservation: CalendarDays,
  general: MessageCircle,
};

const typeLabels: Record<NotificationType, string> = {
  order: "Orders",
  points: "Points",
  reservation: "Reservations",
  general: "General",
};

const typeColors: Record<NotificationType, { icon: string; bg: string; badge: string }> = {
  order: {
    icon: "text-gold",
    bg: "bg-gold/10",
    badge: "bg-gold/10 text-gold-dark border-gold/20",
  },
  points: {
    icon: "text-green",
    bg: "bg-green/10",
    badge: "bg-green/10 text-green border-green/20",
  },
  reservation: {
    icon: "text-blue-offer",
    bg: "bg-blue-offer/10",
    badge: "bg-blue-offer/10 text-blue-offer border-blue-offer/20",
  },
  general: {
    icon: "text-muted-foreground",
    bg: "bg-muted",
    badge: "bg-muted text-muted-foreground border-border",
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function groupByDate(notifications: AppNotification[]): Map<string, AppNotification[]> {
  const groups = new Map<string, AppNotification[]>();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  notifications.forEach((n) => {
    const dateStr = new Date(n.createdAt).toDateString();
    let label = new Date(n.createdAt).toLocaleDateString("en-AE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    if (dateStr === today) label = "Today";
    else if (dateStr === yesterday) label = "Yesterday";

    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(n);
  });

  return groups;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, refresh } = useNotifications();

  const [mounted, setMounted] = useState(false);
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = useMemo(() => {
    if (!mounted) return [];

    return notifications.filter((n) => {
      if (typeFilter !== "all" && n.type !== typeFilter) return false;
      if (readFilter === "unread" && n.read) return false;
      if (readFilter === "read" && !n.read) return false;
      return true;
    });
  }, [notifications, typeFilter, readFilter, mounted]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const handleMarkAllRead = () => {
    if (!user) return;
    markAllNotificationsRead(user.id);
    refresh();
    toast.success("All notifications marked as read");
  };

  const clearFilters = () => {
    setTypeFilter("all");
    setReadFilter("all");
  };

  const hasFilters = typeFilter !== "all" || readFilter !== "all";

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Bell className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-1 font-serif text-2xl font-bold text-foreground">
          Sign in to view notifications
        </h2>
        <p className="mb-6 text-muted-foreground">
          Access your order updates, points, and reservation alerts.
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
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-1 font-serif text-3xl font-bold text-foreground">
                Notifications
              </h1>
              <p className="text-muted-foreground">
                Stay updated on your orders, points, and reservations
              </p>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                className="shrink-0 text-foreground"
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all as read
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["order", "points", "reservation", "general"] as NotificationType[]).map((type) => {
            const count = notifications.filter((n) => n.type === type).length;
            const colors = typeColors[type];
            const Icon = typeIcons[type];

            return (
              <button
                key={type}
                onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 transition-all",
                  typeFilter === type
                    ? "border-gold bg-gold/5 shadow-sm"
                    : "border-border bg-card hover:border-gold/30"
                )}
              >
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", colors.bg)}>
                  <Icon className={cn("h-5 w-5", colors.icon)} />
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">{typeLabels[type]}</p>
                  <p className="text-lg font-bold text-foreground">{count}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="mb-6 border-border bg-card">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter:</span>

              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger className="h-8 w-32 bg-background text-sm">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="order">Orders</SelectItem>
                  <SelectItem value="points">Points</SelectItem>
                  <SelectItem value="reservation">Reservations</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>

              <Select value={readFilter} onValueChange={(v) => setReadFilter(v as any)}>
                <SelectTrigger className="h-8 w-28 bg-background text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
              {unreadCount > 0 && ` (${unreadCount} unread)`}
            </p>
          </CardContent>
        </Card>

        {/* Notification List */}
        {filtered.length === 0 ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Bell className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="mb-1 font-serif text-lg font-semibold text-foreground">
                {hasFilters ? "No matching notifications" : "No notifications yet"}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {hasFilters
                  ? "Try adjusting your filters"
                  : "When you receive updates, they will appear here"}
              </p>
              {hasFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Array.from(grouped.entries()).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                  {dateLabel}
                </h3>
                <div className="space-y-2">
                  {items.map((notification) => {
                    const Icon = typeIcons[notification.type] || MessageCircle;
                    const colors = typeColors[notification.type] || typeColors.general;

                    return (
                      <Card
                        key={notification.id}
                        className={cn(
                          "border-border bg-card transition-all hover:shadow-sm",
                          !notification.read && "border-l-2 border-l-gold bg-gold/5"
                        )}
                      >
                        <CardContent className="flex items-start gap-4 p-4">
                          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", colors.bg)}>
                            <Icon className={cn("h-5 w-5", colors.icon)} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className={cn(
                                    "text-sm",
                                    !notification.read ? "font-semibold text-foreground" : "text-foreground"
                                  )}>
                                    {notification.title}
                                  </h4>
                                  <Badge
                                    variant="outline"
                                    className={cn("text-[10px] capitalize", colors.badge)}
                                  >
                                    {notification.type}
                                  </Badge>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {notification.message}
                                </p>
                                <p className="mt-2 text-xs text-muted-foreground">
                                  {formatDate(notification.createdAt)}
                                </p>
                              </div>

                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                                >
                                  Mark read
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
