import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "success" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-[family-name:var(--font-syne)] font-semibold tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:pointer-events-none disabled:opacity-50",
          {
            // Primary
            "border border-primary/35 bg-gradient-to-br from-primary/15 to-primary/10 text-primary hover:border-primary hover:bg-primary/20 hover:shadow-[0_0_20px_var(--color-primary-glow)] hover:-translate-y-0.5":
              variant === "primary",
            // Secondary/Ghost
            "border border-card-border bg-card text-white/60 hover:border-white/15 hover:bg-card-hover hover:text-white":
              variant === "secondary" || variant === "ghost",
            // Success
            "border border-success/30 bg-success/15 text-emerald-300 hover:border-success/50 hover:bg-success/25 hover:shadow-[0_0_12px_rgba(16,185,129,0.2)]":
              variant === "success",
            // Danger
            "border border-danger/25 bg-danger/10 text-red-300 hover:border-danger/40 hover:bg-danger/20":
              variant === "danger",
          },
          {
            "px-3 py-1.5 text-xs": size === "sm",
            "px-5 py-2.5 text-sm": size === "md",
            "px-6 py-3 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
