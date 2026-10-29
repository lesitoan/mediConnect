"use client";


import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/button";
import {
  DateRangePicker,
  type DateRangeValue,
} from "@/components/ui/DateRangePicker";
import { cn } from "@/lib/utils";
import type { AuditLogPreset } from "../types/auditLogTypes";
import type { FilterOption } from "../services/auditLogsApi";

interface AuditLogFiltersProps {
  dateRange: DateRangeValue;
  onDateRangeChange: (val: DateRangeValue) => void;
  preset: AuditLogPreset | "";
  onPresetChange: (preset: AuditLogPreset) => void;
  executor: string;
  onExecutorChange: (val: string) => void;
  actionType: string;
  onActionTypeChange: (val: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  onAdvancedFilterClick?: () => void;
  executorOptions: FilterOption[];
  actionOptions: FilterOption[];
}

const PRESET_OPTIONS: { id: AuditLogPreset; label: string }[] = [
  { id: "TODAY", label: "Hôm nay" },
  { id: "7_DAYS", label: "7 ngày" },
  { id: "30_DAYS", label: "30 ngày" },
  { id: "THIS_MONTH", label: "Tháng này" },
];

export function AuditLogFilters({
  dateRange,
  onDateRangeChange,
  preset,
  onPresetChange,
  executor,
  onExecutorChange,
  actionType,
  onActionTypeChange,
  search,
  onSearchChange,
  onAdvancedFilterClick,
  executorOptions,
  actionOptions,
}: AuditLogFiltersProps) {
  return (
    <div className="mb-4 rounded-app-xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Row 1 - Col 1: Khoảng thời gian */}
        <div className="space-y-1.5">
          <label className="text-caption font-semibold text-muted">
            Khoảng thời gian
          </label>
          <DateRangePicker
            value={dateRange}
            onChange={onDateRangeChange}
          />
        </div>

        {/* Row 1 - Col 2: Người thực hiện */}
        <div className="space-y-1.5">
          <label className="text-caption font-semibold text-muted">
            Người thực hiện
          </label>
          <Select
            value={executor}
            onChange={(e) => onExecutorChange(e.target.value)}
            className="h-10 text-body font-medium"
          >
            {[{ value: "ALL", label: "Tất cả" }, ...executorOptions].map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Row 2 - Col 1: Loại hành động */}
        <div className="space-y-1.5">
          <label className="text-caption font-semibold text-muted">
            Loại hành động
          </label>
          <Select
            value={actionType}
            onChange={(e) => onActionTypeChange(e.target.value)}
            className="h-10 text-body font-medium"
          >
            {[{ value: "ALL", label: "Tất cả" }, ...actionOptions].map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Row 2 - Col 2: Tìm kiếm */}
        <div className="space-y-1.5">
          <label className="text-caption font-semibold text-muted">
            Tìm kiếm
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <Input
              type="text"
              value={search}
              maxLength={200}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tên người, hành động hoặc ID đối tượng..."
              className="h-10 pl-9.5 text-body"
            />
          </div>
        </div>
      </div>

      {/* Row 3: Presets & Advanced Filter */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_OPTIONS.map((item) => {
            const isActive = preset === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPresetChange(item.id)}
                className={cn(
                  "rounded-app-lg px-3.5 py-1.5 text-caption transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary font-bold text-primary-foreground shadow-xs"
                    : "border border-border bg-surface font-medium text-foreground hover:bg-item-hover hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Advanced Filter */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdvancedFilterClick}
          disabled={!onAdvancedFilterClick}
          className="h-8 gap-1.5 rounded-app-lg border-border bg-surface px-3 text-caption font-semibold text-primary hover:bg-item-hover hover:text-primary-hover shadow-xs"
        >
          <SlidersHorizontal className="size-3.5" />
          <span>Lọc nâng cao</span>
        </Button>
      </div>
    </div>
  );
}
