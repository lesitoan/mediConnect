import type { IdentityForm, PatientGender } from "../data";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
  message?: string | string[];
};

export type PatientProfile = {
  patientCode: string;
  nationalId: string | null;
  dateOfBirth: string | null;
  gender: PatientGender | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  updatedAt: string;
  fullName: string;
  email: string | null;
  phone: string | null;
};

export type PatientMedicalRecord = {
  id: string;
  recordType: "MEDICAL_HISTORY" | "ALLERGY";
  name: string;
  description: string | null;
  reaction: string | null;
  severity: "MILD" | "MODERATE" | "SEVERE" | null;
  status: "PENDING_CONFIRMATION" | "CONFIRMED";
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api/v1";
const PAGE_SIZE = 100;

export class PatientProfileApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(
      `Không thể kết nối API tại ${API_URL}. Hãy khởi động backend và kiểm tra cấu hình.`,
    );
  }

  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(", ")
      : payload.message || "Không thể kết nối đến hệ thống";
    throw new PatientProfileApiError(message, response.status);
  }
  if (!payload.success) {
    throw new Error("API không xác nhận yêu cầu tải hồ sơ thành công.");
  }
  return payload;
}

export async function getPatientProfile(signal?: AbortSignal) {
  const response = await request<PatientProfile>("/me/patient-profile", {
    signal,
  });
  return response.data;
}

export async function getPatientMedicalRecords(signal?: AbortSignal) {
  const records: PatientMedicalRecord[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    const response = await request<PatientMedicalRecord[]>(
      `/me/medical-records?${query}`,
      { signal },
    );
    if (!Array.isArray(response.data) || !response.pagination) {
      throw new Error("API trả về danh sách hồ sơ sức khỏe không hợp lệ.");
    }

    records.push(...response.data);
    totalPages = response.pagination.totalPages;
    if (response.data.length === 0 && page < totalPages) {
      throw new Error("API không trả đủ các trang hồ sơ sức khỏe.");
    }
    page += 1;
  } while (page <= totalPages);

  return records;
}

export async function updatePatientProfile(form: IdentityForm) {
  const response = await request<{ patientProfile?: PatientProfile }>("/me", {
    method: "PATCH",
    body: JSON.stringify({
      dateOfBirth: form.dateOfBirth || null,
      gender: form.gender || null,
      address: form.address.trim() || null,
    }),
  });
  if (!response.data.patientProfile) {
    throw new Error("API không trả về hồ sơ bệnh nhân sau khi cập nhật.");
  }
  return response.data.patientProfile;
}
