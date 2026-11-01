"use client";

import { useMemo } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/Empty";
import { Loading } from "@/components/shared/Loading";
import { Pagination } from "@/components/shared/Pagination";
import { useTableFilters } from "@/hooks/useTableFilters";
import { DEFAULT_FILTERS } from "../constants";
import { useGetAuthUserQuery } from "@/features/auth/services/authApi";
import { useGetSchedulesQuery } from "../services/schedulesApi";
import {
  filterSchedules,
  getSchedulesInDateRange,
} from "../services/schedulesService";
import { getScheduleDates, normalizeScheduleDateRange } from "../utils";
import type {
  ScheduleTableFilterValues,
  WorkScheduleMatrixResponse,
} from "../types/scheduleTypes";
import { ScheduleCalendarHeader } from "./ScheduleCalendarHeader";
import { ScheduleFilters } from "./ScheduleFilters";
import { ScheduleWeeklyGrid } from "./ScheduleWeeklyGrid";
import { MyScheduleCalendar } from "./MyScheduleCalendar";

const EMPTY_MATRIX: WorkScheduleMatrixResponse = { dates: [], staff: [] };

export function ScheduleCalendarView() {
  const {
    data: currentUser,
    isLoading: isLoadingCurrentUser,
    isFetching: isFetchingCurrentUser,
    error: currentUserError,
    refetch: refetchCurrentUser,
  } = useGetAuthUserQuery();
  const isAdmin = currentUser?.role === "ADMIN";
  const { filters, setFilter, setFilters, resetFilters } =
    useTableFilters<ScheduleTableFilterValues>(DEFAULT_FILTERS);
  const dateRange = useMemo(
    () =>
      normalizeScheduleDateRange({
        startDate: filters.startDate,
        endDate: filters.endDate,
      }),
    [filters.startDate, filters.endDate],
  );
  const dates = useMemo(() => getScheduleDates(dateRange), [dateRange]);
  const adminSchedulesQuery = useGetSchedulesQuery(dateRange, {
    skip: !currentUser || !isAdmin,
  });
  const matrix = adminSchedulesQuery.currentData;
  const isLoading =
    isLoadingCurrentUser ||
    (!currentUser ? isFetchingCurrentUser : isAdmin && adminSchedulesQuery.isLoading);
  const isFetching = isFetchingCurrentUser || (isAdmin && adminSchedulesQuery.isFetching);
  const isError = currentUser
    ? isAdmin && adminSchedulesQuery.isError
    : Boolean(currentUserError);
  const refetchSchedules = () => {
    if (!currentUser) {
      void refetchCurrentUser();
    } else if (isAdmin) {
      void adminSchedulesQuery.refetch();
    }
  };
  const data = useMemo(
    () => getSchedulesInDateRange(matrix ?? EMPTY_MATRIX, dateRange),
    [dateRange, matrix],
  );
  const schedules = data.schedules;
  const statistics = data.statistics;
  const specialties = useMemo(
    () =>
      Array.from(
        new Set((matrix?.staff ?? []).map((staff) => staff.specialtyName)),
      ),
    [matrix],
  );
  const filteredSchedules = useMemo(
    () => filterSchedules(schedules, filters),
    [schedules, filters],
  );
  const pageSize =
    Number.isFinite(filters.pageSize) && filters.pageSize > 0
      ? Math.max(1, Math.trunc(filters.pageSize))
      : DEFAULT_FILTERS.pageSize;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSchedules.length / pageSize),
  );
  const currentPage = Math.min(
    totalPages,
    Math.max(1, Number.isFinite(filters.page) ? Math.trunc(filters.page) : 1),
  );
  const paginatedSchedules = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSchedules.slice(start, start + pageSize);
  }, [filteredSchedules, currentPage, pageSize]);

  const totalDoctors = new Set(
    filteredSchedules.map((schedule) => schedule.doctorId),
  ).size;

  if (currentUser && !isAdmin) {
    return <MyScheduleCalendar user={currentUser} />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <ScheduleCalendarHeader
        isBusy={isFetching}
        onExport={() =>
          toast.error("Tính năng xuất lịch đang được phát triển.")
        }
      />
      <ScheduleFilters
        filters={filters}
        dateRange={dateRange}
        onDateRangeChange={(range) => setFilters(range)}
        specialties={specialties}
        onFilterChange={setFilter}
      />
      <div
        className="mt-4 overflow-hidden rounded-app-xl border border-border bg-surface shadow-2xs"
        aria-busy={isFetching}
      >
        {isLoading || (isFetching && !matrix) ? (
          <Loading label="Đang tải lịch làm việc..." className="min-h-[50vh]" />
        ) : isError ? (
          <Empty
            role="alert"
            title="Không thể tải lịch làm việc"
            description="Vui lòng thử lại."
            action={
              <Button
                onClick={() => {
                  void refetchSchedules();
                }}
                disabled={isFetching}
              >
                Thử lại
              </Button>
            }
          />
        ) : filteredSchedules.length === 0 ? (
          <Empty
            title="Không tìm thấy nhân viên phù hợp"
            description="Thử thay đổi từ khóa hoặc điều chỉnh bộ lọc."
            action={<Button onClick={resetFilters}>Xóa tất cả bộ lọc</Button>}
          />
        ) : (
          <>
            <ScheduleWeeklyGrid
              dates={dates}
              schedules={paginatedSchedules}
              statistics={statistics}
              totalDoctors={totalDoctors}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredSchedules.length}
              pageSize={pageSize}
              itemName="nhân viên"
              onPageChange={(page) => setFilter("page", page)}
              onPageSizeChange={(size) => setFilter("pageSize", size)}
            />
          </>
        )}
      </div>
    </div>
  );
}
