export type ConsultationStatus = "IN_PROGRESS" | "WAITING_LAB" | "PAUSED";

export type ConsultationTab =
  | "ALL"
  | ConsultationStatus;

export interface ConsultationSession {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: "MALE" | "FEMALE";
  patientCode: string;
  sessionCode: string;
  queueNumber: string;
  room: string;
  status: ConsultationStatus;
  dateLabel: string;
  shiftLabel: string;
  actionLabel: string;
}

export interface ConsultationFilterValues {
  tab: ConsultationTab;
  search: string;
  page: number;
  pageSize: number;
}
