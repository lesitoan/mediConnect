"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/Empty";
import { Loading } from "@/components/shared/Loading";
import { Pagination } from "@/components/shared/Pagination";
import { useModal } from "@/hooks/useModal";
import { useTableFilters } from "@/hooks/useTableFilters";
import {
  DEFAULT_EXCEPTION_FILTERS,
  EMPTY_EXCEPTION_GROUPS,
} from "../constants";
import { useGetExceptionGroupsQuery } from "../services/exceptionsApi";
import type { ExceptionSelection } from "../types/exceptionTypes";
import { filterExceptionGroups } from "../utils";
import { ExceptionHeader } from "./ExceptionHeader";
import { ExceptionFilters } from "./ExceptionFilters";
import { ExceptionGroupCard } from "./ExceptionGroupCard";
import { ExceptionDetailsDrawer } from "./ExceptionDetailsDrawer";

export function ExceptionManagementView() {
  const {
    data: groups = EMPTY_EXCEPTION_GROUPS,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetExceptionGroupsQuery();
  const { filters, setFilter, resetFilters } = useTableFilters(
    DEFAULT_EXCEPTION_FILTERS,
  );
  const detailsDrawer = useModal<ExceptionSelection>();
  const filteredGroups = useMemo(
    () => filterExceptionGroups(groups, filters),
    [groups, filters],
  );
  const pageSize =
    Number.isFinite(filters.pageSize) && filters.pageSize > 0
      ? Math.max(1, Math.trunc(filters.pageSize))
      : DEFAULT_EXCEPTION_FILTERS.pageSize;
  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageSize));
  const currentPage = Math.min(
    totalPages,
    Math.max(1, Number.isFinite(filters.page) ? Math.trunc(filters.page) : 1),
  );
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const selectedGroup =
    groups.find((group) => group.id === detailsDrawer.data?.groupId) ?? null;
  const selectedAppointment =
    selectedGroup?.appointments.find(
      (appointment) => appointment.id === detailsDrawer.data?.appointmentId,
    ) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 pb-8">
      <ExceptionHeader
        isRefreshing={isFetching}
        onRefresh={() => void refetch()}
      />
      <ExceptionFilters
        filters={filters}
        onFilterChange={setFilter}
        onReset={resetFilters}
      />
      <div aria-busy={isFetching}>
        {isLoading ? (
          <Loading
            label="Đang tải lịch hẹn ngoại lệ..."
            className="min-h-[50vh]"
          />
        ) : isError ? (
          <Empty
            role="alert"
            className="rounded-app-xl border border-border-strong bg-surface"
            title="Không thể tải danh sách ngoại lệ"
            description="Vui lòng thử lại để cập nhật các lịch hẹn bị ảnh hưởng."
            action={
              <Button onClick={() => refetch()} disabled={isFetching}>
                Thử lại
              </Button>
            }
          />
        ) : filteredGroups.length === 0 ? (
          <Empty
            className="rounded-app-xl border border-border-strong bg-surface"
            title={
              groups.length === 0
                ? "Chưa có lịch hẹn cần điều phối"
                : "Không tìm thấy lịch hẹn phù hợp"
            }
            description="Thử thay đổi từ khóa hoặc điều chỉnh bộ lọc."
            action={
              groups.length > 0 ? (
                <Button onClick={resetFilters}>Xóa tất cả bộ lọc</Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {paginatedGroups.map((group) => (
              <ExceptionGroupCard
                key={group.id}
                group={group}
                totalAppointments={
                  groups.find((originalGroup) => originalGroup.id === group.id)
                    ?.appointments.length ?? group.appointments.length
                }
                onDetails={detailsDrawer.open}
              />
            ))}
            <div className="overflow-hidden rounded-app-xl border border-border-strong bg-surface">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredGroups.length}
                pageSize={pageSize}
                itemName="nhóm ngoại lệ"
                onPageChange={(page) => setFilter("page", page)}
                onPageSizeChange={(pageSize) => setFilter("pageSize", pageSize)}
              />
            </div>
          </div>
        )}
      </div>
      <ExceptionDetailsDrawer
        group={selectedGroup}
        appointment={selectedAppointment}
        isOpen={detailsDrawer.isOpen}
        onClose={detailsDrawer.close}
      />
    </div>
  );
}
