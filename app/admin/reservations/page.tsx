"use client";

import { useMemo, useState } from "react";
import { getReservations, updateReservationStatus, deleteReservation } from "@/lib/data/storage";
import type { ReservationStatus } from "@/lib/data/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

function StatusBadge({ status }: { status: string }) {
  let color = "bg-gray-200 text-gray-800";

  if (status === "pending")
    color = "bg-yellow-100 text-yellow-800";
  if (status === "confirmed")
    color = "bg-green-100 text-green-800";
  if (status === "cancelled")
    color = "bg-red-100 text-red-800";
  if (status === "completed")
    color = "bg-blue-100 text-blue-800";

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${color}`}>
      {status}
    </span>
  );
}

function toWhatsAppLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, ""); // keep numbers only
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${digits}?text=${encoded}`;
}

export default function AdminReservationsPage() {
  const [q, setQ] = useState("");
  const [waOpen, setWaOpen] = useState(false);
const [selectedId, setSelectedId] = useState<string | null>(null);
const [nextStatus, setNextStatus] = useState<ReservationStatus>("pending");
const [waMessage, setWaMessage] = useState("");
const [waPhone, setWaPhone] = useState("");
const [waName, setWaName] = useState("");
const [waGuests, setWaGuests] = useState<number>(1);
const [waDate, setWaDate] = useState("");
const [waTime, setWaTime] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReservationStatus>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const all = useMemo(() => {
    void refreshKey;
    return getReservations();
  }, [refreshKey]);

  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const total = all.length;
    const pending = all.filter((r) => r.status === "pending").length;
    const confirmed = all.filter((r) => r.status === "confirmed").length;
    const todayCount = all.filter((r) => r.date === today).length;
    return { total, pending, confirmed, todayCount };
  }, [all, today]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return all
      .filter((r) => (statusFilter === "all" ? true : r.status === statusFilter))
      .filter((r) => {
        if (!qq) return true;
        return (
          r.name.toLowerCase().includes(qq) ||
          r.phone.toLowerCase().includes(qq) ||
          r.date.toLowerCase().includes(qq) ||
          r.time.toLowerCase().includes(qq)
        );
      });
  }, [all, q, statusFilter]);

  function buildMessage(
    name: string,
    guests: number,
    date: string,
    time: string,
    status: ReservationStatus
  ) {
    if (status === "confirmed") {
      return `Hi ${name}, Greetings from Homely Foods! ✅ Your reservation for ${guests} people on ${date} at ${time} is confirmed. Please arrive 10–15 minutes early. If you need any changes, reply here. Thank you!`;
    }
    if (status === "pending") {
      return `Hi ${name}, Greetings from Homely Foods! We received your reservation request for ${guests} people on ${date} at ${time}. We will confirm shortly. Thank you!`;
    }
    if (status === "cancelled") {
      return `Hi ${name}, Greetings from Homely Foods. Unfortunately, your reservation for ${guests} people on ${date} at ${time} has been cancelled. If you would like another time, please message us. Thank you!`;
    }
    return `Hi ${name}, Thank you for visiting Homely Foods! Your reservation on ${date} at ${time} is marked as completed. We’d love your feedback. Thank you!`;
  }
  
  function onStatusChangeWithWhatsApp(r: any, status: ReservationStatus) {
    // Update status immediately
    updateReservationStatus(r.id, status);
    setRefreshKey((x) => x + 1);
  
    // Prepare WhatsApp popup
    setSelectedId(r.id);
    setNextStatus(status);
    setWaPhone(r.phone || "");
    setWaName(r.name || "Customer");
    setWaGuests(r.guests || 1);
    setWaDate(r.date || "");
    setWaTime(r.time || "");
    setWaMessage(buildMessage(r.name || "Customer", r.guests || 1, r.date || "", r.time || "", status));
    setWaOpen(true);
  }

  function onDelete(id: string) {
    const ok = confirm("Delete this reservation?");
    if (!ok) return;
    deleteReservation(id);
    setRefreshKey((x) => x + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Reservations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage table booking requests.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="mt-1 text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="mt-1 text-2xl font-bold">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Confirmed</p>
          <p className="mt-1 text-2xl font-bold">{stats.confirmed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Today</p>
          <p className="mt-1 text-2xl font-bold">{stats.todayCount}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input
            placeholder="Search name / phone / date..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="md:max-w-sm"
          />

          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => setRefreshKey((x) => x + 1)}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Phone</th>
                <th className="py-2 pr-3">Guests</th>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="py-6 text-muted-foreground" colSpan={7}>
                    No reservations found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="py-3 pr-3 font-medium">{r.name}</td>
                    <td className="py-3 pr-3">{r.phone}</td>
                    <td className="py-3 pr-3">{r.guests}</td>
                    <td className="py-3 pr-3">{r.date}</td>
                    <td className="py-3 pr-3">{r.time}</td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={r.status} />
                        <Select
                        value={r.status}
                        onValueChange={(v) => onStatusChangeWithWhatsApp(r, v as ReservationStatus)}
                      >
                          <SelectTrigger className="h-8 w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <Button variant="destructive" size="sm" onClick={() => onDelete(r.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <Dialog open={waOpen} onOpenChange={setWaOpen}>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>Send WhatsApp update</DialogTitle>
    </DialogHeader>

    <div className="grid gap-3">
      
      <div className="rounded-md bg-muted/40 p-3 text-sm">
  <p><strong>Name:</strong> {waName}</p>
  <p><strong>Guests:</strong> {waGuests}</p>
  <p><strong>Date:</strong> {waDate}</p>
  <p><strong>Time:</strong> {waTime}</p>
  <p><strong>WhatsApp:</strong> {waPhone}</p>
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
            alert("Message copied!");
          }}
        >
          Copy
        </Button>

        <Button
  className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
  onClick={() => {
    if (!waPhone || waPhone.replace(/\D/g, "").length < 8) {
      alert("WhatsApp number is missing or invalid.");
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