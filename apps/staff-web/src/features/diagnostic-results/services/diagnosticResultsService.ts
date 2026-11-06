import axios from 'axios';
import { axiosClient } from '@/lib/api/axiosClient';
import type { DiagnosticOrder } from '../types/diagnosticTypes';

interface ApiSuccess<T> { success: boolean; data: T }
interface DiagnosticListResponse { items: DiagnosticOrder[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }
export interface DiagnosticFilters { date: string; status: string; category: string; search: string; page: number; pageSize: number }

export class DiagnosticResultsApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) { super(message); this.name = 'DiagnosticResultsApiError'; this.status = status; }
}

function errorFrom(error: unknown): DiagnosticResultsApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data as { message?: string | string[] } | undefined;
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    return new DiagnosticResultsApiError(status === 403 ? 'Tài khoản không có quyền tiếp nhận kết quả CLS.' : status === 409 ? message ?? 'Chỉ định vừa được cập nhật. Hãy tải lại dữ liệu.' : status === 400 ? message ?? 'Dữ liệu gửi lên không hợp lệ.' : message ?? 'Không thể kết nối dịch vụ CLS.', status);
  }
  return new DiagnosticResultsApiError(error instanceof Error ? error.message : 'Không thể tải dữ liệu CLS.');
}
function unwrap<T>(response: { data: ApiSuccess<T> }) { return response.data.data; }
function mapImages<T extends { images?: DiagnosticOrder["images"] }>(item: T): T { return { ...item, images: (item.images ?? []).map((image, index) => ({ ...image, id: image.publicId ?? `${index}`, size: image.size ?? 0 })) }; }

export async function listDiagnosticResults(filters: DiagnosticFilters, signal?: AbortSignal) {
  try { const result = unwrap(await axiosClient.get<ApiSuccess<DiagnosticListResponse>>('/diagnostic-results', { params: filters, signal })); return { ...result, items: result.items.map(mapImages) }; } catch (error) { throw errorFrom(error); }
}
export async function getDiagnosticResult(careSessionId: string, orderRef: string, signal?: AbortSignal) {
  try { return mapImages(unwrap(await axiosClient.get<ApiSuccess<DiagnosticOrder>>(`/diagnostic-results/${careSessionId}/${encodeURIComponent(orderRef)}`, { signal }))); } catch (error) { throw errorFrom(error); }
}
export async function receiveDiagnosticResult(order: DiagnosticOrder & { expectedUpdatedAt: string }) {
  try { return unwrap(await axiosClient.post<ApiSuccess<DiagnosticOrder>>(`/diagnostic-results/${order.visit.careSessionId}/receive`, { orderRef: order.service, expectedUpdatedAt: order.expectedUpdatedAt })); } catch (error) { throw errorFrom(error); }
}
export async function uploadDiagnosticImage(order: DiagnosticOrder & { expectedUpdatedAt: string }, file: File) {
  const form = new FormData(); form.set('orderRef', order.service); form.set('expectedUpdatedAt', order.expectedUpdatedAt); form.set('file', file);
  try { const result = unwrap(await axiosClient.post<ApiSuccess<DiagnosticOrder>>(`/diagnostic-results/${order.visit.careSessionId}/images`, form)); return { ...result, images: result.images.map((image, index) => ({ ...image, id: image.publicId ?? `${index}`, size: image.size ?? 0 })) }; } catch (error) { throw errorFrom(error); }
}
export async function removeDiagnosticImage(order: DiagnosticOrder & { expectedUpdatedAt: string }, publicId: string) {
  try { const result = unwrap(await axiosClient.delete<ApiSuccess<DiagnosticOrder>>(`/diagnostic-results/${order.visit.careSessionId}/images`, { data: { orderRef: order.service, publicId, expectedUpdatedAt: order.expectedUpdatedAt } })); return { ...result, images: result.images.map((image, index) => ({ ...image, id: image.publicId ?? `${index}`, size: image.size ?? 0 })) }; } catch (error) { throw errorFrom(error); }
}
export async function completeDiagnosticResult(order: DiagnosticOrder & { expectedUpdatedAt: string }, conclusion: string) {
  try { return unwrap(await axiosClient.post<ApiSuccess<unknown>>(`/diagnostic-results/${order.visit.careSessionId}/complete`, { orderRef: order.service, result: conclusion, source: 'DIAGNOSTIC_RESULTS', expectedUpdatedAt: order.expectedUpdatedAt })); } catch (error) { throw errorFrom(error); }
}
