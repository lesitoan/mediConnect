import axios from "axios";
import { axiosClient } from "@/lib/api/axiosClient";
import type {
  ReceptionAppointmentDetail,
  ReceptionAppointmentStatus,
  ReceptionListResponse,
  ReceptionPatient,
  ReceptionProvider,
  ReceptionQueueResponse,
  ReceptionTicket,
  SpecialtyOption,
  WalkInRequest,
  WalkInSlot,
} from "../types/receptionTypes";

interface ApiSuccess<T> {
  success: boolean;
  data: T;
}

export interface ReceptionAppointmentsParams {
  date: string;
  tab?: ReceptionAppointmentStatus;
  search?: string;
  specialtyId?: string;
  page: number;
  pageSize: number;
}

export interface ReceptionQueueParams {
  specialtyId: string;
  date: string;
  page?: number;
  limit?: number;
}

export class ReceptionApiError extends Error {
  status: number | undefined;
  errors: Record<string, string[]> | undefined;

  constructor(
    message: string,
    status?: number,
    errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ReceptionApiError";
    this.status = status;
    this.errors = errors;
  }
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
  return response.data.data;
}

export function getReceptionError(error: unknown): ReceptionApiError {
  if (error instanceof ReceptionApiError) return error;
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data as
      | { message?: string | string[]; errors?: Record<string, string[]> }
      | undefined;
    const message = Array.isArray(responseMessage?.message)
      ? responseMessage.message.join(", ")
      : responseMessage?.message;
    const validationMessage = responseMessage?.errors
      ? Object.values(responseMessage.errors).flat().join(", ")
      : undefined;
    const status = error.response?.status;
    return new ReceptionApiError(
      status === 500
        ? "Hệ thống gặp lỗi, vui lòng thử lại."
        : message || validationMessage || "Không thể kết nối máy chủ.",
      status,
      responseMessage?.errors,
    );
  }
  if (error instanceof Error) return new ReceptionApiError(error.message);
  return new ReceptionApiError("Đã xảy ra lỗi không xác định.");
}

export async function listReceptionAppointments(
  params: ReceptionAppointmentsParams,
  signal?: AbortSignal,
): Promise<ReceptionListResponse> {
  try {
    return unwrap(
      await axiosClient.get<ApiSuccess<ReceptionListResponse>>(
        "/reception/appointments",
        { params, signal },
      ),
    );
  } catch (error) {
    throw getReceptionError(error);
  }
}

export async function getReceptionAppointment(
  id: string,
): Promise<ReceptionAppointmentDetail> {
  try {
    return unwrap(
      await axiosClient.get<ApiSuccess<ReceptionAppointmentDetail>>(
        `/reception/appointments/${id}`,
      ),
    );
  } catch (error) {
    throw getReceptionError(error);
  }
}

export async function checkInReceptionAppointment(
  id: string,
): Promise<ReceptionAppointmentDetail> {
  try {
    return unwrap(
      await axiosClient.post<ApiSuccess<ReceptionAppointmentDetail>>(
        `/reception/appointments/${id}/check-in`,
      ),
    );
  } catch (error) {
    throw getReceptionError(error);
  }
}

export async function getReceptionQueue(
  params: ReceptionQueueParams,
): Promise<ReceptionQueueResponse> {
  try {
    return unwrap(
      await axiosClient.get<ApiSuccess<ReceptionQueueResponse>>(
        "/reception/queue",
        { params },
      ),
    );
  } catch (error) {
    throw getReceptionError(error);
  }
}

export async function getReceptionTicket(id: string): Promise<ReceptionTicket> {
  try {
    return unwrap(
      await axiosClient.get<ApiSuccess<ReceptionTicket>>(
        `/reception/appointments/${id}/ticket`,
      ),
    );
  } catch (error) {
    throw getReceptionError(error);
  }
}

export async function searchReceptionSpecialties(
  query = "",
): Promise<SpecialtyOption[]> {
  try {
    const response = await axiosClient.get<
      ApiSuccess<{ items: SpecialtyOption[] }>
    >("/specialties/ai-search", { params: { q: query } });
    return unwrap(response).items;
  } catch (error) {
    throw getReceptionError(error);
  }
}

export async function searchReceptionPatients(
  query: string,
): Promise<ReceptionPatient[]> {
  try {
    const response = await axiosClient.get<
      ApiSuccess<{ items: ReceptionPatient[]; total: number }>
    >("/reception/patients/search", { params: { q: query } });
    return unwrap(response).items;
  } catch (error) {
    throw getReceptionError(error);
  }
}

export async function listReceptionProviders(
  specialtyId: string,
): Promise<ReceptionProvider[]> {
  try {
    const response = await axiosClient.get<
      ApiSuccess<ReceptionProvider[]>
    >("/providers", { params: { specialtyId, page: 1, limit: 100 } });
    return unwrap(response);
  } catch (error) {
    throw getReceptionError(error);
  }
}

export async function listWalkInSlots(
  date: string,
  specialtyId: string,
  doctorId: string,
): Promise<WalkInSlot[]> {
  try {
    const response = await axiosClient.get<
      ApiSuccess<{ items: WalkInSlot[]; total: number }>
    >("/reception/walk-in/slots", {
      params: {
        date,
        specialtyId,
        doctorId,
        page: 1,
        limit: 100,
      },
    });
    return unwrap(response).items;
  } catch (error) {
    throw getReceptionError(error);
  }
}

export async function findNearestWalkInDate(
  date: string,
  specialtyId: string,
  doctorId: string,
  maximumDays = 31,
): Promise<string | null> {
  const start = new Date(`${date}T00:00:00+07:00`);
  for (let offset = 0; offset <= maximumDays; offset += 1) {
    const candidate = new Date(start);
    candidate.setDate(candidate.getDate() + offset);
    const candidateDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(candidate);
    const slots = await listWalkInSlots(
      candidateDate,
      specialtyId,
      doctorId,
    );
    if (slots.length > 0) return candidateDate;
  }
  return null;
}

export async function createReceptionWalkIn(
  input: WalkInRequest,
): Promise<ReceptionAppointmentDetail> {
  try {
    return unwrap(
      await axiosClient.post<ApiSuccess<ReceptionAppointmentDetail>>(
        "/reception/walk-in",
        input,
      ),
    );
  } catch (error) {
    throw getReceptionError(error);
  }
}
