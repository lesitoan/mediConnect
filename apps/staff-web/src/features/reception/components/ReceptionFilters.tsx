"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type {
  ReceptionFilterTab,
  ReceptionStats,
  SpecialtyOption,
} from "../types/receptionTypes";

interface ReceptionFiltersProps {
  statusFilter: ReceptionFilterTab;
  onStatusFilterChange: (status: ReceptionFilterTab) => void;
  specialtyFilter: string;
  onSpecialtyFilterChange: (specialty: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  specialties: SpecialtyOption[];
  stats: ReceptionStats;
}

export function ReceptionFilters({
  statusFilter,
  onStatusFilterChange,
  specialtyFilter,
  onSpecialtyFilterChange,
  searchQuery,
  onSearchChange,
  specialties,
  stats,
}: ReceptionFiltersProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = window.setTimeout(() => setLocalSearch(searchQuery), 0);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (localSearch !== searchQuery) onSearchChange(localSearch);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [localSearch, onSearchChange, searchQuery]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F2") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="mb-4 rounded-app-xl border border-border-strong bg-surface p-4 shadow-xs">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-12">
        <div className="relative sm:col-span-2 md:col-span-6">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input
            ref={searchInputRef}
            type="text"
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            placeholder="Tìm theo tên bệnh nhân, SĐT hoặc mã..."
            className="h-9.5 pr-12 pl-9"
          />
          <div className="pointer-events-none absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center rounded-app-sm bg-secondary px-1.5 py-0.5 text-label font-bold text-muted">
            F2
          </div>
        </div>
        <div className="sm:col-span-1 md:col-span-3">
          <Select
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange(event.target.value as ReceptionFilterTab)
            }
            className="h-9.5"
          >
            <option value="ALL">Tất cả trạng thái ({stats.total})</option>
            <option value="WAITING_CHECKIN">
              Chờ check-in ({stats.waitingCheckIn})
            </option>
            <option value="LATE">Trễ hẹn ({stats.late})</option>
            <option value="CHECKED_IN">Đã check-in ({stats.checkedIn})</option>
          </Select>
        </div>
        <div className="sm:col-span-1 md:col-span-3">
          <Select
            value={specialtyFilter}
            onChange={(event) => onSpecialtyFilterChange(event.target.value)}
            className="h-9.5"
          >
            <option value="ALL">Tất cả chuyên khoa</option>
            {specialties.map((specialty) => (
              <option key={specialty.id} value={specialty.id}>
                {specialty.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
