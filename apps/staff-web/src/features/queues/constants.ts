import type {
  QueueAction,
  QueueFilterValues,
  QueueStatus,
} from "./types/queueTypes";

export const QUEUE_SEARCH_DEBOUNCE_MS = 400;
export const QUEUE_POLL_INTERVAL_MS = 10_000;
export const DEFAULT_QUEUE_FILTERS: QueueFilterValues = {
  search: "",
  specialtyId: "ALL",
  doctorId: "ALL",
};

export const QUEUE_COLUMNS: { key: string; label: string }[] = [
  { key: "WAITING", label: "Đang chờ" },
  { key: "CALLED", label: "Đang gọi" },
  { key: "IN_CONSULTATION", label: "Đang khám" },
  { key: "SKIPPED", label: "Bỏ qua lượt" },
];

export const QUEUE_STATUS_PRESENTATION: Record<
  QueueStatus,
  { label: string; column: string }
> = {
  WAITING: { label: "Đang chờ", column: "WAITING" },
  CHECKED_IN: { label: "Đang chờ", column: "WAITING" },
  CALLED: { label: "Đang gọi", column: "CALLED" },
  IN_CONSULTATION: { label: "Đang khám", column: "IN_CONSULTATION" },
  SKIPPED: { label: "Bỏ qua lượt", column: "SKIPPED" },
  NO_SHOW: { label: "Vắng mặt", column: "SKIPPED" },
};

export const QUEUE_STATUS_LABELS: Record<QueueStatus, string> =
  Object.fromEntries(
    Object.entries(QUEUE_STATUS_PRESENTATION).map(([status, value]) => [
      status,
      value.label,
    ]),
  ) as Record<QueueStatus, string>;

export const QUEUE_ACTION_LABELS: Record<QueueAction, string> = {
  CALL: "Gọi khám",
  START: "Bắt đầu khám",
  COMPLETE: "Hoàn thành",
  SKIP: "Bỏ qua lượt",
  RESTORE: "Đưa trở lại",
};

export const QUEUE_ERROR_MESSAGES = {
  LOAD_FAILED: "Không thể tải hàng chờ. Vui lòng thử lại.",
  ACTION_FAILED: "Không thể cập nhật lượt khám. Vui lòng thử lại.",
  SESSION_EXPIRED: "Phiên đăng nhập hết hạn hoặc không có quyền.",
  SESSION_NOT_FOUND: "Lượt khám không còn tồn tại.",
  SYSTEM_FAILED: "Hệ thống gặp lỗi, vui lòng thử lại.",
  NETWORK_FAILED: "Không thể kết nối máy chủ. Vui lòng thử lại.",
  STATUS_CHANGED:
    "Trạng thái lượt khám đã thay đổi. Vui lòng làm mới danh sách.",
};
