"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-app-xl border border-border bg-secondary p-1 text-muted",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Tab>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Tab>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Tab
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-app-lg px-3.5 py-1.5 text-caption font-semibold transition-colors duration-150 outline-hidden select-none hover:text-foreground focus-visible:border-border-color-focus focus-visible:ring-2 focus-visible:ring-ring-color-focus disabled:pointer-events-none disabled:opacity-50 data-[selected]:bg-surface data-[selected]:text-primary data-[selected]:font-bold data-[selected]:shadow-xs",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Panel>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Panel>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Panel
    ref={ref}
    className={cn(
      "mt-3 focus-visible:border-border-color-focus focus-visible:ring-2 focus-visible:ring-ring-color-focus focus-visible:outline-hidden",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
