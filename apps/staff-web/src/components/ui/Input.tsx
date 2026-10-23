import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <InputPrimitive
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "flex h-9 w-full min-w-0 rounded-app-md border border-border-strong bg-surface px-3.5 py-1.5 font-sans text-body font-medium text-foreground shadow-2xs transition-all duration-150 outline-none placeholder:text-muted/70 hover:border-primary/50 hover:bg-surface-hover/50 focus:border-primary focus:ring-3 focus:ring-primary/15 focus:outline-none focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-secondary/30 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-body file:font-medium file:text-foreground",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
