import axios from "axios";
import { axiosClient } from "@/lib/api/axiosClient";
import {
  listReceptionProviders,
  searchReceptionSpecialties,
} from "@/features/reception/services/receptionService";
import type {
  ReceptionProvider,
  SpecialtyOption,
} from "@/features/reception/types/receptionTypes";
import { QUEUE_ERROR_MESSAGES } from "../constants";
import type {
  QueueActionResponse,
  QueueBoardParams,
  QueueBoardResponse,
  QueueStatusResponse,
} from "../types/queueTypes";

interface ApiSuccess<T> {
  success: boolean;
  data: T;
}

export class QueueApiError extends Error {
  status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "QueueApiError";
    this.status = status;
  }
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
  return response.data.data;
}

function toQueueApiError(error: unknown): QueueApiError {
  if (error instanceof QueueApiError) return error;
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401 || status === 403)
      return new QueueApiError(QUEUE_ERROR_MESSAGES.SESSION_EXPIRED, status);
    if (status === 404)
      return new QueueApiError(QUEUE_ERROR_MESSAGES.SESSION_NOT_FOUND, status);
    if (status === 500)
      return new QueueApiError(QUEUE_ERROR_MESSAGES.SYSTEM_FAILED, status);
    if (!error.response)
      return new QueueApiError(QUEUE_ERROR_MESSAGES.NETWORK_FAILED);
    const body = error.response?.data as
      { message?: string | string[] } | undefined;
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : body?.message;
    return new QueueApiError(
      message || QUEUE_ERROR_MESSAGES.ACTION_FAILED,
      status,
    );
  }
  return new QueueApiError(
    error instanceof Error ? error.message : QUEUE_ERROR_MESSAGES.ACTION_FAILED,
  );
}

export async function getQueueBoard(
  params: QueueBoardParams,
  signal?: AbortSignal,
): Promise<QueueBoardResponse> {
  try {
    const response = await axiosClient.get<ApiSuccess<QueueBoardResponse>>(
      "/queues/board",
      { params, signal },
    );
    return unwrap(response);
  } catch (error) {
    throw toQueueApiError(error);
  }
}

async function postQueueAction(
  careSessionId: string,
  action: "call" | "start" | "complete" | "skip" | "restore",
  payload?: { expectedUpdatedAt: string },
): Promise<QueueActionResponse> {
  try {
    const response = await axiosClient.post<ApiSuccess<QueueActionResponse>>(
      `/queues/${careSessionId}/${action}`,
      payload,
    );
    return unwrap(response);
  } catch (error) {
    throw toQueueApiError(error);
  }
}

export function callQueueSession(
  careSessionId: string,
): Promise<QueueActionResponse> {
  return postQueueAction(careSessionId, "call");
}

export function skipQueueSession(
  careSessionId: string,
): Promise<QueueActionResponse> {
  return postQueueAction(careSessionId, "skip");
}

export function startQueueSession(
  careSessionId: string,
): Promise<QueueActionResponse> {
  return postQueueAction(careSessionId, "start");
}

export function completeQueueSession(
  careSessionId: string,
): Promise<QueueActionResponse> {
  return axiosClient
    .get<ApiSuccess<{ updatedAt?: string }>>(`/examinations/${careSessionId}`)
    .then((response) => {
      const expectedUpdatedAt = unwrap(response).updatedAt;
      if (!expectedUpdatedAt) throw new QueueApiError("Không có phiên bản mới nhất của lượt khám");
      return postQueueAction(careSessionId, "complete", { expectedUpdatedAt });
    })
    .catch((error: unknown) => {
      throw toQueueApiError(error);
    });
}

export function restoreQueueSession(
  careSessionId: string,
): Promise<QueueActionResponse> {
  return postQueueAction(careSessionId, "restore");
}

export async function getQueueStatus(
  careSessionId: string,
  date: string,
): Promise<QueueStatusResponse> {
  try {
    const response = await axiosClient.get<ApiSuccess<QueueStatusResponse>>(
      `/queues/${careSessionId}/status`,
      { params: { date } },
    );
    return unwrap(response);
  } catch (error) {
    throw toQueueApiError(error);
  }
}

export async function getQueueFilterOptions(specialtyId: string): Promise<{
  specialties: SpecialtyOption[];
  doctors: ReceptionProvider[];
}> {
  try {
    const [specialties, doctors] = await Promise.all([
      searchReceptionSpecialties(),
      specialtyId === "ALL"
        ? axiosClient
            .get<ApiSuccess<ReceptionProvider[]>>("/providers", {
              params: { page: 1, limit: 100 },
            })
            .then(unwrap)
        : listReceptionProviders(specialtyId),
    ]);
    return { specialties, doctors };
  } catch (error) {
    throw toQueueApiError(error);
  }
}
