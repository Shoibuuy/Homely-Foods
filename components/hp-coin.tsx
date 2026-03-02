"use client";

import { cn } from "@/lib/utils";

interface HPCoinProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  animated?: boolean;
}

const sizeMap = {
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-10 w-10",
};

const fontSizeMap = {
  sm: "text-[6px]",
  md: "text-[8px]",
  lg: "text-[11px]",
};

export function HPCoin({ size = "md", className, animated = false }: HPCoinProps) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full bg-linear-to-br from-gold-light via-gold to-gold-dark shadow-sm",
        sizeMap[size],
        animated && "animate-bounce",
        className
      )}
      aria-hidden="true"
    >
      <span
        className={cn(
          "font-sans font-bold tracking-tight text-primary-foreground",
          fontSizeMap[size]
        )}
      >
        HP
      </span>
      {/* Shine effect */}
      <div className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-tr from-transparent via-white/30 to-transparent" />
    </div>
  );
}

interface HPBadgeProps {
  amount: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export function HPBadge({ amount, size = "sm", className, label }: HPBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5",
        className
      )}
    >
      <HPCoin size={size} />
      <span className="text-xs font-semibold text-gold-dark">
        {amount > 0 ? `+${amount}` : amount}
        {label ? ` ${label}` : ""}
      </span>
    </div>
  );
}
