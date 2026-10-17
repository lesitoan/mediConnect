
import type { UserRole, UserStatus } from "./types/userTypes";


export function getUserRoleLabel(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "ADMIN":
      return "Quản trị viên";
    case "DOCTOR":
      return "Bác sĩ";
    case "RECEPTIONIST":
      return "Lễ tân";
    case "PATIENT":
      return "Bệnh nhân";
    default:
      return role;
  }
}

export function getUserStatusLabel(status: UserStatus): string {
  switch (status) {
    case "ACTIVE":
      return "Đang hoạt động";
    case "PENDING_OTP":
      return "Chờ kích hoạt OTP";
    case "LOCKED":
      return "Đã khóa";
    default:
      return status;
  }
}
