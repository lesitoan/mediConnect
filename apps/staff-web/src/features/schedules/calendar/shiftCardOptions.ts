import type {
  ScheduleShift,
  ScheduleShiftCardOption,
} from "./types/scheduleTypes";

export const SCHEDULE_SHIFT_CARD_OPTIONS: readonly ScheduleShiftCardOption[] = [
  {
    statuses: ["DRAFT"],
    className: "border-border bg-secondary/30",
    titleClassName: "text-foreground",
    descriptionClassName: "text-muted",
    badge: {
      label: "Nháp",
      className:
        "rounded-app-sm bg-secondary px-1 py-0.5 text-label font-semibold text-muted",
    },
    getTitle: (shift: ScheduleShift) =>
      shift.scheduleType === "REGULAR" ? "Lịch thường" : "Lịch theo ca",
  },
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
    getTitle: (shift: ScheduleShift) =>
      shift.scheduleType === "REGULAR" ? "Lịch thường" : "Lịch theo ca",
  },
];
