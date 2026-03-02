"use client";

import { useEffect, useState } from "react";
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
import { getStats, getAllOrders, getUsers } from "@/lib/data/storage";
import type { Order } from "@/lib/data/types";

const STATUS_COLORS: Record<string, string> = {
  "Order Placed": "#d4a843",
  Preparing: "#e8a23a",
  "Out for Delivery": "#5aa3e8",
  Delivered: "#52b788",
  Cancelled: "#e05252",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<ReturnType<typeof getStats> | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    setStats(getStats());
    setRecentOrders(getAllOrders().slice(0, 5));
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Revenue",
      value: `AED ${stats.totalRevenue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}`,
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
      value: `AED ${stats.todayRevenue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}`,
      icon: TrendingUp,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
  ];

  // Order status pie chart data
  const pieData = Object.entries(stats.statusCounts).map(([name, value]) => ({
    name,
    value,
    fill: STATUS_COLORS[name] || "#888",
  }));

  // Recent orders bar chart (revenue per order)
  const barData = recentOrders.map((o) => ({
    name: `#${o.id.slice(-5)}`,
    total: o.total,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of your restaurant performance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${s.bg}`}
                >
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Status Breakdown</CardTitle>
            <CardDescription>Distribution of all orders by status</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ChartContainer
                config={Object.fromEntries(
                  pieData.map((d) => [
                    d.name,
                    { label: d.name, color: d.fill },
                  ])
                )}
                className="mx-auto h-[280px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
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

        {/* Recent Orders Revenue Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Order Revenue</CardTitle>
            <CardDescription>Revenue from the 5 most recent orders</CardDescription>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <ChartContainer
                config={{
                  total: { label: "Revenue (AED)", color: "#d4a843" },
                }}
                className="h-[280px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="total" fill="#d4a843" radius={[4, 4, 0, 0]} />
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

      {/* Recent Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <CardDescription>Latest orders placed by customers</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
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
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-3 pr-4 font-mono text-xs text-foreground">
                        #{order.id.slice(-6)}
                      </td>
                      <td className="py-3 pr-4 text-foreground">
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </td>
                      <td className="py-3 pr-4 font-medium text-foreground">
                        AED {order.total.toFixed(2)}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor:
                              STATUS_COLORS[order.status] || "#888",
                            color: STATUS_COLORS[order.status] || "#888",
                          }}
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-AE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
