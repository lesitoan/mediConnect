import type {
  AdminDoctor,
  DoctorScheduleRow,
  ScheduleCalendarData,
  ScheduleDateRange,
  ScheduleShift,
  ScheduleTableFilterValues,
  WorkSchedule,
} from "../types/scheduleTypes";
import { getScheduleDates, getScheduleDayOfWeek } from "../utils";

const API_DAY_OF_WEEK: Record<string, number> = {
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
  SUN: 7,
};

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

function isScheduleInDateRange(
  schedule: WorkSchedule,
  dates: string[],
  dateRange: ScheduleDateRange,
) {
  if (schedule.status !== "DRAFT" && schedule.status !== "PUBLISHED") {
    return false;
  }
  return dates.some((date) => {
    const weekday = API_DAY_OF_WEEK[getScheduleDayOfWeek(date)];
    return (
      weekday === schedule.dayOfWeek &&
      date >= schedule.effectiveFrom.slice(0, 10) &&
      (!schedule.effectiveTo ||
        date <= schedule.effectiveTo.slice(0, 10)) &&
      date >= dateRange.startDate &&
      date <= dateRange.endDate
    );
  });
}

export function getSchedulesInDateRange(
  workSchedules: WorkSchedule[],
  doctors: AdminDoctor[],
  dateRange: ScheduleDateRange,
): ScheduleCalendarData {
  const dates = getScheduleDates(dateRange);
  const doctorByUserId = new Map(
    doctors.map((doctor) => [doctor.userId, doctor]),
  );
  const schedules = workSchedules.flatMap((schedule): DoctorScheduleRow[] => {
    if (
      (schedule.status !== "DRAFT" && schedule.status !== "PUBLISHED") ||
      !isScheduleInDateRange(schedule, dates, dateRange)
    ) {
      return [];
    }

    const doctor = doctorByUserId.get(schedule.staffUserId);
    if (!doctor) return [];

    const date = dates.find((candidate) => {
      const weekday = API_DAY_OF_WEEK[getScheduleDayOfWeek(candidate)];
      return (
        weekday === schedule.dayOfWeek &&
        candidate >= schedule.effectiveFrom.slice(0, 10) &&
        (!schedule.effectiveTo ||
          candidate <= schedule.effectiveTo.slice(0, 10))
      );
    });
    if (!date) return [];

    const dayOfWeek = getScheduleDayOfWeek(date);
    const shift: ScheduleShift = {
      id: schedule.id,
      doctorId: doctor.id,
      dayOfWeek,
      date,
      scheduleType: schedule.scheduleType,
      shiftStatus: schedule.status,
      timeRange: `${getTimeLabel(schedule.startsAt)} – ${getTimeLabel(
        schedule.endsAt,
      )}`,
    };

    return [
      {
        scheduleId: schedule.id,
        doctorId: doctor.id,
        doctorCode: doctor.doctorCode,
        doctorName: doctor.user.fullName,
        specialtyName: doctor.specialty.name,
        initials: getInitials(doctor.user.fullName),
        shifts: { [dayOfWeek]: shift },
      },
    ];
  });
  const shifts = schedules.flatMap((doctor) =>
    Object.values(doctor.shifts).filter(
      (shift): shift is ScheduleShift => Boolean(shift),
    ),
  );

  return {
    schedules,
    statistics: {
      totalShifts: shifts.length,
      publishedShifts: shifts.filter(
        (shift) => shift.shiftStatus === "PUBLISHED",
      ).length,
      draftShifts: shifts.filter((shift) => shift.shiftStatus === "DRAFT")
        .length,
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
      !Object.values(schedule.shifts).some(
        (shift) => shift?.shiftStatus === filters.status,
      )
    ) {
      return false;
    }

    return (
      !query ||
      [
        schedule.doctorName,
        schedule.doctorCode,
        schedule.specialtyName,
      ].some((value) => value.toLocaleLowerCase("vi").includes(query))
    );
  });
}
