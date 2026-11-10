"use client";

import { Download, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserHeaderProps {
  onAddUserClick: () => void;
  canCreate: boolean;
  onExport: () => void;
  isExporting: boolean;
}

export function UserHeader({
  onAddUserClick,
  canCreate,
  onExport,
  isExporting,
}: UserHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-display font-bold tracking-tight text-foreground">
          Quản lý tài khoản người dùng
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onExport}
          disabled={isExporting}
          aria-busy={isExporting}
          title="Xuất CSV toàn bộ tài khoản khớp bộ lọc hiện tại"
          className="h-9 gap-2 rounded-app-lg border-border-strong bg-surface px-4 text-body font-semibold text-foreground shadow-xs hover:bg-surface-hover"
        >
          <Download className="size-3.5 text-muted" />
          <span>{isExporting ? "Đang xuất..." : "Xuất dữ liệu"}</span>
        </Button>

        <Button
          type="button"
          onClick={onAddUserClick}
          disabled={!canCreate}
          className="h-9 gap-2 rounded-app-lg bg-primary px-5 text-body font-semibold text-primary-foreground shadow-xs hover:bg-primary-hover"
        >
          <UserPlus className="size-4" />
          <span>Tạo tài khoản mới</span>
        </Button>
      </div>
    </div>
  );
}
