"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/data/store";
import { addReservation, generateId, getUserReservations } from "@/lib/data/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function StatusBadge({ status }: { status: string }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <Badge variant="secondary" className="capitalize">
      {label}
    </Badge>
  );
}

export default function ReservationsPage() {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [guests, setGuests] = useState<number>(2);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const myReservations = useMemo(() => {
    if (!user) return [];
    // refreshKey forces re-read after submit
    void refreshKey;
    return getUserReservations(user.id);
  }, [user, refreshKey]);

  function validate() {
    if (!name.trim()) return "Name is required.";
    if (!phone.trim()) return "Phone/WhatsApp number is required.";
    if (!date) return "Date is required.";
    if (!time) return "Time is required.";
    if (!guests || guests < 1) return "Guests must be at least 1.";
    return null;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(null);

    const err = validate();
    if (err) {
      alert(err);
      return;
    }

    addReservation({
      id: generateId("res"),
      userId: user?.id ?? null,
      name: name.trim(),
      phone: phone.trim(),
      guests,
      date,
      time,
      notes: notes.trim() ? notes.trim() : undefined,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    setSuccess("Reservation submitted! We will confirm soon.");
    setNotes("");
    setDate("");
    setTime("");
    setGuests(2);
    setRefreshKey((x) => x + 1);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold">Table Reservations</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Book your table. Admin will confirm your reservation.
        </p>
      </div>

      <Card className="p-5">
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">WhatsApp / Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971..." />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Guests</label>
              <Input
                type="number"
                min={1}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Time</label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special request..." />
          </div>

          <Button type="submit" className="bg-gold text-primary-foreground hover:bg-gold-dark">
            Submit Reservation
          </Button>

          {success && (
            <p className="rounded-md bg-gold/10 px-3 py-2 text-sm font-medium text-gold-dark">
              {success}
            </p>
          )}
        </form>
      </Card>

      <div className="mt-8">
        <h2 className="font-serif text-xl font-bold">My Reservations</h2>

        {!user ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Login to view your reservation history.
          </p>
        ) : myReservations.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No reservations yet.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {myReservations.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {r.date} • {r.time} • {r.guests} guests
                    </p>
                    <p className="text-xs text-muted-foreground">{r.phone}</p>
                    {r.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Note: {r.notes}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}