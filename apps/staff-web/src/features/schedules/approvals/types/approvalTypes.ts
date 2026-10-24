export type ApprovalRequestType =
  "EMERGENCY_LEAVE" | "SWAP_SHIFT" | "PLANNED_LEAVE" | "CROSS_SWAP";

export type ApprovalRequestStatus =
  "URGENT" | "PENDING" | "APPROVED" | "REJECTED";

export interface ApprovalRequest {
  id: string;
  requestCode: string;
  doctorId: string;
  doctorCode: string;
  doctorName: string;
  specialtyName: string;
  type: ApprovalRequestType;
  typeName: string;
  reason: string;
  date: string;
  shiftTime: string;
  status: ApprovalRequestStatus;
  isUrgent?: boolean;
  targetDoctorId?: string;
  targetDoctorName?: string;
  notes?: string;
  createdAt: string;
}

export interface ApprovalDecisionInput {
  id: string;
  notes?: string;
}

export interface ApprovalTableFilterValues {
  search: string;
  type: ApprovalRequestType | "ALL";
  status: ApprovalRequestStatus | "ALL";
  page: number;
  pageSize: number;
}
