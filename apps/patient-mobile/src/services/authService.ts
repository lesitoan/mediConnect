import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'http://10.0.2.2:4000/api/v1';

type ApiResponse<T> = { success: boolean; data: T };
type ApiErrorResponse = { message?: string | string[] };
type CurrentUser = { name: string; role: string };

export class AuthApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export type OtpChallenge = {
  challengeId: string;
  channel: 'EMAIL' | 'PHONE';
  expiresIn: number;
  retryAfter: number;
};

type OtpVerification = {
  purpose: 'REGISTER' | 'RESET_PASSWORD';
  activated?: boolean;
  resetToken?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    const token = await AsyncStorage.getItem('@MediConnect:token');
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(`Không thể kết nối API tại ${API_URL}.`);
  }

  const payload = (await response.json()) as ApiResponse<T> & ApiErrorResponse;
  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(', ')
      : payload.message || 'Không thể kết nối đến hệ thống';
    throw new AuthApiError(message, response.status);
  }
  return payload.data;
}

export async function authenticatePatient(identifier: string, password: string) {
  const contact = identifier.trim();
  const loginData = await request<any>('/authentication/login', {
    method: 'POST',
    body: JSON.stringify({
      ...(contact.includes('@') ? { email: contact } : { phone: contact }),
      password,
      clientType: 'MOBILE',
    }),
  });

  if (loginData?.accessToken) {
    await AsyncStorage.setItem('@MediConnect:token', loginData.accessToken);
  }

  const user = await request<CurrentUser>('/me');
  if (user.role !== 'PATIENT') {
    throw new Error('Tài khoản này không có quyền truy cập.');
  }
  return user;
}

export async function logoutPatient() {
  await AsyncStorage.removeItem('@MediConnect:token');
}

export async function registerPatient(input: { name: string; phone: string; password: string }) {
  return request<OtpChallenge>('/authentication/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function verifyRegistrationOtp(challengeId: string, otp: string) {
  const result = await request<OtpVerification>('/authentication/verify', {
    method: 'POST',
    body: JSON.stringify({ challengeId, otp }),
  });
  if (result.purpose !== 'REGISTER' || result.activated !== true) {
    throw new Error('Không thể kích hoạt tài khoản.');
  }
}

export async function forgotPassword(identifier: string) {
  const contact = identifier.trim();
  return request<OtpChallenge>('/authentication/forgot_password', {
    method: 'POST',
    body: JSON.stringify(
      contact.includes('@') ? { email: contact } : { phone: contact }
    ),
  });
}

export async function verifyResetOtp(challengeId: string, otp: string) {
  const result = await request<OtpVerification>('/authentication/verify', {
    method: 'POST',
    body: JSON.stringify({ challengeId, otp }),
  });
  if (result.purpose !== 'RESET_PASSWORD' || !result.resetToken) {
    throw new Error('Mã xác thực không hợp lệ.');
  }
  return result.resetToken;
}

export async function resetPassword(resetToken: string, password: string) {
  return request<{ message: string }>('/authentication/reset_password', {
    method: 'POST',
    body: JSON.stringify({ resetToken, password }),
  });
}

export async function changePassword(currentPassword: string, password: string) {
  return request<{ message: string }>('/authentication/change_password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, password }),
  });
}