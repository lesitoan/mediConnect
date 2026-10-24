"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  DateRangePicker,
  type DateRangeValue,
} from "@/components/ui/DateRangePicker";
import {
  MAX_SCHEDULE_RANGE_DAYS,
  SCHEDULE_STATUS_OPTIONS,
} from "../constants";
import type { ScheduleTableFilterValues } from "../types/scheduleTypes";

interface ScheduleFiltersProps {
  filters: ScheduleTableFilterValues;
  specialties: string[];
  dateRange: DateRangeValue;
  onDateRangeChange: (value: DateRangeValue) => void;
  onFilterChange: <K extends keyof ScheduleTableFilterValues>(
    key: K,
    value: ScheduleTableFilterValues[K],
  ) => void;
}

export function ScheduleFilters({
  filters,
  specialties,
  dateRange,
  onDateRangeChange,
  onFilterChange,
}: ScheduleFiltersProps) {
  const { register, control, reset } = useForm<{ search: string }>({
    defaultValues: { search: filters.search },
  });
  const search = useWatch({ control, name: "search" });

  useEffect(() => {
    reset({ search: filters.search });
  }, [filters.search, reset]);

  useEffect(() => {
    if (search === filters.search) return;
    const timer = setTimeout(() => onFilterChange("search", search), 300);
    return () => clearTimeout(timer);
  }, [search, filters.search, onFilterChange]);

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-app-xl border border-border bg-surface p-3.5 shadow-2xs">
      <div className="flex flex-1 flex-wrap items-center gap-2.5 min-w-[300px]">
        <div className="relative w-60">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted" />
          <Input
            type="text"
            {...register("search")}
            placeholder="Tìm bác sĩ..."
            className="h-9 pl-8.5 text-body bg-surface"
          />
        </div>
        <div className="w-[190px]">
          <Select
            value={filters.specialty}
            onChange={(event) =>
              onFilterChange("specialty", event.target.value)
            }
            className="h-9 text-body bg-surface font-medium"
          >
            <option value="">Chuyên khoa (Tất cả)</option>
            {specialties.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-[180px]">
          <Select
            value={filters.status}
            onChange={(event) =>
              onFilterChange(
                "status",
                event.target.value as ScheduleTableFilterValues["status"],
              )
            }
            className="h-9 text-body bg-surface font-medium"
          >
            {SCHEDULE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <DateRangePicker
        value={dateRange}
        onChange={onDateRangeChange}
        maxDays={MAX_SCHEDULE_RANGE_DAYS}
      />
    </div>
  );
}
