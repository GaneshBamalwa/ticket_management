import { cn } from "@/lib/utils";
import { forwardRef, type SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, children, ...props }, ref) => {
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
        <select
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-lg border border-card-border bg-white/5 px-4 py-2.5 text-sm text-foreground transition-all",
            "focus:border-primary/40 focus:bg-white/[0.07] focus:text-white focus:outline-none focus:ring-2 focus:ring-primary/10",
            "[&>option]:bg-background-mid [&>option]:text-foreground",
            className
          )}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);

Select.displayName = "Select";
