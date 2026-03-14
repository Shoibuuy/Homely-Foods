"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Check,
  Star,
  Home,
  Building2,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/data/store";
import {
  getSavedAddresses,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
  setDefaultAddress,
} from "@/lib/data/storage";
import { cn } from "@/lib/utils";
import type { SavedAddress } from "@/lib/data/types";
import { toast } from "sonner";

const labelIcons: Record<string, React.ElementType> = {
  Home: Home,
  Work: Briefcase,
  Office: Building2,
  Other: MapPin,
};

const labelOptions = ["Home", "Work", "Office", "Other"];

interface AddressFormData {
  label: string;
  fullName: string;
  phone: string;
  street: string;
  apartment: string;
  floor: string;
  room: string;
  area: string;
  notes: string;
  isDefault: boolean;
}

const emptyForm: AddressFormData = {
  label: "Home",
  fullName: "",
  phone: "",
  street: "",
  apartment: "",
  floor: "",
  room: "",
  area: "",
  notes: "",
  isDefault: false,
};

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: SavedAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const Icon = labelIcons[address.label] || MapPin;

  return (
    <Card
      className={cn(
        "border-border bg-card transition-all",
        address.isDefault && "border-gold/50 bg-gold/5"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full",
                address.isDefault ? "bg-gold/20" : "bg-muted"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  address.isDefault ? "text-gold" : "text-muted-foreground"
                )}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {address.label}
                </h3>
                {address.isDefault && (
                  <Badge className="bg-gold/10 text-gold-dark text-[10px]">
                    Default
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{address.fullName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{address.street}</p>
          {address.apartment && (
            <p>
              {address.apartment}
              {address.floor && `, Floor ${address.floor}`}
              {address.room && `, Room ${address.room}`}
            </p>
          )}
          <p>{address.area}</p>
          <p>{address.phone}</p>
          {address.notes && (
            <p className="text-xs italic">Note: {address.notes}</p>
          )}
        </div>

        {!address.isDefault && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSetDefault}
            className="mt-3 text-xs"
          >
            <Star className="mr-1.5 h-3 w-3" />
            Set as Default
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function AddressesPage() {
  const { user } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormData>(emptyForm);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addresses = useMemo(() => {
    if (!mounted || !user) return [];
    void refreshKey;
    return getSavedAddresses(user.id);
  }, [mounted, user, refreshKey]);

  const refresh = () => setRefreshKey((n) => n + 1);

  const handleOpenNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm, fullName: user?.name || "", phone: user?.phone || "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (address: SavedAddress) => {
    setEditingId(address.id);
    setForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      apartment: address.apartment || "",
      floor: address.floor || "",
      room: address.room || "",
      area: address.area,
      notes: address.notes || "",
      isDefault: address.isDefault,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!user) return;

    if (!form.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!form.street.trim()) {
      toast.error("Street address is required");
      return;
    }
    if (!form.area.trim()) {
      toast.error("Area is required");
      return;
    }

    if (editingId) {
      updateSavedAddress({
        id: editingId,
        userId: user.id,
        label: form.label,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        street: form.street.trim(),
        apartment: form.apartment.trim() || undefined,
        floor: form.floor.trim() || undefined,
        room: form.room.trim() || undefined,
        area: form.area.trim(),
        notes: form.notes.trim() || undefined,
        isDefault: form.isDefault,
        createdAt: new Date().toISOString(),
      });
      toast.success("Address updated");
    } else {
      addSavedAddress({
        userId: user.id,
        label: form.label,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        street: form.street.trim(),
        apartment: form.apartment.trim() || undefined,
        floor: form.floor.trim() || undefined,
        room: form.room.trim() || undefined,
        area: form.area.trim(),
        notes: form.notes.trim() || undefined,
        isDefault: addresses.length === 0 ? true : form.isDefault,
      });
      toast.success("Address added");
    }

    setDialogOpen(false);
    refresh();
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteSavedAddress(deleteId);
    toast.success("Address deleted");
    setDeleteId(null);
    refresh();
  };

  const handleSetDefault = (addressId: string) => {
    if (!user) return;
    setDefaultAddress(addressId, user.id);
    toast.success("Default address updated");
    refresh();
  };

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <MapPin className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-1 font-serif text-2xl font-bold text-foreground">
          Sign in to manage addresses
        </h2>
        <p className="mb-6 text-muted-foreground">
          Save your delivery addresses for faster checkout.
        </p>
        <Link href="/login">
          <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="h-7 w-7 text-gold" />
                <h1 className="font-serif text-3xl font-bold text-foreground">
                  My Addresses
                </h1>
              </div>
              <p className="text-muted-foreground">
                Manage your saved delivery addresses
              </p>
            </div>

            <Button
              onClick={handleOpenNew}
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Address
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        {addresses.length === 0 ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <MapPin className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="mb-1 font-serif text-lg font-semibold text-foreground">
                No saved addresses
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Add your first delivery address for faster checkout
              </p>
              <Button
                onClick={handleOpenNew}
                className="bg-gold text-primary-foreground hover:bg-gold-dark"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Address
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={() => handleOpenEdit(address)}
                onDelete={() => setDeleteId(address.id)}
                onSetDefault={() => handleSetDefault(address.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Address" : "Add New Address"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Label</label>
              <Select
                value={form.label}
                onValueChange={(v) => setForm({ ...form, label: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {labelOptions.map((label) => (
                    <SelectItem key={label} value={label}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">
                  Full Name *
                </label>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">
                  Phone *
                </label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+971 50 123 4567"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">
                Street Address *
              </label>
              <Input
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">
                  Building/Apt
                </label>
                <Input
                  value={form.apartment}
                  onChange={(e) => setForm({ ...form, apartment: e.target.value })}
                  placeholder="Building 5"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Floor</label>
                <Input
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                  placeholder="3"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">
                  Room/Unit
                </label>
                <Input
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  placeholder="301"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Area *</label>
              <Input
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                placeholder="Downtown Dubai"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">
                Delivery Notes
              </label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Gate code, landmark, special instructions..."
                rows={2}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
              />
              <span className="text-sm text-foreground">
                Set as default address
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
            >
              {editingId ? "Save Changes" : "Add Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this address?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The address will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
