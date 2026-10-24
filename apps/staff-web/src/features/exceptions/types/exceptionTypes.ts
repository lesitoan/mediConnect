export type ExceptionStatus =
  "PENDING" | "AWAITING_CONFIRMATION" | "RESOLVED" | "COMPLETED";

export type ExceptionUrgency = "URGENT" | "PLANNED";

export interface ExceptionAppointment {
  id: string;
  code: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialtyId: string;
  specialtyName: string;
  room: string;
  startTime: string;
  endTime: string;
  paymentAmount: number;
  paymentStatus: "PAID" | "UNPAID";
  status: ExceptionStatus;
  proposedDoctorId?: string;
  proposedDoctorName?: string;
}

export interface ExceptionGroup {
  id: string;
  title: string;
  reason: string;
  date: string;
  urgency: ExceptionUrgency;
  leadTimeLabel?: string;
  appointments: ExceptionAppointment[];
}

export interface ReplacementDoctor {
  id: string;
  name: string;
  specialtyId: string;
  specialtyName: string;
  room: string;
  workStart: string;
  workEnd: string;
  busySlots: { date: string; startTime: string; endTime: string }[];
}

export interface ReplacementDoctorOption extends ReplacementDoctor {
  isAvailable: boolean;
  unavailableReason: string;
}

export interface ExceptionFilterValues {
  search: string;
  status: ExceptionStatus | "ALL";
  urgency: ExceptionUrgency | "ALL";
  page: number;
  pageSize: number;
}

export interface ExceptionSelection {
  groupId: string;
  appointmentId: string;
}

export interface ReassignmentProposalInput {
  appointmentId: string;
  replacementDoctorId: string;
}
