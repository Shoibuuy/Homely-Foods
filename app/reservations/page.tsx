"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  Users,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Utensils,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/lib/data/store";
import { addReservation, generateId, getUserReservations } from "@/lib/data/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Reservation, ReservationStatus } from "@/lib/data/types";
import { toast } from "sonner";

const statusConfig: Record<
  ReservationStatus,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  pending: {
    icon: AlertCircle,
    color: "text-amber-600",
    bg: "bg-amber-100",
    label: "Pending",
  },
  confirmed: {
    icon: CheckCircle2,
    color: "text-green",
    bg: "bg-green/10",
    label: "Confirmed",
  },
  cancelled: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    label: "Cancelled",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-blue-offer",
    bg: "bg-blue-offer/10",
    label: "Completed",
  },
  "not-visited": {
    icon: XCircle,
    color: "text-orange-600",
    bg: "bg-orange-100",
    label: "Not Visited",
  },
};

const timeSlots = [
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "18:00", "18:30", "19:00", "19:30", "20:00",
  "20:30", "21:00", "21:30", "22:00",
];

const guestOptions = Array.from({ length: 12 }, (_, i) => i + 1);

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-AE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

function ReservationCard({ reservation }: { reservation: Reservation }) {
  const config = statusConfig[reservation.status];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "border-border bg-card transition-all hover:shadow-sm",
        reservation.status === "confirmed" && "border-l-2 border-l-green"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", config.bg)}>
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {formatDate(reservation.date)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTime(reservation.time)}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-xs", config.color)}>
            {config.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{reservation.guests} guest{reservation.guests !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span className="truncate">{reservation.phone}</span>
          </div>
        </div>

        {reservation.notes && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{reservation.notes}</span>
          </div>
        )}

        {reservation.status === "not-visited" && reservation.notVisitedReason && (
          <div className="mt-3 rounded-lg bg-orange-50 p-2 text-xs text-orange-700">
            Reason: {reservation.notVisitedReason}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <Card className="border-green/30 bg-green/5">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green/10">
          <CheckCircle2 className="h-8 w-8 text-green" />
        </div>
        <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
          Reservation Submitted!
        </h3>
        <p className="mb-6 text-center text-sm text-muted-foreground max-w-sm">
          We have received your reservation request. Our team will confirm it shortly
          and notify you via WhatsApp.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={onReset}
            className="text-foreground"
          >
            Make Another Reservation
          </Button>
          <Link href="/menu">
            <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
              Browse Menu
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReservationsPage() {
  const { user } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("new");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState("2");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setMounted(true);
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const myReservations = useMemo(() => {
    if (!mounted || !user) return [];
    void refreshKey;
    return getUserReservations(user.id);
  }, [mounted, user, refreshKey]);

  const upcomingReservations = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return myReservations
      .filter((r) => r.date >= today && r.status !== "cancelled")
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [myReservations]);

  const pastReservations = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return myReservations
      .filter((r) => r.date < today || r.status === "cancelled" || r.status === "completed" || r.status === "not-visited")
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }, [myReservations]);

  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  }, []);

  const resetForm = () => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setGuests("2");
    setDate("");
    setTime("");
    setNotes("");
    setShowSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!date) {
      toast.error("Please select a date");
      return;
    }
    if (!time) {
      toast.error("Please select a time");
      return;
    }

    addReservation({
      id: generateId("res"),
      userId: user?.id ?? null,
      name: name.trim(),
      phone: phone.trim(),
      guests: parseInt(guests, 10),
      date,
      time,
      notes: notes.trim() || undefined,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    setShowSuccess(true);
    setRefreshKey((x) => x + 1);
    toast.success("Reservation submitted successfully!");
  };

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
	<div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
	<Link
	  href="/"
	  className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
	>
	  <ArrowLeft className="h-4 w-4" />
	  Back to Home
	</Link>
	<div className="flex items-center gap-3 mb-2">
	<CalendarDays className="h-7 w-7 text-gold" />
            <h1 className="font-serif text-3xl font-bold text-foreground">
              Table Reservations
            </h1>
          </div>
          <p className="text-muted-foreground">
            Reserve your table at Homely Foods. We will confirm your booking shortly.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 bg-muted/50">
            <TabsTrigger value="new" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              New Reservation
            </TabsTrigger>
            <TabsTrigger value="my" className="gap-2">
              <Utensils className="h-4 w-4" />
              My Reservations
              {upcomingReservations.length > 0 && (
                <Badge variant="secondary" className="ml-1 bg-gold/10 text-gold-dark text-[10px]">
                  {upcomingReservations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* New Reservation Tab */}
          <TabsContent value="new">
            {showSuccess ? (
              <SuccessState onReset={resetForm} />
            ) : (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarDays className="h-5 w-5 text-gold" />
                    Book Your Table
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Contact Info */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Your Name *
                        </label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          WhatsApp / Phone *
                        </label>
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+971 50 123 4567"
                          className="bg-background"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Reservation Details */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Number of Guests *
                        </label>
                        <Select value={guests} onValueChange={setGuests}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select guests" />
                          </SelectTrigger>
                          <SelectContent>
                            {guestOptions.map((n) => (
                              <SelectItem key={n} value={n.toString()}>
                                {n} {n === 1 ? "Guest" : "Guests"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Date *
                        </label>
                        <Input
                          type="date"
                          value={date}
                          min={minDate}
                          onChange={(e) => setDate(e.target.value)}
                          className="bg-background"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Time *
                        </label>
                        <Select value={time} onValueChange={setTime}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map((slot) => (
                              <SelectItem key={slot} value={slot}>
                                {formatTime(slot)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Special Requests (Optional)
                      </label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Allergies, special occasion, seating preferences..."
                        rows={3}
                        className="bg-background"
                      />
                    </div>

                    {/* Info Box */}
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium text-foreground mb-1">
                            Reservation Policy
                          </p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Reservations must be made at least 24 hours in advance</li>
                            <li>We will confirm via WhatsApp within 2 hours</li>
                            <li>Please arrive 10-15 minutes before your reserved time</li>
                            <li>Tables are held for 15 minutes past reservation time</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
                      size="lg"
                    >
                      <CalendarDays className="mr-2 h-5 w-5" />
                      Submit Reservation
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* My Reservations Tab */}
          <TabsContent value="my">
            {!user ? (
              <Card className="border-dashed border-border bg-card">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <CalendarDays className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="mb-1 font-serif text-lg font-semibold text-foreground">
                    Sign in to view reservations
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Track and manage your table bookings
                  </p>
                  <Link href="/login">
                    <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
                      Sign In
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : myReservations.length === 0 ? (
              <Card className="border-dashed border-border bg-card">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <CalendarDays className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="mb-1 font-serif text-lg font-semibold text-foreground">
                    No reservations yet
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Make your first table reservation
                  </p>
                  <Button
                    onClick={() => setActiveTab("new")}
                    className="bg-gold text-primary-foreground hover:bg-gold-dark"
                  >
                    Book a Table
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Upcoming */}
                {upcomingReservations.length > 0 && (
                  <div>
                    <h2 className="mb-4 font-serif text-xl font-bold text-foreground">
                      Upcoming Reservations
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {upcomingReservations.map((res) => (
                        <ReservationCard key={res.id} reservation={res} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Past */}
                {pastReservations.length > 0 && (
                  <div>
                    <h2 className="mb-4 font-serif text-xl font-bold text-foreground">
                      Past Reservations
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {pastReservations.map((res) => (
                        <ReservationCard key={res.id} reservation={res} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
