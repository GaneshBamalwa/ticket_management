import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "high" | "medium" | "low" | "open" | "resolved";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium",
        {
          "border-card-border bg-card text-foreground": variant === "default",
          "border-danger/25 bg-danger/15 text-red-300": variant === "high",
          "border-warning/25 bg-warning/15 text-yellow-300": variant === "medium",
          "border-success/25 bg-success/15 text-emerald-300": variant === "low",
          "border-primary/20 bg-primary/10 text-primary": variant === "open",
          "border-muted/20 bg-muted/15 text-muted": variant === "resolved",
        },
        className
      )}
      {...props}
    />
  );
}
