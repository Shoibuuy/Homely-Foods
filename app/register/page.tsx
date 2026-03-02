"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UtensilsCrossed, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { HPCoin } from "@/components/hp-coin";
import { useAuth } from "@/lib/data/store";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = register({ name, email, phone, password });
      if (result.success) {
        toast.success("Welcome to HOMELY FOODS!", {
          description: "Your account has been created. You earned 5 HP as a welcome bonus!",
        });
        router.push("/");
      } else {
        setError(result.error || "Registration failed.");
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-border bg-card shadow-lg">
        <CardContent className="p-8">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-3 flex items-center gap-2">
              <UtensilsCrossed className="h-8 w-8 text-gold" />
              <span className="font-serif text-2xl font-bold text-card-foreground">
                HOMELY FOODS
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Create your account
            </p>
          </div>

          {/* Welcome Bonus Banner */}
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-gold/20 bg-gold/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15">
              <Gift className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="text-sm font-semibold text-card-foreground">
                Welcome Bonus!
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                Get <HPCoin size="sm" />{" "}
                <span className="font-semibold text-gold-dark">5 HP</span> free on signup
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-card-foreground">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-email" className="text-card-foreground">Email</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-card-foreground">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+971 50 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-background"
                autoComplete="tel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-password" className="text-card-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-card-foreground">
                Confirm Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-background"
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-gold hover:text-gold-dark"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
