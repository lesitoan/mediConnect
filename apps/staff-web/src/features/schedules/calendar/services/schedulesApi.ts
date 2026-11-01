import { baseApi } from "@/lib/redux/baseApi";
import type {
  CreateScheduleInput,
  ScheduleDateRange,
  WorkScheduleMatrixResponse,
  WorkSchedule,
} from "../types/scheduleTypes";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: { totalPages: number };
}

export interface CreateLeaveRequestInput {
  requestType: "PLANNED_LEAVE" | "URGENT_ABSENCE";
  startsAt: string;
  endsAt: string;
  reason: string;
}

export interface LeaveImpactPreview {
  affectedSessions: Array<{
    id: string;
    appointmentCode: string;
    startsAt: string;
    endsAt: string;
    status: string;
    specialtyName: string;
  }>;
}

export const schedulesApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["SCHEDULES", "LEAVE_REQUESTS"] })
  .injectEndpoints({
    endpoints: (build) => ({
      getSchedules: build.query<WorkScheduleMatrixResponse, ScheduleDateRange>({
        query: (range) => ({
          url: "/admin/work-schedules/matrix",
          params: {
            from: range.startDate,
            to: range.endDate,
          },
        }),
        transformResponse: (response: ApiResponse<WorkScheduleMatrixResponse>) =>
          response.data,
        providesTags: [{ type: "SCHEDULES", id: "LIST" }],
      }),
      getMyScheduleMatrix: build.query<
        WorkScheduleMatrixResponse,
        ScheduleDateRange
      >({
        query: (range) => ({
          url: "/me/work-schedules/matrix",
          params: {
            from: range.startDate,
            to: range.endDate,
          },
        }),
        transformResponse: (
          response: ApiResponse<WorkScheduleMatrixResponse>,
        ) =>
          response.data,
        providesTags: [{ type: "SCHEDULES", id: "LIST" }],
      }),
      getMyLeaveImpact: build.query<
        LeaveImpactPreview,
        { startsAt: string; endsAt: string }
      >({
        query: (range) => ({
          url: "/me/leave-requests/impact",
          params: range,
        }),
        transformResponse: (response: ApiResponse<LeaveImpactPreview>) =>
          response.data,
      }),
      createMyLeaveRequest: build.mutation<
        { id: string; status: string },
        CreateLeaveRequestInput
      >({
        query: (data) => ({
          url: "/me/leave-requests",
          method: "POST",
          data,
        }),
        transformResponse: (
          response: ApiResponse<{ id: string; status: string }>,
        ) => response.data,
        invalidatesTags: (_result, error) =>
          error
            ? []
            : [
                { type: "LEAVE_REQUESTS", id: "LIST" },
                { type: "SCHEDULES", id: "LIST" },
              ],
      }),
      createSchedule: build.mutation<WorkSchedule, CreateScheduleInput>({
        query: (data) => ({
          url: "/admin/work-schedules",
          method: "POST",
          data,
        }),
        transformResponse: (response: ApiResponse<WorkSchedule>) =>
          response.data,
        invalidatesTags: (_result, error) =>
          error ? [] : [{ type: "SCHEDULES", id: "LIST" }],
      }),
      publishSchedules: build.mutation<{ publishedCount: number }, string[]>({
        async queryFn(ids, _queryApi, _extraOptions, baseQuery) {
          for (const id of ids) {
            const result = await baseQuery({
              url: `/admin/work-schedules/${encodeURIComponent(id)}/publish`,
              method: "POST",
            });
            if (result.error) return { error: result.error };
          }
          return { data: { publishedCount: ids.length } };
        },
        invalidatesTags: () => [{ type: "SCHEDULES", id: "LIST" }],
      }),
    }),
  });

export const {
  useGetSchedulesQuery,
  useGetMyScheduleMatrixQuery,
  useGetMyLeaveImpactQuery,
  useCreateMyLeaveRequestMutation,
  useCreateScheduleMutation,
  usePublishSchedulesMutation,
} = schedulesApi;
