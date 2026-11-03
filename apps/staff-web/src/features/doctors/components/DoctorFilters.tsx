"use client";
import { useEffect, useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import type { SpecialtyRecord } from "@/features/specialties/types/specialtyTypes";
import type { DoctorViewMode, MainTab } from "../types/doctorTypes";

export function DoctorFilters({
  tab,
  searchQuery,
  onSearchChange,
  specialtyId,
  onSpecialtyChange,
  viewMode,
  onViewModeChange,
  onAdd,
  specialties,
  isLoading,
}: {
  tab: MainTab;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  specialtyId: string;
  onSpecialtyChange: (value: string) => void;
  viewMode: DoctorViewMode;
  onViewModeChange: (value: DoctorViewMode) => void;
  onAdd: () => void;
  specialties: SpecialtyRecord[];
  isLoading: boolean;
}) {
  const [previousQuery, setPreviousQuery] = useState(searchQuery);
  const [search, setSearch] = useState(searchQuery);
  if (previousQuery !== searchQuery) {
    setPreviousQuery(searchQuery);
    setSearch(searchQuery);
  }
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchQuery) onSearchChange(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, searchQuery, onSearchChange]);
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-app-xl border border-border-strong bg-surface p-4 lg:flex-row lg:items-center">
      <Input
        aria-label="Tìm kiếm"
        maxLength={100}
        className="min-w-0 flex-1"
        placeholder={
          tab === "DOCTORS"
            ? "Tìm theo tên hoặc mã bác sĩ"
            : "Tìm theo tên hoặc mã chuyên khoa"
        }
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {tab === "DOCTORS" && (
        <Select
          aria-label="Lọc chuyên khoa"
          wrapperClassName="w-full lg:w-56 lg:shrink-0"
          value={specialtyId}
          onChange={(event) => onSpecialtyChange(event.target.value)}
        >
          <option value="">Tất cả chuyên khoa</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.isActive ? "" : " (Tạm dừng)"}
            </option>
          ))}
        </Select>
      )}
      <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
        {tab === "DOCTORS" && (
          <Tabs
            value={viewMode}
            onValueChange={(value) => onViewModeChange(value as DoctorViewMode)}
          >
            <TabsList aria-label="Chế độ hiển thị bác sĩ" className="h-9 p-0.5">
              <TabsTrigger
                value="GRID"
                aria-label="Hiển thị lưới"
                title="Hiển thị lưới"
                className="h-7 w-8 p-0 data-[active]:bg-surface data-[active]:text-primary data-[active]:shadow-xs"
              >
                <LayoutGrid aria-hidden="true" className="size-4" />
              </TabsTrigger>
              <TabsTrigger
                value="LIST"
                aria-label="Hiển thị danh sách"
                title="Hiển thị danh sách"
                className="h-7 w-8 p-0 data-[active]:bg-surface data-[active]:text-primary data-[active]:shadow-xs"
              >
                <List aria-hidden="true" className="size-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        <Button size="lg" onClick={onAdd} disabled={isLoading}>
          {tab === "DOCTORS" ? "Thêm bác sĩ" : "Thêm chuyên khoa"}
        </Button>
      </div>
    </div>
  );
}
