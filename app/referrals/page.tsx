"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Gift,
  Copy,
  Share2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/data/store";
import { getUserReferralCode, getReferrals, getReferralStats } from "@/lib/data/storage";
import { HPCoin } from "@/components/hp-coin";
import { cn } from "@/lib/utils";
import type { Referral } from "@/lib/data/types";
import { toast } from "sonner";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ReferralCard({ referral }: { referral: Referral }) {
  const isCompleted = referral.status === "completed";

  return (
    <Card className="border-border bg-card">
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            isCompleted ? "bg-green/10" : "bg-amber-100"
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-green" />
          ) : (
            <Clock className="h-5 w-5 text-amber-600" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            Referral {isCompleted ? "Completed" : "Pending"}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(referral.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            <HPCoin size="sm" />
            <span className="font-bold text-green">+{referral.hpAwarded}</span>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              isCompleted ? "text-green border-green/20" : "text-amber-600 border-amber-200"
            )}
          >
            {isCompleted ? "Awarded" : "Pending"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReferralsPage() {
  const { user } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const referralCode = useMemo(() => {
    if (!mounted || !user) return "";
    return getUserReferralCode(user.id);
  }, [mounted, user]);

  const referrals = useMemo(() => {
    if (!mounted || !user) return [];
    return getReferrals(user.id);
  }, [mounted, user]);

  const stats = useMemo(() => {
    if (!mounted || !user) return { totalReferrals: 0, totalHPEarned: 0 };
    return getReferralStats(user.id);
  }, [mounted, user]);

  const referralLink = mounted && typeof window !== "undefined"
    ? `${window.location.origin}/register?ref=${referralCode}`
    : "";

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Homely Foods!",
          text: `Use my referral code ${referralCode} to get 10 bonus HomelyPoints when you sign up!`,
          url: referralLink,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopy(referralLink, "Link");
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gold/10">
          <Users className="h-8 w-8 text-gold" />
        </div>
        <h2 className="mb-1 font-serif text-2xl font-bold text-foreground">
          Sign in to refer friends
        </h2>
        <p className="mb-6 text-muted-foreground">
          Earn HomelyPoints when your friends join and order.
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
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-7 w-7 text-gold" />
            <h1 className="font-serif text-3xl font-bold text-foreground">
              Refer Friends
            </h1>
          </div>
          <p className="text-muted-foreground">
            Share your referral code and earn 10 HP when your friends sign up and place their first order
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                  <Users className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Referrals</p>
                  <p className="font-serif text-2xl font-bold text-foreground">
                    {stats.totalReferrals}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green/10">
                  <Gift className="h-5 w-5 text-green" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">HP Earned</p>
                  <p className="font-serif text-2xl font-bold text-foreground">
                    {stats.totalHPEarned}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gold/30 bg-gold/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <HPCoin size="lg" />
                <div>
                  <p className="text-xs text-muted-foreground">Per Referral</p>
                  <p className="font-serif text-2xl font-bold text-foreground">
                    +10 HP
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Code Card */}
        <Card className="mb-8 border-gold/20 bg-card overflow-hidden">
          <div className="bg-gold/5 px-6 py-4">
            <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-foreground">
              <Sparkles className="h-5 w-5 text-gold" />
              Your Referral Code
            </h2>
          </div>
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 rounded-lg border-2 border-dashed border-gold/30 bg-gold/5 px-4 py-3 text-center">
                  <span className="font-mono text-2xl font-bold tracking-wider text-foreground">
                    {referralCode}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(referralCode, "Code")}
                  className="h-12 w-12 shrink-0"
                >
                  {copied ? (
                    <CheckCircle2 className="h-5 w-5 text-green" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-foreground">Share Link</p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={referralLink}
                  className="bg-muted text-sm"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(referralLink, "Link")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              onClick={handleShare}
              className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share with Friends
            </Button>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Share Your Code",
                  description: "Send your unique referral code or link to friends",
                },
                {
                  step: "2",
                  title: "Friend Signs Up",
                  description: "They create an account using your referral code",
                },
                {
                  step: "3",
                  title: "Both Earn HP",
                  description: "You get 10 HP, they get 10 bonus HP to start!",
                },
              ].map((item, idx) => (
                <div key={item.step} className="relative flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-lg font-bold text-gold">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  {idx < 2 && (
                    <ArrowRight className="absolute right-0 top-3 hidden h-4 w-4 text-muted-foreground sm:block" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Referral History */}
        <div>
          <h2 className="mb-4 font-serif text-xl font-bold text-foreground">
            Referral History
          </h2>

          {referrals.length === 0 ? (
            <Card className="border-dashed border-border bg-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">No referrals yet</p>
                <p className="mb-4 text-xs text-muted-foreground">
                  Share your code to start earning HP
                </p>
                <Button
                  onClick={handleShare}
                  className="bg-gold text-primary-foreground hover:bg-gold-dark"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <ReferralCard key={referral.id} referral={referral} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
