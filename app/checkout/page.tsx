"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  CheckCircle2,
  ShoppingBag,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth, useCart } from "@/lib/data/store";
import { HPBadge, HPCoin } from "@/components/hp-coin";
import { addOrder, generateId } from "@/lib/data/storage";
import { toast } from "sonner";
import type { Order, PaymentMethod, DeliveryAddress } from "@/lib/data/types";

type CheckoutStep = "details" | "confirm" | "success";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, addHP } = useAuth();
  const { items, subtotal, estimatedHP, clearCart } = useCart();

  const [step, setStep] = useState<CheckoutStep>("details");
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [address, setAddress] = useState<DeliveryAddress>({
    fullName: user?.name || "",
    phone: user?.phone || "",
    address: "",
    area: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const deliveryFee = subtotal >= 100 ? 0 : 10;
  const total = subtotal + deliveryFee;

  // Redirect to login if not authenticated
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

  // Redirect to menu if cart is empty
  if (items.length === 0 && step !== "success") {
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

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!address.fullName.trim()) errs.fullName = "Name is required";
    if (!address.phone.trim()) errs.phone = "Phone is required";
    if (!address.address.trim()) errs.address = "Address is required";
    if (!address.area.trim()) errs.area = "Area is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = () => {
    setLoading(true);
    setTimeout(() => {
      const order: Order = {
        id: generateId("order"),
        userId: user.id,
        items: [...items],
        total,
        subtotal,
        status: "Order Placed",
        paymentMethod,
        deliveryAddress: address,
        hpEarned: estimatedHP,
        createdAt: new Date().toISOString(),
      };

      addOrder(order);
      addHP(estimatedHP, `Earned from order #${order.id.slice(-6)}`);
      clearCart();
      setPlacedOrder(order);
      setStep("success");
      toast.success("Order placed successfully!", {
        description: `You earned ${estimatedHP} HomelyPoints!`,
      });
      setLoading(false);
    }, 1000);
  };

  // Success view
  if (step === "success" && placedOrder) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-2xl px-4 py-16 lg:px-8">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green/10">
              <CheckCircle2 className="h-10 w-10 text-green" />
            </div>
            <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">
              Order Confirmed!
            </h1>
            <p className="mb-2 text-muted-foreground">
              Thank you for your order. We are preparing your food.
            </p>
            <p className="mb-8 text-sm text-muted-foreground">
              Order ID:{" "}
              <span className="font-mono font-semibold text-foreground">
                #{placedOrder.id.slice(-8).toUpperCase()}
              </span>
            </p>

            {/* HP Earned */}
            <Card className="mx-auto mb-8 max-w-sm border-gold/20 bg-gold/5">
              <CardContent className="flex items-center justify-center gap-3 p-4">
                <HPCoin size="lg" animated />
                <div className="text-left">
                  <p className="font-serif text-xl font-bold text-foreground">
                    +{placedOrder.hpEarned} HP
                  </p>
                  <p className="text-xs text-muted-foreground">
                    HomelyPoints earned
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary Card */}
            <Card className="mb-8 border-border bg-card text-left shadow-sm">
              <CardContent className="p-6">
                <h3 className="mb-4 font-serif text-lg font-semibold text-card-foreground">
                  Order Details
                </h3>
                <div className="space-y-3">
                  {placedOrder.items.map((ci) => (
                    <div
                      key={ci.menuItem.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {ci.menuItem.name} x{ci.quantity}
                      </span>
                      <span className="text-card-foreground">
                        AED{" "}
                        {(
                          (ci.menuItem.price +
                            ci.selectedAddOns.reduce((s, a) => s + a.price, 0)) *
                          ci.quantity
                        ).toFixed(0)}
                      </span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-card-foreground">
                      Total
                    </span>
                    <span className="font-serif text-lg font-bold text-card-foreground">
                      AED {placedOrder.total}
                    </span>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gold" />
                    <span className="text-muted-foreground">
                      Status:{" "}
                      <span className="font-medium text-foreground">
                        {placedOrder.status}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {placedOrder.paymentMethod === "cash" ? (
                      <Banknote className="h-4 w-4 text-gold" />
                    ) : (
                      <CreditCard className="h-4 w-4 text-gold" />
                    )}
                    <span className="text-muted-foreground">
                      Payment:{" "}
                      <span className="font-medium text-foreground">
                        {placedOrder.paymentMethod === "cash"
                          ? "Cash on Delivery"
                          : "Card on Delivery"}
                      </span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/profile">
                <Button
                  variant="outline"
                  className="border-border text-foreground"
                >
                  View Profile
                </Button>
              </Link>
              <Link href="/menu">
                <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
                  Order More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
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
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            {step === "details" && (
              <div className="space-y-6">
                {/* Delivery Details */}
                <Card className="border-border bg-card shadow-sm">
                  <CardContent className="p-6">
                    <h2 className="mb-4 font-serif text-xl font-semibold text-card-foreground">
                      Delivery Details
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-card-foreground">
                          Full Name
                        </Label>
                        <Input
                          id="fullName"
                          value={address.fullName}
                          onChange={(e) =>
                            setAddress({ ...address, fullName: e.target.value })
                          }
                          className="bg-background"
                          placeholder="Your full name"
                        />
                        {errors.fullName && (
                          <p className="text-xs text-destructive">
                            {errors.fullName}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-card-foreground">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={address.phone}
                          onChange={(e) =>
                            setAddress({ ...address, phone: e.target.value })
                          }
                          className="bg-background"
                          placeholder="+971 50 123 4567"
                        />
                        {errors.phone && (
                          <p className="text-xs text-destructive">
                            {errors.phone}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="address" className="text-card-foreground">
                          Street Address
                        </Label>
                        <Input
                          id="address"
                          value={address.address}
                          onChange={(e) =>
                            setAddress({ ...address, address: e.target.value })
                          }
                          className="bg-background"
                          placeholder="Building name, street, unit"
                        />
                        {errors.address && (
                          <p className="text-xs text-destructive">
                            {errors.address}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area" className="text-card-foreground">
                          Area / District
                        </Label>
                        <Input
                          id="area"
                          value={address.area}
                          onChange={(e) =>
                            setAddress({ ...address, area: e.target.value })
                          }
                          className="bg-background"
                          placeholder="Dubai Marina, JBR..."
                        />
                        {errors.area && (
                          <p className="text-xs text-destructive">
                            {errors.area}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes" className="text-card-foreground">
                          Delivery Notes (optional)
                        </Label>
                        <Textarea
                          id="notes"
                          value={address.notes}
                          onChange={(e) =>
                            setAddress({ ...address, notes: e.target.value })
                          }
                          className="min-h-[40px] resize-none bg-background"
                          placeholder="Gate code, landmarks..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card className="border-border bg-card shadow-sm">
                  <CardContent className="p-6">
                    <h2 className="mb-4 font-serif text-xl font-semibold text-card-foreground">
                      Payment Method
                    </h2>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                      className="space-y-3"
                    >
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50 has-[button[data-state=checked]]:border-gold has-[button[data-state=checked]]:bg-gold/5">
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
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50 has-[button[data-state=checked]]:border-gold has-[button[data-state=checked]]:bg-gold/5">
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

                <Button
                  className="w-full bg-gold text-primary-foreground hover:bg-gold-dark lg:hidden"
                  size="lg"
                  onClick={() => {
                    if (validate()) setStep("confirm");
                  }}
                >
                  Review Order
                </Button>
              </div>
            )}

            {step === "confirm" && (
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-6">
                  <h2 className="mb-4 font-serif text-xl font-semibold text-card-foreground">
                    Review Your Order
                  </h2>

                  {/* Delivery Info */}
                  <div className="mb-6 rounded-lg bg-muted/50 p-4">
                    <h3 className="mb-2 text-sm font-semibold text-foreground">
                      Delivery To
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {address.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.address}, {address.area}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.phone}
                    </p>
                    {address.notes && (
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        Notes: {address.notes}
                      </p>
                    )}
                    <button
                      onClick={() => setStep("details")}
                      className="mt-2 text-xs font-medium text-gold hover:text-gold-dark"
                    >
                      Edit details
                    </button>
                  </div>

                  {/* Items */}
                  <div className="space-y-3">
                    {items.map((ci) => {
                      const aoTotal = ci.selectedAddOns.reduce(
                        (s, a) => s + a.price,
                        0
                      );
                      return (
                        <div
                          key={ci.menuItem.id}
                          className="flex items-center gap-3"
                        >
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                            <Image
                              src={ci.menuItem.images[0]}
                              alt={ci.menuItem.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-card-foreground">
                              {ci.menuItem.name}{" "}
                              <span className="text-muted-foreground">
                                x{ci.quantity}
                              </span>
                            </p>
                            {ci.selectedAddOns.length > 0 && (
                              <p className="text-[10px] text-muted-foreground">
                                + {ci.selectedAddOns.map((a) => a.name).join(", ")}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-card-foreground">
                            AED{" "}
                            {((ci.menuItem.price + aoTotal) * ci.quantity).toFixed(
                              0
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

                  <div className="mt-6 flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 text-foreground"
                      onClick={() => setStep("details")}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1 bg-gold text-primary-foreground hover:bg-gold-dark"
                      onClick={handlePlaceOrder}
                      disabled={loading}
                    >
                      {loading ? "Placing Order..." : `Place Order - AED ${total}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Summary */}
          {step !== "success" && (
            <div>
              <Card className="sticky top-24 border-border bg-card shadow-sm">
                <CardContent className="p-6">
                  <h2 className="mb-4 font-serif text-xl font-bold text-card-foreground">
                    Order Summary
                  </h2>

                  <div className="space-y-2 text-sm">
                    {items.map((ci) => {
                      const aoTotal = ci.selectedAddOns.reduce(
                        (s, a) => s + a.price,
                        0
                      );
                      return (
                        <div
                          key={ci.menuItem.id}
                          className="flex items-center justify-between"
                        >
                          <span className="text-muted-foreground">
                            {ci.menuItem.name} x{ci.quantity}
                          </span>
                          <span className="text-card-foreground">
                            AED{" "}
                            {((ci.menuItem.price + aoTotal) * ci.quantity).toFixed(
                              0
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-card-foreground">
                        AED {subtotal.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="font-medium text-green">
                        {deliveryFee === 0 ? "Free" : `AED ${deliveryFee}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">HP to earn</span>
                      <HPBadge amount={estimatedHP} />
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-semibold text-card-foreground">
                      Total
                    </span>
                    <span className="font-serif text-2xl font-bold text-card-foreground">
                      AED {total}
                    </span>
                  </div>

                  {step === "details" && (
                    <Button
                      className="hidden w-full bg-gold text-primary-foreground hover:bg-gold-dark lg:flex"
                      onClick={() => {
                        if (validate()) setStep("confirm");
                      }}
                    >
                      Review Order
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
