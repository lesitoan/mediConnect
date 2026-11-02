import axios from "axios";
import { axiosClient } from "@/lib/api/axiosClient";
import type {
  Examination,
  ExaminationHistory,
  LabResult,
} from "../types/examinationTypes";

interface ApiSuccess<T> {
  success: boolean;
  data: T;
}

interface ApiExamination {
  id: string;
  appointmentCode: string;
  patientName: string | null;
  patientCode: string | null;
  demographics: string | null;
  queueNumber: string | null;
  room: string | null;
  date: string | null;
  shift: string | null;
  status: Examination["status"];
  allergy: string | null;
  history: string | null;
  complaint: string | null;
  clinicalNotes: string | null;
  diagnosis: string | null;
  prescription: string | null;
  prescriptionItems?: Examination["prescriptionItems"] | null;
  labOrders: string | null;
  labReason?: string | null;
  labNotes?: string | null;
  followUpDate: string | null;
  transfer: string | null;
  historyConditions?: Examination["historyConditions"] | null;
  surgicalHistory?: string | null;
  currentMedications?: string | null;
  riskFactors?: string | null;
  secondaryDiagnoses?: Examination["secondaryDiagnoses"] | null;
  diagnosisNotes?: string | null;
  followUpReason?: string | null;
  patientAdvice?: string | null;
  pauseReason?: string | null;
  isLocked?: boolean;
  updatedAt?: string;
  labResults?: LabResult[];
  historyRecords?: Examination["historyRecords"];
  allergyDetails?: string;
  allergySeverity?: string;
  phone?: string;
  nationalId?: string;
  appointmentTime?: string;
}

export class ExaminationApiError extends Error {
  status?: number;
  fields: string[];

  constructor(message: string, status?: number, fields: string[] = []) {
    super(message);
    this.name = "ExaminationApiError";
    this.status = status;
    this.fields = fields;
  }
}

function unwrap<T>(response: { data: ApiSuccess<T> }) {
  return response.data.data;
}

export function mapExamination(item: ApiExamination): Examination {
  return {
    ...item,
    id: item.appointmentCode,
    careSessionId: item.id,
    patientName: item.patientName ?? "Chưa có tên bệnh nhân",
    patientCode: item.patientCode ?? "Chưa có mã bệnh nhân",
    demographics: item.demographics ?? "Chưa có thông tin",
    queueNumber: item.queueNumber ?? "STT -",
    room: item.room ?? "Chưa phân phòng",
    date: item.date ?? "",
    shift: item.shift ?? "",
    allergy: item.allergy ?? "Chưa ghi nhận",
    history: item.history ?? "",
    complaint: item.complaint ?? "",
    clinicalNotes: item.clinicalNotes ?? "",
    diagnosis: item.diagnosis ?? "",
    prescription: item.prescription ?? "",
    prescriptionItems: item.prescriptionItems ?? [],
    labOrders: item.labOrders ?? "",
    labReason: item.labReason ?? "",
    labNotes: item.labNotes ?? "",
    followUpDate: item.followUpDate ?? "",
    transfer: item.transfer ?? "",
    historyConditions: item.historyConditions ?? [],
    surgicalHistory: item.surgicalHistory ?? "",
    currentMedications: item.currentMedications ?? "",
    riskFactors: item.riskFactors ?? "",
    secondaryDiagnoses: item.secondaryDiagnoses ?? [],
    diagnosisNotes: item.diagnosisNotes ?? "",
    followUpReason: item.followUpReason ?? "",
    patientAdvice: item.patientAdvice ?? "",
    pauseReason: item.pauseReason ?? "",
    updatedAt: item.updatedAt,
    referralSpecialty: undefined,
    labResults: item.labResults ?? [],
    historyRecords: item.historyRecords ?? [],
    allergyDetails: item.allergyDetails ?? "",
    allergySeverity: item.allergySeverity ?? "",
    phone: item.phone ?? "",
    nationalId: item.nationalId ?? "",
    appointmentTime: item.appointmentTime ?? "",
  };
}

function toError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data as
      { message?: string | string[] } | undefined;
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : body?.message;
    return new ExaminationApiError(
      status === 401 || status === 403
        ? "Phiên đăng nhập hết hạn hoặc không có quyền"
        : status === 404
          ? "Không tìm thấy phiên khám"
          : status === 409
            ? message || "Phiên khám vừa được cập nhật, vui lòng tải lại"
            : status === 500
              ? "Hệ thống gặp lỗi, vui lòng thử lại"
              : message ||
                (!error.response
                  ? "Không thể kết nối máy chủ"
                  : "Không thể cập nhật phiên khám"),
      status,
      Array.isArray(body?.message) ? body.message : [],
    );
  }
  return new ExaminationApiError(
    error instanceof Error ? error.message : "Không thể cập nhật phiên khám",
  );
}

export async function listExaminations(
  date?: string,
  signal?: AbortSignal,
): Promise<Examination[]> {
  try {
    const response = await axiosClient.get<ApiSuccess<ApiExamination[]>>(
      "/examinations",
      { params: date ? { date } : undefined, signal },
    );
    return unwrap(response).map(mapExamination);
  } catch (error) {
    throw toError(error);
  }
}

export async function updateExamination(
  id: string,
  changes: Partial<Examination>,
): Promise<Examination> {
  if (!changes.updatedAt)
    throw new ExaminationApiError("expectedUpdatedAt is required", 400, ["expectedUpdatedAt"]);
  try {
    const response = await axiosClient.patch<ApiSuccess<ApiExamination>>(
      `/examinations/${id}`,
      {
        complaint: changes.complaint,
        clinicalNotes: changes.clinicalNotes,
        diagnosis: changes.diagnosis === undefined
          ? undefined
          : changes.diagnosis.split(" — ").map((part) => part.trim()).join(" — "),
        diagnosisNotes: changes.diagnosisNotes,
        secondaryDiagnoses: changes.secondaryDiagnoses?.map(({ code, name }) => ({
          code: code.trim(),
          name: name.trim(),
        })),
        prescriptionItems: changes.prescriptionItems,
        labOrders: changes.labOrders,
        labReason: changes.labReason,
        labNotes: changes.labNotes,
        followUpDate: changes.followUpDate,
        followUpReason: changes.followUpReason,
        patientAdvice: changes.patientAdvice,
        referralSpecialty: changes.referralSpecialty,
        status: changes.status,
        transfer: changes.transfer,
        pauseReason: changes.pauseReason,
        expectedUpdatedAt: changes.updatedAt,
      },
    );
    return mapExamination(unwrap(response));
  } catch (error) {
    throw toError(error);
  }
}

export async function recordExaminationLabResult(
  id: string,
  orderRef: string,
  result: string,
  source: string,
  expectedUpdatedAt: string,
): Promise<Examination> {
  try {
    const response = await axiosClient.post<ApiSuccess<ApiExamination>>(
      `/examinations/${id}/lab-results`,
      { orderRef, result, source, expectedUpdatedAt },
    );
    return mapExamination(unwrap(response));
  } catch (error) {
    throw toError(error);
  }
}

export async function getExaminationHistory(
  id: string,
): Promise<ExaminationHistory[]> {
  try {
    const response = await axiosClient.get<ApiSuccess<ExaminationHistory[]>>(
      `/examinations/${id}/history`,
    );
    return unwrap(response);
  } catch (error) {
    throw toError(error);
  }
}

export async function getExamination(id: string): Promise<Examination> {
  try {
    const response = await axiosClient.get<ApiSuccess<ApiExamination>>(`/examinations/${id}`);
    return mapExamination(unwrap(response));
  } catch (error) {
    throw toError(error);
  }
}

export async function openExamination(id: string, expectedUpdatedAt: string): Promise<Examination> {
  try {
    const response = await axiosClient.post<ApiSuccess<ApiExamination>>(
      `/examinations/${id}/open`,
      { expectedUpdatedAt },
    );
    return mapExamination(unwrap(response));
  } catch (error) {
    throw toError(error);
  }
}

async function postExaminationTransition(id: string, action: string, body: Record<string, string | undefined>): Promise<Examination> {
  try {
    const response = await axiosClient.post<ApiSuccess<ApiExamination>>(`/examinations/${id}/${action}`, body);
    return mapExamination(unwrap(response));
  } catch (error) {
    throw toError(error);
  }
}

export function pauseExamination(id: string, reason: string, expectedUpdatedAt: string) {
  return postExaminationTransition(id, "pause", { reason, expectedUpdatedAt });
}

export function resumeExamination(id: string, expectedUpdatedAt: string) {
  return postExaminationTransition(id, "resume", { expectedUpdatedAt });
}

export function referExamination(id: string, body: { targetSpecialtyName: string; reason: string; priority: "NORMAL" | "URGENT"; requestedDoctorId?: string; expectedUpdatedAt: string }) {
  return postExaminationTransition(id, "referrals", body);
}

export function markExaminationIncomplete(id: string, reason: string, plan: string, expectedUpdatedAt: string) {
  return postExaminationTransition(id, "incomplete", { reason, plan, expectedUpdatedAt });
}

export async function completeExamination(id: string, expectedUpdatedAt: string): Promise<Examination> {
  try {
    await axiosClient.post<ApiSuccess<unknown>>(`/queues/${id}/complete`, { expectedUpdatedAt });
    return getExamination(id);
  } catch (error) {
    throw toError(error);
  }
}
