import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => {
    return (
      <div className={cn("relative w-full", wrapperClassName)}>
        <select
          ref={ref}
          className={cn(
            "flex h-9 w-full appearance-none rounded-app-md border border-input bg-surface px-3 py-1.5 pr-8 text-body text-foreground transition-colors focus-visible:border-border-color-focus focus-visible:ring-3 focus-visible:ring-ring-color-focus focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted" />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
