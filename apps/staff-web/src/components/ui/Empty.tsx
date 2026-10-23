import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

const Empty = React.forwardRef<HTMLDivElement, EmptyProps>(
  ({ className, icon, title, description, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="empty"
        className={cn(
          "flex flex-col items-center justify-center p-12 text-center",
          className
        )}
        {...props}
      >
        {children ? (
          children
        ) : (
          <>
            {icon && <EmptyMedia>{icon}</EmptyMedia>}
            {title && <EmptyTitle>{title}</EmptyTitle>}
            {description && <EmptyDescription>{description}</EmptyDescription>}
            {action && <EmptyAction>{action}</EmptyAction>}
          </>
        )}
      </div>
    );
  }
);
Empty.displayName = "Empty";

const EmptyMedia = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="empty-media"
    className={cn(
      "flex size-14 items-center justify-center rounded-full bg-secondary text-muted",
      className
    )}
    {...props}
  />
));
EmptyMedia.displayName = "EmptyMedia";

const EmptyTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    data-slot="empty-title"
    className={cn("mt-3 text-heading font-bold text-foreground", className)}
    {...props}
  />
));
EmptyTitle.displayName = "EmptyTitle";

const EmptyDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="empty-description"
    className={cn("mt-1 text-caption text-muted max-w-sm", className)}
    {...props}
  />
));
EmptyDescription.displayName = "EmptyDescription";

const EmptyAction = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="empty-action"
    className={cn("mt-4", className)}
    {...props}
  />
));
EmptyAction.displayName = "EmptyAction";

export {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyAction,
  type EmptyProps,
};
