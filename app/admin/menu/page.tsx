"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  ImageIcon,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  getMenuItems,
  getCategories,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  generateId,
} from "@/lib/data/storage";
import type { MenuItem, Category, AddOn } from "@/lib/data/types";
import { toast } from "sonner";

const emptyItem: Omit<MenuItem, "id"> = {
  name: "",
  description: "",
  price: 0,
  category: "",
  categorySlug: "",
  images: [""],
  available: true,
  hpReward: 0,
  hpRedeemCost: 0,
  addOns: [],
  tags: [],
  isMostOrdered: false,
  isLimitedOffer: false,
  isDailySpecial: false,
  preparationTime: "15-20 min",
  rating: 0,
  reviewCount: 0,
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCats] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<MenuItem, "id">>(emptyItem);
  const [tagInput, setTagInput] = useState("");
  const [newAddOn, setNewAddOn] = useState({ name: "", price: 0 });
  const didAutoOpenRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const refresh = useCallback(() => {
    setItems(getMenuItems());
    setCats(getCategories());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId) {
      // reset so future links can auto-open again
      didAutoOpenRef.current = false;
      return;
    }
  
    // prevent repeated opens on refresh() / items changes
    if (didAutoOpenRef.current) return;
  
    const item = items.find((i) => i.id === editId);
    if (!item) return;
  
    didAutoOpenRef.current = true;
  
    setFilterCat(item.categorySlug || "all");
    openEdit(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, items]);

  const filtered = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      filterCat === "all" || item.categorySlug === filterCat;
    return matchesSearch && matchesCat;
  });

  function openCreate() {
    setEditingItem(null);
    setForm(emptyItem);
    setTagInput("");
    setDialogOpen(true);
  }

  function openEdit(item: MenuItem) {
    setEditingItem(item);
    const { id, ...rest } = item;
    setForm(rest);
    setTagInput("");
    setDialogOpen(true);
    void id;
  }

  function openDelete(id: string) {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (form.price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }
    if (!form.category) {
      toast.error("Category is required");
      return;
    }

    if (editingItem) {
      updateMenuItem({ ...form, id: editingItem.id });
      toast.success(`"${form.name}" updated`);
    } else {
      addMenuItem({ ...form, id: generateId("item") });
      toast.success(`"${form.name}" added to menu`);
    }
    // If opened via ?edit=, remove it so dialog won't reopen after refresh
const sp = new URLSearchParams(searchParams.toString());
if (sp.has("edit")) {
  sp.delete("edit");
  const qs = sp.toString();
  router.replace(qs ? `/admin/menu?${qs}` : "/admin/menu");
}
      clearEditParam();
      setDialogOpen(false);
      refresh();
  }

  function handleDelete() {
    if (!deletingId) return;
    const item = items.find((i) => i.id === deletingId);
    deleteMenuItem(deletingId);
    toast.success(`"${item?.name}" deleted`);
    setDeleteDialogOpen(false);
    setDeletingId(null);
    refresh();
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }

  function handleAddAddOn() {
    if (!newAddOn.name.trim() || newAddOn.price <= 0) return;
    const addon: AddOn = {
      id: generateId("ao"),
      name: newAddOn.name.trim(),
      price: newAddOn.price,
    };
    setForm((f) => ({ ...f, addOns: [...f.addOns, addon] }));
    setNewAddOn({ name: "", price: 0 });
  }

  function removeAddOn(id: string) {
    setForm((f) => ({
      ...f,
      addOns: f.addOns.filter((a) => a.id !== id),
    }));
  }

  function handleCategoryChange(slug: string) {
    const cat = categories.find((c) => c.slug === slug);
    setForm((f) => ({
      ...f,
      category: cat?.name || "",
      categorySlug: slug,
    }));
  }

  function clearEditParam() {
    const sp = new URLSearchParams(searchParams.toString());
    if (!sp.has("edit")) return;

    sp.delete("edit");
    const qs = sp.toString();
    router.replace(qs ? `/admin/menu?${qs}` : "/admin/menu");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Menu Items
          </h1>
          <p className="text-sm text-muted-foreground">
            {items.length} items across {categories.length} categories
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-gold text-primary-foreground hover:bg-gold-dark"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">HP</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-muted-foreground"
                    >
                      No menu items found
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                            {item.images[0] ? (
                              <img
                                src={item.images[0]}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {item.name}
                            </p>
                            <p className="max-w-xs truncate text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        AED {item.price}
                      </td>
                      <td className="px-4 py-3 text-gold-dark">
                        +{item.hpReward}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {item.available ? (
                            <Badge className="bg-green/10 text-green border-green/30 text-xs">
                              Available
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Unavailable
                            </Badge>
                          )}
                          {item.isMostOrdered && (
                            <Badge className="bg-gold/10 text-gold-dark border-gold/30 text-xs">
                              Popular
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(item)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => openDelete(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
  open={dialogOpen}
  onOpenChange={(open) => {
    if (!open) clearEditParam();
    setDialogOpen(open);
  }}
>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl bg-card text-card-foreground">
          <DialogHeader>
<DialogTitle className="font-serif text-foreground">
                  {editingItem ? "Edit Menu Item" : "Add Menu Item"}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? "Update the details of this menu item."
                    : "Add a new item to your menu."}
                </DialogDescription>
              </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-foreground">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Grilled Chicken Caesar Salad"
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="desc" className="text-foreground">Description</Label>
              <Textarea
                id="desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Brief description of the dish..."
                rows={3}
              />
            </div>

            {/* Price + Category Row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="price" className="text-foreground">Price (AED)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={1}
                  value={form.price || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-foreground">Category</Label>
                <Select
                  value={form.categorySlug}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.slug}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* HP Reward + Redeem Cost */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="hpReward" className="text-foreground">HP Reward</Label>
                <Input
                  id="hpReward"
                  type="number"
                  min={0}
                  value={form.hpReward || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      hpReward: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hpRedeem" className="text-foreground">HP Redeem Cost</Label>
                <Input
                  id="hpRedeem"
                  type="number"
                  min={0}
                  value={form.hpRedeemCost || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      hpRedeemCost: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            {/* Prep Time */}
            <div className="grid gap-2">
              <Label htmlFor="prepTime" className="text-foreground">Preparation Time</Label>
              <Input
                id="prepTime"
                value={form.preparationTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, preparationTime: e.target.value }))
                }
                placeholder="e.g. 15-20 min"
              />
            </div>

            {/* Image URL */}
            <div className="grid gap-2">
              <Label htmlFor="image" className="text-foreground">Image URL</Label>
              <Input
                id="image"
                value={form.images[0] || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, images: [e.target.value] }))
                }
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            {/* Toggles */}
            <div className="grid gap-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Available</Label>
                <Switch
                  checked={form.available}
                  onCheckedChange={(c) =>
                    setForm((f) => ({ ...f, available: c }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Most Ordered</Label>
                <Switch
                  checked={form.isMostOrdered}
                  onCheckedChange={(c) =>
                    setForm((f) => ({ ...f, isMostOrdered: c }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Limited Offer</Label>
                <Switch
                  checked={form.isLimitedOffer}
                  onCheckedChange={(c) =>
                    setForm((f) => ({ ...f, isLimitedOffer: c }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Daily Special</Label>
                <Switch
                  checked={form.isDailySpecial}
                  onCheckedChange={(c) =>
                    setForm((f) => ({ ...f, isDailySpecial: c }))
                  }
                />
              </div>
            </div>

            {/* Tags */}
            <div className="grid gap-2">
              <Label className="text-foreground">Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  className="shrink-0"
                >
                  Add
                </Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {form.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 text-secondary-foreground"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Add-Ons */}
            <div className="grid gap-2">
              <Label className="text-foreground">Add-Ons</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add-on name"
                  value={newAddOn.name}
                  onChange={(e) =>
                    setNewAddOn((a) => ({ ...a, name: e.target.value }))
                  }
                />
                <Input
                  type="number"
                  placeholder="Price"
                  className="w-24"
                  min={0}
                  value={newAddOn.price || ""}
                  onChange={(e) =>
                    setNewAddOn((a) => ({
                      ...a,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddAddOn}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {form.addOns.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1">
                  {form.addOns.map((ao) => (
                    <div
                      key={ao.id}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-sm"
                    >
                      <span className="text-foreground">
                        {ao.name}{" "}
                        <span className="text-muted-foreground">
                          +AED {ao.price}
                        </span>
                      </span>
                      <button onClick={() => removeAddOn(ao.id)}>
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
          <Button
  variant="outline"
  onClick={() => {
    clearEditParam();
    setDialogOpen(false);
  }}
>
  Cancel
</Button>
            <Button
              onClick={handleSave}
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
            >
              <Check className="mr-2 h-4 w-4" />
              {editingItem ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone.
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
