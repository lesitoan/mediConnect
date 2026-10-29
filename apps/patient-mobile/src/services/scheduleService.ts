export type Doctor = {
  id: string;
  fullName: string;
  academicTitle: string;
  experience: string;
  position: string;
  rating: number;
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

const MOCK_DOCTORS: Doctor[] = [
  {
    id: 'doctor-le-quang-huy',
    fullName: 'TS.BS Lê Quang Huy',
    academicTitle: 'Tiến sĩ, Bác sĩ',
    experience: 'Hơn 18 năm',
    position: 'Trưởng khoa Tim mạch',
    rating: 4.9,
  },
  {
    id: 'doctor-nguyen-thu-trang',
    fullName: 'ThS.BS Nguyễn Thu Trang',
    academicTitle: 'Thạc sĩ, Bác sĩ',
    experience: 'Hơn 12 năm',
    position: 'Phó khoa Tim mạch',
    rating: 4.8,
  },
  {
    id: 'doctor-tran-dinh-tuan',
    fullName: 'ThS.BS Trần Đình Tuấn',
    academicTitle: 'Bác sĩ Chuyên khoa II',
    experience: 'Hơn 20 năm',
    position: 'Chuyên gia Can thiệp Tim mạch',
    rating: 5.0,
  },
  {
    id: 'doctor-pham-hoang-anh',
    fullName: 'BS.CKI Phạm Hoàng Anh',
    academicTitle: 'Bác sĩ Chuyên khoa I',
    experience: 'Hơn 10 năm',
    position: 'Bác sĩ điều trị',
    rating: 4.7,
  },
  {
    id: 'doctor-vo-minh-khoi',
    fullName: 'TS.BS Võ Minh Khôi',
    academicTitle: 'Tiến sĩ, Bác sĩ',
    experience: 'Hơn 15 năm',
    position: 'Phó khoa Nội tổng hợp',
    rating: 4.8,
  },
];

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

export async function getAvailableDoctors(serviceId: string, dateKey: string): Promise<Doctor[]> {
  const date = parseDateKey(dateKey);
  const count = getAvailableCount(date, serviceId);
  const offset = date.getDate() % MOCK_DOCTORS.length;
  return Array.from({ length: count }, (_, index) => MOCK_DOCTORS[(offset + index) % MOCK_DOCTORS.length]);
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