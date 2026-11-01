import type { SpecialtyRecord } from "@/features/specialties/types/specialtyTypes";
import type { DoctorWriteInput } from "@/features/doctors/types/doctorTypes";

export type UserRole = "ADMIN" | "DOCTOR" | "RECEPTIONIST" | "PATIENT";
export type UserStatus = "ACTIVE" | "PENDING_VERIFICATION" | "LOCKED";
export type UserRoleFilter = "ALL" | UserRole;
export type UserStatusFilter = "ALL" | UserStatus;

export interface PatientProfileFields {
  nationalId: string | null;
  dateOfBirth: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

export interface User {
  id: string;
  code: string;
  name: string;
  isCurrentUser: boolean;
  department: string;
  specialtyId: string | null;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  initials: string;
  lastLogin: string;
  patientProfile?: PatientProfileFields;
}
export interface ApiUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: { id: string; name: UserRole } | null;
  status: UserStatus;
  createdAt: string;
  isCurrentUser: boolean;
  lastLoginAt: string | null;
  doctor: {
    id: string;
    doctorCode: string;
    specialty: { id: string; name: string };
  } | null;
  patient: { patientCode: string } | null;
  patientProfile?: PatientProfileFields;
}
export interface UserPage {
  items: User[];
  totalItems: number;
  totalPages: number;
}
export interface UserOptions {
  specialties: SpecialtyRecord[];
}
export interface CurrentUser {
  id: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  roleId?: string;
  role: string;
  status?: UserStatus;
  permissions: string[];
}
export interface CreateUserInput {
  fullName: string;
  phone: string;
  role: Exclude<UserRole, "PATIENT">;
  doctor?: DoctorWriteInput;
}
export interface UpdateUserInput extends Partial<PatientProfileFields> {
  id: string;
  fullName?: string;
  phone?: string | null;
  role?: UserRole;
  specialtyId?: string;
}
export interface ToggleUserStatusInput {
  userId: string;
  targetStatus: "ACTIVE" | "LOCKED";
  reason: string;
}
