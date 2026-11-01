export type ApprovalRequestType =
  "EMERGENCY_LEAVE" | "SWAP_SHIFT" | "PLANNED_LEAVE" | "CROSS_SWAP";

export type ApprovalRequestStatus =
  | "URGENT"
  | "PENDING"
  | "RESOLVING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

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
  exceptions?: ApprovalRequestDetails["exceptions"];
}

export interface ApprovalRequestDetails extends ApprovalRequest {
  exceptions: Array<{
    id: string;
    status: string;
    resolution: "REASSIGNED" | "RESCHEDULED" | "CANCELLED" | null;
    careSession: {
      id: string;
      status: string;
      appointment: { id: string; appointmentCode: string };
      appointmentSlot: {
        startsAt: string;
        endsAt: string;
      } | null;
    };
    reassignments: Array<{
      id: string;
      status: string;
      toDoctorId: string | null;
      toSlotId: string | null;
    }>;
  }>;
}

export interface LeaveImpact {
  affectedSessions: Array<{
    id: string;
    appointmentId: string;
    appointmentSlot: { startsAt: string; endsAt: string } | null;
  }>;
  replacementDoctors: Array<{
    id: string;
    doctorCode: string;
    user: { fullName: string };
    specialty: { name: string };
  }>;
}

export interface ApprovalDecisionInput {
  id: string;
  notes?: string;
  replacementDoctorId?: string;
}

export interface ApprovalTableFilterValues {
  search: string;
  type: ApprovalRequestType | "ALL";
  status: ApprovalRequestStatus | "ALL";
  page: number;
  pageSize: number;
}
