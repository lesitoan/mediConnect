export type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';

export type Appointment = {
  id: string;
  code: string;
  status: AppointmentStatus;
  specialty: string;
  doctorName: string;
  expertise: string;
  rating?: number;
  doctorImageUrl?: string;
  time: string;
  weekday: string;
  date: string;
  room: string;
  building: string;
  advanceFee?: number;
};

export type AvailabilityLevel = 'available' | 'limited' | 'full';

export type TimeSlot = {
  time: string;
  period: 'morning' | 'afternoon';
  isAvailable: boolean;
};

export type ScheduleDay = {
  date: string;
  shortWeekday: string;
  weekday: string;
  day: string;
  availability: AvailabilityLevel;
  slots: TimeSlot[];
};

export type RescheduleChange = {
  day: ScheduleDay;
  time: string;
  reason: string;
};

export const RESCHEDULE_REASONS = [
  'Bận lịch công tác đột xuất',
  'Cần dời ngày theo sức khỏe',
  'Trùng lịch khám chuyên khoa khác',
  'Lý do cá nhân khác',
];

export const formatFee = (amount: number) =>
  `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} đ`;

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    code: 'MC-8896-HUY',
    status: 'confirmed',
    specialty: 'Nội Tim Mạch',
    doctorName: 'TS.BS Lê Quang Huy',
    expertise: 'Chuyên gia Can thiệp',
    rating: 4.9,
    time: '08:30',
    weekday: 'Thứ Ba',
    date: '21/10/2025',
    room: 'Phòng 302',
    building: 'Tòa A',
    advanceFee: 300000,
  },
  {
    id: '2',
    code: 'MC-9921-GEN',
    status: 'pending',
    specialty: 'Khám tổng quát',
    doctorName: 'ThS.BS Nguyễn Văn Yên',
    expertise: 'Chuyên gia Đa khoa & Tầm soát',
    time: '14:00',
    weekday: 'Thứ Sáu',
    date: '24/10/2025',
    room: 'Phòng 105',
    building: 'Tòa B',
  },
  {
    id: '3',
    code: 'MC-7710-TMH',
    status: 'completed',
    specialty: 'Tai Mũi Họng',
    doctorName: 'BS.CKI Phạm Minh Châu',
    expertise: 'Chuyên gia Nội soi',
    time: '09:00',
    weekday: 'Thứ Hai',
    date: '06/10/2025',
    room: 'Phòng 210',
    building: 'Tòa A',
  },
  {
    id: '4',
    code: 'MC-7432-DLI',
    status: 'completed',
    specialty: 'Da Liễu',
    doctorName: 'ThS.BS Võ Thu Hà',
    expertise: 'Chuyên gia Da thẩm mỹ',
    time: '10:30',
    weekday: 'Thứ Tư',
    date: '24/09/2025',
    room: 'Phòng 118',
    building: 'Tòa C',
  },
  {
    id: '5',
    code: 'MC-7105-NHI',
    status: 'completed',
    specialty: 'Nhi Khoa',
    doctorName: 'BS.CKII Đặng Thanh Tùng',
    expertise: 'Chuyên gia Hô hấp nhi',
    time: '15:15',
    weekday: 'Thứ Sáu',
    date: '12/09/2025',
    room: 'Phòng 402',
    building: 'Tòa B',
  },
  {
    id: '6',
    code: 'MC-6890-RHM',
    status: 'completed',
    specialty: 'Răng Hàm Mặt',
    doctorName: 'BS Trần Quốc Bảo',
    expertise: 'Chuyên gia Nha chu',
    time: '08:00',
    weekday: 'Thứ Ba',
    date: '26/08/2025',
    room: 'Phòng 021',
    building: 'Tòa D',
  },
  {
    id: '7',
    code: 'MC-6544-MAT',
    status: 'completed',
    specialty: 'Mắt',
    doctorName: 'ThS.BS Hoàng Gia Linh',
    expertise: 'Chuyên gia Khúc xạ',
    time: '13:45',
    weekday: 'Thứ Năm',
    date: '14/08/2025',
    room: 'Phòng 305',
    building: 'Tòa C',
  },
  {
    id: '8',
    code: 'MC-6201-XUO',
    status: 'cancelled',
    specialty: 'Cơ Xương Khớp',
    doctorName: 'PGS.TS.BS Bùi Anh Dũng',
    expertise: 'Chuyên gia Cột sống',
    time: '11:00',
    weekday: 'Thứ Hai',
    date: '04/08/2025',
    room: 'Phòng 207',
    building: 'Tòa A',
  },
];

const MORNING_TIMES = ['07:30', '08:30', '09:15', '10:00', '10:30'];
const AFTERNOON_TIMES = ['14:00', '14:45', '15:30', '16:15'];

const buildSlots = (unavailable: string[]): TimeSlot[] => [
  ...MORNING_TIMES.map((time) => ({
    time,
    period: 'morning' as const,
    isAvailable: !unavailable.includes(time),
  })),
  ...AFTERNOON_TIMES.map((time) => ({
    time,
    period: 'afternoon' as const,
    isAvailable: !unavailable.includes(time),
  })),
];

const MOCK_SCHEDULE_DAYS: ScheduleDay[] = [
  {
    date: '22/10/2025',
    shortWeekday: 'Th 4',
    weekday: 'Thứ Tư',
    day: '22',
    availability: 'available',
    slots: buildSlots(['07:30', '16:15']),
  },
  {
    date: '23/10/2025',
    shortWeekday: 'Th 5',
    weekday: 'Thứ Năm',
    day: '23',
    availability: 'available',
    slots: buildSlots(['07:30', '16:15']),
  },
  {
    date: '24/10/2025',
    shortWeekday: 'Th 6',
    weekday: 'Thứ Sáu',
    day: '24',
    availability: 'limited',
    slots: buildSlots(['07:30', '08:30', '09:15', '10:30', '14:00', '15:30', '16:15']),
  },
  {
    date: '25/10/2025',
    shortWeekday: 'Th 7',
    weekday: 'Thứ Bảy',
    day: '25',
    availability: 'available',
    slots: buildSlots(['16:15']),
  },
  {
    date: '26/10/2025',
    shortWeekday: 'CN',
    weekday: 'Chủ Nhật',
    day: '26',
    availability: 'full',
    slots: buildSlots([...MORNING_TIMES, ...AFTERNOON_TIMES]),
  },
  {
    date: '27/10/2025',
    shortWeekday: 'Th 2',
    weekday: 'Thứ Hai',
    day: '27',
    availability: 'available',
    slots: buildSlots(['07:30']),
  },
  {
    date: '28/10/2025',
    shortWeekday: 'Th 3',
    weekday: 'Thứ Ba',
    day: '28',
    availability: 'available',
    slots: buildSlots([]),
  },
];

export async function getAppointments(profileId: string): Promise<Appointment[]> {
  return profileId ? MOCK_APPOINTMENTS.map((item) => ({ ...item })) : [];
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  const found = MOCK_APPOINTMENTS.find((item) => item.id === id);
  return found ? { ...found } : null;
}

export async function getScheduleDays(appointmentId: string): Promise<ScheduleDay[]> {
  return appointmentId ? MOCK_SCHEDULE_DAYS : [];
}

export async function rescheduleAppointment(
  appointmentId: string,
  change: RescheduleChange,
): Promise<void> {
  const target = MOCK_APPOINTMENTS.find((item) => item.id === appointmentId);
  if (!target) throw new Error('Appointment not found');
  target.time = change.time;
  target.weekday = change.day.weekday;
  target.date = change.day.date;
}