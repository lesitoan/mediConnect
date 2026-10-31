export const AUDIT_ACTION_LABELS: Readonly<Record<string, string>> = {
  USER_CREATE: 'Tạo tài khoản nhân sự',
  USER_UPDATE: 'Cập nhật thông tin tài khoản',
  USER_ROLE_CHANGE: 'Thay đổi vai trò tài khoản',
  USER_LOCK: 'Khóa tài khoản nhân sự',
  USER_UNLOCK: 'Mở khóa tài khoản nhân sự',
  PATIENT_PROFILE_UPDATE: 'Cập nhật hồ sơ cá nhân bệnh nhân',
  DOCTOR_CREATE: 'Tạo hồ sơ bác sĩ',
  DOCTOR_UPDATE: 'Cập nhật hồ sơ bác sĩ',
  DOCTOR_PAUSE_SCHEDULE: 'Lên kế hoạch tạm dừng bác sĩ',
  DOCTOR_PAUSE_CANCEL: 'Hủy kế hoạch tạm dừng bác sĩ',
  LEAVE_REQUEST_CREATED: 'Gửi yêu cầu nghỉ',
  LEAVE_REQUEST_REJECTED: 'Từ chối yêu cầu nghỉ',
  LEAVE_REQUEST_APPROVED: 'Phê duyệt yêu cầu nghỉ',
  SCHEDULE_EXCEPTION_REASSIGNED: 'Phân công lại lịch hẹn',
  SCHEDULE_EXCEPTION_RESCHEDULE_REQUIRED: 'Yêu cầu đổi lịch hẹn',
  SCHEDULE_EXCEPTION_CANCELLED: 'Hủy lịch hẹn bị ảnh hưởng',
  SPECIALTY_CREATE: 'Tạo chuyên khoa',
  SPECIALTY_UPDATE: 'Cập nhật chuyên khoa',
  SPECIALTY_DEACTIVATE: 'Tạm dừng chuyên khoa',
  SPECIALTY_ACTIVATE: 'Kích hoạt chuyên khoa',
  EXPORT_AUDIT_LOG: 'Xuất nhật ký hệ thống',
  ACCOUNT_ACTIVATE: 'Kích hoạt tài khoản',
  ACCOUNT_REGISTER: 'Đăng ký tài khoản',
  ACCOUNT_RESET_CREDENTIALS: 'Đặt lại mật khẩu',
  ACCOUNT_LOGIN: 'Đăng nhập',
  ACCOUNT_LOGOUT: 'Đăng xuất',
  ACCOUNT_LOGOUT_ALL: 'Đăng xuất tất cả thiết bị',
  ACCOUNT_REVOKE_SESSION: 'Thu hồi phiên đăng nhập',
  ACCOUNT_REVOKE_REUSED_SESSION:
    'Thu hồi phiên do phát hiện tái sử dụng thông tin đăng nhập',
};

export function getAuditActionLabel(actionCode: string): string {
  return AUDIT_ACTION_LABELS[actionCode] ?? actionCode;
}
