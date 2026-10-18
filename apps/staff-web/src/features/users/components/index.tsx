"use client";

import { useMemo } from "react";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/Empty";
import type { User } from "../types/userTypes";
import { useGetUsersQuery } from "../services/usersApi";
import {
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
import { DeleteUserModal } from "./modals/DeleteUserModal";
import { UserDetailsDrawer } from "./UserDetailsDrawer";
import { useTableFilters } from "@/hooks/useTableFilters";
import { useModal } from "@/hooks/useModal";

const EMPTY_USERS: User[] = [];

export function UserManagementView() {
  const {
    data: users = EMPTY_USERS,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetUsersQuery();
  const { filters, setFilter, resetFilters } =
    useTableFilters<UserTableFilterValues>(DEFAULT_FILTERS);

  const addModal = useModal();
  const editModal = useModal<User>();
  const statusModal = useModal<User>();
  const deleteModal = useModal<User>();
  const drawer = useModal<User>();

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (filters.role !== "ALL") {
        if (filters.role === "ADMIN") {
          if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")
            return false;
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
    Math.ceil(filteredUsers.length / filters.pageSize),
  );
  const paginatedUsers = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.pageSize;
    return filteredUsers.slice(startIndex, startIndex + filters.pageSize);
  }, [filteredUsers, filters.page, filters.pageSize]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <UserHeader
        onAddUserClick={() => addModal.open()}
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

      <div
        className="overflow-hidden rounded-app-xl border border-border-strong bg-surface shadow-xs"
        aria-busy={isFetching}
      >
        {isLoading ? (
          <p role="status" className="p-12 text-center text-muted">
            Đang tải danh sách người dùng...
          </p>
        ) : isError ? (
          <Empty
            role="alert"
            title="Không thể tải danh sách người dùng"
            description="Vui lòng thử lại."
            action={
              <Button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {isFetching ? "Đang tải lại..." : "Thử lại"}
              </Button>
            }
          />
        ) : paginatedUsers.length === 0 ? (
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
              onDeleteUser={(user) => deleteModal.open(user)}
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
      />

      <EditUserModal
        user={editModal.data}
        isOpen={editModal.isOpen}
        onClose={editModal.close}
      />

      <UserStatusModal
        user={statusModal.data}
        isOpen={statusModal.isOpen}
        onClose={statusModal.close}
      />

      <DeleteUserModal
        user={deleteModal.data}
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
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
