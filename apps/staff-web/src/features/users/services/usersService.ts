import { formatDate, getInitials } from "@/lib/utils";
import type {
  User,
  UserStatus,
  CreateUserInput,
  UpdateUserInput,
} from "../types/userTypes";
import { DEPARTMENTS, INITIAL_USERS } from "../constants";
export {
  DEPARTMENTS,
  INITIAL_USERS,
  getInitials,
};

export function createUserRecord(input: CreateUserInput, stt?: number): User {
  const newId = `usr-${Date.now()}`;
  const code = stt ? String(stt) : String(Date.now()).slice(-4);
  const dateStr = formatDate(new Date());

  const status: UserStatus = input.sendOtp ? "PENDING_OTP" : "ACTIVE";

  return {
    id: newId,
    code,
    name: input.name,
    department: input.department || "Nhân sự mới",
    email: input.email,
    phone: input.phone,
    role: input.role,
    status,
    createdAt: dateStr,
    initials: getInitials(input.name),
    twoFactorEnabled: !input.sendOtp,
    lastLogin: input.sendOtp ? "Chưa kích hoạt" : "Vừa tạo tài khoản",
  };
}

export function updateUserRecord(
  currentUser: User,
  input: UpdateUserInput
): User {
  return {
    ...currentUser,
    name: input.name,
    email: input.email,
    phone: input.phone,
    role: input.role,
    department: input.department,
    initials: getInitials(input.name),
  };
}

