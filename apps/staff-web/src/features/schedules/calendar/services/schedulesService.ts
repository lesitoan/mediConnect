import type {
  DoctorScheduleRow,
  ScheduleTableFilterValues,
  ScheduleCalendarData,
  ScheduleDateRange,
  ScheduleShift,
} from "../types/scheduleTypes";
import { getScheduleDates, normalizeScheduleDateRange } from "../utils";

export function getSchedulesInDateRange(
  schedules: DoctorScheduleRow[],
  dateRange: ScheduleDateRange,
): ScheduleCalendarData {
  const range = normalizeScheduleDateRange(dateRange);
  const rangedSchedules = schedules.map((doctor) => ({
    ...doctor,
    shifts: Object.fromEntries(
      Object.entries(doctor.shifts).filter(
        ([, shift]) =>
          shift && shift.date >= range.startDate && shift.date <= range.endDate,
      ),
    ),
  }));
  const shifts = rangedSchedules
    .flatMap((doctor) => Object.values(doctor.shifts))
    .filter((shift): shift is ScheduleShift =>
      Boolean(
        shift &&
        shift.shiftStatus !== "OFF" &&
        shift.shiftStatus !== "ON_LEAVE",
      ),
    );
  const slotCount = schedules.length * getScheduleDates(range).length;
  return {
    schedules: rangedSchedules,
    statistics: {
      totalShifts: shifts.length,
      publishedShifts: shifts.filter(
        (shift) => shift.shiftStatus === "PUBLISHED",
      ).length,
      draftShifts: shifts.filter((shift) => shift.shiftStatus === "DRAFT")
        .length,
      conflictCount: shifts.filter((shift) => shift.shiftStatus === "CONFLICT")
        .length,
      pendingRequestsCount: shifts.filter(
        (shift) => shift.shiftStatus === "PENDING_APPROVAL",
      ).length,
      coverageRate: slotCount
        ? Math.round((shifts.length / slotCount) * 1000) / 10
        : 0,
    },
  };
}

export function filterSchedules(
  schedules: DoctorScheduleRow[],
  filters: ScheduleTableFilterValues,
) {
  const query = filters.search.trim().toLocaleLowerCase("vi");

  return schedules.filter((doctor) => {
    if (filters.specialty && doctor.specialtyName !== filters.specialty)
      return false;
    if (
      filters.status !== "ALL" &&
      !Object.values(doctor.shifts).some(
        (shift) => shift?.shiftStatus === filters.status,
      )
    )
      return false;

    return (
      !query ||
      [doctor.doctorName, doctor.doctorCode, doctor.specialtyName].some(
        (value) => value.toLocaleLowerCase("vi").includes(query),
      )
    );
  });
}
