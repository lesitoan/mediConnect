"use client";

import { useMemo } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/Empty";
import { Loading } from "@/components/shared/Loading";
import { Pagination } from "@/components/shared/Pagination";
import { useModal } from "@/hooks/useModal";
import { useTableFilters } from "@/hooks/useTableFilters";
import { DEFAULT_FILTERS } from "../constants";
import {
  useGetAdminDoctorsQuery,
  useGetSchedulesQuery,
} from "../services/schedulesApi";
import {
  filterSchedules,
  getSchedulesInDateRange,
} from "../services/schedulesService";
import { getScheduleDates, normalizeScheduleDateRange } from "../utils";
import type {
  AdminDoctor,
  ScheduleTableFilterValues,
  WorkSchedule,
} from "../types/scheduleTypes";
import { ScheduleCalendarHeader } from "./ScheduleCalendarHeader";
import { ScheduleFilters } from "./ScheduleFilters";
import { ScheduleWeeklyGrid } from "./ScheduleWeeklyGrid";
import { CreateScheduleModal } from "./modals/CreateScheduleModal";
import { PublishScheduleModal } from "./modals/PublishScheduleModal";

const EMPTY_DOCTORS: AdminDoctor[] = [];
const EMPTY_WORK_SCHEDULES: WorkSchedule[] = [];

export function ScheduleCalendarView() {
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
  const {
    currentData: workSchedules,
    isLoading: isLoadingSchedules,
    isFetching: isFetchingSchedules,
    isError: isSchedulesError,
    refetch: refetchSchedules,
  } = useGetSchedulesQuery(dateRange);
  const {
    currentData: doctors,
    isLoading: isLoadingDoctors,
    isFetching: isFetchingDoctors,
    isError: isDoctorsError,
    refetch: refetchDoctors,
  } = useGetAdminDoctorsQuery();
  const isLoading = isLoadingSchedules || isLoadingDoctors;
  const isFetching = isFetchingSchedules || isFetchingDoctors;
  const isError = isSchedulesError || isDoctorsError;
  const data = useMemo(
    () =>
      getSchedulesInDateRange(
        workSchedules ?? EMPTY_WORK_SCHEDULES,
        doctors ?? EMPTY_DOCTORS,
        dateRange,
      ),
    [dateRange, doctors, workSchedules],
  );
  const schedules = data.schedules;
  const statistics = data.statistics;
  const createModal = useModal();
  const publishModal = useModal();

  const specialties = useMemo(
    () =>
      Array.from(
        new Set((doctors ?? []).map((doctor) => doctor.specialty.name)),
      ),
    [doctors],
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

  const draftScheduleIds = useMemo(
    () =>
      schedules
        .filter((schedule) =>
          Object.values(schedule.shifts).some(
            (shift) => shift?.shiftStatus === "DRAFT",
          ),
        )
        .map((schedule) => schedule.scheduleId),
    [schedules],
  );
  const totalDoctors = new Set(
    filteredSchedules.map((schedule) => schedule.doctorId),
  ).size;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <ScheduleCalendarHeader
        draftCount={draftScheduleIds.length}
        isBusy={isFetching}
        onExport={() =>
          toast.error("Tính năng xuất lịch đang được phát triển.")
        }
        onOpenCreateModal={() => createModal.open()}
        onOpenPublishModal={() => publishModal.open()}
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
        {isLoading || (isFetching && (!workSchedules || !doctors)) ? (
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
                  void refetchDoctors();
                }}
                disabled={isFetching}
              >
                Thử lại
              </Button>
            }
          />
        ) : filteredSchedules.length === 0 ? (
          <Empty
            title="Không tìm thấy lịch bác sĩ phù hợp"
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
              itemName="quy tắc lịch"
              onPageChange={(page) => setFilter("page", page)}
              onPageSizeChange={(size) => setFilter("pageSize", size)}
            />
          </>
        )}
      </div>
      <CreateScheduleModal
        dates={dates}
        isOpen={createModal.isOpen}
        onClose={createModal.close}
        doctors={doctors ?? EMPTY_DOCTORS}
      />
      <PublishScheduleModal
        isOpen={publishModal.isOpen}
        onClose={publishModal.close}
        scheduleIds={draftScheduleIds}
      />
    </div>
  );
}
