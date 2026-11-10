export type ConsultationMedicalRecord = {
  id: string;
  careSessionId: string;
  clinicalNotes: string | null;
  prescription: unknown;
  labOrderNotes: string | null;
  labResultNotes: string | null;
  followUpDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  lockedAt: string | null;
  appointment: { id: string; appointmentCode: string; status: string };
  patient: {
    id: string;
    patientCode: string;
    fullName: string;
    dateOfBirth: string | null;
    gender: string | null;
  };
  doctor: { id: string; fullName: string };
  specialty: { id: string; name: string };
  slot: { startsAt: string; endsAt: string };
  room: string;
  careSessionStatus: string;
  diagnoses: Array<{
    id: string;
    diagnosisName: string;
    diagnosisCode: string | null;
    isPrimary: boolean;
    notes: string | null;
  }>;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string | string[];
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api/v1";

export class MedicalRecordsApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function getMyConsultation(consultationId: string) {
  let response: Response;
  try {
    response = await fetch(
      `${API_URL}/me/consultations/${encodeURIComponent(consultationId)}`,
      { credentials: "include" },
    );
  } catch {
    throw new Error(
      `Không thể kết nối API tại ${API_URL}. Hãy khởi động backend và kiểm tra cấu hình.`,
    );
  }

  const payload = (await response.json()) as ApiResponse<ConsultationMedicalRecord>;
  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(", ")
      : payload.message || "Không thể tải hồ sơ bệnh án.";
    throw new MedicalRecordsApiError(message, response.status);
  }
  if (!payload.success) {
    throw new Error("API không xác nhận yêu cầu tải hồ sơ bệnh án thành công.");
  }
  return payload.data;
}
