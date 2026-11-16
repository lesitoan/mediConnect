"use client";

import { FilterSearchInput } from "@/components/shared/FilterSearchInput";
import { Select } from "@/components/ui/Select";
import type { UserRoleFilter, UserStatusFilter } from "../types/userTypes";

interface UserFiltersProps {
  roleFilter: UserRoleFilter;
  onRoleFilterChange: (role: UserRoleFilter) => void;
  statusFilter: UserStatusFilter;
  onStatusFilterChange: (status: UserStatusFilter) => void;
  specialtyFilter: string;
  onSpecialtyFilterChange: (dept: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  specialties: { id: string; name: string }[];
}

export function UserFilters({
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  specialtyFilter,
  onSpecialtyFilterChange,
  searchQuery,
  onSearchChange,
  specialties,
}: UserFiltersProps) {
  return (
    <div className="mb-4 rounded-app-xl border border-border-strong bg-surface p-4 shadow-xs">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-12">
        <div className="sm:col-span-2 md:col-span-5 lg:col-span-5">
          <FilterSearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Tìm theo họ tên, email, SĐT hoặc mã TK..."
          />
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
            <option value="PENDING_VERIFICATION">Chờ xác thực</option>
            <option value="LOCKED">Đã khóa</option>
          </Select>
        </div>

        <div className="sm:col-span-2 md:col-span-3 lg:col-span-3">
          <Select
            value={specialtyFilter}
            onChange={(e) => onSpecialtyFilterChange(e.target.value)}
            className="h-9.5"
          >
            <option value="">Tất cả chuyên khoa</option>
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
