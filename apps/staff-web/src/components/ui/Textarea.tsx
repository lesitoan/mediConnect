import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[80px] w-full rounded-app-md border border-border-strong bg-surface px-3.5 py-2 font-sans text-body font-medium text-foreground shadow-2xs transition-all duration-150 outline-none placeholder:text-muted/70 hover:border-primary/50 hover:bg-surface-hover/50 focus:border-primary focus:ring-3 focus:ring-primary/15 focus:outline-none focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-secondary/30 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
