import { baseApi } from "@/lib/redux/baseApi";
import type { ApiResponse } from "@/types/apiTypes";
import type {
  ApiLoginPayload,
  CurrentUser,
  ForgotPasswordInput,
  LoginInput,
  LoginResponseData,
  OtpChallengeData,
  ResetPasswordInput,
  VerifyOtpInput,
  VerifyOtpResponseData,
} from "../types/authTypes";

export function formatAuthError(
  error: unknown,
  fallback = "Có lỗi xảy ra, vui lòng thử lại",
): string {
  if (!error) return fallback;
  if (typeof error === "string") return error;

  if (typeof error === "object" && error !== null) {
    const err = error as {
      status?: number | string;
      message?: string;
      data?: { message?: string | string[] };
    };

    const serverMsg = Array.isArray(err.data?.message)
      ? err.data.message.filter((value) => typeof value === "string").join("; ")
      : typeof err.data?.message === "string"
        ? err.data.message
        : "";

    const message =
      serverMsg || (typeof err.message === "string" ? err.message : "");

    if (
      message.includes("Invalid credentials") ||
      message.includes("Wrong password")
    ) {
      return "Thông tin tài khoản hoặc mật khẩu không chính xác.";
    }
    if (message.includes("LOCKED")) {
      return "Tài khoản đang bị tạm khóa. Vui lòng liên hệ quản trị viên.";
    }
    if (message.includes("PENDING_VERIFICATION")) {
      return "Tài khoản chưa được kích hoạt xác thực.";
    }
    if (message.includes("Invalid OTP") || message.includes("Incorrect OTP")) {
      return "Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại.";
    }
    if (/OTP/i.test(message) && /expired/i.test(message)) {
      return "Mã xác thực OTP đã hết hạn. Vui lòng gửi lại mã mới.";
    }
    if (err.status === 401 && /refresh|session|token/i.test(message)) {
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    }
    if (
      message.includes("Too many attempts") ||
      message.includes("Rate limit")
    ) {
      return "Bạn đã thử sai quá số lần quy định. Vui lòng thử lại sau ít phút.";
    }
    if (err.status === "FETCH_ERROR" || message.includes("Network")) {
      return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
    }
    if (message) return message;
  }

  return fallback;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponseData, LoginInput>({
      query: ({ identifier, password }) => {
        const trimmed = identifier.trim();
        const payload: ApiLoginPayload = {
          ...(trimmed.includes("@") ? { email: trimmed } : { phone: trimmed }),
          password,
          clientType: "WEB",
        };
        return {
          url: "/authentication/login",
          method: "POST",
          data: payload,
        };
      },
      transformResponse: (response: ApiResponse<LoginResponseData>) =>
        response.data,
    }),

    logout: build.mutation<{ message: string }, void>({
      query: () => ({
        url: "/authentication/logout",
        method: "POST",
      }),
      transformResponse: (response: ApiResponse<{ message: string }>) =>
        response.data || { message: "Đăng xuất thành công" },
      async onQueryStarted(_input, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(baseApi.util.resetApiState());
        } catch {
          // Keep the current session visible when logout fails.
        }
      },
    }),

    forgotPassword: build.mutation<OtpChallengeData, ForgotPasswordInput>({
      query: ({ identifier }) => {
        const trimmed = identifier.trim();
        const body = trimmed.includes("@")
          ? { email: trimmed }
          : { phone: trimmed };
        return {
          url: "/authentication/forgot_password",
          method: "POST",
          data: body,
        };
      },
      transformResponse: (response: ApiResponse<OtpChallengeData>) =>
        response.data,
    }),

    resendOtp: build.mutation<OtpChallengeData, ForgotPasswordInput>({
      query: ({ identifier }) => {
        const trimmed = identifier.trim();
        const body = {
          ...(trimmed.includes("@") ? { email: trimmed } : { phone: trimmed }),
          purpose: "RESET_PASSWORD",
        };
        return {
          url: "/authentication/send_otp",
          method: "POST",
          data: body,
        };
      },
      transformResponse: (response: ApiResponse<OtpChallengeData>) =>
        response.data,
    }),

    verifyOtp: build.mutation<VerifyOtpResponseData, VerifyOtpInput>({
      query: (data) => ({
        url: "/authentication/verify",
        method: "POST",
        data,
      }),
      transformResponse: (response: ApiResponse<VerifyOtpResponseData>) =>
        response.data,
    }),

    resetPassword: build.mutation<{ message: string }, ResetPasswordInput>({
      query: (data) => ({
        url: "/authentication/reset_password",
        method: "POST",
        data,
      }),
      transformResponse: (response: ApiResponse<{ message: string }>) =>
        response.data || { message: "Đổi mật khẩu thành công" },
    }),

    getAuthUser: build.query<CurrentUser, void>({
      query: () => ({ url: "/me" }),
      transformResponse: (response: ApiResponse<CurrentUser>) => response.data,
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResendOtpMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
  useGetAuthUserQuery,
  useLazyGetAuthUserQuery,
} = authApi;
