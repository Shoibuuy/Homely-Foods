"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  ShoppingCart,
  User,
  Search,
  X,
  LogOut,
  ChevronDown,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/data/store";
import { useCart } from "@/lib/data/store";
import { HPCoin } from "@/components/hp-coin";
import { openCartDrawer } from "@/lib/cart-drawer-state";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "Reservations", href: "/reservations" },
  { label: "Reviews", href: "/reviews" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const safeUser = mounted ? user : null;
  const safeItemCount = mounted ? itemCount : 0;

useEffect(() => {
  setMounted(true);
}, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <UtensilsCrossed className="h-7 w-7 text-gold" />
          <div className="flex flex-col leading-none">
            <span className="font-serif text-lg font-bold tracking-tight text-foreground">
              HOMELY
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
              Foods
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href) && link.href !== "#";
            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                  link.href === "#" && "pointer-events-none opacity-50"
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gold" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Search (placeholder) */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden text-muted-foreground hover:text-foreground md:flex"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* HP Balance */}
          {user && (
            <Link
              href="/profile"
              className="hidden items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1.5 transition-colors hover:bg-gold/20 md:flex"
            >
              <HPCoin size="sm" />
              <span className="text-sm font-semibold text-gold-dark">
                {user.hpBalance}
              </span>
            </Link>
          )}

          {/* Cart */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
            onClick={openCartDrawer}
            aria-label={`Cart with ${itemCount} items`}
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-primary-foreground">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Button>

          {/* User Menu / Auth */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="hidden gap-1.5 px-2 text-muted-foreground hover:text-foreground md:flex"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold-dark">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card text-card-foreground">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <UtensilsCrossed className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" className="hidden md:block">
              <Button
                size="sm"
                className="bg-gold text-primary-foreground hover:bg-gold-dark"
              >
                Sign In
              </Button>
            </Link>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-card p-0 text-card-foreground">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border px-4 py-4">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="h-6 w-6 text-gold" />
                    <span className="font-serif text-lg font-bold text-foreground">
                      HOMELY FOODS
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {user && (
                  <div className="border-b border-border px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-sm font-bold text-gold-dark">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <div className="flex items-center gap-1">
                          <HPCoin size="sm" />
                          <span className="text-xs font-semibold text-gold-dark">
                            {user.hpBalance} HP
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <nav className="flex-1 px-2 py-4" aria-label="Mobile navigation">
                  {navLinks.map((link) => {
                    const isActive =
                      link.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(link.href) && link.href !== "#";
                    return (
                      <Link
                        key={link.label}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-gold/10 text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          link.href === "#" && "pointer-events-none opacity-50"
                        )}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                  {user && (
                    <Link
                      href="/profile"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        pathname === "/profile"
                          ? "bg-gold/10 text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      My Profile
                    </Link>
                  )}
                </nav>

                <div className="border-t border-border px-4 py-4">
                  {user ? (
                    <Button
                      variant="outline"
                      className="w-full text-foreground"
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  ) : (
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full bg-gold text-primary-foreground hover:bg-gold-dark">
                        Sign In
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
