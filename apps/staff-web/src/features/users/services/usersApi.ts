import { baseApi } from "@/lib/redux/baseApi";
import { INITIAL_USERS } from "../constants";
import type {
  CreateUserInput,
  ToggleUserStatusInput,
  UpdateUserInput,
  User,
} from "../types/userTypes";

const mockSuccess = () => ({
  data: { message: "Thao tác thành công (mock)." },
});

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<User[], void>({
      queryFn: () => ({
        data: INITIAL_USERS.map((user) => ({ ...user })),
      }),
      providesTags: (users) => [
        { type: "USERS", id: "LIST" },
        ...(users ?? []).map(({ id }) => ({ type: "USERS" as const, id })),
      ],
    }),
    getUser: build.query<User, string>({
      queryFn: (id) => {
        const user = INITIAL_USERS.find((user) => user.id === id);

        return user
          ? { data: { ...user } }
          : {
              error: {
                status: 404,
                message: "Không tìm thấy người dùng.",
                data: null,
              },
            };
      },
      providesTags: (_result, _error, id) => [{ type: "USERS", id }],
    }),
    createUser: build.mutation<{ message: string }, CreateUserInput>({
      queryFn: mockSuccess,
      invalidatesTags: (_result, error) =>
        error ? [] : [{ type: "USERS", id: "LIST" }],
    }),
    updateUser: build.mutation<{ message: string }, UpdateUserInput>({
      queryFn: mockSuccess,
      invalidatesTags: (_result, error, { id }) =>
        error ? [] : [{ type: "USERS", id }],
    }),
    deleteUser: build.mutation<{message: string}, string>({
      queryFn: mockSuccess,
      invalidatesTags: (_result, error, id) =>
        error ? [] : [{ type: "USERS", id }],
    }),
    updateUserStatus: build.mutation<{message: string}, ToggleUserStatusInput>({
      queryFn: mockSuccess,
      invalidatesTags: (_result, error, { userId }) =>
        error ? [] : [{ type: "USERS", id: userId }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUpdateUserStatusMutation,
} = usersApi;
