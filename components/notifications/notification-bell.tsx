"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Package, Gift, CalendarDays, MessageCircle, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useNotifications, useAuth } from "@/lib/data/store";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/lib/data/types";

const typeIcons: Record<NotificationType, React.ElementType> = {
  order: Package,
  points: Gift,
  reservation: CalendarDays,
  general: MessageCircle,
};

const typeColors: Record<NotificationType, string> = {
  order: "text-gold bg-gold/10",
  points: "text-green bg-green/10",
  reservation: "text-blue-offer bg-blue-offer/10",
  general: "text-muted-foreground bg-muted",
};

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString("en-AE", {
    month: "short",
    day: "numeric",
  });
}

export function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const handleMarkAllRead = () => {
    if (user) {
      markAllAsRead();
    }
  };

  const handleClearAll = () => {
    if (user) {
      clearAll();
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const recent = notifications.slice(0, 25);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative text-muted-foreground hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(24rem,calc(100vw-1rem))] overflow-hidden border-border bg-card p-0 text-card-foreground shadow-lg sm:w-[26rem]"
      >
        <div className="flex max-h-[min(34rem,75vh)] flex-col">
          <div className="shrink-0 border-b border-border px-3 py-3 sm:px-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 ? (
                <Badge variant="secondary" className="bg-gold/10 text-gold-dark">
                  {unreadCount} new
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">All caught up</span>
              )}
            </div>

            {recent.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                  className="h-7 px-2 text-xs"
                >
                  <CheckCheck className="mr-1 h-3 w-3" />
                  Mark all read
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Clear all
                </Button>
              </div>
            )}
          </div>

          {recent.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <ScrollArea className="min-h-0 flex-1">
              <div className="divide-y divide-border">
                {recent.map((notification) => {
                  const Icon = typeIcons[notification.type] || MessageCircle;
                  const colorClass = typeColors[notification.type] || typeColors.general;

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-2 px-3 py-3 sm:px-4",
                        !notification.read && "bg-gold/5"
                      )}
                    >
                      <button
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification.id);
                          }
                        }}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left transition-colors hover:text-foreground"
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                            colorClass
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                "line-clamp-1 text-sm",
                                !notification.read ? "font-semibold text-foreground" : "text-foreground"
                              )}
                            >
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete notification</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          <Separator />

          <div className="shrink-0 p-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/10"
            >
              View all notifications
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
