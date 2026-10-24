import type { ApiError } from "@/types/apiTypes";
import { QUEUE_ERROR_MESSAGES } from "./constants";
import type {
  QueueAction,
  QueueFilterOption,
  QueueFilterValues,
  QueueItem,
  QueueStatus,
} from "./types/queueTypes";

export function normalizeQueueSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[\s-]+/g, "");
}

export function filterQueueItems(
  items: QueueItem[],
  filters: QueueFilterValues,
): QueueItem[] {
  const search = normalizeQueueSearch(filters.search);

  return items
    .filter((item) => {
      if (
        filters.specialtyId !== "ALL" &&
        item.specialtyId !== filters.specialtyId
      )
        return false;
      if (filters.doctorId !== "ALL" && item.doctorId !== filters.doctorId)
        return false;

      return (
        !search ||
        [item.patientName, item.patientId, item.queueNumber].some((value) =>
          normalizeQueueSearch(value).includes(search),
        )
      );
    })
    .sort(
      (first, second) =>
        first.queuePosition - second.queuePosition ||
        first.id.localeCompare(second.id),
    );
}

export function getQueueSpecialtyOptions(
  items: QueueItem[],
): QueueFilterOption[] {
  return Array.from(
    new Map(
      items.map((item) => [
        item.specialtyId,
        { id: item.specialtyId, name: item.specialtyName },
      ]),
    ).values(),
  );
}

export function getQueueDoctorOptions(
  items: QueueItem[],
  specialtyId: string,
): QueueFilterOption[] {
  return Array.from(
    new Map(
      items
        .filter(
          (item) => specialtyId === "ALL" || item.specialtyId === specialtyId,
        )
        .map((item) => [
          item.doctorId,
          { id: item.doctorId, name: item.doctorName },
        ]),
    ).values(),
  );
}

export function getQueueAction(status: QueueStatus): QueueAction | null {
  switch (status) {
    case "WAITING":
      return "CALL";
    case "CALLING":
      return "SKIP";
    case "SKIPPED":
      return "RESTORE";
    default:
      return null;
  }
}

export function getQueueSubtitle(item: QueueItem): string {
  switch (item.status) {
    case "WAITING":
      return `${item.appointmentStart} · ${item.arrivalStatus === "LATE" ? "Đến trễ" : "Đúng giờ"}`;
    case "CALLING":
      return `${item.room} · Đã gọi`;
    case "IN_PROGRESS":
      return `${item.room} · Trong phòng`;
    case "SKIPPED":
      return "Đã bỏ qua";
  }
}

export function getQueueErrorMessage(
  error: unknown,
  fallback: string = QUEUE_ERROR_MESSAGES.OPERATION_FAILED,
): string {
  return typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
    ? error.message
    : fallback;
}

export function toQueueError(error: unknown): ApiError {
  return {
    status: "FETCH_ERROR",
    message: getQueueErrorMessage(error),
    data: null,
  };
}
