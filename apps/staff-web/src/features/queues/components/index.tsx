"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/Empty";
import { Loading } from "@/components/shared/Loading";
import {
  DEFAULT_QUEUE_FILTERS,
  QUEUE_ERROR_MESSAGES,
  QUEUE_POLL_INTERVAL_MS,
} from "../constants";
import {
  getQueueBoard,
  getQueueFilterOptions,
  getQueueStatus,
} from "../services/queuesService";
import type {
  QueueAction,
  QueueBoardResponse,
  QueueFilterOption,
  QueueFilterValues,
  QueueItem,
  QueueStatusResponse,
} from "../types/queueTypes";
import { filterQueueItems, getQueueDoctorOptions } from "../utils";
import { QueueHeader } from "./QueueHeader";
import { QueueFilters } from "./QueueFilters";
import { QueueBoard } from "./QueueBoard";
import { QueueDetailsDrawer } from "./QueueDetailsDrawer";
import { QueueActionModal } from "./modals/QueueActionModal";

function getClinicDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export function QueueManagementView() {
  const [date, setDate] = useState(getClinicDate);
  const [filters, setFilters] = useState<QueueFilterValues>(
    DEFAULT_QUEUE_FILTERS,
  );
  const [board, setBoard] = useState<QueueBoardResponse | null>(null);
  const [specialties, setSpecialties] = useState<QueueFilterOption[]>([]);
  const [doctors, setDoctors] = useState<QueueFilterOption[]>([]);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [detailItem, setDetailItem] = useState<QueueStatusResponse | null>(
    null,
  );
  const [actionState, setActionState] = useState<{
    item: QueueItem;
    action: QueueAction;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [serverTime, setServerTime] = useState(0);
  const detailRequestId = useRef(0);

  const refreshBoard = useCallback(
    async (signal?: AbortSignal) => {
      const params = {
        date,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.specialtyId !== "ALL"
          ? { specialtyId: filters.specialtyId }
          : {}),
        ...(filters.doctorId !== "ALL" ? { doctorId: filters.doctorId } : {}),
      };
      try {
        const nextBoard = await getQueueBoard(params, signal);
        setBoard(nextBoard);
        setServerTime(Date.now());
        setIsError(false);
      } catch (error) {
        if (signal?.aborted) return;
        setIsError(true);
        toast.error(
          error instanceof Error
            ? error.message
            : QUEUE_ERROR_MESSAGES.LOAD_FAILED,
        );
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [date, filters],
  );

  useEffect(() => {
    let isVisible = !document.hidden;
    const hasOverlay = Boolean(actionState || selectedItem);
    const controller = new AbortController();
    const updateVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", updateVisibility);
    const initialLoad = hasOverlay
      ? undefined
      : window.setTimeout(() => void refreshBoard(controller.signal), 0);
    const interval = hasOverlay
      ? undefined
      : window.setInterval(() => {
          if (isVisible) void refreshBoard(controller.signal);
        }, QUEUE_POLL_INTERVAL_MS);
    return () => {
      controller.abort();
      if (initialLoad !== undefined) window.clearTimeout(initialLoad);
      if (interval !== undefined) window.clearInterval(interval);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, [refreshBoard, actionState, selectedItem]);

  useEffect(() => {
    const controller = new AbortController();
    void getQueueFilterOptions(filters.specialtyId)
      .then(({ specialties: nextSpecialties, doctors: nextDoctors }) => {
        if (controller.signal.aborted) return;
        setSpecialties(nextSpecialties.map(({ id, name }) => ({ id, name })));
        setDoctors(getQueueDoctorOptions(nextDoctors));
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          toast.error(
            error instanceof Error
              ? error.message
              : QUEUE_ERROR_MESSAGES.LOAD_FAILED,
          );
      });
    return () => controller.abort();
  }, [filters.specialtyId]);

  useEffect(() => {
    const interval = window.setInterval(() => setServerTime(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const items = useMemo(
    () => filterQueueItems(board?.items ?? [], filters),
    [board, filters],
  );
  const detail = detailItem ?? selectedItem;

  const handleDetails = async (item: QueueItem) => {
    detailRequestId.current += 1;
    const requestId = detailRequestId.current;
    setSelectedItem(item);
    setDetailItem(null);
    try {
      const status = await getQueueStatus(item.careSessionId, date);
      if (detailRequestId.current === requestId) setDetailItem(status);
    } catch (error) {
      if (detailRequestId.current === requestId)
        toast.error(
          error instanceof Error
            ? error.message
            : QUEUE_ERROR_MESSAGES.LOAD_FAILED,
        );
    }
  };

  const handleAction = (item: QueueItem, action: QueueAction) => {
    if (action === "CALL" && !item.canCall) {
      toast.error(item.cannotCallReason ?? QUEUE_ERROR_MESSAGES.STATUS_CHANGED);
      return;
    }
    if (action === "SKIP") {
      const remaining = getSecondsToSkip(item);
      if (remaining > 0) {
        toast.error(
          `Bệnh nhân vừa được gọi, còn ${remaining} giây nữa mới được bỏ qua.`,
        );
        return;
      }
    }
    setSelectedItem(null);
    setDetailItem(null);
    setActionState({ item, action });
  };

  const getSecondsToSkip = (item: QueueItem) => {
    if (item.status !== "CALLED") return 0;
    const elapsed = Math.floor((Date.now() - serverTime) / 1000);
    return Math.max(0, item.skipAllowedInSeconds - elapsed);
  };

  const handleActionSuccess = (response: { board: QueueBoardResponse }) => {
    setBoard(response.board);
    setServerTime(Date.now());
  };

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      <QueueHeader
        date={date}
        isRefreshing={isRefreshing}
        onDateChange={(value) => {
          setIsLoading(true);
          setDate(value);
        }}
        onRefresh={() => {
          setIsRefreshing(true);
          void refreshBoard();
        }}
      />
      <QueueFilters
        filters={filters}
        specialties={specialties}
        doctors={doctors}
        onFilterChange={(key, value) =>
          setFilters((current) => ({ ...current, [key]: value }))
        }
        onSpecialtyChange={(specialtyId) =>
          setFilters((current) => ({
            ...current,
            specialtyId,
            doctorId: "ALL",
          }))
        }
      />
      <div aria-busy={isLoading || isRefreshing}>
        {isLoading ? (
          <Loading label="Đang tải hàng chờ..." className="min-h-[560px]" />
        ) : isError && !board ? (
          <Empty
            role="alert"
            title="Không thể tải hàng chờ"
            description="Vui lòng thử lại để cập nhật danh sách bệnh nhân."
            action={
              <Button
                onClick={() => {
                  setIsRefreshing(true);
                  void refreshBoard();
                }}
              >
                Thử lại
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <Empty
            title="Chưa có lượt khám"
            description="Không tìm thấy lượt khám phù hợp với bộ lọc."
          />
        ) : (
          <QueueBoard
            items={items}
            getSecondsToSkip={getSecondsToSkip}
            onDetails={handleDetails}
            onAction={handleAction}
          />
        )}
      </div>
      <QueueDetailsDrawer
        item={detail}
        isOpen={Boolean(selectedItem)}
        onClose={() => {
          detailRequestId.current += 1;
          setSelectedItem(null);
          setDetailItem(null);
        }}
      />
      {actionState && (
        <QueueActionModal
          item={actionState.item}
          action={actionState.action}
          onClose={() => setActionState(null)}
          onRefresh={() => refreshBoard()}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
}
