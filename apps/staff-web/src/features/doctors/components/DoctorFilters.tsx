"use client";

import { useState, useEffect, useRef } from "react";
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
  statusFilter: DoctorStatusFilter;
  onStatusFilterChange: (status: DoctorStatusFilter) => void;
  specialties: Specialty[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  viewMode: DoctorViewMode;
  onViewModeChange: (mode: DoctorViewMode) => void;
  onAddDoctorClick: () => void;
  selectedSpecialty?: string;
  onSpecialtyChange?: (specialty: string) => void;
  specialtyFilter?: string;
  onSpecialtyFilterChange?: (specialty: string) => void;
}

export function DoctorFilters({
  searchQuery,
  onSearchChange,
  selectedSpecialty,
  onSpecialtyChange,
  specialtyFilter,
  onSpecialtyFilterChange,
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
  const currentSpecialty = specialtyFilter ?? selectedSpecialty ?? "";
  const handleSpecialtyChange = (spec: string) => {
    onSpecialtyFilterChange?.(spec);
    onSpecialtyChange?.(spec);
  };

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery);
    setLocalSearch(searchQuery);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, onSearchChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="mb-4 rounded-app-xl border border-border-strong bg-surface p-4 shadow-xs">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-12 lg:grid-cols-12">
        <div className="relative sm:col-span-2 md:col-span-6 lg:col-span-4">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input
            ref={searchInputRef}
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Tìm theo tên, mã bác sĩ, CCHN..."
            className="h-9.5 pr-12 pl-9"
          />
          <div className="pointer-events-none absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center rounded-app-sm bg-secondary px-1.5 py-0.5 text-label font-bold text-muted">
            F2
          </div>
        </div>

        <div className="sm:col-span-1 md:col-span-3 lg:col-span-3">
          <Select
            value={currentSpecialty}
            onChange={(e) => handleSpecialtyChange(e.target.value)}
            className="h-9.5"
          >
            <option value="">Tất cả chuyên khoa</option>
            {specialties.map((spec) => (
              <option key={spec.id} value={spec.name}>
                {spec.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="sm:col-span-1 md:col-span-3 lg:col-span-2">
          <Select
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(e.target.value as DoctorStatusFilter)
            }
            className="h-9.5"
          >
            <option value="ALL">Tất cả trạng thái ({totalCount})</option>
            <option value="ACTIVE">Đang hoạt động ({activeCount})</option>
            <option value="INACTIVE">Tạm dừng hoạt động ({inactiveCount})</option>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-2 sm:col-span-2 sm:justify-end md:col-span-12 lg:col-span-3">
          <Tabs
            value={viewMode}
            onValueChange={(val) => onViewModeChange(val as DoctorViewMode)}
          >
            <TabsList className="h-9.5 rounded-app-md border-border-strong/50 bg-secondary/80 p-0.5 shadow-xs">
              <TabsTrigger
                value="GRID"
                className="size-8 p-0 rounded-app-sm text-muted data-[selected]:bg-surface data-[selected]:text-primary"
                aria-label="Chế độ xem lưới"
              >
                <LayoutGrid className="size-4" />
              </TabsTrigger>
              <TabsTrigger
                value="LIST"
                className="size-8 p-0 rounded-app-sm text-muted data-[selected]:bg-surface data-[selected]:text-primary"
                aria-label="Chế độ xem danh sách"
              >
                <List className="size-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onAddDoctorClick}
            className="h-9.5 gap-1.5 px-3.5 text-base font-semibold shadow-xs"
          >
            <UserPlus className="size-4" />
            <span>Thêm bác sĩ</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
