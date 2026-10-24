import type { ApiError } from "@/types/apiTypes";
import { formatDate } from "@/lib/utils";
import { EXCEPTION_ERROR_MESSAGES } from "./constants";
import type {
  ExceptionAppointment,
  ExceptionFilterValues,
  ExceptionGroup,
  ExceptionStatus,
  ReplacementDoctor,
  ReplacementDoctorOption,
} from "./types/exceptionTypes";

export function formatExceptionDate(date: string): string {
  return formatDate(`${date}T00:00:00`);
}

export function formatExceptionPayment(
  appointment: ExceptionAppointment,
): string {
  return `${appointment.paymentAmount.toLocaleString("vi-VN")}đ · ${appointment.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}`;
}

export function normalizeExceptionSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[\s-]+/g, "");
}

export function filterExceptionGroups(
  groups: ExceptionGroup[],
  filters: ExceptionFilterValues,
): ExceptionGroup[] {
  const search = normalizeExceptionSearch(filters.search);
  return groups
    .filter(
      (group) => filters.urgency === "ALL" || filters.urgency === group.urgency,
    )
    .map((group) => ({
      ...group,
      appointments: group.appointments.filter((appointment) => {
        if (filters.status !== "ALL" && filters.status !== appointment.status)
          return false;
        return (
          !search ||
          [
            appointment.patientName,
            appointment.patientId,
            appointment.code,
            appointment.doctorName,
            group.title,
          ].some((value) => normalizeExceptionSearch(value).includes(search))
        );
      }),
    }))
    .filter((group) => group.appointments.length > 0);
}

export function getExceptionStatusCounts(
  groups: ExceptionGroup[],
): Record<ExceptionStatus, number> {
  const counts: Record<ExceptionStatus, number> = {
    PENDING: 0,
    AWAITING_CONFIRMATION: 0,
    RESOLVED: 0,
    COMPLETED: 0,
  };
  for (const group of groups) {
    for (const appointment of group.appointments)
      counts[appointment.status] += 1;
  }
  return counts;
}

export function getUrgentExceptionCount(groups: ExceptionGroup[]): number {
  return groups
    .filter((group) => group.urgency === "URGENT")
    .reduce(
      (count, group) =>
        count +
        group.appointments.filter(
          (appointment) =>
            appointment.status === "PENDING" ||
            appointment.status === "AWAITING_CONFIRMATION",
        ).length,
      0,
    );
}

export function getExceptionStatusVariant(
  status: ExceptionStatus,
): "danger" | "warning" | "success" | "neutral" {
  switch (status) {
    case "PENDING":
      return "danger";
    case "AWAITING_CONFIRMATION":
      return "warning";
    case "RESOLVED":
      return "success";
    case "COMPLETED":
      return "neutral";
  }
}

export function getReplacementDoctorOptions(
  group: ExceptionGroup,
  appointment: ExceptionAppointment,
  doctors: ReplacementDoctor[],
): ReplacementDoctorOption[] {
  return doctors
    .filter(
      (doctor) =>
        doctor.specialtyId === appointment.specialtyId &&
        doctor.id !== appointment.doctorId,
    )
    .map((doctor) => {
      const conflict = doctor.busySlots.find(
        (slot) =>
          slot.date === group.date &&
          slot.startTime < appointment.endTime &&
          appointment.startTime < slot.endTime,
      );
      const isOutsideWorkHours =
        appointment.startTime < doctor.workStart ||
        appointment.endTime > doctor.workEnd;
      return {
        ...doctor,
        isAvailable: !conflict && !isOutsideWorkHours,
        unavailableReason: conflict
          ? `Trùng lịch ${conflict.startTime}–${conflict.endTime} · Không thể chọn`
          : isOutsideWorkHours
            ? "Ngoài giờ làm việc · Không thể chọn"
            : "",
      };
    });
}

export function buildReassignmentNotification(
  group: ExceptionGroup,
  appointment: ExceptionAppointment,
  doctor: ReplacementDoctor,
): string {
  return `Kính gửi ${appointment.patientName}, lịch hẹn ${appointment.code} với ${appointment.doctorName} lúc ${appointment.startTime}–${appointment.endTime} ngày ${formatExceptionDate(group.date)} bị ảnh hưởng do ${group.reason.toLocaleLowerCase("vi")}. MediConnect đề xuất chuyển sang ${doctor.name}, ${doctor.room}, giữ nguyên khung giờ hẹn. Vui lòng xác nhận đồng ý để chúng tôi kiểm tra lại lịch trống và cập nhật lịch hẹn.`;
}

export function getExceptionErrorMessage(error: unknown): string {
  return typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
    ? error.message
    : EXCEPTION_ERROR_MESSAGES.OPERATION_FAILED;
}

export function toExceptionError(error: unknown): ApiError {
  return {
    status: "FETCH_ERROR",
    message: getExceptionErrorMessage(error),
    data: null,
  };
}
