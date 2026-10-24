"use client";

import { useEffect, useId } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/button";
import {
  EXCEPTION_SEARCH_DEBOUNCE_MS,
  EXCEPTION_STATUS_OPTIONS,
} from "../constants";
import type { ExceptionFilterValues } from "../types/exceptionTypes";

interface ExceptionFiltersProps {
  filters: ExceptionFilterValues;
  onFilterChange: <K extends keyof ExceptionFilterValues>(
    key: K,
    value: ExceptionFilterValues[K],
  ) => void;
  onReset: () => void;
}

export function ExceptionFilters({
  filters,
  onFilterChange,
  onReset,
}: ExceptionFiltersProps) {
  const id = useId();
  const { register, control, reset } = useForm<{ search: string }>({
    defaultValues: { search: filters.search },
  });
  const search = useWatch({ control, name: "search" });
  const hasFilters = Boolean(
    filters.search || filters.status !== "ALL" || filters.urgency !== "ALL",
  );

  useEffect(() => {
    reset({ search: filters.search });
  }, [filters.search, reset]);
  useEffect(() => {
    if (search === filters.search) return;
    const timer = setTimeout(
      () => onFilterChange("search", search),
      EXCEPTION_SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [search, filters.search, onFilterChange]);

  return (
    <div
      role="search"
      aria-label="Lọc lịch hẹn ngoại lệ"
      className="flex flex-wrap gap-3 rounded-app-xl border border-border-strong bg-surface p-4 shadow-xs"
    >
      <div className="min-w-0 flex-[1_1_260px]">
        <label htmlFor={`${id}-search`} className="sr-only">
          Tìm bệnh nhân hoặc mã lịch hẹn
        </label>
        <Input
          id={`${id}-search`}
          type="search"
          {...register("search")}
          placeholder="Tìm bệnh nhân, mã lịch hẹn..."
          className="h-9.5"
        />
      </div>
      <div
        role="group"
        aria-label="Trạng thái"
        className="flex-[1_1_190px] sm:max-w-[220px]"
      >
        <Select
          name="status"
          value={filters.status}
          className="h-9.5"
          onChange={(event) =>
            onFilterChange(
              "status",
              event.target.value as ExceptionFilterValues["status"],
            )
          }
        >
          <option value="ALL">Tất cả trạng thái</option>
          {EXCEPTION_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <div
        role="group"
        aria-label="Mức độ ưu tiên"
        className="flex-[1_1_170px] sm:max-w-[190px]"
      >
        <Select
          name="urgency"
          value={filters.urgency}
          className="h-9.5"
          onChange={(event) =>
            onFilterChange(
              "urgency",
              event.target.value as ExceptionFilterValues["urgency"],
            )
          }
        >
          <option value="ALL">Tất cả mức độ</option>
          <option value="URGENT">Khẩn cấp</option>
          <option value="PLANNED">Có kế hoạch</option>
        </Select>
      </div>
      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          className="h-9.5 text-body"
          onClick={onReset}
        >
          Xóa bộ lọc
        </Button>
      )}
    </div>
  );
}
