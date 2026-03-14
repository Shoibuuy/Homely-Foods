"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Star, Clock, Award, Truck, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MenuCard } from "@/components/menu-card";
import { HPCoin, HPBadge } from "@/components/hp-coin";
import { sampleReviews } from "@/lib/data/mock-data";
import { getCategories, getMenuItems } from "@/lib/data/storage";
import type { Category, MenuItem } from "@/lib/data/types";

function HeroSection() {
  return (
    <section className="relative flex min-h-[540px] items-center overflow-hidden lg:min-h-[620px]">
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.jpg"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-r from-foreground/85 via-foreground/60 to-foreground/30" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="max-w-2xl">
          <Badge className="mb-4 bg-gold/20 text-gold-light hover:bg-gold/30">
            <Award className="mr-1 h-3 w-3" />
            Earn HomelyPoints with every order
          </Badge>

          <h1 className="mb-4 text-balance font-serif text-4xl font-bold leading-tight text-background md:text-5xl lg:text-6xl">
            Welcome to HOMELY FOODS
          </h1>

          <p className="mb-8 max-w-lg text-base leading-relaxed text-background/80 md:text-lg">
            Premium homestyle dining crafted with love. Discover our curated
            menu, earn rewards, and enjoy an unforgettable culinary experience.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/menu">
              <Button
                size="lg"
                className="bg-gold text-primary-foreground shadow-lg hover:bg-gold-dark"
              >
                Explore Menu
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-background/30 bg-background/10 text-background backdrop-blur hover:bg-background/20 hover:text-background"
              disabled
            >
              Book a Table
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap gap-6">
            {[
              { icon: Clock, label: "Fast Delivery", value: "30 min" },
              { icon: Star, label: "Top Rated", value: "4.8/5" },
              { icon: Truck, label: "Free Delivery", value: "100+ AED" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/20">
                  <stat.icon className="h-4 w-4 text-gold-light" />
                </div>
                <div>
                  <p className="text-xs text-background/60">{stat.label}</p>
                  <p className="text-sm font-semibold text-background">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DailySpecialBanner({ menuItems }: { menuItems: MenuItem[] }) {
  const special = menuItems.find((item) => item.isDailySpecial);
  if (!special) return null;

  const specialImg = special.images?.[0] || null;

  return (
    <section className="border-b border-gold/20 bg-gold/5 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          {specialImg ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gold/20 bg-background">
              <Image
                src={specialImg}
                alt={special.name}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-gold/30 bg-gold/10">
              <Star className="h-5 w-5 text-gold" />
            </div>
          )}

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">
              Today&apos;s Special
            </p>
            <p className="line-clamp-1 font-serif text-lg font-semibold text-foreground">
              {special.name}
              <span className="ml-2 text-sm text-muted-foreground">
                AED {special.price}
              </span>
            </p>
          </div>
        </div>

        <Link href={`/menu/${special.id}`}>
          <Button
            variant="outline"
            size="sm"
            className="border-gold/30 text-gold-dark hover:bg-gold/10 hover:text-gold-dark"
          >
            Order Now
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

function CategoriesSection({ categories }: { categories: Category[] }) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="mb-2 text-balance font-serif text-3xl font-bold text-foreground">
            Explore Our Menu
          </h2>
          <p className="text-muted-foreground">
            Browse by category and find your next favorite dish
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/menu?category=${cat.slug}`}
              className="group relative flex h-48 items-end overflow-hidden rounded-xl shadow-sm transition-shadow hover:shadow-md"
            >
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-foreground/80 via-foreground/20 to-transparent" />
              <div className="relative p-4">
                <h3 className="font-serif text-xl font-bold text-background">
                  {cat.name}
                </h3>
                <p className="text-xs text-background/70">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PopularItemsSection({ menuItems }: { menuItems: MenuItem[] }) {
  const popular = menuItems.filter((item) => item.isMostOrdered).slice(0, 6);

  return (
    <section className="bg-muted/50 py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="mb-2 text-balance font-serif text-3xl font-bold text-foreground">
              Most Popular
            </h2>
            <p className="text-muted-foreground">
              Loved by our customers - the dishes everyone keeps ordering
            </p>
          </div>
          <Link href="/menu" className="hidden md:block">
            <Button variant="outline" className="border-border text-foreground">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link href="/menu">
            <Button variant="outline" className="border-border text-foreground">
              View All Menu
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function LimitedOffersSection({ menuItems }: { menuItems: MenuItem[] }) {
  const offers = menuItems.filter((item) => item.isLimitedOffer);
  if (offers.length === 0) return null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-10 text-center">
          <Badge className="mb-3 bg-blue-offer/10 text-blue-offer hover:bg-blue-offer/20">
            Limited Time Only
          </Badge>
          <h2 className="mb-2 text-balance font-serif text-3xl font-bold text-foreground">
            Special Offers
          </h2>
          <p className="text-muted-foreground">
            Don&apos;t miss these exclusive dishes - available for a limited time
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HPTeaserSection() {
  return (
    <section className="border-y border-border bg-card py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
          <div className="max-w-lg text-center lg:text-left">
            <div className="mb-4 flex items-center justify-center gap-3 lg:justify-start">
              <HPCoin size="lg" />
              <h2 className="text-balance font-serif text-3xl font-bold text-foreground">
                HomelyPoints
              </h2>
            </div>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              Earn points with every order and redeem them for free meals! Every
              dish earns you HP, and you can use your points to get dishes
              completely free.
            </p>
            <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link href="/register">
                <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
                  Join Now - Get 5 Free HP
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid w-full max-w-sm gap-3 sm:grid-cols-2 lg:max-w-md">
            {[
              {
                title: "Order & Earn",
                desc: "Every dish earns you HomelyPoints",
                icon: "1",
              },
              {
                title: "Stack Points",
                desc: "Points never expire, keep earning",
                icon: "2",
              },
              {
                title: "Redeem Free Food",
                desc: "Use HP to get dishes for free",
                icon: "3",
              },
              {
                title: "Welcome Bonus",
                desc: "Get 5 HP just for signing up",
                icon: "4",
              },
            ].map((step) => (
              <Card
                key={step.title}
                className="border-border/50 bg-background shadow-sm"
              >
                <CardContent className="p-4">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-sm font-bold text-gold">
                    {step.icon}
                  </div>
                  <h3 className="mb-0.5 text-sm font-semibold text-card-foreground">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="bg-muted/50 py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-gold" />
              <span className="text-sm font-semibold text-gold">Reviews</span>
            </div>
            <h2 className="font-serif text-3xl font-bold text-foreground">
              What People Say
            </h2>
            <p className="mt-1 text-muted-foreground">
              Real reviews from our valued guests
            </p>
          </div>

          <Link href="/reviews">
            <Button variant="outline" className="border-border text-foreground">
              View Full Reviews
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {sampleReviews.map((review) => (
            <Card
              key={review.id}
              className="border-border/50 bg-card shadow-sm"
            >
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < review.rating
                          ? "fill-gold text-gold"
                          : "text-border"
                      }`}
                    />
                  ))}
                </div>
                <p className="mb-4 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                  {`"${review.comment}"`}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-xs font-bold text-gold-dark">
                    {review.userName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {review.userName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("en-AE", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABanner() {
  return (
    <section className="bg-foreground py-16">
      <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
        <h2 className="mb-3 text-balance font-serif text-3xl font-bold text-background">
          Ready to Order?
        </h2>
        <p className="mb-8 text-background/70">
          Browse our full menu and treat yourself to something delicious today.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/menu">
            <Button
              size="lg"
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
            >
              View Full Menu
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="lg"
              variant="outline"
              className="border-background/30 text-background hover:bg-background/10 hover:text-background"
            >
              Create Account
            </Button>
          </Link>
        </div>
        <div className="mt-6 flex justify-center">
          <HPBadge
            amount={5}
            size="md"
            label="welcome bonus on signup"
            className="bg-gold/15"
          />
        </div>
      </div>
    </section>
  );
}

function useHomeData() {
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    setMounted(true);

    const load = () => {
      setCategories(getCategories());
      setMenuItems(getMenuItems());
    };

    load();

    const onChange = (e: Event) => {
      const ce = e as CustomEvent<{ scope: string }>;
      if (
        ce.detail?.scope === "categories" ||
        ce.detail?.scope === "menuItems"
      ) {
        load();
      }
    };

    window.addEventListener("homely_store_changed", onChange);
    return () => window.removeEventListener("homely_store_changed", onChange);
  }, []);

  return { mounted, categories, menuItems };
}

export default function HomePage() {
  const { mounted, categories, menuItems } = useHomeData();

  return (
    <>
      <HeroSection />
      {mounted ? <DailySpecialBanner menuItems={menuItems} /> : null}
      {mounted ? <CategoriesSection categories={categories} /> : null}
      {mounted ? <PopularItemsSection menuItems={menuItems} /> : null}
      {mounted ? <LimitedOffersSection menuItems={menuItems} /> : null}
      <HPTeaserSection />
      <TestimonialsSection />
      <CTABanner />
    </>
  );
}