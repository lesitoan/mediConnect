import type {
  ScheduleShift,
  ScheduleShiftCardOption,
  ShiftType,
} from "./types/scheduleTypes";
import { getShiftStatusLabel } from "./utils";

const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  MORNING: "Ca sáng",
  AFTERNOON: "Ca chiều",
  FULL_DAY: "Cả ngày",
};

function getShiftContent(shift: ScheduleShift) {
  return {
    title: `${SHIFT_TYPE_LABELS[shift.shiftType]} · ${shift.room}`,
    description: shift.timeRange,
    note:
      shift.note ||
      `${shift.patientCount ?? 0} BN · ${getShiftStatusLabel(shift.shiftStatus)}`,
  };
}

export const SCHEDULE_SHIFT_CARD_OPTIONS: readonly ScheduleShiftCardOption[] = [
  {
    statuses: ["CONFLICT"],
    className:
      "gap-1 border-danger/30 bg-danger-bg transition-shadow hover:shadow-2xs",
    titleClassName: "text-label font-bold text-danger",
    descriptionClassName: "text-danger",
    noteClassName: "pt-0 text-label text-danger/80",
    indicatorClassName: "bg-danger",
    indicatorPosition: "START",
    action: {
      type: "RESOLVE_CONFLICT",
      placement: "HEADER",
      label: "Xử lý",
      className:
        "rounded-app-sm border border-danger/30 bg-surface px-1.5 py-0.5 text-label font-semibold text-danger transition-colors hover:bg-danger-bg",
    },
    getContent: (shift) => ({
      title: shift.room ? `Trùng ${shift.room}` : "Trùng lịch",
      description: shift.timeRange,
      note: shift.note || `Trùng ${shift.conflictDoctorName}`,
    }),
  },
  {
    statuses: ["PENDING_APPROVAL"],
    className:
      "cursor-pointer border-warning/30 bg-warning-bg transition-all hover:border-warning hover:shadow-2xs",
    titleClassName: "text-warning",
    descriptionClassName: "text-warning/90",
    noteClassName:
      "text-label font-semibold tracking-wide text-warning uppercase",
    indicatorClassName: "bg-warning",
    action: { type: "VIEW_PENDING_REQUEST", placement: "CARD" },
    getContent: (shift) => ({
      title: shift.note || "Đổi ca trực",
      description: shift.swapWithDoctorName
        ? `➔ ${shift.swapWithDoctorName}`
        : shift.timeRange,
      note: "CHỜ PHÊ DUYỆT",
    }),
  },
  {
    statuses: ["ON_LEAVE"],
    className: "border-border bg-secondary/30",
    titleClassName: "font-medium text-muted",
    descriptionClassName: "text-muted",
    noteClassName: "text-label font-medium text-success",
    indicatorClassName: "bg-muted",
    getContent: (shift) => ({
      title: "Nghỉ phép năm",
      description: shift.timeRange,
      note: shift.note || "Đã duyệt đơn",
    }),
  },
  {
    statuses: ["DRAFT"],
    className: "border-border bg-secondary/30",
    titleClassName: "text-foreground",
    descriptionClassName: "text-muted",
    noteClassName: "text-muted/80",
    badge: {
      label: "Nháp",
      className:
        "rounded-app-sm bg-secondary px-1 py-0.5 text-label font-semibold text-muted",
    },
    getContent: (shift) => ({
      ...getShiftContent(shift),
      note: shift.note || "Chưa mở đăng ký",
    }),
  },
  {
    shiftTypes: ["AFTERNOON"],
    className:
      "border-success/30 bg-success-bg transition-shadow hover:shadow-2xs",
    titleClassName: "text-success",
    descriptionClassName: "text-success/90",
    noteClassName: "text-success/80",
    indicatorClassName: "bg-success",
    getContent: getShiftContent,
  },
  {
    shiftTypes: ["MORNING", "FULL_DAY"],
    className:
      "border-primary/20 bg-brand-secondary-light/60 transition-shadow hover:shadow-2xs",
    titleClassName: "text-primary",
    descriptionClassName: "text-foreground",
    noteClassName: "text-muted",
    indicatorClassName: "bg-primary",
    getContent: getShiftContent,
  },
];
