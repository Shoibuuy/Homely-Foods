"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  calcOrderPricing,
  calcCartItemLineTotal,
  calcRedeemedHPTotal,
} from "@/lib/orders/pricing";
import { formatAED } from "@/lib/utils";
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  ShoppingBag,
  Minus,
  Plus,
  Eye,
  MapPin,
  Phone,
  User,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth, useCart } from "@/lib/data/store";
import { HPCoin } from "@/components/hp-coin";
import { toast } from "sonner";
import type { Order, PaymentMethod, DeliveryAddress } from "@/lib/data/types";
import { addOrder, nextOrderNo, generateId, settleOrderHP } from "@/lib/data/storage";
import { PriceBreakdown } from "@/components/orders/price-breakdown";
import { OrderItemEditorDialog } from "@/components/orders/order-item-editor-dialog";


type CheckoutStep = "details" | "confirm";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const {
    items,
    estimatedHP,
    clearCart,
    updateQuantity,
    updateItemDetails,
  } = useCart();
  
  const [step, setStep] = useState<CheckoutStep>("details");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [address, setAddress] = useState<DeliveryAddress>({
    fullName: user?.name || "",
    phone: user?.phone || "",
    street: "",
    apartment: "",
    floor: "",
    room: "",
    area: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showStep1Items, setShowStep1Items] = useState(true);
  const [showStep2Items, setShowStep2Items] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  

  const pricing = useMemo(() => calcOrderPricing({ items }), [items]);
  const hpRedeemedTotal = useMemo(() => calcRedeemedHPTotal(items), [items]);
  const userBalance = user?.hpBalance ?? 0;
  const hasInsufficientHP = !!user && hpRedeemedTotal > userBalance;
  const editingItem = useMemo(
    () => items.find((item) => item.id === editingItemId) ?? null,
    [items, editingItemId],
  );
  

  const updateAddress = <K extends keyof DeliveryAddress>(
    field: K,
    value: DeliveryAddress[K],
  ) => {
    setAddress((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => {
      if (!prev[field as string]) return prev;
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  };

  const normalizedAddress = useMemo<DeliveryAddress>(
    () => ({
      fullName: address.fullName.trim(),
      phone: address.phone.trim(),
      street: address.street.trim(),
      apartment: address.apartment?.trim() ?? "",
      floor: address.floor?.trim() ?? "",
      room: address.room?.trim() ?? "",
      area: address.area.trim(),
      notes: address.notes?.trim() ?? "",
    }),
    [address],
  );

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!normalizedAddress.fullName) errs.fullName = "Name is required";
    if (!normalizedAddress.phone) errs.phone = "Phone is required";
    if (!normalizedAddress.street) errs.street = "Street address is required";
    if (!normalizedAddress.area) errs.area = "Area is required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleReviewOrder = () => {
    if (!validate()) return;
    if (hasInsufficientHP) {
      toast.error("Insufficient HomelyPoints for redeemed items in cart.");
      return;
    }
    setStep("confirm");
  };

  const handlePlaceOrder = () => {
    if (!user || loading) return;
    if (!validate()) {
      setStep("details");
      return;
    }

    setLoading(true);

    try {
      const finalPricing = calcOrderPricing({ items });

      const order: Order = {
        id: generateId("order"),
        orderNo: nextOrderNo(),
        userId: user.id,
        items: [...items],
        subtotal: finalPricing.subtotal,
        deliveryFee: finalPricing.deliveryFee,
        discount: finalPricing.discount,
        total: finalPricing.total,
        status: "Pending",
        paymentMethod,
        deliveryAddress: { ...normalizedAddress },
        hpEarned: estimatedHP,
        hpRedeemed: hpRedeemedTotal,
        createdAt: new Date().toISOString(),
      };

      if (hpRedeemedTotal > user.hpBalance) {
        toast.error("Insufficient HomelyPoints for redemption.");
        setLoading(false);
        return;
      }

      addOrder(order);
      const settlement = settleOrderHP({
        userId: user.id,
        orderId: order.id,
        orderNo: order.orderNo,
        hpEarned: estimatedHP,
        hpRedeemed: hpRedeemedTotal,
      });

      if (!settlement.success) {
        toast.error(settlement.error || "Failed to settle HomelyPoints.");
        setLoading(false);
        return;
      }

      refreshUser();
      clearCart();

      toast.success("Order received successfully", {
        description:
          hpRedeemedTotal > 0
            ? `Redeemed ${hpRedeemedTotal} HP and earned ${estimatedHP} HP.`
            : `You earned ${estimatedHP} HomelyPoints.`,
      });

      router.replace(`/orders/success/${order.id}`);
    } catch {
      toast.error("Failed to place order. Please try again.");
      setLoading(false);
      return;
    }
  };

  const hasAddressMeta =
    !!normalizedAddress.apartment ||
    !!normalizedAddress.floor ||
    !!normalizedAddress.room;

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-1 font-serif text-2xl font-bold text-foreground">
          Sign in to checkout
        </h2>
        <p className="mb-6 text-muted-foreground">
          You need an account to place an order.
        </p>
        <Link href="/login">
          <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-1 font-serif text-2xl font-bold text-foreground">
          Your cart is empty
        </h2>
        <p className="mb-6 text-muted-foreground">
          Add some items before checking out.
        </p>
        <Link href="/menu">
          <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
            Browse Menu
          </Button>
        </Link>
      </div>
    );
  }

  const renderCheckoutItems = (editable: boolean) => (
    <div className="space-y-3">
      {items.map((ci) => {
        const imageSrc = ci.menuItem.images?.[0];
        const groupedAddOns = ci.selectedAddOns.reduce<
          Array<{ name: string; quantity: number }>
        >((acc, addOn) => {
          const found = acc.find((x) => x.name === addOn.name);
          if (found) {
            found.quantity += 1;
          } else {
            acc.push({ name: addOn.name, quantity: 1 });
          }
          return acc;
        }, []);

        return (
          <div
            key={ci.id}
            className="rounded-2xl border border-border/70 bg-background p-3 sm:p-4"
          >
            <div className="flex items-start gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={ci.menuItem.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/menu/${ci.menuItem.id}`}
                      className="line-clamp-2 text-sm font-semibold text-card-foreground hover:text-gold-dark"
                    >
                      {ci.menuItem.name}
                    </Link>

                    {groupedAddOns.length > 0 ? (
                      <div className="mt-1 space-y-0.5">
                        {groupedAddOns.map((a) => (
                          <p
                            key={`${a.name}-${a.quantity}`}
                            className="text-[10px] text-muted-foreground"
                          >
                            + {a.name} × {a.quantity}
                          </p>
                        ))}
                      </div>
                    ) : null}

                    {ci.note?.trim() ? (
                      <p className="mt-1 text-[10px] text-amber-800">
                        Note: {ci.note.trim()}
                      </p>
                    ) : null}

                    {ci.redemption ? (
                      <p className="mt-1 text-[10px] font-semibold text-blue-offer">
                        Redeemed with HP: {ci.redemption.hpCostPerUnit * ci.quantity} HP
                      </p>
                    ) : null}
                  </div>

                  <span className="shrink-0 text-sm font-semibold text-card-foreground">
                    {formatAED(calcCartItemLineTotal(ci))}
                  </span>
                </div>

                {editable ? (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1 rounded-xl border border-border">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => updateQuantity(ci.id, ci.quantity - 1)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>

                      <span className="min-w-[28px] text-center text-sm font-medium text-foreground">
                        {ci.quantity}
                      </span>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => updateQuantity(ci.id, ci.quantity + 1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <Button
  variant="outline"
  size="sm"
  className="h-9 rounded-full px-4 text-xs font-semibold"
  onClick={() => setEditingItemId(ci.id)}
>
  <Eye className="mr-1.5 h-4 w-4" />
  View & Edit
</Button>

                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      Qty: {ci.quantity}
                    </span>
                    <Link href={`/menu/${ci.menuItem.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto px-0 text-gold"
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        View & Edit
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <h1 className="font-serif text-3xl font-bold text-foreground">
            Checkout
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === "details"
              ? "Complete your delivery details and review your cart."
              : "Review everything before placing your order."}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {step === "details" ? (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                      <MapPin className="h-5 w-5 text-gold-dark" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl font-semibold text-card-foreground">
                        Delivery Details
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Enter the address for this order
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          value={address.fullName}
                          onChange={(e) => updateAddress("fullName", e.target.value)}
                          placeholder="Your full name"
                          className="pl-9"
                        />
                      </div>
                      {errors.fullName ? (
                        <p className="text-xs text-destructive">{errors.fullName}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          value={address.phone}
                          onChange={(e) => updateAddress("phone", e.target.value)}
                          placeholder="+971 50 123 4567"
                          className="pl-9"
                        />
                      </div>
                      {errors.phone ? (
                        <p className="text-xs text-destructive">{errors.phone}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="street">Street Address</Label>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="street"
                          value={address.street}
                          onChange={(e) => updateAddress("street", e.target.value)}
                          placeholder="Building name, street, unit"
                          className="pl-9"
                        />
                      </div>
                      {errors.street ? (
                        <p className="text-xs text-destructive">{errors.street}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apartment">Apartment / Villa (optional)</Label>
                      <Input
                        id="apartment"
                        value={address.apartment ?? ""}
                        onChange={(e) => updateAddress("apartment", e.target.value)}
                        placeholder="Apt 402 / Villa 12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="floor">Floor (optional)</Label>
                      <Input
                        id="floor"
                        value={address.floor ?? ""}
                        onChange={(e) => updateAddress("floor", e.target.value)}
                        placeholder="4th floor"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="room">Room / Office (optional)</Label>
                      <Input
                        id="room"
                        value={address.room ?? ""}
                        onChange={(e) => updateAddress("room", e.target.value)}
                        placeholder="Room 12 / Office 3"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="area">Area / District</Label>
                      <Input
                        id="area"
                        value={address.area}
                        onChange={(e) => updateAddress("area", e.target.value)}
                        placeholder="Dubai Marina, JBR..."
                      />
                      {errors.area ? (
                        <p className="text-xs text-destructive">{errors.area}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="notes">Delivery Notes (optional)</Label>
                      <div className="relative">
                        <FileText className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Textarea
                          id="notes"
                          value={address.notes ?? ""}
                          onChange={(e) => updateAddress("notes", e.target.value)}
                          className="min-h-[88px] resize-none pl-9"
                          placeholder="Gate code, landmarks, delivery instructions..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-5 sm:p-6">
                  <h2 className="mb-4 font-serif text-xl font-semibold text-card-foreground">
                    Payment Method
                  </h2>

                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                    className="space-y-3"
                  >
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/50 has-[button[data-state=checked]]:border-gold has-[button[data-state=checked]]:bg-gold/5">
                      <RadioGroupItem value="cash" />
                      <Banknote className="h-5 w-5 text-green" />
                      <div>
                        <p className="text-sm font-medium text-card-foreground">
                          Cash on Delivery
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Pay when your order arrives
                        </p>
                      </div>
                    </label>

                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/50 has-[button[data-state=checked]]:border-gold has-[button[data-state=checked]]:bg-gold/5">
                      <RadioGroupItem value="card" />
                      <CreditCard className="h-5 w-5 text-blue-offer" />
                      <div>
                        <p className="text-sm font-medium text-card-foreground">
                          Card on Delivery
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Pay with card when your order arrives
                        </p>
                      </div>
                    </label>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="sticky top-24 border-border bg-card shadow-sm">
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="font-serif text-xl font-bold text-card-foreground">
                      Order Summary
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto px-0 text-gold"
                      onClick={() => setShowStep1Items((prev) => !prev)}
                    >
                      {showStep1Items ? "Hide Items" : "View Items"}
                    </Button>
                  </div>

                  {showStep1Items ? (
                    <div className="mb-4">{renderCheckoutItems(true)}</div>
                  ) : null}

                  <Separator className="my-4" />

                  <PriceBreakdown
                    subtotal={pricing.subtotal}
                    deliveryFee={pricing.deliveryFee}
                    discount={pricing.discount}
                    total={pricing.total}
                  />

                  {hpRedeemedTotal > 0 ? (
                    <div className="mt-3 rounded-xl border border-blue-offer/20 bg-blue-offer/10 p-3">
                      <p className="text-sm font-medium text-foreground">
                        Redeeming {hpRedeemedTotal} HP on this order
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 p-3">
                    <div className="flex items-center gap-2">
                      <HPCoin size="sm" />
                      <p className="text-sm font-medium text-foreground">
                        You will earn {estimatedHP} HP
                      </p>
                    </div>
                  </div>

                  {hasInsufficientHP ? (
                    <p className="mt-2 text-xs text-destructive">
                      You need {hpRedeemedTotal - userBalance} more HP to place this order.
                    </p>
                  ) : null}

                  <Button
                    className="mt-4 w-full bg-gold text-primary-foreground hover:bg-gold-dark"
                    onClick={handleReviewOrder}
                    disabled={hasInsufficientHP}
                  >
                    Review Order
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl">
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-card-foreground">
                      Review Your Order
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Please check your delivery details, items, and payment method.
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="border-border text-foreground"
                    onClick={() => setStep("details")}
                    disabled={loading}
                  >
                    Edit Details
                  </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="border-border bg-background shadow-none">
                    <CardContent className="p-4">
                      <h3 className="mb-3 font-serif text-lg font-semibold text-foreground">
                        Delivery Details
                      </h3>

                      <div className="rounded-2xl border border-border/70 bg-card p-4">
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-start gap-2">
                            <User className="mt-0.5 h-4 w-4 text-gold-dark" />
                            <span>{normalizedAddress.fullName}</span>
                          </div>

                          <div className="flex items-start gap-2">
                            <Phone className="mt-0.5 h-4 w-4 text-gold-dark" />
                            <span>{normalizedAddress.phone}</span>
                          </div>

                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 text-gold-dark" />
                            <div>
                              <p>{normalizedAddress.street}</p>
                              <p>{normalizedAddress.area}</p>
                              {hasAddressMeta ? (
                                <p>
                                  {[
                                    normalizedAddress.apartment,
                                    normalizedAddress.floor,
                                    normalizedAddress.room,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          {normalizedAddress.notes ? (
                            <div className="flex items-start gap-2 pt-1">
                              <FileText className="mt-0.5 h-4 w-4 text-gold-dark" />
                              <span>{normalizedAddress.notes}</span>
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                          {paymentMethod === "cash" ? (
                            <Banknote className="h-4 w-4" />
                          ) : (
                            <CreditCard className="h-4 w-4" />
                          )}
                          <span>
                            {paymentMethod === "cash"
                              ? "Cash on Delivery"
                              : "Card on Delivery"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-background shadow-none">
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-serif text-lg font-semibold text-foreground">
                          Order Items
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto px-0 text-gold"
                          onClick={() => setShowStep2Items((prev) => !prev)}
                        >
                          {showStep2Items ? "Hide" : "View"}
                        </Button>
                      </div>

                      {showStep2Items ? <div>{renderCheckoutItems(false)}</div> : null}
                    </CardContent>
                  </Card>
                </div>

                <Separator className="my-4"/>

                <div className="mt-6">
                  <Card className="border-border bg-background shadow-none">
                    <CardContent className="p-4">
                      <h3 className="mb-4 font-serif text-lg font-semibold text-card-foreground">
                        Order Summary
                      </h3>

                      <PriceBreakdown
                        subtotal={pricing.subtotal}
                        deliveryFee={pricing.deliveryFee}
                        discount={pricing.discount}
                        total={pricing.total}
                      />

                      {hpRedeemedTotal > 0 ? (
                        <div className="mt-3 rounded-xl border border-blue-offer/20 bg-blue-offer/10 p-3">
                          <p className="text-sm font-medium text-foreground">
                            Redeeming {hpRedeemedTotal} HP on this order
                          </p>
                        </div>
                      ) : null}

                      <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 p-3">
                        <div className="flex items-center gap-2">
                          <HPCoin size="sm" />
                          <p className="text-sm font-medium text-foreground">
                            You will earn {estimatedHP} HP
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="outline"
                    className="flex-1 text-foreground"
                    onClick={() => setStep("details")}
                    disabled={loading}
                  >
                    Back
                  </Button>

                  <Button
                    className="flex-1 bg-gold text-primary-foreground hover:bg-gold-dark"
                    onClick={handlePlaceOrder}
                    disabled={loading || hasInsufficientHP}
                  >
                    {loading
                      ? "Placing Order..."
                      : `Place Order - ${formatAED(pricing.total)}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
              <OrderItemEditorDialog
          open={!!editingItem}
          onOpenChange={(open) => {
            if (!open) setEditingItemId(null);
          }}
          item={editingItem}
          mode="edit"
          onSave={(payload) => {
            if (!editingItem) return;

            updateItemDetails(editingItem.id, {
              quantity: payload.quantity,
              selectedAddOns: payload.selectedAddOns,
              note: payload.note,
            });
          }}
        />
      </div>
    </div>
  );
}
