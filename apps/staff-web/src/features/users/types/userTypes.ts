export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "DOCTOR"
  | "RECEPTIONIST"
  | "PATIENT";

export type UserStatus = "ACTIVE" | "PENDING_OTP" | "LOCKED";

export type UserRoleFilter =
  | "ALL"
  | "ADMIN"
  | "DOCTOR"
  | "RECEPTIONIST"
  | "PATIENT";

export type UserStatusFilter = "ALL" | "ACTIVE" | "PENDING_OTP" | "LOCKED";

export interface User {
  id: string;
  code: string;
  name: string;
  isCurrentUser?: boolean;
  department: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  avatarColor?: string;
  avatarTextColor?: string;
  initials: string;
  twoFactorEnabled?: boolean;
  lastLogin?: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  sendOtp?: boolean;
}

export interface UpdateUserInput {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
}

export interface ToggleUserStatusInput {
  userId: string;
  targetStatus: UserStatus;
  reason?: string;
}
