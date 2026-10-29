"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { Calendar, type DateRange } from "./Calendar";
import { addCalendarDays, getVietnamDate } from "@/lib/dateUtils";

export interface DateRangeValue {
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  maxDays?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
}

function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return "";
  const parts = dateStr.slice(0, 10).split("-").map(Number);
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }
  return dateStr;
}

function getDaysCount(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  if (isNaN(start) || isNaN(end)) return 0;
  return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1);
}

export function DateRangePicker({
  value,
  onChange,
  maxDays,
  disabled = false,
  className,
  label = "",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>({
    from: value.startDate,
    to: value.endDate,
  });

  const initialRange = () => {
    let to = value.endDate;
    if (value.startDate && value.endDate && maxDays && maxDays > 0) {
      const start = new Date(value.startDate).getTime();
      const end = new Date(value.endDate).getTime();
      if (!isNaN(start) && !isNaN(end)) {
        const count = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1);
        if (count > maxDays) {
          to = addCalendarDays(value.startDate, maxDays - 1);
        }
      }
    }
    return {
      from: value.startDate,
      to,
    };
  };

  const fromStr =
    typeof tempRange.from === "string"
      ? tempRange.from
      : tempRange.from
        ? getVietnamDate(tempRange.from)
        : "";
  const toStr =
    typeof tempRange.to === "string"
      ? tempRange.to
      : tempRange.to
        ? getVietnamDate(tempRange.to)
        : "";

  const displayText =
    value.startDate && value.endDate
      ? `${formatDateDisplay(value.startDate)} - ${formatDateDisplay(value.endDate)}`
      : value.startDate
        ? formatDateDisplay(value.startDate)
        : "Pick a date range";

  const selectedDays = getDaysCount(fromStr, toStr);
  const isExceedingMaxDays = Boolean(maxDays && maxDays > 0 && selectedDays > maxDays);

  const availablePresets = useMemo(() => {
    const list = [
      { label: "7 ngày tới", days: 7 },
      { label: "14 ngày tới", days: 14 },
      { label: "30 ngày tới", days: 30 },
    ];
    if (maxDays && maxDays > 0) {
      return list.filter((p) => p.days <= maxDays);
    }
    return list;
  }, [maxDays]);

  const handleApply = () => {
    if (fromStr && toStr && !isExceedingMaxDays) {
      onChange({
        startDate: fromStr,
        endDate: toStr,
      });
      setIsOpen(false);
    }
  };

  const handlePreset = (days: number) => {
    const sStr = getVietnamDate();
    const eStr = addCalendarDays(sStr, days - 1);

    setTempRange({ from: sStr, to: eStr });
    onChange({ startDate: sStr, endDate: eStr });
    setIsOpen(false);
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-caption font-semibold text-foreground">
          {label}
        </label>
      )}

      <Popover open={isOpen} onOpenChange={(open) => { if (open) setTempRange(initialRange()); setIsOpen(open); }}>
        <PopoverTrigger
          render={(triggerProps) => (
            <Button
              {...triggerProps}
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                "h-9 w-[280px] justify-start text-left font-normal border-border bg-surface text-foreground shadow-2xs hover:bg-secondary/40 focus-visible:ring-primary",
                !value.startDate && "text-muted"
              )}
            >
              <CalendarIcon className="mr-2 size-4 text-muted shrink-0" />
              <span className="truncate">{displayText}</span>
            </Button>
          )}
        />

        <PopoverContent
          align="start"
          className="w-auto p-4 flex flex-col gap-3 shadow-modal border-border bg-surface"
        >
          {availablePresets.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2.5">
              <span className="text-label font-medium text-muted mr-1">
                Chọn nhanh:
              </span>
              {availablePresets.map((preset) => (
                <Button
                  key={preset.days}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePreset(preset.days)}
                  className="h-7 px-2 text-label"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          )}

          <Calendar
            mode="range"
            selected={tempRange}
            onSelect={(range) => {
              if (range) {
                setTempRange(range);
              }
            }}
            numberOfMonths={2}
            maxDays={maxDays}
          />

          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="text-caption text-muted">
              {fromStr && toStr ? (
                <span>
                  Đã chọn:{" "}
                  <strong
                    className={cn(
                      "font-semibold",
                      isExceedingMaxDays ? "text-danger" : "text-primary"
                    )}
                  >
                    {selectedDays} ngày
                  </strong>
                  {maxDays && ` (tối đa ${maxDays} ngày)`}
                </span>
              ) : fromStr ? (
                <span>Chọn ngày kết thúc (tối đa {maxDays} ngày)</span>
              ) : (
                <span>Chọn khoảng ngày bắt đầu & kết thúc</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8"
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={!fromStr || !toStr || isExceedingMaxDays}
                onClick={handleApply}
                className="h-8"
              >
                Áp dụng
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
