export type QueueStatus = "WAITING" | "CALLING" | "IN_PROGRESS" | "SKIPPED";

export type QueueAction = "CALL" | "SKIP" | "RESTORE";

export interface QueueActionContent {
  title: string;
  confirmLabel: string;
  description: string;
  successMessage: string;
}

export interface QueueItem {
  id: string;
  queueNumber: string;
  queuePosition: number;
  patientId: string;
  patientName: string;
  appointmentStart: string;
  appointmentEnd: string;
  doctorId: string;
  doctorName: string;
  specialtyId: string;
  specialtyName: string;
  room: string;
  visitType: "APPOINTMENT" | "WALK_IN";
  arrivalStatus: "ON_TIME" | "LATE";
  status: QueueStatus;
}

export interface QueueFilterValues {
  search: string;
  specialtyId: string;
  doctorId: string;
}

export interface QueueActionInput {
  id: string;
  action: QueueAction;
  expectedStatus: QueueStatus;
}

export interface QueueFilterOption {
  id: string;
  name: string;
}
