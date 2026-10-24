"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/Empty";
import { Loading } from "@/components/shared/Loading";
import { Pagination } from "@/components/shared/Pagination";
import { useModal } from "@/hooks/useModal";
import { useTableFilters } from "@/hooks/useTableFilters";
import { DEFAULT_FILTERS } from "../constants";
import { useGetApprovalRequestsQuery } from "../services/approvalsApi";
import { filterApprovalRequests } from "../services/approvalsService";
import type {
  ApprovalRequest,
  ApprovalTableFilterValues,
} from "../types/approvalTypes";
import { ScheduleApprovalTable } from "./ScheduleApprovalTable";
import { ScheduleApprovalFilters } from "./ScheduleApprovalFilters";
import { ScheduleApprovalsHeader } from "./ScheduleApprovalsHeader";
import { RequestApprovalModal } from "./modals/RequestApprovalModal";

const EMPTY_REQUESTS: ApprovalRequest[] = [];

export function ScheduleApprovalsView() {
  const {
    data: requests = EMPTY_REQUESTS,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetApprovalRequestsQuery();
  const { filters, setFilter, resetFilters } =
    useTableFilters<ApprovalTableFilterValues>(DEFAULT_FILTERS);
  const reviewModal = useModal<ApprovalRequest>();
  const filteredRequests = useMemo(
    () => filterApprovalRequests(requests, filters),
    [requests, filters],
  );

  const pageSize =
    Number.isFinite(filters.pageSize) && filters.pageSize > 0
      ? Math.max(1, Math.trunc(filters.pageSize))
      : DEFAULT_FILTERS.pageSize;

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  
  const currentPage = Math.min(
    totalPages,
    Math.max(1, Number.isFinite(filters.page) ? Math.trunc(filters.page) : 1),
  );
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <ScheduleApprovalsHeader />
      <ScheduleApprovalFilters filters={filters} onFilterChange={setFilter} />
      <div
        className="mt-4 overflow-hidden rounded-app-xl border border-border bg-surface shadow-2xs"
        aria-busy={isFetching}
      >
        {isLoading ? (
          <Loading
            label="Đang tải yêu cầu duyệt lịch..."
            className="min-h-[50vh]"
          />
        ) : isError ? (
          <Empty
            role="alert"
            title="Không thể tải yêu cầu duyệt lịch"
            description="Vui lòng thử lại."
            action={
              <Button onClick={() => refetch()} disabled={isFetching}>
                Thử lại
              </Button>
            }
          />
        ) : filteredRequests.length === 0 ? (
          <Empty
            title="Không tìm thấy yêu cầu nào phù hợp"
            description="Thử thay đổi từ khóa hoặc điều chỉnh bộ lọc."
            action={<Button onClick={resetFilters}>Xóa tất cả bộ lọc</Button>}
          />
        ) : (
          <>
            <ScheduleApprovalTable
              requests={paginatedRequests}
              onOpenReviewModal={reviewModal.open}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredRequests.length}
              pageSize={pageSize}
              itemName="yêu cầu"
              onPageChange={(page) => setFilter("page", page)}
              onPageSizeChange={(size) => setFilter("pageSize", size)}
            />
          </>
        )}
      </div>
      <RequestApprovalModal
        isOpen={reviewModal.isOpen}
        onClose={reviewModal.close}
        request={reviewModal.data}
      />
    </div>
  );
}
