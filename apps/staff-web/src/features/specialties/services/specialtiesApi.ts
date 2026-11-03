import { baseApi } from "@/lib/redux/baseApi";
import type { ApiResponse, CatalogPage, CatalogQuery } from "@/types/apiTypes";
import type {
  CreateSpecialtyInput,
  SpecialtyRecord,
} from "../types/specialtyTypes";

export const specialtiesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSpecialties: build.query<CatalogPage<SpecialtyRecord>, CatalogQuery>({
      query: (params) => ({ url: "/admin/specialties", params }),
      providesTags: (result) => [
        { type: "SPECIALTIES", id: "LIST" },
        ...(result?.data ?? []).map(({ id }) => ({
          type: "SPECIALTIES" as const,
          id,
        })),
      ],
    }),
    getSpecialtyOptions: build.query<SpecialtyRecord[], void>({
      query: () => ({ url: "/admin/doctors/specialties" }),
      transformResponse: (response: ApiResponse<SpecialtyRecord[]>) =>
        response.data,
      providesTags: [{ type: "SPECIALTIES", id: "OPTIONS" }],
    }),
    getSpecialty: build.query<SpecialtyRecord, string>({
      query: (id) => ({ url: `/admin/specialties/${encodeURIComponent(id)}` }),
      transformResponse: (response: ApiResponse<SpecialtyRecord>) =>
        response.data,
      providesTags: (_result, _error, id) => [{ type: "SPECIALTIES", id }],
    }),
    createSpecialty: build.mutation<SpecialtyRecord, CreateSpecialtyInput>({
      query: (data) => ({ url: "/admin/specialties", method: "POST", data }),
      transformResponse: (response: ApiResponse<SpecialtyRecord>) =>
        response.data,
      invalidatesTags: (_result, error) => (error ? [] : ["SPECIALTIES"]),
    }),
    updateSpecialty: build.mutation<
      SpecialtyRecord,
      { id: string; changes: Partial<CreateSpecialtyInput> }
    >({
      query: ({ id, changes }) => ({
        url: `/admin/specialties/${encodeURIComponent(id)}`,
        method: "PATCH",
        data: changes,
      }),
      transformResponse: (response: ApiResponse<SpecialtyRecord>) =>
        response.data,
      invalidatesTags: (_result, error) =>
        error ? [] : ["SPECIALTIES", "DOCTORS", { type: "USERS", id: "LIST" }],
    }),
    updateSpecialtyStatus: build.mutation<
      SpecialtyRecord,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/admin/specialties/${encodeURIComponent(id)}/status`,
        method: "PATCH",
        data: { isActive },
      }),
      transformResponse: (response: ApiResponse<SpecialtyRecord>) =>
        response.data,
      invalidatesTags: (_result, error) =>
        error ? [] : ["SPECIALTIES", "DOCTORS"],
    }),
  }),
});
export const {
  useGetSpecialtiesQuery,
  useGetSpecialtyOptionsQuery,
  useGetSpecialtyQuery,
  useCreateSpecialtyMutation,
  useUpdateSpecialtyMutation,
  useUpdateSpecialtyStatusMutation,
} = specialtiesApi;
