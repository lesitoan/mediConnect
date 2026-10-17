"use client";

import { useState, useMemo } from "react";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/Empty";
import type {
  User,
  CreateUserInput,
  UpdateUserInput,
  ToggleUserStatusInput,
} from "../types/userTypes";
import {
  createUserRecord,
  updateUserRecord,
} from "../services/usersService";
import {
  INITIAL_USERS,
  DEPARTMENTS,
  DEFAULT_FILTERS,
  type UserTableFilterValues,
} from "../constants";
import { UserHeader } from "./UserHeader";
import { UserFilters } from "./UserFilters";
import { UserTable } from "./UserTable";
import { Pagination } from "@/components/shared/Pagination";
import { AddUserModal } from "./modals/AddUserModal";
import { EditUserModal } from "./modals/EditUserModal";
import { UserStatusModal } from "./modals/UserStatusModal";
import { UserDetailsDrawer } from "./UserDetailsDrawer";
import { useTableFilters } from "@/hooks/useTableFilters";
import { useModal } from "@/hooks/useModal";

export function UserManagementView() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const { filters, setFilter, resetFilters } =
    useTableFilters<UserTableFilterValues>(DEFAULT_FILTERS);

  const addModal = useModal();
  const editModal = useModal<User>();
  const statusModal = useModal<User>();
  const drawer = useModal<User>();

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (filters.role !== "ALL") {
        if (filters.role === "ADMIN") {
          if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") return false;
        } else if (user.role !== filters.role) {
          return false;
        }
      }

      if (filters.status !== "ALL" && user.status !== filters.status) {
        return false;
      }

      if (filters.department && !user.department.includes(filters.department)) {
        return false;
      }

      if (filters.search && filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const matchName = user.name.toLowerCase().includes(query);
        const matchEmail = user.email.toLowerCase().includes(query);
        const matchPhone = user.phone.includes(query);
        const matchCode = user.code.toLowerCase().includes(query);
        return matchName || matchEmail || matchPhone || matchCode;
      }

      return true;
    });
  }, [users, filters]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / filters.pageSize)
  );
  const paginatedUsers = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.pageSize;
    return filteredUsers.slice(startIndex, startIndex + filters.pageSize);
  }, [filteredUsers, filters.page, filters.pageSize]);

  const handleAddUser = (input: CreateUserInput) => {
    const newUser = createUserRecord(input, users.length + 1);
    setUsers((prev) => [newUser, ...prev]);
    console.log(`Đã tạo thành công tài khoản cho ${newUser.name}`);
  };

  const handleSaveEditUser = (input: UpdateUserInput) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === input.id ? updateUserRecord(u, input) : u))
    );
    if (drawer.data && drawer.data.id === input.id) {
      drawer.setData((prev) =>
        prev ? updateUserRecord(prev, input) : null
      );
    }
    console.log(`Đã lưu cập nhật tài khoản ${input.name}`);
  };

  const handleConfirmToggleStatus = (input: ToggleUserStatusInput) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === input.userId ? { ...u, status: input.targetStatus } : u
      )
    );
    if (drawer.data && drawer.data.id === input.userId) {
      drawer.setData((prev) =>
        prev ? { ...prev, status: input.targetStatus } : null
      );
    }
    const actionText =
      input.targetStatus === "LOCKED" ? "Đã khóa" : "Đã mở khóa";
    console.log(`${actionText} tài khoản người dùng thành công`);
  };

  const handleExport = () => {
    //
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <UserHeader
        onExport={handleExport}
        onAddUserClick={addModal.open}
      />

      <UserFilters
        roleFilter={filters.role}
        onRoleFilterChange={(role) => setFilter("role", role)}
        statusFilter={filters.status}
        onStatusFilterChange={(status) => setFilter("status", status)}
        departmentFilter={filters.department}
        onDepartmentFilterChange={(dept) => setFilter("department", dept)}
        searchQuery={filters.search}
        onSearchChange={(q) => setFilter("search", q)}
        departments={DEPARTMENTS}
      />

      <div className="overflow-hidden rounded-app-xl border border-border-strong bg-surface shadow-xs">
        {paginatedUsers.length === 0 ? (
          <Empty
            icon={<UserX className="size-7" />}
            title="Không tìm thấy tài khoản người dùng phù hợp"
            description="Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc vai trò, trạng thái."
            action={
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={resetFilters}
                className="bg-primary text-primary-foreground hover:bg-primary-hover"
              >
                Xóa tất cả bộ lọc
              </Button>
            }
          />
        ) : (
          <>
            <UserTable
              users={paginatedUsers}
              page={filters.page}
              pageSize={filters.pageSize}
              onEditUser={(user) => editModal.open(user)}
              onToggleStatus={(user) => statusModal.open(user)}
              onViewDetails={(user) => drawer.open(user)}
            />

            <Pagination
              currentPage={filters.page}
              totalPages={totalPages}
              totalItems={filteredUsers.length}
              pageSize={filters.pageSize}
              itemName="tài khoản"
              onPageChange={(page) => setFilter("page", page)}
              onPageSizeChange={(newSize) => {
                setFilter("pageSize", newSize);
              }}
            />
          </>
        )}
      </div>

      <AddUserModal
        isOpen={addModal.isOpen}
        onClose={addModal.close}
        onSubmit={handleAddUser}
      />

      <EditUserModal
        user={editModal.data}
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        onSave={handleSaveEditUser}
      />

      <UserStatusModal
        user={statusModal.data}
        isOpen={statusModal.isOpen}
        onClose={statusModal.close}
        onConfirm={handleConfirmToggleStatus}
      />

      <UserDetailsDrawer
        user={drawer.data}
        isOpen={drawer.isOpen}
        onClose={drawer.close}
        onEdit={(user) => editModal.open(user)}
        onToggleStatus={(user) => statusModal.open(user)}
      />
    </div>
  );
}
