"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Gift,
  ArrowRight,
  History,
  Star,
  Info,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth, useCart } from "@/lib/data/store";
import {
  getHPTransactions,
  getRedeemableItems,
  getUserOrders,
  getHPConfig,
} from "@/lib/data/storage";
import { HPCoin, HPBadge } from "@/components/hp-coin";
import { formatAED, cn } from "@/lib/utils";
import type { HPTransaction, MenuItem, HPTransactionType } from "@/lib/data/types";
import { toast } from "sonner";

const typeConfig: Record<
  HPTransactionType,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  earned: {
    icon: TrendingUp,
    color: "text-green",
    bg: "bg-green/10",
    label: "Earned",
  },
  redeemed: {
    icon: TrendingDown,
    color: "text-blue-offer",
    bg: "bg-blue-offer/10",
    label: "Redeemed",
  },
  bonus: {
    icon: Gift,
    color: "text-gold",
    bg: "bg-gold/10",
    label: "Bonus",
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TransactionCard({ tx }: { tx: HPTransaction }) {
  const config = typeConfig[tx.type];
  const Icon = config.icon;

  return (
    <Card className="border-border bg-card">
      <CardContent className="flex items-center gap-4 p-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", config.bg)}>
          <Icon className={cn("h-5 w-5", config.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{tx.description}</p>
          <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className={cn("text-lg font-bold", tx.amount > 0 ? "text-green" : "text-blue-offer")}>
            {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
          </p>
          <Badge variant="outline" className={cn("text-[10px]", config.color)}>
            {config.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function RedeemableItemCard({
  item,
  userBalance,
  onRedeem,
}: {
  item: MenuItem;
  userBalance: number;
  onRedeem: (item: MenuItem) => void;
}) {
  const canRedeem = userBalance >= item.hpRedeemCost;
  const progress = Math.min((userBalance / item.hpRedeemCost) * 100, 100);

  return (
    <Card className="overflow-hidden border-border bg-card transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3]">
        <Image
          src={item.images[0] || "/placeholder.svg"}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {!canRedeem && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px]" />
        )}
        <div className="absolute bottom-2 left-2 right-2">
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="mb-1 font-serif text-lg font-semibold text-foreground line-clamp-1">
          {item.name}
        </h3>
        <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
          {item.description}
        </p>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <HPCoin size="sm" />
            <span className="font-bold text-gold-dark">{item.hpRedeemCost}</span>
            <span className="text-xs text-muted-foreground">HP</span>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    size="sm"
                    disabled={!canRedeem}
                    onClick={() => onRedeem(item)}
                    className={cn(
                      canRedeem
                        ? "bg-gold text-primary-foreground hover:bg-gold-dark"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {canRedeem ? "Redeem" : `Need ${item.hpRedeemCost - userBalance} more`}
                  </Button>
                </div>
              </TooltipTrigger>
              {!canRedeem && (
                <TooltipContent>
                  <p>You need {item.hpRedeemCost - userBalance} more HP to redeem this item</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PointsPage() {
  const { user } = useAuth();
  const { addItem } = useCart();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    setMounted(true);
  }, []);

  const transactions = useMemo(() => {
    if (!mounted || !user) return [];
    return getHPTransactions(user.id);
  }, [mounted, user]);

  const redeemableItems = useMemo(() => {
    if (!mounted) return [];
    return getRedeemableItems();
  }, [mounted]);

  const orders = useMemo(() => {
    if (!mounted || !user) return [];
    return getUserOrders(user.id);
  }, [mounted, user]);

  const hpConfig = useMemo(() => {
    if (!mounted) return null;
    return getHPConfig();
  }, [mounted]);

  const stats = useMemo(() => {
    const totalEarned = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const totalRedeemed = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const ordersWithHP = orders.filter((o) => o.hpEarned > 0).length;

    return { totalEarned, totalRedeemed, ordersWithHP };
  }, [transactions, orders]);

  const handleRedeem = (item: MenuItem) => {
    if (!user) return;

    // Add item to cart with note that it's redeemed with HP
    addItem(item, 1, [], `Redeemed with ${item.hpRedeemCost} HomelyPoints`);
    toast.success(`${item.name} added to cart! HP will be deducted at checkout.`);
  };

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gold/10">
          <HPCoin size="lg" />
        </div>
        <h2 className="mb-1 font-serif text-2xl font-bold text-foreground">
          Sign in to view your points
        </h2>
        <p className="mb-6 text-muted-foreground">
          Track your HomelyPoints, view history, and redeem rewards.
        </p>
        <Link href="/login">
          <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <HPCoin size="lg" />
                <h1 className="font-serif text-3xl font-bold text-foreground">
                  HomelyPoints
                </h1>
              </div>
              <p className="text-muted-foreground">
                Earn points with every order and redeem them for free dishes
              </p>
            </div>

            <Card className="border-gold/30 bg-gold/5 lg:min-w-[280px]">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Your Balance</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-serif text-4xl font-bold text-foreground">
                    {user.hpBalance}
                  </span>
                  <span className="text-lg text-gold-dark">HP</span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Earned: {stats.totalEarned}</span>
                  <span>Redeemed: {stats.totalRedeemed}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 bg-muted/50">
            <TabsTrigger value="overview" className="gap-2">
              <Coins className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="redeem" className="gap-2">
              <Gift className="h-4 w-4" />
              Redeem
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green/10">
                      <TrendingUp className="h-5 w-5 text-green" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Earned</p>
                      <p className="font-serif text-2xl font-bold text-foreground">
                        {stats.totalEarned}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-offer/10">
                      <TrendingDown className="h-5 w-5 text-blue-offer" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Redeemed</p>
                      <p className="font-serif text-2xl font-bold text-foreground">
                        {stats.totalRedeemed}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                      <ShoppingBag className="h-5 w-5 text-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Orders with HP</p>
                      <p className="font-serif text-2xl font-bold text-foreground">
                        {stats.ordersWithHP}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* How It Works */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5 text-gold" />
                  How HomelyPoints Work
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      step: "1",
                      title: "Order Food",
                      description: "Place orders from our delicious menu",
                    },
                    {
                      step: "2",
                      title: "Earn Points",
                      description:
                        hpConfig?.mode === "per-item"
                          ? "Each dish earns you HP based on its value"
                          : "Earn HP based on your order total",
                    },
                    {
                      step: "3",
                      title: "Stack & Save",
                      description: "Points never expire, keep accumulating",
                    },
                    {
                      step: "4",
                      title: "Redeem Free Food",
                      description: "Use your HP to get dishes completely free",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-sm font-bold text-gold">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-foreground">Recent Activity</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("history")}
                  className="text-gold hover:text-gold-dark"
                >
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              {transactions.length === 0 ? (
                <Card className="border-dashed border-border bg-card">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <History className="mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No transactions yet</p>
                    <p className="text-xs text-muted-foreground">
                      Start ordering to earn HomelyPoints
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx) => (
                    <TransactionCard key={tx.id} tx={tx} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Redeem Tab */}
          <TabsContent value="redeem">
            <div className="mb-6">
              <h2 className="font-serif text-xl font-bold text-foreground">
                Redeem Your Points
              </h2>
              <p className="text-sm text-muted-foreground">
                Use your {user.hpBalance} HP to get these items for free
              </p>
            </div>

            {redeemableItems.length === 0 ? (
              <Card className="border-dashed border-border bg-card">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Gift className="mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No redeemable items available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {redeemableItems.map((item) => (
                  <RedeemableItemCard
                    key={item.id}
                    item={item}
                    userBalance={user.hpBalance}
                    onRedeem={handleRedeem}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <div className="mb-6">
              <h2 className="font-serif text-xl font-bold text-foreground">
                Transaction History
              </h2>
              <p className="text-sm text-muted-foreground">
                Complete history of your HomelyPoints
              </p>
            </div>

            {transactions.length === 0 ? (
              <Card className="border-dashed border-border bg-card">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <History className="mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No transaction history</p>
                  <Link href="/menu" className="mt-4">
                    <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
                      Start Ordering
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <TransactionCard key={tx.id} tx={tx} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
