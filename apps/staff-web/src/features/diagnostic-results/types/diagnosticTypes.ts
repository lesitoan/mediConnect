export type DiagnosticCategory = "LAB" | "IMAGING" | "FUNCTION";
export type DiagnosticStatus = "WAITING" | "IN_PROGRESS" | "COMPLETED";
export interface DiagnosticVisit {
  careSessionId: string;
  examinationCode: string;
  patientName: string;
  patientCode: string;
  demographics: string;
  room: string;
  reason: string;
  instructions: string;
}
export interface DiagnosticImage {
  id: string;
  publicId?: string;
  name: string;
  url: string;
  size: number;
  uploadedAt?: string;
  uploadedBy?: string;
}
export interface DiagnosticOrder {
  id: string;
  expectedUpdatedAt?: string;
  visit: DiagnosticVisit;
  service: string;
  serviceCode: string;
  category: DiagnosticCategory;
  status: DiagnosticStatus;
  orderedAt: string;
  conclusion: string;
  images: DiagnosticImage[];
  completedAt?: string;
  recordedBy?: string;
  doctor?: string;
  specialty?: string;
  queueNumber?: number | null;
}
export const DIAGNOSTIC_CATEGORY_LABELS: Record<DiagnosticCategory, string> = {
  LAB: "Xét nghiệm",
  IMAGING: "Chẩn đoán hình ảnh",
  FUNCTION: "Thăm dò chức năng",
};
export const DIAGNOSTIC_STATUS_LABELS: Record<DiagnosticStatus, string> = {
  WAITING: "Chờ tiếp nhận",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Đã hoàn tất",
};
export const MAX_DIAGNOSTIC_IMAGES = 6;
export const MAX_DIAGNOSTIC_IMAGE_BYTES = 5 * 1024 * 1024;
