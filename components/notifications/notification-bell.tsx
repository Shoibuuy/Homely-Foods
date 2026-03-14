"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Package, Gift, CalendarDays, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/lib/data/store";
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
  const { notifications, unreadCount, markAsRead, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const recent = notifications.slice(0, 8);

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
        className="w-80 p-0 bg-card text-card-foreground shadow-lg sm:w-96"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-gold/10 text-gold-dark">
              {unreadCount} new
            </Badge>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[360px]">
            <div className="divide-y divide-border">
              {recent.map((notification) => {
                const Icon = typeIcons[notification.type] || MessageCircle;
                const colorClass = typeColors[notification.type] || typeColors.general;

                return (
                  <button
                    key={notification.id}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                      !notification.read && "bg-gold/5"
                    )}
                  >
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm line-clamp-1",
                          !notification.read ? "font-semibold text-foreground" : "text-foreground"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <Separator />

        <div className="p-2">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-gold hover:bg-gold/10 transition-colors"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
