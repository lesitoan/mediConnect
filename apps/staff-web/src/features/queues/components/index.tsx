"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/Empty";
import { Loading } from "@/components/shared/Loading";
import { useModal } from "@/hooks/useModal";
import { useTableFilters } from "@/hooks/useTableFilters";
import { DEFAULT_QUEUE_FILTERS, EMPTY_QUEUE_ITEMS } from "../constants";
import { useGetQueueItemsQuery } from "../services/queuesApi";
import {
  filterQueueItems,
  getQueueDoctorOptions,
  getQueueSpecialtyOptions,
} from "../utils";
import type {
  QueueAction,
  QueueActionInput,
  QueueItem,
} from "../types/queueTypes";
import { QueueHeader } from "./QueueHeader";
import { QueueFilters } from "./QueueFilters";
import { QueueBoard } from "./QueueBoard";
import { QueueDetailsDrawer } from "./QueueDetailsDrawer";
import { QueueActionModal } from "./modals/QueueActionModal";

export function QueueManagementView() {
  const {
    data: items = EMPTY_QUEUE_ITEMS,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetQueueItemsQuery();
  const { filters, setFilter, setFilters, resetFilters } = useTableFilters(
    DEFAULT_QUEUE_FILTERS,
  );
  const detailsDrawer = useModal<string>();
  const actionModal = useModal<QueueActionInput>();

  const filteredItems = useMemo(
    () => filterQueueItems(items, filters),
    [items, filters],
  );
  const specialties = useMemo(() => getQueueSpecialtyOptions(items), [items]);
  const doctors = useMemo(
    () => getQueueDoctorOptions(items, filters.specialtyId),
    [items, filters.specialtyId],
  );
  const detailsItem =
    items.find((item) => item.id === detailsDrawer.data) ?? null;
  const actionItem =
    items.find((item) => item.id === actionModal.data?.id) ?? null;

  const handleAction = (item: QueueItem, action: QueueAction) => {
    detailsDrawer.close();
    actionModal.open({ id: item.id, action, expectedStatus: item.status });
  };

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      <QueueHeader />
      <QueueFilters
        filters={filters}
        specialties={specialties}
        doctors={doctors}
        onFilterChange={setFilter}
        onSpecialtyChange={(specialtyId) =>
          setFilters({ specialtyId, doctorId: "ALL" })
        }
      />
      <div aria-busy={isFetching}>
        {isLoading ? (
          <Loading label="Đang tải hàng chờ..." className="min-h-[560px]" />
        ) : isError ? (
          <Empty
            role="alert"
            title="Không thể tải hàng chờ"
            description="Vui lòng thử lại để cập nhật danh sách bệnh nhân."
            action={
              <Button onClick={() => refetch()} disabled={isFetching}>
                Thử lại
              </Button>
            }
          />
        ) : filteredItems.length === 0 && items.length > 0 ? (
          <Empty
            title="Không tìm thấy lượt chờ phù hợp"
            description="Thử thay đổi từ khóa hoặc điều chỉnh bộ lọc."
            action={<Button onClick={resetFilters}>Xóa tất cả bộ lọc</Button>}
          />
        ) : (
          <QueueBoard
            items={filteredItems}
            onDetails={(item) => detailsDrawer.open(item.id)}
            onAction={handleAction}
          />
        )}
      </div>
      <QueueDetailsDrawer
        item={detailsItem}
        isOpen={detailsDrawer.isOpen}
        onClose={detailsDrawer.close}
        onAction={handleAction}
      />
      {actionModal.isOpen && actionModal.data && actionItem && (
        <QueueActionModal
          item={actionItem}
          input={actionModal.data}
          onClose={actionModal.close}
        />
      )}
    </div>
  );
}
