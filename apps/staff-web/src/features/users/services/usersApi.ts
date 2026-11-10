import { baseApi } from "@/lib/redux/baseApi";
import { downloadFile } from "@/lib/api/downloadFile";
import { getInitials } from "@/lib/utils";
import type { ApiResponse, CatalogPage } from "@/types/apiTypes";
import { PAGE_SIZE_OPTIONS, type UserTableFilterValues } from "../constants";
import type {
  ApiUser,
  CreateUserInput,
  ToggleUserStatusInput,
  UpdateUserInput,
  User,
  UserOptions,
} from "../types/userTypes";
function userTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(new Date(value))
    : "Chưa ghi nhận";
}
export function mapUser(user: ApiUser): User {
  return {
    id: user.id,
    name: user.fullName,
    email: user.email ?? "",
    phone: user.phone ?? "",
    role: user.role?.name ?? null,
    status: user.status,
    isCurrentUser: user.isCurrentUser,
    code: user.doctor?.doctorCode ?? user.patient?.patientCode ?? null,
    specialtyId: user.doctor?.specialty.id ?? null,
    specialtyName: user.doctor?.specialty.name ?? null,
    createdAt: userTime(user.createdAt),
    lastLogin: userTime(user.lastLoginAt),
    initials: getInitials(user.fullName),
    ...(user.patientProfile ? { patientProfile: user.patientProfile } : {}),
  };
}
export function userQueryParams(filters: UserTableFilterValues) {
  return {
    page:
      Number.isSafeInteger(filters.page) &&
      filters.page > 0 &&
      filters.page <= Math.floor(Number.MAX_SAFE_INTEGER / 100)
        ? filters.page
        : 1,
    limit: PAGE_SIZE_OPTIONS.find((size) => size === filters.pageSize) ?? 7,
    ...(["ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"].includes(filters.role)
      ? { role: filters.role }
      : {}),
    ...(["ACTIVE", "PENDING_VERIFICATION", "LOCKED"].includes(filters.status)
      ? { status: filters.status }
      : {}),
    ...(filters.specialtyId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      filters.specialtyId,
    )
      ? { specialtyId: filters.specialtyId }
      : {}),
    ...(filters.search.trim()
      ? { search: filters.search.trim().slice(0, 200) }
      : {}),
  };
}
export function exportUsers(filters: UserTableFilterValues): Promise<void> {
  const { role, status, specialtyId, search } = userQueryParams(filters);
  return downloadFile(
    "/admin/users/export",
    { role, status, specialtyId, search },
    "users.csv",
  );
}

const changedTags = [
  { type: "USERS" as const, id: "LIST" },
  "DOCTORS" as const,
  "SPECIALTIES" as const,
];
export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<CatalogPage<User>, UserTableFilterValues>({
      query: (filters) => ({
        url: "/admin/users",
        params: userQueryParams(filters),
      }),
      transformResponse: (response: CatalogPage<ApiUser>) => ({
        ...response,
        data: response.data.map(mapUser),
      }),
      providesTags: (result) => [
        { type: "USERS", id: "LIST" },
        ...(result?.data ?? []).map(({ id }) => ({
          type: "USERS" as const,
          id,
        })),
      ],
    }),
    getUser: build.query<User, string>({
      query: (id) => ({ url: "/admin/users/" + encodeURIComponent(id) }),
      transformResponse: (response: ApiResponse<ApiUser>) =>
        mapUser(response.data),
      providesTags: (_result, _error, id) => [{ type: "USERS", id }],
    }),
    getUserOptions: build.query<UserOptions, void>({
      query: () => ({ url: "/admin/users/filter-options" }),
      transformResponse: (response: ApiResponse<UserOptions>) => response.data,
      providesTags: ["SPECIALTIES"],
    }),
    previewStaffEmail: build.query<{ email: string }, string>({
      query: (fullName) => ({
        url: "/admin/users/email-preview",
        params: { fullName },
      }),
      transformResponse: (response: ApiResponse<{ email: string }>) =>
        response.data,
    }),
    createUser: build.mutation<User, CreateUserInput>({
      query: (data) => ({ url: "/admin/users", method: "POST", data }),
      transformResponse: (response: ApiResponse<ApiUser>) =>
        mapUser(response.data),
      invalidatesTags: (_result, error) => (error ? [] : changedTags),
    }),
    updateUser: build.mutation<User, UpdateUserInput>({
      query: ({ id, ...data }) => ({
        url: "/admin/users/" + encodeURIComponent(id),
        method: "PATCH",
        data,
      }),
      transformResponse: (response: ApiResponse<ApiUser>) =>
        mapUser(response.data),
      invalidatesTags: (_result, error, { id }) =>
        error ? [] : [...changedTags, { type: "USERS", id }],
    }),
    updateUserStatus: build.mutation<User, ToggleUserStatusInput>({
      query: ({ userId, targetStatus, reason }) => ({
        url: "/admin/users/" + encodeURIComponent(userId) + "/status",
        method: "PATCH",
        data: { status: targetStatus, reason },
      }),
      transformResponse: (response: ApiResponse<ApiUser>) =>
        mapUser(response.data),
      invalidatesTags: (_result, error, { userId }) =>
        error ? [] : [...changedTags, { type: "USERS", id: userId }],
    }),
  }),
});
export const {
  useGetUsersQuery,
  useGetUserQuery,
  useGetUserOptionsQuery,
  usePreviewStaffEmailQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
} = usersApi;
