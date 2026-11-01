export type ReceptionAppointmentStatus =
  | "WAITING_CHECKIN"
  | "LATE"
  | "CHECKED_IN";

export type ReceptionFilterTab =
  | "ALL"
  | "WAITING_CHECKIN"
  | "LATE"
  | "CHECKED_IN";

export interface ReceptionFilterValues {
  tab: ReceptionFilterTab;
  search: string;
  specialty: string;
  page: number;
  pageSize: number;
}

export interface PatientAppointment {
  id: string;
  appointmentCode: string;
  patientCode: string;
  patientName: string;
  patientPhone: string;
  patientGender?: "MALE" | "FEMALE" | "OTHER";
  patientBirthYear?: number;
  time: string;
  startsAt?: string;
  endsAt?: string;
  doctorName: string;
  doctorDegree: string;
  room: string;
  specialtyId?: string;
  specialtyName: string;
  doctorId?: string;
  status: ReceptionAppointmentStatus;
  queueNumber?: number | string | null;
  queueDisplayNumber?: string | null;
  reason?: string | null;
  checkInTime?: string | null;
  checkedInAt?: string | null;
  isLate?: boolean;
  isOnTime?: boolean;
}

export interface ReceptionAppointmentDetail extends PatientAppointment {
  patientBirthDate?: string;
}

export interface ReceptionListResponse {
  items: ReceptionAppointmentDetail[];
  total: number;
  page: number;
  limit: number;
  stats: ReceptionStats;
  timeZone: string;
}

export interface SpecialtyOption {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  roomCode?: string | null;
}

export interface ReceptionProvider {
  id: string;
  doctorCode: string;
  academicTitle: string | null;
  qualification: string | null;
  isActive: boolean;
  isPaused?: boolean;
  user: { fullName: string };
  specialty: { id: string; name: string; roomCode: string | null };
}

export interface WalkInSlot {
  id: string;
  startsAt: string;
  endsAt: string;
  doctor: {
    id: string;
    fullName: string;
    specialty: { id: string; name: string; roomCode: string | null };
  };
}

export interface ReceptionPatient {
  id: string;
  patientCode: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  nationalId: string | null;
  address: string | null;
}

export interface WalkInRequest {
  patientId?: string;
  fullName?: string;
  phone?: string;
  birthYear?: number;
  gender?: "MALE" | "FEMALE" | "OTHER";
  nationalId?: string;
  address?: string;
  specialtyId: string;
  doctorId: string;
  appointmentSlotId: string;
  reason?: string;
  checkIn: boolean;
}

export interface ReceptionQueueItem {
  id: string;
  appointmentId: string;
  appointmentCode: string;
  specialtyId: string;
  patientCode: string;
  patientName: string;
  patientPhone?: string | null;
  queueNumber: number | null;
  queueDisplayNumber: string | null;
  appointmentTime: string;
  startsAt: string;
  status: string;
  doctorName: string;
  doctorTitle: string;
}

export interface ReceptionQueueResponse {
  items: ReceptionQueueItem[];
  total: number;
  page: number;
  limit: number;
  timeZone: string;
}

export interface ReceptionTicket {
  appointmentId: string;
  appointmentCode: string;
  patient: {
    patientCode: string;
    fullName: string;
    phone: string;
  };
  doctor: {
    id: string;
    name: string;
    title: string;
  };
  specialty: {
    id: string;
    name: string;
    roomCode: string | null;
  };
  room: string | null;
  appointmentTime: string;
  queueNumber: number | null;
  queueDisplayNumber: string | null;
  reason: string | null;
}

export interface ReceptionStats {
  total: number;
  waitingCheckIn: number;
  upcoming: number;
  late: number;
  checkedIn: number;
}
