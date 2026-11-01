import type { User, UserRole, UserStatus } from "./types/userTypes";
export { getApiErrorMessage as userErrorMessage } from "@/lib/api/apiErrorMessage";

export function getUserRoleLabel(role: UserRole): string {
  return (
    {
      ADMIN: "Quản trị viên",
      DOCTOR: "Bác sĩ",
      RECEPTIONIST: "Lễ tân",
      PATIENT: "Bệnh nhân",
    }[role] ?? role
  );
}
export function getUserStatusLabel(status: UserStatus): string {
  return (
    {
      ACTIVE: "Hoạt động",
      PENDING_VERIFICATION: "Chờ xác thực",
      LOCKED: "Đã khóa",
    }[status] ?? status
  );
}
export function canManageUser(user: User): boolean {
  return ["ADMIN", "RECEPTIONIST", "DOCTOR", "PATIENT"].includes(user.role);
}
export function canChangeUserStatus(user: User): boolean {
  return canManageUser(user) && user.role !== "PATIENT" && !user.isCurrentUser;
}
