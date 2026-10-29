import { axiosClient } from "@/lib/api/axiosClient";
import { addCalendarDays, getVietnamDate } from "@/lib/dateUtils";
import type { AuditLogEntry, AuditLogFilterValues, AuditLogPreset, AuditLogResult } from "../types/auditLogTypes";

interface ApiLog {
  id: string; occurredAt: string; actorType: "USER" | "SYSTEM" | "ANONYMOUS";
  actorUserId: string | null; actorDisplayName: string | null; actorRole: string | null;
  actionCode: string; actionLabel?: string; module: string; targetType: string; targetId: string | null;
  result: AuditLogResult; reason?: string | null;
  beforeSnapshot?: Record<string, unknown> | null; afterSnapshot?: Record<string, unknown> | null;
}
export interface FilterOption { value: string; label: string }
const ROLE_LABELS: Record<string, string> = { ADMIN: "Quản trị viên", DOCTOR: "Bác sĩ", RECEPTIONIST: "Lễ tân", PATIENT: "Bệnh nhân" };

export function dateRangeForPreset(preset: AuditLogPreset, now = Date.now()) {
  const today = getVietnamDate(now);
  return { startDate: preset === "TODAY" ? today : preset === "7_DAYS" ? addCalendarDays(today, -6) : preset === "30_DAYS" ? addCalendarDays(today, -29) : `${today.slice(0, 7)}-01`, endDate: today };
}

export function resolveAuditDateRange(filters: AuditLogFilterValues, now = Date.now()): Pick<AuditLogFilterValues, 'preset' | 'startDate' | 'endDate'> {
  const preset = filters.preset || (filters.startDate || filters.endDate ? "" : "7_DAYS");
  return { preset, ...(preset ? dateRangeForPreset(preset, now) : { startDate: filters.startDate, endDate: filters.endDate }) };
}

export function mapAuditLog(item: ApiLog): AuditLogEntry {
  const time = new Date(item.occurredAt);
  const date = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" }).format(time);
  const hour = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(time);
  const before = item.beforeSnapshot ?? {};
  const after = item.afterSnapshot ?? {};
  const value = (input: unknown) => input === undefined ? "Chưa ghi nhận" : input === null ? "Không có" : typeof input === "object" ? JSON.stringify(input) : String(input);
  const dataChanges = [...new Set([...Object.keys(before), ...Object.keys(after)])].map((field) => ({ field, before: value(before[field]), after: value(after[field]) }));
  return {
    id: item.id, date, time: hour, fullTimestamp: `${date} · ${hour} (UTC+7)`,
    executor: item.actorDisplayName || (item.actorType === "SYSTEM" ? "Hệ thống" : item.actorType === "ANONYMOUS" ? "Khách vãng lai" : "Không ghi nhận"),
    executorRole: item.actorRole ? ROLE_LABELS[item.actorRole] ?? item.actorRole : "Không ghi nhận",
    action: item.actionLabel ?? item.actionCode, actionCode: item.actionCode,
    target: item.targetId ?? item.targetType, result: item.result,
    resultLabel: item.result === "SUCCESS" ? "Thành công" : item.result === "FAILED" ? "Thất bại" : "Hoàn tất",
    reason: item.reason ?? undefined, dataChanges,
  };
}

function filtersToParams(filters: AuditLogFilterValues) {
  return {
    startDate: filters.startDate, endDate: filters.endDate,
    ...(filters.executor.startsWith("USER:") ? { actorUserId: filters.executor.slice(5) } : filters.executor !== "ALL" ? { actorType: filters.executor } : {}),
    ...(filters.actionType !== "ALL" ? { actionCode: filters.actionType } : {}),
    ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
  };
}

export async function getAuditLogs(filters: AuditLogFilterValues, signal?: AbortSignal) {
  const response = await axiosClient.get<{ data: ApiLog[]; pagination: { totalItems: number } }>("/admin/audit-logs", { params: { ...filtersToParams(filters), page: filters.page, limit: filters.pageSize }, signal });
  return { items: response.data.data.map(mapAuditLog), totalItems: response.data.pagination.totalItems };
}

export async function getAuditLog(id: string, signal?: AbortSignal) {
  const response = await axiosClient.get<{ data: ApiLog }>(`/admin/audit-logs/${encodeURIComponent(id)}`, { signal });
  return mapAuditLog(response.data.data);
}

export async function getAuditOptions(startDate: string, endDate: string, signal?: AbortSignal) {
  const response = await axiosClient.get<{ data: { actors: FilterOption[]; actions: FilterOption[] } }>("/admin/audit-logs/filter-options", { params: { startDate, endDate }, signal });
  return response.data.data;
}

export async function exportAuditLogs(filters: AuditLogFilterValues) {
  const response = await axiosClient.post<Blob>("/admin/audit-logs/export", filtersToParams(filters), { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  try {
    const link = document.createElement("a");
    link.href = url; link.download = "audit-logs.csv"; link.click();
  } finally { window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
