"use client";

import * as React from "react";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface DateRange {
  from?: Date | string;
  to?: Date | string;
}

export interface CalendarProps {
  mode?: "single" | "range";
  selected?: DateRange | Date | string;
  onSelect?: (range: DateRange | undefined) => void;
  defaultMonth?: Date;
  numberOfMonths?: number;
  maxDays?: number;
  disabled?: (date: Date) => boolean;
  className?: string;
}

function parseDate(val?: Date | string | null): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const parts = val.slice(0, 10).split("-").map(Number);
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  }
  const d = new Date(val);
  return isNaN(d.getTime())
    ? null
    : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function formatDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function getDayDiff(d1: Date, d2: Date): number {
  const t1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
  const t2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
  return Math.round(Math.abs(t2 - t1) / (1000 * 60 * 60 * 24)) + 1;
}

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function Calendar({
  mode = "range",
  selected,
  onSelect,
  defaultMonth,
  numberOfMonths = 1,
  maxDays,
  disabled,
  className,
}: CalendarProps) {
  const initialFrom =
    selected && typeof selected === "object" && "from" in selected
      ? parseDate(selected.from)
      : parseDate(selected as Date | string);

  const initialTo =
    selected && typeof selected === "object" && "to" in selected
      ? parseDate(selected.to)
      : null;

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    return defaultMonth || initialFrom || new Date();
  });

  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [internalFrom, setInternalFrom] = useState<Date | null>(initialFrom);
  const [internalTo, setInternalTo] = useState<Date | null>(initialTo);

  React.useEffect(() => {
    if (selected && typeof selected === "object" && "from" in selected) {
      setInternalFrom(parseDate(selected.from));
      setInternalTo(parseDate(selected.to));
    }
  }, [selected]);

  const handlePrevMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const handleDayClick = (dayDate: Date) => {
    if (disabled && disabled(dayDate)) return;

    if (mode === "single") {
      setInternalFrom(dayDate);
      setInternalTo(null);
      onSelect?.({
        from: formatDateString(dayDate),
        to: formatDateString(dayDate),
      });
      return;
    }

    if (!internalFrom || (internalFrom && internalTo)) {
      // Start a new range
      setInternalFrom(dayDate);
      setInternalTo(null);
      onSelect?.({
        from: formatDateString(dayDate),
        to: undefined,
      });
    } else {
      if (dayDate < internalFrom) {
        setInternalFrom(dayDate);
        setInternalTo(null);
        onSelect?.({
          from: formatDateString(dayDate),
          to: undefined,
        });
      } else {
        if (maxDays && maxDays > 0) {
          const diffDays = getDayDiff(internalFrom, dayDate);
          if (diffDays > maxDays) {
            return;
          }
        }
        setInternalTo(dayDate);
        onSelect?.({
          from: formatDateString(internalFrom),
          to: formatDateString(dayDate),
        });
      }
    }
  };

  const renderMonth = (monthOffset: number) => {
    const monthDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + monthOffset,
      1
    );
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const monthName = monthDate.toLocaleDateString("vi-VN", {
      month: "long",
      year: "numeric",
    });

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: React.ReactNode[] = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
      cells.push(
        <div
          key={`prev-${i}`}
          className="flex h-8 w-8 items-center justify-center text-caption text-muted/30 select-none"
        >
          {daysInPrevMonth - i}
        </div>
      );
    }

    const today = new Date();

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day, 0, 0, 0, 0);
      const isToday = isSameDay(dayDate, today);
      const isFrom = internalFrom && isSameDay(dayDate, internalFrom);
      const isTo = internalTo && isSameDay(dayDate, internalTo);

      const isAfterMaxDays = Boolean(
        internalFrom &&
          !internalTo &&
          maxDays &&
          maxDays > 0 &&
          dayDate > internalFrom &&
          getDayDiff(internalFrom, dayDate) > maxDays
      );

      const isDayDisabled =
        Boolean(disabled && disabled(dayDate)) || isAfterMaxDays;

      let inRange = false;
      if (internalFrom && internalTo) {
        inRange = dayDate > internalFrom && dayDate < internalTo;
      } else if (internalFrom && hoverDate && !internalTo && !isAfterMaxDays) {
        if (hoverDate > internalFrom) {
          inRange = dayDate > internalFrom && dayDate <= hoverDate;
        }
      }

      const isRangeStart = Boolean(
        isFrom &&
          (internalTo ||
            (hoverDate && hoverDate > internalFrom && !isAfterMaxDays))
      );
      const isRangeEnd = Boolean(
        isTo ||
          (hoverDate &&
            isSameDay(dayDate, hoverDate) &&
            !internalTo &&
            !isAfterMaxDays)
      );
      const isSelectedDay = Boolean(isFrom || isTo);

      cells.push(
        <button
          key={`day-${day}`}
          type="button"
          disabled={isDayDisabled}
          onClick={() => !isDayDisabled && handleDayClick(dayDate)}
          onMouseEnter={() => !isDayDisabled && setHoverDate(dayDate)}
          className={cn(
            "relative flex h-8 w-8 items-center justify-center text-caption transition-colors focus-visible:outline-none",
            isDayDisabled
              ? "opacity-25 cursor-not-allowed pointer-events-none text-muted select-none"
              : "cursor-pointer",
            inRange && "bg-primary/15 text-primary",
            isRangeStart && "rounded-l-app-md",
            isRangeEnd && "rounded-r-app-md",
            isSelectedDay
              ? "bg-primary text-primary-foreground font-bold rounded-app-md shadow-xs z-10"
              : !inRange &&
                  !isDayDisabled &&
                  "hover:bg-secondary rounded-app-md text-foreground",
            isToday && !isSelectedDay && "border border-primary/40 font-semibold"
          )}
        >
          {day}
        </button>
      );
    }

    const totalRendered = cells.length;
    const remaining = (7 - (totalRendered % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      cells.push(
        <div
          key={`next-${i}`}
          className="flex h-8 w-8 items-center justify-center text-caption text-muted/30 select-none"
        >
          {i}
        </div>
      );
    }

    return (
      <div key={`month-${monthOffset}`} className="flex flex-col gap-2 p-1">
        <div className="flex items-center justify-between pb-1">
          {monthOffset === 0 ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              className="size-7"
              aria-label="Tháng trước"
            >
              <ChevronLeft className="size-4" />
            </Button>
          ) : (
            <div className="size-7" />
          )}

          <span className="text-caption font-bold capitalize text-foreground">
            {monthName}
          </span>

          {monthOffset === numberOfMonths - 1 ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="size-7"
              aria-label="Tháng sau"
            >
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <div className="size-7" />
          )}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="flex h-7 w-8 items-center justify-center text-label font-semibold text-muted"
            >
              {w}
            </div>
          ))}
        </div>

        <div
          className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center"
          onMouseLeave={() => setHoverDate(null)}
        >
          {cells}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      {Array.from({ length: numberOfMonths }).map((_, i) => renderMonth(i))}
    </div>
  );
}
