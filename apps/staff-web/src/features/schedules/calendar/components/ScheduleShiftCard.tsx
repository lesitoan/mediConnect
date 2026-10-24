"use client";

import { cn } from "@/lib/utils";
import { SCHEDULE_SHIFT_CARD_OPTIONS } from "../shiftCardOptions";
import type {
  ScheduleShift,
  ScheduleShiftCardOption,
} from "../types/scheduleTypes";

interface ScheduleShiftCardProps {
  shift: ScheduleShift | null;
  options?: readonly ScheduleShiftCardOption[];
  onResolveConflict?: (shift: ScheduleShift) => void;
  onViewPendingRequest?: (shift: ScheduleShift) => void;
}

export function ScheduleShiftCard({
  shift,
  options = SCHEDULE_SHIFT_CARD_OPTIONS,
  onResolveConflict,
  onViewPendingRequest,
}: ScheduleShiftCardProps) {
  if (!shift) {
    return (
      <div className="flex w-full flex-col items-center justify-center rounded-app-md border border-border bg-secondary/30 py-3.5 text-center">
        <span className="text-label font-normal text-muted">Không có ca</span>
      </div>
    );
  }

  const option =
    options.find((option) => option.statuses?.includes(shift.shiftStatus)) ??
    options.find((option) => option.shiftTypes?.includes(shift.shiftType));
  if (!option) return null;

  const content = option.getContent(shift);
  const isCardAction = option.action?.placement === "CARD";
  const Card = isCardAction ? "button" : "div";
  const handleAction = () => {
    if (option.action?.type === "RESOLVE_CONFLICT") onResolveConflict?.(shift);
    if (option.action?.type === "VIEW_PENDING_REQUEST")
      onViewPendingRequest?.(shift);
  };
  const indicator = option.indicatorClassName && (
    <span
      className={cn(
        "inline-block size-1.5 shrink-0 rounded-full",
        option.indicatorClassName,
      )}
    />
  );

  return (
    <Card
      type={isCardAction ? "button" : undefined}
      onClick={isCardAction ? handleAction : undefined}
      className={cn(
        "flex w-full flex-col gap-0.5 rounded-app-md border p-2 text-left",
        option.className,
      )}
    >
      <span className="flex items-center justify-between gap-1">
        <span className="flex items-center gap-1">
          {option.indicatorPosition === "START" && indicator}
          <span
            className={cn("text-caption font-semibold", option.titleClassName)}
          >
            {content.title}
          </span>
        </span>
        {option.action?.placement === "HEADER" ? (
          <button
            type="button"
            onClick={handleAction}
            className={option.action.className}
          >
            {option.action.label}
          </button>
        ) : option.badge ? (
          <span className={option.badge.className}>{option.badge.label}</span>
        ) : (
          option.indicatorPosition !== "START" && indicator
        )}
      </span>
      <span
        className={cn("text-caption font-normal", option.descriptionClassName)}
      >
        {content.description}
      </span>
      <span
        className={cn("pt-0.5 text-caption font-normal", option.noteClassName)}
      >
        {content.note}
      </span>
    </Card>
  );
}
