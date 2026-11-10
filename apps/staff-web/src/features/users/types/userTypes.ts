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
export interface ApiUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: { id: string; name: UserRole } | null;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
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
export interface User {
  id: string;
  code: string | null;
  name: string;
  email: string;
  phone: string;
  role: UserRole | null;
  status: UserStatus;
  isCurrentUser: boolean;
  createdAt: string;
  initials: string;
  specialtyId: string | null;
  specialtyName: string | null;
  lastLogin: string;
  patientProfile?: PatientProfileFields;
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
  phone?: string;
  role?: UserRole;
  specialtyId?: string;
}
export interface ToggleUserStatusInput {
  userId: string;
  targetStatus: "ACTIVE" | "LOCKED";
  reason: string;
}
export interface UserOptions {
  specialties: { id: string; name: string; isActive: boolean }[];
}
