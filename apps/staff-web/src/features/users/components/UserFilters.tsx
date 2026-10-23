"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type {
  UserRoleFilter,
  UserStatusFilter,
} from "../types/userTypes";

interface UserFiltersProps {
  roleFilter: UserRoleFilter;
  onRoleFilterChange: (role: UserRoleFilter) => void;
  statusFilter: UserStatusFilter;
  onStatusFilterChange: (status: UserStatusFilter) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (dept: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  departments: readonly string[];
}

export function UserFilters({
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  departmentFilter,
  onDepartmentFilterChange,
  searchQuery,
  onSearchChange,
  departments,
}: UserFiltersProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

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
        <div className="relative sm:col-span-2 md:col-span-5 lg:col-span-5">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input
            ref={searchInputRef}
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Tìm theo họ tên, email, SĐT hoặc mã TK..."
            className="h-9.5 pr-12 pl-9"
          />
          <div className="pointer-events-none absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center rounded-app-sm bg-secondary px-1.5 py-0.5 text-label font-bold text-muted">
            F2
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-2">
          <Select
            value={roleFilter}
            onChange={(e) =>
              onRoleFilterChange(e.target.value as UserRoleFilter)
            }
            className="h-9.5"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="DOCTOR">Bác sĩ</option>
            <option value="RECEPTIONIST">Lễ tân</option>
            <option value="PATIENT">Bệnh nhân</option>
          </Select>
        </div>

        <div className="md:col-span-2 lg:col-span-2">
          <Select
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(e.target.value as UserStatusFilter)
            }
            className="h-9.5"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="PENDING_OTP">Chờ OTP</option>
            <option value="LOCKED">Đã khóa</option>
          </Select>
        </div>

        <div className="sm:col-span-2 md:col-span-3 lg:col-span-3">
          <Select
            value={departmentFilter}
            onChange={(e) => onDepartmentFilterChange(e.target.value)}
            className="h-9.5"
          >
            <option value="">Tất cả khoa / bộ phận</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
