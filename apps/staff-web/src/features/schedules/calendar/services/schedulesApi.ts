import { baseApi } from "@/lib/redux/baseApi";
import type {
  AdminDoctor,
  CreateScheduleInput,
  ScheduleDateRange,
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
      getSchedules: build.query<WorkSchedule[], ScheduleDateRange>({
        query: (range) => ({
          url: "/admin/work-schedules",
          params: {
            from: range.startDate,
            to: range.endDate,
            staffType: "DOCTOR",
          },
        }),
        transformResponse: (response: ApiResponse<WorkSchedule[]>) =>
          response.data,
        providesTags: [{ type: "SCHEDULES", id: "LIST" }],
      }),
      getAdminDoctors: build.query<AdminDoctor[], void>({
        async queryFn(_arg, _queryApi, _extraOptions, baseQuery) {
          const doctors: AdminDoctor[] = [];
          let page = 1;

          while (true) {
            const result = await baseQuery({
              url: "/admin/doctors",
              params: { page, limit: 100 },
            });
            if (result.error) return { error: result.error };

            const response = result.data;
            if (
              typeof response !== "object" ||
              response === null ||
              !("success" in response) ||
              response.success !== true ||
              !("data" in response) ||
              !Array.isArray(response.data) ||
              !("pagination" in response) ||
              typeof response.pagination !== "object" ||
              response.pagination === null ||
              !("totalPages" in response.pagination) ||
              typeof response.pagination.totalPages !== "number" ||
              !Number.isInteger(response.pagination.totalPages) ||
              response.pagination.totalPages < 0
            ) {
              return {
                error: {
                  status: "FETCH_ERROR",
                  message: "Invalid doctor list response",
                  data: result.data,
                },
              };
            }
            const pageDoctors = response.data as AdminDoctor[];
            doctors.push(...pageDoctors);

            const totalPages = response.pagination.totalPages;
            if (page >= totalPages) {
              return { data: doctors };
            }
            page += 1;
          }
        },
        providesTags: [{ type: "SCHEDULES", id: "DOCTORS" }],
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
  useGetAdminDoctorsQuery,
  useCreateScheduleMutation,
  usePublishSchedulesMutation,
} = schedulesApi;
