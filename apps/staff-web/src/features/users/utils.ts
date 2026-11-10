import type { User, UserRole, UserStatus } from "./types/userTypes";
export { getApiErrorMessage as userErrorMessage } from "@/lib/api/apiErrorMessage";
export { normalizeDoctorPhone as normalizeUserPhone } from "@/features/doctors/doctorUtils";
export function getUserRoleLabel(role: UserRole | null): string {
  return role
    ? ({
        ADMIN: "Quản trị viên",
        DOCTOR: "Bác sĩ",
        RECEPTIONIST: "Lễ tân",
        PATIENT: "Bệnh nhân",
      }[role] ?? role)
    : "Chưa có vai trò";
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
export function canManageUser(user: User) {
  return (
    !!user.role &&
    ["ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"].includes(user.role)
  );
}
export function canChangeUserStatus(user: User) {
  return canManageUser(user) && !user.isCurrentUser && user.role !== "PATIENT";
}
