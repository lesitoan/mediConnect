"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuditLogHeaderProps {
  onExport?: () => void;
}

export function AuditLogHeader({ onExport }: AuditLogHeaderProps) {
  return (
    <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-display font-bold tracking-tight text-foreground">
          Nhật ký hệ thống
        </h1>
        <p className="text-body text-muted">
          Tra cứu lịch sử hoạt động và thay đổi dữ liệu trong hệ thống
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExport}
          className="h-9 gap-2 border-border-strong bg-surface px-3.5 text-body font-semibold text-foreground shadow-xs hover:bg-item-hover"
        >
          <Download className="size-4" />
          <span>Xuất báo cáo</span>
        </Button>
      </div>
    </div>
  );
}
