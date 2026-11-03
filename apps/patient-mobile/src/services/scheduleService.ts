import { getPublicApiItems, getPublicAvailability } from './apiClient';

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

type PublicDoctor = {
  id: string;
  academicTitle: string | null;
  qualification: string | null;
  bio: string | null;
  avatarUrl: string | null;
  user: { fullName: string };
};

type AvailableSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  doctor: {
    id: string;
    fullName: string;
    specialty: { id: string; name: string; roomCode: string };
  };
};

const DAYS_AHEAD = 14;
const WEEKDAY_LABELS = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const getClinicDateKey = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  if (!year || !month || !day) {
    throw new Error('Không thể xác định ngày theo múi giờ của cơ sở khám.');
  }
  return `${year}-${month}-${day}`;
};

const addDays = (dateKey: string, days: number) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

const getClinicTime = (dateTime: string) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(dateTime));
  const hour = parts.find((part) => part.type === 'hour')?.value;
  const minute = parts.find((part) => part.type === 'minute')?.value;
  if (!hour || !minute) throw new Error('API trả về thời gian lịch khám không hợp lệ.');
  return `${hour}:${minute}`;
};

const getClinicHour = (dateTime: string) => Number(getClinicTime(dateTime).slice(0, 2));

async function getAvailability(
  dateFrom: string,
  dateTo: string,
  filters: { specialtyId?: string; doctorId?: string } = {},
  signal?: AbortSignal,
): Promise<AvailableSlot[]> {
  const query = new URLSearchParams({ dateFrom, dateTo });
  if (filters.specialtyId) query.set('specialtyId', filters.specialtyId);
  if (filters.doctorId) query.set('doctorId', filters.doctorId);
  return getPublicAvailability<AvailableSlot>(query, signal);
}

export async function getScheduleDays(
  specialtyId: string,
  signal?: AbortSignal,
): Promise<ScheduleDay[]> {
  const firstDate = getClinicDateKey(new Date());
  const lastDate = addDays(firstDate, DAYS_AHEAD - 1);
  const slots = await getAvailability(firstDate, lastDate, { specialtyId }, signal);
  const doctorIdsByDate = new Map<string, Set<string>>();

  for (const slot of slots) {
    const dateKey = getClinicDateKey(new Date(slot.startsAt));
    const doctorIds = doctorIdsByDate.get(dateKey) ?? new Set<string>();
    doctorIds.add(slot.doctor.id);
    doctorIdsByDate.set(dateKey, doctorIds);
  }

  return Array.from({ length: DAYS_AHEAD }, (_, index) => {
    const dateKey = addDays(firstDate, index);
    const [year, month, day] = dateKey.split('-').map(Number);
    const availableDoctorCount = doctorIdsByDate.get(dateKey)?.size ?? 0;
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    return {
      dateKey,
      day,
      month,
      year,
      weekdayLabel: WEEKDAY_LABELS[weekday],
      availableDoctorCount,
      isFullyBooked: availableDoctorCount === 0,
    };
  });
}

export async function getAvailableDoctors(
  specialtyId: string,
  dateKey: string,
  signal?: AbortSignal,
): Promise<Doctor[]> {
  const [doctors, slots] = await Promise.all([
    getPublicApiItems<PublicDoctor>(
      `/providers?specialtyId=${encodeURIComponent(specialtyId)}`,
      signal,
    ),
    getAvailability(dateKey, dateKey, { specialtyId }, signal),
  ]);
  const availableDoctorIds = new Set(slots.map((slot) => slot.doctor.id));

  return doctors
    .filter((doctor) => availableDoctorIds.has(doctor.id))
    .map((doctor) => ({
      id: doctor.id,
      fullName: doctor.user.fullName,
      academicTitle: doctor.academicTitle,
      position: doctor.qualification ?? undefined,
      experience: doctor.bio ?? undefined,
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

export async function getTimeSlots(
  doctorId: string,
  dateKey: string,
  signal?: AbortSignal,
): Promise<ShiftSchedule[]> {
  const slots = await getAvailability(dateKey, dateKey, { doctorId }, signal);
  const shiftSlots: Record<ShiftId, TimeSlot[]> = {
    MORNING: [],
    AFTERNOON: [],
  };

  for (const slot of slots) {
    const shiftId: ShiftId = getClinicHour(slot.startsAt) < 12 ? 'MORNING' : 'AFTERNOON';
    shiftSlots[shiftId].push({
      id: slot.id,
      startTime: getClinicTime(slot.startsAt),
      endTime: getClinicTime(slot.endsAt),
      isAvailable: true,
    });
  }

  return (['MORNING', 'AFTERNOON'] as const)
    .filter((id) => shiftSlots[id].length > 0)
    .map((id) => {
      const currentSlots = shiftSlots[id].sort((a, b) => a.startTime.localeCompare(b.startTime));
      return {
        id,
        label: id === 'MORNING' ? 'Ca Buổi Sáng' : 'Ca Buổi Chiều',
        startTime: currentSlots[0].startTime,
        endTime: currentSlots[currentSlots.length - 1].endTime,
        slots: currentSlots,
      };
    });
}
