"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Edit2,
  Check,
  X,
  Package,
  Clock,
  ChefHat,
  Truck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/data/store";
import { HPCoin, HPBadge } from "@/components/hp-coin";
import { getUserOrders, getNotifications } from "@/lib/data/storage";
import { toast } from "sonner";
import type { OrderStatus } from "@/lib/data/types";

const statusConfig: Record<
  OrderStatus,
  { icon: React.ElementType; color: string; bg: string }
> = {
  "Order Placed": { icon: Package, color: "text-gold", bg: "bg-gold/10" },
  Preparing: { icon: ChefHat, color: "text-gold-dark", bg: "bg-gold/10" },
  "Out for Delivery": { icon: Truck, color: "text-blue-offer", bg: "bg-blue-offer/10" },
  Delivered: { icon: CheckCircle2, color: "text-green", bg: "bg-green/10" },
  Cancelled: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");

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
          Access your orders, points, and account details.
        </p>
        <Link href="/login">
          <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  const orders = getUserOrders(user.id);
  const hpNotifications = getNotifications(user.id).filter(
    (n) => n.type === "points"
  );

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    updateProfile({ name: editName, phone: editPhone });
    setEditing(false);
    toast.success("Profile updated.");
  };

  const handleCancelEdit = () => {
    setEditName(user.name);
    setEditPhone(user.phone);
    setEditing(false);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">
            My Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your account, orders, and HomelyPoints
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6">
            {/* User Info Card */}
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
                  <div>
                    {editing ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="mb-1 h-8 bg-background text-sm"
                      />
                    ) : (
                      <p className="font-serif text-lg font-semibold text-card-foreground">
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
                    <span className="text-muted-foreground">{user.email}</span>
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
              </CardContent>
            </Card>

            {/* HP Balance Card */}
            <Card className="border-gold/20 bg-gold/5 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <HPCoin size="lg" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gold">
                      HomelyPoints Balance
                    </p>
                    <p className="font-serif text-3xl font-bold text-foreground">
                      {user.hpBalance}
                      <span className="ml-1 text-base font-normal text-muted-foreground">
                        HP
                      </span>
                    </p>
                  </div>
                </div>
                {hpNotifications.length > 0 && (
                  <>
                    <Separator className="my-4 bg-gold/20" />
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gold">
                      Recent Activity
                    </h3>
                    <div className="space-y-2">
                      {hpNotifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {n.message}
                          </span>
                          <span className="text-xs text-muted-foreground/60">
                            {new Date(n.createdAt).toLocaleDateString("en-AE", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Button
              variant="outline"
              className="w-full text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={logout}
            >
              Sign Out
            </Button>
          </div>

          {/* Right Column - Orders */}
          <div className="lg:col-span-2">

            {orders.length === 0 ? (
              <Card className="border-border bg-card shadow-sm">
                 <h2 className="mb-4 font-serif text-xl font-bold text-foreground px-8" >
              Order History
            </h2>
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
                  return (
                    <Card
                      key={order.id}
                      className="border-border bg-card shadow-sm"
                    >
                      <CardContent className="p-5">
                        {/* Order header */}
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-muted-foreground">
                              #{order.id.slice(-8).toUpperCase()}
                            </span>
                            <Badge
                              className={`${config.bg} ${config.color} border-none hover:${config.bg}`}
                            >
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {order.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
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
                          </span>
                        </div>

                        {/* Items */}
                        <div className="mb-3 space-y-1">
                          {order.items.map((ci) => (
                            <div
                              key={ci.menuItem.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-muted-foreground">
                                {ci.menuItem.name}{" "}
                                <span className="text-muted-foreground/60">
                                  x{ci.quantity}
                                </span>
                              </span>
                              <span className="text-card-foreground">
                                AED{" "}
                                {(
                                  (ci.menuItem.price +
                                    ci.selectedAddOns.reduce(
                                      (s, a) => s + a.price,
                                      0
                                    )) *
                                  ci.quantity
                                ).toFixed(0)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <Separator className="mb-3" />

                        <div className="flex items-center justify-between">
                          <HPBadge amount={order.hpEarned} label="earned" />
                          <span className="font-serif text-lg font-bold text-card-foreground">
                            AED {order.total}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
