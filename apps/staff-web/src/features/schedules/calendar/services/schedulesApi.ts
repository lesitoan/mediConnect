import { baseApi } from "@/lib/redux/baseApi";
import { INITIAL_DOCTOR_SCHEDULES } from "../constants";
import { getSchedulesInDateRange } from "./schedulesService";
import type {
  CreateScheduleInput,
  ResolveConflictInput,
  ScheduleCalendarData,
  ScheduleDateRange,
  ScheduleShift,
  UpdateScheduleInput,
} from "../types/scheduleTypes";

const mockSuccess = () => ({
  data: { message: "Thao tác thành công (mock)." },
});

export const schedulesApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["SCHEDULES"] })
  .injectEndpoints({
    endpoints: (build) => ({
      getSchedules: build.query<ScheduleCalendarData, ScheduleDateRange>({
        queryFn: (range) => ({
          data: getSchedulesInDateRange(
            structuredClone(INITIAL_DOCTOR_SCHEDULES),
            range,
          ),
        }),
        providesTags: [{ type: "SCHEDULES", id: "LIST" }],
      }),
      getSchedule: build.query<ScheduleShift, string>({
        queryFn: (id) => {
          const shift = INITIAL_DOCTOR_SCHEDULES.flatMap((doctor) =>
            Object.values(doctor.shifts),
          ).find((shift) => shift?.id === id);

          return shift
            ? { data: { ...shift } }
            : {
                error: {
                  status: 404,
                  message: "Không tìm thấy ca trực.",
                  data: null,
                },
              };
        },
        providesTags: (_result, _error, id) => [{ type: "SCHEDULES", id }],
      }),
      createSchedule: build.mutation<{ message: string }, CreateScheduleInput>({
        queryFn: mockSuccess,
        invalidatesTags: (_result, error) => (error ? [] : ["SCHEDULES"]),
      }),
      updateSchedule: build.mutation<{ message: string }, UpdateScheduleInput>({
        queryFn: mockSuccess,
        invalidatesTags: (_result, error) => (error ? [] : ["SCHEDULES"]),
      }),
      deleteSchedule: build.mutation<{ message: string }, string>({
        queryFn: mockSuccess,
        invalidatesTags: (_result, error) => (error ? [] : ["SCHEDULES"]),
      }),
      publishSchedules: build.mutation<{ message: string }, ScheduleDateRange>({
        queryFn: mockSuccess,
        invalidatesTags: (_result, error) => (error ? [] : ["SCHEDULES"]),
      }),
      resolveScheduleConflict: build.mutation<
        { message: string },
        ResolveConflictInput
      >({
        queryFn: mockSuccess,
        invalidatesTags: (_result, error) => (error ? [] : ["SCHEDULES"]),
      }),
    }),
  });

export const {
  useGetSchedulesQuery,
  useGetScheduleQuery,
  useCreateScheduleMutation,
  useUpdateScheduleMutation,
  useDeleteScheduleMutation,
  usePublishSchedulesMutation,
  useResolveScheduleConflictMutation,
} = schedulesApi;
