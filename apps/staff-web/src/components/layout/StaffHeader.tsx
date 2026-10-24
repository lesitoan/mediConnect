"use client";

import { Bell, ChevronRight, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

interface StaffHeaderProps {
  onToggleSidebar?: () => void;
}

export function StaffHeader({ onToggleSidebar }: StaffHeaderProps) {
  const pathname = usePathname();
  const pageTitle = pathname === "/exceptions" ? "Xử lý ngoại lệ" : pathname === "/queues" ? "Hàng chờ khám" : "Bác sĩ & Chuyên khoa";

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border-strong bg-surface px-4 sm:px-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.03)]">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          className="text-foreground hover:bg-item-hover lg:hidden"
          aria-label="Mở thanh điều hướng"
        >
          <Menu className="size-5" />
        </Button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-caption">
          <span className="font-medium text-muted">Tổng quan</span>
          <ChevronRight className="size-3 text-muted" />
          <span className="rounded-app-md bg-primary-light px-2.5 py-1 text-caption font-bold text-primary">
            {pageTitle}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-3.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="relative text-muted hover:text-foreground hover:bg-item-hover"
          aria-label="Thông báo hệ thống"
        >
          <Bell className="size-4" />
          <span className="absolute top-1 right-1 size-2 rounded-full bg-destructive ring-2 ring-surface" />
        </Button>

        <div className="h-5 w-px bg-border-strong" />

        <div className="flex items-center gap-2.5 rounded-app-lg border border-border bg-background/60 px-2.5 py-1">
          <div className="flex size-7.5 items-center justify-center rounded-full bg-primary text-label font-bold text-primary-foreground shadow-xs">
            KT
          </div>
          <div className="hidden flex-col text-left sm:flex">
            <span className="text-caption font-bold text-foreground leading-tight">
              BS. Nguyễn Tuấn Kiệt
            </span>
            <span className="text-label font-medium text-primary leading-tight">
              Quản trị viên
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
