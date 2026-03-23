import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-lg border border-card-border bg-white/5 px-4 py-2.5 text-sm text-foreground placeholder:text-white/20 transition-all",
            "focus:border-primary/40 focus:bg-white/[0.07] focus:text-white focus:outline-none focus:ring-2 focus:ring-primary/10",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
