export const AUDIT_ACTION_LABELS: Readonly<Record<string, string>> = {
  DOCTOR_CREATE: 'Tạo hồ sơ bác sĩ',
  DOCTOR_UPDATE: 'Cập nhật hồ sơ bác sĩ',
  DOCTOR_PAUSE_SCHEDULE: 'Lên kế hoạch tạm dừng bác sĩ',
  DOCTOR_PAUSE_CANCEL: 'Hủy kế hoạch tạm dừng bác sĩ',
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
