"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MenuCard } from "@/components/menu-card";
import { getCategories, getMenuItems } from "@/lib/data/storage";


export default function MenuPage() {
  return (
    <Suspense fallback={<MenuSkeleton />}>
      <MenuContent />
    </Suspense>
  );
}

function MenuSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-5 w-72 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}

function MenuContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  
  useEffect(() => {
    setMounted(true);
    setCategories(getCategories());
    setMenuItems(getMenuItems());
  }, []);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(
    categoryParam || "all"
  );

  const filtered = useMemo(() => {
    if (!mounted) return [];
    let results = menuItems;

    if (activeCategory !== "all") {
      results = results.filter((item) => item.categorySlug === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags.some((t: string) => t.toLowerCase().includes(q))
      );
    }

    return results;
  }, [mounted, menuItems, activeCategory, search]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">
            Our Menu
          </h1>
          <p className="text-muted-foreground">
            Explore our full collection of premium homestyle dishes
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {/* Search + Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search dishes, ingredients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            <span>
              {filtered.length} {filtered.length === 1 ? "dish" : "dishes"}
            </span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory("all")}
            className={
              activeCategory === "all"
                ? "bg-gold text-primary-foreground hover:bg-gold-dark"
                : "border-border text-foreground"
            }
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.slug ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat.slug)}
              className={
                activeCategory === cat.slug
                  ? "bg-gold text-primary-foreground hover:bg-gold-dark"
                  : "border-border text-foreground"
              }
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Active Category Description */}
        {activeCategory !== "all" && (
          <div className="mb-6 flex items-center gap-2">
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              {categories.find((c) => c.slug === activeCategory)?.name}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {categories.find((c) => c.slug === activeCategory)?.description}
            </span>
          </div>
        )}

        {/* Results Grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mb-1 font-serif text-lg font-semibold text-foreground">
              No dishes found
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Try adjusting your search or filter to find what you{"'"}re
              looking for.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-foreground"
              onClick={() => {
                setSearch("");
                setActiveCategory("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
