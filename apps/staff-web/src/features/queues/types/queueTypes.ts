export type QueueStatus =
  | "WAITING"
  | "CHECKED_IN"
  | "CALLED"
  | "IN_CONSULTATION"
  | "SKIPPED"
  | "NO_SHOW";

export type QueueAction = "CALL" | "SKIP" | "RESTORE";

export interface QueueItem {
  careSessionId: string;
  appointmentId: string;
  appointmentCode: string;
  patientCode: string;
  patientName: string;
  queueNumber: number | null;
  queueDisplayNumber: string | null;
  appointmentTime: string;
  appointmentStartsAt: string;
  arrivalStatus: "LATE" | "ON_TIME";
  room: string | null;
  doctorId: string;
  doctorName: string;
  specialtyId: string;
  specialtyName: string;
  status: QueueStatus;
  skipCount: number;
  nextSkipCount: number;
  canCall: boolean;
  cannotCallReason: string | null;
  calledAt: string | null;
  skippedAt: string | null;
  isNoShow: boolean;
  skipAllowedInSeconds: number;
}

export interface QueueBoardResponse {
  date: string;
  timeZone: "Asia/Ho_Chi_Minh";
  counts: {
    waiting: number;
    called: number;
    inConsultation: number;
    skipped: number;
  };
  items: QueueItem[];
}

export interface QueueBoardParams {
  date: string;
  search?: string;
  specialtyId?: string;
  doctorId?: string;
}

export interface QueueFilterValues {
  search: string;
  specialtyId: string;
  doctorId: string;
}

export interface QueueFilterOption {
  id: string;
  name: string;
}

export interface QueueStatusResponse extends QueueItem {
  date: string;
}

export interface QueueActionResponse {
  board: QueueBoardResponse;
}
