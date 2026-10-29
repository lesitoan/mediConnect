export type AuditLogResult = "SUCCESS" | "FAILED" | "COMPLETED";

export interface AuditLogDataChange {
  field: string;
  before: string;
  after: string;
  isHighlighted?: boolean;
}

export interface AuditLogTechnicalInfo {
  ipAddress: string;
  userAgent: string;
  requestId: string;
  sessionId: string;
  endpoint: string;
}

export interface AuditLogEntry {
  id: string; // e.g. "AUD-98241"
  date: string; // e.g. "16/10/2026"
  time: string; // e.g. "09:42:15"
  fullTimestamp: string; // e.g. "16/10/2026 · 09:42:15 (UTC+7)"
  executor: string; // e.g. "BS. Nguyễn Tuấn Kiệt", "113.161.42.19"
  executorRole: string; // e.g. "Quản trị viên", "Khách vãng lai"
  action: string; // e.g. "Phê duyệt phân ca trực"
  actionCode: string; // e.g. "APPROVE"
  target: string; // e.g. "#SCH-1049", "#AUTH"
  targetDescription?: string; // e.g. "Ca trực bác sĩ"
  isTargetDanger?: boolean; // For danger items like #AUTH
  result: AuditLogResult;
  resultLabel: string; // e.g. "Thành công", "Thất bại", "Hoàn tất"
  dataChanges?: AuditLogDataChange[];
  reason?: string;
  technicalInfo?: AuditLogTechnicalInfo;
}

export type AuditLogPreset = "TODAY" | "7_DAYS" | "30_DAYS" | "THIS_MONTH";

export interface AuditLogDateRange {
  startDate: string;
  endDate: string;
}

export interface AuditLogFilterValues {
  startDate: string;
  endDate: string;
  preset: AuditLogPreset | "";
  executor: string;
  actionType: string;
  search: string;
  page: number;
  pageSize: number;
}

export const DEFAULT_AUDIT_LOG_DATE_RANGE: AuditLogDateRange = {
  startDate: "",
  endDate: "",
};

export const DEFAULT_AUDIT_LOG_FILTERS: AuditLogFilterValues = {
  ...DEFAULT_AUDIT_LOG_DATE_RANGE,
  preset: "",
  executor: "ALL",
  actionType: "ALL",
  search: "",
  page: 1,
  pageSize: 25,
};

export const AUDIT_LOG_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

