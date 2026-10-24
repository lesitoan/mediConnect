"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/Empty";
import { Loading } from "@/components/shared/Loading";
import { Pagination } from "@/components/shared/Pagination";
import { useModal } from "@/hooks/useModal";
import { useTableFilters } from "@/hooks/useTableFilters";
import { DEFAULT_FILTERS } from "../constants";
import { useGetSchedulesQuery } from "../services/schedulesApi";
import { filterSchedules } from "../services/schedulesService";
import { getScheduleDates, normalizeScheduleDateRange } from "../utils";
import type {
  DoctorScheduleRow,
  ScheduleShift,
  ScheduleStatistics,
  ScheduleTableFilterValues,
} from "../types/scheduleTypes";
import { ScheduleCalendarHeader } from "./ScheduleCalendarHeader";
import { ScheduleFilters } from "./ScheduleFilters";
import { ScheduleWeeklyGrid } from "./ScheduleWeeklyGrid";
import { CreateScheduleModal } from "./modals/CreateScheduleModal";
import { ConflictResolutionModal } from "./modals/ConflictResolutionModal";
import { PublishScheduleModal } from "./modals/PublishScheduleModal";

const EMPTY_SCHEDULES: DoctorScheduleRow[] = [];
const EMPTY_STATISTICS: ScheduleStatistics = {
  totalShifts: 0,
  publishedShifts: 0,
  draftShifts: 0,
  conflictCount: 0,
  coverageRate: 0,
  pendingRequestsCount: 0,
};

export function ScheduleCalendarView() {
  const router = useRouter();
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
  const { currentData: data, isLoading, isFetching, isError, refetch } =
    useGetSchedulesQuery(dateRange);
  const schedules = data?.schedules ?? EMPTY_SCHEDULES;
  const statistics = data?.statistics ?? EMPTY_STATISTICS;
  
  const createModal = useModal();
  const conflictModal = useModal<ScheduleShift>();
  const publishModal = useModal();

  const specialties = useMemo(
    () => Array.from(new Set(schedules.map((doctor) => doctor.specialtyName))),
    [schedules],
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

  const handleOpenConflict = () => {
    const shift = schedules
      .flatMap((doctor) => Object.values(doctor.shifts))
      .find((shift) => shift?.shiftStatus === "CONFLICT");
    if (shift) conflictModal.open(shift);
  };

  const handleViewPendingRequest = (shift: ScheduleShift) => {
    const doctor = schedules.find(
      (doctor) => doctor.doctorId === shift.doctorId,
    );
    const query = new URLSearchParams({ search: doctor?.doctorName ?? "" });
    router.push("/schedules/approvals?" + query.toString());
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <ScheduleCalendarHeader
        dayCount={dates.length}
        totalShifts={statistics.totalShifts}
        conflictCount={statistics.conflictCount}
        draftCount={statistics.draftShifts}
        isBusy={isFetching || isError}
        onExport={() =>
          toast.error("Tính năng xuất lịch đang được phát triển.")
        }
        onOpenCreateModal={() => createModal.open()}
        onOpenPublishModal={() => publishModal.open()}
        onOpenConflictModal={handleOpenConflict}
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
        {isLoading || (isFetching && !data) ? (
          <Loading label="Đang tải lịch làm việc..." className="min-h-[50vh]" />
        ) : isError ? (
          <Empty
            role="alert"
            title="Không thể tải lịch làm việc"
            description="Vui lòng thử lại."
            action={
              <Button onClick={() => refetch()} disabled={isFetching}>
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
              totalDoctors={filteredSchedules.length}
              onResolveConflict={conflictModal.open}
              onViewPendingRequest={handleViewPendingRequest}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredSchedules.length}
              pageSize={pageSize}
              itemName="bác sĩ"
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
        doctors={schedules}
      />
      <ConflictResolutionModal
        isOpen={conflictModal.isOpen}
        onClose={conflictModal.close}
        shift={conflictModal.data}
        doctors={schedules}
      />
      <PublishScheduleModal
        dateRange={dateRange}
        isOpen={publishModal.isOpen}
        onClose={publishModal.close}
        draftCount={statistics.draftShifts}
      />
    </div>
  );
}
