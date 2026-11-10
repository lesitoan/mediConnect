"use client";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/Empty";
import { Loading } from "@/components/shared/Loading";
import { Pagination } from "@/components/shared/Pagination";
import { useGetAuthUserQuery } from "@/features/auth/services/authApi";
import { useTableFilters } from "@/hooks/useTableFilters";
import { useModal } from "@/hooks/useModal";
import {
  DEFAULT_FILTERS,
  PAGE_SIZE_OPTIONS,
  type UserTableFilterValues,
} from "../constants";
import {
  userQueryParams,
  useGetUsersQuery,
  useGetUserOptionsQuery,
  exportUsers,
} from "../services/usersApi";
import { canManageUser, canChangeUserStatus, userErrorMessage } from "../utils";
import type { User } from "../types/userTypes";
import { UserHeader } from "./UserHeader";
import { UserFilters } from "./UserFilters";
import { UserTable } from "./UserTable";
import { AddUserModal } from "./modals/AddUserModal";
import { EditUserModal } from "./modals/EditUserModal";
import { UserStatusModal } from "./modals/UserStatusModal";
import { UserDetailsDrawer } from "./UserDetailsDrawer";
export function UserManagementView() {
  const [isExporting, setIsExporting] = useState(false);
  const { filters, setFilter, resetFilters } =
    useTableFilters<UserTableFilterValues>(DEFAULT_FILTERS);
  const { data: actor } = useGetAuthUserQuery();
  const hasPermission = (permission: string) =>
    actor?.role === "ADMIN" && actor.permissions.includes(permission);
  const canRead = !!hasPermission("USERS_READ"),
    canWrite = !!hasPermission("USERS_WRITE"),
    canLock = !!hasPermission("USERS_LOCK");
  const canAssignRole = !!hasPermission("USERS_ASSIGN_ROLE"),
    canEditDoctor = !!hasPermission("DOCTORS_WRITE");
  const users = useGetUsersQuery(filters, {
    skip: !canRead,
    refetchOnMountOrArgChange: true,
  });
  const options = useGetUserOptionsQuery(undefined, { skip: !canRead });
  const addModal = useModal(),
    editModal = useModal<User>(),
    statusModal = useModal<User>(),
    drawer = useModal<User>();
  const onSearchChange = useCallback(
    (value: string) => setFilter("search", value),
    [setFilter],
  );
  const query = userQueryParams(filters);
  const result = users.currentData;
  const handleExport = async () => {
    if (!canRead || isExporting) return;
    setIsExporting(true);
    try {
      await exportUsers(filters);
      toast.success("Đã xuất danh sách tài khoản CSV.");
    } catch (error) {
      toast.error(userErrorMessage(error));
    } finally {
      setIsExporting(false);
    }
  };
  if (!actor) return <Loading label="Đang kiểm tra quyền truy cập..." />;
  if (!canRead)
    return <Empty title="Bạn không có quyền xem tài khoản người dùng" />;
  return (
    <div className="mx-auto w-full max-w-7xl">
      <UserHeader
        onAddUserClick={() => addModal.open()}
        canCreate={canWrite && canAssignRole}
        onExport={handleExport}
        isExporting={isExporting}
      />
      <UserFilters
        roleFilter={query.role ?? "ALL"}
        onRoleFilterChange={(role) => setFilter("role", role)}
        statusFilter={query.status ?? "ALL"}
        onStatusFilterChange={(status) => setFilter("status", status)}
        specialtyFilter={query.specialtyId ?? ""}
        onSpecialtyFilterChange={(id) => setFilter("specialtyId", id)}
        searchQuery={filters.search}
        onSearchChange={onSearchChange}
        specialties={options.data?.specialties ?? []}
      />
      {options.isError && (
        <p role="alert" className="mb-4 text-body text-error">
          Không tải được bộ lọc chuyên khoa: {userErrorMessage(options.error)}{" "}
          <Button size="sm" variant="outline" onClick={() => options.refetch()}>
            Thử lại
          </Button>
        </p>
      )}
      <div
        className="overflow-hidden rounded-app-xl border border-border-strong bg-surface shadow-xs"
        aria-busy={users.isFetching}
      >
        {users.isFetching ? (
          <Loading
            label="Đang tải danh sách người dùng..."
            className="min-h-64"
          />
        ) : users.isError ? (
          <Empty
            role="alert"
            title="Không thể tải danh sách người dùng"
            description={userErrorMessage(users.error)}
            action={<Button onClick={() => users.refetch()}>Thử lại</Button>}
          />
        ) : !result?.data.length ? (
          <Empty
            title="Không tìm thấy tài khoản người dùng phù hợp"
            description="Thử thay đổi từ khóa hoặc bộ lọc."
            action={<Button onClick={resetFilters}>Xóa tất cả bộ lọc</Button>}
          />
        ) : (
          <UserTable
            users={result.data}
            page={query.page}
            pageSize={query.limit}
            canEdit={canWrite}
            canLock={canLock}
            onEditUser={(user) => {
              if (canWrite && canManageUser(user)) editModal.open(user);
            }}
            onToggleStatus={(user) => {
              if (canLock && canChangeUserStatus(user)) statusModal.open(user);
            }}
            onViewDetails={drawer.open}
          />
        )}
        {result && !users.isFetching && !users.isError && (
          <Pagination
            currentPage={query.page}
            totalPages={Math.max(1, result.pagination.totalPages)}
            totalItems={result.pagination.totalItems}
            pageSize={query.limit}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            itemName="tài khoản"
            onPageChange={(page) => setFilter("page", page)}
            onPageSizeChange={(size) => setFilter("pageSize", size)}
          />
        )}
      </div>
      {addModal.isOpen && canWrite && canAssignRole && (
        <AddUserModal
          isOpen
          onClose={addModal.close}
          canCreateDoctor={canEditDoctor}
        />
      )}
      {editModal.isOpen && canWrite && (
        <EditUserModal
          key={editModal.data?.id}
          user={editModal.data}
          isOpen
          onClose={editModal.close}
          canAssignRole={canAssignRole}
          canEditDoctor={canEditDoctor}
        />
      )}
      {statusModal.isOpen && canLock && (
        <UserStatusModal
          user={statusModal.data}
          isOpen
          onClose={statusModal.close}
        />
      )}
      {drawer.isOpen && (
        <UserDetailsDrawer
          user={drawer.data}
          isOpen
          onClose={drawer.close}
          canEdit={canWrite}
          canLock={canLock}
          onEdit={(user) => {
            drawer.close();
            editModal.open(user);
          }}
          onToggleStatus={(user) => {
            drawer.close();
            statusModal.open(user);
          }}
        />
      )}
    </div>
  );
}
