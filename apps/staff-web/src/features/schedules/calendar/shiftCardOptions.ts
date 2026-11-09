import type {
  ScheduleShift,
  ScheduleShiftCardOption,
} from "./types/scheduleTypes";

export const SCHEDULE_SHIFT_CARD_OPTIONS: readonly ScheduleShiftCardOption[] = [
  {
    statuses: ["PUBLISHED"],
    className: "border-success/30 bg-success-bg",
    titleClassName: "text-success",
    descriptionClassName: "text-success/90",
    badge: {
      label: "Đã công bố",
      className:
        "rounded-app-sm bg-surface px-1 py-0.5 text-label font-semibold text-success",
    },
    getTitle: (shift: ScheduleShift) => shift.shiftName,
  },
  {
    statuses: ["RESOLVING"],
    className: "border-warning/30 bg-warning-bg",
    titleClassName: "text-warning",
    descriptionClassName: "text-warning/90",
    badge: {
      label: "Chờ xử lý",
      className:
        "rounded-app-sm bg-surface px-1 py-0.5 text-label font-semibold text-warning",
    },
    getTitle: (shift: ScheduleShift) => shift.shiftName,
  },
  {
    statuses: ["ABSENT"],
    className: "border-danger/30 bg-danger-bg",
    titleClassName: "text-danger",
    descriptionClassName: "text-danger/90",
    badge: {
      label: "Vắng mặt",
      className:
        "rounded-app-sm bg-surface px-1 py-0.5 text-label font-semibold text-danger",
    },
    getTitle: (shift: ScheduleShift) => shift.shiftName,
  },
];
