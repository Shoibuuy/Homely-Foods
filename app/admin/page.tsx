"use client";

import { useEffect, useMemo, useState } from "react";
import { formatAED } from "@/lib/utils";
import { getOrderItemCount, getOrderRef } from "@/lib/orders/selectors";
import {
  DollarSign,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  TrendingUp,
  Clock,
} from "lucide-react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { getStats, getAllOrders } from "@/lib/data/storage";
import type { Order } from "@/lib/data/types";

const STATUS_COLORS: Record<string, string> = {
  Confirmed: "#d4a843",
  Preparing: "#e8a23a",
  "Out for Delivery": "#5aa3e8",
  Delivered: "#52b788",
  Cancelled: "#e05252",
  Pending: "#f59e0b",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<ReturnType<typeof getStats> | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    setStats(getStats());
    setRecentOrders(getAllOrders().slice(0, 5));
  }, []);

  const statCards = useMemo(() => {
    if (!stats) return [];

    return [
      {
        label: "Total Revenue",
        value: `AED ${stats.totalRevenue.toLocaleString("en-AE", {
          minimumFractionDigits: 0,
        })}`,
        icon: DollarSign,
        color: "text-gold",
        bg: "bg-gold/10",
      },
      {
        label: "Total Orders",
        value: stats.totalOrders,
        icon: ShoppingBag,
        color: "text-secondary",
        bg: "bg-secondary/10",
      },
      {
        label: "Today Orders",
        value: stats.todayOrders,
        icon: Clock,
        color: "text-accent",
        bg: "bg-accent/10",
      },
      {
        label: "Registered Users",
        value: stats.totalUsers,
        icon: Users,
        color: "text-green",
        bg: "bg-green/10",
      },
      {
        label: "Menu Items",
        value: stats.totalMenuItems,
        icon: UtensilsCrossed,
        color: "text-gold-dark",
        bg: "bg-gold/10",
      },
      {
        label: "Today Revenue",
        value: `AED ${stats.todayRevenue.toLocaleString("en-AE", {
          minimumFractionDigits: 0,
        })}`,
        icon: TrendingUp,
        color: "text-secondary",
        bg: "bg-secondary/10",
      },
    ];
  }, [stats]);

  const pieData = useMemo(() => {
    if (!stats) return [];

    return Object.entries(stats.statusCounts).map(([name, value]) => ({
      name,
      value,
      fill: STATUS_COLORS[name] || "#888888",
    }));
  }, [stats]);

  const barData = useMemo(() => {
    return recentOrders.map((order) => ({
      name: order.orderNo ?? `#${order.id.slice(-5)}`,
      total: order.total,
    }));
  }, [recentOrders]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of your restaurant performance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.label} className="border-border bg-card shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.bg}`}
                >
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="wrap-break-word text-xl font-bold text-foreground">
                    {card.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Order Status Breakdown</CardTitle>
            <CardDescription>
              Distribution of all orders by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ChartContainer
                config={Object.fromEntries(
                  pieData.map((entry) => [
                    entry.name,
                    { label: entry.name, color: entry.fill },
                  ]),
                )}
                className="mx-auto h-[280px] w-full sm:h-[320px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} orders`,
                        name,
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                No orders yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Recent Order Revenue</CardTitle>
            <CardDescription>
              Revenue from the 5 most recent orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <ChartContainer
                config={{
                  total: { label: "Revenue (AED)", color: "#d4a843" },
                }}
                className="h-[280px] w-full sm:h-[320px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="total"
                      fill="#d4a843"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                No orders yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <CardDescription>
            Latest orders placed by customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                      <th className="pb-3 pr-4">Order ID</th>
                      <th className="pb-3 pr-4">Items</th>
                      <th className="pb-3 pr-4">Total</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => {
                      const itemCount = getOrderItemCount(order);

                      return (
                        <tr
                          key={order.id}
                          className="border-b border-border/50 last:border-0"
                        >
                          <td className="py-3 pr-4 font-mono text-xs text-foreground">
                            {getOrderRef(order)}
                          </td>
                          <td className="py-3 pr-4 text-foreground">
                            {itemCount} item{itemCount !== 1 ? "s" : ""}
                          </td>
                          <td className="py-3 pr-4 font-medium text-foreground">
                            {formatAED(order.total)}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor:
                                  STATUS_COLORS[order.status] || "#888888",
                                color: STATUS_COLORS[order.status] || "#888888",
                              }}
                            >
                              {order.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString(
                              "en-AE",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {recentOrders.map((order) => {
                  const itemCount = getOrderItemCount(order);

                  return (
                    <div
                      key={order.id}
                      className="rounded-xl border border-border bg-background p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-foreground">
                            {getOrderRef(order)}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {itemCount} item{itemCount !== 1 ? "s" : ""}
                          </p>
                        </div>

                        <Badge
                          variant="outline"
                          className="shrink-0 text-xs"
                          style={{
                            borderColor:
                              STATUS_COLORS[order.status] || "#888888",
                            color: STATUS_COLORS[order.status] || "#888888",
                          }}
                        >
                          {order.status}
                        </Badge>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <p className="font-medium text-foreground">
                          {formatAED(order.total)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("en-AE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No orders yet. Orders placed by customers will appear here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}