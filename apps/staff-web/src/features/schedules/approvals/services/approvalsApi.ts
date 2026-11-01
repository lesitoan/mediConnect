import { baseApi } from "@/lib/redux/baseApi";
import type {
  ApprovalDecisionInput,
  ApprovalRequest,
  ApprovalRequestDetails,
  LeaveImpact,
} from "../types/approvalTypes";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface LeaveRequestResponse {
  id: string;
  status: "PENDING" | "RESOLVING" | "APPROVED" | "REJECTED" | "CANCELLED";
  requestType: "PLANNED_LEAVE" | "URGENT_ABSENCE" | "ABSENT";
  priority: "NORMAL" | "URGENT";
  reason: string;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
  rejectionReason: string | null;
  staffUser: {
    fullName: string;
    role: { name: string };
  } | null;
  doctor: {
    id: string;
    doctorCode: string;
    specialty: { name: string };
    user: { fullName: string };
  } | null;
  exceptions: ApprovalRequestDetails["exceptions"];
}

interface ReplacementAvailabilityResponse {
  total: number;
  items: Array<{
    id: string;
    startsAt: string;
    endsAt: string;
    doctor: { id: string; fullName: string };
  }>;
}

function formatClinicDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatClinicTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function mapLeaveRequest(request: LeaveRequestResponse): ApprovalRequestDetails {
  const isUrgent = request.priority === "URGENT";
  const date = formatClinicDate(request.startsAt);
  const endDate = request.endsAt
    ? formatClinicDate(request.endsAt)
    : date;
  const shiftTime = request.endsAt
    ? `${formatClinicTime(request.startsAt)}–${formatClinicTime(request.endsAt)}`
    : "Cả ngày";
  const type =
    request.requestType === "URGENT_ABSENCE"
      ? "EMERGENCY_LEAVE"
      : "PLANNED_LEAVE";
  const typeName =
    type === "EMERGENCY_LEAVE" ? "Báo vắng đột xuất" : "Nghỉ có kế hoạch";
  const doctorName =
    request.doctor?.user.fullName ??
    request.staffUser?.fullName ??
    "Nhân viên";
  const doctorCode =
    request.doctor?.doctorCode ?? request.id.slice(0, 8).toUpperCase();

  return {
    id: request.id,
    requestCode: `LVR-${new Date(request.createdAt).getFullYear()}-${request.id
      .slice(0, 8)
      .toUpperCase()}`,
    doctorId: request.doctor?.id ?? request.id,
    doctorCode,
    doctorName,
    specialtyName: request.doctor?.specialty.name ?? "Lễ tân",
    type,
    typeName,
    reason: request.reason,
    date: date === endDate ? date : `${date}–${endDate}`,
    shiftTime,
    status: request.status,
    isUrgent,
    notes: request.rejectionReason ?? undefined,
    createdAt: request.createdAt,
    exceptions: request.exceptions ?? [],
  };
}

export const approvalsApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["SCHEDULE_APPROVALS", "SCHEDULES"] })
  .injectEndpoints({
    endpoints: (build) => ({
      getApprovalRequests: build.query<ApprovalRequest[], void>({
        query: () => ({ url: "/admin/leave-requests" }),
        transformResponse: (response: ApiResponse<LeaveRequestResponse[]>) =>
          response.data.map(mapLeaveRequest),
        providesTags: [{ type: "SCHEDULE_APPROVALS", id: "LIST" }],
      }),
      getApprovalRequest: build.query<ApprovalRequestDetails, string>({
        query: (id) => ({
          url: `/admin/leave-requests/${encodeURIComponent(id)}`,
        }),
        transformResponse: (response: ApiResponse<LeaveRequestResponse>) =>
          mapLeaveRequest(response.data),
        providesTags: (_result, _error, id) => [
          { type: "SCHEDULE_APPROVALS", id },
        ],
      }),
      getLeaveImpact: build.query<LeaveImpact, string>({
        query: (id) => ({
          url: `/admin/leave-requests/${encodeURIComponent(id)}/impact`,
        }),
        transformResponse: (response: ApiResponse<LeaveImpact>) =>
          response.data,
        providesTags: (_result, _error, id) => [
          { type: "SCHEDULE_APPROVALS", id: `IMPACT-${id}` },
        ],
      }),
      getReplacementSlots: build.query<
        ReplacementAvailabilityResponse["items"],
        { doctorId: string; date: string }
      >({
        query: ({ doctorId, date }) => ({
          url: "/schedules/ai-availability",
          params: {
            doctorId,
            dateFrom: date,
            dateTo: date,
            page: 1,
            limit: 100,
          },
        }),
        transformResponse: (
          response: ApiResponse<ReplacementAvailabilityResponse>,
        ) => response.data.items,
      }),
      approveScheduleRequest: build.mutation<
        { message: string; status: ApprovalRequest["status"] },
        ApprovalDecisionInput
      >({
        query: ({ id, replacementDoctorId }) => ({
          url: `/admin/leave-requests/${encodeURIComponent(id)}/approve`,
          method: "POST",
          data: replacementDoctorId ? { replacementDoctorId } : {},
        }),
        transformResponse: (
          response: ApiResponse<{ status: ApprovalRequest["status"] }>,
        ) => ({
          status: response.data.status,
          message:
            response.data.status === "RESOLVING"
              ? "Yêu cầu chuyển sang xử lý lịch hẹn bị ảnh hưởng."
              : "Đã duyệt yêu cầu nghỉ.",
        }),
        invalidatesTags: (_result, error, input) =>
          error
            ? []
            : [
                { type: "SCHEDULE_APPROVALS", id: "LIST" },
                { type: "SCHEDULE_APPROVALS", id: input.id },
                { type: "SCHEDULES", id: "LIST" },
              ],
      }),
      rejectScheduleRequest: build.mutation<
        { message: string },
        ApprovalDecisionInput
      >({
        query: ({ id, notes }) => ({
          url: `/admin/leave-requests/${encodeURIComponent(id)}/reject`,
          method: "POST",
          data: {
            rejectionReason: notes?.trim() || "Không được phê duyệt",
          },
        }),
        transformResponse: () => ({ message: "Đã từ chối yêu cầu nghỉ." }),
        invalidatesTags: (_result, error, input) =>
          error
            ? []
            : [
                { type: "SCHEDULE_APPROVALS", id: "LIST" },
                { type: "SCHEDULE_APPROVALS", id: input.id },
                { type: "SCHEDULES", id: "LIST" },
              ],
      }),
      proposeException: build.mutation<
        { message: string },
        {
          exceptionId: string;
          resolution: "REASSIGNED" | "RESCHEDULED" | "CANCELLED";
          toDoctorId?: string;
          toSlotId?: string;
          reason?: string;
        }
      >({
        query: ({ exceptionId, ...data }) => ({
          url: `/admin/schedule-exceptions/${encodeURIComponent(exceptionId)}/propose`,
          method: "POST",
          data,
        }),
        transformResponse: () => ({
          message: "Đã gửi phương án để bệnh nhân xác nhận.",
        }),
        invalidatesTags: (_result, error) =>
          error
            ? []
            : ["SCHEDULE_APPROVALS", { type: "SCHEDULES", id: "LIST" }],
      }),
    }),
  });

export const {
  useGetApprovalRequestsQuery,
  useGetApprovalRequestQuery,
  useGetLeaveImpactQuery,
  useGetReplacementSlotsQuery,
  useApproveScheduleRequestMutation,
  useRejectScheduleRequestMutation,
  useProposeExceptionMutation,
} = approvalsApi;
