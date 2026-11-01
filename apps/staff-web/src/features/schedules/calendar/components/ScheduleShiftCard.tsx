"use client";

import { cn } from "@/lib/utils";
import { SCHEDULE_SHIFT_CARD_OPTIONS } from "../shiftCardOptions";
import type { ScheduleShift } from "../types/scheduleTypes";

interface ScheduleShiftCardProps {
  shift: ScheduleShift | null;
}

export function ScheduleShiftCard({ shift }: ScheduleShiftCardProps) {
  if (!shift) {
    return (
      <div className="flex w-full flex-col items-center justify-center rounded-app-md border border-border bg-secondary/30 py-3.5 text-center">
        <span className="text-label font-normal text-muted">Không có lịch</span>
      </div>
    );
  }

  const option = SCHEDULE_SHIFT_CARD_OPTIONS.find((candidate) =>
    candidate.statuses.includes(shift.shiftStatus),
  );
  if (!option) return null;

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-1 rounded-app-md border p-2 text-left",
        option.className,
      )}
    >
      <span className="flex items-center justify-between gap-1">
        <span className={cn("text-caption font-semibold", option.titleClassName)}>
          {option.getTitle(shift)}
        </span>
        {option.badge && (
          <span className={option.badge.className}>{option.badge.label}</span>
        )}
      </span>
      <span className={cn("text-caption font-normal", option.descriptionClassName)}>
        {shift.timeRange}
      </span>
    </div>
  );
}
