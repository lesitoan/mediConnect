"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { Loading } from "@/components/shared/Loading";
import {
  QUEUE_ERROR_MESSAGES,
  QUEUE_POLL_INTERVAL_MS,
} from "@/features/queues/constants";
import { getQueueBoard } from "@/features/queues/services/queuesService";
import type {
  QueueAction,
  QueueBoardResponse,
  QueueItem,
} from "@/features/queues/types/queueTypes";
import {
  filterQueueItems,
  getQueueColumnKey,
  getQueueErrorMessage,
  getQueueSubtitle,
} from "@/features/queues/utils";
import { QueueActionModal } from "@/features/queues/components/modals/QueueActionModal";
import { getExamination, openExamination } from "../services/examinationsService";

const COLUMNS = [
  ["WAITING", "Đang chờ", "bg-warning"],
  ["CALLED", "Đang gọi", "bg-primary"],
  ["IN_CONSULTATION", "Đang khám", "bg-success"],
  ["SKIPPED", "Bỏ qua lượt", "bg-muted"],
] as const;

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

export function DoctorQueueView() {
  const router = useRouter();
  const [board, setBoard] = useState<QueueBoardResponse | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [serverTime, setServerTime] = useState(0);
  const [now, setNow] = useState(0);
  const [actionState, setActionState] = useState<{
    item: QueueItem;
    action: QueueAction;
  } | null>(null);

  const refreshBoard = useCallback(async (signal?: AbortSignal) => {
    try {
      const nextBoard = await getQueueBoard({ date: getClinicDate() }, signal);
      setBoard(nextBoard);
      setServerTime(Date.now());
      setIsError(false);
    } catch (error) {
      if (signal?.aborted) return;
      setIsError(true);
      toast.error(
        getQueueErrorMessage(error, QUEUE_ERROR_MESSAGES.LOAD_FAILED),
      );
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let isVisible = !document.hidden;
    const updateVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", updateVisibility);
    const initialLoad = window.setTimeout(
      () => void refreshBoard(controller.signal),
      0,
    );
    const interval = window.setInterval(() => {
      if (isVisible && !actionState) void refreshBoard(controller.signal);
    }, QUEUE_POLL_INTERVAL_MS);
    return () => {
      controller.abort();
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, [actionState, refreshBoard]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const items = useMemo(
    () =>
      filterQueueItems(board?.items ?? [], {
        search,
        specialtyId: "ALL",
        doctorId: "ALL",
      }),
    [board, search],
  );

  const getSecondsToSkip = (item: QueueItem): number => {
    if (item.status !== "CALLED") return 0;
    return Math.max(
      0,
      item.skipAllowedInSeconds - Math.floor((now - serverTime) / 1000),
    );
  };

  const handleAction = (item: QueueItem, action: QueueAction) => {
    const canAction =
      action === "CALL"
        ? item.canCall
        : action === "START"
          ? item.canStart
          : action === "COMPLETE"
            ? item.canComplete
            : action === "SKIP"
              ? item.canSkip
              : item.canRestore;
    if (!canAction) {
      const reason =
        action === "CALL"
          ? item.cannotCallReason
          : action === "START"
            ? item.cannotStartReason
            : action === "COMPLETE"
              ? item.cannotCompleteReason
              : action === "SKIP"
                ? item.cannotSkipReason
                : item.cannotRestoreReason;
      toast.error(reason ?? QUEUE_ERROR_MESSAGES.STATUS_CHANGED);
      return;
    }
    setActionState({ item, action });
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-display font-bold">Hàng chờ khám của tôi</h1>
          <p className="mt-1 text-body text-muted">
            Hàng chờ được đồng bộ theo bác sĩ đăng nhập
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setIsRefreshing(true);
            void refreshBoard();
          }}
          disabled={isRefreshing}
        >
          <RefreshCw className="size-4" />
          {isRefreshing ? "Đang làm mới..." : "Làm mới"}
        </Button>
      </header>
      <Card className="flex items-center gap-3 p-4 shadow-none">
        <span className="rounded-app-lg bg-primary-light p-2 text-primary">
          <CheckCircle2 className="size-4" />
        </span>
        <div>
          <h2 className="text-body font-semibold">
            Các lượt được phân công cho bác sĩ hiện tại
          </h2>
          <p className="mt-1 text-caption text-muted">
            Thứ tự và quyền thao tác do hệ thống hàng chờ quyết định
          </p>
        </div>
        <RefreshCw className="ml-auto size-3.5 text-muted" />
      </Card>
      <Card className="flex flex-wrap items-center justify-between gap-3 p-3 shadow-none">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-2.5 size-4 text-muted" />
          <Input
            className="pl-9"
            aria-label="Tìm trong hàng chờ bác sĩ"
            placeholder="Tìm tên, mã BN, STT..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <p className="text-label text-muted">Hiển thị theo bác sĩ hiện tại</p>
      </Card>
      {isLoading ? (
        <Loading label="Đang tải hàng chờ..." className="min-h-[560px]" />
      ) : isError && !board ? (
        <Empty
          role="alert"
          title="Không thể tải hàng chờ"
          description="Vui lòng thử lại để cập nhật danh sách bệnh nhân."
          action={<Button onClick={() => void refreshBoard()}>Thử lại</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map(([status, label, color]) => {
            const group = items.filter(
              (item) => getQueueColumnKey(item.status) === status,
            );
            return (
              <section
                key={status}
                aria-label={label}
                className="min-h-128 rounded-app-2xl border border-border bg-background/30 p-3"
              >
                <h2 className="mb-4 flex items-center gap-2 px-1 text-body font-semibold">
                  <span className={`size-2 rounded-full ${color}`} />
                  {label}
                  <span className="ml-auto rounded-full bg-secondary px-2 text-label font-medium text-muted">
                    {String(group.length).padStart(2, "0")}
                  </span>
                </h2>
                <div className="space-y-3">
                  {group.map((item) => (
                    <Card
                      key={item.careSessionId}
                      className="overflow-hidden p-3 shadow-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 rounded-app-sm bg-primary-light px-2 py-1 text-caption font-semibold text-primary">
                          {item.queueDisplayNumber ?? "—"}
                        </span>
                        <h3 className="text-body font-semibold">
                          {item.patientName}
                        </h3>
                      </div>
                      <p className="mt-2 text-caption text-muted">
                        {item.patientCode} · {getQueueSubtitle(item)}
                      </p>
                      {item.status === "NO_SHOW" ? (
                        <p className="mt-3 text-label font-semibold text-danger">
                          Vắng mặt
                        </p>
                      ) : (
                        <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3">
                          {(
                            [
                              "CALL",
                              "START",
                              "COMPLETE",
                              "SKIP",
                              "RESTORE",
                            ] as QueueAction[]
                          )
                            .filter((action) => {
                              if (action === "CALL")
                                return [
                                  "WAITING",
                                  "CHECKED_IN",
                                  "SKIPPED",
                                ].includes(item.status);
                              if (action === "START")
                                return item.status === "CALLED";
                              if (action === "COMPLETE")
                                return item.status === "IN_CONSULTATION";
                              if (action === "SKIP")
                                return item.status === "CALLED";
                              return item.status === "SKIPPED";
                            })
                            .map((action) => {
                              const disabled =
                                action === "CALL"
                                  ? !item.canCall
                                  : action === "START"
                                    ? !item.canStart
                                    : action === "COMPLETE"
                                      ? !item.canComplete
                                      : action === "SKIP"
                                        ? !item.canSkip ||
                                          getSecondsToSkip(item) > 0
                                        : !item.canRestore;
                              return (
                                <Button
                                  key={action}
                                  variant={
                                    action === "SKIP" ? "link" : "outline"
                                  }
                                  disabled={disabled}
                                  title={
                                    disabled
                                      ? action === "CALL"
                                        ? (item.cannotCallReason ?? undefined)
                                        : action === "START"
                                          ? (item.cannotStartReason ??
                                            undefined)
                                          : action === "COMPLETE"
                                            ? (item.cannotCompleteReason ??
                                              undefined)
                                            : action === "SKIP"
                                              ? (item.cannotSkipReason ??
                                                undefined)
                                              : (item.cannotRestoreReason ??
                                                undefined)
                                      : undefined
                                  }
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleAction(item, action);
                                  }}
                                >
                                  {action === "SKIP" &&
                                  getSecondsToSkip(item) > 0
                                    ? `Bỏ qua lượt (còn ${getSecondsToSkip(item)} giây)`
                                    : action === "CALL"
                                      ? "Gọi khám"
                                      : action === "START"
                                        ? "Bắt đầu khám"
                                        : action === "COMPLETE"
                                          ? "Hoàn thành"
                                          : action === "SKIP"
                                            ? "Bỏ qua lượt"
                                            : "Đưa trở lại"}
                                </Button>
                              );
                            })}
                        </div>
                      )}
                    </Card>
                  ))}
                  {!group.length && (
                    <p className="p-4 text-center text-caption text-muted">
                      Không có lượt phù hợp.
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
      {!isLoading && !isError && items.length === 0 && (
        <p className="text-center text-caption text-muted">
          Không có bệnh nhân trong hàng chờ.
        </p>
      )}
      {actionState && (
        <QueueActionModal
          item={actionState.item}
          action={actionState.action}
          onClose={() => setActionState(null)}
          onRefresh={() => refreshBoard()}
          onStart={async (queueItem) => {
            const latest = await getExamination(queueItem.careSessionId);
            if (!latest.updatedAt) throw new Error("Không có phiên bản mới nhất của lượt khám");
            await openExamination(queueItem.careSessionId, latest.updatedAt);
            const nextBoard = await getQueueBoard({ date: getClinicDate() });
            return { board: nextBoard };
          }}
          onSuccess={(response) => {
            setBoard(response.board);
            setServerTime(Date.now());
            if (actionState.action === "START") {
              router.push(
                `/examinations?visit=${actionState.item.appointmentCode}`,
              );
            }
          }}
        />
      )}
    </div>
  );
}
