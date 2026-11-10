import { baseApi } from "@/lib/redux/baseApi";
import { downloadFile } from "@/lib/api/downloadFile";
import { addCalendarDays, getVietnamDate } from "@/lib/dateUtils";
import { getUserRoleLabel } from "@/features/users/utils";
import type { UserRole } from "@/features/users/types/userTypes";
import type { ApiResponse, CatalogPage } from "@/types/apiTypes";
import type {
  AuditLogEntry,
  AuditLogFilterValues,
  AuditLogPreset,
  AuditLogResult,
} from "../types/auditLogTypes";

interface ApiLog {
  id: string;
  occurredAt: string;
  actorType: "USER" | "SYSTEM" | "ANONYMOUS";
  actorUserId: string | null;
  actorDisplayName: string | null;
  actorRole: UserRole | null;
  actionCode: string;
  actionLabel?: string;
  module: string;
  targetType: string;
  targetId: string | null;
  result: AuditLogResult;
  reason?: string | null;
  beforeSnapshot?: Record<string, unknown> | null;
  afterSnapshot?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  sessionId?: string | null;
  method?: string | null;
  path?: string | null;
}

export interface FilterOption {
  value: string;
  label: string;
}

export function dateRangeForPreset(preset: AuditLogPreset, now = Date.now()) {
  const today = getVietnamDate(now);
  return {
    startDate:
      preset === "TODAY"
        ? today
        : preset === "7_DAYS"
          ? addCalendarDays(today, -6)
          : preset === "30_DAYS"
            ? addCalendarDays(today, -29)
            : `${today.slice(0, 7)}-01`,
    endDate: today,
  };
}

export function resolveAuditDateRange(
  filters: AuditLogFilterValues,
  now = Date.now(),
): Pick<AuditLogFilterValues, "preset" | "startDate" | "endDate"> {
  const preset =
    filters.preset || (filters.startDate || filters.endDate ? "" : "7_DAYS");
  return {
    preset,
    ...(preset
      ? dateRangeForPreset(preset, now)
      : { startDate: filters.startDate, endDate: filters.endDate }),
  };
}

export function mapAuditLog(item: ApiLog): AuditLogEntry {
  const time = new Date(item.occurredAt);
  const date = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(time);
  const hour = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(time);
  const before = item.beforeSnapshot ?? {};
  const after = item.afterSnapshot ?? {};
  const value = (input: unknown) =>
    input === undefined
      ? "Chưa ghi nhận"
      : input === null
        ? "Không có"
        : typeof input === "object"
          ? JSON.stringify(input)
          : String(input);
  const dataChanges = [
    ...new Set([...Object.keys(before), ...Object.keys(after)]),
  ].map((field) => ({
    field,
    before: value(before[field]),
    after: value(after[field]),
  }));
  const technicalInfo = {
    ipAddress: item.ipAddress ?? null,
    userAgent: item.userAgent ?? null,
    requestId: item.requestId ?? null,
    sessionId:
      item.sessionId ??
      (item.actionCode === "ACCOUNT_LOGIN" &&
      typeof after.sessionId === "string"
        ? after.sessionId
        : null),
    endpoint: item.path
      ? [item.method, item.path].filter(Boolean).join(" ")
      : null,
  };
  return {
    id: item.id,
    date,
    time: hour,
    fullTimestamp: `${date} · ${hour} (UTC+7)`,
    executor:
      item.actorDisplayName ||
      (item.actorType === "SYSTEM"
        ? "Hệ thống"
        : item.actorType === "ANONYMOUS"
          ? "Khách vãng lai"
          : "Không ghi nhận"),
    executorRole: item.actorRole
      ? getUserRoleLabel(item.actorRole)
      : "Không ghi nhận",
    action: item.actionLabel ?? item.actionCode,
    actionCode: item.actionCode,
    target: item.targetId ?? item.targetType,
    result: item.result,
    resultLabel:
      item.result === "SUCCESS"
        ? "Thành công"
        : item.result === "FAILED"
          ? "Thất bại"
          : "Hoàn tất",
    reason: item.reason ?? undefined,
    dataChanges,
    technicalInfo: Object.values(technicalInfo).some(Boolean)
      ? technicalInfo
      : undefined,
  };
}

function filtersToParams(filters: AuditLogFilterValues) {
  return {
    startDate: filters.startDate,
    endDate: filters.endDate,
    ...(filters.executor.startsWith("USER:")
      ? { actorUserId: filters.executor.slice(5) }
      : filters.executor !== "ALL"
        ? { actorType: filters.executor }
        : {}),
    ...(filters.actionType !== "ALL" ? { actionCode: filters.actionType } : {}),
    ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
  };
}

export const auditLogsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAuditLogs: build.query<
      { items: AuditLogEntry[]; totalItems: number },
      AuditLogFilterValues
    >({
      query: (filters) => ({
        url: "/admin/audit-logs",
        params: {
          ...filtersToParams(filters),
          page: filters.page,
          limit: filters.pageSize,
        },
      }),
      transformResponse: (response: CatalogPage<ApiLog>) => ({
        items: response.data.map(mapAuditLog),
        totalItems: response.pagination.totalItems,
      }),
      providesTags: ["AUDIT_LOGS"],
    }),
    getAuditLog: build.query<AuditLogEntry, string>({
      query: (id) => ({ url: "/admin/audit-logs/" + encodeURIComponent(id) }),
      transformResponse: (response: ApiResponse<ApiLog>) =>
        mapAuditLog(response.data),
    }),
    getAuditOptions: build.query<
      { actors: FilterOption[]; actions: FilterOption[] },
      { startDate: string; endDate: string }
    >({
      query: ({ startDate, endDate }) => ({
        url: "/admin/audit-logs/filter-options",
        params: { startDate, endDate },
      }),
      transformResponse: (
        response: ApiResponse<{
          actors: FilterOption[];
          actions: FilterOption[];
        }>,
      ) => response.data,
      providesTags: ["AUDIT_LOGS"],
    }),
  }),
});

export const {
  useGetAuditLogsQuery,
  useLazyGetAuditLogQuery,
  useGetAuditOptionsQuery,
} = auditLogsApi;

export function exportAuditLogs(filters: AuditLogFilterValues): Promise<void> {
  return downloadFile(
    "/admin/audit-logs/export",
    filtersToParams(filters),
    "audit-logs.csv",
  );
}
