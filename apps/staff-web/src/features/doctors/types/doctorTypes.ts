export type DoctorStatus = "ACTIVE" | "INACTIVE";

export type DoctorStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export type DoctorViewMode = "GRID" | "LIST";

export type MainTab = "DOCTORS" | "SPECIALTIES";

export interface Doctor {
  id: string;
  code: string;
  name: string;
  title: string;
  degree: string;
  avatarUrl: string;
  specialtyId: string;
  specialtyName: string;
  experienceYears: number;
  weeklyAppointments: number;
  rating: number;
  reviewCount: number;
  status: DoctorStatus;
  licenseNumber: string;
  licenseIssuer: string;
  licenseExpiry: string;
  room: string;
  email: string;
  phone: string;
  scheduleSummary: string;
  patientLimitPerSession: number;
  pauseReason?: string;
  pauseStartDate?: string;
  pauseEndDate?: string;
  isIndefinitePause?: boolean;
  pauseStrategy?: AppointmentHandlingStrategy;
}

export interface Specialty {
  id: string;
  code: string;
  name: string;
  description: string;
  doctorCount: number;
  activeRooms: number;
  headDoctorName: string;
  iconName: string;
}

export interface CreateDoctorInput {
  name: string;
  degree: string;
  licenseNumber: string;
  specialtyName: string;
  experienceYears: number;
  room: string;
  email: string;
  phone: string;
  scheduleSummary: string;
  patientLimitPerSession: number;
  avatarUrl?: string;
}

export interface UpdateDoctorInput {
  id: string;
  name: string;
  degree: string;
  licenseNumber: string;
  specialtyName: string;
  experienceYears: number;
  room: string;
  email: string;
  phone: string;
  scheduleSummary: string;
  patientLimitPerSession: number;
  avatarUrl?: string;
  licenseIssuer?: string;
  licenseExpiry?: string;
}

export interface CreateSpecialtyInput {
  name: string;
  code: string;
  description: string;
  headDoctorName: string;
  activeRooms: number;
  iconName?: string;
}

export type AppointmentHandlingStrategy = "REASSIGN" | "CANCEL";

export interface DeactivateDoctorInput {
  doctorId: string;
  strategy: AppointmentHandlingStrategy;
  reason: string;
  startDate: string;
  endDate?: string;
  isIndefinite?: boolean;
}

export interface DoctorFilterValues {
  tab: MainTab;
  search: string;
  specialty: string;
  status: DoctorStatusFilter;
  view: DoctorViewMode;
  page: number;
  pageSize: number;
}

export const DEFAULT_DOCTOR_FILTERS: DoctorFilterValues = {
  tab: "DOCTORS",
  search: "",
  specialty: "",
  status: "ALL",
  view: "GRID",
  page: 1,
  pageSize: 6,
};

export const DOCTOR_PAGE_SIZE_OPTIONS: readonly number[] = [6, 9, 12, 18, 24];

