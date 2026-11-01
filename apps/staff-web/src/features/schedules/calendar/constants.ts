import { addCalendarDays, getVietnamDate } from "@/lib/dateUtils";
import type { ScheduleTableFilterValues } from "./types/scheduleTypes";

export const DEFAULT_GRID_PAGE_SIZE = 5;
export const MAX_SCHEDULE_RANGE_DAYS = 7;

const TODAY = getVietnamDate();

export const DEFAULT_DATE_RANGE = {
  startDate: TODAY,
  endDate: addCalendarDays(TODAY, MAX_SCHEDULE_RANGE_DAYS - 1),
};

export const DEFAULT_FILTERS: ScheduleTableFilterValues = {
  search: "",
  specialty: "",
  status: "ALL",
  ...DEFAULT_DATE_RANGE,
  page: 1,
  pageSize: DEFAULT_GRID_PAGE_SIZE,
};

export interface ScheduleStatusOption {
  value: ScheduleTableFilterValues["status"];
  label: string;
}

export const SCHEDULE_STATUS_OPTIONS: readonly ScheduleStatusOption[] = [
  { value: "ALL", label: "Trạng thái (Tất cả)" },
  { value: "PUBLISHED", label: "Đã công bố" },
  { value: "DRAFT", label: "Nháp" },
] as const;
