"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SPECIALTY_OPTIONS } from "../constants";
import type { ReceptionFilterTab, ReceptionStats } from "../types/receptionTypes";

interface ReceptionFiltersProps {
  statusFilter?: ReceptionFilterTab;
  onStatusFilterChange?: (status: ReceptionFilterTab) => void;
  specialtyFilter?: string;
  onSpecialtyFilterChange?: (specialty: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  stats: ReceptionStats;
  // Backward compatibility aliases
  activeTab?: ReceptionFilterTab;
  onTabChange?: (tab: ReceptionFilterTab) => void;
  selectedSpecialty?: string;
  onSpecialtyChange?: (specialty: string) => void;
  onRefresh?: () => void;
}

export function ReceptionFilters({
  statusFilter,
  onStatusFilterChange,
  specialtyFilter,
  onSpecialtyFilterChange,
  searchQuery,
  onSearchChange,
  stats,
  activeTab,
  onTabChange,
  selectedSpecialty,
  onSpecialtyChange,
}: ReceptionFiltersProps) {
  const currentStatus = statusFilter ?? activeTab ?? "ALL";
  const handleStatusChange = (status: ReceptionFilterTab) => {
    onStatusFilterChange?.(status);
    onTabChange?.(status);
  };

  const currentSpecialty = specialtyFilter ?? selectedSpecialty ?? "ALL";
  const handleSpecialtyChange = (specialty: string) => {
    onSpecialtyFilterChange?.(specialty);
    onSpecialtyChange?.(specialty);
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
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-12">
        <div className="relative sm:col-span-2 md:col-span-6 lg:col-span-6">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input
            ref={searchInputRef}
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Tìm theo tên bệnh nhân, SĐT hoặc mã BN..."
            className="h-9.5 pr-12 pl-9"
          />
          <div className="pointer-events-none absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center rounded-app-sm bg-secondary px-1.5 py-0.5 text-label font-bold text-muted">
            F2
          </div>
        </div>

        <div className="sm:col-span-1 md:col-span-3 lg:col-span-3">
          <Select
            value={currentStatus}
            onChange={(e) =>
              handleStatusChange(e.target.value as ReceptionFilterTab)
            }
            className="h-9.5"
          >
            <option value="ALL">Tất cả trạng thái ({stats.total})</option>
            <option value="WAITING_CHECKIN">
              Chờ check-in ({stats.waitingCheckIn})
            </option>
            <option value="UPCOMING">Sắp đến ({stats.upcoming})</option>
            <option value="LATE">Trễ hẹn ({stats.late})</option>
            <option value="CHECKED_IN">Đã check-in ({stats.checkedIn})</option>
          </Select>
        </div>

        <div className="sm:col-span-1 md:col-span-3 lg:col-span-3">
          <Select
            value={currentSpecialty}
            onChange={(e) => handleSpecialtyChange(e.target.value)}
            className="h-9.5"
          >
            <option value="ALL">Tất cả chuyên khoa</option>
            {SPECIALTY_OPTIONS.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
