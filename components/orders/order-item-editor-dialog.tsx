"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import type { AddOn, CartItem } from "@/lib/data/types";
import { formatAED } from "@/lib/utils";
import { calcCartItemLineTotal } from "@/lib/orders/pricing";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

type EditableAddOn = AddOn & {
  quantity: number;
};

interface OrderItemEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CartItem | null;
  mode?: "edit" | "view";
  onSave?: (payload: {
    quantity: number;
    selectedAddOns: AddOn[];
    note?: string;
  }) => void;
}

function groupAddOns(addOns: AddOn[]): EditableAddOn[] {
  const map = new Map<string, EditableAddOn>();

  for (const addOn of addOns) {
    const existing = map.get(addOn.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      map.set(addOn.id, { ...addOn, quantity: 1 });
    }
  }

  return Array.from(map.values());
}

export function OrderItemEditorDialog({
  open,
  onOpenChange,
  item,
  mode = "edit",
  onSave,
}: OrderItemEditorDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [editableAddOns, setEditableAddOns] = useState<EditableAddOn[]>([]);
  const [note, setNote] = useState("");

  const isViewOnly = mode === "view";

  useEffect(() => {
    if (!item) return;

    setQuantity(item.quantity);
    setEditableAddOns(groupAddOns(item.selectedAddOns));
    setNote(item.note ?? "");
  }, [item]);

  const linePreview = useMemo(() => {
    if (!item) return 0;

    const addOnTotal = editableAddOns.reduce(
      (sum, addOn) => sum + addOn.price * addOn.quantity,
      0,
    );

    return (item.menuItem.price + addOnTotal) * quantity;
  }, [item, editableAddOns, quantity]);

  if (!item) return null;

  const imageSrc = item.menuItem.images?.[0];

  const increaseAddOn = (target: AddOn) => {
    setEditableAddOns((prev) => {
      const existing = prev.find((a) => a.id === target.id);
      if (existing) {
        return prev.map((a) =>
          a.id === target.id ? { ...a, quantity: a.quantity + 1 } : a,
        );
      }

      return [...prev, { ...target, quantity: 1 }];
    });
  };

  const decreaseAddOn = (addOnId: string) => {
    setEditableAddOns((prev) => {
      const existing = prev.find((a) => a.id === addOnId);
      if (!existing) return prev;

      if (existing.quantity <= 1) {
        return prev.filter((a) => a.id !== addOnId);
      }

      return prev.map((a) =>
        a.id === addOnId ? { ...a, quantity: a.quantity - 1 } : a,
      );
    });
  };

  const expandedSelectedAddOns: AddOn[] = editableAddOns.flatMap((addOn) =>
    Array.from({ length: addOn.quantity }, () => ({
      id: addOn.id,
      name: addOn.name,
      price: addOn.price,
    })),
  );

  const handleSave = () => {
    if (!onSave) return;

    onSave({
      quantity,
      selectedAddOns: expandedSelectedAddOns,
      note: note.trim() || undefined,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
<DialogContent className="max-w-xl overflow-hidden rounded-3xl border border-border/70 p-0 shadow-[0_20px_60px_rgba(0,0,0,0.12)] max-h-[90vh]">
<div className="max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="mb-5 space-y-1 text-left">
<DialogTitle className="font-serif text-xl font-bold text-foreground sm:text-2xl">
                {isViewOnly ? "View Item" : "Customize Item"}
              </DialogTitle>
              <DialogDescription>
                Review quantity, add-ons, and special instructions.
              </DialogDescription>
          </DialogHeader>

          <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3.5">
            <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-20 sm:w-20">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={item.menuItem.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold leading-5 text-foreground sm:text-base">
                {item.menuItem.name}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {item.menuItem.category}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                Current total: {formatAED(calcCartItemLineTotal(item))}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4 sm:space-y-5">
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">
                Quantity
              </p>

              <div className="inline-flex h-11 items-center rounded-full border border-border bg-background px-1 shadow-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={isViewOnly || quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <span className="min-w-9 text-center text-sm font-semibold text-foreground">
                  {quantity}
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  disabled={isViewOnly}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {item.menuItem.addOns.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Add-ons
                </p>

                <div className="space-y-2.5">
                  {item.menuItem.addOns.map((addOn) => {
                    const currentQty =
                      editableAddOns.find((a) => a.id === addOn.id)?.quantity ??
                      0;

                    return (
                      <div
                        key={addOn.id}
                        className="flex items-center justify-between rounded-2xl border border-border/70 bg-background px-3 py-3"
                      >
                        <div className="min-w-0 pr-3">
                          <p className="text-sm font-medium text-foreground">
                            {addOn.name}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            +{formatAED(addOn.price)} each
                          </p>
                        </div>

                        <div className="inline-flex h-10 items-center rounded-full border border-border bg-background px-1 shadow-sm">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => decreaseAddOn(addOn.id)}
                            disabled={isViewOnly || currentQty === 0}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>

                          <span className="min-w-8 text-center text-sm font-semibold text-foreground">
                            {currentQty}
                          </span>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => increaseAddOn(addOn)}
                            disabled={isViewOnly}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">
                Special Instructions
              </p>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. More spicy, no onions, sauce on the side..."
                className="min-h-[96px] resize-none rounded-2xl border-border/70 bg-background px-4 py-3 text-sm leading-6"
                disabled={isViewOnly}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between rounded-2xl bg-muted/30 px-3.5 py-3">
              <span className="text-sm font-semibold text-foreground">
                Updated Total
              </span>
              <span className="font-serif text-xl font-bold text-foreground sm:text-2xl">
                {formatAED(linePreview)}
              </span>
            </div>

            {!isViewOnly ? (
  <div className="sticky bottom-0 flex gap-3 border-t border-border/70 bg-background pt-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 rounded-xl"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="h-11 flex-1 rounded-xl bg-gold text-primary-foreground hover:bg-gold-dark"
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
