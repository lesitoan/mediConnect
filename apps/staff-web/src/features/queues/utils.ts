import type {
  QueueAction,
  QueueFilterOption,
  QueueFilterValues,
  QueueItem,
  QueueStatus,
} from "./types/queueTypes";

export function getQueueColumnKey(status: QueueStatus): string {
  if (status === "CHECKED_IN") return "WAITING";
  if (status === "NO_SHOW") return "SKIPPED";
  return status;
}

export function filterQueueItems(
  items: QueueItem[],
  filters: QueueFilterValues,
): QueueItem[] {
  const search = filters.search.trim().toLocaleLowerCase("vi-VN");
  return items.filter((item) => {
    if (
      filters.specialtyId !== "ALL" &&
      item.specialtyId !== filters.specialtyId
    )
      return false;
    if (filters.doctorId !== "ALL" && item.doctorId !== filters.doctorId)
      return false;
    return (
      !search ||
      [
        item.patientName,
        item.patientCode,
        item.appointmentCode,
        String(item.queueNumber ?? ""),
      ].some((value) => value.toLocaleLowerCase("vi-VN").includes(search))
    );
  });
}

export function getQueueDoctorOptions(
  doctors: { id: string; user: { fullName: string } }[],
): QueueFilterOption[] {
  return doctors.map((doctor) => ({
    id: doctor.id,
    name: doctor.user.fullName,
  }));
}

export function getQueueAction(item: QueueItem): QueueAction[] {
  if (item.status === "WAITING" || item.status === "CHECKED_IN")
    return ["CALL"];
  if (item.status === "CALLED") return ["SKIP"];
  if (item.status === "SKIPPED") return ["CALL", "RESTORE"];
  return [];
}

export function getQueueSubtitle(item: QueueItem): string {
  if (item.status === "WAITING" || item.status === "CHECKED_IN") {
    return `${item.appointmentTime} · ${item.arrivalStatus === "LATE" ? "Đến trễ" : "Đúng giờ"}`;
  }
  if (item.status === "CALLED") return `${item.room ?? ""} · Đã gọi`;
  if (item.status === "IN_CONSULTATION")
    return `${item.room ?? ""} · Trong phòng`;
  if (item.status === "NO_SHOW") return "Vắng mặt";
  return `Đã bỏ qua ${item.skipCount} lần`;
}

export function getQueueStatusLabel(status: QueueStatus): string {
  return status === "NO_SHOW"
    ? "Vắng mặt"
    : status === "SKIPPED"
      ? "Đã bỏ qua"
      : status;
}

export function getQueueErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
