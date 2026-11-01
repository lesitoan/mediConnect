type ApiResponse<T> = {
  success: boolean;
  data: T;
};

type ApiErrorResponse = {
  message?: string | string[];
};

type CurrentUser = {
  name: string;
  role: string;
};

export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function getAuthErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  if (
    error instanceof AuthApiError &&
    error.status === 503 &&
    error.message === "ZALO OTP delivery is not configured"
  ) {
    return "Hệ thống chưa cấu hình gửi mã OTP qua Zalo. Vui lòng liên hệ quản trị viên.";
  }
  if (error.message === "Unable to send OTP. Try again later") {
    return "Không thể gửi mã OTP lúc này. Vui lòng thử lại sau.";
  }
  return error.message;
}

export type OtpChallenge = {
  challengeId: string;
  channel: "EMAIL" | "ZALO";
  expiresIn: number;
  retryAfter: number;
  developmentCode?: string;
};

type OtpVerification = {
  purpose: "REGISTER" | "RESET_PASSWORD";
  activated?: boolean;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(
      `Không thể kết nối API tại ${API_URL}. Hãy khởi động backend và kiểm tra cấu hình.`,
    );
  }

  const payload = (await response.json()) as ApiResponse<T> & ApiErrorResponse;
  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(", ")
      : payload.message || "Không thể kết nối đến hệ thống";
    throw new AuthApiError(message, response.status);
  }
  return payload.data;
}

export async function registerPatient(input: {
  name: string;
  phone: string;
  password: string;
}) {
  return request<OtpChallenge>("/authentication/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function verifyRegistrationOtp(challengeId: string, otp: string) {
  const result = await request<OtpVerification>("/authentication/verify", {
    method: "POST",
    body: JSON.stringify({ challengeId, otp }),
  });
  if (result.purpose !== "REGISTER" || result.activated !== true) {
    throw new Error("Không thể kích hoạt tài khoản.");
  }
}

export async function resendRegistrationOtp(phone: string) {
  return request<OtpChallenge>("/authentication/send_otp", {
    method: "POST",
    body: JSON.stringify({ phone, purpose: "REGISTER" }),
  });
}

export async function authenticatePatient(
  identifier: string,
  password: string,
) {
  const contact = identifier.trim();
  await request("/authentication/login", {
    method: "POST",
    body: JSON.stringify({
      ...(contact.includes("@") ? { email: contact } : { phone: contact }),
      password,
      clientType: "WEB",
    }),
  });

  const user = await request<CurrentUser>("/me");
  if (user.role !== "PATIENT") {
    throw new Error("Tài khoản này không có quyền truy cập cổng bệnh nhân.");
  }
  return user;
}
