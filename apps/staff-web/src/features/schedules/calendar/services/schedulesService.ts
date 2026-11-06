import type {
  DoctorScheduleRow,
  ScheduleCalendarData,
  ScheduleDateRange,
  ScheduleShift,
  ScheduleTableFilterValues,
  WorkScheduleMatrixResponse,
} from "../types/scheduleTypes";
import { getScheduleDayOfWeek } from "../utils";

const TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function getTimeLabel(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = TIME_FORMATTER.formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;
  return hour && minute ? `${hour}:${minute}` : "";
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0] ?? "")
    .join("")
    .toLocaleUpperCase("vi");
}

export function getSchedulesInDateRange(
  matrix: WorkScheduleMatrixResponse,
  dateRange: ScheduleDateRange,
): ScheduleCalendarData {
  const schedules = matrix.staff
    .map((staffMember): DoctorScheduleRow => {
      const shifts: DoctorScheduleRow["shifts"] = {};
      for (const shift of staffMember.shifts) {
        if (
          shift.date < dateRange.startDate ||
          shift.date > dateRange.endDate
        ) {
          continue;
        }
        const dayOfWeek = getScheduleDayOfWeek(shift.date);
        const scheduleShift: ScheduleShift = {
          id: `${staffMember.userId}-${shift.date}-${shift.key}`,
          doctorId: staffMember.userId,
          dayOfWeek,
          date: shift.date,
          shiftName: "Ca làm",
          shiftStatus: shift.status,
          timeRange: `${getTimeLabel(shift.startsAt)} – ${getTimeLabel(
            shift.endsAt,
          )}`,
        };
        shifts[dayOfWeek] = [...(shifts[dayOfWeek] ?? []), scheduleShift];
      }

      return {
        scheduleId: staffMember.userId,
        doctorId: staffMember.userId,
        staffType: staffMember.staffType,
        doctorCode: staffMember.staffCode,
        doctorName: staffMember.fullName,
        specialtyName: staffMember.specialtyName,
        initials: getInitials(staffMember.fullName),
        shifts,
      };
    })
    .sort((left, right) =>
      left.doctorName.localeCompare(right.doctorName, "vi"),
    );
  const shifts = schedules.flatMap((schedule) =>
    Object.values(schedule.shifts).flatMap((dayShifts) => dayShifts ?? []),
  );

  return {
    schedules,
    statistics: {
      totalShifts: shifts.length,
      publishedShifts: shifts.filter(
        (shift) => shift.shiftStatus === "PUBLISHED",
      ).length,
      absentShifts: shifts.filter((shift) => shift.shiftStatus === "ABSENT")
        .length,
      resolvingShifts: shifts.filter(
        (shift) => shift.shiftStatus === "RESOLVING",
      ).length,
    },
  };
}

export function filterSchedules(
  schedules: DoctorScheduleRow[],
  filters: ScheduleTableFilterValues,
) {
  const query = filters.search.trim().toLocaleLowerCase("vi");

  return schedules.filter((schedule) => {
    if (filters.specialty && schedule.specialtyName !== filters.specialty) {
      return false;
    }
    if (
      filters.status !== "ALL" &&
      !Object.values(schedule.shifts)
        .flatMap((dayShifts) => dayShifts ?? [])
        .some((shift) => shift.shiftStatus === filters.status)
    ) {
      return false;
    }

    return (
      !query ||
      [schedule.doctorName, schedule.doctorCode, schedule.specialtyName].some(
        (value) => value.toLocaleLowerCase("vi").includes(query),
      )
    );
  });
}
