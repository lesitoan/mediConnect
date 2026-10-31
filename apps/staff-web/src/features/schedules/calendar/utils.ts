import { DEFAULT_DATE_RANGE, MAX_SCHEDULE_RANGE_DAYS } from "./constants";
import type { DayOfWeek, ScheduleDateRange } from "./types/scheduleTypes";

const MILLISECONDS_PER_DAY = 86_400_000;
const DAYS_OF_WEEK: DayOfWeek[] = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
];
const SCHEDULE_DATE_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

export function getScheduleDateTimestamp(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === value
    ? timestamp
    : NaN;
}

export function normalizeScheduleDateRange(
  range: ScheduleDateRange,
): ScheduleDateRange {
  const parsedStart = getScheduleDateTimestamp(range.startDate);
  const parsedEnd = getScheduleDateTimestamp(range.endDate);
  if (!Number.isFinite(parsedStart)) return { ...DEFAULT_DATE_RANGE };
  const end = Number.isFinite(parsedEnd)
    ? Math.max(parsedStart, parsedEnd)
    : parsedStart;
  const limitedEnd = Math.min(
    end,
    parsedStart + (MAX_SCHEDULE_RANGE_DAYS - 1) * MILLISECONDS_PER_DAY,
  );
  return {
    startDate: range.startDate,
    endDate: new Date(limitedEnd).toISOString().slice(0, 10),
  };
}

export function getScheduleDates(range: ScheduleDateRange): string[] {
  const { startDate, endDate } = normalizeScheduleDateRange(range);
  const start = getScheduleDateTimestamp(startDate);
  const count =
    Math.floor(
      (getScheduleDateTimestamp(endDate) - start) / MILLISECONDS_PER_DAY,
    ) + 1;
  return Array.from({ length: count }, (_, index) =>
    new Date(start + index * MILLISECONDS_PER_DAY).toISOString().slice(0, 10),
  );
}

export function formatScheduleDate(date: string) {
  return SCHEDULE_DATE_FORMAT.format(new Date(`${date}T00:00:00Z`));
}

export function getScheduleDayOfWeek(date: string): DayOfWeek {
  return DAYS_OF_WEEK[new Date(`${date}T00:00:00Z`).getUTCDay()];
}

export function getDayOfWeekLabel(day: DayOfWeek): string {
  switch (day) {
    case "MON":
      return "Thứ Hai";
    case "TUE":
      return "Thứ Ba";
    case "WED":
      return "Thứ Tư";
    case "THU":
      return "Thứ Năm";
    case "FRI":
      return "Thứ Sáu";
    case "SAT":
      return "Thứ Bảy";
    case "SUN":
      return "Chủ nhật";
    default:
      return day;
  }
}
