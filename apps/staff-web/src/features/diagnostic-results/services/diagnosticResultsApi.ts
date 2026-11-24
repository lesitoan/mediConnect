import axios from "axios";
import { axiosClient } from "@/lib/api/axiosClient";
import { LAB_CATALOG } from "@/features/examinations/constants";
import type {
  LabOrderItem,
  LabResultImage,
} from "@/features/examinations/types/examinationTypes";
import type {
  DiagnosticOrder,
} from "../types/diagnosticTypes";

interface ApiSuccess<T> {
  success: boolean;
  data: T;
}

interface ApiDiagnosticOrder extends LabOrderItem {
  careSessionId: string;
  examinationCode: string;
  patientName: string;
  patientCode: string;
  demographics: string;
  room: string;
  reason: string;
  expectedUpdatedAt: string;
}

function toError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : body?.message;
    return new Error(
      message ||
        (!error.response
          ? "Không thể kết nối máy chủ."
          : "Không thể cập nhật kết quả CLS."),
    );
  }
  return error instanceof Error
    ? error
    : new Error("Không thể cập nhật kết quả CLS.");
}

function mapDiagnosticOrder(item: ApiDiagnosticOrder): DiagnosticOrder {
  const catalog = LAB_CATALOG.find(
    (service) =>
      service.name === item.service || service.code === item.service,
  );
  return {
    id: `${item.careSessionId}::${item.orderRef}`,
    careSessionId: item.careSessionId,
    examinationCode: item.examinationCode,
    patientName: item.patientName,
    patientCode: item.patientCode,
    demographics: item.demographics,
    room: item.room,
    reason: item.reason,
    instructions: item.instructions,
    expectedUpdatedAt: item.expectedUpdatedAt,
    orderRef: item.orderRef,
    service: item.service,
    serviceCode: catalog?.code ?? "CLS",
    category:
      catalog?.category === "IMAGING"
        ? "IMAGING"
        : catalog?.category === "FUNCTION"
          ? "FUNCTION"
          : "LAB",
    status: item.status,
    orderedAt: item.orderedAt,
    conclusion: item.result || item.draftResult || "",
    source: item.source,
    images: item.images.map((image: LabResultImage) => ({
      ...image,
      fileId: image.id,
    })),
    completedAt: item.returnedAt,
    recordedBy: item.recordedByName ?? item.recordedBy,
  };
}

export async function listDiagnosticResults(
  date?: string,
): Promise<DiagnosticOrder[]> {
  try {
    const response = await axiosClient.get<ApiSuccess<ApiDiagnosticOrder[]>>(
      "/diagnostic-results",
      { params: date ? { date } : undefined },
    );
    return response.data.data.map(mapDiagnosticOrder);
  } catch (error) {
    throw toError(error);
  }
}

export async function receiveDiagnosticOrder(
  careSessionId: string,
  orderRef: string,
  expectedUpdatedAt: string,
): Promise<void> {
  try {
    await axiosClient.post(
      `/diagnostic-results/${careSessionId}/orders/receive`,
      { orderRef, expectedUpdatedAt },
    );
  } catch (error) {
    throw toError(error);
  }
}

export async function saveDiagnosticResultDraft(
  careSessionId: string,
  orderRef: string,
  result: string,
  expectedUpdatedAt: string,
): Promise<string> {
  try {
    const response = await axiosClient.patch<
      ApiSuccess<{ updatedAt: string }>
    >(`/diagnostic-results/${careSessionId}/orders/draft`, {
      orderRef,
      result,
      expectedUpdatedAt,
    });
    return response.data.data.updatedAt;
  } catch (error) {
    throw toError(error);
  }
}

export async function uploadDiagnosticResultFiles(
  careSessionId: string,
  orderRef: string,
  expectedUpdatedAt: string,
  files: readonly File[],
): Promise<void> {
  const body = new FormData();
  body.set("orderRef", orderRef);
  body.set("expectedUpdatedAt", expectedUpdatedAt);
  files.forEach((file) => body.append("files", file));
  try {
    await axiosClient.post(
      `/diagnostic-results/${careSessionId}/orders/files`,
      body,
      { timeout: 120000 },
    );
  } catch (error) {
    throw toError(error);
  }
}

export async function removeDiagnosticResultFile(
  careSessionId: string,
  fileId: string,
  orderRef: string,
  expectedUpdatedAt: string,
): Promise<void> {
  try {
    await axiosClient.delete(
      `/diagnostic-results/${careSessionId}/orders/files/${fileId}`,
      { data: { orderRef, expectedUpdatedAt } },
    );
  } catch (error) {
    throw toError(error);
  }
}

export async function completeDiagnosticOrder(
  careSessionId: string,
  orderRef: string,
  result: string,
  source: string,
  expectedUpdatedAt: string,
): Promise<void> {
  try {
    await axiosClient.post(
      `/diagnostic-results/${careSessionId}/orders/complete`,
      { orderRef, result, source, expectedUpdatedAt },
    );
  } catch (error) {
    throw toError(error);
  }
}

export async function getDiagnosticResultImage(
  careSessionId: string,
  orderRef: string,
  fileId: string,
): Promise<Blob> {
  try {
    const response = await axiosClient.get<Blob>(
      `/diagnostic-results/${careSessionId}/orders/files/${fileId}`,
      { params: { orderRef }, responseType: "blob" },
    );
    return response.data;
  } catch (error) {
    throw toError(error);
  }
}
