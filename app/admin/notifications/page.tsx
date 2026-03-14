"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Bell,
  Package,
  Gift,
  CalendarDays,
  MessageCircle,
  Filter,
  X,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { getAllNotifications } from "@/lib/data/storage";
import { cn } from "@/lib/utils";
import type { NotificationType, AppNotification } from "@/lib/data/types";

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

const typeColors: Record<NotificationType, { icon: string; bg: string }> = {
  order: { icon: "text-gold", bg: "bg-gold/10" },
  points: { icon: "text-green", bg: "bg-green/10" },
  reservation: { icon: "text-blue-offer", bg: "bg-blue-offer/10" },
  general: { icon: "text-muted-foreground", bg: "bg-muted" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminNotificationsPage() {
  const [mounted, setMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const allNotifications = useMemo(() => {
    if (!mounted) return [];
    void refreshKey;
    return getAllNotifications().sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    );
  }, [mounted, refreshKey]);

  const filtered = useMemo(() => {
    let list = [...allNotifications];

    if (typeFilter !== "all") {
      list = list.filter((n) => n.type === typeFilter);
    }

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((n) => {
        const hay = [n.title, n.message, n.userId].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }

    return list;
  }, [allNotifications, typeFilter, query]);

  const stats = useMemo(() => {
    const total = allNotifications.length;
    const unread = allNotifications.filter((n) => !n.read).length;
    const byType: Record<string, number> = {};
    allNotifications.forEach((n) => {
      byType[n.type] = (byType[n.type] || 0) + 1;
    });
    return { total, unread, byType };
  }, [allNotifications]);

  const clearFilters = () => {
    setTypeFilter("all");
    setQuery("");
  };

  const hasFilters = typeFilter !== "all" || query.trim() !== "";

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View all system notifications sent to users and admins
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {stats.total}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Unread</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {stats.unread}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Orders</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {stats.byType.order || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Reservations</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {stats.byType.reservation || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />

            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as any)}
            >
              <SelectTrigger className="h-9 w-36 bg-background text-sm">
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

            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, message, user..."
              className="h-9 bg-background text-sm sm:w-64"
            />

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey((n) => n + 1)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {hasFilters ? "No notifications match your filters" : "No notifications yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-3 pr-4 font-medium">Type</th>
                <th className="py-3 pr-4 font-medium">Title</th>
                <th className="py-3 pr-4 font-medium">Message</th>
                <th className="py-3 pr-4 font-medium">User ID</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((notification) => {
                const Icon = typeIcons[notification.type] || MessageCircle;
                const colors = typeColors[notification.type] || typeColors.general;

                return (
                  <tr
                    key={notification.id}
                    className={cn(
                      "border-b border-border/50",
                      !notification.read && "bg-gold/5"
                    )}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", colors.bg)}>
                          <Icon className={cn("h-4 w-4", colors.icon)} />
                        </div>
                        <span className="text-xs capitalize">{notification.type}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-medium text-foreground">
                      {notification.title}
                    </td>
                    <td className="max-w-[300px] py-3 pr-4 text-muted-foreground">
                      <span className="line-clamp-2">{notification.message}</span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                      {notification.userId.slice(0, 12)}...
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          notification.read
                            ? "text-muted-foreground"
                            : "text-gold border-gold/20"
                        )}
                      >
                        {notification.read ? "Read" : "Unread"}
                      </Badge>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {formatDate(notification.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
