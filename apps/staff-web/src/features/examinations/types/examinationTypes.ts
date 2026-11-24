export type ExaminationStatus =
  | "CALLED"
  | "IN_PROGRESS"
  | "WAITING_RESULTS"
  | "PAUSED"
  | "WAITING_PAYMENT"
  | "INCOMPLETE"
  | "COMPLETED";
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
export interface LabOrder {
  service: string;
  purpose: string;
  instructions: string;
}
export interface LabResult {
  orderRef: string;
  result: string;
  source: string;
  returnedAt: string;
  recordedBy: string;
  recordedByName?: string;
  images?: LabResultImage[];
}
export interface LabResultImage {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  orderRef: string;
}
export interface LabOrderItem {
  orderRef: string;
  service: string;
  purpose: string;
  instructions: string;
  status: "WAITING" | "IN_PROGRESS" | "COMPLETED";
  orderedAt: string;
  receivedAt?: string;
  draftResult?: string;
  result: string;
  source: string;
  returnedAt?: string;
  recordedBy?: string;
  recordedByName?: string;
  images: LabResultImage[];
}
export interface Examination {
  id: string;
  updatedAt?: string;
  historyRecords?: ExaminationHistory[];
  careSessionId?: string;
  isQueueOnly?: boolean;
  patientName: string;
  patientCode: string;
  demographics: string;
  queueNumber: string;
  room: string;
  date: string;
  shift: string;
  status: ExaminationStatus;
  isLocked?: boolean;
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
  referralSpecialty?: string;
  referralReason?: string;
  referralPriority?: "NORMAL" | "URGENT";
  referralDoctorId?: string;
  pauseReason?: string;
  allergyDetails?: string;
  allergySeverity?: string;
  phone?: string;
  nationalId?: string;
  appointmentTime?: string;
  labOrderItems?: LabOrderItem[];
  labResults?: LabResult[];
  prescriptionItems?: PrescriptionItem[];
}
export interface ExaminationHistory {
  date: string;
  name: string;
  doctor: string;
  diagnosis: string;
  clinicalNotes: string;
  prescription: string;
  labResults: string;
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
