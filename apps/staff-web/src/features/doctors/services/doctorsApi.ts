import { baseApi } from "@/lib/redux/baseApi";
import type {
  DoctorDataTab,
  DoctorTabRecord,
} from "../types/doctorDetailTypes";
import type { ApiResponse, CatalogPage, CatalogQuery } from "@/types/apiTypes";
import type {
  CreateDoctorInput,
  CreateDoctorPauseInput,
  Doctor,
  DoctorWriteInput,
  PauseRecord,
} from "../types/doctorTypes";

export const doctorsApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["SCHEDULES"] })
  .injectEndpoints({
    endpoints: (build) => ({
      getDoctorTab: build.query<
        CatalogPage<DoctorTabRecord>,
        { id: string; tab: DoctorDataTab; page: number; limit: number }
      >({
        query: ({ id, ...params }) => ({
          url: `/admin/doctors/${encodeURIComponent(id)}`,
          params,
        }),
        providesTags: (_result, _error, { id }) => [
          { type: "DOCTORS", id },
          { type: "SCHEDULES", id: "LIST" },
        ],
      }),
      getDoctors: build.query<
        CatalogPage<Doctor>,
        CatalogQuery & { specialtyId?: string }
      >({
        query: (params) => ({ url: "/admin/doctors", params }),
        providesTags: (result) => [
          { type: "DOCTORS", id: "LIST" },
          ...(result?.data ?? []).map(({ id }) => ({
            type: "DOCTORS" as const,
            id,
          })),
        ],
      }),
      getDoctor: build.query<Doctor, string>({
        query: (id) => ({ url: `/admin/doctors/${encodeURIComponent(id)}` }),
        transformResponse: (response: ApiResponse<Doctor>) => response.data,
        providesTags: (_result, _error, id) => [{ type: "DOCTORS", id }],
      }),
      createDoctor: build.mutation<Doctor, CreateDoctorInput>({
        query: (data) => ({ url: "/admin/doctors", method: "POST", data }),
        transformResponse: (response: ApiResponse<Doctor>) => response.data,
        invalidatesTags: (_result, error) =>
          error
            ? []
            : [
                { type: "DOCTORS", id: "LIST" },
                { type: "USERS", id: "LIST" },
              ],
      }),
      updateDoctor: build.mutation<
        Doctor,
        { id: string; changes: Partial<DoctorWriteInput> }
      >({
        query: ({ id, changes }) => ({
          url: `/admin/doctors/${encodeURIComponent(id)}`,
          method: "PATCH",
          data: changes,
        }),
        transformResponse: (response: ApiResponse<Doctor>) => response.data,
        invalidatesTags: (_result, error, { id }) =>
          error
            ? []
            : [
                { type: "DOCTORS", id },
                { type: "USERS", id: "LIST" },
              ],
      }),
      uploadDoctorAvatar: build.mutation<string, File>({
        query: (file) => {
          const data = new FormData();
          data.set("file", file);
          return { url: "/admin/doctors/avatar", method: "POST", data };
        },
        transformResponse: (response: ApiResponse<{ avatarUrl: string }>) =>
          response.data.avatarUrl,
      }),
      getDoctorPauses: build.query<PauseRecord[], string>({
        query: (id) => ({
          url: `/admin/doctors/${encodeURIComponent(id)}/pauses`,
        }),
        transformResponse: (response: ApiResponse<PauseRecord[]>) =>
          response.data,
        providesTags: (_result, _error, id) => [
          { type: "DOCTORS", id: `PAUSES:${id}` },
        ],
      }),
      createDoctorPause: build.mutation<PauseRecord, CreateDoctorPauseInput>({
        query: ({ doctorId, ...data }) => ({
          url: `/admin/doctors/${encodeURIComponent(doctorId)}/pauses`,
          method: "POST",
          data,
        }),
        transformResponse: (response: ApiResponse<PauseRecord>) =>
          response.data,
        invalidatesTags: (_result, error, { doctorId }) =>
          error
            ? []
            : [
                { type: "DOCTORS", id: doctorId },
                { type: "DOCTORS", id: `PAUSES:${doctorId}` },
                { type: "SCHEDULES", id: "LIST" },
              ],
      }),
      cancelDoctorPause: build.mutation<
        PauseRecord,
        { doctorId: string; pauseId: string }
      >({
        query: ({ doctorId, pauseId }) => ({
          url: `/admin/doctors/${encodeURIComponent(doctorId)}/pauses/${encodeURIComponent(pauseId)}`,
          method: "DELETE",
        }),
        transformResponse: (response: ApiResponse<PauseRecord>) =>
          response.data,
        invalidatesTags: (_result, error, { doctorId }) =>
          error
            ? []
            : [
                { type: "DOCTORS", id: doctorId },
                { type: "DOCTORS", id: `PAUSES:${doctorId}` },
                { type: "SCHEDULES", id: "LIST" },
              ],
      }),
    }),
  });
export const {
  useGetDoctorTabQuery,
  useGetDoctorsQuery,
  useGetDoctorQuery,
  useCreateDoctorMutation,
  useUpdateDoctorMutation,
  useUploadDoctorAvatarMutation,
  useGetDoctorPausesQuery,
  useCreateDoctorPauseMutation,
  useCancelDoctorPauseMutation,
} = doctorsApi;
