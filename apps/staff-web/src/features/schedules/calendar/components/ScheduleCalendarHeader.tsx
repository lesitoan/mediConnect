"use client";

import { Download, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScheduleCalendarHeaderProps {
  dayCount?: number;
  totalShifts?: number;
  conflictCount?: number;
  draftCount?: number;
  isBusy?: boolean;
  onExport: () => void;
  onOpenPublishModal: () => void;
  onOpenCreateModal: () => void;
  onOpenConflictModal?: () => void;
}

export function ScheduleCalendarHeader({
  draftCount = 0,
  isBusy = false,
  onExport,
  onOpenPublishModal,
  onOpenCreateModal,
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

        <Button
          type="button"
          variant="outline"
          onClick={onOpenPublishModal}
          disabled={isBusy || draftCount === 0}
          className="h-9 gap-2 rounded-app-lg border-border-strong bg-surface px-4 text-body font-semibold text-foreground shadow-xs hover:bg-surface-hover"
        >
          <Upload className="size-3.5 text-muted" />
          <span>Công bố lịch</span>
        </Button>

        <Button
          type="button"
          onClick={onOpenCreateModal}
          disabled={isBusy}
          className="h-9 gap-2 rounded-app-lg bg-primary px-5 text-body font-semibold text-primary-foreground shadow-xs hover:bg-primary-hover"
        >
          <Plus className="size-4" />
          <span>+ Xếp lịch mới</span>
        </Button>
      </div>
    </div>
  );
}
