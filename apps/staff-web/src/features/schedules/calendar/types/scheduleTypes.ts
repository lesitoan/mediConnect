export type ShiftStatus = "PUBLISHED" | "DRAFT";

export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export type ScheduleType = "REGULAR" | "SHIFT";

export interface ScheduleShift {
  id: string;
  doctorId: string;
  dayOfWeek: DayOfWeek;
  date: string;
  scheduleType: ScheduleType;
  shiftStatus: ShiftStatus;
  timeRange: string;
}

export interface ScheduleShiftCardOption {
  statuses: readonly ShiftStatus[];
  className: string;
  titleClassName: string;
  descriptionClassName: string;
  badge?: { label: string; className: string };
  getTitle: (shift: ScheduleShift) => string;
}

export interface DoctorScheduleRow {
  scheduleId: string;
  doctorId: string;
  doctorCode: string;
  doctorName: string;
  specialtyName: string;
  initials: string;
  shifts: Partial<Record<DayOfWeek, ScheduleShift | null>>;
}

export interface AdminDoctor {
  id: string;
  userId: string;
  isActive: boolean;
  doctorCode: string;
  user: { fullName: string };
  specialty: { name: string };
}

export interface WorkSchedule {
  id: string;
  staffUserId: string;
  staffType: "DOCTOR" | "RECEPTIONIST";
  dayOfWeek: number;
  startsAt: string;
  endsAt: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  scheduleType: ScheduleType;
  slotDurationMinutes: number | null;
  status: "DRAFT" | "PUBLISHED" | "ABSENT" | "CANCELLED";
}

export interface CreateScheduleInput {
  staffUserId: string;
  staffType: "DOCTOR";
  dayOfWeek: number;
  startsAt: string;
  endsAt: string;
  effectiveFrom: string;
  effectiveTo?: string;
  scheduleType: ScheduleType;
  slotDurationMinutes: number;
}

export interface ScheduleStatistics {
  totalShifts: number;
  publishedShifts: number;
  draftShifts: number;
}

export interface ScheduleCalendarData {
  schedules: DoctorScheduleRow[];
  statistics: ScheduleStatistics;
}

export interface ScheduleDateRange {
  startDate: string;
  endDate: string;
}

export interface ScheduleTableFilterValues {
  search: string;
  specialty: string;
  status: ShiftStatus | "ALL";
  startDate: string;
  endDate: string;
  page: number;
  pageSize: number;
}
