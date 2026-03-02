"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Shield, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getUsers, getAllOrders } from "@/lib/data/storage";
import type { User, Order } from "@/lib/data/types";
import { HPCoin } from "@/components/hp-coin";

export default function AdminUsersPage() {
  const [users, setUsersList] = useState<User[]>([]);
  const [orders, setOrdersList] = useState<Order[]>([]);
  const [search, setSearch] = useState("");

  const refresh = useCallback(() => {
    setUsersList(getUsers());
    setOrdersList(getAllOrders());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function getOrderCount(userId: string): number {
    return orders.filter((o) => o.userId === userId).length;
  }

  function getTotalSpent(userId: string): number {
    return orders
      .filter((o) => o.userId === userId && o.status !== "Cancelled")
      .reduce((sum, o) => sum + o.total, 0);
  }

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground">
          {users.length} registered users
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">HP Balance</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Total Spent</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-muted-foreground"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-sm font-bold text-gold-dark">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user.role === "admin" ? (
                          <Badge className="bg-gold/10 text-gold-dark border-gold/30 text-xs gap-1">
                            <Shield className="h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs gap-1">
                            <UserIcon className="h-3 w-3" />
                            Customer
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <HPCoin size="sm" />
                          <span className="font-medium text-gold-dark">
                            {user.hpBalance}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {getOrderCount(user.id)}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        AED {getTotalSpent(user.id).toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("en-AE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
