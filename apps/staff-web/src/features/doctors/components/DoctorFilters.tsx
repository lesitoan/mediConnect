"use client";

import { Search, LayoutGrid, List, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import type {
  DoctorStatusFilter,
  DoctorViewMode,
  Specialty,
} from "../types/doctorTypes";

interface DoctorFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSpecialty: string;
  onSpecialtyChange: (specialty: string) => void;
  statusFilter: DoctorStatusFilter;
  onStatusFilterChange: (status: DoctorStatusFilter) => void;
  viewMode: DoctorViewMode;
  onViewModeChange: (mode: DoctorViewMode) => void;
  onAddDoctorClick: () => void;
  specialties: Specialty[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
}

export function DoctorFilters({
  searchQuery,
  onSearchChange,
  selectedSpecialty,
  onSpecialtyChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  onAddDoctorClick,
  specialties,
  totalCount,
  activeCount,
  inactiveCount,
}: DoctorFiltersProps) {
  return (
    <div className="mb-4 space-y-2.5 rounded-app-xl border border-border-strong bg-surface p-3.5 shadow-xs">
      <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên, mã bác sĩ, CCHN..."
            className="h-8.5 pl-8.5 text-body bg-surface border-input"
          />
        </div>

        <div className="w-full md:w-[240px]">
          <Select
            value={selectedSpecialty}
            onChange={(e) => onSpecialtyChange(e.target.value)}
            className="h-8.5 text-body bg-surface border-input font-medium"
          >
            <option value="">Chuyên khoa: Tất cả</option>
            {specialties.map((spec) => (
              <option key={spec.id} value={spec.name}>
                {spec.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 pt-0.5 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={statusFilter}
          onValueChange={(val) => onStatusFilterChange(val as DoctorStatusFilter)}
        >
          <TabsList className="rounded-app-md border-border-strong/50 bg-secondary/80 p-0.5 shadow-xs">
            <TabsTrigger
              value="ALL"
              className="rounded-app-sm px-3 py-1.5 text-body font-semibold data-[selected]:font-bold data-[selected]:text-primary"
            >
              <span className="tabular-nums">Tất cả ({totalCount})</span>
            </TabsTrigger>
            <TabsTrigger
              value="ACTIVE"
              className="rounded-app-sm px-3 py-1.5 text-body font-semibold data-[selected]:font-bold data-[selected]:text-primary"
            >
              <span className="tabular-nums">Đang hoạt động ({activeCount})</span>
            </TabsTrigger>
            <TabsTrigger
              value="INACTIVE"
              className="rounded-app-sm px-3 py-1.5 text-body font-semibold data-[selected]:font-bold data-[selected]:text-primary"
            >
              <span className="tabular-nums">Đã vô hiệu hóa ({inactiveCount})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Tabs
            value={viewMode}
            onValueChange={(val) => onViewModeChange(val as DoctorViewMode)}
          >
            <TabsList className="rounded-app-md border-border-strong/50 bg-secondary/80 p-0.5 shadow-xs">
              <TabsTrigger
                value="GRID"
                className="size-7 p-0 rounded-app-sm text-muted data-[selected]:bg-surface data-[selected]:text-primary"
                aria-label="Chế độ xem lưới"
              >
                <LayoutGrid className="size-3.5" />
              </TabsTrigger>
              <TabsTrigger
                value="LIST"
                className="size-7 p-0 rounded-app-sm text-muted data-[selected]:bg-surface data-[selected]:text-primary"
                aria-label="Chế độ xem danh sách"
              >
                <List className="size-3.5" />
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onAddDoctorClick}
            className="h-8.5 gap-1.5 px-3.5 text-base font-semibold shadow-xs"
          >
            <UserPlus className="size-3.5" />
            <span>+ Thêm bác sĩ</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
