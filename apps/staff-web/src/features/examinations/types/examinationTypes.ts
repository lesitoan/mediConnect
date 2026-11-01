export type ExaminationStatus =
  "IN_PROGRESS" | "WAITING_RESULTS" | "PAUSED" | "COMPLETED";
export interface Diagnosis {
  code: string;
  name: string;
}
export interface PrescriptionItem {
  id: string;
  name: string;
  strength: string;
  dose: string;
  route: string;
  frequency: string;
  days: number;
  quantity: number;
  instructions: string;
}
export interface HistoryCondition {
  name: string;
  note: string;
  isConfirmed: boolean;
}
export interface Examination {
  id: string;
  isQueueOnly?: boolean;
  patientName: string;
  patientCode: string;
  demographics: string;
  queueNumber: string;
  room: string;
  date: string;
  shift: string;
  status: ExaminationStatus;
  allergy: string;
  history: string;
  complaint: string;
  clinicalNotes: string;
  diagnosis: string;
  prescription: string;
  labOrders: string;
  followUpDate: string;
  transfer: string;
  historyConditions?: HistoryCondition[];
  surgicalHistory?: string;
  currentMedications?: string;
  riskFactors?: string;
  secondaryDiagnoses?: Diagnosis[];
  diagnosisNotes?: string;
  labReason?: string;
  labNotes?: string;
  followUpReason?: string;
  patientAdvice?: string;
  prescriptionItems?: PrescriptionItem[];
}
export type ExaminationAction =
  | "HISTORY"
  | "TRANSFER"
  | "DIAGNOSIS"
  | "PRESCRIPTION"
  | "LABS"
  | "FOLLOW_UP"
  | "COMPLETE"
  | "WAIT_RESULTS"
  | "RECORDS";
