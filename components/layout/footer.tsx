"use client";

import Link from "next/link";
import { UtensilsCrossed, Mail, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "Reservations", href: "/reservations" },
  { label: "Reviews", href: "/reviews" },
];

const supportLinks = [
  { label: "FAQs", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Contact Us", href: "#" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-6 w-6 text-gold" />
              <div className="flex flex-col leading-none">
                <span className="font-serif text-lg font-bold text-foreground">HOMELY</span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-gold">
                  Foods
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Premium homestyle dining delivered to your doorstep. Earn
              HomelyPoints with every order and enjoy rewards.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-gold" />
                <span>Dubai Marina, Dubai, UAE</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-gold" />
                <span>+971 4 123 4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-gold" />
                <span>hello@homelyfoods.ae</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-semibold text-foreground">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className={`text-sm text-muted-foreground transition-colors hover:text-gold ${
                      link.href === "#" ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-semibold text-foreground">
              Support
            </h3>
            <ul className="space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="pointer-events-none text-sm text-muted-foreground opacity-50 transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-semibold text-foreground">
              Stay Updated
            </h3>
            <p className="mb-3 text-sm text-muted-foreground">
              Subscribe for exclusive offers and new menu updates.
            </p>
            <form
              className="flex gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <Input
                type="email"
                placeholder="Your email"
                className="h-9 bg-background text-sm"
              />
              <Button
                type="submit"
                size="sm"
                className="shrink-0 bg-gold text-primary-foreground hover:bg-gold-dark"
              >
                Join
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 border-t border-border pt-6">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} HOMELY FOODS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
