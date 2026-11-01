"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScheduleCalendarHeaderProps {
  isBusy?: boolean;
  onExport: () => void;
}

export function ScheduleCalendarHeader({
  isBusy = false,
  onExport,
}: ScheduleCalendarHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-display font-bold tracking-tight text-foreground">
          Lịch làm việc
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onExport}
          disabled={isBusy}
          className="h-9 gap-2 rounded-app-lg border-border-strong bg-surface px-4 text-body font-semibold text-foreground shadow-xs hover:bg-surface-hover"
        >
          <Download className="size-3.5 text-muted" />
          <span>Xuất Excel / PDF</span>
        </Button>

      </div>
    </div>
  );
}
