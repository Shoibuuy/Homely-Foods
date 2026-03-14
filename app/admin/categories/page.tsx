"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Check, ImageIcon, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  generateId,
} from "@/lib/data/storage";
import type { Category } from "@/lib/data/types";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const emptyCategory: Omit<Category, "id"> = {
  name: "",
  slug: "",
  description: "",
  image: "",
};

export default function AdminCategoriesPage() {
  const [categories, setCats] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Category, "id">>(emptyCategory);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewCat, setViewCat] = useState<Category | null>(null);

  const refresh = useCallback(() => {
    setCats(getCategories());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const itemCounts: Record<string, number> = {};
  const allItems = getMenuItems();
  for (const item of allItems) {
    itemCounts[item.categorySlug] = (itemCounts[item.categorySlug] || 0) + 1;
  }

  function openViewItems(cat: Category) {
    setViewCat(cat);
    setViewDialogOpen(true);
  }

  function openCreate() {
    setEditingCat(null);
    setForm(emptyCategory);
    setDialogOpen(true);
  }

  function openEdit(cat: Category) {
    setEditingCat(cat);
    const { id, ...rest } = cat;
    setForm(rest);
    setDialogOpen(true);
    void id;
  }

  function openDelete(id: string) {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    const slug =
      form.slug.trim() ||
      form.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");

    const data = { ...form, slug };

    if (editingCat) {
      updateCategory({ ...data, id: editingCat.id });
      toast.success(`"${form.name}" updated`);
    } else {
      addCategory({ ...data, id: generateId("cat") });
      toast.success(`"${form.name}" created`);
    }
    setDialogOpen(false);
    refresh();
  }

  function handleDelete() {
    if (!deletingId) return;
    const cat = categories.find((c) => c.id === deletingId);
    const count = itemCounts[cat?.slug || ""] || 0;
    if (count > 0) {
      toast.error(
        `Cannot delete "${cat?.name}" - it has ${count} menu item${count !== 1 ? "s" : ""}`
      );
      setDeleteDialogOpen(false);
      return;
    }
    deleteCategory(deletingId);
    toast.success(`"${cat?.name}" deleted`);
    setDeleteDialogOpen(false);
    setDeletingId(null);
    refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Categories
          </h1>
          <p className="text-sm text-muted-foreground">
            {categories.length} categories
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-gold text-primary-foreground hover:bg-gold-dark"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Category Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Card key={cat.id} className="overflow-hidden">
            <div className="relative h-32 bg-muted">
              {cat.image ? (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-foreground">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground">{cat.slug}</p>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {cat.description}
                  </p>
                  <p className="mt-2 text-xs font-medium text-gold-dark">
                    {itemCounts[cat.slug] || 0} items
                  </p>
                </div>
                <div className="flex gap-1">
  <Button
    variant="ghost"
    size="icon"
    className="h-8 w-8 text-muted-foreground hover:text-foreground"
    onClick={() => openViewItems(cat)}
    aria-label="View items"
    title="View items"
  >
    <Eye className="h-3.5 w-3.5" />
  </Button>

  <Button
    variant="ghost"
    size="icon"
    className="h-8 w-8 text-muted-foreground hover:text-foreground"
    onClick={() => openEdit(cat)}
    aria-label="Edit category"
    title="Edit"
  >
    <Pencil className="h-3.5 w-3.5" />
  </Button>

  <Button
    variant="ghost"
    size="icon"
    className="h-8 w-8 text-muted-foreground hover:text-destructive"
    onClick={() => openDelete(cat.id)}
    aria-label="Delete category"
    title="Delete"
  >
    <Trash2 className="h-3.5 w-3.5" />
  </Button>
</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground">
          <DialogHeader>
<DialogTitle className="font-serif text-foreground">
                  {editingCat ? "Edit Category" : "Add Category"}
                </DialogTitle>
                <DialogDescription>
                  {editingCat
                    ? "Update the details of this category."
                    : "Create a new category for your menu items."}
                </DialogDescription>
              </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="catName" className="text-foreground">Name</Label>
              <Input
                id="catName"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Desserts"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="catSlug" className="text-foreground">
                Slug{" "}
                <span className="text-muted-foreground">(auto-generated if empty)</span>
              </Label>
              <Input
                id="catSlug"
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                placeholder="e.g. desserts"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="catDesc" className="text-foreground">Description</Label>
              <Textarea
                id="catDesc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                placeholder="Short description..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="catImg" className="text-foreground">Image URL</Label>
              <Input
                id="catImg"
                value={form.image}
                onChange={(e) =>
                  setForm((f) => ({ ...f, image: e.target.value }))
                }
                placeholder="https://images.unsplash.com/..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
            >
              <Check className="mr-2 h-4 w-4" />
              {editingCat ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        {/* View Items Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card text-card-foreground">
          <DialogHeader>
<DialogTitle className="font-serif text-foreground">
                  {viewCat ? `${viewCat.name} — Items` : "Category Items"}
                </DialogTitle>
                <DialogDescription>
                  View all menu items in this category.
                </DialogDescription>
              </DialogHeader>

          {viewCat ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {itemCounts[viewCat.slug] || 0} item(s) in this category
              </p>

              <div className="max-h-[380px] overflow-auto rounded-lg border border-border">
                <div className="divide-y divide-border">
                  {allItems
                    .filter((i) => i.categorySlug === viewCat.slug)
                    .map((i) => (
                      <div key={i.id} className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{i.name}</p>
                          <p className="text-xs text-muted-foreground">
                            AED {i.price} • {i.available ? "Available" : "Unavailable"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link href={`/menu/${i.id}`} className="text-xs text-gold hover:text-gold-dark">
                            View
                          </Link>
                          <Link
                            href={`/admin/menu?edit=${encodeURIComponent(i.id)}`}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    ))}

                  {allItems.filter((i) => i.categorySlug === viewCat.slug).length === 0 && (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      No items yet in this category.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? Categories with menu items cannot be deleted.
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
