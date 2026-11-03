export type MainTab = "DOCTORS" | "SPECIALTIES";
export type DoctorViewMode = "GRID" | "LIST";
export type AcademicTitle = "PROFESSOR" | "ASSOCIATE_PROFESSOR";
export interface Doctor {
  id: string;
  userId: string;
  specialtyId: string;
  doctorCode: string;
  licenseNumber: string;
  academicTitle: AcademicTitle | null;
  qualification: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isPaused: boolean;
  user: {
    fullName: string;
    email: string | null;
    phone: string | null;
    status: string;
  };
  specialty: { id: string; code: string; name: string; roomCode: string };
}
export interface DoctorWriteInput {
  specialtyId: string;
  doctorCode: string;
  licenseNumber: string;
  academicTitle: AcademicTitle | null;
  qualification: string | null;
  bio: string | null;
  avatarUrl: string | null;
}
export interface CreateDoctorInput extends DoctorWriteInput {
  fullName: string;
  phone: string;
}
export interface PauseRecord {
  id: string;
  doctorId: string;
  startsAt: string;
  endsAt: string | null;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
}
export interface CreateDoctorPauseInput {
  doctorId: string;
  startsAt: string;
  endsAt: string | null;
  reason: string | null;
}
export interface AffectedAppointment {
  careSessionId: string;
  appointmentCode: string;
  patient: { patientCode: string; fullName: string };
  startsAt: string;
  endsAt: string;
}
export interface DoctorFilterValues {
  doctorId: string;
  tab: MainTab;
  search: string;
  specialty: string;
  view: DoctorViewMode;
  page: number;
  pageSize: number;
}
export const DEFAULT_DOCTOR_FILTERS: DoctorFilterValues = {
  doctorId: "",
  tab: "DOCTORS",
  search: "",
  specialty: "",
  view: "GRID",
  page: 1,
  pageSize: 6,
};
export const DOCTOR_PAGE_SIZE_OPTIONS = [6, 9, 12, 18, 24] as const;
export const MAX_DOCTOR_AVATAR_BYTES = 2 * 1024 * 1024;
