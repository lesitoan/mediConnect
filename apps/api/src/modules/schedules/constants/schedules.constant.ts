export const MIN_PLANNED_LEAVE_NOTICE_HOURS = 48;
export const WORKING_DAYS_PER_WEEK = 7;
export const MINUTES_PER_HOUR = 60;
export const DEFAULT_DOCTOR_SLOT_DURATION_MINUTES = 30;
export const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export const DEFAULT_WORK_WINDOWS = [
  { startsAt: '08:00', endsAt: '12:00' },
  { startsAt: '13:00', endsAt: '18:00' },
] as const;

export const CRITICAL_CARE_SESSION_STATUSES = [
  'CHECKED_IN',
  'WAITING',
  'CALLED',
] as const;
