import { getPublicApiItems } from './apiClient';

export type Doctor = {
  id: string;
  fullName: string;
  academicTitle: string | null;
  experience?: string;
  position?: string;
  rating?: number;
  photoUrl?: string;
};

export type ScheduleDay = {
  dateKey: string;
  day: number;
  month: number;
  year: number;
  weekdayLabel: string;
  availableDoctorCount: number;
  isFullyBooked: boolean;
};

const DAYS_AHEAD = 14;
const WEEKDAY_LABELS = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const AVAILABILITY_PATTERN = [0, 3, 5, 4, 2, 5];

type PublicDoctor = {
  id: string;
  academicTitle: string | null;
  qualification: string | null;
  avatarUrl: string | null;
  user: { fullName: string };
};

const toDateKey = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const parseDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getAvailableCount = (date: Date, serviceId: string) =>
  AVAILABILITY_PATTERN[(date.getDate() + date.getMonth() + serviceId.length) % AVAILABILITY_PATTERN.length];

export async function getScheduleDays(serviceId: string): Promise<ScheduleDay[]> {
  const today = new Date();
  return Array.from({ length: DAYS_AHEAD }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index);
    const availableDoctorCount = getAvailableCount(date, serviceId);
    return {
      dateKey: toDateKey(date),
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      weekdayLabel: WEEKDAY_LABELS[date.getDay()],
      availableDoctorCount,
      isFullyBooked: availableDoctorCount === 0,
    };
  });
}

export async function getAvailableDoctors(serviceId: string): Promise<Doctor[]> {
  const doctors = await getPublicApiItems<PublicDoctor>(
    `/providers?specialtyId=${encodeURIComponent(serviceId)}`,
  );
  return doctors.map((doctor) => ({
    id: doctor.id,
    fullName: doctor.user.fullName,
    academicTitle: doctor.academicTitle ?? doctor.qualification,
    position: doctor.qualification ?? undefined,
    photoUrl: doctor.avatarUrl ?? undefined,
  }));
}

export type ShiftId = 'MORNING' | 'AFTERNOON';

export type TimeSlot = {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

export type ShiftSchedule = {
  id: ShiftId;
  label: string;
  startTime: string;
  endTime: string;
  slots: TimeSlot[];
};

export const SLOT_DURATION_MINUTES = 30;

const SHIFT_DEFINITIONS: { id: ShiftId; label: string; start: number; end: number }[] = [
  { id: 'MORNING', label: 'Ca Buổi Sáng', start: 7 * 60 + 30, end: 11 * 60 + 30 },
  { id: 'AFTERNOON', label: 'Ca Buổi Chiều', start: 13 * 60 + 30, end: 16 * 60 + 30 },
];

const padTwoDigits = (value: number) => String(value).padStart(2, '0');

const minutesToTime = (minutes: number) =>
  `${padTwoDigits(Math.floor(minutes / 60))}:${padTwoDigits(minutes % 60)}`;

export async function getTimeSlots(doctorId: string, dateKey: string): Promise<ShiftSchedule[]> {
  const date = parseDateKey(dateKey);
  const now = new Date();
  const isToday = toDateKey(now) === dateKey;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const seed = date.getDate() + doctorId.length;
  let slotIndex = 0;

  return SHIFT_DEFINITIONS.map((definition) => {
    const slots: TimeSlot[] = [];
    for (let start = definition.start; start < definition.end; start += SLOT_DURATION_MINUTES) {
      const isBooked = (slotIndex * 3 + seed) % 7 === 0;
      const isPast = isToday && start <= currentMinutes;
      slots.push({
        id: `${dateKey}-${minutesToTime(start)}`,
        startTime: minutesToTime(start),
        endTime: minutesToTime(start + SLOT_DURATION_MINUTES),
        isAvailable: !isBooked && !isPast,
      });
      slotIndex += 1;
    }
    return {
      id: definition.id,
      label: definition.label,
      startTime: minutesToTime(definition.start),
      endTime: minutesToTime(definition.end),
      slots,
    };
  });
}