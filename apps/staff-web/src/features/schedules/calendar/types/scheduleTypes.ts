export type ShiftType = "MORNING" | "AFTERNOON" | "FULL_DAY";

export type ShiftStatus =
  | "APPROVED"
  | "PUBLISHED"
  | "PENDING_APPROVAL"
  | "CONFLICT"
  | "DRAFT"
  | "ON_LEAVE"
  | "OFF";

export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export interface ScheduleShift {
  id: string;
  doctorId: string;
  dayOfWeek: DayOfWeek;
  date: string;
  shiftType: ShiftType;
  shiftStatus: ShiftStatus;
  room: string;
  timeRange: string;
  patientCount?: number;
  note?: string;
  swapWithDoctorName?: string;
  conflictDoctorId?: string;
  conflictDoctorName?: string;
  suggestedRoom?: string;
  actionLabel?: string;
}

export interface ScheduleShiftCardOption {
  statuses?: readonly ShiftStatus[];
  shiftTypes?: readonly ShiftType[];
  className: string;
  titleClassName: string;
  descriptionClassName: string;
  noteClassName: string;
  indicatorClassName?: string;
  indicatorPosition?: "START" | "END";
  badge?: { label: string; className: string };
  action?: {
    type: "RESOLVE_CONFLICT" | "VIEW_PENDING_REQUEST";
    placement: "CARD" | "HEADER";
    label?: string;
    className?: string;
  };
  getContent: (shift: ScheduleShift) => {
    title: string;
    description: string;
    note: string;
  };
}

export interface DoctorScheduleRow {
  doctorId: string;
  doctorCode: string;
  doctorName: string;
  specialtyName: string;
  initials: string;
  avatarBgColor: string;
  avatarTextColor: string;
  shifts: Partial<Record<DayOfWeek, ScheduleShift | null>>;
}

export interface ResolveConflictInput {
  doctorId: string;
  targetRoom: string;
  dayOfWeek: DayOfWeek;
  shiftId: string;
}

export interface CreateScheduleInput {
  doctorId: string;
  dayOfWeek: DayOfWeek;
  date: string;
  shiftType: ShiftType;
  room: string;
  timeRange: string;
  isDraft: boolean;
  note?: string;
}

export interface UpdateScheduleInput extends CreateScheduleInput {
  id: string;
}

export interface ScheduleStatistics {
  totalShifts: number;
  publishedShifts: number;
  draftShifts: number;
  conflictCount: number;
  coverageRate: number;
  pendingRequestsCount: number;
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
