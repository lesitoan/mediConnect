import {
  AuthApiError,
  type OtpChallenge,
} from "./authService";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api/v1";

type ApiResponse<T> = {
  data: T;
  message?: string | string[];
};

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(", ")
      : payload.message || "Không thể kết nối đến hệ thống";
    throw new AuthApiError(message, response.status);
  }

  return payload.data;
}

export async function requestPasswordReset(identifier: string) {
  const contact = identifier.trim();
  return request<OtpChallenge>("/authentication/forgot_password", {
    method: "POST",
    body: JSON.stringify(
      contact.includes("@") ? { email: contact } : { phone: contact },
    ),
  });
}

export async function verifyPasswordResetOtp(
  challengeId: string,
  otp: string,
) {
  const result = await request<{
    purpose: "REGISTER" | "RESET_PASSWORD";
    resetToken?: string;
  }>("/authentication/verify", {
    method: "POST",
    body: JSON.stringify({ challengeId, otp }),
  });

  if (result.purpose !== "RESET_PASSWORD" || !result.resetToken) {
    throw new Error("Không thể xác thực mã OTP đặt lại mật khẩu.");
  }
  return result.resetToken;
}

export async function resetPassword(resetToken: string, password: string) {
  return request<{ message: string }>("/authentication/reset_password", {
    method: "POST",
    body: JSON.stringify({ resetToken, password }),
  });
}
