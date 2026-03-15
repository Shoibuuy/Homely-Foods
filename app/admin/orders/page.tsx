"use client";

import { formatAED } from "@/lib/utils";
import { getOrderItemCount, getOrderRef } from "@/lib/orders/selectors";
import { getOrderEtaInfo } from "@/lib/orders/tracking";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Eye,
  ChevronDown,
  MessageCircle,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useNow } from "@/lib/hooks/useNow";
import { isOrderOverdue, getOrderDelayMinutes } from "@/lib/orders/overdue";
import { ORDER_STATUSES, STATUS_COLORS } from "@/lib/orders/constants";
import { buildOrderWhatsAppMessage } from "@/lib/orders/messages";
import { applyOrderStatusUpdate } from "@/lib/orders/actions";
import { toWhatsAppLink } from "@/lib/orders/whatsapp";
import {
  calcOrderPricing,
  calcCartItemLineTotal,
} from "@/lib/orders/pricing";
import { PriceBreakdown } from "@/components/orders/price-breakdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getAllOrders,
  getUsers,
  updateOrderPhone,
  markOrderContacted,
} from "@/lib/data/storage";
import type { Order, OrderStatus, User } from "@/lib/data/types";
import { toast } from "sonner";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [phoneOriginal, setPhoneOriginal] = useState("");
  const [phoneSavedAt, setPhoneSavedAt] = useState<string | null>(null);

  const [confirmPhoneOpen, setConfirmPhoneOpen] = useState(false);
  const [pendingPhoneValue, setPendingPhoneValue] = useState("");

  const [confirmMetaOpen, setConfirmMetaOpen] = useState(false);
  const [confirmEta, setConfirmEta] = useState<number>(30);
  const [confirmRemark, setConfirmRemark] = useState<string>("");

  const [filterPayment, setFilterPayment] = useState("all");
  const [filterContacted, setFilterContacted] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [overdueOpen, setOverdueOpen] = useState(false);

  const [waOpen, setWaOpen] = useState(false);
  const [waPhone, setWaPhone] = useState("");
  const [waName, setWaName] = useState("");
  const [waMessage, setWaMessage] = useState("");
  const [waStatus, setWaStatus] = useState<OrderStatus>("Pending");
  const [waOrderShortId, setWaOrderShortId] = useState("");

  const now = useNow(1000);

  const refresh = useCallback(() => {
    setOrders(getAllOrders());
    setUsers(getUsers());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!detailOrder) return;

    const updated = orders.find((o) => o.id === detailOrder.id);
    if (updated) {
      setDetailOrder(updated);
    }
  }, [orders, detailOrder]);

  useEffect(() => {
    if (!detailOrder) return;

    const current = detailOrder.deliveryAddress.phone || "";
    setPhoneOriginal(current);
    setPhoneSavedAt(null);
  }, [detailOrder?.id]);

  function getUserName(userId: string): string {
    const user = users.find((u) => u.id === userId);
    return user?.name || "Unknown";
  }

  function getDisplayCustomerName(order: Order): string {
    return (
      order.deliveryAddress?.fullName ||
      getUserName(order.userId) ||
      "Customer"
    );
  }

  function handleStatusChange(order: Order, newStatus: OrderStatus) {
    if (order.status === newStatus) {
      toast.message(`Order already marked as "${newStatus}"`);
      return;
    }

    setPendingOrder(order);
    setPendingStatus(newStatus);

    if (order.status === "Pending" && newStatus === "Confirmed") {
      setConfirmEta(order.confirmedEtaMinutes ?? 30);
      setConfirmRemark(order.adminRemark ?? "");
      setConfirmMetaOpen(true);
      return;
    }

    const phone = order.deliveryAddress?.phone || "";
    const name = getDisplayCustomerName(order);
    const orderRef = getOrderRef(order);

    setWaPhone(phone);
    setWaName(name);
    setWaStatus(newStatus);
    setWaOrderShortId(orderRef);

    setWaMessage(
      buildOrderWhatsAppMessage({
        name,
        orderShortId: orderRef,
        status: newStatus,
        total: order.total,
        etaMinutes:
          newStatus === "Confirmed"
            ? order.confirmedEtaMinutes
            : undefined,
        remark: newStatus === "Confirmed" ? order.adminRemark : undefined,
      })
    );

    setWaOpen(true);
  }

  const baseForCounts = (() => {
    let result = [...orders];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          (o.orderNo ?? "").toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          getUserName(o.userId).toLowerCase().includes(q) ||
          (o.deliveryAddress?.fullName ?? "").toLowerCase().includes(q) ||
          (o.deliveryAddress?.phone ?? "").toLowerCase().includes(q)
      );
    }

    if (filterPayment !== "all") {
      result = result.filter((o) => o.paymentMethod === filterPayment);
    }

    if (filterContacted === "contacted") {
      result = result.filter((o) => !!o.lastContactedAt);
    }

    if (filterContacted === "not") {
      result = result.filter((o) => !o.lastContactedAt);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((o) => new Date(o.createdAt) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((o) => new Date(o.createdAt) <= to);
    }

    return result;
  })();

  const statusCount = (status: OrderStatus) =>
    baseForCounts.filter((o) => o.status === status).length;

  const counts = {
    pending: statusCount("Pending"),
    confirmed: statusCount("Confirmed"),
    preparing: statusCount("Preparing"),
    out: statusCount("Out for Delivery"),
  };

  const filtered = (() => {
    let result = [...orders];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          (o.orderNo ?? "").toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          getUserName(o.userId).toLowerCase().includes(q) ||
          (o.deliveryAddress?.fullName ?? "").toLowerCase().includes(q) ||
          (o.deliveryAddress?.phone ?? "").toLowerCase().includes(q)
      );
    }

    if (filterStatus !== "all") {
      result = result.filter((o) => o.status === filterStatus);
    }

    if (filterPayment !== "all") {
      result = result.filter((o) => o.paymentMethod === filterPayment);
    }

    if (filterContacted === "contacted") {
      result = result.filter((o) => !!o.lastContactedAt);
    }

    if (filterContacted === "not") {
      result = result.filter((o) => !o.lastContactedAt);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((o) => new Date(o.createdAt) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((o) => new Date(o.createdAt) <= to);
    }

    if (sortBy === "latest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    if (sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    if (sortBy === "amount_high") {
      result.sort((a, b) => b.total - a.total);
    }

    if (sortBy === "amount_low") {
      result.sort((a, b) => a.total - b.total);
    }

    return result;
  })();

  const overdueOrders = filtered
    .filter((o) => isOrderOverdue(o, now))
    .sort(
      (a, b) => getOrderDelayMinutes(b, now) - getOrderDelayMinutes(a, now)
    );

  function formatUaePhone(input: string): string {
    const raw = input.trim();
    const hasPlus = raw.startsWith("+");
    const digits = raw.replace(/\D/g, "");

    if (digits.startsWith("971")) return `+${digits}`;
    if (digits.startsWith("0") && digits.length === 10) {
      return `+971${digits.slice(1)}`;
    }
    if (digits.length === 9) return `+971${digits}`;

    if (hasPlus) return `+${digits}`;
    return raw;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Orders
        </h1>
        <p className="text-sm text-muted-foreground">
          {orders.length} total orders
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/20 p-3">
        <Button
          size="sm"
          variant={filterStatus === "all" ? "default" : "outline"}
          className={
            filterStatus === "all"
              ? "bg-gold text-primary-foreground hover:bg-gold-dark"
              : ""
          }
          onClick={() => setFilterStatus("all")}
        >
          All {baseForCounts.length}
        </Button>

        <Button
          size="sm"
          variant={filterStatus === "Pending" ? "default" : "outline"}
          onClick={() => setFilterStatus("Pending")}
        >
          Pending {counts.pending}
        </Button>

        <Button
          size="sm"
          variant={filterStatus === "Confirmed" ? "default" : "outline"}
          onClick={() => setFilterStatus("Confirmed")}
        >
          Confirmed {counts.confirmed}
        </Button>

        <Button
          size="sm"
          variant={filterStatus === "Preparing" ? "default" : "outline"}
          onClick={() => setFilterStatus("Preparing")}
        >
          Preparing {counts.preparing}
        </Button>

        <Button
          size="sm"
          variant={
            filterStatus === "Out for Delivery" ? "default" : "outline"
          }
          onClick={() => setFilterStatus("Out for Delivery")}
        >
          Out for Delivery {counts.out}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by order ID, name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All status</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All payments</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>

            <select
              value={filterContacted}
              onChange={(e) => setFilterContacted(e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All contacted</option>
              <option value="contacted">Contacted</option>
              <option value="not">Not contacted</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
              <option value="amount_high">Amount: High → Low</option>
              <option value="amount_low">Amount: Low → High</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 w-full sm:w-[170px]"
              />
            </div>

            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 w-full sm:w-[170px]"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setFilterStatus("all");
                setFilterPayment("all");
                setFilterContacted("all");
                setSortBy("latest");
                setDateFrom("");
                setDateTo("");
              }}
            >
              Reset
            </Button>

            <Button
              variant="outline"
              onClick={() => setOverdueOpen(true)}
              className="relative"
            >
              Overdue
              {overdueOrders.length > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
                  {overdueOrders.length}
                </span>
              )}
            </Button>

            <div className="flex items-center rounded-md border border-border bg-muted/30 px-3 text-xs text-muted-foreground">
              Showing{" "}
              <span className="mx-1 font-medium text-foreground">
                {filtered.length}
              </span>
              /
              <span className="mx-1 font-medium text-foreground">
                {orders.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted/30">
                <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">ETA</th>
                  <th className="px-4 py-3">Confirmed</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-12 text-center text-muted-foreground"
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filtered.map((order) => {
                    const itemCount = getOrderItemCount(order);
                    const eta = getOrderEtaInfo(order, now);
                    const contactedForThisStatus =
                      order.lastContactedStatus === order.status &&
                      !!order.lastContactedAt;

                    return (
                      <tr
                        key={order.id}
                        className={[
                          "border-b border-border/50 last:border-0",
                          order.status === "Pending" ? "bg-yellow-50/40" : "",
                        ].join(" ")}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-foreground">
                          {getOrderRef(order)}
                        </td>

                        <td className="px-4 py-3 text-foreground">
                          {getDisplayCustomerName(order)}
                          {order.deliveryAddress?.phone ? (
                            <div className="mt-0.5 text-[11px] text-muted-foreground">
                              {order.deliveryAddress.phone}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {itemCount} item{itemCount !== 1 ? "s" : ""}
                        </td>

                        <td className="px-4 py-3 font-medium text-foreground">
                          <div className="flex flex-col">
                            <span>{formatAED(order.total)}</span>
                            {(order.hpRedeemed ?? 0) > 0 ? (
                              <span className="text-[11px] font-medium text-blue-offer">
                                -{order.hpRedeemed} HP redeemed
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-xs capitalize text-muted-foreground">
                          {order.paymentMethod === "cash"
                            ? "Cash on Delivery"
                            : "Card on Delivery"}
                        </td>

                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="inline-flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    STATUS_COLORS[order.status] || ""
                                  }`}
                                >
                                  {order.status}
                                  <ChevronDown className="ml-1 h-3 w-3" />
                                </Badge>

                                {contactedForThisStatus ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] text-green"
                                  >
                                    Contacted
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] text-muted-foreground"
                                  >
                                    Not contacted
                                  </Badge>
                                )}
                              </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="start">
                              {ORDER_STATUSES.map((s) => (
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
                          {eta ? eta.text : "—"}
                        </td>

                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {order.confirmedAt
                            ? new Date(order.confirmedAt).toLocaleString(
                                "en-AE",
                                {
                                  day: "numeric",
                                  month: "short",
                                  hour: "numeric",
                                  minute: "2-digit",
                                }
                              )
                            : "—"}
                        </td>

                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-AE",
                            {
                              day: "numeric",
                              month: "short",
                            }
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setDetailOrder(order)}
                            title="View order"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!detailOrder}
        onOpenChange={(o) => {
          if (!o) setDetailOrder(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto bg-card text-card-foreground sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
<DialogTitle className="font-serif text-foreground">
                      Order Details
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                      View and manage order details
                    </DialogDescription>

              {detailOrder ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    size="sm"
                    className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
                    onClick={() => {
                      const phone = detailOrder.deliveryAddress?.phone || "";
                      const name = getDisplayCustomerName(detailOrder);
                      const orderRef = getOrderRef(detailOrder);

                      if (!phone || phone.replace(/\D/g, "").length < 8) {
                        toast.error("WhatsApp number is missing or invalid.");
                        return;
                      }

                      const msg = buildOrderWhatsAppMessage({
                        name,
                        orderShortId: orderRef,
                        status: detailOrder.status,
                        total: detailOrder.total,
                        etaMinutes: detailOrder.confirmedEtaMinutes,
                        remark: detailOrder.adminRemark,
                      });

                      window.open(toWhatsAppLink(phone, msg), "_blank");
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const orderRef = getOrderRef(detailOrder);
                      const name = getDisplayCustomerName(detailOrder);
                      const phone = detailOrder.deliveryAddress?.phone || "";

                      const itemsText = detailOrder.items
                        .map((it) => {
                          const addOns = it.selectedAddOns?.length
                            ? ` (+${it.selectedAddOns
                                .map((a) => a.name)
                                .join(", ")})`
                            : "";
                          return `- ${it.menuItem.name} x${it.quantity}${addOns}`;
                        })
                        .join("\n");

                      const text =
                        `Homely Foods — Order Summary\n` +
                        `Order: ${orderRef}\n` +
                        `Customer: ${name}\n` +
                        `Phone: ${phone || "—"}\n` +
                        `Status: ${detailOrder.status}\n` +
                        (detailOrder.confirmedEtaMinutes
                          ? `ETA: ${detailOrder.confirmedEtaMinutes} min\n`
                          : "") +
                        `\nItems:\n${itemsText}\n\n` +
                        `Subtotal: ${formatAED(detailOrder.subtotal ?? 0)}\n` +
                        `Delivery: ${formatAED(detailOrder.deliveryFee ?? 0)}\n` +
                        (detailOrder.discount
                          ? `Discount: -${formatAED(detailOrder.discount)}\n`
                          : "") +
                        (detailOrder.hpRedeemed
                          ? `HP Redeemed: -${detailOrder.hpRedeemed} HP\n`
                          : "") +
                        `Total: ${formatAED(detailOrder.total)}\n`;

                      navigator.clipboard.writeText(text);
                      toast.success("Order summary copied!");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      markOrderContacted(detailOrder.id, detailOrder.status);
                      toast.success("Marked as contacted");
                      refresh();
                      setDetailOrder({
                        ...detailOrder,
                        lastContactedAt: new Date().toISOString(),
                        lastContactedStatus: detailOrder.status,
                      });
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Contacted
                  </Button>
                </div>
              ) : null}
            </div>
          </DialogHeader>

          {detailOrder && (
            <div className="flex flex-col gap-4 py-2">
              {(() => {
                const computed = calcOrderPricing({
                  items: detailOrder.items,
                  discount: detailOrder.discount || 0,
                });

                const subtotal = detailOrder.subtotal ?? computed.subtotal;
                const deliveryFee =
                  detailOrder.deliveryFee ?? computed.deliveryFee;
                const discount = detailOrder.discount ?? computed.discount;
                const total = detailOrder.total ?? computed.total;
                const detailEta = getOrderEtaInfo(detailOrder, now);

                return (
                  <>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Customer</p>
                        <p className="font-medium text-foreground">
                          {getDisplayCustomerName(detailOrder)}
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
                        <p className="text-muted-foreground">Last Contacted</p>
                        {detailOrder.lastContactedAt ? (
                          <p className="font-medium text-foreground">
                            {new Date(
                              detailOrder.lastContactedAt
                            ).toLocaleString("en-AE", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                            {detailOrder.lastContactedStatus ? (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (for: {detailOrder.lastContactedStatus})
                              </span>
                            ) : null}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Not contacted yet
                          </p>
                        )}
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
                        <p className="text-muted-foreground">Order ID</p>
                        <p className="font-medium text-foreground">
                          {getOrderRef(detailOrder)}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">HP Earned</p>
                        <p className="font-medium text-gold-dark">
                          +{detailOrder.hpEarned} HP
                        </p>
                      </div>

                      {(detailOrder.hpRedeemed ?? 0) > 0 ? (
                        <div>
                          <p className="text-muted-foreground">HP Redeemed</p>
                          <p className="font-medium text-blue-offer">
                            -{detailOrder.hpRedeemed} HP
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-2">
                          <Badge
                            variant="outline"
                            className="w-fit border-border bg-background text-xs text-muted-foreground"
                            title={detailOrder.createdAt}
                          >
                            {new Date(detailOrder.createdAt).toLocaleDateString(
                              "en-AE",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </Badge>

                          {detailEta ? (
                            <div
                              className={`inline-flex w-fit items-center rounded-full border px-2 py-1 text-[11px] font-medium ${
                                detailEta.type === "delay"
                                  ? "border-red-200 bg-red-500/10 text-red-600"
                                  : "border-green/20 bg-green/10 text-green"
                              }`}
                            >
                              ⏱ {detailEta.text}
                            </div>
                          ) : null}

                          {detailOrder.status === "Confirmed" &&
                          detailOrder.confirmedAt ? (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">
                                Confirmed:
                              </span>{" "}
                              {new Date(detailOrder.confirmedAt).toLocaleString(
                                "en-AE",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                }
                              )}
                              {typeof detailOrder.confirmedEtaMinutes ===
                              "number" ? (
                                <>
                                  {" "}
                                  •{" "}
                                  <span className="font-medium text-foreground">
                                    ETA:
                                  </span>{" "}
                                  {detailOrder.confirmedEtaMinutes} min
                                </>
                              ) : null}
                            </div>
                          ) : null}

                          {detailOrder.adminRemark?.trim() ? (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">
                                Remark:
                              </span>{" "}
                              {detailOrder.adminRemark.trim()}
                            </div>
                          ) : null}
                        </div>

                        {detailOrder.status === "Pending" ? (
                          <Button
                            size="sm"
                            className="bg-gold text-primary-foreground hover:bg-gold-dark"
                            onClick={() => {
                              setPendingOrder(detailOrder);
                              setPendingStatus("Confirmed");
                              setConfirmEta(
                                detailOrder.confirmedEtaMinutes ?? 30
                              );
                              setConfirmRemark(detailOrder.adminRemark ?? "");
                              setConfirmMetaOpen(true);
                            }}
                          >
                            Confirm now
                          </Button>
                        ) : detailOrder.status === "Confirmed" ? (
                          <Button size="sm" variant="outline" disabled>
                            Confirmed
                          </Button>
                        ) : null}
                      </div>

                      <div className="rounded-lg border border-border bg-background p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            WhatsApp / Phone
                          </p>

                          {(() => {
                            const current =
                              detailOrder.deliveryAddress.phone?.trim() ?? "";
                            const original = phoneOriginal.trim();
                            const isDirty = current !== original;

                            return (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  isDirty
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-green/10 text-green"
                                }`}
                                title={
                                  !isDirty && phoneSavedAt
                                    ? `Saved at ${new Date(
                                        phoneSavedAt
                                      ).toLocaleString("en-AE")}`
                                    : undefined
                                }
                              >
                                {isDirty ? "Not saved" : "Saved"}
                              </span>
                            );
                          })()}
                        </div>

                        <Input
                          value={detailOrder.deliveryAddress.phone}
                          onChange={(e) =>
                            setDetailOrder({
                              ...detailOrder,
                              deliveryAddress: {
                                ...detailOrder.deliveryAddress,
                                phone: e.target.value,
                              },
                            })
                          }
                          onBlur={() => {
                            const formatted = formatUaePhone(
                              detailOrder.deliveryAddress.phone || ""
                            );
                            setDetailOrder({
                              ...detailOrder,
                              deliveryAddress: {
                                ...detailOrder.deliveryAddress,
                                phone: formatted,
                              },
                            });
                          }}
                          className="mt-2"
                        />

                        <div className="mt-2 flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const formatted = formatUaePhone(
                                detailOrder.deliveryAddress.phone || ""
                              );
                              setDetailOrder({
                                ...detailOrder,
                                deliveryAddress: {
                                  ...detailOrder.deliveryAddress,
                                  phone: formatted,
                                },
                              });
                              toast.success("Phone formatted");
                            }}
                          >
                            Format
                          </Button>

                          <Button
                            size="sm"
                            disabled={(() => {
                              const current = (
                                detailOrder.deliveryAddress.phone || ""
                              ).trim();
                              const original = phoneOriginal.trim();
                              const isDirty = current !== original;
                              const digits = current.replace(/\D/g, "");
                              const isValid = digits.length >= 8;

                              return !isDirty || !isValid;
                            })()}
                            onClick={() => {
                              const formatted = formatUaePhone(
                                detailOrder.deliveryAddress.phone || ""
                              ).trim();
                              setPendingPhoneValue(formatted);
                              setConfirmPhoneOpen(true);
                            }}
                          >
                            Update Phone
                          </Button>
                        </div>
                      </div>

                      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Address Details
                      </p>

                      <div className="mt-3 grid gap-2 rounded-lg border border-border bg-background p-3">
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="col-span-1 text-muted-foreground">
                            Name
                          </div>
                          <div className="col-span-2 font-medium text-foreground">
                            {detailOrder.deliveryAddress.fullName}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="col-span-1 text-muted-foreground">
                            Street
                          </div>
                          <div className="col-span-2 font-medium text-foreground">
                            {detailOrder.deliveryAddress.street || "—"}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="col-span-1 text-muted-foreground">
                            Apartment
                          </div>
                          <div className="col-span-2 font-medium text-foreground">
                            {detailOrder.deliveryAddress.apartment || "—"}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="col-span-1 text-muted-foreground">
                            Floor
                          </div>
                          <div className="col-span-2 font-medium text-foreground">
                            {detailOrder.deliveryAddress.floor || "—"}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="col-span-1 text-muted-foreground">
                            Room Number
                          </div>
                          <div className="col-span-2 font-medium text-foreground">
                            {detailOrder.deliveryAddress.room || "—"}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="col-span-1 text-muted-foreground">
                            Area
                          </div>
                          <div className="col-span-2 font-medium text-foreground">
                            {detailOrder.deliveryAddress.area || "—"}
                          </div>
                        </div>

                        {detailOrder.deliveryAddress.notes?.trim() ? (
                          <div className="mt-1 rounded-md bg-muted/40 p-3">
                            <div className="text-xs font-medium text-muted-foreground">
                              Delivery Notes
                            </div>
                            <div className="mt-1 text-sm text-foreground">
                              {detailOrder.deliveryAddress.notes}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1 rounded-md bg-muted/30 p-3 text-sm text-muted-foreground">
                            No delivery notes
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Items
                      </p>

                      <div className="flex flex-col gap-2">
                        {detailOrder.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2 text-sm"
                          >
                            <div>
                              <p className="font-medium text-foreground">
                                {item.menuItem.name} x{item.quantity}
                              </p>

                              {item.selectedAddOns.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  +{" "}
                                  {item.selectedAddOns
                                    .map((a) => a.name)
                                    .join(", ")}
                                </p>
                              )}

                              {item.note?.trim() ? (
                                <div className="mt-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                                    Special Instructions
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-amber-900">
                                    {item.note.trim()}
                                  </p>
                                </div>
                              ) : null}

                              {item.redemption ? (
                                <div className="mt-1 rounded-md border border-blue-offer/20 bg-blue-offer/10 px-2.5 py-1.5">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-offer">
                                    Redeemed with HP
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-blue-offer">
                                    {item.redemption.hpCostPerUnit * item.quantity} HP
                                  </p>
                                </div>
                              ) : null}
                            </div>

                            <p className="font-medium text-foreground">
                              {formatAED(calcCartItemLineTotal(item))}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <PriceBreakdown
                      subtotal={subtotal}
                      deliveryFee={deliveryFee}
                      discount={discount}
                      total={total}
                    />
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmPhoneOpen} onOpenChange={setConfirmPhoneOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm phone update</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the customer phone number for this order.
              <div className="mt-2 rounded-md bg-muted p-2 text-sm">
                <div className="text-muted-foreground">New phone:</div>
                <div className="font-medium">{pendingPhoneValue}</div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!detailOrder) return;

                const digits = pendingPhoneValue.replace(/\D/g, "");
                if (digits.length < 8) {
                  toast.error("Please enter a valid phone number.");
                  return;
                }

                updateOrderPhone(detailOrder.id, pendingPhoneValue);

                setDetailOrder({
                  ...detailOrder,
                  deliveryAddress: {
                    ...detailOrder.deliveryAddress,
                    phone: pendingPhoneValue,
                  },
                });

                setPhoneOriginal(pendingPhoneValue);
                setPhoneSavedAt(new Date().toISOString());

                toast.success("Phone updated successfully");
                refresh();
              }}
            >
              Yes, update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={confirmMetaOpen} onOpenChange={setConfirmMetaOpen}>
        <DialogContent className="bg-card text-card-foreground sm:max-w-md">
          <DialogHeader>
<DialogTitle className="font-serif text-foreground">
                  Confirm order (ETA & note)
                </DialogTitle>
                <DialogDescription>
                  Set the estimated delivery time and add an optional note for the customer.
                </DialogDescription>
              </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label className="text-sm text-card-foreground">
                Estimated time (minutes)
              </Label>
              <div className="flex flex-wrap gap-2">
                {[20, 30, 45, 60].map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant={confirmEta === m ? "default" : "outline"}
                    className={
                      confirmEta === m
                        ? "bg-gold text-primary-foreground hover:bg-gold-dark"
                        : ""
                    }
                    onClick={() => setConfirmEta(m)}
                  >
                    {m}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                This will be included in the WhatsApp confirmation message.
              </p>
            </div>

            <div className="grid gap-2">
              <Label className="text-sm text-card-foreground">
                Remark (optional)
              </Label>
              <Textarea
                value={confirmRemark}
                onChange={(e) => setConfirmRemark(e.target.value)}
                placeholder="e.g., Busy time, delivery might take slightly longer."
                className="min-h-[90px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmMetaOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
              onClick={() => {
                if (!pendingOrder || pendingStatus !== "Confirmed") {
                  setConfirmMetaOpen(false);
                  return;
                }

                const phone = pendingOrder.deliveryAddress?.phone || "";
                const name = getDisplayCustomerName(pendingOrder);
                const orderRef = getOrderRef(pendingOrder);

                setWaPhone(phone);
                setWaName(name);
                setWaStatus("Confirmed");
                setWaOrderShortId(orderRef);

                setWaMessage(
                  buildOrderWhatsAppMessage({
                    name,
                    orderShortId: orderRef,
                    status: "Confirmed",
                    total: pendingOrder.total,
                    etaMinutes: confirmEta,
                    remark: confirmRemark,
                  })
                );

                setConfirmMetaOpen(false);
                setWaOpen(true);
              }}
            >
              Continue to WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={waOpen}
        onOpenChange={(open) => {
          setWaOpen(open);
          if (!open) {
            setPendingOrder(null);
            setPendingStatus(null);
          }
        }}
      >
        <DialogContent className="bg-card text-card-foreground sm:max-w-lg">
          <DialogHeader>
<DialogTitle className="font-serif text-foreground">
                  Send WhatsApp Update
                </DialogTitle>
                <DialogDescription>
                  Send a status update to the customer via WhatsApp.
                </DialogDescription>
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
                <strong>Order:</strong> {waOrderShortId}
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

              <Button
                variant="outline"
                onClick={() => {
                  if (!pendingOrder || !pendingStatus) {
                    toast.error("No pending status update found.");
                    return;
                  }

                  applyOrderStatusUpdate({
                    orderId: pendingOrder.id,
                    currentStatus: pendingOrder.status,
                    nextStatus: pendingStatus,
                    confirmMeta: {
                      etaMinutes: confirmEta,
                      remark: confirmRemark,
                    },
                    markContacted: false,
                  });

                  toast.success(
                    `Status updated to "${pendingStatus}" (not sent to customer)`
                  );
                  refresh();

                  setWaOpen(false);
                  setPendingOrder(null);
                  setPendingStatus(null);
                }}
              >
                Update Status Only
              </Button>

              <Button
                className="bg-gold text-primary-foreground hover:bg-gold-dark"
                onClick={() => {
                  if (!pendingOrder || !pendingStatus) {
                    toast.error("No pending status update found.");
                    return;
                  }

                  applyOrderStatusUpdate({
                    orderId: pendingOrder.id,
                    currentStatus: pendingOrder.status,
                    nextStatus: pendingStatus,
                    confirmMeta: {
                      etaMinutes: confirmEta,
                      remark: confirmRemark,
                    },
                    markContacted: true,
                  });

                  toast.success(
                    `Updated to "${pendingStatus}" and marked as contacted`
                  );
                  refresh();

                  setWaOpen(false);
                  setPendingOrder(null);
                  setPendingStatus(null);
                }}
              >
                Mark Sent & Update Status
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

      <Dialog open={overdueOpen} onOpenChange={setOverdueOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
<DialogTitle className="font-serif">Overdue Orders</DialogTitle>
                <DialogDescription>
                  Orders that have exceeded their estimated delivery time.
                </DialogDescription>
              </DialogHeader>

          {overdueOrders.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No overdue orders 🎉
            </div>
          ) : (
            <div className="grid gap-3">
              {overdueOrders.map((o) => {
                const delay = getOrderDelayMinutes(o, now);

                return (
                  <div
                    key={o.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">
                          {getOrderRef(o)} • {getDisplayCustomerName(o)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {o.deliveryAddress?.phone || "No phone"}
                        </div>
                      </div>

                      <div className="inline-flex rounded-full border border-red-200 bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-600">
                        Delay {delay} min
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Total:</span>{" "}
                        <span className="font-semibold">
                          {formatAED(o.total)}
                        </span>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            {o.status} <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {ORDER_STATUSES.map((s) => (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => handleStatusChange(o, s)}
                            >
                              {s}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailOrder(o)}
                      >
                        View full
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
