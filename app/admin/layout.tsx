"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  Layers,
  Star,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/data/store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const sidebarLinks = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Menu Items", href: "/admin/menu", icon: UtensilsCrossed },
  { label: "Categories", href: "/admin/categories", icon: Layers },
  { label: "Orders", href: "/admin/orders", icon: ClipboardList },
  { label: "Reservations", href: "/admin/reservations", icon: ClipboardList },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "HP Config", href: "/admin/hp-config", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/login?redirect=/admin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const renderSidebarContent = (collapsed = false) => (
    <>
      <div
        className={cn(
          "flex items-center px-4 py-5",
          collapsed ? "justify-center" : "gap-2",
        )}
      >
        <UtensilsCrossed className="h-6 w-6 shrink-0 text-gold" />

        {!collapsed ? (
          <div className="flex flex-col leading-none">
            <span className="font-serif text-base font-bold text-foreground">
              HOMELY FOODS
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gold">
              Admin Panel
            </span>
          </div>
        ) : null}
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1" aria-label="Admin navigation">
          {sidebarLinks.map((link) => {
            const isActive =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);
            const Icon = link.icon;

            return (
              <Link
                key={link.label}
                href={link.href}
                title={collapsed ? link.label : undefined}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-colors",
                  collapsed
                    ? "justify-center px-3 py-2.5"
                    : "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-gold/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-gold")} />
                {!collapsed ? <span>{link.label}</span> : null}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      <div className="flex flex-col gap-2 px-3 py-4">
        <Link
          href="/"
          title={collapsed ? "Back to Site" : undefined}
          className={cn(
            "flex rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            collapsed
              ? "justify-center px-3 py-2"
              : "items-center gap-3 px-3 py-2",
          )}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          {!collapsed ? <span>Back to Site</span> : null}
        </Link>

        <Button
          variant="ghost"
          title={collapsed ? "Logout" : undefined}
          className={cn(
            "text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed
              ? "justify-center px-3"
              : "justify-start gap-3 px-3",
          )}
          onClick={() => {
            logout();
            router.replace("/");
          }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed ? <span>Logout</span> : null}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 border-r border-border bg-card lg:flex lg:flex-col",
            desktopCollapsed ? "lg:w-20" : "lg:w-64",
          )}
        >
          <div className="flex items-center justify-end px-3 pt-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setDesktopCollapsed((prev) => !prev)}
            >
              {desktopCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>

          {renderSidebarContent(desktopCollapsed)}
        </aside>

        {mobileOpen ? (
          <button
            type="button"
            aria-label="Close sidebar overlay"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card shadow-xl transition-transform duration-200 lg:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-6 w-6 text-gold" />
              <div className="flex flex-col leading-none">
                <span className="font-serif text-base font-bold text-foreground">
                  HOMELY FOODS
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gold">
                  Admin Panel
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Separator />
          {renderSidebarContent(false)}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-gold" />
                <span className="font-serif text-sm font-bold text-foreground">
                  Admin Panel
                </span>
              </div>

              <div className="w-9" />
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}