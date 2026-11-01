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

export const schedulesApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["SCHEDULES"] })
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
  useCreateScheduleMutation,
  usePublishSchedulesMutation,
} = schedulesApi;
