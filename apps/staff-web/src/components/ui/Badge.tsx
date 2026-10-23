import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-app-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "border border-border text-foreground bg-surface",
        success:
          "bg-success-bg text-success border border-success/20",
        warning:
          "bg-warning-bg text-warning border border-warning/20",
        danger:
          "bg-danger-bg text-danger border border-danger/20",
        destructive:
          "bg-destructive text-destructive-foreground",
        neutral:
          "bg-neutral-bg text-neutral border border-border",
        brand:
          "bg-brand-secondary-light text-primary",
        tertiary:
          "bg-brand-tertiary text-brand-tertiary-foreground",
      },
      shape: {
        default: "rounded-app-md",
        pill: "rounded-full",
      },
      size: {
        default: "px-2.5 py-0.5 text-label font-semibold",
        sm: "px-2 py-0.5 text-label font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      shape: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, shape, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, shape, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
