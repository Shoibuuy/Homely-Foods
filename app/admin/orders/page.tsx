"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Eye, ChevronDown, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAllOrders, updateOrderStatus, getUsers } from "@/lib/data/storage";
import type { Order, OrderStatus, User } from "@/lib/data/types";
import { toast } from "sonner";

const ALL_STATUSES: OrderStatus[] = [
  "Order Placed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const STATUS_COLORS: Record<string, string> = {
  "Order Placed": "border-gold text-gold-dark bg-gold/10",
  Preparing: "border-orange-400 text-orange-600 bg-orange-50",
  "Out for Delivery": "border-accent text-accent bg-accent/10",
  Delivered: "border-green text-green bg-green/10",
  Cancelled: "border-destructive text-destructive bg-destructive/10",
};

function toWhatsAppLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${digits}?text=${encoded}`;
}

function buildOrderWhatsAppMessage(params: {
  name: string;
  orderShortId: string;
  status: OrderStatus;
  total: number;
}) {
  const { name, orderShortId, status, total } = params;

  if (status === "Order Placed") {
    return `Hi ${name}, Greetings from Homely Foods! ✅ We received your order (#${orderShortId}). Total: AED ${total.toFixed(
      2
    )}. We will confirm soon. Thank you!`;
  }

  if (status === "Preparing") {
    return `Hi ${name}, Your order (#${orderShortId}) is now being prepared 🍳. We will update you once it’s out for delivery. Thank you!`;
  }

  if (status === "Out for Delivery") {
    return `Hi ${name}, Your order (#${orderShortId}) is out for delivery 🚗. Thank you for choosing Homely Foods!`;
  }

  if (status === "Delivered") {
    return `Hi ${name}, Your order (#${orderShortId}) has been delivered ✅. Thank you! If you enjoyed, please leave us a review ⭐`;
  }

  if (status === "Cancelled") {
    return `Hi ${name}, Unfortunately your order (#${orderShortId}) has been cancelled. If you need help, please reply here.`;
  }

  return `Hi ${name}, Update on your order (#${orderShortId}): Status is now "${status}". Thank you!`;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  // WhatsApp popup state
  const [waOpen, setWaOpen] = useState(false);
  const [waPhone, setWaPhone] = useState("");
  const [waName, setWaName] = useState("");
  const [waMessage, setWaMessage] = useState("");
  const [waStatus, setWaStatus] = useState<OrderStatus>("Order Placed");
  const [waOrderShortId, setWaOrderShortId] = useState("");

  const refresh = useCallback(() => {
    setOrders(getAllOrders());
    setUsers(getUsers());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function getUserName(userId: string): string {
    const user = users.find((u) => u.id === userId);
    return user?.name || "Unknown";
  }

  function handleStatusChange(order: Order, newStatus: OrderStatus) {
    updateOrderStatus(order.id, newStatus);
    toast.success(`Order status updated to "${newStatus}"`);
    refresh();

    // Also update detail dialog if open
    if (detailOrder && detailOrder.id === order.id) {
      setDetailOrder({ ...detailOrder, status: newStatus });
    }

    // Prepare WhatsApp popup
    const phone = order.deliveryAddress?.phone || "";
    const name =
      order.deliveryAddress?.fullName ||
      getUserName(order.userId) ||
      "Customer";
    const shortId = order.id.slice(-6);

    setWaPhone(phone);
    setWaName(name);
    setWaStatus(newStatus);
    setWaOrderShortId(shortId);
    setWaMessage(
      buildOrderWhatsAppMessage({
        name,
        orderShortId: shortId,
        status: newStatus,
        total: order.total,
      })
    );
    setWaOpen(true);
  }

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      getUserName(o.userId).toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Orders
        </h1>
        <p className="text-sm text-muted-foreground">
          {orders.length} total orders
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order ID or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* keep your existing status filter if you want; not required for WhatsApp */}
        <div className="w-full sm:w-48" />
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-center text-muted-foreground"
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filtered.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-foreground">
                        #{order.id.slice(-6)}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {getUserName(order.userId)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {order.items.reduce((a, i) => a + i.quantity, 0)} item
                        {order.items.reduce((a, i) => a + i.quantity, 0) !== 1
                          ? "s"
                          : ""}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        AED {order.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-xs capitalize text-muted-foreground">
                        {order.paymentMethod === "cash"
                          ? "Cash on Delivery"
                          : "Card on Delivery"}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="inline-flex items-center gap-1">
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  STATUS_COLORS[order.status] || ""
                                }`}
                              >
                                {order.status}
                                <ChevronDown className="ml-0.5 h-3 w-3" />
                              </Badge>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {ALL_STATUSES.map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => handleStatusChange(order, s)}
                                className={
                                  order.status === s
                                    ? "font-medium text-foreground"
                                    : ""
                                }
                              >
                                {s}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-AE", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => setDetailOrder(order)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog
        open={!!detailOrder}
        onOpenChange={(o) => {
          if (!o) setDetailOrder(null);
        }}
      >
        <DialogContent className="sm:max-w-lg bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="font-serif text-foreground">
              Order #{detailOrder?.id.slice(-6)}
            </DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="flex flex-col gap-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium text-foreground">
                    {getUserName(detailOrder.userId)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    className={`mt-0.5 text-xs ${
                      STATUS_COLORS[detailOrder.status] || ""
                    }`}
                  >
                    {detailOrder.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment</p>
                  <p className="font-medium capitalize text-foreground">
                    {detailOrder.paymentMethod === "cash"
                      ? "Cash on Delivery"
                      : "Card on Delivery"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">HP Earned</p>
                  <p className="font-medium text-gold-dark">
                    +{detailOrder.hpEarned} HP
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Delivery Address
                </p>
                <p className="text-sm text-foreground">
                  {detailOrder.deliveryAddress.fullName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {detailOrder.deliveryAddress.phone}
                </p>
                <p className="text-sm text-muted-foreground">
                  {detailOrder.deliveryAddress.address},{" "}
                  {detailOrder.deliveryAddress.area}
                </p>
                {detailOrder.deliveryAddress.notes && (
                  <p className="mt-1 text-xs text-muted-foreground italic">
                    Note: {detailOrder.deliveryAddress.notes}
                  </p>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Items
                </p>
                <div className="flex flex-col gap-2">
                  {detailOrder.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {item.menuItem.name} x{item.quantity}
                        </p>
                        {item.selectedAddOns.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            +{item.selectedAddOns.map((a) => a.name).join(", ")}
                          </p>
                        )}
                      </div>
                      <p className="font-medium text-foreground">
                        AED{" "}
                        {(
                          (item.menuItem.price +
                            item.selectedAddOns.reduce((s, a) => s + a.price, 0)) *
                          item.quantity
                        ).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="font-medium text-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">
                  AED {detailOrder.total.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* WhatsApp Dialog */}
      <Dialog open={waOpen} onOpenChange={setWaOpen}>
        <DialogContent className="sm:max-w-lg bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="font-serif text-foreground">
              Send WhatsApp Update
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="rounded-md bg-muted/40 p-3 text-sm">
              <p>
                <strong>Name:</strong> {waName}
              </p>
              <p>
                <strong>WhatsApp:</strong> {waPhone}
              </p>
              <p>
                <strong>Order:</strong> #{waOrderShortId}
              </p>
              <p>
                <strong>Status:</strong> {waStatus}
              </p>
            </div>

            <Textarea
              autoFocus
              value={waMessage}
              onChange={(e) => setWaMessage(e.target.value)}
              className="min-h-[140px]"
            />

            <p className="text-xs text-muted-foreground">
              WhatsApp will open with the message ready. Tap Send to deliver it.
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(waMessage);
                  toast.success("Message copied!");
                }}
              >
                Copy
              </Button>

              <Button
                className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
                onClick={() => {
                  if (!waPhone || waPhone.replace(/\D/g, "").length < 8) {
                    toast.error("WhatsApp number is missing or invalid.");
                    return;
                  }
                  const link = toWhatsAppLink(waPhone, waMessage);
                  window.open(link, "_blank");
                }}
              >
                <MessageCircle className="h-4 w-4" />
                Open WhatsApp
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWaOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}