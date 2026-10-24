"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { APPROVAL_TYPE_OPTIONS, APPROVAL_STATUS_OPTIONS } from "../constants";
import type { ApprovalTableFilterValues } from "../types/approvalTypes";

interface ScheduleApprovalFiltersProps {
  filters: ApprovalTableFilterValues;
  onFilterChange: <K extends keyof ApprovalTableFilterValues>(
    key: K,
    value: ApprovalTableFilterValues[K],
  ) => void;
}

export function ScheduleApprovalFilters({
  filters,
  onFilterChange,
}: ScheduleApprovalFiltersProps) {
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
      <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input
            type="text"
            {...register("search")}
            placeholder="Tìm bác sĩ, mã yêu cầu..."
            className="h-10 pl-9 text-body bg-surface"
          />
        </div>
        <div className="w-[200px]">
          <Select
            value={filters.type}
            onChange={(event) =>
              onFilterChange(
                "type",
                event.target.value as ApprovalTableFilterValues["type"],
              )
            }
            className="h-10 text-body bg-surface font-medium"
          >
            {APPROVAL_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
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
                event.target.value as ApprovalTableFilterValues["status"],
              )
            }
            className="h-10 text-body bg-surface font-medium"
          >
            {APPROVAL_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
